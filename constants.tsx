import React from "react";
import {
  LayoutDashboard,
  MessageCircle,
  BarChart2,
  Sprout,
  Camera,
  ShoppingBag,
} from "lucide-react";
import { Language, AlertPriority } from "./types";

/* =====================================================
   BACKEND CONFIG
   ===================================================== */

export const API_BASE_URL = "http://127.0.0.1:8000";

/* =====================================================
   TRANSLATIONS
   ===================================================== */

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  [Language.EN]: {
    dashboard: "Home",
    assistant: "Assistant",
    analytics: "Growth",
    recommend: "Crops",
    diagnosis: "Care",
    alerts: "Alerts",
    market: "Market",
    profile: "Profile",

    todayTip: "Today's Farming Tip",
    seasonalView: "Seasonal View",

    yieldPrediction: "Estimated Yield",
    waterUsage: "Water Usage",
    fertilizer: "Fertilizer",

    explainAlert: "Explain",
  },

  [Language.HINDI]: {
    dashboard: "होम",
    assistant: "सहायक",
    analytics: "प्रगति",
    recommend: "फसलें",
    diagnosis: "देखभाल",
    alerts: "सूचनाएं",
    market: "बाजार",
    profile: "प्रोफ़ाइल",

    todayTip: "आज की खेती की टिप",
    seasonalView: "मौसमी दृश्य",

    yieldPrediction: "अनुमानित पैदावार",
    waterUsage: "पानी का उपयोग",
    fertilizer: "उर्वरक",

    explainAlert: "समझाएं",
  },

  [Language.TELUGU]: {
    dashboard: "హోమ్",
    assistant: "సహాయకుడు",
    analytics: "వృద్ధి",
    recommend: "పంటలు",
    diagnosis: "రక్షణ",
    alerts: "అలర్ట్లు",
    market: "మార్కెట్",
    profile: "ప్రొఫైల్",

    todayTip: "ఈ రోజు వ్యవసాయ చిట్కా",
    seasonalView: "కాలానుగుణ వీక్షణ",

    yieldPrediction: "అంచనా దిగుబడి",
    waterUsage: "నీటి వినియోగం",
    fertilizer: "ఎరువులు",

    explainAlert: "వివరించండి",
  },
};

/* =====================================================
   MOCK ALERTS (UI ONLY)
   ===================================================== */

export const MOCK_ALERTS = [
  {
    id: "1",
    title: "High Pest Risk",
    description: "Weather conditions favor pest outbreak.",
    priority: AlertPriority.HIGH,
    timestamp: "10 mins ago",

    // ✅ REQUIRED
    crop: "Tomato",
    weather: {
      reason: "High humidity and warm temperature",
      temperature: 29,
      rainfall: 12
    }
  },
  {
    id: "2",
    title: "Low Soil Moisture",
    description: "Soil moisture is below optimal level.",
    priority: AlertPriority.MEDIUM,
    timestamp: "1 hour ago",

    crop: "Paddy",
    weather: {
      reason: "No rainfall in last 5 days",
      temperature: 32
    }
  }
];


/* =====================================================
   BOTTOM NAVIGATION
   ===================================================== */

export const NAV_ITEMS = [
  {
    id: "home",
    labelKey: "dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    id: "assistant",
    labelKey: "assistant",
    icon: <MessageCircle size={20} />,
  },
  {
    id: "analytics",
    labelKey: "analytics",
    icon: <BarChart2 size={20} />,
  },
  {
    id: "recommend",
    labelKey: "recommend",
    icon: <Sprout size={20} />,
  },
  {
    id: "diagnosis",
    labelKey: "diagnosis",
    icon: <Camera size={20} />,
  },
  {
    id: "market",
    labelKey: "market",
    icon: <ShoppingBag size={20} />,
  },
];
