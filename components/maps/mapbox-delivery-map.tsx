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
  const [mapLoaded, setMapLoaded] = useState(false);
  const initializingRef = useRef(false); // Флаг для предотвращения двойной инициализации
  
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

  // Fetch route from Mapbox Directions API
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

        // Add new route layer
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

        // Авто-fit маршрута с padding
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([RESTAURANT_LOCATION.lng, RESTAURANT_LOCATION.lat]);
        bounds.extend([destination.lng, destination.lat]);
        map.fitBounds(bounds, { 
          padding: 80, 
          duration: 1000, // Плавная анимация
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

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
    />
  );
}
