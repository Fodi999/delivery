"use client";

import { useApp } from "@/context/app-context";
import { Header } from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Package, Truck } from "lucide-react";
import { MobileCTA } from "@/components/mobile-cta";

export default function Home() {
  const router = useRouter();
  const { language, isDark, mounted } = useApp();

  if (!mounted) {
    return <div className={`min-h-[100dvh] ${isDark ? 'bg-black' : 'bg-white'}`} />;
  }

  const t = translations[language];

  const categories = [
    {
      name: "Sushi",
      key: "sushi" as const,
      image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg",
    },
    {
      name: "Wok",
      key: "wok" as const,
      image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png",
    },
    {
      name: "Ramen",
      key: "ramen" as const,
      image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png",
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-black text-white' 
        : 'bg-white text-black'
    }`}>
      {/* Headers: Mobile + Desktop */}
      <MobileHeader />
      <Header />

      {/* Main Content - ✅ Proper bottom padding for sticky CTA + bottom nav */}
      <main className="px-4 sm:px-6 md:px-12 pb-[calc(64px+64px+env(safe-area-inset-bottom)+16px)] md:pb-8">
        {/* 🔥 MOBILE-FIRST HERO - Super Simple */}
        <div className="py-8 sm:py-12 md:py-16 text-center max-w-4xl mx-auto">
          {/* Simplified Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-3 sm:mb-4 leading-tight">
            {t.headline}
          </h1>
          
          {/* Compact Trust Info - One Line on Mobile */}
          <p className={`text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-12 flex items-center justify-center gap-3 flex-wrap ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.8</span>
            </span>
            <span className={isDark ? 'text-neutral-700' : 'text-neutral-300'}>•</span>
            <span className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              <span>30–45 min</span>
            </span>
          </p>

          {/* Desktop-only CTA buttons */}
          <div className="hidden md:flex gap-4 justify-center mb-12">
            <Button
              onClick={() => router.push('/menu')}
              size="lg"
              className={`px-8 rounded-full h-14 text-lg font-semibold ${
                isDark 
                  ? 'bg-white text-black hover:bg-neutral-200' 
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              {t.orderNow}
            </Button>
            <Button
              onClick={() => router.push('/menu')}
              size="lg"
              variant="ghost"
              className="px-8 rounded-full h-14 text-lg font-semibold"
            >
              {t.viewMenu}
            </Button>
          </div>

          {/* 🔥 MICRO-CONTEXT - Desktop only */}
          <div className={`hidden md:block text-center text-sm mb-12 ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>{language === 'pl' ? 'Przeglądaj menu' : language === 'en' ? 'Browse menu' : language === 'uk' ? 'Переглянути меню' : 'Просмотр меню'}</span>
              <span>→</span>
              <span>{language === 'pl' ? 'Dodaj do koszyka' : language === 'en' ? 'Add to cart' : language === 'uk' ? 'Додати до кошика' : 'Добавить в корзину'}</span>
              <span>→</span>
              <span>{language === 'pl' ? 'Checkout' : language === 'en' ? 'Checkout' : language === 'uk' ? 'Оформити' : 'Оформить'}</span>
            </p>
          </div>
        </div>

        {/* 🔥 HORIZONTAL CATEGORY SCROLLER - Mobile Optimized */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
            {language === 'pl' ? 'Kategorie' :
             language === 'en' ? 'Categories' :
             language === 'uk' ? 'Категорії' :
             'Категории'}
          </h2>
          
          {/* Mobile: Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto touch-pan-x scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => router.push(`/menu/${category.key}`)}
                  className={`relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden ${
                    isDark ? 'bg-neutral-900' : 'bg-neutral-100'
                  }`}
                >
                  <Image
                    src={category.image}
                    alt={t.categories[category.key].name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3">
                    <span className="text-white font-semibold text-sm">
                      {t.categories[category.key].name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.key}
                onClick={() => router.push(`/menu/${category.key}`)}
                className={`p-0 cursor-pointer group rounded-2xl overflow-hidden ${
                  isDark 
                    ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800' 
                    : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={category.image}
                    alt={t.categories[category.key].name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4">
                    <span className="text-white font-semibold text-lg">
                      {t.categories[category.key].name}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 🔥 POPULAR ITEMS - Fill the void */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
            {language === 'pl' ? 'Popularne dzisiaj' :
             language === 'en' ? 'Popular today' :
             language === 'uk' ? 'Популярне сьогодні' :
             'Популярное сегодня'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { 
                name: 'Dragon Roll', 
                price: '45 PLN', 
                image: 'https://i.postimg.cc/wMvLz0F5/0000036.jpg',
                category: 'sushi'
              },
              { 
                name: 'Tonkotsu Ramen', 
                price: '42 PLN', 
                image: 'https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png',
                category: 'ramen'
              },
              { 
                name: 'Chicken Wok', 
                price: '36 PLN', 
                image: 'https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png',
                category: 'wok'
              },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(`/menu/${item.category}`)}
                className={`relative overflow-hidden rounded-2xl h-[160px] sm:h-[180px] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                  isDark
                    ? 'bg-neutral-900 border border-neutral-800'
                    : 'bg-neutral-50 border border-neutral-200'
                }`}
              >
                {/* Background Image */}
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                    {item.name}
                  </h3>
                  <p className="text-white/90 text-sm font-medium">
                    {item.price}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 🔥 STICKY CTA BUTTON - Mobile Only */}
      <MobileCTA />
    </div>
  );
}
