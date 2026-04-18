import React, { useEffect, useState } from "react";
import {
  Camera,
  CloudRain,
  Droplets,
  Loader2,
  TrendingUp,
  Sprout,
  Thermometer,
  Wind,
  BarChart2,
  MessageCircle,
  Sun,
  Lightbulb,
  Bell,
  UserCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { fetchDashboardOverview } from "../services/dashboard";
import { Language } from "../types";

const Dashboard: React.FC<{ language: Language }> = ({ language }) => {

  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

  navigator.geolocation.getCurrentPosition(
    async (position) => {

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const dashboardData = await fetchDashboardOverview(lat, lon);

      setData(dashboardData);
      setLoading(false);
    },
    (error) => {
      console.error("Location permission denied:", error);
      setLoading(false);
    }
  );

}, []);

  if (loading || !data)
    return (
      <div className="flex justify-center items-center h-screen bg-green-900">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );

  const temp = data.weather.temperature;
  const isHot = temp >= 28;

  const chartData = [
    { day: "Mon", temp: temp - 2 },
    { day: "Tue", temp: temp - 1 },
    { day: "Wed", temp: temp },
    { day: "Thu", temp: temp + 1 },
    { day: "Fri", temp: temp - 1 },
    { day: "Sat", temp: temp + 2 },
    { day: "Sun", temp: temp },
  ];

  return (
    <div className="min-h-screen w-full relative text-gray-800 
    bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200">

    {/* subtle pattern overlay */}
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <div className="w-full h-full 
      bg-[radial-gradient(circle_at_2px_2px,rgba(15, 119, 85, 0.25)_1px,transparent_0)] 
      bg-[size:40px_40px]" />
    </div>
    <div className="absolute top-20 left-1/3 w-96 h-96 bg-emerald-300 opacity-20 blur-3xl rounded-full"></div>
      {/* PAGE CONTENT */}
      <div className="pb-14 px-8 w-full">

        {/* SEASON CARD */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 rounded-2xl shadow-2xl flex justify-between items-center mb-8">

          <div>
            <p className="text-xs uppercase opacity-80">
              Seasonal Overview
            </p>

            <h2 className="text-3xl font-bold">
              {data.season || "Unknown"}
            </h2>

            <p>{data.location}</p>
          </div>

          <div className="text-right">
            <p className="text-sm opacity-80">Crop Health</p>
            <p className="text-lg font-semibold">
              {data.cropHealth || "Data Unavailable"}
            </p>
          </div>

        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT */}
          <div className="space-y-6">

            {/* TIP */}
            <div className="bg-yellow-100 p-6 rounded-2xl shadow border border-yellow-200">

              <div className="flex items-center gap-2 mb-3 text-yellow-700">
                <Lightbulb size={18} />
                <span className="font-semibold text-sm">
                  Today’s Farming Tip
                </span>
              </div>

              <p className="text-sm">
                {temp >= 30
                  ? "High temperature detected. Increase irrigation and avoid spraying during peak sunlight."
                  : "Cool weather supports strong root development and nutrient absorption."}
              </p>

            </div>

            {/* WEATHER */}
            <div className="bg-gradient-to-br from-sky-300 to-sky-200 p-6 rounded-xl shadow-xl max-w-md">
              <div className="flex items-center gap-6 mb-6">

                <h1 className="text-5xl font-bold text-green-900">
                  {temp}°C
                </h1>

                {isHot ? (
                  <Sun size={50} className="text-yellow-500" />
                ) : (
                  <CloudRain size={50} className="text-blue-600" />
                )}

              </div>

              <div className="space-y-3">

                <WeatherRow
                  icon={<Droplets size={15} />}
                  label="Soil"
                  value={`${data.soilMoisture}%`}
                />

                <WeatherRow
                  icon={<CloudRain size={15} />}
                  label="Rain"
                  value={`${data.weather.precipitation ?? 2} mm`}
                />

                <WeatherRow
                  icon={<Wind size={15} />}
                  label="Wind"
                  value={`${data.weather.windSpeed ?? 8} km/h`}
                />

                <WeatherRow
                  icon={<Thermometer size={15} />}
                  label="Humidity"
                  value={`${data.weather.humidity ?? 65}%`}
                />

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* NAV BUTTONS */}
            <div className="grid grid-cols-3 gap-4">

              <NavButton
                icon={<BarChart2 size={16} />}
                label="Analytics"
                onClick={() => navigate("/analytics")}
              />

              <NavButton
                icon={<MessageCircle size={16} />}
                label="Assistant"
                onClick={() => navigate("/assistant")}
              />

              <NavButton
                icon={<Sprout size={16} />}
                label="Recommend"
                onClick={() => navigate("/recommend")}
              />

              <NavButton
                icon={<Camera size={16} />}
                label="Scan"
                onClick={() => navigate("/diagnosis")}
              />

              <NavButton
                icon={<TrendingUp size={16} />}
                label="Market"
                onClick={() => navigate("/market")}
              />

            </div>

            {/* GRAPH */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg">

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>

                  <CartesianGrid stroke="#e5e7eb" />

                  <XAxis dataKey="day" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                </LineChart>
              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

const WeatherRow = ({ icon, label, value }: any) => (
  <div className="flex justify-between items-center bg-white/80 p-3 rounded-lg text-sm">

    <div className="flex items-center gap-2">
      {icon}
      {label}
    </div>

    <span className="font-medium">{value}</span>

  </div>
);

const NavButton = ({ icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className="
    bg-white/80 backdrop-blur-md
    text-gray-700
    py-3
    rounded-xl
    shadow-md
    flex flex-col
    items-center
    gap-1
    text-xs
    transition
    hover:bg-gradient-to-r
    hover:from-green-600
    hover:to-emerald-500
    hover:text-white
    hover:scale-105
    "
  >
    {icon}
    {label}
  </button>
);

export default Dashboard;