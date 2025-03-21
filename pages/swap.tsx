import { ethers } from "ethers";
import { ChangeEvent, useEffect, useState } from "react";
import { useNetwork, useSigner } from "wagmi";
import { PrimaryButton } from "../components/basic";
import axios from "../service/axios";
import { SUPPORT_CHAIN_IDS } from "../utils/enums";
import ERC20ABI from "../utils/abis/ERC20.json";
const { AddressZero } = ethers.constants;

const Swap = () => {
    const { data: signer } = useSigner();
    const { chain } = useNetwork();
    const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ETH;
    const params = {
        "tokenIn": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",  // selector
        "tokenOut": "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3", // currency address
        "amountIn": "100000000000000", // 0,0001
        "slippage": 100 // 0,1%
      }

    const createTX = async () => {
        const KYBER_API = process.env.KYBER_API || 'https://aggregator-api.kyberswap.com';
        const CHAIN_ID = process.env.CHAIN_ID || '1'; // Arbitrum One
        const CHAIN_NAME = process.env.CHAIN_NAME || 'ethereum';
        try {
            // 1. Get route first
            const routeUrl = `${KYBER_API}/${CHAIN_NAME}/api/v1/routes`;
            const routeParams = {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            to: AddressZero,
            slippage: params.slippage,
            deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
            chainId: CHAIN_ID,
            };

            // console.log({ routeUrl, routeParams });

            const routeResponse = await axios.get(routeUrl, { params: routeParams });
            const routeData: any = routeResponse.data;

            // Get the signer's address
            // const signer = getSigner()
            const signerAddress = await signer?.getAddress();


            // console.log({ routeData, routeSummary: JSON.stringify(routeData.data.routeSummary) });

            // 2. Build route
            const buildUrl = `${KYBER_API}/${CHAIN_NAME}/api/v1/route/build`;
            const buildParams = {
            routeSummary: routeData.data.routeSummary,
            sender: signerAddress,
            recipient: signerAddress,
            slippageTolerance: 10 //0.1%
        }
            const buildResponse = await axios.post(buildUrl, {
            ...buildParams
            });

            // console.log({ buildUrl, buildParams });

            return {
            success: true,
            // data: buildResponse.data,
            data: {
                routeData: {
                ...routeData?.data
                },
                buildData: {
                ...buildResponse.data?.data
                },
                tokenIn: params.tokenIn
            },
            };
            } catch (error: any) {
            return {
            success: false,
            error: error?.message || 'Unknown error occurred',
            };
            }
            };


    const submitTX = async () => {
        if (!signer) {
            return {
                success: false,
                error: 'No signer found',
            }
        }
        const response = await createTX();
        console.log({ response });
        const swapData = response.data;
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

    return (
        <div>
            <h1>Swap</h1>
            <div>
                <button onClick={createTX}>Create TX</button>
            </div>
            <div>
                <button onClick={submitTX}>Submit TX</button>
            </div>


           
        </div>
    );
};

export default Swap;
