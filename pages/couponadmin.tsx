import { ethers } from "ethers";
import { ChangeEvent, useEffect, useState } from "react";
import { useNetwork, useSigner } from "wagmi";
import { PrimaryButton } from "../components/basic";
import axios from "../service/axios";
import { SUPPORT_CHAIN_IDS } from "../utils/enums";
import ProductABI from "../utils/abis/SHProduct.json";

const CouponAdmin = () => {
    const { data: signer } = useSigner();
    const [productAddress, setProductAddress] = useState<string>("");
    const [code, setCode] = useState<string>("");
    const [inputCode, setInputCode] = useState<string>("");
    const [arrayData, setArrayData] = useState<any[]>([]);
    const { chain } = useNetwork();
    const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ETH;
    const [productInstance, setProductInstance] = useState<any>(null);

    useEffect(() => {
        if (signer && productAddress) {
            const _productInstance = new ethers.Contract(productAddress, ProductABI, signer)
            setProductInstance(_productInstance)
        }
    }, [signer, productAddress])
    
// Fetch CODE based on the product address
    const fetchCode = async () => {
        if (!productAddress) return;
        try {
            const response = await axios.post(`products/get-token-holder-list-final?chainId=${chainId}&productAddress=${productAddress}`);
            // console.log(response.data);
            setCode(response.data);
        } catch (error) {
            console.error("Error fetching code:", error);
        }
    };

    // Fetch list based on the input code
    const fetchList = async () => {
        if (!inputCode) return;
        try {
            const response = await axios.get(`/coupon/get-coupon-list?couponAddressListId=${inputCode}`);

            // Assuming response.data is an array of objects with 'address' and 'balance' properties
            const formattedData = response.data.map((item: any) => ({
                address: item.address,
                balance: item.balance
            }));

            setArrayData(formattedData);

            console.log(response.data);
        } catch (error) {
            console.error("Error fetching list:", error);
        }
    };

    // Handle signature for each item in the array
    const handleSignature = async (address: string[], balance: string[]) => {
        if (!signer) return;
        console.log("handleSignature")
        try {
            // console.log(`Address: ${address}, Balance: ${balance}`);
            const issuanceCycle = await productInstance.issuanceCycle()
            const coupon = issuanceCycle[0]
            
            // Add coupon value to each balance
            const updatedBalances = balance.map(bal => 
                (Number(bal) * (coupon/10000))
            );
            
            // console.log("Original balances:", balance);
            // console.log("Address", address)
            // console.log("Updated balances:", updatedBalances);

            const tx = await productInstance.coupon(address, updatedBalances)
            await tx.wait()
           
        } catch (error) {
            console.error("Error signing item:", error);
        }
    };

    return (
        <div className="py-[84px] flex justify-center">
            <div className="max-w-[650px] w-full">
                <div className="flex flex-col items-center w-full bg-white rounded-[16px]">
                    <div className="relative w-full h-[230px] rounded-[16px] bg-dark-gradient">
                        <img src="/profile/banner.svg" alt="profile banner" className="absolute right-0 top-0" />
                        <span className="text-[44px] leading-[44px] text-whitenew-100 absolute left-[45px] bottom-[40px] max-w-[300px]">
                            Coupon Admin
                        </span>
                    </div>
                    <div className="flex flex-col w-full px-[80px] py-[56px]">
                        {/* Input for Product Address */}
                        <input
                            type="text"
                            value={productAddress || ""}
                            onChange={(e) => setProductAddress(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter product address"
                        />
                        <PrimaryButton
                            label="Get and Save List"
                            onClick={fetchCode}
                            className="mb-4"
                        />

                        {/* Display CODE below the button */}
                        {code && (
                            <div className="mb-4">
                                <strong>CODE:</strong> {code}
                            </div>
                        )}

                        {/* Input for CODE */}
                        <input
                            type="text"
                            value={inputCode || ""}
                            onChange={(e) => setInputCode(e.target.value)}
                            className="border rounded px-2 py-1 mb-4"
                            placeholder="Enter CODE"
                        />
                        <PrimaryButton
                            label="Get List"
                            onClick={fetchList}
                            className="mb-4"
                        />

                        {/* Display Number of Items */}
                        {arrayData.length > 0 && (
                            <div className="mb-4">
                                <strong>Number of items:</strong> {arrayData.length}
                            </div>
                        )}

                        {/* Sign Button for Each Item */}
                        {arrayData.length > 0 && (
                            <div className="mb-4">
                                {arrayData.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center mb-2">
                                        <span>Item {index + 1}</span>
                                        <PrimaryButton
                                            label="Sign"
                                            onClick={() => {
                                                console.log(`Address: ${item.address}, Balance: ${item.balance}`);
                                                handleSignature(item.address, item.balance);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CouponAdmin;
