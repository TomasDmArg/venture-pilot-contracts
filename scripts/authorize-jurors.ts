import { network } from "hardhat";

/**
 * Authorize Jurors Script
 * 
 * Use this script to authorize jurors for your MoneyMule Factory
 * without needing Foundry's cast command
 */

async function main() {
  console.log("⚖️  Authorizing Jurors...\n");

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

  // Check current owner
  const owner = await factory.owner();
  console.log("🔑 Factory Owner:", owner);
  console.log("👤 Current Signer:", signer.address);
  console.log("🎯 Is Owner:", owner.toLowerCase() === signer.address.toLowerCase());
  console.log();

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("❌ Error: You are not the owner of this factory");
    console.log("💡 Only the owner can authorize jurors");
    console.log("🔧 Make sure you're using the correct private key");
    return;
  }

  // Jurors to authorize - you can modify this list
  const jurorsToAuthorize = [
    signer.address, // Authorize yourself
    // Add more addresses here if needed
    // "0x1234567890123456789012345678901234567890",
    // "0x2345678901234567890123456789012345678901",
  ];

  console.log("📋 Jurors to authorize:");
  jurorsToAuthorize.forEach((juror, index) => {
    console.log(`${index + 1}. ${juror}`);
  });
  console.log();

  // Authorize each juror
  for (let i = 0; i < jurorsToAuthorize.length; i++) {
    const jurorAddress = jurorsToAuthorize[i];
    console.log(`⚖️  Processing juror ${i + 1}/${jurorsToAuthorize.length}: ${jurorAddress}`);
    
    try {
      // Check if already authorized
      const isAuthorized = await factory.isAuthorizedJuror(jurorAddress);
      
      if (isAuthorized) {
        console.log("ℹ️  Already authorized - skipping");
        continue;
      }

      // Authorize the juror
      console.log("🔄 Authorizing...");
      const tx = await factory.authorizeJuror(jurorAddress);
      console.log("📤 Transaction sent:", tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      if (receipt) {
        console.log("✅ Authorized successfully");
        console.log("⛽ Gas used:", receipt.gasUsed.toString());
      } else {
        console.log("⚠️  Transaction completed but no receipt received");
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("❌ Error authorizing juror:", errorMessage);
      
      // Check for specific error messages
      if (errorMessage.includes("Invalid juror address")) {
        console.log("💡 Error: Cannot authorize null address (0x0)");
      } else if (errorMessage.includes("Juror already authorized")) {
        console.log("💡 Error: This juror is already authorized");
      } else if (errorMessage.includes("OwnableUnauthorizedAccount")) {
        console.log("💡 Error: Only the factory owner can authorize jurors");
      }
    }
    
    console.log();
  }

  // Show final status
  console.log("📊 Final Status:");
  console.log("================");
  
  for (const jurorAddress of jurorsToAuthorize) {
    const isAuthorized = await factory.isAuthorizedJuror(jurorAddress);
    console.log(`${jurorAddress}: ${isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}`);
  }
  
  console.log();
  console.log("🎉 Juror authorization process completed!");
  console.log();
  console.log("🔗 Next steps:");
  console.log("- Create funding rounds with authorized jurors");
  console.log("- Each milestone needs exactly 3 authorized jurors");
  console.log("- Use these addresses in your milestone juryWallets arrays");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
}); 