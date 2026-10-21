import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * 部署 ZRAToken（name=ZRAToken, symbol=ZRA202430552905）
 *
 * 用法：
 *   yarn deploy                 // 部署全部
 *   yarn deploy --tags ZRAToken // 只部署代币
 */
const deployToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  await hre.deployments.deploy("ZRAToken", {
    from: deployer,
    args: [],
    log: true,
    // autoMine 只对本地 hardhat 网络有意义，远程网络会被忽略
    autoMine: true,
  });
};

export default deployToken;

// tags 里同时给出课程要求的名字和合约名，两种 --tags 用法都能命中
deployToken.tags = ["TokenZRA202430552905", "ZRAToken"];
