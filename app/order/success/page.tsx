"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { useEffect, Suspense } from "react";

function OrderSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isDark, language } = useApp();
  const orderId = params.get("orderId");

  // Если нет orderId, редирект на главную
  useEffect(() => {
    if (!orderId) {
      router.push("/");
    }
  }, [orderId, router]);

  if (!orderId) return null;

  const translations = {
    pl: {
      title: "Zamówienie przyjęte",
      orderNumber: "Zamówienie №",
      deliveryTime: "Czas dostawy: 30–45 min",
      paymentInfo: "Płatność przy odbiorze",
      backButton: "Wróć do menu",
    },
    ru: {
      title: "Заказ принят",
      orderNumber: "Заказ №",
      deliveryTime: "Время доставки: 30–45 мин",
      paymentInfo: "Оплата при получении",
      backButton: "Вернуться в меню",
    },
    uk: {
      title: "Замовлення прийнято",
      orderNumber: "Замовлення №",
      deliveryTime: "Час доставки: 30–45 хв",
      paymentInfo: "Оплата при отриманні",
      backButton: "Повернутися до меню",
    },
    en: {
      title: "Order accepted",
      orderNumber: "Order №",
      deliveryTime: "Delivery time: 30–45 min",
      paymentInfo: "Cash on delivery",
      backButton: "Back to menu",
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  return (
    <div
      className={`min-h-[100dvh] flex flex-col items-center justify-center text-center px-6 transition-all duration-1000 ${
        isDark ? "bg-[#0a0a0c] text-neutral-100" : "bg-[#fafafb] text-neutral-900"
      }`}
    >
      <div
        className="max-w-xl w-full glass rounded-[3rem] p-12 sm:p-20 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -z-10" />

        {/* Success icon - Ultra modern */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div
            className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center rotate-12 transition-transform hover:rotate-0 duration-500 bg-primary shadow-2xl shadow-primary/40`}
          >
            <svg
              className="w-12 h-12 text-primary-foreground stroke-[3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 leading-none">{t.title}</h1>

        {/* Order number */}
        <div className="mb-12">
          <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-2">
            {t.orderNumber}
          </p>
          <div className="inline-block px-8 py-3 rounded-full bg-white/5 border border-white/10">
            <span className="text-2xl font-black tracking-widest font-mono text-primary">
              {orderId}
            </span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          <div className="p-6 rounded-[2rem] bg-muted/40 border border-white/5 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-2">Delivery</span>
            <p className="font-black text-sm tracking-tight">{t.deliveryTime}</p>
          </div>
          <div className="p-6 rounded-[2rem] bg-muted/40 border border-white/5 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-2">Payment</span>
            <p className="font-black text-sm tracking-tight">{t.paymentInfo}</p>
          </div>
        </div>

        {/* Back button */}
        <Button
          onClick={() => router.push("/")}
          size="lg"
          className="w-full h-16 text-lg font-black tracking-tight rounded-[1.5rem] bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
        >
          {t.backButton}
        </Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
