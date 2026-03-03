import { NextResponse } from "next/server";
import { assessPortions, suggestItems } from "@/lib/smart-bot";

type Language = "pl" | "ru" | "uk" | "en";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

// ─── Keyword detection ───────────────────────────────────────────────────────

const PORTION_KEYWORDS: Record<Language, string[]> = {
  ru: ["сколько", "хватит", "достаточно", "порций", "человек", "персон"],
  pl: ["ile", "wystarczy", "wystarczająco", "osób", "porcji", "starczy"],
  uk: ["скільки", "вистачить", "достатньо", "порцій", "людей", "осіб"],
  en: ["how many", "enough", "sufficient", "people", "portions", "servings"],
};

const SUGGEST_KEYWORDS: Record<Language, string[]> = {
  ru: ["что взять", "посоветуй", "порекомендуй", "что добавить", "что заказать", "не знаю", "помоги"],
  pl: ["co wziąć", "polecasz", "co zamówić", "co dodać", "doradź", "nie wiem", "pomóż"],
  uk: ["що взяти", "порадь", "рекомендуй", "що замовити", "що додати", "не знаю", "допоможи"],
  en: ["what to order", "recommend", "suggest", "what to get", "don't know", "help me", "what should"],
};

const GREETING_KEYWORDS: Record<Language, string[]> = {
  ru: ["привет", "здравствуй", "добрый", "hi", "hello"],
  pl: ["cześć", "witaj", "dzień dobry", "hej", "hello"],
  uk: ["привіт", "здрастуй", "добрий", "вітання"],
  en: ["hi", "hello", "hey", "good morning", "good evening"],
};

function matchesKeywords(msg: string, keywords: string[]): boolean {
  const lower = msg.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

// ─── Response templates ──────────────────────────────────────────────────────

function buildGreeting(numberOfPeople: number, cartCount: number, lang: Language): string {
  const templates: Record<Language, string> = {
    ru: cartCount > 0
      ? `Привет! 👋 У вас ${cartCount} позиций в корзине на ${numberOfPeople} ${numberOfPeople === 1 ? "человека" : "человек"}. Могу оценить порции или предложить что добавить!`
      : `Привет! 👋 Помогу выбрать суши, рамен или вок на ${numberOfPeople} ${numberOfPeople === 1 ? "человека" : "человек"}. Что интересует?`,
    pl: cartCount > 0
      ? `Cześć! 👋 Masz ${cartCount} pozycji w koszyku na ${numberOfPeople} ${numberOfPeople === 1 ? "osobę" : "osób"}. Mogę ocenić porcje lub zaproponować dodatki!`
      : `Cześć! 👋 Pomogę wybrać sushi, ramen lub wok na ${numberOfPeople} ${numberOfPeople === 1 ? "osobę" : "osób"}. Co Cię interesuje?`,
    uk: cartCount > 0
      ? `Привіт! 👋 У вас ${cartCount} позицій у кошику на ${numberOfPeople} ${numberOfPeople === 1 ? "людину" : "людей"}. Можу оцінити порції або запропонувати що додати!`
      : `Привіт! 👋 Допоможу вибрати суші, рамен або вок на ${numberOfPeople} ${numberOfPeople === 1 ? "людину" : "людей"}. Що цікавить?`,
    en: cartCount > 0
      ? `Hey! 👋 You have ${cartCount} items in your cart for ${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}. I can check portions or suggest what to add!`
      : `Hey! 👋 I'll help you pick sushi, ramen or wok for ${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}. What are you looking for?`,
  };
  return templates[lang];
}

function buildDefaultResponse(cartCount: number, lang: Language): string {
  const templates: Record<Language, string[]> = {
    ru: [
      cartCount > 0
        ? "Могу проверить хватит ли порций или предложить что-нибудь вкусненькое 🍣"
        : "Попробуйте наши роллы, рамен или вок — каждый найдёт что-то своё! 🍜",
    ],
    pl: [
      cartCount > 0
        ? "Mogę sprawdzić czy porcje wystarczą lub zaproponować coś pysznego 🍣"
        : "Spróbuj naszych rolek, ramenu lub woka — każdy znajdzie coś dla siebie! 🍜",
    ],
    uk: [
      cartCount > 0
        ? "Можу перевірити чи вистачить порцій або запропонувати щось смачненьке 🍣"
        : "Спробуйте наші роли, рамен або вок — кожен знайде щось своє! 🍜",
    ],
    en: [
      cartCount > 0
        ? "I can check if portions are enough or suggest something delicious 🍣"
        : "Try our rolls, ramen or wok — everyone finds their favorite! 🍜",
    ],
  };
  return templates[lang][0];
}

function buildSuggestions(needsMore: boolean, lang: Language): string[] {
  const s: Record<Language, { more: string[]; ok: string[] }> = {
    ru: {
      more: ["Оценить порции 🍽️", "Посоветуй блюдо", "Напиток 🥤", "Всё хорошо ✅"],
      ok:   ["Добавить соус 🍶", "Десерт 🍰", "Напиток 🥤", "Оформить заказ ✅"],
    },
    pl: {
      more: ["Oceń porcje 🍽️", "Zaproponuj danie", "Napój 🥤", "Wszystko OK ✅"],
      ok:   ["Dodaj sos 🍶", "Deser 🍰", "Napój 🥤", "Złóż zamówienie ✅"],
    },
    uk: {
      more: ["Оцінити порції 🍽️", "Порадь страву", "Напій 🥤", "Все добре ✅"],
      ok:   ["Додати соус 🍶", "Десерт 🍰", "Напій 🥤", "Оформити замовлення ✅"],
    },
    en: {
      more: ["Check portions 🍽️", "Suggest a dish", "Drink 🥤", "All good ✅"],
      ok:   ["Add sauce 🍶", "Dessert 🍰", "Drink 🥤", "Place order ✅"],
    },
  };
  return needsMore ? s[lang].more : s[lang].ok;
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json();
  const {
    userMessage = "",
    cartItems = [],
    numberOfPeople = 1,
    language = "ru",
  } = body as {
    userMessage: string;
    conversationHistory?: unknown[];
    cartItems: CartItem[];
    numberOfPeople: number;
    language: Language;
  };

  const lang: Language = ["pl", "ru", "uk", "en"].includes(language) ? language : "ru";
  const cartItemIds = cartItems.map((i) => i.id);

  // Используем весовую оценку как основу
  const portionResult = cartItems.length > 0
    ? assessPortions(cartItems, numberOfPeople, lang)
    : null;
  const needsMore = portionResult ? !portionResult.isEnough : false;

  console.log(`🤖 SmartBot Assistant: "${userMessage}" (${numberOfPeople} people, ${cartItems.length} items)`);

  let message = "";
  let suggestions: string[] = buildSuggestions(needsMore, lang);

  // ── GREETING ──────────────────────────────────────────────────────────────
  if (matchesKeywords(userMessage, GREETING_KEYWORDS[lang])) {
    message = buildGreeting(numberOfPeople, cartItems.length, lang);

  // ── PORTION CHECK ─────────────────────────────────────────────────────────
  } else if (matchesKeywords(userMessage, PORTION_KEYWORDS[lang])) {
    if (cartItems.length === 0) {
      const empty: Record<Language, string> = {
        ru: `Корзина пока пуста. Для ${numberOfPeople} ${numberOfPeople === 1 ? "человека" : "человек"} рекомендую ${Math.ceil(numberOfPeople * 1.5)} позиции — добавьте что-нибудь! 🍣`,
        pl: `Koszyk jest pusty. Dla ${numberOfPeople} ${numberOfPeople === 1 ? "osoby" : "osób"} polecam ${Math.ceil(numberOfPeople * 1.5)} porcje — dodaj coś! 🍣`,
        uk: `Кошик поки порожній. Для ${numberOfPeople} ${numberOfPeople === 1 ? "людини" : "людей"} рекомендую ${Math.ceil(numberOfPeople * 1.5)} позиції — додайте щось! 🍣`,
        en: `Cart is empty. For ${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"} I recommend ${Math.ceil(numberOfPeople * 1.5)} portions — add something! �`,
      };
      message = empty[lang];
    } else {
      const result = assessPortions(cartItems, numberOfPeople, lang);
      message = result.recommendation;
      if (!result.isEnough) {
        const extras = suggestItems(cartItemIds, numberOfPeople, false, lang);
        if (extras.items.length > 0) {
          const addLabel: Record<Language, string> = {
            ru: "Могу предложить", pl: "Mogę zaproponować", uk: "Можу запропонувати", en: "I'd suggest",
          };
          message += ` ${addLabel[lang]}: ${extras.items.join(", ")} 🍜`;
        }
      }
    }

  // ── SUGGESTIONS ───────────────────────────────────────────────────────────
  } else if (matchesKeywords(userMessage, SUGGEST_KEYWORDS[lang])) {
    const isEnough = portionResult ? portionResult.isEnough : true;
    const suggest = suggestItems(cartItemIds, numberOfPeople, isEnough, lang);

    if (suggest.items.length === 0) {
      const allAdded: Record<Language, string> = {
        ru: "Вы уже попробовали всё меню — настоящий гурман! 🏆",
        pl: "Masz już całe menu — prawdziwy smakosz! 🏆",
        uk: "Ви вже спробували все меню — справжній гурман! 🏆",
        en: "You've tried the whole menu — true gourmet! 🏆",
      };
      message = allAdded[lang];
    } else {
      const prefix: Record<Language, string> = {
        ru: "Рекомендую попробовать", pl: "Polecam spróbować", uk: "Рекомендую спробувати", en: "I recommend trying",
      };
      const suffix: Record<Language, string> = {
        ru: "— отличный выбор! 🍣", pl: "— świetny wybór! 🍣", uk: "— чудовий вибір! 🍣", en: "— great choice! 🍣",
      };
      message = `${prefix[lang]}: ${suggest.items.join(", ")} ${suffix[lang]}`;
    }

  // ── DEFAULT ───────────────────────────────────────────────────────────────
  } else {
    message = buildDefaultResponse(cartItems.length, lang);
  }

  return NextResponse.json({ message, suggestions });
}
