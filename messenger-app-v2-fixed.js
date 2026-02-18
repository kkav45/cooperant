// MESSENGER APP v2 - Исправленная версия с обработкой ошибок
// Версия: 2.0 (Security & Error Handling)
// Дата: 17 февраля 2026

'use strict';

// ==================== МОДУЛЬ ЛОГИРОВАНИЯ ====================
const Logger = {
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
    }
};

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

// ==================== ДЕМО ДАННЫЕ ====================
const demoMembers = [
    { id: 1, name: "Иванов Иван Иванович", avatar: "ИИ", color: "linear-gradient(135deg,#ff6b6b,#ee5a5a)", status: "debt", statusText: "Должник", balance: -2000, phone: "+7 (999) 123-45-67", email: "ivanov@example.com", joinDate: "15.01.2023", lastTransaction: "Просрочен членский взнос (2 мес)", lastTime: "10:30", operations: [
        { id: 1, type: "Внесение пая", amount: 5000, date: "2024-01-15", description: "Ежегодный паевой взнос", status: "paid" },
        { id: 2, type: "Членский взнос", amount: 1000, date: "2024-02-01", description: "Членский взнос за февраль", status: "overdue" },
        { id: 3, type: "Членский взнос", amount: 1000, date: "2024-01-01", description: "Членский взнос за январь", status: "overdue" }
    ]},
    { id: 2, name: "Петрова Мария Сергеевна", avatar: "ПМ", color: "linear-gradient(135deg,#51cf66,#40c057)", status: "active", statusText: "Активен", balance: 25000, phone: "+7 (999) 234-56-78", email: "petrova@example.com", joinDate: "20.02.2023", lastTransaction: "Внесён паевой взнос 10 000 ₽", lastTime: "Вчера", operations: [
        { id: 4, type: "Внесение пая", amount: 10000, date: "2024-01-14", description: "Дополнительный паевой взнос", status: "paid" },
        { id: 5, type: "Вступительный взнос", amount: 5000, date: "2023-12-10", description: "Вступительный взнос", status: "paid" },
        { id: 6, type: "Выплата дивидендов", amount: 3500, date: "2024-01-05", description: "Дивиденды за 4 квартал", status: "paid" }
    ]},
    { id: 3, name: "Сидоров Дмитрий Петрович", avatar: "СД", color: "linear-gradient(135deg,#fcc419,#fab005)", status: "pending", statusText: "На рассмотрении", balance: 5000, phone: "+7 (999) 345-67-89", email: "sidorov@example.com", joinDate: "-", lastTransaction: "Заявление о вступлении подано", lastTime: "Пт", operations: [
        { id: 7, type: "Вступительный взнос", amount: 5000, date: "2024-01-13", description: "Вступительный взнос", status: "pending" }
    ]},
    { id: 4, name: "Козлова Елена Владимировна", avatar: "КЕ", color: "linear-gradient(135deg,#74c0fc,#4dabf7)", status: "active", statusText: "Активен", balance: 18000, phone: "+7 (999) 456-78-90", email: "kozlova@example.com", joinDate: "10.03.2023", lastTransaction: "Получены дивиденды 3 500 ₽", lastTime: "Чт", operations: [
        { id: 8, type: "Паевой взнос", amount: 15000, date: "2024-01-12", description: "Паевой взнос", status: "paid" },
        { id: 9, type: "Выплата дивидендов", amount: 3500, date: "2024-01-05", description: "Дивиденды", status: "paid" }
    ]},
    { id: 5, name: "Волков Сергей Николаевич", avatar: "ВС", color: "linear-gradient(135deg,#b197fc,#9775fa)", status: "active", statusText: "Активен", balance: 12000, phone: "+7 (999) 567-89-01", email: "volkov@example.com", joinDate: "05.04.2023", lastTransaction: "Заявление на выход", lastTime: "Ср", operations: [
        { id: 10, type: "Заявка на выход", amount: 0, date: "2024-01-11", description: "Заявление о выходе", status: "pending" },
        { id: 11, type: "Возврат пая", amount: 12000, date: "2024-01-10", description: "Возврат паевого взноса", status: "pending" }
    ]}
];

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
        
        // Синхронизация с app.js
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
            Logger.info('Данные получены из app.js', { count: window.members.length });
        } else {
            Logger.warn('Данные в app.js отсутствуют, будут использованы демо-данные');
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
            // Используем демо-данные
            if (Security.validateArray(demoMembers)) {
                window.members = JSON.parse(JSON.stringify(demoMembers));
                Logger.info('Использованы демо-данные', { count: window.members.length });
            } else {
                window.members = [];
                Logger.warn('Демо-данные отсутствуют');
            }
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
            Logger.warn('Список пайщиков пуст, используем демо-данные');
            window.members = JSON.parse(JSON.stringify(demoMembers));
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
function openMenuPanel(panelType) {
    try {
        Logger.info('Открытие панели', { panelType });
        
        const panels = {
            'favorites': { title: '⭐ Избранное', content: '<div style="padding:20px">⚠️ Просроченные взносы: 3</div>' },
            'calendar': { title: '📅 Календарь', content: '<div style="padding:20px">📅 17 февраля: Общее собрание</div>' },
            'members-registry': { title: '📋 Реестр', content: '<div style="padding:20px">12 пайщиков</div>' },
            'profile': { title: '👤 Профиль', content: '<div style="padding:20px">Администратор</div>' },
            'backup': { title: '💾 Backup', content: '<div style="padding:20px">Последняя копия: 16.02.2024</div>' }
        };
        
        const panel = panels[panelType];
        if (!panel) {
            Logger.warn('Панель не найдена', { panelType });
            return;
        }
        
        const menuPanelTitle = document.getElementById('menuPanelTitle');
        const menuPanelContent = document.getElementById('menuPanelContent');
        const menuContentPanel = document.getElementById('menuContentPanel');
        
        if (menuPanelTitle) menuPanelTitle.textContent = panel.title;
        if (menuPanelContent) menuPanelContent.innerHTML = panel.content;
        if (menuContentPanel) menuContentPanel.classList.add('visible');
        
        const sidebarMenu = document.getElementById('sidebarMenu');
        if (sidebarMenu) sidebarMenu.classList.remove('visible');
        
        hideFab();
    } catch (error) {
        Logger.error('Ошибка открытия панели', error);
    }
}

function handleMenuAction(action) {
    try {
        Logger.info('Действие меню', { action });
        
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

function createNew(type) {
    try {
        const titles = {
            member: 'Создание пайщика',
            payment: 'Внесение взноса',
            transaction: 'Создание проводки',
            document: 'Загрузка документа',
            application: 'Создание заявления'
        };
        
        alert(titles[type] || 'В разработке');
        toggleFab();
    } catch (error) {
        Logger.error('Ошибка создания', error);
    }
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

function showOperationDetails(opId) {
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
        Logger.error('Ошибка показа деталей', error);
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

Logger.info('✅ Messenger App v2 готов к работе');
