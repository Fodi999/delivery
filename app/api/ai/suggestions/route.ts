import { NextRequest, NextResponse } from "next/server";
import { suggestItems } from "@/lib/smart-bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, numberOfPeople, isEnough, language } = body;

    console.log("🎯 SmartBot: generating suggestions:", {
      items: items.length,
      numberOfPeople,
      isEnough,
      language,
    });

    const cartItemIds = items.map((item: { id: string }) => item.id);
    const result = suggestItems(cartItemIds, numberOfPeople, isEnough, language);

    console.log("✅ SmartBot suggestions:", result);

    return NextResponse.json({ suggestions: result.items, confidence: result.confidence, reason: result.reason });
  } catch (error) {
    console.error("SmartBot suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
