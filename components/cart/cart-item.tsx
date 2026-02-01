"use client";

import { useCartStore, type CartItem } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Plus, Minus, X } from "lucide-react";
import Image from "next/image";

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const { language, isDark } = useApp();
  const increase = useCartStore((s) => s.increase);
  const decrease = useCartStore((s) => s.decrease);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg transition-colors ${
        isDark ? "bg-neutral-900" : "bg-neutral-50"
      }`}
    >
      {/* Image */}
      <Image
        src={item.image}
        alt={item.name[language]}
        width={80}
        height={80}
        className="rounded-lg object-cover flex-shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2">
            {item.name[language]}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(item.id)}
            className="h-6 w-6 flex-shrink-0 -mt-1 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="font-bold text-lg">{item.price} zł</div>

          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => decrease(item.id)}
              className="h-8 w-8 rounded-full"
            >
              <Minus className="w-4 h-4" />
            </Button>

            <span className="font-semibold min-w-[24px] text-center">
              {item.quantity}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => increase(item.id)}
              className="h-8 w-8 rounded-full"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Subtotal */}
        {item.quantity > 1 && (
          <div
            className={`text-xs mt-1 ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            {item.quantity} × {item.price} zł
          </div>
        )}
      </div>
    </div>
  );
}
