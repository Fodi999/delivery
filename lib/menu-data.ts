import type { MenuCategory } from "./menu-types";

export type MenuItem = {
  id: string;
  name: string;
  nameTranslations: {
    en: string;
    pl: string;
    uk: string;
    ru: string;
  };
  description: string;
  descriptionTranslations: {
    en: string;
    pl: string;
    uk: string;
    ru: string;
  };
  price: number;
  image: string;
  category: MenuCategory;
  portionWeight: number;    // вес порции в граммах
  portionPersons: number;   // на сколько человек рассчитано
  isMain: boolean;          // основное блюдо (сытное)
  isSnack: boolean;         // закуска / дополнение
  popularityScore: number;  // 1–10: насколько часто заказывают
  marginWeight: number;     // 1–10: насколько выгодно для ресторана
  pairWith: string[];       // id блюд, которые хорошо сочетаются
};

export const menuItems: MenuItem[] = [
  // ─── SUSHI ────────────────────────────────────────────────────────────────
  {
    id: "s1", name: "California Roll",
    nameTranslations: { en: "California Roll", pl: "California Roll", uk: "Каліфорнія Рол", ru: "Калифорния Ролл" },
    description: "Crab, avocado, cucumber",
    descriptionTranslations: { en: "Crab, avocado, cucumber", pl: "Krab, awokado, ogórek", uk: "Краб, авокадо, огірок", ru: "Краб, авокадо, огурец" },
    price: 32, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 280, portionPersons: 1, isMain: false, isSnack: true,
    popularityScore: 9, marginWeight: 7, pairWith: ["s5", "w1", "r1"],
  },
  {
    id: "s2", name: "Salmon Nigiri",
    nameTranslations: { en: "Salmon Nigiri", pl: "Nigiri z łososiem", uk: "Нігірі з лососем", ru: "Нигири с лососем" },
    description: "Fresh salmon, rice, wasabi",
    descriptionTranslations: { en: "Fresh salmon, rice, wasabi", pl: "Świeży łosoś, ryż, wasabi", uk: "Свіжий лосось, рис, васабі", ru: "Свежий лосось, рис, васаби" },
    price: 28, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 150, portionPersons: 1, isMain: false, isSnack: true,
    popularityScore: 8, marginWeight: 6, pairWith: ["s7", "s5", "r2"],
  },
  {
    id: "s3", name: "Dragon Roll",
    nameTranslations: { en: "Dragon Roll", pl: "Dragon Roll", uk: "Дракон Рол", ru: "Дракон Ролл" },
    description: "Eel, avocado, tobiko",
    descriptionTranslations: { en: "Eel, avocado, tobiko", pl: "Węgorz, awokado, tobiko", uk: "Вугор, авокадо, тобіко", ru: "Угорь, авокадо, тобико" },
    price: 45, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 300, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 8, pairWith: ["s9", "w6", "r1"],
  },
  {
    id: "s4", name: "Spicy Tuna Roll",
    nameTranslations: { en: "Spicy Tuna Roll", pl: "Pikantny Tuńczyk Roll", uk: "Гострий тунець Рол", ru: "Острый тунец Ролл" },
    description: "Tuna, spicy mayo, cucumber",
    descriptionTranslations: { en: "Tuna, spicy mayo, cucumber", pl: "Tuńczyk, pikantny majonez, ogórek", uk: "Тунець, гострий майонез, огірок", ru: "Тунец, острый майонез, огурец" },
    price: 38, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 270, portionPersons: 1, isMain: false, isSnack: true,
    popularityScore: 8, marginWeight: 7, pairWith: ["s7", "w5", "r3"],
  },
  {
    id: "s5", name: "Philadelphia Roll",
    nameTranslations: { en: "Philadelphia Roll", pl: "Philadelphia Roll", uk: "Філадельфія Рол", ru: "Филадельфия Ролл" },
    description: "Salmon, cream cheese, cucumber",
    descriptionTranslations: { en: "Salmon, cream cheese, cucumber", pl: "Łosoś, ser śmietankowy, ogórek", uk: "Лосось, вершковий сир, огірок", ru: "Лосось, сливочный сыр, огурец" },
    price: 42, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 290, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 10, marginWeight: 9, pairWith: ["s2", "w1", "r5"],
  },
  {
    id: "s6", name: "Rainbow Roll",
    nameTranslations: { en: "Rainbow Roll", pl: "Rainbow Roll", uk: "Веселка Рол", ru: "Радуга Ролл" },
    description: "Assorted fish, avocado, crab",
    descriptionTranslations: { en: "Assorted fish, avocado, crab", pl: "Mieszanka ryb, awokado, krab", uk: "Асорті риби, авокадо, краб", ru: "Ассорти рыбы, авокадо, краб" },
    price: 48, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 320, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 9, pairWith: ["s1", "w3", "r6"],
  },
  {
    id: "s7", name: "Tuna Nigiri",
    nameTranslations: { en: "Tuna Nigiri", pl: "Nigiri z tuńczykiem", uk: "Нігірі з тунцем", ru: "Нигири с тунцом" },
    description: "Fresh tuna, rice, wasabi",
    descriptionTranslations: { en: "Fresh tuna, rice, wasabi", pl: "Świeży tuńczyk, ryż, wasabi", uk: "Свіжий тунець, рис, васабі", ru: "Свежий тунец, рис, васаби" },
    price: 32, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 150, portionPersons: 1, isMain: false, isSnack: true,
    popularityScore: 6, marginWeight: 6, pairWith: ["s2", "s4", "r5"],
  },
  {
    id: "s8", name: "Tempura Roll",
    nameTranslations: { en: "Tempura Roll", pl: "Tempura Roll", uk: "Темпура Рол", ru: "Темпура Ролл" },
    description: "Shrimp tempura, avocado, mayo",
    descriptionTranslations: { en: "Shrimp tempura, avocado, mayo", pl: "Krewetki tempura, awokado, majonez", uk: "Креветки темпура, авокадо, майонез", ru: "Креветки темпура, авокадо, майонез" },
    price: 40, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 280, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 8, marginWeight: 8, pairWith: ["w3", "r6", "s1"],
  },
  {
    id: "s9", name: "Eel Nigiri",
    nameTranslations: { en: "Eel Nigiri", pl: "Nigiri z węgorzem", uk: "Нігірі з вугром", ru: "Нигири с угрем" },
    description: "Grilled eel, rice, unagi sauce",
    descriptionTranslations: { en: "Grilled eel, rice, unagi sauce", pl: "Grillowany węgorz, ryż, sos unagi", uk: "Смажений вугор, рис, соус унагі", ru: "Жареный угорь, рис, соус унаги" },
    price: 36, image: "https://i.postimg.cc/wMvLz0F5/0000036.jpg", category: "sushi",
    portionWeight: 160, portionPersons: 1, isMain: false, isSnack: true,
    popularityScore: 6, marginWeight: 7, pairWith: ["s3", "w6", "r1"],
  },

  // ─── WOK ──────────────────────────────────────────────────────────────────
  {
    id: "w1", name: "Chicken Wok",
    nameTranslations: { en: "Chicken Wok", pl: "Wok z kurczakiem", uk: "Вок з куркою", ru: "Вок с курицей" },
    description: "Noodles, vegetables, teriyaki sauce",
    descriptionTranslations: { en: "Noodles, vegetables, teriyaki sauce", pl: "Makaron, warzywa, sos teriyaki", uk: "Локшина, овочі, соус теріякі", ru: "Лапша, овощи, соус терияки" },
    price: 36, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 450, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 9, marginWeight: 8, pairWith: ["s1", "s5", "r5"],
  },
  {
    id: "w2", name: "Beef Wok",
    nameTranslations: { en: "Beef Wok", pl: "Wok z wołowiną", uk: "Вок з яловичиною", ru: "Вок с говядиной" },
    description: "Beef, udon noodles, soy sauce",
    descriptionTranslations: { en: "Beef, udon noodles, soy sauce", pl: "Wołowina, makaron udon, sos sojowy", uk: "Яловичина, локшина удон, соєвий соус", ru: "Говядина, лапша удон, соевый соус" },
    price: 42, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 500, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 8, marginWeight: 7, pairWith: ["r8", "s4", "s6"],
  },
  {
    id: "w3", name: "Seafood Wok",
    nameTranslations: { en: "Seafood Wok", pl: "Wok z owocami morza", uk: "Вок з морепродуктами", ru: "Вок с морепродуктами" },
    description: "Shrimp, squid, vegetables",
    descriptionTranslations: { en: "Shrimp, squid, vegetables", pl: "Krewetki, kalmary, warzywa", uk: "Креветки, кальмари, овочі", ru: "Креветки, кальмары, овощи" },
    price: 48, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 480, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 9, pairWith: ["r6", "s8", "s6"],
  },
  {
    id: "w4", name: "Vegetable Wok",
    nameTranslations: { en: "Vegetable Wok", pl: "Wok z warzywami", uk: "Овочевий Вок", ru: "Овощной Вок" },
    description: "Mixed vegetables, tofu, sesame",
    descriptionTranslations: { en: "Mixed vegetables, tofu, sesame", pl: "Mieszanka warzyw, tofu, sezam", uk: "Мікс овочів, тофу, кунжут", ru: "Микс овощей, тофу, кунжут" },
    price: 32, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 400, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 5, marginWeight: 9, pairWith: ["r4", "s1", "s4"],
  },
  {
    id: "w5", name: "Spicy Chicken Wok",
    nameTranslations: { en: "Spicy Chicken Wok", pl: "Pikantny Wok z kurczakiem", uk: "Гострий Вок з куркою", ru: "Острый Вок с курицей" },
    description: "Chicken, chili, peppers, noodles",
    descriptionTranslations: { en: "Chicken, chili, peppers, noodles", pl: "Kurczak, chili, papryka, makaron", uk: "Курка, чилі, перець, локшина", ru: "Курица, чили, перец, лапша" },
    price: 38, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 460, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 8, marginWeight: 8, pairWith: ["r3", "s4", "s1"],
  },
  {
    id: "w6", name: "Duck Wok",
    nameTranslations: { en: "Duck Wok", pl: "Wok z kaczką", uk: "Вок з качкою", ru: "Вок с уткой" },
    description: "Crispy duck, hoisin sauce, vegetables",
    descriptionTranslations: { en: "Crispy duck, hoisin sauce, vegetables", pl: "Chrupiąca kaczka, sos hoisin, warzywa", uk: "Хрустка качка, соус хойсін, овочі", ru: "Хрустящая утка, соус хойсин, овощи" },
    price: 46, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 520, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 6, marginWeight: 8, pairWith: ["s3", "s9", "r1"],
  },
  {
    id: "w7", name: "Pork Wok",
    nameTranslations: { en: "Pork Wok", pl: "Wok z wieprzowiną", uk: "Вок зі свининою", ru: "Вок со свининой" },
    description: "Pork, sweet and sour sauce, pineapple",
    descriptionTranslations: { en: "Pork, sweet and sour sauce, pineapple", pl: "Wieprzowina, sos słodko-kwaśny, ananas", uk: "Свинина, кисло-солодкий соус, ананас", ru: "Свинина, кисло-сладкий соус, ананас" },
    price: 40, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 490, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 6, marginWeight: 7, pairWith: ["r7", "s1", "s8"],
  },
  {
    id: "w8", name: "Tofu Wok",
    nameTranslations: { en: "Tofu Wok", pl: "Wok z tofu", uk: "Вок з тофу", ru: "Вок с тофу" },
    description: "Crispy tofu, vegetables, sesame oil",
    descriptionTranslations: { en: "Crispy tofu, vegetables, sesame oil", pl: "Chrupiące tofu, warzywa, olej sezamowy", uk: "Хрустке тофу, овочі, кунжутна олія", ru: "Хрустящий тофу, овощи, кунжутное масло" },
    price: 34, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 420, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 5, marginWeight: 9, pairWith: ["r4", "w4", "s4"],
  },
  {
    id: "w9", name: "Mixed Seafood Wok",
    nameTranslations: { en: "Mixed Seafood Wok", pl: "Wok z mieszanką owoców morza", uk: "Вок з морепродуктами мікс", ru: "Вок с морепродуктами микс" },
    description: "Shrimp, scallops, mussels, vegetables",
    descriptionTranslations: { en: "Shrimp, scallops, mussels, vegetables", pl: "Krewetki, przegrzebki, małże, warzywa", uk: "Креветки, гребінці, мідії, овочі", ru: "Креветки, гребешки, мидии, овощи" },
    price: 52, image: "https://i.postimg.cc/HLpkhwy6/fodifood-Asian-wok-noodles-served-in-a-round-ceramic-bowl-top-v-17623486-0fab-4600-9951-ec244d93e7fa.png", category: "wok",
    portionWeight: 550, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 8, pairWith: ["r6", "s6", "s8"],
  },

  // ─── RAMEN ────────────────────────────────────────────────────────────────
  {
    id: "r1", name: "Tonkotsu Ramen",
    nameTranslations: { en: "Tonkotsu Ramen", pl: "Tonkotsu Ramen", uk: "Тонкоцу Рамен", ru: "Тонкоцу Рамен" },
    description: "Pork broth, chashu, egg, nori",
    descriptionTranslations: { en: "Pork broth, chashu, egg, nori", pl: "Bulion wieprzowy, chashu, jajko, nori", uk: "Свинячий бульйон, часю, яйце, норі", ru: "Свиной бульон, тясю, яйцо, нори" },
    price: 42, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 650, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 10, marginWeight: 8, pairWith: ["s1", "s5", "w1"],
  },
  {
    id: "r2", name: "Miso Ramen",
    nameTranslations: { en: "Miso Ramen", pl: "Miso Ramen", uk: "Місо Рамен", ru: "Мисо Рамен" },
    description: "Miso broth, corn, butter, egg",
    descriptionTranslations: { en: "Miso broth, corn, butter, egg", pl: "Bulion miso, kukurydza, masło, jajko", uk: "Місо бульйон, кукурудза, масло, яйце", ru: "Мисо бульон, кукуруза, масло, яйцо" },
    price: 38, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 600, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 8, marginWeight: 8, pairWith: ["s2", "s5", "w4"],
  },
  {
    id: "r3", name: "Spicy Ramen",
    nameTranslations: { en: "Spicy Ramen", pl: "Pikantny Ramen", uk: "Гострий Рамен", ru: "Острый Рамен" },
    description: "Spicy broth, kimchi, pork, chili",
    descriptionTranslations: { en: "Spicy broth, kimchi, pork, chili", pl: "Pikantny bulion, kimchi, wieprzowina, chili", uk: "Гострий бульйон, кімчі, свинина, чилі", ru: "Острый бульон, кимчи, свинина, чили" },
    price: 44, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 620, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 8, marginWeight: 7, pairWith: ["w5", "s4", "s1"],
  },
  {
    id: "r4", name: "Vegetarian Ramen",
    nameTranslations: { en: "Vegetarian Ramen", pl: "Wegetariański Ramen", uk: "Вегетаріанський Рамен", ru: "Вегетарианский Рамен" },
    description: "Vegetable broth, tofu, mushrooms",
    descriptionTranslations: { en: "Vegetable broth, tofu, mushrooms", pl: "Bulion warzywny, tofu, grzyby", uk: "Овочевий бульйон, тофу, гриби", ru: "Овощной бульон, тофу, грибы" },
    price: 36, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 570, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 5, marginWeight: 9, pairWith: ["w4", "w8", "s4"],
  },
  {
    id: "r5", name: "Shoyu Ramen",
    nameTranslations: { en: "Shoyu Ramen", pl: "Shoyu Ramen", uk: "Сьойю Рамен", ru: "Сёю Рамен" },
    description: "Soy sauce broth, chicken, egg, nori",
    descriptionTranslations: { en: "Soy sauce broth, chicken, egg, nori", pl: "Bulion sojowy, kurczak, jajko, nori", uk: "Соєвий бульйон, курка, яйце, норі", ru: "Соевый бульон, курица, яйцо, нори" },
    price: 40, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 610, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 8, pairWith: ["w1", "s5", "s2"],
  },
  {
    id: "r6", name: "Seafood Ramen",
    nameTranslations: { en: "Seafood Ramen", pl: "Ramen z owocami morza", uk: "Рамен з морепродуктами", ru: "Рамен с морепродуктами" },
    description: "Fish broth, shrimp, squid, mussels",
    descriptionTranslations: { en: "Fish broth, shrimp, squid, mussels", pl: "Bulion rybny, krewetki, kalmary, małże", uk: "Рибний бульйон, креветки, кальмари, мідії", ru: "Рыбный бульон, креветки, кальмары, мидии" },
    price: 46, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 660, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 8, pairWith: ["w3", "w9", "s8"],
  },
  {
    id: "r7", name: "Chicken Ramen",
    nameTranslations: { en: "Chicken Ramen", pl: "Ramen z kurczakiem", uk: "Рамен з куркою", ru: "Рамен с курицей" },
    description: "Chicken broth, grilled chicken, vegetables",
    descriptionTranslations: { en: "Chicken broth, grilled chicken, vegetables", pl: "Bulion z kurczaka, grillowany kurczak, warzywa", uk: "Курячий бульйон, смажена курка, овочі", ru: "Куриный бульон, жареная курица, овощи" },
    price: 38, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 590, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 8, pairWith: ["w1", "w5", "s1"],
  },
  {
    id: "r8", name: "Beef Ramen",
    nameTranslations: { en: "Beef Ramen", pl: "Ramen z wołowiną", uk: "Рамен з яловичиною", ru: "Рамен с говядиной" },
    description: "Beef broth, sliced beef, onions, egg",
    descriptionTranslations: { en: "Beef broth, sliced beef, onions, egg", pl: "Bulion wołowy, wołowina w plastrach, cebula, jajko", uk: "М'ясний бульйон, яловичина, цибуля, яйце", ru: "Говяжий бульон, говядина, лук, яйцо" },
    price: 44, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 640, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 7, marginWeight: 7, pairWith: ["w2", "s4", "s6"],
  },
  {
    id: "r9", name: "Tantanmen Ramen",
    nameTranslations: { en: "Tantanmen Ramen", pl: "Tantanmen Ramen", uk: "Тантанмен Рамен", ru: "Тантанмен Рамен" },
    description: "Spicy sesame broth, minced pork, bok choy",
    descriptionTranslations: { en: "Spicy sesame broth, minced pork, bok choy", pl: "Pikantny bulion sezamowy, mielona wieprzowina, bok choy", uk: "Гострий кунжутний бульйон, свиний фарш, бок чой", ru: "Острый кунжутный бульон, свиной фарш, бок чой" },
    price: 42, image: "https://i.postimg.cc/0Q7x5rmh/fodifood-Japanese-ramen-soup-served-in-a-deep-ceramic-bowl-top-ea8d49c7-5ef5-4c30-883e-5cfb9c15db98.png", category: "ramen",
    portionWeight: 670, portionPersons: 1, isMain: true, isSnack: false,
    popularityScore: 6, marginWeight: 8, pairWith: ["w5", "s4", "s3"],
  },
];
