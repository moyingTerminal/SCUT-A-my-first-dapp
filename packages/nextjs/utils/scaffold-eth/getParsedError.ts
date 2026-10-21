import { BaseError as BaseViemError, ContractFunctionRevertedError } from "viem";

/**
 * 有些节点（比如 POTOS 测试网 RPC）对失败的 eth_call 会回一个
 * { "code": ..., "message": "" } 的空错误，viem 拿到的 details 就是空串。
 * 没有兜底文案时前端只会弹出一个「!」图标、一个字都没有。
 */
const EMPTY_RPC_ERROR_HINT = [
  "The RPC node rejected this call but returned no reason.",
  "This usually means the call reverted on chain (wrong order status, not the buyer/arbiter,",
  "or the previous transaction is still pending), or the RPC is temporarily unavailable.",
  "Check the order state and retry once the previous transaction is mined.",
].join("\n");

/**
 * Parses an viem/wagmi error to get a displayable string
 * @param e - error object
 * @returns parsed error string
 */
export const getParsedError = (error: any): string => {
  const parsedError = error?.walk ? error.walk() : error;

  if (parsedError instanceof BaseViemError) {
    if (parsedError.details) {
      return parsedError.details;
    }

    if (parsedError.shortMessage) {
      if (
        parsedError instanceof ContractFunctionRevertedError &&
        parsedError.data &&
        parsedError.data.errorName !== "Error"
      ) {
        const customErrorArgs = parsedError.data.args?.toString() ?? "";
        return `${parsedError.shortMessage.replace(/reverted\.$/, "reverted with the following reason:")}\n${
          parsedError.data.errorName
        }(${customErrorArgs})`;
      }

      // details 为空、且是泛化的 RPC 报错时补上说明，避免弹窗只有「!」
      if (parsedError.name === "RpcRequestError" || parsedError.name === "HttpRequestError") {
        return `${parsedError.shortMessage}\n${EMPTY_RPC_ERROR_HINT}`;
      }

      return parsedError.shortMessage;
    }

    return parsedError.message || parsedError.name || "An unknown error occurred";
  }

  return parsedError?.message || "An unknown error occurred";
};
