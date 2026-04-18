// =======================================
// Market Price Prediction API Service
// =======================================

const API_BASE_URL = "http://127.0.0.1:8000"

// =======================================
// REQUEST TYPE
// =======================================

export interface MarketPredictionRequest {
  crop: string
  type: string
  year: number
  month: number
  state: string
  market: string
  min_price: number
  max_price: number
}

// =======================================
// RESPONSE TYPE
// =======================================

export interface MarketTrend {
  year: number
  price: number
}

export interface MarketPredictionResponse {
  crop: string
  year: number
  type: string
  state: string
  market: string
  predicted_price: number
  min_price: number
  max_price: number
  confidence: number
  trend: MarketTrend[]
}

// =======================================
// FETCH MARKET PRICE PREDICTION
// =======================================

export async function fetchMarketPricePrediction(
  data: MarketPredictionRequest
): Promise<MarketPredictionResponse> {

  const response = await fetch(`${API_BASE_URL}/market/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.detail || "Prediction failed")
  }

  return result
}