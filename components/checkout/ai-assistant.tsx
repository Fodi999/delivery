"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartItem } from "@/store/cart-store";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantProps {
  items: CartItem[];
  numberOfPeople: number;
  language: "pl" | "ru" | "uk" | "en";
  isDark: boolean;
  onAddToCart?: (itemName: string) => void;
}

export function AIAssistant({ items, numberOfPeople, language, isDark, onAddToCart }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Приветственное сообщение
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const welcomeMessages = {
        pl: "Cześć! 👋 Jestem Twoim asystentem AI. Pomogę Ci wybrać idealne dania dla Ciebie! Ile osób będzie jadło?",
        ru: "Привет! 👋 Я ваш AI-ассистент. Помогу выбрать идеальные блюда! Сколько человек будет есть?",
        uk: "Привіт! 👋 Я ваш AI-асистент. Допоможу обрати ідеальні страви! Скільки осіб буде їсти?",
        en: "Hello! 👋 I'm your AI assistant. I'll help you choose the perfect dishes! How many people will be eating?",
      };

      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[language],
        timestamp: new Date(),
        suggestions: ["1 персона", "2 персоны", "3 персоны", "4+ персон"],
      }]);
    }
  }, [isOpen, messages.length, language]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Отправляем запрос к AI
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: textToSend,
          conversationHistory: messages.slice(-5), // Последние 5 сообщений для контекста
          cartItems: items.map(item => ({
            id: item.id,
            name: item.name[language] || item.name.en,
            quantity: item.quantity,
            price: item.price,
          })),
          numberOfPeople,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Добавляем ответ AI
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
          suggestions: data.suggestions || [],
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("AI assistant error:", error);
      
      // Fallback сообщение
      const errorMessages = {
        pl: "Przepraszam, wystąpił błąd. Spróbuj ponownie.",
        ru: "Извините, произошла ошибка. Попробуйте снова.",
        uk: "Вибачте, сталася помилка. Спробуйте знову.",
        en: "Sorry, an error occurred. Please try again.",
      };

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessages[language],
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="relative">
      {/* Кнопка открытия чата */}
      {!isOpen && (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl z-50 flex items-center justify-center ${
            isDark
              ? "bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              : "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          }`}
        >
          <span className="text-3xl animate-bounce">🤖</span>
        </Button>
      )}

      {/* Окно чата */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border-2 ${
          isDark
            ? "bg-neutral-900 border-purple-800/50"
            : "bg-white border-purple-300"
        }`}>
          {/* Заголовок */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isDark
              ? "bg-gradient-to-r from-purple-950 to-pink-950 border-purple-800/50"
              : "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h3 className={`font-bold ${isDark ? "text-white" : "text-black"}`}>
                  AI {language === "pl" ? "Asystent" : language === "ru" ? "Ассистент" : language === "uk" ? "Асистент" : "Assistant"}
                </h3>
                <p className={`text-xs ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                  {isLoading 
                    ? language === "pl" ? "Pisze..." : language === "ru" ? "Печатает..." : language === "uk" ? "Друкує..." : "Typing..."
                    : language === "pl" ? "Online" : language === "ru" ? "В сети" : language === "uk" ? "Онлайн" : "Online"
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark ? "hover:bg-purple-800" : "hover:bg-purple-200"
              }`}
            >
              ✕
            </button>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  <div className={`rounded-2xl p-3 ${
                    message.role === "user"
                      ? isDark
                        ? "bg-purple-900 text-white"
                        : "bg-purple-500 text-white"
                      : isDark
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-black"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Кнопки-подсказки */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isDark
                              ? "bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700"
                              : "bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300"
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl p-3 ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className={`p-4 border-t ${isDark ? "border-neutral-800" : "border-neutral-200"}`}>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  language === "pl" ? "Napisz wiadomość..." :
                  language === "ru" ? "Напишите сообщение..." :
                  language === "uk" ? "Напишіть повідомлення..." :
                  "Type a message..."
                }
                disabled={isLoading}
                className={isDark ? "bg-neutral-800 border-neutral-700" : ""}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-500"
                    : "bg-purple-500 hover:bg-purple-600"
                }`}
              >
                ➤
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
