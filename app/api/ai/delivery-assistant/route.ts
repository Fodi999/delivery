import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryInfo, cartTotal, language } = body;

    console.log("🚚 Generating AI delivery assistant for:", {
      distance: deliveryInfo.distance,
      duration: deliveryInfo.duration,
      isFree: deliveryInfo.isFree,
      cartTotal,
      language,
    });

    // Системные промпты для разных языков
    const systemPrompts: Record<string, string> = {
      pl: `Jesteś pomocnym asystentem dostawy w restauracji sushi. 
      
Informacje o dostawie:
- Odległość: ${deliveryInfo.distance} km
- Czas dostawy: ${deliveryInfo.duration} min
- Koszt dostawy: ${deliveryInfo.isFree ? '0 zł (bezpłatnie od 100 zł)' : `${deliveryInfo.price} zł`}
- Wartość koszyka: ${cartTotal} zł
- Całkowity czas: ${deliveryInfo.totalTime} min (przygotowanie ~20 min + dostawa ~${deliveryInfo.duration} min)

Napisz krótką (1-2 zdania), przyjazną wiadomość o dostawie. Zasugeruj konkretne działania w formie przycisków (3-4 opcje).
${!deliveryInfo.isFree && cartTotal < 100 ? 'Wspomnij, że do darmowej dostawy brakuje ' + (100 - cartTotal) + ' zł.' : ''}`,

      ru: `Ты полезный помощник по доставке в суши-ресторане.

Информация о доставке:
- Расстояние: ${deliveryInfo.distance} км
- Время доставки: ${deliveryInfo.duration} мин
- Стоимость доставки: ${deliveryInfo.isFree ? '0 zł (бесплатно от 100 zł)' : `${deliveryInfo.price} zł`}
- Сумма корзины: ${cartTotal} zł
- Общее время: ${deliveryInfo.totalTime} мин (приготовление ~20 мин + доставка ~${deliveryInfo.duration} мин)

Напиши короткое (1-2 предложения), дружелюбное сообщение о доставке. Предложи конкретные действия в виде кнопок (3-4 варианта).
${!deliveryInfo.isFree && cartTotal < 100 ? 'Упомяни, что до бесплатной доставки не хватает ' + (100 - cartTotal) + ' zł.' : ''}`,

      uk: `Ти корисний помічник з доставки в суші-ресторані.

Інформація про доставку:
- Відстань: ${deliveryInfo.distance} км
- Час доставки: ${deliveryInfo.duration} хв
- Вартість доставки: ${deliveryInfo.isFree ? '0 zł (безкоштовно від 100 zł)' : `${deliveryInfo.price} zł`}
- Сума кошика: ${cartTotal} zł
- Загальний час: ${deliveryInfo.totalTime} хв (приготування ~20 хв + доставка ~${deliveryInfo.duration} хв)

Напиши коротке (1-2 речення), дружнє повідомлення про доставку. Запропонуй конкретні дії у вигляді кнопок (3-4 варіанти).
${!deliveryInfo.isFree && cartTotal < 100 ? 'Згадай, що до безкоштовної доставки не вистачає ' + (100 - cartTotal) + ' zł.' : ''}`,

      en: `You are a helpful delivery assistant at a sushi restaurant.

Delivery information:
- Distance: ${deliveryInfo.distance} km
- Delivery time: ${deliveryInfo.duration} min
- Delivery cost: ${deliveryInfo.isFree ? '0 zł (free from 100 zł)' : `${deliveryInfo.price} zł`}
- Cart total: ${cartTotal} zł
- Total time: ${deliveryInfo.totalTime} min (preparation ~20 min + delivery ~${deliveryInfo.duration} min)

Write a short (1-2 sentences), friendly message about the delivery. Suggest specific actions as buttons (3-4 options).
${!deliveryInfo.isFree && cartTotal < 100 ? 'Mention that ' + (100 - cartTotal) + ' zł is needed for free delivery.' : ''}`,
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.en;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "Создай сообщение и предложи действия (формат: MESSAGE | action1, action2, action3)",
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0]?.message?.content || "";
    console.log("🤖 AI delivery response:", aiResponse);

    // Парсим ответ: сообщение | действия
    const parts = aiResponse.split("|");
    const message = parts[0]?.trim() || aiResponse;
    const suggestions = parts[1]
      ? parts[1].split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 4)
      : [];

    // Fallback предложения если AI не вернул кнопки
    if (suggestions.length === 0) {
      const fallbackSuggestions: Record<string, string[]> = {
        pl: deliveryInfo.isFree 
          ? ["Potwierdź adres", "Zmień adres", "Dodaj komentarz"]
          : ["Dodaj do 100 zł", "Potwierdź adres", "Płacę za dostawę"],
        ru: deliveryInfo.isFree
          ? ["Подтвердить адрес", "Изменить адрес", "Добавить комментарий"]
          : ["Добавить до 100 zł", "Подтвердить адрес", "Оплачу доставку"],
        uk: deliveryInfo.isFree
          ? ["Підтвердити адресу", "Змінити адресу", "Додати коментар"]
          : ["Додати до 100 zł", "Підтвердити адресу", "Оплачу доставку"],
        en: deliveryInfo.isFree
          ? ["Confirm address", "Change address", "Add comment"]
          : ["Add to 100 zł", "Confirm address", "Pay for delivery"],
      };
      suggestions.push(...(fallbackSuggestions[language] || fallbackSuggestions.en));
    }

    console.log("✅ AI delivery assistant generated:", { message, suggestions });

    return NextResponse.json({ message, suggestions: suggestions.slice(0, 4) });
  } catch (error) {
    console.error("❌ AI delivery assistant error:", error);

    const body = await request.json();
    const { language, deliveryInfo, cartTotal } = body;

    // Fallback сообщение и кнопки
    const fallbackMessages: Record<string, string> = {
      pl: deliveryInfo.isFree 
        ? `Świetnie! Darmowa dostawa w ~${deliveryInfo.totalTime} min.`
        : `Dostawa ${deliveryInfo.price} zł. Do darmowej brakuje ${100 - cartTotal} zł.`,
      ru: deliveryInfo.isFree
        ? `Отлично! Бесплатная доставка за ~${deliveryInfo.totalTime} мин.`
        : `Доставка ${deliveryInfo.price} zł. До бесплатной не хватает ${100 - cartTotal} zł.`,
      uk: deliveryInfo.isFree
        ? `Чудово! Безкоштовна доставка за ~${deliveryInfo.totalTime} хв.`
        : `Доставка ${deliveryInfo.price} zł. До безкоштовної не вистачає ${100 - cartTotal} zł.`,
      en: deliveryInfo.isFree
        ? `Great! Free delivery in ~${deliveryInfo.totalTime} min.`
        : `Delivery ${deliveryInfo.price} zł. ${100 - cartTotal} zł needed for free.`,
    };

    const fallbackSuggestions: Record<string, string[]> = {
      pl: deliveryInfo.isFree 
        ? ["Potwierdź adres", "Zmień adres", "Dodaj komentarz"]
        : ["Dodaj do 100 zł", "Potwierdź adres", "Płacę za dostawę"],
      ru: deliveryInfo.isFree
        ? ["Подтвердить адрес", "Изменить адрес", "Добавить комментарий"]
        : ["Добавить до 100 zł", "Подтвердить адрес", "Оплачу доставку"],
      uk: deliveryInfo.isFree
        ? ["Підтвердити адресу", "Змінити адресу", "Додати коментар"]
        : ["Додати до 100 zł", "Підтвердити адресу", "Оплачу доставку"],
      en: deliveryInfo.isFree
        ? ["Confirm address", "Change address", "Add comment"]
        : ["Add to 100 zł", "Confirm address", "Pay for delivery"],
    };

    return NextResponse.json({
      message: fallbackMessages[language] || fallbackMessages.en,
      suggestions: fallbackSuggestions[language] || fallbackSuggestions.en,
    });
  }
}
