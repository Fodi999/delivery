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
    <div className="min-h-screen bg-background pb-[calc(64px+env(safe-area-inset-bottom)+16px)] md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">
            {language === 'pl' ? 'Ustawienia' :
             language === 'en' ? 'Settings' :
             language === 'uk' ? 'Налаштування' :
             'Настройки'}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* App Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle>FodiFood</CardTitle>
                <CardDescription>
                  {language === 'pl' ? 'Zarządzaj ustawieniami aplikacji' :
                   language === 'en' ? 'Manage app settings' :
                   language === 'uk' ? 'Керуйте налаштуваннями додатку' :
                   'Управление настройками приложения'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Location & Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'pl' ? 'Podstawowe ustawienia' :
               language === 'en' ? 'Basic settings' :
               language === 'uk' ? 'Основні налаштування' :
               'Основные настройки'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* City Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {language === 'pl' ? 'Miasto' :
                 language === 'en' ? 'City' :
                 language === 'uk' ? 'Місто' :
                 'Город'}
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {language === 'pl' ? 'Język' :
                 language === 'en' ? 'Language' :
                 language === 'uk' ? 'Мова' :
                 'Язык'}
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {language === 'pl' ? 'Ciemny motyw' :
                 language === 'en' ? 'Dark theme' :
                 language === 'uk' ? 'Темна тема' :
                 'Темная тема'}
              </label>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="h-12 w-12 rounded-full"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'pl' ? 'Preferencje' :
               language === 'en' ? 'Preferences' :
               language === 'uk' ? 'Налаштування' :
               'Настройки'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-between h-12" disabled>
              <span className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                {language === 'pl' ? 'Powiadomienia' :
                 language === 'en' ? 'Notifications' :
                 language === 'uk' ? 'Сповіщення' :
                 'Уведомления'}
              </span>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </Button>

            <Button variant="ghost" className="w-full justify-between h-12" disabled>
              <span className="flex items-center gap-3">
                <Info className="w-5 h-5" />
                {language === 'pl' ? 'O aplikacji' :
                 language === 'en' ? 'About app' :
                 language === 'uk' ? 'Про додаток' :
                 'О приложении'}
              </span>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pt-4 pb-4">
          <p className="font-medium">FodiFood Delivery v1.0.0</p>
          <p className="mt-2">
            {language === 'pl' ? 'Wykonane z ❤️ w Gdańsku' :
             language === 'en' ? 'Made with ❤️ in Gdańsk' :
             language === 'uk' ? 'Зроблено з ❤️ в Гданську' :
             'Сделано с ❤️ в Гданьске'}
          </p>
        </div>
      </div>
    </div>
  );
}
