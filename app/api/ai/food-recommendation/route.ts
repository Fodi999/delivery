import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { numberOfPeople, cartItems, language } = body as {
      numberOfPeople: number;
      cartItems: CartItem[];
      language: "pl" | "ru" | "uk" | "en";
    };

    if (!numberOfPeople || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Number of people and cart items required" },
        { status: 400 }
      );
    }

    console.log(`🍱 Generating AI recommendation for ${numberOfPeople} people with ${cartItems.length} items`);

    // Подсчитываем общее количество порций
    const totalPortions = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Формируем список блюд
    const itemsList = cartItems
      .map(item => `${item.name} (${item.quantity} шт)`)
      .join(", ");

    const languagePrompts = {
      pl: `Jestem AI asystentem restauracji japońskiej. Klient zamawia jedzenie dla ${numberOfPeople} osób. 
W koszyku: ${itemsList} (razem ${totalPortions} porcji).
Oceń czy to wystarczająco dużo jedzenia. Odpowiedz krótko (max 15 słów), przyjaznym tonem. Jeśli to za mało - zasugeruj ile dodać. Jeśli ok - pochwal wybór. Bez emoji.`,
      ru: `Я AI-ассистент японского ресторана. Клиент заказывает еду на ${numberOfPeople} чел. 
В корзине: ${itemsList} (всего ${totalPortions} порций).
Оцени, достаточно ли это еды. Ответь кратко (макс 15 слов), дружелюбным тоном. Если мало - предложи сколько добавить. Если норм - похвали выбор. Без эмодзи.`,
      uk: `Я AI-асистент японського ресторану. Клієнт замовляє їжу на ${numberOfPeople} осіб. 
У кошику: ${itemsList} (всього ${totalPortions} порцій).
Оціни, чи достатньо це їжі. Відповідь коротко (макс 15 слів), дружнім тоном. Якщо мало - запропонуй скільки додати. Якщо норм - похвали вибір. Без емодзі.`,
      en: `I'm an AI assistant for a Japanese restaurant. Customer is ordering food for ${numberOfPeople} people. 
In cart: ${itemsList} (total ${totalPortions} portions).
Assess if this is enough food. Reply briefly (max 15 words), friendly tone. If not enough - suggest how much to add. If ok - praise the choice. No emoji.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: languagePrompts[language],
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 60,
    });

    const recommendation = completion.choices[0]?.message?.content?.trim() || "";
    
    console.log("✅ AI recommendation generated:", recommendation);

    return NextResponse.json({
      recommendation,
      totalPortions,
      recommendedPortions: numberOfPeople * 1.5, // Рекомендуем 1.5 порции на человека
      isEnough: totalPortions >= numberOfPeople * 1.2, // Проверка достаточности
    });
  } catch (error) {
    console.error("AI food recommendation error:", error);
    
    // Fallback рекомендация
    const body = await req.json();
    const totalPortions = (body.cartItems as CartItem[]).reduce((sum, item) => sum + item.quantity, 0);
    const numberOfPeople = body.numberOfPeople as number;
    const language = body.language as "pl" | "ru" | "uk" | "en";
    
    const fallbackMessages = {
      pl: totalPortions >= numberOfPeople * 1.2 
        ? "Świetny wybór! To powinna być wystarczająca ilość jedzenia."
        : `Polecam dodać jeszcze ${Math.ceil(numberOfPeople * 1.5 - totalPortions)} porcje.`,
      ru: totalPortions >= numberOfPeople * 1.2
        ? "Отличный выбор! Этого должно хватить."
        : `Рекомендую добавить ещё ${Math.ceil(numberOfPeople * 1.5 - totalPortions)} порций.`,
      uk: totalPortions >= numberOfPeople * 1.2
        ? "Чудовий вибір! Цього має вистачити."
        : `Рекомендую додати ще ${Math.ceil(numberOfPeople * 1.5 - totalPortions)} порцій.`,
      en: totalPortions >= numberOfPeople * 1.2
        ? "Great choice! This should be enough."
        : `I recommend adding ${Math.ceil(numberOfPeople * 1.5 - totalPortions)} more portions.`,
    };
    
    return NextResponse.json({
      recommendation: fallbackMessages[language] || fallbackMessages.en,
      totalPortions,
      recommendedPortions: numberOfPeople * 1.5,
      isEnough: totalPortions >= numberOfPeople * 1.2,
    });
  }
}
