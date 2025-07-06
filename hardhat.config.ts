import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      type: "edr",
      chainId: 31337,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    moneymule: {
      type: "http",
      url: process.env.MONEYMULE_RPC_URL || "https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io",
      accounts: [
        process.env.PRIVATE_KEY!,
        process.env.PRIVATE_KEY_2!,
        process.env.PRIVATE_KEY_3!,
        process.env.PRIVATE_KEY_4!,
        process.env.PRIVATE_KEY_5!,
        process.env.PRIVATE_KEY_6!,
      ],
      chainId: 2751721147387000,
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
