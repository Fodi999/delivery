/**
 * ⚙️ Settings Page
 * 
 * Industry standard mobile-first approach:
 * - City selector
 * - Language selector
 * - Theme toggle
 * - App preferences
 * 
 * Mobile: Full page with settings in mobile nav
 * Desktop: Same layout (consistent UX)
 */

"use client";

import { useApp, type City } from "@/context/app-context";
import { translations, type Language } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, MapPin, Globe, Settings2, Bell, Info, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { language, setLanguage, isDark, setIsDark, city, setCity, mounted } = useApp();

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const t = translations[language];
  
  const cities: { value: City; label: Record<Language, string> }[] = [
    { value: 'gdansk', label: { pl: 'Gdańsk', en: 'Gdansk', ru: 'Гданьск', uk: 'Гданськ' } },
    { value: 'sopot', label: { pl: 'Sopot', en: 'Sopot', ru: 'Сопот', uk: 'Сопот' } },
    { value: 'gdynia', label: { pl: 'Gdynia', en: 'Gdynia', ru: 'Гдыня', uk: 'Гдиня' } },
  ];

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'pl', label: 'Polski', flag: '🇵🇱' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
    { value: 'uk', label: 'Українська', flag: '🇺🇦' },
  ];

  return (
    <div className={`min-h-screen transition-all duration-700 pb-[calc(100px+env(safe-area-inset-bottom))] md:pb-16 ${
      isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#fafafb] text-black'
    }`}>
      {/* 2026 Header */}
      <div className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter leading-none">
            {language === 'pl' ? 'Ustawienia' :
             language === 'en' ? 'Settings' :
             language === 'uk' ? 'Налаштування' :
             'Настройки'}
          </h1>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary stroke-[2.5]" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* App Info - Premium Badge style */}
        <div className="relative group overflow-hidden rounded-[2.5rem] p-8 glass border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
          <div className="flex items-center gap-6 relative">
            <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 transform -rotate-12 transition-transform group-hover:rotate-0 duration-500">
               <span className="text-4xl font-black text-primary-foreground tracking-tighter">FF</span>
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tighter mb-2">FodiFood Premium</h2>
              <p className="text-sm font-black uppercase tracking-widest opacity-40">
                {language === 'ru' ? 'Статус: Версия 2026' : 'Status: 2026 Edition'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Settings - Glass Cards */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 ml-4 mb-4">
            {language === 'ru' ? 'Персонализация' : 'Personalization'}
          </h3>
          
          <div className="glass rounded-[2.5rem] border border-white/5 p-8 sm:p-10 space-y-10">
            {/* City Selector */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-primary" />
                {language === 'ru' ? 'Ваш город' : 'Current City'}
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full h-16 rounded-2xl bg-muted/30 border-none px-6 text-lg font-bold hover:bg-muted/50 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 glass">
                  {cities.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="rounded-xl font-bold p-4">
                      {c.label[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Selector */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <Globe className="w-3 h-3 text-primary" />
                {language === 'ru' ? 'Язык интерфейса' : 'App Language'}
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full h-16 rounded-2xl bg-muted/30 border-none px-6 text-lg font-bold hover:bg-muted/50 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 glass">
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value} className="rounded-xl font-bold p-4">
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme Toggle Button */}
            <div className="pt-4 border-t border-white/5">
               <button
                  type="button"
                  onClick={() => setIsDark(!isDark)}
                  className="w-full h-16 rounded-2xl bg-muted/30 hover:bg-muted/50 p-6 flex items-center justify-between transition-all duration-300"
               >
                  <div className="flex items-center gap-4">
                    {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                    <span className="text-lg font-bold">
                       {isDark ? (language === 'ru' ? 'Светлая тема' : 'Light Mode') : (language === 'ru' ? 'Темная тема' : 'Dark Mode')}
                    </span>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors duration-500 ${isDark ? 'bg-primary' : 'bg-neutral-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-sm ${isDark ? 'left-7' : 'left-1'}`} />
                  </div>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
