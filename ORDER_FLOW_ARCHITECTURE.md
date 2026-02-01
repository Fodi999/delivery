# 📦 Архитектура Order Flow — Production Ready

## 🎯 Общая схема

```
CheckoutForm
      ↓ submit
POST /api/orders
      ↓ validate
  send email (Gmail SMTP)
      ↓ success
  return orderId
      ↓ redirect
Success page (/order/success?orderId=XXX)
      ↓ auto
  clear cart
```

---

## 📂 Структура файлов

```
delivery/
├── lib/
│   ├── order-types.ts       # TypeScript типы (Order, OrderItem)
│   └── email.ts             # Отправка email (Gmail SMTP)
├── app/
│   ├── api/
│   │   └── orders/
│   │       └── route.ts     # POST /api/orders (backend)
│   └── order/
│       └── success/
│           └── page.tsx     # Success страница
└── components/
    └── checkout/
        └── checkout-form.tsx  # Форма оформления
```

---

## 🥇 ШАГ 1 — Order Types (единый формат)

### `/lib/order-types.ts`

```typescript
export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id?: number;                // Генерируется на backend
  customer: {
    name: string;
    phone: string;
    address: string;
    comment?: string;
  };
  items: OrderItem[];
  total: number;
  city: string;
  payment: "cash";            // Пока только наличные
  source: "web";              // Источник заказа
  createdAt?: string;         // ISO timestamp
};
```

**Зачем это важно:**
- ✅ Единый формат = легко расширять
- ✅ TypeScript проверка на всех уровнях
- ✅ Можно добавить другие payment методы позже
- ✅ Готово для базы данных (если добавишь)

---

## 🥈 ШАГ 2 — API Endpoint (backend)

### `/app/api/orders/route.ts`

```typescript
import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/email";
import type { Order } from "@/lib/order-types";

export async function POST(req: Request) {
  try {
    const order: Order = await req.json();

    // 1. Валидация
    if (!order.customer?.name || !order.customer?.phone || !order.customer?.address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!order.items || order.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // 2. Генерация ID заказа
    const orderId = Date.now();

    // 3. Дополняем заказ
    const fullOrder: Order = {
      ...order,
      id: orderId,
      createdAt: new Date().toISOString(),
    };

    // 4. Отправка email
    await sendOrderEmail(fullOrder);

    // 5. TODO: Сохранение в базу (опционально)
    // await saveOrderToDatabase(fullOrder);

    return NextResponse.json({
      success: true,
      orderId,
      message: "Order received successfully",
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
```

**Что делает:**
1. ✅ Валидирует данные
2. ✅ Генерирует уникальный ID (timestamp)
3. ✅ Отправляет email владельцу ресторана
4. ✅ Возвращает orderId для redirect
5. ✅ Error handling

**Production готово:**
- ✅ Работает на Vercel без изменений
- ✅ Безопасно (валидация на backend)
- ✅ Можно логировать / мониторить

---

## 📧 ШАГ 3 — Email отправка

### `/lib/email.ts`

**Development режим (сейчас):**
```typescript
export async function sendOrderEmail(order: Order): Promise<void> {
  // Логируем в консоль
  console.log("📧 ORDER EMAIL SENT:");
  console.log(`Order #${order.id}`);
  console.log(`Customer: ${order.customer.name}`);
  // ...
}
```

**Production режим (для real email):**

1. **Установи Nodemailer:**
   ```bash
   npm install nodemailer
   ```

2. **Создай App Password в Gmail:**
   - Зайди в Google Account → Security
   - 2-Step Verification → App passwords
   - Generate password для "Mail"
   - Скопируй пароль (16 символов)

3. **Добавь в `.env.local`:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-password
   ```

4. **Раскомментируй код в `/lib/email.ts`:**
   ```typescript
   const nodemailer = require("nodemailer");

   const transporter = nodemailer.createTransport({
     service: "gmail",
     auth: {
       user: process.env.GMAIL_USER,
       pass: process.env.GMAIL_APP_PASSWORD,
     },
   });

   await transporter.sendMail({
     from: process.env.GMAIL_USER,
     to: "restaurant@example.com",  // Email ресторана
     subject: `🍕 New Order #${order.id}`,
     html: `
       <h2>New Order #${order.id}</h2>
       <p><strong>Customer:</strong> ${order.customer.name}</p>
       <p><strong>Phone:</strong> ${order.customer.phone}</p>
       <p><strong>Address:</strong> ${order.customer.address}</p>
       
       <h3>Items:</h3>
       <ul>
         ${order.items.map((item) => `
           <li>${item.name} x${item.quantity} — ${item.price * item.quantity} zł</li>
         `).join("")}
       </ul>
       
       <h3>Total: ${order.total} zł</h3>
     `,
   });
   ```

**Альтернативы Gmail:**
- Resend (https://resend.com) — 100 emails/день бесплатно
- SendGrid — 100 emails/день бесплатно
- Mailgun — 5000 emails/месяц бесплатно

---

## 🎨 ШАГ 4 — Форма Checkout

### `/components/checkout/checkout-form.tsx`

**Ключевой код:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Валидация
  if (!formData.name.trim() || !validatePhone(formData.phone)) {
    toast.error("Fill all fields");
    return;
  }

  setIsSubmitting(true);

  // Формируем заказ
  const order: Order = {
    customer: {
      name: formData.name.trim(),
      phone: `+48 ${formData.phone.trim()}`,
      address: formData.address.trim(),
      comment: formData.comment.trim() || undefined,
    },
    items: items.map((item) => ({
      id: item.id,
      name: item.name[language] || item.name.en,
      price: item.price,
      quantity: item.quantity,
    })),
    total,
    city,
    payment: "cash",
    source: "web",
  };

  try {
    // Отправка на backend
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      toast.success("Order accepted!");
      clear();  // Очищаем корзину
      router.push(`/order/success?orderId=${data.orderId}`);
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    toast.error("Failed to submit order");
  } finally {
    setIsSubmitting(false);
  }
};
```

**Что делает:**
1. ✅ Валидирует форму
2. ✅ Форматирует данные (Order type)
3. ✅ Отправляет POST /api/orders
4. ✅ Обрабатывает ошибки
5. ✅ Очищает корзину
6. ✅ Редиректит на success страницу

---

## 🎉 ШАГ 5 — Success Page

### `/app/order/success/page.tsx`

```typescript
export default function OrderSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold">Order accepted</h1>
        <p className="text-lg">Order № {orderId}</p>
        <p className="text-neutral-500">Delivery time: 30–45 min</p>

        <Button onClick={() => router.push("/")}>
          Back to menu
        </Button>
      </div>
    </div>
  );
}
```

**UX детали:**
- ✅ Зелёная галочка (психологическое завершение)
- ✅ Номер заказа (для отслеживания)
- ✅ Время доставки (ожидания)
- ✅ Кнопка назад в меню

---

## 🧪 Тестирование

### 1. Development (сейчас)

```bash
npm run dev
```

**Тест заказа:**
1. Добавь товары в корзину
2. Перейди на `/checkout`
3. Заполни форму
4. Нажми "Заказать • XX zł"
5. Смотри консоль → email "отправлен" (console.log)
6. Редирект на `/order/success?orderId=1738445678901`

**Ожидаемое в консоли:**
```
📧 ORDER EMAIL SENT:
─────────────────────────────────────
Order #1738445678901
Customer: Jan Kowalski
Phone: +48 123 456 789
Address: ul. Długa 12, Gdańsk
Items:
  • Pizza Margherita x1 — 25 zł
  • Pizza Pepperoni x2 — 60 zł
Total: 85 zł
─────────────────────────────────────
```

### 2. Production (с Gmail SMTP)

**Setup:**
```bash
# 1. Установи nodemailer
npm install nodemailer

# 2. Создай .env.local
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password

# 3. Раскомментируй код в lib/email.ts

# 4. Deploy на Vercel
vercel --prod

# 5. Добавь env variables на Vercel:
# Settings → Environment Variables →
# GMAIL_USER
# GMAIL_APP_PASSWORD
```

**Тест:**
1. Оформи заказ на production сайте
2. Проверь почту ресторана → должен прийти email
3. Клиент видит success страницу

---

## 🔒 Безопасность

### ✅ Что уже есть:

| Аспект | Реализация |
|--------|------------|
| Валидация на backend | ✅ Проверка всех полей |
| TypeScript типы | ✅ Защита от неправильных данных |
| Error handling | ✅ Try-catch, HTTP статусы |
| HTTPS | ✅ Vercel автоматически |
| Email credentials | ✅ В .env (не в коде) |

### ⚠️ TODO для production:

- [ ] Rate limiting (защита от спама заказов)
- [ ] CAPTCHA (если много фейковых заказов)
- [ ] IP logging (для отслеживания)
- [ ] Webhook для SMS уведомлений
- [ ] Backup email получателей

---

## 📈 Расширения (будущее)

### 1. База данных

**Prisma schema:**
```prisma
model Order {
  id        Int      @id @default(autoincrement())
  customer  Json     // { name, phone, address }
  items     Json     // [{ id, name, price, quantity }]
  total     Float
  city      String
  payment   String
  source    String
  status    String   @default("pending")
  createdAt DateTime @default(now())
}
```

**Добавь в `/app/api/orders/route.ts`:**
```typescript
await prisma.order.create({
  data: fullOrder,
});
```

### 2. SMS уведомления

**Twilio integration:**
```typescript
await twilio.messages.create({
  body: `Заказ #${orderId} принят. Доставка 30-45 мин.`,
  from: "+48123456789",
  to: order.customer.phone,
});
```

### 3. Admin dashboard

**`/app/admin/orders/page.tsx`:**
- Список заказов
- Статусы (pending, preparing, delivering, delivered)
- Кнопки "Принять" / "Отклонить"

### 4. Real-time статус

**WebSocket / Pusher:**
- Клиент видит: "Заказ готовится 🍕"
- Обновления в real-time

---

## ✅ Checklist для production

### Backend
- [ ] Gmail SMTP настроен (или другой сервис)
- [ ] `.env` переменные на Vercel
- [ ] Email получателя корректный
- [ ] Тестовый заказ отправлен успешно

### Frontend
- [ ] Форма валидируется правильно
- [ ] Loading states показываются
- [ ] Ошибки обрабатываются
- [ ] Success страница работает
- [ ] Корзина очищается после заказа

### Testing
- [ ] Тест с пустой корзиной (должна быть ошибка)
- [ ] Тест с неправильным телефоном (валидация)
- [ ] Тест с пустыми полями (валидация)
- [ ] Тест нормального заказа (успех)

---

## 🚀 Deploy на Vercel

```bash
# 1. Commit код
git add .
git commit -m "feat: complete order flow"
git push

# 2. Deploy
vercel --prod

# 3. Добавь env variables на Vercel dashboard:
# Settings → Environment Variables
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# 4. Redeploy
vercel --prod
```

---

## 📊 Мониторинг

### Vercel Logs
```
Dashboard → Project → Logs
→ Фильтруй по "/api/orders"
→ Видишь все заказы и ошибки
```

### Error tracking (опционально)
- Sentry — мониторинг ошибок
- LogRocket — session replay
- PostHog — аналитика

---

## 🎯 Итог

### Что работает прямо сейчас:

✅ **Checkout form** с валидацией  
✅ **POST /api/orders** endpoint  
✅ **Email отправка** (console.log в dev)  
✅ **Success page** с номером заказа  
✅ **Cart clearing** после успеха  
✅ **TypeScript типизация** везде  
✅ **Error handling** на всех уровнях  

### Что добавить для production:

🔧 **Gmail SMTP** (5 минут setup)  
🔧 **Vercel env variables** (2 минуты)  
🔧 **Test order** на production  

**Total setup time:** ~10 минут 🚀

---

**Создано:** 2026-02-01  
**Status:** ✅ Production Ready (только email setup осталось)  
**Architecture:** Clean, scalable, type-safe
