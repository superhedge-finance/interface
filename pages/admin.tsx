import { ethers } from "ethers";
import { ChangeEvent, useEffect, useState } from "react";
import { useNetwork, useSigner } from "wagmi";
import { PrimaryButton } from "../components/basic";
import axios from "../service/axios";
import { SUPPORT_CHAIN_IDS } from "../utils/enums";

const Admin = () => {
    const { data: signer } = useSigner();
    const [isOpen, setIsOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [adminProductAddress, setAdminProductAddress] = useState<string>("");
    const [unwindMargin, setUnwindMargin] = useState<string>("");
    const [currentUnwindMargin, setCurrentUnwindMargin] = useState<string>("");
    const [signature, setSignature] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [expired, setExpired] = useState(false);
    const { chain } = useNetwork();
    const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ETH;
    const [holderList, setHolderList] = useState<string[]>([]);
    const [balanceList, setBalanceList] = useState<number[]>([]);
    const [withdrawalProductAddress, setWithdrawalProductAddress] = useState<string>("");
    const [earlyWithdrawalProductAddress, setEarlyWithdrawalProductAddress] = useState<string>("");
    const [couponProductAddress, setCouponProductAddress] = useState<string>("");
    
    // Add states for checking expired status
    const [isChecking, setIsChecking] = useState(false);
    const [isEarlyWithdrawalChecked, setIsEarlyWithdrawalChecked] = useState(false);
    const [earlyWithdrawalErrorMessage, setEarlyWithdrawalErrorMessage] = useState("");
    const closeModal = () => setIsOpen(false);

    // Fetch the current unwind margin based on the product address
    const fetchCurrentUnwindMargin = async () => {
        if (!adminProductAddress) return;
        try {
            const response = await axios.post(`/products/get-unwind-margin?chainId=${chainId}&productAddress=${adminProductAddress}`);
            const { unwindMargin } = response.data;
            setCurrentUnwindMargin(unwindMargin);
            setUnwindMargin(unwindMargin);
        } catch (error) {
            console.error("Error fetching current unwind margin:", error);
        }
    };

    // New function to check expired status with validation
    const checkExpiredStatus = async () => {
        if (!earlyWithdrawalProductAddress) return;
        
        setIsChecking(true);
        setEarlyWithdrawalErrorMessage("");
        try {
            const response = await axios.get(`/products/check-expired-early-withdraw?chainId=${chainId}&productAddress=${earlyWithdrawalProductAddress}`);
            // If successful response, mark as checked and set initial expired value
            console.log('response.data', response.data);
            if (response.data === 'Product not found or early withdraw check failed') {
                setEarlyWithdrawalErrorMessage("Product not found or early withdraw check failed");
                setIsEarlyWithdrawalChecked(false);
            } else {
                setExpired(response.data.expiredFlag);
                setIsEarlyWithdrawalChecked(true);
            }
        } catch (error) {
            console.error("Error checking early withdrawal status:", error);
            setEarlyWithdrawalErrorMessage("Failed to verify product address. Please check the address and try again.");
            setIsEarlyWithdrawalChecked(false);
        } finally {
            setIsChecking(false);
        }
    };

    const fetchCoupon = async () => {
        if (!couponProductAddress) return;
        try {
            const response = await axios.post(`/products/get-token-holder-list-final?chainId=${chainId}&productAddress=${couponProductAddress}`);
            setHolderList(response.data.ownerAddresses);
            setBalanceList(response.data.balance || []);
        } catch (error) {
            console.error("Error fetching coupon:", error);
        }
    };

    // Fetch data when product address changes
    useEffect(() => {
        fetchCurrentUnwindMargin();
        fetchCoupon();
    }, [adminProductAddress]);

    // Handle confirmation of unwind margin change
    const handleConfirm = async () => {
        if (!signer || !unwindMargin || !adminProductAddress) return;
        setIsFetching(true);
        try {
            const message = ethers.utils.solidityKeccak256(["uint256"], [unwindMargin]);
            const signature = await signer.signMessage(ethers.utils.arrayify(message));
            setSignature(signature);

            await axios.post(`/products/change-unwind-margin?chainId=${chainId}&productAddress=${adminProductAddress}&unwindMarginValue=${unwindMargin}&signatureAdmin=${signature}`);
            setIsOpen(true);
        } catch (error) {
            console.error("Error during confirmation:", error);
        } finally {
            setIsFetching(false);
        }
    };

    // Handle confirmation of expired status change
    // const handleConfirmExpired = async () => {
    //     if (!signer || !withdrawalProductAddress) return;
    //     setIsFetching(true);
    //     try {
    //         const message = ethers.utils.solidityKeccak256(["bool"], [expired]);
    //         const signature = await signer.signMessage(ethers.utils.arrayify(message));
    //         setSignature(signature);

    //         await axios.post(`/products/change-expired-flag?chainId=${chainId}&productAddress=${withdrawalProductAddress}&expiredFlag=${expired}&signatureAdmin=${signature}`);
    //         setIsOpen(true);
    //     } catch (error) {
    //         console.error("Error during confirmation:", error);
    //     } finally {
    //         setIsFetching(false);
    //     }
    // };

    

    const handleConfirmExpired = async () => {
        setIsFetching(true);
        try {
            console.log('chainId', chainId);
            console.log('earlyWithdrawalProductAddress', earlyWithdrawalProductAddress);
            console.log('expired', expired);
            await axios.post(`/products/change-early-withdraw-flag?chainId=${chainId}&productAddress=${earlyWithdrawalProductAddress}&earlyWithdrawFlag=${expired}`);
            setIsOpen(true);
        } catch (error) {
            console.error("Error during confirmation:", error);
        } finally {
            setIsFetching(false);
        }
    };

    // Reset withdrawal check when address changes
    useEffect(() => {
        setIsEarlyWithdrawalChecked(false);
        setEarlyWithdrawalErrorMessage("");
    }, [withdrawalProductAddress]);

    // Validate unwind margin input
    const handleUnwindMarginChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (Number(value) >= 1 && Number(value) <= 1000)) {
            setUnwindMargin(value);
            setErrorMessage("");
        } else {
            setErrorMessage("Please enter a value between 1 and 1000.");
        }
    };

    // Handle expired status change
    const handleExpiredChange = (e: ChangeEvent<HTMLInputElement>) => {
        setExpired(e.target.value === "Yes");
    };

    return (
        <div className="py-[84px] flex justify-center">
            <div className="max-w-[650px] w-full">
                {/* Admin UI Section */}
                <div className="flex flex-col items-center w-full bg-white rounded-[16px]">
                    <div className="relative w-full h-[230px] rounded-[16px] bg-dark-gradient">
                        <img src="/profile/banner.svg" alt="profile banner" className="absolute right-0 top-0" />
                        <span className="text-[44px] leading-[44px] text-whitenew-100 absolute left-[45px] bottom-[40px] max-w-[300px]">
                            Admin
                        </span>
                    </div>
                    <div className="flex flex-col w-full px-[80px] py-[56px]">
                        {/* Input for Product Address */}
                        <input
                            type="text"
                            value={adminProductAddress || ""}
                            onChange={(e) => setAdminProductAddress(e.target.value)}
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
                            value={unwindMargin || ""}
                            onChange={handleUnwindMarginChange}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter new unwind margin"
                        />

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="text-red-500 mb-2">{errorMessage}</div>
                        )}

                        <PrimaryButton
                            label={isFetching ? 'Processing...' : 'Confirm'}
                            className="mt-10 max-w-[220px]"
                            onClick={handleConfirm}
                            disabled={!unwindMargin || !!errorMessage}
                        />
                    </div>
                </div>

                {/* Early Withdrawal UI Section */}
                <div className="flex flex-col items-center w-full bg-white rounded-[16px] mt-8">
                    <div className="relative w-full h-[230px] rounded-[16px] bg-dark-gradient">
                        <img src="/profile/banner.svg" alt="profile banner" className="absolute right-0 top-0" />
                        <span className="text-[44px] leading-[44px] text-whitenew-100 absolute left-[45px] bottom-[40px] max-w-[300px]">
                            Early Withdrawal
                        </span>
                    </div>
                    <div className="flex flex-col w-full px-[80px] py-[56px]">
                        {/* Input for Product Address */}
                        <input
                            type="text"
                            value={earlyWithdrawalProductAddress || ""}
                            onChange={(e) => setEarlyWithdrawalProductAddress(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter product address"
                        />
                        
                        {/* Check Button below the input */}
                        <PrimaryButton
                            label={isChecking ? "Checking..." : "Check"}
                            onClick={checkExpiredStatus}
                            disabled={!earlyWithdrawalProductAddress || isChecking}
                            className="mb-6"
                        />

                        {/* Error message for withdrawal check */}
                        {earlyWithdrawalErrorMessage && (
                            <div className="text-red-500 mb-4">{earlyWithdrawalErrorMessage}</div>
                        )}

                        {/* Only show these UI elements after a successful check */}
                        {isEarlyWithdrawalChecked && (
                            <>
                                {/* Display Is Expired as Radio Buttons */}
                                <div className="mb-4">
                                    <strong>Check early withdraw enabled:</strong>
                                    <div>
                                        <label>
                                            <input
                                                type="radio"
                                                value="Yes"
                                                checked={expired === true}
                                                onChange={handleExpiredChange}
                                            />
                                            Turned On
                                        </label>
                                        <label className="ml-4">
                                            <input
                                                type="radio"
                                                value="No"
                                                checked={expired === false}
                                                onChange={handleExpiredChange}
                                            />
                                            Turned Off
                                        </label>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="text-red-500 mb-2">{errorMessage}</div>
                                )}

                                <PrimaryButton
                                    label={isFetching ? 'Processing...' : 'Switch'}
                                    className="mt-10 max-w-[220px]"
                                    onClick={handleConfirmExpired}
                                    disabled={isFetching}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Coupon UI Section */}
                <div className="flex flex-col items-center w-full bg-white rounded-[16px] mt-8">
                    <div className="relative w-full h-[230px] rounded-[16px] bg-dark-gradient">
                        <img src="/profile/banner.svg" alt="profile banner" className="absolute right-0 top-0" />
                        <span className="text-[44px] leading-[44px] text-whitenew-100 absolute left-[45px] bottom-[40px] max-w-[300px]">
                            Coupon
                        </span>
                    </div>
                    <div className="flex flex-col w-full px-[80px] py-[56px]">
                        {/* Input for Product Address */}
                        <input
                            type="text"
                            value={couponProductAddress || ""}
                            onChange={(e) => setCouponProductAddress(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter product address"
                        />

                        {/* Display Fetched Coupon List */}
                        <div className="mb-4">
                            <strong>Coupon List:</strong>
                            <ul>
                                {holderList.map((address: string, index) => (
                                    <li key={index}>{address}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Conditionally render Confirm button if holderList is not empty */}
                        {holderList.length > 0 && (
                            <PrimaryButton
                                label="Confirm"
                                className="mt-4 max-w-[220px]"
                                onClick={() => console.log('Confirm button clicked')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
