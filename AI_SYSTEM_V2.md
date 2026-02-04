# 🤖 AI System v2.0 - Production Ready

## ✅ Что улучшено

### 1️⃣ Структурированные ответы AI
**До:**
```typescript
return "Рады видеть снова!";
```

**После:**
```typescript
return {
  type: "welcome",
  text: "Рады видеть снова",
  confidence: "high",
  source: "ai",
  metadata: {
    model: "llama-3.3-70b-versatile",
    temperature: 0.35,
    tokens: 42
  }
};
```

**Преимущества:**
- ✅ Логирование для A/B тестов
- ✅ Умный fallback при низком confidence
- ✅ Аналитика использования AI
- ✅ Отладка и мониторинг

---

### 2️⃣ Оптимизированный Temperature

| Функция | Было | Стало | Причина |
|---------|------|-------|---------|
| `generateWelcomeMessage` | 0.7 | **0.35** | Стабильность приветствий |
| `generateOrderDescription` | 0.8 | **0.5** | Баланс креативности |
| `generateUpsellHint` | - | **0.4** | Точные рекомендации |

**Результат:**
- 📉 Меньше странных формулировок
- 📈 Выше консистентность между запросами
- ⚡ Быстрее генерация (меньше вариантов)

---

### 3️⃣ Контекстные промпты

**До:**
```
"Поприветствуй клиента ${name}..."
```

**После:**
```
Ты ассистент ресторана японской кухни.

Твоя задача: создать короткое приветствие,
которое будет показано в интерфейсе доставки
после распознавания постоянного клиента.

Ограничения:
- максимум 10 слов
- нейтральный, дружелюбный тон
- без эмодзи
- без восклицаний
- естественный язык (не маркетинговый)
```

**Результат:**
- 🎯 AI понимает ЗАЧЕМ он генерирует текст
- 🎨 Лучшее качество формулировок
- 🚫 Меньше "маркетингового мусора"

---

## 🔥 Новая функция: Silent Upsell

### Концепция
AI **не продаёт**, а **узнаёт** и мягко подсказывает.

### Пример использования

```typescript
import { generateUpsellHint } from "@/lib/groq";

const response = await generateUpsellHint({
  cart: [
    { id: "wok1", name: "Курица терияки", category: "wok", quantity: 2 }
  ],
  favoriteCategory: "wok",
  timeOfDay: "evening",
  language: "ru"
});

// Ответ:
{
  type: "upsell",
  text: "К Wok часто берут лимонад",
  confidence: "high",
  source: "ai",
  reason: "complete_meal",
  itemId: "drink_lemonade",
  itemName: "Лимонад"
}
```

### Когда показывать?
- ✅ После добавления 2+ позиций
- ✅ Если нет напитков в корзине
- ✅ Если заказ только одной категории
- ❌ НЕ показывать постоянно (раздражает)

### UX интеграция

```tsx
{upsellHint && (
  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
    <span className="text-sm text-blue-800">
      💡 {upsellHint.text}
    </span>
  </div>
)}
```

**Важно:** UI решает показывать или нет, а не AI!

---

## 📊 Новые типы данных

### `CustomerStats` (расширен)
```typescript
interface CustomerStats {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  name: string;
  isVIP?: boolean;              // 🆕 VIP статус
  favoriteCategory?: string;    // 🆕 Любимая категория
}
```

### `AIResponse` (новый)
```typescript
interface AIResponse {
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
```

### `UpsellHintResponse` (новый)
```typescript
interface UpsellHintResponse extends AIResponse {
  reason: "popular_with" | "complete_meal" | "time_based" | "category_match" | "none";
  itemId?: string;
  itemName?: string;
}
```

---

## 🚀 API Endpoints

### `POST /api/ai/welcome`
Персонализированное приветствие постоянного клиента

**Request:**
```json
{
  "customerStats": {
    "name": "Дмитрий",
    "totalOrders": 12,
    "totalSpent": 150000,
    "isVIP": true
  },
  "language": "ru"
}
```

**Response:**
```json
{
  "welcomeMessage": "С возвращением, Дмитрий",
  "description": "Ваш вкус безупречен",
  "meta": {
    "welcomeSource": "ai",
    "welcomeConfidence": "high",
    "descriptionSource": "ai",
    "descriptionConfidence": "high"
  }
}
```

---

### `POST /api/ai/upsell` 🆕
Умные рекомендации товаров

**Request:**
```json
{
  "cart": [
    { "id": "wok1", "name": "Wok курица", "category": "wok", "quantity": 2 }
  ],
  "favoriteCategory": "wok",
  "timeOfDay": "evening",
  "language": "ru"
}
```

**Response:**
```json
{
  "hasRecommendation": true,
  "message": "К Wok часто берут лимонад",
  "reason": "complete_meal",
  "itemId": "drink_lemonade",
  "itemName": "Лимонад",
  "meta": {
    "confidence": "high",
    "source": "ai",
    "model": "llama-3.3-70b-versatile"
  }
}
```

---

## 🧪 Сценарии использования

### Сценарий 1: Welcome Badge
```tsx
// В checkout-form.tsx после распознавания телефона

const aiResponse = await fetch("/api/ai/welcome", { ... });
const { welcomeMessage, meta } = await aiResponse.json();

// Логирование для аналитики
console.log("AI Source:", meta.welcomeSource);
console.log("Confidence:", meta.welcomeConfidence);

// Показываем badge
<div className="p-4 rounded-xl bg-purple-50">
  <span className="text-purple-900">{welcomeMessage}</span>
</div>
```

---

### Сценарий 2: Smart Upsell
```tsx
// После добавления 2+ товаров в корзину

useEffect(() => {
  if (items.length >= 2) {
    const fetchUpsell = async () => {
      const response = await fetch("/api/ai/upsell", {
        method: "POST",
        body: JSON.stringify({
          cart: items,
          favoriteCategory: customerData?.favoriteCategory,
          language
        })
      });
      
      const data = await response.json();
      
      if (data.hasRecommendation && data.meta.confidence === "high") {
        setUpsellHint(data.message);
      }
    };
    
    fetchUpsell();
  }
}, [items.length]);
```

---

## 📈 Метрики для отслеживания

### Обязательные
- `ai_response_time` - время генерации AI
- `ai_fallback_rate` - % fallback ответов
- `ai_confidence_distribution` - распределение high/medium/low

### Рекомендуемые
- `upsell_conversion_rate` - сколько кликнули по рекомендации
- `upsell_acceptance_rate` - сколько добавили в корзину
- `welcome_message_views` - сколько увидели приветствие

---

## 🔮 Roadmap

### Следующие шаги (необязательно)
1. **Архитектура:** Разделить `groq.ts` на модули
   ```
   lib/ai/
    ├── client.ts        // Groq init
    ├── welcome.ts       // generateWelcomeMessage
    ├── compliment.ts    // generateOrderDescription
    ├── upsell.ts        // generateUpsellHint
    └── types.ts         // Interfaces
   ```

2. **Checkout Guardian:** AI проверяет заказ перед отправкой
   ```typescript
   generateCheckoutGuardian({
     cart,
     deliveryTime,
     customerHistory
   })
   // Возвращает: "Всё хорошо" или "Может, добавить напиток?"
   ```

3. **Voice Input:** AI-ассистент для голосового ввода заказа

4. **Personalized Timing:** AI предсказывает лучшее время доставки

---

## 💡 Best Practices

### ✅ DO
- Используй `AIResponse` для всех AI функций
- Логируй `confidence` и `source` для аналитики
- Показывай upsell только если `confidence === "high"`
- Делай fallback на дефолтные сообщения

### ❌ DON'T
- Не показывай все AI сообщения сразу (перегруз)
- Не игнорируй `reason` в upsell (важно для UX)
- Не повышай temperature выше 0.6 для production
- Не делай AI запросы на каждый keystroke

---

## 📞 Support

Если AI ведёт себя странно:
1. Проверь `temperature` (должно быть ≤ 0.5)
2. Проверь промпт (достаточно контекста?)
3. Проверь `confidence` в ответе
4. Используй fallback если `confidence === "low"`

---

**Версия:** 2.0  
**Дата:** 4 февраля 2026  
**Модель:** LLaMA 3.3 70B (Groq)  
**Статус:** ✅ Production Ready
