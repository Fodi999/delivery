"use client";

import { useApp } from "@/context/app-context";
import { Header } from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { MenuCategories } from "@/components/menu-categories";
import { menuItems } from "@/lib/menu-data";
import type { MenuCategory } from "@/lib/menu-types";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

const validCategories: MenuCategory[] = ["sushi", "wok", "ramen"];

export default function MenuCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { language, isDark, mounted } = useApp();
  const addItem = useCartStore((s) => s.addItem);

  if (!mounted) {
    return <div className={`min-h-[100dvh] ${isDark ? 'bg-black' : 'bg-white'}`} />;
  }

  // Get category from params
  const categoryParam = params.category as string;

  // Validate category - redirect if invalid (client component approach)
  if (!validCategories.includes(categoryParam as MenuCategory)) {
    router.replace("/menu/sushi");
    return null;
  }

  const category = categoryParam as MenuCategory;
  const items = menuItems.filter((item) => item.category === category);
  const t = translations[language];

  // Redirect if no items (shouldn't happen with our data)
  if (items.length === 0) {
    router.replace("/menu/sushi");
    return null;
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#fafafb] text-black'
    }`}>
      {/* Headers: Mobile + Desktop */}
      <MobileHeader />
      <Header 
        showBackButton 
        title={t.categories[category].name}
        subtitle={`${items.length} ${t.itemsCount}`}
      />

      {/* Category Tabs */}
      <MenuCategories />

      {/* Menu Items - ✅ Mobile-first grid with proper spacing */}
      <main className="px-4 sm:px-6 md:px-12 py-8 pb-[calc(110px+env(safe-area-inset-bottom))] md:pb-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden rounded-[2.5rem] border-none bg-muted/30 aspect-[4/5] sm:aspect-[3/4] relative transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* IMAGE - Full card background with parallax-like effect on hover */}
              <img
                src={item.image}
                alt={item.nameTranslations[language]}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />

              {/* OVERLAY GRADIENT - More cinematic */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />

              {/* BADGES - Ultra minimal 2026 style */}
              <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
                {item.id.includes('s4') && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/20">
                    {language === 'ru' ? 'Острое' : 'Spicy'}
                  </span>
                )}
                {item.id.includes('1') && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    Bestseller
                  </span>
                )}
              </div>

              {/* CONTENT - Premium Typography */}
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col gap-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none mb-2">
                    {item.nameTranslations[language]}
                  </h3>
                  <p className="text-white/60 text-sm font-medium line-clamp-2 leading-relaxed max-w-[85%] group-hover:text-white/80 transition-colors">
                    {item.descriptionTranslations[language]}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-tighter">Price</span>
                    <span className="text-2xl font-black text-white tracking-tighter">
                      {item.price} <span className="text-sm font-medium text-white/60 ml-px">PLN</span>
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem({
                        id: item.id,
                        name: item.nameTranslations,
                        price: item.price,
                        image: item.image,
                      });
                      toast.success(
                        language === "pl"
                          ? "Dodano do koszyka"
                          : language === "ru"
                          ? "Добавлено в корзину"
                          : language === "uk"
                          ? "Додано до кошика"
                          : "Added to cart",
                        {
                          duration: 2000,
                          className: "rounded-2xl font-bold",
                        }
                      );
                    }}
                    className="w-14 h-14 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 shadow-xl shadow-primary/10 group-hover:shadow-primary/30"
                    aria-label={t.addToCart}
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
