import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = process.env.USDC_CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set USDC_CONTRACT_ADDRESS in your .env file");
    return;
  }

  const [deployer] = await ethers.getSigners();
  
  console.log("=== NETWORK INFO ===");
  console.log("Network:", await deployer.provider.getNetwork());
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  console.log("\n=== CONTRACT VERIFICATION ===");
  console.log("Contract Address:", contractAddress);
  
  try {
    // Check if there's code at the address
    const code = await deployer.provider.getCode(contractAddress);
    console.log("Contract code length:", code.length);
    
    if (code === "0x") {
      console.error("❌ NO CONTRACT FOUND at this address!");
      console.log("This could mean:");
      console.log("1. The contract is not deployed");
      console.log("2. Wrong contract address");
      console.log("3. Wrong network");
      return;
    }
    
    console.log("✅ Contract code detected");
    
    // Try to connect to the contract
    const usdc = await ethers.getContractAt("USDC", contractAddress);
    
    console.log("\n=== CONTRACT DATA ===");
    
    try {
      const name = await usdc.name();
      const symbol = await usdc.symbol();
      const decimals = await usdc.decimals();
      const totalSupply = await usdc.totalSupply();
      const owner = await usdc.owner();
      
      console.log("✅ Successfully connected to contract!");
      console.log("Name:", name);
      console.log("Symbol:", symbol);
      console.log("Decimals:", decimals);
      console.log("Total Supply:", totalSupply.toString());
      console.log("Owner:", owner);
      
    } catch (error) {
      console.error("❌ Cannot read contract data:");
      console.error("Error:", error);
    }
    
  } catch (error) {
    console.error("❌ Error verifying contract:");
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 