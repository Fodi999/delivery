import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/telegram/webhook
 *
 * Команды бота:
 *   /stats    — общая статистика (заказы, выручка, клиенты)
 *   /today    — заказы за сегодня
 *   /orders   — последние 5 заказов
 *   /pending  — активные заказы (PENDING + ACCEPTED + COOKING)
 *
 * Кнопки заказа:
 *   accept_<id>   → ACCEPTED
 *   cooking_<id>  → COOKING
 *   delivery_<id> → DELIVERING
 *   cancel_<id>   → CANCELED
 *
 * Настройка вебхука (один раз):
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<domain>/api/telegram/webhook"
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: false, error: "No bot token" }, { status: 500 });
    }

    // ── Текстовые команды ──────────────────────────────────────────────────
    const message = body?.message;
    if (message?.text) {
      const chatId: number = message.chat.id;
      const text: string = message.text.trim();

      if (text === "/stats" || text === "/статистика") {
        await handleStats(botToken, chatId);
        return NextResponse.json({ ok: true });
      }
      if (text === "/today" || text === "/сегодня") {
        await handleToday(botToken, chatId);
        return NextResponse.json({ ok: true });
      }
      if (text === "/orders" || text === "/заказы") {
        await handleRecentOrders(botToken, chatId);
        return NextResponse.json({ ok: true });
      }
      if (text === "/pending" || text === "/активные") {
        await handlePending(botToken, chatId);
        return NextResponse.json({ ok: true });
      }
      if (text === "/start" || text === "/help" || text === "/помощь") {
        await sendMessage(botToken, chatId, `
🤖 *FodiFood Bot — Команды*

📊 /stats — общая статистика
📅 /today — заказы за сегодня
📋 /orders — последние 5 заказов
⏳ /pending — активные заказы

*Кнопки в заказах:*
✅ Принять → 🍳 Готовится → 🛵 Курьер выехал → ❌ Отмена
        `.trim());
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // ── Callback кнопок заказа ─────────────────────────────────────────────
    const callback = body?.callback_query;
    if (!callback) {
      return NextResponse.json({ ok: true });
    }

    const callbackData: string = callback.data ?? "";
    const chatId: number = callback.message?.chat?.id;
    const messageId: number = callback.message?.message_id;

    // Парсим action_orderId
    const separatorIdx = callbackData.indexOf("_");
    const action = callbackData.slice(0, separatorIdx);
    const orderId = callbackData.slice(separatorIdx + 1);

    if (!orderId) {
      await answerCallback(botToken, callback.id, "❌ Неверный формат");
      return NextResponse.json({ ok: true });
    }

    // Маппинг действий на статусы
    const statusMap: Record<string, string> = {
      accept:   "ACCEPTED",
      cooking:  "COOKING",
      delivery: "DELIVERING",
      cancel:   "CANCELED",
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      await answerCallback(botToken, callback.id, "❓ Неизвестное действие");
      return NextResponse.json({ ok: true });
    }

    // Обновляем статус в БД
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus as any },
      select: { id: true, customerName: true, status: true },
    });

    const statusEmoji: Record<string, string> = {
      ACCEPTED:   "✅ Принят",
      COOKING:    "🍳 Готовится",
      DELIVERING: "🛵 Курьер выехал",
      CANCELED:   "❌ Отменён",
    };

    const statusText = statusEmoji[newStatus] ?? newStatus;
    await answerCallback(botToken, callback.id, statusText);
    await editMessageStatus(botToken, chatId, messageId, order.customerName, statusText);

    console.log(`✅ Order ${orderId} → ${newStatus}`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// ── Команда /stats ─────────────────────────────────────────────────────────
async function handleStats(token: string, chatId: number) {
  const [total, done, canceled, revenue, uniqueClients] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "DONE" } }),
    prisma.order.count({ where: { status: "CANCELED" } }),
    prisma.order.aggregate({ where: { status: "DONE" }, _sum: { total: true } }),
    prisma.order.groupBy({ by: ["customerPhone"], _count: true }).then(r => r.length),
  ]);

  const pending = total - done - canceled;
  const revenueZl = ((revenue._sum.total ?? 0) / 100).toFixed(0);
  const avgCheck = done > 0 ? ((revenue._sum.total ?? 0) / done / 100).toFixed(0) : "0";

  await sendMessage(token, chatId, `
📊 *Статистика FodiFood*

📦 Всего заказов: *${total}*
✅ Выполнено: *${done}*
⏳ В работе: *${pending}*
❌ Отменено: *${canceled}*

💰 Выручка (выполненные): *${revenueZl} zł*
🧾 Средний чек: *${avgCheck} zł*
👥 Уникальных клиентов: *${uniqueClients}*
  `.trim());
}

// ── Команда /today ─────────────────────────────────────────────────────────
async function handleToday(token: string, chatId: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [orders, revenue] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: startOfDay } },
      orderBy: { createdAt: "desc" },
      select: { id: true, customerName: true, total: true, status: true, createdAt: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { total: true },
    }),
  ]);

  if (orders.length === 0) {
    await sendMessage(token, chatId, "📅 Сегодня заказов ещё нет");
    return;
  }

  const revenueZl = ((revenue._sum.total ?? 0) / 100).toFixed(0);
  const statusIcon: Record<string, string> = {
    PENDING: "🟡", ACCEPTED: "✅", COOKING: "🍳", DELIVERING: "🛵", DONE: "✓", CANCELED: "❌",
  };

  const lines = orders.map(o => {
    const time = new Date(o.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const totalZl = (o.total / 100).toFixed(0);
    return `${statusIcon[o.status] ?? "•"} ${time} — ${o.customerName} — *${totalZl} zł*`;
  });

  await sendMessage(token, chatId, `
📅 *Заказы за сегодня (${orders.length})*
💰 Выручка: *${revenueZl} zł*

${lines.join("\n")}
  `.trim());
}

// ── Команда /orders ────────────────────────────────────────────────────────
async function handleRecentOrders(token: string, chatId: number) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: true },
  });

  if (orders.length === 0) {
    await sendMessage(token, chatId, "📋 Заказов пока нет");
    return;
  }

  const statusIcon: Record<string, string> = {
    PENDING: "🟡 Новый", ACCEPTED: "✅ Принят", COOKING: "🍳 Готовится",
    DELIVERING: "🛵 В пути", DONE: "✓ Выполнен", CANCELED: "❌ Отменён",
  };

  for (const o of orders) {
    const totalZl = (o.total / 100).toFixed(0);
    const fee = o.deliveryFee > 0 ? `${(o.deliveryFee / 100).toFixed(0)} zł` : "Бесплатно";
    const time = new Date(o.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const itemLines = o.items.map(i => `  • ${i.title} ×${i.qty}`).join("\n");

    await sendMessage(token, chatId, `
📦 *${o.customerName}* — ${statusIcon[o.status] ?? o.status}
📞 ${o.customerPhone}
📍 ${o.address}
🕒 ${time}
${itemLines}
💰 *${totalZl} zł* | Доставка: ${fee}
    `.trim());
  }
}

// ── Команда /pending ───────────────────────────────────────────────────────
async function handlePending(token: string, chatId: number) {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "ACCEPTED", "COOKING", "DELIVERING"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, customerName: true, total: true, status: true, createdAt: true, address: true },
  });

  if (orders.length === 0) {
    await sendMessage(token, chatId, "⏳ Активных заказов нет");
    return;
  }

  const statusIcon: Record<string, string> = {
    PENDING: "🟡 Новый", ACCEPTED: "✅ Принят", COOKING: "🍳 Готовится", DELIVERING: "🛵 В пути",
  };

  const lines = orders.map(o => {
    const totalZl = (o.total / 100).toFixed(0);
    const time = new Date(o.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return `${statusIcon[o.status] ?? "•"} *${o.customerName}* — ${totalZl} zł\n   📍 ${o.address} (${time})`;
  });

  await sendMessage(token, chatId, `
⏳ *Активные заказы (${orders.length})*

${lines.join("\n\n")}
  `.trim());
}

// ── Telegram API helpers ───────────────────────────────────────────────────
async function sendMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function answerCallback(token: string, callbackId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: false }),
  });
}

async function editMessageStatus(token: string, chatId: number, messageId: number, customerName: string, statusText: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🔄 *${customerName}:* ${statusText}`,
      parse_mode: "Markdown",
    }),
  });
}

