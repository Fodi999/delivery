/**
 * 📱 Mobile Header Component
 * 
 * Minimal header for mobile devices (<768px)
 * - Back button (with proper router.back())
 * - Page title
 * - Cart button (on menu pages)
 * 
 * Desktop: Hidden (Header component used instead)
 * Mobile: Minimal, fixed top bar
 * 
 * Industry standard: Uber Eats, Bolt, Glovo style
 */

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { translations } from "@/lib/translations";

interface MobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function MobileHeader({ showBackButton = false, title }: MobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, isDark, mounted } = useApp();
  const count = useCartStore((s) => s.count());

  if (!mounted) {
    return (
      <header className={`md:hidden sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDark ? 'bg-black/80 border-neutral-800' : 'bg-white/80 border-neutral-200'
      }`}>
        <div className="h-14" />
      </header>
    );
  }

  const t = translations[language];
  const isLandingPage = pathname === "/";

  const handleBack = () => {
    // ✅ Best practice: check if there's history, fallback to home
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <header className={`md:hidden sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
      isDark 
        ? 'bg-black/80 border-neutral-800' 
        : 'bg-white/80 border-neutral-200'
    }`}>
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Back button or empty space */}
        <div className="w-10">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className={`rounded-full ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'}`}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center">
          {title ? (
            <h1 className="text-lg font-bold truncate px-2">
              {title}
            </h1>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-lg font-bold truncate px-2 hover:opacity-70 transition-opacity"
              aria-label="Go to homepage"
            >
              {t.headline}
            </button>
          )}
        </div>

        {/* Right: Cart button (only on menu pages) */}
        <div className="w-10 flex justify-end">
          {!isLandingPage && count > 0 && (
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${
              isDark ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                  {count}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
