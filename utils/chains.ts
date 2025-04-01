import { Chain } from 'wagmi'

type ExtendedChain = Chain & {
  hasIcon?: boolean;
  iconBackground?: string;
  iconUrl?: string;
}

export const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.base.org'] },
    default: { 
      http: [process.env.NEXT_PUBLIC_MORALIS_KEY_BASE || 'https://mainnet.base.org']
    },
  },
  blockExplorers: {
    etherscan: { name: 'BaseScan', url: 'https://basescan.org' },
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1376988,
    },
  },
  hasIcon: true,
  iconBackground: '#0052FF',
  iconUrl: '/icons/base-logo.svg',
} as const satisfies ExtendedChain
