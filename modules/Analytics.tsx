import React, { useState, useEffect } from "react";
import { fetchAnalytics, AnalyticsResponse } from "../services/analysisModule";
import CropCardChart from "./CropCard";
import MarketCardChart from "./MarketCard";
import TrendChart from "./TrendChart";
import { useNavigate } from "react-router-dom";
import { Bell, UserCircle } from "lucide-react";

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [region, setRegion] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const safeParse = (value: string | null) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const handleFetch = async (reg?: string, yr?: number) => {
    const finalRegion = reg || region;
    const finalYear = yr || year;

    if (!finalRegion) return alert("Please enter a region");

    setLoading(true);

    try {
      const result = await fetchAnalytics(finalRegion, finalYear);

      setData(result);

      localStorage.setItem("analytics_data", JSON.stringify(result));
      localStorage.setItem("analytics_region", finalRegion);
      localStorage.setItem("analytics_year", finalYear.toString());

    } catch (error) {
      console.error("Fetch analytics error:", error);
      alert("Error fetching analytics");
    }

    setLoading(false);
  };

  useEffect(() => {
    const savedData = safeParse(localStorage.getItem("analytics_data"));
    const savedRegion = localStorage.getItem("analytics_region");
    const savedYear = localStorage.getItem("analytics_year");

    if (savedRegion) setRegion(savedRegion);
    if (savedYear) setYear(Number(savedYear));

    if (savedData) {
      setData(savedData);
    } else if (savedRegion && savedYear) {
      handleFetch(savedRegion, Number(savedYear));
    }
  }, []);

  // ✅ MARKET GRAPH (min, predicted, max)
const marketPrices =
  data?.market_analysis
    ? [
        Number(data.market_analysis.price_range?.min || 0),
        Number(data.market_analysis.predicted_price || 0),
        Number(data.market_analysis.price_range?.max || 0)
      ]
    : [];

// ✅ TREND GRAPH (real backend data only)
const trendPrices =
  data?.market_analysis?.trend_last_5_years?.length > 0
    ? data.market_analysis.trend_last_5_years.map((item: any) =>
        Number(item.price)
      )
    : [];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#0f172a] via-[#064e3b] to-[#022c22]">
      {/* MAIN */}
      <div className="pt-10 pb-24 px-6">

        {/* TITLE */}
        <div className="text-center mb-10 text-white">
          <h1 className="text-4xl font-bold">
            🌾 Smart Agricultural Analytics
          </h1>
          <p className="text-green-200 mt-2">
            AI-Powered Crop & Market Intelligence
          </p>
        </div>

        {/* INPUT CARD */}
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl p-6 mb-10 shadow-xl">

          {/* ✅ FIXED GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <input
              placeholder="Enter Region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-4 py-3 rounded-xl border w-full md:w-60 focus:ring-2 focus:ring-emerald-400"
            />

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-4 py-3 rounded-xl border w-full md:w-32 focus:ring-2 focus:ring-emerald-400"
            />

            <button
              onClick={() => handleFetch()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold hover:scale-105 transition"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

          </div>
        </div>

        {loading && (
          <p className="text-center text-white">
            🔄 Fetching analytics...
          </p>
        )}

        {/* DATA */}
        {data && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl">
              <h2 className="text-center mb-4 font-bold text-green-700">
                🌱 Crop Recommendation
              </h2>
              <CropCardChart crop={data.crop_analysis} />
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl">
              <h2 className="text-center mb-4 font-bold text-blue-600">
                📈 Market Prediction
              </h2>

              <MarketCardChart
                market={{
                  crop_names: data?.market_analysis?.trend_last_5_years?.map(
                    (item: any) => item.year.toString()
                  ) || [],
                  prices: data?.market_analysis?.trend_last_5_years?.map(
                    (item: any) => Number(item.price)
                  ) || []
                }}
                height={350}
              />
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl">
              <h2 className="text-center mb-4 font-bold text-orange-600">
                📊 5-Year Price Trend
              </h2>
              <TrendChart trend={trendPrices} />
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AnalyticsDashboard;