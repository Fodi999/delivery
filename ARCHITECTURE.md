# 📦 Архитектура проекта

## Структура файлов

```
delivery/
├─ app/
│  ├─ layout.tsx              ← Global layout с AppProvider
│  ├─ page.tsx                ← Landing page
│  └─ menu/
│     └─ [category]/
│        └─ page.tsx          ← Dynamic menu pages (sushi/wok/ramen)
│
├─ components/
│  ├─ header.tsx              ← Единый Header для всех страниц
│  ├─ menu-categories.tsx     ← Category tabs (Wolt/Uber Eats style)
│  └─ ui/                     ← shadcn/ui components
│
├─ context/
│  └─ app-context.tsx         ← Global state (theme, language, city)
│
└─ lib/
   ├─ menu-data.ts            ← Menu items data
   ├─ menu-types.ts           ← TypeScript types
   ├─ translations.ts         ← i18n translations
   └─ utils.ts                ← Utility functions
```

---

## 🎯 Ключевые компоненты

### 1️⃣ `context/app-context.tsx`

**Назначение:** Глобальное состояние приложения

```typescript
export type City = "gdansk" | "sopot" | "gdynia";

interface AppContextType {
  language: Language;           // PL | EN | UK | RU
  setLanguage: (lang: Language) => void;
  isDark: boolean;              // Dark/Light theme
  setIsDark: (dark: boolean) => void;
  city: City;                   // Selected city
  setCity: (city: City) => void;
  mounted: boolean;             // Hydration protection
}
```

**Важно:**
- ✅ `mounted` защищает от hydration mismatch
- ✅ Автоматическое сохранение в `localStorage`
- ✅ Используется через хук `useApp()`

---

### 2️⃣ `components/header.tsx`

**Назначение:** Единый Header для всех страниц

```typescript
interface HeaderProps {
  showBackButton?: boolean;  // Показать кнопку "Назад"
  title?: string;           // Переопределить заголовок
  subtitle?: string;        // Переопределить подзаголовок
}
```

**Поведение:**
- На **landing page**: показывает селектор города
- На **menu pages**: показывает кнопку назад + корзину
- Адаптивный: `flex-wrap` на мобильных
- Accessibility: все кнопки с `aria-label`

**UX-детали:**
- ✅ Заголовок на landing кликабельный → `/`
- ✅ Sticky header с backdrop blur
- ✅ `max-w-7xl` вместо `container` для pixel-perfect контроля

---

### 3️⃣ `app/layout.tsx`

**Назначение:** Root layout с провайдером контекста

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

**Важно:** AppProvider должен обернуть весь `children`, чтобы контекст был доступен везде.

---

### 4️⃣ Страницы

#### `app/page.tsx` (Landing)

```tsx
export default function Home() {
  const { language, isDark, mounted } = useApp();
  
  return (
    <div className="h-screen overflow-hidden">
      <Header />
      <main>...</main>
      <footer>...</footer>
    </div>
  );
}
```

**Особенности:**
- ✅ `h-screen overflow-hidden` → no scroll
- ✅ Grid layout: `grid-rows-[auto_1fr_auto]`
- ✅ Использует контекст вместо локального state

#### `app/menu/[category]/page.tsx` (Menu)

```tsx
export default function MenuCategoryPage() {
  const params = useParams();
  const { language, isDark, mounted } = useApp();
  
  return (
    <div className="min-h-screen">
      <Header 
        showBackButton 
        title={t.categories[category].name}
        subtitle={`${items.length} items`}
      />
      <main>...</main>
    </div>
  );
}
```

**Особенности:**
- ✅ Dynamic routing с `useParams()` (Next.js 15+)
- ✅ Client-side validation → redirect if invalid
- ✅ Production-ready card layout (aspect-[4/3], hover effects)

---

## 🛠 Лучшие практики

### ✅ TypeScript типизация

```typescript
// ❌ Плохо
setCity(value as any)

// ✅ Хорошо
export type City = "gdansk" | "sopot" | "gdynia";
setCity(value as City)
```

### ✅ Accessibility

```tsx
<Button aria-label="Toggle theme" ... />
<Button aria-label="Back to home" ... />
<SelectTrigger aria-label="Select language" ... />
```

### ✅ Hydration protection

```tsx
if (!mounted) {
  return <div className="min-h-screen bg-black" />;
}
```

### ✅ Responsive design

```tsx
// Mobile overflow protection
<div className="flex gap-2 flex-wrap sm:flex-nowrap">
  
// Proper container width
<div className="max-w-7xl mx-auto">
```

---

## 🔄 Data Flow

```
localStorage
    ↓
AppContext (useEffect)
    ↓
useApp() hook
    ↓
Header / Pages
    ↓
User interaction
    ↓
setState → save to localStorage
```

---

## 📱 Responsive Breakpoints

```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1536px  /* Large screens */
```

**Используется:**
- `sm:grid-cols-2` → 2 колонки на планшетах
- `lg:grid-cols-3` → 3 колонки на десктопах
- `md:px-12` → больше padding на больших экранах

---

## 🎨 Темная/Светлая тема

**Паттерн:**
```tsx
className={`transition-colors ${
  isDark 
    ? 'bg-black text-white' 
    : 'bg-white text-black'
}`}
```

**Цветовая палитра:**
- Background: `bg-black` / `bg-white`
- Cards: `bg-neutral-900` / `bg-neutral-50`
- Borders: `border-neutral-800` / `border-neutral-200`
- Text muted: `text-neutral-400` / `text-neutral-600`

---

## 🌍 Интернационализация

**Поддерживаемые языки:**
- 🇵🇱 Polish (pl)
- 🇬🇧 English (en)
- 🇺🇦 Ukrainian (uk)
- 🇷🇺 Russian (ru)

**Структура:**
```typescript
export const translations = {
  pl: {
    headline: "Sushi • Wok • Ramen",
    categories: { sushi: { name: "Sushi" } }
  },
  // ...
} as const;
```

**Использование:**
```tsx
const { language } = useApp();
const t = translations[language];

<h1>{t.headline}</h1>
<p>{item.nameTranslations[language]}</p>
```

---

## 🚀 Next.js 15+ Patterns

### ✅ Client Components

```tsx
"use client";  // Обязательно для useState, useEffect, useRouter
```

### ✅ Dynamic Routes

```tsx
// ❌ Old way (Next.js 14)
export default async function Page({ params }) {
  const category = params.category;
}

// ✅ New way (Next.js 15+)
export default function Page() {
  const params = useParams();
  const category = params.category;
}
```

### ✅ Image Optimization

```tsx
<Image
  src="..."
  fill
  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
  priority={false}
/>
```

**next.config.ts:**
```typescript
remotePatterns: [
  { protocol: 'https', hostname: 'i.postimg.cc' }
]
```

---

## 🎯 Будущие улучшения

1. **Cart functionality**
   - Global cart state в AppContext
   - Badge с количеством товаров
   - Cart drawer/modal

2. **Order flow**
   - Checkout page
   - Delivery details form
   - Payment integration

3. **Additional features**
   - Favorites system
   - Search functionality
   - Filters (vegetarian, spicy, etc.)
   - User authentication

---

## 📋 Checklist качества кода

- ✅ TypeScript strict typing (no `any`)
- ✅ Accessibility (aria-labels)
- ✅ Responsive design (mobile-first)
- ✅ Hydration protection
- ✅ localStorage persistence
- ✅ Production-ready UI (hover effects, transitions)
- ✅ Proper Next.js 15+ patterns
- ✅ Clean architecture (separation of concerns)

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

**Dev server:** http://localhost:3000

---

Made with ❤️ using Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
