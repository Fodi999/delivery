/**
 * 🤖 SmartBot — собственный AI-движок без внешних API
 * Работает мгновенно, без лимитов, без затрат
 *
 * v2 — улучшения:
 * - Защита от null/empty name
 * - totalSpentCents явно в центах (не zł)
 * - Ротация по seed (orders + spent), не предсказуемая
 * - O(1) поиск блюда через Map вместо O(n²)
 * - Средний вес порций вычисляется динамически
 * - 3 уровня насыщения: ok / comfortable / low
 * - Combo Engine: pairWith[] из menu-data
 * - Margin-Aware: score += marginWeight
 * - Popularity-Aware: score += popularityScore
 * - numberOfPeople учитывается для сет-приоритетов
 * - Confidence Score в suggestItems
 * - Склонение числительных (ru/pl/uk)
 */

import { menuItems } from "./menu-data";
import type { MenuCategory } from "./menu-types";

type Language = "pl" | "ru" | "uk" | "en";

// ─── O(1) lookup map — строится один раз ─────────────────────────────────────
const menuMap = new Map(menuItems.map((m) => [m.id, m]));

// ─── Средний вес порции — вычисляется динамически ────────────────────────────
const avgPortionWeight = Math.round(
  menuItems.reduce((sum, m) => sum + m.portionWeight, 0) / menuItems.length
);

// ─────────────────────────────────────────────
// УТИЛИТА: склонение числительных
// ─────────────────────────────────────────────

function pluralize(n: number, lang: Language, forms: Record<Language, [string, string, string]>): string {
  const [one, few, many] = forms[lang];
  if (lang === "ru" || lang === "uk") {
    const abs = Math.abs(n) % 100;
    const mod = abs % 10;
    if (abs >= 11 && abs <= 19) return `${n} ${many}`;
    if (mod === 1) return `${n} ${one}`;
    if (mod >= 2 && mod <= 4) return `${n} ${few}`;
    return `${n} ${many}`;
  }
  if (lang === "pl") {
    const abs = Math.abs(n) % 100;
    const mod = abs % 10;
    if (n === 1) return `${n} ${one}`;
    if (abs >= 12 && abs <= 14) return `${n} ${many}`;
    if (mod >= 2 && mod <= 4) return `${n} ${few}`;
    return `${n} ${many}`;
  }
  // en
  return `${n} ${n === 1 ? one : many}`;
}

const ITEM_FORMS: Record<Language, [string, string, string]> = {
  ru: ["позицию", "позиции", "позиций"],
  pl: ["pozycję", "pozycje", "pozycji"],
  uk: ["позицію", "позиції", "позицій"],
  en: ["item", "items", "items"],
};

// ─────────────────────────────────────────────
// 1. ПРИВЕТСТВИЯ ДЛЯ ПОСТОЯННЫХ КЛИЕНТОВ
// ─────────────────────────────────────────────

export interface CustomerStats {
  name: string;
  totalOrders: number;
  completedOrders: number;
  totalSpentCents: number;  // ЯВНО в центах/грошах, не zł
  lastOrderDate?: string;
  isVIP?: boolean;
  favoriteCategory?: MenuCategory;
  avgCheck?: number;
  lastOrderCategories?: MenuCategory[];
}

export function generateWelcome(stats: CustomerStats, lang: Language): string {
  // ❗ Защита от пустого имени
  const name = stats.name?.trim().split(" ")[0] || (lang === "ru" ? "Друг" : lang === "pl" ? "Przyjacielu" : lang === "uk" ? "Друже" : "Friend");
  const orders = stats.totalOrders;
  const spent = Math.round(stats.totalSpentCents / 100); // центы → zł

  const templates: Record<Language, string[]> = {
    ru: [
      orders >= 20  ? `${name}, вы наш легендарный гость` :
      orders >= 10  ? `${name}, рады видеть вас снова` :
      orders >= 5   ? `${name}, приятно, что вы с нами` :
                      `${name}, добро пожаловать обратно`,

      orders >= 20  ? `${name}, ${orders} заказов — это настоящая преданность` :
      stats.isVIP   ? `${name}, ваш VIP-статус нас обязывает` :
      spent >= 500  ? `${name}, спасибо за доверие` :
                      `${name}, ждали вас`,

      stats.favoriteCategory === "ramen" ? `${name}, новый рамен сегодня особенно хорош` :
      stats.favoriteCategory === "wok"   ? `${name}, воки сегодня — огонь 🔥` :
                                           `${name}, сегодня особенно свежие роллы`,
    ],
    pl: [
      orders >= 20  ? `${name}, jesteś naszym legendarnym gościem` :
      orders >= 10  ? `${name}, miło Cię znowu widzieć` :
      orders >= 5   ? `${name}, cieszmy się razem` :
                      `${name}, witaj z powrotem`,

      orders >= 20  ? `${name}, ${orders} zamówień — to prawdziwa lojalność` :
      stats.isVIP   ? `${name}, Twój status VIP zobowiązuje` :
      spent >= 500  ? `${name}, dziękujemy za zaufanie` :
                      `${name}, czekaliśmy na Ciebie`,

      stats.favoriteCategory === "ramen" ? `${name}, dziś ramen jest wyjątkowo aromatyczny` :
      stats.favoriteCategory === "wok"   ? `${name}, woki dziś to czysta poezja 🔥` :
                                           `${name}, dziś rolki są wyjątkowo świeże`,
    ],
    uk: [
      orders >= 20  ? `${name}, ви наш легендарний гість` :
      orders >= 10  ? `${name}, раді бачити вас знову` :
      orders >= 5   ? `${name}, приємно, що ви з нами` :
                      `${name}, ласкаво просимо назад`,

      orders >= 20  ? `${name}, ${orders} замовлень — це справжня відданість` :
      stats.isVIP   ? `${name}, ваш VIP-статус нас зобов'язує` :
      spent >= 500  ? `${name}, дякуємо за довіру` :
                      `${name}, чекали на вас`,

      stats.favoriteCategory === "ramen" ? `${name}, сьогодні рамен особливо ароматний` :
      stats.favoriteCategory === "wok"   ? `${name}, воки сьогодні — це вогонь 🔥` :
                                           `${name}, сьогодні роли особливо свіжі`,
    ],
    en: [
      orders >= 20  ? `${name}, you're our legendary guest` :
      orders >= 10  ? `${name}, great to see you again` :
      orders >= 5   ? `${name}, glad you're back` :
                      `${name}, welcome back`,

      orders >= 20  ? `${name}, ${orders} orders — true dedication` :
      stats.isVIP   ? `${name}, your VIP status means everything` :
      spent >= 500  ? `${name}, thank you for your trust` :
                      `${name}, we've been waiting`,

      stats.favoriteCategory === "ramen" ? `${name}, today's ramen is exceptionally fragrant` :
      stats.favoriteCategory === "wok"   ? `${name}, today's woks are on fire 🔥` :
                                           `${name}, rolls are extra fresh today`,
    ],
  };

  // ❗ Ротация по seed, а не предсказуемая чётность
  const seed = orders + Math.floor(spent);
  const idx = seed % templates[lang].length;
  return templates[lang][idx];
}

export function generateDescription(stats: CustomerStats, lang: Language): string {
  const orders = stats.totalOrders;
  const spent = Math.round(stats.totalSpentCents / 100);

  const descriptions: Record<Language, string> = {
    ru: orders >= 10
      ? `${orders} заказов, ${spent} zł — вы знаете толк в суши`
      : `Рады снова готовить для вас`,
    pl: orders >= 10
      ? `${orders} zamówień, ${spent} zł — znasz się na sushi`
      : `Cieszymy się, że znowu gotujemy dla Ciebie`,
    uk: orders >= 10
      ? `${orders} замовлень, ${spent} zł — ви знаєтесь на суші`
      : `Раді знову готувати для вас`,
    en: orders >= 10
      ? `${orders} orders, ${spent} zł — you really know sushi`
      : `Happy to cook for you again`,
  };

  return descriptions[lang];
}

// ─────────────────────────────────────────────
// 2. ОЦЕНКА ПОРЦИЙ ПО ВЕСУ
// ─────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PortionResult {
  isEnough: boolean;
  recommendation: string;
  totalGrams: number;
  recommendedGrams: number;
  totalPortions: number;
}

const GRAMS_PER_PERSON_MIN = 500;
const GRAMS_PER_PERSON_REC = 600;

export function assessPortions(
  cartItems: CartItem[],
  numberOfPeople: number,
  lang: Language
): PortionResult {
  // ❗ O(1) поиск через Map
  const totalGrams = cartItems.reduce((sum, item) => {
    const menuItem = menuMap.get(item.id);
    return sum + (menuItem?.portionWeight ?? 0) * item.quantity;
  }, 0);

  const recommendedGrams = numberOfPeople * GRAMS_PER_PERSON_REC;
  const minimumGrams = numberOfPeople * GRAMS_PER_PERSON_MIN;
  const isEnough = totalGrams >= minimumGrams;
  const totalPortions = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const deficitGrams = Math.max(0, recommendedGrams - totalGrams);
  // ❗ Динамический средний вес вместо захардкоженных 350 г
  const deficitItems = Math.ceil(deficitGrams / avgPortionWeight);

  // ❗ Правильное склонение через pluralize
  const deficitStr = pluralize(deficitItems, lang, ITEM_FORMS);

  const messages: Record<Language, { ok: string; comfortable: string; low: string }> = {
    ru: {
      ok:          `${totalGrams} г — отлично, всем хватит с запасом 🎉`,
      comfortable: `${totalGrams} г — хорошо, но можно добавить ещё ~${deficitGrams} г (${deficitStr})`,
      low:         `${totalGrams} г — маловато на ${numberOfPeople} ${numberOfPeople === 1 ? "человека" : "человек"}. Рекомендуем ~${recommendedGrams} г, добавьте ещё ${deficitStr}`,
    },
    pl: {
      ok:          `${totalGrams} g — świetnie, wystarczy dla wszystkich 🎉`,
      comfortable: `${totalGrams} g — dobrze, ale można dodać jeszcze ~${deficitGrams} g (${deficitStr})`,
      low:         `${totalGrams} g — trochę mało na ${numberOfPeople} ${numberOfPeople === 1 ? "osobę" : "osób"}. Polecamy ~${recommendedGrams} g, dodaj ${deficitStr}`,
    },
    uk: {
      ok:          `${totalGrams} г — чудово, всім вистачить 🎉`,
      comfortable: `${totalGrams} г — добре, але можна додати ще ~${deficitGrams} г (${deficitStr})`,
      low:         `${totalGrams} г — замало на ${numberOfPeople} ${numberOfPeople === 1 ? "людину" : "людей"}. Рекомендуємо ~${recommendedGrams} г, додайте ще ${deficitStr}`,
    },
    en: {
      ok:          `${totalGrams}g — great, plenty for everyone 🎉`,
      comfortable: `${totalGrams}g — good, but you could add ~${deficitGrams}g more (${deficitStr})`,
      low:         `${totalGrams}g — a bit light for ${numberOfPeople} ${numberOfPeople === 1 ? "person" : "people"}. We recommend ~${recommendedGrams}g, add ${deficitStr}`,
    },
  };

  const level =
    totalGrams >= recommendedGrams ? "ok" :
    totalGrams >= minimumGrams     ? "comfortable" :
                                     "low";

  return { isEnough, recommendation: messages[lang][level], totalGrams, recommendedGrams, totalPortions };
}

// ─────────────────────────────────────────────
// 3. УМНЫЕ РЕКОМЕНДАЦИИ БЛЮД
// ─────────────────────────────────────────────

export interface SuggestResult {
  items: string[];
  confidence: number; // 0–100
  reason: string;     // для отладки/UI badge
}

export function suggestItems(
  cartItemIds: string[],
  numberOfPeople: number,
  isEnough: boolean,
  lang: Language
): SuggestResult {
  const notInCart = menuItems.filter((m) => !cartItemIds.includes(m.id));

  // Категории в корзине
  const cartItemsInMenu = cartItemIds.map((id) => menuMap.get(id)).filter(Boolean);
  const categoryCounts: Record<string, number> = {};
  for (const item of cartItemsInMenu) {
    if (item) categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }

  // ❗ [...spread] чтобы не мутировать оригинал
  const allCategories: MenuCategory[] = ["sushi", "wok", "ramen"];
  const leastCategory = [...allCategories].sort(
    (a, b) => (categoryCounts[a] || 0) - (categoryCounts[b] || 0)
  )[0];

  // ─── Combo Engine ───────────────────────────────────────────────────────
  // Блюда, которые хорошо сочетаются с тем, что уже в корзине
  const comboIds = new Set<string>();
  for (const id of cartItemIds) {
    const item = menuMap.get(id);
    if (item?.pairWith) item.pairWith.forEach((pid) => comboIds.add(pid));
  }

  // ─── Scoring ────────────────────────────────────────────────────────────
  const scored = notInCart.map((item) => {
    let score = 0;

    // Категориальный баланс
    if (item.category === leastCategory) score += 3;

    // Вес / насыщение
    if (!isEnough && item.isMain) score += 3;
    if (!isEnough && item.portionWeight >= 400) score += 2;
    if (isEnough && item.isSnack) score += 2;
    if (isEnough && item.category !== leastCategory) score += 1;

    // numberOfPeople: группа ≥ 3 → приоритет сытным/большим позициям
    if (!isEnough && numberOfPeople >= 3 && item.portionWeight >= 500) score += 2;

    // ❗ Margin-Aware — clamp 0–10, чтобы не сломать баланс
    score += Math.min(Math.max(item.marginWeight, 0), 10) * 0.5;

    // ❗ Popularity-Aware — clamp 0–10
    score += Math.min(Math.max(item.popularityScore, 0), 10) * 0.4;

    // Combo Engine — бонус за совместимость
    if (comboIds.has(item.id)) score += 4;

    return { item, score };
  });

  // ❗ Сортируем один раз — используем sorted в обоих местах (O(n log n) × 1)
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const result: string[] = [];

  sorted.forEach(({ item }) => {
    if (result.length >= 3) return;
    if (seen.has(item.category) && result.length < 2) return;
    seen.add(item.category);
    result.push(item.nameTranslations[lang] || item.name);
  });

  // Добрать до 3 если не хватает — reuse sorted
  if (result.length < 3) {
    sorted.forEach(({ item }) => {
      if (result.length >= 3) return;
      const name = item.nameTranslations[lang] || item.name;
      if (!result.includes(name)) result.push(name);
    });
  }

  // ─── Confidence Score — плавная аддитивная модель ──────────────────────
  const hasCart = cartItemIds.length > 0;
  const hasCombo = comboIds.size > 0;
  const hasDeficit = !isEnough;

  let confidence = 50;
  if (hasCart)              confidence += 20;
  if (hasCombo)             confidence += 15;
  if (hasDeficit)           confidence += 10;
  if (numberOfPeople >= 3)  confidence += 5;
  confidence = Math.min(confidence, 100);

  const reason =
    hasCombo && hasDeficit ? "combo+deficit" :
    hasCombo               ? "combo" :
    hasDeficit             ? "deficit" :
                             "category-balance";

  return { items: result, confidence, reason };
}
