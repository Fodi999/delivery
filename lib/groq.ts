import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface CustomerStats {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number; // в центах
  lastOrderDate?: string;
  name: string;
  isVIP?: boolean;
  favoriteCategory?: "wok" | "sushi" | "ramen" | "drinks";
}

/**
 * Структурированный ответ AI для логирования, A/B тестов и fallback
 */
export interface AIResponse {
  type: "welcome" | "compliment" | "upsell";
  text: string;
  confidence: "high" | "medium" | "low";
  source: "ai" | "fallback";
  metadata?: {
    model?: string;
    temperature?: number;
    tokens?: number;
  };
}

/**
 * Генерирует персонализированное приветствие для постоянного клиента
 * используя Groq AI (LLaMA)
 * 
 * @returns Структурированный ответ с текстом, уверенностью и метаданными
 */
export async function generateWelcomeMessage(
  customerStats: CustomerStats,
  language: "pl" | "ru" | "uk" | "en" = "ru"
): Promise<AIResponse> {
  try {
    const spentInZl = (customerStats.totalSpent / 100).toFixed(0);
    
    const languagePrompts = {
      pl: `Jesteś asystentem restauracji z japońskim jedzeniem.

Twoja zadanie: stworzyć krótkie powitanie, które zostanie pokazane w interfejsie dostawy po rozpoznaniu stałego klienta.

Kontekst klienta:
- Imię: ${customerStats.name}
- Historia: ${customerStats.totalOrders} zamówień, ${spentInZl} zł wydanych
${customerStats.isVIP ? "- Status: VIP klient" : ""}

Ograniczenia:
- maksymalnie 10 słów
- neutralny, przyjazny ton
- bez emoji
- bez wykrzykników
- naturalny język (nie marketingowy)

Odpowiedz TYLKO powitaniem.`,

      ru: `Ты ассистент ресторана японской кухни.

Твоя задача: создать короткое приветствие, которое будет показано в интерфейсе доставки после распознавания постоянного клиента.

Контекст клиента:
- Имя: ${customerStats.name}
- История: ${customerStats.totalOrders} заказов, ${spentInZl} zł потрачено
${customerStats.isVIP ? "- Статус: VIP клиент" : ""}

Ограничения:
- максимум 10 слов
- нейтральный, дружелюбный тон
- без эмодзи
- без восклицаний
- естественный язык (не маркетинговый)

Ответь ТОЛЬКО приветствием.`,

      uk: `Ти асистент ресторану японської кухні.

Твоя задача: створити коротке привітання, яке буде показано в інтерфейсі доставки після розпізнавання постійного клієнта.

Контекст клієнта:
- Ім'я: ${customerStats.name}
- Історія: ${customerStats.totalOrders} замовлень, ${spentInZl} zł витрачено
${customerStats.isVIP ? "- Статус: VIP клієнт" : ""}

Обмеження:
- максимум 10 слів
- нейтральний, дружній тон
- без емодзі
- без знаків оклику
- природна мова (не маркетингова)

Відповідь ТІЛЬКИ привітанням.`,

      en: `You are a Japanese restaurant assistant.

Your task: create a short greeting that will be displayed in the delivery interface after recognizing a returning customer.

Customer context:
- Name: ${customerStats.name}
- History: ${customerStats.totalOrders} orders, ${spentInZl} zł spent
${customerStats.isVIP ? "- Status: VIP customer" : ""}

Constraints:
- maximum 10 words
- neutral, friendly tone
- no emoji
- no exclamation marks
- natural language (not marketing-speak)

Reply ONLY with the greeting.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: languagePrompts[language],
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.35, // Снижено для стабильности
      max_tokens: 50,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";
    
    // Если AI не вернуло сообщение, используем fallback
    if (!message) {
      return getFallbackResponse("welcome", language);
    }

    return {
      type: "welcome",
      text: message,
      confidence: "high",
      source: "ai",
      metadata: {
        model: "llama-3.3-70b-versatile",
        temperature: 0.35,
        tokens: completion.usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error("Groq AI error:", error);
    return getFallbackResponse("welcome", language);
  }
}

/**
 * Fallback сообщения на случай ошибки API
 * Возвращает структурированный ответ
 */
function getFallbackResponse(
  type: "welcome" | "compliment" | "upsell",
  language: "pl" | "ru" | "uk" | "en"
): AIResponse {
  const welcomeMessages = {
    pl: "Witaj ponownie",
    ru: "Рады видеть снова",
    uk: "Раді бачити знову",
    en: "Welcome back",
  };

  const complimentMessages = {
    pl: "Dziękujemy za zaufanie",
    ru: "Спасибо за доверие",
    uk: "Дякуємо за довіру",
    en: "Thank you for your trust",
  };

  const messages = type === "welcome" ? welcomeMessages : complimentMessages;

  return {
    type,
    text: messages[language],
    confidence: "medium",
    source: "fallback",
  };
}

/**
 * @deprecated Используйте getFallbackResponse для структурированного ответа
 */
function getFallbackMessage(language: "pl" | "ru" | "uk" | "en"): string {
  const messages = {
    pl: "Witaj ponownie!",
    ru: "Рады видеть снова!",
    uk: "Раді бачити знову!",
    en: "Welcome back!",
  };
  return messages[language];
}

/**
 * Генерирует персонализированное описание для уведомления
 * 
 * @returns Структурированный ответ с комплиментом
 */
export async function generateOrderDescription(
  customerStats: CustomerStats,
  language: "pl" | "ru" | "uk" | "en" = "ru"
): Promise<AIResponse> {
  try {
    const spentInZl = (customerStats.totalSpent / 100).toFixed(0);
    
    const languagePrompts = {
      pl: `Jesteś asystentem restauracji z japońskim jedzeniem.

Twoja zadanie: stworzyć krótki, ciepły komplement dla stałego klienta, który zostanie pokazany w powiadomieniu toast po rozpoznaniu.

Kontekst klienta:
- ${customerStats.totalOrders} zamówień
- ${spentInZl} zł wydanych
${customerStats.favoriteCategory ? `- Ulubiona kategoria: ${customerStats.favoriteCategory}` : ""}

Ograniczenia:
- maksymalnie 8 słów
- przyjazny, autentyczny ton
- bez emoji
- bez wykrzykników
- uzna klienta, ale naturalnie (nie "super klient!")

Odpowiedz TYLKO komplementem.`,

      ru: `Ты ассистент ресторана японской кухни.

Твоя задача: создать короткий, теплый комплимент для постоянного клиента, который будет показан в toast-уведомлении после распознавания.

Контекст клиента:
- ${customerStats.totalOrders} заказов
- ${spentInZl} zł потрачено
${customerStats.favoriteCategory ? `- Любимая категория: ${customerStats.favoriteCategory}` : ""}

Ограничения:
- максимум 8 слов
- дружелюбный, искренний тон
- без эмодзи
- без восклицаний
- признай клиента, но естественно (не "супер клиент!")

Ответь ТОЛЬКО комплиментом.`,

      uk: `Ти асистент ресторану японської кухні.

Твоя задача: створити короткий, теплий комплімент для постійного клієнта, який буде показано в toast-повідомленні після розпізнавання.

Контекст клієнта:
- ${customerStats.totalOrders} замовлень
- ${spentInZl} zł витрачено
${customerStats.favoriteCategory ? `- Улюблена категорія: ${customerStats.favoriteCategory}` : ""}

Обмеження:
- максимум 8 слів
- дружній, щирий тон
- без емодзі
- без знаків оклику
- визнай клієнта, але природно (не "супер клієнт!")

Відповідь ТІЛЬКИ компліментом.`,

      en: `You are a Japanese restaurant assistant.

Your task: create a short, warm compliment for a returning customer that will be shown in a toast notification after recognition.

Customer context:
- ${customerStats.totalOrders} orders
- ${spentInZl} zł spent
${customerStats.favoriteCategory ? `- Favorite category: ${customerStats.favoriteCategory}` : ""}

Constraints:
- maximum 8 words
- friendly, authentic tone
- no emoji
- no exclamation marks
- acknowledge customer naturally (not "super customer!")

Reply ONLY with the compliment.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: languagePrompts[language],
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5, // Немного креативности, но стабильно
      max_tokens: 40,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";
    
    if (!message) {
      return getFallbackResponse("compliment", language);
    }

    return {
      type: "compliment",
      text: message,
      confidence: "high",
      source: "ai",
      metadata: {
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        tokens: completion.usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error("Groq AI error:", error);
    return getFallbackResponse("compliment", language);
  }
}

/**
 * Интерфейс для умных рекомендаций (silent upsell)
 */
export interface UpsellHintRequest {
  cart: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
  }>;
  favoriteCategory?: "wok" | "sushi" | "ramen" | "drinks";
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  language: "pl" | "ru" | "uk" | "en";
}

/**
 * Структурированный ответ для upsell рекомендации
 */
export interface UpsellHintResponse extends AIResponse {
  reason: "popular_with" | "complete_meal" | "time_based" | "category_match" | "none";
  itemId?: string;
  itemName?: string;
}

/**
 * Генерирует умные рекомендации товаров (silent upsell)
 * AI не продаёт, а узнаёт и мягко предлагает
 * 
 * @returns Структурированный ответ с причиной, ID товара и текстом
 */
export async function generateUpsellHint(
  request: UpsellHintRequest
): Promise<UpsellHintResponse> {
  try {
    const { cart, favoriteCategory, timeOfDay, language } = request;
    
    // Определяем контекст заказа
    const categories = Array.from(new Set(cart.map(item => item.category)));
    const hasWok = categories.includes("wok");
    const hasSushi = categories.includes("sushi");
    const hasDrinks = categories.includes("drinks");
    const hasRamen = categories.includes("ramen");
    
    const languagePrompts = {
      pl: `Jesteś ekspertem kulinarnym w restauracji japońskiej.

Kontekst zamówienia:
- Zamówione kategorie: ${categories.join(", ")}
- Ulubiona kategoria klienta: ${favoriteCategory || "nieznana"}
- Pora dnia: ${timeOfDay}
- Zamówione pozycje: ${cart.map(i => i.name).join(", ")}

Twoja zadanie: zaproponować 1 dodatkowy produkt, który naturalnie uzupełnia zamówienie (NIE sprzedawaj, doradzaj).

Zasady:
${!hasDrinks ? "- Brak napoju w zamówieniu - rozważ napój" : ""}
${hasWok || hasRamen ? "- Dania ostre - rozważ napój lub dodatek" : ""}
${hasSushi && !hasWok ? "- Tylko sushi - rozważ zupę lub Wok" : ""}
- Maximum 10 słów
- Ton: przyjazna sugestia, NIE reklama
- Format: "Do [kategoria] często bierze się [produkt]"

Odpowiedz TYLKO sugestią lub "BRAK" jeśli zamówienie kompletne.`,

      ru: `Ты эксперт японской кухни в ресторане.

Контекст заказа:
- Заказанные категории: ${categories.join(", ")}
- Любимая категория клиента: ${favoriteCategory || "неизвестна"}
- Время суток: ${timeOfDay}
- Заказанные позиции: ${cart.map(i => i.name).join(", ")}

Твоя задача: предложить 1 дополнительный продукт, который естественно дополнит заказ (НЕ продавай, советуй).

Правила:
${!hasDrinks ? "- Нет напитка в заказе - рассмотри напиток" : ""}
${hasWok || hasRamen ? "- Острые блюда - рассмотри напиток или добавку" : ""}
${hasSushi && !hasWok ? "- Только суши - рассмотри суп или Wok" : ""}
- Максимум 10 слов
- Тон: дружеский совет, НЕ реклама
- Формат: "К [категория] часто берут [продукт]"

Ответь ТОЛЬКО предложением или "БRAK" если заказ полный.`,

      uk: `Ти експерт японської кухні в ресторані.

Контекст замовлення:
- Замовлені категорії: ${categories.join(", ")}
- Улюблена категорія клієнта: ${favoriteCategory || "невідома"}
- Час доби: ${timeOfDay}
- Замовлені позиції: ${cart.map(i => i.name).join(", ")}

Твоя задача: запропонувати 1 додатковий продукт, який природно доповнить замовлення (НЕ продавай, радь).

Правила:
${!hasDrinks ? "- Немає напою в замовленні - розглянь напій" : ""}
${hasWok || hasRamen ? "- Гострі страви - розглянь напій або добавку" : ""}
${hasSushi && !hasWok ? "- Тільки суші - розглянь суп або Wok" : ""}
- Максимум 10 слів
- Тон: дружня порада, НЕ реклама
- Формат: "До [категорія] часто беруть [продукт]"

Відповідь ТІЛЬКИ пропозицією або "БRAK" якщо замовлення повне.`,

      en: `You are a Japanese cuisine expert at a restaurant.

Order context:
- Ordered categories: ${categories.join(", ")}
- Customer's favorite category: ${favoriteCategory || "unknown"}
- Time of day: ${timeOfDay}
- Ordered items: ${cart.map(i => i.name).join(", ")}

Your task: suggest 1 additional product that naturally complements the order (DON'T sell, advise).

Rules:
${!hasDrinks ? "- No drink in order - consider drink" : ""}
${hasWok || hasRamen ? "- Spicy dishes - consider drink or side" : ""}
${hasSushi && !hasWok ? "- Only sushi - consider soup or Wok" : ""}
- Maximum 10 words
- Tone: friendly suggestion, NOT advertisement
- Format: "With [category] people often get [product]"

Reply ONLY with suggestion or "NONE" if order is complete.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: languagePrompts[language],
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, // Умеренная креативность
      max_tokens: 60,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";
    
    // Если AI не предложил ничего
    if (!message || message.includes("БRAK") || message.includes("NONE") || message.includes("BRAK")) {
      return {
        type: "upsell",
        text: "",
        confidence: "low",
        source: "ai",
        reason: "none",
      };
    }

    // Определяем причину рекомендации
    let reason: UpsellHintResponse["reason"] = "popular_with";
    if (!hasDrinks && message.toLowerCase().includes("napój") || message.toLowerCase().includes("напиток") || message.toLowerCase().includes("напій") || message.toLowerCase().includes("drink")) {
      reason = "complete_meal";
    } else if (favoriteCategory && message.toLowerCase().includes(favoriteCategory)) {
      reason = "category_match";
    } else if (message.toLowerCase().includes("wok") || message.toLowerCase().includes("ramen")) {
      reason = "popular_with";
    }

    return {
      type: "upsell",
      text: message,
      confidence: "high",
      source: "ai",
      reason,
      metadata: {
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        tokens: completion.usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error("Groq AI upsell error:", error);
    return {
      type: "upsell",
      text: "",
      confidence: "low",
      source: "fallback",
      reason: "none",
    };
  }
}
