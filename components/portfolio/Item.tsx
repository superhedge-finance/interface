// import { useMemo } from "react";
// import { useRouter } from "next/router";
// import { SubtitleRegular16, TitleH3} from "../basic";
// import { RecapCard } from "../commons/RecapCard";
// import { ReturnsChart } from "../product/ReturnsChart";
// import { MarketplaceItemFullType, ProductSpreads, ProductCategoryList } from "../../types";
// import { getCurrencyIcon } from "../../utils/helpers";

// const PortfolioListingItem = ({ item }: { item: MarketplaceItemFullType }) => {
//   const router = useRouter();

//   const { currency1, currency2 } = getCurrencyIcon(item.underlying);

//   const offerStartSince = useMemo(() => {
//     if (item) {
//       const date = new Date(item.startingTime * 1000);
//       return date.toLocaleDateString();
//     }
//     return "";
//   }, [item]);

//   const categoryIndex = useMemo(() => {
//     if (item.name.toLowerCase().includes("bullish")) {
//       return 0;
//     } else if (item.name.toLowerCase().includes("bearish")) {
//       return 1;
//     } else if (item.name.toLowerCase().includes("range")) {
//       return 2;
//     }
//     return -1;
//   }, [item]);

//   return (
//     <div 
//       className={"flex flex-col p-6 cursor-pointer m-[15px] rounded-[12px] bg-white w-[350px] sm:w-[470px] drop-shadow hover:outline outline-2 outline-greenHover"}
//       onClick={() => router.push(`/portfolio/nft/${item.listingId}`)}
//     >
//       <div className={"flex justify-between"}>
//         <div className={"inline-block"}>
//           {categoryIndex >= 0 && (
//             <span className={`text-white text-sm mr-2 py-2 px-3 rounded-lg ${ProductSpreads[categoryIndex].className}`}>
//               {ProductSpreads[categoryIndex].label}
//             </span>
//           )}
//           {categoryIndex >= 0 && (
//             <span className={`text-white text-sm py-2 px-3 rounded-lg ${ProductSpreads[categoryIndex].className}`}>
//               {ProductCategoryList[categoryIndex + 1]}
//             </span>
//           )}
//         </div>
//         <div className={"hidden sm:block w-[40px] md:w-[60px] h-[36px] md:h-[54px]"}>
//           <img src={"/icons/social_logo.svg"} alt={"social logo"} width={"100%"} height={"100% "} />
//         </div>
//       </div>
//       <div className='flex flex-row my-5 md:my-4'>
//         <div className={"relative flex items-center mr-[40px]"}>
//           <img
//             src={currency1}
//             className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px]'
//             alt='currency1 logo'
//             width={"100%"}
//             height={"100%"}
//           />
//           <img
//             src={currency2}
//             className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px] absolute left-[30px] md:left-[40px]'
//             alt='currency2 logo'
//             width={"100%"}
//             height={"100%"}
//           />
//         </div>
//         <div className='flex flex-col justify-around ml-3'>
//           <TitleH3 className='text-black'>{item.underlying}</TitleH3>
//           <SubtitleRegular16>{item.name}</SubtitleRegular16>
//         </div>
//       </div>

//       <div className={"mt-2 py-3 px-4 w-full rounded-lg bg-[rgba(0,0,0,0.04)] flex flex-col items-center justify-center space-y-2"}>
//         <span className={"text-grey-70 text-[12px] leading-[12px]"}>Price - Lots</span>
//         <div className={"flex items-center text-[16px] leading-[16px] space-x-2 uppercase"}>
//           <span className={"bg-primary-gradient bg-clip-text text-transparent"}>
//             {item.offerPrice.toLocaleString()} USDC {"(" + item.quantity + " LOTS)"}
//           </span>
//         </div>
//       </div>

//       <div className={"mt-3 flex items-center space-x-3"}>
//         <RecapCard label={"Market Price"} value={`${item.mtmPrice ? item.mtmPrice.toLocaleString() : 0} USDC`} />
//         <RecapCard label={"Offer start since"} value={offerStartSince} />
//       </div>

//       <div>
//         <ReturnsChart
//           tr1={item.issuanceCycle.tr1}
//           tr2={item.issuanceCycle.tr2}
//           strikePrice1={item.issuanceCycle.strikePrice1}
//           strikePrice2={item.issuanceCycle.strikePrice2}
//           strikePrice3={item.issuanceCycle.strikePrice3}
//         />
//       </div>
//     </div>
//   );
// };

// export default PortfolioListingItem;
