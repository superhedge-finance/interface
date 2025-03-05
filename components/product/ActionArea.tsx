import { Dialog, Switch, Transition } from "@headlessui/react"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { ethers } from "ethers"
import Image from "next/image"
import { Fragment, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useAccount, useNetwork, useSigner } from "wagmi"
import { DEPOSIT_STATUS, IProduct, WITHDRAW_STATUS } from "../../types"
import ERC20ABI from "../../utils/abis/ERC20.json"
import ProductABI from "../../utils/abis/SHProduct.json"
import { EXPLORER } from "../../utils/constants"
import { SUPPORT_CHAIN_IDS } from "../../utils/enums"
import { getTxErrorMessage, truncateAddress } from "../../utils/helpers"
import PTTokenABI from "..//../utils/abis/PTToken.json"
import { ParaRegular18, PrimaryButton, SecondaryButton, SubtitleRegular16 } from "../basic"
import { tokenList } from "../../utils/tokenList"
import axios from "axios"
import Swap from "../../pages/swap"


const pricePerLot = 1

export const ActionArea = ({ productAddress, product }: { productAddress: string; product: IProduct }) => {
  const { address } = useAccount()
  const { data: signer } = useSigner()
  const { chain } = useNetwork()
  const { openConnectModal } = useConnectModal()

  const [, setScrollY] = useState(0)
  const [tab, setTab] = useState(0)
  const [lots, setLots] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenWithdraw, setIsOpenWithdraw] = useState(false)
  const [status, setStatus] = useState(0)
  const [principalBalance, setPrincipalBalance] = useState(0)
  const [optionBalance, setOptionBalance] = useState(0)
  const [couponBalance, setCouponBalance] = useState(0)
  const [depositStatus, setDepositStatus] = useState(DEPOSIT_STATUS.NONE)
  const [withdrawStatus, setWithdrawStatus] = useState(WITHDRAW_STATUS.NONE)
  const [productInstance, setProductInstance] = useState<ethers.Contract | undefined>(undefined)
  const [currencyInstance, setCurrencyInstance] = useState<ethers.Contract | undefined>(undefined)
  const [tokenAddressInstance, setTokenAddressInstance] = useState<ethers.Contract | undefined>(undefined)
  const [selectedAddressCurrency, setSelectedAddressCurrency] = useState(
    tokenList.find(token => token.label === "ETH")?.value || tokenList[0].value
  )
  const [currencyAddress, setCurrencyAddress] = useState("")
  const [amountOutUsd, setAmountOutUsd] = useState(0)
  const [routeData, setRouteData] = useState<any>(null)
  const [maxLots, setMaxLots] = useState(0)
  // const [profit, setProfit] = useState(1);
  const [enabled, setEnabled] = useState(false)
  // following state is for deposit modal
  const [expand, setExpand] = useState(false)

  // const [reloadData, setReloadData] = useState(false)

  const [walletBalance, setWalletBalance] = useState(0)
  // const [imageURL, setImageURL] = useState("")

  const [isCouponSelected, setIsCouponSelected] = useState(false);
  const [isOptionSelected, setIsOptionSelected] = useState(false);
  const [isPrincipalSelected, setIsPrincipalSelected] = useState(false);

  const onConnect = () => {
    if (!address && openConnectModal) {
      openConnectModal()
    }
  }

  const onApprove = async () => {
    try {
      if (currencyInstance && productInstance) {
        const decimal = await currencyInstance.decimals()

        const depositAmountStr = depositAmount.toFixed(decimal) 
        const approveAmountStr = (depositAmount + depositAmount * 0.0000005).toFixed(decimal)
        const requestBalance = ethers.utils.parseUnits(depositAmountStr, decimal)
        const approveBalance = ethers.utils.parseUnits(approveAmountStr, decimal)
        const _currentCapacity = await productInstance.currentCapacity()
        if (depositAmount + Number(ethers.utils.formatUnits(_currentCapacity, decimal)) > Number(product.maxCapacity)) {
          return toast.error("Your deposit results in excess of max capacity.")
        }
        const currentAllowance = await currencyInstance.allowance(address, productAddress)
        if (currentAllowance.lt(requestBalance)) {
          const tx = await currencyInstance.approve(productAddress, approveBalance)
          await setDepositStatus(DEPOSIT_STATUS.APPROVING)
          await tx.wait()
        }
        
        await setDepositStatus(DEPOSIT_STATUS.DEPOSIT)
        const depositTx = await productInstance.deposit(requestBalance)
        await depositTx.wait()
        await setDepositStatus(DEPOSIT_STATUS.DONE)
      }
    } catch (e) {
      toast.error(getTxErrorMessage(e))
      console.log(`Error while approve and deposit: ${e}`)
    }
  }

  const onWithdraw = async () => {
    if (tokenAddressInstance && productInstance) {
      try {
        if (status === 1) {
          if (isPrincipalSelected && principalBalance > 0) {
            // approve token
            // console.log("Approve token")
            const decimal = await tokenAddressInstance.decimals()
            const requestBalance = ethers.utils.parseUnits(withdrawableBalance.toFixed(decimal), decimal);
            // console.log(requestBalance)

            const _currentCapacity = await productInstance.currentCapacity()
            // console.log(_currentCapacity)
            if (withdrawableBalance + Number(ethers.utils.formatUnits(_currentCapacity, decimal)) > Number(product.maxCapacity)) {
              return toast.error("Your withdraw results in excess of max capacity.")
            }
            const currentAllowance = await tokenAddressInstance.allowance(address, productAddress)
            // console.log(currentAllowance)
            if (currentAllowance.lt(requestBalance)) {
              const tx = await tokenAddressInstance.approve(productAddress, requestBalance)
              await setWithdrawStatus(WITHDRAW_STATUS.APPROVING)
              await tx.wait()
            }
            // withdraw
            await setWithdrawStatus(WITHDRAW_STATUS.WITHDRAW)
            // console.log("withdrawPrincipal")
            const withdrawTx = await productInstance.withdrawPrincipal()
            await withdrawTx.wait()
          }
          if (isOptionSelected && optionBalance > 0) {
            const tx1 = await productInstance.withdrawOption()
            await tx1.wait()
          }
          if (isCouponSelected && couponBalance > 0) {
            const tx2 = await productInstance.withdrawCoupon()
            await tx2.wait()
          }
          await setWithdrawStatus(WITHDRAW_STATUS.DONE)
        } else if (status >= 2) {
          if (isOptionSelected && optionBalance > 0) {
            const tx1 = await productInstance.withdrawOption()
            await tx1.wait()
          }
          if (isCouponSelected && couponBalance > 0) {
            const tx2 = await productInstance.withdrawCoupon()
            await tx2.wait()
          }
          await setWithdrawStatus(WITHDRAW_STATUS.DONE)
        } else {
          await setWithdrawStatus(WITHDRAW_STATUS.NONE)
        }
      } catch (e) {
        await setWithdrawStatus(WITHDRAW_STATUS.NONE)
        console.log(e)
      } finally {
        // console.log("Finally!")
        // Reset selection states after withdrawal
        setIsCouponSelected(false);
        setIsOptionSelected(false);
        setIsPrincipalSelected(false);
      }
    }
  }

  const chainId = useMemo(() => {
    if (chain) return chain.id
    return SUPPORT_CHAIN_IDS.ETH
  }, [chain])

  // const lotsCount = useMemo(() => {
  //   return (principalBalance + optionBalance + couponBalance) / pricePerLot
  // }, [principalBalance, optionBalance, couponBalance])

  const withdrawableBalance = useMemo(() => {
    if (status === 1) {
      return principalBalance + optionBalance + couponBalance
    } else if (status >= 2) {
      return optionBalance + couponBalance
    }
    return 0
  }, [status, principalBalance, optionBalance, couponBalance])

  const depositAmount = useMemo(() => {
    if (status !== 1) {
      return 0
    }
    if (principalBalance > 0) {
      if (enabled == true) {
        if (pricePerLot * lots > optionBalance + couponBalance) {
          return pricePerLot * lots - (optionBalance + couponBalance)
        }
        return 0
      } else {
        return pricePerLot * lots
      }
    }
    return pricePerLot * lots
  }, [principalBalance, status, lots, enabled, optionBalance, couponBalance])

  const depositButtonLabel = useMemo(() => {
    if (status !== 1) {
      return "Unavailable"
    }
    if (principalBalance > 0) {
      return `DEPOSIT ${depositAmount.toLocaleString()} ${product.currencyName}`
    }
    return `DEPOSIT ${depositAmount.toLocaleString()} ${product.currencyName}`
  }, [principalBalance, status, depositAmount])

  const isSticky = () => {
    const scrollTop = window.scrollY
    setScrollY(scrollTop)
  }

  // Sticky Menu Area
  useEffect(() => {
    window.addEventListener("scroll", isSticky)
    return () => {
      window.removeEventListener("scroll", isSticky)
    }
  })

  useEffect(() => {
    if (selectedAddressCurrency && currencyAddress) {
      
    }
  }, [selectedAddressCurrency, currencyAddress])

  useEffect(() => {
    (async () => {
      if (signer && productAddress && address) {
        try {
          const _productInstance = new ethers.Contract(productAddress, ProductABI, signer)
          setProductInstance(_productInstance)
          const _status = await _productInstance.status()
          setStatus(_status)
          const _currency = await _productInstance.currency()
          setCurrencyAddress(_currency)
          const _currencyInstance = new ethers.Contract(_currency, ERC20ABI, signer)
          setCurrencyInstance(_currencyInstance)
          const _decimals = await _currencyInstance.decimals()

          // SH Token
          const _tokenAddress = await _productInstance.tokenAddress()
          const _tokenAddressInstance = new ethers.Contract(_tokenAddress, ERC20ABI, signer)
          setTokenAddressInstance(_tokenAddressInstance)
          // const _tokenDecimals = await _tokenAddressInstance.decimals()
          const _tokenBalance = await _tokenAddressInstance.balanceOf(address)
          // console.log(Number(ethers.utils.formatUnits(_tokenBalance,0)))

          // PT Token
          const _ptAddress = await _productInstance.PT()
          const _ptAddressInstance = new ethers.Contract(_ptAddress, PTTokenABI, signer)
          const _ptBalance = await _ptAddressInstance.balanceOf(productAddress)
          // console.log(Number(ethers.utils.formatUnits(_ptBalance,0)))
          const _couponBalance = await _productInstance.couponBalance(address)
          setCouponBalance(Number(ethers.utils.formatUnits(_couponBalance, _decimals)))
          const _optionBalance = await _productInstance.optionBalance(address)
          setOptionBalance(Number(ethers.utils.formatUnits(_optionBalance, _decimals)))
          const _principalBalance = await _productInstance.principalBalance(address)
          // console.log("_principalBalance")
          // console.log(_principalBalance)
          setPrincipalBalance(Number(ethers.utils.formatUnits(_principalBalance, _decimals)))
          // wallet balance
          const currencyBalance = await _currencyInstance.balanceOf(address)
          setMaxLots(Number(ethers.utils.formatUnits(currencyBalance, _decimals)))
          setWalletBalance(Number(ethers.utils.formatUnits(currencyBalance, _decimals)))
          
        } catch (e) {
          console.error(e)
        }
      }
    })()
  }, [productAddress, signer, address])

  useEffect(() => {
    const fetchRoute = async () => {
      if (selectedAddressCurrency && currencyAddress && lots > 0) {
        const KYBER_API = process.env.NEXT_PUBLIC_KYBER_API;
        const CHAIN_ID = chainId 
        const CHAIN_NAME = 'ethereum';
        try {
          // 1. Get route first
          const token = tokenList.find(token => token.value === selectedAddressCurrency);
          const amountIn = lots * 10 ** (token?.decimals || 0);
          const routeUrl = `${KYBER_API}/${CHAIN_NAME}/api/v1/routes`;
          const routeParams = {
            tokenIn: selectedAddressCurrency,
            tokenOut: currencyAddress,
            amountIn: amountIn.toString(), // Example amount
            to: ethers.constants.AddressZero,
            slippage: 100, // Example slippage
            deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
            chainId: CHAIN_ID,
          };

          const routeResponse = await axios.get(routeUrl, { params: routeParams });
          const routeData: any = routeResponse.data;

          // Get the signer's address
          const signerAddress = await signer?.getAddress();

          console.log("routeData")
          console.log(routeData.data.routeSummary.amountOutUsd)

          setAmountOutUsd(routeData.data.routeSummary.amountOutUsd)
          // 2. Build route
          const buildUrl = `${KYBER_API}/${CHAIN_NAME}/api/v1/route/build`;
          const buildParams = {
            routeSummary: routeData.data.routeSummary,
            sender: signerAddress,
            recipient: signerAddress,
            slippageTolerance: 10 //0.1%
          };
          const buildResponse = await axios.post(buildUrl, {
            ...buildParams
          });
          

          setRouteData({
            success: true,
            data: {
              routeData: {
                ...routeData?.data
              },
              buildData: {
                ...buildResponse.data?.data
              },
              tokenIn: selectedAddressCurrency
            },
          });
        } catch (error: any) {
          setRouteData({
            success: false,
            error: error?.message || 'Unknown error occurred',
          });
        }
      }
    };

    fetchRoute();
  }, [selectedAddressCurrency, currencyAddress, lots]);

  const hasSelectedItems = () => {
    return isCouponSelected || isOptionSelected || isPrincipalSelected;
  };

  const getWithdrawButtonLabel = () => {
    if (!hasSelectedItems()) {
      return "SELECT ITEMS TO WITHDRAW";
    }

    const selectedItems = [];
    if (isCouponSelected) selectedItems.push("COUPON");
    if (isOptionSelected) selectedItems.push("OPTION");
    if (isPrincipalSelected) selectedItems.push("PRINCIPAL");

    return `WITHDRAW ${selectedItems.join(" + ")}`;
  };

  const getETHBalance = async (address: string) => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_MORALIS_KEY_ETH);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
};

  const getTokenApproval = async (tokenAddress: string, spenderAddress: string, amount: string) => {
      if (!signer) return;
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const signerAddress = await signer.getAddress();
      const allowance = await tokenContract.allowance(signerAddress, spenderAddress);
      
      if (allowance.lt(amount)) {
          const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256);
          await tx.wait();
      }
  };

  const handleSwap = async () => {
    if(routeData.success && signer) {
      const swapData = routeData.data;
      // const swapData = response.data;
        try {
            console.log({ swapData });
            if (!swapData) {
              return {
                success: false,
                error: 'Failed to get swap data',
              }
            }
        
            const encodedSwapData = swapData.buildData.data;
            const routerContract = swapData.buildData.routerAddress;
            const amountIn = swapData.buildData.amountIn;
        
            // Get signer
            // const signer = getSigner();
            const signerAddress = await signer?.getAddress();
        
        
            console.log({ tokenIn: swapData.tokenIn });
        
            // Add balance check
        
            console.log({
              tokenIn: swapData.tokenIn,
              tokenInLower: swapData.tokenIn.toLowerCase(),
            });
        
            if (swapData.tokenIn.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
              const tokenContract = new ethers.Contract(swapData.tokenIn, ERC20ABI, signer);
              const decimals = await tokenContract.decimals();
              const balance = await tokenContract.balanceOf(signerAddress);
              const amountInBigInt = BigInt(amountIn);
        
              console.log({
                balance1: ethers.utils.formatUnits(balance, decimals),
                required: ethers.utils.formatUnits(amountInBigInt, decimals),
                address: signerAddress
              });
        
              console.log("WETH Balance:", ethers.utils.formatUnits(balance, 18));
        
              if (balance < amountInBigInt) {
                return {
                  success: false,
                  error: `Insufficient balance. Required: ${ethers.utils.formatUnits(amountInBigInt, decimals)} ${await tokenContract.symbol()}, Available: ${ethers.utils.formatUnits(balance, decimals)}`,
                };
              }
        
              // Handle token approval if needed
              await getTokenApproval(
                swapData.tokenIn,
                routerContract,
                amountIn
              )
            } else {
              const ethBalance = await getETHBalance(signerAddress);
              const amountInBigInt = BigInt(amountIn);
              console.log("ETH Balance:", ethBalance);
        
              console.log({
                balance2: ethBalance,
                required: ethers.utils.formatUnits(amountInBigInt, 18),
                address: signerAddress
              });
        
              if (Number(ethBalance) < Number(ethers.utils.formatUnits(amountInBigInt, 18))) {
                return {
                  success: false,
                  error: `Insufficient balance. Required: ${ethers.utils.formatUnits(amountInBigInt, 18)} ETH, Available: ${ethBalance}`,
                };
              }
            }
        
            // Prepare transaction
            const tx: any = {
              data: encodedSwapData,
              from: signerAddress,
              to: routerContract,
            //   maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
            //   maxPriorityFeePerGas: ethers.utils.parseUnits('0.1', 'gwei')
            };
        
            // Add value field if swapping ETH
            if (swapData.tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
              tx.value = BigInt(amountIn);
            }
        
            // Execute the swap transaction
            console.log(`Executing the swap tx on-chain: `);
            console.log({ txBody: tx });
        
            const executeSwapTx = await signer.sendTransaction({
              ...tx,
              // gasLimit: BigInt('21000'),
            });
        
            const executeSwapTxReceipt = await executeSwapTx.wait();
        
            if (!executeSwapTxReceipt?.status) {
              throw new Error('Transaction failed');
            }
        
            return {
              success: true,
              data: {
                hash: executeSwapTxReceipt.transactionHash
              }
            };
          } catch (error: any) {
            console.error('Swap transaction failed:', error);
            return {
              success: false,
              error: error?.message || 'Failed to execute swap transaction'
            };
          }

    }

  };



  return (
    <>
      <div
        className={`col-span-1 sticky md:right-[96px] md:top-[130px] w-full z-30 bottom-0 bg-white md:m-0 p-5 md:py-[45px] md:px-[63px] rounded ${expand ? "h-screen" : "h-fit"
          } ${!address ? "justify-between space-y-[100px]" : ""} `}
      >
        {!expand ? (
          <div className="flex items-center gap-3">
            {/* Deposit/Withdraw tabs */}
            <div className={"p-1 flex items-center bg-[#EBEBEB] rounded-[6px] h-[38px] flex-1"}>
              <div
                className={`${tab === 0 ? "bg-white" : "bg-transparent"
                  } cursor-pointer h-[30px] rounded-[6px] p-2 flex flex-1 items-center justify-center`}
                onClick={() => setTab(0)}
              >
                DEPOSIT
              </div>
              <div
                className={`${tab === 1 ? "bg-white" : "bg-transparent"
                  } cursor-pointer h-[30px] rounded-[6px] p-2 flex flex-1 items-center justify-center`}
                onClick={() => setTab(1)}
              >
                WITHDRAW
              </div>
            </div>

            {/* Get currency link */}
            <a 
              href="https://app.ethena.fi/buy" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Get {product.currencyName} →
            </a>
          </div>
        ) : (
          <div className={"flex items-center justify-end"}>
            <img src={"/icons/close.svg"} alt={""} onClick={() => setExpand(false)} />
          </div>
        )}

        {!address && (
          <div className={"text-[#161717] text-[18px] leading-[24px] px-10 text-center"}>
            Please connect your wallet for access.
          </div>
        )}
        
        {address && tab === 0 && (
          <div className={"flex flex-col justify-between w-full"}>
            <div className={"bg-[#EBEBEB] p-5 rounded-[6px] flex flex-col items-center mt-[17px]"}>
              <span className={"text-[#677079] text-[16px] leading-[16px]"}>Total Balance</span>
              <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                {(principalBalance + optionBalance + couponBalance).toLocaleString()} {product.currencyName}
              </span>
            </div>

            {/* {principalBalance > 0 && (
              <div
                className={`${expand ? "bg-[#EBEBEB]" : "bg-transparent"
                  } md:bg-[#EBEBEB] rounded-[6px] p-5 flex flex-col items-center mt-0 md:mt-5`}
              >
                <div className={"flex flex-col items-center space-y-2"}>
                  <span className={"text-[#677079] text-[16px] leading-[16px]"}>Total Profit</span>
                  <span className={"text-[22px] leading-[22px] font-medium text-black text-center"}>
                    {(optionBalance + couponBalance).toLocaleString()} USDC
                  </span>
                </div>
              </div>
            )} */}

            <div className={`${expand ? "" : "hidden"} md:block flex flex-col w-full`}>
              <div className={"mt-8 text-[#494D51] text-[16px]"}>Amount</div>

              <div className={"relative flex items-center mt-2"}>
                
                <input
                  className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"}
                  value={lots}
                  onChange={(e) => setLots(Number(e.target.value))}
                  type='number'
                  step='1.00' 
                />
                <select
                  className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"}
                  
                  onChange={(e) => {
                    // const selectedCurrency = parseInt(e.target.value);
                    console.log(e.target);
                    setSelectedAddressCurrency(e.target.value);
                  }}
                >
                  {tokenList.map((token) => (
                    <option key={token.value} value={token.value}>
                      {token.label}
                    </option>
                  ))}
                </select>
                <span className={"absolute right-4 text-[#828A93]"}></span>
              </div>
              
              <div>
                <span className={"text-[#828A93] text-[16px] leading-[16px]"}>Amount Out</span>
                <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                  {amountOutUsd.toLocaleString()} {product.currencyName}
                </span>
              </div>
              <div>
              <PrimaryButton
                label="Swap"
                onClick={handleSwap}
              />
              </div>
              <div className={"mt-3 flex justify-between items-center text-[#828A93]"}>
                <div className={"flex items-center"}>
                  {/* <Image src={"/miniUSDC.svg"} alt={"miniUSDC"} width={20} height={20} />
                  <span className={"ml-2"}>{(pricePerLot * lots).toLocaleString()} USDC</span> */}
                </div>
                <div className={"flex items-center"}>
                  <Image src={"/miniUSDC.svg"} alt={"miniUSDC"} width={20} height={20} />
                  <span className={"ml-2"}>{(pricePerLot * lots).toLocaleString()} {product.currencyName}</span>
                  <span 
                    className={`ml-2 text-[#828A93] cursor-pointer ${walletBalance === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => walletBalance > 0 && setLots(maxLots)}
                  >
                    MAX
                  </span>
                </div>
              </div>

              {/* <div className={"mt-1 grid grid-cols-1 gap-2"}>

                <div
                  className={
                    "bg-[#FBFBFB] cursor-pointer flex flex-1 items-center justify-center text-center rounded-[6px] py-2 px-3 text-[12px] leading-[12px]"
                  }
                  onClick={() => setLots(maxLots)}
                >
                  MAX
                </div>
              </div> */}
            </div>

            <div className="flex justify-between mt-5">
              <Switch.Group>
                <div className="flex items-center">
                  {/* <Switch
                    checked={enabled}
                    onChange={setEnabled}
                    className={`${enabled ? 'bg-blue-600' : 'bg-gray-400'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-indigo-500`}
                  >
                    <span
                      className={`${enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <Switch.Label className="ml-3">Include profits</Switch.Label> */}
                </div>
              </Switch.Group>
              <div>
                  <span className={"mr-1"}>Wallet Balance: </span>
                  <span className="font-medium">{walletBalance.toLocaleString()} {product.currencyName}</span>
                </div>
            </div>

            <div className={`${expand ? "" : "hidden"} md:block mt-5`}>
              <PrimaryButton label={depositButtonLabel} disabled={status !== 1 || walletBalance === 0} onClick={() => setIsOpen(true)} />
            </div>

            {!expand && (
              <div className={"block md:hidden w-full pb-5"}>
                <PrimaryButton label={"DEPOSIT"} onClick={() => setExpand(true)} />
              </div>
            )}
          </div>
        )}

        {address && tab === 1 && (
          <>
            <div className={"md:block flex flex-col w-full"}>

              <div className={"bg-[#EBEBEB] p-5 rounded-[6px] flex flex-col items-center mt-[17px]"}>
                <span className={"text-[#677079] text-[16px] leading-[16px]"}>Total Balance</span>
                <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                  {/* {(principalBalance + optionBalance + couponBalance).toLocaleString()} USDC ({lotsCount.toFixed(3)} lots) */}
                  {(principalBalance + optionBalance + couponBalance).toLocaleString()} {product.currencyName}
                </span>
              </div>

              <div className="flex space-x-2 mt-[17px]">
                <div className={"bg-[#EBEBEB] p-5 rounded-[6px] flex-1 flex flex-col items-center"}>
                  <span className={"text-[#677079] text-[16px] leading-[16px]"}>Coupon Balance</span>
                  <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                    {couponBalance.toLocaleString()} {product.currencyName}
                  </span>
                </div>
                {couponBalance > 0 && (
                  <button 
                    className={`bg-[#EBEBEB] p-5 rounded-[6px] text-sm flex items-center ${
                      isCouponSelected ? 'text-black font-medium' : 'text-[#161717]'
                    }`}
                    onClick={() => setIsCouponSelected(!isCouponSelected)}
                  >
                    {isCouponSelected ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>

              <div className="flex space-x-2 mt-[17px]">
                <div className={"bg-[#EBEBEB] p-5 rounded-[6px] flex-1 flex flex-col items-center"}>
                  <span className={"text-[#677079] text-[16px] leading-[16px]"}>Option Profit Balance</span>
                  <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                    {optionBalance.toLocaleString()} {product.currencyName}
                  </span>
                </div>
                {optionBalance > 0 && (
                  <button 
                    className={`bg-[#EBEBEB] p-5 rounded-[6px] text-sm flex items-center ${
                      isOptionSelected ? 'text-black font-medium' : 'text-[#161717]'
                    }`}
                    onClick={() => setIsOptionSelected(!isOptionSelected)}
                  >
                    {isOptionSelected ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>

              <div className="flex space-x-2 mt-[17px]">
                <div className={"bg-[#EBEBEB] p-5 rounded-[6px] flex-1 flex flex-col items-center"}>
                  <span className={"text-[#677079] text-[16px] leading-[16px]"}>Principal Balance</span>
                  <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                    {principalBalance.toLocaleString()} {product.currencyName}
                  </span>
                </div>
                {principalBalance > 0 && status === 1 && (
                  <button 
                    className={`bg-[#EBEBEB] p-5 rounded-[6px] text-sm flex items-center ${
                      isPrincipalSelected ? 'text-black font-medium' : 'text-[#161717]'
                    }`}
                    onClick={() => setIsPrincipalSelected(!isPrincipalSelected)}
                  >
                    {isPrincipalSelected ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>

              <div className={"bg-[#EBEBEB] p-5 rounded-[6px] flex flex-col items-center mt-[17px]"}>
                <span className={"text-[#677079] text-[16px] leading-[16px]"}>Withdrawable Balance</span>
                <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>{withdrawableBalance.toLocaleString()} {product.currencyName}</span>
              </div>

              {/* <div className={"font-light text-[14px] leading-[20px] text-[#677079] mt-[44px]"}>
                {status !== 1
                  ? "Your Deposit is locked, so you can initiate only Profit Withdraw right now or request\n" +
                  "withdraw All Amount at Maturity Date."
                  : "Vault is unlocked. You may deposits or withdraw funds at this time."}
              </div> */}

              <div className={"mt-7"}>
                <PrimaryButton
                  label={
                    withdrawableBalance === 0 
                      ? "No Withdrawable Balance" 
                      : getWithdrawButtonLabel()
                  }
                  className={"uppercase"}
                  disabled={withdrawableBalance === 0 || !hasSelectedItems()}
                  onClick={() => setIsOpenWithdraw(true)}
                />
              </div>
            </div>

            <div className={"block md:hidden w-full pb-5"}>
              <div className={"flex flex-col items-center w-full space-y-2 py-4"}>
                <SubtitleRegular16>Current Balance</SubtitleRegular16>
                <ParaRegular18 className={"text-center"}>
                  You have no Deposit. <br /> Please Deposit first
                </ParaRegular18>
              </div>

              <PrimaryButton label={"INITIATE WITHDRAW"} />
            </div>
          </>
        )}
        {address && (
          <div className={"hidden md:flex mt-7 items-center justify-center"}>
            <span className={"text-[#677079] mr-2"}>Contract:</span>
            <span className={"mr-2 bg-clip-text text-transparent bg-primary-gradient"}>{truncateAddress(productAddress)}</span>
            <a href={`${EXPLORER[chainId]}/address/${productAddress}`} target={"_blank"} rel='noreferrer'>
              <Image src={"/icons/external.svg"} alt={"external"} width={20} height={20} />
            </a>
          </div>
        )}

        {!address && (
          <div className={"flex justify-center"}>
            <PrimaryButton label={"CONNECT WALLET"} onClick={onConnect} />
          </div>
        )}
      </div>

      {/* DEPOSIT */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as='div' className='relative z-50' onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white py-[60px] px-[160px] text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title className='text-[32px] font-medium leading-[40px] text-[#161717] text-center'>
                    {depositStatus <= DEPOSIT_STATUS.APPROVING ? "Step 1/2: Approve " + product.currencyName + " spend from your wallet" : "Step 2/2: Deposit " + product.currencyName}
                  </Dialog.Title>
                  <div className='mt-7 flex flex-col items-center'>

                    {depositStatus === DEPOSIT_STATUS.DONE ? (
                      <>
                        <div className='text-[16px] text-gray-500'>You have successfully deposited!</div>
                      </>
                    ) : (
                      <>
                        <p className='text-[16px] text-gray-500'>Smart contract link</p>
                        <div className={"flex items-center mt-4"}>
                          <span className={"bg-primary-gradient text-transparent bg-clip-text text-[20px]"}>
                            {truncateAddress(productAddress)}
                          </span>
                          <a href={`${EXPLORER[chainId]}/address/${productAddress}`} target={"_blank"} rel='noreferrer'>
                            <Image src={"/icons/external.svg"} alt={"external"} width={20} height={20} />
                          </a>
                        </div>
                        {/* <p className='text-[16px] text-gray-500 mt-7 flex flex-col items-center'>You&#39;ll receive this ERC20 token representing your deposit</p> */}
                        {/* <img className={"mt-8"} src={imageURL || "/products/default_nft_image.png"} alt={"nft image"} /> */}
                      </>
                    )}
                  </div>


                  <div className='mt-8 flex items-center justify-between space-x-8 h-[50px]'>
                    <button
                      type='button'
                      className='flex flex-1 items-center justify-center border-[#4B4B4B] border-[1px] px-4 py-2 text-sm font-medium text-black rounded-[8px] h-full'
                      onClick={() => {
                        // Reload page
                        // if (depositStatus === DEPOSIT_STATUS.DONE) {
                        //   window.location.reload()
                        // }
                        setIsOpen(false)
                        setDepositStatus(DEPOSIT_STATUS.NONE)
                      }}
                    >
                      DONE
                    </button>
                    {depositStatus !== DEPOSIT_STATUS.DONE && (
                      <button
                        type='button'
                        className='flex flex-1 items-center justify-center border border-transparent bg-[#292929] px-4 py-2 text-sm font-medium text-white rounded-[8px] h-full'
                        onClick={onApprove}
                        disabled={depositStatus === DEPOSIT_STATUS.APPROVING}
                      >
                        {depositStatus >= DEPOSIT_STATUS.APPROVING && (
                          <svg
                            className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                        )}
                        {depositStatus === DEPOSIT_STATUS.DEPOSIT ? "DEPOSIT" : "APPROVE"}
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* NEW WITHDRAW */}
      <Transition appear show={isOpenWithdraw} as={Fragment}>
        <Dialog as='div' className='relative z-50' onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white py-[60px] px-[160px] text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title className='text-[32px] font-medium leading-[40px] text-[#161717] text-center'>
                    {withdrawStatus <= WITHDRAW_STATUS.APPROVING ? "Step 1/2: Approve " + "NT Token" + " spend from your wallet" : "Step 2/2: Withdraw " + product.currencyName}
                  </Dialog.Title>
                  <div className='mt-7 flex flex-col items-center'>


                    {withdrawStatus === WITHDRAW_STATUS.DONE ? (
                      <>
                        <div>Your withdrawal is successful.</div>
                      </>
                    ) : (
                      <>
                        <p className='text-[16px] text-gray-500'>Smart contract link</p>
                        <div className={"flex items-center mt-4"}>
                          <span className={"bg-primary-gradient text-transparent bg-clip-text text-[20px]"}>
                            {truncateAddress(productAddress)}
                          </span>
                          <a href={`${EXPLORER[chainId]}/address/${productAddress}`} target={"_blank"} rel='noreferrer'>
                            <Image src={"/icons/external.svg"} alt={"external"} width={20} height={20} />
                          </a>
                        </div>

                        <div className='mt-7 flex flex-col items-center'>
                          <p className='text-sm text-gray-500'>Total amount to Withdraw</p>
                          <p>{withdrawableBalance.toLocaleString()} {product.currencyName}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className='mt-8 flex items-center justify-between space-x-8 h-[50px]'>
                    <button
                      type='button'
                      className='flex flex-1 items-center justify-center border-[#4B4B4B] border-[1px] px-4 py-2 text-sm font-medium text-black rounded-[8px] h-full'
                      onClick={() => {
                        // Reload page
                        // if (withdrawStatus === WITHDRAW_STATUS.DONE) {
                        //   window.location.reload()
                        // }
                        setIsOpenWithdraw(false)
                        setWithdrawStatus(WITHDRAW_STATUS.NONE)

                      }}
                    >
                      DONE
                    </button>
                    {withdrawStatus !== WITHDRAW_STATUS.DONE && (
                      <button
                        type='button'
                        className='flex flex-1 items-center justify-center border border-transparent bg-[#292929] px-4 py-2 text-sm font-medium text-white rounded-[8px] h-full'
                        onClick={onWithdraw}
                        disabled={withdrawStatus === WITHDRAW_STATUS.APPROVING}
                      >
                        {withdrawStatus >= WITHDRAW_STATUS.APPROVING && (
                          <svg
                            className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                        )}
                        {withdrawStatus >= WITHDRAW_STATUS.WITHDRAW ? "WITHDRAW" : "APPROVE"}
                      </button>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* OLD WITHDRAW */}
      <Transition
        appear
        // show={withdrawStatus !== WITHDRAW_STATUS.NONE}
        show={false}
        as={Fragment}
      >
        <Dialog as='div' className='relative z-50' onClose={() => setWithdrawStatus(WITHDRAW_STATUS.NONE)}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-25' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white py-[60px] px-[80px] text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title className='text-[32px] font-medium leading-[40px] text-[#161717] text-center'>
                    {withdrawStatus === WITHDRAW_STATUS.DONE
                      ? "You successfully withdrawed your Deposit"
                      : "Are you sure you want to initiate Withdraw now?"}
                  </Dialog.Title>

                  {withdrawStatus === WITHDRAW_STATUS.DONE && (
                    <div className='mt-7 flex flex-col items-center'>
                      Funds have been withdrawn to your wallet.
                    </div>
                  )}

                  <div className='mt-7 flex flex-col items-center'>
                    <p className='text-sm text-gray-500'>Total amount to Withdraw</p>
                    <p>{withdrawableBalance.toLocaleString()} {product.currencyName}</p>
                  </div>

                  {withdrawStatus === WITHDRAW_STATUS.DONE ? (
                    <button
                      type='button'
                      className='mt-8 flex flex-1 w-full items-center justify-center border border-transparent bg-[#292929] px-4 py-2 text-sm font-medium text-white rounded-[8px] h-full'
                      onClick={() => setWithdrawStatus(WITHDRAW_STATUS.NONE)}
                    >
                      CONTINUE
                    </button>
                  ) : (
                    <div className='mt-8 flex items-center justify-between space-x-8 h-[50px]'>
                      <SecondaryButton label={"NO"} onClick={() => setWithdrawStatus(WITHDRAW_STATUS.NONE)} />
                      <PrimaryButton
                        label={"YES"}
                        onClick={onWithdraw}
                        // disabled={withdrawing}
                        // loading={withdrawing}
                        className={"flex items-center justify-center"}
                      />
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}