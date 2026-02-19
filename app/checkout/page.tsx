"use client";

import { Header } from "@/components/header";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/core/order-summary";
import { useApp } from "@/context/app-context";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CheckoutPage() {
  const { isDark, language } = useApp();
  const items = useCartStore((s) => s.items);
  const router = useRouter();

  // Защита: если корзина пустая → назад в меню
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/");
    }
  }, [items, router]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`min-h-screen transition-all duration-700 ${
        isDark ? "bg-[#0a0a0c] text-neutral-100" : "bg-[#fafafb] text-neutral-900"
      }`}
    >
      <Header
        showBackButton
        title={
          language === "ru"
            ? "Оформление заказа"
            : language === "pl"
            ? "Zamówienie"
            : "Checkout"
        }
      />

      {/* 2026 Progress indicator - Ultra clean */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        <div className="flex items-center gap-4 max-w-md">
          <div className="flex-1 h-1.5 bg-primary rounded-full shadow-lg shadow-primary/20" />
          <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-primary/40 rounded-full" />
          </div>
          <div className="flex-1 h-1.5 bg-muted/20 rounded-full" />
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-dark border border-white/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-xl animate-in fade-in slide-in-from-left-4 duration-1000">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
            {language === "ru"
              ? "Последний шаг для совершенства"
              : "The final refinement"}
          </div>
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
            {language === "ru" ? "Завершение заказа" : "Complete order"}
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 lg:gap-32 items-start pb-48">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <CheckoutForm />
        </div>
        <div className="lg:sticky lg:top-36 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
          <OrderSummary />
        </div>
      </main>
    </div>
  );
}
