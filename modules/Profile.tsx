import React, { useEffect, useState } from "react";
import { Language, FarmerType, UserProfile } from "../types";
import { LanguageLabel } from "../utils/language";
import {
  Check,
  Globe,
  User,
  MapPin,
  LocateFixed,
  LogOut
} from "lucide-react";

/* ---------- LOCATION SANITIZER ---------- */
const cleanLocation = (raw: string) => {
  if (!raw) return "";

  const badWords = [
    "road",
    "street",
    "lane",
    "layout",
    "valley",
    "colony",
    "nagar",
    "sector"
  ];

  let parts = raw
    .split(",")
    .map(p => p.trim())
    .filter(p =>
      !badWords.some(b => p.toLowerCase().includes(b))
    );

  parts = parts.filter(
    (v, i, a) =>
      a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i
  );

  return parts.join(", ");
};

interface Props {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Profile: React.FC<Props> = ({ language, setLanguage }) => {

  const saved = localStorage.getItem("cropcare_user");
  const user: UserProfile | null = saved ? JSON.parse(saved) : null;

  const [farmerType, setFarmerType] = useState<FarmerType>(
    user?.type || FarmerType.SMALL
  );
  const [location, setLocation] = useState(
    cleanLocation(user?.location || "")
  );
  const [saving, setSaving] = useState(false);

  const saveProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    localStorage.setItem("cropcare_user", JSON.stringify(newUser));
  };

  /* ---------- GPS DETECT ---------- */
  const detectLocation = () => {

    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }

    setSaving(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );

          const data = await res.json();
          const a = data.address || {};

          const city = a.city || a.town || a.village || "";
          const district = a.district || a.state_district || "";
          const state = a.state || "";

          const final = cleanLocation(
            [city, district, state].filter(Boolean).join(", ")
          );

          setLocation(final);
          saveProfile({ location: final });

        } catch {
          alert("Unable to detect location");
        } finally {
          setSaving(false);
        }
      },
      () => {
        alert("GPS permission denied");
        setSaving(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    saveProfile({ type: farmerType });
  }, [farmerType]);

  return (

    <div className="min-h-screen overflow-y-auto pb-24 
    bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200">

      {/* CONTENT */}
      <div className="max-w-xl mx-auto pt-10 pb-24 px-6 space-y-8">
        {/* PROFILE HEADER */}
        <section className="flex flex-col items-center gap-3 text-center">

          <div className="w-28 h-28 rounded-full bg-white shadow-xl border-4 border-emerald-200 flex items-center justify-center">
            <User size={52} className="text-emerald-600" />
          </div>

          <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-800 bg-clip-text text-transparent">
            {user?.name || "Farmer"}
          </h2>

          <p className="text-sm text-slate-600 font-medium">
            Manage your farm profile
          </p>

        </section>

        {/* LOCATION CARD */}
        <section className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl space-y-4">

          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={18} /> Farm Location
          </h3>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={() => saveProfile({ location })}
            placeholder="Village, District, State"
            className="w-full px-4 py-3 border rounded-xl font-semibold focus:ring-2 focus:ring-emerald-400 outline-none"
          />

          <button
            onClick={detectLocation}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition"
          >
            <LocateFixed size={18} />
            {saving ? "Detecting Location..." : "Use My GPS Location"}
          </button>

        </section>

        {/* FARMER TYPE */}
        <section className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl space-y-4">

          <h3 className="font-bold text-slate-800">
            Farmer Category
          </h3>

          <div className="grid grid-cols-2 gap-3">

            {Object.values(FarmerType).map((type) => (

              <button
                key={type}
                onClick={() => setFarmerType(type)}
                className={`p-4 rounded-xl border-2 flex justify-between items-center transition ${
                  farmerType === type
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >

                <span className="text-sm font-bold text-slate-700">
                  {type}
                </span>

                {farmerType === type && (
                  <Check size={16} className="text-emerald-600" />
                )}

              </button>

            ))}

          </div>

        </section>

        {/* LANGUAGE */}
        <section className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl space-y-4">

          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Globe size={18} /> App Language
          </h3>

          <div className="flex gap-2">

            {Object.values(Language).map((lang) => (

              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  saveProfile({ language: lang });
                }}
                className={`flex-1 py-3 rounded-xl font-bold transition ${
                  language === lang
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >

                {LanguageLabel[lang]}

              </button>

            ))}

          </div>

        </section>

        {/* LOGOUT */}
        <button
          onClick={() => {
            localStorage.removeItem("cropcare_user");
            window.location.href = "#/login";
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition shadow-lg"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </div>
  );
};

export default Profile;