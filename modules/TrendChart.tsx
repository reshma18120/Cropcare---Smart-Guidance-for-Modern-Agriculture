import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  trend: number[];
}

const TrendChart: React.FC<TrendChartProps> = ({ trend }) => {

  // ✅ Safe values
  const safeTrend =
    trend && trend.length > 0
      ? trend.map((value) => Math.round(Number(value)) || 0)
      : [0, 0, 0, 0, 0];

  const currentYear = new Date().getFullYear();

  const labels = safeTrend.map(
    (_, index) => `${currentYear - (safeTrend.length - index - 1)}`
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Price Trend",
        data: safeTrend,
        fill: true,

        // ✅ FIXED GRADIENT (responsive safe)
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return null; // prevent initial render bug

          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );

          gradient.addColorStop(0, "rgba(59,130,246,0.4)");
          gradient.addColorStop(0.5, "rgba(34,197,94,0.3)");
          gradient.addColorStop(1, "rgba(249,115,22,0.2)");

          return gradient;
        },

        borderColor: "#f97316",
        tension: 0.4,
        pointBackgroundColor: "#ea580c",
        pointRadius: 5
      }
    ]
  };

  return (
    <div className="w-full h-[350px] overflow-hidden">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,

          layout: {
            padding: 10 // ✅ prevents edge cut
          },

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
              ticks: {
                precision: 0,
                autoSkip: true,
                maxRotation: 0
              }
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

export default TrendChart;