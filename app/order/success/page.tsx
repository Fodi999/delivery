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
      className={`min-h-screen flex flex-col items-center justify-center text-center px-6 ${
        isDark ? "bg-neutral-950" : "bg-white"
      }`}
    >
      <div
        className={`max-w-md w-full rounded-2xl p-8 ${
          isDark ? "bg-neutral-900" : "bg-neutral-50"
        }`}
      >
        {/* Success icon */}
        <div className="mb-6">
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              isDark ? "bg-green-900/30" : "bg-green-100"
            }`}
          >
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>

        {/* Order number */}
        <p
          className={`text-lg mb-4 ${
            isDark ? "text-neutral-300" : "text-neutral-700"
          }`}
        >
          {t.orderNumber} <span className="font-mono font-bold">{orderId}</span>
        </p>

        {/* Delivery info */}
        <div
          className={`mb-6 p-4 rounded-lg ${
            isDark ? "bg-neutral-800" : "bg-white"
          }`}
        >
          <p
            className={`text-sm mb-1 ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            {t.deliveryTime}
          </p>
          <p
            className={`text-sm ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            {t.paymentInfo}
          </p>
        </div>

        {/* Back button */}
        <Button
          onClick={() => router.push("/")}
          className={`w-full text-base font-semibold ${
            isDark
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-black text-white hover:bg-neutral-800"
          }`}
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
