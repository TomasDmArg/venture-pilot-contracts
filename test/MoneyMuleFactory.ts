import { expect } from "chai";
import { network } from "hardhat";

type MoneyMuleFactory = any;
type MoneyMuleRound = any;
type MockERC20 = any;
type Signer = any;

describe("MoneyMule Factory + Round System", function () {
    let factory: MoneyMuleFactory;
    let mockToken: MockERC20;
    let owner: Signer;
    let founder: Signer;
    let investor1: Signer;
    let investor2: Signer;
    let investor3: Signer;
    let juror1: Signer;
    let juror2: Signer;
    let juror3: Signer;
    let ethers: any;
    
    let TARGET_AMOUNT: any;
    let INVESTMENT_AMOUNT: any;
    const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
    const VERIFICATION_DELAY = 24 * 60 * 60; // 24 hours

    // Helper functions for time manipulation
    async function getLatestBlockTimestamp(): Promise<number> {
        const blockNumber = await ethers.provider.send("eth_blockNumber", []);
        const block = await ethers.provider.send("eth_getBlockByNumber", [blockNumber, false]);
        return parseInt(block.timestamp, 16);
    }

    async function increaseTime(seconds: number): Promise<void> {
        await ethers.provider.send("evm_increaseTime", [seconds]);
        await ethers.provider.send("evm_mine", []);
    }

    // Helper function to parse events from transaction receipt
    function parseEvent(receipt: any, contract: any, eventName: string): any {
        const logs = receipt.logs || [];
        for (const log of logs) {
            try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === eventName) {
                    return parsedLog;
                }
            } catch (error) {
                // Skip logs that can't be parsed
                continue;
            }
        }
        return null;
    }

    before(async function () {
        const networkConnection = await network.connect();
        ethers = networkConnection.ethers;
        
        TARGET_AMOUNT = ethers.parseEther("100");
        INVESTMENT_AMOUNT = ethers.parseEther("50");
    });

    beforeEach(async function () {
        [owner, founder, investor1, investor2, investor3, juror1, juror2, juror3] = await ethers.getSigners();
        
        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("10000"));
        
        // Deploy factory
        const MoneyMuleFactory = await ethers.getContractFactory("MoneyMuleFactory");
        factory = await MoneyMuleFactory.deploy();
        
        // Distribute tokens
        await mockToken.transfer(investor1.address, ethers.parseEther("200"));
        await mockToken.transfer(investor2.address, ethers.parseEther("200"));
        await mockToken.transfer(investor3.address, ethers.parseEther("200"));
        
        // Authorize jurors
        await factory.connect(owner).authorizeJuror(juror1.address);
        await factory.connect(owner).authorizeJuror(juror2.address);
        await factory.connect(owner).authorizeJuror(juror3.address);
    });

    describe("Factory Management", function () {
        it("Should deploy factory with correct initial state", async function () {
            expect(await factory.getNextRoundId()).to.equal(1);
            expect(await factory.getTotalRounds()).to.equal(0);
            expect(await factory.owner()).to.equal(owner.address);
        });

        it("Should authorize jurors correctly", async function () {
            const newJuror = investor1.address;
            
            await factory.connect(owner).authorizeJuror(newJuror);
            expect(await factory.isAuthorizedJuror(newJuror)).to.be.true;
            
            await expect(factory.connect(owner).authorizeJuror(newJuror))
                .to.be.revertedWith("Juror already authorized");
        });

        it("Should revoke juror authorization", async function () {
            expect(await factory.isAuthorizedJuror(juror1.address)).to.be.true;
            
            await factory.connect(owner).revokeJuror(juror1.address);
            expect(await factory.isAuthorizedJuror(juror1.address)).to.be.false;
        });

        it("Should fail when non-owner tries to manage jurors", async function () {
            await expect(factory.connect(founder).authorizeJuror(investor1.address))
                .to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
        });
    });

    describe("Round Creation", function () {
        it("Should create funding round successfully", async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400; // 1 day
            const milestone1Deadline = fundingDeadline + 86400; // 1 day after funding
            const milestone2Deadline = milestone1Deadline + 86400; // 1 day after milestone1
            
            const milestones = [
                {
                    description: "Development Phase",
                    fundingAmount: ethers.parseEther("40"),
                    deadline: milestone1Deadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                },
                {
                    description: "Testing Phase",
                    fundingAmount: ethers.parseEther("60"),
                    deadline: milestone2Deadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            
            expect(event).to.not.be.undefined;
            expect(event.args.roundId).to.equal(1);
            expect(event.args.founder).to.equal(founder.address);
            expect(event.args.token).to.equal(mockToken.target);
            expect(event.args.targetAmount).to.equal(TARGET_AMOUNT);

            // Verify factory state
            expect(await factory.getNextRoundId()).to.equal(2);
            expect(await factory.getTotalRounds()).to.equal(1);
            
            const founderRounds = await factory.getFounderRounds(founder.address);
            expect(founderRounds.length).to.equal(1);
            expect(founderRounds[0]).to.equal(1);
        });

        it("Should fail with invalid milestone data", async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            
            // Invalid: milestone deadline before funding deadline
            const milestones = [
                {
                    description: "Milestone 1",
                    fundingAmount: TARGET_AMOUNT,
                    deadline: fundingDeadline - 1000, // Before funding deadline
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            await expect(factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            )).to.be.revertedWith("Milestone deadline must be after funding deadline");
        });

        it("Should fail with unauthorized jury wallets", async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestoneDeadline = fundingDeadline + 86400;
            
            const milestones = [
                {
                    description: "Milestone 1",
                    fundingAmount: TARGET_AMOUNT,
                    deadline: milestoneDeadline,
                    juryWallets: [juror1.address, juror2.address, investor1.address] // investor1 not authorized
                }
            ];

            await expect(factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            )).to.be.revertedWith("Jury wallet not authorized");
        });
    });

    describe("Round Funding Phase", function () {
        let roundContract: MoneyMuleRound;
        let roundId: number;

        beforeEach(async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestoneDeadline = fundingDeadline + 86400;
            
            const milestones = [
                {
                    description: "Development",
                    fundingAmount: ethers.parseEther("40"),
                    deadline: milestoneDeadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                },
                {
                    description: "Testing",
                    fundingAmount: ethers.parseEther("60"),
                    deadline: milestoneDeadline + 86400,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            roundId = event.args.roundId;
            
            const roundAddress = await factory.getRoundContract(roundId);
            roundContract = await ethers.getContractAt("MoneyMuleRound", roundAddress);
        });

        it("Should whitelist investors correctly", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            
            expect(await roundContract.isWhitelisted(investor1.address)).to.be.true;
            expect(await roundContract.isWhitelisted(investor2.address)).to.be.false;
        });

        it("Should fail to whitelist founder as investor", async function () {
            await expect(roundContract.connect(founder).whitelistInvestor(founder.address))
                .to.be.revertedWith("Founder cannot be whitelisted as investor");
        });

        it("Should allow valid investments", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            
            // Approve tokens
            await mockToken.connect(investor1).approve(roundContract.target, INVESTMENT_AMOUNT);
            
            const tx = await roundContract.connect(investor1).invest(INVESTMENT_AMOUNT);
            
            const receipt = await tx.wait();
            const event = parseEvent(receipt, roundContract, "InvestmentMade");
            
            expect(event).to.not.be.undefined;
            expect(event.args.investor).to.equal(investor1.address);
            expect(event.args.amount).to.equal(INVESTMENT_AMOUNT);

            expect(await roundContract.getInvestmentAmount(investor1.address)).to.equal(INVESTMENT_AMOUNT);
            
            // Verify factory tracking
            const investorRounds = await factory.getInvestorRounds(investor1.address);
            expect(investorRounds.length).to.equal(1);
            expect(investorRounds[0]).to.equal(roundId);
        });

        it("Should move to execution phase when fully funded", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await roundContract.connect(founder).whitelistInvestor(investor2.address);
            
            await mockToken.connect(investor1).approve(roundContract.target, ethers.parseEther("60"));
            await mockToken.connect(investor2).approve(roundContract.target, ethers.parseEther("40"));
            
            await roundContract.connect(investor1).invest(ethers.parseEther("60"));
            
            // Round should still be in funding phase
            const roundInfo1 = await roundContract.getRoundInfo();
            expect(roundInfo1.currentPhase).to.equal(0); // Funding
            
            await roundContract.connect(investor2).invest(ethers.parseEther("40"));
            
            // Round should now be in execution phase
            const roundInfo2 = await roundContract.getRoundInfo();
            expect(roundInfo2.currentPhase).to.equal(1); // Execution
        });

        it("Should fail investments after funding deadline", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, INVESTMENT_AMOUNT);
            
            // Move past funding deadline
            await increaseTime(86401);
            
            await expect(roundContract.connect(investor1).invest(INVESTMENT_AMOUNT))
                .to.be.revertedWith("Funding deadline passed");
        });

        it("Should allow forced move to execution phase after partial funding", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, INVESTMENT_AMOUNT);
            await roundContract.connect(investor1).invest(INVESTMENT_AMOUNT);
            
            // Move past funding deadline
            await increaseTime(86401);
            
            await roundContract.moveToExecutionPhase();
            
            const roundInfo = await roundContract.getRoundInfo();
            expect(roundInfo.currentPhase).to.equal(1); // Execution
        });
    });

    describe("Jury Voting System", function () {
        let roundContract: MoneyMuleRound;
        let roundId: number;

        beforeEach(async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestoneDeadline = fundingDeadline + 86400;
            
            const milestones = [
                {
                    description: "Development",
                    fundingAmount: TARGET_AMOUNT,
                    deadline: milestoneDeadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            roundId = event.args.roundId;
            
            const roundAddress = await factory.getRoundContract(roundId);
            roundContract = await ethers.getContractAt("MoneyMuleRound", roundAddress);
            
            // Complete funding
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, TARGET_AMOUNT);
            await roundContract.connect(investor1).invest(TARGET_AMOUNT);
        });

        it("Should trigger milestone deadline correctly", async function () {
            // Move to milestone deadline
            await increaseTime(86401 + 86400); // Past funding + milestone deadline
            
            const tx = await roundContract.connect(investor2).triggerMilestoneDeadline(1);
            
            const receipt = await tx.wait();
            const event = parseEvent(receipt, roundContract, "MilestoneDeadlineTriggered");
            
            expect(event).to.not.be.undefined;
            expect(event.args.milestoneId).to.equal(1);
            expect(event.args.triggeredBy).to.equal(investor2.address);
            
            const milestone = await roundContract.getMilestone(1);
            expect(milestone.status).to.equal(1); // Active
        });

        it("Should fail to trigger deadline before time", async function () {
            await expect(roundContract.connect(investor1).triggerMilestoneDeadline(1))
                .to.be.revertedWith("Deadline not reached");
        });

        it("Should allow jury voting on active milestone", async function () {
            // Move to milestone deadline and trigger
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            
            // Juror votes
            const tx = await roundContract.connect(juror1).castJuryVote(1, true);
            
            const receipt = await tx.wait();
            const event = parseEvent(receipt, roundContract, "JuryVoteCast");
            
            expect(event).to.not.be.undefined;
            expect(event.args.milestoneId).to.equal(1);
            expect(event.args.juror).to.equal(juror1.address);
            expect(event.args.approve).to.equal(true);
            
            const milestone = await roundContract.getMilestone(1);
            expect(milestone.votesFor).to.equal(1);
            expect(milestone.votesAgainst).to.equal(0);
        });

        it("Should fail voting by non-authorized juror", async function () {
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            
            await expect(roundContract.connect(investor1).castJuryVote(1, true))
                .to.be.revertedWith("Not authorized juror for this milestone");
        });

        it("Should fail voting by founder", async function () {
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            
            await expect(roundContract.connect(founder).castJuryVote(1, true))
                .to.be.revertedWith("Not authorized juror for this milestone");
        });

        it("Should finalize voting when all jurors vote", async function () {
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            
            // All jurors vote in favor
            await roundContract.connect(juror1).castJuryVote(1, true);
            await roundContract.connect(juror2).castJuryVote(1, true);
            
            const tx = await roundContract.connect(juror3).castJuryVote(1, true);
            
            const receipt = await tx.wait();
            const event = parseEvent(receipt, roundContract, "MilestoneVotingFinalized");
            
            expect(event).to.not.be.undefined;
            // expect(event.args.roundId).to.equal(1);
            expect(event.args.milestoneId).to.equal(1);
            expect(event.args.result).to.equal(2); // Approved status
            
            const milestone = await roundContract.getMilestone(1);
            expect(milestone.status).to.equal(2); // Approved
        });

        it("Should reject milestone when majority votes against", async function () {
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            
            // Majority votes against
            await roundContract.connect(juror1).castJuryVote(1, false);
            await roundContract.connect(juror2).castJuryVote(1, false);
            await roundContract.connect(juror3).castJuryVote(1, true);
            
            const milestone = await roundContract.getMilestone(1);
            expect(milestone.status).to.equal(3); // Rejected
        });

        it("Should allow manual finalization after voting period", async function () {
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            
            // Only one juror votes
            await roundContract.connect(juror1).castJuryVote(1, true);
            
            // Move past voting period
            await increaseTime(VOTING_PERIOD + 1);
            
            await roundContract.connect(investor1).finalizeMilestoneVoting(1);
            
            const milestone = await roundContract.getMilestone(1);
            expect(milestone.status).to.equal(2); // Approved (1 > 0)
        });
    });

    describe("Milestone Completion and Fund Release", function () {
        let roundContract: MoneyMuleRound;

        beforeEach(async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestoneDeadline = fundingDeadline + 86400;
            
            const milestones = [
                {
                    description: "Development",
                    fundingAmount: TARGET_AMOUNT,
                    deadline: milestoneDeadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            const roundId = event.args.roundId;
            
            const roundAddress = await factory.getRoundContract(roundId);
            roundContract = await ethers.getContractAt("MoneyMuleRound", roundAddress);
            
            // Complete funding and voting
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, TARGET_AMOUNT);
            await roundContract.connect(investor1).invest(TARGET_AMOUNT);
            
            // Trigger voting and approve
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            await roundContract.connect(juror1).castJuryVote(1, true);
            await roundContract.connect(juror2).castJuryVote(1, true);
            await roundContract.connect(juror3).castJuryVote(1, true);
        });

        it("Should complete milestone after approval", async function () {
            const tx = await roundContract.connect(founder).completeMilestone(1);
            
            const receipt = await tx.wait();
            const event = parseEvent(receipt, roundContract, "MilestoneCompleted");
            
            expect(event).to.not.be.undefined;
            expect(event.args.milestoneId).to.equal(1);
            
            const milestone = await roundContract.getMilestone(1);
            expect(milestone.status).to.equal(4); // Completed
        });

        it("Should fail milestone completion if not approved", async function () {
            // Create new round with rejected milestone
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestoneDeadline = fundingDeadline + 86400;
            
            const milestones = [
                {
                    description: "Development",
                    fundingAmount: TARGET_AMOUNT,
                    deadline: milestoneDeadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            const roundId = event.args.roundId;
            
            const roundAddress = await factory.getRoundContract(roundId);
            const newRoundContract = await ethers.getContractAt("MoneyMuleRound", roundAddress);
            
            // Setup with rejection
            await newRoundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(newRoundContract.target, TARGET_AMOUNT);
            await newRoundContract.connect(investor1).invest(TARGET_AMOUNT);
            
            await increaseTime(86401 + 86400);
            await newRoundContract.connect(investor1).triggerMilestoneDeadline(1);
            await newRoundContract.connect(juror1).castJuryVote(1, false);
            await newRoundContract.connect(juror2).castJuryVote(1, false);
            await newRoundContract.connect(juror3).castJuryVote(1, true);
            
            await expect(newRoundContract.connect(founder).completeMilestone(1))
                .to.be.revertedWith("Milestone not approved");
        });

        it("Should release funds after verification delay", async function () {
            await roundContract.connect(founder).completeMilestone(1);
            
            // Try to release immediately (should fail)
            await expect(roundContract.connect(founder).releaseFunds(1))
                .to.be.revertedWith("Verification delay not met");
            
            // Wait for verification delay
            await increaseTime(VERIFICATION_DELAY + 1);
            
            const initialBalance = await mockToken.balanceOf(founder.address);
            
            const tx = await roundContract.connect(founder).releaseFunds(1);
            
            const receipt = await tx.wait();
            const event = parseEvent(receipt, roundContract, "FundsReleased");
            
            expect(event).to.not.be.undefined;
            expect(event.args.milestoneId).to.equal(1);
            expect(event.args.amount).to.equal(TARGET_AMOUNT);
                
            const finalBalance = await mockToken.balanceOf(founder.address);
            expect(finalBalance - initialBalance).to.equal(TARGET_AMOUNT);
        });
    });

    describe("Investment Withdrawal", function () {
        let roundContract: MoneyMuleRound;

        beforeEach(async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestoneDeadline = fundingDeadline + 86400;
            
            const milestones = [
                {
                    description: "Development",
                    fundingAmount: TARGET_AMOUNT,
                    deadline: milestoneDeadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            const roundId = event.args.roundId;
            
            const roundAddress = await factory.getRoundContract(roundId);
            roundContract = await ethers.getContractAt("MoneyMuleRound", roundAddress);
        });

        it("Should allow withdrawal after funding deadline failure", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, INVESTMENT_AMOUNT);
            await roundContract.connect(investor1).invest(INVESTMENT_AMOUNT);
            
            // Move past funding deadline
            await increaseTime(86401);
            
            const initialBalance = await mockToken.balanceOf(investor1.address);
            
            await roundContract.connect(investor1).withdrawInvestment(0);
            
            const finalBalance = await mockToken.balanceOf(investor1.address);
            expect(finalBalance - initialBalance).to.equal(INVESTMENT_AMOUNT);
        });

        it("Should allow withdrawal after round cancellation", async function () {
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, INVESTMENT_AMOUNT);
            await roundContract.connect(investor1).invest(INVESTMENT_AMOUNT);
            
            await roundContract.connect(founder).cancelRound();
            
            const initialBalance = await mockToken.balanceOf(investor1.address);
            
            await roundContract.connect(investor1).withdrawInvestment(0);
            
            const finalBalance = await mockToken.balanceOf(investor1.address);
            expect(finalBalance - initialBalance).to.equal(INVESTMENT_AMOUNT);
        });

        it("Should calculate proportional withdrawal correctly", async function () {
            // Partial funding scenario
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await roundContract.connect(founder).whitelistInvestor(investor2.address);
            
            await mockToken.connect(investor1).approve(roundContract.target, ethers.parseEther("60"));
            await mockToken.connect(investor2).approve(roundContract.target, ethers.parseEther("20"));
            
            await roundContract.connect(investor1).invest(ethers.parseEther("60"));
            await roundContract.connect(investor2).invest(ethers.parseEther("20"));
            
            // Move past funding deadline and enter execution
            await increaseTime(86401);
            await roundContract.moveToExecutionPhase();
            
            // Complete milestone process and release partial funds
            await increaseTime(86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            await roundContract.connect(juror1).castJuryVote(1, true);
            await roundContract.connect(juror2).castJuryVote(1, true);
            await roundContract.connect(juror3).castJuryVote(1, true);
            
            await roundContract.connect(founder).completeMilestone(1);
            await increaseTime(VERIFICATION_DELAY + 1);
            await roundContract.connect(founder).releaseFunds(1);
            
            // Cancel round to allow withdrawal
            await roundContract.connect(founder).cancelRound();
            
            // Check withdrawable amount (should be 0 since all funds were released)
            const withdrawable = await roundContract.getWithdrawableAmount(investor1.address);
            expect(withdrawable).to.equal(0);
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete round lifecycle", async function () {
            const fundingDeadline = (await getLatestBlockTimestamp()) + 86400;
            const milestone1Deadline = fundingDeadline + 86400;
            const milestone2Deadline = milestone1Deadline + 86400;
            
            const milestones = [
                {
                    description: "Development",
                    fundingAmount: ethers.parseEther("40"),
                    deadline: milestone1Deadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                },
                {
                    description: "Testing",
                    fundingAmount: ethers.parseEther("60"),
                    deadline: milestone2Deadline,
                    juryWallets: [juror1.address, juror2.address, juror3.address]
                }
            ];

            // Create round
            const tx = await factory.connect(founder).createFundingRound(
                mockToken.target,
                TARGET_AMOUNT,
                fundingDeadline,
                milestones
            );

            const receipt = await tx.wait();
            const event = parseEvent(receipt, factory, "RoundCreated");
            const roundId = event.args.roundId;
            
            const roundAddress = await factory.getRoundContract(roundId);
            const roundContract = await ethers.getContractAt("MoneyMuleRound", roundAddress);
            
            // Complete funding
            await roundContract.connect(founder).whitelistInvestor(investor1.address);
            await mockToken.connect(investor1).approve(roundContract.target, TARGET_AMOUNT);
            await roundContract.connect(investor1).invest(TARGET_AMOUNT);
            
            // Complete first milestone
            await increaseTime(86401 + 86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(1);
            await roundContract.connect(juror1).castJuryVote(1, true);
            await roundContract.connect(juror2).castJuryVote(1, true);
            await roundContract.connect(juror3).castJuryVote(1, true);
            
            await roundContract.connect(founder).completeMilestone(1);
            await increaseTime(VERIFICATION_DELAY + 1);
            
            const initialBalance = await mockToken.balanceOf(founder.address);
            await roundContract.connect(founder).releaseFunds(1);
            const midBalance = await mockToken.balanceOf(founder.address);
            
            expect(midBalance - initialBalance).to.equal(ethers.parseEther("40"));
            
            // Complete second milestone
            await increaseTime(86400);
            await roundContract.connect(investor1).triggerMilestoneDeadline(2);
            await roundContract.connect(juror1).castJuryVote(2, true);
            await roundContract.connect(juror2).castJuryVote(2, true);
            await roundContract.connect(juror3).castJuryVote(2, true);
            
            await roundContract.connect(founder).completeMilestone(2);
            await increaseTime(VERIFICATION_DELAY + 1);
            await roundContract.connect(founder).releaseFunds(2);
            
            const finalBalance = await mockToken.balanceOf(founder.address);
            expect(finalBalance - initialBalance).to.equal(TARGET_AMOUNT);
        });
    });
}); 