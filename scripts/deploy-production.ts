import { network } from "hardhat";

/**
 * Production deployment script for MoneyMule Factory System
 * 
 * This script deploys the Factory to mainnet/testnet without mock tokens
 * Configure your .env file with PRIVATE_KEY and network settings
 */

async function main() {
  console.log("🚀 Deploying MoneyMule Factory System (PRODUCTION)...\n");

  // Connect to network using Hardhat 3
  const { ethers } = await network.connect();

  // Get signers
  const [deployer] = await ethers.getSigners();

  console.log("📋 Production Deployment:");
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  WARNING: Low balance. Make sure you have enough funds for deployment.");
  }
  console.log();

  // Deploy Factory
  console.log("🏭 Deploying MoneyMule Factory...");
  const MoneyMuleFactory = await ethers.getContractFactory("MoneyMuleFactory");
  const factory = await MoneyMuleFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed at:", factoryAddress);
  console.log();

  // Verify factory state
  const nextRoundId = await factory.getNextRoundId();
  const totalRounds = await factory.getTotalRounds();
  const owner = await factory.owner();
  
  console.log("📊 Factory verification:");
  console.log("   Owner:", owner);
  console.log("   Next Round ID:", nextRoundId.toString());
  console.log("   Total Rounds:", totalRounds.toString());
  console.log("   Deployer matches owner:", owner === deployer.address);
  console.log();

  console.log("🎉 Production deployment completed!");
  console.log();
  console.log("📋 CONTRACT ADDRESSES:");
  console.log("======================");
  console.log(`Factory: ${factoryAddress}`);
  console.log();
  console.log("🔗 NEXT STEPS:");
  console.log("==============");
  console.log("1. Verify the contract on Etherscan:");
  console.log(`   npx hardhat verify --network [network] ${factoryAddress}`);
  console.log();
  console.log("2. Authorize jurors for milestone voting:");
  console.log(`   await factory.authorizeJuror(jurorAddress)`);
  console.log();
  console.log("3. Create funding rounds:");
  console.log(`   await factory.createFundingRound(token, amount, deadline, milestones)`);
  console.log();
  console.log("🔒 SECURITY REMINDERS:");
  console.log("======================");
  console.log("- Keep your private key secure");
  console.log("- Only authorize trusted jurors");
  console.log("- Test thoroughly on testnet first");
  console.log("- Consider using a multisig for factory ownership");
  console.log();
  console.log("💾 Save this information:");
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`DEPLOYER_ADDRESS=${deployer.address}`);
  console.log(`DEPLOYMENT_BLOCK=${await ethers.provider.getBlockNumber()}`);
  console.log(`DEPLOYMENT_TIME=${new Date().toISOString()}`);
}

main().catch((error) => {
  console.error("❌ Production deployment failed:", error);
  process.exitCode = 1;
}); 