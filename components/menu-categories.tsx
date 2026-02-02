/**
 * 🍱 Menu Categories Tabs
 * 
 * Industry standard horizontal category navigation (Uber Eats/Wolt pattern)
 * 
 * Features:
 * - Auto-detects active category from URL
 * - Dark/light theme support
 * - Horizontal scroll on mobile with touch-pan-x
 * - Smooth transitions with scale effects
 * - Emoji icons for visual hierarchy
 * - Multilingual labels
 * 
 * Mobile-first optimizations:
 * - Sticky below mobile/desktop header
 * - Touch-friendly buttons (min 44px)
 * - Proper backdrop blur
 * - Safe area handling
 */

"use client";

import { useApp } from "@/context/app-context";
import { useRouter, usePathname } from "next/navigation";
import type { MenuCategory } from "@/lib/menu-types";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

const categories: { key: MenuCategory; emoji: string }[] = [
  { key: "sushi", emoji: "🍣" },
  { key: "wok", emoji: "🥢" },
  { key: "ramen", emoji: "🍜" },
];

export function MenuCategories() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, language } = useApp();
  const t = translations[language];

  return (
    <div 
      className="sticky top-[56px] md:top-[85px] z-40 backdrop-blur-xl border-b transition-colors py-3 md:py-4" 
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: isDark ? 'rgb(38, 38, 38)' : 'rgb(229, 229, 229)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Horizontal scrollable tabs */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide touch-pan-x -mx-1 px-1">
          {categories.map((cat) => {
            const active = pathname === `/menu/${cat.key}`;

            return (
              <button
                key={cat.key}
                onClick={() => router.push(`/menu/${cat.key}`)}
                className={cn(
                  "flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px]",
                  "hover:scale-105 active:scale-95",
                  active
                    ? isDark
                      ? "bg-white text-black shadow-xl"
                      : "bg-black text-white shadow-xl"
                    : isDark
                    ? "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80"
                    : "bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/80"
                )}
                aria-label={t.categories[cat.key].name}
                aria-current={active ? "page" : undefined}
              >
                <span className="font-semibold">{t.categories[cat.key].name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
