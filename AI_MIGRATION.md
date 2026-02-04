# 🔄 Миграция на AI System v2.0

## ⚠️ Breaking Changes

### `generateWelcomeMessage` и `generateOrderDescription`

**Было:**
```typescript
const message: string = await generateWelcomeMessage(stats, "ru");
```

**Стало:**
```typescript
const response: AIResponse = await generateWelcomeMessage(stats, "ru");
const message = response.text; // Получаем текст
```

---

## 🛠️ Как мигрировать

### Вариант 1: Быстрый (используем только текст)

Замените все:
```typescript
const welcomeMessage = await generateWelcomeMessage(...);
```

На:
```typescript
const { text: welcomeMessage } = await generateWelcomeMessage(...);
```

**Плюсы:** Минимальные изменения  
**Минусы:** Не используете метаданные

---

### Вариант 2: Правильный (используем метаданные)

```typescript
const welcomeResponse = await generateWelcomeMessage(stats, language);

// Логирование для аналитики
console.log("AI Source:", welcomeResponse.source);
console.log("Confidence:", welcomeResponse.confidence);

// Умный fallback
if (welcomeResponse.confidence === "low") {
  // Показываем дефолтное сообщение
} else {
  // Показываем AI сообщение
  setAiWelcomeMessage(welcomeResponse.text);
}
```

**Плюсы:** Полный контроль, A/B тесты, аналитика  
**Минусы:** Больше кода

---

## 📝 Checklist миграции

### 1. Обновить `lib/groq.ts`
- [x] Добавлены новые типы (`AIResponse`, `UpsellHintRequest`, etc.)
- [x] Изменен return type функций
- [x] Снижен temperature
- [x] Улучшены промпты
- [x] Добавлена функция `generateUpsellHint`

### 2. Обновить API routes
- [x] `/api/ai/welcome/route.ts` - использует новую структуру
- [x] Создан `/api/ai/upsell/route.ts` - новый endpoint

### 3. Обновить frontend (опционально)
- [ ] `checkout-form.tsx` - обработка новых типов
- [ ] Добавить логирование метаданных
- [ ] Интегрировать upsell endpoint

### 4. Тестирование
- [ ] Проверить приветствие постоянного клиента
- [ ] Проверить комплименты
- [ ] Протестировать новый upsell
- [ ] Проверить fallback при ошибках

---

## 🧪 Пример интеграции в checkout-form.tsx

### До:
```typescript
const [welcomeMessage, description] = await Promise.all([
  generateWelcomeMessage(customerStats, language),
  generateOrderDescription(customerStats, language),
]);

toast.success(`🎉 ${welcomeMessage}`, {
  description: description || getOrderStats(),
});
```

### После:
```typescript
const response = await fetch("/api/ai/welcome", {
  method: "POST",
  body: JSON.stringify({ customerStats, language }),
});

const { welcomeMessage, description, meta } = await response.json();

// Логирование для аналитики
if (meta.welcomeSource === "ai") {
  console.log("✅ AI welcome generated with confidence:", meta.welcomeConfidence);
}

toast.success(`🎉 ${welcomeMessage}`, {
  description: description || getOrderStats(),
});
```

---

## 🆕 Добавление Upsell

Добавьте в `checkout-form.tsx` после секции с AI рекомендациями:

```typescript
// 🎯 AI Upsell рекомендации
const [upsellHint, setUpsellHint] = useState<string>("");

useEffect(() => {
  // Показываем только если в корзине 2+ товара
  if (items.length >= 2) {
    const fetchUpsell = async () => {
      const response = await fetch("/api/ai/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items.map(item => ({
            id: item.id,
            name: item.name[language] || item.name.en,
            category: getItemCategory(item.id), // Нужно определить функцию
            quantity: item.quantity,
          })),
          favoriteCategory: customerData?.favoriteCategory,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Показываем только если AI уверен
        if (data.hasRecommendation && data.meta.confidence === "high") {
          setUpsellHint(data.message);
        }
      }
    };

    // Debounce
    const timer = setTimeout(fetchUpsell, 1000);
    return () => clearTimeout(timer);
  }
}, [items.length, language]);

// В JSX:
{upsellHint && (
  <div className={`p-3 rounded-lg border ${
    isDark 
      ? 'bg-indigo-950/30 border-indigo-800/50' 
      : 'bg-indigo-50 border-indigo-200'
  }`}>
    <span className="text-sm">💡 {upsellHint}</span>
  </div>
)}
```

---

## ⚡ Быстрый старт (без изменения frontend)

Если хотите **только** улучшить качество AI без изменения кода:

1. Замените `lib/groq.ts` целиком
2. Обновите `/api/ai/welcome/route.ts`
3. Всё! Frontend будет работать (обратная совместимость через `welcomeMessage` и `description`)

Метаданные будут в ответе API, но frontend их пока не использует.

---

## 📊 Мониторинг после миграции

Проверьте в логах:
```
✅ AI messages generated: {
  welcome: "С возвращением, Дмитрий",
  description: "Ваш вкус безупречен",
  sources: { welcome: "ai", description: "ai" },
  confidence: { welcome: "high", description: "high" }
}
```

Если видите `source: "fallback"` - проверьте:
- Работает ли Groq API
- Валиден ли `GROQ_API_KEY`
- Не превышен ли лимит запросов

---

## 🚀 Деплой

1. **Локально:** `npm run dev` - проверьте работу
2. **Staging:** Протестируйте на реальных данных
3. **Production:** Мониторьте логи первые 24 часа

---

## 💡 Советы

- Начните с миграции **Вариант 1** (быстрый)
- Постепенно добавляйте логирование метаданных
- Upsell добавляйте **последним** (не критичен)
- Следите за `confidence` - показывайте только "high"

---

**Версия:** 1.0  
**Дата миграции:** 4 февраля 2026  
**Оценка времени:** 30-60 минут
