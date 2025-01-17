import { useEffect, useMemo, useState } from "react";
import { Tab } from "@headlessui/react";
import Product from "./Product";
import { SkeletonCard } from "../basic";
import { getProducts } from "../../service";
import { ProductCategoryList, IProduct } from "../../types";
import { classNames } from "../../styles/helper";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";
import { useNetwork ,useAccount} from "wagmi";
import axios from "../../service/axios";

export default function ProductList() {
  const { chain } = useNetwork();
  const { address } = useAccount();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [category, setCategory] = useState("All");

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isBlurred, setIsBlurred] = useState(true);

  const [warningMessage, setWarningMessage] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (category === "All") return true;
      return product.name.toLowerCase().includes(category.toLowerCase());
    });
  }, [products, category]);

  const chainId = useMemo(() => {
    console.log(address)
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ETH;
  }, [chain]);

  useEffect(() => {
    (async () => {
      try {
        setIsProductLoading(true);
        const _products = await getProducts(chainId);
        setProducts(_products);
        // if (_products.length > 0) setProducts(_products);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProductLoading(false);
      }
    })();
  }, [chainId]);

  useEffect(() => {
    (async () => {
      console.log("check address");
      console.log(address);
      let isVisible = false;
      let isBlurred = true;

      if (address) {
        try {
          const results = await axios.post(`refcodes/check-whitelist?address=${address}`);
          if (results.data) {
            isVisible = false;
            isBlurred = false;
          }
          else{
            isVisible = true;
          }
        } catch (error) {
          console.error("Error checking whitelist:", error);
        }
      }

      setIsPopupVisible(isVisible);
      setIsBlurred(isBlurred);
    })();
  }, [address, chainId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async() => {
    console.log(inputValue)
    console.log(address)
    if(inputValue && address)
    {
      const results = await axios.post(`/refcodes/signUp?refcode=${inputValue}&address=${address}`);
      console.log(results.data)
      if (results.data)
      {
        setIsPopupVisible(false);
        setIsBlurred(false);
        setWarningMessage("");
        setInputValue("");
      }
      else {
        setWarningMessage("Wrong Code");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setIsPopupVisible(false);
    setInputValue("");
    setWarningMessage("");
  };

  if (isProductLoading) {
    return (
      <div className={"col-span-2"}>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <>
      {/* {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Enter Access Code</h2>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="border p-2 mb-2 w-full"
            />
            <div className="flex justify-between">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Confirm
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white p-2 rounded"
              >
                Cancel
              </button>
            </div>
            {warningMessage && (
              <p className="text-red-500 mt-2">{warningMessage}</p>
            )}
          </div>
        </div>
      )} */}

      {/* <div className={`flex flex-col sm:items-center mt-16 ${isBlurred ? 'filter blur-lg pointer-events-none' : ''}`}> */}
      <div className={`flex flex-col sm:items-center mt-16`}>
        <div className='md:flex justify-center'>
          {/* <Tab.Group>
            <Tab.List className='flex space-x-1 rounded-xl bg-[#EBEBEB] p-1'>
              {ProductCategoryList.map((category, index) => (
                <Tab
                  key={index}
                  className={({ selected }) =>
                    classNames(
                      "w-[140px] rounded-lg py-2.5 text-sm font-medium leading-5 text-black",
                      "focus:outline-none uppercase",
                      selected ? "bg-white" : ""
                    )
                  }
                  onClick={() => setCategory(category)}
                >
                  {category}
                </Tab>
              ))}
            </Tab.List>
          </Tab.Group> */}
        </div>
        
        <div className={`md:mt-[50px] mt-8 flex flex-wrap justify-center sm:w-[500px] lg:w-[1000px] 2xl:w-[1500px] ${filteredProducts.length > 2 ? "sm:justify-start" : ""}`}>
          {!isProductLoading && filteredProducts.map((product, idx) => <Product key={idx} product={product} />)}
        </div>
      </div>
    </>
  );
}
