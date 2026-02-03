"use client";

import { useState, useEffect } from "react";
import { 
  getDeviceId, 
  autofillCustomerData, 
  saveCustomerLocally,
  type CustomerData 
} from "@/lib/customer-recognition";

/**
 * 🎯 Пример формы заказа с автозаполнением для постоянных клиентов
 * 
 * Как работает:
 * 1. Клиент вводит телефон (9 цифр)
 * 2. Автоматически ищем его в базе
 * 3. Если найден - заполняем имя и адрес
 * 4. Показываем статус "Постоянный клиент 🎉"
 */
export default function CheckoutFormExample() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerData | null>(null);

  // Device ID для отслеживания устройства
  const deviceId = getDeviceId();

  /**
   * При вводе телефона - проверяем, есть ли клиент в базе
   */
  useEffect(() => {
    const checkCustomer = async () => {
      // Проверяем только когда введено 9+ цифр
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length < 9) {
        setCustomerInfo(null);
        return;
      }

      setIsLoading(true);

      try {
        const data = await autofillCustomerData(phone);

        if (data) {
          // ✅ Нашли постоянного клиента!
          setName(data.name);
          setAddress(data.address);
          setCustomerInfo(data);
        }
      } catch (error) {
        console.error("Ошибка проверки клиента:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce - ждем 500ms после ввода
    const timer = setTimeout(checkCustomer, 500);
    return () => clearTimeout(timer);
  }, [phone]);

  /**
   * Отправка заказа
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Сохраняем данные локально для следующего раза
    saveCustomerLocally({ name, phone, address, deviceId });

    // Отправляем заказ в API
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { name, phone, address },
        deviceId, // Отправляем device ID для аналитики
        // ... остальные данные заказа
      }),
    });

    // ... обработка ответа
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Device ID (скрыт от пользователя) */}
      <input type="hidden" name="deviceId" value={deviceId} />

      {/* Телефон */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Телефон
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+48 123 456 789"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        {isLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            🔍 Проверяем...
          </p>
        )}
        {customerInfo?.isReturning && (
          <p className="text-sm text-green-600 font-medium mt-1">
            🎉 Постоянный клиент! Заказов: {customerInfo.totalOrders}
          </p>
        )}
      </div>

      {/* Имя */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Имя
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван Петров"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Адрес */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Адрес доставки
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ул. Długa 45, м. 12"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        {customerInfo?.isReturning && (
          <p className="text-xs text-muted-foreground mt-1">
            💡 Подставлен последний адрес. Можете изменить.
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
      >
        Оформить заказ
      </button>
    </form>
  );
}
