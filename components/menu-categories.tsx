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
import { Fish, Flame, Soup } from "lucide-react";

const categories: { key: MenuCategory; Icon: React.ElementType }[] = [
  { key: "sushi", Icon: Fish },
  { key: "wok",   Icon: Flame },
  { key: "ramen", Icon: Soup },
];

export function MenuCategories() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useApp();
  const t = translations[language];

  return (
    <div className="sticky top-[56px] md:top-[85px] z-40 glass border-b border-white/5 transition-all duration-500 py-2 md:py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        {/* overflow на обёртке, паддинги на скролл-контейнере чтобы тени не срезались */}
        <div className="overflow-x-auto scrollbar-hide touch-pan-x">
          <div className="flex gap-2 px-1 pb-1 pt-0.5">
          {categories.map(({ key, Icon }) => {
            const active = pathname === `/menu/${key}`;

            return (
              <button
                key={key}
                onClick={() => router.push(`/menu/${key}`)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 whitespace-nowrap flex-shrink-0 min-h-[36px]",
                  "hover:scale-105 active:scale-95",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/80 backdrop-blur-md"
                )}
                aria-label={t.categories[key].name}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                <span>{t.categories[key].name}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
