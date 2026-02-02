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

  // ✅ Best practice: proper back navigation with fallback
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (!mounted) {
    return (
      <header className={`hidden md:block sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark ? 'bg-black/70 border-neutral-800' : 'bg-white/70 border-neutral-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-4 h-[60px] sm:h-[64px]" />
      </header>
    );
  }

  const t = translations[language];
  const isLandingPage = pathname === "/";

  return (
    <header className={`hidden md:block sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
      isDark 
        ? 'bg-black/70 border-neutral-800' 
        : 'bg-white/70 border-neutral-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">{/* Left section */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className={`rounded-full shrink-0 ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}

            {title ? (
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold capitalize truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="flex flex-col text-left hover:opacity-80 transition-opacity min-w-0"
                onClick={() => router.push("/")}
                aria-label="Go to homepage"
              >
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">
                  {t.headline}
                </h1>
                {/* Status Badge - только на главной, скрыт на маленьких экранах */}
                <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm mt-0.5">
                  <span className={`flex items-center gap-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {t.openUntil}
                  </span>
                  <span className={isDark ? 'text-neutral-600' : 'text-neutral-400'}>•</span>
                  <span className={`flex items-center gap-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {t.deliveryTime}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Right section - controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* City selector - only on landing page, hidden on small screens */}
            {isLandingPage && (
              <div className="hidden sm:block">
                <Select value={city} onValueChange={(value) => setCity(value as any)}>
                  <SelectTrigger 
                    className={`w-[90px] sm:w-[130px] text-xs sm:text-sm ${
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
              </div>
            )}

            {/* Language selector */}
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger 
                className={`w-[70px] sm:w-[100px] text-xs sm:text-sm ${
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
              className={`rounded-full h-9 w-9 sm:h-10 sm:w-10 ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            {/* Cart button - only on menu pages */}
            {!isLandingPage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className={`rounded-full relative h-9 w-9 sm:h-10 sm:w-10 ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] px-0.5 sm:px-1 rounded-full bg-red-500 text-white text-[10px] sm:text-xs flex items-center justify-center font-semibold">
                    {count}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Unified Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
