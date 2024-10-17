import { SUPPORT_CHAIN_IDS } from "./enums";

export const DECIMAL: { [chainId: number]: number } = {
  // [SUPPORT_CHAIN_IDS.GOERLI]: 6,
  // [SUPPORT_CHAIN_IDS.MOONBEAM_ALPHA]: 18,
  // [SUPPORT_CHAIN_IDS.ARBITRUM_GOERLI]: 6,
  // [SUPPORT_CHAIN_IDS.MANTLE_TESTNET]: 6,
  [SUPPORT_CHAIN_IDS.ARBITRUM]: 6
};

export const EXPLORER: { [chainId: number]: string } = {
  // [SUPPORT_CHAIN_IDS.GOERLI]: "https://goerli.etherscan.io",
  // [SUPPORT_CHAIN_IDS.MOONBEAM_ALPHA]: "https://moonbase.moonscan.io",
  // [SUPPORT_CHAIN_IDS.ARBITRUM_GOERLI]: "https://goerli.arbiscan.io",
  // [SUPPORT_CHAIN_IDS.MANTLE_TESTNET]: "https://explorer.testnet.mantle.xyz/",
  [SUPPORT_CHAIN_IDS.ARBITRUM]:"https://arbiscan.io/",
};

export const YIELD_SOURCE: { [chainId: number]: string } = {
  // [SUPPORT_CHAIN_IDS.GOERLI]: "Compound",
  // [SUPPORT_CHAIN_IDS.MOONBEAM_ALPHA]: "Moonwell",
  // [SUPPORT_CHAIN_IDS.ARBITRUM_GOERLI]: "Aave",
  // [SUPPORT_CHAIN_IDS.MANTLE_TESTNET]: "Lendle",
  [SUPPORT_CHAIN_IDS.ARBITRUM]: "Pendle"
};
