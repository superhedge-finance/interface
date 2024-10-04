import React, { Fragment, useState } from "react";
import { ethers } from "ethers";
import { PrimaryButton } from "../components/basic";
import axios from "../service/axios";
import { Dialog, Transition } from "@headlessui/react";
import { useAccount, useSigner, useNetwork } from "wagmi";
import { SUPPORT_CHAIN_IDS } from "../utils/enums";

const Admin = () => {
    const { data: signer } = useSigner();
    const [isOpen, setIsOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [productAddress, setProductAddress] = useState("");
    const [unwindMargin, setUnwindMargin] = useState("");
    const [signature, setSignature] = useState("");
    const { chain } = useNetwork();
    const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ARBITRUM;

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleConfirm = async () => {
        if (signer && unwindMargin) {
            setIsFetching(true);
            try {
                // Create message to sign
                const message = ethers.utils.solidityKeccak256(
                    ["uint256"],
                    [unwindMargin]
                );

                // Sign the message
                const signature = await signer.signMessage(ethers.utils.arrayify(message));
                setSignature(signature);
                console.log(signature)

                await axios.post(`/products/change-unwind-margin?unwindMarginValue=${unwindMargin}&signatureAdmin=${signature}`);

                setIsOpen(true);
            } catch (error) {
                console.error("Error during confirmation:", error);
            } finally {
                setIsFetching(false);
            }
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
                        <input
                            type="number"
                            value={unwindMargin}
                            onChange={(e) => setUnwindMargin(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter unwind margin"
                        />

                        <PrimaryButton 
                            label={isFetching ? 'Processing...' : 'Confirm'} 
                            className={"mt-10 max-w-[220px]"} 
                            onClick={handleConfirm} 
                            disabled={!unwindMargin}
                        />

                        {/* <Transition show={isOpen} as={Fragment}>
                            <Dialog onClose={closeModal} className='fixed inset-0 overflow-y-auto'>
                                <div className='flex min-h-full items-center justify-center p-4 text-center'>
                                    <Dialog.Panel className='w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white py-[60px] px-[160px] text-left align-middle shadow-xl transition-all'>
                                        <Dialog.Title className='text-[32px] font-medium leading-[40px] text-[#161717] text-center'>Confirmation</Dialog.Title>
                                        <div className='mt-4'>
                                            <p>Off-chain signature successful!</p>
                                            <p>Signature: {signature}</p>
                                            <p>Product Address: {productAddress}</p>
                                            <p>Unwind Margin: {unwindMargin}</p>
                                        </div>
                                        <div className='mt-6'>
                                            <PrimaryButton label='Close' onClick={closeModal} />
                                        </div>
                                    </Dialog.Panel>
                                </div>
                            </Dialog>
                        </Transition> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;