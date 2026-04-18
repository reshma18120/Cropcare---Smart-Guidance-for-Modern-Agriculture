import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Loader2,
  MapPin,
  Droplets,
  Globe2,
  ThermometerSun,
  CloudRain,
  AlertTriangle
} from "lucide-react";
import { fetchCropRecommendation } from "../services/cropRecommendation";
import { Country, State, City } from "country-state-city";
import { Language } from "../types";
import { useAppContext } from "../modules/AppContext"

/* -----------------------------
   LOCATION SANITIZER
----------------------------- */
const cleanLocation = (raw: string) => {
  if (!raw) return "";
  const badWords = ["road", "street", "lane", "layout", "colony", "nagar"];
  let parts = raw
    .split(",")
    .map(p => p.trim())
    .filter(p => !badWords.some(b => p.toLowerCase().includes(b)));
  return [...new Set(parts.map(p => p.toLowerCase()))]
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(", ");
};

const translations = {
  en: {
    title: "Crop Recommendation",
    subtitle: "Crop suggestions using live weather & season",
    location: "Your Location",
    manual: "Select location manually",
    gps: "Using saved GPS location",
    recommend: "Recommend Crop",
    confidence: "Confidence",
    why: "Why this crop?",
    top: "Top Suitable Crops",
    sowing: "Sowing",
    harvest: "Harvest",
    water: "Water Requirement",
    season: "Current Season",
    weather: "Weather Snapshot",
    steps: "Next Steps for Farmers",
    low: "Low confidence",
    moderate: "Moderate confidence",
    high: "High confidence",
    detecting: "Location not set"
  }
};

interface Props {
  language: Language;
}

const Recommendation: React.FC<Props> = ({ language }) => {
  const {
    recommendationResult,
    setRecommendationResult,
    recommendationRegion,
    setRecommendationRegion
  } = useAppContext();
  const t = translations["en"];

  const [region, setRegion] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
  const saved = localStorage.getItem("cropcare_user");

  if (saved) {
    try {
      const user = JSON.parse(saved);

      // ✅ Use profile location ONLY if it's detailed enough
      if (user?.location && user.location.split(",").length >= 2) {
        setRegion(cleanLocation(user.location));
        return;
      }
    } catch {}
  }

  // ✅ Fallback to GPS if profile is poor
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();

          const place =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state;

          setRegion(cleanLocation(place));
        } catch (err) {
          console.error("Location fetch failed", err);
        }
      },
      (err) => {
        console.error("GPS error", err);
      }
    );
  }
}, []);

  useEffect(() => {
    if (recommendationResult && !result) {
      setResult(recommendationResult);
    }
  }, [recommendationResult]);

  useEffect(() => {
    if (recommendationRegion && !region) {
      setRegion(recommendationRegion);
    }
  }, [recommendationRegion]);

  const confidenceLabel = (c: number) => {
    if (c < 5) return t.low;
    if (c < 20) return t.moderate;
    return t.high;
  };

  const handleFetch = async () => {
  if (!region) return;

  setLoading(true);

  try {
    const res = await fetchCropRecommendation({ region });

    // ✅ Save to BOTH (UI + Context)
    setResult(res);
    setRecommendationResult(res);
    setRecommendationRegion(region);

  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-green-100 p-6 space-y-12 overflow-hidden">

      {/* Floating Animated Images */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/2909/2909762.png"
        alt="plant"
        className="absolute top-10 left-10 w-20 opacity-20 animate-bounce"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/415/415733.png"
        alt="sun"
        className="absolute bottom-20 right-10 w-24 opacity-20 animate-pulse"
      />

      {/* HEADER */}
      <header className="text-center space-y-3">
        <h2 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-800 bg-clip-text text-transparent">
          {t.title}
        </h2>
        <p className="text-slate-600 text-lg">{t.subtitle}</p>
      </header>

      {/* LOCATION CARD */}
      <section className="backdrop-blur-lg bg-white/70 border border-white/40 shadow-xl rounded-3xl p-8 space-y-6 max-w-4xl mx-auto transition hover:shadow-2xl">

        <div className="flex items-center gap-2 text-emerald-700 font-bold">
          <MapPin size={18} /> {t.location}
        </div>

        {!useManual ? (
          <div className="text-2xl font-bold text-slate-700">
            {region || t.detecting}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <select
              className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              onChange={e => {
                setCountryCode(e.target.value);
                setStateCode("");
              }}
            >
              <option>Select Country</option>
              {Country.getAllCountries().map(c => (
                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
              ))}
            </select>

            <select
              className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              disabled={!countryCode}
              onChange={e => setStateCode(e.target.value)}
            >
              <option>Select State</option>
              {State.getStatesOfCountry(countryCode).map(s => (
                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
              ))}
            </select>

            <select
              className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-400"
              disabled={!stateCode}
              onChange={e => {
                const city = e.target.value;
                const state = State.getStateByCodeAndCountry(stateCode, countryCode)?.name;
                const country = Country.getCountryByCode(countryCode)?.name;
                setRegion(cleanLocation(`${city}, ${state}, ${country}`));
              }}
            >
              <option>Select City</option>
              {City.getCitiesOfState(countryCode, stateCode).map(c => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => setUseManual(!useManual)}
          className="text-emerald-600 font-semibold flex gap-2 hover:underline"
        >
          <Globe2 size={16} />
          {useManual ? t.gps : t.manual}
        </button>

        <button
          onClick={handleFetch}
          disabled={loading || !region}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:scale-105 transition text-white py-4 rounded-2xl font-bold flex justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" /> : t.recommend}
          <ArrowRight />
        </button>
      </section>

      {/* RESULTS */}
      {result && (
        <div className="space-y-8 max-w-5xl mx-auto">

          {/* HERO RESULT */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-10 rounded-3xl shadow-xl animate-fade-in">
            <h3 className="text-4xl font-extrabold uppercase">
              {result.recommended_crop}
            </h3>
            <p className="mt-2 text-lg">
              {t.confidence}: {result.confidence_percent}% ({confidenceLabel(result.confidence_percent)})
            </p>
            <p className="mt-1">🌱 {t.season}: {result.season}</p>
          </div>

          {/* WEATHER */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-sky/200  rounded-2xl p-6 shadow hover:shadow-lg transition">
              <ThermometerSun className="text-orange-500 mb-2" />
              <p className="text-xl font-bold">{result.weather.temperature}°C</p>
              <p className="text-sm text-slate-500">Temperature</p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow hover:shadow-lg transition">
              <CloudRain className="text-blue-500 mb-2" />
              <p className="text-xl font-bold">{result.weather.rainfall} mm</p>
              <p className="text-sm text-slate-500">Rainfall</p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow hover:shadow-lg transition">
              <Droplets className="text-cyan-500 mb-2" />
              <p className="text-xl font-bold">{result.weather.humidity}%</p>
              <p className="text-sm text-slate-500">Humidity</p>
            </div>
          </div>

          {/* WHY */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow">
            <h4 className="font-bold mb-2">{t.why}</h4>
            <p className="text-slate-600">{result.why_this_crop}</p>
          </div>

          {/* TOP CROPS */}
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow">
            <h4 className="font-bold mb-4">{t.top}</h4>
            {result.top_3_crops.map((c: any, i: number) => (
              <div key={i} className="border rounded-xl p-4 mb-3 hover:bg-emerald-50 transition">
                <div className="flex justify-between font-bold">
                  <span>{c.crop}</span>
                  <span>{c.confidence}%</span>
                </div>
                <p className="text-xs mt-1">
                  🌱 {t.sowing}: {c.sowing_time} | 🌾 {t.harvest}: {c.harvest_time}
                </p>
                <p className="text-xs mt-1">
                  💧 {t.water}: {c.water_requirement}
                </p>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default Recommendation;