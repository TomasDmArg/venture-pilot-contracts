import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MoneyMuleModule = buildModule("MoneyMuleModule", (m) => {
  // Deploy the MoneyMule contract
  const moneyMule = m.contract("MoneyMule", []);

  return { moneyMule };
});

export default MoneyMuleModule; 