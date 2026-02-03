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

interface Message {
  role: "assistant" | "user";
  content: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userMessage, conversationHistory, cartItems, numberOfPeople, language } = body as {
      userMessage: string;
      conversationHistory: Message[];
      cartItems: CartItem[];
      numberOfPeople: number;
      language: "pl" | "ru" | "uk" | "en";
    };

    console.log(`🤖 AI Assistant: "${userMessage}" (${numberOfPeople} people, ${cartItems.length} items)`);

    // Формируем контекст корзины
    const cartContext = cartItems.length > 0
      ? cartItems.map(item => `${item.name} x${item.quantity}`).join(", ")
      : language === "pl" ? "koszyk pusty" : language === "ru" ? "корзина пуста" : language === "uk" ? "кошик порожній" : "cart empty";

    // Системный промпт для AI
    const systemPrompts = {
      pl: `Jesteś pomocnym asystentem AI w restauracji japońskiej (sushi, ramen, wok). 
Pomagasz klientom wybrać jedzenie, odpowiadasz na pytania i proponujesz dodatki (sosy, napoje, desery).

Aktualna sytuacja:
- Liczba osób: ${numberOfPeople}
- Koszyk: ${cartContext}

WAŻNE ZASADY:
1. Bądź przyjazny, krótki i pomocny (max 2-3 zdania)
2. Zadawaj pytania kierujące: "Ile osób?", "Czy lubicie pikantne?", "Może dodać sosy?"
3. Proponuj konkretne dodatki: "Sos sojowy?", "Napój?", "Deser?"
4. Jeśli klient pyta o ilość - oceń czy wystarczy i zasugeruj co dodać
5. Używaj emoji oszczędnie
6. Po każdej odpowiedzi zaproponuj 2-4 szybkie przyciski z opcjami

Przykłady odpowiedzi:
"Super! Dla 2 osób polecam jeszcze 1 dodatkową pozycję. Może sos teriyaki? 🍶"
"Świetny wybór! Czy chcielibyście dodać napój?"`,

      ru: `Ты полезный AI-ассистент в японском ресторане (суши, рамен, вок).
Помогаешь клиентам выбрать еду, отвечаешь на вопросы и предлагаешь дополнения (соусы, напитки, десерты).

Текущая ситуация:
- Количество персон: ${numberOfPeople}
- Корзина: ${cartContext}

ВАЖНЫЕ ПРАВИЛА:
1. Будь дружелюбным, кратким и полезным (макс 2-3 предложения)
2. Задавай направляющие вопросы: "Сколько человек?", "Любите острое?", "Может добавить соусы?"
3. Предлагай конкретные дополнения: "Соевый соус?", "Напиток?", "Десерт?"
4. Если клиент спрашивает про количество - оцени достаточно ли и предложи что добавить
5. Используй emoji умеренно
6. После каждого ответа предлагай 2-4 быстрые кнопки с вариантами

Примеры ответов:
"Отлично! Для 2 человек рекомендую ещё 1 дополнительную позицию. Может соус терияки? 🍶"
"Отличный выбор! Хотите добавить напиток?"`,

      uk: `Ти корисний AI-асистент в японському ресторані (суші, рамен, вок).
Допомагаєш клієнтам обрати їжу, відповідаєш на запитання та пропонуєш доповнення (соуси, напої, десерти).

Поточна ситуація:
- Кількість персон: ${numberOfPeople}
- Кошик: ${cartContext}

ВАЖЛИВІ ПРАВИЛА:
1. Будь дружнім, коротким і корисним (макс 2-3 речення)
2. Задавай направляючі запитання: "Скільки осіб?", "Любите гостре?", "Може додати соуси?"
3. Пропонуй конкретні доповнення: "Соєвий соус?", "Напій?", "Десерт?"
4. Якщо клієнт питає про кількість - оціни чи достатньо і запропонуй що додати
5. Використовуй emoji помірно
6. Після кожної відповіді пропонуй 2-4 швидкі кнопки з варіантами

Приклади відповідей:
"Чудово! Для 2 осіб рекомендую ще 1 додаткову позицію. Може соус теріякі? 🍶"
"Чудовий вибір! Бажаєте додати напій?"`,

      en: `You are a helpful AI assistant in a Japanese restaurant (sushi, ramen, wok).
You help customers choose food, answer questions and suggest additions (sauces, drinks, desserts).

Current situation:
- Number of people: ${numberOfPeople}
- Cart: ${cartContext}

IMPORTANT RULES:
1. Be friendly, brief and helpful (max 2-3 sentences)
2. Ask guiding questions: "How many people?", "Do you like spicy?", "Maybe add sauces?"
3. Suggest specific additions: "Soy sauce?", "Drink?", "Dessert?"
4. If customer asks about quantity - assess if it's enough and suggest what to add
5. Use emoji moderately
6. After each response suggest 2-4 quick buttons with options

Example responses:
"Great! For 2 people I recommend 1 more item. Maybe teriyaki sauce? 🍶"
"Excellent choice! Would you like to add a drink?"`,
    };

    // Формируем историю разговора
    const chatHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompts[language],
        },
        ...chatHistory,
        {
          role: "user",
          content: userMessage,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 200,
    });

    const assistantMessage = completion.choices[0]?.message?.content?.trim() || "";

    // Генерируем подсказки на основе контекста
    let suggestions: string[] = [];
    
    // Определяем контекст и предлагаем релевантные кнопки
    const totalPortions = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const needsMore = totalPortions < numberOfPeople * 1.2;
    
    if (language === "ru") {
      if (needsMore) {
        suggestions = ["Добавить соус 🍶", "Добавить ролл", "Напиток 🥤", "Достаточно ✅"];
      } else {
        suggestions = ["Добавить соус 🍶", "Десерт 🍰", "Напиток 🥤", "Всё готово ✅"];
      }
    } else if (language === "pl") {
      if (needsMore) {
        suggestions = ["Dodaj sos 🍶", "Dodaj roll", "Napój 🥤", "Wystarczy ✅"];
      } else {
        suggestions = ["Dodaj sos 🍶", "Deser 🍰", "Napój 🥤", "Gotowe ✅"];
      }
    } else if (language === "uk") {
      if (needsMore) {
        suggestions = ["Додати соус 🍶", "Додати рол", "Напій 🥤", "Достатньо ✅"];
      } else {
        suggestions = ["Додати соус 🍶", "Десерт 🍰", "Напій 🥤", "Все готово ✅"];
      }
    } else {
      if (needsMore) {
        suggestions = ["Add sauce 🍶", "Add roll", "Drink 🥤", "That's enough ✅"];
      } else {
        suggestions = ["Add sauce 🍶", "Dessert 🍰", "Drink 🥤", "All set ✅"];
      }
    }

    console.log("✅ AI Assistant response:", assistantMessage);

    return NextResponse.json({
      message: assistantMessage,
      suggestions,
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    
    const body = await req.json();
    const language = body.language as "pl" | "ru" | "uk" | "en";
    
    // Fallback ответ
    const fallbackMessages = {
      pl: "Przepraszam, nie mogłem przetworzyć Twojej wiadomości. Możesz zapytać ponownie?",
      ru: "Извините, не смог обработать ваше сообщение. Можете спросить ещё раз?",
      uk: "Вибачте, не зміг обробити ваше повідомлення. Можете запитати ще раз?",
      en: "Sorry, I couldn't process your message. Can you ask again?",
    };

    return NextResponse.json({
      message: fallbackMessages[language] || fallbackMessages.en,
      suggestions: [],
    });
  }
}
