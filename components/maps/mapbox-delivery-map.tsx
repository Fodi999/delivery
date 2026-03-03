'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { RESTAURANT_LOCATION } from '@/lib/constants';
import { toast } from 'sonner';

interface MapboxDeliveryMapProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  onDistanceCalculated?: (distance: number, duration: number) => void;
  externalLocation?: { lat: number; lng: number } | null;
  autoStartCourier?: boolean;
  triggerCourierAnimation?: boolean;
  onRestartDemo?: () => void;
  bottomOffset?: number;
  language?: 'pl' | 'ru' | 'uk' | 'en';
}

export function MapboxDeliveryMap({
  onLocationSelect,
  onDistanceCalculated,
  externalLocation,
  autoStartCourier = false,
  triggerCourierAnimation = false,
  onRestartDemo,
  bottomOffset = 0,
  language = 'pl',
}: MapboxDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const restaurantMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const courierMarkerRef = useRef<mapboxgl.Marker | null>(null); // Маркер курьера
  const [mapLoaded, setMapLoaded] = useState(false);
  const initializingRef = useRef(false); // Флаг для предотвращения двойной инициализации
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]); // Координаты маршрута
  const routeCoordinatesRef = useRef<[number, number][]>([]); // Ref-копия — не ломает размер deps
  const [isAnimating, setIsAnimating] = useState(false); // Флаг анимации
  const [isDelivered, setIsDelivered] = useState(false); // Флаг завершения доставки
  const animationFrameRef = useRef<number | null>(null); // ID анимации
  
  // Refs для колбэков чтобы избежать бесконечного цикла
  const onLocationSelectRef = useRef(onLocationSelect);
  const onDistanceCalculatedRef = useRef(onDistanceCalculated);
  // Стабильная ссылка на animateCourier — не меняет размер deps в useEffect
  const animateCourierRef = useRef<() => void>(() => {});
  
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

    if (containerHeight === 0 || containerWidth === 0) {
      console.error('❌ Container has zero dimensions! Check parent CSS.');
      initializingRef.current = false;
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Stable premium dark style to avoid incidents 404s
      center: [RESTAURANT_LOCATION.lng, RESTAURANT_LOCATION.lat],
      zoom: 12,
      // UX для доставки - минимум взаимодействия
      scrollZoom: false,
      doubleClickZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
      antialias: true // For smoother lines
    });

    // Navigation controls removed — using custom zoom buttons in JSX

    // Wait for map to load before adding markers
    map.on('load', () => {
      setMapLoaded(true);
      
      // 🏪 Кастомный маркер ресторана Bolt-style (очень чистый)
      const restaurantEl = document.createElement('div');
      restaurantEl.className = 'restaurant-marker';
      restaurantEl.style.width = '48px';
      restaurantEl.style.height = '48px';
      restaurantEl.style.borderRadius = '20px'; // Rounded square
      restaurantEl.style.backgroundColor = '#000'; // Black background
      restaurantEl.style.border = '2px solid rgba(255,255,255,0.2)';
      restaurantEl.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      restaurantEl.style.cursor = 'pointer';
      restaurantEl.style.display = 'flex';
      restaurantEl.style.alignItems = 'center';
      restaurantEl.style.justifyContent = 'center';
      restaurantEl.style.transition = 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
      
      // SVG иконка ресторана
      restaurantEl.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      `;

      restaurantEl.addEventListener('mouseenter', () => {
        restaurantEl.style.transform = 'scale(1.1) translateY(-2px)';
        restaurantEl.style.borderColor = '#22c55e';
      });
      restaurantEl.addEventListener('mouseleave', () => {
        restaurantEl.style.transform = 'scale(1) translateY(0)';
        restaurantEl.style.borderColor = 'rgba(255,255,255,0.2)';
      });

      const restaurantMarker = new mapboxgl.Marker({ element: restaurantEl })
        .setLngLat([RESTAURANT_LOCATION.lng, RESTAURANT_LOCATION.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div style="padding:10px;text-align:center;color:#000;">
              <span style="font-size:24px;display:block;">🍱</span>
              <strong style="font-size:12px;display:block;margin-top:4px;">РЕСТОРАН 🍣</strong>
              <div style="font-size:10px;opacity:0.5;">Готовим для вас с любовью</div>
            </div>
          `)
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

    // 🏠 Кастомный маркер клиента Bolt-style (чистый белый на синем фоне)
    const customerEl = document.createElement('div');
    customerEl.className = 'customer-marker';
    customerEl.style.position = 'relative';
    customerEl.style.width = '40px';
    customerEl.style.height = '40px';
    customerEl.style.display = 'flex';
    customerEl.style.alignItems = 'center';
    customerEl.style.justifyContent = 'center';
    
    // Пульсирующий круг (внешний) - плавное свечение 2026
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.width = '100%';
    pulse.style.height = '100%';
    pulse.style.borderRadius = '50%';
    pulse.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0) 70%)';
    pulse.style.animation = 'pulse-2026 3s ease-out infinite';
    
    // Основной круг (внутренний) - 3D эффект как в Bolt
    const core = document.createElement('div');
    core.style.position = 'relative';
    core.style.width = '32px';
    core.style.height = '32px';
    core.style.borderRadius = '50%';
    core.style.backgroundColor = '#3b82f6';
    core.style.border = '3px solid white';
    core.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)';
    core.style.display = 'flex';
    core.style.alignItems = 'center';
    core.style.justifyContent = 'center';
    core.style.transition = 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
    
    // SVG иконка локации/пина
    core.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
      </svg>
    `;
    
    customerEl.appendChild(pulse);
    customerEl.appendChild(core);

    customerEl.addEventListener('mouseenter', () => {
      core.style.transform = 'scale(1.2) translateY(-4px)';
      core.style.backgroundColor = '#2563eb';
    });
    customerEl.addEventListener('mouseleave', () => {
      core.style.transform = 'scale(1) translateY(0)';
      core.style.backgroundColor = '#3b82f6';
    });

    const customerMarker = new mapboxgl.Marker({ 
      element: customerEl, 
      draggable: true,
      anchor: 'center'
    })
      .setLngLat([customerLocation.lng, customerLocation.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="padding:10px;text-align:center;color:#000;">
              <span style="font-size:24px;display:block;">🏠</span>
              <strong style="font-size:12px;display:block;margin-top:4px;">ВАШ АДРЕС 📍</strong>
              <div style="font-size:10px;opacity:0.5;">Перетащите для точности</div>
            </div>
          `)
      )
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
        // overview=full   — полная геометрия по дорогам, без упрощения
        // geometries=geojson — координаты в формате GeoJSON
        // steps=true       — детализация по шагам (максимум точек)
        // annotations=distance — расстояние между точками для плавной анимации
        `https://api.mapbox.com/directions/v5/mapbox/driving/${RESTAURANT_LOCATION.lng},${RESTAURANT_LOCATION.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&steps=true&annotations=distance&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const map = mapRef.current;
        if (!map) return;

        // Remove old route layers in correct order
        if (map.getLayer('route')) {
          map.removeLayer('route');
        }
        if (map.getLayer('route-glow')) {
          map.removeLayer('route-glow');
        }
        
        // Now it's safe to remove the source
        if (map.getSource('route')) {
          map.removeSource('route');
        }

        // Create sources for route
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        });

        // 🌟 BOLT GLOW EFFECT (Wide line, low opacity)
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#22c55e',
            'line-width': 12,
            'line-opacity': 0.15,
            'line-blur': 3,
          },
        });

        // 🟢 MAIN BOLT ROUTE
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#22c55e',
            'line-width': 4.5,
            'line-opacity': 0.9,
          },
        });

        // Сохраняем координаты маршрута для анимации
        const coords = route.geometry.coordinates as [number, number][];
        routeCoordinatesRef.current = coords; // ref обновляется синхронно
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

      // Сначала очищаем ВСЕ старые анимированные слои и источники перед созданием новых
      if (map.getLayer('animated-route')) map.removeLayer('animated-route');
      if (map.getLayer('animated-route-glow')) map.removeLayer('animated-route-glow');
      if (map.getSource('animated-route')) map.removeSource('animated-route');
      
      if (map.getLayer('remaining-route')) map.removeLayer('remaining-route');
      if (map.getSource('remaining-route')) map.removeSource('remaining-route');

      // Удаляем старую статичную линию маршрута
      if (map.getLayer('route')) map.removeLayer('route');
      if (map.getLayer('route-glow')) map.removeLayer('route-glow');
      if (map.getSource('route')) map.removeSource('route');

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

      // 🌟 BOLT GLOW EFFECT (ANIMATED)
      map.addLayer({
        id: 'animated-route-glow',
        type: 'line',
        source: 'animated-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#22c55e',
          'line-width': 12,
          'line-opacity': 0.15,
          'line-blur': 4,
        },
      });

      // 🟢 MAIN ENHANCED LINE (Bolt Primary Green)
      map.addLayer({
        id: 'animated-route',
        type: 'line',
        source: 'animated-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#22c55e',
          'line-width': 5,
          'line-opacity': 1,
        },
      });

      // Добавляем оставшийся путь (серая линия)
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
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': 'rgba(255,255,255,0.08)',
          'line-width': 3,
          'line-dasharray': [1, 2],
        },
      });

      // 🛵 BOLT COURIER MARKER (Scooter/Car High Quality SVG)
      const courierEl = document.createElement('div');
      courierEl.style.width = '56px';
      courierEl.style.height = '56px';
      courierEl.style.display = 'flex';
      courierEl.style.alignItems = 'center';
      courierEl.style.justifyContent = 'center';
      courierEl.style.filter = 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))';
      courierEl.style.transition = 'transform 0.1s linear';
      
      courierEl.innerHTML = `
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          <!-- Main Body -->
          <circle cx="32" cy="32" r="26" fill="black" stroke="#22c55e" stroke-width="2"/>
          
          <!-- Animated Ring -->
          <circle cx="32" cy="32" r="30" stroke="#22c55e" stroke-width="2" opacity="0.4">
            <animate attributeName="r" from="28" to="34" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
          </circle>

          <!-- Vehicle Icon (Scooter approach) -->
          <g transform="translate(18, 18) scale(1.2)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white" opacity="0.1"/>
            <path d="M8 17L5 20M16 17L19 20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <rect x="7" y="5" width="10" height="12" rx="2" fill="white" stroke="#22c55e" stroke-width="1.5"/>
            <circle cx="12" cy="11" r="3" fill="#22c55e"/>
          </g>
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
      setIsDelivered(false);

      const totalPoints = routeCoordinates.length;
      const ANIMATION_DURATION = 12000; // мс — полное время доставки

      // Массив пройденных координат (для зелёной линии)
      const traveledCoords: [number, number][] = [routeCoordinates[0]];

      // Предварительно вычисляем накопленные расстояния между точками
      // чтобы курьер двигался с постоянной скоростью, а не "прыгал"
      const segLengths: number[] = [];
      let totalLength = 0;
      for (let i = 1; i < totalPoints; i++) {
        const dx = routeCoordinates[i][0] - routeCoordinates[i - 1][0];
        const dy = routeCoordinates[i][1] - routeCoordinates[i - 1][1];
        const len = Math.sqrt(dx * dx + dy * dy);
        segLengths.push(len);
        totalLength += len;
      }
      // Накопленная длина в долях [0..1]
      const cumulative: number[] = [0];
      let acc = 0;
      for (const len of segLengths) {
        acc += len / totalLength;
        cumulative.push(acc);
      }

      let startTime: number | null = null;
      let lastSegIndex = 0; // оптимизация: не ищем с нуля каждый кадр

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1); // 0..1

        // Находим сегмент соответствующий текущему прогрессу
        let segIdx = lastSegIndex;
        while (segIdx < totalPoints - 2 && cumulative[segIdx + 1] <= progress) {
          segIdx++;
        }
        lastSegIndex = segIdx;

        // Интерполируем позицию внутри сегмента
        const segStart = cumulative[segIdx];
        const segEnd = cumulative[segIdx + 1] ?? 1;
        const segT = segEnd > segStart ? (progress - segStart) / (segEnd - segStart) : 0;

        const p0 = routeCoordinates[segIdx];
        const p1 = routeCoordinates[Math.min(segIdx + 1, totalPoints - 1)];

        // Линейная интерполяция — точка лежит строго на линии сегмента
        const lng = p0[0] + (p1[0] - p0[0]) * segT;
        const lat = p0[1] + (p1[1] - p0[1]) * segT;
        const current: [number, number] = [lng, lat];

        // Угол поворота курьера по направлению движения
        const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * (180 / Math.PI);
        courierEl.style.transform = `rotate(${angle + 90}deg)`;
        courierMarker.setLngLat(current);

        // Обновляем пройденный путь (зелёная линия) только при смене сегмента
        if (segIdx >= traveledCoords.length - 1) {
          for (let i = traveledCoords.length - 1; i <= segIdx; i++) {
            traveledCoords.push(routeCoordinates[i + 1]);
          }
          const animatedSource = map.getSource('animated-route') as mapboxgl.GeoJSONSource;
          if (animatedSource) {
            animatedSource.setData({
              type: 'Feature', properties: {},
              geometry: { type: 'LineString', coordinates: [...traveledCoords, current] }
            });
          }
          // Обновляем оставшийся путь (серая пунктирная линия)
          const remainingSource = map.getSource('remaining-route') as mapboxgl.GeoJSONSource;
          if (remainingSource) {
            remainingSource.setData({
              type: 'Feature', properties: {},
              geometry: { type: 'LineString', coordinates: [current, ...routeCoordinates.slice(segIdx + 1)] }
            });
          }
        }

        // Камера плавно следует за курьером
        map.easeTo({ center: current, duration: 200, easing: (t) => t });

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
        } else {
          // Финиш
          setIsAnimating(false);
          setIsDelivered(true);
          courierEl.innerHTML = `
            <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#22c55e;border-radius:50%;box-shadow:0 8px 24px rgba(34,197,94,0.5);border:3px solid white;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          `;
          courierEl.style.transform = 'scale(1.3)';
          setTimeout(() => {
            courierEl.style.transform = 'scale(1)';
            const deliveredLabels = {
              pl: { title: 'Dostarczono! 🎉', desc: 'Smacznego!' },
              ru: { title: 'Доставлено! 🎉',  desc: 'Приятного аппетита!' },
              uk: { title: 'Доставлено! 🎉',  desc: 'Смачного!' },
              en: { title: 'Delivered! 🎉',    desc: 'Enjoy your meal!' },
            }[language];
            toast.success(deliveredLabels.title, {
              id: 'courier-delivered',
              description: deliveredLabels.desc,
              duration: 5000,
            });
          }, 300);
        }
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

      // 4️⃣ Запускаем анимацию через requestAnimationFrame — плавно, строго по дороге
      setTimeout(() => {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      }, 1500);
    }, 2000); // Ждём 2 секунды после показа адреса клиента
  };
  // Обновляем ref на актуальную версию функции после каждого рендера
  animateCourierRef.current = animateCourier;

  // ✅ AUTOSTART COURIER ANIMATION (2026 Bolt-style UX)
  // routeCoordinates — массив, его нельзя класть в deps (React раскладывает элементы → меняет размер)
  // Вместо этого следим за его длиной (примитив) и читаем актуальные данные через ref
  useEffect(() => {
    if (autoStartCourier && routeCoordinatesRef.current.length > 0 && !isAnimating && !isDelivered) {
      console.log('🚀 Autostarting courier animation...');
      const timer = setTimeout(() => {
        animateCourierRef.current();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStartCourier, routeCoordinates.length, isAnimating, isDelivered]);

  // 🎬 TRIGGER FROM COUNTDOWN — запускает анимацию когда счётчик переходит в фазу "delivery"
  useEffect(() => {
    if (triggerCourierAnimation && routeCoordinatesRef.current.length > 0 && !isAnimating && !isDelivered) {
      const timer = setTimeout(() => {
        animateCourierRef.current();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [triggerCourierAnimation, isAnimating, isDelivered]);

  // Останавливаем анимацию при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      // Очищаем анимированные слои
      const map = mapRef.current;
      if (map) {
        if (map.getLayer('animated-route')) map.removeLayer('animated-route');
        if (map.getLayer('animated-route-glow')) map.removeLayer('animated-route-glow');
        if (map.getSource('animated-route')) map.removeSource('animated-route');
        if (map.getLayer('remaining-route')) map.removeLayer('remaining-route');
        if (map.getSource('remaining-route')) map.removeSource('remaining-route');
        if (map.getLayer('route-glow')) map.removeLayer('route-glow');
        if (map.getLayer('route')) map.removeLayer('route');
        if (map.getSource('route')) map.removeSource('route');
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden"
      />
      
      {/* Кнопка запуска анимации - Premium 2026 Bolt Style */}
      {routeCoordinates.length > 0 && !isAnimating && (
        <button
          onClick={() => {
            // Запускаем счётчик и карту одновременно
            onRestartDemo?.();
            animateCourier();
          }}
          style={{ bottom: `calc(1.5rem + ${bottomOffset}px)` }}
          className="absolute left-1/2 -translate-x-1/2 z-10 bg-[#22c55e] hover:bg-[#1ea350] text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 transition-all transform active:scale-95 hover:scale-105 border-b-4 border-black/20 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
          </svg>
          {isDelivered ? 'Запустить ещё раз' : 'Показать доставку'}
        </button>
      )}

      {/* Кастомные кнопки масштаба — правый нижний угол */}
      <div
        className="absolute right-4 z-10 flex flex-col gap-1.5"
        style={{ bottom: `calc(1.5rem + ${bottomOffset}px)` }}
      >
        <button
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
          className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-xl border transition-all duration-200 hover:scale-110 active:scale-90 bg-black/70 border-white/15 text-white hover:bg-black/90"
          aria-label="Zoom in"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
          className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-xl border transition-all duration-200 hover:scale-110 active:scale-90 bg-black/70 border-white/15 text-white hover:bg-black/90"
          aria-label="Zoom out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Индикатор анимации */}
      {isAnimating && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 glass px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Scooter icon SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
            <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
            <path d="M5 17H3v-4l2-5h8l2 5h1a2 2 0 0 1 0 4h-1"/>
            <path d="M13 8V4"/>
          </svg>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] opacity-50 leading-none mb-0.5">Статус</span>
            <span className="text-xs font-black uppercase tracking-widest leading-tight">Курьер в пути</span>
          </div>
          <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse ml-1" />
        </div>
      )}

      {/* Индикатор завершения — убран, используется toast */}
    </div>
  );
}
