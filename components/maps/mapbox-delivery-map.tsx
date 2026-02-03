'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RESTAURANT_LOCATION } from '@/lib/constants';

interface MapboxDeliveryMapProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  onDistanceCalculated?: (distance: number, duration: number) => void;
  externalLocation?: { lat: number; lng: number } | null;
}

export function MapboxDeliveryMap({
  onLocationSelect,
  onDistanceCalculated,
  externalLocation,
}: MapboxDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const restaurantMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const courierMarkerRef = useRef<mapboxgl.Marker | null>(null); // Маркер курьера
  const [mapLoaded, setMapLoaded] = useState(false);
  const initializingRef = useRef(false); // Флаг для предотвращения двойной инициализации
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]); // Координаты маршрута
  const [isAnimating, setIsAnimating] = useState(false); // Флаг анимации
  const animationFrameRef = useRef<number | null>(null); // ID анимации
  
  // Refs для колбэков чтобы избежать бесконечного цикла
  const onLocationSelectRef = useRef(onLocationSelect);
  const onDistanceCalculatedRef = useRef(onDistanceCalculated);
  
  // Обновляем refs при изменении пропсов
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
    onDistanceCalculatedRef.current = onDistanceCalculated;
  }, [onLocationSelect, onDistanceCalculated]);

  const defaultCustomerLocation = {
    lat: 54.3520,
    lng: 18.6466,
  };

  const [customerLocation, setCustomerLocation] = useState(
    externalLocation || defaultCustomerLocation
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current || initializingRef.current) {
      console.log('⚠️ Map already initialized or initializing, skipping');
      return;
    }

    initializingRef.current = true;

    // Set token before creating map
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error('❌ NEXT_PUBLIC_MAPBOX_TOKEN not found!');
      initializingRef.current = false;
      return;
    }
    
    mapboxgl.accessToken = token;
    
    // Check container dimensions
    const containerHeight = mapContainerRef.current.clientHeight;
    const containerWidth = mapContainerRef.current.clientWidth;
    console.log('🗺️ Initializing Mapbox');
    console.log('📐 Container dimensions:', { width: containerWidth, height: containerHeight });

    if (containerHeight === 0 || containerWidth === 0) {
      console.error('❌ Container has zero dimensions! Check parent CSS.');
      initializingRef.current = false;
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [RESTAURANT_LOCATION.lng, RESTAURANT_LOCATION.lat],
      zoom: 12,
      // UX для доставки - минимум взаимодействия
      scrollZoom: false,
      doubleClickZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before adding markers
    map.on('load', () => {
      setMapLoaded(true);
      
      // 🏪 Кастомный маркер ресторана с SVG иконкой
      const restaurantEl = document.createElement('div');
      restaurantEl.className = 'restaurant-marker';
      restaurantEl.style.width = '40px';
      restaurantEl.style.height = '40px';
      restaurantEl.style.borderRadius = '50%';
      restaurantEl.style.backgroundColor = '#22c55e'; // Зелёный бренд доставки
      restaurantEl.style.border = '3px solid white';
      restaurantEl.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
      restaurantEl.style.cursor = 'pointer';
      restaurantEl.style.display = 'flex';
      restaurantEl.style.alignItems = 'center';
      restaurantEl.style.justifyContent = 'center';
      
      // SVG иконка ресторана/магазина
      restaurantEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      `;
      restaurantEl.style.fontSize = '20px';

      const restaurantMarker = new mapboxgl.Marker({ element: restaurantEl })
        .setLngLat([RESTAURANT_LOCATION.lng, RESTAURANT_LOCATION.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<h3 style="margin:0;font-weight:bold;">Суши • Вок • Рамен</h3>'
          )
        )
        .addTo(map);

      restaurantMarkerRef.current = restaurantMarker;
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []);

  // Update customer location from external prop
  useEffect(() => {
    if (externalLocation) {
      setCustomerLocation(externalLocation);
    }
  }, [externalLocation]);

  // Update customer marker and route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return; // Wait for map to be loaded

    // Remove old customer marker
    if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
    }

    // 🏠 Кастомный маркер клиента с пульсацией
    const customerEl = document.createElement('div');
    customerEl.className = 'customer-marker';
    customerEl.style.position = 'relative';
    customerEl.style.width = '32px';
    customerEl.style.height = '32px';
    
    // Пульсирующий круг (внешний)
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.width = '100%';
    pulse.style.height = '100%';
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
    pulse.style.animation = 'pulse 2s infinite';
    
    // Основной круг (внутренний)
    const core = document.createElement('div');
    core.style.position = 'absolute';
    core.style.width = '100%';
    core.style.height = '100%';
    core.style.borderRadius = '50%';
    core.style.backgroundColor = '#3b82f6';
    core.style.border = '3px solid white';
    core.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    core.style.display = 'flex';
    core.style.alignItems = 'center';
    core.style.justifyContent = 'center';
    
    // SVG иконка локации/пина
    core.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#3b82f6" stroke="white"></circle>
      </svg>
    `;
    
    customerEl.appendChild(pulse);
    customerEl.appendChild(core);

    const customerMarker = new mapboxgl.Marker({ element: customerEl, draggable: true })
      .setLngLat([customerLocation.lng, customerLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<p>Адрес доставки</p>'))
      .addTo(map);

    customerMarkerRef.current = customerMarker;

    // Handle marker drag
    customerMarker.on('dragend', () => {
      const lngLat = customerMarker.getLngLat();
      const newLocation = { lat: lngLat.lat, lng: lngLat.lng };
      setCustomerLocation(newLocation);
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current(newLocation);
      }
    });

    // Fetch route from Mapbox Directions API (fitBounds теперь внутри fetchRoute)
    fetchRoute(customerLocation);
  }, [customerLocation, mapLoaded]); // Убрали onLocationSelect из зависимостей!

  // Fetch route from Mapbox Directions API (БЕЗ автоматического зума)
  const fetchRoute = async (destination: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${RESTAURANT_LOCATION.lng},${RESTAURANT_LOCATION.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const map = mapRef.current;
        if (!map) return;

        // Remove old route layer
        if (map.getLayer('route')) {
          map.removeLayer('route');
        }
        if (map.getSource('route')) {
          map.removeSource('route');
        }

        // Add new route layer (скрытая, пока не нажата кнопка)
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#22c55e', // Зелёный бренд доставки
            'line-width': 5,
            'line-opacity': 0.9,
          },
        });

        // Сохраняем координаты маршрута для анимации
        const coords = route.geometry.coordinates as [number, number][];
        setRouteCoordinates(coords);

        // Показываем весь маршрут сразу (без задержки)
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([RESTAURANT_LOCATION.lng, RESTAURANT_LOCATION.lat]);
        bounds.extend([destination.lng, destination.lat]);
        map.fitBounds(bounds, { 
          padding: 80, 
          duration: 1000,
          maxZoom: 15 
        });

        // Calculate distance and duration
        const distanceKm = route.distance / 1000;
        const durationMinutes = Math.ceil(route.duration / 60);

        if (onDistanceCalculatedRef.current) {
          onDistanceCalculatedRef.current(distanceKm, durationMinutes);
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // 🚗 Анимация курьера по маршруту с динамической линией
  const animateCourier = () => {
    if (routeCoordinates.length === 0 || !mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    
    // 1️⃣ СНАЧАЛА: Показываем адрес клиента с зумом
    const destinationCoord = routeCoordinates[routeCoordinates.length - 1];
    map.flyTo({
      center: destinationCoord,
      zoom: 16, // Крупный зум на адрес клиента
      duration: 1500,
      essential: true,
    });

    // 2️⃣ ПОТОМ: Через 2 секунды показываем весь маршрут и запускаем анимацию
    setTimeout(() => {
      // Удаляем старый маркер курьера если есть
      if (courierMarkerRef.current) {
        courierMarkerRef.current.remove();
      }

      // Удаляем старую линию маршрута (будем рисовать новую динамически)
      if (map.getLayer('route')) {
        map.removeLayer('route');
      }
      if (map.getSource('route')) {
        map.removeSource('route');
      }

      // Создаём source для анимированной линии (изначально пустая)
      map.addSource('animated-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      // Добавляем слой для анимированной линии (яркая зелёная)
      map.addLayer({
        id: 'animated-route',
        type: 'line',
        source: 'animated-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981', // Яркий зелёный
          'line-width': 6,
          'line-opacity': 1,
        },
      });

      // Добавляем пунктирную линию впереди курьера (серая)
      map.addSource('remaining-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      map.addLayer({
        id: 'remaining-route',
        type: 'line',
        source: 'remaining-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#6b7280', // Серая
          'line-width': 4,
          'line-opacity': 0.5,
          'line-dasharray': [2, 2], // Пунктир
        },
      });

      // 🛵 Создаём маркер курьера
      const courierEl = document.createElement('div');
      courierEl.style.width = '48px';
      courierEl.style.height = '48px';
      courierEl.style.display = 'flex';
      courierEl.style.alignItems = 'center';
      courierEl.style.justifyContent = 'center';
      courierEl.style.transition = 'all 0.3s ease';
      
      courierEl.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <ellipse cx="24" cy="42" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>
          <circle cx="24" cy="24" r="18" fill="#22c55e"/>
          <circle cx="24" cy="24" r="18" fill="url(#greenGradient)"/>
          <circle cx="24" cy="24" r="18" stroke="white" stroke-width="3" fill="none"/>
          <g transform="translate(24, 24)">
            <circle cx="-6" cy="4" r="3" fill="white" stroke="white" stroke-width="1.5"/>
            <circle cx="6" cy="4" r="3" fill="white" stroke="white" stroke-width="1.5"/>
            <path d="M -6 4 L -3 0 L 3 0 L 6 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="0" cy="-4" r="2.5" fill="white"/>
            <rect x="-2" y="-1" width="4" height="3" fill="white" rx="1"/>
          </g>
          <defs>
            <radialGradient id="greenGradient">
              <stop offset="0%" stop-color="#22c55e"/>
              <stop offset="100%" stop-color="#16a34a"/>
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="20" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.4">
            <animate attributeName="r" from="18" to="26" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `;

      const courierMarker = new mapboxgl.Marker({ 
        element: courierEl,
        anchor: 'center'
      })
        .setLngLat(routeCoordinates[0])
        .addTo(map);

      courierMarkerRef.current = courierMarker;
      setIsAnimating(true);

      let currentIndex = 0;
      const totalPoints = routeCoordinates.length;
      const animationDuration = 10000; // 10 секунд
      const animationSpeed = animationDuration / totalPoints;

      // Массив пройденных координат (для зелёной линии)
      const traveledCoords: [number, number][] = [routeCoordinates[0]];

      const animate = () => {
        if (currentIndex >= totalPoints - 1) {
          setIsAnimating(false);
          courierEl.style.transform = 'scale(1.3)';
          setTimeout(() => {
            courierEl.style.transform = 'scale(1)';
            courierMarker.setPopup(
              new mapboxgl.Popup({ offset: 25, closeButton: false })
                .setHTML('<div style="text-align:center;padding:8px;"><strong>🎉 Доставлено!</strong><br/>Приятного аппетита</div>')
            ).togglePopup();
          }, 300);
          return;
        }

        const nextCoord = routeCoordinates[currentIndex];
        const prevCoord = currentIndex > 0 ? routeCoordinates[currentIndex - 1] : nextCoord;
        
        // Добавляем текущую координату в пройденный путь
        traveledCoords.push(nextCoord);
        
        // Обновляем зелёную линию (пройденный путь)
        const animatedSource = map.getSource('animated-route') as mapboxgl.GeoJSONSource;
        if (animatedSource) {
          animatedSource.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: traveledCoords
            }
          });
        }

        // Обновляем серую пунктирную линию (оставшийся путь)
        const remainingSource = map.getSource('remaining-route') as mapboxgl.GeoJSONSource;
        if (remainingSource) {
          remainingSource.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates.slice(currentIndex)
            }
          });
        }
        
        // Рассчитываем угол поворота
        const angle = Math.atan2(
          nextCoord[1] - prevCoord[1],
          nextCoord[0] - prevCoord[0]
        ) * (180 / Math.PI);
        
        courierEl.style.transform = `rotate(${angle + 90}deg)`;
        courierMarker.setLngLat(nextCoord);
        
        // Камера следует за курьером
        if (currentIndex % 3 === 0) {
          map.easeTo({
            center: nextCoord,
            duration: animationSpeed * 3,
            easing: (t) => t,
          });
        }

        currentIndex++;
        animationFrameRef.current = window.setTimeout(animate, animationSpeed);
      };

      // 3️⃣ Показываем весь маршрут от ресторана до клиента
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(routeCoordinates[0]);
      bounds.extend(routeCoordinates[routeCoordinates.length - 1]);
      map.fitBounds(bounds, { 
        padding: 100, 
        duration: 1500,
        maxZoom: 14
      });

      // 4️⃣ Запускаем анимацию курьера через 1.5 секунды
      setTimeout(animate, 1500);
    }, 2000); // Ждём 2 секунды после показа адреса клиента
  };

  // Останавливаем анимацию при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
      // Очищаем анимированные слои
      const map = mapRef.current;
      if (map) {
        if (map.getLayer('animated-route')) map.removeLayer('animated-route');
        if (map.getSource('animated-route')) map.removeSource('animated-route');
        if (map.getLayer('remaining-route')) map.removeLayer('remaining-route');
        if (map.getSource('remaining-route')) map.removeSource('remaining-route');
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden"
      />
      
      {/* Кнопка запуска анимации */}
      {routeCoordinates.length > 0 && !isAnimating && (
        <button
          onClick={animateCourier}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Показать доставку
        </button>
      )}

      {/* Индикатор анимации */}
      {isAnimating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-green-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
          </svg>
          Курьер в пути...
        </div>
      )}
    </div>
  );
}
