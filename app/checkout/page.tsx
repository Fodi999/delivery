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
      className={`min-h-screen ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Header showBackButton title="Checkout" />

      {/* Progress indicator */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-4">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isDark
              ? "bg-green-500/20 text-green-400"
              : "bg-green-100 text-green-700"
          }`}
        >
          <span>✓</span>
          <span>
            {language === "pl"
              ? "Ostatni krok"
              : language === "ru"
              ? "Последний шаг"
              : language === "uk"
              ? "Останній крок"
              : "Final step"}
          </span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <CheckoutForm />
        <OrderSummary />
      </main>
    </div>
  );
}
