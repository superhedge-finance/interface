'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useNetwork } from 'wagmi';
import { SUPPORT_CHAIN_IDS } from '../../utils/enums';
import { getProduct } from '../../service';
import { ProductDetailType } from '../../types';
import { SubtitleRegular20, TitleH2, TitleH5 } from '../../components/basic';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import type ReactQuill from 'react-quill';
import { toast } from 'react-hot-toast';
import { getCurrencyIcon } from '../../utils/helpers'

const QuillEditor = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as typeof ReactQuill;

const EditProductContent = () => {
  const router = useRouter();
  const { chain } = useNetwork();
  const { address } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<ProductDetailType | undefined>(undefined);
  const [strategyContent, setStrategyContent] = useState('');
  const [riskContent, setRiskContent] = useState('');

  const chainId = chain ? chain.id : SUPPORT_CHAIN_IDS.ETH;

  useEffect(() => {
    if (!address) return;

    setIsLoading(true);
    getProduct(address as string, chainId)
      .then((product) => {
        if (!product) {
          router.push('/');
        } else {
          setProduct(product);
          setStrategyContent(product.strategyContent || '');
          setRiskContent(product.riskContent || '');
        }
      })
      .finally(() => setIsLoading(false));
  }, [address, chainId]);


  const currencyLogo = useMemo(() => {
    if (product) {
      return getCurrencyIcon(product.underlying).currency1;
    }
    return "/currency/usdc.svg";
  }, [product]);

  // const handleSave = async () => {
  //   if (!product) return;
  //   try {
  //     setIsSaving(true);
  //     postProductContent(chainId, product.address, strategyContent, riskContent)
  //       .then(() => {
  //         toast.success('Content updated successfully');
  //       })
  //       .catch((error) => {
  //         console.error('Error updating content:', error);
  //         toast.error('Failed to update content. Please try again.');
  //       })
  //       .finally(() => setIsSaving(false));
  //   } catch (error) {
  //     console.error('Error updating content:', error);
  //     toast.error('Failed to update content. Please try again.');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const handleCopyStrategyContent = () => {
    navigator.clipboard.writeText(strategyContent);
    toast.success('Strategy content copied to clipboard');
  };

  const handleCopyRiskContent = () => {
    navigator.clipboard.writeText(riskContent);
    toast.success('Risk content copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <TitleH5>Edit Product Content</TitleH5>
            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/product/${product.address}`)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              {/* <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button> */}
            </div>
          </div>
          <div className='mb-8'>
            <div className='flex flex-row'>
              <div className={"relative flex items-center justify-center"}>
                <img
                  src={currencyLogo}
                  className='rounded-full w-[40px] md:w-[60px] h-[40px] md:h-[60px]'
                  alt='Product Logo'
                  width={"100%"}
                  height={"100%"}
                />
              </div>
              <div className='flex flex-col justify-around ml-3'>
                <TitleH5 className='text-black'>{product.currencyName}</TitleH5>
                <SubtitleRegular20>{product.name}</SubtitleRegular20>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy Content
              </label>
              <div className="h-64">
                <QuillEditor
                  theme="snow"
                  value={strategyContent}
                  onChange={setStrategyContent}
                  className="h-48 bg-white"
                />
              </div>
              <div>
                <button
                  onClick={handleCopyStrategyContent}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Copy Content
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Content
              </label>
              <div className="h-64">
                <QuillEditor
                  theme="snow"
                  value={riskContent}
                  onChange={setRiskContent}
                  className="h-48 bg-white"
                />
              </div>
              <div>
                <button
                  onClick={handleCopyRiskContent}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Copy Content
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductContent;