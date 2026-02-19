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
  const { language, isDark, city } = useApp();
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

  // 🔥 Helper to add items from names (used in AI suggestions)
  const handleAddToCart = (dishName: string) => {
    // Find item by name in current language or any translation
    const itemToAdd = menuItems.find(item => 
      Object.values(item.nameTranslations).some(n => n.toLowerCase() === dishName.toLowerCase())
    );

    if (itemToAdd) {
      addItem({
        id: itemToAdd.id,
        name: itemToAdd.nameTranslations,
        price: itemToAdd.price,
        image: itemToAdd.image,
      });
      toast.success(language === 'ru' ? `Добавлено: ${dishName}` : `Added: ${dishName}`);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryCalculation | null>(
    null
  );
  
  // 🔥 Recalculate delivery if total changes (e.g. new AI items added)
  useEffect(() => {
    if (deliveryInfo?.distance && deliveryInfo?.duration) {
      const updated = calculateDeliveryPrice(deliveryInfo.distance, total, deliveryInfo.duration);
      setDeliveryInfo(updated);
    }
  }, [total]);

  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [autoStartCourier, setAutoStartCourier] = useState(false);

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
          
          // 📍 СРАЗУ обновляем карту, чтобы она полетела в нужную точку
          setMapLocation({ lat: latitude, lng: longitude });
          setAutoStartCourier(true); // 🛵 Запускаем курьера автоматически!

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

            setFormData(prev => ({ ...prev, address: fullAddress }));

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

    console.log("📦 Submitting order data:", {
      itemsCount: orderData.items.length,
      total: orderData.total,
      deliveryFee: orderData.deliveryFee,
      customer: orderData.customer,
      items: orderData.items,
    });

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
    <div className="space-y-16">
      {/* 🤖 01. GROUP: CUSTOMER PROFILE & PARTY SIZE */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 ml-6 pb-2">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 dark:text-white/40">
            01. Personal Profile
          </h2>
        </div>

        <div className="bg-white/80 dark:bg-[#0a0a0a] backdrop-blur-3xl rounded-[3rem] p-1 border border-black/10 dark:border-white/10 shadow-2xl relative overflow-hidden">
          <div className="p-8 sm:p-10 space-y-10">
            {/* Person Selector - Integrated at top */}
            <div className="pb-8 border-b border-black/10 dark:border-white/10">
              <PersonSelector
                numberOfPeople={formData.numberOfPeople}
                onChange={(val) => setFormData({ ...formData, numberOfPeople: val })}
                language={language}
                isDark={isDark}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Имя */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/40 ml-6 group-focus-within:text-primary transition-colors">
                  {language === "ru" ? "Ваше Имя" : "Your Name"}
                </label>
                <div className="relative">
                  <Input
                    placeholder={t.checkout.namePlaceholder}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-20 rounded-[2rem] px-8 text-xl font-bold bg-black/5 dark:bg-black/60 border border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 focus-visible:bg-black/10 dark:focus-visible:bg-black/80 placeholder:text-foreground/20 dark:placeholder:text-white/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Телефон */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/40 ml-6 group-focus-within:text-primary transition-colors">
                  {language === "ru" ? "Номер телефона" : "Phone Number"}
                </label>
                <div className="relative">
                  <div className="h-20 rounded-[2rem] px-1 bg-black/5 dark:bg-black/60 border border-black/20 dark:border-white/20 group-focus-within:border-primary/50 group-focus-within:ring-1 group-focus-within:ring-primary/50 transition-all flex items-center shadow-sm">
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val) => setFormData({ ...formData, phone: val })}
                      isDark={isDark}
                    />
                  </div>
                </div>
                {phoneError && (
                  <p className="text-destructive text-xs font-black uppercase tracking-widest pl-8">
                    {phoneError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚚 02. GROUP: IMMERSIVE MAP & DELIVERY */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 ml-6 pb-2">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 dark:text-white/40">
            02. Delivery Destination
          </h2>
        </div>

        <div className="space-y-6">
          {/* Address Input with Auto-Detect */}
          <div className="relative group/address">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-transparent rounded-[2.5rem] blur opacity-0 group-focus-within/address:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex items-center bg-white/80 dark:bg-[#0a0a0a] backdrop-blur-3xl rounded-[2.5rem] border border-black/20 dark:border-white/20 shadow-xl overflow-hidden group-focus-within/address:border-blue-500/50 group-focus-within/address:ring-1 group-focus-within/address:ring-blue-500/50 transition-all">
              <div className="flex-1 flex flex-col px-8 py-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 dark:text-white/40 mb-1">
                  {language === "ru" ? "Адрес доставки" : "Delivery Address"}
                </label>
                <Input
                  placeholder={language === "ru" ? "Улица, номер дома, город..." : "Street, house number, city..."}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-10 p-0 text-xl font-bold bg-transparent border-none focus-visible:ring-0 shadow-none placeholder:text-foreground/20 dark:placeholder:text-white/10"
                />
              </div>
              
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isLoadingLocation}
                className="h-full px-8 border-l border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all group/loc flex flex-col items-center justify-center min-w-[120px]"
              >
                {isLoadingLocation ? (
                  <div className="w-6 h-6 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl group-hover/loc:scale-110 transition-transform">📍</span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-blue-500">
                      {language === "ru" ? "ГДЕ Я?" : "AUTO"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <DeliveryMapSection 
            mapLocation={mapLocation}
            onLocationSelect={(location) => {
              setMapLocation(location);
              setAutoStartCourier(false); // Стоп авто-анимация если пользователь тащит маркер вручную
            }}
            onDistanceCalculated={(dist, dur) => {
              const calc = calculateDeliveryPrice(dist, total, dur);
              setDeliveryInfo(calc);
            }}
            deliveryInfo={deliveryInfo}
            isDark={isDark}
            language={language}
            autoStartCourier={autoStartCourier}
          />
        </div>
      </section>      {/* 📝 03. GROUP: SPECIAL REQUESTS & EXTRAS */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 ml-6 pb-2">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 dark:text-white/40">
            03. Final Details & AI Extras
          </h2>
        </div>

        <div className="space-y-8">
          <div className="relative">
            <Textarea
              placeholder={t.checkout.commentPlaceholder}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="min-h-[160px] rounded-[3rem] p-8 text-lg font-bold bg-white/80 dark:bg-[#0a0a0a] backdrop-blur-3xl border border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 focus-visible:bg-black/5 dark:focus-visible:bg-black/60 transition-all resize-none shadow-xl placeholder:text-foreground/30 dark:placeholder:text-white/40"
            />
          </div>

          {/* ✅ Premium AI Recommendations & Upsell */}
          <div className="space-y-12">
            <AIRecommendationCard 
              recommendation={aiRecommendation}
              isDark={isDark}
              language={language}
            />
            
            <AISuggestions 
              suggestions={aiSuggestions}
              onAddToCart={handleAddToCart}
              isLoading={isLoadingSuggestions}
              isDark={isDark}
            />
          </div>
        </div>
      </section>

      {/* 🚀 SUBMIT BUTTON */}
      <div className="pt-12">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-24 rounded-[3rem] text-2xl font-black tracking-tighter shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 bg-primary text-primary-foreground border-b-8 border-black/20 group relative overflow-hidden"
        >
          {/* Internal Glow Effect */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {isSubmitting ? (
            <span className="flex items-center gap-4">
              <span className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              {language === 'ru' ? 'Оформляем...' : 'Processing...'}
            </span>
          ) : (
            <div className="flex items-center justify-between w-full px-12 relative z-10">
              <span className="flex items-center gap-4">
                <span className="text-3xl group-hover:scale-125 transition-transform duration-500">🚀</span>
                {t.checkout.orderButton}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black">{total}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 m-0 p-0 leading-none">PLN</span>
              </div>
            </div>
          )}
        </Button>
      </div>
    </div>
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
