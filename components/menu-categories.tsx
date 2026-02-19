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
      className="sticky top-[56px] md:top-[85px] z-40 glass border-b border-white/5 transition-all duration-500 py-3 md:py-4"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* Horizontal scrollable tabs */}
        <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide touch-pan-x -mx-1 px-1">
          {categories.map((cat) => {
            const active = pathname === `/menu/${cat.key}`;

            return (
              <button
                key={cat.key}
                onClick={() => router.push(`/menu/${cat.key}`)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-black tracking-tight transition-all duration-500 whitespace-nowrap flex-shrink-0 min-h-[48px]",
                  "hover:scale-105 active:scale-95 shadow-sm",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/80 backdrop-blur-md"
                )}
                aria-label={t.categories[cat.key].name}
                aria-current={active ? "page" : undefined}
              >
                <span className="opacity-70 text-lg">{cat.emoji}</span>
                <span>{t.categories[cat.key].name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
