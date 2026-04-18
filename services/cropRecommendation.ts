import { API_BASE_URL } from "../constants";

export interface CropPredictionResponse {
  success: boolean;
  region: string;
  season: string;
  weather: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  recommended_crop: string;
  confidence_percent: number;
  why_this_crop: string;
  top_3_crops: {
    crop: string;
    confidence: number;
    sowing_time: string;
    harvest_time: string;
    water_requirement: string;
  }[];
}

// ✅ NEW request type (ONLY region)
export interface CropPredictionRequest {
  region: string;
}

export async function fetchCropRecommendation(
  data: CropPredictionRequest
): Promise<CropPredictionResponse> {

  const response = await fetch(
    `${API_BASE_URL}/predict-crop?region=${encodeURIComponent(data.region)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch crop recommendation");
  }

  return response.json();
}
