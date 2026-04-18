import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChatMessage, Language } from "../types";
import {
  Send,
  Camera,
  Volume2,
  Loader2,
  X,
  Mic,
  HelpCircle,
  History
} from "lucide-react";
import { generateAssistantResponse } from "../services/gemini";
import { useAppContext } from "../modules/AppContext";

/* ================= TEXT TO SPEECH ================= */
const speakText = (text: string, lang: string) => {
  if (!window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang =
    lang === "te" ? "te-IN" :
    lang === "hi" ? "hi-IN" :
    "en-IN";

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

interface Props {
  language: Language;
}

const FarmAssistant: React.FC<Props> = ({ language }) => {
  const location = useLocation();

  const [input, setInput] = useState("");
  const { farmMessages, setFarmMessages } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= INITIAL MESSAGE ================= */
  useEffect(() => {
    const welcomeText =
      language === Language.TELUGU
        ? "హలో 👋 నేను మీ CropCare సహాయకుడిని.\n\nమీరు పంటలు, వ్యాధులు, వాతావరణం గురించి అడగవచ్చు లేదా పంట ఫోటో అప్‌లోడ్ చేయవచ్చు."
        : language === Language.HINDI
        ? "नमस्ते 👋 मैं आपका CropCare सहायक हूँ।\n\nआप फसलों, रोगों, मौसम के बारे में पूछ सकते हैं या फसल की फोटो अपलोड कर सकते हैं।"
        : "Hello 👋 I am your CropCare Assistant.\n\nAsk about crops, diseases, weather or upload a crop image.";

    if (farmMessages.length === 0) {
      setFarmMessages([
        {
          role: "assistant",
          content: welcomeText,
          language
        }
      ]);
    }
  }, [language]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [farmMessages, isLoading]);

  /* ================= SEND MESSAGE ================= */
  const handleSend = async (manualText?: string) => {
    const text = manualText ?? input;
    if (!text.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      image: selectedImage ?? undefined
    };

    const historyForBackend = farmMessages.map((m) => ({
      role: m.role,
      content: m.content,
      image: m.image
    }));

    setFarmMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await generateAssistantResponse({
        question: text,
        language,
        image: userMessage.image,
        history: historyForBackend
      });

      setFarmMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.text,
          language: response.language
        }
      ]);
    } catch {
      setFarmMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Unable to respond. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= IMAGE PICK ================= */
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ================= SPEECH TO TEXT ================= */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    setListening(true);
    recognition.start();

    recognition.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  return (
    <div className="flex h-full overflow-hidden bg-gradient-to-b from-green-50 to-emerald-100">
      {/* HISTORY SIDEBAR */}
      {showHistory && (
      <aside className="w-72 bg-gradient-to-b from-white to-emerald-50 border-r shadow-xl p-4 overflow-y-auto">
          <h4 className="text-sm font-semibold text-emerald-700 mb-4 flex items-center gap-2">
            <History size={16} /> Conversation History
          </h4>

          <div className="space-y-2">
            {farmMessages
              .filter((m) => m.role === "user")
              .map((m, i) => (
                <div
                  key={i}
                  className="bg-white border border-emerald-100 hover:border-emerald-300 
                  rounded-lg p-2 text-xs text-slate-700 shadow-sm 
                  hover:bg-emerald-50 cursor-pointer transition truncate"
                >
                  {m.content}
                </div>
              ))}
          </div>

        </aside>
      )}

      {/* CHAT AREA */}
      <div className="flex flex-col flex-1 min-h-10overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md">
          <h3 className="text-lg font-semibold">🌾 Farm Assistant History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 
            bg-white/10 backdrop-blur-md border border-white/20
            hover:bg-white/20 hover:scale-105
            text-white rounded-xl transition-all duration-200 shadow-md"
          >
            <History size={18} className="text-green-300" />
            <span className="text-sm font-semibold">History</span>
          </button>
        </div>

        {/* CHAT MESSAGES */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {farmMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-md ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white"
                    : "bg-white border border-emerald-100"
                }`}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    className="rounded-xl mb-2"
                  />
                )}

                <p className="whitespace-pre-line">
                  {msg.content}
                </p>

                {msg.role === "assistant" && (
                  <button
                    onClick={() =>
                      speakText(
                        msg.content,
                        msg.language ?? "en"
                      )
                    }
                    className="mt-2 text-xs text-emerald-600 flex gap-1 hover:underline"
                  >
                    <Volume2 size={14} /> Listen
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex">
              <div className="bg-white px-4 py-3 rounded-2xl border flex gap-2 shadow">
                <Loader2 className="animate-spin" size={16} />
                Thinking…
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="bg-white border-t px-6 py-4">
          {selectedImage && (
            <div className="relative w-28 mb-3">
              <img
                src={selectedImage}
                className="rounded-xl border"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-2 shadow-inner">

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImagePick}
              className="hidden"
              accept="image/*"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-slate-200 rounded-full transition"
            >
              <Camera size={18} />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-transparent px-2 text-sm focus:outline-none"
              placeholder="Ask about crops, diseases, weather..."
            />

            <button
              onClick={startListening}
              className={`p-2 rounded-full transition ${
                listening
                  ? "bg-red-100 text-red-600"
                  : "hover:bg-slate-200"
              }`}
            >
              <Mic size={18} />
            </button>

            <button
              onClick={() => handleSend()}
              className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <HelpCircle size={14} />
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmAssistant;