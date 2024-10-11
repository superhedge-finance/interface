import React, { Fragment, useState, useEffect ,ChangeEvent} from "react";
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
    const [currentUnwindMargin, setCurrentUnwindMargin] = useState("");
    const [signature, setSignature] = useState("");
    const [errorMessage, setErrorMessage] = useState(""); // State for error message
    const { chain } = useNetwork();
    const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ARBITRUM;

    const closeModal = () => {
        setIsOpen(false);
    };

    // Function to fetch the current unwind margin based on the product address
    const fetchCurrentUnwindMargin = async () => {
        if (productAddress) {
            try {
                const response = await axios.post(`/products/get-unwind-margin?chainId=${chainId}&productAddress=${productAddress}`);
                console.log(response.data.unwindMargin)
                setCurrentUnwindMargin(response.data.unwindMargin); // Assuming the API returns unwindMargin
                setUnwindMargin(response.data.unwindMargin); // Set this to allow user to edit
            } catch (error) {
                console.error("Error fetching current unwind margin:", error);
            }
        }
    };

    // Fetch unwind margin when product address changes
    useEffect(() => {
        fetchCurrentUnwindMargin();
    }, [productAddress]);

    const handleConfirm = async () => {
        if (signer && unwindMargin && productAddress) {
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
                
                await axios.post(`/products/change-unwind-margin?chainId=${chainId}&productAddress=${productAddress}&unwindMarginValue=${unwindMargin}&signatureAdmin=${signature}`);
                setIsOpen(true);
            } catch (error) {
                console.error("Error during confirmation:", error);
            } finally {
                setIsFetching(false);
            }
        }
    };

    // Validate unwind margin input
    const handleUnwindMarginChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (Number(value) >= 1 && Number(value) <= 1000)) {
            setUnwindMargin(value);
            setErrorMessage(""); // Clear error message if valid
        } else {
            setErrorMessage("Please enter a value between 1 and 1000.");
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
                        {/* Input for Product Address */}
                        <input
                            type="text"
                            value={productAddress}
                            onChange={(e) => setProductAddress(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter product address"
                        />

                        {/* Display Current Unwind Margin */}
                        <div className="mb-4">
                            <strong>Current Unwind Margin:</strong> {currentUnwindMargin}
                        </div>

                        {/* Input for New Unwind Margin */}
                        <input
                            type="number"
                            value={unwindMargin}
                            onChange={handleUnwindMarginChange} // Use validation function here
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter new unwind margin"
                        />

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="text-red-500 mb-2">{errorMessage}</div>
                        )}

                        <PrimaryButton 
                            label={isFetching ? 'Processing...' : 'Confirm'} 
                            className={"mt-10 max-w-[220px]"} 
                            onClick={handleConfirm} 
                            disabled={!unwindMargin || !!errorMessage} // Disable if there's an error
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;