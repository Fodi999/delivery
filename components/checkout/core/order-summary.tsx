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
    <div
      className={`rounded-xl p-6 ${
        isDark ? "bg-neutral-900" : "bg-neutral-50"
      }`}
    >
      <h2 className="text-xl font-bold mb-6">{t.checkout.yourOrder}</h2>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex gap-3 p-3 rounded-lg ${
              isDark ? "bg-neutral-800" : "bg-white"
            }`}
          >
            <Image
              src={item.image}
              alt={item.name[language]}
              width={60}
              height={60}
              className="rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1">
                {item.name[language]}
              </h4>
              <div className="flex items-center justify-between mt-1">
                <span
                  className={`text-xs ${
                    isDark ? "text-neutral-400" : "text-neutral-600"
                  }`}
                >
                  {item.quantity} × {item.price} zł
                </span>
                <span className="font-bold text-sm">
                  {item.price * item.quantity} zł
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`flex justify-between items-center font-bold text-lg border-t pt-4 ${
          isDark ? "border-neutral-700" : "border-neutral-300"
        }`}
      >
        <span>{t.cart.total}</span>
        <span className="text-2xl">{total} zł</span>
      </div>

      {/* Delivery info */}
      <div
        className={`mt-6 pt-4 border-t text-sm ${
          isDark
            ? "border-neutral-700 text-neutral-400"
            : "border-neutral-300 text-neutral-600"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span>🚚</span>
          <span>
            {language === "pl"
              ? "Dostawa 30-45 min"
              : language === "ru"
              ? "Доставка 30-45 мин"
              : language === "uk"
              ? "Доставка 30-45 хв"
              : "Delivery 30-45 min"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>💳</span>
          <span>
            {language === "pl"
              ? "Płatność gotówką przy odbiorze"
              : language === "ru"
              ? "Оплата наличными при получении"
              : language === "uk"
              ? "Оплата готівкою при отриманні"
              : "Cash on delivery"}
          </span>
        </div>
      </div>
    </div>
  );
}
