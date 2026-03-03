"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { useDeliveryStore } from "@/store/delivery-store";
import { useEffect, Suspense } from "react";

function OrderSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isDark, language } = useApp();
  const deliveryInfo = useDeliveryStore((s) => s.deliveryInfo);
  const orderId = params.get("orderId");

  useEffect(() => {
    if (!orderId) router.push("/");
  }, [orderId, router]);

  if (!orderId) return null;

  // Short display ID — last 6 chars
  const shortId = orderId.slice(-6).toUpperCase();

  const deliveryTimeText = deliveryInfo?.totalTime
    ? `${deliveryInfo.totalTime} min`
    : language === "ru" ? "30–45 мин" : language === "pl" ? "30–45 min" : "30–45 min";

  const t = {
    pl: { title: "Zamówienie przyjęte!", sub: "Już się krząta w kuchni", orderLabel: "Numer zamówienia", delivery: "Czas dostawy", payment: "Płatność", paymentVal: "Przy odbiorze", back: "Wróć do menu", next: "Śledź zamówienie" },
    ru: { title: "Заказ принят!", sub: "Уже готовится на кухне", orderLabel: "Номер заказа", delivery: "Время доставки", payment: "Оплата", paymentVal: "При получении", back: "В меню", next: "Следить за заказом" },
    uk: { title: "Замовлення прийнято!", sub: "Вже готується на кухні", orderLabel: "Номер замовлення", delivery: "Час доставки", payment: "Оплата", paymentVal: "При отриманні", back: "До меню", next: "Стежити за замовленням" },
    en: { title: "Order accepted!", sub: "Already cooking in the kitchen", orderLabel: "Order number", delivery: "Delivery time", payment: "Payment", paymentVal: "Cash on delivery", back: "Back to menu", next: "Track order" },
  }[language as "pl" | "ru" | "uk" | "en"] ?? { title: "Order accepted!", sub: "Already cooking", orderLabel: "Order", delivery: "Delivery", payment: "Payment", paymentVal: "Cash", back: "Menu", next: "Track" };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 transition-colors duration-700 ${isDark ? "bg-[#0a0a0c] text-neutral-100" : "bg-[#fafafb] text-neutral-900"}`}>
      <div className={`max-w-lg w-full rounded-[3rem] p-10 sm:p-14 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700 ${isDark ? "bg-white/[0.04] border border-white/8" : "bg-white border border-black/6"}`}>

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 blur-[100px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -z-10" />

        {/* Success icon */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
            <div className="relative w-20 h-20 rounded-[1.75rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 rotate-12 hover:rotate-0 transition-transform duration-500 cursor-default">
              <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-2">{t.title}</h1>
          <p className="text-sm font-medium opacity-50">{t.sub}</p>
        </div>

        {/* Order number */}
        <div className="text-center mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">{t.orderLabel}</p>
          <div className={`inline-flex items-center gap-3 px-8 py-3 rounded-full border ${isDark ? "bg-white/5 border-white/10" : "bg-black/3 border-black/8"}`}>
            <span className="text-xl font-black tracking-[0.3em] font-mono text-primary">#{shortId}</span>
          </div>
        </div>

        {/* Info cards */}
        <div className={`grid grid-cols-2 gap-3 mb-10`}>
          <div className={`p-5 rounded-[1.75rem] border text-left ${isDark ? "bg-white/4 border-white/6" : "bg-black/3 border-black/5"}`}>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{t.delivery}</p>
            <p className="font-black text-sm tracking-tight">{deliveryTimeText}</p>
          </div>
          <div className={`p-5 rounded-[1.75rem] border text-left ${isDark ? "bg-white/4 border-white/6" : "bg-black/3 border-black/5"}`}>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{t.payment}</p>
            <p className="font-black text-sm tracking-tight">{t.paymentVal}</p>
          </div>
        </div>

        {/* Status bar — visual order tracking placeholder */}
        <div className={`rounded-[1.75rem] border p-5 mb-8 ${isDark ? "bg-white/3 border-white/6" : "bg-black/2 border-black/5"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
              {language === "ru" ? "Статус" : language === "pl" ? "Status" : "Status"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                {language === "ru" ? "Принят" : language === "pl" ? "Przyjęty" : "Accepted"}
              </span>
            </span>
          </div>
          {/* 4-step progress */}
          <div className="flex items-center gap-1">
            {["", "", "", ""].map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full ${i === 0 ? "bg-primary" : isDark ? "bg-white/8" : "bg-black/8"}`} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {(language === "ru"
              ? ["Принят", "Готовится", "В пути", "Доставлен"]
              : language === "pl"
              ? ["Przyjęty", "W kuchni", "W drodze", "Dostarczony"]
              : ["Accepted", "Cooking", "On way", "Delivered"]
            ).map((label, i) => (
              <span key={i} className={`text-[8px] font-black uppercase tracking-wider ${i === 0 ? "text-primary" : "opacity-25"}`}>{label}</span>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full h-14 rounded-[1.5rem] bg-primary text-primary-foreground font-black text-sm tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
