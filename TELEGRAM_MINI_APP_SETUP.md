# 📱 TELEGRAM MINI APP: РУКОВОДСТВО ПО ЗАПУСКУ

**Дата:** 17 февраля 2026  
**Время настройки:** 15-20 минут

---

## 📊 ЧТО СОЗДАНО

| Файл | Назначение | Статус |
|------|------------|--------|
| `telegram-mini-app.html` | Готовое приложение для Telegram | ✅ |
| `yandex-disk-integration.js` | Интеграция с Яндекс Диском | ✅ |
| `app.js` | Основная логика | ✅ |
| `messenger-app-v2.js` | Messenger интерфейс | ✅ |

---

## 🚀 БЫСТРЫЙ СТАРТ

### ШАГ 1: Разместите файлы на GitHub

1. **Создайте репозиторий:**
   ```
   Название: kooperative-messenger
   Visibility: Public
   ```

2. **Загрузите файлы:**
   ```bash
   git init
   git add telegram-mini-app.html app.js messenger-app-v2.js yandex-disk-integration.js styles.css
   git commit -m "Telegram Mini App"
   git branch -M main
   git remote add origin https://github.com/USERNAME/kooperative-messenger.git
   git push -u origin main
   ```

3. **Включите GitHub Pages:**
   - Settings → Pages
   - Source: main branch
   - Save

4. **Получите URL:**
   ```
   https://USERNAME.github.io/kooperative-messenger/telegram-mini-app.html
   ```

---

### ШАГ 2: Создайте Telegram бота

1. **Откройте @BotFather**

2. **Создайте бота:**
   ```
   /newbot
   Название: Кооператив Мессенджер
   Username: kooperative_messenger_bot
   ```

3. **Сохраните токен:**
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

---

### ШАГ 3: Настройте Mini App

1. **В @BotFather:**
   ```
   /newapp
   ```

2. **Выберите бота**

3. **Введите название:**
   ```
   Кооператив Мессенджер
   ```

4. **Введите описание:**
   ```
   Информационная система кооператива
   ```

5. **Загрузите фото (640x360):**
   - Логотип кооператива

6. **Введите URL:**
   ```
   https://USERNAME.github.io/kooperative-messenger/telegram-mini-app.html
   ```

7. **Введите короткое название:**
   ```
   messenger
   ```

8. **Получите ссылку:**
   ```
   t.me/kooperative_messenger_bot/messenger
   ```

---

### ШАГ 4: Добавьте кнопку Menu Button

1. **В @BotFather:**
   ```
   /mybots → Выберите бота → Bot Settings → Menu Button
   ```

2. **Введите URL:**
   ```
   https://USERNAME.github.io/kooperative-messenger/telegram-mini-app.html
   ```

3. **Введите название:**
   ```
   📱 Открыть приложение
   ```

---

### ШАГ 5: Проверьте работу

1. **Откройте бота в Telegram**
2. **Нажмите кнопку "📱 Открыть приложение"**
3. **Приложение загрузится**
4. **Авторизуйтесь в Яндекс Диске**
5. **Работайте!**

---

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Реализованные функции

| Функция | Статус |
|---------|--------|
| **Telegram WebApp SDK** | ✅ |
| **Адаптивная вёрстка** | ✅ |
| **Менеджер панелей** | ✅ |
| **Overlay для закрытия** | ✅ |
| **Свайпы для мобильных** | ✅ |
| **Haptic Feedback** | ✅ |
| **Telegram тема** | ✅ |
| **Яндекс Диск** | ✅ |

---

### Логика работы панелей

```
Открытие панели:
1. PanelManager.open('sidebarMenu')
2. Закрыть все открытые панели
3. Открыть нужную
4. Показать overlay
5. Haptic feedback

Закрытие:
1. Клик на overlay → PanelManager.closeAll()
2. Клик на ✕ → PanelManager.close()
3. Свайп вправо → PanelManager.closeAll()
```

---

### Адаптивность

| Устройство | Ширина | Поведение |
|------------|--------|-----------|
| **iPhone SE** | 320px | Панели на весь экран |
| **iPhone 12** | 390px | Панели 320px |
| **Android** | 360-412px | Панели 320px |
| **Desktop** | >500px | Панели 320px |

---

## 🎨 ИНТЕГРАЦИЯ С TELEGRAM

### Автоматическая тема

```javascript
// Приложение автоматически подстраивается под тему Telegram
const tg = window.Telegram.WebApp;

// Цвета из Telegram
--tg-theme-bg-color
--tg-theme-text-color
--tg-theme-button-color
```

### Haptic Feedback

```javascript
// Вибрация при открытии панелей
if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
}
```

### Главная кнопка

```javascript
// Показываем "НАЧАТЬ РАБОТУ" при загрузке
tg.MainButton.setText('НАЧАТЬ РАБОТУ');
tg.MainButton.onClick(() => {
    document.getElementById('loadingOverlay').style.display = 'none';
    tg.MainButton.hide();
});
tg.MainButton.show();
```

---

## 🔐 БЕЗОПАСНОСТЬ

### CORS

- ✅ GitHub Pages разрешает CORS
- ✅ jsDelivr CDN разрешает CORS
- ✅ Telegram WebApp работает

### HTTPS

- ✅ GitHub Pages использует HTTPS
- ✅ Telegram требует HTTPS

### Данные

- ✅ localStorage — только на устройстве
- ✅ Яндекс Диск — OAuth 2.0
- ✅ Telegram — шифрование

---

## 📊 СХЕМА РАБОТЫ

```
┌─────────────────────────────────────────────────────────┐
│                   TELEGRAM                              │
│                                                         │
│  @kooperative_messenger_bot                            │
│  ┌─────────────────────────────────────────┐           │
│  │  📱 Открыть приложение                  │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Telegram Web View (встроенный браузер)        │
│                                                         │
│  Загружает: telegram-mini-app.html                     │
│  Telegram WebApp SDK                                   │
│  Panel Manager (логика панелей)                        │
│  Swipe Gestures (жесты)                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   GitHub Pages                          │
│                                                         │
│  - telegram-mini-app.html                               │
│  - app.js (загружается)                                │
│  - messenger-app-v2.js (загружается)                   │
│  - yandex-disk-integration.js (загружается)           │
│  - styles.css (загружается)                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Яндекс Диск                           │
│                                                         │
│  - Папка: Приложения/КООПЕРАНТ                         │
│  - Автосохранение каждые 30 сек                        │
│  - Данные пользователя                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Чек-лист

- [ ] Бот открывается
- [ ] Кнопка Menu Button работает
- [ ] Приложение загружается
- [ ] Левое меню открывается
- [ ] Правое меню открывается
- [ ] Overlay появляется
- [ ] Клик на overlay закрывает панели
- [ ] Свайп вправо закрывает панели
- [ ] Haptic feedback работает
- [ ] Тема Telegram применяется
- [ ] Яндекс Диск авторизуется
- [ ] Автосохранение работает

### Тест на устройствах

- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Telegram Desktop
- [ ] Telegram Web

---

## 🔧 УСТРАНЕНИЕ ПРОБЛЕМ

### Ошибка: "Invalid URL"

**Решение:**
1. Проверьте URL в @BotFather
2. URL должен начинаться с `https://`
3. GitHub Pages должен быть включён

### Ошибка: "Failed to load script"

**Решение:**
1. Проверьте, что файлы загружены на GitHub
2. Проверьте пути в `<script src="...">`
3. Подождите 1-2 минуты после push

### Приложение не открывается

**Решение:**
1. Откройте URL в браузере
2. Проверьте консоль на ошибки
3. Проверьте Telegram Web View

### Панели не открываются

**Решение:**
1. Проверьте консоль на ошибки
2. Проверьте PanelManager
3. Проверьте overlay

---

## 📈 АНАЛИТИКА

### Telegram Bot API

```javascript
// Получение данных о пользователе
const user = tg.initDataUnsafe?.user;
console.log('User:', user);
```

### Отправка данных боту

```javascript
// Отправка данных
tg.sendData(JSON.stringify({
    action: 'user_login',
    userId: user.id
}));
```

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

### Опционально:

1. **Добавить иконку приложения**
2. **Настроить уведомления**
3. **Добавить офлайн режим**
4. **Интеграция с ботом**

---

## 📞 ПОДДЕРЖКА

### Документация Telegram

- [Telegram WebApp](https://core.telegram.org/bots/webapps)
- [BotFather](https://core.telegram.org/bots/features#botfather)
- [Telegram Bot API](https://core.telegram.org/bots/api)

### Документация GitHub Pages

- [GitHub Pages](https://pages.github.com/)

---

**Время настройки:** 15-20 минут  
**Сложность:** Средняя  
**Требуется:** Telegram аккаунт, GitHub аккаунт
