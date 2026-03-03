import { NextResponse } from "next/server";
import { generateWelcome, generateDescription, type CustomerStats } from "@/lib/smart-bot";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerStats, language } = body as {
      customerStats: CustomerStats;
      language: "pl" | "ru" | "uk" | "en";
    };

    if (!customerStats) {
      return NextResponse.json(
        { error: "Customer stats required" },
        { status: 400 }
      );
    }

    console.log("🤖 SmartBot: generating welcome for:", customerStats.name);

    const welcomeMessage = generateWelcome(customerStats, language);
    const description = generateDescription(customerStats, language);

    console.log("✅ SmartBot welcome:", welcomeMessage);

    return NextResponse.json({
      welcomeMessage,
      description,
      source: "smartbot",
      confidence: "high",
    });
  } catch (error) {
    console.error("SmartBot welcome error:", error);
    return NextResponse.json(
      { error: "Failed to generate welcome" },
      { status: 500 }
    );
  }
}
