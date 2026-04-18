/* =====================================================
   DIAGNOSIS SERVICE
   Image-based crop disease detection (CNN BACKEND)
   ===================================================== */

import { DiagnosisResult, Language } from "../types";

const API_BASE_URL = "http://127.0.0.1:8000";

/* -----------------------------------------------------
   NORMALIZE BACKEND RESPONSE (SAFE & STRICT)
----------------------------------------------------- */

function normalizeDiagnosisResponse(raw: any): DiagnosisResult {
  return {
    disease: raw.disease ?? "Unknown",
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0,

    cause: raw.cause ?? "",

    organic_treatment: Array.isArray(raw.organic_treatment)
      ? raw.organic_treatment
      : [],

    chemical_treatment: Array.isArray(raw.chemical_treatment)
      ? raw.chemical_treatment
      : [],

    precaution: Array.isArray(raw.precaution)
      ? raw.precaution
      : [],

    severity: raw.severity ?? "Unknown",
    action_priority: raw.action_priority ?? "",

    why_this_occurred: Array.isArray(raw.why_this_occurred)
      ? raw.why_this_occurred
      : [],

    spread_risk: raw.spread_risk ?? {
      level: "",
      message: ""
    },

    dosage_and_safety: Array.isArray(raw.dosage_and_safety)
      ? raw.dosage_and_safety
      : [],

    emergency_warning: raw.emergency_warning,

    weather_spray_advice: raw.weather_spray_advice,
    lock_chemical_spray: raw.lock_chemical_spray ?? false
  };
}

/* -----------------------------------------------------
   MAIN API CALL (CNN BACKEND)
----------------------------------------------------- */

export async function diagnoseImage(
  file: File,
  language: Language = Language.EN
): Promise<DiagnosisResult> {

  // 🔒 Enforce backend-compatible language
  const safeLanguage =
    language === Language.TELUGU
      ? "te"
      : language === Language.HINDI
      ? "hi"
      : "en";

  // ✅ FormData is REQUIRED by FastAPI
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/diagnose?language=${safeLanguage}`,
      {
        method: "POST",
        body: formData
      }
    );
  } catch {
    throw new Error("Unable to connect to diagnosis server");
  }

  if (!response.ok) {
    throw new Error("Disease detection failed");
  }

  const rawData = await response.json();
  return normalizeDiagnosisResponse(rawData);
}
