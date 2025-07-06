import { network } from "hardhat";

/**
 * Check Jurors Script
 * 
 * Use this script to check the authorization status of jurors
 * without making any changes to the contract
 */

async function main() {
  console.log("🔍 Checking Juror Status...\n");

  // Connect to network
  const { ethers } = await network.connect();
  const [signer] = await ethers.getSigners();

  console.log("📋 Connection Info:");
  console.log("Signer:", signer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log();

  // Factory address from your deployment
  const factoryAddress = "0xa1820208Dff37B39a8a324e82E3449283e21703b";

  // Connect to factory
  console.log("🏭 Connecting to Factory...");
  const MoneyMuleFactory = await ethers.getContractFactory("MoneyMuleFactory");
  const factory = MoneyMuleFactory.attach(factoryAddress);
  console.log("✅ Connected to Factory at:", factoryAddress);
  console.log();

  // Check factory info
  const owner = await factory.owner();
  const nextRoundId = await factory.getNextRoundId();
  const totalRounds = await factory.getTotalRounds();
  
  console.log("🏭 Factory Info:");
  console.log("Owner:", owner);
  console.log("Next Round ID:", nextRoundId.toString());
  console.log("Total Rounds:", totalRounds.toString());
  console.log();

  // Addresses to check - add your addresses here
  const addressesToCheck = [
    signer.address,
    "0xa6e4e006EeD9fEA0C378A42d32a033F4B4f4A15b", // Your deployer address
    // Add more addresses here if needed
    // "0x1234567890123456789012345678901234567890",
    // "0x2345678901234567890123456789012345678901",
  ];

  console.log("⚖️  Checking Juror Authorization Status:");
  console.log("=====================================");

  for (const address of addressesToCheck) {
    try {
      const isAuthorized = await factory.isAuthorizedJuror(address);
      const status = isAuthorized ? "✅ Authorized" : "❌ Not Authorized";
      console.log(`${address}: ${status}`);
    } catch (error) {
      console.log(`${address}: ❌ Error checking status`);
    }
  }

  console.log();
  console.log("🔑 Ownership Info:");
  console.log("Current signer is owner:", owner.toLowerCase() === signer.address.toLowerCase());
  console.log("Current signer is authorized juror:", await factory.isAuthorizedJuror(signer.address));
  console.log();

  console.log("💡 Next steps:");
  console.log("- Run 'npx hardhat run scripts/authorize-jurors.ts' to authorize jurors");
  console.log("- Make sure you have at least 3 authorized jurors for milestones");
  console.log("- Use authorized addresses in your funding round milestones");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
}); 