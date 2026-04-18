import React, { createContext, useContext, useEffect, useState } from "react";
import { Language } from "../types";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const saved = localStorage.getItem("cropcare_user");
  const user = saved ? JSON.parse(saved) : null;

  const [language, setLanguageState] = useState<Language>(
    user?.language || Language.EN
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);

    if (user) {
      localStorage.setItem(
        "cropcare_user",
        JSON.stringify({ ...user, language: lang })
      );
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
};