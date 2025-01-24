import React from "react";
import { Line } from "react-chartjs-2";



export const ReturnsChart = ({
  tr1,
  tr2,
  strikePrice1,
  strikePrice2,
  strikePrice3,
  underlyingName,
  apy
}: {
  tr1: number;
  tr2: number;
  strikePrice1: number;
  strikePrice2: number;
  strikePrice3: number;
  underlyingName: string;
  apy: string;
}) => {
  return (
    <div className={"mt-4 w-100"}>
      <Line
        data={{
          labels:
            strikePrice3 > 0
              ? ["", strikePrice1 / 1000 , strikePrice2 / 1000, strikePrice3 / 1000, ""]
              : ["", "", "", strikePrice1 / 1000, strikePrice2 / 1000, "", "", ""],
          datasets: [
            {
              data:
                strikePrice3 > 0
                  ? [tr2 , tr2 , tr1 , tr2 , tr2 ]
                  : [tr2 , tr2 , tr2 , tr2 , tr1 , tr1 , tr1 , tr1 ],
              borderColor: "#11CB79",
              fill: false,
              pointStyle: false
            }
          ]
        }}
        height={200}
        options={{
          plugins: {
            title: {
              display: true,
              text: `Est. APY %`,
              align: 'start',
              padding: {
                bottom: 20
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              min: tr1 > tr2 ? tr2  : tr1 ,
              max: tr1 > tr2 ? tr1  : tr2 ,
              ticks: {
                stepSize: (Math.abs(tr1 - tr2)) 
              }
            },
            x: {
              title: {
                display: true,
                align: 'end',
                text: `${underlyingName} ('000)`
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }}
      />
    </div>
  );
};
