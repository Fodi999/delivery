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
}

export function DeliveryMapSection({
  mapLocation,
  onLocationSelect,
  onDistanceCalculated,
  deliveryInfo,
  isDark,
  language
}: DeliveryMapSectionProps) {
  const labels = {
    pl: {
      deliveryDetails: "Szczegóły dostawy",
      distance: "Odległość",
      time: "Czas dostawy",
      cost: "Koszt dostawy",
      free: "Darmowa dostawa"
    },
    ru: {
      deliveryDetails: "Детали доставки",
      distance: "Расстояние",
      time: "Время доставки",
      cost: "Стоимость доставки",
      free: "Бесплатная доставка"
    },
    uk: {
      deliveryDetails: "Деталі доставки",
      distance: "Відстань",
      time: "Час доставки",
      cost: "Вартість доставки",
      free: "Безкоштовна доставка"
    },
    en: {
      deliveryDetails: "Delivery details",
      distance: "Distance",
      time: "Delivery time",
      cost: "Delivery cost",
      free: "Free delivery"
    }
  };

  const t = labels[language];

  return (
    <div className="space-y-3">
      {/* Карта */}
      <div className="h-[300px] rounded-2xl overflow-hidden">
        <MapboxDeliveryMap
          onLocationSelect={onLocationSelect}
          onDistanceCalculated={onDistanceCalculated}
          externalLocation={mapLocation}
        />
      </div>

      {/* Информация о доставке */}
      {deliveryInfo && (
        <div className={`p-4 rounded-xl ${
          isDark ? 'bg-neutral-800' : 'bg-neutral-50'
        }`}>
          <h3 className={`text-sm font-semibold mb-3 ${
            isDark ? 'text-neutral-200' : 'text-neutral-800'
          }`}>
            {t.deliveryDetails}
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className={`text-xs mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                {t.distance}
              </div>
              <div className={`font-semibold ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                {deliveryInfo.distance?.toFixed(1) || '0'} km
              </div>
            </div>

            <div>
              <div className={`text-xs mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                {t.time}
              </div>
              <div className={`font-semibold ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                {deliveryInfo.totalTime} min
              </div>
            </div>

            <div>
              <div className={`text-xs mb-1 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                {t.cost}
              </div>
              <div className={`font-semibold ${
                deliveryInfo.isFree ? 'text-green-500' : isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                {deliveryInfo.isFree ? t.free : `${deliveryInfo.price} zł`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
