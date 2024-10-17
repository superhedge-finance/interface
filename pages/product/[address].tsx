import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useNetwork } from "wagmi";
import { ActionArea } from "../../components/product/ActionArea";
import { ParaLight16, SkeletonCard, SubtitleRegular20, TitleH2, TitleH3 } from "../../components/basic";
import { ReturnsChart } from "../../components/product/ReturnsChart";
import { getProduct } from "../../service";
import { ProductDetailType, ProductSpreads, ProductStatus } from "../../types";
import { ActivityHeader, ActivityRow } from "../../components/commons/ActivityRow";
import Timeline from "../../components/product/Timeline";
import { getCurrencyIcon, formatStrikePrice, formatDuration } from "../../utils/helpers";
import { RecapCard } from "../../components/commons/RecapCard";
import { RecapCardMobile } from "../../components/commons/RecapCardMobile";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";
import { DECIMAL, EXPLORER } from "../../utils/constants";
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

const ProductDetail = () => {
  const router = useRouter();
  const { chain } = useNetwork();
  const { address } = router.query;

  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetailType | undefined>(undefined);

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ARBITRUM;
  }, [chain]);

  const capacity = useMemo(() => {
    if (product) {
      return Number(ethers.utils.formatUnits(product.currentCapacity, DECIMAL[chainId]));
    }
    return 0;
  }, [product, chainId]);

  const currency1 = useMemo(() => {
    if (product) {
      return getCurrencyIcon(product.underlying).currency1;
    }
    return "/currency/usdc.svg";
  }, [product]);

  const currency2 = useMemo(() => {
    if (product) {
      return getCurrencyIcon(product.underlying).currency2;
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

  const investment_duration = useMemo(() => {
    if (product) {
      const duration = product.issuanceCycle.maturityDate - product.issuanceCycle.issuanceDate;
      return formatDuration(duration);
    }
    return "0D : 0H";
  }, [product]);

  useEffect(() => {
    setIsLoading(true);
    getProduct(address as string, chainId)
      .then((product) => {
        setProduct(product);
      })
      .finally(() => setIsLoading(false));
  }, [address, chainId]);

  return (
    <div>
      {isLoading && <SkeletonCard />}
      <div className={"grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 px-0 md:px-12 relative"}>
        <div className={"col-span-1"}>
          {!isLoading && product && (
            <div className='flex flex-col px-0 py-6 md:px-6'>
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
              <div className={"flex justify-between items-end my-5"}>
                <div className='flex flex-row'>
                  <div className={"relative flex items-center mr-[40px]"}>
                    <img
                      src={currency1}
                      className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px]'
                      alt='Product Logo'
                      width={"100%"}
                      height={"100%"}
                    />
                    <img
                      src={currency2}
                      className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px] absolute left-[30px] md:left-[40px]'
                      alt='Product Logo'
                      width={"100%"}
                      height={"100%"}
                    />
                  </div>
                  <div className='flex flex-col justify-around ml-3'>
                    <TitleH2 className='text-black'>{product.underlying}</TitleH2>
                    <SubtitleRegular20>{product.name}</SubtitleRegular20>
                  </div>
                </div>
                <div className={"hidden md:flex flex-col items-center"}>
                  <div className='flex items-center mb-1'>
                    <span className='d-block text-sm font-normal text-gray-700 dark:text-gray-400 mr-1'>Estimated APY</span>
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
              <div className={"flex flex-col flex-1"}>
                <div className='flex justify-between my-1'>
                  <span className='text-sm text-gray-700'>Amount deposited</span>
                  <span className='text-sm text-gray-700'>USDC {capacity.toLocaleString()}</span>
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
                <div className='flex justify-between mb-2'>
                  <span className='text-sm text-gray-700'>Max</span>
                  <span className='text-sm text-gray-700'>USDC {Number(product.maxCapacity.toString()).toLocaleString()}</span>
                </div>
              </div>
              <div className={"block md:hidden"}>
                <RecapCard label={"Estimated APY"} value={product.issuanceCycle.apy} />
              </div>

              <div className={"flex flex-col mt-[80px]"}>
                <TitleH3>Product Recap</TitleH3>
                <div
                  className={"md:flex flex-col md:flex-row items-center justify-between space-x-0 md:space-x-2 space-y-3 md:space-y-0 mt-5"}
                >
                  <RecapCardMobile label={product.status == 3 ? "Time to Maturity" : "Time to Issuance"} value={
                    <Countdown 
                      intervalDelay={60000} 
                      date={(product.status == 3 ? product.issuanceCycle.maturityDate : product.issuanceCycle.issuanceDate) * 1000} 
                      renderer={issuance_date_renderer} 
                    />}
                  />
                  <RecapCardMobile label={"Investment Duration"} value={investment_duration} />
                  <RecapCardMobile label={"Coupon"} value={`${product.issuanceCycle.coupon / 100}% / WEEK`} />
                  <RecapCardMobile label={"Principal Protection"} value={"100%"} />
                </div>
                <div className={"grid md:grid-cols-4 grid-cols-2 gap-2 mt-2"}>
                  <RecapCard label={"Strike 1 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice1)} />
                  <RecapCard label={"Strike 2 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice2)} />
                  <RecapCard label={"Strike 3 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice3)} />
                  <RecapCard label={"Strike 4 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice4)} />
                </div>
              </div>

              <div className={"mt-[80px]"}>
                <TitleH3>Product Returns</TitleH3>
                <ReturnsChart
                  strikePrice1={product.issuanceCycle.strikePrice1}
                  strikePrice2={product.issuanceCycle.strikePrice2}
                  strikePrice3={product.issuanceCycle.strikePrice3}
                  tr1={product.issuanceCycle.tr1}
                  tr2={product.issuanceCycle.tr2}
                />
              </div>

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Vault Strategy</TitleH3>
                <ParaLight16>{product.vaultStrategy}</ParaLight16>
              </div>

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Product Lifecycle</TitleH3>
                <Timeline issuance={product.issuanceCycle.issuanceDate} maturity={product.issuanceCycle.maturityDate} />
                {/*<img src={'/portfolio/product_lifecycle.svg'} alt={'lifecycle'} width={'100%'} />*/}
              </div>

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Risk</TitleH3>
                <ParaLight16>{product.risk}</ParaLight16>
              </div>

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Fees</TitleH3>
                <ParaLight16>{product.fees} </ParaLight16>
              </div>

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Counterparties</TitleH3>
                <ParaLight16>{product.counterparties}</ParaLight16>
              </div>

              <div className={"mt-[80px] flex flex-col space-y-5"}>
                <TitleH3>Deposit Activity</TitleH3>
                <div className={"bg-white py-[30px] px-5 rounded-lg"}>
                  <ActivityHeader />
                  {product.deposits.map((activity, index) => {
                    return (
                      <ActivityRow
                        key={index}
                        activity={activity}
                        className={index % 2 === 0 ? "bg-[#00000014]" : "bg-white"}
                        blockExplorer={EXPLORER[chainId]}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        {!isLoading && product && <ActionArea productAddress={product.address} product={product} />}
      </div>
    </div>
  );
};

export default ProductDetail;
