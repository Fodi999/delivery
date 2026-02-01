"use client";

import { useApp } from "@/context/app-context";
import { Header } from "@/components/header";
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
    return <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`} />;
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header */}
      <Header 
        showBackButton 
        title={t.categories[category].name}
        subtitle={`${items.length} ${t.itemsCount}`}
      />

      {/* Category Tabs */}
      <MenuCategories />

      {/* Menu Items */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative group p-0 h-[400px] ${
                isDark
                  ? "bg-neutral-900 border-neutral-800"
                  : "bg-white border-neutral-200"
              }`}
            >
              {/* IMAGE - Full card background */}
              <img
                src={item.image}
                alt={item.nameTranslations[language]}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* BADGES - Top left corner */}
              {item.id.includes('s4') && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/90 text-white backdrop-blur-sm">
                    🌶 {language === 'pl' ? 'Ostre' : language === 'ru' ? 'Острое' : language === 'uk' ? 'Гостре' : 'Spicy'}
                  </span>
                </div>
              )}
              {item.id.includes('1') && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-white backdrop-blur-sm">
                    ⭐ Bestseller
                  </span>
                </div>
              )}
              {(item.id === 'w4' || item.id === 'r4' || item.id === 'w8') && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/90 text-white backdrop-blur-sm">
                    🥬 {language === 'pl' ? 'Wege' : language === 'ru' ? 'Веган' : language === 'uk' ? 'Веган' : 'Veggie'}
                  </span>
                </div>
              )}

              {/* OVERLAY GRADIENT */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300" />

              {/* CONTENT - Overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
                <h3 className="text-white text-lg font-semibold leading-tight">
                  {item.nameTranslations[language]}
                </h3>

                <p className="text-neutral-200 text-sm leading-snug line-clamp-2">
                  {item.descriptionTranslations[language]}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-white text-xl font-bold">
                    {item.price} zł
                  </div>

                  <div className="relative group/button">
                    <button
                      onClick={() => {
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
                          }
                        );
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 bg-white text-black hover:bg-neutral-100 shadow-lg"
                      aria-label={t.addToCart}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg opacity-0 group-hover/button:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                      {t.addToCart}
                      <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
