import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Language, FarmerType, UserProfile } from "../types";

interface Props {
  onLogin: (profile: UserProfile) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [location, setLocation] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "location">("phone");
  const [loading, setLoading] = useState(false);

  /* ================= RESET STATE WHEN PAGE OPENS ================= */
  useEffect(() => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setLocation("");
  }, []);

  /* ================= SEND OTP (TWILIO BACKEND) ================= */
  const sendOtp = async () => {
    try {
      const cleanedPhone = phone.trim().replace(/\D/g, "");

      if (cleanedPhone.length !== 10) {
        return alert("Enter valid 10 digit number");
      }

      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone: cleanedPhone })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPhone(cleanedPhone);
        setStep("otp");
        alert("OTP Sent Successfully");
      } else {
        alert(data?.message || "Failed to send OTP");
      }
    } catch (error: any) {
      alert("Error sending OTP: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    try {
      if (!otp) return alert("Enter OTP");

      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          otp
        })
      });

      const data = await res.json();

      if (data.success) {
        setStep("location");
      } else {
        alert("Invalid OTP");
      }
    } catch (error: any) {
      alert("Verification failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= COMPLETE LOGIN ================= */
  const completeLogin = async () => {
    if (!location.trim()) return alert("Enter location");

    try {
      const res = await fetch("http://localhost:8000/register-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          location
        })
      });

      const data = await res.json();

      /* ===== Save backend user id ===== */
      localStorage.setItem("user_id", data.user_id);

      /* ===== Create profile ===== */
      const profile: UserProfile = {
        name: "Farmer",
        phone,
        pin: "",
        language: Language.EN,
        type: FarmerType.SMALL,
        location,
        isLoggedIn: true
      };

      /* ===== Persist session ===== */
      localStorage.setItem("cropcare_user", JSON.stringify(profile));

      /* ===== Update global auth state ===== */
      onLogin(profile);

      /* ===== Redirect to dashboard ===== */
      navigate("/home", { replace: true });

    } catch {
      alert("Login failed");
    }
  };

  /* ================= RESTRICTED NAV ================= */
  const handleRestrictedClick = () => {
    alert("Please login to continue");
  };

  /* ================= UI ================= */
return (
  <div className="h-screen w-screen overflow-hidden">
    {/* ================= NAVBAR ================= */}
    <div className="absolute top-0 left-0 w-full z-20 bg-white/90 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
        <h1 className="text-2xl font-bold text-green-700">
          CropCare AI
        </h1>

        {/* Menu */}
        <div className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <button onClick={handleRestrictedClick}>Crop Recommendation</button>
          <button onClick={handleRestrictedClick}>Assistant</button>
          <button onClick={handleRestrictedClick}>Disease Prediction</button>
          <button onClick={handleRestrictedClick}>Market Price</button>
        </div>
      </div>
    </div>

    {/* ================= HERO SECTION ================= */}
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920')"
      }}
    >
      {/* Green overlay */}
      <div className="absolute inset-0 bg-green-900/70"></div>

      <div className="relative z-10 flex h-full items-center max-w-7xl mx-auto px-8">
        {/* LEFT HERO TEXT */}
        <div className="w-1/2 text-white hidden md:block">
          <p className="uppercase tracking-widest mb-4 text-sm">
            Welcome to CropCare AI Agriculture Farming
          </p>

          <h2 className="text-6xl font-bold leading-tight mb-6">
            CropCare AI <br />
            & Agriculture Farming
          </h2>

          <p className="text-lg mb-8 text-gray-200">
            Empowering farmers with AI-based crop monitoring, disease detection,
            and smart farming insights.
          </p>
        </div>

        {/* RIGHT LOGIN BOX */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Farmer Login
            </h3>

            {step === "phone" && (
              <>
                <label className="text-gray-600 text-sm">
                  Phone Number
                </label>

                <div className="flex items-center border rounded-lg px-4 py-3 mt-2 mb-4">
                  <span className="mr-2 font-medium">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full outline-none"
                  />
                </div>

                <div id="recaptcha-container"></div>

                <button
                  onClick={sendOtp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                >
                  Send OTP
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <label className="text-gray-600 text-sm">
                  Enter OTP
                </label>

                <input
                  type="text"
                  placeholder="6 digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 mt-2 mb-4 outline-none"
                />

                <button
                  onClick={verifyOtp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                >
                  Verify OTP
                </button>
              </>
            )}

            {step === "location" && (
              <>
                <label className="text-gray-600 text-sm">
                  Your Location
                </label>

                <input
                  type="text"
                  placeholder="District / State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 mt-2 mb-4 outline-none"
                />

                <button
                  onClick={completeLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
export default Login;