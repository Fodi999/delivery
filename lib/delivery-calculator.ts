import { DELIVERY_SETTINGS } from "./constants";

export interface DeliveryCalculation {
  allowed: boolean;
  distance?: number; // км
  duration?: number; // минуты
  price?: number; // zł
  totalTime?: number; // минуты (готовка + дорога)
  reason?: string; // причина отказа
  isFree?: boolean; // бесплатная доставка
}

/**
 * Рассчитывает время доставки на основе расстояния
 * @param distanceKm - расстояние в километрах
 * @returns время в минутах
 */
export function calculateDeliveryTime(distanceKm: number): number {
  const { COOKING_TIME, AVERAGE_SPEED } = DELIVERY_SETTINGS;
  const travelTime = Math.ceil((distanceKm / AVERAGE_SPEED) * 60);
  return COOKING_TIME + travelTime;
}

/**
 * Рассчитывает цену и возможность доставки
 * @param distanceKm - расстояние в километрах
 * @param orderTotal - сумма заказа в zł
 * @param durationMinutes - время в пути от Google (опционально)
 * @returns объект с информацией о доставке
 */
export function calculateDeliveryPrice(
  distanceKm: number,
  orderTotal: number,
  durationMinutes?: number // Время из Google Directions API
): DeliveryCalculation {
  const {
    MAX_DISTANCE,
    MIN_ORDER,
    BASE_PRICE,
    PRICE_PER_KM,
    FREE_DELIVERY_FROM,
    COOKING_TIME,
  } = DELIVERY_SETTINGS;

  // Проверка максимального расстояния
  if (distanceKm > MAX_DISTANCE) {
    return {
      allowed: false,
      distance: distanceKm,
      reason: `Максимальная дистанция доставки: ${MAX_DISTANCE} км`,
    };
  }

  // Проверка минимальной суммы заказа
  if (orderTotal < MIN_ORDER) {
    return {
      allowed: false,
      distance: distanceKm,
      reason: `Минимальный заказ: ${MIN_ORDER} zł`,
    };
  }

  // Бесплатная доставка
  const isFree = orderTotal >= FREE_DELIVERY_FROM;
  const price = isFree ? 0 : Math.round(BASE_PRICE + distanceKm * PRICE_PER_KM);
  
  // Используем время из Google, если есть, иначе рассчитываем
  const travelTime = durationMinutes || calculateDeliveryTime(distanceKm) - COOKING_TIME;
  const totalTime = COOKING_TIME + travelTime;

  return {
    allowed: true,
    distance: Number(distanceKm.toFixed(1)),
    duration: travelTime, // Время в пути (без готовки)
    price,
    totalTime, // Полное время (готовка + дорога)
    isFree,
  };
}

/**
 * Форматирует время доставки в диапазон
 * @param minutes - время в минутах
 * @returns строка вида "30–40 min"
 */
export function formatDeliveryTime(minutes: number): string {
  const min = minutes - 5;
  const max = minutes + 5;
  return `${min}–${max} min`;
}
