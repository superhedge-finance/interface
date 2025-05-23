import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { ProductSpreads, ProductStatus, ProductCategoryList, IProduct, PrincipalProtection } from "../../types";
import { ReturnsChart } from "../product/ReturnsChart";
import { getCurrencyIcon, formatDuration, formatApy } from "../../utils/helpers";
import { RecapCard } from "../commons/RecapCard";
import { RecapCardMobile } from "../commons/RecapCardMobile";

import { SubtitleRegular16, TitleH3 } from "../basic";
import Countdown from "react-countdown";
import { useNetwork, useSigner } from "wagmi";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";
import { DECIMAL, YIELD_SOURCE } from "../../utils/constants";
import ProductABI from "../../utils/abis/SHProduct.json";
import ERC20ABI from "../../utils/abis/ERC20.json";

export default function Product({ product }: { product: IProduct }) {
  const router = useRouter(); 
  const { data: signer } = useSigner()
  const { chain } = useNetwork();

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ETH;
  }, [chain]);

  // Create provider based on current chain
  const provider = useMemo(() => {
    if (chainId === SUPPORT_CHAIN_IDS.BASE) {
      return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_MORALIS_KEY_BASE);
    }
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_MORALIS_KEY_ETH);
  }, [chainId]);

  const [capacity, setCapacity] = useState<number>(0);

  useEffect(() => {
    const fetchCapacity = async () => {
      if (signer && product.address) {
        const productInstance = new ethers.Contract(product.address, ProductABI, signer);
        const _currentCapacity = await productInstance.currentCapacity();
        setCapacity(Math.round(Number(ethers.utils.formatUnits(_currentCapacity, DECIMAL[chainId]))));

        // console.log("productInstance.tokenAddress()", productInstance.tokenAddress());


        // const tokenInstance = new ethers.Contract(productInstance.tokenAddress(), ERC20ABI, signer);
        // const _totalSupply = await tokenInstance.totalSupply();
        // console.log("totalSupply", _totalSupply);
        // setCapacity(Math.round(Number(ethers.utils.formatUnits(_totalSupply, DECIMAL[chainId]))));

      } else {
        const productInstance = new ethers.Contract(product.address, ProductABI, provider);
        const _currentCapacity = await productInstance.currentCapacity();
        setCapacity(Math.round(Number(ethers.utils.formatUnits(_currentCapacity, DECIMAL[chainId]))));
        // setCapacity(Math.round((Number(product.currentCapacity) / 10 ** DECIMAL[chainId])));
        // const tokenInstance = new ethers.Contract(productInstance.currencyAddress(), ERC20ABI, signer);
        // const _totalSupply = await tokenInstance.balanceOf(product.address);
        // console.log("totalSupply", _totalSupply);
        // setCapacity(Math.round(Number(ethers.utils.formatUnits(_totalSupply, DECIMAL[chainId]))));
      }
    };

    fetchCapacity();
  }, [product, chainId, signer]);

  const categoryIndex = useMemo(() => {
    if (product.name.toLowerCase().includes("bullish")) {
      return 0;
    } else if (product.name.toLowerCase().includes("bearish")) {
      return 1;
    } else if (product.name.toLowerCase().includes("range")) {
      return 2;
    }
    return -1;
  }, [product]);

  const { currency1, currency2 } = getCurrencyIcon(product.underlying);
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
      return <span>0D : 0H</span>;
    } else {
      return <span>{`${days}D : ${hours}H`}</span>;
    }
  };

  const investment_duration = useMemo(() => {
    if (product) {
      const maturityDate = new Date(product.issuanceCycle.maturityDate * 1000);
      const issuanceDate = new Date(product.issuanceCycle.issuanceDate * 1000);
      const now = new Date();
      
      if (maturityDate > issuanceDate && product.status != 3) {
        const diffTime = Math.abs(issuanceDate.getTime() - maturityDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${maturityDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })} (${diffDays}D)`;
      }
      
      return maturityDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    return "N/A";
  }, [product]);

  const timeUntilIssuance = (product.issuanceCycle.issuanceDate * 1000) - Date.now();
  const timeLabel = timeUntilIssuance > 0 ? "Time until Live" : "Time to Maturity";
  const countdownDate = timeUntilIssuance > 0 
    ? Date.now() + timeUntilIssuance
    : Date.now() + ((product.issuanceCycle.maturityDate * 1000) - Date.now());

  return (
    <div
      className='flex flex-col p-5 cursor-pointer m-[15px] rounded-[12px] bg-white w-[340px] sm:w-[470px] drop-shadow hover:outline outline-2 outline-[#11CB79]'
      onClick={() => {router.push(`/product/${product.address}`)}}
    >
      <div className={"flex justify-between"}>
        <div className={"inline-block"}>
          <div className="flex flex-wrap gap-1">
            <span className={`text-white text-sm py-2 px-2 rounded-lg ${ProductStatus[product.status].className}`}>
              {ProductStatus[product.status].label}
            </span>
            <span className={`text-white text-sm py-2 px-2 rounded-lg ${PrincipalProtection[0].className}`}>
              {PrincipalProtection[0].label}
            </span>
            {categoryIndex >= 0 && (
              <span className={`text-white text-sm py-2 px-2 rounded-lg ${ProductSpreads[categoryIndex].className}`}>
                {ProductSpreads[categoryIndex].label}
              </span>
            )}
            {categoryIndex >= 0 && (
              <span className={`text-white text-sm py-2 px-2 rounded-lg ${ProductSpreads[categoryIndex].className}`}>
                {ProductCategoryList[categoryIndex + 1]}
              </span>
            )}
          </div>
        </div>
        {/* <div className={"hidden sm:block w-[40px] md:w-[60px] h-[36px] md:h-[54px]"}>
          <img src={"/icons/social_logo.svg"} alt={"social logo"} width={"100%"} height={"100% "} />
        </div> */}
      </div>
      <div className={"flex justify-between items-end my-5 md:my-4"}>
        <div className='flex flex-row'>
          {/* <div className={"relative flex items-center mr-[40px]"}> */}
          <div className={"relative flex items-center justify-center"}>
            <img
              src={currency1}
              className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px]'
              alt='Product Logo'
              width={"100%"}
              height={"100%"}
            />
            {/* <img
              src={currency2}
              className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px] absolute left-[30px] md:left-[40px]'
              alt='Product Logo'
              width={"100%"}
              height={"100%"}
            /> */}
          </div>
          <div className='flex flex-col justify-around ml-3'>
            {/* <TitleH3 className='text-black'>{product.underlying}</TitleH3> */}
            <TitleH3 className='text-black'>{product.currencyName}</TitleH3>
            <SubtitleRegular16>{product.name}</SubtitleRegular16>
          </div>
        </div>
        <div className={"hidden md:flex flex-col items-center"}>
        <div className='flex items-center mb-1'>
          <span className='d-block text-sm font-normal text-gray-700 dark:text-gray-400 mr-1'>Est. APY</span>
          <div className="group relative flex justify-end">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8.5C6.14167 8.5 6.2605 8.452 6.3565 8.356C6.45217 8.26033 6.5 8.14167 6.5 8V5.9875C6.5 5.84583 6.45217 5.72917 6.3565 5.6375C6.2605 5.54583 6.14167 5.5 6 5.5C5.85833 5.5 5.73967 5.54783 5.644 5.6435C5.548 5.7395 5.5 5.85833 5.5 6V8.0125C5.5 8.15417 5.548 8.27083 5.644 8.3625C5.73967 8.45417 5.85833 8.5 6 8.5ZM6 4.5C6.14167 4.5 6.2605 4.452 6.3565 4.356C6.45217 4.26033 6.5 4.14167 6.5 4C6.5 3.85833 6.45217 3.7395 6.3565 3.6435C6.2605 3.54783 6.14167 3.5 6 3.5C5.85833 3.5 5.73967 3.54783 5.644 3.6435C5.548 3.7395 5.5 3.85833 5.5 4C5.5 4.14167 5.548 4.26033 5.644 4.356C5.73967 4.452 5.85833 4.5 6 4.5ZM6 11C5.30833 11 4.65833 10.8687 4.05 10.606C3.44167 10.3437 2.9125 9.9875 2.4625 9.5375C2.0125 9.0875 1.65633 8.55833 1.394 7.95C1.13133 7.34167 1 6.69167 1 6C1 5.30833 1.13133 4.65833 1.394 4.05C1.65633 3.44167 2.0125 2.9125 2.4625 2.4625C2.9125 2.0125 3.44167 1.65617 4.05 1.3935C4.65833 1.13117 5.30833 1 6 1C6.69167 1 7.34167 1.13117 7.95 1.3935C8.55833 1.65617 9.0875 2.0125 9.5375 2.4625C9.9875 2.9125 10.3437 3.44167 10.606 4.05C10.8687 4.65833 11 5.30833 11 6C11 6.69167 10.8687 7.34167 10.606 7.95C10.3437 8.55833 9.9875 9.0875 9.5375 9.5375C9.0875 9.9875 8.55833 10.3437 7.95 10.606C7.34167 10.8687 6.69167 11 6 11ZM6 10C7.10833 10 8.05217 9.6105 8.8315 8.8315C9.6105 8.05217 10 7.10833 10 6C10 4.89167 9.6105 3.94783 8.8315 3.1685C8.05217 2.3895 7.10833 2 6 2C4.89167 2 3.948 2.3895 3.169 3.1685C2.38967 3.94783 2 4.89167 2 6C2 7.10833 2.38967 8.05217 3.169 8.8315C3.948 9.6105 4.89167 10 6 10Z" fill="#677079"/>
            </svg>
            <span className="absolute bottom-5 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap">
                The APY range reflects guaranteed coupons and best-case option payouts net of fees.
            </span>
          </div>
        </div>
          <h3 className='font-medium leading-tight text-3xl bg-clip-text text-transparent bg-primary-gradient'>
            {/* {formatApy(product.issuanceCycle.apy)} */}
            {product.issuanceCycle.apy}
          </h3>
        </div>
      </div>
      <div className={"flex flex-col"}>
        <div className='flex justify-between my-1'>
          <span className='text-sm text-gray-700'>Total deposited</span>
          <span className='text-sm text-gray-700'>{product.currencyName} {capacity.toLocaleString()}</span>
        </div>
        <div className='w-full bg-[#00000014] rounded my-1'>
          <div
            className='bg-gray-600 h-2 rounded'
            style={{
              width: (capacity / Number(product.maxCapacity)) * 100 + "%",
              background: "linear-gradient(267.56deg, #11CB79 14.55%, #11A692 68.45%, #002366 136.67%)"
            }}
          ></div>
        </div>
        {/* <div className='flex justify-between mb-2'>
          <span className='text-sm text-gray-700'>Max</span>
          <span className='text-sm text-gray-700'>USDC {Number(product.maxCapacity.toString()).toLocaleString()}</span>
        </div> */}
      </div>
      
      <div className={"block md:hidden"}>
        <RecapCard label={"Est. APY %"} value={product.issuanceCycle.apy} tooltip={"The APY range reflects guaranteed coupons and best-case option payouts net of fees."} />
      </div>

      <div>
        <ReturnsChart
          strikePrice1={product.issuanceCycle.strikePrice1}
          strikePrice2={product.issuanceCycle.strikePrice2}
          strikePrice3={product.issuanceCycle.strikePrice3}
          tr1={product.issuanceCycle.tr1}
          tr2={product.issuanceCycle.tr2}
          underlyingName={product.underlyingName}
          apy={product.issuanceCycle.apy}
        />
      </div>

      <div className={"flex-col md:flex-row md:flex space-y-3 md:space-y-0 md:space-x-2 items-center justify-between mt-3"}>
        <RecapCardMobile 
          label={timeLabel} 
          value={
            <Countdown 
              intervalDelay={60000} 
              date={countdownDate}
              renderer={issuance_date_renderer}
            />
          }
          className="whitespace-nowrap"
        ></RecapCardMobile>
        <RecapCardMobile 
          label={"Maturity Date"} 
          value={investment_duration}
          className="whitespace-nowrap"
        ></RecapCardMobile>
        <RecapCard 
          label="Coupon" 
          value={`${product.issuanceCycle.coupon / 1000000}%`}
          tooltip={product.couponTooltip}
          className="whitespace-pre-wrap !w-[160px]"
        />
      </div>

      {/* <div className={"flex-row flex space-x-2 items-center justify-center mt-3"}>
        <div className={"flex items-center w-[24px] md:w-[30px] h-[28px] md:h-[36px]"}>   
          <img src={"/products/" + 'aUSDC' + "_logo.svg"} alt={"social logo"} width={"100%"} height={"100%"} />
        </div>
        <div className={"flex items-center w-[24px] md:w-[30px] h-[28px] md:h-[36px]"}>   
          <img src={"/products/" + YIELD_SOURCE?.[chainId]?.toLowerCase() + "_logo.svg"} alt={"social logo"} width={"100%"} height={"100%"} />
        </div>
        <div>
          <span className="text-sm font-normal text-gray-700 dark:text-gray-400">Principal-Protected by</span>&nbsp;
          <span className="text-sm font-bold">{YIELD_SOURCE[chainId]}</span>
        </div>
      </div> */}
    </div>
  );
}