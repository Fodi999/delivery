import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { CategoryDTO } from "@/lib/api-types";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export async function GET(
  request: Request,
  context: { params: Promise<{ category: string }> }
) {
  try {
    const { category: categorySlug } = await context.params;

    const category = await prisma.category.findFirst({
      where: {
        slug: categorySlug,
        AND: [{ isActive: true }],
      },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { title: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<CategoryDTO>(category);
  } catch (error) {
    console.error("Menu category API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
