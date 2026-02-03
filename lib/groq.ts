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
}

/**
 * Генерирует персонализированное приветствие для постоянного клиента
 * используя Groq AI (LLaMA)
 */
export async function generateWelcomeMessage(
  customerStats: CustomerStats,
  language: "pl" | "ru" | "uk" | "en" = "ru"
): Promise<string> {
  try {
    const spentInZl = (customerStats.totalSpent / 100).toFixed(0);
    
    const languagePrompts = {
      pl: `Jesteś asystentem restauracji z japońskim jedzeniem. Powitaj stałego klienta ${customerStats.name} w przyjazny i krótki sposób (max 10 słów). 
Statystyki: ${customerStats.totalOrders} zamówień, ${spentInZl} zł wydanych.
Odpowiedz TYLKO powitaniem bez emoji.`,
      ru: `Ты ассистент ресторана японской кухни. Поприветствуй постоянного клиента ${customerStats.name} дружелюбно и кратко (макс 10 слов).
Статистика: ${customerStats.totalOrders} заказов, ${spentInZl} zł потрачено.
Ответь ТОЛЬКО приветствием без эмодзи.`,
      uk: `Ти асистент ресторану японської кухні. Привітай постійного клієнта ${customerStats.name} дружньо і коротко (макс 10 слів).
Статистика: ${customerStats.totalOrders} замовлень, ${spentInZl} zł витрачено.
Відповідь ТІЛЬКИ привітанням без емодзі.`,
      en: `You are a Japanese restaurant assistant. Welcome back the returning customer ${customerStats.name} in a friendly and short way (max 10 words).
Stats: ${customerStats.totalOrders} orders, ${spentInZl} zł spent.
Reply ONLY with the greeting without emoji.`,
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
      max_tokens: 50,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";
    
    // Если AI не вернуло сообщение, используем fallback
    if (!message) {
      return getFallbackMessage(language);
    }

    return message;
  } catch (error) {
    console.error("Groq AI error:", error);
    return getFallbackMessage(language);
  }
}

/**
 * Fallback сообщения на случай ошибки API
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
 */
export async function generateOrderDescription(
  customerStats: CustomerStats,
  language: "pl" | "ru" | "uk" | "en" = "ru"
): Promise<string> {
  try {
    const spentInZl = (customerStats.totalSpent / 100).toFixed(0);
    
    const languagePrompts = {
      pl: `Stwórz krótki komplement dla klienta restauracji (max 8 słów), który złożył ${customerStats.totalOrders} zamówień i wydał ${spentInZl} zł. Bądź oryginalny i przyjazny. Bez emoji.`,
      ru: `Создай короткий комплимент для клиента ресторана (макс 8 слов), который сделал ${customerStats.totalOrders} заказов и потратил ${spentInZl} zł. Будь оригинальным и дружелюбным. Без эмодзи.`,
      uk: `Створи короткий комплімент для клієнта ресторану (макс 8 слів), який зробив ${customerStats.totalOrders} замовлень і витратив ${spentInZl} zł. Будь оригінальним і дружнім. Без емодзі.`,
      en: `Create a short compliment for a restaurant customer (max 8 words) who made ${customerStats.totalOrders} orders and spent ${spentInZl} zł. Be original and friendly. No emoji.`,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: languagePrompts[language],
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 40,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "";
    
    return message || "";
  } catch (error) {
    console.error("Groq AI error:", error);
    return "";
  }
}
