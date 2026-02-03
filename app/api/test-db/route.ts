import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Проверяем подключение к базе
    const result = await prisma.$queryRaw`SELECT now() as current_time`;
    
    // Проверяем количество таблиц
    const categories = await prisma.category.count();
    const menuItems = await prisma.menuItem.count();
    const orders = await prisma.order.count();
    
    return NextResponse.json({
      status: "✅ Database connected",
      database: result,
      tables: {
        categories,
        menuItems,
        orders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "❌ Database error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
