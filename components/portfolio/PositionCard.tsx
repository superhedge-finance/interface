import { Fragment,useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BigNumber, ethers } from "ethers";
import { useAccount, useSigner, useNetwork } from "wagmi";
import { PrimaryButton } from "../basic";
import { IProduct } from "../../types";
import ProductABI from "../../utils/abis/SHProduct.json";
import ERC20ABI from"../../utils/abis/ERC20.json";
import { useRouter } from "next/router";
import Timeline from "../product/Timeline";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";
import { DECIMAL } from "../../utils/constants";
import axios from "../../service/axios";
import { Dialog, Transition, Switch } from "@headlessui/react"
import IconLoading from "./IconLoading";

export const PositionCard = ({ position, enabled }: { position: IProduct; enabled: boolean }) => {
  const Router = useRouter();
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();

  const [principal, setPrincipal] = useState<number>(0);
  const [imageURL, setImageURL] = useState("");
  const [isOpen, setIsOpen] = useState(false)
  const [expand, setExpand] = useState(false)
  // const closeModal = () => setIsOpen(false);
    // const [productInstance, setProductInstance] = useState<ethers.Contract | undefined>(undefined)

  const currency1 = useMemo(() => {
    return "/currency/" + position.underlying.split("/")[1].toLowerCase() + ".svg";
  }, [position]);

  const currency2 = useMemo(() => {
    return "/currency/" + position.underlying.split("/")[0].toLowerCase() + ".svg";
  }, [position]);

  const productInstance = useMemo(() => {
    if (!position || !signer || !address) return null;
    return new ethers.Contract(position.address, ProductABI, signer);
  }, [position, signer, address]);

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ARBITRUM;
  }, [chain]);

  const closeModal = () => {
    setIsOpen(false);
    setCountdown(30); // Reset countdown when closing the modal
};

  const [withdrawBlockSize, setwithdrawBlockSize] = useState<number>(0);
  const [totalBlocks, setTotalBlocks] = useState<number>(0); // State for total blocks
  const [blocksToWithdraw, setBlocksToWithdraw] = useState<number>(0); // State for blocks to withdraw
  const [optionUnwindPrice, setOptionUnwindPrice] = useState<number | null>(null); // State for option unwind price
  const [ptUnwindPrice, setPtUnwindPrice] = useState<number | null>(null); // State for pt unwind price
  const [currencyInstance, setCurrencyInstance] = useState<ethers.Contract | undefined>(undefined)
  const [tokenAddressInstance, setTokenAddressInstance] = useState<ethers.Contract | undefined>(undefined)
  const [countdown, setCountdown] = useState(30);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [loadingBlock, setLoadingBlock] = useState(true)
  const [loadingUnwind, setLoadingUnwind] = useState(false)


  const handleUnwind = async () => {
    // Calculate the unwind price based on blocksToWithdraw
    setLoadingUnwind(true)
    try {
      const results = await axios.post(`products/get-pt-and-position?chainId=${chainId}&walletAddress=${address}&productAddress=${position.address}&noOfBlock=${blocksToWithdraw}`);
      const ptUnwindPrice = Number(results.data.amountToken)
      setPtUnwindPrice(Number(ethers.utils.formatUnits(ptUnwindPrice, DECIMAL[chainId])));
      // setPtUnwindPrice(ptUnwindPrice)
      // ethers.utils.parseUnits(depositAmount.toString(), decimal)

      const optionUnwindPrice = results.data.amountOption
      setOptionUnwindPrice(Number(ethers.utils.formatUnits(optionUnwindPrice, DECIMAL[chainId])));
      setIsOpen(true);
      setShowPrices(true);
      // Start countdown and show Confirm button
      setCountdown(30);
      setShowConfirmButton(true);
      setLoadingUnwind(false)
    } catch (e) {
      setLoadingUnwind(false)
      console.error(e);
    }
    
  };

  const handleYes = async() => {
    console.log(productInstance)
    console.log(tokenAddressInstance)
    if(productInstance && tokenAddressInstance && ptUnwindPrice && optionUnwindPrice){
      try{
        const currentAllowance = await tokenAddressInstance.allowance(address, position.address)
        const early_withdraw_balance_user = (blocksToWithdraw * withdrawBlockSize) * 10**(DECIMAL[chainId])
        // console.log(ethers.utils.parseUnits(ptUnwindPrice.toString(), DECIMAL[chainId]))
        // console.log(ptUnwindPrice** 10**(DECIMAL[chainId])
        // console.log(Math.round(early_withdraw_balance_user))
        if (currentAllowance.lt(ptUnwindPrice** 10**(DECIMAL[chainId]))) {
          console.log("approve")
          const approve_tx = await tokenAddressInstance.approve(position.address, Math.round(early_withdraw_balance_user))
          await approve_tx.wait()
        }
        console.log("earlyWithdraw")
        console.log(blocksToWithdraw)
        const tx = await productInstance.earlyWithdraw(blocksToWithdraw)
        await tx.wait()
        console.log(tx)
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_MORALIS_KEY_ARBITRUM)
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (receipt && receipt.status === 1) {
          console.log("Transaction UI was successful");
          console.log(optionUnwindPrice * 10 ** (DECIMAL[chainId]))
          console.log(ptUnwindPrice * 10 **(DECIMAL[chainId]))

          const data = {
            "chainId": chainId,
            "product": position.address,
            "address": address,
            "txid": tx.hash,
            "amountPtUnwindPrice": Math.round(ptUnwindPrice * 10 **(DECIMAL[chainId])),
            "amountOptionUnwindPrice": Math.round(optionUnwindPrice * 10 ** (DECIMAL[chainId]))
          }
          console.log(data)
          const result = await axios.post('products/update-withdraw-request', data, {
            headers: {
              'Content-Type': 'application/json'},})

        } else {
          console.log("Transaction failed");
        }
      } catch (e){
        console.log(e)
      }

    };
  }

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (showConfirmButton && countdown > 0) {
        timer = setInterval(() => {
            setCountdown(prevCountdown => prevCountdown - 1);
        }, 1000); // Decrease countdown every second
    }

    if (countdown === 0) {
        setShowConfirmButton(false);
        setShowPrices(false); // Hide Confirm button when countdown reaches zero
    }

    return () => clearInterval(timer); // Cleanup timer on unmount or when dependencies change
}, [showConfirmButton, countdown]);

  useEffect(() => {
    (async () => {
      if (productInstance && address) {
        const balance = await productInstance.principalBalance(address);
        setPrincipal(Number(ethers.utils.formatUnits(balance, DECIMAL[chainId])))
      }
    })();
  }, [productInstance, address, chainId]);

  useEffect(() => {
    (async () => {
      if (position) {
        if(signer && address && position.address && productInstance)
        {
          try{
            const _tokenAddress = await productInstance.tokenAddress()
            const _tokenAddressInstance = new ethers.Contract(_tokenAddress, ERC20ABI, signer)
            setTokenAddressInstance(_tokenAddressInstance)
            const _tokenBalance = await _tokenAddressInstance.balanceOf(address)
            const _tokenDecimals = await _tokenAddressInstance.decimals()
            const tokenBalance = Number(ethers.utils.formatUnits(_tokenBalance,0))/(10**_tokenDecimals)
            // console.log(position.address)
            // console.log(position.issuanceCycle)
            const underlyingSpotRef = position.issuanceCycle.underlyingSpotRef
            const optionMinOrderSize = (position.issuanceCycle.optionMinOrderSize) / 10
            const withdrawBlockSize = underlyingSpotRef * optionMinOrderSize
            // console.log(withdrawBlockSize)
            setwithdrawBlockSize(withdrawBlockSize)
            console.log("No of block")
            console.log(tokenBalance)
            console.log(withdrawBlockSize)
            setTotalBlocks(Math.round(tokenBalance/withdrawBlockSize))
            setLoadingBlock(false)
            // console.log("setTotalBlocks")
            // console.log(tokenBalance/withdrawBlockSize)

            const _currency = await productInstance.currency()
            const _currencyInstance = new ethers.Contract(_currency, ERC20ABI, signer)
            setCurrencyInstance(_currencyInstance)
          }
          catch (e){
            console.error(e)
          } 

        }
      }
    })();
  }, [position]);

  return (
    <>
      <div className='flex flex-col py-11 px-12 w-full bg-white rounded-[16px] mt-6 relative overflow-hidden'>
        {(loadingBlock || loadingUnwind) && (
          <div className="absolute top-0 left-0 z-10 w-full h-full flex items-center justify-center gap-2 bg-[#00000050] text-white text-center">
          <IconLoading className="h-4 w-4" />
          <div>
            {loadingBlock && "Loading Number Of Blocks..."}
            {loadingUnwind && "Loading Unwind..."}
          </div>
        </div>
        )}
        
        <div className={"flex justify-between items-start"}>
          <div className='flex flex-row'>
            <div className={"relative flex items-center mr-[40px]"}>
              <Image src={currency1} className='rounded-full' alt='Product Logo' width={60} height={60} />
              <Image src={currency2} className='rounded-full absolute left-[40px]' alt='Product Logo' width={60} height={60} />
            </div>
            <div className='flex flex-col justify-around ml-3'>
              <h5 className='text-[44px] leading-[44px] text-black'>{position.underlying}</h5>
              <span className='text-[20px] font-light text-gray-700'>{position.name}</span>
            </div>
          </div>
          <div className={"flex flex-col items-center"}>
            <div className='flex items-center mb-1'>
              <span className='d-block text-sm font-normal text-gray-700 dark:text-gray-400 mr-1'>Estimated APY</span>
              <div className="group relative flex justify-end">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8.5C6.14167 8.5 6.2605 8.452 6.3565 8.356C6.45217 8.26033 6.5 8.14167 6.5 8V5.9875C6.5 5.84583 6.45217 5.72917 6.3565 5.6375C6.2605 5.54583 6.14167 5.5 6 5.5C5.85833 5.5 5.73967 5.54783 5.644 5.6435C5.548 5.7395 5.5 5.85833 5.5 6V8.0125C5.5 8.15417 5.548 8.27083 5.644 8.3625C5.73967 8.45417 5.85833 8.5 6 8.5ZM6 4.5C6.14167 4.5 6.2605 4.452 6.3565 4.356C6.45217 4.26033 6.5 4.14167 6.5 4C6.5 3.85833 6.45217 3.7395 6.3565 3.6435C6.2605 3.54783 6.14167 3.5 6 3.5C5.85833 3.5 5.73967 3.54783 5.644 3.6435C5.548 3.7395 5.5 3.85833 5.5 4C5.5 4.14167 5.548 4.26033 5.644 4.356C5.73967 4.452 5.85833 4.5 6 4.5ZM6 11C5.30833 11 4.65833 10.8687 4.05 10.606C3.44167 10.3437 2.9125 9.9875 2.4625 9.5375C2.0125 9.0875 1.65633 8.55833 1.394 7.95C1.13133 7.34167 1 6.69167 1 6C1 5.30833 1.13133 4.65833 1.394 4.05C1.65633 3.44167 2.0125 2.9125 2.4625 2.4625C2.9125 2.0125 3.44167 1.65617 4.05 1.3935C4.65833 1.13117 5.30833 1 6 1C6.69167 1 7.34167 1.13117 7.95 1.3935C8.55833 1.65617 9.0875 2.0125 9.5375 2.4625C9.9875 2.9125 10.3437 3.44167 10.606 4.05C10.8687 4.65833 11 5.30833 11 6C11 6.69167 10.8687 7.34167 10.606 7.95C10.3437 8.55833 9.9875 9.0875 9.5375 9.5375C9.0875 9.9875 8.55833 10.3437 7.95 10.606C7.34167 10.8687 6.69167 11 6 11ZM6 10C7.10833 10 8.05217 9.6105 8.8315 8.8315C9.6105 8.05217 10 7.10833 10 6C10 4.89167 9.6105 3.94783 8.8315 3.1685C8.05217 2.3895 7.10833 2 6 2C4.89167 2 3.948 2.3895 3.169 3.1685C2.38967 3.94783 2 4.89167 2 6C2 7.10833 2.38967 8.05217 3.169 8.8315C3.948 9.6105 4.89167 10 6 10Z" fill="#677079"/>
                </svg>
                <span className="absolute bottom-5 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 w-[250px]">
                  {position.estimatedApy}
                </span>
              </div>
            </div>
            <span className='font-medium leading-tight text-3xl text-transparent bg-primary-gradient bg-clip-text'>
              {position.issuanceCycle.apy}
            </span>
          </div>
        </div>

        <div className='flex flex-col flex-1 items-center bg-[#0000000a] h-[66px] rounded-[7px] py-3 px-4 mt-6'>
          <p className='text-[12px] font-light text-gray-700'>Principal Amount</p>
          <h3 className='text-[20px] font-light text-black'>
            <span className={"bg-primary-gradient bg-clip-text text-transparent"}>{principal.toLocaleString()} USDC </span>
            <span className={"ml-1"}></span>
          </h3>
        </div>

        <div className={"mt-6"}>
          <Timeline issuance={position.issuanceCycle.issuanceDate} maturity={position.issuanceCycle.maturityDate} compact={true} />
        </div>

        <PrimaryButton label={"SEE DETAILS"} className={"mt-6"} onClick={() => Router.push(`/portfolio/position/${position.address}`)} />

        <div className="flex flex-col space-y-4 mt-6">
                    <div className="flex items-center space-x-4">
                        {/* Total Blocks Input */}
                        <div className="flex flex-col">
                            <label htmlFor="totalBlocks" className="border rounded px-2 py-1">
                                No of blocks in total: {totalBlocks}
                            </label>
                        </div>

                        {/* Blocks to Withdraw Input */}
                        <div className="flex flex-col">
                            <label htmlFor="blocksToWithdraw" className="text-sm font-medium">
                                No of blocks to withdraw:
                            </label>
                            <input
                                type="number"
                                id="blocksToWithdraw"
                                value={blocksToWithdraw}
                                onChange={(e) => setBlocksToWithdraw(Number(e.target.value))}
                                className="border rounded px-2 py-1"
                                placeholder="Enter blocks to withdraw"
                            />
                        </div>

                         {/* Get Unwind Price Button */}
                         {loadingUnwind ? (
                          <PrimaryButton label={"Loading..."} className={"mt-6"} />
                         ) : (
                          <PrimaryButton label={"Get unwind price"} className={"mt-6"} onClick={handleUnwind} />
                          )}
                    </div>
                        
                    {/* Display Unwind Prices */}
                    {showPrices && (
                        <>
                            {ptUnwindPrice !== null && (
                                <div className="mt-4">
                                    <p className="text-lg font-semibold">pT Unwind Price: {ptUnwindPrice} USDC</p>
                                </div>
                            )}
                            {optionUnwindPrice !== null && (
                                <div className="mt-4">
                                    <p className="text-lg font-semibold">Option Unwind Price: {optionUnwindPrice} USDC</p>
                                </div>
                            )}
                            {/* Countdown Display */}
                            <div className="mt-4">
                            <p>Countdown: {countdown} seconds</p>
                            <PrimaryButton label={"Confirm"} className={"mt-2"} onClick={handleYes} />
                        </div>
                        </>
                    )}
                </div>

                {enabled && (
                    <div className={"mt-6"}>
                        <img src={imageURL || "/products/default_nft_image.png"} width={"100%"} alt={""} />
                    </div>
                )}
            </div>
        </>
    );
};
            

           


//       {enabled && (
//         <div className={"mt-6"}>
//           <img src={imageURL || "/products/default_nft_image.png"} width={"100%"} alt={""} />
//         </div>
//       )}
//     </>
//   );
// };
