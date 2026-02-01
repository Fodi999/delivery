"use client";

import { useCartStore } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { translations } from "@/lib/translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItemComponent } from "./cart-item";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { language, isDark } = useApp();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);
  const t = translations[language];
  const router = useRouter();

  const isEmpty = items.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[500px] max-h-[90vh] flex flex-col ${
          isDark ? "bg-neutral-950 text-white" : "bg-white text-black"
        }`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t.cart.title}
          </DialogTitle>
          <DialogDescription>
            {isEmpty 
              ? t.cart.emptyHint
              : `${items.length} ${items.length === 1 ? 'item' : 'items'}`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Cart content */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isEmpty ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? "bg-neutral-900" : "bg-neutral-100"
                }`}
              >
                <ShoppingCart className="w-10 h-10 opacity-40" />
              </div>
              <p
                className={`text-lg font-medium mb-2 ${
                  isDark ? "text-neutral-300" : "text-neutral-700"
                }`}
              >
                {t.cart.emptyTitle}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-neutral-500" : "text-neutral-500"
                }`}
              >
                {t.cart.emptyHint}
              </p>
            </div>
          ) : (
            // Items list
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemComponent key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer with total and checkout */}
        {!isEmpty && (
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            {/* Total */}
            <div
              className={`flex items-center justify-between py-4 px-4 rounded-lg ${
                isDark ? "bg-neutral-900" : "bg-neutral-50"
              }`}
            >
              <span className="text-lg font-semibold">
                {t.cart.total}
              </span>
              <span className="text-2xl font-bold">{total} zł</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  onOpenChange(false);
                }}
                className="flex-1"
              >
                {t.cart.clear}
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push("/checkout");
                }}
                disabled={isEmpty}
                className={`flex-[2] ${
                  isDark
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {t.cart.checkout} • {total} zł
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
