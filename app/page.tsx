"use client";

import { useApp } from "@/context/app-context";
import { Header } from "@/components/header";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Package, Truck } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { language, isDark, mounted } = useApp();

  if (!mounted) {
    return <div className={`h-screen ${isDark ? 'bg-black' : 'bg-white'}`} />;
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
    <div className={`h-screen overflow-hidden grid grid-rows-[auto_1fr_auto] transition-colors duration-300 ${
      isDark 
        ? 'bg-black text-white' 
        : 'bg-white text-black'
    }`}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-6 md:px-12 -mt-8 md:-mt-12">
        {/* Headline */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-3 md:mb-4">
            {t.headline}
          </h1>
          <p className={`text-lg md:text-xl mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            {t.subheadline}
          </p>
          {/* Trust Badge */}
          <div className={`flex items-center justify-center gap-3 text-sm md:text-base ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.8</span>
            </span>
            <span className={isDark ? 'text-neutral-700' : 'text-neutral-300'}>•</span>
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              <span>1200+ {t.orders || "orders"}</span>
            </span>
            <span className={isDark ? 'text-neutral-700' : 'text-neutral-300'}>•</span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>30–45 min</span>
            </span>
          </div>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 w-full max-w-4xl mb-8 md:mb-10">
          {categories.map((category) => (
            <Card
              key={category.key}
              onClick={() => router.push(`/menu/${category.key}`)}
              className={`p-0 transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden relative ${
                isDark 
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:shadow-xl hover:shadow-white/5' 
                  : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 hover:shadow-xl'
              }`}
            >
              <div className="relative h-36 md:h-44 w-full">
                <Image
                  src={category.image}
                  alt={t.categories[category.key].name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {t.openCategory || "Открыть"}
                  </span>
                </div>
                {/* Category Name */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end p-3 md:p-4">
                  <span className="text-white font-semibold text-base md:text-lg">
                    {t.categories[category.key].name}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button
            onClick={() => router.push('/menu')}
            size="lg"
            className={`flex-1 rounded-full h-12 md:h-14 text-base md:text-lg font-semibold transition-all ${
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
            variant="outline"
            className={`flex-1 rounded-full h-12 md:h-14 text-base md:text-lg font-semibold transition-all ${
              isDark 
                ? 'border-neutral-500 bg-neutral-800/50 text-white hover:bg-neutral-700 hover:border-neutral-400' 
                : 'border-neutral-300 bg-white text-black hover:bg-neutral-50'
            }`}
          >
            {t.viewMenu}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center px-6 pb-6 text-sm md:text-base ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
        {t.footer}
      </footer>
    </div>
  );
}
