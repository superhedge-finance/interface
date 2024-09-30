import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useNetwork } from "wagmi";
import { ParaLight16, PrimaryButton, TitleH5 } from "../basic";
import { PositionCard } from "./PositionCard";
import { getPosition } from "../../service";
import { IProduct } from "../../types";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";

const ConnectWalletCard = ({ onConnect }: { onConnect: () => void }) => {
  return (
    <div className={"py-12 px-[112px] flex flex-col items-center bg-white rounded-lg"}>
      <Image src={"/icons/wallet.svg"} alt={"wallet"} width={48} height={48} />
      <TitleH5 className={"text-center mt-5"}>Please connect your Wallet to view your Positions.</TitleH5>
      <PrimaryButton label={"Connect Wallet"} className={"mt-5 max-w-[300px] uppercase"} onClick={onConnect} />
    </div>
  );
};

const NoPositionCard = () => {
  return (
    <div className={"py-12 px-[112px] flex flex-col items-center bg-white rounded-lg"}>
      <Image src={"/portfolio/no_positions.svg"} alt={"no_positions"} width={48} height={48} />
      <TitleH5 className={"text-center mt-5"}>You have not yet had a Position.</TitleH5>
      <ParaLight16 className={"text-grey-70 mt-3"}>Buy Products from the Products page</ParaLight16>
      <PrimaryButton label={"VIEW PRODUCTS"} className={"mt-5 max-w-[300px] uppercase"} />
    </div>
  );
};

export const PortfolioPositions = ({ enabled }: { enabled: boolean }) => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { openConnectModal } = useConnectModal();

  const [positions, setPositions] = useState<IProduct[]>([]);

  const onConnect = () => {
    if (!address && openConnectModal) {
      openConnectModal();
    }
  };

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ARBITRUM;
  }, [chain]);

  useEffect(() => {
    (async () => {
      if (address) {
        // fetch positions
        const positions = await getPosition(address, chainId);
        setPositions(positions);
      }
    })();
  }, [address, chainId]);

  return (
    <div>
      {!address && <ConnectWalletCard onConnect={onConnect} />}
      {address && positions.length === 0 && <NoPositionCard />}
      {address &&
        positions.length > 0 &&
        positions.map((position, index) => {
          return <PositionCard key={index} position={position} enabled={enabled} />;
        })}
    </div>
  );
};
