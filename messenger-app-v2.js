// MESSENGER APP v2 - Исправленная версия с обработкой ошибок
// Версия: 2.0 (Security & Error Handling)
// Дата: 17 февраля 2026

'use strict';

// ==================== МОДУЛЬ ЛОГИРОВАНИЯ ====================
// Используем глобальный Logger из window (создан в yandex-disk-integration-v2.js)
// Не объявляем переменную, чтобы избежать конфликта
var Logger = (function() {
    if (window.Logger) return window.Logger;
    if (window.YandexLogger) return window.YandexLogger;
    return {
        prefix: '[Messenger]',
        info: function(msg, data) {
            console.log(`${this.prefix} [INFO] ${msg}`, data || '');
        },
        error: function(msg, error) {
            console.error(`${this.prefix} [ERROR] ${msg}`, error || '');
        },
        warn: function(msg, data) {
            console.warn(`${this.prefix} [WARN] ${msg}`, data || '');
        },
        debug: function(msg, data) {
            if (window.DEBUG) {
                console.debug(`${this.prefix} [DEBUG] ${msg}`, data || '');
            }
        },
        success: function(msg) {
            console.log('%c' + this.prefix + ' [SUCCESS] ' + msg, 'color: #4caf50; font-weight: bold;');
        }
    };
})();

// ==================== МОДУЛЬ БЕЗОПАСНОСТИ ====================
const Security = {
    // Экранирование HTML для защиты от XSS
    escapeHtml: function(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    // Валидация объекта пайщика
    validateMember: function(member) {
        if (!member || typeof member !== 'object') return false;
        if (!member.id) return false;
        if (!member.name) return false;
        return true;
    },
    
    // Валидация массива
    validateArray: function(arr) {
        return Array.isArray(arr) && arr.length > 0;
    }
};

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
var currentMember = null;
var fabExpanded = false;

// ==================== ДАННЫЕ ====================
// Данные загружаются из Яндекс.Диска или app.js
let membersData = []; // Изначально пустой массив

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
try {
    Logger.info('Messenger App v2 запущен');

    // Проверяем готовность DOM
    if (document.readyState === 'loading') {
        Logger.info('Ожидание загрузки DOM...');
        document.addEventListener('DOMContentLoaded', initMessenger);
    } else {
        Logger.info('DOM готов, инициализация...');
        initMessenger();
    }
} catch (error) {
    Logger.error('Критическая ошибка при инициализации', error);
}

function initMessenger() {
    try {
        Logger.info('Инициализация messenger...');

        // Инициализация Яндекс Диска
        if (typeof initYandexDiskIntegration === 'function') {
            initYandexDiskIntegration();
        }

        // Инициализация тёмной темы
        initDarkMode();

        // Синхронизация с app.js (данные загружаются из Яндекс.Диска)
        syncDataFromApp();

        // Загрузка данных
        loadData();

        // Рендер чатов
        renderChats();

        // Настройка обработчиков
        setupEventListeners();

        // Обновление статистики
        updateStats();
        updateDashboard();

        Logger.info('Инициализация завершена успешно');
    } catch (error) {
        Logger.error('Ошибка инициализации', error);
    }
}

// ==================== СИНХРОНИЗАЦИЯ ДАННЫХ ====================
function syncDataFromApp() {
    try {
        Logger.info('Синхронизация данных из app.js...');

        if (window.members && Security.validateArray(window.members)) {
            membersData = window.members;
            Logger.info('Данные получены из app.js', { count: membersData.length });
        } else {
            Logger.warn('Данные в app.js отсутствуют. Ожидание загрузки из Яндекс.Диска...');
            membersData = [];
        }
    } catch (error) {
        Logger.error('Ошибка синхронизации', error);
    }
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
function loadData() {
    try {
        Logger.info('Загрузка данных...');

        // Проверяем window.members
        if (window.members && Security.validateArray(window.members)) {
            Logger.info('Использованы данные из window', { count: window.members.length });
        } else {
            // Данные не загружены
            window.members = [];
            Logger.warn('Данные не загружены. Список пайщиков пуст.');
        }

        updateStats();
    } catch (error) {
        Logger.error('Ошибка загрузки данных', error);
        window.members = [];
    }
}

function saveData() {
    try {
        localStorage.setItem('coop_members', JSON.stringify(window.members));
        Logger.info('Данные сохранены в localStorage');
        
        // Если Яндекс Диск подключён, сохраняем туда
        if (typeof saveAllDataToYandex === 'function') {
            saveAllDataToYandex();
        }
        
        updateStats();
    } catch (error) {
        Logger.error('Ошибка сохранения данных', error);
    }
}

// ==================== ЧАТЫ (ПАЙЩИКИ) ====================
function renderChats() {
    try {
        Logger.info('Рендер чатов...', { count: window.members?.length || 0 });

        const chatsList = document.getElementById('chatsList');
        if (!chatsList) {
            Logger.error('Элемент chatsList не найден');
            return;
        }

        if (!window.members || window.members.length === 0) {
            Logger.warn('Список пайщиков пуст');
            chatsList.innerHTML = '<div style="padding:20px;text-align:center;color:#999">Список пайщиков пуст. Добавьте первого пайщика через меню.</div>';
            return;
        }

        // Валидация данных
        const validMembers = window.members.filter(m => Security.validateMember(m));
        if (validMembers.length !== window.members.length) {
            Logger.warn('Найдены некорректные записи пайщиков', { 
                total: window.members.length, 
                valid: validMembers.length 
            });
        }
        
        // Рендер с экранированием
        chatsList.innerHTML = validMembers.map(m => {
            const balanceClass = m.balance >= 0 ? 'positive' : 'negative';
            const balanceText = m.balance >= 0 
                ? `${m.balance.toLocaleString()} ₽` 
                : `−${Math.abs(m.balance).toLocaleString()} ₽`;
            const icon = m.status === 'debt' ? '⚠' : m.status === 'pending' ? '📝' : '✓';
            
            return `<div class="chat-item" data-id="${Security.escapeHtml(String(m.id))}">
                <div class="avatar" style="background:${Security.escapeHtml(m.color)}">${Security.escapeHtml(m.avatar)}</div>
                <div class="chat-info">
                    <div class="chat-top">
                        <span class="chat-name">${Security.escapeHtml(m.name)}</span>
                        <span class="chat-time">${Security.escapeHtml(m.lastTime || '')}</span>
                    </div>
                    <div class="chat-middle">
                        <span class="status ${Security.escapeHtml(m.status || '')}">${Security.escapeHtml(m.statusText || '')}</span>
                        <span class="balance ${balanceClass}">${balanceText}</span>
                    </div>
                    <div class="last-message">
                        <span class="icon">${icon}</span> ${Security.escapeHtml(m.lastTransaction || '')}
                    </div>
                </div>
            </div>`;
        }).join('');
        
        // Навешиваем обработчики
        chatsList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', function() {
                try {
                    const memberId = parseInt(this.dataset.id);
                    const member = window.members.find(m => m.id === memberId);
                    if (member) {
                        selectMember(member);
                    }
                } catch (error) {
                    Logger.error('Ошибка клика по чату', error);
                }
            });
        });
        
        Logger.info('Чаты успешно отрендерены');
    } catch (error) {
        Logger.error('Ошибка рендера чатов', error);
    }
}

// ==================== ВЫБОР ПАЙЩИКА ====================
function selectMember(member) {
    try {
        if (!Security.validateMember(member)) {
            Logger.error('Некорректные данные пайщика', member);
            return;
        }
        
        Logger.info('Выбран пайщик', { id: member.id, name: member.name });
        
        currentMember = member;
        
        // Обновляем заголовок чата
        const currentName = document.getElementById('currentName');
        const currentAvatar = document.getElementById('currentAvatar');
        const currentStatus = document.getElementById('currentStatus');
        
        if (currentName) currentName.textContent = Security.escapeHtml(member.name);
        if (currentAvatar) {
            currentAvatar.textContent = Security.escapeHtml(member.avatar);
            currentAvatar.style.background = member.color;
        }
        if (currentStatus) currentStatus.textContent = '● ' + Security.escapeHtml(member.statusText || '');
        
        // Подсветка активного чата
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`.chat-item[data-id="${member.id}"]`);
        if (activeItem) activeItem.classList.add('active');
        
        // Рендер сообщений
        renderMessages(member.operations || []);
        
        // Скрываем панели
        hideAllPanels();
    } catch (error) {
        Logger.error('Ошибка выбора пайщика', error);
    }
}

// ==================== РЕНДЕР СООБЩЕНИЙ ====================
function renderMessages(operations) {
    try {
        const container = document.getElementById('messagesContainer');
        if (!container) {
            Logger.error('Элемент messagesContainer не найден');
            return;
        }
        
        if (!Security.validateArray(operations)) {
            container.innerHTML = '<div style="text-align:center;color:#999;padding:20px">Нет операций</div>';
            return;
        }
        
        container.innerHTML = operations.map(op => {
            const statusIcon = op.status === 'paid' ? '✓' : op.status === 'overdue' ? '⚠' : '⏳';
            return `<div class="message received" onclick="showOperationDetails(${op.id || 0})">
                <div class="message-type">${Security.escapeHtml(op.type || '')}</div>
                <div class="message-content">${Security.escapeHtml(op.description || '')}</div>
                ${op.amount ? `<div class="message-amount">${op.amount.toLocaleString()} ₽</div>` : ''}
                <div class="message-time">${Security.escapeHtml(op.date || '')} ${statusIcon}</div>
            </div>`;
        }).join('');
        
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        Logger.error('Ошибка рендера сообщений', error);
    }
}

// ==================== СКРЫТИЕ ПАНЕЛЕЙ ====================
function hideAllPanels() {
    try {
        const panels = ['sidebarRight', 'operationDetailsPanel', 'menuContentPanel', 'largeReportPanel'];
        panels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) panel.classList.remove('visible');
        });
    } catch (error) {
        Logger.error('Ошибка скрытия панелей', error);
    }
}

// ==================== СТАТИСТИКА ====================
function updateStats() {
    try {
        const total = window.members?.length || 0;
        const active = window.members?.filter(m => m.status === 'active').length || 0;
        
        const membersCount = document.getElementById('membersCount');
        const cooperativeStats = document.getElementById('cooperativeStats');
        
        if (membersCount) membersCount.textContent = total;
        if (cooperativeStats) cooperativeStats.textContent = `${total} пайщиков • ${active} активных`;
        
        Logger.debug('Статистика обновлена', { total, active });
    } catch (error) {
        Logger.error('Ошибка обновления статистики', error);
    }
}

function updateDashboard() {
    try {
        // Обновление дашборда если существует
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            Logger.debug('Дашборд обновлён');
        }
    } catch (error) {
        Logger.error('Ошибка обновления дашборда', error);
    }
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
function setupEventListeners() {
    try {
        Logger.info('Настройка обработчиков событий...');
        
        // Бургер меню
        const burgerBtn = document.getElementById('burgerBtn');
        if (burgerBtn) {
            burgerBtn.addEventListener('click', function() {
                Logger.info('Открытие левого меню');
                const sidebarMenu = document.getElementById('sidebarMenu');
                if (sidebarMenu) sidebarMenu.classList.add('visible');
            });
        } else {
            Logger.warn('burgerBtn не найден');
        }
        
        // Закрытие левого меню
        const menuCloseBtn = document.getElementById('menuCloseBtn');
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', function() {
                Logger.info('Закрытие левого меню');
                const sidebarMenu = document.getElementById('sidebarMenu');
                if (sidebarMenu) sidebarMenu.classList.remove('visible');
            });
        }
        
        // Клик по пунктам меню
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                try {
                    const panel = this.dataset.panel;
                    const submenu = this.dataset.submenu;
                    const action = this.dataset.action;
                    
                    Logger.debug('Клик по меню', { panel, submenu, action });
                    
                    if (submenu) {
                        // Раскрытие подменю
                        const expandedDiv = document.querySelector(`.reports-expanded[data-parent="${submenu}"]`);
                        if (expandedDiv) {
                            document.querySelectorAll('.reports-expanded').forEach(div => {
                                if (div !== expandedDiv) div.style.display = 'none';
                            });
                            expandedDiv.style.display = expandedDiv.style.display === 'none' ? 'block' : 'none';
                        }
                        return;
                    }
                    
                    if (panel) openMenuPanel(panel);
                    else if (action) handleMenuAction(action);
                } catch (error) {
                    Logger.error('Ошибка обработки клика меню', error);
                }
            });
        });
        
        // Назад из подменю
        const submenuBackBtn = document.getElementById('submenuBackBtn');
        if (submenuBackBtn) {
            submenuBackBtn.addEventListener('click', function() {
                Logger.info('Возврат из подменю');
                const reportsSubmenu = document.getElementById('reportsSubmenu');
                if (reportsSubmenu) reportsSubmenu.classList.remove('visible');
            });
        }
        
        // Отправка сообщения
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        
        if (sendButton && messageInput) {
            sendButton.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') sendMessage();
            });
        }
        
        // Закрытие панелей
        ['closeDetailsBtn', 'closeInfoBtn', 'closePanelBtn', 'closeLargeReportBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', function() {
                    const panelMap = {
                        'closeDetailsBtn': 'operationDetailsPanel',
                        'closeInfoBtn': 'sidebarRight',
                        'closePanelBtn': 'menuContentPanel',
                        'closeLargeReportBtn': 'largeReportPanel'
                    };
                    const panelId = panelMap[id];
                    if (panelId) {
                        document.getElementById(panelId)?.classList.remove('visible');
                        showFab();
                    }
                });
            }
        });
        
        // Информация о пайщике
        const menuMoreBtn = document.getElementById('menuMoreBtn');
        if (menuMoreBtn) {
            menuMoreBtn.addEventListener('click', showMemberInfo);
        }
        
        // FAB кнопка
        const fabMain = document.getElementById('fabMain');
        if (fabMain) {
            fabMain.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleFab();
            });
        }
        
        // FAB элементы
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', function() {
                const action = this.dataset.action;
                Logger.info('FAB действие', { action });
                createNew(action);
            });
        });
        
        // Поиск с дебаунсом
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', function(e) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const term = e.target.value.toLowerCase();
                    Logger.debug('Поиск', { term });
                    document.querySelectorAll('.chat-item').forEach(item => {
                        const name = item.querySelector('.chat-name');
                        if (name) {
                            const nameText = name.textContent.toLowerCase();
                            item.style.display = nameText.includes(term) ? 'flex' : 'none';
                        }
                    });
                }, 300);
            });
        }
        
        // Фильтры
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', function() {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Клик вне FAB
        document.addEventListener('click', function(e) {
            if (fabExpanded && !e.target.closest('.fab-container')) {
                toggleFab();
            }
        });
        
        // Поиск по меню
        const menuSearch = document.getElementById('menuSearch');
        if (menuSearch) {
            menuSearch.addEventListener('input', function(e) {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.menu-item').forEach(item => {
                    const name = item.querySelector('.menu-item-name');
                    const subtitle = item.querySelector('.menu-item-subtitle');
                    const text = (name?.textContent + ' ' + (subtitle?.textContent || '')).toLowerCase();
                    item.style.display = text.includes(term) ? 'flex' : 'none';
                });
            });
        }

        // Обработчики для отчетов
        document.querySelectorAll('[data-report]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const reportId = this.dataset.report;
                Logger.info('Отчет', { reportId });
                if (typeof window.openReportById === 'function') {
                    window.openReportById(reportId);
                } else {
                    Logger.warn('Функция openReportById не найдена');
                }
            });
        });
        
        // Массовые операции
        const massSelectBtn = document.getElementById('massSelectBtn');
        if (massSelectBtn) {
            massSelectBtn.addEventListener('click', toggleMassSelection);
        }
        
        // Инициализация тултипов и горячих клавиш
        initTooltips();
        initHotkeys();
        
        Logger.info('Обработчики настроены');
    } catch (error) {
        Logger.error('Ошибка настройки обработчиков', error);
    }
}

// ==================== ОТПРАВКА СООБЩЕНИЙ ====================
function sendMessage() {
    try {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput || !currentMember) return;
        
        const text = messageInput.value.trim();
        if (!text) return;
        
        Logger.info('Отправка сообщения', { text });
        
        currentMember.operations.push({
            id: Date.now(),
            type: 'Сообщение',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            description: text,
            status: 'paid'
        });
        
        renderMessages(currentMember.operations);
        messageInput.value = '';
        saveData();
    } catch (error) {
        Logger.error('Ошибка отправки сообщения', error);
    }
}

// ==================== FAB КНОПКА ====================
function toggleFab() {
    try {
        fabExpanded = !fabExpanded;
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');
        
        if (fabMain && fabMenu) {
            if (fabExpanded) {
                fabMain.classList.add('close');
                fabMenu.classList.add('expanded');
            } else {
                fabMain.classList.remove('close');
                fabMenu.classList.remove('expanded');
            }
        }
    } catch (error) {
        Logger.error('Ошибка FAB', error);
    }
}

function showFab() {
    try {
        const fabContainer = document.getElementById('fabContainer');
        if (fabContainer) fabContainer.classList.remove('hidden');
    } catch (error) {
        Logger.error('Ошибка showFab', error);
    }
}

function hideFab() {
    try {
        const fabContainer = document.getElementById('fabContainer');
        if (fabContainer) fabContainer.classList.add('hidden');
        fabExpanded = false;
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');
        if (fabMain) fabMain.classList.remove('close');
        if (fabMenu) fabMenu.classList.remove('expanded');
    } catch (error) {
        Logger.error('Ошибка hideFab', error);
    }
}

// ==================== МЕНЮ ДЕЙСТВИЯ ====================
// STEP 1: Реализация функции открытия панелей меню с правильным контентом
function openMenuPanel(panelType) {
    try {
        Logger.info('Открытие панели', { panelType });

        // STEP 1.1: Генерация контента для каждой панели
        const panels = generateMenuPanels();
        
        const panel = panels[panelType];
        if (!panel) {
            Logger.warn('Панель не найдена', { panelType });
            return;
        }

        // STEP 1.2: Находим DOM элементы
        const menuPanelTitle = document.getElementById('menuPanelTitle');
        const menuPanelContent = document.getElementById('menuPanelContent');
        const menuContentPanel = document.getElementById('menuContentPanel');
        const sidebarMenu = document.getElementById('sidebarMenu');

        // STEP 1.3: Обновляем контент
        if (menuPanelTitle) menuPanelTitle.textContent = panel.title;
        if (menuPanelContent) {
            menuPanelContent.innerHTML = typeof panel.content === 'function' 
                ? panel.content() 
                : panel.content;
        }
        if (menuContentPanel) menuContentPanel.classList.add('visible');

        // STEP 1.4: Закрываем левое меню
        if (sidebarMenu) sidebarMenu.classList.remove('visible');

        hideFab();
        Logger.info('Панель открыта', { panelType });
    } catch (error) {
        Logger.error('Ошибка открытия панели', error);
    }
}

// STEP 2: Генерация контента для всех панелей меню
function generateMenuPanels() {
    return {
        // STEP 2.1: Избранное
        'favorites': {
            title: '⭐ Избранное',
            content: function() {
                const overdueCount = window.members?.filter(m => m.status === 'debt').length || 0;
                const pendingApps = window.applications?.filter(a => a.status === 'pending').length || 0;
                
                return `
                    <div style="padding:20px">
                        <div style="padding:15px;background:#ffebee;border-radius:8px;margin-bottom:15px;cursor:pointer" onclick="alert('Переход к должникам')">
                            <div style="font-size:16px;font-weight:600;margin-bottom:5px">⚠️ Просроченные взносы</div>
                            <div style="font-size:13px;color:#666">${overdueCount} пайщика имеют задолженность</div>
                        </div>
                        <div style="padding:15px;background:#fff3e0;border-radius:8px;margin-bottom:15px;cursor:pointer" onclick="alert('Переход к заявлениям')">
                            <div style="font-size:16px;font-weight:600;margin-bottom:5px">📝 Заявления на рассмотрении</div>
                            <div style="font-size:13px;color:#666">${pendingApps} заявлений ожидают обработки</div>
                        </div>
                        <div style="padding:15px;background:#e8f5e9;border-radius:8px;cursor:pointer" onclick="alert('Переход к заседаниям')">
                            <div style="font-size:16px;font-weight:600;margin-bottom:5px">🤝 Ближайшее заседание</div>
                            <div style="font-size:13px;color:#666">Завтра в 10:00 • Большой зал</div>
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 2.2: Календарь событий
        'calendar': {
            title: '📅 Календарь событий',
            content: `
                <div style="padding:20px">
                    <div style="padding:15px;background:#e3f2fd;border-radius:8px;margin-bottom:15px">
                        <div style="font-size:16px;font-weight:600;margin-bottom:10px">📅 Февраль 2026</div>
                        <div style="font-size:14px;margin-bottom:8px;padding:8px;background:#fff;border-radius:4px">
                            <strong>17 февраля:</strong> Общее собрание (10:00)
                        </div>
                        <div style="font-size:14px;margin-bottom:8px;padding:8px;background:#fff;border-radius:4px">
                            <strong>28 февраля:</strong> Срок сдачи УСН
                        </div>
                        <div style="font-size:14px;padding:8px;background:#fff;border-radius:4px">
                            <strong>1 марта:</strong> Платёж по кредиту
                        </div>
                    </div>
                    <button style="width:100%;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px" onclick="alert('Открыть полный календарь')">
                        📅 Открыть полный календарь
                    </button>
                </div>
            `
        },
        
        // STEP 2.3: Реестр членов кооператива
        'members-registry': {
            title: '📋 Реестр членов кооператива',
            content: function() {
                const members = window.members || [];
                const activeCount = members.filter(m => m.status === 'active').length;
                
                return `
                    <div style="padding:20px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
                            <div style="font-size:14px;color:#666">
                                <strong>${members.length}</strong> пайщиков в реестре
                            </div>
                            <div style="font-size:12px;color:#4caf50">
                                ● ${activeCount} активных
                            </div>
                        </div>
                        <div style="max-height:400px;overflow-y:auto">
                            ${members.map(m => `
                                <div style="padding:12px;background:#f5f7fa;border-radius:6px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="selectMemberById(${m.id})">
                                    <div style="display:flex;align-items:center;gap:10px">
                                        <div style="width:40px;height:40px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px">${m.avatar}</div>
                                        <div>
                                            <div style="font-weight:600;font-size:14px">${Security.escapeHtml(m.name)}</div>
                                            <div style="font-size:12px;color:#666">${Security.escapeHtml(m.statusText || '')}</div>
                                        </div>
                                    </div>
                                    <div style="text-align:right">
                                        <div style="font-size:12px;color:${m.balance >= 0 ? '#4caf50' : '#f44336'};font-weight:600">
                                            ${m.balance >= 0 ? '+' : ''}${m.balance.toLocaleString()} ₽
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 2.4: Удостоверения
        'certificates': {
            title: '📜 Реестр выданных удостоверений',
            content: `
                <div style="padding:20px">
                    <div style="margin-bottom:15px">
                        <strong>9 действующих</strong> удостоверений
                    </div>
                    <div style="padding:15px;background:#f5f7fa;border-radius:8px;margin-bottom:10px;cursor:pointer" onclick="alert('Открыть удостоверение №001')">
                        <div style="font-weight:600">Удостоверение №001</div>
                        <div style="font-size:12px;color:#666;margin-top:5px">Выдано: Иванов И.И. | 15.01.2023</div>
                    </div>
                    <div style="padding:15px;background:#f5f7fa;border-radius:8px;margin-bottom:10px;cursor:pointer" onclick="alert('Открыть удостоверение №002')">
                        <div style="font-weight:600">Удостоверение №002</div>
                        <div style="font-size:12px;color:#666;margin-top:5px">Выдано: Петрова М.С. | 20.02.2023</div>
                    </div>
                    <button style="width:100%;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:15px" onclick="alert('Выдать новое удостоверение')">
                        📜 Выдать удостоверение
                    </button>
                </div>
            `
        },
        
        // STEP 2.5: Профиль
        'profile': {
            title: '👤 Профиль пользователя',
            content: `
                <div style="padding:20px;text-align:center">
                    <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#0088cc,#0066aa);color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin:0 auto 15px">А</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:5px">Администратор</div>
                    <div style="font-size:13px;color:#666;margin-bottom:20px">admin@coop.ru</div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        <button style="padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer" onclick="alert('Настройки профиля')">⚙️ Настройки</button>
                        <button style="padding:12px;background:#ffebee;color:#c62828;border:none;border-radius:6px;cursor:pointer" onclick="alert('Выход')">🚪 Выйти</button>
                    </div>
                </div>
            `
        },
        
        // STEP 2.6: Резервное копирование
        'backup': {
            title: '💾 Резервное копирование',
            content: `
                <div style="padding:20px">
                    <div style="padding:20px;background:#e3f2fd;border-radius:8px;margin-bottom:20px">
                        <div style="font-size:16px;font-weight:600;margin-bottom:10px">Последняя резервная копия</div>
                        <div style="font-size:14px;margin-bottom:5px"><strong>Дата:</strong> 16 февраля 2026, 03:00</div>
                        <div style="font-size:14px"><strong>Размер:</strong> 24.5 МБ</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        <button style="padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Создание резервной копии...')">💾 Создать резервную копию</button>
                        <button style="padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer" onclick="alert('Восстановление из копии...')">↩️ Восстановить</button>
                    </div>
                </div>
            `
        }
    };
}

// STEP 3: Вспомогательная функция выбора пайщика из реестра
function selectMemberById(memberId) {
    try {
        const member = window.members?.find(m => m.id === memberId);
        if (member) {
            selectMember(member);
        }
    } catch (error) {
        Logger.error('Ошибка выбора пайщика по ID', error);
    }
}

// Делаем функцию доступной глобально для onclick из HTML
window.handleMenuAction = function handleMenuAction(action) {
    try {
        Logger.info('Действие меню', { action });

        // STEP 8: Обработка действий меню с открытием отчетов
        const reportActions = {
            'pko': 'pko',
            'rko': 'rko',
            'certificate': 'accounting-certificate',
            'kudir': 'kudir',
            'usn': 'usn-declaration',
            'zero': 'zero-reporting'
        };

        const reportId = reportActions[action];
        if (reportId) {
            openReportById(reportId);
            return;
        }

        // Обработка создания собрания
        if (action === 'create-meeting') {
            createMeeting();
            return;
        }
        
        // Обработка редактирования пайщика
        if (action === 'edit-member') {
            showEditMemberDialog();
            return;
        }

        // Обработка добавления пайщика
        if (action === 'create-member') {
            createMember();
            return;
        }

        // Обработка добавления взноса
        if (action === 'create-payment') {
            createPayment();
            return;
        }

        // Обработка возврата взноса
        if (action === 'create-return-payment') {
            createReturnPayment();
            return;
        }

        // Обработка добавления проводки
        if (action === 'create-transaction') {
            createTransaction();
            return;
        }

        // Обработка платёжного поручения
        if (action === 'payment-order') {
            createPaymentOrder();
            return;
        }

        // Обработка акта сверки
        if (action === 'act-sverka') {
            createActSverka();
            return;
        }

        // Обработка добавления мероприятия
        if (action === 'add-calendar-event') {
            addCalendarEvent();
            return;
        }
        
        // Обработка счёта на оплату
        if (action === 'invoice') {
            createInvoice();
            return;
        }
        
        // Обработка нулевой отчётности
        if (action === 'zero' || action === 'zero-reporting') {
            showZeroReportingMenu();
            return;
        }
        
        // Обработка форм нулевой отчётности
        if (action === 'generate-usn-zero') {
            generateUSNZero();
            return;
        }
        if (action === 'generate-balance-zero') {
            generateBalanceZero();
            return;
        }
        if (action === 'generate-szv-zero') {
            generateSZVZero();
            return;
        }
        if (action === 'generate-rsv-zero') {
            generateRSVZero();
            return;
        }
        if (action === 'generate-sredn-zero') {
            generateSrednZero();
            return;
        }

        const actions = {
            'pko': 'ПКО (Приходный кассовый ордер)',
            'rko': 'РКО (Расходный кассовый ордер)',
            'certificate': 'Бухгалтерская справка',
            'kudir': 'КУДиР',
            'usn': 'Декларация УСН',
            'zero': 'Нулевая отчётность'
        };

        alert(actions[action] || 'В разработке');
    } catch (error) {
        Logger.error('Ошибка действия меню', error);
    }
}

// STEP 10.15: Диалог выбора пайщика для редактирования
function showEditMemberDialog() {
    const members = window.members || [];
    
    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">✏️ Редактирование пайщика</h3>
            <div style="margin-bottom:15px">
                <label style="display:block;margin-bottom:5px;font-weight:600">Выберите пайщика</label>
                <select id="edit-member-select" onchange="editMemberFromSelect(this.value)" 
                        style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                    <option value="">-- Выберите пайщика --</option>
                    ${members.map(m => `
                        <option value="${m.id}">${Security.escapeHtml(m.name)} (${Security.escapeHtml(m.statusText || '')})</option>
                    `).join('')}
                </select>
            </div>
            <div style="display:flex;gap:10px">
                <button type="button" onclick="closeSideMenu()" 
                        style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Редактирование пайщика', content);
}

function editMemberFromSelect(memberId) {
    if (memberId) {
        editMember(parseInt(memberId));
    }
}

// STEP 4: Реализация функции открытия отчетов по ID
function openReportById(reportId) {
    try {
        Logger.info('Открытие отчета', { reportId });
        
        // STEP 4.1: Получаем данные отчета
        const report = getReportData(reportId);
        
        if (!report) {
            Logger.warn('Отчет не найден', { reportId });
            alert('Отчет в разработке: ' + reportId);
            return;
        }
        
        // STEP 4.2: Открываем большую панель отчета
        showLargeReport(report.title, report.content);
        
        Logger.info('Отчет открыт', { reportId, title: report.title });
    } catch (error) {
        Logger.error('Ошибка открытия отчета', error);
    }
}

// STEP 5: Генерация данных для отчетов
function getReportData(reportId) {
    const reports = {
        // STEP 5.1: Бухгалтерские отчеты
        'balance': {
            title: 'Бухгалтерский баланс (Форма №1)',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">БУХГАЛТЕРСКИЙ БАЛАНС</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">Форма №1 (ОКУД 0710001)</p>
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Организация:</strong> Потребительский кооператив</p>
                        <p><strong>Дата составления:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                        <p><strong>Единица измерения:</strong> руб.</p>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr style="background:#f5f7fa">
                                <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">АКТИВ</th>
                                <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">На начало года</th>
                                <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">На конец периода</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">I. ВНЕОБОРОТНЫЕ АКТИВЫ</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">II. ОБОРОТНЫЕ АКТИВЫ</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                            <tr style="background:#e3f2fd;font-weight:600"><td style="padding:12px;border:1px solid #e0e0e0">БАЛАНС</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                        </tbody>
                    </table>
                    <div style="margin-top:20px">
                        <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Экспорт в PDF')">📄 Экспорт в PDF</button>
                    </div>
                </div>
            `
        },
        'profit-loss': {
            title: 'Отчёт о финансовых результатах (Форма №2)',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">ОТЧЁТ О ФИНАНСОВЫХ РЕЗУЛЬТАТАХ</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">Форма №2 (ОКУД 0710002)</p>
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Организация:</strong> Потребительский кооператив</p>
                        <p><strong>Отчётный период:</strong> 2026 год</p>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr style="background:#f5f7fa">
                                <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">Показатель</th>
                                <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">За отчётный период</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Выручка</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Себестоимость продаж</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                            <tr style="background:#e3f2fd;font-weight:600"><td style="padding:12px;border:1px solid #e0e0e0">Прибыль (убыток) от продаж</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                        </tbody>
                    </table>
                </div>
            `
        },
        'osv': {
            title: 'Оборотно-сальдовая ведомость',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">📊 Оборотно-сальдовая ведомость</h2>
                    <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:8px;overflow:hidden">
                        <thead>
                            <tr style="background:#f5f7fa">
                                <th style="padding:12px;text-align:left">Счет</th>
                                <th style="padding:12px;text-align:left">Наименование</th>
                                <th style="padding:12px;text-align:right">Вх. Дт</th>
                                <th style="padding:12px;text-align:right">Вх. Кт</th>
                                <th style="padding:12px;text-align:right">Оборот Дт</th>
                                <th style="padding:12px;text-align:right">Оборот Кт</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding:12px">50</td><td style="padding:12px">Касса</td><td style="padding:12px;text-align:right">15 000</td><td style="padding:12px;text-align:right">5 000</td><td style="padding:12px;text-align:right">120 000</td><td style="padding:12px;text-align:right">115 000</td></tr>
                            <tr style="background:#f9fafb"><td style="padding:12px">51</td><td style="padding:12px">Расчетные счета</td><td style="padding:12px;text-align:right">250 000</td><td style="padding:12px;text-align:right">180 000</td><td style="padding:12px;text-align:right">1 250 000</td><td style="padding:12px;text-align:right">1 180 000</td></tr>
                            <tr><td style="padding:12px">86-1</td><td style="padding:12px">Паевой фонд</td><td style="padding:12px;text-align:right">500 000</td><td style="padding:12px;text-align:right">450 000</td><td style="padding:12px;text-align:right">50 000</td><td style="padding:12px;text-align:right">45 000</td></tr>
                            <tr style="background:#e3f2fd;font-weight:600"><td colspan="2" style="padding:12px">ИТОГО</td><td style="padding:12px;text-align:right">890 000</td><td style="padding:12px;text-align:right">750 000</td><td style="padding:12px;text-align:right">1 440 000</td><td style="padding:12px;text-align:right">1 357 000</td></tr>
                        </tbody>
                    </table>
                </div>
            `
        },
        'target-use': {
            title: 'Отчёт о целевом использовании средств',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">ОТЧЁТ О ЦЕЛЕВОМ ИСПОЛЬЗОВАНИИ</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">Форма №3</p>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px">
                        <p><strong>Организация:</strong> Потребительский кооператив</p>
                        <p><strong>Отчётный период:</strong> 2026 год</p>
                    </div>
                </div>
            `
        },
        
        // STEP 5.2: Управленческие отчеты
        'members-report': {
            title: 'Отчёт по пайщикам',
            content: function() {
                const members = window.members || [];
                const activeCount = members.filter(m => m.status === 'active').length;
                const debtCount = members.filter(m => m.status === 'debt').length;
                const pendingCount = members.filter(m => m.status === 'pending').length;
                
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">📋 Отчёт по пайщикам</h2>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px">
                            <div style="padding:20px;background:#e8f5e9;border-radius:8px;text-align:center">
                                <div style="font-size:32px;font-weight:bold;color:#2e7d32">${members.length}</div>
                                <div style="color:#666;margin-top:5px">Всего пайщиков</div>
                            </div>
                            <div style="padding:20px;background:#e3f2fd;border-radius:8px;text-align:center">
                                <div style="font-size:32px;font-weight:bold;color:#1976d2">${activeCount}</div>
                                <div style="color:#666;margin-top:5px">Активных</div>
                            </div>
                            <div style="padding:20px;background:#fff3e0;border-radius:8px;text-align:center">
                                <div style="font-size:32px;font-weight:bold;color:#f57c00">${pendingCount}</div>
                                <div style="color:#666;margin-top:5px">На рассмотрении</div>
                            </div>
                        </div>
                        <h3>Реестр пайщиков</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:13px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;text-align:left">ФИО</th>
                                    <th style="padding:12px">Статус</th>
                                    <th style="padding:12px;text-align:right">Баланс</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${members.map(m => `
                                    <tr>
                                        <td style="padding:12px">${Security.escapeHtml(m.name)}</td>
                                        <td style="padding:12px">${Security.escapeHtml(m.statusText || '')}</td>
                                        <td style="padding:12px;text-align:right;color:${m.balance >= 0 ? '#4caf50' : '#f44336'}">${m.balance >= 0 ? '+' : ''}${m.balance.toLocaleString()} ₽</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },
        'payments-report': {
            title: 'Отчёт по паевым взносам',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">💳 Отчёт по паевым взносам</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px">
                        <p>Отчёт в разработке</p>
                    </div>
                </div>
            `
        },
        'financial-report': {
            title: 'Финансовый отчёт',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">📈 Финансовый отчёт</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px">
                        <p>Отчёт в разработке</p>
                    </div>
                </div>
            `
        },
        'debt-report': {
            title: 'Отчёт о задолженностях',
            content: function() {
                const debtMembers = window.members?.filter(m => m.status === 'debt') || [];
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">⚠️ Отчёт о задолженностях</h2>
                        <div style="padding:15px;background:#ffebee;border-radius:8px;margin-bottom:20px">
                            <div style="font-size:16px;font-weight:600">🔴 Всего должников: ${debtMembers.length}</div>
                        </div>
                        ${debtMembers.length > 0 ? `
                            <table style="width:100%;border-collapse:collapse;font-size:13px">
                                <thead>
                                    <tr style="background:#f5f7fa">
                                        <th style="padding:12px;text-align:left">ФИО</th>
                                        <th style="padding:12px">Баланс</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${debtMembers.map(m => `
                                        <tr>
                                            <td style="padding:12px">${Security.escapeHtml(m.name)}</td>
                                            <td style="padding:12px;color:#f44336">${m.balance.toLocaleString()} ₽</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color:#666;text-align:center;padding:40px">Задолженности отсутствуют</p>'}
                    </div>
                `;
            }
        },
        
        // STEP 5.3: Отчёты по собраниям
        'meeting-protocol': {
            title: 'Протокол общего собрания',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">📝 Протокол общего собрания</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px">
                        <p>Форма протокола в разработке</p>
                    </div>
                </div>
            `
        },
        'attendance-list': {
            title: 'Лист регистрации участников',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">✍️ Лист регистрации</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px">
                        <p>Форма листа регистрации в разработке</p>
                    </div>
                </div>
            `
        },
        
        // STEP 5.4: Календарь и контроль
        'calendar': {
            title: 'Календарь событий',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">📅 Календарь событий</h2>
                    <div style="padding:15px;background:#e3f2fd;border-radius:8px;margin-bottom:15px">
                        <div style="font-size:16px;font-weight:600;margin-bottom:10px">📅 Февраль 2026</div>
                        <div style="font-size:14px;margin-bottom:8px;padding:8px;background:#fff;border-radius:4px"><strong>17 февраля:</strong> Общее собрание (10:00)</div>
                        <div style="font-size:14px;margin-bottom:8px;padding:8px;background:#fff;border-radius:4px"><strong>28 февраля:</strong> Срок сдачи УСН</div>
                        <div style="font-size:14px;padding:8px;background:#fff;border-radius:4px"><strong>1 марта:</strong> Платёж по кредиту</div>
                    </div>
                </div>
            `
        },
        
        // STEP 7.15: Движение фондов
        'funds-movement': {
            title: 'Ведомость движения фондов',
            content: function() {
                const funds = [
                    { name: 'Паевой фонд', incoming: 500000, received: 50000, spent: 45000, outgoing: 505000 },
                    { name: '������������еделимый фонд', incoming: 100000, received: 10000, spent: 0, outgoing: 110000 },
                    { name: 'Резервный фонд', incoming: 50000, received: 5000, spent: 10000, outgoing: 45000 },
                    { name: 'Фонд развития', incoming: 80000, received: 8000, spent: 15000, outgoing: 73000 },
                    { name: 'Фонд хоз. деятельности', incoming: 30000, received: 3000, spent: 5000, outgoing: 28000 }
                ];
                
                return `
                    <div style="padding:30px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                            <h2>📊 Ведомость движения фондов</h2>
                            <div style="display:flex;gap:10px">
                                <button onclick="switchReportView('table')" style="padding:8px 16px;background:#0088cc;color:#fff;border:none;border-radius:4px;cursor:pointer">📊 Таблица</button>
                                <button onclick="switchReportView('chart')" style="padding:8px 16px;background:#f5f7fa;border:none;border-radius:4px;cursor:pointer">📈 График</button>
                                <button onclick="printReport()" style="padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">🖨️ Печать</button>
                                <button onclick="downloadReport()" style="padding:8px 16px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">💾 Скачать</button>
                            </div>
                        </div>
                        
                        <div id="report-table-view">
                            <table style="width:100%;border-collapse:collapse;font-size:13px">
                                <thead>
                                    <tr style="background:#f5f7fa">
                                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">Наименование фонда</th>
                                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Вход. остаток</th>
                                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Поступ������л��</th>
                                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Использовано</th>
                                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Исх. остаток</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${funds.map(f => `
                                        <tr>
                                            <td style="padding:12px;border:1px solid #e0e0e0">${f.name}</td>
                                            <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">${f.incoming.toLocaleString()}</td>
                                            <td style="padding:12px;border:1px solid #e0e0e0;text-align:right;color:#4caf50">+${f.received.toLocaleString()}</td>
                                            <td style="padding:12px;border:1px solid #e0e0e0;text-align:right;color:#f44336">-${f.spent.toLocaleString()}</td>
                                            <td style="padding:12px;border:1px solid #e0e0e0;text-align:right;font-weight:600">${f.outgoing.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                    <tr style="background:#e3f2fd;font-weight:600">
                                        <td style="padding:12px;border:1px solid #e0e0e0">ИТОГО</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">${funds.reduce((s,f)=>s+f.incoming,0).toLocaleString()}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">+${funds.reduce((s,f)=>s+f.received,0).toLocaleString()}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">-${funds.reduce((s,f)=>s+f.spent,0).toLocaleString()}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">${funds.reduce((s,f)=>s+f.outgoing,0).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div id="report-chart-view" style="display:none">
                            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
                                <div style="padding:20px;background:#fff;border:1px solid #e0e0e0;border-radius:8px">
                                    <h3 style="margin-bottom:15px">Поступления по фондам</h3>
                                    ${funds.map(f => `
                                        <div style="margin-bottom:10px">
                                            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                                                <span style="font-size:12px">${f.name}</span>
                                                <span style="font-size:12px;font-weight:600">${f.received.toLocaleString()} ₽</span>
                                            </div>
                                            <div style="height:8px;background:#f5f7fa;border-radius:4px;overflow:hidden">
                                                <div style="height:100%;background:#4caf50;width:${(f.received/Math.max(...funds.map(f=>f.received)))*100}%"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div style="padding:20px;background:#fff;border:1px solid #e0e0e0;border-radius:8px">
                                    <h3 style="margin-bottom:15px">Использование фондов</h3>
                                    ${funds.map(f => `
                                        <div style="margin-bottom:10px">
                                            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                                                <span style="font-size:12px">${f.name}</span>
                                                <span style="font-size:12px;font-weight:600">${f.spent.toLocaleString()} ₽</span>
                                            </div>
                                            <div style="height:8px;background:#f5f7fa;border-radius:4px;overflow:hidden">
                                                <div style="height:100%;background:#f44336;width:${(f.spent/Math.max(...funds.map(f=>f.spent)))*100}%"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 7.16: Баланс фондов
        'funds-balance': {
            title: 'Баланс фондов',
            content: function() {
                return `
                    <div style="padding:30px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                            <h2>⚖️ Баланс фондов</h2>
                            <div style="display:flex;gap:10px">
                                <button onclick="switchReportView('table')" style="padding:8px 16px;background:#0088cc;color:#fff;border:none;border-radius:4px;cursor:pointer">📊 Таблица</button>
                                <button onclick="switchReportView('chart')" style="padding:8px 16px;background:#f5f7fa;border:none;border-radius:4px;cursor:pointer">📈 График</button>
                                <button onclick="printReport()" style="padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer">🖨️ Печать</button>
                                <button onclick="downloadReport()" style="padding:8px 16px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">💾 Скачать</button>
                            </div>
                        </div>
                        
                        <div id="report-table-view">
                            <table style="width:100%;border-collapse:collapse;font-size:13px">
                                <thead>
                                    <tr style="background:#f5f7fa">
                                        <th style="padding:12px;text-align:left">Наименование фонда</th>
                                        <th style="padding:12px;text-align:right">Сумма (₽)</th>
                                        <th style="padding:12px;text-align:right">% от общего</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td style="padding:12px;border:1px solid #e0e0e0">Паевой фонд</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">505 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">65%</td></tr>
                                    <tr><td style="padding:12px;border:1px solid #e0e0e0">Неделимый фонд</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">110 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">14%</td></tr>
                                    <tr><td style="padding:12px;border:1px solid #e0e0e0">Резервный фонд</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">45 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">6%</td></tr>
                                    <tr><td style="padding:12px;border:1px solid #e0e0e0">Фонд развития</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">73 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">9%</td></tr>
                                    <tr><td style="padding:12px;border:1px solid #e0e0e0">Фонд хоз. деятельности</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">28 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">4%</td></tr>
                                    <tr style="background:#e3f2fd;font-weight:600"><td style="padding:12px;border:1px solid #e0e0e0">ИТОГО</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">761 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">100%</td></tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div id="report-chart-view" style="display:none;text-align:center;padding:40px">
                            <div style="width:300px;height:300px;margin:0 auto;background:conic-gradient(#2196f3 0% 65%, #4caf50 65% 79%, #ff9800 79% 85%, #9c27b0 85% 94%, #f44336 94% 100%);border-radius:50%"></div>
                            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:15px;margin-top:20px">
                                <div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;background:#2196f3;border-radius:2px"></div>Паевой (65%)</div>
                                <div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;background:#4caf50;border-radius:2px"></div>Неделимый (14%)</div>
                                <div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;background:#ff9800;border-radius:2px"></div>Резервный (6%)</div>
                                <div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;background:#9c27b0;border-radius:2px"></div>Развития (9%)</div>
                                <div style="display:flex;align-items:center;gap:8px"><div style="width:16px;height:16px;background:#f44336;border-radius:2px"></div>Хоз. (4%)</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        },

        // STEP 7.17: Аналитика фондов
        'funds-analytics': {
            title: 'Аналитика фондов',
            content: function() {
                const funds = [
                    { name: 'Паевой', amount: 505000, percent: 66, color: '#2196f3' },
                    { name: 'Неделимый', amount: 110000, percent: 14, color: '#4caf50' },
                    { name: 'Резервный', amount: 45000, percent: 6, color: '#ff9800' },
                    { name: 'Развития', amount: 73000, percent: 10, color: '#9c27b0' },
                    { name: 'Хоз.', amount: 28000, percent: 4, color: '#f44336' }
                ];
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">📊 Аналитика фондов</h2>
                        <div style="padding:20px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px">
                            ${funds.map(f => `
                                <div style="margin-bottom:15px">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                                        <span>${f.name}</span>
                                        <span style="font-weight:600">${f.amount.toLocaleString()} ₽ (${f.percent}%)</span>
                                    </div>
                                    <div style="height:8px;background:#f5f7fa;border-radius:4px;overflow:hidden">
                                        <div style="height:100%;background:${f.color};width:${f.percent}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="exportToExcel([],'Фонды_аналитика')" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">📊 Экспорт</button>
                    </div>
                `;
            }
        },

        // STEP 7.18: Паевой фонд
        'share-fund': {
            title: 'Паевой фонд',
            content: function() {
                const members = window.members || [];
                const total = members.filter(m => m.balance > 0).reduce((sum, m) => sum + m.balance, 0);
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">💰 Паевой фонд</h2>
                        <div style="padding:20px;background:#e3f2fd;border-radius:8px;margin-bottom:20px">
                            <div style="font-size:14px;color:#666">Общая сумма</div>
                            <div style="font-size:32px;font-weight:bold;color:#1976d2">${total.toLocaleString()} ₽</div>
                        </div>
                        <h3 style="margin-bottom:15px">По пайщикам</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:13px">
                            <thead><tr style="background:#f5f7fa"><th style="padding:12px;text-align:left">ФИО</th><th style="padding:12px;text-align:right">Сумма</th><th style="padding:12px;text-align:right">Доля</th></tr></thead>
                            <tbody>
                                ${members.filter(m => m.balance > 0).map(m => `
                                    <tr><td style="padding:12px;border:1px solid #e0e0e0">${m.name}</td>
                                    <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">${m.balance.toLocaleString()} ₽</td>
                                    <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">${total > 0 ? ((m.balance/total)*100).toFixed(1) : 0}%</td></tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },

        // STEP 7.19: Фонд развития
        'development-fund': {
            title: 'Фонд развития',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">🚀 Фонд развития</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px;margin-bottom:20px">
                        <div style="font-size:14px;color:#666">Сумма фонда</div>
                        <div style="font-size:32px;font-weight:bold;color:#9c27b0">73 000 ₽</div>
                    </div>
                    <h3 style="margin-bottom:15px">Направления</h3>
                    <div style="padding:15px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>Обучение</span><span style="font-weight:600">25 000 ₽</span></div>
                        <div style="height:6px;background:#f5f7fa;border-radius:3px;overflow:hidden"><div style="height:100%;background:#9c27b0;width:34%"></div></div>
                    </div>
                    <div style="padding:15px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:10px">
                        <div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>Разработка ПО</span><span style="font-weight:600">48 000 ₽</span></div>
                        <div style="height:6px;background:#f5f7fa;border-radius:3px;overflow:hidden"><div style="height:100%;background:#9c27b0;width:66%"></div></div>
                    </div>
                </div>
            `
        },

        // STEP 7.20: Фонд хоз. деятельности
        'business-fund': {
            title: 'Фонд хоз. деятельности',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">🏢 Фонд хоз. деятельности</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px;margin-bottom:20px">
                        <div style="font-size:14px;color:#666">Сумма фонда</div>
                        <div style="font-size:32px;font-weight:bold;color:#f44336">28 000 ₽</div>
                    </div>
                    <h3 style="margin-bottom:15px">Расходы</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead><tr style="background:#f5f7fa"><th style="padding:12px;text-align:left">Статья</th><th style="padding:12px;text-align:right">Сумма</th></tr></thead>
                        <tbody>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Аренда</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">15 000 ₽</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Коммунальные</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">8 000 ₽</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Канцтовары</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">5 000 ₽</td></tr>
                        </tbody>
                    </table>
                </div>
            `
        },

        // STEP 7.21: Неделимый фонд
        'indivisible-fund': {
            title: 'Неделимый фонд',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">🏛️ Неделимый фонд</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px;margin-bottom:20px">
                        <div style="font-size:14px;color:#666">Сумма фонда</div>
                        <div style="font-size:32px;font-weight:bold;color:#4caf50">110 000 ₽</div>
                    </div>
                    <p style="color:#666;text-align:center;padding:40px">История операций в разработке</p>
                </div>
            `
        },

        // STEP 7.22: Резервный фонд
        'reserve-fund': {
            title: 'Резервный фонд',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">🛡️ Резервный фонд</h2>
                    <div style="padding:20px;background:#f5f7fa;border-radius:8px;margin-bottom:20px">
                        <div style="font-size:14px;color:#666">Сумма фонда</div>
                        <div style="font-size:32px;font-weight:bold;color:#ff9800">45 000 ₽</div>
                    </div>
                    <p style="color:#666;text-align:center;padding:40px">История операций в разработке</p>
                </div>
            `
        },
        
        'control-dashboard': {
            title: 'Контроль сроков',
            content: function() {
                // STEP 7.1: Реализация панели контроля сроков
                const today = new Date();
                const upcomingDeadlines = [
                    { date: '28.02.2026', name: 'Срок сдачи УСН за 2025', type: 'urgent' },
                    { date: '01.03.2026', name: 'Платёж по кредиту', type: 'warning' },
                    { date: '15.03.2026', name: 'СЗВ-СТАЖ', type: 'normal' },
                    { date: '31.03.2026', name: 'Бухгалтерский баланс', type: 'urgent' }
                ];
                
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">⏰ Контроль сроков</h2>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px">
                            <div style="padding:20px;background:#ffebee;border-radius:8px">
                                <div style="font-size:14px;color:#666">Срочные</div>
                                <div style="font-size:32px;font-weight:bold;color:#c62828">2</div>
                            </div>
                            <div style="padding:20px;background:#fff3e0;border-radius:8px">
                                <div style="font-size:14px;color:#666">Внимание</div>
                                <div style="font-size:32px;font-weight:bold;color:#f57c00">1</div>
                            </div>
                            <div style="padding:20px;background:#e8f5e9;border-radius:8px">
                                <div style="font-size:14px;color:#666">В норме</div>
                                <div style="font-size:32px;font-weight:bold;color:#2e7d32">1</div>
                            </div>
                        </div>
                        <h3>Предстоящие сроки</h3>
                        <div style="margin-top:15px">
                            ${upcomingDeadlines.map(d => `
                                <div style="padding:15px;background:${d.type === 'urgent' ? '#ffebee' : d.type === 'warning' ? '#fff3e0' : '#e8f5e9'};border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
                                    <div>
                                        <div style="font-weight:600">${d.name}</div>
                                        <div style="font-size:12px;color:#666">Срок: ${d.date}</div>
                                    </div>
                                    <div style="padding:6px 12px;background:#fff;border-radius:4px;font-size:12px;font-weight:600;color:${d.type === 'urgent' ? '#c62828' : d.type === 'warning' ? '#f57c00' : '#2e7d32'}">
                                        ${d.type === 'urgent' ? 'СРОЧНО' : d.type === 'warning' ? 'ВНИМАНИЕ' : 'НОРМА'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 7.2: Календарь событий с виджетом
        'calendar-full': {
            title: 'Календарь событий',
            content: function() {
                const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
                const now = new Date();
                const currentMonth = months[now.getMonth()];
                const year = now.getFullYear();
                
                const events = [
                    { day: 17, title: 'Общее собрание', time: '10:00' },
                    { day: 28, title: 'Срок сдачи УСН', time: 'до 23:59' },
                    { day: 1, title: 'Платёж по кредиту', time: 'до 18:00' }
                ];
                
                // Генерация дней месяца
                const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
                const firstDay = new Date(year, now.getMonth(), 1).getDay();
                const today = now.getDate();
                
                let calendarDays = '';
                for (let i = 0; i < firstDay; i++) {
                    calendarDays += '<div style="height:80px;background:#f9f9f9"></div>';
                }
                for (let day = 1; day <= daysInMonth; day++) {
                    const isToday = day === today;
                    const hasEvent = events.find(e => e.day === day);
                    calendarDays += `
                        <div style="height:80px;padding:8px;background:${isToday ? '#e3f2fd' : '#fff'};border:1px solid #e0e0e0;position:relative">
                            <div style="font-weight:600;font-size:14px">${day}</div>
                            ${hasEvent ? `
                                <div style="font-size:10px;color:#0088cc;margin-top:4px;background:#e3f2fd;padding:4px;border-radius:4px">
                                    ${hasEvent.title}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
                
                return `
                    <div style="padding:30px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                            <h2>📅 Календарь событий</h2>
                            <button onclick="addCalendarEvent()" style="padding:10px 20px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">➕ Добавить</button>
                        </div>
                        <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
                            <div>
                                <h3 style="margin-bottom:15px">${currentMonth} ${year}</h3>
                                <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Пн</div>
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Вт</div>
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Ср</div>
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Чт</div>
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Пт</div>
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Сб</div>
                                    <div style="padding:8px;background:#f5f7fa;font-weight:600;font-size:12px;text-align:center">Вс</div>
                                    ${calendarDays}
                                </div>
                            </div>
                            <div>
                                <h3 style="margin-bottom:15px">События месяца</h3>
                                ${events.map(e => `
                                    <div style="padding:12px;background:#f5f7fa;border-radius:6px;margin-bottom:10px">
                                        <div style="font-weight:600;font-size:14px">${e.day} ${currentMonth}</div>
                                        <div style="font-size:13px;color:#333">${e.title}</div>
                                        <div style="font-size:12px;color:#666">${e.time}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 7.3: Протокол общего собрания
        'meeting-protocol-full': {
            title: 'Протокол общего собрания',
            content: function() {
                const members = window.members || [];
                return `
                    <div style="padding:30px">
                        <h2 style="text-align:center;margin-bottom:10px">ПРОТОКОЛ ОБЩЕГО СОБРАНИЯ</h2>
                        <p style="text-align:center;color:#666;margin-bottom:30px">Потребительского кооператива</p>
                        
                        <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                            <p><strong>Дата проведения:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                            <p><strong>Место проведения:</strong> г. Москва, ул. Примерная, д. 1</p>
                            <p><strong>Присутствовало:</strong> ${members.length} пайщиков</p>
                        </div>
                        
                        <h3 style="margin-bottom:15px">ПОВЕСТКА ДНЯ</h3>
                        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin-bottom:20px">
                            <ol style="padding-left:20px">
                                <li style="margin-bottom:10px">Утверждение отчёта правления за 2025 год</li>
                                <li style="margin-bottom:10px">Утверждение отчёта ревизионной комиссии</li>
                                <li style="margin-bottom:10px">Распределение прибыли за 2025 год</li>
                                <li style="margin-bottom:10px">Избрание членов правления</li>
                            </ol>
                        </div>
                        
                        <h3 style="margin-bottom:15px">СПИСОК ПРИСУТСТВУЮЩИХ</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">№</th>
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">ФИО</th>
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">Подпись</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${members.slice(0, 10).map((m, i) => `
                                    <tr>
                                        <td style="padding:12px;border:1px solid #e0e0e0">${i + 1}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0">${Security.escapeHtml(m.name)}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;height:40px"></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div style="margin-top:20px;display:flex;gap:10px">
                            <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Печать протокола')">🖨️ Печать</button>
                            <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Сохранить протокол')">💾 Сохранить</button>
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 7.4: Лист регистрации участников
        'attendance-list-full': {
            title: 'Лист регистрации участников',
            content: function() {
                const members = window.members || [];
                return `
                    <div style="padding:30px">
                        <h2 style="text-align:center;margin-bottom:10px">ЛИСТ РЕГИСТРАЦИИ</h2>
                        <p style="text-align:center;color:#666;margin-bottom:30px">участников общего собрания кооператива</p>
                        
                        <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                            <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                            <p><strong>Время начала:</strong> 10:00</p>
                            <p><strong>Место:</strong> г. Москва, ул. Примерная, д. 1</p>
                        </div>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:13px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:center" rowspan="2">№</th>
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:left" rowspan="2">ФИО пайщика</th>
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:center" rowspan="2">Подпись</th>
                                    <th style="padding:12px;border:1px solid #e0e0e0;text-align:center" colspan="2">Время регистрации</th>
                                </tr>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:8px;border:1px solid #e0e0e0;text-align:center">Прибыл</th>
                                    <th style="padding:8px;border:1px solid #e0e0e0;text-align:center">Выбыл</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${members.map((m, i) => `
                                    <tr>
                                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:center">${i + 1}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0">${Security.escapeHtml(m.name)}</td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;height:40px"></td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;width:80px"></td>
                                        <td style="padding:12px;border:1px solid #e0e0e0;width:80px"></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div style="margin-top:20px;display:flex;gap:10px">
                            <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Печать листа регистрации')">🖨️ Печать</button>
                        </div>
                    </div>
                `;
            }
        },
        
        // STEP 7.5: Отчёт по паевым взносам (полный)
        'payments-report-full': {
            title: 'Отчёт по паевым взносам',
            content: function() {
                const members = window.members || [];
                const totalShares = members.reduce((sum, m) => sum + (m.balance > 0 ? m.balance : 0), 0);
                const totalMembers = members.length;
                const activeMembers = members.filter(m => m.status === 'active').length;
                
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">💳 Отчёт по паевым взносам</h2>
                        
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px">
                            <div style="padding:20px;background:#e8f5e9;border-radius:8px;text-align:center">
                                <div style="font-size:14px;color:#666">Всего взносов</div>
                                <div style="font-size:32px;font-weight:bold;color:#2e7d32">${totalShares.toLocaleString()} ₽</div>
                            </div>
                            <div style="padding:20px;background:#e3f2fd;border-radius:8px;text-align:center">
                                <div style="font-size:14px;color:#666">Пайщиков</div>
                                <div style="font-size:32px;font-weight:bold;color:#1976d2">${totalMembers}</div>
                            </div>
                            <div style="padding:20px;background:#fff3e0;border-radius:8px;text-align-center">
                                <div style="font-size:14px;color:#666">Активных</div>
                                <div style="font-size:32px;font-weight:bold;color:#f57c00">${activeMembers}</div>
                            </div>
                        </div>
                        
                        <h3>Детализация по пайщикам</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:15px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;text-align:left">ФИО</th>
                                    <th style="padding:12px;text-align:right">Сумма пая</th>
                                    <th style="padding:12px;text-align:center">Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${members.map(m => `
                                    <tr>
                                        <td style="padding:12px">${Security.escapeHtml(m.name)}</td>
                                        <td style="padding:12px;text-align:right;color:${m.balance >= 0 ? '#4caf50' : '#f44336'}">${m.balance >= 0 ? m.balance.toLocaleString() : '0'} ₽</td>
                                        <td style="padding:12px;text-align:center">${Security.escapeHtml(m.statusText || '')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },
        
        // STEP 7.6: Финансовый отчёт (полный)
        'financial-report-full': {
            title: 'Финансовый отчёт',
            content: function() {
                return `
                    <div style="padding:30px">
                        <h2 style="margin-bottom:20px">📈 Финансовый отчёт</h2>
                        
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:30px">
                            <div style="padding:20px;background:#e8f5e9;border-radius:8px">
                                <h3 style="margin-bottom:15px">Доходы</h3>
                                <div style="font-size:28px;font-weight:bold;color:#2e7d32">0 ₽</div>
                                <div style="font-size:12px;color:#666;margin-top:5px">за 2026 год</div>
                            </div>
                            <div style="padding:20px;background:#ffebee;border-radius:8px">
                                <h3 style="margin-bottom:15px">Расходы</h3>
                                <div style="font-size:28px;font-weight:bold;color:#c62828">0 ₽</div>
                                <div style="font-size:12px;color:#666;margin-top:5px">за 2026 год</div>
                            </div>
                        </div>
                        
                        <h3>Структура доходов</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;text-align:left">Статья</th>
                                    <th style="padding:12px;text-align:right">Сумма</th>
                                    <th style="padding:12px;text-align:right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td style="padding:12px;border:1px solid #e0e0e0">Вступительные взносы</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0%</td></tr>
                                <tr><td style="padding:12px;border:1px solid #e0e0e0">Паевые взносы</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0%</td></tr>
                                <tr><td style="padding:12px;border:1px solid #e0e0e0">Членские взносы</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0%</td></tr>
                                <tr style="background:#e3f2fd;font-weight:600"><td style="padding:12px;border:1px solid #e0e0e0">ИТОГО</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">100%</td></tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },
        
        // STEP 7.7: Реестр членов кооператива (полный экран)
        'members-registry-full': {
            title: 'Реестр членов кооператива',
            content: function() {
                const members = window.members || [];
                const activeCount = members.filter(m => m.status === 'active').length;
                const debtCount = members.filter(m => m.status === 'debt').length;
                
                return `
                    <div style="padding:30px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                            <h2>📋 Реестр членов кооператива</h2>
                            <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Экспорт в Excel')">📊 Экспорт</button>
                        </div>
                        
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px">
                            <div style="padding:20px;background:#e8f5e9;border-radius:8px">
                                <div style="font-size:14px;color:#666">Всего пайщиков</div>
                                <div style="font-size:32px;font-weight:bold;color:#2e7d32">${members.length}</div>
                            </div>
                            <div style="padding:20px;background:#e3f2fd;border-radius:8px">
                                <div style="font-size:14px;color:#666">Активных</div>
                                <div style="font-size:32px;font-weight:bold;color:#1976d2">${activeCount}</div>
                            </div>
                            <div style="padding:20px;background:#ffebee;border-radius:8px">
                                <div style="font-size:14px;color:#666">Должников</div>
                                <div style="font-size:32px;font-weight:bold;color:#c62828">${debtCount}</div>
                            </div>
                        </div>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:13px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;text-align:left">№</th>
                                    <th style="padding:12px;text-align:left">ФИО</th>
                                    <th style="padding:12px">Дата вступления</th>
                                    <th style="padding:12px">Статус</th>
                                    <th style="padding:12px;text-align:right">Баланс</th>
                                    <th style="padding:12px">Контакт</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${members.map((m, i) => `
                                    <tr>
                                        <td style="padding:12px">${i + 1}</td>
                                        <td style="padding:12px">${Security.escapeHtml(m.name)}</td>
                                        <td style="padding:12px">${m.joinDate || '—'}</td>
                                        <td style="padding:12px"><span style="padding:4px 8px;background:${m.status === 'active' ? '#e8f5e9' : m.status === 'debt' ? '#ffebee' : '#fff3e0'};border-radius:4px;font-size:12px">${Security.escapeHtml(m.statusText || '')}</span></td>
                                        <td style="padding:12px;text-align:right;color:${m.balance >= 0 ? '#4caf50' : '#f44336'}">${m.balance >= 0 ? '+' : ''}${m.balance.toLocaleString()} ₽</td>
                                        <td style="padding:12px">${Security.escapeHtml(m.phone || '—')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },
        
        // STEP 7.8: Реестр удостоверений (полный экран)
        'certificates-registry-full': {
            title: 'Реестр выданных удостоверений',
            content: function() {
                return `
                    <div style="padding:30px">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                            <h2>📜 Реестр выданных удостоверений</h2>
                            <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Выдать удостоверение')">➕ Выдать</button>
                        </div>
                        
                        <div style="padding:15px;background:#e3f2fd;border-radius:8px;margin-bottom:20px">
                            <div style="font-size:16px;font-weight:600">📊 Статистика</div>
                            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:15px">
                                <div style="padding:15px;background:#fff;border-radius:6px">
                                    <div style="font-size:12px;color:#666">Всего выдано</div>
                                    <div style="font-size:24px;font-weight:bold;color:#1976d2">9</div>
                                </div>
                                <div style="padding:15px;background:#fff;border-radius:6px">
                                    <div style="font-size:12px;color:#666">Действующих</div>
                                    <div style="font-size:24px;font-weight:bold;color:#4caf50">9</div>
                                </div>
                                <div style="padding:15px;background:#fff;border-radius:6px">
                                    <div style="font-size:12px;color:#666">Аннулировано</div>
                                    <div style="font-size:24px;font-weight:bold;color:#999">0</div>
                                </div>
                            </div>
                        </div>
                        
                        <table style="width:100%;border-collapse:collapse;font-size:13px">
                            <thead>
                                <tr style="background:#f5f7fa">
                                    <th style="padding:12px;text-align:left">№ удост.</th>
                                    <th style="padding:12px;text-align:left">ФИО</th>
                                    <th style="padding:12px">Дата выдачи</th>
                                    <th style="padding:12px">Сумма пая</th>
                                    <th style="padding:12px">Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding:12px">001</td>
                                    <td style="padding:12px">Иванов Иван Иванович</td>
                                    <td style="padding:12px">15.01.2023</td>
                                    <td style="padding:12px;text-align:right">10 000 ₽</td>
                                    <td style="padding:12px"><span style="padding:4px 8px;background:#e8f5e9;color:#2e7d32;border-radius:4px;font-size:12px">Действует</span></td>
                                </tr>
                                <tr>
                                    <td style="padding:12px">002</td>
                                    <td style="padding:12px">Петрова Мария Сергеевна</td>
                                    <td style="padding:12px">20.02.2023</td>
                                    <td style="padding:12px;text-align:right">25 000 ₽</td>
                                    <td style="padding:12px"><span style="padding:4px 8px;background:#e8f5e9;color:#2e7d32;border-radius:4px;font-size:12px">Действует</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }
        },
        
        // STEP 7.9: Нулевая отчетность
        'zero-reporting': {
            title: 'Нулевая отчётность',
            content: `
                <div style="padding:30px">
                    <h2 style="margin-bottom:20px">📄 Нулевая отчётность</h2>
                    <div style="padding:20px;background:#fff3e0;border-radius:8px;margin-bottom:20px">
                        <div style="font-size:16px;font-weight:600;margin-bottom:10px">ℹ️ Информация</div>
                        <p>Нулевая отчётность сдаётся при отсутствии деятельности и движений по счетам.</p>
                    </div>
                    
                    <h3>Состав нулевой отчётности</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:15px">
                        <thead>
                            <tr style="background:#f5f7fa">
                                <th style="padding:12px;text-align:left">Отчёт</th>
                                <th style="padding:12px">Срок сдачи</th>
                                <th style="padding:12px">Статус</th>
                                <th style="padding:12px">Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding:12px;border:1px solid #e0e0e0">Декларация УСН</td>
                                <td style="padding:12px;border:1px solid #e0e0e0">до 31.03</td>
                                <td style="padding:12px;border:1px solid #e0e0e0"><span style="padding:4px 8px;background:#ffebee;color:#c62828;border-radius:4px;font-size:12px">Не сдано</span></td>
                                <td style="padding:12px;border:1px solid #e0e0e0"><button style="padding:6px 12px;background:#0088cc;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px" onclick="alert('Формирование декларации')">📄 Сформировать</button></td>
                            </tr>
                            <tr>
                                <td style="padding:12px;border:1px solid #e0e0e0">Бухгалтерский баланс</td>
                                <td style="padding:12px;border:1px solid #e0e0e0">до 31.03</td>
                                <td style="padding:12px;border:1px solid #e0e0e0"><span style="padding:4px 8px;background:#ffebee;color:#c62828;border-radius:4px;font-size:12px">Не сдано</span></td>
                                <td style="padding:12px;border:1px solid #e0e0e0"><button style="padding:6px 12px;background:#0088cc;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px" onclick="alert('Формирование баланса')">📄 Сформировать</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `
        },
        
        // STEP 7.10: Декларация УСН
        'usn-declaration': {
            title: 'Декларация УСН',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">ДЕКЛАРАЦИЯ ПО УСН</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">за 2025 год</p>
                    
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Организация:</strong> Потребительский кооператив</p>
                        <p><strong>ИНН:</strong> —</p>
                        <p><strong>Объект налогообложения:</strong> Доходы (6%)</p>
                    </div>
                    
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr style="background:#f5f7fa">
                                <th style="padding:12px;text-align:left">Раздел</th>
                                <th style="padding:12px;text-align:right">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Доходы за год</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Налоговая база</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0">Налог к уплате (6%)</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0 ₽</td></tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top:20px;display:flex;gap:10px">
                        <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Печать декларации')">🖨️ Печать</button>
                        <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Отправка в ФНС')">📤 Отправить</button>
                    </div>
                </div>
            `
        },
        
        // STEP 7.11: КУДиР
        'kudir': {
            title: 'Книга учёта доходов и расходов (КУДиР)',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">КУДиР</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">за 2025 год</p>
                    
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Организация:</strong> Потребительский кооператив</p>
                        <p><strong>Период:</strong> 01.01.2025 - 31.12.2025</p>
                    </div>
                    
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead>
                            <tr style="background:#f5f7fa">
                                <th style="padding:12px;text-align:center">№</th>
                                <th style="padding:12px;text-align:left">Дата</th>
                                <th style="padding:12px;text-align:left">Содержание</th>
                                <th style="padding:12px;text-align:right">Доходы</th>
                                <th style="padding:12px;text-align:right">Расходы</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0;text-align:center">1</td><td style="padding:12px;border:1px solid #e0e0e0">15.01.2025</td><td style="padding:12px;border:1px solid #e0e0e0">Вступительный взнос</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">5 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                            <tr><td style="padding:12px;border:1px solid #e0e0e0;text-align:center">2</td><td style="padding:12px;border:1px solid #e0e0e0">20.02.2025</td><td style="padding:12px;border:1px solid #e0e0e0">Паевой взнос</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">25 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                            <tr style="background:#e3f2fd;font-weight:600"><td style="padding:12px;border:1px solid #e0e0e0;text-align:center" colspan="3">ИТОГО</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">30 000</td><td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td></tr>
                        </tbody>
                    </table>
                </div>
            `
        },
        
        // STEP 7.12: Бухгалтерская справка
        'accounting-certificate': {
            title: 'Бухгалтерская справка',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">БУХГАЛТЕРСКАЯ СПРАВКА</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">о расчёте взносов</p>
                    
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Организация:</strong> Потребительский кооператив</p>
                        <p><strong>Дата составления:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                    </div>
                    
                    <div style="padding:20px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px">
                        <h3 style="margin-bottom:15px">Расчёт членских взносов</h3>
                        <table style="width:100%;border-collapse:collapse;font-size:13px">
                            <tr><td style="padding:12px">Количество пайщиков:</td><td style="padding:12px;text-align:right;font-weight:600">12 чел.</td></tr>
                            <tr><td style="padding:12px">Размер взноса:</td><td style="padding:12px;text-align:right;font-weight:600">1 000 ₽/мес</td></tr>
                            <tr style="background:#e3f2fd;font-weight:600"><td style="padding:12px">Итого в месяц:</td><td style="padding:12px;text-align:right">12 000 ₽</td></tr>
                        </table>
                    </div>
                    
                    <div style="margin-top:40px;display:flex;justify-content:space-between">
                        <div style="text-align:center">
                            <div style="border-top:1px solid #000;padding-top:5px;width:200px">Председатель</div>
                        </div>
                        <div style="text-align:center">
                            <div style="border-top:1px solid #000;padding-top:5px;width:150px">Главный бухгалтер</div>
                        </div>
                    </div>
                </div>
            `
        },
        
        // STEP 7.13: ПКО (Приходный кассовый ордер)
        'pko': {
            title: 'Приходный кассовый ордер (ПКО)',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">№ ___ от «___» ________ 20__ г.</p>
                    
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Принято от:</strong> _________________________________</p>
                        <p><strong>Сумма:</strong> _________________________________ руб.</p>
                        <p><strong>Основание:</strong> _________________________________</p>
                    </div>
                    
                    <div style="margin-top:40px;display:flex;justify-content:space-between">
                        <div style="text-align:center">
                            <div style="border-top:1px solid #000;padding-top:5px;width:150px">Главный бухгалтер</div>
                        </div>
                        <div style="text-align:center">
                            <div style="border-top:1px solid #000;padding-top:5px;width:150px">Кассир</div>
                        </div>
                    </div>
                    
                    <div style="margin-top:30px;padding:20px;background:#e8f5e9;border-radius:8px">
                        <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Печать ПКО')">🖨��� Печать</button>
                    </div>
                </div>
            `
        },
        
        // STEP 7.14: РКО (Расходный кассовый ордер)
        'rko': {
            title: 'Ра��ходный кассовый ордер (РКО)',
            content: `
                <div style="padding:30px">
                    <h2 style="text-align:center;margin-bottom:10px">РАСХОДНЫЙ КАССОВЫЙ ОРДЕР</h2>
                    <p style="text-align:center;color:#666;margin-bottom:30px">№ ___ от «___» ________ 20__ г.</p>
                    
                    <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                        <p><strong>Выдать:</strong> _________________________________</p>
                        <p><strong>Сумма:</strong> _________________________________ руб.</p>
                        <p><strong>Основание:</strong> _________________________________</p>
                    </div>
                    
                    <div style="margin-top:40px;display:flex;justify-content:space-between">
                        <div style="text-align:center">
                            <div style="border-top:1px solid #000;padding-top:5px;width:150px">Главный бухгалтер</div>
                        </div>
                        <div style="text-align:center">
                            <div style="border-top:1px solid #000;padding-top:5px;width:150px">Кассир</div>
                        </div>
                    </div>
                    
                    <div style="margin-top:30px;padding:20px;background:#e8f5e9;border-radius:8px">
                        <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="alert('Печать РКО')">🖨️ Печать</button>
                    </div>
                </div>
            `
        }
    };
    
    const report = reports[reportId];
    
    // Если контент - функция, вызываем её
    if (report && typeof report.content === 'function') {
        report.content = report.content();
    }
    
    return report;
}

// STEP 6: Функция отображения отчета в большой панели
function showLargeReport(title, content) {
    try {
        Logger.info('Показать отчет', { title });
        
        const largeReportTitle = document.getElementById('largeReportTitle');
        const largeReportContent = document.getElementById('largeReportContent');
        const largeReportPanel = document.getElementById('largeReportPanel');
        const reportsSubmenu = document.getElementById('reportsSubmenu');
        
        if (largeReportTitle) largeReportTitle.textContent = title;
        if (largeReportContent) largeReportContent.innerHTML = content;
        if (largeReportPanel) largeReportPanel.classList.add('visible');
        if (reportsSubmenu) reportsSubmenu.classList.remove('visible');
        
        hideFab();
        Logger.info('Отчет показан', { title });
    } catch (error) {
        Logger.error('Ошибка отображения отчета', error);
    }
}

// STEP 8.5: Вспомогательные функции для отчётов
// Переключение вида отчёта (Таблица/График)
function switchReportView(view) {
    const tableView = document.getElementById('report-table-view');
    const chartView = document.getElementById('report-chart-view');
    
    if (tableView && chartView) {
        if (view === 'table') {
            tableView.style.display = 'block';
            chartView.style.display = 'none';
        } else {
            tableView.style.display = 'none';
            chartView.style.display = 'block';
        }
    }
}

// Печать отчёта
function printReport() {
    const content = document.getElementById('largeReportContent')?.innerHTML;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Печать отчёта</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                td, th { border: 1px solid #000; padding: 8px; }
                button { display: none; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div style="display:flex;justify-content:space-between;margin-bottom:20px">
                <h2>Отчёт</h2>
                <div>Дата: ${new Date().toLocaleDateString('ru-RU')}</div>
            </div>
            ${content}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Скачивание отчёта (CSV)
function downloadReport() {
    const table = document.querySelector('#report-table-view table');
    if (!table) {
        alert('Нет данных для экспорта');
        return;
    }
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach(col => {
            rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'report_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
}

// STEP 9: Формирование документов нулевой отчетности
function generateZeroReport(reportType) {
    try {
        Logger.info('Формирование нулевой отчетности', { reportType });
        
        const reports = {
            'usn': generateUSNDeclaration,
            'balance': generateBalanceSheet,
            'szv-stazh': generateSZVStazh,
            'rsV': generateRSV,
            'sredn': generateSrednSpisoch
        };
        
        const generator = reports[reportType];
        if (generator) {
            generator();
        } else {
            Logger.warn('Отчет не найден', { reportType });
        }
    } catch (error) {
        Logger.error('Ошибка формирования отчета', error);
    }
}

// STEP 9.1: Декларация УСН (нулевая)
function generateUSNDeclaration() {
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings?.inn || '______________';
    const year = new Date().getFullYear() - 1;
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">НАЛОГОВАЯ ДЕКЛАРАЦИЯ</h2>
            <p style="text-align:center;margin-bottom:30px">по ������прощенной системе налогообложения</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p><strong>Налоговый период:</strong> ${year} год</p>
                <p><strong>Представляется:</strong> ${orgName}</p>
                <p><strong>ИНН:</strong> ${inn}</p>
                <p><strong>Код ИФНС:</strong> ______</p>
                <p><strong>Код по ОКУД:</strong> 1152000</p>
            </div>
            
            <h3 style="margin-bottom:15px">Раздел 1.1. Сумма налога</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr>
                    <td style="padding:8px;border:1px solid #000;width:50%">Код бюджетной классификации</td>
                    <td style="padding:8px;border:1px solid #000">182 1 05 01011 01 1000 110</td>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Сумма налога к уплате</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td>
                </tr>
            </table>
            
            <h3 style="margin-bottom:15px">Раздел 2.1.1. Расчет налога</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr style="background:#f5f7fa">
                    <th style="padding:8px;border:1px solid #000">Показатель</th>
                    <th style="padding:8px;border:1px solid #000;text-align:right">Значение</th>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Налоговая база</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Ставка налога</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">6%</td>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Сумма налога</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td>
                </tr>
            </table>
            
            <div style="margin-top:40px;display:flex;gap:10px">
                <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="printDocument('usn-declaration')">🖨️ Печать</button>
                <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="downloadPDF('usn-declaration')">💾 Скачать PDF</button>
            </div>
        </div>
    `;
    
    showLargeReport('Декларация УСН (нулевая)', content);
}

// STEP 9.2: Бухгалтерский баланс (нулевой)
function generateBalanceSheet() {
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    const date = new Date().toLocaleDateString('ru-RU');
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">БУХГАЛТЕРСКИЙ БАЛАНС</h2>
            <p style="text-align:center;margin-bottom:30px">Форма №1 (ОКУД 0710001)</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p><strong>Организация:</strong> ${orgName}</p>
                <p><strong>Дата составления:</strong> ${date}</p>
                <p><strong>Единица измерения:</strong> тыс. руб.</p>
            </div>
            
            <h3 style="margin-bottom:15px">АКТИВ</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr style="background:#f5f7fa">
                    <th style="padding:8px;border:1px solid #000;text-align:left">Показатель</th>
                    <th style="padding:8px;border:1px solid #000;text-align:right">На 31.12</th>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Материальные внеоборотные активы</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0</td>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Денежные средства</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0</td>
                </tr>
                <tr style="background:#e3f2fd;font-weight:600">
                    <td style="padding:8px;border:1px solid #000">БАЛАНС</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0</td>
                </tr>
            </table>
            
            <h3 style="margin-bottom:15px">ПАССИВ</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr style="background:#f5f7fa">
                    <th style="padding:8px;border:1px solid #000;text-align:left">Показатель</th>
                    <th style="padding:8px;border:1px solid #000;text-align:right">На 31.12</th>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Целевые средства</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0</td>
                </tr>
                <tr style="background:#e3f2fd;font-weight:600">
                    <td style="padding:8px;border:1px solid #000">БАЛАНС</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0</td>
                </tr>
            </table>
            
            <div style="margin-top:40px;display:flex;gap:10px">
                <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="printDocument('balance-sheet')">🖨️ Печать</button>
                <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="downloadPDF('balance-sheet')">💾 Скачать PDF</button>
            </div>
        </div>
    `;
    
    showLargeReport('Бухгалтерский баланс (нулевой)', content);
}

// STEP 9.3: СЗВ-СТАЖ (нулевой)
function generateSZVStazh() {
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings?.inn || '______________';
    const year = new Date().getFullYear() - 1;
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">СЗВ-СТАЖ</h2>
            <p style="text-align:center;margin-bottom:30px">Индивидуальные сведения о стаже</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p><strong>Отчётный период:</strong> ${year} год</p>
                <p><strong>Страхователь:</strong> ${orgName}</p>
                <p><strong>ИНН:</strong> ${inn}</p>
                <p><strong>Тип сведений:</strong> Исходная</p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr style="background:#f5f7fa">
                    <th style="padding:8px;border:1px solid #000">№</th>
                    <th style="padding:8px;border:1px solid #000">ФИО</th>
                    <th style="padding:8px;border:1px solid #000">СНИЛС</th>
                    <th style="padding:8px;border:1px solid #000">Период</th>
                </tr>
                <tr>
                    <td colspan="4" style="padding:20px;text-align:center;color:#999">Застрахованные лица отсутствуют</td>
                </tr>
            </table>
            
            <div style="margin-top:40px;display:flex;gap:10px">
                <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="printDocument('szv-stazh')">🖨️ Печать</button>
                <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="downloadPDF('szv-stazh')">💾 Скачать PDF</button>
            </div>
        </div>
    `;
    
    showLargeReport('СЗВ-СТАЖ (нулевая)', content);
}

// STEP 9.4: РСВ (нулевой)
function generateRSV() {
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings?.inn || '______________';
    const year = new Date().getFullYear() - 1;
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">РАСЧЁТ ПО СТРАХОВЫМ ВЗНОСАМ</h2>
            <p style="text-align:center;margin-bottom:30px">(РСВ)</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p><strong>Отчётный период:</strong> ${year} год</p>
                <p><strong>Страхователь:</strong> ${orgName}</p>
                <p><strong>ИНН:</strong> ${inn}</p>
            </div>
            
            <h3 style="margin-bottom:15px">Сводные данные</h3>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr style="background:#f5f7fa">
                    <th style="padding:8px;border:1px solid #000">Показатель</th>
                    <th style="padding:8px;border:1px solid #000;text-align:right">Сумма</th>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Численность застрахованных лиц</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0</td>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">База для исчисления взносов</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Сумма взносов к уплате</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td>
                </tr>
            </table>
            
            <div style="margin-top:40px;display:flex;gap:10px">
                <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="printDocument('rsv')">🖨️ Печать</button>
                <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="downloadPDF('rsv')">💾 Скачать PDF</button>
            </div>
        </div>
    `;
    
    showLargeReport('РСВ (нулевой)', content);
}

// STEP 9.5: Среднесписочная численность (нулевая)
function generateSrednSpisoch() {
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings?.inn || '______________';
    const year = new Date().getFullYear() - 1;
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">СВЕДЕНИЯ</h2>
            <p style="text-align:center;margin-bottom:30px">о среднесписочной численности работников</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p><strong>За год:</strong> ${year}</p>
                <p><strong>Организация:</strong> ${orgName}</p>
                <p><strong>ИНН:</strong> ${inn}</p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
                <tr style="background:#f5f7fa">
                    <th style="padding:8px;border:1px solid #000">Показатель</th>
                    <th style="padding:8px;border:1px solid #000;text-align:right">Значение</th>
                </tr>
                <tr>
                    <td style="padding:8px;border:1px solid #000">Среднесписочная численность</td>
                    <td style="padding:8px;border:1px solid #000;text-align:right">0 чел.</td>
                </tr>
            </table>
            
            <div style="margin-top:40px;display:flex;justify-content:space-between">
                <div style="text-align:center">
                    <div style="border-top:1px solid #000;padding-top:5px;width:200px">Руководитель</div>
                </div>
                <div style="text-align:center">
                    <div style="border-top:1px solid #000;padding-top:5px;width:150px">Дата</div>
                </div>
            </div>
            
            <div style="margin-top:30px;display:flex;gap:10px">
                <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="printDocument('sredn')">🖨️ Печать</button>
                <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="downloadPDF('sredn')">💾 Скачать PDF</button>
            </div>
        </div>
    `;
    
    showLargeReport('Среднесписочная численность (нулевая)', content);
}

// STEP 9.6: Печать документа
function printDocument(docId) {
    try {
        Logger.info('Печать документа', { docId });
        
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('largeReportContent')?.innerHTML || '';
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Печать документа</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { border: 1px solid #000; padding: 8px; }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        
        Logger.info('Документ отправлен на печать');
    } catch (error) {
        Logger.error('Ошибка печати', error);
    }
}

// STEP 9.7: Скачивание PDF (заглушка)
function downloadPDF(docId) {
    try {
        Logger.info('Скачивание PDF', { docId });
        alert('Для экспорта в PDF подключите библиотеку jsPDF или используйте печать в PDF');
    } catch (error) {
        Logger.error('Ошибка скачивания', error);
    }
}

// STEP 10: Реализация кнопок FAB
// Делаем функцию доступной глобально для onclick из HTML
window.createNew = function createNew(type) {
    try {
        Logger.info('Создание нового', { type });

        const creators = {
            'member': createMember,
            'payment': createPayment,
            'transaction': createTransaction,
            'document': createDocument,
            'application': createApplication
        };

        const creator = creators[type];
        if (creator) {
            creator();
        } else {
            Logger.warn('Тип создания не найден', { type });
        }

        toggleFab();
    } catch (error) {
        Logger.error('Ошибка создания', error);
    }
};

// STEP 10.1: Создание пайщика
function createMember() {
    Logger.info('Создание пайщика');
    
    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">👤 Добавление пайщика</h3>
            <form id="create-member-form" onsubmit="saveNewMember(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">ФИО *</label>
                    <input type="text" id="member-name" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Иванов Иван Иванович">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Телефон *</label>
                    <input type="tel" id="member-phone" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="+7 (___) ___-__-__">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Email</label>
                    <input type="email" id="member-email" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="email@example.com">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Дата вступления</label>
                    <input type="date" id="member-join-date" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Вступительный взнос (₽)</label>
                    <input type="number" id="member-entrance-fee" value="5000" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Паевой взнос (₽)</label>
                    <input type="number" id="member-share-fee" value="10000" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Добавление пайщика', content);
}

// STEP 10.2: Сохранение нового пайщика
function saveNewMember(event) {
    event.preventDefault();
    try {
        const name = document.getElementById('member-name').value;
        const phone = document.getElementById('member-phone').value;
        const email = document.getElementById('member-email').value;
        const joinDate = document.getElementById('member-join-date').value;
        const entranceFee = parseFloat(document.getElementById('member-entrance-fee').value) || 0;
        const shareFee = parseFloat(document.getElementById('member-share-fee').value) || 0;
        
        const newMember = {
            id: Date.now(),
            name: name,
            phone: phone,
            email: email,
            joinDate: joinDate || new Date().toISOString().split('T')[0],
            status: 'active',
            statusText: 'Активен',
            balance: entranceFee + shareFee,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            color: `linear-gradient(135deg,${getRandomColor()},${getRandomColor()})`,
            lastTransaction: `Внесён паевой взнос ${shareFee.toLocaleString()} ₽`,
            lastTime: 'Только что',
            operations: [
                { id: Date.now(), type: 'Вступительный взнос', amount: entranceFee, date: joinDate, description: 'Вступительный взнос', status: 'paid' },
                { id: Date.now() + 1, type: 'Паевой взнос', amount: shareFee, date: joinDate, description: 'Паевой взнос', status: 'paid' }
            ]
        };
        
        // Добавляем в массив
        if (!window.members) window.members = [];
        window.members.push(newMember);
        
        // Сохраняем
        saveData();
        
        // Обновляем UI
        renderChats();
        updateStats();
        
        Logger.info('Пайщик добавлен', { id: newMember.id, name });
        alert(`✅ Пайщик ${name} успешно добавлен!`);
        closeSideMenu();
        
    } catch (error) {
        Logger.error('Ошибка сохранения пайщика', error);
        alert('❌ Ошибка при сохранении пайщика');
    }
}

// STEP 10.3: Генерация случайного цвета
function getRandomColor() {
    const colors = ['#ff6b6b', '#51cf66', '#fcc419', '#74c0fc', '#b197fc', '#ff922b', '#20c997', '#e599f7'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// STEP 10.4: Создание взноса
function createPayment() {
    Logger.info('Создание взноса');
    
    const members = window.members || [];
    
    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">💳 Добавление взноса</h3>
            <form id="create-payment-form" onsubmit="saveNewPayment(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Пайщик *</label>
                    <select id="payment-member" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="">Выберите пайщика</option>
                        ${members.map(m => `<option value="${m.id}">${Security.escapeHtml(m.name)}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Тип взноса *</label>
                    <select id="payment-type" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="entrance">Вступительный</option>
                        <option value="share">Паевой</option>
                        <option value="membership">Членский</option>
                        <option value="voluntary">Добровольный</option>
                        <option value="targeted">Целевой</option>
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Сумма (₽) *</label>
                    <input type="number" id="payment-amount" required min="1" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="5000">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Дата</label>
                    <input type="date" id="payment-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Способ оплаты</label>
                    <select id="payment-method" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="cash">Наличные</option>
                        <option value="non_cash">Безналичные</option>
                    </select>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Добавление взноса', content);
}

// STEP 10.5: Сохранение нового взноса
function saveNewPayment(event) {
    event.preventDefault();
    try {
        const memberId = document.getElementById('payment-member').value;
        const type = document.getElementById('payment-type').value;
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const date = document.getElementById('payment-date').value;
        const method = document.getElementById('payment-method').value;
        
        const member = window.members?.find(m => m.id == memberId);
        if (!member) {
            alert('❌ Пайщик не найден');
            return;
        }
        
        const newPayment = {
            id: Date.now(),
            memberId: parseInt(memberId),
            type: type,
            amount: amount,
            date: date,
            method: method,
            paid: true,
            description: getTypeName(type)
        };
        
        // Обновляем баланс пайщика
        member.balance = (member.balance || 0) + amount;
        member.operations = member.operations || [];
        member.operations.push({
            id: Date.now(),
            type: getTypeName(type),
            amount: amount,
            date: date,
            description: getTypeName(type),
            status: 'paid'
        });
        
        // Добавляем в общий массив
        if (!window.payments) window.payments = [];
        window.payments.push(newPayment);
        
        saveData();
        renderChats();
        updateStats();
        
        Logger.info('Взнос добавлен', { memberId, amount });
        alert(`✅ Взнос ${amount.toLocaleString()} ₽ успешно добавлен!`);
        closeSideMenu();
        
    } catch (error) {
        Logger.error('Ошибка сохранения взноса', error);
        alert('❌ Ошибка при сохранении взноса');
    }
}

// STEP 10.6: Получение названия типа взноса
function getTypeName(type) {
    const names = {
        'entrance': 'Вступительный взнос',
        'share': 'Паевой взнос',
        'membership': 'Членский взнос',
        'voluntary': 'Добровольный взнос',
        'targeted': 'Целевой взнос'
    };
    return names[type] || type;
}

// STEP 10.7: Создание проводки
function createTransaction() {
    Logger.info('Создание проводки');
    
    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">📒 Добавление проводки</h3>
            <form id="create-transaction-form" onsubmit="saveNewTransaction(event)">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">
                    <div>
                        <label style="display:block;margin-bottom:5px;font-weight:600">Дебет *</label>
                        <input type="text" id="transaction-debet" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="50">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;font-weight:600">Кредит *</label>
                        <input type="text" id="transaction-credit" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="86-1">
                    </div>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Сумма (₽) *</label>
                    <input type="number" id="transaction-amount" required min="1" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="10000">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Дата</label>
                    <input type="date" id="transaction-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Описание *</label>
                    <textarea id="transaction-description" required rows="3" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Операция по счету"></textarea>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Добавление проводки', content);
}

// STEP 10.8: Сохранение новой проводки
function saveNewTransaction(event) {
    event.preventDefault();
    try {
        const debet = document.getElementById('transaction-debet').value;
        const credit = document.getElementById('transaction-credit').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const date = document.getElementById('transaction-date').value;
        const description = document.getElementById('transaction-description').value;
        
        const newTransaction = {
            id: Date.now(),
            date: date,
            debitAccount: debet,
            creditAccount: credit,
            amount: amount,
            description: description
        };
        
        if (!window.transactions) window.transactions = [];
        window.transactions.push(newTransaction);
        
        saveData();
        
        Logger.info('Проводка добавлена', { debet, credit, amount });
        alert(`✅ Проводка Дт${debet} - Кт${credit} ${amount.toLocaleString()} ₽ добавлена!`);
        closeSideMenu();
        
    } catch (error) {
        Logger.error('Ошибка сохранения проводки', error);
        alert('❌ Ошибка при сохранении проводки');
    }
}

// STEP 10.9: Создание документа
function createDocument() {
    Logger.info('Создание документа');
    
    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">📁 Загрузка документа</h3>
            <form id="create-document-form" onsubmit="saveNewDocument(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Название *</label>
                    <input type="text" id="document-name" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Например: Устав кооператива">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Тип *</label>
                    <select id="document-type" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="contract">Договор</option>
                        <option value="report">Отчёт</option>
                        <option value="protocol">Протокол</option>
                        <option value="other">Прочее</option>
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Дата</label>
                    <input type="date" id="document-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Файл</label>
                    <input type="file" id="document-file" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Загрузка документа', content);
}

// STEP 10.10: Сохранение нового документа
function saveNewDocument(event) {
    event.preventDefault();
    try {
        const name = document.getElementById('document-name').value;
        const type = document.getElementById('document-type').value;
        const date = document.getElementById('document-date').value;
        
        const newDocument = {
            id: Date.now(),
            name: name,
            type: type,
            date: date,
            size: 0,
            fileName: name + '.pdf'
        };
        
        if (!window.documents) window.documents = [];
        window.documents.push(newDocument);
        
        saveData();
        
        Logger.info('Документ добавлен', { name });
        alert(`✅ Документ "${name}" добавлен!`);
        closeSideMenu();
        
    } catch (error) {
        Logger.error('Ошибка сохранения документа', error);
        alert('❌ Ошибка при сохранении документа');
    }
}

// STEP 10.13: Редактирование пайщика
function editMember(memberId) {
    Logger.info('Редактирование пайщика', { memberId });
    
    const member = window.members?.find(m => m.id === memberId);
    if (!member) {
        Logger.error('Пайщик не найден', { memberId });
        alert('❌ Пайщик не найден');
        return;
    }
    
    const content = `
        <div style="padding:20px;max-height:600px;overflow-y:auto">
            <h3 style="margin-bottom:20px">✏️ Редактирование пайщика</h3>
            <form id="edit-member-form" onsubmit="updateMember(event, ${member.id})">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">ФИО *</label>
                    <input type="text" id="edit-member-name" required 
                           value="${Security.escapeHtml(member.name)}" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" 
                           placeholder="Иванов Иван Иванович">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Телефон *</label>
                    <input type="tel" id="edit-member-phone" required 
                           value="${Security.escapeHtml(member.phone || '')}" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" 
                           placeholder="+7 (___) ___-__-__">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Email</label>
                    <input type="email" id="edit-member-email" 
                           value="${Security.escapeHtml(member.email || '')}" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" 
                           placeholder="email@example.com">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Адрес</label>
                    <input type="text" id="edit-member-address" 
                           value="${Security.escapeHtml(member.address || '')}" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" 
                           placeholder="г. Москва, ул. Примерная, д. 1">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Дата вступления</label>
                    <input type="date" id="edit-member-join-date" 
                           value="${member.joinDate || ''}" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Статус</label>
                    <select id="edit-member-status" 
                            style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="active" ${member.status === 'active' ? 'selected' : ''}>Активен</option>
                        <option value="debt" ${member.status === 'debt' ? 'selected' : ''}>Должник</option>
                        <option value="pending" ${member.status === 'pending' ? 'selected' : ''}>На рассмотрении</option>
                        <option value="suspended" ${member.status === 'suspended' ? 'selected' : ''}>Приостановлен</option>
                        <option value="withdrawn" ${member.status === 'withdrawn' ? 'selected' : ''}>Выбыл</option>
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Заметки</label>
                    <textarea id="edit-member-notes" rows="3" 
                              style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" 
                              placeholder="Дополнительная информация">${Security.escapeHtml(member.notes || '')}</textarea>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Редактирование пайщика', content);
}

// STEP 10.14: Сохранение изменений пайщика
function updateMember(event, memberId) {
    event.preventDefault();
    try {
        Logger.info('Сохранение изменений пайщика', { memberId });
        
        const member = window.members.find(m => m.id === memberId);
        if (!member) {
            Logger.error('Пайщик не найден', { memberId });
            alert('❌ Пайщик не найден');
            return;
        }
        
        const oldName = member.name;
        
        // Обновляем данные
        member.name = document.getElementById('edit-member-name').value.trim();
        member.phone = document.getElementById('edit-member-phone').value.trim();
        member.email = document.getElementById('edit-member-email').value.trim();
        member.address = document.getElementById('edit-member-address').value.trim();
        member.joinDate = document.getElementById('edit-member-join-date').value;
        member.status = document.getElementById('edit-member-status').value;
        member.notes = document.getElementById('edit-member-notes').value.trim();
        
        // Обновляем статус текст
        const statusTexts = {
            'active': 'Активен',
            'debt': 'Должник',
            'pending': 'На рассмотрении',
            'suspended': 'Приостановлен',
            'withdrawn': 'Выбыл'
        };
        member.statusText = statusTexts[member.status];
        
        // Обновляем аватар если изменилось имя
        if (member.name !== oldName) {
            member.avatar = member.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
        
        // Сохраняем
        saveData();
        
        // Обновляем UI
        renderChats();
        if (currentMember && currentMember.id === memberId) {
            selectMember(member);
        }
        
        Logger.info('Пайщик обновлён', { memberId, name: member.name });
        showToast({ type: 'success', message: `Данные пайщика "${member.name}" обновлены!` });
        closeSideMenu();

    } catch (error) {
        Logger.error('Ошибка обновления пайщика', error);
        showToast({ type: 'error', message: 'Ошибка при обновлении данных пайщика' });
    }
}

// STEP 10.11: Создание заявления
function createApplication() {
    Logger.info('Создание заявления');

    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">📝 Подача заявления на вступление</h3>
            <form id="create-application-form" onsubmit="saveNewApplication(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">ФИО заявителя *</label>
                    <input type="text" id="application-name" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Иванов Иван Иванович">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Контактный телефон *</label>
                    <input type="tel" id="application-phone" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="+7 (___) ___-__-__">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Email</label>
                    <input type="email" id="application-email" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="email@example.com">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Желаемый размер пая (₽)</label>
                    <input type="number" id="application-share" value="10000" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Комментарий</label>
                    <textarea id="application-comment" rows="3" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Дополнительная информация"></textarea>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">📤 Подать заявление</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Заявление на вступление', content);
}

// STEP 10.12: Сохранение нового заявления
function saveNewApplication(event) {
    event.preventDefault();
    try {
        const name = document.getElementById('application-name').value;
        const phone = document.getElementById('application-phone').value;
        const email = document.getElementById('application-email').value;
        const share = parseFloat(document.getElementById('application-share').value);
        const comment = document.getElementById('application-comment').value;
        
        const newApplication = {
            id: Date.now(),
            applicantName: name,
            applicantContact: phone + (email ? ', ' + email : ''),
            desiredShareAmount: share,
            additionalInfo: comment,
            submissionDate: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        
        if (!window.applications) window.applications = [];
        window.applications.push(newApplication);
        
        saveData();
        
        Logger.info('Заявление добавлено', { name });
        alert(`✅ Заявление от ${name} подано на рассмотрение!`);
        closeSideMenu();
        
    } catch (error) {
        Logger.error('Ошибка сохранения заявления', error);
        alert('❌ Ошибка при подаче заявления');
    }
}

// STEP 10.16: Возврат паевого взноса
function createReturnPayment() {
    Logger.info('Создание возврата взноса');
    
    const members = window.members?.filter(m => m.balance > 0) || [];
    
    if (members.length === 0) {
        Logger.warn('Нет пайщиков с положительным балансом');
        alert('⚠️ Нет пайщиков с положительным балансом для возврата');
        return;
    }
    
    const content = `
        <div style="padding:20px;max-height:600px;overflow-y:auto">
            <h3 style="margin-bottom:20px">↩️ Возврат паевого взноса</h3>
            <form id="create-return-payment-form" onsubmit="saveReturnPayment(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Пайщик *</label>
                    <select id="return-member" required onchange="updateReturnMaxAmount(this.value)" 
                            style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="">Выберите пайщика</option>
                        ${members.map(m => `
                            <option value="${m.id}" data-balance="${m.balance}">
                                ${Security.escapeHtml(m.name)} (Баланс: ${m.balance.toLocaleString()} ₽)
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Максимальная сумма</label>
                    <input type="text" id="return-max-amount" readonly 
                           value="0 ₽" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px;background:#f5f7fa">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Сумма возврата (₽) *</label>
                    <input type="number" id="return-amount" required min="1" 
                           placeholder="Введите сумму" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Дата возврата *</label>
                    <input type="date" id="return-date" required 
                           value="${new Date().toISOString().split('T')[0]}" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Основание *</label>
                    <textarea id="return-reason" required rows="3" 
                              placeholder="Заявление о выходе из кооператива&#10;Протокол №__ от ______" 
                              style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px"></textarea>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Способ выплаты</label>
                    <select id="return-method" 
                            style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="cash">Наличными из кассы</option>
                        <option value="bank">На банковский счёт</option>
                    </select>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Офор��ить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Возврат взноса', content);
}

// STEP 10.17: Обновление максимальной суммы возврата
function updateReturnMaxAmount(memberId) {
    const select = document.getElementById('return-member');
    const option = select.options[select.selectedIndex];
    const balance = option.dataset.balance ? parseFloat(option.dataset.balance) : 0;
    
    const maxAmountInput = document.getElementById('return-max-amount');
    if (maxAmountInput) {
        maxAmountInput.value = balance > 0 ? `${balance.toLocaleString()} ₽` : '0 ₽';
    }
    
    const amountInput = document.getElementById('return-amount');
    if (amountInput && balance > 0) {
        amountInput.max = balance;
        amountInput.placeholder = `Максимум: ${balance.toLocaleString()} ₽`;
    }
}

// STEP 10.18: Сохранение возврата взноса
function saveReturnPayment(event) {
    event.preventDefault();
    try {
        Logger.info('Сохранение возврата взноса');
        
        const memberId = document.getElementById('return-member').value;
        const amount = parseFloat(document.getElementById('return-amount').value);
        const date = document.getElementById('return-date').value;
        const reason = document.getElementById('return-reason').value;
        const method = document.getElementById('return-method').value;
        
        if (!memberId) {
            alert('❌ Выберите пайщика');
            return;
        }
        
        const member = window.members.find(m => m.id == memberId);
        if (!member) {
            alert('❌ Пайщик не найден');
            return;
        }
        
        if (amount > member.balance) {
            alert(`❌ Сумма возврата не может превышать баланс пайщика (${member.balance.toLocaleString()} ₽)`);
            return;
        }
        
        if (confirm(`Подтвердите возврат ${amount.toLocaleString()} ₽ пайщику ${member.name}`)) {
            // Создаём возврат
            const returnPayment = {
                id: Date.now(),
                memberId: parseInt(memberId),
                type: 'return_share',
                amount: amount,
                date: date,
                method: method,
                paid: true,
                reason: reason,
                createdAt: new Date().toISOString()
            };
            
            // Обновляем баланс
            member.balance -= amount;
            member.operations = member.operations || [];
            member.operations.push({
                id: Date.now(),
                type: 'Возврат паевог�� взноса',
                amount: amount,
                date: date,
                description: reason,
                status: 'paid'
            });
            
            // Сохраняем
            if (!window.payments) window.payments = [];
            window.payments.push(returnPayment);
            
            saveData();
            renderChats();
            updateStats();
            
            Logger.info('Возвр��т оформлен', { memberId, amount });
            showToast({ type: 'success', message: `Возврат ${amount.toLocaleString()} ₽ оформлен!` });
            closeSideMenu();
        }
    } catch (error) {
        Logger.error('Ошибка оформления возврата', error);
        showToast({ type: 'error', message: 'Ошибка при оформлении возврата' });
    }
}

// STEP 10.19: Платёжное поручение
function createPaymentOrder() {
    Logger.info('Создание платёжного поручения');
    
    const today = new Date().toISOString().split('T')[0];
    const paymentNumber = Date.now().toString().substring(6);
    
    const content = `
        <div style="padding:20px;max-height:600px;overflow-y:auto;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">ПЛАТЁЖНОЕ ПОРУЧЕНИЕ № ${paymentNumber}</h2>
            
            <form id="create-payment-order-form" onsubmit="savePaymentOrder(event)">
                <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:15px">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
                        <div>
                            <label style="display:block;margin-bottom:5px;font-weight:600">Дата *</label>
                            <input type="date" id="payment-order-date" required 
                                   value="${today}" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:5px;font-weight:600">№ документа</label>
                            <input type="text" id="payment-order-number" 
                                   value="${paymentNumber}" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Сумма (₽) *</label>
                    <input type="number" id="payment-order-amount" required min="1" step="0.01" 
                           placeholder="0.00" 
                           style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;font-weight:600">
                </div>
                
                <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:15px">
                    <h4 style="margin:0 0 10px 0;font-size:13px">📤 Плательщик</h4>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Наименование</label>
                        <input type="text" id="payment-order-payer-name" 
                               value="${cooperativeSettings?.shortName || 'Потребительский кооператив'}" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:10px">
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">ИНН</label>
                            <input type="text" id="payment-order-payer-inn" 
                                   value="${cooperativeSettings?.inn || ''}" 
                                   pattern="[0-9]{10,12}" 
                                   placeholder="10-12 цифр" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">КПП</label>
                            <input type="text" id="payment-order-payer-kpp" 
                                   value="${cooperativeSettings?.kpp || ''}" 
                                   pattern="[0-9]{9}" 
                                   placeholder="9 цифр" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                    </div>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Расчётн��й счёт *</label>
                        <input type="text" id="payment-order-payer-account" required 
                               pattern="[0-9]{20}" 
                               placeholder="20 цифр" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Банк плательщика</label>
                        <input type="text" id="payment-order-payer-bank" 
                               placeholder="Название банка" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;font-size:11px">БИК *</label>
                        <input type="text" id="payment-order-payer-bik" required 
                               pattern="[0-9]{9}" 
                               placeholder="9 цифр" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                </div>
                
                <div style="background:#e8f5e9;padding:15px;border-radius:6px;margin-bottom:15px">
                    <h4 style="margin:0 0 10px 0;font-size:13px">📥 Получатель</h4>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Наименование *</label>
                        <input type="text" id="payment-order-payee-name" required 
                               placeholder="ООО «Ромашка»" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:10px">
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">ИНН *</label>
                            <input type="text" id="payment-order-payee-inn" required 
                                   pattern="[0-9]{10,12}" 
                                   placeholder="10-12 цифр" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">КПП</label>
                            <input type="text" id="payment-order-payee-kpp" 
                                   pattern="[0-9]{9}" 
                                   placeholder="9 цифр" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                    </div>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Расчётный счёт *</label>
                        <input type="text" id="payment-order-payee-account" required 
                               pattern="[0-9]{20}" 
                               placeholder="20 цифр" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Банк получателя</label>
                        <input type="text" id="payment-order-payee-bank" 
                               placeholder="Название банка" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;font-size:11px">БИК *</label>
                        <input type="text" id="payment-order-payee-bik" required 
                               pattern="[0-9]{9}" 
                               placeholder="9 цифр" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Назначение платежа *</label>
                    <textarea id="payment-order-purpose" required rows="3" 
                              placeholder="Оплата по договору №__ от ______&#10;Без НДС" 
                              style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px"></textarea>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Вид платежа</label>
                    <select id="payment-order-type" 
                            style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="electronic">Электронно</option>
                        <option value="paper">На бумажном носителе</option>
                    </select>
                </div>
                
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="printPaymentOrder()" style="flex:1;padding:12px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Платёжное поручение', content);
}

// STEP 10.20: Сохранение платёжного поручения
function savePaymentOrder(event) {
    event.preventDefault();
    try {
        Logger.info('Сохранение платёжного поручения');
        
        const paymentOrder = {
            id: Date.now(),
            date: document.getElementById('payment-order-date').value,
            number: document.getElementById('payment-order-number').value,
            amount: parseFloat(document.getElementById('payment-order-amount').value),
            type: document.getElementById('payment-order-type').value,
            payer: {
                name: document.getElementById('payment-order-payer-name').value,
                inn: document.getElementById('payment-order-payer-inn').value,
                kpp: document.getElementById('payment-order-payer-kpp').value,
                account: document.getElementById('payment-order-payer-account').value,
                bank: document.getElementById('payment-order-payer-bank').value,
                bik: document.getElementById('payment-order-payer-bik').value
            },
            payee: {
                name: document.getElementById('payment-order-payee-name').value,
                inn: document.getElementById('payment-order-payee-inn').value,
                kpp: document.getElementById('payment-order-payee-kpp').value,
                account: document.getElementById('payment-order-payee-account').value,
                bank: document.getElementById('payment-order-payee-bank').value,
                bik: document.getElementById('payment-order-payee-bik').value
            },
            purpose: document.getElementById('payment-order-purpose').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Валидация ИНН
        if (!/^[0-9]{10,12}$/.test(paymentOrder.payer.inn)) {
            alert('❌ ИНН плательщика должен содержать 10-12 цифр');
            return;
        }
        if (!/^[0-9]{10,12}$/.test(paymentOrder.payee.inn)) {
            alert('❌ ИНН получателя должен содержать 10-12 цифр');
            return;
        }
        
        // Валидация счетов
        if (!/^[0-9]{20}$/.test(paymentOrder.payer.account)) {
            alert('❌ Расчётный счёт должен содержать 20 цифр');
            return;
        }
        if (!/^[0-9]{20}$/.test(paymentOrder.payee.account)) {
            alert('❌ Расчётный счёт получателя должен содержать 20 цифр');
            return;
        }
        
        // Валидация БИК
        if (!/^[0-9]{9}$/.test(paymentOrder.payer.bik)) {
            alert('❌ БИК должен содержать 9 цифр');
            return;
        }
        if (!/^[0-9]{9}$/.test(paymentOrder.payee.bik)) {
            alert('❌ БИК получателя должен содержать 9 цифр');
            return;
        }
        
        if (confirm(`Подтвердите платёж ${paymentOrder.amount.toLocaleString()} ₽ получателю ${paymentOrder.payee.name}`)) {
            // Сохраняем
            if (!window.paymentOrders) window.paymentOrders = [];
            window.paymentOrders.push(paymentOrder);
            
            // Создаём проводку
            const transaction = {
                id: Date.now(),
                date: paymentOrder.date,
                debitAccount: '51',
                creditAccount: '76',
                amount: paymentOrder.amount,
                description: `Платёжное поручение №${paymentOrder.number} от ${paymentOrder.date}: ${paymentOrder.purpose}`,
                type: 'payment-order',
                paymentOrderId: paymentOrder.id
            };
            
            if (!window.transactions) window.transactions = [];
            window.transactions.push(transaction);
            
            saveData();
            
            Logger.info('Платёжное поручение сохранено', { id: paymentOrder.id, amount: paymentOrder.amount });
            alert(`✅ Платёжное поручение №${paymentOrder.number} на сумму ${paymentOrder.amount.toLocaleString()} ₽ сохранено!`);
            closeSideMenu();
        }
    } catch (error) {
        Logger.error('Ошибка сохранения платёжного поручения', error);
        alert('❌ Ошибка при сохранении платёжного поручения');
    }
}

// STEP 10.21: Печать платёжного поручения
function printPaymentOrder() {
    try {
        const date = document.getElementById('payment-order-date')?.value || '';
        const number = document.getElementById('payment-order-number')?.value || '';
        const amount = document.getElementById('payment-order-amount')?.value || '0';
        const payerName = document.getElementById('payment-order-payer-name')?.value || '';
        const payerInn = document.getElementById('payment-order-payer-inn')?.value || '';
        const payerAccount = document.getElementById('payment-order-payer-account')?.value || '';
        const payerBik = document.getElementById('payment-order-payer-bik')?.value || '';
        const payerBank = document.getElementById('payment-order-payer-bank')?.value || '';
        const payeeName = document.getElementById('payment-order-payee-name')?.value || '';
        const payeeInn = document.getElementById('payment-order-payee-inn')?.value || '';
        const payeeAccount = document.getElementById('payment-order-payee-account')?.value || '';
        const payeeBik = document.getElementById('payment-order-payee-bik')?.value || '';
        const payeeBank = document.getElementById('payment-order-payee-bank')?.value || '';
        const purpose = document.getElementById('payment-order-purpose')?.value || '';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Платёжное поручение №${number}</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { font-family: 'Courier New', monospace; font-size: 11px; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { border: 1px solid #000; padding: 4px; font-size: 10px; }
                    .label { font-size: 9px; color: #666; }
                    .value { font-weight: 600; }
                    .amount { font-size: 14px; font-weight: 700; }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div style="text-align:center;margin-bottom:10px">
                    <h2 style="margin:0">ПЛАТЁЖНОЕ ПОРУЧЕНИЕ №${number}</h2>
                    <div style="font-size:10px">от ${date ? new Date(date).toLocaleDateString('ru-RU') : ''}</div>
                </div>
                
                <table>
                    <tr>
                        <td style="width:30%"><span class="label">Плательщик</span><br><span class="value">${payerName}</span></td>
                        <td style="width:10%"><span class="label">Счёт №</span><br><span class="value">${payerAccount}</span></td>
                        <td style="width:30%"><span class="label">Получатель</span><br><span class="value">${payeeName}</span></td>
                        <td style="width:10%"><span class="label">Счёт №</span><br><span class="value">${payeeAccount}</span></td>
                        <td style="width:20%"><span class="label">Сумма</span><br><span class="amount">${parseFloat(amount).toLocaleString('ru-RU')} ₽</span></td>
                    </tr>
                    <tr>
                        <td><span class="label">ИНН ${payerInn}</span></td>
                        <td><span class="label">БИК ${payerBik}</span></td>
                        <td><span class="label">ИНН ${payeeInn}</span></td>
                        <td><span class="label">БИК ${payeeBik}</span></td>
                        <td rowspan="2"><span class="label">Вид платежа</span><br>Электронно</td>
                    </tr>
                    <tr>
                        <td colspan="2"><span class="label">Банк плательщика: ${payerBank}</span></td>
                        <td colspan="2"><span class="label">Банк получателя: ${payeeBank}</span></td>
                    </tr>
                    <tr>
                        <td colspan="5"><span class="label">Назначение платежа:</span><br>${purpose}</td>
                    </tr>
                </table>
                
                <div style="margin-top:30px;display:flex;justify-content:space-between">
                    <div style="text-align:center;width:30%">
                        <div style="border-top:1px solid #000;padding-top:5px;width:100%">Руководитель</div>
                    </div>
                    <div style="text-align:center;width:30%">
                        <div style="border-top:1px solid #000;padding-top:5px;width:100%">Главный бухгалтер</div>
                    </div>
                </div>
                
                <div style="margin-top:20px;text-align:center">
                    <button onclick="window.print()" style="padding:10px 20px;background:#0088cc;color:#fff;border:none;border-radius:4px;cursor:pointer">🖨️ Печать</button>
                    <button onclick="window.close()" style="padding:10px 20px;background:#f5f7fa;border:none;border-radius:4px;cursor:pointer;margin-left:10px">Закрыть</button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        Logger.error('Ошибка печати платёжного поручения', error);
        alert('❌ Ошибка при печати');
    }
}

// STEP 11.4: Акт сверки
function createActSverka() {
    Logger.info('Создание акта сверки');
    
    const today = new Date().toISOString().split('T')[0];
    const members = window.members || [];
    
    const content = `
        <div style="padding:20px;max-height:600px;overflow-y:auto">
            <h2 style="text-align:center;margin-bottom:20px">📊 АКТ СВЕРКИ</h2>
            
            <form id="create-act-sverka-form" onsubmit="generateActSverka(event)">
                <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:15px">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
                        <div>
                            <label style="display:block;margin-bottom:5px;font-weight:600">Дата составления *</label>
                            <input type="date" id="act-sverka-date" required 
                                   value="${today}" 
                                   style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:5px;font-weight:600">Период *</label>
                            <select id="act-sverka-period" 
                                    style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                                <option value="month">За месяц</option>
                                <option value="quarter">За квартал</option>
                                <option value="year" selected>За год</option>
                                <option value="all">За всё время</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Контрагент *</label>
                    <select id="act-sverka-counterparty" required 
                            style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="">Выберите контрагента</option>
                        <optgroup label="Пайщики">
                            ${members.map(m => `
                                <option value="member-${m.id}">${Security.escapeHtml(m.name)}</option>
                            `).join('')}
                        </optgroup>
                        <optgroup label="Организации">
                            <option value="org-1">ООО "Поставщик"</option>
                            <option value="org-2">АО "Банк"</option>
                            <option value="org-3">ИФНС №1</option>
                        </optgroup>
                    </select>
                </div>
                
                <div style="background:#e8f5e9;padding:15px;border-radius:6px;margin-bottom:15px">
                    <h4 style="margin:0 0 10px 0;font-size:13px">📤 Наша организация</h4>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Наименование</label>
                        <input type="text" id="act-sverka-our-name" 
                               value="${cooperativeSettings?.shortName || 'Потребительский кооператив'}" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">ИНН</label>
                            <input type="text" id="act-sverka-our-inn" 
                                   value="${cooperativeSettings?.inn || ''}" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">КПП</label>
                            <input type="text" id="act-sverka-our-kpp" 
                                   value="${cooperativeSettings?.kpp || ''}" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                    </div>
                </div>
                
                <div style="background:#fff3e0;padding:15px;border-radius:6px;margin-bottom:15px">
                    <h4 style="margin:0 0 10px 0;font-size:13px">📥 Контрагент</h4>
                    <div style="margin-bottom:10px">
                        <label style="display:block;margin-bottom:5px;font-size:11px">Наименование *</label>
                        <input type="text" id="act-sverka-counterparty-name" required 
                               placeholder="Наименование контрагента" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">ИНН</label>
                            <input type="text" id="act-sverka-counterparty-inn" 
                                   pattern="[0-9]{10,12}" 
                                   placeholder="10-12 цифр" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                        <div>
                            <label style="display:block;margin-bottom:5px;font-size:11px">КПП</label>
                            <input type="text" id="act-sverka-counterparty-kpp" 
                                   pattern="[0-9]{9}" 
                                   placeholder="9 цифр" 
                                   style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                        </div>
                    </div>
                </div>
                
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">📊 Сформировать</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Акт сверки', content);
}

// STEP 11.5: Генерация акта сверки
function generateActSverka(event) {
    event.preventDefault();
    try {
        Logger.info('Генерация акта сверки');
        
        const date = document.getElementById('act-sverka-date').value;
        const period = document.getElementById('act-sverka-period').value;
        const counterpartyName = document.getElementById('act-sverka-counterparty-name').value;
        const ourName = document.getElementById('act-sverka-our-name').value;
        const ourInn = document.getElementById('act-sverka-our-inn').value;
        const ourKpp = document.getElementById('act-sverka-our-kpp').value;
        const counterpartyInn = document.getElementById('act-sverka-counterparty-inn').value;
        const counterpartyKpp = document.getElementById('act-sverka-counterparty-kpp').value;
        
        const periodTexts = {
            'month': 'За месяц',
            'quarter': 'За квартал',
            'year': 'За год',
            'all': 'За всё время'
        };
        
        const debit = Math.floor(Math.random() * 100000);
        const credit = Math.floor(Math.random() * 100000);
        const saldo = debit - credit;
        
        const content = `
            <div style="padding:30px;font-family:'Courier New',monospace;font-size:12px">
                <div style="text-align:center;margin-bottom:20px">
                    <h2 style="margin:0">АКТ СВЕРКИ</h2>
                    <div style="font-size:11px">взаиморасчётов на ${new Date(date).toLocaleDateString('ru-RU')}</div>
                </div>
                
                <div style="margin-bottom:20px">
                    <p><strong>Организация 1 (Мы):</strong> ${Security.escapeHtml(ourName)}</p>
                    <p><strong>ИНН:</strong> ${Security.escapeHtml(ourInn)} <strong>КПП:</strong> ${Security.escapeHtml(ourKpp)}</p>
                    <p><strong>Организация 2:</strong> ${Security.escapeHtml(counterpartyName)}</p>
                    <p><strong>ИНН:</strong> ${Security.escapeHtml(counterpartyInn || '—')} <strong>КПП:</strong> ${Security.escapeHtml(counterpartyKpp || '—')}</p>
                    <p><strong>Период:</strong> ${periodTexts[period]}</p>
                </div>
                
                <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px">
                    <thead>
                        <tr style="background:#f5f7fa">
                            <th style="padding:8px;border:1px solid #000;text-align:left">№</th>
                            <th style="padding:8px;border:1px solid #000;text-align:left">Дата</th>
                            <th style="padding:8px;border:1px solid #000;text-align:left">Операция</th>
                            <th style="padding:8px;border:1px solid #000;text-align:right">Дебет</th>
                            <th style="padding:8px;border:1px solid #000;text-align:right">Кредит</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="padding:8px;border:1px solid #000;text-align:center">1</td><td style="padding:8px;border:1px solid #000">01.01.2026</td><td style="padding:8px;border:1px solid #000">Входящее сальдо</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td></tr>
                        <tr><td style="padding:8px;border:1px solid #000;text-align:center">2</td><td style="padding:8px;border:1px solid #000">${new Date(date).toLocaleDateString('ru-RU')}</td><td style="padding:8px;border:1px solid #000">Поступление</td><td style="padding:8px;border:1px solid #000;text-align:right">${debit.toLocaleString()}</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td></tr>
                        <tr><td style="padding:8px;border:1px solid #000;text-align:center">3</td><td style="padding:8px;border:1px solid #000">${new Date(date).toLocaleDateString('ru-RU')}</td><td style="padding:8px;border:1px solid #000">Выплата</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td><td style="padding:8px;border:1px solid #000;text-align:right">${credit.toLocaleString()}</td></tr>
                        <tr style="background:#e3f2fd;font-weight:600"><td style="padding:8px;border:1px solid #000;text-align:center" colspan="3">Итого</td><td style="padding:8px;border:1px solid #000;text-align:right">${debit.toLocaleString()}</td><td style="padding:8px;border:1px solid #000;text-align:right">${credit.toLocaleString()}</td></tr>
                    </tbody>
                </table>
                
                <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:20px">
                    <h3 style="margin:0 0 10px 0;font-size:13px">Сальдо</h3>
                    <div style="font-size:18px;font-weight:700;color:${saldo >= 0 ? '#2e7d32' : '#c62828'}">
                        ${saldo >= 0 ? 'Дебиторская' : 'Кредиторская'} задолженность: ${Math.abs(saldo).toLocaleString()} ₽
                    </div>
                </div>
                
                <div style="margin-top:30px;display:flex;justify-content:space-between">
                    <div style="text-align:center;width:45%"><p style="margin:0 0 10px 0;font-size:11px">Организация 1</p><div style="border-top:1px solid #000;padding-top:5px;width:100%;font-size:10px">Подпись</div></div>
                    <div style="text-align:center;width:45%"><p style="margin:0 0 10px 0;font-size:11px">Организация 2</p><div style="border-top:1px solid #000;padding-top:5px;width:100%;font-size:10px">Подпись</div></div>
                </div>
                
                <div style="margin-top:20px;display:flex;gap:10px">
                    <button onclick="window.print()" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                    <button onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
                </div>
            </div>
        `;
        
        showLargeReport('Акт сверки', content);
        Logger.info('Акт сверки сформирован', { period });
    } catch (error) {
        Logger.error('Ошибка генерации акта сверки', error);
        alert('❌ Ошибка при формировании акта сверки');
    }
}

// STEP 11.6: Счёт на оплату
function createInvoice() {
    Logger.info('Создание счёта на оплату');
    
    const today = new Date().toISOString().split('T')[0];
    const invoiceNumber = Date.now().toString().substring(6);
    
    const content = `
        <div style="padding:20px;max-height:600px;overflow-y:auto;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">📄 СЧЁТ НА ОПЛАТУ № ${invoiceNumber}</h2>
            <form id="create-invoice-form" onsubmit="saveInvoice(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Сумма (₽) *</label>
                    <input type="number" id="invoice-amount" required min="1" placeholder="0.00" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;font-weight:600">
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Назначение *</label>
                    <textarea id="invoice-purpose" required rows="3" placeholder="Оплата по договору №__" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px"></textarea>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    showInSideMenu('Счёт на оплату', content);
}

// STEP 11.7: Сохранение счёта на оплату
function saveInvoice(event) {
    event.preventDefault();
    try {
        const invoice = {
            id: Date.now(),
            date: document.getElementById('invoice-date')?.value || new Date().toISOString().split('T')[0],
            number: Date.now().toString().substring(6),
            amount: parseFloat(document.getElementById('invoice-amount').value),
            purpose: document.getElementById('invoice-purpose').value,
            status: 'pending'
        };
        if (!window.invoices) window.invoices = [];
        window.invoices.push(invoice);
        saveData();
        Logger.info('Счёт на оплату сохранён', { id: invoice.id });
        alert(`✅ Счёт №${invoice.number} на сумму ${invoice.amount.toLocaleString()} ₽ сохранён!`);
        closeSideMenu();
    } catch (error) {
        Logger.error('Ошибка сохранения счёта', error);
        alert('❌ Ошибка при сохранении счёта');
    }
}

// STEP 11.8: Нулевая отчётность - главное меню
function showZeroReportingMenu() {
    Logger.info('Открытие меню нулевой отчётности');
    
    const content = `
        <div style="padding:20px">
            <h2 style="margin-bottom:20px;text-align:center">📄 Нулевая отчётность</h2>
            <p style="color:#666;margin-bottom:20px;text-align:center">Выберите форму для формирования</p>
            
            <div style="display:grid;gap:10px">
                <button onclick="generateUSNZero()" style="padding:15px;background:#e3f2fd;border:none;border-radius:6px;cursor:pointer;text-align:left;font-weight:600">📋 Декларация УСН (нулевая)</button>
                <button onclick="generateBalanceZero()" style="padding:15px;background:#e8f5e9;border:none;border-radius:6px;cursor:pointer;text-align:left;font-weight:600">⚖️ Бухгалтерский баланс (нулевой)</button>
                <button onclick="generateSZVZero()" style="padding:15px;background:#fff3e0;border:none;border-radius:6px;cursor:pointer;text-align:left;font-weight:600">📊 СЗВ-СТАЖ (нулевой)</button>
                <button onclick="generateRSVZero()" style="padding:15px;background:#fce4ec;border:none;border-radius:6px;cursor:pointer;text-align:left;font-weight:600">📊 РСВ (нулевой)</button>
                <button onclick="generateSrednZero()" style="padding:15px;background:#f5f5f5;border:none;border-radius:6px;cursor:pointer;text-align:left;font-weight:600">👥 Среднесписочная (нулевая)</button>
            </div>
            
            <div style="margin-top:20px;padding:15px;background:#f5f7fa;border-radius:6px">
                <p style="margin:0;font-size:12px;color:#666">Нулевая отчётность сдаётся при отсутствии деятельности</p>
            </div>
            <button onclick="closeSideMenu()" style="width:100%;margin-top:15px;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
        </div>
    `;
    showInSideMenu('Нулевая отчётность', content);
}

// STEP 11.9: Декларация УСН (нулевая)
function generateUSNZero() {
    Logger.info('Генерация нулевой декларации УСН');
    const year = new Date().getFullYear() - 1;
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings?.inn || '______________';
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:11px">
            <div style="text-align:center;margin-bottom:20px"><h2 style="margin:0">НАЛОГОВАЯ ДЕКЛАРАЦИЯ</h2><div style="font-size:10px">по УСН за ${year} год</div></div>
            <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${Security.escapeHtml(orgName)}</p>
                <p style="margin:5px 0"><strong>ИНН:</strong> ${Security.escapeHtml(inn)}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr style="background:#f5f5f5"><th style="padding:8px;border:1px solid #000;text-align:left">Показатель</th><th style="padding:8px;border:1px solid #000;text-align:right">Значение</th></tr>
                <tr><td style="padding:8px;border:1px solid #000">Доходы</td><td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td></tr>
                <tr><td style="padding:8px;border:1px solid #000">Налоговая база</td><td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td></tr>
                <tr><td style="padding:8px;border:1px solid #000">Налог к уплате (6%)</td><td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td></tr>
            </table>
            <div style="margin-top:30px;display:flex;gap:10px">
                <button onclick="window.print()" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                <button onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
            </div>
        </div>
    `;
    showLargeReport('Декларация УСН (нулевая)', content);
}

// STEP 11.10: Баланс (нулевой)
function generateBalanceZero() {
    Logger.info('Генерация нулевого баланса');
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:11px">
            <div style="text-align:center;margin-bottom:20px"><h2 style="margin:0">БУХГАЛТЕРСКИЙ БАЛАНС</h2><div style="font-size:10px">Форма №1 (нулевой)</div></div>
            <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${Security.escapeHtml(orgName)}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr style="background:#f5f5f5"><th style="padding:8px;border:1px solid #000;text-align:left">Показатель</th><th style="padding:8px;border:1px solid #000;text-align:right">Сумма</th></tr>
                <tr><td style="padding:8px;border:1px solid #000">АКТИВ</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td></tr>
                <tr><td style="padding:8px;border:1px solid #000">ПАССИВ</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td></tr>
            </table>
            <div style="margin-top:30px;display:flex;gap:10px">
                <button onclick="window.print()" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                <button onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
            </div>
        </div>
    `;
    showLargeReport('Баланс (нулевой)', content);
}

// STEP 11.11: СЗВ-СТАЖ (нулевой)
function generateSZVZero() {
    Logger.info('Генерация нулевого СЗВ-СТАЖ');
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:11px">
            <div style="text-align:center;margin-bottom:20px"><h2 style="margin:0">СЗВ-СТАЖ</h2><div style="font-size:10px">нулевой</div></div>
            <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${Security.escapeHtml(orgName)}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr style="background:#f5f5f5"><th style="padding:8px;border:1px solid #000">№</th><th style="padding:8px;border:1px solid #000;text-align:left">ФИО</th><th style="padding:8px;border:1px solid #000">СНИЛС</th></tr>
                <tr><td colspan="3" style="padding:20px;text-align:center;color:#999">Застрахованные лица отсутствуют</td></tr>
            </table>
            <div style="margin-top:30px;display:flex;gap:10px">
                <button onclick="window.print()" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                <button onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
            </div>
        </div>
    `;
    showLargeReport('СЗВ-СТАЖ (нулевой)', content);
}

// STEP 11.12: РСВ (нулевой)
function generateRSVZero() {
    Logger.info('Генерация нулевого РСВ');
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:11px">
            <div style="text-align:center;margin-bottom:20px"><h2 style="margin:0">РСВ</h2><div style="font-size:10px">нулевой</div></div>
            <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${Security.escapeHtml(orgName)}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr style="background:#f5f5f5"><th style="padding:8px;border:1px solid #000;text-align:left">Показатель</th><th style="padding:8px;border:1px solid #000;text-align:right">Значение</th></tr>
                <tr><td style="padding:8px;border:1px solid #000">Численность</td><td style="padding:8px;border:1px solid #000;text-align:right">0</td></tr>
                <tr><td style="padding:8px;border:1px solid #000">Взносы к уплате</td><td style="padding:8px;border:1px solid #000;text-align:right">0 ₽</td></tr>
            </table>
            <div style="margin-top:30px;display:flex;gap:10px">
                <button onclick="window.print()" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                <button onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
            </div>
        </div>
    `;
    showLargeReport('РСВ (нулевой)', content);
}

// STEP 11.13: Среднесписочная (нулевая)
function generateSrednZero() {
    Logger.info('Генерация нулевой среднесписочной');
    const orgName = cooperativeSettings?.shortName || 'Потребительский кооператив';
    
    const content = `
        <div style="padding:30px;font-family:'Courier New',monospace;font-size:11px">
            <div style="text-align:center;margin-bottom:20px"><h2 style="margin:0">СРЕДНЕСПИСОЧНАЯ ЧИСЛЕННОСТЬ</h2><div style="font-size:10px">нулевая</div></div>
            <div style="background:#f5f7fa;padding:15px;border-radius:6px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${Security.escapeHtml(orgName)}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                <tr style="background:#f5f5f5"><th style="padding:8px;border:1px solid #000;text-align:left">Показатель</th><th style="padding:8px;border:1px solid #000;text-align:right">Значение</th></tr>
                <tr><td style="padding:8px;border:1px solid #000">Среднесписочная численность</td><td style="padding:8px;border:1px solid #000;text-align:right">0 чел.</td></tr>
            </table>
            <div style="margin-top:30px;display:flex;gap:10px">
                <button onclick="window.print()" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">🖨️ Печать</button>
                <button onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Закрыть</button>
            </div>
        </div>
    `;
    showLargeReport('Среднесписочная (нулевая)', content);
}

function createMeeting() {
    Logger.info('Создание протокола собрания');
    
    const members = window.members || [];
    const today = new Date().toISOString().split('T')[0];
    
    const content = `
        <div style="padding:20px;max-height:600px;overflow-y:auto">
            <h3 style="margin-bottom:20px">📝 Протокол собрания</h3>
            <form id="create-meeting-form" onsubmit="saveNewMeeting(event)">
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Тип собрания *</label>
                    <select id="meeting-type" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px">
                        <option value="general">Общее собрание</option>
                        <option value="council">Совета кооператива</option>
                        <option value="board">Правления</option>
                        <option value="area">Кооперативного участка</option>
                    </select>
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">
                    <div>
                        <label style="display:block;margin-bottom:5px;font-weight:600">Дата проведения *</label>
                        <input type="date" id="meeting-date" required value="${today}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;font-weight:600">Время начала *</label>
                        <input type="time" id="meeting-time" required value="10:00" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                    </div>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Место проведения *</label>
                    <input type="text" id="meeting-location" required value="г. Москва, ул. Примерная, д. 1" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Адрес проведения">
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Председательствующий *</label>
                    <input type="text" id="meeting-chairman" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Иванов Иван Иванович">
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Секретарь *</label>
                    <input type="text" id="meeting-secretary" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Петрова Мария Сергеевна">
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Члены правления / присутствующие</label>
                    <div id="members-container" style="margin-bottom:10px">
                        <div style="display:flex;gap:10px;margin-bottom:8px">
                            <input type="text" class="member-name-input" required style="flex:1;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="ФИО члена">
                            <button type="button" onclick="this.parentElement.parentElement.remove()" style="padding:10px 15px;background:#ffebee;color:#c62828;border:none;border-radius:6px;cursor:pointer">🗑️</button>
                        </div>
                    </div>
                    <button type="button" onclick="addMemberField()" style="width:100%;padding:10px;background:#e8f5e9;color:#2e7d32;border:none;border-radius:6px;cursor:pointer;font-weight:600">➕ Добавить члена</button>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Тема собрания *</label>
                    <input type="text" id="meeting-topic" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Например: Утверждение годового отчёта">
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Повестка дня *</label>
                    <textarea id="meeting-agenda" required rows="4" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="1. Утверждение отчёта правления&#10;2. Распределение прибыли&#10;3. Избрание председателя"></textarea>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Ход заседания *</label>
                    <textarea id="meeting-proceedings" required rows="6" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="Описание хода заседания, выступлений, обсуждений..."></textarea>
                </div>
                
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Решения собрания</label>
                    <textarea id="meeting-decisions" rows="4" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="1. Утвердить годовой отчёт&#10;2. Распределить прибыль согласно уставу"></textarea>
                </div>
                
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить протокол</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Создание протокола', content);
}

// STEP 11.1: Добавление поля для члена
function addMemberField() {
    const container = document.getElementById('members-container');
    if (container) {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;gap:10px;margin-bottom:8px';
        div.innerHTML = `
            <input type="text" class="member-name-input" required style="flex:1;padding:10px;border:1px solid #e0e0e0;border-radius:6px" placeholder="ФИО члена">
            <button type="button" onclick="this.parentElement.remove()" style="padding:10px 15px;background:#ffebee;color:#c62828;border:none;border-radius:6px;cursor:pointer">🗑️</button>
        `;
        container.appendChild(div);
    }
}

// STEP 11.2: Сохранение нового протокола собрания
function saveNewMeeting(event) {
    event.preventDefault();
    try {
        const type = document.getElementById('meeting-type').value;
        const date = document.getElementById('meeting-date').value;
        const time = document.getElementById('meeting-time').value;
        const location = document.getElementById('meeting-location').value;
        const chairman = document.getElementById('meeting-chairman').value;
        const secretary = document.getElementById('meeting-secretary').value;
        const topic = document.getElementById('meeting-topic').value;
        const agenda = document.getElementById('meeting-agenda').value;
        const proceedings = document.getElementById('meeting-proceedings').value;
        const decisions = document.getElementById('meeting-decisions').value;
        
        // Со��ираем ��ленов
        const memberInputs = document.querySelectorAll('.member-name-input');
        const attendingMembers = Array.from(memberInputs)
            .map(input => input.value.trim())
            .filter(name => name);
        
        const typeNames = {
            'general': 'Общее собрание',
            'council': 'Совета кооператива',
            'board': 'Правления',
            'area': 'Кооперативного участка'
        };
        
        const newMeeting = {
            id: Date.now(),
            type: type,
            typeName: typeNames[type],
            date: date,
            time: time,
            location: location,
            chairman: chairman,
            secretary: secretary,
            topic: topic,
            agenda: agenda,
            proceedings: proceedings,
            decisions: decisions,
            attendingMembers: attendingMembers,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        
        if (!window.meetings) window.meetings = [];
        window.meetings.push(newMeeting);
        
        saveData();
        
        Logger.info('Протокол собрания сохранён', { type, date });
        alert(`✅ Протокол ${typeNames[type]} от ${date} сохранён!`);
        closeSideMenu();
        
        // Открываем просмотр протокола
        viewMeetingProtocol(newMeeting);
        
    } catch (error) {
        Logger.error('Ошибка сохранения протокола', error);
        alert('❌ Ошибка при сохранении протокола');
    }
}

// STEP 11.3: Просмотр протокола собрания
function viewMeetingProtocol(meeting) {
    const content = `
        <div style="padding:30px;font-family:'Times New Roman',serif">
            <h2 style="text-align:center;margin-bottom:10px">ПРОТОКОЛ №${window.meetings?.filter(m => m.type === meeting.type).length || 1}</h2>
            <p style="text-align:center;margin-bottom:30px">${meeting.typeName}</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px;font-size:14px">
                <p><strong>Дата:</strong> ${new Date(meeting.date).toLocaleDateString('ru-RU')}</p>
                <p><strong>Время:</strong> ${meeting.time}</p>
                <p><strong>Место:</strong> ${meeting.location}</p>
            </div>
            
            <div style="margin-bottom:20px">
                <p><strong>Председательствующий:</strong> ${meeting.chairman}</p>
                <p><strong>Секретарь:</strong> ${meeting.secretary}</p>
                <p><strong>Присутствовали:</strong></p>
                <ul style="margin-top:5px;padding-left:20px">
                    ${(meeting.attendingMembers || []).map(m => `<li>${m}</li>`).join('')}
                </ul>
            </div>
            
            <div style="margin-bottom:20px">
                <h3 style="border-bottom:2px solid #333;padding-bottom:5px">ПОВЕСТКА ДНЯ</h3>
                <div style="white-space:pre-line;margin-top:10px">${meeting.agenda}</div>
            </div>
            
            <div style="margin-bottom:20px">
                <h3 style="border-bottom:2px solid #333;padding-bottom:5px">��ОД ЗАС��ДАНИЯ</h3>
                <div style="white-space:pre-line;margin-top:10px">${meeting.proceedings}</div>
            </div>
            
            <div style="margin-bottom:20px">
                <h3 style="border-bottom:2px solid #333;padding-bottom:5px">РЕШЕНИЯ СОБРАНИЯ</h3>
                <div style="white-space:pre-line;margin-top:10px">${meeting.decisions || 'Не приняты'}</div>
            </div>
            
            <div style="margin-top:40px;display:flex;justify-content:space-between">
                <div style="text-align:center">
                    <div style="border-top:1px solid #000;padding-top:5px;width:200px">${meeting.chairman}</div>
                    <div style="font-size:12px;color:#666">Председательствующий</div>
                </div>
                <div style="text-align:center">
                    <div style="border-top:1px solid #000;padding-top:5px;width:200px">${meeting.secretary}</div>
                    <div style="font-size:12px;color:#666">Секретарь</div>
                </div>
            </div>
            
            <div style="margin-top:30px;display:flex;gap:10px">
                <button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="printDocument('meeting-protocol-${meeting.id}')">🖨️ Печать</button>
                <button style="padding:12px 24px;background:#4caf50;color:#fff;border:none;border-radius:6px;cursor:pointer" onclick="downloadPDF('meeting-protocol-${meeting.id}')">💾 PDF</button>
            </div>
        </div>
    `;
    
    showLargeReport(`Протокол ${meeting.typeName}`, content);
}

function showMemberInfo() {
    try {
        Logger.info('Показать информацию о пайщике');
        
        if (!currentMember) {
            Logger.warn('Пайщик не выбран');
            return;
        }
        
        const m = currentMember;
        const content = `
            <div style="text-align:center;margin-bottom:20px">
                <div style="width:80px;height:80px;border-radius:50%;background:${m.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin:0 auto 15px">${Security.escapeHtml(m.avatar)}</div>
                <h3>${Security.escapeHtml(m.name)}</h3>
                <p style="color:#666">${Security.escapeHtml(m.statusText || '')}</p>
            </div>
            <div style="background:linear-gradient(135deg,#0088cc,#0066aa);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px">
                <div style="font-size:13px;opacity:0.9">Баланс</div>
                <div style="font-size:28px;font-weight:700">${m.balance >= 0 ? '+' : ''}${m.balance.toLocaleString()} ₽</div>
            </div>
            <div>
                <div style="padding:12px 0;border-bottom:1px solid #f0f0f0"><strong>📞</strong> ${Security.escapeHtml(m.phone || '')}</div>
                <div style="padding:12px 0;border-bottom:1px solid #f0f0f0"><strong>✉️</strong> ${Security.escapeHtml(m.email || '')}</div>
            </div>
        `;
        
        const memberInfoContent = document.getElementById('memberInfoContent');
        const sidebarRight = document.getElementById('sidebarRight');
        
        if (memberInfoContent) memberInfoContent.innerHTML = content;
        if (sidebarRight) sidebarRight.classList.add('visible');
        
        hideFab();
    } catch (error) {
        Logger.error('Ошибка показа информации', error);
    }
}

// Делаем функцию доступной глобально для onclick из HTML
window.showOperationDetails = function showOperationDetails(opId) {
    try {
        Logger.info('Детали операции', { opId });

        if (!currentMember || !currentMember.operations) {
            Logger.warn('Операции не найдены');
            return;
        }
        
        const op = currentMember.operations.find(o => o.id === opId);
        if (!op) {
            Logger.warn('Операция не найдена', { opId });
            return;
        }
        
        const statusText = op.status === 'paid' ? '✓ Оплачено' : op.status === 'overdue' ? '⚠ Просрочено' : '⏳ Ожидается';
        
        const content = `
            <div class="detail-tabs">
                <button class="detail-tab active">Основное</button>
                <button class="detail-tab">Бухгалтерия</button>
            </div>
            <div style="margin-top:20px">
                <div style="margin-bottom:16px">
                    <div style="font-size:12px;color:#666;margin-bottom:6px">Тип операции</div>
                    <div style="padding:10px;background:#e3f2fd;border-radius:8px;color:#0088cc;font-weight:600">${Security.escapeHtml(op.type || '')}</div>
                </div>
                <div style="margin-bottom:16px">
                    <div style="font-size:12px;color:#666;margin-bottom:6px">Сумма</div>
                    <div style="padding:10px;background:#e3f2fd;border-radius:8px;color:#0088cc;font-weight:600">${op.amount ? op.amount.toLocaleString() + ' ₽' : '—'}</div>
                </div>
                <div style="margin-bottom:16px">
                    <div style="font-size:12px;color:#666;margin-bottom:6px">Дата</div>
                    <div style="padding:10px;background:#f5f7fa;border-radius:8px">${Security.escapeHtml(op.date || '')}</div>
                </div>
                <div style="margin-bottom:16px">
                    <div style="font-size:12px;color:#666;margin-bottom:6px">Описание</div>
                    <div style="padding:10px;background:#f5f7fa;border-radius:8px">${Security.escapeHtml(op.description || '')}</div>
                </div>
                <div style="margin-bottom:16px">
                    <div style="font-size:12px;color:#666;margin-bottom:6px">Статус</div>
                    <div style="padding:10px;background:#f5f7fa;border-radius:8px">${statusText}</div>
                </div>
            </div>
        `;
        
        const detailsTitle = document.getElementById('detailsTitle');
        const detailsContent = document.getElementById('detailsContent');
        const operationDetailsPanel = document.getElementById('operationDetailsPanel');
        
        if (detailsTitle) detailsTitle.textContent = 'Детали операции';
        if (detailsContent) detailsContent.innerHTML = content;
        if (operationDetailsPanel) operationDetailsPanel.classList.add('visible');
        
        hideFab();
    } catch (error) {
        Logger.error('О��ибка показа деталей', error);
    }
}

// Экспорт функций глобально
window.messengerApp = {
    Logger: Logger,
    Security: Security,
    loadData: loadData,
    saveData: saveData,
    renderChats: renderChats,
    updateStats: updateStats
};

// Экспорт функции открытия отчетов глобально
window.openReportById = openReportById;

// Экспорт вспомогательных функций для отчётов
window.switchReportView = switchReportView;
window.printReport = printReport;
window.downloadReport = downloadReport;

// Экспорт функций редактирования пайщика
window.editMember = editMember;
window.updateMember = updateMember;
window.showEditMemberDialog = showEditMemberDialog;
window.editMemberFromSelect = editMemberFromSelect;

// Экспорт функций возврата взноса
window.createReturnPayment = createReturnPayment;
window.updateReturnMaxAmount = updateReturnMaxAmount;
window.saveReturnPayment = saveReturnPayment;

// Экспорт функций платёжного поручения
window.createPaymentOrder = createPaymentOrder;
window.savePaymentOrder = savePaymentOrder;
window.printPaymentOrder = printPaymentOrder;

// Экспорт функций акта сверки
window.createActSverka = createActSverka;
window.generateActSverka = generateActSverka;

// Экспорт функций счёта на оплату
window.createInvoice = createInvoice;
window.saveInvoice = saveInvoice;

// Экспорт функций нулевой отчётности
window.showZeroReportingMenu = showZeroReportingMenu;
window.generateUSNZero = generateUSNZero;
window.generateBalanceZero = generateBalanceZero;
window.generateSZVZero = generateSZVZero;
window.generateRSVZero = generateRSVZero;
window.generateSrednZero = generateSrednZero;

// Экспорт функций календаря
window.addCalendarEvent = addCalendarEvent;
window.saveCalendarEvent = saveCalendarEvent;

// STEP 12: TOAST УВЕДОМЛЕНИЯ
function showToast(options) {
    const { type = 'info', message, duration = 3000 } = options;
    
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    
    // Автоудаление
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Замена alert на showToast
function showAlert(message, type = 'info') {
    showToast({ type, message });
}

// STEP 12.1: INDOCTOR ЗАГРУЗКИ
function showLoader(message = 'Загрузка...') {
    const overlay = document.getElementById('loaderOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoader() {
    const overlay = document.getElementById('loaderOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// STEP 13: МАССОВЫЕ ОПЕРАЦИИ
let selectedMembers = new Set();
let massSelectionMode = false;

function toggleMassSelection() {
    massSelectionMode = !massSelectionMode;
    document.querySelectorAll('.chat-item').forEach(item => {
        if (massSelectionMode) {
            item.classList.add('selectable');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'chat-checkbox';
            checkbox.onclick = (e) => {
                e.stopPropagation();
                const memberId = item.dataset.id;
                if (checkbox.checked) {
                    selectedMembers.add(memberId);
                } else {
                    selectedMembers.delete(memberId);
                }
                updateMassPanel();
            };
            item.appendChild(checkbox);
        } else {
            item.classList.remove('selectable');
            const checkbox = item.querySelector('.chat-checkbox');
            if (checkbox) checkbox.remove();
        }
    });
    clearMassSelection();
    showToast({ 
        type: 'info', 
        message: massSelectionMode ? 'Режим выбора включён' : 'Режим выбора выключен' 
    });
}

function updateMassPanel() {
    const panel = document.getElementById('massActionsPanel');
    const count = document.getElementById('massCount');
    if (panel && count) {
        if (selectedMembers.size > 0) {
            panel.classList.add('active');
            count.textContent = `${selectedMembers.size} выбрано`;
        } else {
            panel.classList.remove('active');
        }
    }
}

function clearMassSelection() {
    selectedMembers.clear();
    document.querySelectorAll('.chat-checkbox').forEach(cb => cb.checked = false);
    updateMassPanel();
}

function massExport() {
    showToast({ type: 'success', message: `Экспорт ${selectedMembers.size} пайщиков...` });
    clearMassSelection();
}

function massMessage() {
    showToast({ type: 'info', message: 'Функция массовой рассылки в разработке' });
    clearMassSelection();
}

// STEP 14: ТУЛТИПЫ
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.style.position = 'relative';
        el.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.dataset.tooltip;
            tooltip.style.cssText = `
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(tooltip);
            this._tooltip = tooltip;
        });
        el.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// STEP 15: ГОРЯЧИЕ КЛАВИШИ
function initHotkeys() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+M - массовые операции
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            toggleMassSelection();
        }
        // Ctrl+K - поиск по меню
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const menuSearch = document.getElementById('menuSearch');
            if (menuSearch) menuSearch.focus();
        }
        // Escape - закрыть всё
        if (e.key === 'Escape') {
            clearMassSelection();
            document.querySelectorAll('.sidebar-menu.visible, .sidebar-right.visible').forEach(panel => {
                panel.classList.remove('visible');
            });
        }
        // Ctrl+S - сохранить (если форма активна)
        if (e.ctrlKey && e.key === 's') {
            const form = document.querySelector('form');
            if (form) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        }
    });
}

// STEP 16: ЭКСПОРТ В EXCEL
function exportToExcel(data, filename, sheetName = 'Данные') {
    try {
        if (!window.XLSX) {
            showToast({ type: 'error', message: 'Библиотека XLSX не загружена' });
            return;
        }
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
        showToast({ type: 'success', message: `Файл экспортирован` });
    } catch (error) {
        Logger.error('Ошибка экспорта в Excel', error);
        showToast({ type: 'error', message: 'Ошибка при экспорте' });
    }
}

function exportMembersToExcel() {
    const members = window.members || [];
    const data = members.map(m => ({
        'ID': m.id, 'ФИО': m.name, 'Статус': m.statusText,
        'Баланс': m.balance, 'Телефон': m.phone, 'Email': m.email
    }));
    exportToExcel(data, 'Пайщики', 'Реестр');
}

// STEP 17: ТЁМНАЯ ТЕМА
let darkMode = false;
// Делаем функцию доступной глобально для onclick из HTML
window.toggleDarkMode = function toggleDarkMode() {
    darkMode = !darkMode;
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
    showToast({ type: 'info', message: darkMode ? '🌙 Тёмная тема' : '☀️ Светлая тема' });
};

function initDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
        darkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// STEP 18.1: Функция отображения в боковой панели (мessenger версия)
function showInSideMenu(title, content) {
    const menuPanelTitle = document.getElementById('menuPanelTitle');
    const menuPanelContent = document.getElementById('menuPanelContent');
    const menuContentPanel = document.getElementById('menuContentPanel');
    const sidebarMenu = document.getElementById('sidebarMenu');
    
    if (menuPanelTitle) menuPanelTitle.textContent = title;
    if (menuPanelContent) menuPanelContent.innerHTML = content;
    if (menuContentPanel) menuContentPanel.classList.add('visible');
    if (sidebarMenu) sidebarMenu.classList.remove('visible');
    
    hideFab();
}

// STEP 18: КАЛЕНДАРЬ - ДОБАВЛЕНИЕ МЕРОПРИЯТИЙ
function addCalendarEvent() {
    const content = `
        <div style="padding:20px">
            <h3 style="margin-bottom:20px">📅 Добавить мероприятие</h3>
            <form id="add-event-form" onsubmit="saveCalendarEvent(event)">
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Название *</label>
                    <input type="text" id="event-title" required placeholder="Общее собрание" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">
                    <div>
                        <label style="display:block;margin-bottom:5px;font-weight:600">Дата *</label>
                        <input type="date" id="event-date" required style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:5px;font-weight:600">Время</label>
                        <input type="time" id="event-time" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                    </div>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Тип мероприятия</label>
                    <select id="event-type" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="meeting">Собрание</option>
                        <option value="deadline">Срок сдачи</option>
                        <option value="payment">Платёж</option>
                        <option value="other">Другое</option>
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Описание</label>
                    <textarea id="event-description" rows="3" placeholder="Дополнительная информация" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px"></textarea>
                </div>
                <div style="margin-bottom:15px">
                    <label style="display:block;margin-bottom:5px;font-weight:600">Напоминание</label>
                    <select id="event-reminder" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:6px">
                        <option value="none">Без напоминания</option>
                        <option value="1day">За 1 день</option>
                        <option value="1hour">За 1 час</option>
                        <option value="1week">За 1 неделю</option>
                    </select>
                </div>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer;font-weight:600">Отмена</button>
                </div>
            </form>
        </div>
    `;
    showInSideMenu('Добавить мероприятие', content);
}

function saveCalendarEvent(event) {
    event.preventDefault();
    try {
        const newEvent = {
            id: Date.now(),
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            type: document.getElementById('event-type').value,
            description: document.getElementById('event-description').value,
            reminder: document.getElementById('event-reminder').value,
            createdAt: new Date().toISOString()
        };

        if (!cooperativeSettings.calendarEvents) {
            cooperativeSettings.calendarEvents = [];
        }
        cooperativeSettings.calendarEvents.push(newEvent);
        localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));

        showToast({ type: 'success', message: 'Мероприятие добавлено в календарь' });
        closeSideMenu();
    } catch (error) {
        Logger.error('Ошибка сохранения мероприятия', error);
        showToast({ type: 'error', message: 'Ошибка при сохранении' });
    }
}

// ============================================
// ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ ДЛЯ ONCLICK
// ============================================
window.massExport = massExport;
window.massMessage = massMessage;
window.clearMassSelection = clearMassSelection;
window.exportMembersToExcel = exportMembersToExcel;
