# 🍱 Menu Categories Component

## Обзор

Компонент горизонтальных табов для переключения между категориями меню. Реализован в стиле **Wolt / Uber Eats** с modern UX паттернами.

---

## 📍 Расположение

```
components/menu-categories.tsx
```

---

## 🎯 Использование

### В странице меню (`app/menu/[category]/page.tsx`):

```tsx
import { MenuCategories } from "@/components/menu-categories";

export default function MenuCategoryPage() {
  return (
    <div>
      <Header />
      <MenuCategories />  {/* ← Добавить после Header */}
      <main>...</main>
    </div>
  );
}
```

---

## 🎨 Визуальная структура

```
┌─────────────────────────────────────────────────────────┐
│  Header (sticky top-0)                                  │
├─────────────────────────────────────────────────────────┤
│  [🍣 Sushi]  [🥡 Wok]  [🍜 Ramen]  ← sticky top-[89px] │
├─────────────────────────────────────────────────────────┤
│  Menu Items Grid                                        │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Особенности

### 1. **Sticky Position**
```tsx
sticky top-[89px]  // 89px = высота Header
```
- Табы остаются видимыми при скролле
- Header всегда сверху, табы под ним

### 2. **Active State**
```tsx
const active = pathname === `/menu/${cat.key}`;
```
- Автоматически определяется из URL
- Активная кнопка выделена контрастным цветом

### 3. **Theme Support**
```tsx
active
  ? isDark
    ? "bg-white text-black"    // Dark theme: белая кнопка
    : "bg-black text-white"    // Light theme: черная кнопка
  : isDark
    ? "bg-neutral-800"         // Dark theme: темно-серая
    : "bg-neutral-100"         // Light theme: светло-серая
```

### 4. **Horizontal Scroll**
```tsx
overflow-x-auto scrollbar-hide
```
- На мобильных: горизонтальный скролл
- Scrollbar скрыт (`scrollbar-hide` class)
- На десктопе: все табы влезают

### 5. **Smooth Animations**
```tsx
hover:scale-105 active:scale-95
transition-all duration-200
```
- Масштабирование при hover
- Плавные переходы
- Тактильный фидбек при клике

---

## 🎨 Стили

### Активная кнопка (Dark Theme):
```css
bg-white text-black shadow-lg
```

### Активная кнопка (Light Theme):
```css
bg-black text-white shadow-lg
```

### Неактивная кнопка (Dark Theme):
```css
bg-neutral-800 text-neutral-300
hover:bg-neutral-700
```

### Неактивная кнопка (Light Theme):
```css
bg-neutral-100 text-neutral-700
hover:bg-neutral-200
```

---

## 🔧 Технические детали

### Props: Нет
Компонент не принимает props — всё определяется автоматически:
- Активная категория из `usePathname()`
- Тема из `useApp()`
- Навигация через `useRouter()`

### Зависимости:
```tsx
import { useApp } from "@/context/app-context";
import { useRouter, usePathname } from "next/navigation";
import type { MenuCategory } from "@/lib/menu-types";
import { cn } from "@/lib/utils";
```

### Категории:
```tsx
const categories: { key: MenuCategory; label: string; emoji: string }[] = [
  { key: "sushi", label: "Sushi", emoji: "🍣" },
  { key: "wok", label: "Wok", emoji: "🥡" },
  { key: "ramen", label: "Ramen", emoji: "🍜" },
];
```

---

## 📱 Responsive Behavior

### Mobile (<640px):
- Горизонтальный скролл
- Scrollbar скрыт
- Кнопки не переносятся

### Tablet & Desktop (≥640px):
- Все кнопки видны
- Нет скролла

---

## 🎯 UX Benefits

1. ✅ **Быстрое переключение** — не нужно возвращаться на landing
2. ✅ **Видимость** — пользователь сразу видит все категории
3. ✅ **URL persistence** — можно шарить ссылку на конкретную категорию
4. ✅ **Smooth navigation** — без перезагрузки страницы
5. ✅ **Visual feedback** — понятно, где сейчас находишься

---

## 🔄 Navigation Flow

```
User clicks "Wok" tab
       ↓
router.push('/menu/wok')
       ↓
URL changes: /menu/sushi → /menu/wok
       ↓
MenuCategoryPage re-renders
       ↓
New items filtered by category
       ↓
MenuCategories updates active state
```

---

## 🛠 Customization

### Добавить новую категорию:
```tsx
const categories = [
  { key: "sushi", label: "Sushi", emoji: "🍣" },
  { key: "wok", label: "Wok", emoji: "🥡" },
  { key: "ramen", label: "Ramen", emoji: "🍜" },
  { key: "desserts", label: "Desserts", emoji: "🍰" },  // ← NEW
];
```

### Изменить стили:
```tsx
className={cn(
  "px-5 py-2.5 rounded-full",  // Размер кнопки
  "text-sm font-medium",        // Типографика
  "transition-all duration-200", // Анимация
  // ... остальные стили
)}
```

### Изменить sticky offset:
```tsx
// Если Header стал выше/ниже
top-[89px]  // ← изменить на новую высоту
```

---

## 🎨 Backdrop Blur Effect

```tsx
backdrop-blur-xl
backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
```

- Полупрозрачный фон
- Blur эффект
- Контент просвечивает при скролле

---

## 🔍 Accessibility

### Current:
- ✅ Semantic `<button>` elements
- ✅ Keyboard navigation support
- ✅ Visual feedback on hover/active

### TODO (рекомендации):
```tsx
<button
  aria-label={`View ${cat.label} menu`}
  aria-current={active ? "page" : undefined}
  role="tab"
>
```

---

## 📊 Performance

- ✅ Lightweight component (<50 lines)
- ✅ No external dependencies
- ✅ Client-side routing (fast)
- ✅ Memoization not needed (simple logic)

---

## 🚀 Future Enhancements

1. **Item count badges**
   ```tsx
   <span className="ml-1 text-xs">({itemCount})</span>
   ```

2. **Loading states**
   ```tsx
   {isLoading && <Spinner />}
   ```

3. **Swipe gestures**
   ```tsx
   // Добавить swipe влево/вправо на мобильных
   ```

4. **Search integration**
   ```tsx
   // Добавить поиск по всем категориям
   ```

---

## 📝 Example Usage Patterns

### Базовый:
```tsx
<MenuCategories />
```

### С дополнительным контентом:
```tsx
<div>
  <Header />
  <MenuCategories />
  <FilterBar />  {/* Дополнительные фильтры */}
  <MenuGrid />
</div>
```

---

## 🎉 Итог

Компонент реализует **production-ready** UX паттерн с:
- ✅ Sticky positioning
- ✅ Smooth animations
- ✅ Theme support
- ✅ Mobile optimization
- ✅ Clean architecture

**Готово к продакшену!** 🚀
