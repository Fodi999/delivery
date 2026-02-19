"use client";

import { useCartStore, type CartItem } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { Plus, Minus, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const { language, isDark } = useApp();
  const increase = useCartStore((s) => s.increase);
  const decrease = useCartStore((s) => s.decrease);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4 group animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Small image with 2026 radius */}
      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm border border-neutral-100/5">
        <Image
          src={item.image}
          alt={item.name[language]}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Info - takes full width */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-black text-sm sm:text-base leading-tight tracking-tight line-clamp-1">
              {item.name[language]}
            </h4>
            <span className="text-primary font-black text-sm tracking-tighter">
              {item.price} <span className="text-[10px] opacity-60">PLN</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-destructive/10 hover:text-destructive active:scale-90"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-neutral-200/5">
            <button
              type="button"
              onClick={() => decrease(item.id)}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-all hover:bg-background active:scale-90 shadow-sm"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="font-black text-sm min-w-[32px] text-center tracking-tighter">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => increase(item.id)}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-all hover:bg-background active:scale-90 shadow-sm"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30 block">
              Subtotal
            </span>
            <span className="font-black text-sm tracking-tighter">
              {(item.price * item.quantity).toFixed(2)}{" "}
              <span className="text-[10px] opacity-60">PLN</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
