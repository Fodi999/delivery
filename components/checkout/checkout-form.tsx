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
        <div className="space-y-2">
          <label className={`text-sm font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
            {language === "pl" 
              ? "Liczba osób" 
              : language === "ru" 
              ? "Количество персон" 
              : language === "uk" 
              ? "Кількість персон" 
              : "Number of people"}
          </label>
          
          <div className="flex gap-3">
            {/* Счетчик персон */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  numberOfPeople: Math.max(1, formData.numberOfPeople - 1) 
                })}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-lg transition-colors ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
                    : "bg-white border-neutral-300 hover:bg-neutral-50 text-black"
                }`}
              >
                −
              </button>
              
              <div className={`w-16 h-10 rounded-lg border flex items-center justify-center font-bold text-lg ${
                isDark 
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "bg-neutral-50 border-neutral-300 text-black"
              }`}>
                {formData.numberOfPeople}
              </div>
              
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  numberOfPeople: Math.min(20, formData.numberOfPeople + 1) 
                })}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-lg transition-colors ${
                  isDark 
                    ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
                    : "bg-white border-neutral-300 hover:bg-neutral-50 text-black"
                }`}
              >
                +
              </button>
            </div>
            
            {/* Иконка человечков */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(formData.numberOfPeople, 5) }).map((_, i) => (
                <span key={i} className="text-2xl">👤</span>
              ))}
              {formData.numberOfPeople > 5 && (
                <span className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  +{formData.numberOfPeople - 5}
                </span>
              )}
            </div>
          </div>
          
          {/* 🤖 AI рекомендация */}
          {aiRecommendation && (
            <div className={`p-4 rounded-xl border ${
              isDark 
                ? "bg-gradient-to-br from-purple-950/40 to-pink-950/40 border-purple-700/50" 
                : "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
            }`}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="flex-1 space-y-3">
                  <p className={`text-sm font-medium ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>
                    {aiRecommendation}
                  </p>
                  
                  {/* 🎯 Интерактивные кнопки-предложения */}
                  {aiSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {isLoadingSuggestions ? (
                        <div className="flex gap-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-9 w-24 rounded-full animate-pulse ${
                                isDark ? 'bg-purple-800/50' : 'bg-purple-200'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                              isDark
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {suggestion}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Maps с расчётом доставки */}
        <div className="space-y-3">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {language === "pl" ? "Adres dostawy" : 
             language === "ru" ? "Адрес доставки" : 
             language === "uk" ? "Адреса доставки" : 
             "Delivery address"}
          </h3>
          <div className="h-[400px] w-full">
            <MapboxDeliveryMap
              onLocationSelect={handleLocationSelect}
              onDistanceCalculated={handleDistanceCalculated}
              externalLocation={mapLocation}
            />
          </div>

          {/* Информация о доставке */}
          {deliveryInfo && (
            <div
              className={`p-4 rounded-lg border ${
                deliveryInfo.allowed
                  ? isDark
                    ? "bg-green-950/30 border-green-800"
                    : "bg-green-50 border-green-200"
                  : isDark
                  ? "bg-red-950/30 border-red-800"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {deliveryInfo.allowed ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Расстояние:
                    </span>
                    <span className="font-semibold">{deliveryInfo.distance} км</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Время доставки:
                    </span>
                    <span className="font-semibold">
                      {formatDeliveryTime(deliveryInfo.totalTime || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Стоимость доставки:
                    </span>
                    <div className="text-right">
                      {deliveryInfo.isFree ? (
                        <div>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            0 zł
                          </span>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            (бесплатно от 100 zł)
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold">{deliveryInfo.price} zł</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Детали времени */}
                  <div className="pt-2 mt-2 border-t border-neutral-300 dark:border-neutral-700">
                    <div className="text-xs text-neutral-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Приготовление:
                        </span>
                        <span>~20 мин</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Доставка:
                        </span>
                        <span>~{deliveryInfo.duration || 0} мин</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 🚚 AI-помощник доставки */}
                  {aiDeliveryMessage && (
                    <div className="pt-3 mt-3 border-t border-neutral-300 dark:border-neutral-700">
                      <div className="flex items-start gap-2 mb-3">
                        <svg className="w-5 h-5 flex-shrink-0 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 flex-1">
                          {aiDeliveryMessage}
                        </p>
                      </div>
                      
                      {/* Интерактивные кнопки доставки */}
                      {aiDeliverySuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {aiDeliverySuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleDeliverySuggestionClick(suggestion)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                                isDark
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-sm'
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600 dark:text-red-400">
                  🚫 {deliveryInfo.reason}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="relative">
            <Input
              placeholder={t.checkout.address}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
              className={`pr-12 ${
                isDark ? "bg-neutral-800 border-neutral-700" : ""
              }`}
            />
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLoadingLocation}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
                isLoadingLocation
                  ? "opacity-50 cursor-not-allowed"
                  : isDark
                  ? "hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
                  : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
              }`}
              title={
                language === "pl"
                  ? "Użyj mojej lokalizacji"
                  : language === "ru"
                  ? "Использовать мое местоположение"
                  : language === "uk"
                  ? "Використати моє місцезнаходження"
                  : "Use my location"
              }
            >
              {isLoadingLocation ? (
                <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          
          {/* Кнопка "Найти на карте" */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFindAddressOnMap}
            disabled={isLoadingLocation || !formData.address.trim()}
            className={`mt-3 w-full font-medium transition-all ${
              isDark
                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0 shadow-lg shadow-blue-500/30"
                : "bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white border-0 shadow-lg shadow-blue-500/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoadingLocation ? (
              <>
                <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
                {language === "pl"
                  ? "Szukam..."
                  : language === "ru"
                  ? "Ищу..."
                  : language === "uk"
                  ? "Шукаю..."
                  : "Searching..."}
              </>
            ) : (
              <>
                <svg 
                  className="w-4 h-4 mr-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
                {language === "pl"
                  ? "Znajdź na mapie"
                  : language === "ru"
                  ? "Найти на карте"
                  : language === "uk"
                  ? "Знайти на карті"
                  : "Find on map"}
              </>
            )}
          </Button>
          
          <p
            className={`text-xs mt-1 ${
              isDark ? "text-neutral-500" : "text-neutral-500"
            }`}
          >
            {language === "pl"
              ? "Ulica, numer domu, mieszkanie"
              : language === "ru"
              ? "Улица, дом, квартира"
              : language === "uk"
              ? "Вулиця, будинок, квартира"
              : "Street, house number, apartment"}
          </p>
        </div>

        <div>
          <Textarea
            placeholder={t.checkout.comment}
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            rows={2}
            className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
          />
          <p
            className={`text-xs mt-1 ${
              isDark ? "text-neutral-500" : "text-neutral-500"
            }`}
          >
            {language === "pl"
              ? "Np: nie dzwonić, zostawić przy drzwiach"
              : language === "ru"
              ? "Например: не звонить, оставить у двери"
              : language === "uk"
              ? "Наприклад: не дзвонити, залишити біля дверей"
              : "E.g: don't call, leave at door"}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className={`w-full mt-6 text-base font-semibold ${
          isDark
            ? "bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500"
            : "bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
            {language === "pl"
              ? "Przetwarzanie..."
              : language === "ru"
              ? "Обработка..."
              : language === "uk"
              ? "Обробка..."
              : "Processing..."}
          </span>
        ) : (
          <span>
            {language === "pl"
              ? "Zamówić"
              : language === "ru"
              ? "Заказать"
              : language === "uk"
              ? "Замовити"
              : "Order"}{" "}
            • {total + (deliveryInfo?.price || 0)} zł
            {deliveryInfo && deliveryInfo.price && deliveryInfo.price > 0 && (
              <span className="text-xs opacity-75">
                {" "}
                (товары: {total} zł + доставка: {deliveryInfo.price} zł)
              </span>
            )}
          </span>
        )}
      </Button>
    </form>
  );
}
