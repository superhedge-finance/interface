import {NextPage} from "next";
import {useRouter} from "next/router";
import Layout from "../../components/Layout";
import {ActionArea} from "../../components/product/ActionArea";
import Image from "next/image";
import Link from "next/link";
import {IProduct} from "../../types/interface";
import {useEffect, useState} from "react";
import {ethers} from "ethers";
import ProductABI from "../../constants/abis/SHProduct.json";
import {ChainId} from "../../constants/chain";
import {useProvider} from "wagmi";

const status = [
    'Accepting',
    'Active',
    'Funds Locked'
]

const RecapCard = ({ label, value }: { label: string, value: string }) => {
    return (
        <div className='flex flex-col flex-1 items-center bg-[#0000000a] h-[66px] rounded-[7px] py-3 px-4'>
            <p className="text-[12px] font-light text-gray-700">{label}</p>
            <h3 className="text-[20px] font-light text-black">{value}</h3>
        </div>
    )
}

const ProductDetail: NextPage = () => {
    const provider = useProvider({
        chainId: ChainId.GOERLI,
    })
    const router = useRouter()
    const {address} = router.query

    const [product, setProduct] = useState<IProduct | undefined>(undefined)

    useEffect(() => {
        (async () => {
            if (address && provider && typeof address === "string") {
                const _productInstance = new ethers.Contract(address, ProductABI, provider)
                const _productStatus = await _productInstance.status()

                if (_productStatus > 0) {
                    const _product: IProduct = {
                        name: await _productInstance.name(),
                        address: address,
                        underlying: await _productInstance.underlying(),
                        status: _productStatus,
                        maxCapacity: await _productInstance.maxCapacity(),
                        currentCapacity: await _productInstance.currentCapacity()
                    }
                    setProduct(_product)
                }
            }
        })()
    }, [address, provider])

    return (
        <Layout>
            <div className={'grid grid-cols-2 gap-12 px-12'}>
                <div>
                    {
                        product &&
                        <div className="flex flex-col p-6">
                            <div>
                                <span className='inline-block text-white text-sm bg-[#68AC6F] p-2 rounded-lg'>{status[product.status]}</span>
                                <span className='inline-block text-white text-sm bg-[#7991DA] ml-3 p-2 rounded-lg'>Call-spread</span>
                            </div>
                            <div className={'flex justify-between items-end my-5'}>
                                <div className='flex flex-row'>
                                    <div className={'relative flex items-center mr-[40px]'}>
                                        <Image src='/usdc.svg' className='rounded-full' alt='Product Logo' width={60}
                                               height={60}/>
                                        <Image src='/ethereum.svg' className='rounded-full absolute left-[40px]'
                                               alt='Product Logo'
                                               width={60} height={60}/>
                                    </div>
                                    <div className='ml-3'>
                                        <h5 className="text-[44px] text-black">{product.underlying}</h5>
                                        <span className='text-[20px] font-light text-gray-700'>{product.name}</span>
                                    </div>
                                </div>
                                <div className={'flex flex-col items-center'}>
                                    <span className="d-block mb-1 text-sm font-normal text-gray-700 dark:text-gray-400">Estimated APY</span>
                                    <h3 className="font-medium leading-tight text-3xl text-black">7-15%</h3>
                                </div>
                            </div>
                            <div className={'flex flex-col flex-1'}>
                                <div className="flex justify-between my-1">
                                    <span className="text-sm text-gray-700">Amount deposited</span>
                                    <span
                                        className="text-sm text-gray-700">USDC {product.currentCapacity.toString()}</span>
                                </div>
                                <div className="w-full bg-[#00000014] rounded my-1">
                                    <div className="bg-gray-600 h-2 rounded" style={{
                                        width: '65%',
                                        background: 'linear-gradient(267.56deg, #11CB79 14.55%, #11A692 68.45%, #002366 136.67%)'
                                    }}></div>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-700">Max</span>
                                    <span
                                        className="text-sm text-gray-700">USDC {product.maxCapacity.toString()}</span>
                                </div>
                            </div>

                            <div className={'text-[32px] text-[#161717] leading-[40px] mt-10'}>
                                Product Recap
                            </div>
                            <div className={'flex items-center justify-between space-x-2 mt-5'}>
                                <RecapCard label={'Investment Duration'} value={'30D'} />
                                <RecapCard label={'Coupon'} value={'0.10% / WEEK'} />
                                <RecapCard label={'Principal Protection'} value={'100%'} />
                            </div>
                            <div className={'flex items-center justify-between space-x-2 mt-2'}>
                                <RecapCard label={'Strike 1 price'} value={'125%'} />
                                <RecapCard label={'Strike 2 price'} value={'145%'} />
                                <RecapCard label={'Strike 3 price'} value={'135%'} />
                                <RecapCard label={'Strike 4 price'} value={'155%'} />
                            </div>
                        </div>
                    }
                </div>
                <ActionArea productAddress={product ? product.address : ''} />
            </div>
        </Layout>
    )
}

export default ProductDetail