import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { CategoryDTO } from "@/lib/api-types";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { title: "asc" },
        },
      },
    });

    return NextResponse.json<CategoryDTO[]>(categories);
  } catch (error) {
    console.error("Menu API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
