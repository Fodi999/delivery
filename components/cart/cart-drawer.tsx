"use client";

import { useCartStore } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { translations } from "@/lib/translations";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartItemComponent } from "./cart-item";
import { ShoppingCart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  
  // Адаптивная сторона: mobile=bottom, desktop=right
  const [side, setSide] = useState<"bottom" | "right">("bottom");
  
  useEffect(() => {
    const checkSize = () => {
      setSide(window.innerWidth >= 768 ? "right" : "bottom");
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={cn(
          "p-0 flex flex-col bg-background text-foreground border-border",
          side === "bottom" ? "h-[90vh]" : "h-full w-[420px]"
        )}
      >
        <SheetHeader className="flex-shrink-0 flex flex-row items-center justify-between px-4 sm:px-6 py-4 border-b space-y-0">
          <div>
            <SheetTitle className="text-xl font-bold text-foreground">
              {t.cart.title}
            </SheetTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEmpty ? t.cart.emptyHint : `${items.length} ${items.length === 1 ? "item" : "items"}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-muted">
                <ShoppingCart className="w-10 h-10 opacity-40" />
              </div>
              <p className="text-lg font-medium mb-2 text-foreground">
                {t.cart.emptyTitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.cart.emptyHint}
              </p>
              <Button onClick={() => { onOpenChange(false); router.push("/menu"); }} className="mt-6 rounded-full">
                {language === "pl" ? "Przeglądaj menu" : language === "en" ? "Browse menu" : language === "uk" ? "Переглянути меню" : "Просмотреть меню"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (<CartItemComponent key={item.id} item={item} />))}
            </div>
          )}
        </div>
        {!isEmpty && (
          <div className="flex-shrink-0 border-t px-4 sm:px-6 py-4 bg-background">
            <div className="flex items-center justify-between py-4 px-4 rounded-xl mb-4 bg-muted">
              <span className="text-base font-semibold text-foreground">{t.cart.total}</span>
              <span className="text-2xl font-bold text-foreground">{total} zł</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { if (confirm(language === "pl" ? "Wyczyścić koszyk?" : language === "en" ? "Clear cart?" : language === "uk" ? "Очистити кошик?" : "Очистить корзину?")) { clear(); onOpenChange(false); } }} className="flex-1 h-12 rounded-full">
                {t.cart.clear}
              </Button>
              <Button onClick={() => { onOpenChange(false); router.push("/checkout"); }} className="flex-[2] h-12 text-base font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                {t.cart.checkout} · {total} zł
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
