// frontend/services/dashboard.ts

const API_BASE_URL = "http://127.0.0.1:8000";

export interface DashboardOverview {
  location: string;
  season: string;

  weather: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };

  soil: {
    type: string;
    ph: number;
  };

  soilMoisture: "Optimal" | "Moderate" | "Dry";
  cropHealth: string;

  riskLevel: "Low" | "Medium" | "High";

  actions: string[];

  todayTip: string;
}

/**
 * Fetch dashboard using GPS coordinates
 */
export async function fetchDashboardOverview(
  lat: number,
  lon: number
): Promise<DashboardOverview> {
  try {

    const response = await fetch(
      `${API_BASE_URL}/dashboard/overview?lat=${lat}&lon=${lon}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Dashboard API error: ${response.status}`);
    }

    const data = await response.json();

    return data as DashboardOverview;

  } catch (error) {

    console.error("Dashboard fetch failed:", error);

    return {
      location: "Unknown",
      season: "Unknown",
      weather: {
        temperature: 30,
        humidity: 65,
        rainfall: 0
      },
      soil: {
        type: "Unknown",
        ph: 6.5
      },
      soilMoisture: "Moderate",
      cropHealth: "Data Unavailable",
      riskLevel: "Low",
      actions: ["Check internet connection"],
      todayTip: "Please check your network connection."
    };

  }
}