"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { DeliveryMap } from "@/components/maps/delivery-map";
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

export function CheckoutForm() {
  const { isDark, language, city } = useApp();
  const clear = useCartStore((s) => s.clear);
  const total = useCartStore((s) => s.total());
  const items = useCartStore((s) => s.items);
  const router = useRouter();
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    comment: "",
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
      // Используем Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          formData.address + ", Gdańsk, Poland"
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results[0]) {
        const location = data.results[0].geometry.location;
        
        // Устанавливаем координаты на карте через callback
        if (handleLocationSelect) {
          handleLocationSelect({ lat: location.lat, lng: location.lng });
        }

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
          ? "Nie znaleziono adresu"
          : language === "ru"
          ? "Адрес не найден"
          : language === "uk"
          ? "Адресу не знайдено"
          : "Address not found"
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

    // Формируем заказ
    const order: Order = {
      customer: {
        name: formData.name.trim(),
        phone: `+48 ${formData.phone.trim()}`,
        address: formData.address.trim(),
        comment: formData.comment.trim() || undefined,
      },
      items: items.map((item) => ({
        id: item.id,
        name: item.name[language] || item.name.en,
        price: item.price,
        quantity: item.quantity,
        image: item.image, // Передаем URL фото для Telegram
      })),
      total,
      city,
      payment: "cash",
      source: "web",
    };

    try {
      // Отправка заказа на backend
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
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

        {/* Google Maps с расчётом доставки */}
        <div className="space-y-3">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {language === "pl" ? "Adres dostawy" : 
             language === "ru" ? "Адрес доставки" : 
             language === "uk" ? "Адреса доставки" : 
             "Delivery address"}
          </h3>
          <DeliveryMap
            onLocationSelect={handleLocationSelect}
            onDistanceCalculated={handleDistanceCalculated}
            externalLocation={mapLocation}
          />

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
                    <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                      🗺 Расстояние:
                    </span>
                    <span className="font-semibold">{deliveryInfo.distance} км</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                      ⏱ Время доставки:
                    </span>
                    <span className="font-semibold">
                      {formatDeliveryTime(deliveryInfo.totalTime || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>
                      💰 Стоимость доставки:
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
                      <div className="flex justify-between">
                        <span>• Приготовление:</span>
                        <span>~20 мин</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Доставка:</span>
                        <span>~{deliveryInfo.duration || 0} мин</span>
                      </div>
                    </div>
                  </div>
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
            className={`mt-2 w-full ${
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                : "bg-white border-neutral-300 text-black hover:bg-neutral-50"
            }`}
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
                🗺️{" "}
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
