// import { MarketplaceItemDetailType, MarketplaceItemFullType, MarketplaceItemType } from "../types";
// import axios from "./axios";

// export const getListedItems = async (chainId?: number | null): Promise<Array<MarketplaceItemType>> => {
//   try {
//     const { data } = await axios.get(`/marketplace?chainId=${chainId}`);
//     return data;
//   } catch (e) {
//     console.error(e);
//     return [];
//   }
// };

// export const getTokenItem = async (productAddress: string, chainId?: number | null): Promise<MarketplaceItemDetailType | null> => {
//   try {
//     const { data } = await axios.get(`/marketplace/token/${productAddress}?chainId=${chainId}`);
//     return data;
//   } catch (e) {
//     console.error(e);
//     return null;
//   }
// };

// export const getUserListedItems = async (address: string, chainId?: number | null): Promise<Array<MarketplaceItemFullType>> => {
//   try {
//     const { data } = await axios.get(`/marketplace/${address}?chainId=${chainId}`);
//     return data;
//   } catch (e) {
//     console.error(e);
//     return [];
//   }
// };

// export const getUserListedItem = async (listing_id: string, chainId?: number | null): Promise<MarketplaceItemFullType | null> => {
//   try {
//     const { data } = await axios.get(`/marketplace/item/${listing_id}?chainId=${chainId}`);
//     return data;
//   } catch (e) {
//     console.error(e);
//     return null;
//   }
// };
