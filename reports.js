// ==================== ФУНКЦИИ ГЕНЕРАЦИИ ОТЧЕТОВ ====================
// Файл: reports.js
// Версия: 1.0
// Дата: 17 февраля 2026

// Главная функция для генерации отчетов
function generateReport(reportType) {
    console.log('📊 Генерация отчета:', reportType);
    
    const generators = {
        // Стандартные отчеты
        'members': generateMembersReport,
        'payments': generatePaymentsReport,
        'financial': generateFinancialReport,
        
        // Официальные формы
        'balance_sheet': generateBalanceSheet,
        'profit_loss': generateProfitLoss,
        'target_use': generateTargetUseReport,
        
        // Дополнительные
        'debt': generateDebtReport,
        'share_return': generateShareReturnReport,
        'accounting': generateAccountingReport
    };
    
    const generator = generators[reportType];
    
    if (generator && typeof generator === 'function') {
        generator();
    } else {
        console.warn('Отчет в разработке:', reportType);
        alert('Отчет в разработке: ' + reportType);
    }
}

// ==================== СТАНДАРТНЫЕ ОТЧЕТЫ ====================

// Отчет по пайщикам
function generateMembersReport() {
    const activeMembers = members.filter(m => m.status === 'active').length;
    const suspendedMembers = members.filter(m => m.status === 'suspended').length;
    const pendingMembers = members.filter(m => m.status === 'pending').length;
    
    const content = `
        <div class="report-container" style="padding:20px">
            <h2 style="margin-bottom:10px">📋 ОТЧЕТ ПО ПАЙЩИКАМ</h2>
            <p style="color:#666;margin-bottom:20px">Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px">
                <div style="padding:20px;background:#e8f5e9;border-radius:8px;text-align:center">
                    <div style="font-size:32px;font-weight:bold;color:#2e7d32">${members.length}</div>
                    <div style="color:#666;margin-top:5px">Всего пайщиков</div>
                </div>
                <div style="padding:20px;background:#e3f2fd;border-radius:8px;text-align:center">
                    <div style="font-size:32px;font-weight:bold;color:#1976d2">${activeMembers}</div>
                    <div style="color:#666;margin-top:5px">Активных</div>
                </div>
                <div style="padding:20px;background:#fff3e0;border-radius:8px;text-align:center">
                    <div style="font-size:32px;font-weight:bold;color:#f57c00">${pendingMembers}</div>
                    <div style="color:#666;margin-top:5px">На рассмотрении</div>
                </div>
            </div>
            
            <h3 style="margin-bottom:15px">Реестр пайщиков</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f5f7fa">
                        <th style="padding:12px;text-align:left;border:1px solid #e0e0e0">ФИО</th>
                        <th style="padding:12px;border:1px solid #e0e0e0">Дата вступления</th>
                        <th style="padding:12px;border:1px solid #e0e0e0">Статус</th>
                        <th style="padding:12px;border:1px solid #e0e0e0">Контакт</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(m => `
                        <tr>
                            <td style="padding:12px;border:1px solid #e0e0e0">${m.name || '—'}</td>
                            <td style="padding:12px;border:1px solid #e0e0e0">${m.joinDate || '—'}</td>
                            <td style="padding:12px;border:1px solid #e0e0e0">
                                <span style="padding:4px 8px;border-radius:4px;background:${m.status === 'active' ? '#e8f5e9' : m.status === 'suspended' ? '#ffebee' : '#fff3e0'};color:${m.status === 'active' ? '#2e7d32' : m.status === 'suspended' ? '#c62828' : '#f57c00'}">
                                    ${m.status === 'active' ? 'Активен' : m.status === 'suspended' ? 'Приостановлен' : 'На рассмотрении'}
                                </span>
                            </td>
                            <td style="padding:12px;border:1px solid #e0e0e0">${m.contact || '—'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="exportReportToPDF('Отчет по пайщикам', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
                <button onclick="exportReportToExcel('Отчет по пайщикам', this.closest('.report-container'))" style="padding:12px 24px;background:#217346;color:#fff;border:none;border-radius:6px;cursor:pointer">📊 Экспорт в Excel</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Отчет по пайщикам', content);
}

// Отчет по взносам
function generatePaymentsReport() {
    const totalAmount = payments.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0);
    const expectedAmount = payments.filter(p => !p.paid).reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Группировка по типам
    const byType = {};
    payments.filter(p => p.paid).forEach(p => {
        byType[p.type] = (byType[p.type] || 0) + p.amount;
    });
    
    const content = `
        <div class="report-container" style="padding:20px">
            <h2 style="margin-bottom:10px">💳 ОТЧЕТ ПО ВЗНОСАМ</h2>
            <p style="color:#666;margin-bottom:20px">Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-bottom:30px">
                <div style="padding:20px;background:#e8f5e9;border-radius:8px">
                    <div style="color:#666;margin-bottom:5px">Всего поступило</div>
                    <div style="font-size:28px;font-weight:bold;color:#2e7d32">${totalAmount.toLocaleString()} ₽</div>
                </div>
                <div style="padding:20px;background:#fff3e0;border-radius:8px">
                    <div style="color:#666;margin-bottom:5px">Ожидается</div>
                    <div style="font-size:28px;font-weight:bold;color:#f57c00">${expectedAmount.toLocaleString()} ₽</div>
                </div>
            </div>
            
            <h3 style="margin-bottom:15px">Распределение по типам взносов</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f5f7fa">
                        <th style="padding:12px;text-align:left;border:1px solid #e0e0e0">Тип взноса</th>
                        <th style="padding:12px;text-align:right;border:1px solid #e0e0e0">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(byType).map(([type, amount]) => `
                        <tr>
                            <td style="padding:12px;border:1px solid #e0e0e0">${getExtendedPaymentTypeText(type)}</td>
                            <td style="padding:12px;border:1px solid #e0e0e0;text-align:right;font-weight:600">${amount.toLocaleString()} ₽</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="exportReportToPDF('Отчет по взносам', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Отчет по взносам', content);
}

// Финансовый отчет
function generateFinancialReport() {
    const income = transactions
        .filter(t => t.debitAccount && (t.debitAccount.startsWith('50') || t.debitAccount.startsWith('51')))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expense = transactions
        .filter(t => t.creditAccount && (t.creditAccount.startsWith('50') || t.creditAccount.startsWith('51')))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const content = `
        <div class="report-container" style="padding:20px">
            <h2 style="margin-bottom:10px">📈 ФИНАНСОВЫЙ ОТЧЁТ</h2>
            <p style="color:#666;margin-bottom:20px">Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px">
                <div style="padding:20px;background:#e8f5e9;border-radius:8px">
                    <div style="color:#666;margin-bottom:5px">Доходы</div>
                    <div style="font-size:28px;font-weight:bold;color:#2e7d32">${income.toLocaleString()} ₽</div>
                </div>
                <div style="padding:20px;background:#ffebee;border-radius:8px">
                    <div style="color:#666;margin-bottom:5px">Расходы</div>
                    <div style="font-size:28px;font-weight:bold;color:#c62828">${expense.toLocaleString()} ₽</div>
                </div>
                <div style="padding:20px;background:#e3f2fd;border-radius:8px">
                    <div style="color:#666;margin-bottom:5px">Сальдо</div>
                    <div style="font-size:28px;font-weight:bold;color:#1976d2">${(income - expense).toLocaleString()} ₽</div>
                </div>
            </div>
            
            <h3 style="margin-bottom:15px">Движение денежных средств</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f5f7fa">
                        <th style="padding:12px;text-align:left;border:1px solid #e0e0e0">Дата</th>
                        <th style="padding:12px;text-align:left;border:1px solid #e0e0e0">Описание</th>
                        <th style="padding:12px;text-align:right;border:1px solid #e0e0e0">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.slice(0, 20).map(t => `
                        <tr>
                            <td style="padding:12px;border:1px solid #e0e0e0">${t.date || '—'}</td>
                            <td style="padding:12px;border:1px solid #e0e0e0">${t.description || '—'}</td>
                            <td style="padding:12px;border:1px solid #e0e0e0;text-align:right;font-weight:600">${t.amount ? t.amount.toLocaleString() : '0'} ₽</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="exportReportToPDF('Финансовый отчёт', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Финансовый отчёт', content);
}

// ==================== ОФИЦИАЛЬНЫЕ ФОРМЫ ====================

// Бухгалтерский баланс (Форма №1)
function generateBalanceSheet() {
    const content = `
        <div class="report-container" style="padding:40px">
            <h2 style="text-align:center;margin-bottom:10px">БУХГАЛТЕРСКИЙ БАЛАНС</h2>
            <p style="text-align:center;color:#666;margin-bottom:30px">Форма №1 (ОКУД 0710001)</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${cooperativeSettings.shortName || 'Потребительский кооператив'}</p>
                <p style="margin:5px 0"><strong>Дата составления:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                <p style="margin:5px 0"><strong>Единица измерения:</strong> руб.</p>
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
                    <tr>
                        <td style="padding:12px;border:1px solid #e0e0e0;font-weight:600">I. ВНЕОБОРОТНЫЕ АКТИВЫ</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                    <tr>
                        <td style="padding:12px;border:1px solid #e0e0e0;font-weight:600">II. ОБОРОТНЫЕ АКТИВЫ</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                    <tr style="background:#e3f2fd;font-weight:600">
                        <td style="padding:12px;border:1px solid #e0e0e0">БАЛАНС</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top:30px">
                <button onclick="exportReportToPDF('Бухгалтерский баланс', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Бухгалтерский баланс', content);
}

// Отчет о финансовых результатах (Форма №2)
function generateProfitLoss() {
    const content = `
        <div class="report-container" style="padding:40px">
            <h2 style="text-align:center;margin-bottom:10px">ОТЧЁТ О ФИНАНСОВЫХ РЕЗУЛЬТАТАХ</h2>
            <p style="text-align:center;color:#666;margin-bottom:30px">Форма №2 (ОКУД 0710002)</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${cooperativeSettings.shortName || 'Потребительский кооператив'}</p>
                <p style="margin:5px 0"><strong>Отчётный период:</strong> ${new Date().getFullYear()} год</p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f5f7fa">
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">Показатель</th>
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">За отчётный период</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:12px;border:1px solid #e0e0e0">Выручка</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                    <tr>
                        <td style="padding:12px;border:1px solid #e0e0e0">Себестоимость продаж</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                    <tr style="background:#e3f2fd;font-weight:600">
                        <td style="padding:12px;border:1px solid #e0e0e0">Прибыль (убыток) от продаж</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top:30px">
                <button onclick="exportReportToPDF('Отчёт о финансовых результатах', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Отчёт о финансовых результатах', content);
}

// Отчет о целевом использовании средств
function generateTargetUseReport() {
    const content = `
        <div class="report-container" style="padding:40px">
            <h2 style="text-align:center;margin-bottom:10px">ОТЧЁТ О ЦЕЛЕВОМ ИСПОЛЬЗОВАНИИ СРЕДСТВ</h2>
            <p style="text-align:center;color:#666;margin-bottom:30px">Форма №3</p>
            
            <div style="background:#f5f7fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <p style="margin:5px 0"><strong>Организация:</strong> ${cooperativeSettings.shortName || 'Потребительский кооператив'}</p>
                <p style="margin:5px 0"><strong>Отчётный период:</strong> ${new Date().getFullYear()} год</p>
            </div>
            
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <thead>
                    <tr style="background:#f5f7fa">
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:left">Наименование фонда</th>
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Остаток на начало</th>
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Поступило</th>
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Использовано</th>
                        <th style="padding:12px;border:1px solid #e0e0e0;text-align:right">Остаток на конец</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:12px;border:1px solid #e0e0e0">Паевой фонд</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                    <tr>
                        <td style="padding:12px;border:1px solid #e0e0e0">Неделимый фонд</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                        <td style="padding:12px;border:1px solid #e0e0e0;text-align:right">0</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top:30px">
                <button onclick="exportReportToPDF('Отчёт о целевом использовании', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Отчёт о целевом использовании', content);
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ ОТЧЕТЫ ====================

// Отчет о задолженностях
function generateDebtReport() {
    const debtMembers = members.filter(m => m.status === 'suspended');
    
    const content = `
        <div class="report-container" style="padding:20px">
            <h2 style="margin-bottom:10px">⚠️ ОТЧЁТ О ЗАДОЛЖЕННОСТЯХ</h2>
            <p style="color:#666;margin-bottom:20px">Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div style="padding:20px;background:#ffebee;border-radius:8px;margin-bottom:20px">
                <div style="font-size:16px;font-weight:600;margin-bottom:5px">🔴 Всего должников</div>
                <div style="font-size:32px;font-weight:bold;color:#c62828">${debtMembers.length}</div>
            </div>
            
            ${debtMembers.length > 0 ? `
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <thead>
                        <tr style="background:#f5f7fa">
                            <th style="padding:12px;text-align:left;border:1px solid #e0e0e0">ФИО</th>
                            <th style="padding:12px;border:1px solid #e0e0e0">Контакт</th>
                            <th style="padding:12px;border:1px solid #e0e0e0">Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${debtMembers.map(m => `
                            <tr>
                                <td style="padding:12px;border:1px solid #e0e0e0">${m.name || '—'}</td>
                                <td style="padding:12px;border:1px solid #e0e0e0">${m.contact || '—'}</td>
                                <td style="padding:12px;border:1px solid #e0e0e0">
                                    <span style="padding:4px 8px;border-radius:4px;background:#ffebee;color:#c62828">Должник</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#666;text-align:center;padding:40px">Задолженности отсутствуют</p>'}
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="exportReportToPDF('Отчёт о задолженностях', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Отчёт о задолженностях', content);
}

// Отчет о возвратах паевых взносов
function generateShareReturnReport() {
    const returnPayments = payments.filter(p => p.type === 'return_share');
    const totalReturn = returnPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const content = `
        <div class="report-container" style="padding:20px">
            <h2 style="margin-bottom:10px">↩️ ОТЧЁТ О ВОЗВРАТАХ ПАЕВЫХ ВЗНОСОВ</h2>
            <p style="color:#666;margin-bottom:20px">Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div style="padding:20px;background:#e3f2fd;border-radius:8px;margin-bottom:20px">
                <div style="font-size:16px;font-weight:600;margin-bottom:5px">💰 Всего возвращено</div>
                <div style="font-size:32px;font-weight:bold;color:#1976d2">${totalReturn.toLocaleString()} ₽</div>
            </div>
            
            ${returnPayments.length > 0 ? `
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <thead>
                        <tr style="background:#f5f7fa">
                            <th style="padding:12px;text-align:left;border:1px solid #e0e0e0">Дата</th>
                            <th style="padding:12px;border:1px solid #e0e0e0">Пайщик</th>
                            <th style="padding:12px;border:1px solid #e0e0e0">Сумма</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${returnPayments.map(p => {
                            const member = members.find(m => m.id === p.memberId);
                            return `
                                <tr>
                                    <td style="padding:12px;border:1px solid #e0e0e0">${p.date || '—'}</td>
                                    <td style="padding:12px;border:1px solid #e0e0e0">${member ? member.name : '—'}</td>
                                    <td style="padding:12px;border:1px solid #e0e0e0;text-align:right;font-weight:600">${p.amount ? p.amount.toLocaleString() : '0'} ₽</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : '<p style="color:#666;text-align:center;padding:40px">Возвратов не было</p>'}
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="exportReportToPDF('Отчёт о возвратах', this.closest('.report-container'))" style="padding:12px 24px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">📄 Экспорт в PDF</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Отчёт о возвратах паевых взносов', content);
}

// Бухгалтерская отчетность
function generateAccountingReport() {
    const content = `
        <div class="report-container" style="padding:20px">
            <h2 style="margin-bottom:10px">📝 БУХГАЛТЕРСКАЯ ОТЧЁТНОСТЬ</h2>
            <p style="color:#666;margin-bottom:20px">Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px">
                <div style="padding:20px;background:#f5f7fa;border-radius:8px;cursor:pointer" onclick="alert('В разработке')">
                    <div style="font-size:24px;margin-bottom:8px">📊</div>
                    <div style="font-weight:600">Оборотно-сальдовая ведомость</div>
                    <div style="font-size:12px;color:#666;margin-top:5px">Обороты и остатки по счетам</div>
                </div>
                <div style="padding:20px;background:#f5f7fa;border-radius:8px;cursor:pointer" onclick="alert('В разработке')">
                    <div style="font-size:24px;margin-bottom:8px">📖</div>
                    <div style="font-weight:600">Журнал-ордер</div>
                    <div style="font-size:12px;color:#666;margin-top:5px">Регистрация проводок</div>
                </div>
            </div>
        </div>
    `;
    
    showInSideMenu('Бухгалтерская отчётность', content);
}

// Экспорт отчета в PDF
function exportReportToPDF(title, container) {
    if (typeof exportReportAsPDF === 'function') {
        exportReportAsPDF(title, container.innerHTML);
    } else {
        alert('Функция экспорта в PDF будет реализована');
    }
}

// Экспорт отчета в Excel
function exportReportToExcel(title, container) {
    if (typeof window.XLSX !== 'undefined') {
        alert('Экспорт в Excel будет реализован');
    } else {
        alert('Библиотека SheetJS не подключена');
    }
}

console.log('✅ Reports.js загружен');
