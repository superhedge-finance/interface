import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useAccount, useNetwork } from "wagmi";
import { getSummary } from "../../service";
import { formatDate } from "../../utils/helpers";

export const PortfolioSummary = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [tab, setTab] = useState(0);

  const [labels, setLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      if (address && chain) {
        const now = new Date();
        const endTime = now.toISOString().replace('Z', '').replace('T', ' ');
        let startTime;
        if (tab == 0) {
          // One week before
          startTime = (new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)).toISOString();
        } else if (tab == 1) {
          // One month before
          startTime = (new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())).toISOString();
        } else {
          startTime = '2023-04-01T00:00:00.000Z';
        }
        startTime = startTime.replace('Z', '').replace('T', ' ');
        // fetch summary info
        const summaries = await getSummary(address, startTime, endTime, chain.id);
        setLabels(summaries.map((summary:any) => formatDate(summary.dates)));
        const data = summaries.map((summary:any) => summary.totalBalance);
        
        let j = 0; // an index of the latest non-zero balance
        for (let i = data.length - 1; i >= 0; i--) {
          if(data[i] != null) {
            j = i;
            break;
          }
        }
        
        for (let i = 0; i <= data.length - 1; i++) {
          if (i < j) data[i] = Number(data[i]);
          else data[i] = Number(data[j]);
        }
        
        setChartData(data);
      }
    })();
  }, [address, chain, tab]);

  return (
    <div className={"bg-white w-full rounded-lg p-5 relative"}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-500">
          Coming soon
        </div>
      </div>
      <div className="filter blur-sm">
        <Line
          data={{
            labels: labels,
            datasets: [
              {
                data: chartData,
                borderColor: "#11CB79",
                fill: false,
                label: "",
                pointStyle: false
              }
            ]
          }}
          width={400}
          height={250}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: "Total Balance vs. Date"
              }
            }
          }}
        />
      </div>

      <div className={"mt-5 p-1 flex items-center space-x-2 rounded-[6px] h-[38px] filter blur-sm"}>
        <div
          className={`${
            tab === 0 ? "bg-[#EBEBEB]" : "bg-[rgba(0,0,0,0.04)]"
          } cursor-pointer h-[30px] rounded-[6px] p-2 flex flex-1 items-center justify-center`}
          onClick={() => setTab(0)}
        >
          WEEK
        </div>
        <div
          className={`${
            tab === 1 ? "bg-[#EBEBEB]" : "bg-[rgba(0,0,0,0.04)]"
          } cursor-pointer h-[30px] rounded-[6px] p-2 flex flex-1 items-center justify-center`}
          onClick={() => setTab(1)}
        >
          MONTH
        </div>
        <div
          className={`${
            tab === 2 ? "bg-[#EBEBEB]" : "bg-[rgba(0,0,0,0.04)]"
          } cursor-pointer h-[30px] rounded-[6px] p-2 flex flex-1 items-center justify-center`}
          onClick={() => setTab(2)}
        >
          ALL TIME
        </div>
      </div>
    </div>
  );
};
