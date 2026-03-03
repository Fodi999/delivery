import type { Order } from "./order-types";

export async function sendOrderToTelegram(order: Order): Promise<void> {
  console.log("📱 SENDING ORDER TO TELEGRAM...");
  console.log(`Order #${order.id} - ${order.customer.name}`);

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    }

    // 1️⃣ Формируем текст заказа
    const caption = `
🚀 *НОВЫЙ ЗАКАЗ #${order.id}*

👤 *Клиент:* ${order.customer.name}
📞 *Телефон:* ${order.customer.phone}
📍 *Адрес:* ${order.customer.address}
👥 *Персон:* ${order.customer.numberOfPeople ?? 1}
${order.customer.comment ? `💬 *Комментарий:* ${order.customer.comment}\n` : ""}
📋 *Состав заказа:*
${order.items
  .map((i) => `  • ${i.name} × ${i.quantity} → ${i.price * i.quantity} zł`)
  .join("\n")}

💰 *Сумма:* ${order.total} zł
📦 *Доставка:* ${(order.deliveryFee ?? 0) > 0 ? `${order.deliveryFee} zł` : "Бесплатно"}
💳 *Оплата:* ${order.payment === "cash" ? "Наличными при получении" : "Картой онлайн"}
🏙 *Город:* ${order.city}
🔥 *ИТОГО К ОПЛАТЕ:* ${order.total + (order.deliveryFee || 0)} zł
🕒 *Время:* ${order.createdAt ? new Date(order.createdAt).toLocaleString("ru-RU") : new Date().toLocaleString("ru-RU")}
`;

    // 2️⃣ Проверяем, есть ли фото у блюд
    const itemsWithPhotos = order.items.filter((i) => i.image);

    // 3️⃣ Кнопки управления заказом
    const reply_markup = {
      inline_keyboard: [
        [{ text: "✅ Принять заказ", callback_data: `accept_${order.id}` }],
        [{ text: "🍳 Готовится", callback_data: `cooking_${order.id}` }],
        [{ text: "🛵 Курьер выехал", callback_data: `delivery_${order.id}` }],
        [{ text: "❌ Отменить заказ", callback_data: `cancel_${order.id}` }],
      ],
    };

    if (itemsWithPhotos.length > 0) {
      // 🔥 Отправляем с фотографиями (sendMediaGroup)
      const media = itemsWithPhotos.slice(0, 10).map((item, index) => ({
        type: "photo",
        media: item.image,
        caption: index === 0 ? caption : undefined,
        parse_mode: index === 0 ? ("Markdown" as const) : undefined,
      }));

      // Отправляем медиа-группу
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMediaGroup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            media,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }

      // Отправляем кнопки отдельным сообщением (т.к. sendMediaGroup не поддерживает reply_markup)
      const buttonsResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🎛 *Управление заказом #${order.id}*`,
            parse_mode: "Markdown",
            reply_markup,
          }),
        }
      );

      if (!buttonsResponse.ok) {
        console.error("Failed to send buttons, but order photos sent successfully");
      }

      console.log("✅ Order with photos sent to Telegram successfully");
    } else {
      // 📝 Если фото нет — отправляем обычным текстом с кнопками
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: caption,
            parse_mode: "Markdown",
            reply_markup,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${error}`);
      }

      console.log("✅ Order sent to Telegram successfully");
    }
  } catch (error) {
    console.error("❌ Failed to send order to Telegram:", error);
  }
}
