/**
 * 🌍 Global App Context
 * 
 * Управляет глобальным состоянием приложения:
 * - Theme (dark/light)
 * - Language (pl/en/uk/ru)
 * - City (gdansk/sopot/gdynia)
 * - Mounted state (hydration protection)
 * 
 * Автоматически сохраняет в localStorage при изменениях.
 * 
 * Использование:
 * ```tsx
 * const { language, isDark, city, mounted } = useApp();
 * ```
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Language } from "@/lib/translations";

export type City = "gdansk" | "sopot" | "gdynia";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  city: City;
  setCity: (city: City) => void;
  mounted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [isDark, setIsDark] = useState(true);
  const [city, setCity] = useState<City>("gdansk");
  const [mounted, setMounted] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedLanguage = localStorage.getItem("language");
    const savedCity = localStorage.getItem("city");

    if (savedTheme === "light") {
      setIsDark(false);
    }
    if (savedLanguage && ["pl", "en", "uk", "ru"].includes(savedLanguage)) {
      setLanguage(savedLanguage as Language);
    }
    if (savedCity && ["gdansk", "sopot", "gdynia"].includes(savedCity)) {
      setCity(savedCity as City);
    }

    setMounted(true);
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    }
  }, [isDark, mounted]);

  // Save language to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("language", language);
    }
  }, [language, mounted]);

  // Save city to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("city", city);
    }
  }, [city, mounted]);

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isDark,
        setIsDark,
        city,
        setCity,
        mounted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
