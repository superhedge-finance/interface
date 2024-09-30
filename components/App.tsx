import React from "react";
import { Toaster } from "react-hot-toast";
import { Chain, RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { goerli, moonbaseAlpha, arbitrumGoerli,arbitrum } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { Chart as ChartJS, Title, Tooltip, Legend, Filler, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import Layout from "./Layout";
import { ToastProvider } from "./providers/ToastProvider";

ChartJS.register(Title, Tooltip, Legend, Filler, LineElement, CategoryScale, LinearScale, PointElement);

const mantleTestnet: Chain = {
  id: 5_001,
  name: 'Mantle Testnet',
  network: 'mantleTestnet',
  iconUrl: 'https://i.imgur.com/Q3oIdip.png',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle Token',
    symbol: 'MNT',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.mantle.xyz/'] },
    default: { http: ['https://rpc.testnet.mantle.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.testnet.mantle.xyz/' },
    etherscan: { name: 'Mantle Explorer', url: 'https://explorer.testnet.mantle.xyz/' },
  },
  contracts: {
    multicall3: {
      address: '0x4Af866539734dd29E921105fb1EbA521e77e8Eb4',
      blockCreated: 3_501_011,
    },
  },
  testnet: true,
};

const { chains, provider, webSocketProvider } = configureChains(
  [...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS == "true" ? [arbitrum] : [])],
  [
    // alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY_ARBITRUM || "" }),

    jsonRpcProvider({
      rpc: () => {
        return {
          http: process.env.NEXT_PUBLIC_MORALIS_KEY_ARBITRUM || "",
        };
      },
    }),

    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Superhedge demo",
  projectId: "0f25c8492be6871ba255feddab3b75e3",
  chains
});

const demoAppInfo = {
  appName: "Superhedge Demo"
};

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider
});

type AppProps = {
  children?: React.ReactNode;
};

function App({ children }: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider appInfo={demoAppInfo} chains={chains}>
        <ToastProvider>
          <Layout>{children}</Layout>
        </ToastProvider>
        <Toaster position='top-right' />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
