import { forwardRef, useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import DatePicker from "react-datepicker";
import { useAccount, useNetwork, useSigner } from "wagmi";
import { BigNumber, ethers } from "ethers";
import toast from "react-hot-toast";
import { PrimaryButton, SecondaryButton, TitleH2 } from "../../../components/basic";
import { getProduct } from "../../../service";
import { IProduct, LISTING_STATUS } from "../../../types";
// import { getMarketplaceInstance, getNFTInstance } from "../../../utils/contract";
import "react-datepicker/dist/react-datepicker.css";
import ProductABI from "../../../utils/abis/SHProduct.json";
import { USDC_ADDRESS } from "../../../utils/address";
import { DECIMAL } from "../../../utils/constants";
import { SUPPORT_CHAIN_IDS } from "../../../utils/enums";
import axios from "../../../service/axios";
import { Dialog, Transition } from "@headlessui/react";
import { getTxErrorMessage } from "../../../utils/helpers";
// import NFTListedDialog from "../../../components/portfolio/NFTListedDialog";

const PortfolioCreatePage = () => {
  const router = useRouter();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { address: productAddress } = router.query;

  const [, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [listingStatus, setListingStatus] = useState(LISTING_STATUS.NONE);
  const [maxBalance, setMaxBalance] = useState(0);
  const [minBalance, setMinBalance] = useState(1);
  const [product, setProduct] = useState<IProduct | undefined>(undefined);
  const [marketplaceInstance, setMarketplaceInstance] = useState<ethers.Contract>();
  const [currentTokenId, setCurrentTokenId] = useState<BigNumber>();
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
    return SUPPORT_CHAIN_IDS.ARBITRUM;
  }, [chain]);

  const productInstance = useMemo(() => {
    if (signer && productAddress) return new ethers.Contract(productAddress as string, ProductABI, signer);
    else return null;
  }, [signer, productAddress]);

  const onListNFT = async() => {
    if (product && product.status !== 3) {
      return toast.error("Your product is not issued yet. Please wait until issuance date");
    }
    if (address && signer && marketplaceInstance && nftInstance && product) {
      try {
        const isApprovedForAll = await nftInstance.isApprovedForAll(address, marketplaceInstance.address);
        if (!isApprovedForAll) {
          setListingStatus(LISTING_STATUS.APPROVING);
          const approveTx = await nftInstance.setApprovalForAll(marketplaceInstance.address, true);
          await approveTx.wait();
        }
        setListingStatus(LISTING_STATUS.PENDING);
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
        toast.error(getTxErrorMessage(e));
      } finally {
        setListingStatus(LISTING_STATUS.NONE);
        setIsOpen(false);
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

  // useEffect(() => {
  //   if (signer && chainId) {
  //     setMarketplaceInstance(getMarketplaceInstance(signer, chainId));
  //     setNFTInstance(getNFTInstance(signer, chainId));
  //   }
  // }, [signer, chainId]);

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
                disabled={!signer || price === 0 || (lots < minBalance || lots > maxBalance) || lots == 0}
                className={"flex items-center justify-center"}
                onClick={() => setIsOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as='div' className='relative z-10' onClose={() => setIsOpen(false)}>
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
                <Dialog.Panel className='w-full max-w-[800px] transform overflow-hidden rounded-2xl bg-white py-[60px] px-[120px] text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title className='text-[32px] font-medium leading-[40px] text-[#161717] text-center'>
                    {listingStatus <= LISTING_STATUS.APPROVING ? "Step 1/2: Approve marketplace contract to list your NFTs"
                    : "Step 2/2: List your NFTs into marketplace"}
                  </Dialog.Title>

                  <div className='mt-8 flex items-center justify-between space-x-8 h-[50px]'>
                    <button
                      type='button'
                      className='flex flex-1 items-center justify-center border-[#4B4B4B] border-[1px] px-4 py-2 text-sm font-medium text-black rounded-[8px] h-full'
                      onClick={() => setIsOpen(false)}
                    >
                      CLOSE
                    </button>
                    <button
                      type='button'
                      className='flex flex-1 items-center justify-center border border-transparent bg-[#292929] px-4 py-2 text-sm font-medium text-white rounded-[8px] h-full'
                      onClick={onListNFT}
                      disabled={listingStatus === LISTING_STATUS.APPROVING}
                    >
                      {listingStatus >= LISTING_STATUS.APPROVING && (
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
                      {listingStatus === LISTING_STATUS.PENDING ? "LISTING" : "APPROVE"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* <NFTListedDialog open={isListed} setOpen={setIsListed} onConfirm={() => router.push("/portfolio")} /> */}
    </div>
  );
};

export default PortfolioCreatePage;
