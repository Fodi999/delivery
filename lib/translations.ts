export type Language = "pl" | "en" | "uk" | "ru";

export const translations = {
  pl: {
    headline: "Sushi • Wok • Ramen",
    subheadline: "Szybka dostawa w Gdańsku",
    openUntil: "Otwarte do 22:00",
    deliveryTime: "30–45 min",
    orderNow: "Zamów teraz",
    viewMenu: "Zobacz menu",
    openCategory: "Otwórz",
    orders: "zamówień",
    footer: "Świeże składniki • Dostawa 30–45 min",
    addToCart: "Dodaj",
    itemsCount: "pozycji",
    categories: {
      sushi: { name: "Sushi", desc: "Świeże rolki i nigiri" },
      wok: { name: "Wok", desc: "Smażony makaron" },
      ramen: { name: "Ramen", desc: "Gorąca zupa z makaronem" },
    },
    cart: {
      title: "Twój koszyk",
      emptyTitle: "Koszyk jest pusty",
      emptyHint: "Dodaj dania z menu",
      total: "Suma",
      clear: "Wyczyść",
      checkout: "Zamów",
      item: "pozycja",
      items: "pozycje",
      itemsMany: "pozycji",
    },
    checkout: {
      title: "Oformienie zamówienia",
      deliveryDetails: "Dane dostawy",
      yourOrder: "Twoje zamówienie",
      name: "Imię",
      phone: "Numer telefonu",
      address: "Adres dostawy",
      comment: "Komentarz dla kuriera (opcjonalnie)",
      confirmOrder: "Potwierdź zamówienie",
      orderSuccess: "Zamówienie złożone!",
      orderSuccessHint: "Skontaktujemy się wkrótce",
    },
  },
  en: {
    headline: "Sushi • Wok • Ramen",
    subheadline: "Fast delivery in Gdańsk",
    openUntil: "Open until 22:00",
    deliveryTime: "30–45 min",
    orderNow: "Order now",
    viewMenu: "View menu",
    openCategory: "Open",
    orders: "orders",
    footer: "Fresh ingredients • 30–45 min delivery",
    addToCart: "Add",
    itemsCount: "items",
    categories: {
      sushi: { name: "Sushi", desc: "Fresh rolls & nigiri" },
      wok: { name: "Wok", desc: "Stir-fried noodles" },
      ramen: { name: "Ramen", desc: "Hot noodle soup" },
    },
    cart: {
      title: "Your cart",
      emptyTitle: "Cart is empty",
      emptyHint: "Add items from menu",
      total: "Total",
      clear: "Clear",
      checkout: "Checkout",
      item: "item",
      items: "items",
      itemsMany: "items",
    },
    checkout: {
      title: "Checkout",
      deliveryDetails: "Delivery details",
      yourOrder: "Your order",
      name: "Name",
      phone: "Phone number",
      address: "Delivery address",
      comment: "Comment for courier (optional)",
      confirmOrder: "Confirm order",
      orderSuccess: "Order placed!",
      orderSuccessHint: "We'll contact you soon",
    },
  },
  uk: {
    headline: "Суші • Вок • Рамен",
    subheadline: "Швидка доставка в Гданську",
    openUntil: "Відкрито до 22:00",
    deliveryTime: "30–45 хв",
    orderNow: "Замовити зараз",
    viewMenu: "Переглянути меню",
    openCategory: "Відкрити",
    orders: "замовлень",
    footer: "Свіжі інгредієнти • Доставка 30–45 хв",
    addToCart: "Додати",
    itemsCount: "позицій",
    categories: {
      sushi: { name: "Суші", desc: "Свіжі роли та нігірі" },
      wok: { name: "Вок", desc: "Смажена локшина" },
      ramen: { name: "Рамен", desc: "Гарячий суп з локшиною" },
    },
    cart: {
      title: "Ваш кошик",
      emptyTitle: "Кошик порожній",
      emptyHint: "Додайте страви з меню",
      total: "Разом",
      clear: "Очистити",
      checkout: "Оформити",
      item: "товар",
      items: "товари",
      itemsMany: "товарів",
    },
    checkout: {
      title: "Оформлення замовлення",
      deliveryDetails: "Дані доставки",
      yourOrder: "Ваше замовлення",
      name: "Ім'я",
      phone: "Номер телефону",
      address: "Адреса доставки",
      comment: "Коментар для кур'єра (опціонально)",
      confirmOrder: "Підтвердити замовлення",
      orderSuccess: "Замовлення оформлено!",
      orderSuccessHint: "Ми зв'яжемося незабаром",
    },
  },
  ru: {
    headline: "Суши • Вок • Рамен",
    subheadline: "Быстрая доставка в Гданьске",
    openUntil: "Открыто до 22:00",
    deliveryTime: "30–45 мин",
    orderNow: "Заказать сейчас",
    viewMenu: "Посмотреть меню",
    openCategory: "Открыть",
    orders: "заказов",
    footer: "Свежие ингредиенты • Доставка 30–45 мин",
    addToCart: "Добавить",
    itemsCount: "позиций",
    categories: {
      sushi: { name: "Суши", desc: "Свежие роллы и нигири" },
      wok: { name: "Вок", desc: "Жареная лапша" },
      ramen: { name: "Рамен", desc: "Горячий суп с лапшой" },
    },
    cart: {
      title: "Ваша корзина",
      emptyTitle: "Корзина пуста",
      emptyHint: "Добавьте блюда из меню",
      total: "Итого",
      clear: "Очистить",
      checkout: "Оформить",
      item: "товар",
      items: "товара",
      itemsMany: "товаров",
    },
    checkout: {
      title: "Оформление заказа",
      deliveryDetails: "Данные доставки",
      yourOrder: "Ваш заказ",
      name: "Имя",
      phone: "Номер телефона",
      address: "Адрес доставки",
      comment: "Комментарий для курьера (опционально)",
      confirmOrder: "Подтвердить заказ",
      orderSuccess: "Заказ оформлен!",
      orderSuccessHint: "Мы свяжемся в ближайшее время",
    },
  },
} as const;

// Функция для правильного склонения слова "товар"
export function getItemsWord(count: number, language: Language): string {
  const t = translations[language].cart;
  
  if (language === "en") {
    return count === 1 ? t.item : t.items;
  }
  
  if (language === "pl") {
    if (count === 1) return t.item;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
      return t.items;
    }
    return t.itemsMany;
  }
  
  if (language === "uk" || language === "ru") {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) return t.item;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
      return t.items;
    }
    return t.itemsMany;
  }
  
  return t.items;
}
