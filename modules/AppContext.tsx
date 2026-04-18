import React, { createContext, useContext, useState } from "react";

// ================= TYPES =================
import { ChatMessage } from "../types";
import { DiagnosisResult } from "../types";
import { AnalyticsResponse } from "../services/analysisModule";
import { MarketPredictionResponse } from "../services/marketplace";

// ================= MARKET TYPE =================
type MarketResult = MarketPredictionResponse & {
  min_price: number;
  max_price: number;
  trend: { year: number; price: number }[];
};

// ================= CONTEXT TYPE =================
interface AppState {
  // 🌾 Farm Assistant
  farmMessages: ChatMessage[];
  setFarmMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;

  // 📈 Marketplace
  marketResult: MarketResult | null;
  setMarketResult: React.Dispatch<React.SetStateAction<MarketResult | null>>;

  // 🌿 Diagnosis
  diagnosisResult: DiagnosisResult | null;
  setDiagnosisResult: React.Dispatch<React.SetStateAction<DiagnosisResult | null>>;

  // 📊 Analytics
  analyticsData: AnalyticsResponse | null;
  setAnalyticsData: React.Dispatch<React.SetStateAction<AnalyticsResponse | null>>;

  analyticsFilters: {
    region: string;
    year: number;
  };
  setAnalyticsFilters: React.Dispatch<
    React.SetStateAction<{ region: string; year: number }>
  >;

  // 🌱 Recommendation
  recommendationResult: any;
  setRecommendationResult: React.Dispatch<React.SetStateAction<any>>;

  recommendationRegion: string;
  setRecommendationRegion: React.Dispatch<React.SetStateAction<string>>;
}

// ================= CREATE CONTEXT =================
const AppContext = createContext<AppState | null>(null);

// ================= PROVIDER =================
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  
  // 🌾 Farm Assistant
  const [farmMessages, setFarmMessages] = useState<ChatMessage[]>([]);

  // 📈 Marketplace
  const [marketResult, setMarketResult] = useState<MarketResult | null>(null);

  // 🌿 Diagnosis
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  // 📊 Analytics
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    region: "",
    year: new Date().getFullYear(),
  });

  // 🌱 Recommendation
  const [recommendationResult, setRecommendationResult] = useState<any>(null);
  const [recommendationRegion, setRecommendationRegion] = useState("");

  return (
    <AppContext.Provider
      value={{
        farmMessages,
        setFarmMessages,

        marketResult,
        setMarketResult,

        diagnosisResult,
        setDiagnosisResult,

        analyticsData,
        setAnalyticsData,
        analyticsFilters,
        setAnalyticsFilters,

        recommendationResult,
        setRecommendationResult,
        recommendationRegion,
        setRecommendationRegion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ================= CUSTOM HOOK =================
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};