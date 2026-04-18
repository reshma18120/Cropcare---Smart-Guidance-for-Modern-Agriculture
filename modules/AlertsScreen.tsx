import React, { useEffect, useState } from "react";
import { Language, AlertPriority } from "../types";
import { TRANSLATIONS } from "../constants";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Brain
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  language: Language;
}

/* ================= LOCATION ================= */
const getUserLocation = (): Promise<string> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("India");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve(`${latitude},${longitude}`);
      },
      () => resolve("India")
    );
  });
};

/* ================= NOTIFICATION ================= */
const notify = async (title: string, body: string) => {
  if (!("Notification" in window)) return;

  let permission = Notification.permission;

  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/logo192.png"
    });

    // optional auto-close
    setTimeout(() => notification.close(), 5000);
  }
};

const AlertsScreen: React.FC<Props> = ({ language }) => {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [resolved, setResolved] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "timeline">("list");
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<string>("");
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  /* ================= INIT LOCATION ================= */
  useEffect(() => {
    const init = async () => {
      const loc = await getUserLocation();
      setRegion(loc);
      setLoading(false);
    };
    init();
  }, []);

  /* ================= NOTIFICATION PERMISSION ================= */
  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ================= LOAD RESOLVED ================= */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resolved_alerts");
      if (saved) setResolved(JSON.parse(saved));
    } catch {
      setResolved([]);
    }
  }, []);

  /* ================= REAL-TIME WEBSOCKET ================= */
  useEffect(() => {
    if (!region) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: any;

    const connect = () => {
      ws = new WebSocket(
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000/ws/alerts/${region}`
      );

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newAlerts = data.alerts || [];

          setAlerts(newAlerts);

          // ✅ show latest alert in UI (top)
          if (newAlerts.length > 0) {
            setLiveAlerts((prev) => {
              const updated = [...newAlerts, ...prev];

              // keep only last 3 alerts
              return updated.slice(0, 3);
            });
          }

        } catch (err) {
          console.error("Invalid WS data:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
      };

      ws.onclose = () => {
        console.warn("⚠️ Reconnecting...");
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [region]);

  /* ================= NOTIFICATIONS ================= */
  const [prevAlerts, setPrevAlerts] = useState<any[]>([]);

useEffect(() => {
  if (!alerts.length) return;

  const newAlerts = alerts.filter(
    (a) => !prevAlerts.find((p) => p.id === a.id)
  );

  newAlerts.forEach((a) => {
    notify(
      `⚠️ ${a.title}`,
      `${a.crop ?? "Crop"} - ${a.weather?.reason}`
    );
  });

  setPrevAlerts(alerts);
}, [alerts]);

useEffect(() => {
  if (!liveAlerts.length) return;

  const timer = setTimeout(() => {
    setLiveAlerts((prev) => prev.slice(0, -1));
  }, 5000);

  return () => clearTimeout(timer);
}, [liveAlerts]);

  /* ================= ACTIONS ================= */
  const markResolved = (id: string) => {
    const updated = [...resolved, id];
    setResolved(updated);
    localStorage.setItem("resolved_alerts", JSON.stringify(updated));
  };

  const explainAlert = (a: any) => {
    navigate("/assistant", {
      state: {
        query: `
Crop: ${a.crop}
Alert: ${a.title}
Severity: ${a.priority}
Weather: ${a.weather?.reason}

Explain cause, solution, and precautions.
        `
      }
    });
  };

  const aiResolve = (a: any) => {
    navigate("/assistant", {
      state: {
        query: `
Crop: ${a.crop}
Problem: ${a.title}
Weather: ${a.weather?.reason}

Give solutions and prevention.
        `
      }
    });
  };

  const activeAlerts = alerts.filter((a) => !resolved.includes(a.id));
  const resolvedAlerts = alerts.filter((a) => resolved.includes(a.id));

  /* ================= UI ================= */
  const priorityUI = (p: AlertPriority) => {
    switch (p) {
      case AlertPriority.HIGH:
        return {
          icon: <AlertCircle className="text-red-500" />,
          badge: "bg-red-100 text-red-700",
          label: "High Risk"
        };
      case AlertPriority.MEDIUM:
        return {
          icon: <AlertTriangle className="text-amber-500" />,
          badge: "bg-amber-100 text-amber-700",
          label: "Medium Risk"
        };
      default:
        return {
          icon: <Info className="text-blue-500" />,
          badge: "bg-blue-100 text-blue-700",
          label: "Info"
        };
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-200 px-6 py-10">

    {/* HEADER */}
    <div className="max-w-6xl mx-auto bg-gradient-to-r from-emerald-600 to-green-700 
    text-white rounded-3xl p-6 shadow-xl flex items-center gap-4 mb-10">

      <ShieldAlert size={32} />

      <div>
        <h2 className="text-2xl font-black tracking-wide">
          {t.alerts}
        </h2>
        <p className="text-sm text-emerald-100">
          AI-powered crop & weather monitoring
        </p>
      </div>
    </div>

    {/* MAIN GRID */}
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

      {/* LEFT - SYSTEM STATUS */}
      <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

        <ShieldAlert className="mx-auto text-emerald-600 mb-4" size={40} />

        <h3 className="text-xl font-bold text-slate-800">
          Alert System Active
        </h3>

        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          You will receive real-time alerts as pop-up notifications based on 
          weather and crop conditions.
        </p>

        <div className="mt-6 text-xs text-slate-400">
          🔔 Keep this page open to receive alerts
        </div>

        <div className="mt-4 text-green-600 text-sm font-semibold">
          ● Connected to live alert system
        </div>
      </div>

      {/* RIGHT - LIVE ALERT BLOCKS */}
      <div className="space-y-4">

        {liveAlerts.length === 0 && (
          <div className="text-sm text-slate-400 text-center mt-10">
            No alerts yet
          </div>
        )}

        {liveAlerts.map((a, index) => {
          const isHigh = a.priority === "High";
          const isMedium = a.priority === "Medium";

          return (
            <div
              key={index}
              className={`rounded-2xl p-5 shadow-lg border transition-all duration-300
              ${
                isHigh
                  ? "bg-red-50 border-red-200"
                  : isMedium
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-start gap-3">

                <ShieldAlert
                  size={20}
                  className={`mt-1 ${
                    isHigh
                      ? "text-red-600"
                      : isMedium
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}
                />

                <div className="flex-1">
                  <p className="text-base font-bold text-slate-800">
                    {a.title}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    🌾 {a.crop ?? "General"} • {a.weather?.reason}
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  {a.timestamp || "Now"}
                </span>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  </div>
);
};

export default AlertsScreen;