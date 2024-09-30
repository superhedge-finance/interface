import { useEffect, useMemo, useState } from "react";
import { Tab } from "@headlessui/react";
import Product from "./Product";
import { SkeletonCard } from "../basic";
import { getProducts } from "../../service";
import { ProductCategoryList, IProduct } from "../../types";
import { classNames } from "../../styles/helper";
import { SUPPORT_CHAIN_IDS } from "../../utils/enums";
import { useNetwork } from "wagmi";

export default function ProductList() {
  const { chain } = useNetwork();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [category, setCategory] = useState("All");

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (category === "All") return true;
        return product.name.toLowerCase().includes(category.toLowerCase());
      });
  }, [products, category]);

  const chainId = useMemo(() => {
    if (chain) return chain.id;
    return SUPPORT_CHAIN_IDS.ARBITRUM;
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

  if (isProductLoading) {
    return (
      <div className={"col-span-2"}>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className='flex flex-col sm:items-center'>
      <div className='md:flex justify-center'>
        <Tab.Group>
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
        </Tab.Group>
      </div>
      
      <div className={`md:mt-[50px] mt-8 flex flex-wrap justify-center sm:w-[500px] lg:w-[1000px] 2xl:w-[1500px] ${filteredProducts.length > 2 ? "sm:justify-start" : ""}`}>
        {!isProductLoading && filteredProducts.map((product, idx) => <Product key={idx} product={product} />)}
      </div>
    </div>
  );
}
