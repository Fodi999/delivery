import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderToTelegram } from "@/lib/telegram";
import type { Order } from "@/lib/order-types";

export interface CreateOrderRequest {
  items: {
    id: string;
    title: string;
    price: number; // in cents
    quantity: number;
  }[];
  total: number; // in cents
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  deliveryFee: number; // in cents
}

export async function POST(req: Request) {
  try {
    const body: CreateOrderRequest = await req.json();

    // Validation
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!body.customer?.name || !body.customer?.phone || !body.customer?.address) {
      return NextResponse.json(
        { error: "Missing required customer information" },
        { status: 400 }
      );
    }

    // Очищаем номер телефона (убираем пробелы, тире и т.д.) для единообразного хранения
    const cleanPhone = body.customer.phone.replace(/[\s\-\(\)]/g, "");

    // Create order in database
    const order = await prisma.order.create({
      data: {
        total: body.total,
        customerName: body.customer.name,
        customerPhone: cleanPhone,
        address: body.customer.address,
        deliveryFee: body.deliveryFee,
        status: "PENDING",
        items: {
          create: body.items.map((item) => ({
            itemId: item.id,
            title: item.title,
            price: item.price,
            qty: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Convert DB order to Telegram format
    const telegramOrder: Order = {
      id: parseInt(order.id.substring(0, 8), 36), // Simple numeric ID for display
      items: body.items.map((item) => ({
        id: item.id,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      customer: body.customer,
      deliveryFee: body.deliveryFee,
      total: body.total,
      city: "Gdańsk", // Default city
      payment: "cash" as const,
      source: "web" as const,
      createdAt: order.createdAt.toISOString(),
    };

    // Send notification to Telegram (non-blocking)
    try {
      await sendOrderToTelegram(telegramOrder);
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError);
      // Continue - order is saved
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve order details
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve order" },
      { status: 500 }
    );
  }
}
