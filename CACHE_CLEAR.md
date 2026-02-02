# 🔄 Как очистить кеш Next.js

Если видишь старое содержимое страницы после изменений, нужно очистить кеш:

## 🚀 Быстрый способ (рекомендуется)

### В браузере:
1. **Chrome/Edge**: `Cmd + Shift + R` (macOS) или `Ctrl + Shift + R` (Windows/Linux)
2. **Safari**: `Cmd + Option + R`
3. **Firefox**: `Cmd + Shift + R` (macOS) или `Ctrl + F5` (Windows/Linux)

### Или через DevTools:
1. Открой DevTools: `F12` или `Cmd + Option + I`
2. Правый клик на кнопке обновления → "Empty Cache and Hard Reload"

---

## 🧹 Полная очистка Next.js

Если hard refresh не помогает, выполни в терминале:

```bash
# 1. Остановить сервер (Ctrl+C)

# 2. Удалить .next кеш
rm -rf .next

# 3. Очистить node_modules/.cache (если есть)
rm -rf node_modules/.cache

# 4. Перезапустить сервер
npm run dev
```

---

## 📝 Проблема в твоём случае

Страница `/profile` изменена на **Settings**, но браузер показывает старый контент:

### Старое (кешированное):
```
Profile
Guest
Log in to save your preferences
Settings
Quick actions
  - Notifications
  - Favorites
  - Account settings
Sign out
```

### Новое (актуальное):
```
Settings (Настройки)
FodiFood
Manage app settings
Basic settings
  - City selector
  - Language selector  
  - Theme toggle
Preferences
  - Notifications
  - About app
App Info
```

---

## ✅ Решение для твоего случая:

1. **Hard Reload**: `Cmd + Shift + R` в браузере
2. Если не помогло:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. Открой http://localhost:3000/profile в режиме инкогнито (чистый кеш)

---

## 🔍 Как проверить, что изменения применились:

После очистки кеша должно быть:
- ✅ Заголовок: "Settings" (не "Profile")
- ✅ Иконка: Settings2 (не User)
- ✅ Описание: "Manage app settings"
- ✅ Нет карточки "Guest"
- ✅ Нет кнопки "Sign out"
- ✅ Нет "Favorites" и "Account settings"
- ✅ Есть "About app" вместо удалённых пунктов

---

## 🎯 Почему это происходит?

Next.js кеширует:
- Compiled pages в `.next/`
- Server Components
- Route segments
- Static assets

Hard refresh очищает browser cache, но иногда нужно удалить `.next/` для полной очистки server-side кеша.
