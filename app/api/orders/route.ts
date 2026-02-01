import { NextResponse } from "next/server";
import { sendOrderToTelegram } from "@/lib/telegram";
import type { Order } from "@/lib/order-types";

export async function POST(req: Request) {
  try {
    const order: Order = await req.json();

    // Валидация
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

    // Генерация ID заказа
    const orderId = Date.now();

    // Дополняем заказ
    const fullOrder: Order = {
      ...order,
      id: orderId,
      createdAt: new Date().toISOString(),
    };

    // Отправка в Telegram (не блокирует заказ при ошибке)
    try {
      await sendOrderToTelegram(fullOrder);
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError);
      // Продолжаем выполнение - заказ все равно создается
    }

    // TODO: Сохранение в базу данных (опционально)
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
