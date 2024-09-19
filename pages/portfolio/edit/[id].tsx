// import { forwardRef, useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/router";
// import Image from "next/image";
// import DatePicker from "react-datepicker";
// import { useAccount, useNetwork, useSigner } from "wagmi";
// import { ethers } from "ethers";
// import { Logger } from "@ethersproject/logger";
// import { PrimaryButton, SecondaryButton, TitleH2 } from "../../../components/basic";
// // import { getUserListedItem } from "../../../service";
// import { MarketplaceItemFullType } from "../../../types";
// import { getMarketplaceInstance, getNFTInstance } from "../../../utils/contract";
// import ProductABI from "../../../utils/abis/SHProduct.json";
// import { USDC_ADDRESS } from "../../../utils/address";
// import { DECIMAL } from "../../../utils/constants";
// import "react-datepicker/dist/react-datepicker.css";
// import useToast from "../../../hooks/useToast";
// import { SUPPORT_CHAIN_IDS } from "../../../utils/enums";
// import axios from "../../../service/axios";

// const PortfolioCreatePage = () => {
//   const router = useRouter();
//   const { showToast } = useToast();
//   const { data: signer } = useSigner();
//   const { address } = useAccount();
//   const { chain } = useNetwork();
//   const { id: listingId } = router.query;

//   const [item, setItem] = useState<MarketplaceItemFullType>();
//   const [marketplaceInstance, setMarketplaceInstance] = useState<ethers.Contract>();
//   const [txPending, setTxPending] = useState(false);
//   const [nftInstance, setNFTInstance] = useState<ethers.Contract>();
//   const [lots, setLots] = useState(1);
//   const [price, setPrice] = useState(0);
//   const [startingTime, setStartingTime] = useState<Date>(new Date());
//   const [productStatus, setProductStatus] = useState(0);
//   const [imageURL, setImageURL] = useState("");

//   // eslint-disable-next-line react/display-name,@typescript-eslint/no-unused-vars
//   const CustomInput = forwardRef(({ value, onClick }: { value?: string; onClick?: () => void }, ref) => (
//     <div className={"relative flex items-center"}>
//       <div className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"} onClick={onClick}>
//         {value}
//       </div>
//       <span className={"absolute right-4 text-[#828A93]"}>
//         <Image src={"/icons/calendar.svg"} alt={"calendar"} width={20} height={20} />
//       </span>
//     </div>
//   ));

//   const chainId = useMemo(() => {
//     if (chain) return chain.id;
//     return SUPPORT_CHAIN_IDS.GOERLI;
//   }, [chain]);

//   const productAddress = item?.productAddress;

//   const productInstance = useMemo(() => {
//     if (signer && productAddress) return new ethers.Contract(productAddress as string, ProductABI, signer);
//     else return null;
//   }, [signer, productAddress]);

//   const onUpdateNFT = async () => {
//     if (productStatus !== 3) {
//       return showToast("Your product is not issued yet. Please wait until issuance date", "error");
//     }
//     if (address && signer && marketplaceInstance && nftInstance && chainId) {
//       try {
//         setTxPending(true);
//         const updateTx = await marketplaceInstance.updateListing(
//           listingId,
//           USDC_ADDRESS[chainId],
//           ethers.utils.parseUnits(price.toString(), DECIMAL[chainId])
//         );
//         await updateTx.wait();
//         showToast("NFT CHANGES SUCCESSFULLY SAVED");
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       } catch (e: any) {
//         if (e && e.code && e.code === Logger.errors.ACTION_REJECTED) {
//           return showToast("Transaction rejected", "error");
//         } else {
//           return showToast(e.error.message, "error");
//         }
//       } finally {
//         setTxPending(false);
//       }
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       if (productInstance) {
//         setProductStatus(await productInstance.status());
//       }
//     })();
//   }, [productInstance]);

//   useEffect(() => {
//     (async () => {
//       if (signer && chainId) {
//         setMarketplaceInstance(getMarketplaceInstance(signer, chainId));
//         setNFTInstance(getNFTInstance(signer, chainId));
//       }
//     })();
//   }, [signer, chainId]);

//   useEffect(() => {
//     (async () => {
//       const _item = await getUserListedItem(listingId as string, chainId);
//       if (_item) {
//         setItem(_item);
//         setPrice(_item.offerPrice);
//         setLots(_item.quantity);
//         setStartingTime(new Date(_item.startingTime * 1000));
//         const { data } = await axios.get(_item.issuanceCycle.url);
//         setImageURL(data.image);
//       }
//     })();
//   }, [listingId, chainId]);

//   return (
//     <div className={"py-[80px] flex justify-center"}>
//       <div className={"max-w-[650px] w-full"}>
//         <div className={"flex flex-col items-center w-full"}>
//           <div className={"w-full bg-black rounded-[16px]"}>
//             <div className={"pl-10 h-[150px] flex items-center pt-5"}>
//               <TitleH2 className={"text-white"}>Edit NFT</TitleH2>
//             </div>
//             <img
//               src={item ? imageURL || "/products/default_nft_image.png" : "/products/default_nft_image.png"}
//               width={"100%"}
//               alt={""}
//             />
//           </div>

//           <div className={"w-full flex flex-col space-y-6 bg-white rounded-[16px] p-12 mt-5"}>
//             <div className={"flex flex-col space-y-2"}>
//               <div className={"text-[#494D51] text-[16px]"}>Product lots</div>

//               <div className={"relative flex items-center"}>
//                 <input
//                   className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"}
//                   value={lots}
//                   disabled={true}
//                   // onChange={(e) => setLots(Number(e.target.value))}
//                   type='text'
//                 />
//                 <div className={"absolute right-4 flex items-center space-x-[10px]"}>
//                   <span
//                     className={
//                       "bg-grey-20 flex items-center justify-center px-3 h-[28px] w-[140px] rounded-[6px] text-[12px] leading-[12px] cursor-pointer"
//                     }
//                   >
//                     MIN
//                   </span>
//                   <span
//                     className={
//                       "bg-grey-20 flex items-center justify-center px-3 h-[28px] w-[140px] rounded-[6px] text-[12px] leading-[12px] cursor-pointer"
//                     }
//                   >
//                     MAX
//                   </span>
//                 </div>
//               </div>
//             </div>
//             <div className={"flex flex-col space-y-2"}>
//               <div className={"text-[#494D51] text-[16px]"}>NFT Price (USDC)</div>

//               <div className={"relative flex items-center"}>
//                 <input
//                   className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"}
//                   value={price}
//                   onChange={(e) => setPrice(Number(e.target.value))}
//                   type='text'
//                 />
//                 {/*<span className={"absolute right-4 text-[#828A93]"}>Lots</span>*/}
//               </div>

//               <div
//                 className={"rounded-[6px] bg-warning h-[32px] flex items-center justify-center px-3 text-[12px] leading-[12px] text-white"}
//                 style={{ inlineSize: "fit-content" }}
//               >
//                 {`Total: ${(lots * price).toLocaleString()} USDC - ${lots} Lots`}
//               </div>
//             </div>
//             <div className={"flex flex-col space-y-2"}>
//               <div className={"text-[#494D51] text-[16px]"}>Offer Start Since (GTC)</div>

//               <div className={"relative flex items-center"}>
//                 <DatePicker
//                   selected={startingTime}
//                   showPopperArrow={false}
//                   filterDate={(date: Date) => date.getTime() > Date.now()}
//                   onChange={(date: Date) => setStartingTime(date)}
//                   disabled={true}
//                   customInput={<CustomInput />}
//                 />
//               </div>
//             </div>

//             <div className={"flex items-center space-x-6"}>
//               <SecondaryButton label={"CANCEL"} onClick={() => router.push(`/portfolio/position/${item?.productAddress}`)} />
//               <PrimaryButton
//                 label={"SAVE"}
//                 disabled={!signer || txPending || productStatus !== 3}
//                 loading={txPending}
//                 className={"flex items-center justify-center"}
//                 onClick={onUpdateNFT}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PortfolioCreatePage;
