"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { translations } from "@/lib/translations";

/**
 * 🔥 MOBILE CTA BUTTON - Industry Standard Pattern
 * 
 * Sticky floating button above bottom navigation (Uber Eats/Bolt/Glovo pattern)
 * - Only visible on mobile (md:hidden)
 * - Fixed position above bottom nav (64px + safe-area)
 * - Full width with horizontal padding
 * - Shadow for depth perception
 */
export function MobileCTA() {
  const router = useRouter();
  const { language, isDark } = useApp();
  const t = translations[language];

  return (
    <div 
      className="md:hidden fixed left-0 right-0 z-40 px-6 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500"
      style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
    >
      <Button
        onClick={() => router.push('/menu')}
        size="lg"
        className="w-full rounded-full h-16 text-lg font-black tracking-tight shadow-2xl bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all duration-300 border-4 border-background/20"
        aria-label={t.orderNow}
      >
        {t.orderNow}
      </Button>
    </div>
  );
}
