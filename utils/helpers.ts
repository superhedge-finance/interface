import { Logger } from "ethers/lib/utils.js";

export const truncateAddress = (address: string, digits: number = 8) => {
  return `${address.slice(0, digits + 2)}...${address.slice(-digits)}`;
};

export const getCurrencyIcon = (underlying: string): { currency1: string; currency2: string } => {
  if (underlying) {
    return {
      currency1: "/currency/" + underlying.split("/")[1].toLowerCase() + ".svg",
      currency2: "/currency/" + underlying.split("/")[0].toLowerCase() + ".svg"
    };
  }
  return {
    currency1: "/currency/eth.svg",
    currency2: "/currency/usdc.svg"
  };
};

export const formatStrikePrice = (strikePrice: number) => {
  if (strikePrice > 0) return strikePrice.toLocaleString();
  return "NA";
};

export const formatDuration = (duration: number) => {
  if (duration > 0) {
    const days = Math.floor(duration / 3600 / 24);
    const hours = Math.floor((duration - (days * 3600 * 24)) / 3600);
    return `${days}D : ${hours}H`;
  }
  return "0D : 0H";
};

export const formatDate = (dateString: Date) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
};

export const getTxErrorMessage = (error: any): string => {
  const errMessage = error?.data?.message || error?.message;

  if (error?.code === Logger.errors.ACTION_REJECTED) {
    return "User denied transaction";
  } else if (errMessage && /insufficient funds/.test(errMessage)) {
    return "Not enough balance";
  } else if (errMessage && /Insufficient/.test(errMessage)) {
    return errMessage;
  }

  const regex = /execution reverted: ([a-zA-Z0-9 ]+)/;
  const result = errMessage.match(regex);
  const reason = result ? result[1] : undefined;

  // will make some message translation here.
  if (reason === "Product is full") {
    return "Your deposit results in excess of max capacity.";
  } else if (reason === undefined) {
    return "There is already a pending transaction.";
  }

  return `${reason}` || "Transaction reverted in some reason.";
};


export const formatApy = (apy: string): string => {
  return apy.split('-')[0];
};