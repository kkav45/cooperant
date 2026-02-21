// MESSENGER MENU CLICK HANDLERS
// Обработчики кликов по меню отчетов

(function initMenuHandlers() {
    // Проверяем готовность DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMenuHandlers);
    } else {
        setupMenuHandlers();
    }
})();

function setupMenuHandlers() {
    console.log('📋 Menu handlers loaded');

    // Добавляем data-report атрибуты для отчетов в левом меню
    const reportButtons = document.querySelectorAll('[data-submenu="analytics"], [data-submenu="meetings"], [data-submenu="control"], [data-submenu="accounting-reports"]');
    
    reportButtons.forEach(btn => {
        const submenu = btn.dataset.submenu;
        const parentSection = btn.closest('.menu-section');
        
        if (parentSection && submenu) {
            // Создаем контейнер для раскрытых отчетов
            const expandedDiv = document.createElement('div');
            expandedDiv.style.cssText = 'padding-left:58px;padding-top:5px;display:none;';
            expandedDiv.className = 'reports-expanded';
            
            // Добавляем отчеты в зависимости от типа меню
            if (submenu === 'analytics') {
                expandedDiv.innerHTML = `
                    <div class="menu-item" data-report="members-report" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">📋</span>Отчёт по пайщикам</div>
                    <div class="menu-item" data-report="payments-report" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">💳</span>Отчёт по взносам</div>
                    <div class="menu-item" data-report="financial-report" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">📈</span>Финансовый отчёт</div>
                    <div class="menu-item" data-report="debt-report" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">⚠️</span>Отчёт о задолженностях</div>
                `;
            } else if (submenu === 'meetings') {
                expandedDiv.innerHTML = `
                    <div class="menu-item" data-report="meeting-protocol" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">📝</span>Протокол собрания</div>
                    <div class="menu-item" data-report="attendance-list" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">✍️</span>Лист регистрации</div>
                `;
            } else if (submenu === 'control') {
                expandedDiv.innerHTML = `
                    <div class="menu-item" data-report="calendar" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">📅</span>Календарь событий</div>
                    <div class="menu-item" data-report="control-dashboard" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">⏰</span>Контроль сроков</div>
                `;
            } else if (submenu === 'accounting-reports') {
                expandedDiv.innerHTML = `
                    <div class="menu-item" data-report="balance" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">⚖️</span>Бухгалтерский баланс</div>
                    <div class="menu-item" data-report="profit-loss" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">📈</span>Отчёт о фин. результатах</div>
                    <div class="menu-item" data-report="osv" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">📊</span>ОСВ</div>
                    <div class="menu-item" data-report="target-use" style="padding:8px 12px;font-size:12px"><span style="margin-right:8px">🎯</span>Отчёт о целевом использовании</div>
                `;
            }
            
            btn.parentNode.insertBefore(expandedDiv, btn.nextSibling);
            
            // Клик по кнопке меню - раскрывает/скрывает отчеты
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                expandedDiv.style.display = expandedDiv.style.display === 'none' ? 'block' : 'none';
            });
        }
    });

    // Обработчик для data-report
    document.querySelectorAll('[data-report]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const reportId = this.dataset.report;
            console.log('📊 Клик по отчету:', reportId);

            if (typeof window.openReportById === 'function') {
                window.openReportById(reportId);
            } else {
                console.error('❌ Функция openReportById не найдена');
            }
        });
    });

    console.log('✅ Menu handlers initialized');
}
