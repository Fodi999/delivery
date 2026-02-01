# 🚀 Roadmap: Полноценная система доставки

## ✅ ЧТО УЖЕ ГОТОВО

- 🛒 Корзина с persist (localStorage)
- 📱 Checkout форма с UX-оптимизацией
- 📞 PhoneInput компонент (+48 Poland)
- 📍 Геолокация (Nominatim API)
- 🤖 Telegram уведомления с фото
- 🎛 Кнопки управления заказом
- 📦 Order API endpoint
- 🎨 Multi-language (en/pl/ru)

---

## 🎯 ШАГ 1: Обработка кнопок в Telegram (КРИТИЧНО)

**Что нужно сделать:**

### 1.1 Webhook для Telegram Bot

Создать `/app/api/telegram/webhook/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const update = await req.json();
  
  // Обработка callback_query (нажатие на кнопки)
  if (update.callback_query) {
    const callbackData = update.callback_query.data;
    const messageId = update.callback_query.message.message_id;
    const chatId = update.callback_query.message.chat.id;
    
    // Парсим callback_data: "accept_123", "delivery_123", "cancel_123"
    const [action, orderId] = callbackData.split("_");
    
    // TODO: Обновить статус заказа в базе данных
    // await updateOrderStatus(orderId, action);
    
    // Обновляем текст сообщения
    let statusEmoji = "";
    let statusText = "";
    
    switch (action) {
      case "accept":
        statusEmoji = "✅";
        statusText = "ПРИНЯТ";
        break;
      case "delivery":
        statusEmoji = "🛵";
        statusText = "В ДОСТАВКЕ";
        break;
      case "cancel":
        statusEmoji = "❌";
        statusText = "ОТМЕНЁН";
        break;
    }
    
    // Отправляем ответ пользователю (всплывающее уведомление)
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: update.callback_query.id,
          text: `${statusEmoji} Заказ #${orderId} ${statusText}`,
        }),
      }
    );
    
    // Редактируем сообщение (добавляем статус)
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageCaption`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          caption: `${statusEmoji} СТАТУС: ${statusText}\n\n` + 
                   update.callback_query.message.caption,
          parse_mode: "Markdown",
        }),
      }
    );
    
    return NextResponse.json({ ok: true });
  }
  
  return NextResponse.json({ ok: true });
}
```

### 1.2 Настройка Webhook

После деплоя на Vercel, настроить webhook:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ваш-домен.vercel.app/api/telegram/webhook"}'
```

**Важно:** Для локальной разработки используйте ngrok или cloudflare tunnel.

---

## 🗄 ШАГ 2: База данных для заказов

**Почему важно:**
- Сейчас заказы только в Telegram (можно потерять)
- Нужна история для аналитики
- Нужно хранить статусы

**Варианты:**

### Вариант A: Vercel Postgres (рекомендуется)
```bash
npm install @vercel/postgres
```

**Schema:**
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_comment TEXT,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  city TEXT NOT NULL,
  payment TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

### Вариант B: SQLite (для локальной разработки)
```bash
npm install better-sqlite3
```

### Вариант C: MongoDB Atlas (бесплатный tier)
```bash
npm install mongodb
```

---

## 📊 ШАГ 3: Статусы заказов

Обновить `/lib/order-types.ts`:

```typescript
export type OrderStatus =
  | "new"          // 🆕 Новый (только создан)
  | "accepted"     // ✅ Принят кухней
  | "preparing"    // 👨‍🍳 Готовится
  | "ready"        // 🍱 Готов к выдаче
  | "on_the_way"   // 🛵 В доставке
  | "delivered"    // ✅ Доставлен
  | "cancelled";   // ❌ Отменён

export type Order = {
  id?: number;
  status?: OrderStatus; // Добавить это поле
  customer: {
    name: string;
    phone: string;
    address: string;
    comment?: string;
  };
  items: OrderItem[];
  total: number;
  city: string;
  payment: "cash" | "card";
  source: "web" | "telegram" | "phone";
  createdAt?: string;
  updatedAt?: string;
};
```

---

## 🎨 ШАГ 4: Админ-панель (опционально, но полезно)

**Минимальный функционал:**

- Список всех заказов
- Фильтр по статусу
- Поиск по телефону/имени
- Изменение статуса
- Статистика (сумма за день/неделю/месяц)

**Технологии:**
- `/app/admin/page.tsx` (защищённый роут)
- shadcn/ui Table компонент
- React Query для live-обновлений

**Защита:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const basicAuth = request.headers.get('authorization');
    
    if (!basicAuth || !isValidAuth(basicAuth)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }
  }
}
```

---

## 🚀 ШАГ 5: Production Deployment (Vercel)

### 5.1 Environment Variables

В Vercel Dashboard → Settings → Environment Variables:

```
TELEGRAM_BOT_TOKEN=7186385439:AAHJTPaPcSLq-5xSkCC1FkNzpnViJiXzjnM
TELEGRAM_CHAT_ID=-5102985150
DATABASE_URL=postgres://... (если используете БД)
```

### 5.2 Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 5.3 Проверка перед деплоем

✅ Все image URLs используют HTTPS  
✅ .env.local не коммитится в git  
✅ API routes защищены от спама (rate limiting)  
✅ Error boundaries настроены  
✅ Loading states добавлены  

---

## 📈 ШАГ 6: Аналитика и оптимизация

**Metrics to track:**

- Конверсия корзины → заказ
- Средний чек (Average Order Value)
- Время от создания до доставки
- Популярные блюда
- География заказов

**Инструменты:**
- Vercel Analytics
- Google Analytics 4
- Или собственная таблица metrics в БД

---

## 🔐 ШАГ 7: Безопасность

**Важные меры:**

### 7.1 Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 заказов в минуту
});
```

### 7.2 Input Validation
```bash
npm install zod
```

```typescript
import { z } from "zod";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^\+48\s\d{3}\s\d{3}\s\d{3}$/),
    address: z.string().min(10).max(300),
    comment: z.string().max(500).optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().min(1).max(99),
  })).min(1),
});
```

### 7.3 CORS Protection
```typescript
// В API routes
const allowedOrigins = [
  'https://ваш-домен.com',
  'http://localhost:3000',
];
```

---

## 🎁 БОНУСНЫЕ ФИЧИ (когда основное готово)

### Push-уведомления клиентам
- Firebase Cloud Messaging
- Уведомление когда заказ готов

### SMS-уведомления
- Twilio или другой SMS-провайдер
- Отправка кода подтверждения

### Промокоды и скидки
```typescript
type PromoCode = {
  code: string;
  discount: number; // процент или фиксированная сумма
  validUntil: Date;
  maxUses: number;
  usedCount: number;
};
```

### Программа лояльности
- Бонусные баллы за заказы
- Кэшбэк на следующий заказ

### Интеграция с доставкой
- API Wolt/Bolt/Glovo
- Автоматическое создание задач курьерам

---

## 📋 Текущая архитектура

```
Frontend (Next.js)
    ↓
Checkout Form
    ↓
POST /api/orders
    ↓
1. Validate data
2. Generate orderId
3. Send to Telegram
4. [TODO] Save to DB
    ↓
Success Page
```

**Целевая архитектура:**

```
Frontend
    ↓
API Gateway
    ↓
├─ Order Service (create, update, list)
├─ Payment Service (в будущем)
├─ Notification Service (Telegram, SMS, Push)
└─ Analytics Service
    ↓
Database (PostgreSQL)
    ↓
Admin Dashboard
```

---

## 🎯 ПРИОРИТЕТЫ (что делать первым)

### Неделя 1: Core Features
1. ✅ Telegram webhook для кнопок
2. ✅ База данных (Vercel Postgres)
3. ✅ Сохранение заказов в БД

### Неделя 2: Stability
4. ✅ Error handling улучшенный
5. ✅ Rate limiting
6. ✅ Input validation (Zod)

### Неделя 3: UX
7. ✅ Админ-панель (базовая)
8. ✅ История заказов клиента
9. ✅ Статусы в реальном времени

### Неделя 4: Production
10. ✅ Vercel deployment
11. ✅ Monitoring и alerts
12. ✅ Performance optimization

---

**Готов помочь с реализацией любого из этих шагов! 🚀**

Что делаем дальше?
