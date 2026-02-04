/**
 * AI Telemetry - логирование метрик AI для аналитики
 * 
 * Отслеживает:
 * - source (ai / fallback)
 * - confidence (high / medium / low)
 * - accepted / ignored (пользователь взаимодействовал?)
 * - response time
 */

export interface AITelemetryEvent {
  type: "welcome" | "compliment" | "upsell";
  source: "ai" | "fallback";
  confidence: "high" | "medium" | "low";
  responseTime?: number; // ms
  accepted?: boolean; // Пользователь кликнул/добавил?
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class AITelemetry {
  private events: AITelemetryEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Логирует AI событие
   */
  logEvent(event: Omit<AITelemetryEvent, "sessionId">): void {
    const fullEvent: AITelemetryEvent = {
      ...event,
      sessionId: this.sessionId,
    };

    this.events.push(fullEvent);

    // Консольный лог для разработки
    if (process.env.NODE_ENV === "development") {
      console.log("📊 AI Telemetry:", {
        type: fullEvent.type,
        source: fullEvent.source,
        confidence: fullEvent.confidence,
        responseTime: fullEvent.responseTime ? `${fullEvent.responseTime}ms` : "N/A",
        accepted: fullEvent.accepted ?? "pending",
      });
    }

    // В production можно отправлять на аналитику
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalytics(fullEvent);
    }
  }

  /**
   * Обновляет событие (когда пользователь взаимодействует)
   */
  markAsAccepted(type: AITelemetryEvent["type"], accepted: boolean): void {
    const lastEvent = this.events
      .filter((e) => e.type === type)
      .pop();

    if (lastEvent) {
      lastEvent.accepted = accepted;
      console.log(`✅ AI ${type} ${accepted ? "ACCEPTED" : "IGNORED"}`);
    }
  }

  /**
   * Получить статистику по текущей сессии
   */
  getSessionStats() {
    const total = this.events.length;
    const bySource = {
      ai: this.events.filter((e) => e.source === "ai").length,
      fallback: this.events.filter((e) => e.source === "fallback").length,
    };
    const byConfidence = {
      high: this.events.filter((e) => e.confidence === "high").length,
      medium: this.events.filter((e) => e.confidence === "medium").length,
      low: this.events.filter((e) => e.confidence === "low").length,
    };
    const accepted = this.events.filter((e) => e.accepted === true).length;
    const ignored = this.events.filter((e) => e.accepted === false).length;

    return {
      total,
      bySource,
      byConfidence,
      acceptance: {
        accepted,
        ignored,
        rate: total > 0 ? (accepted / (accepted + ignored)) * 100 : 0,
      },
    };
  }

  /**
   * Отправка в аналитику (placeholder)
   */
  private async sendToAnalytics(event: AITelemetryEvent): Promise<void> {
    try {
      // TODO: Интеграция с Google Analytics / Mixpanel / etc
      // await fetch("/api/analytics/ai", {
      //   method: "POST",
      //   body: JSON.stringify(event),
      // });
    } catch (error) {
      console.error("Failed to send AI telemetry:", error);
    }
  }

  /**
   * Экспорт событий (для отладки)
   */
  exportEvents(): AITelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Очистка событий (при завершении сессии)
   */
  clear(): void {
    console.log("📊 AI Telemetry Summary:", this.getSessionStats());
    this.events = [];
  }
}

// Singleton instance
export const aiTelemetry = new AITelemetry();

/**
 * React hook для использования в компонентах
 */
export function useAITelemetry() {
  return {
    logEvent: aiTelemetry.logEvent.bind(aiTelemetry),
    markAsAccepted: aiTelemetry.markAsAccepted.bind(aiTelemetry),
    getStats: aiTelemetry.getSessionStats.bind(aiTelemetry),
  };
}
