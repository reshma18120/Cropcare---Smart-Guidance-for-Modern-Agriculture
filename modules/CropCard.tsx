import React from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const CropCardChart = ({ crop }: any) => {
  // ✅ SAFE VALUES
  const confidence = Math.round(crop?.yield_confidence_percent || 0);

  const alternatives = crop?.top_3_alternatives || [];

  // ✅ NEW GREEN DATASET (your requirement)
  const mainData = {
    labels: ["Confidence"],
    datasets: [
      {
        label: "Crop Confidence",
        data: [confidence],
        backgroundColor: ["#22c55e"], // bright green
        borderColor: ["#15803d"],     // dark green
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* 🌱 Doughnut Chart */}
      <div className="w-56">
        <Doughnut
          data={{
            labels: ["Confidence", "Remaining"],
            datasets: [
              {
                data: [confidence, 100 - confidence],
                backgroundColor: ["#22c55e", "#e5e7eb"], // green + grey
                borderWidth: 0
              }
            ]
          }}
          options={{
            cutout: "75%",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${Math.round(ctx.parsed)}%`
                }
              }
            }
          }}
        />
      </div>

      {/* 📊 Bar Chart */}
      <div className="w-full h-56">
        <Bar
          data={{
            labels: alternatives.map((c: any) => c.crop),
            datasets: [
              {
                label: "Confidence %",
                data: alternatives.map((c: any) =>
                  Math.round(c.confidence || 0)
                ),

                // ✅ MULTI COLOR (better UI)
                backgroundColor: [
                  "#22c55e", // green
                  "#4ade80", // light green
                  "#16a34a"  // dark green
                ],

                borderRadius: 10,
                barThickness: 40
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  stepSize: 10
                },
                grid: {
                  display: false
                }
              },
              x: {
                grid: { display: false }
              }
            }
          }}
        />
      </div>

    </div>
  );
};

export default CropCardChart;