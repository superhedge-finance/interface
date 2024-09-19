import React, { Fragment, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { PrimaryButton } from "../components/basic"; // Adjust the import according to your file structure
import axios from "../service/axios"; // Adjust according to your file structure
import { Dialog, Transition } from "@headlessui/react";
import { useAccount, useSigner, useNetwork } from "wagmi";
import { SUPPORT_CHAIN_IDS } from "../utils/enums";
import ProductABI from "../utils/abis/SHProduct.json";

const Admin = () => {
    const { data: signer } = useSigner();
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<{ ownerAddressArray: string[]; balanceTokenArray: number[] } | null>(null); // Change to arrays
    const [isFetching, setIsFetching] = useState(false);
    const [productAddress, setProductAddress] = useState(""); // State for product address input
    const { chain } = useNetwork();
    const chainId = useMemo(() => {
        if (chain) return chain.id;
        return SUPPORT_CHAIN_IDS.ARBITRUM;
      }, [chain]);
    const closeModal = () => {
        setIsOpen(false);
        setData(null); // Reset data when closing the modal
    };

    const handleGetList = async () => {
        setIsFetching(true);
        try {
            const response = await axios.post(`/products/get-holder-list?tokenAddress=${productAddress}&chainId=${chainId}`);
            const balanceTokenArray: number[] = response.data.balanceToken.map(Number).slice(1);
            const ownerAddressArray: string[] = response.data.ownerAddress.map(String).slice(1);
            // Set data with fetched values
            setData({ ownerAddressArray: ownerAddressArray, balanceTokenArray: balanceTokenArray });
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleConfirm = async () => {
        if (data && signer && productAddress) {
            // Interact with wallet to sign the transaction here
            console.log("Confirming with data:", data);
            const productInstance = new ethers.Contract(productAddress, ProductABI, signer);
            const tx = await productInstance.coupon(data.ownerAddressArray,data.balanceTokenArray )
            await tx.wait()
            console.log(tx.hash)

        }
    };

    return (
        <div className={"py-[84px] flex justify-center"}>
            <div className={"max-w-[650px] w-full"}>
                <div className={"flex flex-col items-center w-full bg-white rounded-[16px]"}>
                    <div className={"relative w-full h-[230px] rounded-[16px] bg-dark-gradient"}>
                        <img src={"/profile/banner.svg"} alt={"profile banner"} className={"absolute right-0 top-0"} />
                        <span className={"text-[44px] leading-[44px] text-whitenew-100 absolute left-[45px] bottom-[40px] max-w-[300px]"}>
                            Admin
                        </span>
                    </div>
                    <div className={"flex flex-col w-full px-[80px] py-[56px]"}>
                        {/* Product Address Input */}
                        <input
                            type="text"
                            value={productAddress}
                            onChange={(e) => setProductAddress(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter product address"
                        />

                        {/* Get List Button */}
                        <PrimaryButton 
                            label={isFetching ? 'Fetching...' : 'Get List'} 
                            className={"mt-6"} 
                            onClick={handleGetList} 
                        />

                        {/* Show fetched data */}
                        {data && (
                            <div className="mt-4">
                                <p>Owner Addresses: {data.ownerAddressArray.join(", ")}</p> {/* Display as a comma-separated list */}
                                <p>Balance Tokens: {data.balanceTokenArray.join(", ")}</p> {/* Display as a comma-separated list */}
                            </div>
                        )}

                        {/* Confirm Button */}
                        {data && (
                            <PrimaryButton 
                                label='Confirm' 
                                className={"mt-10 max-w-[220px]"} 
                                onClick={handleConfirm} 
                            />
                        )}

                        {/* Modal for confirmation */}
                        <Transition show={isOpen} as={Fragment}>
                            <Dialog onClose={closeModal} className='fixed inset-0 overflow-y-auto'>
                                <div className='flex min-h-full items-center justify-center p-4 text-center'>
                                    <Dialog.Panel className='w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white py-[60px] px-[160px] text-left align-middle shadow-xl transition-all'>
                                        <Dialog.Title className='text-[32px] font-medium leading-[40px] text-[#161717] text-center'>Confirmation</Dialog.Title>
                                        <div className='mt-4'>
                                            <p>Are you sure you want to confirm this action?</p>
                                        </div>
                                        <div className='mt-6'>
                                            <PrimaryButton label='Close' onClick={closeModal} />
                                        </div>
                                    </Dialog.Panel>
                                </div>
                            </Dialog>
                        </Transition>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;