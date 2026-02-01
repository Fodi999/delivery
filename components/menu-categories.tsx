/**
 * 🍱 Menu Categories Tabs
 * 
 * Горизонтальные табы для переключения между категориями меню.
 * Используется в стиле Wolt / Uber Eats.
 * 
 * Особенности:
 * - Автоматически определяет активную категорию из URL
 * - Поддерживает dark/light theme
 * - Горизонтальный скролл на мобильных
 * - Smooth transitions
 * 
 * Использование:
 * ```tsx
 * <MenuCategories />
 * ```
 */

"use client";

import { useApp } from "@/context/app-context";
import { useRouter, usePathname } from "next/navigation";
import type { MenuCategory } from "@/lib/menu-types";
import { cn } from "@/lib/utils";

const categories: { key: MenuCategory; label: string }[] = [
  { key: "sushi", label: "Sushi" },
  { key: "wok", label: "Wok" },
  { key: "ramen", label: "Ramen" },
];

export function MenuCategories() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useApp();

  return (
    <div className="sticky top-[89px] z-40 backdrop-blur-xl border-b transition-colors pt-3 pb-3" 
      style={{
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        borderColor: isDark ? 'rgb(38, 38, 38)' : 'rgb(229, 229, 229)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => {
            const active = pathname === `/menu/${cat.key}`;

            return (
              <button
                key={cat.key}
                onClick={() => router.push(`/menu/${cat.key}`)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  "hover:scale-105 active:scale-95",
                  active
                    ? isDark
                      ? "bg-white text-black shadow-lg"
                      : "bg-black text-white shadow-lg"
                    : isDark
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
