import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Feature flag: включить/выключить AI
 * Признак зрелого production-проекта
 */
const FEATURE_AI_ENABLED = process.env.NEXT_PUBLIC_FEATURE_AI !== "false";

/**
 * Нормализует текст от AI (убирает кавычки, точки, лишние пробелы)
 * Критично для UX-стабильности
 */
function normalizeAIText(text: string): string {
  return text
    .replace(/^["'«»]|["'«»]$/g, "") // Убираем кавычки с начала/конца
    .replace(/[.!?]+$/, "") // Убираем пунктуацию в конце
    .replace(/\s+/g, " ") // Нормализуем пробелы
    .trim();
}

/**
 * Определяет confidence на основе качества ответа AI
 */
function calculateConfidence(
  text: string,
  source: "ai" | "fallback"
): "high" | "medium" | "low" {
  if (source === "fallback") return "medium";
  
  const length = text.length;
  
  // Слишком короткий ответ (< 5 символов) - подозрительно
  if (length < 5) return "low";
  
  // Короткий но валидный (5-15 символов) - средний
  if (length < 15) return "medium";
  
  // Нормальная длина (15+ символов) - высокий
  return "high";
}

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
  // Feature flag: если AI выключен, возвращаем fallback
  if (!FEATURE_AI_ENABLED) {
    console.log("🔒 AI disabled by feature flag, using fallback");
    return getFallbackResponse("welcome", language);
  }
  
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

    // Нормализуем текст от AI
    const normalizedText = normalizeAIText(message);
    
    // Динамически определяем confidence
    const confidence = calculateConfidence(normalizedText, "ai");

    return {
      type: "welcome",
      text: normalizedText,
      confidence,
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
  // Feature flag: если AI выключен, возвращаем fallback
  if (!FEATURE_AI_ENABLED) {
    console.log("🔒 AI disabled by feature flag, using fallback");
    return getFallbackResponse("compliment", language);
  }
  
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

    // Нормализуем текст от AI
    const normalizedText = normalizeAIText(message);
    
    // Динамически определяем confidence
    const confidence = calculateConfidence(normalizedText, "ai");

    return {
      type: "compliment",
      text: normalizedText,
      confidence,
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
 * Детерминированное решение: нужен ли upsell
 * Разделение логики: Decision (код) vs Wording (AI)
 */
interface UpsellDecision {
  shouldSuggest: boolean;
  reason: UpsellHintResponse["reason"];
  suggestedCategory?: string;
  context: string;
}

function decideUpsell(
  cart: Array<{ id: string; name: string; category: string; quantity: number }>,
  favoriteCategory?: string,
  timeOfDay?: string
): UpsellDecision {
  const categories = Array.from(new Set(cart.map(item => item.category)));
  const hasWok = categories.includes("wok");
  const hasSushi = categories.includes("sushi");
  const hasDrinks = categories.includes("drinks");
  const hasRamen = categories.includes("ramen");
  
  // 1. Нет напитков - самая важная рекомендация
  if (!hasDrinks && cart.length >= 2) {
    return {
      shouldSuggest: true,
      reason: "complete_meal",
      suggestedCategory: "drinks",
      context: "no_drinks_with_food",
    };
  }
  
  // 2. Острая еда без напитка
  if ((hasWok || hasRamen) && !hasDrinks) {
    return {
      shouldSuggest: true,
      reason: "complete_meal",
      suggestedCategory: "drinks",
      context: "spicy_needs_drink",
    };
  }
  
  // 3. Только суши - предложить горячее
  if (hasSushi && !hasWok && !hasRamen && cart.length < 3) {
    return {
      shouldSuggest: true,
      reason: "popular_with",
      suggestedCategory: "wok",
      context: "sushi_with_hot",
    };
  }
  
  // 4. Любимая категория клиента
  if (favoriteCategory && !categories.includes(favoriteCategory) && cart.length >= 1) {
    return {
      shouldSuggest: true,
      reason: "category_match",
      suggestedCategory: favoriteCategory,
      context: "favorite_category",
    };
  }
  
  // 5. Время суток (вечер - напитки популярнее)
  if (timeOfDay === "evening" && !hasDrinks && cart.length >= 1) {
    return {
      shouldSuggest: true,
      reason: "time_based",
      suggestedCategory: "drinks",
      context: "evening_drinks",
    };
  }
  
  // Заказ полный
  return {
    shouldSuggest: false,
    reason: "none",
    context: "order_complete",
  };
}

/**
 * Генерирует умные рекомендации товаров (silent upsell)
 * AI не продаёт, а узнаёт и мягко предлагает
 * 
 * Архитектура: Decision (детерминизм) → Wording (AI)
 * 
 * @returns Структурированный ответ с причиной, ID товара и текстом
 */
export async function generateUpsellHint(
  request: UpsellHintRequest
): Promise<UpsellHintResponse> {
  // Feature flag: если AI выключен, используем только детерминированную логику
  if (!FEATURE_AI_ENABLED) {
    console.log("🔒 AI disabled by feature flag, using deterministic logic only");
    const decision = decideUpsell(request.cart, request.favoriteCategory, request.timeOfDay);
    
    if (!decision.shouldSuggest) {
      return {
        type: "upsell",
        text: "",
        confidence: "low",
        source: "fallback",
        reason: "none",
      };
    }
    
    // Простая fallback формулировка без AI
    const fallbackMessages: Record<string, Record<string, string>> = {
      pl: {
        drinks: "Może napój?",
        wok: "Może Wok?",
        sushi: "Może sushi?",
        ramen: "Może ramen?",
      },
      ru: {
        drinks: "Может напиток?",
        wok: "Может Wok?",
        sushi: "Может суши?",
        ramen: "Может рамен?",
      },
      uk: {
        drinks: "Може напій?",
        wok: "Може Wok?",
        sushi: "Може суші?",
        ramen: "Може рамен?",
      },
      en: {
        drinks: "Maybe a drink?",
        wok: "Maybe Wok?",
        sushi: "Maybe sushi?",
        ramen: "Maybe ramen?",
      },
    };
    
    const text = fallbackMessages[request.language]?.[decision.suggestedCategory || "drinks"] || "";
    
    return {
      type: "upsell",
      text,
      confidence: "medium",
      source: "fallback",
      reason: decision.reason,
    };
  }
  
  try {
    const { cart, favoriteCategory, timeOfDay, language } = request;
    
    // 1. DECISION: Детерминированное решение (код, не AI)
    const decision = decideUpsell(cart, favoriteCategory, timeOfDay);
    
    if (!decision.shouldSuggest) {
      return {
        type: "upsell",
        text: "",
        confidence: "low",
        source: "ai",
        reason: "none",
      };
    }
    
    // 2. WORDING: AI генерирует формулировку на основе решения
    const categories = Array.from(new Set(cart.map(item => item.category)));
    
    const languagePrompts = {
      pl: `Jesteś ekspertem kulinarnym w restauracji japońskiej.

Kontekst:
- Zamówione kategorie: ${categories.join(", ")}
- Sugerowana kategoria: ${decision.suggestedCategory}
- Powód: ${decision.context}

Stwórz krótką (max 10 słów), przyjazną sugestię bez agresywnej sprzedaży.

Format przykład: "Do Wok często bierze się napój"

Odpowiedz TYLKO sugestią.`,

      ru: `Ты эксперт японской кухни в ресторане.

Контекст:
- Заказанные категории: ${categories.join(", ")}
- Рекомендуемая категория: ${decision.suggestedCategory}
- Причина: ${decision.context}

Создай короткую (макс 10 слов), дружескую рекомендацию без агрессивной продажи.

Пример формата: "К Wok часто берут напиток"

Ответь ТОЛЬКО рекомендацией.`,

      uk: `Ти експерт японської кухні в ресторані.

Контекст:
- Замовлені категорії: ${categories.join(", ")}
- Рекомендована категорія: ${decision.suggestedCategory}
- Причина: ${decision.context}

Створи коротку (макс 10 слів), дружню рекомендацію без агресивного продажу.

Приклад формату: "До Wok часто беруть напій"

Відповідь ТІЛЬКИ рекомендацією.`,

      en: `You are a Japanese cuisine expert at a restaurant.

Context:
- Ordered categories: ${categories.join(", ")}
- Suggested category: ${decision.suggestedCategory}
- Reason: ${decision.context}

Create a short (max 10 words), friendly suggestion without aggressive selling.

Example format: "With Wok people often get a drink"

Reply ONLY with the suggestion.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: languagePrompts[language],
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3, // Снижено: текст детерминирован, нужна только формулировка
      max_tokens: 50,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";
    
    if (!message) {
      return {
        type: "upsell",
        text: "",
        confidence: "low",
        source: "fallback",
        reason: decision.reason,
      };
    }

    // Нормализуем текст от AI
    const normalizedText = normalizeAIText(message);
    
    // Confidence зависит от качества ответа
    const confidence = calculateConfidence(normalizedText, "ai");

    return {
      type: "upsell",
      text: normalizedText,
      confidence,
      source: "ai",
      reason: decision.reason,
      metadata: {
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
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
