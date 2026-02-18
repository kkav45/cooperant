# ИНСТРУКЦИЯ ПО ИНТЕГРАЦИИ TELEGRAM THEMEPARAMS

## Обзор

Данный документ описывает процесс интеграции цветовой схемы, шрифтов и размеров Telegram в информационную систему учета пайщиков кооператива.

---

## 📁 Созданные файлы

| Файл | Назначение |
|------|------------|
| `telegram-mini-app-styles.css` | Стили с поддержкой Telegram themeParams |
| `telegram-mini-app.js` | JavaScript интеграция с Telegram Web Apps SDK |
| `telegram-messenger-interface.html` | HTML-шаблон с полной интеграцией |

---

## 🎨 TELEGRAM THEMEPARAMS

### Базовые цвета

Telegram автоматически передаёт цветовую схему пользователя через `themeParams`:

```javascript
const themeParams = {
    bg_color: '#ffffff',           // Основной фон
    secondary_bg_color: '#f0f2f5', // Вторичный фон
    text_color: '#000000',         // Основной текст
    hint_color: '#999999',         // Вторичный текст
    link_color: '#2481cc',         // Ссылки
    button_color: '#2481cc',       // Кнопки
    button_text_color: '#ffffff'   // Текст кнопок
};
```

### Автоматическое применение темы

```javascript
// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();

// Получение themeParams
const themeParams = tg.themeParams;

// Применение к CSS переменным
const root = document.documentElement;
root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
// ... и так далее для всех цветов
```

### Обработка изменения темы

```javascript
// Подписка на событие изменения темы
tg.onEvent('themeChanged', () => {
    const newThemeParams = tg.themeParams;
    // Обновляем CSS переменные
    applyThemeParams(newThemeParams);
});
```

---

## 📏 РАЗМЕРЫ ПО ГАЙДЛАЙНАМ TELEGRAM

### Touch targets (минимальные размеры для касаний)

```css
:root {
    --tg-touch-size: 44px;        /* Минимальный размер для кнопок */
    --tg-touch-size-large: 56px;  /* Увеличенный размер для FAB */
}
```

### Шрифты

```css
:root {
    --tg-font-size-tiny: 11px;    /* Подписи, метки времени */
    --tg-font-size-small: 13px;   /* Вторичный текст */
    --tg-font-size-normal: 15px;  /* Основной текст */
    --tg-font-size-medium: 17px;  /* Заголовки */
    --tg-font-size-large: 19px;   /* Крупные заголовки */
    --tg-font-size-title: 22px;   /* Заголовки страниц */
    --tg-font-size-header: 28px;  /* Главные заголовки */
}
```

### Отступы

```css
:root {
    --tg-spacing-xs: 4px;
    --tg-spacing-sm: 8px;
    --tg-spacing-md: 12px;
    --tg-spacing-lg: 16px;
    --tg-spacing-xl: 20px;
    --tg-spacing-xxl: 24px;
}
```

### Границы и скругления

```css
:root {
    --tg-border-radius: 12px;         /* Стандартное скругление */
    --tg-border-radius-small: 8px;    /* Малое скругление */
    --tg-border-radius-large: 16px;   /* Большое скругление */
    --tg-border-radius-circle: 50%;   /* Круглые элементы */
}
```

---

## 📱 SAFE AREA INSETS

### Поддержка вырезов экрана (iPhone X и новее)

```css
:root {
    --tg-safe-area-inset-top: env(safe-area-inset-top, 0px);
    --tg-safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
    --tg-safe-area-inset-left: env(safe-area-inset-left, 0px);
    --tg-safe-area-inset-right: env(safe-area-inset-right, 0px);
}
```

### Применение в стилях

```css
.header {
    padding-top: var(--tg-safe-area-inset-top);
    padding-bottom: var(--tg-safe-area-inset-bottom);
}

.sidebar {
    padding-left: var(--tg-safe-area-inset-left);
    padding-right: var(--tg-safe-area-inset-right);
}
```

---

## 🔧 ИСПОЛЬЗОВАНИЕ В ПРИЛОЖЕНИИ

### 1. Подключение файлов

```html
<head>
    <!-- Telegram Web Apps SDK -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    
    <!-- Стили Telegram Mini App -->
    <link rel="stylesheet" href="telegram-mini-app-styles.css">
</head>
```

### 2. Инициализация

```javascript
// Автоматическая инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    await window.TelegramMiniApp.init();
    
    // Получение данных пользователя
    const userData = window.TelegramMiniApp.getUserData();
    console.log('User:', userData.firstName);
    
    // Проверка темы
    const isDark = window.TelegramMiniApp.isDarkTheme();
    console.log('Dark theme:', isDark);
});
```

### 3. Тактильный отклик (Haptic Feedback)

```javascript
// Для кнопок
button.addEventListener('click', () => {
    window.TelegramMiniApp.hapticFeedback('light');
});

// Типы тактильного отклика:
// - 'light' - лёгкий (стандартные действия)
// - 'medium' - средний (важные действия)
// - 'heavy' - сильный (критичные действия)
// - 'success' - успех (успешное завершение)
// - 'warning' - предупреждение
// - 'error' - ошибка
// - 'selection' - переключение (селекторы)
```

### 4. MainButton (главная кнопка)

```javascript
// Показать главную кнопку
window.TelegramMiniApp.showMainButton('СОХРАНИТЬ', true);

// Скрыть главную кнопку
window.TelegramMiniApp.hideMainButton();

// Обновить текст
window.TelegramMiniApp.updateMainButtonText('ОТПРАВИТЬ');

// Обработчик нажатия (переопределяется в приложении)
window.TelegramMiniApp.handleMainButtonClick = () => {
    console.log('MainButton clicked');
    // Логика сохранения
};
```

### 5. BackButton (кнопка назад)

```javascript
// Показать кнопку назад
window.TelegramMiniApp.showBackButton();

// Добавить обработчик
window.TelegramMiniApp.addBackHandler(() => {
    // Логика возврата
    closePanel();
});

// Удалить обработчик
window.TelegramMiniApp.removeBackHandler();

// Скрыть кнопку назад
window.TelegramMiniApp.hideBackButton();
```

### 6. Диалоги и уведомления

```javascript
// Alert
window.TelegramMiniApp.showAlert('Операция выполнена успешно!');

// Confirm
window.TelegramMiniApp.showConfirm('Вы уверены?', (result) => {
    if (result) {
        // Пользователь подтвердил
    }
});

// Popup с кнопками
window.TelegramMiniApp.showPopup({
    title: 'Действия',
    message: 'Выберите действие:',
    buttons: [
        {id: 'delete', type: 'destructive', text: 'Удалить'},
        {id: 'cancel', type: 'default', text: 'Отмена'}
    ]
}, (buttonId) => {
    console.log('Выбрана кнопка:', buttonId);
});
```

### 7. Работа с viewport

```javascript
// Развернуть на весь экран
window.TelegramMiniApp.expand();

// Получить высоту viewport
const height = window.TelegramMiniApp.viewportHeight;

// Проверка состояния разворота
const isExpanded = window.TelegramMiniApp.isExpanded;

// Подписка на изменение viewport
window.TelegramMiniApp.onViewportChange(({height, isExpanded}) => {
    console.log('Viewport changed:', height, isExpanded);
});
```

### 8. Закрытие приложения

```javascript
// Закрыть Mini App
window.TelegramMiniApp.close();
```

### 9. Открытие ссылок

```javascript
// Открыть внешнюю ссылку
window.TelegramMiniApp.openLink('https://example.com');

// Открыть Telegram ссылку
window.TelegramMiniApp.openTelegramLink('https://t.me/username');
```

### 10. Сканирование QR кода

```javascript
// Использовать нативный сканер Telegram
const tg = window.TelegramMiniApp.getTelegram();
if (tg) {
    tg.showScanQRPopup((qrData) => {
        console.log('QR данные:', qrData);
    });
}
```

---

## 🎨 АДАПТАЦИЯ ЦВЕТОВОЙ СХЕМЫ

### Светлая тема (по умолчанию)

```css
:root {
    --tg-theme-bg-color: #ffffff;
    --tg-theme-secondary-bg-color: #f0f2f5;
    --tg-theme-text-color: #000000;
    --tg-theme-hint-color: #999999;
    --tg-theme-border-color: rgba(0, 0, 0, 0.1);
}
```

### Тёмная тема (автоматически)

```css
@media (prefers-color-scheme: dark) {
    :root {
        --tg-theme-bg-color: #1c1c1d;
        --tg-theme-secondary-bg-color: #000000;
        --tg-theme-text-color: #ffffff;
        --tg-theme-hint-color: #999999;
        --tg-theme-border-color: rgba(255, 255, 255, 0.1);
    }
}
```

### Семантические цвета (адаптируются автоматически)

```css
/* Статусы */
--tg-theme-status-active-bg: #e8f5e9;
--tg-theme-status-active-text: #2e7d32;
--tg-theme-status-debt-bg: #ffebee;
--tg-theme-status-debt-text: #c62828;

/* Акценты */
--tg-theme-accent-blue: #2481cc;
--tg-theme-accent-blue-light: #e3f2fd;
--tg-theme-positive-color: #4caf50;
--tg-theme-negative-color: #f44336;
--tg-theme-warning-color: #ff9800;
```

---

## 📋 ЧЕК-ЛИСТ ИНТЕГРАЦИИ

### Обязательные элементы

- [ ] Подключён скрипт `telegram-web-app.js`
- [ ] Вызван `Telegram.WebApp.ready()`
- [ ] Получены и применены `themeParams`
- [ ] Обработано событие `themeChanged`
- [ ] Обработано событие `viewportChanged`
- [ ] Все кнопки имеют размер ≥ 44px
- [ ] Используется системный шрифт Telegram
- [ ] Учтены safe area insets
- [ ] Нет горизонтального скролла
- [ ] Контрастность текста ≥ 4.5:1

### Рекомендуется

- [ ] Использован HapticFeedback для кнопок
- [ ] MainButton для основных действий
- [ ] BackButton синхронизирован с навигацией
- [ ] showPopup/showConfirm вместо alert/confirm
- [ ] Вызван `expand()` для развёртывания
- [ ] Обработано `keyboardOpened`/`keyboardClosed`

---

## 🔍 ОТЛАДКА

### Логирование

```javascript
// Включить логирование (удалить в продакшене)
console.log('Telegram WebApp:', {
    platform: tg.platform,
    version: tg.version,
    colorScheme: tg.colorScheme,
    isExpanded: tg.isExpanded,
    themeParams: tg.themeParams
});
```

### Проверка в браузере

Для тестирования без Telegram используйте режим совместимости:

```javascript
// Автоматически определяется при отсутствии Telegram.WebApp
// Применяется системная тема устройства
```

### Telegram BotFather

Для настройки Mini App:

1. Откройте @BotFather
2. `/mybot` → выберите бота
3. `Bot Settings` → `Menu Button`
4. Укажите URL вашего Mini App
5. Включите `https://`

---

## 📊 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Пример 1: Адаптивная кнопка

```css
.telegram-button {
    min-width: var(--tg-touch-size);
    min-height: var(--tg-touch-size);
    padding: var(--tg-spacing-sm) var(--tg-spacing-lg);
    background: var(--tg-theme-button-color);
    color: var(--tg-theme-button-text-color);
    border: none;
    border-radius: var(--tg-border-radius);
    font-size: var(--tg-font-size-normal);
    font-family: var(--tg-theme-font-family);
    cursor: pointer;
    transition: opacity 0.2s;
}

.telegram-button:hover {
    opacity: 0.9;
}

.telegram-button:active {
    opacity: 0.8;
}
```

### Пример 2: Карточка с темой

```css
.theme-card {
    background: var(--tg-theme-bg-color);
    color: var(--tg-theme-text-color);
    border: 1px solid var(--tg-theme-border-color);
    border-radius: var(--tg-border-radius);
    padding: var(--tg-spacing-lg);
    margin: var(--tg-spacing-md) 0;
}

.theme-card-title {
    font-size: var(--tg-font-size-medium);
    font-weight: 600;
    color: var(--tg-theme-text-color);
    margin-bottom: var(--tg-spacing-sm);
}

.theme-card-subtitle {
    font-size: var(--tg-font-size-small);
    color: var(--tg-theme-hint-color);
}
```

### Пример 3: Список с темой

```css
.theme-list {
    background: var(--tg-theme-bg-color);
}

.theme-list-item {
    display: flex;
    align-items: center;
    padding: var(--tg-spacing-md) var(--tg-spacing-lg);
    border-bottom: 1px solid var(--tg-theme-border-light);
    min-height: var(--tg-touch-size);
    cursor: pointer;
    transition: background-color 0.2s;
}

.theme-list-item:hover {
    background: var(--tg-theme-secondary-bg-color);
}

.theme-list-item:active {
    background: var(--tg-theme-accent-blue-light);
}

.theme-list-item-text {
    flex: 1;
    color: var(--tg-theme-text-color);
    font-size: var(--tg-font-size-normal);
}
```

---

## 🚀 РАЗВЁРТЫВАНИЕ

### Требования

1. **HTTPS** — обязательно для Telegram Mini App
2. **Валидация initData** — на бэкенде для аутентификации
3. **CORS** — настроен корректно
4. **Быстрая загрузка** — < 3 секунд

### Развёртывание

1. Загрузите файлы на HTTPS хостинг
2. Настройте бота через @BotFather
3. Укажите URL Mini App
4. Протестируйте в Telegram

---

## 📚 ССЫЛКИ

- [Telegram Web Apps SDK](https://core.telegram.org/bots/webapps)
- [Telegram Design Guidelines](https://telegram.org/faq/design)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## ✅ ИТОГИ

Данная интеграция обеспечивает:

✅ **Автоматическую адаптацию** под светлую/тёмную тему пользователя  
✅ **Соответствие гайдлайнам** Telegram по размерам и шрифтам  
✅ **Тактильный отклик** для улучшения UX  
✅ **Нативные кнопки** MainButton/BackButton  
✅ **Безопасные зоны** для современных устройств  
✅ **Плавные переходы** и анимации  
✅ **Кроссбраузерность** с режимом совместимости
