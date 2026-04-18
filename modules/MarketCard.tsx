import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MarketCardProps {
  market: {
    crop_names: string[];
    prices: number[];
  };
  height?: number;
}

const MarketCardChart: React.FC<MarketCardProps> = ({
  market,
  height = 350
}) => {

  const crop_names = market?.crop_names || [];
  const prices = market?.prices || [];

  // ✅ Round values
  const safePrices = prices.map((p) => Math.round(p));

  // ✅ FINAL DATA (BLUE THEME)
 const colors = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#ef4444", // red
  "#a855f7"  // purple
];

const data = {
  labels: crop_names,
  datasets: [
    {
      label: "Market Price (₹)",
      data: safePrices,
      backgroundColor: crop_names.map((_, i) => colors[i % colors.length]),
      borderRadius: 12,
      barThickness: 50
    }
  ]
};
  return (
    <div style={{ width: "100%", height }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `₹${Math.round(context.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { precision: 0 }
            },
            y: {
              beginAtZero: false,
              ticks: {
                precision: 0,
                stepSize: 100
              },
              grid: {
                color: "rgba(0,0,0,0.05)"
              }
            }
          }
        }}
      />
    </div>
  );
};

export default MarketCardChart;