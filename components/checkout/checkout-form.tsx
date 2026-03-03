"use client";

import { useState, useEffect } from "react";
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
import { saveCustomerLocally } from "@/lib/customer-recognition";
import { useDeliveryStore } from "@/store/delivery-store";
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
  const setGlobalDeliveryInfo = useDeliveryStore((s) => s.setDeliveryInfo);

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
      setGlobalDeliveryInfo(updated);
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
        description: language === "pl" ? `Dodano do koszyka · ${menuItem.price} zł` :
                   language === "ru" ? `Добавлено в корзину · ${menuItem.price} zł` :
                   language === "uk" ? `Додано до кошика · ${menuItem.price} zł` :
                   `Added to cart · ${menuItem.price} zł`,
        icon: "🛒",
        duration: 2500,
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
        icon: "✨",
        duration: 2000,
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
      toast.error(delivery.reason || "Доставка невозможна", {
        icon: "🚫",
        duration: 4000,
      });
    } else {
      const timeRange = formatDeliveryTime(delivery.totalTime || 0);
      const priceLabel = delivery.isFree ? "Бесплатно" : `${delivery.price} zł`;
      toast.success(`${priceLabel} · ${timeRange}`, {
        description:
          language === "pl" ? "Dostawa obliczona" :
          language === "ru" ? "Доставка рассчитана" :
          language === "uk" ? "Доставку розраховано" :
          "Delivery calculated",
        icon: "🛵",
        duration: 3000,
      });
      
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
            : "Address found on map",
          { icon: "📍", duration: 2500 }
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
                icon: "📍",
                duration: 3000,
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
                icon: "🔒",
                duration: 4000,
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
    formData.address.trim().length > 0 &&
    deliveryInfo !== null &&      // ← адрес должен быть просчитан через карту
    deliveryInfo.allowed === true; // ← зона доставки должна быть доступна

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
        comment: formData.comment.trim(),
        numberOfPeople: formData.numberOfPeople,
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
        // Сохраняем данные клиента в localStorage для автозаполнения следующего заказа
        saveCustomerLocally({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        });

        // Успех
        toast.success(t.checkout.orderSuccess, {
          description: t.checkout.orderSuccessHint,
          icon: "🎉",
          duration: 2500,
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
          icon: "❌",
          duration: 4000,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">

      {/* ══════════════════════════════════════════════
          01. PERSONAL PROFILE
      ══════════════════════════════════════════════ */}
      <section className="space-y-5">
        {/* Section header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <span className="text-[10px] font-black text-primary">01</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 dark:text-white/30">
            Personal Profile
          </span>
          <div className="flex-1 h-px bg-foreground/5 dark:bg-white/5" />
        </div>

        <div className={`rounded-[2.5rem] border ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-black/6'} shadow-xl overflow-hidden`}>

          {/* Person selector row */}
          <div className={`px-8 py-6 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
            <PersonSelector
              numberOfPeople={formData.numberOfPeople}
              onChange={(val) => setFormData({ ...formData, numberOfPeople: val })}
              language={language}
              isDark={isDark}
            />
          </div>

          {/* Name + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/5">
            {/* Name */}
            <div className="px-8 py-6 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 dark:text-white/30 block">
                {language === "ru" ? "Ваше Имя" : language === "pl" ? "Your Name" : language === "uk" ? "Ваше Ім'я" : "Your Name"}
              </label>
              <Input
                placeholder={t.checkout.namePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`h-14 rounded-2xl px-5 text-base font-bold border focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all shadow-none ${isDark ? 'bg-white/5 border-white/10 placeholder:text-white/15' : 'bg-black/3 border-black/10 placeholder:text-black/20'}`}
              />
            </div>

            {/* Phone */}
            <div className="px-8 py-6 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 dark:text-white/30 block">
                {language === "ru" ? "Номер телефона" : language === "pl" ? "Phone Number" : language === "uk" ? "Номер телефону" : "Phone Number"}
              </label>
              <div className={`h-14 rounded-2xl px-2 border flex items-center transition-all focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/40 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/3 border-black/10'}`}>
                <PhoneInput
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  isDark={isDark}
                />
              </div>
              {phoneError && (
                <p className="text-destructive text-[9px] font-black uppercase tracking-widest pl-1">{phoneError}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          02. DELIVERY DESTINATION
      ══════════════════════════════════════════════ */}
      <section className="space-y-5">
        {/* Section header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 shrink-0">
            <span className="text-[10px] font-black text-blue-500">02</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 dark:text-white/30">
            Delivery Destination
          </span>
          <div className="flex-1 h-px bg-foreground/5 dark:bg-white/5" />
        </div>

        <div className="space-y-4">
          {/* Address input card */}
          <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-black/6'} shadow-xl`}>
            <div className="flex items-stretch">
              <div className="flex-1 px-7 py-5 space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-500/70 block">
                  {language === "ru" ? "Адрес доставки" : language === "pl" ? "Delivery Address" : language === "uk" ? "Адреса доставки" : "Delivery Address"}
                </label>
                <Input
                  placeholder={language === "ru" ? "Улица, номер дома, город..." : "Street, house number, city..."}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`h-11 px-0 text-base font-bold bg-transparent border-none focus-visible:ring-0 shadow-none placeholder:text-foreground/20 dark:placeholder:text-white/15`}
                />
              </div>

              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isLoadingLocation}
                className={`px-7 border-l flex flex-col items-center justify-center gap-1 min-w-[88px] transition-all hover:bg-blue-500/5 active:scale-95 ${isDark ? 'border-white/8' : 'border-black/6'}`}
              >
                {isLoadingLocation ? (
                  <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <>
                    {/* Pin icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">AUTO</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Map + Countdown */}
          <DeliveryMapSection
            mapLocation={mapLocation}
            onLocationSelect={(location) => {
              setMapLocation(location);
              setAutoStartCourier(false);
            }}
            onDistanceCalculated={(dist, dur) => {
              const calc = calculateDeliveryPrice(dist, total, dur);
              setDeliveryInfo(calc);
              setGlobalDeliveryInfo(calc);
            }}
            deliveryInfo={deliveryInfo}
            isDark={isDark}
            language={language}
            autoStartCourier={autoStartCourier}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          03. FINAL DETAILS & AI EXTRAS
      ══════════════════════════════════════════════ */}
      <section className="space-y-5">
        {/* Section header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 shrink-0">
            <span className="text-[10px] font-black text-amber-500">03</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 dark:text-white/30">
            Final Details & AI Extras
          </span>
          <div className="flex-1 h-px bg-foreground/5 dark:bg-white/5" />
        </div>

        <div className={`rounded-[2.5rem] border ${isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-black/6'} shadow-xl overflow-hidden`}>
          {/* Comment textarea */}
          <div className={`px-7 py-6 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-foreground/40 dark:text-white/30 block mb-3">
              {language === "ru" ? "Комментарий к заказу" : language === "pl" ? "Uwagi do zamówienia" : language === "uk" ? "Коментар до замовлення" : "Order notes"}
            </label>
            <Textarea
              placeholder={t.checkout.commentPlaceholder}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className={`min-h-[100px] rounded-2xl p-4 text-sm font-medium border resize-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all shadow-none ${isDark ? 'bg-white/5 border-white/10 placeholder:text-white/15' : 'bg-black/3 border-black/10 placeholder:text-black/20'}`}
            />
          </div>

          {/* AI blocks */}
          <div className="px-7 py-6 space-y-5">
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

      {/* ══════════════════════════════════════════════
          SUBMIT
      ══════════════════════════════════════════════ */}
      <div className="pt-4 pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid}
          className="w-full h-20 rounded-[2rem] font-black tracking-tight text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.015] active:scale-[0.985] transition-all duration-300 bg-primary text-primary-foreground border-b-4 border-black/15 relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
          <div className="relative z-10 flex items-center justify-between px-8">
            {isSubmitting ? (
              <span className="flex items-center gap-3 mx-auto">
                <span className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                <span>{language === 'ru' ? 'Оформляем...' : language === 'pl' ? 'Przetwarzamy...' : language === 'uk' ? 'Оформлюємо...' : 'Processing...'}</span>
              </span>
            ) : (
              <>
                <span className="flex items-center gap-3">
                  {/* Rocket icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-[-2px] group-hover:translate-x-[1px] transition-transform duration-300">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                  </svg>
                  {t.checkout.orderButton}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{total}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">PLN</span>
                </div>
              </>
            )}
          </div>
        </button>

        {/* Подсказка когда форма не готова */}
        {!isFormValid && !isSubmitting && (
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 dark:text-white/20 mt-3">
            {!deliveryInfo
              ? (language === "ru" ? "Выберите адрес на карте для расчёта доставки" : language === "pl" ? "Wybierz adres na mapie" : "Select address on map")
              : !deliveryInfo.allowed
              ? (language === "ru" ? "Адрес за зоной доставки" : language === "pl" ? "Poza strefą dostawy" : "Outside delivery zone")
              : (language === "ru" ? "Заполните имя и телефон" : language === "pl" ? "Wypełnij imię i telefon" : "Fill name and phone")}
          </p>
        )}
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
