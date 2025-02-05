import Image from "next/image";
import { SubtitleLight12 } from "../basic";
import { useMemo } from "react";

const Timeline = ({ issuance, maturity, compact = false }: { issuance: number; maturity: number; compact?: boolean }) => {
  const today_percentage = useMemo(() => {
    const today = new Date().getTime() / 1000;
    const total = maturity - issuance;
    const passed = today - issuance;
    return passed > total ? 0 : (passed / total) * 100;
  }, [issuance, maturity]);

  return (
    <div
      className={`flex items-center justify-between rounded-[8px] bg-white w-full ${
        compact ? "h-[104px] px-[20px]" : "h-[162px] px-[60px]"
      } relative`}
    >
      <div className={`${compact ? "w-[calc(100%-80px)]" : "w-[calc(100%-140px)]"} absolute`}>
        <div className={"bg-grey-50 h-[1px] absolute z-2 w-full top-1/2"}></div>
        <div className={`bg-accent h-[1px] absolute z-2 top-1/2 w-[${today_percentage}%]`} style={{ width: today_percentage + "%" }}></div>
        {today_percentage > 0 && (
          <>
            <div
              className={`absolute border border-dashed top-0 bottom-0 my-auto border-grey-50 h-[80px]`}
              style={{ left: today_percentage + "%" }}
            ></div>
            <div className={`absolute bottom-12`} style={{ left: `calc(${today_percentage}% - 20px)` }}>
              Today
            </div>
          </>
        )}
      </div>

      <div className={"z-10 flex flex-col items-center justify-center space-y-3"}>
        <SubtitleLight12 className={"text-blacknew-100"}>
          {new Date(issuance * 1000).toLocaleDateString("default", { day: "numeric", month: "short" })}
        </SubtitleLight12>
        <Image className={""} src={"/products/issuance.svg"} alt={"issuance"} width={36} height={36} />
        <SubtitleLight12 className={"text-blacknew-100 text-center"}>Live date</SubtitleLight12>
      </div>
      <div className={"z-10 flex flex-col items-center justify-center space-y-3"}>
        <SubtitleLight12 className={"text-blacknew-100"}>
          {new Date(maturity * 1000).toLocaleDateString("default", { day: "numeric", month: "short" })}
        </SubtitleLight12>
        <Image className={""} src={"/products/maturity.svg"} alt={"issuance"} width={36} height={36} />
        <SubtitleLight12 className={"text-blacknew-100 text-center"}>Maturity date</SubtitleLight12>
      </div>
    </div>
  );
};

export default Timeline;
