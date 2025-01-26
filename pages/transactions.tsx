import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "../service/axios";
import { SUPPORT_CHAIN_IDS } from "../utils/enums";
import { useNetwork, useAccount } from "wagmi";
interface Transaction {
    id: string;
    type: string;
    withdrawType: string;
    eventName:string;
    amount: string;
    currency: string;
    timestamp: string;
    status?: string;
    txHash?: string;
    decimals?: number;
}

const TRANSACTION_TYPES = [
    "[SuperHedge] Coupon Credited",
    "[SuperHedge] Early Withdraw - Option Payout (Airdrop)",
    "[SuperHedge] Option Payout Credit",
    "[SuperHedge] Principal Credit",
    "[User] Option Payout Withdraw",
    "[User] Principal Withdraw",    
    "[User] Principal Deposit",
    "[User] Coupon Withdraw",
    "[User] Early Withdraw - Confirm",
    "[User] Early Withdraw - Principal (Market Price)",
];

const TransactionHistory = () => {
    const { address } = useAccount();
    const { chain } = useNetwork();
    const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ETH;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedType, setSelectedType] = useState("All transactions");

    useEffect(() => {
        fetchTransactions();
    }, [selectedType]);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`/users/transaction-history/${address}?chainId=${chainId}`);
            const data = response.data.map((entry: any) => ({
                date: entry.transactionTime,
                transactions: entry.transactionHistory.map((transaction: any) => ({
                    id: transaction.txHash,
                    type: transaction.type,
                    withdrawType: transaction.withdrawType,
                    eventName: transaction.eventName,
                    // amount: parseFloat(transaction.amountInDecimal).toFixed(2),
                    amount: transaction.amountDecimal,
                    currency: transaction.tokenSymbol, // Assuming USDC, adjust if needed
                    timestamp: transaction.eventTime,
                    txHash: transaction.txHash,
                    decimals: transaction.decimals
                }))
            }));
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const groupTransactionsByDate = (transactions: any[]) => {
        return transactions.reduce((groups: { [key: string]: any[] }, entry) => {
            if (!groups[entry.date]) {
                groups[entry.date] = [];
            }
            groups[entry.date].push(...entry.transactions);
            return groups;
        }, {});
    };

    const filterTransactions = (transactions: any[]) => {
        return transactions.map(entry => ({
            ...entry,
            transactions: entry.transactions.filter((transaction: any) => {
                const matchesType = selectedType === "All transactions" || transaction.eventName === selectedType;
                const matchesSearch = searchQuery === "" || 
                    transaction.eventName.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesType && matchesSearch;
            })
        })).filter(entry => entry.transactions.length > 0);
    };

    return (
        <div className="max-w-[1200px] mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Transactions</h1>
                <div className="flex justify-between items-center">
                    <div className="md:flex md:items-center">
                        <div className="relative">
                            <button 
                                className="mr-4 px-4 py-2 rounded-lg bg-gray-100 flex items-center"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {selectedType}
                                <svg 
                                    className={`ml-2 h-5 w-5 transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-72 bg-white rounded-lg shadow-lg border">
                                    <div className="py-1">
                                        <button
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                            onClick={() => {
                                                setSelectedType("All transactions");
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            All transactions
                                        </button>
                                        {TRANSACTION_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                onClick={() => {
                                                    setSelectedType(type);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search assets..."
                                className="pl-8 pr-4 py-2 rounded-lg border"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>
                    {/* <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg border">CSV</button>
                        <button className="px-4 py-2 rounded-lg border">JSON</button>
                    </div> */}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                {Object.entries(groupTransactionsByDate(filterTransactions(transactions))).map(([date, transactions]) => (
                    <div key={date} className="border-b last:border-b-0">
                        <div className="px-6 py-4 bg-gray-50">
                            <h2 className="font-semibold">{date}</h2>
                        </div>
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="px-6 py-4 md:flex md:items-center md:justify-start hover:bg-gray-50"
                            >
                                <div className="flex items-center space-x-4 w-[260px]">
                                    <div className="flex flex-col w-[260px]">
                                        <div className="font-medium">
                                            {transaction.eventName} 
                                            {/* {transaction.withdrawType && transaction.withdrawType !== "NONE" ? ` ${transaction.withdrawType}` : ''} */}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(transaction.timestamp).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: 'numeric',
                                                hour12: true
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-start items-center space-x-4 flex-1">
                                    <div className="flex items-center justify-center ">
                                        <img src={`/currency/${transaction.currency.toLowerCase()}.svg`} alt="USDC" className="w-4 h-4 mr-2" />
                                        <span className="font-medium">
                                            {transaction.amount == 0 ? "Admin" : 
                                                `${transaction.eventName.includes("Deposit") ? "+ " : "- "} 
                                                ${(transaction.amount / 10 ** transaction.decimals).toFixed(2)} ${transaction.currency}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 w-[100px]">
                                    <a 
                                        href={transaction.txHash ? `https://etherscan.io/tx/${transaction.txHash}` : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-600"
                                    >
                                        View ↗
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionHistory;
