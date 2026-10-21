import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

// 仲裁人地址。
// 需要换人时不用改代码，直接带环境变量部署：
//   ARBITER_ADDRESS=0x你的钱包 yarn deploy --network potos_testnet
// 不设置时沿用原来写死的地址。
const DEFAULT_ARBITER = "0x6b0D8FA4C3dA1dc24cf98F700A43cB8B2d8F6363";

/**
 * 部署 Escrow（构造函数参数 = 仲裁人地址）
 *
 * 用法：
 *   yarn deploy              // 部署全部
 *   yarn deploy --tags Escrow
 */
const deployEscrow: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const arbiter = process.env.ARBITER_ADDRESS ?? DEFAULT_ARBITER;

  await hre.deployments.deploy("Escrow", {
    from: deployer,
    args: [arbiter],
    log: true,
    autoMine: true,
  });
};

export default deployEscrow;

deployEscrow.tags = ["EscrowZRA202430552905", "Escrow"];
// 单独跑 Escrow 的 tag 时，保证代币脚本先执行
deployEscrow.dependencies = ["TokenZRA202430552905"];
