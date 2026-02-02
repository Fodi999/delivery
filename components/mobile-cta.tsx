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
      className="md:hidden fixed left-0 right-0 z-40 px-4 pb-4"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
    >
      <Button
        onClick={() => router.push('/menu')}
        size="lg"
        className={`w-full rounded-full h-14 text-lg font-semibold shadow-2xl ${
          isDark 
            ? 'bg-white text-black hover:bg-neutral-200' 
            : 'bg-black text-white hover:bg-neutral-800'
        }`}
        aria-label={t.orderNow}
      >
        {t.orderNow}
      </Button>
    </div>
  );
}
