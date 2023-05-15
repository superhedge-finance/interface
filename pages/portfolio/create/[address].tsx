import { forwardRef, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import DatePicker from "react-datepicker";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { BigNumber, ethers } from "ethers";
import { Logger } from "@ethersproject/logger";
import toast from "react-hot-toast";
import { PrimaryButton, SecondaryButton, TitleH2 } from "../../../components/basic";
import { getProduct } from "../../../service";
import { IProduct } from "../../../types";
import { getMarketplaceInstance, getNFTInstance } from "../../../utils/contract";
import "react-datepicker/dist/react-datepicker.css";
import ProductABI from "../../../utils/abis/SHProduct.json";
import NFTListedDialog from "../../../components/portfolio/NFTListedDialog";
import { USDC_ADDRESS } from "../../../utils/address";
import { DECIMAL } from "../../../utils/constants";
import { SUPPORT_CHAIN_IDS } from "../../../utils/enums";
import axios from "../../../service/axios";

const PortfolioCreatePage = () => {
  const router = useRouter();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { address: productAddress } = router.query;

  const [, setIsLoading] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [maxBalance, setMaxBalance] = useState(0);
  const [minBalance, setMinBalance] = useState(1);
  const [product, setProduct] = useState<IProduct | undefined>(undefined);
  const [marketplaceInstance, setMarketplaceInstance] = useState<ethers.Contract>();
  const [currentTokenId, setCurrentTokenId] = useState<BigNumber>();
  const [txPending, setTxPending] = useState(false);
  const [nftInstance, setNFTInstance] = useState<ethers.Contract>();
  const [lots, setLots] = useState(1);
  const [price, setPrice] = useState(0);
  const [startingTime, setStartingTime] = useState<Date>(new Date());
  const [imageURL, setImageURL] = useState("");

  // eslint-disable-next-line react/display-name,@typescript-eslint/no-unused-vars
  const CustomInput = forwardRef(({ value, onClick }: { value?: string; onClick?: () => void }, ref) => (
    <div className={"relative flex items-center"}>
      <div className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"} onClick={onClick}>
        {value}
      </div>
      <span className={"absolute right-4 text-[#828A93]"}>
        <Image src={"/icons/calendar.svg"} alt={"calendar"} width={20} height={20} />
      </span>
    </div>
  ));

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.GOERLI;
  }, [chain]);

  const productInstance = useMemo(() => {
    if (signer && productAddress) return new ethers.Contract(productAddress as string, ProductABI, signer);
    else return null;
  }, [signer, productAddress]);

  const onListNFT = async () => {
    if (product && product.status !== 3) {
      return toast.error("Your product is not issued yet. Please wait until issuance date");
    }
    if (address && signer && marketplaceInstance && nftInstance && product) {
      try {
        setTxPending(true);
        const isApprovedForAll = await nftInstance.isApprovedForAll(address, marketplaceInstance.address);
        if (!isApprovedForAll) {
          const approveTx = await nftInstance.setApprovalForAll(marketplaceInstance.address, true);
          await approveTx.wait();
        }

        const listTx = await marketplaceInstance.listItem(
          nftInstance.address,
          product.address,
          currentTokenId,
          lots,
          USDC_ADDRESS[chainId],
          ethers.utils.parseUnits(price.toString(), DECIMAL[chainId]),
          Math.floor(startingTime.getTime() / 1000) + 300 // delta: 5 mins
        );
        await listTx.wait();
        setIsListed(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (e && e.code && e.code === Logger.errors.ACTION_REJECTED) {
          return toast.error("Transaction rejected");
        } else {
          return toast.error(e.error.message);
        }
      } finally {
        setTxPending(false);
      }
    }
  };

  useEffect(() => {
    setIsLoading(true);
    getProduct(productAddress as string, chainId)
      .then(async (product) => {
        setProduct(product);
        const { data } = await axios.get(product.issuanceCycle.url);
        setImageURL(data.image);
      })
      .finally(() => setIsLoading(false));
  }, [productAddress, chainId]);

  useEffect(() => {
    (async () => {
      if (productInstance && nftInstance && marketplaceInstance && address) {
        const currentTokenId = await productInstance.currentTokenId();
        setCurrentTokenId(currentTokenId);
        const _currentBalance = await nftInstance.balanceOf(address, currentTokenId);
        const _listingCount = await marketplaceInstance.listingCount(address, currentTokenId);
        const _maxBalance = _currentBalance.toNumber() - _listingCount.toNumber();
        if (_maxBalance == 0) setMinBalance(0);
        setMaxBalance(_maxBalance);
      }
    })();
  }, [productInstance, nftInstance, marketplaceInstance, address]);

  useEffect(() => {
    if (signer && chainId) {
      setMarketplaceInstance(getMarketplaceInstance(signer, chainId));
      setNFTInstance(getNFTInstance(signer, chainId));
    }
  }, [signer, chainId]);

  return (
    <div className={"py-[80px] flex justify-center"}>
      <div className={"max-w-[650px] w-full"}>
        <div className={"flex flex-col items-center w-full"}>
          <div className={"w-full bg-black rounded-[16px]"}>
            <div className={"pl-10 h-[150px] flex items-center pt-5"}>
              <TitleH2 className={"text-white"}>Create NFT</TitleH2>
            </div>
            <img
              src={product ? imageURL || "/products/default_nft_image.png" : "/products/default_nft_image.png"}
              width={"100%"}
              alt={""}
            />
          </div>

          <div className={"w-full flex flex-col space-y-6 bg-white rounded-[16px] p-12 mt-5"}>
            <div className={"flex flex-col space-y-2"}>
              <div className={"text-[#494D51] text-[16px]"}>Product lots</div>

              <div className={"relative flex items-center"}>
                <input
                  className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"}
                  value={lots}
                  onChange={(e) => setLots(Number(e.target.value))}
                  type='text'
                />
                <div className={"absolute right-4 flex items-center space-x-[10px]"}>
                  <span
                    className={
                      "bg-grey-20 flex items-center justify-center px-3 h-[28px] w-[140px] rounded-[6px] text-[12px] leading-[12px] cursor-pointer"
                    }
                    onClick={() => setLots(minBalance)}
                  >
                    MIN
                  </span>
                  <span
                    className={
                      "bg-grey-20 flex items-center justify-center px-3 h-[28px] w-[140px] rounded-[6px] text-[12px] leading-[12px] cursor-pointer"
                    }
                    onClick={() => setLots(maxBalance)}
                  >
                    MAX
                  </span>
                </div>
              </div>
              { (lots < minBalance || lots > maxBalance) && 
                <p className="text-red-500 text-[14px]">Should be a value between min and max</p>
              }
            </div>
            <div className={"flex flex-col space-y-2"}>
              <div className={"text-[#494D51] text-[16px]"}>NFT Price (USDC)</div>

              <div className={"relative flex items-center"}>
                <input
                  className={"w-full py-3 px-4 bg-[#FBFBFB] border-[1px] border-[#E6E6E6] rounded focus:outline-none"}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  type='text'
                />
                {/*<span className={"absolute right-4 text-[#828A93]"}>Lots</span>*/}
              </div>

              <div
                className={"rounded-[6px] bg-warning h-[32px] flex items-center justify-center px-3 text-[12px] leading-[12px] text-white"}
                style={{ inlineSize: "fit-content" }}
              >
                {`Total: ${(lots * price).toLocaleString()} USDC - ${lots} Lots`}
              </div>
            </div>
            <div className={"flex flex-col space-y-2"}>
              <div className={"text-[#494D51] text-[16px]"}>Offer Start Since (GTC)</div>

              <div className={"relative flex items-center"}>
                <DatePicker
                  selected={startingTime}
                  showPopperArrow={false}
                  filterDate={(date: Date) => date.getTime() > Date.now()}
                  onChange={(date: Date) => setStartingTime(date)}
                  customInput={<CustomInput />}
                />
              </div>
            </div>

            <div className={"flex items-center space-x-6"}>
              <SecondaryButton label={"CANCEL"} onClick={() => router.push(`/portfolio/position/${product?.address}`)} />
              <PrimaryButton
                label={"LIST NFT"}
                disabled={!signer || txPending || price === 0 || (lots < minBalance || lots > maxBalance) || lots == 0}
                loading={txPending}
                className={"flex items-center justify-center"}
                onClick={onListNFT}
              />
            </div>
          </div>
        </div>
      </div>

      <NFTListedDialog open={isListed} setOpen={setIsListed} onConfirm={() => router.push("/portfolio")} />
    </div>
  );
};

export default PortfolioCreatePage;
