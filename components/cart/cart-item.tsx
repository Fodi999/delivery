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
    // ✅ STEP 4: Compact receipt-style layout
    <div className="flex gap-3 py-2">
      {/* Small image */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name[language]}
          fill
          sizes="56px"
          className="rounded-lg object-cover"
        />
      </div>

      {/* Info - takes full width */}
      <div className="flex-1 min-w-0">
        {/* Name and price on same line */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm line-clamp-1 flex-1">
            {item.name[language]}
          </h4>
          <span className="font-bold text-sm whitespace-nowrap">
            {item.price} zł
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* ✅ Perfect circular buttons with visible borders */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decrease(item.id)}
              className={`h-8 w-8 aspect-square rounded-full flex items-center justify-center leading-none touch-manipulation transition-all border ${
                isDark 
                  ? "border-neutral-600 hover:bg-neutral-800 active:bg-neutral-700" 
                  : "border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200"
              }`}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4 pointer-events-none" />
            </button>

            <span className="font-medium text-sm min-w-[24px] text-center">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => increase(item.id)}
              className={`h-8 w-8 aspect-square rounded-full flex items-center justify-center leading-none touch-manipulation transition-all border ${
                isDark 
                  ? "border-neutral-600 hover:bg-neutral-800 active:bg-neutral-700" 
                  : "border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200"
              }`}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4 pointer-events-none" />
            </button>
          </div>

          {/* Remove button - circular with border */}
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className={`h-8 w-8 aspect-square rounded-full flex items-center justify-center leading-none touch-manipulation transition-all border ${
              isDark
                ? "border-neutral-600 text-muted-foreground hover:bg-red-950 hover:border-red-800 hover:text-red-400 active:bg-red-900"
                : "border-neutral-300 text-muted-foreground hover:bg-red-50 hover:border-red-300 hover:text-red-600 active:bg-red-100"
            }`}
            aria-label="Remove item"
          >
            <X className="h-4 w-4 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}
