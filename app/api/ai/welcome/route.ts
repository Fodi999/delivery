import { NextResponse } from "next/server";
import { generateWelcomeMessage, generateOrderDescription, type CustomerStats } from "@/lib/groq";

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

    console.log("🤖 Generating AI welcome message for:", customerStats.name);

    // Генерируем персонализированные сообщения
    const [welcomeMessage, description] = await Promise.all([
      generateWelcomeMessage(customerStats, language),
      generateOrderDescription(customerStats, language),
    ]);

    console.log("✅ AI messages generated:", { welcomeMessage, description });

    return NextResponse.json({
      welcomeMessage,
      description,
    });
  } catch (error) {
    console.error("AI welcome generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate welcome message" },
      { status: 500 }
    );
  }
}
