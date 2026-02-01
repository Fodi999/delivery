# 🗺️ Google Maps Integration

## ✅ Что установлено

### 1. Библиотека
```bash
npm install @react-google-maps/api
```

### 2. API ключ
В `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBCpch4254qW1teqkaZoFDm9Y5pqwMjGkg
```

### 3. Компонент карты
**Файл:** `components/maps/delivery-map.tsx`

**Возможности:**
- ✅ Интерактивная Google Maps
- ✅ Клик по карте → установка маркера
- ✅ Центр: Gdańsk (54.3520, 18.6466)
- ✅ Zoom: 13
- ✅ Красивый дизайн (border-radius: 12px)

**Код:**
```tsx
"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useState } from "react";

const center = {
  lat: 54.3520, // Gdańsk
  lng: 18.6466,
};

export function DeliveryMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const [marker, setMarker] = useState(center);

  if (!isLoaded) return <div>Загрузка карты…</div>;

  return (
    <GoogleMap
      center={marker}
      zoom={13}
      mapContainerStyle={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
      }}
      onClick={(e) => {
        if (!e.latLng) return;
        setMarker({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }}
    >
      <Marker position={marker} />
    </GoogleMap>
  );
}
```

### 4. Интеграция в checkout
**Файл:** `components/checkout/checkout-form.tsx`

**Изменения:**
1. Добавлен импорт:
```tsx
import { DeliveryMap } from "@/components/maps/delivery-map";
```

2. Карта добавлена перед полем адреса:
```tsx
<div className="space-y-2">
  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
    {language === "pl" ? "Adres dostawy" : 
     language === "ru" ? "Адрес доставки" : 
     language === "uk" ? "Адреса доставки" : 
     "Delivery address"}
  </h3>
  <DeliveryMap />
</div>
```

## 🚀 Следующий уровень (Roadmap)

### 1. Автодополнение адреса ⏳
**Google Places Autocomplete API**
- Поиск улиц/домов
- Автозаполнение поля адреса при клике на карту
- Валидация адреса

**Пример:**
```tsx
import { Autocomplete } from "@react-google-maps/api";

<Autocomplete
  onPlaceChanged={() => {
    // Получаем выбранный адрес
    // Обновляем поле и маркер на карте
  }}
>
  <Input placeholder="Введите адрес" />
</Autocomplete>
```

### 2. Динамическое время доставки ⏳
**Google Distance Matrix API**
- Расчёт времени от ресторана до клиента
- Отображение "25–35 мин" вместо статичного времени
- Учёт пробок в реальном времени

**Пример:**
```tsx
const calculateDeliveryTime = async (destination) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=54.3520,18.6466&destinations=${destination.lat},${destination.lng}&key=${API_KEY}`
  );
  const data = await response.json();
  const durationMinutes = data.rows[0].elements[0].duration.value / 60;
  return Math.ceil(durationMinutes + 10); // + время готовки
};
```

### 3. Зоны доставки ⏳
**Google Maps Polygon API**
- Визуализация зон: Gdańsk, Sopot, Gdynia
- Блокировка заказов вне зоны
- Цветовая индикация зон

**Пример:**
```tsx
<Polygon
  paths={gdanskZone}
  options={{
    fillColor: "#22c55e",
    fillOpacity: 0.2,
    strokeColor: "#22c55e",
    strokeWeight: 2,
  }}
/>
```

### 4. Динамическая цена доставки ⏳
**На основе расстояния**
- 0–3 км: бесплатно
- 3–5 км: 5 zł
- 5–7 км: 10 zł
- > 7 км: не доставляем

**Пример:**
```tsx
const calculateDeliveryPrice = (distance) => {
  if (distance <= 3) return 0;
  if (distance <= 5) return 5;
  if (distance <= 7) return 10;
  return null; // вне зоны
};
```

### 5. Обратное геокодирование ⏳
**Geocoding API**
- Клик на карту → автозаполнение адреса
- Координаты → читаемый адрес

**Пример:**
```tsx
const getAddressFromCoords = async (lat, lng) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
  );
  const data = await response.json();
  return data.results[0].formatted_address;
};
```

## 📊 Приоритеты (что делать первым)

1. **HIGH:** Автодополнение адреса (Places Autocomplete)
   - Улучшает UX
   - Снижает ошибки ввода
   - Стандарт для delivery-сервисов

2. **HIGH:** Обратное геокодирование
   - Клик на карту → адрес
   - Связка карты и поля ввода

3. **MEDIUM:** Зоны доставки
   - Важно для бизнеса
   - Показывает границы

4. **MEDIUM:** Динамическое время
   - Повышает доверие
   - Реалистичные ожидания

5. **LOW:** Динамическая цена
   - Можно сделать после зон

## 🔧 Технические детали

### Используемые API:
- ✅ **Maps JavaScript API** - основная карта
- ⏳ **Places API** - автодополнение адресов
- ⏳ **Geocoding API** - координаты ↔ адреса
- ⏳ **Distance Matrix API** - расстояния и время
- ⏳ **Geometry Library** - работа с зонами

### Лимиты Google Maps API (бесплатный tier):
- 28,000 запросов/месяц
- $200 кредитов
- Достаточно для старта

### Оптимизация:
- Кэширование запросов
- Debounce при автодополнении
- Lazy loading карты

## 🎯 Текущий статус

✅ **DONE:**
- Установлена библиотека
- Создан компонент карты
- Интегрирован в checkout
- Клик на карту работает

⏳ **TODO:**
- Связать клик на карту с полем адреса
- Автодополнение адресов
- Зоны доставки
- Динамическое время
- Динамическая цена

## 📝 Примечания

- API ключ в `.env.local` (не в git)
- Префикс `NEXT_PUBLIC_` для доступа на клиенте
- Карта загружается с библиотекой `["places"]`
- Используется `useJsApiLoader` для оптимизации
