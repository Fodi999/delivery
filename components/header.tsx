/**
 * 🎯 Единый Header для всех страниц
 * 
 * Архитектура:
 * ┌─────────────────────────────────────────┐
 * │  [← Back]  Title/Subtitle  [Controls]   │
 * └─────────────────────────────────────────┘
 * 
 * Props:
 * - showBackButton?: показать кнопку "Назад"
 * - title?: переопределить заголовок
 * - subtitle?: переопределить подзаголовок
 * 
 * Поведение:
 * - Landing page: показывает селектор города
 * - Menu pages: показывает кнопку назад + корзину
 * - Адаптивный: flex-wrap на мобильных
 * - Accessibility: все кнопки с aria-label
 * 
 * Context:
 * - useApp() → language, isDark, city, mounted
 * - Автоматическое сохранение в localStorage
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
import { Moon, Sun, ArrowLeft, ShoppingCart, Truck } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useState } from "react";

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
}

export function Header({ showBackButton = false, title, subtitle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, isDark, setIsDark, city, setCity, mounted } = useApp();
  const count = useCartStore((s) => s.count());
  const [cartOpen, setCartOpen] = useState(false);

  if (!mounted) {
    return (
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark ? 'bg-black/70 border-neutral-800' : 'bg-white/70 border-neutral-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 h-[72px]" />
      </header>
    );
  }

  const t = translations[language];
  const isLandingPage = pathname === "/";

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
      isDark 
        ? 'bg-black/70 border-neutral-800' 
        : 'bg-white/70 border-neutral-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-4 flex-1">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
                className={`rounded-full ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                aria-label="Back to home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}

            {title ? (
              <div>
                <h1 className="text-2xl md:text-3xl font-bold capitalize">
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            ) : (
              <div 
                className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push("/")}
              >
                <h1 className="text-2xl md:text-3xl font-bold">
                  {t.headline}
                </h1>
                {/* Status Badge - только на главной */}
                <div className="flex items-center gap-2 text-xs md:text-sm mt-0.5">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {language === 'pl' ? 'Otwarte do 22:00' : 
                     language === 'en' ? 'Open until 22:00' :
                     language === 'uk' ? 'Відкрито до 22:00' :
                     'Открыто до 22:00'}
                  </span>
                  <span className={isDark ? 'text-neutral-600' : 'text-neutral-400'}>•</span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    <Truck className="w-3.5 h-3.5" />
                    <span>30–45 min</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right section - controls */}
          <div className="flex items-center gap-2">
            {/* City selector - only on landing page */}
            {isLandingPage && (
              <Select value={city} onValueChange={(value) => setCity(value as any)}>
                <SelectTrigger 
                  className={`w-[130px] ${
                    isDark 
                      ? 'bg-neutral-900 border-neutral-800' 
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gdansk">Gdańsk</SelectItem>
                  <SelectItem value="sopot">Sopot</SelectItem>
                  <SelectItem value="gdynia">Gdynia</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Language selector */}
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger 
                className={`w-[100px] ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800' 
                    : 'bg-white border-neutral-200'
                }`}
                aria-label="Select language"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">PL</SelectItem>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="uk">UK</SelectItem>
                <SelectItem value="ru">RU</SelectItem>
              </SelectContent>
            </Select>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className={`rounded-full ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Cart button - only on menu pages */}
            {!isLandingPage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className={`rounded-full relative ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                    {count}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
