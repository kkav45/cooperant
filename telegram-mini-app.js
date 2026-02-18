/**
 * Telegram Mini App Integration
 * Интеграция с Telegram Web Apps SDK
 * Версия: 1.0
 * Дата: 18 февраля 2026
 */

// ========================================
// TELEGRAM WEB APPS SDK INITIALIZATION
// ========================================

class TelegramMiniAppIntegration {
    constructor() {
        this.tg = null;
        this.isReady = false;
        this.themeParams = {};
        this.initData = null;
        this.initDataUnsafe = null;
        this.viewportHeight = 0;
        this.isExpanded = false;
        
        // Callbacks
        this.onThemeChangeCallbacks = [];
        this.onViewportChangeCallbacks = [];
        this.onBackButtonCallbacks = [];
    }

    /**
     * Инициализация Telegram Web Apps SDK
     */
    init() {
        return new Promise((resolve, reject) => {
            try {
                // Проверяем наличие Telegram WebApp
                if (!window.Telegram || !window.Telegram.WebApp) {
                    console.warn('Telegram WebApp SDK not found, using fallback mode');
                    this.initFallbackMode();
                    resolve(false);
                    return;
                }

                this.tg = window.Telegram.WebApp;
                
                // Готовность приложения
                this.tg.ready();
                
                // Получение данных
                this.initData = this.tg.initData;
                this.initDataUnsafe = this.tg.initDataUnsafe;
                
                // Получение themeParams
                this.themeParams = this.tg.themeParams || {};
                
                // Получение viewport информации
                this.viewportHeight = this.tg.viewportHeight || window.innerHeight;
                this.isExpanded = this.tg.isExpanded || false;

                console.log('Telegram WebApp initialized:', {
                    platform: this.tg.platform,
                    version: this.tg.version,
                    colorScheme: this.tg.colorScheme,
                    isExpanded: this.isExpanded
                });

                // Применяем тему
                this.applyThemeParams();

                // Устанавливаем обработчики событий
                this.setupEventListeners();

                // Настраиваем MainButton
                this.setupMainButton();

                // Настраиваем BackButton
                this.setupBackButton();

                // Разворачиваем на весь экран
                this.expand();

                this.isReady = true;
                resolve(true);

            } catch (error) {
                console.error('Error initializing Telegram WebApp:', error);
                this.initFallbackMode();
                resolve(false);
            }
        });
    }

    /**
     * Режим совместимости (если Telegram SDK недоступен)
     */
    initFallbackMode() {
        console.log('Using fallback mode (no Telegram WebApp)');
        
        // Проверяем системную тему
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.themeParams = {
            bg_color: prefersDark ? '#1c1c1d' : '#ffffff',
            secondary_bg_color: prefersDark ? '#000000' : '#f0f2f5',
            text_color: prefersDark ? '#ffffff' : '#000000',
            hint_color: prefersDark ? '#999999' : '#999999',
            link_color: prefersDark ? '#6c9fe6' : '#2481cc',
            button_color: prefersDark ? '#6c9fe6' : '#2481cc',
            button_text_color: prefersDark ? '#ffffff' : '#ffffff',
        };

        this.applyThemeParams();
        this.isReady = true;

        // Слушим изменения системной темы
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            this.themeParams.bg_color = e.matches ? '#1c1c1d' : '#ffffff';
            this.themeParams.secondary_bg_color = e.matches ? '#000000' : '#f0f2f5';
            this.themeParams.text_color = e.matches ? '#ffffff' : '#000000';
            this.themeParams.hint_color = e.matches ? '#999999' : '#999999';
            this.themeParams.link_color = e.matches ? '#6c9fe6' : '#2481cc';
            this.themeParams.button_color = e.matches ? '#6c9fe6' : '#2481cc';
            this.applyThemeParams();
            this.triggerThemeChangeCallbacks();
        });
    }

    /**
     * Применение themeParams к CSS переменным
     */
    applyThemeParams() {
        const root = document.documentElement;
        const tp = this.themeParams;

        // Базовые цвета
        if (tp.bg_color) {
            root.style.setProperty('--tg-theme-bg-color', tp.bg_color);
        }
        if (tp.secondary_bg_color) {
            root.style.setProperty('--tg-theme-secondary-bg-color', tp.secondary_bg_color);
        }
        if (tp.text_color) {
            root.style.setProperty('--tg-theme-text-color', tp.text_color);
        }
        if (tp.hint_color) {
            root.style.setProperty('--tg-theme-hint-color', tp.hint_color);
        }
        if (tp.link_color) {
            root.style.setProperty('--tg-theme-link-color', tp.link_color);
        }
        if (tp.button_color) {
            root.style.setProperty('--tg-theme-button-color', tp.button_color);
        }
        if (tp.button_text_color) {
            root.style.setProperty('--tg-theme-button-text-color', tp.button_text_color);
        }

        // Адаптация семантических цветов под тему
        this.adaptSemanticColors();
    }

    /**
     * Адаптация семантических цветов под текущую тему
     */
    adaptSemanticColors() {
        const isDark = this.tg?.colorScheme === 'dark' || 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const root = document.documentElement;

        if (isDark) {
            // Тёмная тема - более яркие цвета для контраста
            root.style.setProperty('--tg-theme-positive-color', '#4caf50');
            root.style.setProperty('--tg-theme-negative-color', '#ef5350');
            root.style.setProperty('--tg-theme-warning-color', '#ffa726');
            root.style.setProperty('--tg-theme-status-active-bg', 'rgba(76, 175, 80, 0.2)');
            root.style.setProperty('--tg-theme-status-active-text', '#81c784');
            root.style.setProperty('--tg-theme-status-debt-bg', 'rgba(239, 83, 80, 0.2)');
            root.style.setProperty('--tg-theme-status-debt-text', '#e57373');
            root.style.setProperty('--tg-theme-status-pending-bg', 'rgba(255, 167, 38, 0.2)');
            root.style.setProperty('--tg-theme-status-pending-text', '#ffb74d');
            root.style.setProperty('--tg-theme-accent-blue-light', 'rgba(108, 159, 230, 0.2)');
            root.style.setProperty('--tg-theme-border-color', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--tg-theme-border-light', 'rgba(255, 255, 255, 0.05)');
        } else {
            // Светлая тема - стандартные цвета
            root.style.setProperty('--tg-theme-positive-color', '#4caf50');
            root.style.setProperty('--tg-theme-negative-color', '#f44336');
            root.style.setProperty('--tg-theme-warning-color', '#ff9800');
            root.style.setProperty('--tg-theme-status-active-bg', '#e8f5e9');
            root.style.setProperty('--tg-theme-status-active-text', '#2e7d32');
            root.style.setProperty('--tg-theme-status-debt-bg', '#ffebee');
            root.style.setProperty('--tg-theme-status-debt-text', '#c62828');
            root.style.setProperty('--tg-theme-status-pending-bg', '#fff3e0');
            root.style.setProperty('--tg-theme-status-pending-text', '#ef6c00');
            root.style.setProperty('--tg-theme-accent-blue-light', '#e3f2fd');
            root.style.setProperty('--tg-theme-border-color', 'rgba(0, 0, 0, 0.1)');
            root.style.setProperty('--tg-theme-border-light', 'rgba(0, 0, 0, 0.05)');
        }
    }

    /**
     * Настройка обработчиков событий Telegram
     */
    setupEventListeners() {
        if (!this.tg) return;

        // Изменение темы
        this.tg.onEvent('themeChanged', () => {
            console.log('Theme changed event');
            this.themeParams = this.tg.themeParams || {};
            this.applyThemeParams();
            this.triggerThemeChangeCallbacks();
        });

        // Изменение viewport
        this.tg.onEvent('viewportChanged', () => {
            console.log('Viewport changed event');
            this.viewportHeight = this.tg.viewportHeight || window.innerHeight;
            this.isExpanded = this.tg.isExpanded || false;
            this.triggerViewportChangeCallbacks();
        });

        // Открытие клавиатуры
        this.tg.onEvent('keyboardOpened', (info) => {
            console.log('Keyboard opened:', info);
        });

        // Закрытие клавиатуры
        this.tg.onEvent('keyboardClosed', () => {
            console.log('Keyboard closed');
        });
    }

    /**
     * Настройка MainButton
     */
    setupMainButton() {
        if (!this.tg?.MainButton) return;

        const mainButton = this.tg.MainButton;
        
        // Скрываем по умолчанию
        mainButton.hide();
        
        // Обработчик нажатия
        mainButton.onClick(() => {
            console.log('MainButton clicked');
            this.handleMainButtonClick();
        });
    }

    /**
     * Обработчик нажатия MainButton (переопределяется в приложении)
     */
    handleMainButtonClick() {
        console.log('MainButton default handler - override in your app');
    }

    /**
     * Настройка BackButton
     */
    setupBackButton() {
        if (!this.tg?.BackButton) return;

        const backButton = this.tg.BackButton;
        
        // Скрываем по умолчанию
        backButton.hide();
        
        // Обработчик нажатия
        backButton.onClick(() => {
            console.log('BackButton clicked');
            this.handleBackButtonClick();
        });
    }

    /**
     * Обработчик нажатия BackButton (переопределяется в приложении)
     */
    handleBackButtonClick() {
        console.log('BackButton default handler - override in your app');
        
        // Закрываем приложение если некуда возвращаться
        if (this.onBackButtonCallbacks.length === 0) {
            this.close();
        } else {
            // Вызываем последний callback
            const callback = this.onBackButtonCallbacks.pop();
            callback();
        }
    }

    /**
     * Добавить обработчик BackButton
     */
    addBackHandler(callback) {
        this.onBackButtonCallbacks.push(callback);
        this.showBackButton();
    }

    /**
     * Удалить обработчик BackButton
     */
    removeBackHandler() {
        this.onBackButtonCallbacks.pop();
        if (this.onBackButtonCallbacks.length === 0) {
            this.hideBackButton();
        }
    }

    /**
     * Показать MainButton
     */
    showMainButton(text, isActive = true) {
        if (!this.tg?.MainButton) return;

        const mainButton = this.tg.MainButton;
        
        if (text) {
            mainButton.setText(text.toUpperCase());
        }
        
        if (isActive) {
            mainButton.enable();
        } else {
            mainButton.disable();
        }
        
        mainButton.show();
    }

    /**
     * Скрыть MainButton
     */
    hideMainButton() {
        if (!this.tg?.MainButton) return;
        this.tg.MainButton.hide();
    }

    /**
     * Активировать/деактивировать MainButton
     */
    setMainButtonActive(isActive) {
        if (!this.tg?.MainButton) return;
        
        if (isActive) {
            this.tg.MainButton.enable();
        } else {
            this.tg.MainButton.disable();
        }
    }

    /**
     * Обновить текст MainButton
     */
    updateMainButtonText(text) {
        if (!this.tg?.MainButton) return;
        this.tg.MainButton.setText(text.toUpperCase());
    }

    /**
     * Показать BackButton
     */
    showBackButton() {
        if (!this.tg?.BackButton) return;
        this.tg.BackButton.show();
    }

    /**
     * Скрыть BackButton
     */
    hideBackButton() {
        if (!this.tg?.BackButton) return;
        this.tg.BackButton.hide();
    }

    /**
     * Развернуть приложение
     */
    expand() {
        if (!this.tg) return;
        
        if (!this.tg.isExpanded) {
            this.tg.expand();
        }
    }

    /**
     * Закрыть приложение
     */
    close() {
        if (!this.tg) return;
        this.tg.close();
    }

    /**
     * Haptic Feedback - тактильный отклик
     */
    hapticFeedback(type = 'light') {
        if (!this.tg?.HapticFeedback) return;

        const haptic = this.tg.HapticFeedback;

        switch (type) {
            case 'light':
                haptic.impactOccurred('light');
                break;
            case 'medium':
                haptic.impactOccurred('medium');
                break;
            case 'heavy':
                haptic.impactOccurred('heavy');
                break;
            case 'success':
                haptic.notificationOccurred('success');
                break;
            case 'warning':
                haptic.notificationOccurred('warning');
                break;
            case 'error':
                haptic.notificationOccurred('error');
                break;
            case 'selection':
                haptic.selectionChanged();
                break;
            default:
                haptic.impactOccurred('light');
        }
    }

    /**
     * Показать Popup диалог
     */
    showPopup(params, callback) {
        if (!this.tg) {
            // Fallback для браузера
            const result = confirm(params.message);
            if (callback) callback(result ? 'confirm' : 'cancel');
            return;
        }

        this.tg.showPopup(params, callback);
    }

    /**
     * Показать Confirm диалог
     */
    showConfirm(message, callback) {
        if (!this.tg) {
            // Fallback для браузера
            const result = confirm(message);
            if (callback) callback(result);
            return;
        }

        this.tg.showConfirm(message, callback);
    }

    /**
     * Показать Alert уведомление
     */
    showAlert(message, callback) {
        if (!this.tg) {
            // Fallback для браузера
            alert(message);
            if (callback) callback();
            return;
        }

        this.tg.showAlert(message, callback);
    }

    /**
     * Открыть внешнюю ссылку
     */
    openLink(url) {
        if (!this.tg) {
            window.open(url, '_blank');
            return;
        }

        this.tg.openLink(url);
    }

    /**
     * Открыть Telegram ссылку
     */
    openTelegramLink(url) {
        if (!this.tg) {
            window.open(url, '_blank');
            return;
        }

        this.tg.openTelegramLink(url);
    }

    /**
     * Switch inline query
     */
    switchInlineQuery(query, chooseChatTypes) {
        if (!this.tg) return;
        this.tg.switchInlineQuery(query, chooseChatTypes);
    }

    /**
     * Получить данные пользователя
     */
    getUserData() {
        if (!this.initDataUnsafe) return null;
        
        return {
            id: this.initDataUnsafe.user?.id,
            firstName: this.initDataUnsafe.user?.first_name,
            lastName: this.initDataUnsafe.user?.last_name,
            username: this.initDataUnsafe.user?.username,
            languageCode: this.initDataUnsafe.user?.language_code,
            isPremium: this.initDataUnsafe.user?.is_premium,
        };
    }

    /**
     * Проверка валидности initData (должна быть на бэкенде!)
     */
    getInitData() {
        return this.initData;
    }

    /**
     * Callbacks для изменения темы
     */
    onThemeChange(callback) {
        this.onThemeChangeCallbacks.push(callback);
    }

    triggerThemeChangeCallbacks() {
        this.onThemeChangeCallbacks.forEach(cb => cb(this.themeParams));
    }

    /**
     * Callbacks для изменения viewport
     */
    onViewportChange(callback) {
        this.onViewportChangeCallbacks.push(callback);
    }

    triggerViewportChangeCallbacks() {
        this.onViewportChangeCallbacks.forEach(cb => cb({
            height: this.viewportHeight,
            isExpanded: this.isExpanded
        }));
    }

    /**
     * Готовность приложения
     */
    ready() {
        return this.isReady;
    }

    /**
     * Получить Telegram объект
     */
    getTelegram() {
        return this.tg;
    }

    /**
     * Получить themeParams
     */
    getThemeParams() {
        return this.themeParams;
    }

    /**
     * Получить цвет схемы (light/dark)
     */
    getColorScheme() {
        return this.tg?.colorScheme || 
               (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    /**
     * Проверка тёмной темы
     */
    isDarkTheme() {
        return this.getColorScheme() === 'dark';
    }
}

// ========================================
// ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР
// ========================================

window.TelegramMiniApp = new TelegramMiniAppIntegration();

// ========================================
// УТИЛИТЫ
// ========================================

/**
 * Инициализация приложения
 */
async function initTelegramApp() {
    const isTelegram = await window.TelegramMiniApp.init();
    console.log('Telegram App initialized:', isTelegram);
    return isTelegram;
}

/**
 * Тактильный отклик для кнопок
 */
function buttonHapticFeedback(element, type = 'light') {
    if (!element) return;
    
    element.addEventListener('click', () => {
        window.TelegramMiniApp.hapticFeedback(type);
    });
}

/**
 * Применить тактильный отклик ко всем кнопкам
 */
function applyHapticFeedbackToButtons(selector = 'button, .touch-target') {
    document.querySelectorAll(selector).forEach(el => {
        buttonHapticFeedback(el, 'light');
    });
}

// ========================================
// АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initTelegramApp().then(() => {
        console.log('Telegram Mini App ready');
        
        // Применяем тактильный отклик ко всем кнопкам
        applyHapticFeedbackToButtons();
    });
});

// ========================================
// ЭКСПОРТ ДЛЯ МОДУЛЕЙ
// ========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TelegramMiniAppIntegration,
        initTelegramApp,
        buttonHapticFeedback,
        applyHapticFeedbackToButtons
    };
}
