import Image from "next/image";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { IProduct } from "../../types";
import { RecapCard } from "../commons/RecapCard";
import { ReturnsChart } from "../product/ReturnsChart";
import { PrimaryButton, SubtitleLight12 } from "../basic";
import { getCurrencyIcon, truncateAddress } from "../../utils/helpers";

export const NFTProductCard = ({ product, lots }: { product: IProduct; lots: number }) => {
  const router = useRouter();
  const { address } = useAccount();

  const { currency1, currency2 } = getCurrencyIcon(product.underlying);

  const onListNFT = async () => {
    if (product.status !== 3) {
      return toast.error("Your product is not issued yet. Please wait until issuance date.");
    }
    await router.push(`/portfolio/create/${product.address}`);
  };

  return (
    <div className={"flex flex-col p-6 md:py-11 md:px-12 rounded-[16px] bg-white"}>
      <div className={"flex items-center space-x-2"}>
        <div className={"relative flex items-center mr-[10px]"}>
          <Image src={currency1.toLowerCase()} className='rounded-full' alt='Product Logo' width={20} height={20} />
          <Image src={currency2.toLowerCase()} className='rounded-full absolute left-[10px]' alt='Product Logo' width={20} height={20} />
        </div>
        <span className={"text-grey-70 text-[20px]"}>{product.underlying}</span>
      </div>

      <span className={"text-blacknew-100 text-[32px] leading-[40px] mt-3"}>{product.name}</span>

      <div className={"mt-2 flex flex-col space-y-3"}>
        <RecapCard label={"Principal Amount - Lot(s)"} value={lots.toLocaleString() + (lots > 1 ? " Lots" : " Lot")} />
        {/* <RecapCard label={"Market Price"} value={"10,809 USDC"} /> */}
      </div>

      <div className={"mt-5"}>
        <ReturnsChart
          tr1={product.issuanceCycle.tr1}
          tr2={product.issuanceCycle.tr2}
          strikePrice1={product.issuanceCycle.strikePrice1}
          strikePrice2={product.issuanceCycle.strikePrice2}
          strikePrice3={product.issuanceCycle.strikePrice3}
          underlyingName={product.underlyingName}
          apy={product.issuanceCycle.apy}
        />
      </div>

      <div className={"my-5 flex items-center justify-between"}>
        <SubtitleLight12>Username</SubtitleLight12>
        <SubtitleLight12 className={"text-blacknew-100"}>{truncateAddress(address || "")}</SubtitleLight12>
      </div>

      <PrimaryButton label={"LIST NFT"} onClick={onListNFT} />
    </div>
  );
};
