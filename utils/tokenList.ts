import { SUPPORT_CHAIN_IDS } from "./enums";

export const tokenList: {
  [chainId: number]: Array<{ decimals: number; value: string; label: string }>
} = {
  [SUPPORT_CHAIN_IDS.ETH]: [
    { decimals: 18, value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", label: "ETH" },
    { decimals: 6, value: "0xdAC17F958D2ee523a2206206994597C13D831ec7", label: "USDT" },
    { decimals: 6, value: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", label: "USDC" },
    { decimals: 18, value: "0x6B175474E89094C44Da98b954EedeAC495271d0F", label: "DAI" },
    { decimals: 18, value: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", label: "WETH" },
    { decimals: 18, value: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3", label: "USDe" },
    { decimals: 18, value: "0x7C1156E515aA1A2E851674120074968C905aAF37", label: "lvlUSD" },
  ],
  [SUPPORT_CHAIN_IDS.BASE]: [
    { decimals: 18, value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", label: "ETH" },
    { decimals: 18, value: "0x35E5dB674D8e93a03d814FA0ADa70731efe8a4b9", label: "USR" },
    { decimals: 6, value: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", label: "USDC" },
    { decimals: 6, value: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", label: "USDT" },
    { decimals: 18, value: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", label: "DAI" },
    { decimals: 18, value: "0x4200000000000000000000000000000000000006", label: "WETH" },
    // Add other tokens available on Base
  ]
};

// Helper function to get tokens for a specific chain
export const getTokensForChain = (chainId: number) => {
  return tokenList[chainId] || tokenList[SUPPORT_CHAIN_IDS.ETH]; // Default to ETH chain if chainId not found
};