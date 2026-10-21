import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const ARBITER = "0x43e2170aFCab8734532106479769857a3EbDaB27";
const deployEscrow: DeployFunction = async function (hre:
HardhatRuntimeEnvironment) {
const { deployer } = await hre.getNamedAccounts();
await hre.deployments.deploy("Escrow", { from: deployer, args: [ARBITER], log: true,
autoMine: true });
};
export default deployEscrow;
deployEscrow.tags = ["EscrowZRA202430552905"];
