"use client";

import { useCartStore } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { useDeliveryStore } from "@/store/delivery-store";
import { translations } from "@/lib/translations";
import { formatDeliveryTime } from "@/lib/delivery-calculator";
import Image from "next/image";

export function OrderSummary() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const { isDark, language } = useApp();
  const t = translations[language];
  const deliveryInfo = useDeliveryStore((s) => s.deliveryInfo);

  const deliveryPrice = deliveryInfo?.allowed
    ? deliveryInfo.isFree
      ? (language === "ru" ? "Бесплатно" : language === "pl" ? "Darmowa" : "Free")
      : `${deliveryInfo.price} PLN`
    : "—";

  const deliveryTime = deliveryInfo?.totalTime
    ? formatDeliveryTime(deliveryInfo.totalTime)
    : (language === "ru" ? "После выбора адреса" : language === "pl" ? "Po wyborze adresu" : "After address");

  const grandTotal = total + (deliveryInfo?.allowed && !deliveryInfo.isFree ? (deliveryInfo.price ?? 0) : 0);

  return (
    <div className="glass rounded-[2.5rem] p-8 sm:p-10 border border-white/5 shadow-2xl overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -z-10" />

      <h2 className="text-3xl font-black tracking-tighter mb-8 leading-none">
        {t.checkout.yourOrder}
      </h2>

      <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 group transition-all duration-300">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-white/5">
              <Image
                src={item.image}
                alt={item.name[language]}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-black text-sm sm:text-base tracking-tight line-clamp-1">
                  {item.name[language]}
                </h4>
                <span className="font-black text-sm tracking-tighter whitespace-nowrap">
                  {item.price * item.quantity}{" "}
                  <span className="text-[10px] opacity-60">PLN</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 opacity-50 text-[10px] font-black uppercase tracking-widest">
                <span>{item.quantity} × {item.price} PLN</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal + Delivery + Grand Total */}
      <div className={`pt-6 border-t ${isDark ? "border-white/10" : "border-black/8"} space-y-3`}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            {language === "ru" ? "Товары" : language === "pl" ? "Produkty" : "Subtotal"}
          </span>
          <span className="font-black text-sm">{total} PLN</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            {language === "ru" ? "Доставка" : language === "pl" ? "Dostawa" : "Delivery"}
          </span>
          <span className={`font-black text-sm ${deliveryInfo?.isFree ? "text-green-500" : ""}`}>
            {deliveryPrice}
          </span>
        </div>
        <div className={`flex justify-between items-end pt-3 border-t ${isDark ? "border-white/10" : "border-black/8"}`}>
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">
            {t.cart.total}
          </span>
          <span className="text-4xl font-black tracking-tighter">
            {grandTotal}{" "}
            <span className="text-lg font-medium opacity-60 ml-1">PLN</span>
          </span>
        </div>
      </div>

      {/* Delivery + Payment info */}
      <div className="mt-8 grid grid-cols-1 gap-3">
        <div className={`flex items-center gap-4 p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-black/3 border-black/5"}`}>
          {/* Scooter SVG */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
              {language === "ru" ? "Время доставки" : language === "pl" ? "Czas dostawy" : "Delivery time"}
            </div>
            <div className="text-sm font-black tracking-tight">{deliveryTime}</div>
          </div>
        </div>
        <div className={`flex items-center gap-4 p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-black/3 border-black/5"}`}>
          {/* Card SVG */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
              {language === "ru" ? "Оплата" : language === "pl" ? "Płatność" : "Payment"}
            </div>
            <div className="text-sm font-black tracking-tight">
              {language === "ru" ? "При получении" : language === "pl" ? "Przy odbiorze" : "On delivery"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

