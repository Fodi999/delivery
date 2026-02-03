import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { menuItems } from "@/lib/menu-data";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, numberOfPeople, isEnough, language } = body;

    console.log("🎯 Generating AI suggestions for:", {
      items: items.length,
      numberOfPeople,
      isEnough,
      language,
    });

    // Получаем список доступных блюд из меню
    const availableItems = menuItems.map((item) => {
      const name = item.nameTranslations[language as keyof typeof item.nameTranslations] || item.name;
      return {
        name,
        category: item.category,
        price: item.price,
        id: item.id,
      };
    });

    // Фильтруем блюда, которые уже есть в корзине
    const cartItemIds = items.map((item: any) => item.id);
    const notInCart = availableItems.filter(item => !cartItemIds.includes(item.id));

    // Создаем список доступных блюд по категориям для AI
    const menuByCategory = notInCart.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(`${item.name} (${item.price} zł)`);
      return acc;
    }, {} as Record<string, string[]>);

    const menuList = Object.entries(menuByCategory)
      .map(([category, items]) => `${category.toUpperCase()}:\n${items.slice(0, 5).join(', ')}`)
      .join('\n\n');

    // Системные промпты для разных языков
    const systemPrompts: Record<string, string> = {
      pl: `Jesteś ekspertem kulinarnym w restauracji sushi. Klient zamówił ${items.length} pozycji dla ${numberOfPeople} osób.
${isEnough ? "Zamówienie jest wystarczające." : "Zamówienie może być za małe."}

DOSTĘPNE DANIA W MENU (wybieraj TYLKO z tej listy):
${menuList}

Zaproponuj 3-4 konkretne pozycje z powyższej listy, które byłyby idealnym dodatkiem. Używaj DOKŁADNYCH nazw z listy.`,

      ru: `Ты эксперт по японской кухне в суши-ресторане. Клиент заказал ${items.length} позиций на ${numberOfPeople} человек.
${isEnough ? "Заказа достаточно." : "Заказа может быть недостаточно."}

ДОСТУПНЫЕ БЛЮДА В МЕНЮ (выбирай ТОЛЬКО из этого списка):
${menuList}

Предложи 3-4 конкретные позиции из списка выше, которые идеально дополнят заказ. Используй ТОЧНЫЕ названия из списка.`,

      uk: `Ти експерт з японської кухні в суші-ресторані. Клієнт замовив ${items.length} позицій на ${numberOfPeople} осіб.
${isEnough ? "Замовлення достатньо." : "Замовлення може бути недостатньо."}

ДОСТУПНІ СТРАВИ В МЕНЮ (вибирай ТІЛЬКИ з цього списку):
${menuList}

Запропонуй 3-4 конкретні позиції зі списку вище, які ідеально доповнять замовлення. Використовуй ТОЧНІ назви зі списку.`,

      en: `You are a culinary expert at a sushi restaurant. The customer ordered ${items.length} items for ${numberOfPeople} people.
${isEnough ? "The order is sufficient." : "The order might be insufficient."}

AVAILABLE MENU ITEMS (choose ONLY from this list):
${menuList}

Suggest 3-4 specific items from the list above that would perfectly complement the order. Use EXACT names from the list.`,
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.en;

    // Формируем контекст текущего заказа
    const itemsList = items
      .map((item: any) => `- ${item.name} x${item.quantity}`)
      .join("\n");

    const userPrompt = `Текущий заказ:\n${itemsList}\n\nКоличество персон: ${numberOfPeople}\n\nТвои предложения (только названия блюд через запятую, используй точные названия из меню):`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 100,
    });

    const aiResponse = completion.choices[0]?.message?.content || "";
    console.log("🤖 AI raw response:", aiResponse);

    // Парсим ответ и находим соответствующие блюда из меню
    const suggestedNames = aiResponse
      .split(/[,\n]/)
      .map((s) => s.trim().replace(/\(\d+\s*zł\)/g, '').trim())
      .filter((s) => s.length > 0);

    // Ищем точные совпадения или близкие названия в меню
    const matchedSuggestions: string[] = [];
    
    for (const suggestedName of suggestedNames) {
      const match = notInCart.find(item => 
        item.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
        suggestedName.toLowerCase().includes(item.name.toLowerCase())
      );
      
      if (match && matchedSuggestions.length < 4) {
        matchedSuggestions.push(match.name);
      }
    }

    // Если AI не предложил ничего подходящего, выбираем случайные из категорий
    if (matchedSuggestions.length === 0) {
      const categories = isEnough 
        ? ['sushi', 'drinks', 'desserts']
        : ['ramen', 'wok', 'sushi'];
      
      categories.forEach(cat => {
        const categoryItems = notInCart.filter(item => item.category === cat);
        if (categoryItems.length > 0 && matchedSuggestions.length < 4) {
          const random = categoryItems[Math.floor(Math.random() * categoryItems.length)];
          matchedSuggestions.push(random.name);
        }
      });
    }

    console.log("✅ AI suggestions generated:", matchedSuggestions);

    return NextResponse.json({ suggestions: matchedSuggestions.slice(0, 4) });
  } catch (error) {
    console.error("❌ AI suggestions error:", error);

    // Fallback: выбираем случайные блюда из меню
    const body = await request.json();
    const { language, items } = body;

    const cartItemIds = items.map((item: any) => item.id);
    const notInCart = menuItems.filter(item => !cartItemIds.includes(item.id));
    
    const randomSuggestions = notInCart
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .map(item => item.nameTranslations[language as keyof typeof item.nameTranslations] || item.name);

    return NextResponse.json({
      suggestions: randomSuggestions,
    });
  }
}
