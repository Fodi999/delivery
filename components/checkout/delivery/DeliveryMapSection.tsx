'use client';

import { MapboxDeliveryMap } from "@/components/maps/mapbox-delivery-map";
import type { DeliveryCalculation } from "@/lib/delivery-calculator";

interface DeliveryMapSectionProps {
  mapLocation: { lat: number; lng: number } | null;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onDistanceCalculated: (distance: number, duration: number) => void;
  deliveryInfo: DeliveryCalculation | null;
  isDark: boolean;
  language: 'pl' | 'ru' | 'uk' | 'en';
  autoStartCourier?: boolean;
}

export function DeliveryMapSection({
  mapLocation,
  onLocationSelect,
  onDistanceCalculated,
  deliveryInfo,
  isDark,
  language,
  autoStartCourier = false
}: DeliveryMapSectionProps) {
  const labels = {
    pl: {
      deliveryDetails: "Status dostawy",
      distance: "Trasa",
      time: "Czas",
      cost: "Dostawa",
      free: "Gratis",
      addressLabel: "Wskaż punkt na mapie"
    },
    ru: {
      deliveryDetails: "Статус доставки",
      distance: "Маршрут",
      time: "Время",
      cost: "Доставка",
      free: "Бесплатно",
      addressLabel: "Уточните адрес на карте"
    },
    uk: {
      deliveryDetails: "Статус доставки",
      distance: "Маршрут",
      time: "Час",
      cost: "Доставка",
      free: "Безкоштовно",
      addressLabel: "Уточніть адресу на мапі"
    },
    en: {
      deliveryDetails: "Delivery Status",
      distance: "Route",
      time: "Time",
      cost: "Fee",
      free: "Free",
      addressLabel: "Pinpoint on map"
    }
  };

  const t = labels[language];

  return (
    <div className="relative group">
      {/* 2026 Premium Glow Background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/10 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
      
      {/* Main Container */}
      <div className="relative flex flex-col gap-4">
        {/* Карта - Immersive Full Size */}
        <div className="relative h-[450px] md:h-[550px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-primary/30">
          <MapboxDeliveryMap
            onLocationSelect={onLocationSelect}
            onDistanceCalculated={onDistanceCalculated}
            externalLocation={mapLocation}
            autoStartCourier={autoStartCourier}
          />
          
          {/* Floating Address Label Overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
            <div className="glass px-6 py-3 rounded-full border border-white/20 shadow-xl pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 block leading-none mb-1">
                {t.addressLabel}
              </span>
              <span className="text-xs font-bold whitespace-nowrap">📍 {deliveryInfo?.distance?.toFixed(1) || '0'} km</span>
            </div>
          </div>
        </div>

        {/* Информация о доставке - Premium Glass Overlay Style */}
        <div className={`grid grid-cols-3 gap-2 p-2 rounded-[2rem] ${
          isDark ? 'bg-black/40' : 'bg-white/60'
        } backdrop-blur-xl border border-white/5`}>
          <div className="glass-light dark:glass-dark rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.distance}</span>
            <span className="text-sm font-black tracking-tight">{deliveryInfo?.distance?.toFixed(1) || '0'} km</span>
          </div>
          
          <div className="glass-light dark:glass-dark rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center border-x border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.time}</span>
            <span className="text-sm font-black tracking-tight">{deliveryInfo?.totalTime || '--'} min</span>
          </div>

          <div className="glass-light dark:glass-dark rounded-[1.5rem] p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.cost}</span>
            <span className={`text-sm font-black tracking-tight ${deliveryInfo?.isFree ? 'text-primary' : ''}`}>
              {deliveryInfo?.isFree ? t.free : `${deliveryInfo?.price || '0'} zł`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
