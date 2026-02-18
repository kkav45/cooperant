// MESSENGER APP - Основной JavaScript для messenger-интерфейса

// ==================== ДАННЫЕ ====================
const membersData = [
    { id: 1, name: "Иванов Иван Иванович", avatar: "ИИ", color: "linear-gradient(135deg,#ff6b6b,#ee5a5a)", status: "debt", statusText: "Должник", balance: -2000, phone: "+7 (999) 123-45-67", email: "ivanov@example.com", lastTransaction: "Просрочен членский взнос (2 мес)", lastTime: "10:30", operations: [
        { id: 1, type: "Внесение пая", amount: 5000, date: "2024-01-15", description: "Ежегодный паевой взнос", status: "paid" },
        { id: 2, type: "Членский взнос", amount: 1000, date: "2024-02-01", description: "Членский взнос за февраль", status: "overdue" }
    ]},
    { id: 2, name: "Петрова Мария Сергеевна", avatar: "ПМ", color: "linear-gradient(135deg,#51cf66,#40c057)", status: "active", statusText: "Активен", balance: 25000, phone: "+7 (999) 234-56-78", email: "petrova@example.com", lastTransaction: "Внесён паевой взнос 10 000 ₽", lastTime: "Вчера", operations: [
        { id: 4, type: "Внесение пая", amount: 10000, date: "2024-01-14", description: "Дополнительный паевой взнос", status: "paid" },
        { id: 5, type: "Вступительный взнос", amount: 5000, date: "2023-12-10", description: "Вступительный взнос", status: "paid" }
    ]},
    { id: 3, name: "Сидоров Дмитрий Петрович", avatar: "СД", color: "linear-gradient(135deg,#fcc419,#fab005)", status: "pending", statusText: "На рассмотрении", balance: 5000, phone: "+7 (999) 345-67-89", email: "sidorov@example.com", lastTransaction: "Заявление о вступлении подано", lastTime: "Пт", operations: [
        { id: 7, type: "Вступительный взнос", amount: 5000, date: "2024-01-13", description: "Вступительный взнос", status: "pending" }
    ]}
];

// Отчеты из каталога
const reportsMenus = {
    'accounting-reports': {
        title: '📘 Бухгалтерские отчёты',
        sections: [
            { title: '📊 Официальные формы', reports: [
                { id: 'balance', icon: '⚖️', color: '#e3f2fd', title: 'Бухгалтерский баланс', desc: 'Форма №1 (ОКУД 0710001)' },
                { id: 'profit-loss', icon: '📈', color: '#e3f2fd', title: 'Отчёт о фин. результатах', desc: 'Форма №2 (ОКУД 0710002)' },
                { id: 'target-use', icon: '🎯', color: '#e3f2fd', title: 'Отчёт о целевом использовании', desc: 'Форма №3' }
            ]},
            { title: '📋 Регистры и ведомости', reports: [
                { id: 'osv', icon: '📊', color: '#fff3e0', title: 'Оборотно-сальдовая ведомость', desc: 'Обороты и остатки' },
                { id: 'journal-target', icon: '📖', color: '#fff3e0', title: 'Журнал целевого использования', desc: 'Операции по фондам' }
            ]}
        ]
    },
    'analytics': {
        title: '📈 Аналитика',
        sections: [
            { title: '📊 Стандартные отчёты', reports: [
                { id: 'members-report', icon: '📋', color: '#e8f5e9', title: 'Отчёт по пайщикам', desc: 'Реестр, статистика' },
                { id: 'payments-report', icon: '💳', color: '#e8f5e9', title: 'Отчёт по взносам', desc: 'Поступления' }
            ]}
        ]
    },
    'meetings': {
        title: '📝 Собрания и протоколы',
        sections: [
            { title: '📋 Документы собраний', reports: [
                { id: 'meeting-protocol', icon: '📝', color: '#e8f5e9', title: 'Протокол собрания', desc: 'Форма протокола' },
                { id: 'attendance-list', icon: '✍️', color: '#e8f5e9', title: 'Лист регистрации', desc: 'Явка участников' }
            ]}
        ]
    },
    'control': {
        title: '⏰ Контроль сроков',
        sections: [
            { title: '📅 Календари', reports: [
                { id: 'calendar', icon: '📅', color: '#e3f2fd', title: 'Календарь событий', desc: 'Собрания, платежи' },
                { id: 'control-dashboard', icon: '⏰', color: '#e3f2fd', title: 'Контроль сроков', desc: 'Истекающие сроки' }
            ]}
        ]
    }
};

// Контент отчетов
const reportsContent = {
    'osv': { title: 'Оборотно-сальдовая ведомость', html: '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f5f7fa"><th style="padding:12px">Счет</th><th>Наименование</th><th>Вх. Дт</th><th>Вх. Кт</th><th>Оборот Дт</th><th>Оборот Кт</th></tr></thead><tbody><tr><td style="padding:12px">50</td><td>Касса</td><td>15 000</td><td>5 000</td><td>120 000</td><td>115 000</td></tr><tr><td style="padding:12px">51</td><td>Расчетные счета</td><td>250 000</td><td>180 000</td><td>1 250 000</td><td>1 180 000</td></tr></tbody></table>' },
    'balance': { title: 'Бухгалтерский баланс', html: '<div style="padding:40px;text-align:center"><div style="font-size:48px">⚖️</div><p>Баланс на 31.12.2023</p></div>' },
    'calendar': { title: 'Календарь событий', html: '<div style="padding:20px;background:#e3f2fd;border-radius:8px"><p><strong>17 февраля:</strong> Общее собрание (10:00)</p><p><strong>28 февраля:</strong> Срок сдачи УСН</p></div>' }
};

// Глобальные переменные
let currentMember = null;
let fabExpanded = false;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    renderChats();
    if (membersData.length > 0) selectMember(membersData[0]);
    setupEventListeners();
    updateStats();
});

// ==================== ЧАТЫ ====================
function renderChats() {
    const chatsList = document.getElementById('chatsList');
    chatsList.innerHTML = membersData.map(m => {
        const balanceClass = m.balance >= 0 ? 'positive' : 'negative';
        const balanceText = m.balance >= 0 ? `${m.balance.toLocaleString()} ₽` : `−${Math.abs(m.balance).toLocaleString()} ₽`;
        const icon = m.status === 'debt' ? '⚠' : m.status === 'pending' ? '📝' : '✓';
        return `<div class="chat-item" data-id="${m.id}">
            <div class="avatar" style="background:${m.color}">${m.avatar}</div>
            <div class="chat-info">
                <div class="chat-top"><span class="chat-name">${m.name}</span><span class="chat-time">${m.lastTime}</span></div>
                <div class="chat-middle"><span class="status ${m.status}">${m.statusText}</span><span class="balance ${balanceClass}">${balanceText}</span></div>
                <div class="last-message"><span class="icon">${icon}</span> ${m.lastTransaction}</div>
            </div>
        </div>`;
    }).join('');
    
    chatsList.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const member = membersData.find(m => m.id == item.dataset.id);
            if (member) selectMember(member);
        });
    });
}

function selectMember(member) {
    currentMember = member;
    document.getElementById('currentName').textContent = member.name;
    document.getElementById('currentAvatar').textContent = member.avatar;
    document.getElementById('currentAvatar').style.background = member.color;
    document.getElementById('currentStatus').textContent = '● ' + member.statusText;
    
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    const activeItem = document.querySelector(`.chat-item[data-id="${member.id}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    renderMessages(member.operations);
    hideAllPanels();
}

function renderMessages(operations) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = operations.map(op => {
        const statusIcon = op.status === 'paid' ? '✓' : op.status === 'overdue' ? '⚠' : '⏳';
        return `<div class="message received" onclick="showOperationDetails(${op.id})">
            <div class="message-type">${op.type}</div>
            <div class="message-content">${op.description}</div>
            ${op.amount ? `<div class="message-amount">${op.amount.toLocaleString()} ₽</div>` : ''}
            <div class="message-time">${op.date} ${statusIcon}</div>
        </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

// ==================== МЕНЮ И НАВИГАЦИЯ ====================
function setupEventListeners() {
    // Бургер меню
    document.getElementById('burgerBtn').addEventListener('click', () => {
        document.getElementById('sidebarMenu').classList.add('visible');
    });
    
    document.getElementById('menuCloseBtn').addEventListener('click', () => {
        document.getElementById('sidebarMenu').classList.remove('visible');
    });
    
    // Клик по пунктам меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const panel = this.dataset.panel;
            const submenu = this.dataset.submenu;
            const action = this.dataset.action;
            
            if (panel) openMenuPanel(panel);
            else if (submenu) openReportsSubmenu(submenu);
            else if (action) handleMenuAction(action);
        });
    });
    
    // Назад из подменю
    document.getElementById('submenuBackBtn').addEventListener('click', closeReportsSubmenu);
    
    // FAB кнопка
    document.getElementById('fabMain').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFab();
    });
    
    document.querySelectorAll('.fab-item').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            createNew(action);
        });
    });
    
    // Клик вне FAB
    document.addEventListener('click', e => {
        if (fabExpanded && !e.target.closest('.fab-container')) toggleFab();
    });
    
    // Поиск
    document.getElementById('searchInput').addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.chat-item').forEach(item => {
            const name = item.querySelector('.chat-name')?.textContent.toLowerCase() || '';
            item.style.display = name.includes(term) ? 'flex' : 'none';
        });
    });
    
    // Фильтры
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Закрытие панелей
    document.getElementById('closeInfoBtn').addEventListener('click', () => {
        document.getElementById('sidebarRight').classList.remove('visible');
        showFab();
    });
    
    document.getElementById('closeDetailsBtn').addEventListener('click', () => {
        document.getElementById('operationDetailsPanel').classList.remove('visible');
        showFab();
    });
    
    document.getElementById('closePanelBtn').addEventListener('click', () => {
        document.getElementById('menuContentPanel').classList.remove('visible');
        showFab();
    });
    
    document.getElementById('closeLargeReportBtn').addEventListener('click', () => {
        document.getElementById('largeReportPanel').classList.remove('visible');
        showFab();
    });
    
    // Информация о пайщике
    document.getElementById('menuMoreBtn').addEventListener('click', showMemberInfo);
}

// ==================== ОТЧЕТЫ ====================
function openReportsSubmenu(menuType) {
    const data = reportsMenus[menuType];
    if (!data) return;
    
    document.getElementById('submenuTitle').textContent = data.title;
    const content = document.getElementById('submenuContent');
    
    let html = '';
    data.sections.forEach(section => {
        html += `<div class="submenu-section"><div class="submenu-section-title">${section.title}</div>`;
        section.reports.forEach(report => {
            html += `<div class="report-card" data-report-id="${report.id}">
                <div class="report-card-icon" style="background:${report.color}">${report.icon}</div>
                <div class="report-card-info">
                    <div class="report-card-title">${report.title}</div>
                    <div class="report-card-desc">${report.desc}</div>
                </div>
            </div>`;
        });
        html += '</div>';
    });
    
    content.innerHTML = html;
    
    // Вешаем обработчики
    content.querySelectorAll('.report-card').forEach(card => {
        card.addEventListener('click', function() {
            const reportId = this.dataset.reportId;
            openReport(reportId);
        });
    });
    
    document.getElementById('reportsSubmenu').classList.add('visible');
    document.getElementById('sidebarMenu').classList.remove('visible');
}

function closeReportsSubmenu() {
    document.getElementById('reportsSubmenu').classList.remove('visible');
}

function openReport(reportId) {
    const report = reportsContent[reportId];
    if (!report) {
        alert('Отчет в разработке');
        return;
    }
    document.getElementById('largeReportTitle').textContent = report.title;
    document.getElementById('largeReportContent').innerHTML = report.html;
    document.getElementById('largeReportPanel').classList.add('visible');
    document.getElementById('reportsSubmenu').classList.remove('visible');
    hideFab();
}

function openMenuPanel(panelType) {
    const panels = {
        'favorites': { title: '⭐ Избранное', content: '<div style="padding:20px"><p>⚠️ Просроченные взносы: 3</p><p>📝 Заявления: 5</p></div>' },
        'calendar': { title: '📅 Календарь', content: '<div style="padding:20px;background:#e3f2fd;border-radius:8px"><p><strong>17 февраля:</strong> Общее собрание</p></div>' },
        'members-registry': { title: '📋 Реестр', content: '<div style="padding:20px"><p>12 пайщиков в реестре</p></div>' },
        'profile': { title: '👤 Профиль', content: '<div style="padding:20px;text-align:center"><div style="font-size:48px">👤</div><p>Администратор</p></div>' },
        'backup': { title: '💾 Backup', content: '<div style="padding:20px"><button style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">💾 Создать копию</button></div>' }
    };
    
    const panel = panels[panelType];
    if (!panel) return;
    
    document.getElementById('menuPanelTitle').textContent = panel.title;
    document.getElementById('menuPanelContent').innerHTML = panel.content;
    document.getElementById('menuContentPanel').classList.add('visible');
    document.getElementById('sidebarMenu').classList.remove('visible');
}

function handleMenuAction(action) {
    const actions = {
        'pko': 'ПКО (Приходный ордер)',
        'rko': 'РКО (Расходный ордер)',
        'certificate': 'Бухгалтерская справка',
        'kudir': 'КУДиР',
        'usn': 'Декларация УСН',
        'zero': 'Нулевая отчётность'
    };
    alert(actions[action] || 'В разработке');
}

// ==================== FAB И ПАНЕЛИ ====================
function toggleFab() {
    fabExpanded = !fabExpanded;
    const fabMain = document.getElementById('fabMain');
    const fabMenu = document.getElementById('fabMenu');
    
    if (fabExpanded) {
        fabMain.classList.add('close');
        fabMenu.classList.add('expanded');
    } else {
        fabMain.classList.remove('close');
        fabMenu.classList.remove('expanded');
    }
}

function showFab() { document.getElementById('fabContainer').classList.remove('hidden'); }
function hideFab() {
    document.getElementById('fabContainer').classList.add('hidden');
    fabExpanded = false;
    document.getElementById('fabMain').classList.remove('close');
    document.getElementById('fabMenu').classList.remove('expanded');
}

function hideAllPanels() {
    document.getElementById('sidebarRight').classList.remove('visible');
    document.getElementById('operationDetailsPanel').classList.remove('visible');
    document.getElementById('menuContentPanel').classList.remove('visible');
    document.getElementById('largeReportPanel').classList.remove('visible');
}

function createNew(type) {
    const titles = {
        member: 'Создание пайщика',
        payment: 'Внесение взноса',
        transaction: 'Создание проводки',
        document: 'Загрузка документа',
        application: 'Создание заявления'
    };
    alert(titles[type] || 'В разработке');
    toggleFab();
}

// ==================== ИНФОРМАЦИЯ О ПАЙЩИКЕ ====================
function showMemberInfo() {
    if (!currentMember) return;
    const m = currentMember;
    const content = `<div style="text-align:center;margin-bottom:20px">
        <div style="width:80px;height:80px;border-radius:50%;background:${m.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin:0 auto 15px">${m.avatar}</div>
        <h3>${m.name}</h3>
        <p style="color:#666">${m.statusText}</p>
    </div>
    <div style="background:linear-gradient(135deg,#0088cc,#0066aa);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px">
        <div style="font-size:13px;opacity:0.9">Баланс</div>
        <div style="font-size:28px;font-weight:700">${m.balance >= 0 ? '+' : ''}${m.balance.toLocaleString()} ₽</div>
    </div>
    <div>
        <div style="padding:12px 0;border-bottom:1px solid #f0f0f0"><strong>📞</strong> ${m.phone}</div>
        <div style="padding:12px 0;border-bottom:1px solid #f0f0f0"><strong>✉️</strong> ${m.email}</div>
    </div>`;
    
    document.getElementById('memberInfoContent').innerHTML = content;
    document.getElementById('sidebarRight').classList.add('visible');
    hideFab();
}

function showOperationDetails(opId) {
    const op = currentMember.operations.find(o => o.id === opId);
    if (!op) return;
    
    const statusText = op.status === 'paid' ? '✓ Оплачено' : op.status === 'overdue' ? '⚠ Просрочено' : '⏳ Ожидается';
    const content = `<div class="detail-tabs">
        <button class="detail-tab active">Основное</button>
        <button class="detail-tab">Бухгалтерия</button>
    </div>
    <div style="margin-top:20px">
        <div style="margin-bottom:16px"><div style="font-size:12px;color:#666;margin-bottom:6px">Тип операции</div><div style="padding:10px;background:#e3f2fd;border-radius:8px;color:#0088cc;font-weight:600">${op.type}</div></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;color:#666;margin-bottom:6px">Сумма</div><div style="padding:10px;background:#e3f2fd;border-radius:8px;color:#0088cc;font-weight:600">${op.amount ? op.amount.toLocaleString() + ' ₽' : '—'}</div></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;color:#666;margin-bottom:6px">Дата</div><div style="padding:10px;background:#f5f7fa;border-radius:8px">${op.date}</div></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;color:#666;margin-bottom:6px">Описание</div><div style="padding:10px;background:#f5f7fa;border-radius:8px">${op.description}</div></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;color:#666;margin-bottom:6px">Статус</div><div style="padding:10px;background:#f5f7fa;border-radius:8px">${statusText}</div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:24px">
        <button style="padding:12px;background:#0088cc;color:#fff;border:none;border-radius:8px;cursor:pointer">📄 Печать</button>
        <button style="padding:12px;background:#f5f7fa;color:#333;border:none;border-radius:8px;cursor:pointer">✏️ Редактировать</button>
        <button style="padding:12px;background:#ffebee;color:#c62828;border:none;border-radius:8px;cursor:pointer">↩️ Возврат</button>
    </div>`;
    
    document.getElementById('detailsTitle').textContent = 'Детали операции';
    document.getElementById('detailsContent').innerHTML = content;
    document.getElementById('operationDetailsPanel').classList.add('visible');
    hideFab();
}

// ==================== СТАТИСТИКА ====================
function updateStats() {
    const total = membersData.length;
    const active = membersData.filter(m => m.status === 'active').length;
    document.getElementById('membersCount').textContent = total;
    document.getElementById('cooperativeStats').textContent = `${total} пайщиков • ${active} активных`;
}

// ==================== ОТПРАВКА СООБЩЕНИЙ ====================
document.getElementById('sendButton').addEventListener('click', () => {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !currentMember) return;
    
    currentMember.operations.push({
        id: Date.now(),
        type: 'Сообщение',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: text,
        status: 'paid'
    });
    
    renderMessages(currentMember.operations);
    input.value = '';
});

document.getElementById('messageInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('sendButton').click();
});
