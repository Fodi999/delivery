import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/customers?phone=+48123456789
 * Поиск клиента по номеру телефона
 * Возвращает данные последнего заказа для автозаполнения формы
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Очищаем номер телефона (убираем пробелы, тире и т.д.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    console.log("🔍 Looking up customer with phone:", cleanPhone);

    // Ищем последний заказ этого клиента
    const lastOrder = await prisma.order.findFirst({
      where: { customerPhone: cleanPhone },
      orderBy: { createdAt: "desc" },
      select: {
        customerName: true,
        address: true,
        createdAt: true,
      },
    });

    console.log("📋 Last order found:", lastOrder ? "YES" : "NO");

    if (!lastOrder) {
      // Новый клиент
      return NextResponse.json({
        isReturning: false,
        message: "Новый клиент",
      });
    }

    // Считаем общее количество заказов
    const totalOrders = await prisma.order.count({
      where: { customerPhone: cleanPhone },
    });

    // Считаем завершенные заказы
    const completedOrders = await prisma.order.count({
      where: {
        customerPhone: cleanPhone,
        status: "DONE",
      },
    });

    // Считаем общую сумму заказов (в центах)
    const ordersSum = await prisma.order.aggregate({
      where: {
        customerPhone: cleanPhone,
        status: "DONE",
      },
      _sum: {
        total: true,
      },
    });

    console.log("📋 Total orders:", totalOrders, "Completed:", completedOrders, "Total spent:", ordersSum._sum.total);

    // Постоянный клиент найден!
    const response = {
      isReturning: true,
      name: lastOrder.customerName,
      address: lastOrder.address,
      lastOrderDate: lastOrder.createdAt,
      totalOrders,
      completedOrders,
      totalSpent: ordersSum._sum.total || 0, // в центах
    };

    console.log("✅ Returning customer data:", JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Customer lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup customer" },
      { status: 500 }
    );
  }
}
