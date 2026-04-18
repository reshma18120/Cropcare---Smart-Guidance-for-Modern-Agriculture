import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { Language, UserProfile, FarmerType } from "./types";

/* ================= CONTEXT ================= */
import { AppProvider } from "./modules/AppContext";

/* ================= MODULES ================= */
import Dashboard from "./modules/Dashboard";
import FarmAssistant from "./modules/FarmAssistant";
import Analytics from "./modules/Analytics";
import Recommendation from "./modules/Recommendation";
import Diagnosis from "./modules/Diagnosis";
import Marketplace from "./modules/Marketplace";
import Profile from "./modules/Profile";
import AlertsScreen from "./modules/AlertsScreen";
import Login from "./modules/Login";

/* ================= ICONS ================= */
import {
  Bell,
  WifiOff,
  User,
  Home,
  MessageSquare,
  BarChart3,
  Leaf,
  Camera,
  ShoppingBag,
} from "lucide-react";

/* ================= NAV ================= */
const NAV_ITEMS = [
  { id: "home", label: { en: "Home", te: "హోమ్", hi: "होम" }, icon: Home },
  { id: "assistant", label: { en: "Assistant", te: "సహాయకుడు", hi: "सहायक" }, icon: MessageSquare },
  { id: "analytics", label: { en: "Analytics", te: "విశ్లేషణ", hi: "विश्लेषण" }, icon: BarChart3 },
  { id: "recommend", label: { en: "Crops", te: "పంటలు", hi: "फसलें" }, icon: Leaf },
  { id: "diagnosis", label: { en: "Scan", te: "స్కాన్", hi: "स्कैन" }, icon: Camera },
  { id: "market", label: { en: "Market", te: "మార్కెట్", hi: "बाज़ार" }, icon: ShoppingBag },
];

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ========== USER STATE ========== */
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("cropcare_user");
      if (!saved) throw new Error("No user");

      const parsed = JSON.parse(saved);
      return {
        name: parsed.name || "",
        phone: parsed.phone || "",
        pin: parsed.pin || "",
        language: parsed.language || Language.EN,
        type: parsed.type || FarmerType.SMALL,
        location: parsed.location || "",
        isLoggedIn: parsed.isLoggedIn === true
      };
    } catch {
      return {
        name: "",
        phone: "",
        pin: "",
        language: Language.EN,
        type: FarmerType.SMALL,
        location: "",
        isLoggedIn: false
      };
    }
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  /* ========== SAVE USER ========== */
  useEffect(() => {
    localStorage.setItem("cropcare_user", JSON.stringify(user));
  }, [user]);

  /* ========== NETWORK ========== */
  useEffect(() => {
    const handler = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  /* ========== LOGIN GUARD ========== */
  if (!user.isLoggedIn && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  /* ========== AUTO REDIRECT ========== */
  useEffect(() => {
    if (user.isLoggedIn && location.pathname === "/login") {
      navigate("/home", { replace: true });
    }
  }, [user.isLoggedIn, location.pathname]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* HEADER */}
      {location.pathname !== "/login" && (
        <header className="bg-emerald-600 text-white px-4 py-3 pt-12 flex justify-between items-center">
          <h1 className="font-black text-xl">CropCare AI</h1>

          <div className="flex items-center gap-4">
            {isOffline && <WifiOff size={20} className="text-amber-300" />}
            <button onClick={() => navigate("/alerts")}>
              <Bell size={24} />
            </button>
            <button onClick={() => navigate("/profile")}>
              <User size={24} />
            </button>
          </div>
        </header>
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto pb-24 p-4">
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                key={user.isLoggedIn ? "logged-in" : "logged-out"}
                onLogin={(profile) =>
                  setUser({ ...profile, isLoggedIn: true })
                }
              />
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Dashboard language={user.language} />} />
          <Route path="/assistant" element={<FarmAssistant language={user.language} />} />
          <Route path="/analytics" element={<Analytics language={user.language} />} />
          <Route path="/recommend" element={<Recommendation language={user.language} />} />
          <Route path="/diagnosis" element={<Diagnosis language={user.language} />} />
          <Route path="/market" element={<Marketplace language={user.language} />} />
          <Route
            path="/profile"
            element={
              <Profile
                language={user.language}
                setLanguage={(lang) =>
                  setUser((prev) => ({ ...prev, language: lang }))
                }
              />
            }
          />
          <Route path="/alerts" element={<AlertsScreen language={user.language} />} />
        </Routes>
      </main>

      {/* BOTTOM NAV */}
      {location.pathname !== "/login" && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t h-16 flex justify-around items-center">
          {NAV_ITEMS.map((item) => {
            const path = item.id === "home" ? "/home" : `/${item.id}`;
            const isActive = location.pathname === path;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-bold">
                  {item.label[user.language]}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

/* ================= ROOT APP ================= */
const App: React.FC = () => (
  <Router>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </Router>
);

export default App;