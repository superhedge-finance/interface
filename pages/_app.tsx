import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { GoogleAnalytics } from '@next/third-parties/google';

const AppWithoutSSR = dynamic(() => import("../components/App"), {
  ssr: false
});

function AppWrapper({ Component, pageProps }: AppProps) {
  return (
    <AppWithoutSSR>
      <Component {...pageProps} />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_MEASUREMENT_ID ?? ''} />
    </AppWithoutSSR>
  );
}

export default AppWrapper;
