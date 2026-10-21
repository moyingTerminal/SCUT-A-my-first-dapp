import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
const ARBITER = "0x6b0D8FA4C3dA1dc24cf98F700A43cB8B2d8F6363";
const deployEscrow: DeployFunction = async function (hre:
HardhatRuntimeEnvironment) {
const { deployer } = await hre.getNamedAccounts();
await hre.deployments.deploy("Escrow", { from: deployer, args: [ARBITER], log: true,
autoMine: true });
};
export default deployEscrow;
deployEscrow.tags = ["EscrowZRA202430552905"];
