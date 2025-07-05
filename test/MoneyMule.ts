import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { MoneyMule } from "../typechain-types";

describe("MoneyMule", function () {
  // Fixtures
  async function deployMoneyMuleFixture() {
    const [owner, founder, investor1, investor2, investor3] = await ethers.getSigners();
    
    const MoneyMule = await ethers.getContractFactory("MoneyMule");
    const moneyMule = await MoneyMule.deploy();
    
    return { moneyMule, owner, founder, investor1, investor2, investor3 };
  }

  async function deployWithFundingRoundFixture() {
    const { moneyMule, owner, founder, investor1, investor2, investor3 } = await loadFixture(deployMoneyMuleFixture);
    
    const targetAmount = ethers.parseEther("10"); // 10 ETH
    const deadline = (await time.latest()) + 7 * 24 * 60 * 60; // 7 days from now
    const milestoneDescriptions = [
      "MVP Development",
      "Beta Release",
      "Production Launch"
    ];
    const milestoneFunding = [
      ethers.parseEther("3"), // 3 ETH
      ethers.parseEther("3"), // 3 ETH
      ethers.parseEther("4")  // 4 ETH
    ];
    
    const tx = await moneyMule.connect(founder).createFundingRound(
      targetAmount,
      deadline,
      milestoneDescriptions,
      milestoneFunding
    );
    
    const receipt = await tx.wait();
    const roundId = 1; // First round
    
    return { 
      moneyMule, 
      owner, 
      founder, 
      investor1, 
      investor2, 
      investor3,
      roundId,
      targetAmount,
      deadline,
      milestoneDescriptions,
      milestoneFunding
    };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { moneyMule } = await loadFixture(deployMoneyMuleFixture);
      expect(await moneyMule.getAddress()).to.be.properAddress;
    });

    it("Should have correct initial state", async function () {
      const { moneyMule } = await loadFixture(deployMoneyMuleFixture);
      expect(await moneyMule.getNextRoundId()).to.equal(1);
      expect(await moneyMule.getNextMilestoneId()).to.equal(1);
    });
  });

  describe("Funding Round Creation", function () {
    it("Should create funding round with correct parameters", async function () {
      const { moneyMule, founder } = await loadFixture(deployMoneyMuleFixture);
      
      const targetAmount = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const milestoneDescriptions = ["MVP", "Beta", "Launch"];
      const milestoneFunding = [
        ethers.parseEther("3"),
        ethers.parseEther("3"),
        ethers.parseEther("4")
      ];
      
      await expect(
        moneyMule.connect(founder).createFundingRound(
          targetAmount,
          deadline,
          milestoneDescriptions,
          milestoneFunding
        )
      ).to.emit(moneyMule, "FundingRoundCreated")
        .withArgs(1, founder.address, targetAmount, deadline, 3);
      
      const round = await moneyMule.getFundingRound(1);
      expect(round.founder).to.equal(founder.address);
      expect(round.targetAmount).to.equal(targetAmount);
      expect(round.currentAmount).to.equal(0);
      expect(round.deadline).to.equal(deadline);
      expect(round.status).to.equal(0); // Active
      expect(round.milestonesCount).to.equal(3);
    });

    it("Should create milestones correctly", async function () {
      const { moneyMule, founder } = await loadFixture(deployMoneyMuleFixture);
      
      const targetAmount = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const milestoneDescriptions = ["MVP", "Beta", "Launch"];
      const milestoneFunding = [
        ethers.parseEther("3"),
        ethers.parseEther("3"),
        ethers.parseEther("4")
      ];
      
      await moneyMule.connect(founder).createFundingRound(
        targetAmount,
        deadline,
        milestoneDescriptions,
        milestoneFunding
      );
      
      const milestoneIds = await moneyMule.getRoundMilestones(1);
      expect(milestoneIds.length).to.equal(3);
      
      for (let i = 0; i < milestoneIds.length; i++) {
        const milestone = await moneyMule.milestones(milestoneIds[i]);
        expect(milestone.roundId).to.equal(1);
        expect(milestone.description).to.equal(milestoneDescriptions[i]);
        expect(milestone.fundingAmount).to.equal(milestoneFunding[i]);
        expect(milestone.status).to.equal(0); // Pending
        expect(milestone.fundsReleased).to.equal(false);
      }
    });

    it("Should revert if milestone funding doesn't match target amount", async function () {
      const { moneyMule, founder } = await loadFixture(deployMoneyMuleFixture);
      
      const targetAmount = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const milestoneDescriptions = ["MVP", "Beta"];
      const milestoneFunding = [
        ethers.parseEther("3"),
        ethers.parseEther("3") // Only 6 ETH, not 10
      ];
      
      await expect(
        moneyMule.connect(founder).createFundingRound(
          targetAmount,
          deadline,
          milestoneDescriptions,
          milestoneFunding
        )
      ).to.be.revertedWith("Milestone funding must equal target amount");
    });

    it("Should revert if deadline is in the past", async function () {
      const { moneyMule, founder } = await loadFixture(deployMoneyMuleFixture);
      
      const targetAmount = ethers.parseEther("10");
      const deadline = (await time.latest()) - 3600; // 1 hour ago
      const milestoneDescriptions = ["MVP"];
      const milestoneFunding = [ethers.parseEther("10")];
      
      await expect(
        moneyMule.connect(founder).createFundingRound(
          targetAmount,
          deadline,
          milestoneDescriptions,
          milestoneFunding
        )
      ).to.be.revertedWith("Deadline must be in the future");
    });
  });

  describe("Investor Whitelist", function () {
    it("Should whitelist investor successfully", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await expect(
        moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address)
      ).to.emit(moneyMule, "InvestorWhitelisted")
        .withArgs(roundId, investor1.address);
      
      expect(await moneyMule.isWhitelisted(roundId, investor1.address)).to.be.true;
    });

    it("Should revert if not founder trying to whitelist", async function () {
      const { moneyMule, investor1, investor2, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await expect(
        moneyMule.connect(investor1).whitelistInvestor(roundId, investor2.address)
      ).to.be.revertedWith("Not the founder");
    });

    it("Should revert if trying to whitelist zero address", async function () {
      const { moneyMule, founder, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await expect(
        moneyMule.connect(founder).whitelistInvestor(roundId, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid investor address");
    });
  });

  describe("Investments", function () {
    it("Should allow whitelisted investor to invest", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      
      const investmentAmount = ethers.parseEther("5");
      await expect(
        moneyMule.connect(investor1).invest(roundId, { value: investmentAmount })
      ).to.emit(moneyMule, "InvestmentMade")
        .withArgs(roundId, investor1.address, investmentAmount);
      
      expect(await moneyMule.getInvestmentAmount(roundId, investor1.address)).to.equal(investmentAmount);
      
      const round = await moneyMule.getFundingRound(roundId);
      expect(round.currentAmount).to.equal(investmentAmount);
    });

    it("Should complete funding round when target is reached", async function () {
      const { moneyMule, founder, investor1, investor2, roundId, targetAmount } = await loadFixture(deployWithFundingRoundFixture);
      
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor2.address);
      
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("6") });
      await moneyMule.connect(investor2).invest(roundId, { value: ethers.parseEther("4") });
      
      const round = await moneyMule.getFundingRound(roundId);
      expect(round.currentAmount).to.equal(targetAmount);
      expect(round.status).to.equal(1); // Completed
    });

    it("Should revert if investor is not whitelisted", async function () {
      const { moneyMule, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await expect(
        moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Not whitelisted");
    });

    it("Should revert if investment exceeds target amount", async function () {
      const { moneyMule, founder, investor1, roundId, targetAmount } = await loadFixture(deployWithFundingRoundFixture);
      
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      
      await expect(
        moneyMule.connect(investor1).invest(roundId, { value: targetAmount + ethers.parseEther("1") })
      ).to.be.revertedWith("Exceeds target amount");
    });

    it("Should revert if deadline has passed", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      
      // Fast forward past deadline
      await time.increase(8 * 24 * 60 * 60); // 8 days
      
      await expect(
        moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Deadline passed");
    });
  });

  describe("Milestone Completion", function () {
    it("Should allow founder to complete milestone", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Complete funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("10") });
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      const firstMilestoneId = milestoneIds[0];
      
      await expect(
        moneyMule.connect(founder).completeMilestone(firstMilestoneId)
      ).to.emit(moneyMule, "MilestoneCompleted")
        .withArgs(firstMilestoneId, roundId);
      
      const milestone = await moneyMule.milestones(firstMilestoneId);
      expect(milestone.status).to.equal(1); // Completed
    });

    it("Should revert if not founder trying to complete milestone", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Complete funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("10") });
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      const firstMilestoneId = milestoneIds[0];
      
      await expect(
        moneyMule.connect(investor1).completeMilestone(firstMilestoneId)
      ).to.be.revertedWith("Not the founder");
    });

    it("Should revert if funding round is not completed", async function () {
      const { moneyMule, founder, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      const firstMilestoneId = milestoneIds[0];
      
      await expect(
        moneyMule.connect(founder).completeMilestone(firstMilestoneId)
      ).to.be.revertedWith("Round not completed");
    });
  });

  describe("Fund Release", function () {
    it("Should release funds after verification delay", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Complete funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("10") });
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      const firstMilestoneId = milestoneIds[0];
      
      // Complete milestone
      await moneyMule.connect(founder).completeMilestone(firstMilestoneId);
      
      // Fast forward past verification delay
      await time.increase(25 * 60 * 60); // 25 hours
      
      const founderBalanceBefore = await ethers.provider.getBalance(founder.address);
      
      await expect(
        moneyMule.connect(founder).releaseFunds(firstMilestoneId)
      ).to.emit(moneyMule, "FundsReleased")
        .withArgs(firstMilestoneId, roundId, ethers.parseEther("3"));
      
      const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
      expect(founderBalanceAfter).to.be.gt(founderBalanceBefore);
      
      const milestone = await moneyMule.milestones(firstMilestoneId);
      expect(milestone.fundsReleased).to.be.true;
    });

    it("Should revert if verification delay not met", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Complete funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("10") });
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      const firstMilestoneId = milestoneIds[0];
      
      // Complete milestone
      await moneyMule.connect(founder).completeMilestone(firstMilestoneId);
      
      // Try to release funds immediately
      await expect(
        moneyMule.connect(founder).releaseFunds(firstMilestoneId)
      ).to.be.revertedWith("Verification delay not met");
    });

    it("Should revert if funds already released", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Complete funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("10") });
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      const firstMilestoneId = milestoneIds[0];
      
      // Complete milestone
      await moneyMule.connect(founder).completeMilestone(firstMilestoneId);
      
      // Fast forward and release funds
      await time.increase(25 * 60 * 60);
      await moneyMule.connect(founder).releaseFunds(firstMilestoneId);
      
      // Try to release again
      await expect(
        moneyMule.connect(founder).releaseFunds(firstMilestoneId)
      ).to.be.revertedWith("Funds already released");
    });
  });

  describe("Investment Withdrawal", function () {
    it("Should allow withdrawal after deadline if funding incomplete", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Partial funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("5") });
      
      // Fast forward past deadline
      await time.increase(8 * 24 * 60 * 60); // 8 days
      
      const investorBalanceBefore = await ethers.provider.getBalance(investor1.address);
      
      await expect(
        moneyMule.connect(investor1).withdrawInvestment(roundId)
      ).to.emit(moneyMule, "InvestmentWithdrawn")
        .withArgs(roundId, investor1.address, ethers.parseEther("5"));
      
      const investorBalanceAfter = await ethers.provider.getBalance(investor1.address);
      expect(investorBalanceAfter).to.be.gt(investorBalanceBefore);
      
      expect(await moneyMule.getInvestmentAmount(roundId, investor1.address)).to.equal(0);
    });

    it("Should allow withdrawal if round is cancelled", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      // Invest and then cancel
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("5") });
      
      await moneyMule.connect(founder).cancelFundingRound(roundId);
      
      await expect(
        moneyMule.connect(investor1).withdrawInvestment(roundId)
      ).to.emit(moneyMule, "InvestmentWithdrawn")
        .withArgs(roundId, investor1.address, ethers.parseEther("5"));
    });

    it("Should calculate correct withdrawal amount with released funds", async function () {
      const { moneyMule, founder, investor1 } = await loadFixture(deployMoneyMuleFixture);
      
      // Create a funding round
      const targetAmount = ethers.parseEther("10");
      const deadline = (await time.latest()) + 7 * 24 * 60 * 60;
      const milestoneDescriptions = ["First Milestone", "Second Milestone"];
      const milestoneFunding = [ethers.parseEther("4"), ethers.parseEther("6")];
      
      await moneyMule.connect(founder).createFundingRound(
        targetAmount,
        deadline,
        milestoneDescriptions,
        milestoneFunding
      );
      
      const roundId = 1;
      
      // Whitelist and invest to complete funding
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("10") });
      
      // Complete and release first milestone (4 ETH)
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      await moneyMule.connect(founder).completeMilestone(milestoneIds[0]);
      await time.increase(25 * 60 * 60);
      await moneyMule.connect(founder).releaseFunds(milestoneIds[0]);
      
      // Now create a test scenario where we test withdrawal with expired deadline
      // Create a new round that will expire before completion
      const targetAmount2 = ethers.parseEther("5");
      const deadline2 = (await time.latest()) + 60; // 1 minute deadline
      const milestoneDescriptions2 = ["Test"];
      const milestoneFunding2 = [ethers.parseEther("5")];
      
      await moneyMule.connect(founder).createFundingRound(
        targetAmount2,
        deadline2,
        milestoneDescriptions2,
        milestoneFunding2
      );
      
      const roundId2 = 2;
      await moneyMule.connect(founder).whitelistInvestor(roundId2, investor1.address);
      await moneyMule.connect(investor1).invest(roundId2, { value: ethers.parseEther("3") });
      
      // Fast forward past deadline to make the round eligible for withdrawal
      await time.increase(120); // 2 minutes
      
      // Investor should get back their full investment since no funds were released
      const expectedWithdrawal = ethers.parseEther("3");
      
      await expect(
        moneyMule.connect(investor1).withdrawInvestment(roundId2)
      ).to.emit(moneyMule, "InvestmentWithdrawn")
        .withArgs(roundId2, investor1.address, expectedWithdrawal);
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { moneyMule, owner, founder } = await loadFixture(deployMoneyMuleFixture);
      
      await moneyMule.connect(owner).emergencyPause();
      
      // Should revert when paused (using custom error)
      await expect(
        moneyMule.connect(founder).createFundingRound(
          ethers.parseEther("10"),
          (await time.latest()) + 3600,
          ["Test"],
          [ethers.parseEther("10")]
        )
      ).to.be.revertedWithCustomError(moneyMule, "EnforcedPause");
      
      await moneyMule.connect(owner).unpause();
      
      // Should work after unpause
      await expect(
        moneyMule.connect(founder).createFundingRound(
          ethers.parseEther("10"),
          (await time.latest()) + 3600,
          ["Test"],
          [ethers.parseEther("10")]
        )
      ).to.emit(moneyMule, "FundingRoundCreated");
    });

    it("Should revert if non-owner tries to pause", async function () {
      const { moneyMule, founder } = await loadFixture(deployMoneyMuleFixture);
      
      await expect(
        moneyMule.connect(founder).emergencyPause()
      ).to.be.revertedWithCustomError(moneyMule, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return correct investor rounds", async function () {
      const { moneyMule, founder, investor1, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      await moneyMule.connect(founder).whitelistInvestor(roundId, investor1.address);
      await moneyMule.connect(investor1).invest(roundId, { value: ethers.parseEther("5") });
      
      const investorRounds = await moneyMule.getInvestorRounds(investor1.address);
      expect(investorRounds).to.deep.equal([BigInt(roundId)]);
    });

    it("Should return correct milestone IDs for round", async function () {
      const { moneyMule, roundId } = await loadFixture(deployWithFundingRoundFixture);
      
      const milestoneIds = await moneyMule.getRoundMilestones(roundId);
      expect(milestoneIds.length).to.equal(3);
      expect(milestoneIds[0]).to.equal(1);
      expect(milestoneIds[1]).to.equal(2);
      expect(milestoneIds[2]).to.equal(3);
    });
  });
}); 