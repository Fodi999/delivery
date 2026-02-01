"use client";

import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useRef, useCallback } from "react";
import { RESTAURANT_LOCATION } from "@/lib/constants";

// ✅ Вынесли libraries за компонент (избегаем reloading Google Maps API)
const LIBRARIES: ("places")[] = ["places"];

interface DeliveryMapProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  onDistanceCalculated?: (distance: number, duration: number) => void;
  externalLocation?: { lat: number; lng: number } | null;
}

export function DeliveryMap({
  onLocationSelect,
  onDistanceCalculated,
  externalLocation,
}: DeliveryMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  const defaultCustomerLocation = {
    lat: 54.3520,
    lng: 18.6466,
  };

  const [customerLocation, setCustomerLocation] = useState<{
    lat: number;
    lng: number;
  }>(defaultCustomerLocation);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  // ✨ Состояние для анимированного маршрута
  const [fullPath, setFullPath] = useState<{ lat: number; lng: number }[]>([]);
  const [animatedPath, setAnimatedPath] = useState<{ lat: number; lng: number }[]>([]);

  // Refs для избежания бесконечных циклов
  const onDistanceCalculatedRef = useRef(onDistanceCalculated);
  const hasFittedRef = useRef(false); // Флаг для авто-перецентровки

  useEffect(() => {
    onDistanceCalculatedRef.current = onDistanceCalculated;
  }, [onDistanceCalculated]);

  // Callback при загрузке карты
  const onMapLoad = useCallback((map: google.maps.Map) => {
    // ✅ КРИТИЧНО: Принудительно применяем Map ID после загрузки
    map.setOptions({
      mapId: process.env.NEXT_PUBLIC_MAP_ID!,
    });
    setMap(map);
  }, []);

  // Обновляем локацию из геокодирования
  useEffect(() => {
    if (externalLocation) {
      setCustomerLocation(externalLocation);
      hasFittedRef.current = false; // Сбрасываем флаг при смене адреса
    }
  }, [externalLocation]);

  // Рассчитываем маршрут при изменении локации
  useEffect(() => {
    if (!isLoaded) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(
          RESTAURANT_LOCATION.lat,
          RESTAURANT_LOCATION.lng
        ),
        destination: new google.maps.LatLng(
          customerLocation.lat,
          customerLocation.lng
        ),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          hasFittedRef.current = false; // Сбрасываем флаг для нового маршрута

          // ✨ Извлекаем массив точек маршрута для анимации (детальный путь)
          const route = result.routes[0];
          if (route && route.legs[0]) {
            // ✅ Используем steps[].path для плавного маршрута (как в Bolt)
            const detailedPath: { lat: number; lng: number }[] = [];
            
            route.legs[0].steps.forEach(step => {
              if (step.path) {
                step.path.forEach(p => {
                  try {
                    const lat = typeof p.lat === 'function' ? p.lat() : p.lat;
                    const lng = typeof p.lng === 'function' ? p.lng() : p.lng;
                    
                    if (
                      typeof lat === 'number' && 
                      typeof lng === 'number' && 
                      isFinite(lat) && 
                      isFinite(lng) &&
                      lat >= -90 && lat <= 90 &&
                      lng >= -180 && lng <= 180
                    ) {
                      detailedPath.push({ lat, lng });
                    }
                  } catch (e) {
                    // Пропускаем невалидные точки
                  }
                });
              }
            });
            
            setFullPath(detailedPath);
          }

          if (route && route.legs[0]) {
            const distanceMeters = route.legs[0].distance?.value || 0;
            const durationSeconds = route.legs[0].duration?.value || 0;
            const distanceKm = distanceMeters / 1000;
            const durationMinutes = Math.ceil(durationSeconds / 60);

            if (onDistanceCalculatedRef.current) {
              onDistanceCalculatedRef.current(distanceKm, durationMinutes);
            }
          }
        }
      }
    );
  }, [customerLocation.lat, customerLocation.lng, isLoaded]);

  // 🎬 Анимация рисования маршрута (как в Bolt)
  useEffect(() => {
    if (!fullPath.length) {
      setAnimatedPath([]);
      return;
    }

    let i = 0;
    setAnimatedPath([]);

    const interval = setInterval(() => {
      const point = fullPath[i];
      
      // Проверяем что точка валидная перед добавлением
      if (
        point && 
        typeof point.lat === 'number' && 
        typeof point.lng === 'number' &&
        isFinite(point.lat) && 
        isFinite(point.lng)
      ) {
        setAnimatedPath((prev) => [...prev, point]);
      }
      
      i++;

      if (i >= fullPath.length) {
        clearInterval(interval);
      }
    }, 25); // 25ms = плавная анимация как в Bolt

    return () => clearInterval(interval);
  }, [fullPath]);

  // ✅ FIT BOUNDS - автоматическая подстройка камеры под маршрут
  useEffect(() => {
    if (!map || !directions || hasFittedRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    
    // Добавляем все точки маршрута в bounds
    const route = directions.routes[0];
    if (route && route.overview_path) {
      route.overview_path.forEach((point) => {
        bounds.extend(point);
      });
    }

    // Подстраиваем карту с padding (место под UI элементы)
    map.fitBounds(bounds, {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    });

    hasFittedRef.current = true; // Отмечаем что уже подстроили
  }, [map, directions]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    setCustomerLocation(location);
    hasFittedRef.current = false; // Сбрасываем при ручном клике

    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl">
        <p className="text-neutral-500">Загрузка карты...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      onLoad={onMapLoad}
      mapContainerStyle={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
      }}
      onClick={handleMapClick}
      options={{
        mapId: process.env.NEXT_PUBLIC_MAP_ID!, // ✅ Map ID из Google Cloud Console
        mapTypeId: google.maps.MapTypeId.ROADMAP, // ✅ КРИТИЧНО: явно указываем ROADMAP
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        disableDefaultUI: true,
        zoomControl: false,
      }}
    >
      {/* 🎯 Маркеры (используем Marker из @react-google-maps/api)
          ⚠️ TODO: Мигрировать на AdvancedMarkerElement когда появится поддержка в библиотеке
          📚 google.maps.Marker deprecated, но @react-google-maps/api пока не поддерживает новый API
          🔗 https://developers.google.com/maps/documentation/javascript/advanced-markers/overview
      */}
      
      {/* Маркер ресторана */}
      <Marker
        position={RESTAURANT_LOCATION}
        icon={{
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTUgMEMxMC4wMjk0IDAgNiA0LjAyOTQzIDYgOUM2IDEzLjk3MDYgMTAgMjUgMTUgNDBDMjAgMjUgMjQgMTMuOTcwNiAyNCA5QzI0IDQuMDI5NDMgMTkuOTcwNiAwIDE1IDBaIiBmaWxsPSIjMjJjNTVlIi8+CiAgPGNpcmNsZSBjeD0iMTUiIGN5PSI5IiByPSI0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=",
          scaledSize: new google.maps.Size(30, 40),
        }}
        title={RESTAURANT_LOCATION.name}
      />

      {/* Маркер клиента - теперь всегда отображается */}
      <Marker
        position={customerLocation}
        icon={{
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTUgMEMxMC4wMjk0IDAgNiA0LjAyOTQzIDYgOUM2IDEzLjk3MDYgMTAgMjUgMTUgNDBDMjAgMjUgMjQgMTMuOTcwNiAyNCA5QzI0IDQuMDI5NDMgMTkuOTcwNiAwIDE1IDBaIiBmaWxsPSIjZWY0NDQ0Ii8+CiAgPGNpcmNsZSBjeD0iMTUiIGN5PSI5IiByPSI0IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=",
          scaledSize: new google.maps.Size(30, 40),
        }}
        title="Адрес доставки"
        draggable={true}
        onDragEnd={(e) => {
          if (e.latLng) {
            handleMapClick(e);
          }
        }}
      />

      {/* ✨ Анимированный маршрут (как в Bolt) */}
      {animatedPath.length > 1 && 
       animatedPath.every(p => 
         p && 
         typeof p.lat === 'number' && 
         typeof p.lng === 'number' && 
         isFinite(p.lat) && 
         isFinite(p.lng)
       ) && (
        <Polyline
          path={animatedPath}
          options={{
            strokeColor: "#22c55e",
            strokeOpacity: 1,
            strokeWeight: 5,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 3,
                },
                offset: "0",
                repeat: "12px",
              },
            ],
          }}
        />
      )}
    </GoogleMap>
  );
}
