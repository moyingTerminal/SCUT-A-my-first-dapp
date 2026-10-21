// 02_deploy_escrow.ts
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const ARBITER = "0x56679dc3Cd6bE17DeA8B6BF74AAcACE2ce62ff0a";
const deployEscrow: DeployFunction = async function (hre:
HardhatRuntimeEnvironment) {
const { deployer } = await hre.getNamedAccounts();
await hre.deployments.deploy("Escrow", { from: deployer, args: [ARBITER], log: true, autoMine: true });
};
export default deployEscrow;
deployEscrow.tags = ["EscrowWSY202430552739"];
