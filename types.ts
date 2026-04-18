/* =====================================================
   LANGUAGE & USER TYPES
   ===================================================== */

export enum Language {
  EN = "en",
  TELUGU = "te",
  HINDI = "hi"
}

export enum FarmerType {
  SMALL = "Small Farmer",
  MEDIUM = "Medium Farmer",
  TERRACE = "Terrace Gardener",
  ORGANIC = "Organic Farmer",
}

/* =====================================================
   ALERT TYPES
   ===================================================== */

export enum AlertPriority {
  HIGH = "High",
  MEDIUM = "Medium",
  INFO = "Informational",
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  priority: AlertPriority;
  timestamp: string;
  crop: string;
  weather: {
    reason: string;
    temperature?: number;
    rainfall?: number;
  };
}

/* =====================================================
   SOIL & AGRICULTURE INPUT TYPES
   ===================================================== */

export interface SoilNPK {
  n: number;
  p: number;
  k: number;
  ph: number;
}

/* =====================================================
   CROP RECOMMENDATION
   ===================================================== */

export interface CropRecommendationResponse {
  recommended_crop: string;
  confidence_percent: number;
}

export interface CropRecommendationUI {
  crop: string;
  confidence: number;
}

/* =====================================================
   DISEASE DIAGNOSIS
   ===================================================== */

export interface DiagnosisResult {
  disease: string;
  confidence: number;
  cause: string;

  organic_treatment: string[];
  chemical_treatment: string[];

  precaution: string[];

  severity: string;
  action_priority: string;

  why_this_occurred: string[];

  spread_risk: {
    level: string;
    message: string;
  };

  dosage_and_safety: string[];

  emergency_warning?: string;

  weather_spray_advice?: string;
  lock_chemical_spray?: boolean;
}


/* =====================================================
   FARM ASSISTANT CHAT
   ===================================================== */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;

  /** Language of this message (en / hi / te) */
  language?: "en" | "hi" | "te";
}

/* =====================================================
   ASSISTANT API CONTRACT (VERY IMPORTANT)
   ===================================================== */

/** What frontend sends to backend */
export interface AssistantRequest {
  question: string;
  language: "en" | "hi" | "te";
  image?: string;
  history: ChatMessage[];
}


/** What backend MUST return */
export interface AssistantResponse {
  text: string;
  language: "en" | "hi" | "te";

  /** Optional: when image is analyzed */
  image_analysis?: {
    crop?: string;
    issue?: string;
    confidence?: number;
    notes?: string[];
  };
}

/* =====================================================
   USER PROFILE
   ===================================================== */

export interface UserProfile {
  name: string;
  phone: string;
  pin: string;
  language: Language;
  type: FarmerType;
  location: string;
  isLoggedIn: boolean;
}

/* =====================================================
   MARKET PRICE PREDICTION
   ===================================================== */

export interface MarketPriceRequest {
  crop: string;
  type: string;   // ✅ flexible
  year: number;
  month: number;     // ✅ add
  state: string;     // ✅ add
  market: string; 
}

export interface MarketPriceResponse {
  crop: string;
  type: string;   // ✅ flexible
  year: number;
  predicted_price: number;
  min_price: number;
  max_price: number;
  confidence: number;

  trend?: { year: number; price: number }[];
}
