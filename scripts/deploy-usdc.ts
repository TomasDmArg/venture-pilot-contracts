import * as dotenv from "dotenv";
import { USDC } from "../typechain-types/index.js";
import { network } from "hardhat";

dotenv.config();

async function main() {
  // Get the deployer's account
  const { ethers } = await network.connect({
    network: "moneymule",
    chainType: "l1",
  });
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying USDC contract with the account:", deployer.address);
  
  const provider = deployer.provider;
  if (!provider) {
    throw new Error("Provider is undefined");
  }
  console.log("Account balance:", (await provider.getBalance(deployer.address)).toString());

  // Deploy the USDC contract
  const USDC = await ethers.getContractFactory("USDC");
  const usdc = await USDC.deploy(deployer.address) as USDC;
  
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  
  console.log("USDC contract deployed to:", usdcAddress);
  
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
  
  console.log("Initial mint amount per address:", initialMintAmount);
  
  // Mint tokens to each genesis address
  console.log("Minting tokens to genesis addresses...");
  
  for (const address of genesisAddresses) {
    try {
      // Validate address format
      if (!ethers.isAddress(address)) {
        console.log(`Invalid address format: ${address}, skipping...`);
        continue;
      }
      
      const tx = await usdc.mint(address, initialMintAmount);
      await tx.wait();
      
      console.log(`Minted ${initialMintAmount} USDC to ${address}`);
      
      // Check balance
      const balance = await usdc.balanceOf(address);
      console.log(`Balance of ${address}: ${balance.toString()}`);
      
    } catch (error) {
      console.error(`Error minting to ${address}:`, error);
    }
  }
  
  console.log("Deployment and minting completed!");
  
  // Print contract info
  console.log("\n=== CONTRACT INFO ===");
  console.log("Contract Address:", usdcAddress);
  console.log("Contract Name:", await usdc.name());
  console.log("Contract Symbol:", await usdc.symbol());
  console.log("Contract Decimals:", await usdc.decimals());
  console.log("Contract Owner:", await usdc.owner());
  console.log("Total Supply:", (await usdc.totalSupply()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 