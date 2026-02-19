"use client";

import { useCartStore } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { translations } from "@/lib/translations";
import Image from "next/image";

export function OrderSummary() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const { isDark, language } = useApp();
  const t = translations[language];

  return (
    <div className="glass rounded-[2.5rem] p-8 sm:p-10 border border-white/5 shadow-2xl overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -z-10" />

      <h2 className="text-3xl font-black tracking-tighter mb-8 leading-none">
        {t.checkout.yourOrder}
      </h2>

      <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 group transition-all duration-300"
          >
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
                <span>
                  {item.quantity} × {item.price} PLN
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/10">
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">
            {t.cart.total}
          </span>
          <span className="text-4xl font-black tracking-tighter">
            {total}{" "}
            <span className="text-lg font-medium opacity-60 ml-1">PLN</span>
          </span>
        </div>
      </div>

      {/* Delivery info - Ultra premium look */}
      <div className="mt-10 grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
            🚚
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
              Delivery
            </div>
            <div className="text-sm font-black tracking-tight">
              30-45 min
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
            💳
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
              Payment
            </div>
            <div className="text-sm font-black tracking-tight">
              {language === "ru"
                ? "При получении"
                : "On delivery"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
