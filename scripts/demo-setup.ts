import { network } from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("🚀 Setting up MoneyMule Demo with ERC20 Support...");

  // Connect to network using Hardhat 3 approach
  const { ethers: networkEthers } = await network.connect({
    network: "moneymule",
    chainType: "l1",
  });

  // Get signers for demo participants
  const signers = await networkEthers.getSigners();
  
  // Check if we have enough signers
  if (signers.length < 5) {
    console.log(`⚠️  Solo hay ${signers.length} signer(s) configurado(s). Necesitamos 5 para la demo.`);
    console.log("💡 Opciones:");
    console.log("1. Configura más private keys en tu archivo .env");
    console.log("2. Usa la red 'localhost' o 'hardhat' que tienen cuentas por defecto");
    return;
  }

  const [owner, founder, investor1, investor2, investor3] = signers;

  // Use the first account as distributor (should have funds)
  const distributor = owner;

  console.log("💰 Account Setup:");
  console.log(`📝 Distributor address: ${distributor.address}`);
  console.log(`📝 Founder address: ${founder.address}`);
  console.log(`📝 Investor1 address: ${investor1.address}`);
  console.log(`📝 Investor2 address: ${investor2.address}`);
  console.log(`📝 Investor3 address: ${investor3.address}`);

  console.log("\n💵 Distributing USDC tokens for investment...");
  
  // Get USDC contract
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS!;
  const usdcAbi = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, distributor);
  
  // Get USDC decimals
  const usdcDecimals = await usdcContract.decimals();
  const usdcSymbol = await usdcContract.symbol();
  console.log(`📋 Using ${usdcSymbol} with ${usdcDecimals} decimals`);
  
  // Distribute USDC to each participant
  const usdcAmount = ethers.parseUnits("100", usdcDecimals); // 100 USDC per participant
  
  const participants = [
    { signer: founder, role: "Founder" },
    { signer: investor1, role: "Investor 1" },
    { signer: investor2, role: "Investor 2" },
    { signer: investor3, role: "Investor 3" }
  ];
  
  for (const participant of participants) {
    const tx = await usdcContract.transfer(participant.signer.address, usdcAmount);
    await tx.wait();
    console.log(`✅ Sent ${ethers.formatUnits(usdcAmount, usdcDecimals)} ${usdcSymbol} to ${participant.role}: ${participant.signer.address}`);
  }

  console.log("\n📋 Deploying MoneyMule contract...");
  
  // Deploy MoneyMule contract
  const MoneyMule = await networkEthers.getContractFactory("MoneyMule");
  const moneyMule = await MoneyMule.deploy();
  await moneyMule.waitForDeployment();
  
  const contractAddress = await moneyMule.getAddress();
  console.log(`✅ MoneyMule deployed to: ${contractAddress}`);

  // Demo data - using USDC
  const targetAmount = ethers.parseUnits("30", usdcDecimals); // 30 USDC
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  
  const milestoneDescriptions = [
    "MVP Development - Core platform features",
    "Beta Release - User testing and feedback",
    "Production Launch - Full platform release"
  ];
  
  const milestoneFunding = [
    ethers.parseUnits("10", usdcDecimals), // 10 USDC for MVP
    ethers.parseUnits("10", usdcDecimals), // 10 USDC for Beta
    ethers.parseUnits("10", usdcDecimals)  // 10 USDC for Production
  ];

  console.log("\n📋 Creating Demo Funding Round...");
  
  // Create funding round with USDC token
  const createTx = await moneyMule.connect(founder).createFundingRound(
    usdcAddress,
    targetAmount,
    deadline,
    milestoneDescriptions,
    milestoneFunding
  );
  
  await createTx.wait();
  console.log("✅ Funding round created with ID: 1");

  // Get round info
  const roundInfo = await moneyMule.getFundingRound(1);
  console.log(`   Token: ${roundInfo[2]} (${usdcSymbol})`);
  console.log(`   Target Amount: ${ethers.formatUnits(roundInfo[3], usdcDecimals)} ${usdcSymbol}`);
  console.log(`   Deadline: ${new Date(Number(roundInfo[5]) * 1000).toLocaleString()}`);
  console.log(`   Milestones: ${roundInfo[8]}`);

  console.log("\n👥 Setting up Demo Investors...");
  
  // Whitelist investors
  await moneyMule.connect(founder).whitelistInvestor(1, investor1.address);
  await moneyMule.connect(founder).whitelistInvestor(1, investor2.address);
  await moneyMule.connect(founder).whitelistInvestor(1, investor3.address);
  
  console.log(`✅ Whitelisted investor1: ${investor1.address}`);
  console.log(`✅ Whitelisted investor2: ${investor2.address}`);
  console.log(`✅ Whitelisted investor3: ${investor3.address}`);

  console.log("\n💰 Approving USDC for investments...");
  
  // Approve USDC spending for each investor
  const approvalAmount = ethers.parseUnits("50", usdcDecimals); // 50 USDC approval each
  
  // Create USDC contract instances for each investor
  const usdcContract1 = new ethers.Contract(usdcAddress, usdcAbi, investor1);
  const usdcContract2 = new ethers.Contract(usdcAddress, usdcAbi, investor2);
  const usdcContract3 = new ethers.Contract(usdcAddress, usdcAbi, investor3);
  
  await usdcContract1.approve(contractAddress, approvalAmount);
  await usdcContract2.approve(contractAddress, approvalAmount);
  await usdcContract3.approve(contractAddress, approvalAmount);
  
  console.log(`✅ Approved ${ethers.formatUnits(approvalAmount, usdcDecimals)} ${usdcSymbol} for each investor`);

  console.log("\n💰 Demo Investment Scenario...");
  
  // Demo investments using USDC
  const investment1 = ethers.parseUnits("12", usdcDecimals); // 12 USDC
  const investment2 = ethers.parseUnits("10", usdcDecimals); // 10 USDC
  const investment3 = ethers.parseUnits("8", usdcDecimals);  // 8 USDC
  
  await moneyMule.connect(investor1).invest(1, investment1);
  await moneyMule.connect(investor2).invest(1, investment2);
  await moneyMule.connect(investor3).invest(1, investment3);
  
  console.log(`✅ Investor1 invested ${ethers.formatUnits(investment1, usdcDecimals)} ${usdcSymbol}`);
  console.log(`✅ Investor2 invested ${ethers.formatUnits(investment2, usdcDecimals)} ${usdcSymbol}`);
  console.log(`✅ Investor3 invested ${ethers.formatUnits(investment3, usdcDecimals)} ${usdcSymbol}`);

  // Check funding status
  const updatedRound = await moneyMule.getFundingRound(1);
  const contractUsdcBalance = await usdcContract.balanceOf(contractAddress);
  const lockedAmount = await moneyMule.getLockedTokenAmount(usdcAddress);
  
  console.log(`💡 Contract USDC balance: ${ethers.formatUnits(contractUsdcBalance, usdcDecimals)} ${usdcSymbol}`);
  console.log(`💡 Locked USDC amount: ${ethers.formatUnits(lockedAmount, usdcDecimals)} ${usdcSymbol}`);
  console.log(`💡 Total investments: ${ethers.formatUnits(investment1 + investment2 + investment3, usdcDecimals)} ${usdcSymbol}`);
  console.log(`💡 Funding status: ${updatedRound[6] === 1n ? "✅ COMPLETED" : "⏳ Active"}`);

  console.log("\n🎯 Demo Data Summary:");
  console.log("==================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Token Used: ${usdcAddress} (${usdcSymbol})`);
  console.log(`Founder Address: ${founder.address}`);
  console.log(`Funding Round ID: 1`);
  console.log(`Target Amount: ${ethers.formatUnits(targetAmount, usdcDecimals)} ${usdcSymbol}`);
  console.log(`Contract Balance: ${ethers.formatUnits(contractUsdcBalance, usdcDecimals)} ${usdcSymbol}`);
  console.log(`Locked Amount: ${ethers.formatUnits(lockedAmount, usdcDecimals)} ${usdcSymbol}`);
  console.log(`Investors: 3 whitelisted and invested`);
  console.log(`Milestones: 3 created and ready for completion`);

  console.log("\n🎬 Demo Flow Instructions:");
  console.log("=========================");
  console.log("1. ✅ Funding round created and funded");
  console.log("2. 🔄 Founder can complete milestones using:");
  console.log(`   await moneyMule.connect(founder).completeMilestone(1); // First milestone`);
  console.log("3. ⏰ Wait 24 hours (or fast-forward time in tests)");
  console.log("4. 💸 Release funds using:");
  console.log(`   await moneyMule.connect(founder).releaseFunds(1);`);
  console.log("5. 🔄 Repeat for remaining milestones");

  console.log("\n🔄 Token Recovery System:");
  console.log("=========================");
  console.log("Si alguien envía tokens por error al contrato:");
  console.log("1. 🔍 Verificar tokens disponibles:");
  console.log(`   await moneyMule.getLockedTokenAmount(tokenAddress);`);
  console.log("2. 📤 Recuperar tokens no bloqueados:");
  console.log(`   await moneyMule.withdrawInvalidToken(tokenAddress, amount);`);
  console.log("3. 🚨 Recuperación de emergencia (solo owner):");
  console.log(`   await moneyMule.emergencyRecoverToken(tokenAddress, to, amount);`);

  console.log("\n💡 Concepto MoneyMule Mejorado:");
  console.log("===============================");
  console.log("✅ Cada MoneyMule = Una solicitud de inversión con token específico");
  console.log("✅ Soporte completo para tokens ERC20 (USDC, USDT, DAI, etc.)");
  console.log("✅ Funding basado en milestones para máxima transparencia");
  console.log("✅ Inversores whitelisted por el founder");
  console.log("✅ Fondos liberados gradualmente al completar objetivos");
  console.log("✅ Sistema inteligente de recuperación de tokens enviados por error");
  console.log("✅ Protección automática: solo tokens no bloqueados se pueden retirar");
  console.log("✅ Protección para inversores con sistema de withdrawals");

  console.log("\n🎯 Demo is ready for presentation! 🎯");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});