import { network } from "hardhat";

/**
 * Factory Management Script
 * 
 * Use this script to manage your deployed MoneyMule Factory:
 * - Authorize/revoke jurors
 * - View factory status
 * - Create funding rounds
 * - Manage existing rounds
 * 
 * Set FACTORY_ADDRESS in your .env file
 */

async function main() {
  console.log("🛠️  MoneyMule Factory Management...\n");

  // Connect to network
  const { ethers } = await network.connect();
  const [signer] = await ethers.getSigners();

  console.log("📋 Connection Info:");
  console.log("Signer:", signer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log();

  // Get factory address from environment
  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (!factoryAddress) {
    console.error("❌ FACTORY_ADDRESS not set in .env file");
    console.log("💡 Add: FACTORY_ADDRESS=0x... to your .env file");
    process.exit(1);
  }

  // Connect to factory
  console.log("🏭 Connecting to Factory...");
  const MoneyMuleFactory = await ethers.getContractFactory("MoneyMuleFactory");
  const factory = MoneyMuleFactory.attach(factoryAddress);
  console.log("✅ Connected to Factory at:", factoryAddress);
  console.log();

  // Check factory status
  console.log("📊 Factory Status:");
  try {
    const owner = await factory.owner();
    const nextRoundId = await factory.getNextRoundId();
    const totalRounds = await factory.getTotalRounds();
    const isPaused = await factory.paused();

    console.log("   Owner:", owner);
    console.log("   Next Round ID:", nextRoundId.toString());
    console.log("   Total Rounds:", totalRounds.toString());
    console.log("   Paused:", isPaused);
    console.log("   Signer is owner:", owner === signer.address);
    console.log();

    if (owner !== signer.address) {
      console.log("⚠️  You are not the factory owner. Limited operations available.");
      console.log();
    }

    // Show recent rounds if any exist
    if (Number(totalRounds) > 0) {
      console.log("📋 Recent Rounds:");
      const recentRounds = Math.min(Number(totalRounds), 5);
      
      for (let i = Number(totalRounds) - recentRounds + 1; i <= Number(totalRounds); i++) {
        try {
          const roundAddress = await factory.getRoundContract(i);
          const MoneyMuleRound = await ethers.getContractFactory("MoneyMuleRound");
          const round = MoneyMuleRound.attach(roundAddress);
          const roundInfo = await round.getRoundInfo();
          
          console.log(`   Round ${i}:`);
          console.log(`      Contract: ${roundAddress}`);
          console.log(`      Founder: ${roundInfo.founderAddr}`);
          console.log(`      Target: ${ethers.formatEther(roundInfo.target)} tokens`);
          console.log(`      Current: ${ethers.formatEther(roundInfo.current)} tokens`);
          console.log(`      Phase: ${getPhaseString(Number(roundInfo.currentPhase))}`);
        } catch (error) {
          console.log(`   Round ${i}: Error loading info`);
        }
      }
      console.log();
    }

    // Management menu
    console.log("🛠️  Available Operations:");
    console.log("======================");
    
    if (owner === signer.address) {
      console.log("👑 Owner Operations:");
      console.log("   - Authorize juror: factory.authorizeJuror(address)");
      console.log("   - Revoke juror: factory.revokeJuror(address)");
      console.log("   - Pause factory: factory.pause()");
      console.log("   - Unpause factory: factory.unpause()");
      console.log();
    }

    console.log("👥 General Operations:");
    console.log("   - Create funding round: factory.createFundingRound(...)");
    console.log("   - View round details: factory.getRoundContract(roundId)");
    console.log("   - Check juror status: factory.isAuthorizedJuror(address)");
    console.log();

    console.log("💡 Example Commands:");
    console.log("====================");
    console.log("// Authorize a juror");
    console.log("await factory.authorizeJuror('0x...');");
    console.log();
    console.log("// Create a funding round");
    console.log("const milestones = [");
    console.log("  {");
    console.log("    description: 'Development Phase',");
    console.log("    fundingAmount: ethers.parseEther('40'),");
    console.log("    deadline: Math.floor(Date.now() / 1000) + 86400,");
    console.log("    juryWallets: [juror1, juror2, juror3]");
    console.log("  }");
    console.log("];");
    console.log("await factory.createFundingRound(");
    console.log("  tokenAddress,");
    console.log("  ethers.parseEther('100'),");
    console.log("  fundingDeadline,");
    console.log("  milestones");
    console.log(");");

  } catch (error) {
    console.error("❌ Error accessing factory:", error);
    console.log("💡 Make sure the factory address is correct and the contract is deployed.");
  }
}

function getPhaseString(phase: number): string {
  switch (phase) {
    case 0: return "Funding";
    case 1: return "Execution";
    case 2: return "Completed";
    case 3: return "Cancelled";
    default: return "Unknown";
  }
}

main().catch((error) => {
  console.error("❌ Management script failed:", error);
  process.exitCode = 1;
}); 