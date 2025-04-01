import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Chain, RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
// import { mainnet, base } from "wagmi/chains";

import {mainnet} from "@wagmi/core/chains"
import { base } from "../utils/chains"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { Chart as ChartJS, Title, Tooltip, Legend, Filler, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import Layout from "./Layout";
import { ToastProvider } from "./providers/ToastProvider";
import { ethers } from "ethers";

interface CustomDisclaimerProps {
  Text: React.FC<{ children: React.ReactNode }>;
  Link: React.FC<{ children: React.ReactNode; href: string }>;
}

const CustomDisclaimer: React.FC<CustomDisclaimerProps> = ({ Text, Link }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className="p-4">
      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="tosCheckbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          className="h-4 w-4"
        />
        <label htmlFor="tosCheckbox" className="text-sm text-gray-700">
          By connecting, you agree to the <Link href="https://docs.superhedge.com/other-resources/terms-of-use"><span className="text-blue-600 hover:underline">Terms of Service</span></Link> and <Link href="https://docs.superhedge.com/other-resources/privacy-policy"><span className="text-blue-600 hover:underline">Privacy Policy</span></Link>
        </label>
      </div>
    </div>
  );
};

ChartJS.register(Title, Tooltip, Legend, Filler, LineElement, CategoryScale, LinearScale, PointElement);

// const { chains, provider, webSocketProvider } = configureChains(
//   [...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS == "true" ? [mainnet,base] : [mainnet,base])],
//   [
//     jsonRpcProvider({
//       rpc: () => ({
//         http: process.env.NEXT_PUBLIC_MORALIS_KEY_ETH || "",
//       }),
//     }),
//     jsonRpcProvider({
//       rpc: () => ({
//         http: process.env.NEXT_PUBLIC_MORALIS_KEY_BASE || "",
//       }),
//     }),
//     publicProvider()
//   ]
// );

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet, base],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: process.env.NEXT_PUBLIC_MORALIS_KEY_ETH || "",
      }),
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: process.env.NEXT_PUBLIC_MORALIS_KEY_BASE || "",
      }),
    }),
    publicProvider()
  ]
);

// const { chains, provider, webSocketProvider } = configureChains(
//   [mainnet],
//   [
//     jsonRpcProvider({
//       rpc: () => ({
//         http: process.env.NEXT_PUBLIC_MORALIS_KEY_ETH || "",
//       }),
//     }),
//     publicProvider()
//   ]
// );



const { connectors } = getDefaultWallets({
  appName: "Superhedge demo",
  projectId: "0f25c8492be6871ba255feddab3b75e3",
  chains
});

const demoAppInfo = {
  appName: "Superhedge Demo",
  disclaimer: CustomDisclaimer
};

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider
});

function App({ children }: { children?: React.ReactNode }) {
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
