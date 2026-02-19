"use client";

import { useCartStore } from "@/store/cart-store";
import { useApp } from "@/context/app-context";
import { translations, getItemsWord } from "@/lib/translations";
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
          "p-0 flex flex-col glass border-white/5 shadow-2xl transition-all duration-700",
          side === "bottom" ? "h-[92vh] rounded-t-[3rem]" : "h-full w-full sm:w-[500px]"
        )}
      >
        <SheetHeader className="flex-shrink-0 flex flex-row items-center justify-between px-6 sm:px-8 py-6 border-b border-white/5 space-y-0">
          <div>
            <SheetTitle className="text-3xl font-black tracking-tighter text-foreground leading-none">
              {t.cart.title}
            </SheetTitle>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2 opacity-50">
              {isEmpty ? t.cart.emptyHint : `${items.length} ${getItemsWord(items.length, language)}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-12 w-12 rounded-full hover:scale-110 active:scale-90 transition-all">
            <X className="h-6 w-6 stroke-[3]" />
          </Button>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 scrollbar-hide">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8 bg-primary/5 border border-primary/10 relative">
                <div className="absolute inset-0 bg-primary/5 animate-ping rounded-full" />
                <ShoppingCart className="w-14 h-14 text-primary opacity-60" />
              </div>
              <p className="text-2xl font-black tracking-tighter mb-4 text-foreground">
                {t.cart.emptyTitle}
              </p>
              <p className="text-sm font-medium opacity-60 max-w-[240px] leading-relaxed mb-10">
                {t.cart.emptyHint}
              </p>
              <Button onClick={() => { onOpenChange(false); router.push("/menu/sushi"); }} className="rounded-full h-14 px-8 text-lg font-black tracking-tight shadow-xl hover:scale-105 active:scale-95 transition-all">
                {language === "pl" ? "Przeglądaj menu" : language === "en" ? "Browse menu" : language === "uk" ? "Переглянути меню" : "Просмотреть меню"}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {items.map((item) => (<CartItemComponent key={item.id} item={item} />))}
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="flex-shrink-0 border-t border-white/5 px-6 sm:px-8 py-8 glass-dark relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -z-10" />
            
            <div className="flex items-center justify-between py-6 px-8 rounded-[2rem] mb-6 bg-white/5 border border-white/5">
              <span className="text-lg font-black text-foreground tracking-tighter uppercase opacity-50">{t.cart.total}</span>
              <span className="text-4xl font-black text-foreground tracking-tighter">{total} <span className="text-lg font-medium opacity-60 ml-1">PLN</span></span>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => { if (confirm(language === "pl" ? "Wyczyścić koszyk?" : language === "en" ? "Clear cart?" : language === "uk" ? "Очистити кошик?" : "Очистить корзину?")) { clear(); onOpenChange(false); } }} 
                className="flex-1 h-14 rounded-full border-2 font-black tracking-tight hover:bg-destructive/10 hover:border-destructive hover:text-destructive group transition-all duration-300"
              >
                {t.cart.clear}
              </Button>
              <Button 
                onClick={() => { onOpenChange(false); router.push("/checkout"); }} 
                className="flex-[2] h-14 text-lg font-black tracking-tight rounded-full bg-primary text-primary-foreground hover:scale-[1.02] shadow-2xl shadow-primary/20 active:scale-95 transition-all duration-300 border-b-4 border-black/20"
              >
                {t.cart.checkout}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
