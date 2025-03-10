import { SUPPORT_CHAIN_IDS } from "./enums";

export const tokenList: {
  [chainId: number]: Array<{ decimals: number; value: string; label: string }>
} = {
  [SUPPORT_CHAIN_IDS.ETH]: [
    { decimals: 18, value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", label: "ETH" },
    { decimals: 6, value: "0xdAC17F958D2ee523a2206206994597C13D831ec7", label: "USDT" },
    { decimals: 6, value: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", label: "USDC" }
  ],
  [SUPPORT_CHAIN_IDS.BASE]: [
    { decimals: 18, value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", label: "ETH" },
    { decimals: 18, value: "0x35E5dB674D8e93a03d814FA0ADa70731efe8a4b9", label: "USR" },
    // Add other tokens available on Base
  ]
};

// Helper function to get tokens for a specific chain
export const getTokensForChain = (chainId: number) => {
  return tokenList[chainId] || tokenList[SUPPORT_CHAIN_IDS.ETH]; // Default to ETH chain if chainId not found
}; 