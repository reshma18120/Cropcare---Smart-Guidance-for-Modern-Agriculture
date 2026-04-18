import React, { useState, useRef } from "react";
import { DiagnosisResult, Language } from "../types";
import {
  Camera,
  Upload,
  Sprout,
  FlaskConical,
  CheckCircle2,
  Loader2,
  Volume2
} from "lucide-react";
import { diagnoseImage } from "../services/diagnosis";
import { useAppContext } from "../modules/AppContext";

interface Props {
  language: Language;
}

const Diagnosis: React.FC<Props> = ({ language }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"organic" | "chemical">("organic");

  const {
    diagnosisResult,
    setDiagnosisResult
  } = useAppContext();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  /* ================= TEXT TO SPEECH ================= */
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === Language.TELUGU
        ? "te-IN"
        : language === Language.HINDI
        ? "hi-IN"
        : "en-IN";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  /* ================= IMAGE HANDLER ================= */
  const handleFile = async (file?: File) => {
    if (!file) return;

    setLoading(true);
    setDiagnosisResult(null);

    try {
      const data = await diagnoseImage(file, language);
      setDiagnosisResult(data);
    } catch {
      alert("Unable to detect disease. Please upload a clear crop image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-sky-100 px-4 pb-24 space-y-10">

      {/* HEADER */}
      <header className="text-center pt-10 space-y-3">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-800 bg-clip-text text-transparent">
          Crop Disease Scanner
        </h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Upload a crop image to identify disease and get treatment
        </p>
      </header>

      {/* BUTTONS */}
      <section className="flex justify-center gap-8">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-40 h-40 bg-emerald-600 text-white rounded-3xl flex flex-col items-center justify-center shadow-xl"
        >
          <Camera size={40} />
          <span className="mt-3 text-xs font-bold">Camera</span>
        </button>

        <button
          onClick={() => galleryInputRef.current?.click()}
          className="w-40 h-40 bg-white border text-emerald-700 rounded-3xl flex flex-col items-center justify-center shadow-lg"
        >
          <Upload size={40} />
          <span className="mt-3 text-xs font-bold">Gallery</span>
        </button>
      </section>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={36} />
        </div>
      )}

      {/* RESULT */}
      {diagnosisResult && (
        <div className="space-y-8 max-w-4xl mx-auto">

          {/* SUMMARY */}
          <section className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl space-y-3">
            <h2 className="text-3xl font-extrabold">
              {diagnosisResult.disease.replace(/_/g, " ")}
            </h2>
            <p>{diagnosisResult.cause}</p>
            <p className="text-sm font-bold">
              Confidence: {Math.round(diagnosisResult.confidence * 100)}%
            </p>

            <button
              onClick={() =>
                speak(`${diagnosisResult.disease}. ${diagnosisResult.cause}`)
              }
              className="bg-black/20 px-4 py-2 rounded-full text-sm"
            >
              <Volume2 size={14} /> Listen
            </button>
          </section>

          {/* MODE SWITCH */}
          <div className="flex bg-slate-100 rounded-full p-1 max-w-md mx-auto">
            <button
              onClick={() => setMode("organic")}
              className={`flex-1 py-3 rounded-full ${
                mode === "organic" ? "bg-white shadow" : ""
              }`}
            >
              Organic
            </button>

            <button
              onClick={() => setMode("chemical")}
              className={`flex-1 py-3 rounded-full ${
                mode === "chemical" ? "bg-white shadow" : ""
              }`}
            >
              Chemical
            </button>
          </div>

          {/* TREATMENT */}
          <section className="bg-white rounded-3xl p-8 shadow space-y-3">
            {(mode === "organic"
              ? diagnosisResult.organic_treatment
              : diagnosisResult.chemical_treatment
            ).map((step, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle2 className="text-emerald-600 mt-1" size={18} />
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </section>

        </div>
      )}
    </div>
  );
};

export default Diagnosis;