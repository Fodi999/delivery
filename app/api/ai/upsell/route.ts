import { NextRequest, NextResponse } from "next/server";
import { suggestItems } from "@/lib/smart-bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart, language } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is required" }, { status: 400 });
    }

    const cartItemIds = cart.map((item: { id: string }) => item.id);
    const result = suggestItems(cartItemIds, 1, true, language || "ru");

    return NextResponse.json({
      hint: result.items[0] || null,
      suggestions: result.items,
      source: "smartbot",
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("SmartBot upsell error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
