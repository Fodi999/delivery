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

    // Генерируем персонализированные сообщения (теперь возвращают структуру)
    const [welcomeResponse, descriptionResponse] = await Promise.all([
      generateWelcomeMessage(customerStats, language),
      generateOrderDescription(customerStats, language),
    ]);

    console.log("✅ AI messages generated:", { 
      welcome: welcomeResponse.text, 
      description: descriptionResponse.text,
      sources: {
        welcome: welcomeResponse.source,
        description: descriptionResponse.source,
      },
      confidence: {
        welcome: welcomeResponse.confidence,
        description: descriptionResponse.confidence,
      }
    });

    // Возвращаем текст для обратной совместимости + метаданные для логирования
    return NextResponse.json({
      welcomeMessage: welcomeResponse.text,
      description: descriptionResponse.text,
      // Дополнительные метаданные для A/B тестов и аналитики
      meta: {
        welcomeSource: welcomeResponse.source,
        welcomeConfidence: welcomeResponse.confidence,
        descriptionSource: descriptionResponse.source,
        descriptionConfidence: descriptionResponse.confidence,
      },
    });
  } catch (error) {
    console.error("AI welcome generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate welcome message" },
      { status: 500 }
    );
  }
}
