import * as dotenv from "dotenv";
import { MoneyMule } from "../typechain-types/index.js";
import { network } from "hardhat";

dotenv.config();

async function main() {
  // Get the deployer's account
  const { ethers } = await network.connect({
    network: "moneymule",
    chainType: "l1",
  });
  
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying MoneyMule contract with the account:", deployer.address);
  
  const provider = deployer.provider;
  if (!provider) {
    throw new Error("Provider is undefined");
  }
  console.log("Account balance:", (await provider.getBalance(deployer.address)).toString());

  // Deploy the MoneyMule contract
  const MoneyMule = await ethers.getContractFactory("MoneyMule");
  const moneyMule = await MoneyMule.deploy() as MoneyMule;
  
  await moneyMule.waitForDeployment();
  const moneyMuleAddress = await moneyMule.getAddress();
  
  console.log("MoneyMule contract deployed to:", moneyMuleAddress);
  
  // Verify the contract is deployed correctly
  try {
    const owner = await moneyMule.owner();
    console.log("Contract owner:", owner);
    console.log("Deployer address:", deployer.address);
    console.log("Owner matches deployer:", owner === deployer.address);
  } catch (error) {
    console.error("Error verifying contract deployment:", error);
  }
  
  // Test contract functionality
  try {
    const isPaused = await moneyMule.paused();
    console.log("Contract paused state:", isPaused);
  } catch (error) {
    console.error("Error checking contract state:", error);
  }
  
  console.log("Deployment completed!");
  
  // Print contract info
  console.log("\n=== CONTRACT INFO ===");
  console.log("Contract Address:", moneyMuleAddress);
  console.log("Contract Owner:", await moneyMule.owner());
  console.log("Verification Delay:", await moneyMule.VERIFICATION_DELAY());
  console.log("Contract Paused:", await moneyMule.paused());
  
  // Save the contract address to environment variable suggestion
  console.log("\n=== NEXT STEPS ===");
  console.log("Add the following to your .env file:");
  console.log(`MONEYMULE_CONTRACT_ADDRESS=${moneyMuleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 