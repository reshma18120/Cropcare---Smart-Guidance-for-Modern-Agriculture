import { API_BASE_URL } from "../constants";
import { AlertItem } from "../types";

export async function fetchAlerts(
  region: string
): Promise<AlertItem[]> {
  const res = await fetch(
    `${API_BASE_URL}/alerts?region=${encodeURIComponent(region)}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch alerts");
  }

  const data = await res.json();
  return data.alerts;
}