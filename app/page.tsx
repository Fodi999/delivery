"use client";

import { useApp } from "@/context/app-context";
import { Header } from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { translations } from "@/lib/translations";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
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
    <div className={`min-h-screen transition-all duration-700 selection:bg-primary/30 ${
      isDark 
        ? 'bg-[#0a0a0c] text-neutral-100' 
        : 'bg-[#fafafb] text-neutral-900'
    }`}>
      {/* Headers: Mobile + Desktop */}
      <MobileHeader />
      <Header />

      {/* Main Content - ✅ Proper bottom padding for sticky CTA + bottom nav */}
      <main className="px-4 sm:px-6 md:px-12 pb-[calc(64px+64px+env(safe-area-inset-bottom)+16px)] md:pb-16 max-w-7xl mx-auto">
        {/* 🔥 2026 HERO - Ultra-Premium & Emotional */}
        <div className="py-12 sm:py-20 md:py-32 text-center relative overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-8 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star className="w-3 h-3 fill-primary" />
            {language === 'ru' ? 'Премиум доставка в Гданьске' : 'Premium delivery in Gdańsk'}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            {t.headline.split(' ').map((word, i) => (
              <span key={i} className={i === 1 ? 'text-primary' : ''}>{word} </span>
            ))}
          </h1>
          
          <p className={`text-base sm:text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed opacity-80 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 ${
            isDark ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            {language === 'ru' ? 'Изысканная японская кухня с доставкой за 30 минут прямо к вашей двери.' : 'Exquisite Japanese cuisine delivered in 30 minutes right to your door.'}
          </p>

          <div className="flex items-center justify-center gap-8 flex-wrap animate-in fade-in duration-1000 delay-300">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">4.8</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="text-[10px] uppercase tracking-tighter opacity-50 font-bold">Rating</span>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">35</span>
              <span className="text-xs font-bold leading-none">min</span>
              <span className="text-[10px] uppercase tracking-tighter opacity-50 font-bold">Delivery</span>
            </div>
          </div>
        </div>

        {/* 🔥 CATEGORIES - Grid with 2026 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-24">
          {categories.map((cat, idx) => (
            <Card 
              key={cat.key}
              onClick={() => router.push(`/menu/${cat.key}`)}
              className="group cursor-pointer overflow-hidden border-none bg-muted/30 hover:bg-muted/50 transition-all duration-500 rounded-[2rem] aspect-[4/5] sm:aspect-square relative"
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                priority={idx === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-10">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-2 group-hover:translate-x-2 transition-transform duration-500">
                  {cat.name}
                </h2>
                <p className="text-white/60 text-sm font-medium mb-4 group-hover:translate-x-2 transition-transform duration-500 delay-75">
                  {language === 'ru' ? 'Посмотреть меню' : 'Explore menu'} →
                </p>
              </div>
            </Card>
          ))}
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
                className={`relative overflow-hidden rounded-[2rem] h-[160px] sm:h-[180px] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${
                  isDark
                    ? 'border border-white/8'
                    : 'border border-black/6'
                }`}
              >
                {/* Background Image */}
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-black text-base sm:text-lg tracking-tight leading-tight mb-0.5">
                    {item.name}
                  </h3>
                  <p className="text-white/70 text-sm font-bold">
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
