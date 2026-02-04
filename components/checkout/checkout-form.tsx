"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { MapboxDeliveryMap } from "@/components/maps/mapbox-delivery-map";
import { useApp } from "@/context/app-context";
import { useCartStore } from "@/store/cart-store";
import { translations } from "@/lib/translations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Order } from "@/lib/order-types";
import {
  calculateDeliveryPrice,
  formatDeliveryTime,
  type DeliveryCalculation,
} from "@/lib/delivery-calculator";
import { useCustomerLookup } from "@/lib/hooks/use-customer-lookup";
import { formatPrice } from "@/lib/price";
import { menuItems } from "@/lib/menu-data";
import { PersonSelector } from "./core/PersonSelector";
import { AIRecommendationCard, AISuggestions } from "./ai/AIRecommendations";
import { DeliveryMapSection } from "./delivery/DeliveryMapSection";

export function CheckoutForm() {
  const { isDark, language, city } = useApp();
  const clear = useCartStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const total = useCartStore((s) => s.total());
  const items = useCartStore((s) => s.items);
  const router = useRouter();
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    comment: "",
    numberOfPeople: 1, // Количество персон
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryCalculation | null>(
    null
  );
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 🤖 AI-генерированное приветствие
  const [aiWelcomeMessage, setAiWelcomeMessage] = useState<string>("");
  const [aiDescription, setAiDescription] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // 🍱 AI рекомендации по количеству еды
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // 🚚 AI помощник для доставки
  const [aiDeliveryMessage, setAiDeliveryMessage] = useState<string>("");
  const [aiDeliverySuggestions, setAiDeliverySuggestions] = useState<string[]>([]);

  // 🔥 Автозаполнение по номеру телефона
  const { lookupCustomer, loading: loadingCustomer, customerData } = useCustomerLookup();

  // Автоматический поиск клиента при вводе полного номера телефона
  useEffect(() => {
    const cleanPhone = formData.phone.replace(/\D/g, "");
    
    // Если введено 9 цифр (полный польский номер без +48)
    if (cleanPhone.length === 9) {
      const fullPhone = `+48${cleanPhone}`;
      lookupCustomer(fullPhone);
    }
  }, [formData.phone, lookupCustomer]);

  // Автозаполнение формы при нахождении постоянного клиента
  useEffect(() => {
    if (customerData && customerData.isReturning) {
      console.log("🔍 Customer data received:", customerData);
      
      setFormData(prev => ({
        ...prev,
        name: customerData.name || prev.name,
        address: customerData.address || prev.address,
      }));

      // 🤖 Генерируем AI приветствие
      const generateAIWelcome = async () => {
        setIsGeneratingAI(true);
        try {
          const response = await fetch("/api/ai/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerStats: {
                name: customerData.name,
                totalOrders: customerData.totalOrders || 0,
                completedOrders: customerData.completedOrders || 0,
                totalSpent: customerData.totalSpent || 0,
                lastOrderDate: customerData.lastOrderDate,
              },
              language,
            }),
          });

          if (response.ok) {
            const { welcomeMessage, description } = await response.json();
            console.log("🤖 AI generated:", { welcomeMessage, description });

            // Сохраняем AI сообщения в состояние
            setAiWelcomeMessage(welcomeMessage);
            setAiDescription(description);

            // Показываем AI-генерированное приветствие
            toast.success(`🎉 ${welcomeMessage}`, {
              description: description || getOrderStats(),
              duration: 5000,
            });
          } else {
            // Fallback на обычное приветствие
            showDefaultWelcome();
          }
        } catch (error) {
          console.error("AI welcome error:", error);
          showDefaultWelcome();
        } finally {
          setIsGeneratingAI(false);
        }
      };

      // Функция для получения статистики заказов
      const getOrderStats = () => {
        const getOrderText = (count: number) => {
          if (language === "pl") {
            if (count === 1) return "1 zamówienie";
            if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
              return `${count} zamówienia`;
            }
            return `${count} zamówień`;
          } else if (language === "ru") {
            if (count === 1) return "1 заказ";
            if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
              return `${count} заказа`;
            }
            return `${count} заказов`;
          } else if (language === "uk") {
            if (count === 1) return "1 замовлення";
            if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
              return `${count} замовлення`;
            }
            return `${count} замовлень`;
          } else {
            return count === 1 ? "1 order" : `${count} orders`;
          }
        };

        const orderText = customerData.totalOrders 
          ? getOrderText(customerData.totalOrders)
          : "";

        const spentText = customerData.totalSpent && customerData.totalSpent > 0
          ? ` • ${formatPrice(customerData.totalSpent)}`
          : "";

        return `${orderText}${spentText}`;
      };

      // Fallback приветствие без AI
      const showDefaultWelcome = () => {
        const welcomeMessage = language === "pl"
          ? "Witaj ponownie"
          : language === "ru"
          ? "Рады видеть снова"
          : language === "uk"
          ? "Раді бачити знову"
          : "Welcome back";

        setAiWelcomeMessage(welcomeMessage);

        toast.success(`🎉 ${welcomeMessage}`, {
          description: getOrderStats(),
          duration: 4000,
        });
      };

      // Запускаем генерацию AI приветствия
      generateAIWelcome();
    }
  }, [customerData, language]);

  // 🍱 AI рекомендация по количеству еды при изменении количества персон
  useEffect(() => {
    if (formData.numberOfPeople > 0 && items.length > 0) {
      const generateFoodRecommendation = async () => {
        try {
          const response = await fetch("/api/ai/food-recommendation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              numberOfPeople: formData.numberOfPeople,
              cartItems: items.map(item => ({
                id: item.id,
                name: item.name[language] || item.name.en,
                quantity: item.quantity,
                price: item.price,
              })),
              language,
            }),
          });

          if (response.ok) {
            const { recommendation, isEnough } = await response.json();
            console.log("🍱 AI food recommendation:", recommendation, "isEnough:", isEnough);
            setAiRecommendation(recommendation);
            
            // 🎯 Генерируем умные предложения на основе рекомендации
            generateSmartSuggestions(isEnough);
          }
        } catch (error) {
          console.error("AI food recommendation error:", error);
        }
      };

      // Debounce: ждём 500ms перед запросом
      const timer = setTimeout(generateFoodRecommendation, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.numberOfPeople, items, language]);

  // 🎯 Генерация умных предложений
  const generateSmartSuggestions = async (isEnough: boolean) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name[language] || item.name.en,
            quantity: item.quantity,
            price: item.price,
          })),
          numberOfPeople: formData.numberOfPeople,
          isEnough,
          language,
        }),
      });

      if (response.ok) {
        const { suggestions } = await response.json();
        console.log("🎯 AI suggestions:", suggestions);
        setAiSuggestions(suggestions);
      }
    } catch (error) {
      console.error("AI suggestions error:", error);
      // Fallback предложения
      setAiSuggestions(
        isEnough
          ? ["Добавить соус", "Десерт", "Напиток"]
          : ["Добавить ролл", "Добавить суп", "Добавить лапшу"]
      );
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // 🛒 Обработчик клика на предложение - добавление в корзину
  const handleSuggestionClick = (suggestionName: string) => {
    // Ищем блюдо в меню по названию
    const menuItem = menuItems.find((item) => {
      const itemName = item.nameTranslations[language as keyof typeof item.nameTranslations] || item.name;
      return itemName.toLowerCase() === suggestionName.toLowerCase() ||
             itemName.toLowerCase().includes(suggestionName.toLowerCase()) ||
             suggestionName.toLowerCase().includes(itemName.toLowerCase());
    });

    if (menuItem) {
      // Добавляем в корзину
      addItem({
        id: menuItem.id,
        name: menuItem.nameTranslations,
        price: menuItem.price,
        image: menuItem.image,
      });

      toast.success(`✨ ${suggestionName}`, {
        description: language === "pl" ? `Dodano do koszyka • ${menuItem.price} zł` :
                   language === "ru" ? `Добавлено в корзину • ${menuItem.price} zł` :
                   language === "uk" ? `Додано до кошика • ${menuItem.price} zł` :
                   `Added to cart • ${menuItem.price} zł`,
        duration: 3000,
      });

      // Перегенерируем рекомендации после добавления
      setTimeout(() => {
        const updatedItems = [...items, {
          id: menuItem.id,
          name: suggestionName,
          quantity: 1,
          price: menuItem.price,
        }];
        // Запускаем перерасчёт рекомендации
        setAiSuggestions([]);
      }, 500);
    } else {
      // Если не нашли блюдо, показываем просто уведомление
      toast.success(`✨ ${suggestionName}`, {
        description: language === "pl" ? "Interesujący wybór!" :
                   language === "ru" ? "Интересный выбор!" :
                   language === "uk" ? "Цікавий вибір!" :
                   "Interesting choice!",
      });
    }
  };

  // Обработчик выбора локации на карте
  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    console.log("📍 Selected location:", location);
    setMapLocation(location);
  };

  // Обработчик расчёта расстояния
  const handleDistanceCalculated = (distance: number, duration: number) => {
    console.log("🧭 Distance:", distance, "km, Duration:", duration, "min");
    // Передаём duration из Google Directions API
    const delivery = calculateDeliveryPrice(distance, total, duration);
    setDeliveryInfo(delivery);

    if (!delivery.allowed) {
      toast.error(delivery.reason || "Доставка невозможна");
    } else {
      const timeRange = formatDeliveryTime(delivery.totalTime || 0);
      toast.success(
        `Доставка: ${delivery.isFree ? "Бесплатно" : `${delivery.price} zł`} • ${timeRange}`
      );
      
      // 🚚 Генерируем AI-сообщение о доставке
      generateDeliveryAssistant(delivery);
    }
  };

  // 🚚 Генерация AI-помощника доставки
  const generateDeliveryAssistant = async (delivery: DeliveryCalculation) => {
    try {
      const response = await fetch("/api/ai/delivery-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryInfo: {
            distance: delivery.distance,
            duration: delivery.duration,
            price: delivery.price,
            isFree: delivery.isFree,
            totalTime: delivery.totalTime,
          },
          cartTotal: total,
          language,
        }),
      });

      if (response.ok) {
        const { message, suggestions } = await response.json();
        console.log("🚚 AI delivery assistant:", { message, suggestions });
        setAiDeliveryMessage(message);
        setAiDeliverySuggestions(suggestions);
      }
    } catch (error) {
      console.error("AI delivery assistant error:", error);
    }
  };

  // 🚚 Обработчик клика на кнопку доставки
  const handleDeliverySuggestionClick = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();
    
    // Определяем действие по тексту кнопки
    if (lowerSuggestion.includes('адрес') || lowerSuggestion.includes('adres') || lowerSuggestion.includes('address')) {
      // Фокус на поле адреса
      document.querySelector('input[placeholder*="адрес"], input[placeholder*="adres"]')?.scrollIntoView({ behavior: 'smooth' });
      toast.success(suggestion);
    } else if (lowerSuggestion.includes('100') || lowerSuggestion.includes('добав') || lowerSuggestion.includes('dodaj') || lowerSuggestion.includes('add')) {
      // Предлагаем добавить блюда
      toast.success(suggestion, {
        description: language === "pl" ? "Sprawdź nasze sugestie powyżej" :
                   language === "ru" ? "Проверьте наши предложения выше" :
                   language === "uk" ? "Перевірте наші пропозиції вище" :
                   "Check our suggestions above",
      });
    } else if (lowerSuggestion.includes('коментар') || lowerSuggestion.includes('komentarz') || lowerSuggestion.includes('comment')) {
      // Фокус на комментарий
      document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth' });
      document.querySelector('textarea')?.focus();
      toast.success(suggestion);
    } else {
      // Просто показываем уведомление
      toast.success(suggestion);
    }
  };

  // Геокодирование адреса (текст → координаты) и установка на карте
  const handleFindAddressOnMap = async () => {
    if (!formData.address.trim()) {
      toast.error(
        language === "pl"
          ? "Wprowadź adres"
          : language === "ru"
          ? "Введите адрес"
          : language === "uk"
          ? "Введіть адресу"
          : "Enter address"
      );
      return;
    }

    setIsLoadingLocation(true);

    try {
      // Используем Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          formData.address
        )}.json?proximity=18.6466,54.3520&bbox=18.3,54.2,18.9,54.5&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        // Устанавливаем координаты на карте через callback
        setMapLocation({ lat, lng });

        toast.success(
          language === "pl"
            ? "Adres znaleziony na mapie"
            : language === "ru"
            ? "Адрес найден на карте"
            : language === "uk"
            ? "Адресу знайдено на карті"
            : "Address found on map"
        );
      } else {
        throw new Error("Address not found");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error(
        language === "pl"
          ? "Nie znaleziono adresu. Spróbuj pełny adres z numerem domu."
          : language === "ru"
          ? "Адрес не найден. Попробуйте полный адрес с номером дома."
          : language === "uk"
          ? "Адресу не знайдено. Спробуйте повну адресу з номером будинку."
          : "Address not found. Try full address with house number."
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Геолокация и reverse geocoding
  const handleUseLocation = async () => {
    setIsLoadingLocation(true);

    try {
      // Запрашиваем координаты (только по клику!)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Reverse geocoding через Nominatim (OpenStreetMap)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  "User-Agent": "DeliveryApp/1.0",
                },
              }
            );
            const data = await response.json();

            // Формируем адрес
            const address = data.address;
            const street = address.road || address.street || "";
            const houseNumber = address.house_number || "";
            const city = address.city || address.town || address.village || "";

            const fullAddress = `${street} ${houseNumber}, ${city}`.trim();

            setFormData({ ...formData, address: fullAddress });

            toast.success(
              language === "pl"
                ? "Adres wypełniony"
                : language === "ru"
                ? "Адрес заполнен"
                : language === "uk"
                ? "Адреса заповнена"
                : "Address filled",
              {
                description:
                  language === "pl"
                    ? "Możesz edytować ręcznie"
                    : language === "ru"
                    ? "Можно изменить вручную"
                    : language === "uk"
                    ? "Можна змінити вручну"
                    : "You can edit manually",
              }
            );
          } catch (error) {
            console.error("Geocoding error:", error);
            toast.error(
              language === "pl"
                ? "Nie udało się pobrać adresu"
                : language === "ru"
                ? "Не удалось получить адрес"
                : language === "uk"
                ? "Не вдалося отримати адресу"
                : "Failed to get address"
            );
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoadingLocation(false);

          if (error.code === error.PERMISSION_DENIED) {
            toast.error(
              language === "pl"
                ? "Brak dostępu do lokalizacji"
                : language === "ru"
                ? "Нет доступа к геолокации"
                : language === "uk"
                ? "Немає доступу до геолокації"
                : "Location access denied",
              {
                description:
                  language === "pl"
                    ? "Wypełnij adres ręcznie"
                    : language === "ru"
                    ? "Заполните адрес вручную"
                    : language === "uk"
                    ? "Заповніть адресу вручну"
                    : "Fill address manually",
              }
            );
          } else {
            toast.error(
              language === "pl"
                ? "Nie udało się określić lokalizacji"
                : language === "ru"
                ? "Не удалось определить местоположение"
                : language === "uk"
                ? "Не вдалося визначити місцезнаходження"
                : "Failed to get location"
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      setIsLoadingLocation(false);
    }
  };

  // Валидация телефона
  const validatePhone = (phone: string): boolean => {
    // Простая валидация: минимум 9 цифр
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 9;
  };

  // Проверка готовности формы
  const isFormValid =
    formData.name.trim().length > 0 &&
    formData.phone.trim().length > 0 &&
    validatePhone(formData.phone) &&
    formData.address.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error(
        language === "pl"
          ? "Wypełnij wszystkie pola"
          : language === "ru"
          ? "Заполните все поля"
          : language === "uk"
          ? "Заповніть всі поля"
          : "Fill all fields"
      );
      return;
    }

    if (!validatePhone(formData.phone)) {
      setPhoneError(
        language === "pl"
          ? "Nieprawidłowy numer telefonu"
          : language === "ru"
          ? "Неверный номер телефона"
          : language === "uk"
          ? "Невірний номер телефону"
          : "Invalid phone number"
      );
      return;
    }

    setIsSubmitting(true);

    // Формируем заказ для API
    const deliveryFeeInCents = deliveryInfo?.price 
      ? Math.round(deliveryInfo.price * 100) 
      : 0;
    
    const orderData = {
      items: items.map((item) => ({
        id: item.id,
        title: item.name[language] || item.name.en,
        price: item.price,
        quantity: item.quantity,
      })),
      total,
      customer: {
        name: formData.name.trim(),
        phone: `+48 ${formData.phone.trim()}`,
        address: formData.address.trim(),
      },
      deliveryFee: deliveryFeeInCents,
    };

    try {
      // Отправка заказа на backend
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Успех
        toast.success(t.checkout.orderSuccess, {
          description: t.checkout.orderSuccessHint,
          duration: 2000,
        });

        // Очищаем корзину
        clear();

        // Редирект на success страницу
        setTimeout(() => {
          router.push(`/order/success?orderId=${data.orderId}`);
        }, 1000);
      } else {
        // Ошибка от API
        throw new Error(data.error || "Order failed");
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error(
        language === "pl"
          ? "Nie udało się złożyć zamówienia"
          : language === "ru"
          ? "Не удалось оформить заказ"
          : language === "uk"
          ? "Не вдалося оформити замовлення"
          : "Failed to submit order",
        {
          description:
            language === "pl"
              ? "Spróbuj ponownie"
              : language === "ru"
              ? "Попробуйте снова"
              : language === "uk"
              ? "Спробуйте знову"
              : "Please try again",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl p-6 ${
        isDark ? "bg-neutral-900" : "bg-neutral-50"
      }`}
    >
      <h2 className="text-xl font-bold mb-6">{t.checkout.deliveryDetails}</h2>

      {/* 🤖 AI Badge постоянного клиента */}
      {customerData && customerData.isReturning && (
        <div
          className={`flex items-center gap-3 mb-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-br from-purple-950/60 via-pink-950/40 to-indigo-950/60 border-purple-700/50 shadow-lg shadow-purple-900/20"
              : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-purple-300/50 shadow-lg shadow-purple-200/30"
          }`}
        >
          <div className="relative">
            <span className="text-3xl animate-pulse">🤖</span>
            {isGeneratingAI && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
            )}
          </div>
          
          <div className="flex-1">
            {/* AI-генерированное приветствие */}
            <div className={`font-bold text-base mb-1 ${isDark ? "text-purple-100" : "text-purple-900"}`}>
              {isGeneratingAI ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-t-transparent border-purple-400 rounded-full animate-spin" />
                  {language === "pl" ? "Generowanie..." : language === "ru" ? "Генерация..." : language === "uk" ? "Генерація..." : "Generating..."}
                </span>
              ) : aiWelcomeMessage ? (
                aiWelcomeMessage
              ) : (
                language === "pl"
                  ? "Stały klient!"
                  : language === "ru"
                  ? "Постоянный клиент!"
                  : language === "uk"
                  ? "Постійний клієнт!"
                  : "Returning customer!"
              )}
            </div>
            
            {/* Статистика или AI описание */}
            <div className={`text-sm ${isDark ? "text-purple-300/90" : "text-purple-700/90"}`}>
              {aiDescription ? (
                <span className="italic">"{aiDescription}"</span>
              ) : (
                <>
                  {(() => {
                    const count = customerData.totalOrders || 0;
                    let orderText = "";
                    
                    if (language === "pl") {
                      if (count === 1) orderText = "1 zamówienie";
                      else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
                        orderText = `${count} zamówienia`;
                      } else {
                        orderText = `${count} zamówień`;
                      }
                    } else if (language === "ru") {
                      if (count === 1) orderText = "1 заказ";
                      else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
                        orderText = `${count} заказа`;
                      } else {
                        orderText = `${count} заказов`;
                      }
                    } else if (language === "uk") {
                      if (count === 1) orderText = "1 замовлення";
                      else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
                        orderText = `${count} замовлення`;
                      } else {
                        orderText = `${count} замовлень`;
                      }
                    } else {
                      orderText = count === 1 ? "1 order" : `${count} orders`;
                    }
                    
                    return orderText;
                  })()}
                  {customerData.totalSpent && customerData.totalSpent > 0 && ` • ${formatPrice(customerData.totalSpent)}`}
                </>
              )}
            </div>
          </div>
          
          {/* Индикатор загрузки или иконка успеха */}
          <div className="flex items-center">
            {isGeneratingAI ? (
              <span className="w-6 h-6 border-2 border-t-transparent border-purple-400 rounded-full animate-spin" />
            ) : aiWelcomeMessage ? (
              <span className="text-2xl">✨</span>
            ) : loadingCustomer ? (
              <span className="w-6 h-6 border-2 border-t-transparent border-purple-400 rounded-full animate-spin" />
            ) : (
              <span className="text-2xl">⭐</span>
            )}
          </div>
        </div>
      )}

      {/* Security badge */}
      <div
        className={`flex items-center gap-2 mb-4 text-sm ${
          isDark ? "text-neutral-400" : "text-neutral-600"
        }`}
      >
        <span>🔒</span>
        <span>
          {language === "pl"
            ? "Bez rejestracji • Płatność przy odbiorze"
            : language === "ru"
            ? "Без регистрации • Оплата при получении"
            : language === "uk"
            ? "Без реєстрації • Оплата при отриманні"
            : "No registration • Cash on delivery"}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            placeholder={t.checkout.name}
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
          />
        </div>

        <div>
          <PhoneInput
            value={formData.phone}
            onChange={(value) => {
              setFormData({ ...formData, phone: value });
              setPhoneError("");
            }}
            error={phoneError}
            isDark={isDark}
            required
          />
        </div>

        {/* 🍱 Количество персон с AI рекомендацией */}
        <PersonSelector
          numberOfPeople={formData.numberOfPeople}
          onChange={(value) => setFormData({ ...formData, numberOfPeople: value })}
          language={language}
          isDark={isDark}
        />
          
        {/* 🤖 AI рекомендация */}
        {aiRecommendation && (
          <AIRecommendationCard
            recommendation={aiRecommendation}
            isDark={isDark}
            language={language}
          />
        )}

        {/* AI предложения блюд */}
        {aiSuggestions.length > 0 && (
          <AISuggestions
            suggestions={aiSuggestions}
            onAddToCart={handleSuggestionClick}
            isLoading={isLoadingSuggestions}
            isDark={isDark}
          />
        )}

        {/* Адрес доставки */}
        <div className="space-y-2">
          <label className={`text-sm font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
            {language === "pl" ? "Adres dostawy" : 
             language === "ru" ? "Адрес доставки" : 
             language === "uk" ? "Адреса доставки" : 
             "Delivery address"}
          </label>
          
          <div className="flex gap-2">
            <Input
              placeholder={language === "pl" ? "ul. Długa 1/2" : 
                         language === "ru" ? "ул. Длинная 1/2" :
                         language === "uk" ? "вул. Довга 1/2" :
                         "Street and number"}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
            />
            
            <Button
              type="button"
              onClick={handleFindAddressOnMap}
              disabled={isLoadingLocation || !formData.address.trim()}
              variant="outline"
              className="whitespace-nowrap"
            >
              {isLoadingLocation ? (
                <span className="animate-spin">⏳</span>
              ) : (
                "🗺️"
              )}{" "}
              {language === "pl" ? "Znajdź" : 
               language === "ru" ? "Найти" :
               language === "uk" ? "Знайти" :
               "Find"}
            </Button>
          </div>
        </div>

        {/* Карта доставки */}
        <DeliveryMapSection
          mapLocation={mapLocation}
          onLocationSelect={handleLocationSelect}
          onDistanceCalculated={handleDistanceCalculated}
          deliveryInfo={deliveryInfo}
          isDark={isDark}
          language={language}
        />

        {/* AI помощник доставки */}
        {aiDeliveryMessage && (
          <div className={`p-4 rounded-xl border ${
            isDark 
              ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border-blue-700/30' 
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
          }`}>
            <div className="flex gap-3 mb-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#3b82f6" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                {aiDeliveryMessage}
              </p>
            </div>
            
            {aiDeliverySuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiDeliverySuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDeliverySuggestionClick(suggestion)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                      isDark
                        ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                        : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Комментарий */}
        <div>
          <Textarea
            placeholder={language === "pl" ? "Komentarz do zamówienia (opcjonalnie)" :
                       language === "ru" ? "Комментарий к заказу (необязательно)" :
                       language === "uk" ? "Коментар до замовлення (необов'язково)" :
                       "Order comment (optional)"}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
            rows={3}
          />
        </div>

        {/* Кнопка оформления */}
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full h-12 text-base font-semibold"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {language === "pl" ? "Przetwarzanie..." :
               language === "ru" ? "Обработка..." :
               language === "uk" ? "Обробка..." :
               "Processing..."}
            </span>
          ) : (
            <>
              {language === "pl" ? "Złóż zamówienie" :
               language === "ru" ? "Оформить заказ" :
               language === "uk" ? "Оформити замовлення" :
               "Place order"}
              {deliveryInfo && deliveryInfo.price && deliveryInfo.price > 0 && (
                <span className="ml-2 text-sm opacity-80">
                  ({language === "pl" ? "towary" : language === "ru" ? "товары" : language === "uk" ? "товари" : "items"}: {total} zł + 
                  {language === "pl" ? " dostawa" : language === "ru" ? " доставка" : language === "uk" ? " доставка" : " delivery"}: {deliveryInfo.price} zł)
                </span>
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Добавляем CSS для анимации пульсации
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.4;
      }
      50% {
        transform: scale(1.4);
        opacity: 0;
      }
    }
  `;
  if (!document.querySelector('style[data-pulse]')) {
    style.setAttribute('data-pulse', 'true');
    document.head.appendChild(style);
  }
}
