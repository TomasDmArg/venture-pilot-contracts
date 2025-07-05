import { network } from "hardhat";

/**
 * MoneyMule Factory Demo Script
 * 
 * This script demonstrates the complete lifecycle of the new Factory + Round system:
 * 1. Deploy factory and mock token
 * 2. Set up jurors and participants
 * 3. Create a funding round
 * 4. Simulate full funding cycle
 * 5. Execute milestone voting and completion
 */

async function main() {
  console.log("🎬 MoneyMule Factory Demo - Complete Lifecycle\n");

  // Connect to network
  const { ethers } = await network.connect();

  // Get participants
  const [owner, founder, investor1, investor2, investor3, juror1, juror2, juror3, community] = await ethers.getSigners();

  console.log("🎭 Demo Participants:");
  console.log("Owner/Factory Admin:", owner.address);
  console.log("Project Founder:", founder.address);
  console.log("Investor 1:", investor1.address);
  console.log("Investor 2:", investor2.address);
  console.log("Investor 3:", investor3.address);
  console.log("Juror 1:", juror1.address);
  console.log("Juror 2:", juror2.address);
  console.log("Juror 3:", juror3.address);
  console.log("Community Member:", community.address);
  console.log();

  // === SETUP PHASE ===
  console.log("🔧 PHASE 1: System Setup");
  console.log("========================");

  // Deploy Mock Token
  console.log("🪙 Deploying Demo Token...");
  const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
  const demoToken = await MockERC20.deploy("Demo Token", "DEMO", ethers.parseEther("10000"));
  await demoToken.waitForDeployment();
  const tokenAddress = await demoToken.getAddress();
  console.log("✅ Demo Token deployed:", tokenAddress);

  // Deploy Factory
  console.log("🏭 Deploying Factory...");
  const MoneyMuleFactory = await ethers.getContractFactory("MoneyMuleFactory");
  const factory = await MoneyMuleFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed:", factoryAddress);

  // Authorize Jurors
  console.log("⚖️ Authorizing Jurors...");
  await factory.connect(owner).authorizeJuror(juror1.address);
  await factory.connect(owner).authorizeJuror(juror2.address);
  await factory.connect(owner).authorizeJuror(juror3.address);
  console.log("✅ All jurors authorized");

  // Distribute Demo Tokens
  console.log("💸 Distributing Demo Tokens...");
  await demoToken.connect(owner).transfer(investor1.address, ethers.parseEther("200"));
  await demoToken.connect(owner).transfer(investor2.address, ethers.parseEther("200"));
  await demoToken.connect(owner).transfer(investor3.address, ethers.parseEther("200"));
  console.log("✅ Tokens distributed to investors");
  console.log();

  // === FUNDING ROUND CREATION ===
  console.log("🚀 PHASE 2: Funding Round Creation");
  console.log("==================================");

  const now = Math.floor(Date.now() / 1000);
  const fundingDeadline = now + 3600; // 1 hour
  const milestone1Deadline = fundingDeadline + 86400; // 1 day after funding
  const milestone2Deadline = milestone1Deadline + 86400; // 1 day after milestone1

  const milestones = [
    {
      description: "MVP Development - Core features and basic UI",
      fundingAmount: ethers.parseEther("40"),
      deadline: milestone1Deadline,
      juryWallets: [juror1.address, juror2.address, juror3.address]
    },
    {
      description: "Beta Release - Testing and user feedback",
      fundingAmount: ethers.parseEther("60"),
      deadline: milestone2Deadline,
      juryWallets: [juror1.address, juror2.address, juror3.address]
    }
  ];

  console.log("📊 Creating funding round...");
  console.log("   Target: 100 DEMO tokens");
  console.log("   Milestones: 2");
  console.log("   Funding deadline:", new Date(fundingDeadline * 1000).toLocaleString());

  const createTx = await factory.connect(founder).createFundingRound(
    tokenAddress,
    ethers.parseEther("100"),
    fundingDeadline,
    milestones
  );

  const receipt = await createTx.wait();
  let roundId: any;
  let roundContract: any;

  // Parse event
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsedLog = factory.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "RoundCreated") {
          roundId = parsedLog.args.roundId;
          roundContract = parsedLog.args.roundContract;
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  console.log("✅ Funding round created:");
  console.log("   Round ID:", roundId.toString());
  console.log("   Contract:", roundContract);
  console.log();

  // Get round contract instance
  const MoneyMuleRound = await ethers.getContractFactory("MoneyMuleRound");
  const round = MoneyMuleRound.attach(roundContract);

  // === FUNDING PHASE ===
  console.log("💰 PHASE 3: Funding Phase");
  console.log("=========================");

  // Whitelist investors
  console.log("👥 Whitelisting investors...");
  await round.connect(founder).whitelistInvestor(investor1.address);
  await round.connect(founder).whitelistInvestor(investor2.address);
  await round.connect(founder).whitelistInvestor(investor3.address);
  console.log("✅ All investors whitelisted");

  // Investors approve and invest
  console.log("🤝 Processing investments...");
  
  // Investor 1: 50 DEMO
  await demoToken.connect(investor1).approve(roundContract, ethers.parseEther("50"));
  await round.connect(investor1).invest(ethers.parseEther("50"));
  console.log("✅ Investor1 invested 50 DEMO tokens");

  // Investor 2: 30 DEMO
  await demoToken.connect(investor2).approve(roundContract, ethers.parseEther("30"));
  await round.connect(investor2).invest(ethers.parseEther("30"));
  console.log("✅ Investor2 invested 30 DEMO tokens");

  // Investor 3: 20 DEMO
  await demoToken.connect(investor3).approve(roundContract, ethers.parseEther("20"));
  await round.connect(investor3).invest(ethers.parseEther("20"));
  console.log("✅ Investor3 invested 20 DEMO tokens");

  // Check funding status
  const roundInfo = await round.getRoundInfo();
  console.log("📊 Funding complete:");
  console.log("   Total raised:", ethers.formatEther(roundInfo.current), "DEMO");
  console.log("   Phase:", Number(roundInfo.currentPhase) === 1 ? "Execution" : "Funding");
  console.log();

  // === MILESTONE EXECUTION ===
  console.log("🎯 PHASE 4: Milestone Execution");
  console.log("===============================");

  console.log("⏰ Simulating time passage to milestone 1 deadline...");
  
  // Fast-forward time to milestone deadline
  const timeToAdvance = milestone1Deadline - now + 10; // 10 seconds past deadline
  await ethers.provider.send("evm_increaseTime", [timeToAdvance]);
  await ethers.provider.send("evm_mine", []);
  
  // Community member triggers milestone deadline
  console.log("🔔 Community member triggers milestone 1 deadline...");
  await round.connect(community).triggerMilestoneDeadline(1);
  console.log("✅ Milestone 1 voting started");

  // Jury voting
  console.log("🗳️ Jury voting on milestone 1...");
  await round.connect(juror1).castJuryVote(1, true);  // Approve
  console.log("   Juror 1: ✅ Approved");
  
  await round.connect(juror2).castJuryVote(1, true);  // Approve
  console.log("   Juror 2: ✅ Approved");
  
  await round.connect(juror3).castJuryVote(1, true);  // Approve
  console.log("   Juror 3: ✅ Approved");
  console.log("✅ Milestone 1 approved by jury (3/3)");

  // Founder completes milestone
  console.log("✨ Founder completes milestone 1...");
  await round.connect(founder).completeMilestone(1);
  console.log("✅ Milestone 1 completed");

  // Wait for verification delay
  console.log("⏳ Waiting for verification delay...");
  await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 10]); // 24 hours + 10 seconds
  await ethers.provider.send("evm_mine", []);

  // Release funds
  console.log("💸 Releasing milestone 1 funds...");
  const founderBalanceBefore = await demoToken.balanceOf(founder.address);
  await round.connect(founder).releaseFunds(1);
  const founderBalanceAfter = await demoToken.balanceOf(founder.address);
  const released = founderBalanceAfter - founderBalanceBefore;
  console.log("✅ Released", ethers.formatEther(released), "DEMO tokens to founder");
  console.log();

  // === SECOND MILESTONE ===
  console.log("🎯 PHASE 5: Second Milestone");
  console.log("============================");

  console.log("⏰ Advancing to milestone 2 deadline...");
  const timeToAdvance2 = milestone2Deadline - milestone1Deadline + 10;
  await ethers.provider.send("evm_increaseTime", [timeToAdvance2]);
  await ethers.provider.send("evm_mine", []);

  // Trigger milestone 2
  console.log("🔔 Triggering milestone 2 deadline...");
  await round.connect(community).triggerMilestoneDeadline(2);

  // Mixed jury voting (2 approve, 1 reject)
  console.log("🗳️ Jury voting on milestone 2 (mixed results)...");
  await round.connect(juror1).castJuryVote(2, true);   // Approve
  await round.connect(juror2).castJuryVote(2, true);   // Approve  
  await round.connect(juror3).castJuryVote(2, false);  // Reject
  console.log("   Final vote: 2 Approve, 1 Reject");
  console.log("✅ Milestone 2 approved by majority");

  // Complete second milestone
  await round.connect(founder).completeMilestone(2);
  console.log("✅ Milestone 2 completed");

  // Wait and release final funds
  await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 10]);
  await ethers.provider.send("evm_mine", []);

  const founderBalanceBefore2 = await demoToken.balanceOf(founder.address);
  await round.connect(founder).releaseFunds(2);
  const founderBalanceAfter2 = await demoToken.balanceOf(founder.address);
  const released2 = founderBalanceAfter2 - founderBalanceBefore2;
  console.log("✅ Released", ethers.formatEther(released2), "DEMO tokens to founder");
  console.log();

  // === DEMO SUMMARY ===
  console.log("🎉 DEMO COMPLETE!");
  console.log("==================");
  console.log("✅ Factory system deployed and tested");
  console.log("✅ Funding round created and fully funded"); 
  console.log("✅ All milestones completed and approved");
  console.log("✅ All funds released to founder");
  console.log("✅ Jury voting system validated");
  console.log("✅ Community participation demonstrated");
  console.log();

  console.log("📊 Final Statistics:");
  console.log("   Total funds raised: 100 DEMO tokens");
  console.log("   Total funds released:", ethers.formatEther(released + released2), "DEMO");
  console.log("   Successful milestones: 2/2");
  console.log("   Jury votes cast: 6");
  console.log("   Community triggers: 2");
  console.log();

  console.log("🔗 Contract Addresses:");
  console.log("   Factory:", factoryAddress);
  console.log("   Demo Token:", tokenAddress);
  console.log("   Round Contract:", roundContract);
  console.log("   Round ID:", roundId.toString());
  console.log();

  console.log("🚀 The MoneyMule Factory system is ready for production!");
}

main().catch((error) => {
  console.error("❌ Demo failed:", error);
  process.exitCode = 1;
}); 