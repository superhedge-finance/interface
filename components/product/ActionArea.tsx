import { Dialog, Transition } from "@headlessui/react"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import axios from "axios"
import { BigNumber, ethers } from "ethers"
import Image from "next/image"
import { Fragment, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useAccount, useNetwork, useSigner } from "wagmi"
import { DEPOSIT_STATUS, IProduct, SWAP_AND_DEPOSIT_STATUS, WITHDRAW_STATUS } from "../../types"
import ERC20ABI from "../../utils/abis/ERC20.json"
import ProductABI from "../../utils/abis/SHProduct.json"
import { EXPLORER } from "../../utils/constants"
import { SUPPORT_CHAIN_IDS } from "../../utils/enums"
import { getTxErrorMessage, truncateAddress } from "../../utils/helpers"
import { getTokensForChain } from "../../utils/tokenList"
import PTTokenABI from "..//../utils/abis/PTToken.json"
import { ParaRegular18, PrimaryButton, SecondaryButton, SubtitleRegular16 } from "../basic"
// import Swap from "../../pages/swap"

const pricePerLot = 1

export const ActionArea = ({ productAddress, product }: { productAddress: string; product: IProduct }) => {
  const { address } = useAccount()
  const { data: signer } = useSigner()
  const { chain } = useNetwork()
  const { openConnectModal } = useConnectModal()

  const [, setScrollY] = useState(0)
  const [tab, setTab] = useState(0)
  const [lots, setLots] = useState("1")
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenWithdraw, setIsOpenWithdraw] = useState(false)
  const [status, setStatus] = useState(0)
  const [principalBalance, setPrincipalBalance] = useState(0)
  const [optionBalance, setOptionBalance] = useState(0)
  const [couponBalance, setCouponBalance] = useState(0)
  const [depositStatus, setDepositStatus] = useState(DEPOSIT_STATUS.NONE)
  const [withdrawStatus, setWithdrawStatus] = useState(WITHDRAW_STATUS.NONE)
  const [swapAndDepositStatus, setSwapAndDepositStatus] = useState(SWAP_AND_DEPOSIT_STATUS.NONE)
  const [productInstance, setProductInstance] = useState<ethers.Contract | undefined>(undefined)
  const [currencyInstance, setCurrencyInstance] = useState<ethers.Contract | undefined>(undefined)
  const [tokenAddressInstance, setTokenAddressInstance] = useState<ethers.Contract | undefined>(undefined)
  const [selectedAddressCurrency, setSelectedAddressCurrency] = useState("")
  const [loadingSelectedAddressCurrency, setLoadingSelectedAddressCurrency] = useState(false)
  const [currencyAddress, setCurrencyAddress] = useState("")
  const [amountOutUsd, setAmountOutUsd] = useState(0)
  const [routeData, setRouteData] = useState<any>(null)
  const [maxLots, setMaxLots] = useState("0")
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

  const [isLoadingSwapAndDeposit, setIsLoadingSwapAndDeposit] = useState(false);

  const onConnect = () => {
    if (!address && openConnectModal) {
      openConnectModal()
    }
  }

  const onApprove = async () => {
    try {
      if (currencyInstance && productInstance) {
        const decimal = await currencyInstance.decimals()

        const depositAmountStr = ethers.utils.formatUnits(depositAmount, decimal)
        const approveAmountStr = ethers.utils.formatUnits(
          depositAmount.add(depositAmount.mul(5).div(10000)),
          decimal
        )
        const requestBalance = ethers.utils.parseUnits(depositAmountStr, decimal)
        const approveBalance = ethers.utils.parseUnits(approveAmountStr, decimal)
        const _currentCapacity = await productInstance.currentCapacity()
        if (depositAmount.add(ethers.utils.parseUnits(ethers.utils.formatUnits(_currentCapacity, decimal), decimal))
            .gt(ethers.utils.parseUnits(product.maxCapacity.toString(), decimal))) {
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

  const chainId = useMemo(() => {
    if (chain) return chain.id
    return SUPPORT_CHAIN_IDS.ETH
  }, [chain])

  // Get the tokens for the current chain
  const tokensForCurrentChain = useMemo(() => {
    const tokens = getTokensForChain(chainId);
    // return tokens.filter(token => token.label === product.currencyName)
    return tokens
  }, [chainId, product.currencyName])

  const needsSwap = useMemo(() => {
    return selectedAddressCurrency !== '' &&
      product?.currencyName.toLowerCase() !==
      tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label.toLowerCase();
  }, [selectedAddressCurrency, product?.currencyName, tokensForCurrentChain]);

  const onSwapAndDeposit = async () => {
    try {
      console.log('Starting swap and deposit process...');
      setIsLoadingSwapAndDeposit(true);

      if (!currencyInstance || !productInstance) {
        console.log('Error: Contract instances not initialized');
        throw new Error("Contract instances not initialized!");
      }

      // console.log('Getting currency decimals...');
      const decimal = await currencyInstance.decimals();
      // console.log('Currency decimals:', decimal);

      let depositAmountStr;
      let approveAmountStr;

      // Handle swap if needed
      if (needsSwap) {
        console.log('Swap needed - starting swap process...');

        if (!routeData?.success || !signer) {
          console.log('Error: Swap route data or signer not available');
          throw new Error("Swap route data or signer not available");
        }

        const swapData = routeData.data;
        if (!swapData) {
          console.log('Error: Swap data not available');
          throw new Error("Swap data not available");
        }
        // console.log('Swap data retrieved:', { swapData });

        // Check and approve source token if needed
        if (swapData.tokenIn.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          console.log('Non-ETH token swap - checking allowance...');
          const tokenContract = new ethers.Contract(swapData.tokenIn, ERC20ABI, signer);
          const signerAddress = await signer.getAddress();
          const currentAllowance = await tokenContract.allowance(signerAddress, swapData.buildData.routerAddress);
          // console.log('Current allowance:', currentAllowance.toString());

          if (currentAllowance.lt(swapData.buildData.amountIn)) {
            console.log('Approving token for swap...');
            setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.SWAP_APPROVE);
            setIsOpen(true);
            const approveTx = await tokenContract.approve(
              swapData.buildData.routerAddress,
              ethers.constants.MaxUint256
            );
            console.log('Waiting for swap approval transaction...');
            await approveTx.wait();
            console.log('Swap approval complete');
          }
        }

        // Execute swap
        console.log('Executing swap...');
        setIsOpen(true);
        await executeSwap(swapData);
        console.log('Swap executed successfully');

        depositAmountStr = ethers.utils.formatUnits(swapData.buildData.amountOut, decimal);
        approveAmountStr = ethers.utils.formatUnits(
          BigInt(swapData.buildData.amountOut) + (BigInt(swapData.buildData.amountOut) * BigInt(5) / BigInt(10000)),
          decimal
        );
      } else {
        console.log('Direct deposit without swap');
        depositAmountStr = ethers.utils.formatUnits(depositAmount, decimal);
        approveAmountStr = ethers.utils.formatUnits(
          depositAmount.add(depositAmount.mul(5).div(10000)),
          decimal
        );
      }

      // console.log('Preparing deposit amounts:', { depositAmountStr, approveAmountStr });

      // Convert amounts to proper units
      const requestBalance = ethers.utils.parseUnits(depositAmountStr, decimal);
      const approveBalance = ethers.utils.parseUnits(approveAmountStr, decimal);
      // console.log('Converted amounts:', { requestBalance: requestBalance.toString(), approveBalance: approveBalance.toString() });

      // Check capacity
      console.log('Checking capacity...');
      const currentCapacity = await productInstance.currentCapacity();
      const totalDeposit = requestBalance.add(currentCapacity);
      const maxCapacityInWei = ethers.utils.parseUnits(product.maxCapacity.toString(), decimal);
      // console.log('Capacity check:', {
      //   currentCapacity: currentCapacity.toString(),
      //   totalDeposit: totalDeposit.toString(),
      //   maxCapacity: maxCapacityInWei.toString()
      // });

      if (totalDeposit.gt(maxCapacityInWei)) {
        console.log('Error: Deposit exceeds max capacity');
        throw new Error("Your deposit results in excess of max capacity.");
      }

      // Handle deposit approval
      // console.log('Checking deposit allowance...');
      const currentAllowance = await currencyInstance.allowance(address, productAddress);
      // console.log('Current deposit allowance:', currentAllowance.toString());

      if (currentAllowance.lt(requestBalance)) {
        console.log('Approving deposit...');
        setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.DEPOSIT_APPROVE);
        setIsOpen(true);
        const approveTx = await currencyInstance.approve(productAddress, approveBalance);
        console.log('Waiting for deposit approval transaction...');
        await approveTx.wait();
        console.log('Deposit approval complete');
      }

      // Execute deposit
      console.log('Executing deposit...');
      setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.DEPOSITING);
      setIsOpen(true);
      const depositTx = await productInstance.deposit(requestBalance);
      console.log('Waiting for deposit transaction...');
      await depositTx.wait();
      console.log('Deposit complete');

      // Handle success
      console.log('Transaction successful - cleaning up...');
      setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.DONE);
      setTimeout(() => {
        setIsLoadingSwapAndDeposit(false);
        setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.NONE);
        setIsOpen(false);
      }, 1500);

    } catch (error: any) {
      console.error('Swap and deposit failed:', error);
      setIsLoadingSwapAndDeposit(false);
      setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.NONE);
      setIsOpen(false);
      toast.error(getTxErrorMessage(error));
    }
  };


  // Helper function to execute swap
  const executeSwap = async (swapData: any) => {
    try {
      // console.log('Starting swap with data:', {
      //   tokenIn: swapData.tokenIn,
      //   amountIn: swapData.buildData.amountIn,
      //   amountOut: swapData.buildData.amountOut,
      //   routerContract: swapData.buildData.routerAddress
      // });

      const encodedSwapData = swapData.buildData.data;
      const routerContract = swapData.buildData.routerAddress;
      const amountIn = swapData.buildData.amountIn;
      const signerAddress = await signer?.getAddress();

      setIsOpen(true);

      // Kiểm tra balance và approval
      if (routeData.success && signer) {
        if (swapData.tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          // console.log('Checking ETH balance...');
          const ethBalance = await getETHBalance(signerAddress || "");
          const amountInBigInt = BigInt(amountIn);

          // console.log('Swap ETH details:', {
          //   ethBalance,
          //   required: ethers.utils.formatUnits(amountInBigInt, 18),
          //   signerAddress
          // });

          if (Number(ethBalance) < Number(ethers.utils.formatUnits(amountInBigInt, 18))) {
            throw new Error(`Insufficient balance. Need: ${ethers.utils.formatUnits(amountInBigInt, 18)} ETH, Have: ${ethBalance}`);
          }
        }
      }

      // Chuẩn bị giao dịch swap
      setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.SWAPPING);

      const tx: any = {
        data: encodedSwapData,
        from: signerAddress,
        to: routerContract,
      };

      if (swapData.tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        tx.value = BigInt(amountIn);
        // console.log('Swap ETH transaction details:', {
        //   value: ethers.utils.formatEther(tx.value.toString()),
        //   to: routerContract,
        //   from: signerAddress
        // });
      }

      // Ước tính gas và thêm buffer
      console.log('Estimating gas...');
      try {
        const gasEstimate = await signer?.estimateGas(tx);
        console.log('Gas estimate:', gasEstimate?.toString());
        tx.gasLimit = gasEstimate?.mul(150).div(100); // Thêm 50% buffer
      } catch (gasError: any) {
        console.error('Gas estimation error:', gasError);
        throw new Error('Cannot estimate gas. Please reduce the swap amount or increase slippage.');
      }

      // console.log('Executing swap transaction with parameters:', tx);
      const executeSwapTx = await signer?.sendTransaction(tx);
      // console.log('Swap transaction sent:', executeSwapTx?.hash);

      const executeSwapTxReceipt = await executeSwapTx?.wait();
      // console.log('Swap transaction result:', executeSwapTxReceipt);

      if (!executeSwapTxReceipt?.status) {
        throw new Error('Swap transaction failed');
      }
    } catch (error: any) {
      console.error('Swap execution error:', error);
      throw error;
    }
  };

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
      return BigNumber.from(0)
    }

    // Convert lots to BigNumber with 18 decimals
    let lotsInWei;
    try {
      if (lots) {
        lotsInWei = ethers.utils.parseEther(lots)
      } else {
        lotsInWei = ethers.utils.parseEther('0')
      }
    } catch (e) {
      console.error("Error converting lots to BigNumber:", e)
      lotsInWei = ethers.utils.parseEther(`${Number(lots).toFixed(18)}`)
    }

    if (principalBalance > 0) {
      if (enabled === true) {
        const lotsAmount = BigNumber.from(pricePerLot).mul(lotsInWei).div(ethers.constants.WeiPerEther)
        const profitAmount = BigNumber.from(optionBalance).add(BigNumber.from(couponBalance))
        if (lotsAmount.gt(profitAmount)) {
          return lotsAmount.sub(profitAmount)
        }
        return BigNumber.from(0)
      } else {
        return BigNumber.from(pricePerLot).mul(lotsInWei)
      }
    }
    return BigNumber.from(pricePerLot).mul(lotsInWei)
  }, [principalBalance, status, lots, enabled, optionBalance, couponBalance])

  const depositButtonLabel = useMemo(() => {
    if (status !== 1) {
      return "Unavailable"
    }
    if (principalBalance > 0) {
      return `DEPOSIT ${ethers.utils.formatUnits(depositAmount)} ${tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label}`
    }
    return `DEPOSIT ${ethers.utils.formatUnits(depositAmount)} ${tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label}`
  }, [principalBalance, status, depositAmount, selectedAddressCurrency])

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

  // useEffect(() => {
  //   if (selectedAddressCurrency && currencyAddress) {

  //   }
  // }, [selectedAddressCurrency, currencyAddress])

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
          setMaxLots(ethers.utils.formatUnits(currencyBalance, _decimals))
          setWalletBalance(Number(ethers.utils.formatUnits(currencyBalance, _decimals)))

        } catch (e) {
          console.error(e)
        }
      }
    })()
  }, [productAddress, signer, address])

  useEffect(() => {
    let lotsInWei: ethers.BigNumber;
    try {
      if (lots) {
        lotsInWei = ethers.utils.parseEther(lots)
      } else {
        lotsInWei = ethers.utils.parseEther('0')
      }
    } catch (e) {
      console.error("Error converting lots to BigNumber:", e)
      lotsInWei = ethers.utils.parseEther(`${Number(lots).toFixed(18)}`)
    }
    const fetchRoute = async () => {
      const token = tokensForCurrentChain.find(token => token.value === selectedAddressCurrency);
      // const amountIn = BigInt(Number(lots)) * BigInt(10 ** (token?.decimals || 0));
      const _amountIn = BigNumber.from(lotsInWei)
      // console.log("fetchRoute amountIn: ", amountIn)
      if (selectedAddressCurrency && currencyAddress && BigNumber.from(lotsInWei).gt(BigNumber.from(0))) {
        const KYBER_API = process.env.NEXT_PUBLIC_KYBER_API;
        const CHAIN_ID = chainId
        let CHAIN_NAME = ""
        if (CHAIN_ID === SUPPORT_CHAIN_IDS.ETH) {
          CHAIN_NAME = "ethereum"
        } else if (CHAIN_ID === SUPPORT_CHAIN_IDS.BASE) {
          CHAIN_NAME = "base"
        }
        try {
          // 1. Get route first
          const token = tokensForCurrentChain.find(token => token.value === selectedAddressCurrency);
          // const amountIn = BigInt(Number(lots)) * BigInt(10 ** (token?.decimals || 0));
          const _amountIn = BigNumber.from(lotsInWei).mul(BigNumber.from(10).pow(BigNumber.from(token?.decimals || 0))).div(BigNumber.from(10).pow(BigNumber.from(18)))
          const routeUrl = `${KYBER_API}/${CHAIN_NAME}/api/v1/routes`;
          const routeParams = {
            tokenIn: selectedAddressCurrency,
            tokenOut: currencyAddress,
            amountIn: _amountIn.toString(), // Example amount
            to: ethers.constants.AddressZero,
            slippage: 100, // Example slippage
            deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
            chainId: CHAIN_ID,
          };

          const routeResponse = await axios.get(routeUrl, { params: routeParams });
          const routeData: any = routeResponse.data;

          // Get the signer's address
          const signerAddress = await signer?.getAddress();

          // console.log("routeData")
          // console.log(routeData.data.routeSummary.amountOutUsd)

          setAmountOutUsd(routeData.data.routeSummary.amountOutUsd)
          // 2. Build route
          const buildUrl = `${KYBER_API}/${CHAIN_NAME}/api/v1/route/build`;
          const buildParams = {
            routeSummary: routeData.data.routeSummary,
            sender: signerAddress,
            recipient: signerAddress,
            slippageTolerance: 15 // 0.15%
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

    // Only fetch route if product.currencyName is not the same as the selected currency
    if (selectedAddressCurrency !== '' && product?.currencyName.toLowerCase() !== tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label.toLowerCase()) {
      fetchRoute();
    }
  }, [selectedAddressCurrency, currencyAddress, lots, product.currencyName]);

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

  const provider = useMemo(() => {
    if (chainId === SUPPORT_CHAIN_IDS.BASE) {
      return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_MORALIS_KEY_BASE);
    }
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_MORALIS_KEY_ETH);
  }, [chainId]);

  const getETHBalance = async (address: string) => {
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
            // console.log({ swapData });
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


            // console.log({ tokenIn: swapData.tokenIn });

            // Add balance check

            // console.log({
            //   tokenIn: swapData.tokenIn,
            //   tokenInLower: swapData.tokenIn.toLowerCase(),
            // });

            if (swapData.tokenIn.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
              const tokenContract = new ethers.Contract(swapData.tokenIn, ERC20ABI, signer);
              const decimals = await tokenContract.decimals();
              const balance = await tokenContract.balanceOf(signerAddress);
              const amountInBigInt = BigInt(amountIn);

              // console.log({
              //   balance1: ethers.utils.formatUnits(balance, decimals),
              //   required: ethers.utils.formatUnits(amountInBigInt, decimals),
              //   address: signerAddress
              // });

              // console.log("WETH Balance:", ethers.utils.formatUnits(balance, 18));

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
              // console.log("ETH Balance:", ethBalance);

              // console.log({
              //   balance2: ethBalance,
              //   required: ethers.utils.formatUnits(amountInBigInt, 18),
              //   address: signerAddress
              // });

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
            // console.log(`Executing the swap tx on-chain: `);
            // console.log({ txBody: tx });

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

  // Update when chainId changes
  useEffect(() => {
    // Get tokens for the current chain
    const tokens = getTokensForChain(chainId)
    // Find token matching product.currencyName or default to first token
    const matchingToken = tokens.find(token => token.label === product.currencyName)
    setSelectedAddressCurrency(matchingToken?.value || tokens[0].value)
  }, [chainId, product.currencyName])

  const formatBalanceForCurrency = (balance: number, currencyName: string) => {
    // Get tokens for current chain
    const tokens = getTokensForChain(chainId);
    // Find matching token by label
    const token = tokens.find(t => t.label === currencyName);

    if (token) {
      // Use the token's decimals to format the balance
      return balance.toLocaleString(undefined, {
        minimumFractionDigits: token.decimals > 8 ? 4 : Math.min(token.decimals, 6),
        maximumFractionDigits: token.decimals > 8 ? 4 : Math.min(token.decimals, 6)
      });
    }
    return balance.toLocaleString();
  }

  useEffect(() => {
    (async () => {
      if (signer && address && selectedAddressCurrency) {
        try {
          // If it's ETH/native token
          if (selectedAddressCurrency.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            const balance = await provider.getBalance(address);
            const _walletBalance = ethers.utils.formatEther(balance);
            setWalletBalance(Number(_walletBalance));
            setMaxLots(_walletBalance);
            if (lots > _walletBalance) {
              setLots(_walletBalance);
            }
            setLoadingSelectedAddressCurrency(false);
          } else {
            // For other ERC20 tokens
            const tokenContract = new ethers.Contract(selectedAddressCurrency, ERC20ABI, signer);
            const decimals = await tokenContract.decimals();
            const balance = await tokenContract.balanceOf(address);
            const _walletBalance = ethers.utils.formatUnits(balance, decimals);
            setWalletBalance(Number(_walletBalance));
            setMaxLots(_walletBalance);
            if (lots > _walletBalance) {
              setLots(_walletBalance);
            }
            setLoadingSelectedAddressCurrency(false);
          }
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, [signer, address, selectedAddressCurrency, provider]);

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
              href={product.currencyName === "lvlUSD"
                ? "https://app.level.money/buy"
                : "https://deposit.ethereal.trade/points"}
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

            <div className={`flex flex-col w-full`}>
              <div className={"mt-8 flex items-center justify-between"}>
                <div className={"text-[#494D51] text-[16px]"}>Input</div>
                <div className={"flex items-center gap-1"}>

                  <div>
                    <span className={"mr-1"}>Balance: </span>
                    <span className="font-medium">
                      {formatBalanceForCurrency(walletBalance, product.currencyName)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`ml-2 text-[#828A93] cursor-pointer ${walletBalance === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => walletBalance > 0 && setLots(maxLots)}
                    >
                      MAX
                    </span>
                  </div>
                </div>
              </div>

              <div className={`relative flex items-center mt-2 h-[50px] overflow-hidden bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded ${Number(lots) > Number(maxLots) ? 'border-red-500' : ''}`}>
                <div className={"flex-1"}>
                  <input
                    className={
                      `w-full py-3 px-4 h-[50px] bg-[#FBFBFB] border-none focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 [-moz-appearance:textfield]`
                    }
                    value={lots}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 0) {
                        // If value >= maxLots, set maxLots
                        setLots(e.target.value);
                      }
                    }}
                    type='number'
                    step='1.00'
                    min={0}
                    disabled={loadingSelectedAddressCurrency}
                  />
                </div>
                <div className={"flex items-center justify-end"}>
                  {selectedAddressCurrency !== "" && (
                    <select
                      className={"w-full py-3 px-4 h-[50px] bg-[#FBFBFB] border-none focus:outline-none appearance-none"}
                      onChange={(e) => {
                        setSelectedAddressCurrency(e.target.value);
                        setLoadingSelectedAddressCurrency(true);
                      }}
                      defaultValue={selectedAddressCurrency}
                    >
                      {tokensForCurrentChain.map((token) => (
                        <option key={token.value} value={token.value}>
                          {token.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {/* <span className={"absolute right-4 text-[#828A93]"}></span> */}
                </div>
              </div>
              {Number(lots) > Number(maxLots) && (
                <div className={"mt-4 text-red-700 text-[10px] text-right"}>
                  Maximum deposit amount is {maxLots} {tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label}
                </div>
              )}
              {Number(lots) <= Number(maxLots) && (
                <>
                  {product?.currencyName.toLowerCase() !== tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label.toLowerCase() && (
                    <div className={"mt-4 text-red-700 text-[10px] text-right"}>
                      From {lots} {tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label},
                      Swap via KyperSwap to get {Number(amountOutUsd.toLocaleString()).toFixed(2)} {product.currencyName}
                      <br />
                      Redeem {Number(amountOutUsd.toLocaleString()).toFixed(2)} {product.currencyName} at maturity
                    </div>
                  )}
                </>
              )}

              {/* <div className={"mt-3"}>
                <span className={"text-[#828A93] text-[16px] leading-[16px]"}>Amount Out:{' '}
                  <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                    {amountOutUsd.toLocaleString()} {product.currencyName}
                  </span>
                </span>
              </div> */}
              <div>
              {/* <PrimaryButton
                label="Swap"
                onClick={handleSwap}
              /> */}
              </div>
              {/* <div className={"mt-3 flex justify-between items-center text-[#828A93]"}>
                <div className={"flex items-center"}>
                  <Image src={"/miniUSDC.svg"} alt={"miniUSDC"} width={20} height={20} />
                  <span className={"ml-2"}>{(pricePerLot * lots).toLocaleString()} USDC</span>
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
              </div> */}

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

            {/* <div className="flex justify-between mt-5">
              <Switch.Group>
                <div className="flex items-center">
                  <Switch
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
                  <Switch.Label className="ml-3">Include profits</Switch.Label>
                </div>
              </Switch.Group>
              <div>
                <span className={"mr-1"}>Balance: </span>
                <span className="font-medium">{walletBalance.toLocaleString()}</span>
              </div>
            </div> */}

            {/* <div className={`${expand ? "" : "hidden"} md:block mt-5`}>
              <PrimaryButton label={depositButtonLabel} disabled={status !== 1 || walletBalance === 0} onClick={() => setIsOpen(true)} />
            </div> */}

            <div className={`${expand ? "" : "hidden"} md:block mt-5`}>
              <PrimaryButton
                label={depositButtonLabel}
                onClick={onSwapAndDeposit}
                disabled={
                  isLoadingSwapAndDeposit ||
                  loadingSelectedAddressCurrency ||
                  status !== 1 ||
                  walletBalance === 0 ||
                  lots === '0' ||
                  Number(routeData?.data?.buildData?.amountOut) === 0 ||
                  Number(`${lots}`) > Number(`${maxLots}`)
                }
                loading={isLoadingSwapAndDeposit}
              />
            </div>

            {!expand && (
              <div className={"block md:hidden w-full pb-5"}>
                {/* <div className={"mt-2 mb-3"}>
                  <span className={"text-[#828A93] text-[16px] leading-[16px]"}>Amount Out:{' '}
                    <span className={"text-[#161717] text-[22px] leading-[22px] mt-3"}>
                      {amountOutUsd.toLocaleString()} {product.currencyName}
                    </span>
                  </span>
                </div> */}
                {/* <PrimaryButton label={"DEPOSIT"} onClick={() => setExpand(true)} /> */}
                <PrimaryButton
                  label={depositButtonLabel}
                  onClick={onSwapAndDeposit}
                  disabled={isLoadingSwapAndDeposit}
                  loading={isLoadingSwapAndDeposit}
                />
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
          <div className={"flex mt-2 md:mt-7 items-center justify-center"}>
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

      {/* OLD DEPOSIT */}
      <Transition appear show={false} as={Fragment}>
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
                    {/* Case 1: Need to swap first - 3 steps */}
                    {needsSwap && (
                      <>
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.NONE && "Prepare for deposit"}
                        {routeData?.data?.tokenIn.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? (
                          <>
                          {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.SWAP_APPROVE &&
                            `Step 1/4: Approve ${tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label} spend from your wallet for swap`
                          }
                          {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.SWAPPING &&
                            `Step 2/4: Swapping ${tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label} to ${product.currencyName}`
                          }
                          {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSIT_APPROVE &&
                            `Step 3/4: Approve ${product.currencyName} spend from your wallet`
                          }
                          {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSITING &&
                            `Step 3/4: Depositing ${product.currencyName}`
                          }
                          </>
                        ) : (
                          <>
                            {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.SWAPPING &&
                              `Step 1/3: Swapping ${tokensForCurrentChain.find(token => token.value === selectedAddressCurrency)?.label} to ${product.currencyName}`
                            }
                            {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSIT_APPROVE &&
                              `Step 2/3: Approve ${product.currencyName} spend from your wallet`
                            }
                            {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSITING &&
                              `Step 3/3: Depositing ${product.currencyName}`
                            }
                          </>
                        )}
                      </>
                    )}

                    {/* Case 2: Direct deposit - 2 steps */}
                    {!needsSwap && (
                      <>
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.NONE && "Prepare for deposit"}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSIT_APPROVE &&
                          `Step 1/2: Approve ${product.currencyName} spend from your wallet`
                        }
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSITING &&
                          `Step 2/2: Depositing ${product.currencyName}`
                        }
                      </>
                    )}

                    {/* Common status */}
                    {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DONE && "Deposit Successful"}
                  </Dialog.Title>
                  <div className='mt-7 flex flex-col items-center'>

                    {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DONE ? (
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
                        setSwapAndDepositStatus(SWAP_AND_DEPOSIT_STATUS.NONE)
                      }}
                    >
                      DONE
                    </button>
                    {depositStatus !== DEPOSIT_STATUS.DONE && (
                      <button
                        type='button'
                        className={`opacity-50 cursor-not-allowed flex flex-1 items-center justify-center border border-transparent bg-[#292929] px-4 py-2 text-sm font-medium text-white rounded-[8px] h-full
                        `}
                        // onClick={onApprove}
                        disabled
                      >
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
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSIT && "DEPOSIT"}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.SWAPPING && "SWAPPING"}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSITING && "DEPOSITING"}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DONE && "SUCCESS"}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.NONE && "PREPARING..."}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.SWAP_APPROVE && "APPROVE FOR SWAP"}
                        {swapAndDepositStatus === SWAP_AND_DEPOSIT_STATUS.DEPOSIT_APPROVE && "APPROVE FOR DEPOSIT"}
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