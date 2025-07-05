import { network } from "hardhat";
import * as dotenv from "dotenv";
import { USDC } from "../typechain-types/index.js";

dotenv.config();

async function main() {
  // Connect to the network first
  const { ethers } = await network.connect({
    network: "moneymule",
    chainType: "l1",
  });

  // ethers should be available globally with hardhat-toolbox-mocha-ethers
  if (!ethers) {
    console.error("❌ ethers is not available. Make sure hardhat-toolbox-mocha-ethers is properly configured.");
    return;
  }

  console.log("✅ Ethers is available globally");

  // Check if contract address is provided
  const contractAddress = process.env.USDC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Please set USDC_CONTRACT_ADDRESS in your .env file");
    return;
  }

  // Get the deployer's account
  const [deployer] = await ethers.getSigners();

  if (!deployer.provider) {
    console.error("❌ Provider is not available. Make sure the account is connected to a provider.");
    return;
  }
  
  console.log("Minting USDC tokens with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Connect to the deployed USDC contract
  const usdc = await ethers.getContractAt("USDC", contractAddress) as USDC;
  
  console.log("Connected to USDC contract at:", contractAddress);
  
  // Validate that the contract exists and has code
  try {
    const code = await deployer.provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("ERROR: No contract found at the specified address. Please check USDC_CONTRACT_ADDRESS in your .env file.");
      return;
    }
    console.log("Contract code detected, proceeding...");
  } catch (error) {
    console.error("Error checking contract code:", error);
    return;
  }
  
  // Test contract connection by trying to read basic info
  try {
    const name = await usdc.name();
    const symbol = await usdc.symbol();
    const decimals = await usdc.decimals();
    console.log(`Contract info: ${name} (${symbol}) with ${decimals} decimals`);
  } catch (error) {
    console.error("ERROR: Cannot read contract data. This might indicate:");
    console.error("1. Wrong contract address");
    console.error("2. Contract not deployed on this network");
    console.error("3. Network connection issues");
    console.error("Error details:", error);
    return;
  }
  
  // Get genesis addresses from environment
  const genesisAddressesEnv = process.env.GENESIS_ADDRESSES || "";
  const genesisAddresses = genesisAddressesEnv.split(",").map(addr => addr.trim()).filter(addr => addr.length > 0);
  
  if (genesisAddresses.length === 0) {
    console.log("No genesis addresses found in GENESIS_ADDRESSES environment variable");
    return;
  }
  
  console.log("Genesis addresses found:", genesisAddresses);
  
  // Get initial mint amount from environment (default to 1000 USDC)
  const initialMintAmount = process.env.INITIAL_MINT_AMOUNT || "1000000000"; // 1000 USDC (6 decimals)
  
  console.log("Mint amount per address:", initialMintAmount);
  
  // Mint tokens to each genesis address
  console.log("Minting tokens to genesis addresses...");
  
  for (const address of genesisAddresses) {
    try {
      // Validate address format
      if (!ethers.isAddress(address)) {
        console.log(`Invalid address format: ${address}, skipping...`);
        continue;
      }
      
      console.log(`Minting to ${address}...`);
      const tx = await usdc.mint(address, initialMintAmount);
      const receipt = await tx.wait();
      
      console.log(`✅ Minted ${initialMintAmount} USDC to ${address}`);
      console.log(`Transaction hash: ${receipt?.hash}`);
      
      // Check balance with error handling
      try {
        const balance = await usdc.balanceOf(address);
        console.log(`Balance of ${address}: ${balance.toString()}`);
      } catch (balanceError) {
        console.warn(`Warning: Could not read balance for ${address}. This might be a network issue.`);
      }
      
    } catch (error) {
      console.error(`Error minting to ${address}:`, error);
    }
  }
  
  console.log("Minting completed!");
  
  // Print contract info with error handling
  console.log("\n=== CONTRACT INFO ===");
  console.log("Contract Address:", contractAddress);
  
  try {
    const name = await usdc.name();
    const symbol = await usdc.symbol();
    const decimals = await usdc.decimals();
    const owner = await usdc.owner();
    const totalSupply = await usdc.totalSupply();
    
    console.log("Contract Name:", name);
    console.log("Contract Symbol:", symbol);
    console.log("Contract Decimals:", decimals);
    console.log("Contract Owner:", owner);
    console.log("Total Supply:", totalSupply.toString());
  } catch (error) {
    console.warn("Warning: Could not read some contract information. This might be a network issue.");
    console.warn("Error details:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 