import { network } from "hardhat";

async function main() {
  console.log("🚀 Deploying MoneyMule Factory System...\n");

  // Connect to network using Hardhat 3
  const { ethers } = await network.connect();

  // Get signers
  const [owner, founder, investor1, investor2, juror1, juror2, juror3] = await ethers.getSigners();

  console.log("📋 Deployment accounts:");
  console.log("Owner:", owner.address);
  console.log("Founder:", founder.address);
  console.log("Investor1:", investor1.address);
  console.log("Investor2:", investor2.address);
  console.log("Juror1:", juror1.address);
  console.log("Juror2:", juror2.address);
  console.log("Juror3:", juror3.address);
  console.log();

  // Deploy Mock ERC20 token (from mocks directory)
  console.log("🪙 Deploying Mock ERC20...");
  const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
  const mockToken = await MockERC20.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log("✅ Mock ERC20 deployed at:", tokenAddress);
  console.log();

  // Deploy Factory
  console.log("🏭 Deploying MoneyMule Factory...");
  const MoneyMuleFactory = await ethers.getContractFactory("MoneyMuleFactory");
  const factory = await MoneyMuleFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed at:", factoryAddress);
  console.log();

  // Authorize jurors
  console.log("⚖️ Authorizing jurors...");
  await factory.connect(owner).authorizeJuror(juror1.address);
  await factory.connect(owner).authorizeJuror(juror2.address);
  await factory.connect(owner).authorizeJuror(juror3.address);
  console.log("✅ Jurors authorized");
  console.log();

  // Distribute tokens
  console.log("💸 Distributing tokens...");
  const transferTx1 = await mockToken.connect(owner).transfer(investor1.address, ethers.parseEther("1000"));
  await transferTx1.wait();
  const transferTx2 = await mockToken.connect(owner).transfer(investor2.address, ethers.parseEther("1000"));
  await transferTx2.wait();
  console.log("✅ Tokens distributed");
  console.log();

  // Create funding round
  console.log("📊 Creating funding round...");
  const now = Math.floor(Date.now() / 1000);
  const fundingDeadline = now + 86400; // 1 day from now
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

  try {
    const createTx = await factory.connect(founder).createFundingRound(
      tokenAddress,
      ethers.parseEther("100"),
      fundingDeadline,
      milestones
    );

    const receipt = await createTx.wait();
    
    // Parse the RoundCreated event correctly
    let roundId: any;
    let roundContract: any;
    
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
          // Skip logs that can't be parsed
          continue;
        }
      }
    }

    if (roundId && roundContract) {
      console.log("✅ Funding round created:");
      console.log("   Round ID:", roundId.toString());
      console.log("   Round Contract:", roundContract);
      console.log("   Target Amount:", ethers.formatEther(ethers.parseEther("100")), "tokens");
      console.log("   Funding Deadline:", new Date(fundingDeadline * 1000).toLocaleString());
      console.log("   Milestones:", milestones.length);
      console.log();

      // Example of interacting with the round
      console.log("🤝 Example interactions:");
      const MoneyMuleRound = await ethers.getContractFactory("MoneyMuleRound");
      const roundContractInstance = MoneyMuleRound.attach(roundContract);

      // Whitelist investor
      const whitelistTx = await roundContractInstance.connect(founder).whitelistInvestor(investor1.address);
      await whitelistTx.wait();
      console.log("✅ Investor1 whitelisted");

      // Approve tokens and invest
      const approveTx = await mockToken.connect(investor1).approve(roundContract, ethers.parseEther("50"));
      await approveTx.wait();
      const investTx = await roundContractInstance.connect(investor1).invest(ethers.parseEther("50"));
      await investTx.wait();
      console.log("✅ Investor1 invested 50 tokens");

      // Get round info
      const roundInfo = await roundContractInstance.getRoundInfo();
      console.log("📊 Round status:");
      console.log("   Current funding:", ethers.formatEther(roundInfo.current), "tokens");
      console.log("   Phase:", Number(roundInfo.currentPhase) === 0 ? "Funding" : "Execution");
      console.log();

      console.log("🎉 System deployed and ready to use!");
      console.log();
      console.log("📋 Summary:");
      console.log("Factory:", factoryAddress);
      console.log("Mock Token:", tokenAddress);
      console.log("Round Contract:", roundContract);
      console.log("Round ID:", roundId.toString());
      console.log();
      console.log("🔗 Next steps:");
      console.log("1. Add more investors to the round");
      console.log("2. Wait for funding deadline");
      console.log("3. Trigger milestone deadlines");
      console.log("4. Cast jury votes on milestones");
      console.log("5. Complete and release milestone funds");
    } else {
      console.error("❌ Failed to create funding round - no event found");
    }
  } catch (error) {
    console.error("❌ Error creating funding round:", error);
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 