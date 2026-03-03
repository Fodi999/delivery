import { NextRequest, NextResponse } from "next/server";
import type { DeliveryCalculation } from "@/lib/delivery-calculator";

interface DeliveryAssistantRequest {
  deliveryInfo: DeliveryCalculation;
  cartTotal: number;
  language: "pl" | "ru" | "uk" | "en";
}

function generateDeliveryMessage(
  info: DeliveryCalculation,
  cartTotal: number,
  lang: "pl" | "ru" | "uk" | "en"
): { message: string; suggestions: string[] } {
  const toFree = 100 - cartTotal;
  const needsMoreForFree = !info.isFree && toFree > 0;

  const messages: Record<"pl" | "ru" | "uk" | "en", string> = {
    ru: needsMoreForFree
      ? `Добавьте ещё ${toFree} zł и доставка будет бесплатной. Доедем за ~${info.totalTime} мин.`
      : info.isFree
        ? `Отлично! Доставка бесплатна. Ждите через ~${info.totalTime} мин.`
        : `Доставка ${info.distance?.toFixed(1)} км — будем через ~${info.totalTime} мин.`,
    pl: needsMoreForFree
      ? `Dodaj ${toFree} zł aby uzyskać darmową dostawę. Dostarczymy w ~${info.totalTime} min.`
      : info.isFree
        ? `Super! Dostawa gratis. Czekaj ~${info.totalTime} min.`
        : `Dostawa ${info.distance?.toFixed(1)} km — będziemy za ~${info.totalTime} min.`,
    uk: needsMoreForFree
      ? `Додайте ще ${toFree} zł і доставка безкоштовна. Будемо за ~${info.totalTime} хв.`
      : info.isFree
        ? `Чудово! Доставка безкоштовна. Чекайте ~${info.totalTime} хв.`
        : `Доставка ${info.distance?.toFixed(1)} км — будемо за ~${info.totalTime} хв.`,
    en: needsMoreForFree
      ? `Add ${toFree} zł more for free delivery. Arriving in ~${info.totalTime} min.`
      : info.isFree
        ? `Free delivery unlocked! Arriving in ~${info.totalTime} min.`
        : `Delivery ${info.distance?.toFixed(1)} km — arriving in ~${info.totalTime} min.`,
  };

  const suggestions: Record<"pl" | "ru" | "uk" | "en", string[]> = {
    ru: needsMoreForFree
      ? [`Добавить суп`, `Добавить напиток`, `Добавить десерт`]
      : [`Уточнить адрес`, `Добавить комментарий`, `Продолжить`],
    pl: needsMoreForFree
      ? [`Dodaj zupę`, `Dodaj napój`, `Dodaj deser`]
      : [`Potwierdź adres`, `Dodaj komentarz`, `Kontynuuj`],
    uk: needsMoreForFree
      ? [`Додати суп`, `Додати напій`, `Додати десерт`]
      : [`Уточнити адресу`, `Додати коментар`, `Продовжити`],
    en: needsMoreForFree
      ? [`Add soup`, `Add drink`, `Add dessert`]
      : [`Confirm address`, `Add comment`, `Continue`],
  };

  return { message: messages[lang], suggestions: suggestions[lang] };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DeliveryAssistantRequest;
    const { deliveryInfo, cartTotal, language } = body;

    console.log("🚚 SmartBot delivery-assistant:", { distance: deliveryInfo.distance, language });

    const { message, suggestions } = generateDeliveryMessage(deliveryInfo, cartTotal, language);

    return NextResponse.json({ message, suggestions, source: "smartbot" });
  } catch (error) {
    console.error("SmartBot delivery-assistant error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
