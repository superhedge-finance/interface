import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { useNetwork,useAccount } from "wagmi";
import { ActionArea } from "../../components/product/ActionArea";
import { ParaLight16, SkeletonCard, SubtitleRegular20, TitleH2, TitleH3 } from "../../components/basic";
import { ReturnsChart } from "../../components/product/ReturnsChart";
import { getProduct } from "../../service";
import { PrincipalProtection, ProductDetailType, ProductSpreads, ProductStatus } from "../../types";
import { ActivityHeader, ActivityRow } from "../../components/commons/ActivityRow";
import Timeline from "../../components/product/Timeline";
import { getCurrencyIcon, formatStrikePrice, formatDuration, formatApy } from "../../utils/helpers";
import { RecapCard } from "../../components/commons/RecapCard";
import { RecapCardMobile } from "../../components/commons/RecapCardMobile";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";
import { DECIMAL, EXPLORER } from "../../utils/constants";
import Countdown from "react-countdown";
import axios from "../../service/axios";
import { RiskSection } from "../../components/product/RiskSection";

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

const ProductDetail = () => {
  const router = useRouter();
  const { chain } = useNetwork();
  const { address } = router.query;
  const { address: accountAddress } = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetailType | undefined>(undefined);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isBlurred, setIsBlurred] = useState(true);
  const [warningMessage, setWarningMessage] = useState("");
  const [timeLabel, setTimeLabel] = useState("");
  const [countdownDate, setCountdownDate] = useState<Date>(new Date());

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ETH;
  }, [chain]);

  const capacity = useMemo(() => {
    if (product) {
      return Math.round((Number(product.currentCapacity) / 10 ** DECIMAL[chainId]));
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

  const riskLinks = useMemo(() => {
    if (product?.risk) {
      return product.risk.split(',').map(link => link.trim());
    }
    return [];
  }, [product]);

  useEffect(() => {
    setIsLoading(true);

    getProduct(address as string, chainId)
      .then((product) => {
        setProduct(product);
        const timeUntilIssuance = (product?.issuanceCycle.issuanceDate * 1000) - Date.now();
        const timeLabel = timeUntilIssuance > 0 ? "Time until Live" : "Time to Maturity";
        const countdownDate = timeUntilIssuance > 0 
          ? Date.now() + timeUntilIssuance
          : Date.now() + ((product?.issuanceCycle.maturityDate * 1000) - Date.now());
        setTimeLabel(timeLabel);
        setCountdownDate(new Date(countdownDate));
      })
      .finally(() => setIsLoading(false));
  }, [address, chainId]);


  // ref code function
  useEffect(() => {
    (async () => {
      // console.log("check address");
      // console.log(accountAddress);
      const isVisible = false;
      const isBlurred = true;

      // if (accountAddress) {
      //   try {
      //     const results = await axios.post(`refcodes/check-whitelist?address=${accountAddress}`);
      //     if (results.data) {
      //       isVisible = false;
      //       isBlurred = false;
      //     }
      //     else{
      //       isVisible = true;
      //     }
      //   } catch (error) {
      //     console.error("Error checking whitelist:", error);
      //   }
      // }

      setIsPopupVisible(isVisible);
      setIsBlurred(isBlurred);
    })();
  }, [accountAddress, chainId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async() => {
    // console.log(inputValue)
    // console.log(address)
    if(inputValue && address)
    {
      const results = await axios.post(`/refcodes/signUp?refcode=${inputValue}&address=${address}`);
      // console.log(results.data)
      if (results.data)
      {
        setIsPopupVisible(false);
        setIsBlurred(false);
        setWarningMessage("");
        setInputValue("");
      }
      else {
        setWarningMessage("Wrong Code");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setIsPopupVisible(false);
    setInputValue("");
    setWarningMessage("");
  };


  return (
    <>
      {/* {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Enter Access Code</h2>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="border p-2 mb-2 w-full"
            />
            <div className="flex justify-between">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Confirm
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white p-2 rounded"
              >
                Cancel
              </button>
            </div>
            {warningMessage && (
              <p className="text-red-500 mt-2">{warningMessage}</p>
            )}
          </div>
        </div>
      )} */}
      {/* <div className={isBlurred ? 'filter blur-lg pointer-events-none' : ''}> */}
      <div className={''}>
        
        {isLoading && <SkeletonCard />}
        <div className={"grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 px-0 md:px-12 relative"}>
          <div className={"col-span-1"}>
            {!isLoading && product && (
              <div className='flex flex-col px-0 py-6 md:px-6'>
                <div>
                  <span className={`inline-block text-white text-sm px-4 py-3 rounded-lg ${ProductStatus[product.status].className}`}>
                    {ProductStatus[product.status].label}
                  </span>
                  <span className={`inline-block text-white text-sm ml-3 px-4 py-3 rounded-lg ${PrincipalProtection[0].className}`}>
                    {PrincipalProtection[0].label}
                  </span>
                  {categoryIndex >= 0 && (
                    <span className={`inline-block text-white text-sm ml-3 px-4 py-3 rounded-lg ${ProductSpreads[categoryIndex].className}`}>
                      {ProductSpreads[categoryIndex].label}
                    </span>
                  )}
                </div>
                <div className={"flex justify-between items-end my-5"}>
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
                      {/* <TitleH2 className='text-black'>{product.underlying}</TitleH2> */}
                      <TitleH2 className='text-black'>{product.currencyName}</TitleH2>
                      <SubtitleRegular20>{product.name}</SubtitleRegular20>
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
                    <span className='font-medium leading-tight text-3xl text-transparent bg-primary-gradient bg-clip-text'>
                      {product.issuanceCycle.apy}
                    </span>
                  </div>
                </div>
                <div className={"flex flex-col flex-1"}>
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
                  <div className='flex justify-between mb-2'>
                    <span className='text-sm text-gray-700'>Max</span>
                    <span className='text-sm text-gray-700'>{product.currencyName} {Number(product.maxCapacity.toString()).toLocaleString()}</span>
                  </div>
                </div>
                <div className={"block md:hidden"}>
                  <RecapCard label={"Est. APY"} value={(product.issuanceCycle.apy)} tooltip={"The APY range reflects guaranteed coupons and best-case option payouts net of fees."} />
                </div>

                <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Strategy</TitleH3>
                  {/* <ParaLight16>{product.vaultStrategy}</ParaLight16> */}
                  {/* <ParaLight16>
                    This N-Vault deploys {product.currencyName} deposits into{" "}
                    <a href={product.vaultStrategy} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                      PT {product.currencyName} Market
                    </a>{" "}
                    and integrates a long Call-Spread options strategy with {product.underlyingName}/USD underlying. Fixed-rate coupons are distributed to users according to the predefined schedule. At maturity, only the principal deposits auto-roll into pre-deposits for the next epoch. 100% Principal-Protection of {product.currencyName} deposits is guaranteed only at maturity.
                  </ParaLight16> */}
                  <p>
                    This N-Vault deploys {product.currencyName} deposits into Pendle&apos;s {" "}
                    <a href={product.vaultStrategy} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                      PT {product.currencyName} Market
                    </a>{" "}
                    and integrates a long &quot;out-of-the-money&quot; call-spread options strategy based on {product.underlyingName}/USD underlying.
                  </p>
                  <p>
                  Designed for users with a bullish view on {product.underlyingName}, the vault distributes fixed-rate coupons on a predefined schedule. At maturity, only the principal deposits are automatically rolled over into pre-deposits for the next epoch. 100% Principal-Protection of {product.currencyName} deposits is ensured only at maturity. Early withdrawals are permitted, subject to the minimum block size.
                  </p>
                </div>

                <div className={"flex flex-col mt-[80px]"}>
                  <TitleH3>Parameters</TitleH3>
                  <div
                    className={"md:flex flex-col md:flex-row items-center justify-between space-x-0 md:space-x-2 space-y-3 md:space-y-0 mt-5"}
                  >
                    <RecapCardMobile 
                      label={timeLabel} 
                      value={
                        <Countdown 
                          intervalDelay={60000} 
                          date={countdownDate}
                          renderer={issuance_date_renderer}
                        />
                      }
                    />
                    {/* <RecapCardMobile 
                      label="Time to Issuance" 
                      value={new Date(product.issuanceCycle.issuanceDate * 1000).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    /> */}
                    <RecapCardMobile label={"Maturity Date"} value={investment_duration} />
                    <RecapCard 
                      label="Coupon" 
                      value={`${product.issuanceCycle.coupon / 1000000}%`}
                      tooltip={product.couponTooltip}
                    />
                    
                  </div>
                  {/* <div className={"grid md:grid-cols-4 grid-cols-2 gap-2 mt-2"}> */}
                  <div
                    className={"md:flex flex-col md:flex-row items-center justify-between space-x-0 md:space-x-2 space-y-3 md:space-y-0 mt-5"}
                  >
                    <RecapCard 
                      label={"Block Size"} 
                      value={`${((product.issuanceCycle.optionMinOrderSize * product.issuanceCycle.underlyingSpotRef) / 10).toLocaleString()} ${product.currencyName}`} 
                    />
                    <RecapCard 
                      label={"Strike 1 price"} 
                      value={formatStrikePrice(product.issuanceCycle.strikePrice1)} 
                    />
                    <RecapCard 
                      label={"Strike 2 price"} 
                      value={formatStrikePrice(product.issuanceCycle.strikePrice2)} 
                    />
                    {/* <RecapCard label={"Strike 3 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice3)} />
                    <RecapCard label={"Strike 4 price"} value={formatStrikePrice(product.issuanceCycle.strikePrice4)} /> */}
                  </div>
                </div>

                {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Block Size: {(product.issuanceCycle.optionMinOrderSize * product.issuanceCycle.underlyingSpotRef)/10} {product.currencyName}</TitleH3>
                  
                </div> */}

                <div className={"mt-[80px]"}>
                  <TitleH3>Payoff</TitleH3>
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

                

                {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Product Lifecycle</TitleH3>
                  <Timeline issuance={product.issuanceCycle.issuanceDate} maturity={product.issuanceCycle.maturityDate} />
                </div> */}

                {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Risk</TitleH3>
                  <ParaLight16>{product.risk}</ParaLight16>
                </div> */}

                <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Risk</TitleH3>
                  <p>
                    <strong>{product.currencyName}</strong><br/>
                    {product.currencyName}, the supported asset for principal deposits and withdrawals, is a synthetic dollar issued by Ethena and is backed by delta-hedging derivatives positions in perpetual and futures markets. Users accept the full risk associated with its stability and performance. DYOR <a href={riskLinks[0]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">here</a>.
                  </p>

                  <p>
                    <strong>Third-party protocols</strong><br/>
                    Integration with protocols such as Pendle Finance (Principal-Token) for yield generation and structuring of 100% Principal-Protection of deposits introduces risks if these protocols encounter issues. Please DYOR <a href={riskLinks[1]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">here</a>.
                  </p>

                  <p>
                    <strong>Counterparty</strong><br/>
                    Execution of option strategies through CEXs and/or market makers introduces risks, including liquidation due to insufficient collateral or adverse market conditions, as well as risks of insolvency, default, or exchange failure.
                  </p>

                  <p>
                    <strong>Market</strong><br/>
                    Fluctuations in the market price of the options strategy and Pendle Finance&apos;s Principal-Token can impact returns. User accepts that in the indicative phase, parameters and est. APY may be updated ad hoc. Users accepts that early withdrawals may result in receiving less than their initial deposits.
                  </p>

                  <p>
                    <strong>On-Chain Security</strong><br/>
                    Vulnerabilities in smart contracts or on-chain operations could be exploited, leading to potential loss of funds. <a href={riskLinks[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">SuperHedge is audited by Halborn</a>
                  </p>

                  <p>
                    <strong>Network</strong><br/>
                    Users accept the risk of technical issues on the Ethereum blockchain, including forks or node problems, and SuperHedge is not responsible for any resulting losses.
                  </p>
                </div>

                {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Fees</TitleH3>
                  <ParaLight16>{product.fees} </ParaLight16>
                </div> */}

                {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
                  <TitleH3>Counterparties</TitleH3>
                  <ParaLight16>{product.counterparties}</ParaLight16>
                </div> */}

                {/* <div className={"mt-[80px] flex flex-col space-y-5"}>
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
                </div> */}
              </div>
            )}
          </div>
          {!isLoading && product && <ActionArea productAddress={product.address} product={product} />}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
