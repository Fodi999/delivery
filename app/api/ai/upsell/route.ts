import { NextRequest, NextResponse } from "next/server";
import { generateUpsellHint, type UpsellHintRequest } from "@/lib/groq";

/**
 * POST /api/ai/upsell
 * Умные рекомендации товаров (silent upsell)
 * 
 * AI не продаёт, а мягко подсказывает что можно добавить
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cart, favoriteCategory, timeOfDay, language } = body as UpsellHintRequest;

    if (!cart || cart.length === 0) {
      return NextResponse.json(
        { error: "Cart is required" },
        { status: 400 }
      );
    }

    console.log("🎯 Generating AI upsell hint for:", {
      items: cart.length,
      favoriteCategory,
      timeOfDay,
      language,
    });

    const upsellResponse = await generateUpsellHint({
      cart,
      favoriteCategory,
      timeOfDay: timeOfDay || getCurrentTimeOfDay(),
      language: language || "ru",
    });

    console.log("✅ AI upsell generated:", {
      text: upsellResponse.text,
      reason: upsellResponse.reason,
      confidence: upsellResponse.confidence,
      source: upsellResponse.source,
    });

    // Если AI решил что ничего не нужно предлагать
    if (upsellResponse.reason === "none") {
      return NextResponse.json({
        hasRecommendation: false,
        message: null,
      });
    }

    return NextResponse.json({
      hasRecommendation: true,
      message: upsellResponse.text,
      reason: upsellResponse.reason,
      itemId: upsellResponse.itemId,
      itemName: upsellResponse.itemName,
      // Метаданные для аналитики
      meta: {
        confidence: upsellResponse.confidence,
        source: upsellResponse.source,
        model: upsellResponse.metadata?.model,
      },
    });
  } catch (error) {
    console.error("❌ AI upsell error:", error);
    return NextResponse.json(
      { error: "Failed to generate upsell recommendation" },
      { status: 500 }
    );
  }
}

/**
 * Определяет текущее время суток
 */
function getCurrentTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}
