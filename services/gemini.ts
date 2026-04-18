import { GoogleGenAI, Type } from "@google/genai";
import {
  SoilNPK,
  DiagnosisResult,
  CropRecommendationResponse,
  MarketPriceRequest,
  MarketPriceResponse,
  AssistantRequest,
  AssistantResponse
} from "../types";

/* =====================================================
   ENV
   ===================================================== */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("❌ VITE_GEMINI_API_KEY missing");
}

const ai = new GoogleGenAI({ apiKey });

/* =====================================================
   IMAGE DISEASE DIAGNOSIS (GEMINI VISION)
   ===================================================== */
export const getImageDiagnosis = async (
  image: string,
  cropType: string = "general"
): Promise<DiagnosisResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: image.split(",")[1]
          }
        },
        {
          text: `Analyze this ${cropType} crop image. Identify disease symptoms clearly.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          disease: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          severity: { type: Type.STRING },
          treatment: {
            type: Type.OBJECT,
            properties: {
              organic: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              chemical: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          },
          recoveryPlan: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          "disease",
          "confidence",
          "severity",
          "treatment",
          "recoveryPlan"
        ]
      },
      systemInstruction:
        "You are a professional plant pathologist. Use simple farmer-friendly language. Do not hallucinate."
    }
  });

  return JSON.parse(response.text || "{}");
};

/* =====================================================
   ✅ CROP RECOMMENDATION (BACKEND ML – FIXED)
   ===================================================== */
/**
 * IMPORTANT:
 * Crop recommendation MUST come from backend ML model
 * NOT from Gemini (to avoid hallucinations)
 */
export const fetchCropRecommendation = async (
  region: string
): Promise<CropRecommendationResponse> => {
  const res = await fetch(
    `http://127.0.0.1:8000/predict-crop?region=${encodeURIComponent(region)}`,
    {
      method: "POST"
    }
  );

  if (!res.ok) {
    throw new Error("❌ Crop recommendation failed");
  }

  return res.json();
};

/* =====================================================
   MARKET PRICE PREDICTION (BACKEND)
   ===================================================== */
export const fetchMarketPricePrediction = async (
  payload: MarketPriceRequest
): Promise<MarketPriceResponse> => {
  const res = await fetch("http://127.0.0.1:8000/market/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error("❌ Market price prediction failed");
  }

  return res.json();
};

/* =====================================================
   FARM ASSISTANT CHAT (BACKEND RAG + GEMINI)
   ===================================================== */
export async function generateAssistantResponse(
  payload: AssistantRequest
) {
  const response = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return response.json();
}

