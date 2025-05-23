import { ParaLight16, SkeletonCard, TitleH3 } from "../../../components/basic";
import { IProduct, ProductSpreads, ProductStatus } from "../../../types";
import Image from "next/image";
import { ActionArea } from "../../../components/product/ActionArea";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getProduct } from "../../../service";
import { RecapCard } from "../../../components/commons/RecapCard";
import { NFTProductCard } from "../../../components/portfolio/NFTProductCard";
import ProductABI from "../../../utils/abis/SHProduct.json";
import { useAccount, useNetwork, useSigner } from "wagmi";
import Timeline from "../../../components/product/Timeline";
import { SUPPORT_CHAIN_IDS } from "../../../utils/enums";
import { DECIMAL } from "../../../utils/constants";
import { formatStrikePrice } from "../../../utils/helpers";
import Countdown from "react-countdown";

const issuance_date_renderer = ({
  days,
  hours,
  minutes,
  completed
}: {
  days: number;
  hours: number;
  minutes: number;
  completed: boolean;
}) => {
  if (completed) {
    return <span>{`${days}D : ${hours}H : ${minutes}M`}</span>;
  } else {
    return <span>{`${days}D : ${hours}H : ${minutes}M`}</span>;
  }
};

const PositionDetail = () => {
  const router = useRouter();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { address: productAddress } = router.query;

  const [principal, setPrincipal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<IProduct | undefined>(undefined);

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ETH;
  }, [chain]);

  const currency1 = useMemo(() => {
    if (product) {
      return "/currency/" + product.underlying.split("/")[1] + ".svg";
    }
    return "/currency/usdc.svg";
  }, [product]);

  const currency2 = useMemo(() => {
    if (product) {
      return "/currency/" + product.underlying.split("/")[0] + ".svg";
    }
    return "/currency/eth.svg";
  }, [product]);

  const categoryIndex = useMemo(() => {
    if (product && product.name.toLowerCase().includes("bullish")) {
      return 0;
    } else if (product && product.name.toLowerCase().includes("bearish")) {
      return 1;
    } else if (product && product.name.toLowerCase().includes("range")) {
      return 2;
    }
    return -1;
  }, [product]);

  const productInstance = useMemo(() => {
    if (signer && productAddress) return new ethers.Contract(productAddress as string, ProductABI, signer);
    else return null;
  }, [signer, productAddress]);

  useEffect(() => {
    setIsLoading(true);
    getProduct(productAddress as string, chainId)
      .then((product) => {
        if (!product) {
          window.location.href = "/";
        } else {
          setProduct(product);
        }
      })
      .finally(() => setIsLoading(false));
  }, [productAddress, chainId]);

  useEffect(() => {
    (async () => {
      if (productInstance && address) {
        const balance = await productInstance.principalBalance(address);
        setPrincipal(Number(ethers.utils.formatUnits(balance, DECIMAL[chainId])));
      }
    })();
  }, [productInstance, address, chainId]);

  return (
    <div>
      {isLoading && <SkeletonCard />}
      <div className={"grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 px-0 md:px-12 relative"}>
        <div className={"col-span-1"}>
          {!isLoading && product && (
            <div className='flex flex-col p-6'>
              <div className={"flex flex-col xl:flex-row xl:justify-between"}>
                <TitleH3 className={"bg-primary-gradient bg-clip-text text-transparent mb-3"}>Position Details</TitleH3>
                <div>
                  <span className={`inline-block text-white text-sm py-2 px-3 rounded-lg ${ProductStatus[product.status].className}`}>
                    {ProductStatus[product.status].label}
                  </span>
                  {categoryIndex >= 0 && (
                    <span className={`inline-block text-white text-sm ml-3 px-4 py-2 rounded-lg ${ProductSpreads[categoryIndex].className}`}>
                      {ProductSpreads[categoryIndex].label}
                    </span>
                  )}
                </div>
              </div>
              <div className={"flex justify-between items-end my-5"}>
                <div className='flex flex-row'>
                  <div className={"relative flex items-center mr-[40px]"}>
                    <Image src={currency1.toLowerCase()} className='rounded-full' alt='Product Logo' width={60} height={60} />
                    <Image
                      src={currency2.toLowerCase()}
                      className='rounded-full absolute left-[40px]'
                      alt='Product Logo'
                      width={60}
                      height={60}
                    />
                  </div>
                  <div className='flex flex-col justify-around ml-3'>
                    <h5 className='text-[44px] text-black'>{product.underlying}</h5>
                    <span className='text-[20px] font-light text-gray-700'>{product.name}</span>
                  </div>
                </div>
                <div className={"flex flex-col items-center"}>
                  <div className='flex items-center mb-1'>
                    <span className='d-block text-sm font-normal text-gray-700 dark:text-gray-400 mr-1'>Est. APY</span>
                    <div className="group relative flex justify-end">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 8.5C6.14167 8.5 6.2605 8.452 6.3565 8.356C6.45217 8.26033 6.5 8.14167 6.5 8V5.9875C6.5 5.84583 6.45217 5.72917 6.3565 5.6375C6.2605 5.54583 6.14167 5.5 6 5.5C5.85833 5.5 5.73967 5.54783 5.644 5.6435C5.548 5.7395 5.5 5.85833 5.5 6V8.0125C5.5 8.15417 5.548 8.27083 5.644 8.3625C5.73967 8.45417 5.85833 8.5 6 8.5ZM6 4.5C6.14167 4.5 6.2605 4.452 6.3565 4.356C6.45217 4.26033 6.5 4.14167 6.5 4C6.5 3.85833 6.45217 3.7395 6.3565 3.6435C6.2605 3.54783 6.14167 3.5 6 3.5C5.85833 3.5 5.73967 3.54783 5.644 3.6435C5.548 3.7395 5.5 3.85833 5.5 4C5.5 4.14167 5.548 4.26033 5.644 4.356C5.73967 4.452 5.85833 4.5 6 4.5ZM6 11C5.30833 11 4.65833 10.8687 4.05 10.606C3.44167 10.3437 2.9125 9.9875 2.4625 9.5375C2.0125 9.0875 1.65633 8.55833 1.394 7.95C1.13133 7.34167 1 6.69167 1 6C1 5.30833 1.13133 4.65833 1.394 4.05C1.65633 3.44167 2.0125 2.9125 2.4625 2.4625C2.9125 2.0125 3.44167 1.65617 4.05 1.3935C4.65833 1.13117 5.30833 1 6 1C6.69167 1 7.34167 1.13117 7.95 1.3935C8.55833 1.65617 9.0875 2.0125 9.5375 2.4625C9.9875 2.9125 10.3437 3.44167 10.606 4.05C10.8687 4.65833 11 5.30833 11 6C11 6.69167 10.8687 7.34167 10.606 7.95C10.3437 8.55833 9.9875 9.0875 9.5375 9.5375C9.0875 9.9875 8.55833 10.3437 7.95 10.606C7.34167 10.8687 6.69167 11 6 11ZM6 10C7.10833 10 8.05217 9.6105 8.8315 8.8315C9.6105 8.05217 10 7.10833 10 6C10 4.89167 9.6105 3.94783 8.8315 3.1685C8.05217 2.3895 7.10833 2 6 2C4.89167 2 3.948 2.3895 3.169 3.1685C2.38967 3.94783 2 4.89167 2 6C2 7.10833 2.38967 8.05217 3.169 8.8315C3.948 9.6105 4.89167 10 6 10Z" fill="#677079"/>
                      </svg>
                      <span className="absolute bottom-5 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 w-[250px]">
                        {product.estimatedApy}
                      </span>
                    </div>
                  </div>
                  <span className='font-medium leading-tight text-3xl text-transparent bg-primary-gradient bg-clip-text'>
                    {product.issuanceCycle.apy}
                  </span>
                </div>
              </div>

              <div className={"flex flex-col mt-[80px]"}>
                <TitleH3>Parameters</TitleH3>
                <div className={"flex items-center justify-between space-x-2 mt-5"}>
                  <div className={`flex flex-col flex-1 items-center bg-[#0000000a] h-[66px] rounded-[7px] py-3 px-4`}>
                    <p className='text-[12px] font-light text-gray-700'>{product.status == 3 ? "Time to Maturity" : "Time to Issuance"}</p>
                    <h3 className='text-[18px] font-light text-black'>
                      <Countdown
                        intervalDelay={60000}
                        date={(product.status == 3 ? product.issuanceCycle.maturityDate : product.issuanceCycle.issuanceDate) * 1000}
                        renderer={issuance_date_renderer}
                      />
                    </h3>
                  </div>
                  <RecapCard label={"Coupon"} value={`${product.issuanceCycle.coupon / 10000}%`} />



                </div>
                <div className={"flex items-center justify-between space-x-2 mt-2"}>
                  <RecapCard label={"Principal Amount"} value={`${principal.toLocaleString()} USDC`} />
                  <RecapCard label={"Product Lots"} value={`${principal / 1000} LOTS`} />
                  <RecapCard label={"Market Price"} value={"8,000 USDC"} />
                </div>
                <div className={"flex items-center justify-between space-x-2 mt-2"}>
                  <RecapCard label={"Strike 1 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice1)} />
                  <RecapCard label={"Strike 2 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice2)} />
                  <RecapCard label={"Principal Protection"} value={"100%"} />
                  {/* <RecapCard label={"Strike 3 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice3)} />
                  <RecapCard label={"Strike 4 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice4)} /> */}
                </div>
              </div>

              {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Product Lifecycle</TitleH3>
                <Timeline issuance={product.issuanceCycle.issuanceDate} maturity={product.issuanceCycle.maturityDate} />
              </div> */}

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>NFT Product</TitleH3>
                <ParaLight16>
                  You can withdraw your funds before Maturity date using ‘Marketplace’. Since each product is the actually minted in a form
                  of NFT, you can do P2P trading of the products owned. Just list your NFT on Marketplace.
                </ParaLight16>
                <NFTProductCard product={product} lots={principal / 1000} />
              </div>
            </div>
          )}
        </div>
        {!isLoading && product && <ActionArea productAddress={product.address} product={product} />}
      </div>
    </div>
  );
};

export default PositionDetail;
