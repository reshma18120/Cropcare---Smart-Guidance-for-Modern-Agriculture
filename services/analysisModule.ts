const API_BASE = "http://127.0.0.1:8000";

/* =====================================================
   Analytics Response Interface
===================================================== */

export interface AnalyticsResponse {
  region: string;
  year: number;

  crop_analysis: {
    recommended_crop: string;
    yield_confidence_percent: number;
    season: string;
    weather: {
      temperature: number;
      humidity: number;
      rainfall: number;
    };
  };

  market_analysis: {
    predicted_price: number;
    price_range: {
      min: number;
      max: number;
    };
    confidence_percent: number;

    trend_last_5_years: {
      year: number;
      price: number;
    }[];
  };

  action_insight: {
    decision: string;
    explanation: string;
    key_points: string[];
  };
}

/* =====================================================
   Fetch Analytics
===================================================== */

export async function fetchAnalytics(
  region: string,
  year: number
): Promise<AnalyticsResponse> {

  const normalizedRegion = region.toLowerCase().trim();

  try {

    const response = await fetch(`${API_BASE}/analytics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        region: normalizedRegion,
        year: year
      })
    });

    if (!response.ok) {

      const text = await response.text();
      console.error("Analytics API Error:", text);

      throw new Error(`Server Error: ${response.status}`);
    }

    const data: AnalyticsResponse = await response.json();

    console.log("Analytics Response:", data);

    return data;

  } catch (error) {

    console.error("Analytics Fetch Failed:", error);
    throw error;

  }
}