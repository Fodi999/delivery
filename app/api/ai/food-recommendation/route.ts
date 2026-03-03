import { NextResponse } from "next/server";
import { assessPortions } from "@/lib/smart-bot";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { numberOfPeople, cartItems, language } = body as {
      numberOfPeople: number;
      cartItems: CartItem[];
      language: "pl" | "ru" | "uk" | "en";
    };

    if (!numberOfPeople || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Number of people and cart items required" },
        { status: 400 }
      );
    }

    console.log(`🍱 SmartBot: assessing portions for ${numberOfPeople} people with ${cartItems.length} items`);

    const result = assessPortions(cartItems, numberOfPeople, language);

    console.log("✅ SmartBot portion assessment:", result.recommendation);

    return NextResponse.json({
      recommendation: result.recommendation,
      totalPortions: result.totalPortions,
      totalGrams: result.totalGrams,
      recommendedGrams: result.recommendedGrams,
      isEnough: result.isEnough,
    });
  } catch (error) {
    console.error("SmartBot food-recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to assess portions" },
      { status: 500 }
    );
  }
}
