import axios from "./axios";

export const getProducts = async (chainId?: number | null) => {
  try {
    const { data } = await axios.get(`/products?chainId=${chainId}`);
    return data;
  } catch (e) {
    return [];
  }
};

export const getProduct = async (address: string, chainId?: number | null) => {
  try {
    const { data } = await axios.get(`/products/${address}?chainId=${chainId}`);
    return data;
  } catch (e) {
    return null;
  }
};

// export const postProductContent = async (chainId: number, productAddress: string, strategyContent: string, riskContent: string) => {
//   try {
//     const { data } = await axios.post(`/products/update-product-content`, { chainId, productAddress, strategyContent, riskContent });
//     if (data.success) {
//       return data;
//     }
//     return null;
//   } catch (e) {
//     return null;
//   }
// };