import Image from "next/image";
import { History, HISTORY_TYPE } from "../../types";

export const TransactionHeader = () => {
  return (
    <div className={"py-3 px-6 h-[40px] grid grid-cols-6 rounded-[6px]"}>
      <span className={"text-grey-70 text-[12px] leading-[16px]"}>Transaction type</span>
      <span className={"text-[12px] leading-[16px] text-grey-70 col-span-2"}>Product name</span>
      <span className={"text-[12px] leading-[16px] text-grey-70"}>Date</span>
      <span className={"text-[12px] leading-[16px] text-grey-70"}>Action</span>
      <span className={"text-[12px] leading-[16px] text-grey-70"}>Amount</span>
    </div>
  );
};

export const TransactionCard = ({ history, className, blockExplorer }: { history: History; className: string; blockExplorer: string }) => {
  console.log(history)
  return (
    <div className={`py-3 px-6 h-[40px] grid grid-cols-6 rounded-[6px] ${className ?? ""}`}>
      <div className={"flex items-center space-x-2"}>
        <a href={`${blockExplorer}/tx/${history.transactionHash}`} target={"_blank"} rel={"noreferrer"}>
          <Image
            src={history.type === HISTORY_TYPE.DEPOSIT ? "/portfolio/withdraw_icon.svg" : "/portfolio/deposit_icon.svg"}
            alt={"withdraw icon"}
            width={16}
            height={16}
          />
        </a>
        <span className={"bg-clip-text text-transparent bg-primary-gradient text-[12px] leading-[16px]"}>
          {history.type === HISTORY_TYPE.DEPOSIT ? "DEPOSIT" : "Withdraw"}
        </span>
      </div>
      <span className={"text-[12px] leading-[16px] text-grey-70 col-span-2"}>{history.productName}</span>
      <span className={"text-[12px] leading-[16px] text-grey-70"}>
        {new Date(history.createdAt).toLocaleDateString("default", { day: "numeric", month: "short" })}
      </span>
      <span className={"text-[12px] leading-[16px] text-blacknew-100"}>
        {history.type === HISTORY_TYPE.DEPOSIT ? "Deposited" : "Withdrawed"}
      </span>
      <span className={"text-[12px] leading-[16px] text-blacknew-100"}>
        {((Number(history.amountInDecimal)/10**6).toLocaleString())} USDC
      </span>
    </div>
  );
};
