// Глобальные переменные для хранения данных
let members = [];
let payments = [];
let transactions = [];
let documents = [];
let applications = []; // Заявления на вступление
let meetings = []; // Заседания и протоколы
let certificates = []; // Удостоверения пайщиков
// Переменная для хранения дескриптора директории
let coopDirectoryHandle = null;

// Настройки кооператива
let cooperativeSettings = {
    // Общая информация
    fullName: '',
    shortName: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legalAddress: '',
    postalAddress: '',
    actualAddress: '',
    phone: '',
    email: '',
    website: '',
    
    // Филиалы и представительства
    branches: [],
    
    // Органы управления
    council: {
        chairman: {}, // Председатель совета
        secretary: {}, // Секретарь совета
        members: [] // Члены совета
    },
    board: {
        chairman: {}, // Председатель правления
        secretary: {}, // Секретарь правления
        members: [] // Члены правления
    },

    // Ревизионная комиссия
    supervision: {
        type: 'revizor', // 'revizor' или 'commission'
        chairman: {}, // Председатель ревизионной комиссии
        secretary: {}, // Секретарь ревизионной комиссии
        members: [] // Члены комиссии
    },
    
    // Кооперативные участки
    areas: [],
    
    // Виды и размеры взносов
    contributionTypes: {
        entrance: { name: 'Вступительный', minAmount: 0, required: true },
        share: { name: 'Паевой', minAmount: 0, required: true },
        membership: { name: 'Членский', minAmount: 0, period: 'monthly', required: true },
        voluntary: { name: 'Добровольный', minAmount: 0, required: false },
        targeted: { name: 'Целевой', minAmount: 0, required: false }
    },
    
    // Распределение взносов по фондам
    fundDistribution: {
        type: 'percent', // 'percent' или 'fixed'
        reserve: 0, // Резервный фонд %
        development: 0, // Фонд развития %
        business: 0, // Фонд хоз. деятельности %
        indivisible: 0 // Неделимый фонд %
    },

    // Распределение прибыли (от предпринимательской деятельности)
    profitDistribution: {
        type: 'percent', // 'percent' или 'fixed'
        reserve: 0, // В резервный фонд %
        development: 0, // В фонд развития %
        members: 0, // На выплаты пайщикам (дивиденды) %
        other: 0, // Прочие направления %
        retainedEarnings: 0 // Нераспределённая прибыль %
    },

    // Налогообложение
    taxSystem: 'USN_6', // 'USN_6', 'USN_15', 'OSNO'

    // Налоговый учёт (КУДиР)
    taxAccounting: {
        income: [], // Доходы для УСН
        expense: [] // Расходы для УСН
    },

    // Учётная политика
    accountingPolicy: {
        currency: 'RUB',
        fiscalYearStart: '01-01',
        inventoryFrequency: 'yearly',
        fixedAssetLimit: 100000
    },

    // Контроль сроков (документы, отчётность)
    controlSettings: {
        documentRetention: {
            // Сроки хранения по типам документов (лет)
            'contract': 5, // Договоры
            'report': 5, // Отчёты
            'payment': 5, // Платёжные документы
            'member': 75, // Документы пайщиков
            'personnel': 75, // Документы персонала
            'protocol': 5, // Протоколы
            'certificate': 5, // Удостоверения
            'other': 5 // Прочее
        },
        reportingDeadlines: {
            // Сроки сдачи отчётности (число.месяц)
            'balance': '31.03', // Бухгалтерский баланс
            'usn': '31.03', // Декларация УСН
            'profit': '28.03', // Налог на прибыль
            'rsv': '30.04', // РСВ (ежеквартально)
            'szv': '15.01', // СЗВ-СТАЖ (ежегодно)
            'sredn': '20.01' // Среднесписочная численность
        }
    },

    // Календарь событий и заметок
    calendarEvents: []
};

// Настройки системы налогообложения
// Варианты: 'OSNO' (ОСНО), 'USN_6' (УСН "Доходы"), 'USN_15' (УСН "Доходы-Расходы")
let taxSystem = localStorage.getItem('coopTaxSystem') || 'USN_6';

// Вспомогательная функция для получения текущей даты в формате YYYY-MM-DD
function getCurrentDate() {
    return new Date().toISOString().substring(0, 10);
}

// Функция для получения текущей системы налогообложения
function getTaxSystem() {
    return taxSystem;
}

// Функция для установки системы налогообложения
function setTaxSystem(system) {
    const validSystems = ['OSNO', 'USN_6', 'USN_15'];
    if (validSystems.includes(system)) {
        taxSystem = system;
        localStorage.setItem('coopTaxSystem', system);
        return true;
    }
    return false;
}

// Функция для расчета чистого баланса паевых взносов (поступления минус возвраты)
function calculateNetShareBalance() {
    // Суммируем все оплаченные паевые взносы (кроме возвратов)
    const totalIncoming = payments.filter(p => p.type !== 'return_share' && p.paid).reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Суммируем все возвраты паевых взносов
    const totalOutgoing = payments.filter(p => p.type === 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);

    // Чистый баланс = поступления - возвраты
    return totalIncoming - totalOutgoing;
}

// Функция для расчета действительной стоимости пая
// Формула: (Чистые активы – неделимый фонд – резервный фонд) / количество пайщиков
function calculateShareValue() {
    // Расчет чистых активов (Активы - Обязательства)
    // Активами являются: денежные средства, дебиторская задолженность, имущество
    const totalAssets = transactions
        .filter(t => t.debitAccount && (t.debitAccount.startsWith('50') || t.debitAccount.startsWith('51') || t.debitAccount.startsWith('08') || t.debitAccount.startsWith('10') || t.debitAccount.startsWith('41')))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Обязательства: кредиторская задолженность
    const totalLiabilities = transactions
        .filter(t => t.creditAccount && (t.creditAccount.startsWith('60') || t.creditAccount.startsWith('76') || t.creditAccount.startsWith('62')))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Чистые активы
    const netAssets = totalAssets - totalLiabilities;
    
    // Неделимый фонд (счёт 86-2)
    const indivisibleFund = transactions
        .filter(t => t.creditAccount === '86-2')
        .reduce((sum, t) => sum + (t.amount || 0), 0) -
        transactions
            .filter(t => t.debitAccount === '86-2')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Резервный фонд (счёт 86-3 или 82)
    const reserveFund = transactions
        .filter(t => t.creditAccount === '86-3' || t.creditAccount === '82')
        .reduce((sum, t) => sum + (t.amount || 0), 0) -
        transactions
            .filter(t => t.debitAccount === '86-3' || t.debitAccount === '82')
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Паевая масса = Чистые активы - неделимый фонд - резервный фонд
    const shareMass = netAssets - indivisibleFund - reserveFund;
    
    // Количество активных пайщиков
    const activeMembersCount = members.filter(m => m.status === 'active').length;
    
    // Действительная стоимость пая
    const shareValue = activeMembersCount > 0 ? shareMass / activeMembersCount : 0;
    
    return {
        netAssets,
        indivisibleFund,
        reserveFund,
        shareMass,
        activeMembersCount,
        shareValue,
        calculationDate: new Date().toISOString().split('T')[0]
    };
}

// Функция для отображения расчёта стоимости пая
function showShareValueCalculation() {
    const result = calculateShareValue();
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>РАСЧЁТ ДЕЙСТВИТЕЛЬНОЙ СТОИМОСТИ ПАЯ</h2>
                <p>Потребительский кооператив</p>
                <p>Дата расчёта: ${result.calculationDate}</p>
            </div>
            
            <div class="settings-info" style="margin-top: 20px;">
                <h4>📋 Формула расчёта</h4>
                <p style="font-family: monospace; font-size: 14px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                    (Чистые активы – неделимый фонд – резервный фонд) / количество пайщиков
                </p>
            </div>
            
            <table class="balance-table" style="margin-top: 20px;">
                <tr><th>Показатель</th><th>Сумма, руб.</th></tr>
                <tr><td>Чистые активы</td><td class="amount">${result.netAssets.toLocaleString()}</td></tr>
                <tr><td>в т.ч. активы</td><td class="amount">${result.netAssets.toLocaleString()}</td></tr>
                <tr><td>в т.ч. обязательства</td><td class="amount">0</td></tr>
                <tr style="background-color: #ffebee;"><td>Минус: неделимый фонд</td><td class="amount">${result.indivisibleFund.toLocaleString()}</td></tr>
                <tr style="background-color: #ffebee;"><td>Минус: резервный фонд</td><td class="amount">${result.reserveFund.toLocaleString()}</td></tr>
                <tr class="total-row"><td>Паевая масса</td><td class="amount">${result.shareMass.toLocaleString()}</td></tr>
                <tr><td>Количество пайщиков</td><td class="amount">${result.activeMembersCount}</td></tr>
                <tr class="total-row" style="background-color: #e3f2fd;"><td>ДЕЙСТВИТЕЛЬНАЯ СТОИМОСТЬ ПАЯ</td><td class="amount">${result.shareValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
            </table>
            
            <div class="settings-info" style="margin-top: 20px;">
                <h4>ℹ️ Пояснения</h4>
                <ul style="font-size: 13px;">
                    <li><strong>Чистые активы</strong> — разница между активами и обязательстваами кооператива</li>
                    <li><strong>Неделимый фонд</strong> — не распределяется между пайщиками</li>
                    <li><strong>Резервный фонд</strong> — предназначен для покрытия убытков</li>
                    <li><strong>Паевая масса</strong> — сумма, распределяемая между пайщиками</li>
                    <li><strong>Действительная стоимость пая</strong> — сумма, подлежащая выплате при выходе пайщика</li>
                </ul>
            </div>
            
            <div class="report-actions" style="margin-top: 20px;">
                <button class="action-button" onclick="printShareValueCalculation()">Печать</button>
                <button class="action-button" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Расчёт стоимости пая', content);
}

// Функция печати расчёта стоимости пая
function printShareValueCalculation() {
    const result = calculateShareValue();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Расчёт действительной стоимости пая</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                .amount { text-align: right; }
                .total-row { font-weight: bold; background-color: #e0e0e0; }
            </style>
        </head>
        <body>
            <h2>РАСЧЁТ ДЕЙСТВИТЕЛЬНОЙ СТОИМОСТИ ПАЯ</h2>
            <p>Дата расчёта: ${result.calculationDate}</p>
            <table>
                <tr><th>Показатель</th><th>Сумма, руб.</th></tr>
                <tr><td>Чистые активы</td><td class="amount">${result.netAssets.toLocaleString()}</td></tr>
                <tr><td>Минус: неделимый фонд</td><td class="amount">${result.indivisibleFund.toLocaleString()}</td></tr>
                <tr><td>Минус: резервный фонд</td><td class="amount">${result.reserveFund.toLocaleString()}</td></tr>
                <tr class="total-row"><td>Паевая масса</td><td class="amount">${result.shareMass.toLocaleString()}</td></tr>
                <tr><td>Количество пайщиков</td><td class="amount">${result.activeMembersCount}</td></tr>
                <tr class="total-row"><td>Действительная стоимость пая</td><td class="amount">${result.shareValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
            </table>
            <p style="margin-top: 30px;">_____________________ / _____________________</p>
            <p>Главный бухгалтер</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Журнал целевого использования средств
function showTargetUseJournal() {
    const currentYear = new Date().getFullYear();
    
    // Фильтруем операции по фондам за текущий год
    const fundOperations = transactions.filter(t => {
        const year = t.date ? new Date(t.date).getFullYear() : 0;
        return year === currentYear && 
               (t.creditAccount === '86-1' || t.creditAccount === '86-2' || t.creditAccount === '86-3' || 
                t.creditAccount === '86-4' || t.creditAccount === '86-5' ||
                t.debitAccount === '86-1' || t.debitAccount === '86-2' || t.debitAccount === '86-3' ||
                t.debitAccount === '86-4' || t.debitAccount === '86-5');
    });
    
    let operationsHtml = '';
    fundOperations.forEach(op => {
        const isExpense = op.debitAccount && op.debitAccount.startsWith('86');
        const fundName = getFundName(op.creditAccount || op.debitAccount);
        operationsHtml += `
            <tr>
                <td>${op.date}</td>
                <td>${op.documentNumber || '—'}</td>
                <td>${isExpense ? 'Расход' : 'Поступление'}</td>
                <td>${fundName}</td>
                <td class="amount ${isExpense ? 'outgoing' : 'incoming'}">${op.amount.toLocaleString()} ₽</td>
                <td>${op.description || '—'}</td>
            </tr>
        `;
    });
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>ЖУРНАЛ ЦЕЛЕВОГО ИСПОЛЬЗОВАНИЯ СРЕДСТВ</h2>
                <p>Потребительский кооператив</p>
                <p>Отчётный период: ${currentYear} год</p>
            </div>
            
            <table class="settings-table" style="margin-top: 20px;">
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Документ</th>
                        <th>Тип</th>
                        <th>Фонд</th>
                        <th>Сумма</th>
                        <th>Описание</th>
                    </tr>
                </thead>
                <tbody>
                    ${fundOperations.length > 0 ? operationsHtml : '<tr><td colspan="6" style="text-align: center;">Операций не найдено</td></tr>'}
                </tbody>
            </table>
            
            <div class="report-actions" style="margin-top: 20px;">
                <button class="action-button" onclick="exportTargetUseJournal()">Экспорт</button>
                <button class="action-button" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Журнал целевого использования', content);
}

// Функция для получения названия фонда по счёту
function getFundName(account) {
    const fundNames = {
        '86-1': 'Паевой фонд',
        '86-2': 'Неделимый фонд',
        '86-3': 'Резервный фонд',
        '86-4': 'Фонд развития',
        '86-5': 'Фонд хоз. деятельности'
    };
    return fundNames[account] || account;
}

// Экспорт журнала целевого использования
function exportTargetUseJournal() {
    alert('Функция экспорта журнала будет реализована');
}

// ========================================
// Печатные формы (ПКО, РКО, Бухгалтерская справка)
// ========================================

// Функция для создания ПКО (Приходный кассовый ордер)
function createPKO() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Получаем список пайщиков для выбора
    const membersOptions = members.filter(m => m.status === 'active').map(m => 
        `<option value="${m.id}">${m.name}</option>`
    ).join('');
    
    const content = `
        <div class="settings-form">
            <h3>Приходный кассовый ордер (ПКО)</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>ПКО оформляется при поступлении наличных денежных средств в кассу кооператива.</p>
            </div>
            
            <form id="pko-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="pko-number">Номер ПКО *</label>
                        <input type="text" id="pko-number" value="ПКО-${new Date().getFullYear()}-001" required>
                    </div>
                    <div class="form-group">
                        <label for="pko-date">Дата *</label>
                        <input type="date" id="pko-date" value="${currentDate}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="pko-member">Пайщик *</label>
                    <select id="pko-member" required onchange="updatePKOAmount()">
                        <option value="">Выберите пайщика</option>
                        ${membersOptions}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="pko-amount">Сумма, руб. *</label>
                        <input type="number" id="pko-amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="pko-type">Тип взноса *</label>
                        <select id="pko-type">
                            <option value="entrance">Вступительный</option>
                            <option value="share">Паевой</option>
                            <option value="membership">Членский</option>
                            <option value="voluntary_share">Добровольный</option>
                            <option value="targeted">Целевой</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="pko-purpose">Основание *</label>
                    <input type="text" id="pko-purpose" value="Оплата паевого взноса" required>
                </div>
                
                <div class="form-group">
                    <label for="pko-source">От кого *</label>
                    <input type="text" id="pko-source" placeholder="ФИО полностью" required>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="savePKO()">Сформировать ПКО</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function savePKO() {
    const pkoNumber = document.getElementById('pko-number').value;
    const pkoDate = document.getElementById('pko-date').value;
    const pkoMember = document.getElementById('pko-member').value;
    const pkoAmount = parseFloat(document.getElementById('pko-amount').value);
    const pkoType = document.getElementById('pko-type').value;
    const pkoPurpose = document.getElementById('pko-purpose').value;
    const pkoSource = document.getElementById('pko-source').value;
    
    if (!pkoNumber || !pkoDate || !pkoMember || !pkoAmount || !pkoPurpose || !pkoSource) {
        alert('Заполните все обязательные поля');
        return;
    }
    
    const member = members.find(m => m.id === pkoMember);
    
    // Создаём запись о взносе
    const newPayment = {
        id: generateId(),
        memberId: pkoMember,
        type: pkoType,
        method: 'cash',
        amount: pkoAmount,
        date: pkoDate,
        description: pkoPurpose,
        paid: true,
        documentNumber: pkoNumber,
        createdAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    
    // Создаём бухгалтерскую проводку Дт 50 — Кт 86-х
    let creditAccount = '86-5';
    if (pkoType === 'entrance') creditAccount = '86-2';
    else if (pkoType === 'share' || pkoType === 'voluntary_share') creditAccount = '86-1';
    else if (pkoType === 'targeted') creditAccount = '86-4';
    
    const newTransaction = {
        id: generateId(),
        date: pkoDate,
        amount: pkoAmount,
        debitAccount: '50',
        creditAccount: creditAccount,
        description: `ПКО ${pkoNumber} от ${pkoDate} - ${pkoPurpose} от ${member.name}`,
        documentNumber: pkoNumber,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    saveData();
    saveSettings();
    
    // Печатаем ПКО
    printPKO(pkoNumber, pkoDate, pkoAmount, member.name, pkoPurpose, pkoSource);
    
    closeModal();
    alert('ПКО сформирован!');
}

function printPKO(number, date, amount, memberName, purpose, source) {
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const legalAddress = cooperativeSettings.legalAddress || '—';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Приходный кассовый ордер № ${number}</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 14px; }
                .header { text-align: center; margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: bold; margin: 10px 0; }
                .info { margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 8px; }
                .signature { margin-top: 30px; display: flex; justify-content: space-between; }
                .sign-block { text-align: center; width: 30%; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">ПРИХОДНЫЙ КАССОВЫЙ ОРДЕР</div>
                <p>№ ${number} от «${date.split('-')[2]}» ${new Date(date).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</p>
            </div>
            
            <div class="info">
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
                <p><strong>Адрес:</strong> ${legalAddress}</p>
            </div>
            
            <table>
                <tr>
                    <td style="width: 70%;">Принято от: <strong>${source}</strong></td>
                    <td>Сумма: <strong>${amount.toLocaleString('ru-RU')} руб.</strong></td>
                </tr>
            </table>
            
            <div class="info" style="margin-top: 15px;">
                <p><strong>Основание:</strong> ${purpose}</p>
                <p><strong>По документу:</strong> ${purpose}</p>
            </div>
            
            <div class="signature">
                <div class="sign-block">
                    <p>Главный бухгалтер</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
                <div class="sign-block">
                    <p>Кассир</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
                <div class="sign-block">
                    <p>Принял</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция для создания РКО (Расходный кассовый ордер)
function createRKO() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const content = `
        <div class="settings-form">
            <h3>Расходный кассовый ордер (РКО)</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>РКО оформляется при выплате наличных денежных средств из кассы кооператива.</p>
            </div>
            
            <form id="rko-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="rko-number">Номер РКО *</label>
                        <input type="text" id="rko-number" value="РКО-${new Date().getFullYear()}-001" required>
                    </div>
                    <div class="form-group">
                        <label for="rko-date">Дата *</label>
                        <input type="date" id="rko-date" value="${currentDate}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="rko-amount">Сумма, руб. *</label>
                        <input type="number" id="rko-amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="rko-type">Тип выплаты *</label>
                        <select id="rko-type">
                            <option value="return_share">Возврат паевого взноса</option>
                            <option value="salary">Заработная плата</option>
                            <option value="expense">Хозяйственные расходы</option>
                            <option value="other">Прочее</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="rko-recipient">Получатель *</label>
                    <input type="text" id="rko-recipient" placeholder="ФИО полностью" required>
                </div>
                
                <div class="form-group">
                    <label for="rko-purpose">Основание *</label>
                    <input type="text" id="rko-purpose" value="Выплата по заявлению" required>
                </div>
                
                <div class="form-group">
                    <label for="rko-doc">Документ-основание *</label>
                    <input type="text" id="rko-doc" placeholder="Заявление, протокол и т.д." required>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveRKO()">Сформировать РКО</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function saveRKO() {
    const rkoNumber = document.getElementById('rko-number').value;
    const rkoDate = document.getElementById('rko-date').value;
    const rkoAmount = parseFloat(document.getElementById('rko-amount').value);
    const rkoType = document.getElementById('rko-type').value;
    const rkoRecipient = document.getElementById('rko-recipient').value;
    const rkoPurpose = document.getElementById('rko-purpose').value;
    const rkoDoc = document.getElementById('rko-doc').value;
    
    if (!rkoNumber || !rkoDate || !rkoAmount || !rkoRecipient || !rkoPurpose || !rkoDoc) {
        alert('Заполните все обязательные поля');
        return;
    }
    
    // Создаём бухгалтерскую проводку Дт 76 — Кт 50
    const newTransaction = {
        id: generateId(),
        date: rkoDate,
        amount: rkoAmount,
        debitAccount: '76',
        creditAccount: '50',
        description: `РКО ${rkoNumber} от ${rkoDate} - ${rkoPurpose}`,
        documentNumber: rkoNumber,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    saveData();
    
    // Печатаем РКО
    printRKO(rkoNumber, rkoDate, rkoAmount, rkoRecipient, rkoPurpose, rkoDoc);
    
    closeModal();
    alert('РКО сформирован!');
}

function printRKO(number, date, amount, recipient, purpose, doc) {
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const legalAddress = cooperativeSettings.legalAddress || '—';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Расходный кассовый ордер № ${number}</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 14px; }
                .header { text-align: center; margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: bold; margin: 10px 0; }
                .info { margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 8px; }
                .signature { margin-top: 30px; display: flex; justify-content: space-between; }
                .sign-block { text-align: center; width: 25%; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">РАСХОДНЫЙ КАССОВЫЙ ОРДЕР</div>
                <p>№ ${number} от «${date.split('-')[2]}» ${new Date(date).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</p>
            </div>
            
            <div class="info">
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
                <p><strong>Адрес:</strong> ${legalAddress}</p>
            </div>
            
            <table>
                <tr>
                    <td style="width: 60%;">Выдать: <strong>${recipient}</strong></td>
                    <td>Сумма: <strong>${amount.toLocaleString('ru-RU')} руб.</strong></td>
                </tr>
            </table>
            
            <div class="info" style="margin-top: 15px;">
                <p><strong>Основание:</strong> ${purpose}</p>
                <p><strong>Документ:</strong> ${doc}</p>
            </div>
            
            <div class="signature">
                <div class="sign-block">
                    <p>Руководитель</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
                <div class="sign-block">
                    <p>Главный бухгалтер</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
                <div class="sign-block">
                    <p>Кассир</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
                <div class="sign-block">
                    <p>Получил</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция для создания бухгалтерской справки
function createAccountingCertificate() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const content = `
        <div class="settings-form">
            <h3>Бухгалтерская справка</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Бухгалтерская справка оформляется для документального подтверждения хозяйственных операций.</p>
            </div>
            
            <form id="certificate-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="cert-number">Номер справки *</label>
                        <input type="text" id="cert-number" value="БС-${new Date().getFullYear()}-001" required>
                    </div>
                    <div class="form-group">
                        <label for="cert-date">Дата *</label>
                        <input type="date" id="cert-date" value="${currentDate}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="cert-subject">Тема/Основание *</label>
                    <input type="text" id="cert-subject" placeholder="Например: Распределение членских взносов" required>
                </div>
                
                <div class="form-group">
                    <label for="cert-content">Содержание операции *</label>
                    <textarea id="cert-content" rows="5" placeholder="Описание операции с указанием сумм и счетов" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="cert-debit">Дебет *</label>
                        <input type="text" id="cert-debit" placeholder="Счёт дебета" required>
                    </div>
                    <div class="form-group">
                        <label for="cert-credit">Кредит *</label>
                        <input type="text" id="cert-credit" placeholder="Счёт кредита" required>
                    </div>
                    <div class="form-group">
                        <label for="cert-amount">Сумма, руб. *</label>
                        <input type="number" id="cert-amount" step="0.01" required>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveAccountingCertificate()">Сформировать справку</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function saveAccountingCertificate() {
    const certNumber = document.getElementById('cert-number').value;
    const certDate = document.getElementById('cert-date').value;
    const certSubject = document.getElementById('cert-subject').value;
    const certContent = document.getElementById('cert-content').value;
    const certDebit = document.getElementById('cert-debit').value;
    const certCredit = document.getElementById('cert-credit').value;
    const certAmount = parseFloat(document.getElementById('cert-amount').value);
    
    if (!certNumber || !certDate || !certSubject || !certContent || !certDebit || !certCredit || !certAmount) {
        alert('Заполните все обязательные поля');
        return;
    }
    
    // Создаём бухгалтерскую проводку
    const newTransaction = {
        id: generateId(),
        date: certDate,
        amount: certAmount,
        debitAccount: certDebit,
        creditAccount: certCredit,
        description: `Бухгалтерская справка ${certNumber} от ${certDate} - ${certSubject}`,
        documentNumber: certNumber,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    
    saveData();
    
    // Печатаем справку
    printAccountingCertificate(certNumber, certDate, certSubject, certContent, certDebit, certCredit, certAmount);
    
    closeModal();
    alert('Бухгалтерская справка сформирована!');
}

function printAccountingCertificate(number, date, subject, content, debit, credit, amount) {
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Бухгалтерская справка № ${number}</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 14px; line-height: 1.5; }
                .header { text-align: center; margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: bold; margin: 10px 0; }
                .info { margin: 15px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 8px; }
                .signature { margin-top: 30px; display: flex; justify-content: space-between; }
                .sign-block { text-align: center; width: 30%; }
                .content { text-align: justify; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">БУХГАЛТЕРСКАЯ СПРАВКА</div>
                <p>№ ${number} от «${date.split('-')[2]}» ${new Date(date).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</p>
            </div>
            
            <div class="info">
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
            </div>
            
            <div class="content">
                <p><strong>Тема:</strong> ${subject}</p>
                <p>${content}</p>
            </div>
            
            <table>
                <tr>
                    <th>Дебет</th>
                    <th>Кредит</th>
                    <th>Сумма</th>
                </tr>
                <tr>
                    <td style="text-align: center;">${debit}</td>
                    <td style="text-align: center;">${credit}</td>
                    <td style="text-align: right;">${amount.toLocaleString('ru-RU')} руб.</td>
                </tr>
            </table>
            
            <div class="signature">
                <div class="sign-block">
                    <p>Главный бухгалтер</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
                <div class="sign-block">
                    <p>Бухгалтер</p>
                    <p>_________________</p>
                    <p>(подпись)</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ==================== ЗАГРУЗКА ДАННЫХ ИЗ ЯНДЕКС.ДИСКА ====================

// Функция загрузки данных из Яндекс.Диска
async function loadDataFromYandexDisk() {
    try {
        console.log('[Yandex] Загрузка данных из Яндекс.Диска...');

        // Проверяем авторизацию
        const token = localStorage.getItem('yandexDiskToken');
        if (!token) {
            console.log('[Yandex] Авторизация не выполнена. Данные не загружены.');
            return false;
        }

        // Загружаем данные через yandex-disk-integration-v2.js
        if (typeof loadAllDataFromYandex === 'function') {
            const result = await loadAllDataFromYandex();
            if (result) {
                console.log('[Yandex] Данные успешно загружены!');
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error('[Yandex] Ошибка загрузки данных:', error.message);
        return false;
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    // Загружаем данные из Яндекс.Диска если авторизованы
    const yandexToken = localStorage.getItem('yandexDiskToken');
    if (yandexToken) {
        await loadDataFromYandexDisk();
    }

    // Проверяем, настроена ли папка C:\КООПЕРАНТ
    // ПРИМЕЧАНИЕ: Эта функция устарела, теперь используется Яндекс.Диск
    // if (!localStorage.getItem('coopDirectoryConfigured')) {
    //     showSetupModal();
    // } else {
        // Загружаем данные и продолжаем обычную инициализацию
        loadAllDataFromDirectory().then(() => {
            initializeFileSystemAccess();
            showSection('dashboard');
            updateDashboardStats();

            // Добавляем обработчики для новых разделов
            if (typeof loadApplicationsData === 'function') {
                loadApplicationsData();
            }

            if (typeof loadMeetingsData === 'function') {
                loadMeetingsData();
            }
        }).catch(err => {
            console.error('Ошибка при загрузке данных:', err);
            // Продолжаем инициализацию даже при ошибке загрузки
            initializeFileSystemAccess();
            showSection('dashboard');
            updateDashboardStats();
        });
    // }
});

// Функция показа модального окна настройки
function showSetupModal() {
    const modal = document.getElementById('setup-modal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.warn('[app.js] Модальное окно настройки не найдено');
    }
}

// Функция закрытия модального окна настройки
function closeSetupModal() {
    const modal = document.getElementById('setup-modal');
    if (modal) {
        modal.style.display = 'none';
        // Обновляем индикатор состояния после закрытия модального окна
        updateFolderStatusIndicator();
    }
}

// Функция настройки директории кооператива
async function setupCooperativeDirectory() {
    try {
        // Запрашиваем доступ к директории C:\КООПЕРАНТ
        coopDirectoryHandle = await window.showDirectoryPicker({
            id: 'coop_data_dir',
            mode: 'readwrite'
        });
        
        // Проверяем, что это действительно папка КООПЕРАНТ
        if (coopDirectoryHandle.name !== 'КООПЕРАНТ') {
            alert('Пожалуйста, выберите папку C:\\КООПЕРАНТ для хранения данных');
            coopDirectoryHandle = null;
            return false;
        }
        
        // Создаем поддиректории для разных типов данных
        await createCooperativeSubdirectories(coopDirectoryHandle);
        
        // Отмечаем, что директория настроена
        localStorage.setItem('coopDirectoryConfigured', 'true');
        
        // Закрываем модальное окно
        closeSetupModal();
        
        // Загружаем данные и продолжаем инициализацию
        loadData();
        showSection('dashboard');
        updateDashboardStats();
        
        alert('Директория для хранения данных успешно настроена!');
        return true;
    } catch (err) {
        console.error('Ошибка при настройке директории:', err);
        alert('Не удалось настроить директорию для хранения данных: ' + err.message);
        return false;
    }
}

// Функция для создания поддиректорий в папке КООПЕРАНТ
async function createCooperativeSubdirectories(directoryHandle) {
    const subdirs = ['Data', 'Documents', 'Reports', 'Backups', 'Applications', 'Certificates', 'Protocols'];
    
    for (const subdir of subdirs) {
        try {
            await directoryHandle.getDirectoryHandle(subdir, { create: true });
        } catch (err) {
            console.error(`Ошибка при создании поддиректории ${subdir}:`, err);
        }
    }
}

// Функции для работы с боковым меню
function showSideMenu(title, content) {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.createElement('div');
    overlay.className = 'side-menu-overlay';
    overlay.classList.add('active');
    overlay.onclick = closeSideMenu;
    document.body.appendChild(overlay);

    document.getElementById('side-menu-title').textContent = title;
    
    // Установка содержимого с обработкой скриптов
    const sideMenuBody = document.getElementById('side-menu-body');
    sideMenuBody.innerHTML = content;
    
    // Выполняем скрипты, которые были вставлены в HTML
    const scripts = sideMenuBody.getElementsByTagName('script');
    for (let script of scripts) {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
        document.head.removeChild(newScript);
    }
    
    sideMenu.classList.add('active');
}

function closeSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.querySelector('.side-menu-overlay');

    sideMenu.classList.remove('active');

    if (overlay) {
        document.body.removeChild(overlay);
    }
}

// Обновленная функция показа модального окна
function showModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}

// Обновленная функция закрытия модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-body').innerHTML = '';
}

// Функция инициализации доступа к файловой системе
async function initializeFileSystemAccess() {
    // Проверяем поддержку File System Access API
    if (!('showDirectoryPicker' in window)) {
        console.warn('File System Access API не поддерживается в этом браузере');
        return;
    }

    // Проверяем, есть ли уже настроенный дескриптор
    if (coopDirectoryHandle) {
        console.log('Дескриптор директории уже настроен');
        return;
    }

    // Попробуем восстановить дескриптор из localStorage (ограниченная поддержка)
    // В реальных условиях рекомендуется использовать более надежные методы
    try {
        // В идеале, здесь должен быть код для восстановления дескриптора
        // Но File System Access API не позволяет напрямую сохранять дескрипторы
        // Поэтому мы проверим, есть ли флаг настройки
        if (localStorage.getItem('coopDirectoryConfigured')) {
            // Мы знаем, что директория была настроена, но дескриптор нужно получить снова
            // Попробуем получить доступ без показа диалога, если возможно
            console.log('Директория была настроена ранее, но дескриптор нужно получить снова');
        }
    } catch (err) {
        console.error('Ошибка инициализации File System Access API:', err);
    }
}

// Функция для отображения разделов
function showSection(sectionId) {
    // Скрыть все разделы
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Показать выбранный раздел
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('Раздел не найден:', sectionId);
        return;
    }

    // Загрузить данные для выбранного раздела
    switch(sectionId) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'members':
            loadMembersData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'accounting':
            loadTransactionsData();
            break;
        case 'documents':
            loadDocumentsData();
            break;
        case 'applications':
            loadApplicationsData();
            break;
        case 'meetings':
            loadMeetingsData();
            break;
        case 'reports':
            // Отчеты не требуют специальной загрузки данных
            break;
        case 'settings':
            // Настройки не требуют загрузки данных, форма отображается в HTML
            break;
        default:
            console.warn('Неизвестный раздел:', sectionId);
    }
}

// Функция для обновления статистики на главной странице
function updateDashboardStats() {
    document.getElementById('total-members').textContent = members.length;
    
    const activeMembers = members.filter(member => member.status === 'active').length;
    document.getElementById('active-members').textContent = activeMembers;
    
    // Учитываем только обычные взносы, исключая возвраты и ожидаемые
    const regularPayments = payments.filter(p => p.type !== 'return_share' && !p.expected);
    document.getElementById('total-payments').textContent = regularPayments.length;
    
    // Учитываем ожидаемые взносы
    const expectedPayments = payments.filter(p => p.expected);
    document.getElementById('total-payments').textContent = `${regularPayments.length} (${expectedPayments.length} ожидаемых)`;
    
    const totalDebt = calculateTotalDebt();
    document.getElementById('debt-amount').textContent = totalDebt.toLocaleString() + ' ₽';

    // Добавляем чистый баланс паевых взносов (поступления минус возвраты)
    const netShareBalance = calculateNetShareBalance();
    const netBalanceElement = document.getElementById('net-share-balance');
    if (netBalanceElement) {
        netBalanceElement.textContent = netShareBalance.toLocaleString() + ' ₽';
    } else {
        // Если элемент не существует, создаем его и добавляем к статистике
        const statsContainer = document.querySelector('#dashboard-stats'); // Предполагаем, что есть контейнер для статистики
        if (statsContainer) {
            const newStatItem = document.createElement('div');
            newStatItem.className = 'stat-item';
            newStatItem.innerHTML = `
                <h3>Чистый баланс паевых взносов</h3>
                <p id="net-share-balance">${netShareBalance.toLocaleString()} ₽</p>
            `;
            statsContainer.appendChild(newStatItem);
        }
    }

    // Добавляем статистику по заявлениям
    const pendingApplications = applications.filter(app => app.status === 'pending');
    const approvedApplications = applications.filter(app => app.status === 'approved');
    
    // Добавляем элементы для отображения статистики по заявлениям, если они существуют
    let appStatsElement = document.getElementById('applications-stats');
    if (!appStatsElement) {
        // Создаем элемент статистики по заявлениям, если его нет
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            const appStatsDiv = document.createElement('div');
            appStatsDiv.className = 'stat-card';
            appStatsDiv.id = 'applications-stats';
            appStatsDiv.innerHTML = `
                <h3>Заявления на вступление</h3>
                <p id="pending-applications">0</p>
            `;
            statsContainer.appendChild(appStatsDiv);
        }
    }
    
    if (document.getElementById('pending-applications')) {
        document.getElementById('pending-applications').textContent = pendingApplications.length;
    }
}

// Функции для работы с заявлениями на вступление
function loadApplicationsData() {
    const tbody = document.getElementById('applications-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    applications.forEach(app => {
        const row = document.createElement('tr');
        
        // Определяем статус обработки заявления
        let statusText = 'На рассмотрении';
        let statusClass = 'status-pending';
        if (app.status === 'approved') {
            statusText = 'Одобрено';
            statusClass = 'status-approved';
        } else if (app.status === 'rejected') {
            statusText = 'Отклонено';
            statusClass = 'status-rejected';
        }
        
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.applicantName}</td>
            <td>${app.applicantContact}</td>
            <td>${app.submissionDate}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-button" onclick="viewApplication('${app.id}')">Просмотр</button>
                <button class="action-button edit" onclick="processApplication('${app.id}')">Обработать</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Функции для работы с заседаниями
function loadMeetingsData() {
    const tbody = document.getElementById('meetings-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    meetings.forEach(meeting => {
        const row = document.createElement('tr');
        
        // Определяем статус заседания
        let statusText = getMeetingStatusText(meeting.status);
        let statusClass = 'status-' + meeting.status;
        
        row.innerHTML = `
            <td>${meeting.id}</td>
            <td>${meeting.date}</td>
            <td>${getMeetingTypeText(meeting.type)}</td>
            <td>${meeting.topic || 'Нет темы'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-button" onclick="viewMeetingProtocol('${meeting.id}')">Протокол</button>
                ${meeting.status === 'scheduled' ? `<button class="action-button edit" onclick="conductMeeting('${meeting.id}')">Провести</button>` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getMeetingStatusText(status) {
    const statusMap = {
        'scheduled': 'Запланировано',
        'completed': 'Проведено',
        'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
}

function getMeetingTypeText(type) {
    const typeMap = {
        'board': 'Правление',
        'general': 'Общее собрание',
        'committee': 'Комитет',
        'other': 'Прочее'
    };
    return typeMap[type] || type;
}

// Функция для автоматического сохранения заявления в папку C:\КООПЕРАНТ
async function autoSaveApplication(application) {
    // Проверяем, доступен ли File System API
    if (!coopDirectoryHandle) {
        // Если директория не настроена, пытаемся получить доступ
        try {
            // В реальной системе пользователь должен будет выбрать папку C:\КООПЕРАНТ
            console.log('Директория C:\\КООПЕРАНТ не настроена. Требуется ручная настройка.');
            return false;
        } catch (err) {
            console.error('Ошибка доступа к директории:', err);
            return false;
        }
    }
    
    try {
        // Получаем поддиректорию для заявлений
        let applicationsDir;
        try {
            applicationsDir = await coopDirectoryHandle.getDirectoryHandle('Applications', { create: true });
        } catch (err) {
            // Если поддиректория не существует, создаем
            applicationsDir = await coopDirectoryHandle.getDirectoryHandle('Applications', { create: true });
        }
        
        // Создаем файл заявления
        const fileName = `application_${application.id}_${application.applicantName.replace(/\s+/g, '_')}.json`;
        const fileHandle = await applicationsDir.getFileHandle(fileName, { create: true });
        
        // Записываем данные заявления
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(application, null, 2));
        await writable.close();
        
        console.log('Заявление автоматически сохранено в C:\\КООПЕРАНТ\\Applications\\' + fileName);
        return true;
    } catch (err) {
        console.error('Ошибка автоматического сохранения заявления:', err);
        return false;
    }
}

// Функция для автоматического сохранения удостоверения пайщика
async function autoSaveCertificate(certificate) {
    // Проверяем, доступен ли File System API
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Требуется ручная настройка.');
        return false;
    }
    
    try {
        // Получаем поддиректорию для удостоверений
        let certificatesDir;
        try {
            certificatesDir = await coopDirectoryHandle.getDirectoryHandle('Certificates', { create: true });
        } catch (err) {
            certificatesDir = await coopDirectoryHandle.getDirectoryHandle('Certificates', { create: true });
        }
        
        // Создаем файл удостоверения
        const fileName = `certificate_${certificate.id}_${certificate.memberName.replace(/\s+/g, '_')}.json`;
        const fileHandle = await certificatesDir.getFileHandle(fileName, { create: true });
        
        // Записываем данные удостоверения
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(certificate, null, 2));
        await writable.close();
        
        console.log('У������остоверение автоматически сохранено в C:\\КООПЕРАНТ\\Certificates\\' + fileName);
        return true;
    } catch (err) {
        console.error('Ошибка автоматического сохранения удостоверения:', err);
        return false;
    }
}

// Функция для автоматического сохранения протокола заседания
async function autoSaveMeetingProtocol(meeting) {
    // Проверяем, доступен ли File System API
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Требуется ручная настройка.');
        return false;
    }
    
    try {
        // Получаем поддиректорию для протоколов
        let protocolsDir;
        try {
            protocolsDir = await coopDirectoryHandle.getDirectoryHandle('Protocols', { create: true });
        } catch (err) {
            protocolsDir = await coopDirectoryHandle.getDirectoryHandle('Protocols', { create: true });
        }
        
        // Создаем файл протокола
        const fileName = `protocol_${meeting.id}_${meeting.topic.replace(/\s+/g, '_')}_${meeting.date}.json`;
        const fileHandle = await protocolsDir.getFileHandle(fileName, { create: true });
        
        // Записываем данные протокола
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(meeting, null, 2));
        await writable.close();
        
        console.log('Протокол автоматически сохранен в C:\\КООПЕРАНТ\\Protocols\\' + fileName);
        return true;
    } catch (err) {
        console.error('Ош��������бка автоматического сохранения протокола:', err);
        return false;
    }
}

// Обновленная функция обработки подачи заявления
function handleApplicationSubmission(application) {
    applications.push(application);
    loadApplicationsData();
    
    // Автоматически сохраняем заявление в папку C:\КООПЕРАНТ
    autoSaveApplication(application);
    
    saveData(); // ��охраняем в основной фай������ данных
    alert('Заявление успешно п��дано и добавлено в оч����������едь на рассмотрение!');
    
    // После подачи заявления автоматически создаем вступительный взнос как "ожидаемый"
    // Это позволяет отслеживать обязательства пайщика по оплате взноса
    const expectedPayment = {
        id: generateId(),
        memberId: null, // Пока не создан пайщик, будет заполнено при принятии
        type: 'entrance', // Вступительный взнос
        method: application.paymentMethod,
        amount: application.desiredShareAmount,
        propertyDescription: application.propertyDescription,
        date: application.submissionDate,
        description: 'Ожидаемый вступительный взнос по заявлению #' + application.id,
        paid: false, // Пока не оплачено
        documentNumber: 'Ожид-' + application.id,
        expected: true, // Признак ожидаемого взноса
        applicationId: application.id, // Связь с заявлением
        createdAt: new Date().toISOString()
    };
    
    payments.push(expectedPayment);
    loadPaymentsData();
}

// Обновленная функция расчета задолженности
function calculateTotalDebt() {
    let total = 0;
    payments.forEach(payment => {
        // Учитываем только неоплаченные обычные взносы (не возвраты)
        // Исключаем ожидаемые взносы, так как они еще не подтверждены
        if (!payment.paid && payment.type !== 'return_share' && !payment.expected) {
            total += payment.amount || 0;
        }
    });
    return total;
}

// Обновленная функция расчета общей задолженности (включая ожидаемые)
function calculateTotalExpectedDebt() {
    let total = 0;
    payments.forEach(payment => {
        // Учитываем неоплаченные взносы и ожидаемые взносы
        if (!payment.paid && payment.type !== 'return_share') {
            total += payment.amount || 0;
        }
    });
    return total;
}

// Функция для генерации ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Функция для добавления заявления
function addApplication() {
    // Открываем отдельное окно/вкладку с формой заявления
    const applicationWindow = window.open('', '_blank');
    applicationWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Заявление на вступление в кооператив</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
                .form-row { display: flex; gap: 15px; }
                .form-row .form-group { flex: 1; }
                button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background-color: #45a049; }
                .required { color: red; }
            </style>
        </head>
        <body>
            <h2>Заявление на вступление в потребительский кооператив</h2>
            <form id="application-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="applicant-last-name">Фамилия <span class="required">*</span></label>
                        <input type="text" id="applicant-last-name" required>
                    </div>
                    <div class="form-group">
                        <label for="applicant-first-name">Имя <span class="required">*</span></label>
                        <input type="text" id="applicant-first-name" required>
                    </div>
                    <div class="form-group">
                        <label for="applicant-middle-name">Отчество</label>
                        <input type="text" id="applicant-middle-name">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="applicant-birth-date">Дата рождения</label>
                        <input type="date" id="applicant-birth-date">
                    </div>
                    <div class="form-group">
                        <label for="applicant-passport">Паспортные данные</label>
                        <input type="text" id="applicant-passport" placeholder="Серия и номер, кем и когда выдан">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="applicant-address">Адрес регистрации</label>
                    <textarea id="applicant-address" rows="2" placeholder="Полный адрес регистрации"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="applicant-residence-address">Адрес фактического проживания</label>
                    <textarea id="applicant-residence-address" rows="2" placeholder="Адрес фактического проживания"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="applicant-phone">Контактный телефон <span class="required">*</span></label>
                        <input type="tel" id="applicant-phone" required placeholder="+7 (XXX) XXX-XX-XX">
                    </div>
                    <div class="form-group">
                        <label for="applicant-email">Email</label>
                        <input type="email" id="applicant-email" placeholder="email@example.com">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="applicant-occupation">Род занятий / Место работы</label>
                    <input type="text" id="applicant-occupation" placeholder="Укажите род занятий или место работы">
                </div>
                
                <div class="form-group">
                    <label for="applicant-income">Источник и размер дохода</label>
                    <input type="text" id="applicant-income" placeholder="Укажите источники и примерный размер дохода">
                </div>
                
                <div class="form-group">
                    <label for="desired-share-amount">Желаемый размер паевого взноса (руб.) <span class="required">*</span></label>
                    <input type="number" id="desired-share-amount" required min="1" placeholder="Введите сумму">
                </div>
                
                <div class="form-group">
                    <label for="payment-method">Форма оплаты паевого взноса <span class="required">*</span></label>
                    <select id="payment-method" required>
                        <option value="">Выберите форму оплаты</option>
                        <option value="cash">Наличными деньгами</option>
                        <option value="non_cash">Безналичным переводом</option>
                        <option value="property">Иным имуществом</option>
                    </select>
                </div>
                
                <div class="form-group" id="property-details" style="display: none;">
                    <label for="property-description">Описание имущества (при оплате имуществом)</label>
                    <textarea id="property-description" rows="3" placeholder="Опишите имущество, которое планируете передать в качестве паевого взноса"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="additional-info">Дополнительная информация</label>
                    <textarea id="additional-info" rows="3" placeholder="Любая дополнительная информация, которую считаете нужной сообщить"></textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="terms-agreement" required> 
                        Я ознакомлен(а) с Уставом кооператива и обязуюсь его соблюдать <span class="required">*</span>
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="personal-data-consent" required> 
                        Я даю согласие на обработку моих персональных данных <span class="required">*</span>
                    </label>
                </div>
                
                <button type="button" onclick="submitApplication()">Подать заявление</button>
                <button type="button" onclick="window.close()">Отмена</button>
            </form>
            
            <script>
                document.getElementById('payment-method').addEventListener('change', function() {
                    const propertyDetails = document.getElementById('property-details');
                    if (this.value === 'property') {
                        propertyDetails.style.display = 'block';
                    } else {
                        propertyDetails.style.display = 'none';
                    }
                });
                
                function submitApplication() {
                    // Собираем данные из формы
                    const lastName = document.getElementById('applicant-last-name').value;
                    const firstName = document.getElementById('applicant-first-name').value;
                    const middleName = document.getElementById('applicant-middle-name').value;
                    const fullName = (lastName + ' ' + firstName + ' ' + middleName).trim();
                    
                    if (!lastName || !firstName) {
                        alert('Пожалуйста, укажите фамилию и имя');
                        return;
                    }
                    
                    const birthDate = document.getElementById('applicant-birth-date').value;
                    const passport = document.getElementById('applicant-passport').value;
                    const regAddress = document.getElementById('applicant-address').value;
                    const resAddress = document.getElementById('applicant-residence-address').value;
                    const phone = document.getElementById('applicant-phone').value;
                    const email = document.getElementById('applicant-email').value;
                    const occupation = document.getElementById('applicant-occupation').value;
                    const income = document.getElementById('applicant-income').value;
                    const shareAmount = document.getElementById('desired-share-amount').value;
                    const paymentMethod = document.getElementById('payment-method').value;
                    const propertyDesc = document.getElementById('property-description').value;
                    const additionalInfo = document.getElementById('additional-info').value;
                    
                    // Проверяем обязательные поля
                    if (!lastName || !firstName || !phone || !shareAmount || !paymentMethod) {
                        alert('Пожалуйста, заполните все обязательные поля');
                        return;
                    }
                    
                    // Проверяем согласие с условиями
                    const termsAgreement = document.getElementById('terms-agreement').checked;
                    const personalDataConsent = document.getElementById('personal-data-consent').checked;
                    
                    if (!termsAgreement || !personalDataConsent) {
                        alert('Пожалуйста, подтвердите согласие с условиями');
                        return;
                    }
                    
                    // Формируем объект заявления
                    const application = {
                        id: generateId(),
                        applicantName: fullName,
                        applicantContact: phone + (email ? ', ' + email : ''),
                        birthDate: birthDate,
                        passport: passport,
                        registrationAddress: regAddress,
                        residenceAddress: resAddress,
                        occupation: occupation,
                        income: income,
                        desiredShareAmount: parseFloat(shareAmount),
                        paymentMethod: paymentMethod,
                        propertyDescription: propertyDesc,
                        additionalInfo: additionalInfo,
                        submissionDate: new Date().toISOString().split('T')[0],
                        status: 'pending', // На рассмотрении
                        createdAt: new Date().toISOString()
                    };
                    
                    // Отправляем данные в основное окно
                    window.opener.handleApplicationSubmission(application);
                    window.close();
                }
                
                function generateId() {
                    return Date.now().toString(36) + Math.random().toString(36).substr(2);
                }
            <\/script>
        </body>
        </html>
    `);
}

// Функция для генерации удостоверения пайщика
function generateCertificateForMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // Проверяем, есть ли уже удостоверение у пайщика
    const existingCertificate = certificates.find(c => c.memberId === memberId);
    if (existingCertificate) {
        alert('У пайщика уже есть удостоверение');
        return;
    }
    
    // Создаем удостоверение
    const certificate = {
        id: generateId(),
        memberId: memberId,
        memberName: member.name,
        issueDate: new Date().toISOString().split('T')[0],
        certificateNumber: generateCertificateNumber(),
        status: 'active',
        issuedBy: '', // Будет заполнено при формировании
        createdAt: new Date().toISOString()
    };
    
    certificates.push(certificate);
    saveData();
    
    // Показываем удостоверение (это также автоматически сохранит его в папку C:\КООПЕРАНТ)
    showCertificate(certificate);
}

function generateCertificateNumber() {
    // Генерируем номер удостоверения (например, УД-ГГГГ-Номер)
    const year = new Date().getFullYear().toString().slice(-2);
    const count = certificates.filter(c => c.certificateNumber.startsWith(`УД-${year}`)).length + 1;
    return `УД-${year}-${count.toString().padStart(4, '0')}`;
}

function showCertificate(certificate) {
    // Автоматически сохраняем удостоверение в папку C:\КООПЕРАНТ
    autoSaveCertificate(certificate);
    
    // В реальной системе это будет генерация PDF, но для демонстрации покажем в модальном окне
    showModal(`
        <div style="font-family: Arial, serif; padding: 20px; border: 2px solid #000; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">УДОСТОВЕРЕНИЕ</h2>
                <p style="margin: 5px 0;">члена потребительского кооператива</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>${certificate.memberName}</strong></p>
                <p style="margin: 10px 0;">выдано: ${certificate.issueDate}</p>
                <p style="margin: 10px 0;">№ ${certificate.certificateNumber}</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <p style="margin: 10px 0;">Подпись _________________________</p>
                <p style="margin: 10px 0;">Печать</p>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button type="button" onclick="exportCertificateAsPDF('${certificate.id}')">Сохранить как PDF</button>
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

// Функция экспорта удостоверения в PDF будет использоваться из внешнего файла pdf_export.js
// Она автоматически использует кириллический шрифт для корректного отображения русского текста

// Функции для работы с заседаниями и протоколами
function scheduleMeeting() {
    const currentDate = new Date().toISOString().split("T")[0];
    showModal(`
        <h3>Назначить заседание</h3>
        <form id="meeting-form">
            <div class="form-group">
                <label for="meeting-date">Дата заседания *</label>
                <input type="date" id="meeting-date" value="${currentDate}" required>
            </div>
            <div class="form-group">
                <label for="meeting-time">Время заседания</label>
                <input type="time" id="meeting-time" value="10:00">
            </div>
            <div class="form-group">
                <label for="meeting-place">Место проведения</label>
                <input type="text" id="meeting-place" placeholder="Адрес или название помещения">
            </div>
            <div class="form-group">
                <label for="meeting-type">Тип заседания</label>
                <select id="meeting-type">
                    <option value="board">Заседание правления</option>
                    <option value="general">Общее собрание</option>
                    <option value="committee">Заседание комитета</option>
                    <option value="other">Прочее</option>
                </select>
            </div>
            <div class="form-group">
                <label for="meeting-topic">Тема заседания</label>
                <input type="text" id="meeting-topic" placeholder="Краткое описание темы заседания">
            </div>
            <div class="form-group">
                <label for="meeting-description">Повестка дня</label>
                <textarea id="meeting-description" rows="4" placeholder="Подробное описание вопросов, выносимых на заседание"></textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center;">
                <button type="button" class="action-button save" onclick="createMeeting()">Создать заседание</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

function createMeeting() {
    const date = document.getElementById('meeting-date').value;
    const time = document.getElementById('meeting-time').value;
    const place = document.getElementById('meeting-place').value;
    const type = document.getElementById('meeting-type').value;
    const topic = document.getElementById('meeting-topic').value;
    const description = document.getElementById('meeting-description').value;
    
    const meeting = {
        id: generateId(),
        date: date,
        time: time,
        place: place,
        type: type,
        topic: topic,
        agenda: description,
        status: 'scheduled', // Запланировано
        attendees: [], // Участники
        decisions: [], // Принятые решения
        createdAt: new Date().toISOString()
    };
    
    meetings.push(meeting);
    closeModal();
    loadMeetingsData();
    saveData();
    alert('Заседание успешно запланировано');
}

function conductMeeting(id) {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;
    
    // Показываем форму для проведения заседания
    showModal(`
        <h3>Проведение заседания #${meeting.id}</h3>
        <div class="meeting-conduct">
            <h4>Информация о заседании</h4>
            <p><strong>Дата:</strong> ${meeting.date}</p>
            <p><strong>Время:</strong> ${meeting.time}</p>
            <p><strong>Место:</strong> ${meeting.place || 'Не указано'}</p>
            <p><strong>Тип:</strong> ${getMeetingTypeText(meeting.type)}</p>
            <p><strong>Тема:</strong> ${meeting.topic || 'Не указана'}</p>
            
            <h4>Присутствующие</h4>
            <div id="attendees-list">
                <!-- Список участников будет загружен здесь -->
            </div>
            <button type="button" onclick="addAttendeeToMeeting('${meeting.id}')">Добавить участника</button>
            
            <h4>Принятые решения</h4>
            <div id="decisions-list">
                <!-- Список решений будет загружен здесь -->
            </div>
            <button type="button" onclick="addDecisionToMeeting('${meeting.id}')">Добавить решение</button>
            
            <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center;">
                <button type="button" class="action-button save" onclick="finalizeMeeting('${meeting.id}')">Завершить заседание</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
    
    // Загружаем участников и решения
    loadMeetingAttendeesAndDecisions(meeting.id);
}

function loadMeetingAttendeesAndDecisions(meetingId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    // Загружаем участников
    const attendeesList = document.getElementById('attendees-list');
    if (meeting.attendees && meeting.attendees.length > 0) {
        attendeesList.innerHTML = '<ul>' + meeting.attendees.map(attendee => 
            `<li>${attendee.name} (${attendee.position || 'Участник'}) 
            <button onclick="removeAttendeeFromMeeting('${meetingId}', '${attendee.id}')" class="action-button delete" style="padding: 2px 5px; font-size: 12px;">Удалить</button>
            </li>`
        ).join('') + '</ul>';
    } else {
        attendeesList.innerHTML = '<p>Нет добавленных участников</p>';
    }
    
    // Загружаем решения
    const decisionsList = document.getElementById('decisions-list');
    if (meeting.decisions && meeting.decisions.length > 0) {
        decisionsList.innerHTML = '<ul>' + meeting.decisions.map(decision => 
            `<li><strong>${decision.title}</strong>: ${decision.content} 
            <button onclick="removeDecisionFromMeeting('${meetingId}', '${decision.id}')" class="action-button delete" style="padding: 2px 5px; font-size: 12px;">Удалить</button>
            </li>`
        ).join('') + '</ul>';
    } else {
        decisionsList.innerHTML = '<p>Нет принятых решений</p>';
    }
}

function addAttendeeToMeeting(meetingId) {
    showModal(`
        <h3>Добавить участника заседания</h3>
        <div class="form-group">
            <label for="attendee-name">ФИО участника *</label>
            <input type="text" id="attendee-name" placeholder="Фамилия Имя Отчество" required>
        </div>
        <div class="form-group">
            <label for="attendee-position">Должность/Статус</label>
            <input type="text" id="attendee-position" placeholder="Должность или статус участника">
        </div>
        <div class="form-group">
            <label for="attendee-role">Роль на заседании</label>
            <select id="attendee-role">
                <option value="member">Член кооператива</option>
                <option value="observer">Наблюдатель</option>
                <option value="guest">Гость</option>
                <option value="chairman">Председатель</option>
                <option value="secretary">Секретарь</option>
            </select>
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center;">
            <button type="button" class="action-button save" onclick="saveAttendeeToMeeting('${meetingId}')">Добавить участника</button>
            <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
        </div>
    `);
}

function saveAttendeeToMeeting(meetingId) {
    const name = document.getElementById('attendee-name').value;
    const position = document.getElementById('attendee-position').value;
    const role = document.getElementById('attendee-role').value;
    
    if (!name) {
        alert('Пожалуйста, укажите ФИО участника');
        return;
    }
    
    const attendee = {
        id: generateId(),
        name: name,
        position: position,
        role: role,
        addedAt: new Date().toISOString()
    };
    
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        if (!meeting.attendees) meeting.attendees = [];
        meeting.attendees.push(attendee);
        saveData();
        closeModal();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function removeAttendeeFromMeeting(meetingId, attendeeId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting && meeting.attendees) {
        meeting.attendees = meeting.attendees.filter(a => a.id !== attendeeId);
        saveData();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function addDecisionToMeeting(meetingId) {
    showModal(`
        <h3>Добавить решение заседания</h3>
        <div class="form-group">
            <label for="decision-title">Заголовок решения *</label>
            <input type="text" id="decision-title" placeholder="Краткое описание решения" required>
        </div>
        <div class="form-group">
            <label for="decision-content">Содержание решения *</label>
            <textarea id="decision-content" rows="4" placeholder="Полный текст принятого решения" required></textarea>
        </div>
        <div class="form-group">
            <label for="decision-responsible">Ответственный за исполнение</label>
            <input type="text" id="decision-responsible" placeholder="ФИО ответственного">
        </div>
        <div class="form-group">
            <label for="decision-deadline">Срок исполнения</label>
            <input type="date" id="decision-deadline">
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center;">
            <button type="button" class="action-button save" onclick="saveDecisionToMeeting('${meetingId}')">Добавить решение</button>
            <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
        </div>
    `);
}

function saveDecisionToMeeting(meetingId) {
    const title = document.getElementById('decision-title').value;
    const content = document.getElementById('decision-content').value;
    const responsible = document.getElementById('decision-responsible').value;
    const deadline = document.getElementById('decision-deadline').value;
    
    if (!title || !content) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
    }
    
    const decision = {
        id: generateId(),
        title: title,
        content: content,
        responsible: responsible,
        deadline: deadline,
        status: 'adopted', // Принято
        adoptedAt: new Date().toISOString()
    };
    
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        if (!meeting.decisions) meeting.decisions = [];
        meeting.decisions.push(decision);
        saveData();
        closeModal();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function removeDecisionFromMeeting(meetingId, decisionId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting && meeting.decisions) {
        meeting.decisions = meeting.decisions.filter(d => d.id !== decisionId);
        saveData();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function finalizeMeeting(meetingId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        meeting.status = 'completed';
        meeting.completedAt = new Date().toISOString();
        saveData();
        closeModal();
        loadMeetingsData();
        alert('Заседание завершено, протокол сформирован');
    }
}

function viewMeetingProtocol(meetingId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // Автоматически сохраняем протокол в папку C:\КООПЕРАНТ
    autoSaveMeetingProtocol(meeting);

    let attendeesHtml = '';
    if (meeting.attendees && meeting.attendees.length > 0) {
        attendeesHtml = '<ul>' + meeting.attendees.map(attendee =>
            `<li>${attendee.name} (${attendee.position || attendee.role})</li>`
        ).join('') + '</ul>';
    } else {
        attendeesHtml = '<p>Нет участников</p>';
    }

    let decisionsHtml = '';
    if (meeting.decisions && meeting.decisions.length > 0) {
        decisionsHtml = '<ol>' + meeting.decisions.map((decision, index) =>
            `<li><strong>${decision.title}</strong><br>${decision.content}
            ${decision.responsible ? '<br><em>Ответственный: ' + decision.responsible + '</em>' : ''}
            ${decision.deadline ? '<br><em>Срок исполнения: ' + decision.deadline + '</em>' : ''}
            </li>`
        ).join('') + '</ol>';
    } else {
        decisionsHtml = '<p>Нет принятых решений</p>';
    }

    showModal(`
        <div style="font-family: Arial, serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">ПРОТОКОЛ ЗАСЕДАНИЯ</h2>
                <p style="margin: 5px 0;">${getMeetingTypeText(meeting.type)}</p>
            </div>

            <div style="margin: 15px 0;">
                <p><strong>Дата:</strong> ${meeting.date}</p>
                <p><strong>Время:</strong> ${meeting.time}</p>
                <p><strong>Место:</strong> ${meeting.place || 'Не указано'}</p>
                <p><strong>Тема:</strong> ${meeting.topic || 'Не указана'}</p>
            </div>

            <div style="margin: 15px 0;">
                <h4>Повестка дня:</h4>
                <p>${meeting.agenda || 'Не указана'}</p>
            </div>

            <div style="margin: 15px 0;">
                <h4>Присутствовали:</h4>
                ${attendeesHtml}
            </div>

            <div style="margin: 15px 0;">
                <h4>Принятые решения:</h4>
                ${decisionsHtml}
            </div>

            <div style="margin-top: 30px; text-align: right;">
                <p>Председатель _________________________</p>
                <p>Секретарь _________________________</p>
            </div>
        </div>

        <div style="margin-top: 20px; text-align: center;">
            <button type="button" onclick="exportProtocolAsPDF('${meeting.id}')">Сохранить протокол как PDF</button>
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

// Функция экспорта протокола в PDF будет использоваться из внешнего файла pdf_export.js
// Она автоматически использует кириллический шрифт для корректного отображения русского текста

function getMeetingTypeText(type) {
    const typeMap = {
        'board': 'Заседание правления',
        'general': 'Общее собрание',
        'committee': 'Заседание комитета',
        'other': 'Прочее заседание'
    };
    return typeMap[type] || type;
}

// Функция для пакетного рассмотрения заявлений
function batchProcessApplications() {
    const pendingApps = applications.filter(app => app.status === 'pending');
    
    if (pendingApps.length === 0) {
        alert('Нет заявлений на рассмотрении');
        return;
    }
    
    showModal(`
        <h3>Пакетное рассмотрение заявлений</h3>
        <p>Найдено ${pendingApps.length} заявлений на рассмотрении</p>
        
        <div style="max-height: 400px; overflow-y: auto; margin: 15px 0; border: 1px solid #ccc; padding: 10px;">
            ${pendingApps.map(app => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${app.applicantName}</strong><br>
                        <small>Дата подачи: ${app.submissionDate}, Взнос: ${(app.desiredShareAmount || 0).toLocaleString()} ₽</small>
                    </div>
                    <div>
                        <button class="action-button edit" onclick="processApplication('${app.id}')">Обработать</button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 1rem; text-align: center;">
            <button type="button" onclick="scheduleMeetingForApplications()">Назначить заседание для рассмотрения</button>
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

function scheduleMeetingForApplications() {
    // Автоматически создаем заседание для рассмотрения заявлений
    const meeting = {
        id: generateId(),
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Через неделю
        time: '10:00',
        place: 'Конференц-зал',
        type: 'board',
        topic: 'Рассмотрение заявлений на вступление',
        agenda: 'Рассмотрение заявлений на вступление в кооператив и принятие решений',
        status: 'scheduled',
        attendees: [],
        decisions: [],
        applicationIds: applications.filter(app => app.status === 'pending').map(app => app.id), // Связываем с заявлениями
        createdAt: new Date().toISOString()
    };
    
    meetings.push(meeting);
    closeModal();
    loadMeetingsData();
    saveData();
    alert('Заседание назначено для рассмотрения заявлений на вступление');
}

// Функция для обработки заявления
function processApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    showModal(`
        <h3>Обработка заявления #${app.id}</h3>
        <div class="application-processing">
            <p><strong>Заявитель:</strong> ${app.applicantName}</p>
            <p><strong>Желаемый взнос:</strong> ${(app.desiredShareAmount || 0).toLocaleString()} ₽</p>
            <p><strong>Форма оплаты:</strong> ${getApplicationPaymentMethodText(app.paymentMethod)}</p>
            
            <div class="form-group" style="margin-top: 1rem;">
                <label for="processing-decision">Решение по заявлению:</label>
                <select id="processing-decision">
                    <option value="approve">Принять в члены кооператива</option>
                    <option value="reject">Отказать во вступлении</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="processing-notes">Комментарии к ре��������ению:</label>
                <textarea id="processing-notes" rows="3" placeholder="Укажите причины принятого решения"></textarea>
            </div>
            
            <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center;">
                <button type="button" class="action-button save" onclick="finalizeApplicationProcess('${app.id}')">Принять решение</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
}

function finalizeApplicationProcess(id) {
    const decision = document.getElementById('processing-decision').value;
    const notes = document.getElementById('processing-notes').value;
    
    const appIndex = applications.findIndex(a => a.id === id);
    if (appIndex !== -1) {
        applications[appIndex].status = decision === 'approve' ? 'approved' : 'rejected';
        applications[appIndex].decisionNotes = notes;
        applications[appIndex].processedAt = new Date().toISOString();
        
        if (decision === 'approve') {
            // Создаем нового пайщика
            const newMember = {
                id: generateId(),
                name: applications[appIndex].applicantName,
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0],
                contact: applications[appIndex].applicantContact,
                address: applications[appIndex].residenceAddress || applications[appIndex].registrationAddress,
                notes: 'Принят по заявлению #' + applications[appIndex].id,
                createdAt: new Date().toISOString()
            };
            
            members.push(newMember);
            
            // Если был взнос, создаем запись о нем
            if (applications[appIndex].desiredShareAmount > 0) {
                const newPayment = {
                    id: generateId(),
                    memberId: newMember.id,
                    type: 'entrance', // Вступительный взнос
                    method: applications[appIndex].paymentMethod,
                    amount: applications[appIndex].desiredShareAmount,
                    propertyDescription: applications[appIndex].propertyDescription,
                    date: new Date().toISOString().split('T')[0],
                    description: 'Вступительный взнос по заявлению #' + applications[appIndex].id,
                    paid: true, // Сч����������таем оплаченным при принятии
                    documentNumber: 'Вст-' + new Date().getTime(),
                    createdAt: new Date().toISOString()
                };
                
                payments.push(newPayment);
                
                // Создаем бухгалтерскую проводку
                createAccountingEntryForPayment(newPayment);
            }
            
            // Автоматически создаем удостоверение для нового пайщика
            generateCertificateForMember(newMember.id);
        }
        
        loadApplicationsData();
        if (typeof loadMembersData === 'function') loadMembersData();
        if (typeof loadPaymentsData === 'function') loadPaymentsData();
        updateDashboardStats();
        saveData();
        
        closeModal();
        alert('Решение по заявлению принято и оформлено');
    }
}

function getApplicationPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Наличными деньгами',
        'non_cash': 'Безналичным ���������������������������������������������������������ереводом',
        'property': 'Иным имуществом'
    };
    return methodMap[method] || method;
}

function getApplicationStatusText(status) {
    const statusMap = {
        'pending': 'На рассмотрении',
        'approved': 'Одобрено',
        'rejected': 'Отклонено'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classMap[status] || 'status-pending';
}

// Функция для просмотра заявления
function viewApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    showModal(`
        <h3>Заявление на вступление #${app.id}</h3>
        <div class="application-details">
            <h4>Личные данные</h4>
            <p><strong>ФИО:</strong> ${app.applicantName}</p>
            <p><strong>Контакт:</strong> ${app.applicantContact}</p>
            <p><strong>Дата рождения:</strong> ${app.birthDate || 'Не указана'}</p>
            <p><strong>Паспорт:</strong> ${app.passport || 'Не указ�����������������������������н'}</p>
            <p><strong>Адрес регистрации:</strong> ${app.registrationAddress || 'Не указан'}</p>
            <p><strong>Адрес проживания:</strong> ${app.residenceAddress || 'Не указан'}</p>
            
            <h4>Дополнительная информация</h4>
            <p><strong>Род занятий:</strong> ${app.occupation || 'Не указан'}</p>
            <p><strong>Доход:</strong> ${app.income || 'Не указан'}</p>
            <p><strong>Желаемый размер паевого взноса:</strong> ${(app.desiredShareAmount || 0).toLocaleString()} ₽</p>
            <p><strong>Форма оплаты:</strong> ${getApplicationPaymentMethodText(app.paymentMethod)}</p>
            ${app.propertyDescription ? `<p><strong>Описание имущества:</strong> ${app.propertyDescription}</p>` : ''}
            <p><strong>Дополнительная информация:</strong> ${app.additionalInfo || 'Не указана'}</p>
            
            <h4>Статус и дата подачи</h4>
            <p><strong>Дата подачи:</strong> ${app.submissionDate}</p>
            <p><strong>Статус:</strong> <span class="${getStatusClass(app.status)}">${getApplicationStatusText(app.status)}</span></p>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

// Функция для расчета общей задолженности
function calculateTotalDebt() {
    let total = 0;
    payments.forEach(payment => {
        if (!payment.paid) {
            total += payment.amount || 0;
        }
    });
    return total;
}

// Функция для настройки доступа к папке C:\КООПЕРАНТ
async function setupCooperativeDirectory() {
    try {
        coopDirectoryHandle = await window.showDirectoryPicker({
            id: 'coop_data_dir',
            mode: 'readwrite'
        });

        // Проверяем, что это действительно папка КООПЕРАНТ
        if (coopDirectoryHandle.name !== 'КООПЕРАНТ') {
            alert('Пожалуйста, выберите папку C:\\КООПЕРАНТ для хранения данных');
            coopDirectoryHandle = null;
            return false;
        }

        // Создаем поддиректории для разных типов данных
        await createCooperativeSubdirectories(coopDirectoryHandle);

        // Отмечаем, что директория настроена
        localStorage.setItem('coopDirectoryConfigured', 'true');

        // Закрываем модальное окно
        closeSetupModal();

        // Загружаем данные и продолжаем инициализацию
        await loadAllDataFromDirectory();
        showSection('dashboard');
        updateDashboardStats();

        // Обновляем индикатор состояния
        updateFolderStatusIndicator();

        alert('Директория для хранения данных успешно настроена!');
        return true;
    } catch (err) {
        console.error('Ошибка при настройке директории:', err);
        alert('Не удалось настроить директорию для хранения данных: ' + err.message);
        return false;
    }
}

// Функция для создания поддиректорий в папке КООПЕРАНТ
async function createCooperativeSubdirectories(directoryHandle) {
    const subdirs = ['Data', 'Documents', 'Reports', 'Backups'];
    
    for (const subdir of subdirs) {
        try {
            await directoryHandle.getDirectoryHandle(subdir, { create: true });
        } catch (err) {
            console.error(`Ошибка при создании поддиректории ${subdir}:`, err);
        }
    }
}

// Функция для автоматического сохранения данных в папку C:\КООПЕРАНТ
async function autoSaveData() {
    if (!coopDirectoryHandle) {
        // Если директория не настроена, используем резервный метод
        console.warn('Директория C:\\КООПЕРАНТ не настроена. Используем резервный метод сохранения.');
        return false;
    }

    try {
        // Получаем поддиректорию для данных
        const dataDirHandle = await coopDirectoryHandle.getDirectoryHandle('Data', { create: true });

        // Создаем или получаем файл данных
        const fileHandle = await dataDirHandle.getFileHandle('coop_data.json', { create: true });

        // Подготавливаем данные для сохранения
        const data = {
            members: members,
            payments: payments,
            transactions: transactions,
            documents: documents,
            applications: applications,
            meetings: meetings,
            certificates: certificates,
            lastUpdated: new Date().toISOString()
        };

        // Записываем данные в файл
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        console.log('Данные автоматически сохранены в C:\\КООПЕРАНТ\\Data\\coop_data.json');
        return true;
    } catch (err) {
        console.error('Ошибка при автоматическом сохранении данных:', err);
        return false;
    }
}

// Обновленная функция сохранения данных (теперь вызывает автосохранение)
async function saveData() {
    const success = await autoSaveData();
    if (!success) {
        // Резервный вариант для браузеров без поддержки File System API или при проблемах с доступом
        const dataStr = JSON.stringify({
            members: members,
            payments: payments,
            transactions: transactions,
            documents: documents,
            applications: applications,
            meetings: meetings,
            certificates: certificates,
            lastUpdated: new Date().toISOString()
        }, null, 2);

        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'coop_data.json';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);

        console.warn('Данные сохранены через загрузку файла (резервный метод)');
    }
    
    // Также сохраняем данные в localStorage как резервную копию
    const backupData = {
        members: members,
        payments: payments,
        transactions: transactions,
        documents: documents,
        applications: applications,
        meetings: meetings,
        certificates: certificates,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('coopData', JSON.stringify(backupData));
    
    // Обновляем индикатор состояния
    updateFolderStatusIndicator();
}

// Функция для автоматического сохранения при каждом изменении
function scheduleAutoSave() {
    // Сохраняем данные через 2 секунды после последнего изменения
    // Это предотвращает слишком частые сохранения
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
        saveData();
    }, 2000);
}

async function loadData() {
    try {
        // Проверяем, настроена ли директория
        if (coopDirectoryHandle) {
            // Загружаем данные из настроенной директории
            try {
                // Получаем поддиректорию для данных
                const dataDirHandle = await coopDirectoryHandle.getDirectoryHandle('Data', { create: false });

                // Получаем файл данных
                const fileHandle = await dataDirHandle.getFileHandle('coop_data.json');

                // Читаем содержимое файла
                const file = await fileHandle.getFile();
                const contents = await file.text();
                const data = JSON.parse(contents);

                members = data.members || [];
                payments = data.payments || [];
                transactions = data.transactions || [];
                documents = data.documents || [];
                applications = data.applications || [];
                meetings = data.meetings || [];
                certificates = data.certificates || [];

                console.log('Данные успешно загружены из C:\\КООПЕРАНТ\\Data\\coop_data.json');
            } catch (err) {
                console.warn('Не удалось загрузить данные из настроенной директории:', err);
                
                // Если не удалось загрузить из директории, пробуем из localStorage
                const savedData = localStorage.getItem('coopData');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    members = data.members || [];
                    payments = data.payments || [];
                    transactions = data.transactions || [];
                    documents = data.documents || [];
                    applications = data.applications || [];
                    meetings = data.meetings || [];
                    certificates = data.certificates || [];
                    
                    console.log('Данные загружены из резервной копии в localStorage');
                } else {
                    // Если нет ни в директории, ни в localStorage, инициализируем пустые массивы
                    members = [];
                    payments = [];
                    transactions = [];
                    documents = [];
                    applications = [];
                    meetings = [];
                    certificates = [];
                }
            }
        } else {
            // Если директория не настроена, пробуем загрузить из localStorage
            const savedData = localStorage.getItem('coopData');
            if (savedData) {
                const data = JSON.parse(savedData);
                members = data.members || [];
                payments = data.payments || [];
                transactions = data.transactions || [];
                documents = data.documents || [];
                applications = data.applications || [];
                meetings = data.meetings || [];
                certificates = data.certificates || [];
                
                console.log('Данные загружены из резервной копии в localStorage');
            } else {
                // Инициализируем пустые массивы
                members = [];
                payments = [];
                transactions = [];
                documents = [];
                applications = [];
                meetings = [];
                certificates = [];
            }
        }
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        // Инициализируем пустые массивы, если данные не удалось загрузить
        members = [];
        payments = [];
        transactions = [];
        documents = [];
        applications = [];
        meetings = [];
        certificates = [];
    }
    
    // Обновляем интерфейс после загрузки данных
    if (typeof loadMembersData === 'function') loadMembersData();
    if (typeof loadPaymentsData === 'function') loadPaymentsData();
    if (typeof loadTransactionsData === 'function') loadTransactionsData();
    if (typeof loadDocumentsData === 'function') loadDocumentsData();
    if (typeof loadApplicationsData === 'function') loadApplicationsData();
    if (typeof loadMeetingsData === 'function') loadMeetingsData();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    
    // Обновляем индикатор состояния
    updateFolderStatusIndicator();
}

// Функция для загрузки всех заявлений из подкаталога Applications
async function loadAllApplicationsFromDirectory() {
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Невозможно загрузить заявления.');
        return;
    }

    try {
        // Получаем поддиректорию для заявлений (создаем, если не существует)
        let applicationsDirHandle;
        try {
            applicationsDirHandle = await coopDirectoryHandle.getDirectoryHandle('Applications', { create: false });
        } catch (err) {
            // Если директория не существует, создаем её
            applicationsDirHandle = await coopDirectoryHandle.getDirectoryHandle('Applications', { create: true });
        }

        // Очищаем текущие данные
        applications = [];

        // Проходим по всем файлам в директории заявлений
        for await (const entry of applicationsDirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const contents = await file.text();
                    const application = JSON.parse(contents);
                    applications.push(application);
                } catch (err) {
                    console.error(`Ошибка при загрузке заявления из файла ${entry.name}:`, err);
                }
            }
        }

        console.log(`Загружено ${applications.length} заявлений из C:\\КООПЕРАНТ\\Applications`);
    } catch (err) {
        console.warn('Не удалось загрузить заявления из директории:', err);
    }
}

// Функция для загрузки всех удостоверений из подкаталога Certificates
async function loadAllCertificatesFromDirectory() {
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Невозможно загрузить удостоверения.');
        return;
    }

    try {
        // Получаем поддиректорию для удостоверений (создаем, если не существует)
        let certificatesDirHandle;
        try {
            certificatesDirHandle = await coopDirectoryHandle.getDirectoryHandle('Certificates', { create: false });
        } catch (err) {
            // Если директория не существует, создаем её
            certificatesDirHandle = await coopDirectoryHandle.getDirectoryHandle('Certificates', { create: true });
        }

        // Очищаем текущие да��ные
        certificates = [];

        // Проходим по всем файла�� в ��и��ектории удостоверений
        for await (const entry of certificatesDirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const contents = await file.text();
                    const certificate = JSON.parse(contents);
                    certificates.push(certificate);
                } catch (err) {
                    console.error(`Ошибка при загрузке удостоверения из файла ${entry.name}:`, err);
                }
            }
        }

        console.log(`Загружено ${certificates.length} удостоверений из C:\\КООПЕРАНТ\\Certificates`);
    } catch (err) {
        console.warn('Не удалось загрузить удостоверения из директории:', err);
    }
}

// Функция для загрузки всех протоколов из подкаталога Protocols
async function loadAllProtocolsFromDirectory() {
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Невозможно загрузить протоколы.');
        return;
    }

    try {
        // Получаем поддиректорию для протоколов (создаем, если не существует)
        let protocolsDirHandle;
        try {
            protocolsDirHandle = await coopDirectoryHandle.getDirectoryHandle('Protocols', { create: false });
        } catch (err) {
            // Если директория не существует, создаем её
            protocolsDirHandle = await coopDirectoryHandle.getDirectoryHandle('Protocols', { create: true });
        }

        // Очищаем т��к��щие данные
        meetings = [];

        // Проходим по всем файлам в директории протоколов
        for await (const entry of protocolsDirHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const contents = await file.text();
                    const meeting = JSON.parse(contents);
                    meetings.push(meeting);
                } catch (err) {
                    console.error(`Ошибка при загрузке протоко��а из файла ${entry.name}:`, err);
                }
            }
        }

        console.log(`Загружено ${meetings.length} протоколов из C:\\КООПЕРАНТ\\Protocols`);
    } catch (err) {
        console.warn('Не удалось загрузить протоколы из директории:', err);
    }
}

// Функция для загрузки всех документов из подкаталога Documents
async function loadAllDocumentsFromDirectory() {
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Невозможно загрузить документы.');
        return;
    }

    try {
        // Получаем поддиректорию для документов (создаем, если не существует)
        let documentsDirHandle;
        try {
            documentsDirHandle = await coopDirectoryHandle.getDirectoryHandle('Documents', { create: false });
        } catch (err) {
            // Если директория не существует, создаем её
            documentsDirHandle = await coopDirectoryHandle.getDirectoryHandle('Documents', { create: true });
        }

        // Очищаем текущие данные
        documents = [];

        // Проходим по всем файлам в директории документов
        for await (const entry of documentsDirHandle.values()) {
            if (entry.kind === 'file') {
                try {
                    // Для документов просто сохраняем информацию о файле
                    const doc = {
                        id: generateId(),
                        name: entry.name,
                        size: (await entry.getFile()).size,
                        type: (await entry.getFile()).type,
                        date: new Date().toISOString().split('T')[0],
                        path: `C:\\КООПЕРАНТ\\Documents\\${entry.name}`
                    };
                    documents.push(doc);
                } catch (err) {
                    console.error(`Ошибка при загрузке информации о документе ${entry.name}:`, err);
                }
            }
        }

        console.log(`Загружено ${documents.length} документов из C:\\КООПЕРАНТ\\Documents`);
    } catch (err) {
        console.warn('Не удалось загрузить документы из директории:', err);
    }
}

// Расширенная функция загрузки данных, которая загружает все типы данных из директории
async function loadAllDataFromDirectory() {
    // Сначала загружаем основные данные
    await loadData();

    // Если дескриптор директории доступен, загружаем дополнительные данные из подкаталогов
    if (coopDirectoryHandle) {
        await loadAllApplicationsFromDirectory();
        await loadAllCertificatesFromDirectory();
        await loadAllProtocolsFromDirectory();
        await loadAllDocumentsFromDirectory();
        await loadSettingsFromDirectory(); // Загружаем настройки
    } else {
        // Если дескриптор недоступен, используем резервный метод - загружаем из localStorage
        // или оставляем текущие данные, которые уже были загружены в loadData()
        console.log('Дескриптор директории недоступен, дополнительные данные загружены из резервной копии');
        loadSettingsFromLocalStorage(); // Загружаем настройки из localStorage
    }
}

// Функция для загрузки настроек из localStorage
function loadSettingsFromLocalStorage() {
    const savedSettings = localStorage.getItem('coopSettings');
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            cooperativeSettings = { ...cooperativeSettings, ...parsed };
            console.log('Настройки загружены из localStorage');
        } catch (e) {
            console.error('Ошибка при загрузке настроек:', e);
        }
    }
}

// Функция для загрузки настроек из файла
async function loadSettingsFromDirectory() {
    try {
        const settingsDir = await coopDirectoryHandle.getDirectoryHandle('Settings', { create: true });
        const fileHandle = await settingsDir.getFileHandle('coop_settings.json');
        const file = await fileHandle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);
        cooperativeSettings = { ...cooperativeSettings, ...parsed };
        console.log('Настройки загружены из файла');
    } catch (e) {
        console.log('Файл настроек не найден, используем настройки по умолчанию');
    }
}

// Функция для сохранения настроек
async function saveSettings() {
    // Сохраняем в localStorage
    localStorage.setItem('coopSettings', JSON.stringify(cooperativeSettings));

    // Сохраняем в файл
    if (coopDirectoryHandle) {
        try {
            const settingsDir = await coopDirectoryHandle.getDirectoryHandle('Settings', { create: true });
            const fileHandle = await settingsDir.getFileHandle('coop_settings.json', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(cooperativeSettings, null, 2));
            await writable.close();
            console.log('Настройки сохранены в файл');
        } catch (e) {
            console.error('Ошибка при сохранении настроек в файл:', e);
        }
    }
}

// ========================================
// Функции налогового учёта (КУДиР)
// ========================================

// Функция для классификации операции для УСН
function classifyTransactionForUSN(transaction) {
    const result = {
        isIncome: false,
        isExpense: false,
        category: '',
        amount: transaction.amount || 0
    };

    // Доходы для УСН (только от деятельности, не взносы!)
    // Счёт 90-1 (выручка), 91-1 (прочие доходы)
    if (transaction.creditAccount && 
        (transaction.creditAccount.startsWith('90') || transaction.creditAccount.startsWith('91'))) {
        result.isIncome = true;
        result.category = transaction.creditAccount.startsWith('90') ? 'Выручка от реализации' : 'Прочие доходы';
    }

    // Расходы для УСН (только из закрытого перечня ст. 346.16 НК РФ)
    // Счета: 90-2 (себестоимость), 26 (управленческие), 44 (коммерческие), 91-2 (прочие расходы)
    if (transaction.debitAccount && 
        (transaction.debitAccount.startsWith('90-2') || 
         transaction.debitAccount.startsWith('26') || 
         transaction.debitAccount.startsWith('44') ||
         transaction.debitAccount.startsWith('91-2'))) {
        result.isExpense = true;
        
        if (transaction.debitAccount.startsWith('90-2')) {
            result.category = 'Материальные расходы';
        } else if (transaction.debitAccount.startsWith('26')) {
            result.category = 'Управленческие расходы';
        } else if (transaction.debitAccount.startsWith('44')) {
            result.category = 'Коммерческие расходы';
        } else {
            result.category = 'Прочие расходы';
        }
    }

    return result;
}

// Функция для добавления записи в КУДиР
function addTaxRecord(transaction) {
    const classification = classifyTransactionForUSN(transaction);
    const record = {
        id: generateId(),
        date: transaction.date,
        amount: classification.amount,
        category: classification.category,
        transactionId: transaction.id,
        createdAt: new Date().toISOString()
    };

    if (classification.isIncome) {
        if (!cooperativeSettings.taxAccounting) {
            cooperativeSettings.taxAccounting = { income: [], expense: [] };
        }
        cooperativeSettings.taxAccounting.income.push(record);
    }

    if (classification.isExpense) {
        if (!cooperativeSettings.taxAccounting) {
            cooperativeSettings.taxAccounting = { income: [], expense: [] };
        }
        cooperativeSettings.taxAccounting.expense.push(record);
    }
}

// Функция для расчёта налоговой базы за период
function calculateTaxBase(year) {
    const income = cooperativeSettings.taxAccounting?.income || [];
    const expense = cooperativeSettings.taxAccounting?.expense || [];

    const yearIncome = income
        .filter(r => r.date && r.date.startsWith(year.toString()))
        .reduce((sum, r) => sum + (r.amount || 0), 0);

    const yearExpense = expense
        .filter(r => r.date && r.date.startsWith(year.toString()))
        .reduce((sum, r) => sum + (r.amount || 0), 0);

    return {
        year,
        totalIncome: yearIncome,
        totalExpense: yearExpense,
        taxBase: cooperativeSettings.taxSystem === 'USN_15' 
            ? Math.max(0, yearIncome - yearExpense) 
            : yearIncome
    };
}

// Функция для расчёта налога УСН
function calculateUSNTax(year) {
    const taxBase = calculateTaxBase(year);
    const taxSystem = cooperativeSettings.taxSystem || 'USN_6';
    
    let taxRate = 0.06; // УСН 6% по умолчанию
    if (taxSystem === 'USN_15') {
        taxRate = 0.15;
    }

    const calculatedTax = taxBase.taxBase * taxRate;
    
    // Минимальный налог для УСН 15% (1% от доходов)
    let minTax = 0;
    if (taxSystem === 'USN_15') {
        minTax = taxBase.totalIncome * 0.01;
    }

    return {
        year,
        taxSystem,
        taxRate: taxRate * 100,
        calculatedTax,
        minTax,
        taxToPay: taxSystem === 'USN_15' && calculatedTax < minTax ? minTax : calculatedTax
    };
}

// Функция для отображения КУДиР
function showKUDiR() {
    const currentYear = new Date().getFullYear();
    const taxData = calculateTaxBase(currentYear.toString());
    const taxCalc = calculateUSNTax(currentYear.toString());

    const income = (cooperativeSettings.taxAccounting?.income || [])
        .filter(r => r.date && r.date.startsWith(currentYear.toString()));
    
    const expense = (cooperativeSettings.taxAccounting?.expense || [])
        .filter(r => r.date && r.date.startsWith(currentYear.toString()));

    let incomeRows = income.map(r => `
        <tr>
            <td>${r.date}</td>
            <td>${r.category}</td>
            <td class="amount incoming">${r.amount.toLocaleString()} ₽</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align: center;">Доходов не найдено</td></tr>';

    let expenseRows = expense.map(r => `
        <tr>
            <td>${r.date}</td>
            <td>${r.category}</td>
            <td class="amount outgoing">${r.amount.toLocaleString()} ₽</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align: center;">Расходов не найдено</td></tr>';

    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>КУДиР — Книга учёта доходов и расходов</h2>
                <p>Потребительский кооператив</p>
                <p>Отчётный период: ${currentYear} год</p>
                <p>Система налогообложения: ${getTaxSystemName(cooperativeSettings.taxSystem || 'USN_6')}</p>
            </div>

            <div class="settings-info">
                <h4>📊 Сводка за ${currentYear} год</h4>
                <table class="balance-table" style="margin-top: 10px;">
                    <tr><th>Показатель</th><th>Сумма</th></tr>
                    <tr><td>Доходы</td><td class="amount incoming">${taxData.totalIncome.toLocaleString()} ₽</td></tr>
                    <tr><td>Расходы</td><td class="amount outgoing">${taxData.totalExpense.toLocaleString()} ₽</td></tr>
                    <tr class="total-row"><td>Налоговая база</td><td class="amount">${taxData.taxBase.toLocaleString()} ₽</td></tr>
                    <tr><td>Налоговая ставка</td><td class="amount">${taxCalc.taxRate}%</td></tr>
                    <tr class="total-row" style="background-color: #e3f2fd;"><td>Налог к уплате</td><td class="amount">${taxCalc.taxToPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
                </table>
            </div>

            <h3 style="margin-top: 20px;">📈 Доходы</h3>
            <table class="settings-table">
                <thead>
                    <tr><th>Дата</th><th>Категория</th><th>Сумма</th></tr>
                </thead>
                <tbody>
                    ${incomeRows}
                </tbody>
            </table>

            <h3 style="margin-top: 20px;">📉 Расходы</h3>
            <table class="settings-table">
                <thead>
                    <tr><th>Дата</th><th>Категория</th><th>Сумма</th></tr>
                </thead>
                <tbody>
                    ${expenseRows}
                </tbody>
            </table>

            <div class="report-actions" style="margin-top: 20px;">
                <button class="action-button" onclick="printKUDiR()">Печать КУДиР</button>
                <button class="action-button" onclick="exportKUDiR()">Экспорт в Excel</button>
                <button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('КУДиР', content);
}

// Функция печати КУДиР
function printKUDiR() {
    const currentYear = new Date().getFullYear();
    const taxData = calculateTaxBase(currentYear.toString());
    const taxCalc = calculateUSNTax(currentYear.toString());
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';

    const income = (cooperativeSettings.taxAccounting?.income || [])
        .filter(r => r.date && r.date.startsWith(currentYear.toString()));
    
    const expense = (cooperativeSettings.taxAccounting?.expense || [])
        .filter(r => r.date && r.date.startsWith(currentYear.toString()));

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>КУДиР за ${currentYear} год</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 12px; }
                h1, h2 { text-align: center; }
                .header { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 6px; font-size: 11px; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .total { font-weight: bold; background-color: #e0e0e0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>КУДиР</h1>
                <p>Книга учёта доходов и расходов</p>
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
                <p><strong>Отчётный период:</strong> ${currentYear} год</p>
                <p><strong>Система налогообложения:</strong> ${getTaxSystemName(cooperativeSettings.taxSystem || 'USN_6')}</p>
            </div>

            <h2>Доходы и расходы за ${currentYear} год</h2>
            <table>
                <tr>
                    <th style="width: 50%;">Показатель</th>
                    <th style="width: 50%;">Сумма, руб.</th>
                </tr>
                <tr><td>Доходы</td><td style="text-align: right;">${taxData.totalIncome.toLocaleString()}</td></tr>
                <tr><td>Расходы</td><td style="text-align: right;">${taxData.totalExpense.toLocaleString()}</td></tr>
                <tr class="total"><td>Налоговая база</td><td style="text-align: right;">${taxData.taxBase.toLocaleString()}</td></tr>
                <tr><td>Налоговая ставка</td><td style="text-align: right;">${taxCalc.taxRate}%</td></tr>
                <tr class="total"><td>Налог к уплате</td><td style="text-align: right;">${taxCalc.taxToPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            </table>

            <h2>Доходы</h2>
            <table>
                <tr><th style="width: 20%;">Дата</th><th style="width: 50%;">Категория</th><th style="width: 30%;">Сумма</th></tr>
                ${income.map(r => `<tr><td>${r.date}</td><td>${r.category}</td><td style="text-align: right;">${r.amount.toLocaleString()}</td></tr>`).join('')}
            </table>

            <h2>Расходы</h2>
            <table>
                <tr><th style="width: 20%;">Дата</th><th style="width: 50%;">Категория</th><th style="width: 30%;">Сумма</th></tr>
                ${expense.map(r => `<tr><td>${r.date}</td><td>${r.category}</td><td style="text-align: right;">${r.amount.toLocaleString()}</td></tr>`).join('')}
            </table>

            <div style="margin-top: 40px;">
                <p>Руководитель _________________ / _____________________</p>
                <p>Главный бухгалтер _________________ / _____________________</p>
                <p>Дата: «___» __________ 20__ г.</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция экспорта КУДиР в Excel
function exportKUDiR() {
    const currentYear = new Date().getFullYear();
    const income = (cooperativeSettings.taxAccounting?.income || []).filter(r => r.date && r.date.startsWith(currentYear.toString()));
    const expense = (cooperativeSettings.taxAccounting?.expense || []).filter(r => r.date && r.date.startsWith(currentYear.toString()));
    
    const data = [
        ...income.map(r => ({ 'Период': r.date, 'Вид дохода': r.category, 'Доходы': r.amount, 'Расходы': '' })),
        ...expense.map(r => ({ 'Период': r.date, 'Вид расхода': r.category, 'Доходы': '', 'Расходы': r.amount }))
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'КУДиР');
    XLSX.writeFile(wb, `КУДиР_${currentYear}.xlsx`);
}

// Функция для отображения декларации УСН
function showUSNDeclaration() {
    const currentYear = new Date().getFullYear();
    const taxCalc = calculateUSNTax(currentYear.toString());
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const kpp = cooperativeSettings.kpp || '—';
    const legalAddress = cooperativeSettings.legalAddress || '—';

    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>Декларация по УСН</h2>
                <p>Налог на прибыль организаций / Единый налог при УСН</p>
                <p>Отчётный период: ${currentYear} год</p>
                <p>Организация: ${shortName}</p>
            </div>

            <div class="settings-info">
                <h4>📊 Расчёт налога</h4>
                <table class="balance-table" style="margin-top: 10px;">
                    <tr><th>Показатель</th><th>Код</th><th>Сумма</th></tr>
                    <tr><td>Доходы за год</td><td>110</td><td class="amount incoming">${taxCalc.calculatedTax > 0 ? (taxCalc.calculatedTax / (taxCalc.taxRate / 100)).toLocaleString() : '0'} ₽</td></tr>
                    <tr><td>Расходы за год</td><td>120</td><td class="amount outgoing">${calculateTaxBase(currentYear.toString()).totalExpense.toLocaleString()} ₽</td></tr>
                    <tr><td>Налоговая база</td><td>130</td><td class="amount">${calculateTaxBase(currentYear.toString()).taxBase.toLocaleString()} ₽</td></tr>
                    <tr><td>Налоговая ставка</td><td>140</td><td class="amount">${taxCalc.taxRate}%</td></tr>
                    <tr><td>Сумма налога</td><td>150</td><td class="amount">${taxCalc.calculatedTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
                    ${taxCalc.taxSystem === 'USN_15' ? `<tr><td>Минимальный налог (1%)</td><td>160</td><td class="amount">${taxCalc.minTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>` : ''}
                    <tr class="total-row" style="background-color: #e3f2fd;"><td>Налог к уплате</td><td>170</td><td class="amount">${taxCalc.taxToPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
                </table>
            </div>

            <div class="report-actions" style="margin-top: 20px;">
                <button class="action-button" onclick="printUSNDeclaration()">Печать декларации</button>
                <button class="action-button" onclick="exportUSNDeclaration()">Экспорт в ФНС</button>
                <button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Декларация УСН', content);
}

// Функция печати декларации УСН
function printUSNDeclaration() {
    const currentYear = new Date().getFullYear();
    const taxCalc = calculateUSNTax(currentYear.toString());
    const taxBase = calculateTaxBase(currentYear.toString());
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const kpp = cooperativeSettings.kpp || '—';
    const legalAddress = cooperativeSettings.legalAddress || '—';
    const taxCode = cooperativeSettings.taxSystem === 'USN_15' ? '262' : '261';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Декларация по УСН за ${currentYear} год</title>
            <style>
                body { font-family: "Courier New", monospace; padding: 20px; font-size: 10px; }
                h1 { text-align: center; font-size: 14px; }
                .page { margin-bottom: 30px; }
                .header { border: 2px solid #000; padding: 10px; margin-bottom: 15px; }
                .field { display: inline-block; width: 200px; border-bottom: 1px solid #000; }
                .value { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 4px; font-size: 10px; }
                th { background-color: #f0f0f0; }
                .number { text-align: right; font-family: "Courier New", monospace; }
                .code { text-align: center; width: 50px; }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    <h1>НАЛОГОВАЯ ДЕКЛАРАЦИЯ</h1>
                    <p>по единому налогу, уплачиваемому в связи с применением упрощенной системы налогообложения</p>
                    <p><strong>Код налогового периода:</strong> 34 (год)</p>
                    <p><strong>Отчетный год:</strong> ${currentYear}</p>
                </div>

                <div style="margin: 20px 0;">
                    <p><strong>Код ИФНС:</strong> <span class="field"></span></p>
                    <p><strong>ИНН:</strong> ${inn} <strong>КПП:</strong> ${kpp}</p>
                    <p><strong>Организация:</strong> ${shortName}</p>
                    <p><strong>Адрес:</strong> ${legalAddress}</p>
                </div>

                <h2>Раздел 1.1. Сумма налога к уплате</h2>
                <table>
                    <tr>
                        <th class="code">Код</th>
                        <th>Показатель</th>
                        <th class="number">Сумма (руб.)</th>
                    </tr>
                    <tr>
                        <td class="code">010</td>
                        <td>Код по ОКТМО</td>
                        <td class="number"></td>
                    </tr>
                    <tr>
                        <td class="code">020</td>
                        <td>Сумма налога к уплате</td>
                        <td class="number">${taxCalc.taxToPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                </table>

                <h2>Раздел 2.1.1. Расчёт налога (УСН "Доходы")</h2>
                <table>
                    <tr>
                        <th class="code">Код</th>
                        <th>Показатель</th>
                        <th class="number">Сумма (руб.)</th>
                    </tr>
                    <tr>
                        <td class="code">110</td>
                        <td>Доходы за налоговый период</td>
                        <td class="number">${taxBase.totalIncome.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td class="code">120</td>
                        <td>Расходы (для УСН 15%)</td>
                        <td class="number">${taxBase.totalExpense.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td class="code">130</td>
                        <td>Налоговая база</td>
                        <td class="number">${taxBase.taxBase.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td class="code">140</td>
                        <td>Налоговая ставка (%)</td>
                        <td class="number">${taxCalc.taxRate}</td>
                    </tr>
                    <tr>
                        <td class="code">150</td>
                        <td>Сумма налога</td>
                        <td class="number">${taxCalc.calculatedTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                </table>

                <div style="margin-top: 40px;">
                    <p>Руководитель организации _________________ / _____________________</p>
                    <p>Главный бухгалтер _________________ / _____________________</p>
                    <p>Дата: «___» __________ ${currentYear} г.</p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция экспорта декларации в формат ФНС
function exportUSNDeclaration() {
    const currentYear = new Date().getFullYear();
    const taxBase = calculateTaxBase(currentYear.toString());
    const taxCalc = calculateUSNTax(currentYear.toString());
    
    const data = {
        'Организация': cooperativeSettings.shortName || 'Потребительский кооператив',
        'ИНН': cooperativeSettings.inn || '',
        'Отчётный год': currentYear,
        'Система налогообложения': taxCalc.taxSystem,
        'Доходы': taxBase.totalIncome,
        'Расходы': taxBase.totalExpense,
        'Налоговая база': taxBase.taxBase,
        'Налоговая ставка': taxCalc.taxRate + '%',
        'Налог к уплате': taxCalc.taxToPay
    };
    
    const ws = XLSX.utils.json_to_sheet([data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Декларация УСН');
    XLSX.writeFile(wb, `Декларация_УСН_${currentYear}.xlsx`);
}

// ========================================
// Функции контроля сроков (Фаза 4)
// ========================================

// Функция для расчёта даты истечения срока хранения
function calculateRetentionExpiryDate(documentDate, docType) {
    const retentionPeriods = cooperativeSettings.controlSettings?.documentRetention || {
        'contract': 5, 'report': 5, 'payment': 5, 'member': 75,
        'personnel': 75, 'protocol': 5, 'certificate': 5, 'other': 5
    };
    
    const years = retentionPeriods[docType] || retentionPeriods['other'];
    const date = new Date(documentDate);
    date.setFullYear(date.getFullYear() + years);
    return date;
}

// Функция для проверки документов с истекающим сроком хранения
function checkExpiringDocuments(daysThreshold = 30) {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);
    
    const expiringDocs = [];
    
    documents.forEach(doc => {
        const expiryDate = calculateRetentionExpiryDate(doc.date, doc.type);
        
        if (expiryDate <= thresholdDate) {
            const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
            
            expiringDocs.push({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                date: doc.date,
                expiryDate: expiryDate.toISOString().split('T')[0],
                daysUntilExpiry: daysUntilExpiry,
                status: daysUntilExpiry < 0 ? 'expired' : 'expiring'
            });
        }
    });
    
    return expiringDocs.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

// Функция для проверки сроков сдачи отчётности
function checkReportingDeadlines(daysThreshold = 30) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const deadlines = cooperativeSettings.controlSettings?.reportingDeadlines || {};
    
    const upcomingDeadlines = [];
    
    Object.entries(deadlines).forEach(([reportType, deadline]) => {
        const [day, month] = deadline.split('.').map(Number);
        const reportDate = new Date(currentYear, month - 1, day);
        
        // Если дата уже прошла в этом году, проверяем следующий год
        if (reportDate < now) {
            reportDate.setFullYear(currentYear + 1);
        }
        
        const daysUntilDeadline = Math.floor((reportDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline <= daysThreshold) {
            upcomingDeadlines.push({
                type: reportType,
                name: getReportName(reportType),
                deadline: deadline,
                fullDate: reportDate.toISOString().split('T')[0],
                daysUntilDeadline: daysUntilDeadline,
                year: reportDate.getFullYear()
            });
        }
    });
    
    return upcomingDeadlines.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
}

// Функция для получения названия отчёта
function getReportName(type) {
    const names = {
        'balance': 'Бухгалтерский баланс',
        'usn': 'Декларация УСН',
        'profit': 'Декларация по налогу на прибыль',
        'rsv': 'Расчёт по страховым взносам (РСВ)',
        'szv': 'СЗВ-СТАЖ',
        'sredn': 'Среднесписочная численность'
    };
    return names[type] || type;
}

// Функция для отображения контроля сроков
function showControlDashboard() {
    const expiringDocs = checkExpiringDocuments(90); // Документы, истекающие в ближайшие 90 дней
    const upcomingDeadlines = checkReportingDeadlines(90); // Отчётность в ближайшие 90 дней
    
    const docsHtml = expiringDocs.length > 0 ? expiringDocs.map(doc => `
        <tr>
            <td>${doc.name}</td>
            <td>${doc.type}</td>
            <td>${doc.date}</td>
            <td>${doc.expiryDate}</td>
            <td class="${doc.status === 'expired' ? 'outgoing' : 'amount'}">
                ${doc.status === 'expired' ? 'Истёк' : `${doc.daysUntilExpiry} дн.`}
            </td>
        </tr>
    `).join('') : '<tr><td colspan="5" style="text-align: center;">Документов с истекающим сроком не найдено</td></tr>';
    
    const deadlinesHtml = upcomingDeadlines.length > 0 ? upcomingDeadlines.map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.fullDate}</td>
            <td>${d.year} год</td>
            <td class="amount">${d.daysUntilDeadline} дн.</td>
        </tr>
    `).join('') : '<tr><td colspan="4" style="text-align: center;">Ближайших сроков сдачи не найдено</td></tr>';
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>Контроль сроков</h2>
                <p>Потребительский кооператив</p>
                <p>Дата проверки: ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
            
            <div class="settings-info">
                <h4>📋 Сводка</h4>
                <table class="balance-table" style="margin-top: 10px;">
                    <tr><th>Показатель</th><th>Количество</th></tr>
                    <tr><td>Документов с истекающим сроком (90 дн.)</td><td class="amount">${expiringDocs.length}</td></tr>
                    <tr><td>в т.ч. с истёкшим сроком</td><td class="amount outgoing">${expiringDocs.filter(d => d.status === 'expired').length}</td></tr>
                    <tr><td>Предстоящих сроков сдачи отчётности (90 дн.)</td><td class="amount">${upcomingDeadlines.length}</td></tr>
                </table>
            </div>
            
            <h3 style="margin-top: 20px;">📄 Документы с истекающим сроком хранения</h3>
            <table class="settings-table">
                <thead>
                    <tr><th>Название</th><th>Тип</th><th>Дата</th><th>Истекает</th><th>Осталось</th></tr>
                </thead>
                <tbody>
                    ${docsHtml}
                </tbody>
            </table>
            
            <h3 style="margin-top: 20px;">📅 Предстоящие сроки сдачи отчётности</h3>
            <table class="settings-table">
                <thead>
                    <tr><th>Отчёт</th><th>Срок</th><th>Год</th><th>Осталось</th></tr>
                </thead>
                <tbody>
                    ${deadlinesHtml}
                </tbody>
            </table>
            
            <div class="report-actions" style="margin-top: 20px;">
                <button class="action-button" onclick="printControlDashboard()">Печать</button>
                <button class="action-button" onclick="showRetentionSettings()">Настройки сроков</button>
                <button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Контроль сроков', content);
}

// Функция печати контроля сроков
function printControlDashboard() {
    const expiringDocs = checkExpiringDocuments(90);
    const upcomingDeadlines = checkReportingDeadlines(90);
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Контроль сроков</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 12px; }
                h1, h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 6px; }
                th { background-color: #f0f0f0; }
            </style>
        </head>
        <body>
            <h1>Контроль сроков</h1>
            <p><strong>Организация:</strong> ${shortName}</p>
            <p><strong>Дата проверки:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            
            <h2>Документы с истекающим сроком хранения</h2>
            <table>
                <tr><th>Название</th><th>Тип</th><th>Дата</th><th>Истекает</th><th>Осталось дней</th></tr>
                ${expiringDocs.map(d => `<tr><td>${d.name}</td><td>${d.type}</td><td>${d.date}</td><td>${d.expiryDate}</td><td>${d.daysUntilExpiry}</td></tr>`).join('')}
            </table>
            
            <h2>Предстоящие сроки сдачи отчётности</h2>
            <table>
                <tr><th>Отчёт</th><th>Срок</th><th>Год</th><th>Осталось дней</th></tr>
                ${upcomingDeadlines.map(d => `<tr><td>${d.name}</td><td>${d.fullDate}</td><td>${d.year}</td><td>${d.daysUntilDeadline}</td></tr>`).join('')}
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция отображения настроек сроков хранения
function showRetentionSettings() {
    const settings = cooperativeSettings.controlSettings || { documentRetention: {}, reportingDeadlines: {} };
    const retention = settings.documentRetention || {};
    const deadlines = settings.reportingDeadlines || {};
    
    const content = `
        <div class="settings-form">
            <h3>Настройки сроков хранения</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Сроки хранения документов в соответствии с требованиями законодательства РФ.</p>
            </div>
            
            <div class="form-section">
                <h4>📄 Сроки хранения документов (лет)</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ret-contract">Договоры</label>
                        <input type="number" id="ret-contract" value="${retention['contract'] || 5}" min="1">
                    </div>
                    <div class="form-group">
                        <label for="ret-report">Отчёты</label>
                        <input type="number" id="ret-report" value="${retention['report'] || 5}" min="1">
                    </div>
                    <div class="form-group">
                        <label for="ret-payment">Платёжные документы</label>
                        <input type="number" id="ret-payment" value="${retention['payment'] || 5}" min="1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ret-member">Документы пайщиков</label>
                        <input type="number" id="ret-member" value="${retention['member'] || 75}" min="1">
                    </div>
                    <div class="form-group">
                        <label for="ret-personnel">Документы персонала</label>
                        <input type="number" id="ret-personnel" value="${retention['personnel'] || 75}" min="1">
                    </div>
                    <div class="form-group">
                        <label for="ret-protocol">Протоколы</label>
                        <input type="number" id="ret-protocol" value="${retention['protocol'] || 5}" min="1">
                    </div>
                </div>
                <button type="button" class="action-button save" onclick="saveRetentionSettings()" style="margin-top: 10px;">Сохранить</button>
            </div>
            
            <div class="form-section">
                <h4>📅 Сроки сдачи отчётности (день.месяц)</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="dead-balance">Бухгалтерский баланс</label>
                        <input type="text" id="dead-balance" value="${deadlines['balance'] || '31.03'}" placeholder="31.03">
                    </div>
                    <div class="form-group">
                        <label for="dead-usn">Декларация УСН</label>
                        <input type="text" id="dead-usn" value="${deadlines['usn'] || '31.03'}" placeholder="31.03">
                    </div>
                    <div class="form-group">
                        <label for="dead-profit">Налог на прибыль</label>
                        <input type="text" id="dead-profit" value="${deadlines['profit'] || '28.03'}" placeholder="28.03">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="dead-rsv">РСВ (ежеквартально)</label>
                        <input type="text" id="dead-rsv" value="${deadlines['rsv'] || '30.04'}" placeholder="30.04">
                    </div>
                    <div class="form-group">
                        <label for="dead-szv">СЗВ-СТАЖ</label>
                        <input type="text" id="dead-szv" value="${deadlines['szv'] || '15.01'}" placeholder="15.01">
                    </div>
                    <div class="form-group">
                        <label for="dead-sredn">Среднесписочная численность</label>
                        <input type="text" id="dead-sredn" value="${deadlines['sredn'] || '20.01'}" placeholder="20.01">
                    </div>
                </div>
                <button type="button" class="action-button save" onclick="saveDeadlinesSettings()" style="margin-top: 10px;">Сохранить</button>
            </div>
            
            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Настройки сроков', content);
}

// Функция сохранения настроек сроков хранения
function saveRetentionSettings() {
    if (!cooperativeSettings.controlSettings) {
        cooperativeSettings.controlSettings = { documentRetention: {}, reportingDeadlines: {} };
    }
    
    cooperativeSettings.controlSettings.documentRetention = {
        'contract': parseInt(document.getElementById('ret-contract').value) || 5,
        'report': parseInt(document.getElementById('ret-report').value) || 5,
        'payment': parseInt(document.getElementById('ret-payment').value) || 5,
        'member': parseInt(document.getElementById('ret-member').value) || 75,
        'personnel': parseInt(document.getElementById('ret-personnel').value) || 75,
        'protocol': parseInt(document.getElementById('ret-protocol').value) || 5,
        'certificate': 5,
        'other': 5
    };
    
    saveSettings();
    showRetentionSettings();
    alert('Сроки хранения сохранены!');
}

// Функция сохранения настроек сроков отчётности
function saveDeadlinesSettings() {
    if (!cooperativeSettings.controlSettings) {
        cooperativeSettings.controlSettings = { documentRetention: {}, reportingDeadlines: {} };
    }
    
    cooperativeSettings.controlSettings.reportingDeadlines = {
        'balance': document.getElementById('dead-balance').value || '31.03',
        'usn': document.getElementById('dead-usn').value || '31.03',
        'profit': document.getElementById('dead-profit').value || '28.03',
        'rsv': document.getElementById('dead-rsv').value || '30.04',
        'szv': document.getElementById('dead-szv').value || '15.01',
        'sredn': document.getElementById('dead-sredn').value || '20.01'
    };
    
    saveSettings();
    showRetentionSettings();
    alert('Сроки сдачи отчётности сохранены!');
}

// ========================================
// Шаблоны нулевой отчётности (Фаза 4.3)
// ========================================

// Функция для создания нулевой декларации УСН
function createZeroUSNDeclaration() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const kpp = cooperativeSettings.kpp || '—';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Нулевая декларация УСН за ${currentYear} год</title>
            <style>
                body { font-family: "Courier New", monospace; padding: 20px; font-size: 10px; }
                h1 { text-align: center; font-size: 14px; }
                .header { border: 2px solid #000; padding: 10px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 4px; font-size: 10px; }
                th { background-color: #f0f0f0; }
                .number { text-align: right; }
                .code { text-align: center; width: 50px; }
                .zero { color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>НАЛОГОВАЯ ДЕКЛАРАЦИЯ</h1>
                <p>по единому налогу при упрощенной системе налогообложения</p>
                <p><strong>Код налогового периода:</strong> 34 (год)</p>
                <p><strong>Отчетный год:</strong> ${currentYear}</p>
                <p style="color: red; font-weight: bold;">НУЛЕВАЯ</p>
            </div>

            <div style="margin: 20px 0;">
                <p><strong>Код ИФНС:</strong> <span class="field"></span></p>
                <p><strong>ИНН:</strong> ${inn} <strong>КПП:</strong> ${kpp}</p>
                <p><strong>Организация:</strong> ${shortName}</p>
            </div>

            <h2>Раздел 1.1. Сумма налога к уплате</h2>
            <table>
                <tr><th class="code">Код</th><th>Показатель</th><th class="number">Сумма (руб.)</th></tr>
                <tr><td class="code">010</td><td>Код по ОКТМО</td><td class="number"></td></tr>
                <tr><td class="code">020</td><td>Сумма налога к уплате</td><td class="number zero">0</td></tr>
            </table>

            <h2>Раздел 2.1.1. Расчёт налога (УСН "Доходы")</h2>
            <table>
                <tr><th class="code">Код</th><th>Показатель</th><th class="number">Сумма (руб.)</th></tr>
                <tr><td class="code">110</td><td>Доходы за налоговый период</td><td class="number zero">0</td></tr>
                <tr><td class="code">120</td><td>Расходы</td><td class="number zero">0</td></tr>
                <tr><td class="code">130</td><td>Налоговая база</td><td class="number zero">0</td></tr>
                <tr><td class="code">140</td><td>Налоговая ставка (%)</td><td class="number">6</td></tr>
                <tr><td class="code">150</td><td>Сумма налога</td><td class="number zero">0</td></tr>
            </table>

            <div style="margin-top: 40px;">
                <p>Руководитель организации _________________ / _____________________</p>
                <p>Дата: «___» __________ ${currentYear} г.</p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 9px;">
                Примечание: Данная декларация составлена при отсутствии деятельности и доходов.
            </p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция для создания нулевого бухгалтерского баланса
function createZeroBalanceSheet() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Нулевой бухгалтерский баланс за ${currentYear} год</title>
            <style>
                body { font-family: "Courier New", monospace; padding: 20px; font-size: 10px; }
                h1 { text-align: center; font-size: 14px; }
                .header { border: 2px solid #000; padding: 10px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 4px; font-size: 10px; }
                th { background-color: #f0f0f0; }
                .number { text-align: right; }
                .zero { color: #666; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>БУХГАЛТЕРСКИЙ БАЛАНС</h1>
                <p>Форма № 1</p>
                <p><strong>Организация:</strong> ${shortName}</p>
                <p><strong>ИНН:</strong> ${inn}</p>
                <p><strong>Отчетная дата:</strong> 31 декабря ${currentYear} г.</p>
                <p style="color: red; font-weight: bold;">НУЛЕВОЙ</p>
            </div>

            <h2>АКТИВ</h2>
            <table>
                <tr><th>Показатель</th><th>Код</th><th class="number">На 31.${currentYear}</th></tr>
                <tr><td>Внеоборотные активы</td><td class="code">1100</td><td class="number zero">0</td></tr>
                <tr><td>Оборотные активы</td><td class="code">1200</td><td class="number zero">0</td></tr>
                <tr class="total"><td>БАЛАНС</td><td class="code">1600</td><td class="number zero">0</td></tr>
            </table>

            <h2>ПАССИВ</h2>
            <table>
                <tr><th>Показатель</th><th>Код</th><th class="number">На 31.${currentYear}</th></tr>
                <tr><td>Капитал и резервы</td><td class="code">1300</td><td class="number zero">0</td></tr>
                <tr><td>Долгосрочные обязательства</td><td class="code">1400</td><td class="number zero">0</td></tr>
                <tr><td>Краткосрочные обязательства</td><td class="code">1500</td><td class="number zero">0</td></tr>
                <tr class="total"><td>БАЛАНС</td><td class="code">1700</td><td class="number zero">0</td></tr>
            </table>

            <div style="margin-top: 40px;">
                <p>Руководитель организации _________________ / _____________________</p>
                <p>Главный бухгалтер _________________ / _____________________</p>
                <p>Дата: «___» __________ ${currentYear + 1} г.</p>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 9px;">
                Примечание: Баланс составлен при отсутствии деятельности и имущества.
            </p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция для отображения меню нулевой отчётности
function showZeroReportingMenu() {
    const content = `
        <div class="settings-form">
            <h3>Нулевая отчётность</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Шаблоны нулевой отчётности используются при отсутствии деятельности и доходов в отчётном периоде.</p>
                <p style="margin-top: 10px;"><strong>Важно:</strong> Нулевая отчётность должна быть сдана в установленные сроки, даже при отсутствии деятельности!</p>
            </div>
            
            <div class="form-section">
                <h4>📄 Доступные формы</h4>
                
                <div style="margin: 15px 0;">
                    <button type="button" class="action-button" onclick="createZeroUSNDeclaration()" style="width: 100%; text-align: left; padding: 15px;">
                        <strong>📑 Нулевая декларация УСН</strong><br>
                        <small>Для организаций без доходов в отчётном периоде</small>
                    </button>
                </div>
                
                <div style="margin: 15px 0;">
                    <button type="button" class="action-button" onclick="createZeroBalanceSheet()" style="width: 100%; text-align: left; padding: 15px;">
                        <strong>🏛️ Нулевой бухгалтерский баланс</strong><br>
                        <small>Для организаций без имущества и обязательств</small>
                    </button>
                </div>
                
                <div style="margin: 15px 0;">
                    <button type="button" class="action-button" onclick="createZeroRsvReport()" style="width: 100%; text-align: left; padding: 15px;" disabled>
                        <strong>📊 Нулевой РСВ</strong><br>
                        <small>При отсутствии работников (в разработке)</small>
                    </button>
                </div>
            </div>
            
            <div class="settings-info" style="margin-top: 20px;">
                <h4>⚠️ Сроки сдачи нулевой отчётности</h4>
                <ul style="margin: 10px 0 10px 20px;">
                    <li>Декларация УСН: до 31 марта</li>
                    <li>Бухгалтерский баланс: до 31 марта</li>
                    <li>Среднесписочная численность: до 20 января</li>
                    <li>СЗВ-СТАЖ: до 1 марта (ежегодно)</li>
                </ul>
            </div>
            
            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Нулевая отчётность', content);
}

// Функция для создания нулевого РСВ (заготовка)
function createZeroRsvReport() {
    alert('Функция создания нулевого РСВ будет реализована в следующей версии');
}

// ========================================
// Календарь событий и заметок (Фаза 5)
// ========================================

// Типы событий календаря
const EVENT_TYPES = {
    MEETING: 'meeting', // Собрание
    DEADLINE: 'deadline', // Срок сдачи
    PAYMENT: 'payment', // Платёж
    DOCUMENT: 'document', // Документ
    REMINDER: 'reminder', // Напоминание
    OTHER: 'other' // Другое
};

// Функция для добавления события в календарь
function addCalendarEvent(event) {
    if (!cooperativeSettings.calendarEvents) {
        cooperativeSettings.calendarEvents = [];
    }
    
    const newEvent = {
        id: generateId(),
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '09:00',
        type: event.type || EVENT_TYPES.OTHER,
        priority: event.priority || 'normal', // low, normal, high
        completed: false,
        relatedId: event.relatedId || null, // Связь с документом/пайщиком
        createdAt: new Date().toISOString()
    };
    
    cooperativeSettings.calendarEvents.push(newEvent);
    saveSettings();
    return newEvent;
}

// Функция для получения событий за период
function getCalendarEvents(startDate, endDate) {
    const events = cooperativeSettings.calendarEvents || [];
    
    return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
    }).sort((a, b) => {
        // Сортировка по дате и приоритету
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        
        const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

// Функция для получения предстоящих событий
function getUpcomingEvents(daysAhead = 30) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    
    const events = getCalendarEvents(now, future);
    
    return events.filter(event => !event.completed);
}

// Функция для отметки события как выполненного
function completeEvent(eventId) {
    const events = cooperativeSettings.calendarEvents || [];
    const event = events.find(e => e.id === eventId);
    
    if (event) {
        event.completed = true;
        event.completedAt = new Date().toISOString();
        saveSettings();
        return true;
    }
    return false;
}

// Функция для удаления события
function deleteEvent(eventId) {
    const events = cooperativeSettings.calendarEvents || [];
    const index = events.findIndex(e => e.id === eventId);
    
    if (index !== -1) {
        events.splice(index, 1);
        saveSettings();
        return true;
    }
    return false;
}

// Функция для отображения календаря
function showCalendar() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Получаем события текущего месяца
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const events = getCalendarEvents(monthStart, monthEnd);
    
    // Генерация календарной сетки
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    let calendarHtml = '<div class="calendar-grid">';
    
    // Дни недели
    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    calendarHtml += '<div class="calendar-header">';
    weekDays.forEach(day => {
        calendarHtml += `<div class="calendar-day-header">${day}</div>`;
    });
    calendarHtml += '</div>';
    
    // Дни месяца
    calendarHtml += '<div class="calendar-body">';
    
    // Пустые ячейки до первого дня
    for (let i = 0; i < firstDay; i++) {
        calendarHtml += '<div class="calendar-day empty"></div>';
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
        
        let eventsHtml = '';
        dayEvents.slice(0, 3).forEach(event => {
            const priorityClass = event.priority === 'high' ? 'high-priority' : '';
            const completedClass = event.completed ? 'completed' : '';
            eventsHtml += `<div class="calendar-event ${priorityClass} ${completedClass}" title="${event.title}">
                ${event.type === 'meeting' ? '📋' : event.type === 'deadline' ? '⏰' : '📌'} ${event.title.substring(0, 15)}...
            </div>`;
        });
        
        if (dayEvents.length > 3) {
            eventsHtml += `<div class="calendar-more">+${dayEvents.length - 3} ещё</div>`;
        }
        
        calendarHtml += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayEvents('${dateStr}')">
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-day-events">${eventsHtml}</div>
            </div>
        `;
    }
    
    calendarHtml += '</div></div>';
    
    // Предстоящие события
    const upcomingEvents = getUpcomingEvents(30);
    const upcomingHtml = upcomingEvents.length > 0 ? upcomingEvents.map(event => `
        <div class="upcoming-event ${event.completed ? 'completed' : ''}">
            <div class="event-date">${new Date(event.date).toLocaleDateString('ru-RU')}</div>
            <div class="event-info">
                <strong>${event.title}</strong>
                <small>${event.description || ''}</small>
            </div>
            <div class="event-actions">
                ${!event.completed ? `<button onclick="completeEvent('${event.id}')">✓</button>` : ''}
                <button onclick="deleteEvent('${event.id}')">✕</button>
            </div>
        </div>
    `).join('') : '<p style="text-align: center; color: #666;">Предстоящих событий нет</p>';
    
    const content = `
        <div class="calendar-container">
            <div class="calendar-header-main">
                <h2>📅 Календарь событий</h2>
                <div class="calendar-controls">
                    <button class="action-button" onclick="previousMonth()">← Пред.</button>
                    <span class="current-month">${monthNames[currentMonth]} ${currentYear}</span>
                    <button class="action-button" onclick="nextMonth()">След. →</button>
                </div>
                <button class="action-button save" onclick="showAddEventForm()">+ Добавить событие</button>
            </div>
            
            <div class="calendar-content">
                <div class="calendar-main">
                    ${calendarHtml}
                </div>
                
                <div class="calendar-sidebar">
                    <h3>⏰ Предстоящие события (30 дней)</h3>
                    <div class="upcoming-events">
                        ${upcomingHtml}
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .calendar-container { padding: 20px; }
            .calendar-header-main { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 10px;
            }
            .calendar-controls { 
                display: flex; 
                align-items: center; 
                gap: 10px;
            }
            .current-month { 
                font-size: 18px; 
                font-weight: bold;
                min-width: 200px;
                text-align: center;
            }
            .calendar-content { 
                display: grid; 
                grid-template-columns: 1fr 350px; 
                gap: 20px;
            }
            .calendar-grid { width: 100%; }
            .calendar-header { 
                display: grid; 
                grid-template-columns: repeat(7, 1fr); 
                gap: 2px;
                margin-bottom: 5px;
            }
            .calendar-day-header { 
                text-align: center; 
                font-weight: bold; 
                padding: 10px;
                background: #f5f5f5;
                font-size: 12px;
            }
            .calendar-body { 
                display: grid; 
                grid-template-columns: repeat(7, 1fr); 
                gap: 2px;
            }
            .calendar-day { 
                border: 1px solid #e0e0e0; 
                min-height: 100px; 
                padding: 5px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .calendar-day:hover { background: #f5f5f5; }
            .calendar-day.today { 
                background: #e3f2fd; 
                border-color: #2196F3;
            }
            .calendar-day.empty { background: #fafafa; cursor: default; }
            .calendar-day-number { 
                font-weight: bold; 
                margin-bottom: 5px;
                font-size: 14px;
            }
            .calendar-day-events { font-size: 11px; }
            .calendar-event { 
                background: #e3f2fd; 
                padding: 2px 5px; 
                margin: 2px 0; 
                border-radius: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .calendar-event.high-priority { 
                background: #ffebee; 
                color: #c62828;
            }
            .calendar-event.completed { 
                opacity: 0.5; 
                text-decoration: line-through;
            }
            .calendar-more { 
                color: #666; 
                font-size: 10px; 
                padding: 2px 5px;
            }
            .calendar-sidebar { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px;
                max-height: 600px;
                overflow-y: auto;
            }
            .upcoming-events { margin-top: 15px; }
            .upcoming-event { 
                display: flex; 
                gap: 10px; 
                padding: 10px; 
                background: white; 
                border-radius: 5px;
                margin-bottom: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .upcoming-event.completed { 
                opacity: 0.5; 
                text-decoration: line-through;
            }
            .event-date { 
                min-width: 60px; 
                font-size: 12px;
                color: #666;
            }
            .event-info { flex: 1; }
            .event-info strong { display: block; font-size: 13px; }
            .event-info small { color: #666; font-size: 11px; }
            .event-actions { 
                display: flex; 
                gap: 5px;
            }
            .event-actions button {
                padding: 5px 10px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            @media (max-width: 1024px) {
                .calendar-content { grid-template-columns: 1fr; }
                .calendar-sidebar { max-height: 300px; }
            }
        </style>
    `;
    
    showInSideMenu('Календарь событий', content);
}

// Функция отображения формы добавления события
function showAddEventForm() {
    const today = new Date().toISOString().split('T')[0];
    
    const content = `
        <div class="settings-form">
            <h3>Добавить событие</h3>
            
            <form id="event-form">
                <div class="form-group">
                    <label for="event-title">Название *</label>
                    <input type="text" id="event-title" required placeholder="Например: Общее собрание">
                </div>
                
                <div class="form-group">
                    <label for="event-description">Описание</label>
                    <textarea id="event-description" rows="3" placeholder="Детали события"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="event-date">Дата *</label>
                        <input type="date" id="event-date" value="${today}" required>
                    </div>
                    <div class="form-group">
                        <label for="event-time">Время</label>
                        <input type="time" id="event-time" value="09:00">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="event-type">Тип события</label>
                        <select id="event-type">
                            <option value="meeting">📋 Собрание</option>
                            <option value="deadline">⏰ Срок сдачи</option>
                            <option value="payment">💰 Платёж</option>
                            <option value="document">📄 Документ</option>
                            <option value="reminder">🔔 Напоминание</option>
                            <option value="other">📌 Другое</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="event-priority">Приоритет</label>
                        <select id="event-priority">
                            <option value="low">Низкий</option>
                            <option value="normal" selected>Обычный</option>
                            <option value="high">Высокий</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveNewEvent()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Добавить событие', content);
}

// Функция сохранения нового события
function saveNewEvent() {
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const type = document.getElementById('event-type').value;
    const priority = document.getElementById('event-priority').value;
    
    if (!title || !date) {
        alert('Заполните название и дату события');
        return;
    }
    
    addCalendarEvent({
        title,
        description,
        date,
        time,
        type,
        priority
    });
    
    closeSideMenu();
    showCalendar();
    alert('Событие добавлено в календарь!');
}

// Функция отображения событий дня
function showDayEvents(dateStr) {
    const events = (cooperativeSettings.calendarEvents || []).filter(e => e.date === dateStr);
    
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const eventsHtml = events.length > 0 ? events.map(event => `
        <div class="event-item ${event.completed ? 'completed' : ''}">
            <div class="event-header">
                <strong>${event.title}</strong>
                <span class="event-time">${event.time}</span>
            </div>
            <div class="event-description">${event.description || ''}</div>
            <div class="event-meta">
                <span class="event-type">${event.type}</span>
                <span class="event-priority ${event.priority}">${event.priority === 'high' ? '🔴 Высокий' : event.priority === 'normal' ? '🟡 Обычный' : '🟢 Низкий'}</span>
            </div>
            <div class="event-actions">
                ${!event.completed ? `<button onclick="completeEvent('${event.id}')">✓ Выполнено</button>` : ''}
                <button onclick="deleteEvent('${event.id}')">🗑️ Удалить</button>
            </div>
        </div>
    `).join('') : '<p style="text-align: center; color: #666;">Событий на этот день нет</p>';
    
    const content = `
        <div class="day-events">
            <h3>📅 ${dateFormatted}</h3>
            <div class="events-list">
                ${eventsHtml}
            </div>
            <button class="action-button save" onclick="showAddEventForm()" style="margin-top: 20px;">+ Добавить событие</button>
        </div>
    `;
    
    showInSideMenu(`События на ${dateFormatted}`, content);
}

// Функция переключения на предыдущий месяц
function previousMonth() {
    // Реализация будет добавлена при необходимости
    alert('Функция переключения месяца будет реализована');
}

// Функция переключения на следующий месяц
function nextMonth() {
    // Реализация будет добавлена при необходимости
    alert('Функция переключения месяца будет реализована');
}

// ========================================
// Реестры и протоколы (Фаза 6 — Высокий приоритет)
// ========================================

// 6.1 Реестр членов кооператива
function showMembersRegistry() {
    const activeMembers = members.filter(m => m.status === 'active');
    const candidateMembers = members.filter(m => m.status === 'candidate');
    const withdrawnMembers = members.filter(m => m.status === 'withdrawn' || m.status === 'excluded');
    
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    
    let membersHtml = activeMembers.map((m, index) => {
        const joinDate = new Date(m.joinDate);
        const yearsInCoop = currentYear - joinDate.getFullYear();
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${m.name}</td>
                <td>${m.joinDate}</td>
                <td>${yearsInCoop} лет</td>
                <td>${m.cooperativePlot || '—'}</td>
                <td>${m.contact || '—'}</td>
                <td><span class="status-approved">Активен</span></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="7" style="text-align: center;">Действующих членов нет</td></tr>';
    
    const candidatesHtml = candidateMembers.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.joinDate || m.applicationDate}</td>
            <td>${m.contact || '—'}</td>
            <td><span class="status-pending">Кандидат</span></td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align: center;">Кандидатов нет</td></tr>';
    
    const withdrawnHtml = withdrawnMembers.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.joinDate}</td>
            <td>${m.withdrawalDate || '—'}</td>
            <td><span class="status-rejected">${m.status === 'withdrawn' ? 'Выбыл' : 'Исключён'}</span></td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align: center;">Выбывших нет</td></tr>';
    
    const content = `
        <div class="registry-container">
            <div class="registry-header">
                <h2>📋 РЕЕСТР ЧЛЕНОВ КООПЕРАТИВА</h2>
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
                <p><strong>Дата формирования:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                <div class="registry-stats">
                    <div class="stat-card">
                        <span class="stat-number">${activeMembers.length}</span>
                        <span class="stat-label">Действующих членов</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${candidateMembers.length}</span>
                        <span class="stat-label">Кандидатов</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${withdrawnMembers.length}</span>
                        <span class="stat-label">Выбывших</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${members.length}</span>
                        <span class="stat-label">Всего записей</span>
                    </div>
                </div>
            </div>
            
            <div class="registry-tabs">
                <button class="tab-button active" onclick="showRegistryTab('active')">Действующие члены</button>
                <button class="tab-button" onclick="showRegistryTab('candidate')">Кандидаты</button>
                <button class="tab-button" onclick="showRegistryTab('withdrawn')">Выбывшие</button>
            </div>
            
            <div class="registry-content">
                <div id="tab-active" class="tab-content active">
                    <h3>Действующие члены кооператива</h3>
                    <table class="registry-table">
                        <thead>
                            <tr><th>№</th><th>ФИО</th><th>Дата вступления</th><th>Стаж</th><th>Участок</th><th>Контакт</th><th>Статус</th></tr>
                        </thead>
                        <tbody>${membersHtml}</tbody>
                    </table>
                </div>
                
                <div id="tab-candidate" class="tab-content">
                    <h3>Кандидаты в члены кооператива</h3>
                    <table class="registry-table">
                        <thead>
                            <tr><th>ФИО</th><th>Дата подачи</th><th>Контакт</th><th>Статус</th></tr>
                        </thead>
                        <tbody>${candidatesHtml}</tbody>
                    </table>
                </div>
                
                <div id="tab-withdrawn" class="tab-content">
                    <h3>Выбывшие члены кооператива</h3>
                    <table class="registry-table">
                        <thead>
                            <tr><th>ФИО</th><th>Дата вступления</th><th>Дата выбытия</th><th>Статус</th></tr>
                        </thead>
                        <tbody>${withdrawnHtml}</tbody>
                    </table>
                </div>
            </div>
            
            <div class="registry-actions">
                <button class="action-button" onclick="printMembersRegistry()">🖨️ Печать реестра</button>
                <button class="action-button" onclick="exportMembersRegistry()">📥 Экспорт в Excel</button>
                <button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
        
        <style>
            .registry-container { padding: 20px; }
            .registry-header { 
                border-bottom: 2px solid #2c3e50; 
                padding-bottom: 20px; 
                margin-bottom: 20px;
            }
            .registry-header h2 { 
                color: #2c3e50; 
                margin-bottom: 10px;
            }
            .registry-stats { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 15px; 
                margin-top: 20px;
            }
            .stat-card { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 20px; 
                border-radius: 8px; 
                text-align: center;
            }
            .stat-number { 
                display: block; 
                font-size: 32px; 
                font-weight: bold;
            }
            .stat-label { 
                font-size: 12px; 
                opacity: 0.9;
            }
            .registry-tabs { 
                display: flex; 
                gap: 10px; 
                margin-bottom: 20px;
            }
            .tab-button { 
                padding: 10px 20px; 
                border: none; 
                background: #f5f5f5; 
                cursor: pointer; 
                border-radius: 4px;
                font-weight: 500;
            }
            .tab-button.active { 
                background: #667eea; 
                color: white;
            }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .registry-table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 13px;
            }
            .registry-table th, 
            .registry-table td { 
                border: 1px solid #e0e0e0; 
                padding: 10px; 
                text-align: left;
            }
            .registry-table th { 
                background: #f5f5f5; 
                font-weight: 600;
            }
            .registry-actions { 
                margin-top: 20px; 
                display: flex; 
                gap: 10px;
            }
            @media (max-width: 768px) {
                .registry-stats { grid-template-columns: repeat(2, 1fr); }
            }
        </style>
    `;
    
    showInSideMenu('Реестр членов', content);
}

// Функция печати реестра членов
function printMembersRegistry() {
    const activeMembers = members.filter(m => m.status === 'active');
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const currentYear = new Date().getFullYear();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Реестр членов кооператива</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 12px; }
                h1 { text-align: center; font-size: 16px; }
                .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 6px; font-size: 11px; }
                th { background-color: #f0f0f0; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>РЕЕСТР ЧЛЕНОВ КООПЕРАТИВА</h1>
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
                <p><strong>Дата формирования:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
            
            <p><strong>Действующие члены кооператива:</strong></p>
            <table>
                <tr><th>№</th><th>ФИО</th><th>Дата вступления</th><th>Участок</th><th>Контакт</th></tr>
                ${activeMembers.map((m, i) => `<tr><td>${i + 1}</td><td>${m.name}</td><td>${m.joinDate}</td><td>${m.cooperativePlot || '—'}</td><td>${m.contact || '—'}</td></tr>`).join('')}
            </table>
            
            <p class="total" style="margin-top: 15px;">Всего действующих членов: ${activeMembers.length}</p>
            
            <div style="margin-top: 40px;">
                <p>Председатель _________________ / _____________________</p>
                <p>Секретарь _________________ / _____________________</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Функция экспорта реестра
function exportMembersRegistry() {
    const activeMembers = members.filter(m => m.status === 'active');
    const data = activeMembers.map((m, i) => ({
        '№': i + 1,
        'ФИО': m.name,
        'Дата вступления': m.joinDate,
        'Участок': m.cooperativePlot || '',
        'Контакт': m.contact || '',
        'Статус': 'Активен'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Реестр членов');
    XLSX.writeFile(wb, `Реестр_членов_${new Date().getFullYear()}.xlsx`);
}

// Функция переключения вкладок реестра
function showRegistryTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

// 6.2 Реестр выданных удостоверений
function showCertificatesRegistry() {
    const certs = certificates || [];
    const activeCerts = certs.filter(c => c.status === 'active');
    const inactiveCerts = certs.filter(c => c.status === 'inactive');
    
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    
    const activeHtml = activeCerts.map((c, index) => {
        const member = members.find(m => m.id === c.memberId);
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${c.certificateNumber}</td>
                <td>${c.issueDate}</td>
                <td>${member ? member.name : '—'}</td>
                <td><span class="status-approved">Действует</span></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align: center;">Удостоверений не выдано</td></tr>';
    
    const inactiveHtml = inactiveCerts.map(c => {
        const member = members.find(m => m.id === c.memberId);
        return `
            <tr>
                <td>${c.certificateNumber}</td>
                <td>${c.issueDate}</td>
                <td>${member ? member.name : '—'}</td>
                <td><span class="status-rejected">Неактивно</span></td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="4" style="text-align: center;">Неактивных удостоверений нет</td></tr>';
    
    const content = `
        <div class="registry-container">
            <div class="registry-header">
                <h2>📜 РЕЕСТР ВЫДАННЫХ УДОСТОВЕРЕНИЙ</h2>
                <p><strong>Организация:</strong> ${shortName}</p>
                <p><strong>Дата формирования:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                <div class="registry-stats">
                    <div class="stat-card">
                        <span class="stat-number">${activeCerts.length}</span>
                        <span class="stat-label">Действующих</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${inactiveCerts.length}</span>
                        <span class="stat-label">Неактивных</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${certs.length}</span>
                        <span class="stat-label">Всего выдано</span>
                    </div>
                </div>
            </div>
            
            <div class="registry-tabs">
                <button class="tab-button active" onclick="showCertTab('active')">Действующие</button>
                <button class="tab-button" onclick="showCertTab('inactive')">Неактивные</button>
            </div>
            
            <div class="registry-content">
                <div id="cert-tab-active" class="tab-content active">
                    <h3>Действующие удостоверения</h3>
                    <table class="registry-table">
                        <thead>
                            <tr><th>№</th><th>Номер</th><th>Дата выдачи</th><th>Пайщик</th><th>Статус</th></tr>
                        </thead>
                        <tbody>${activeHtml}</tbody>
                    </table>
                </div>
                
                <div id="cert-tab-inactive" class="tab-content">
                    <h3>Неактивные удостоверения</h3>
                    <table class="registry-table">
                        <thead>
                            <tr><th>Номер</th><th>Дата выдачи</th><th>Пайщик</th><th>Статус</th></tr>
                        </thead>
                        <tbody>${inactiveHtml}</tbody>
                    </table>
                </div>
            </div>
            
            <div class="registry-actions">
                <button class="action-button" onclick="printCertificatesRegistry()">🖨️ Печать реестра</button>
                <button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Реестр удостоверений', content);
}

function showCertTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`cert-tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

function printCertificatesRegistry() {
    const certs = certificates || [];
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Реестр выданных удостоверений</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 12px; }
                h1 { text-align: center; font-size: 16px; }
                .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 6px; }
                th { background-color: #f0f0f0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>РЕЕСТР ВЫДАННЫХ УДОСТОВЕРЕНИЙ</h1>
                <p><strong>Организация:</strong> ${shortName}</p>
                <p><strong>Дата формирования:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
            
            <table>
                <tr><th>№</th><th>Номер удостоверения</th><th>Дата выдачи</th><th>ФИО пайщика</th><th>Статус</th></tr>
                ${certs.map((c, i) => {
                    const member = members.find(m => m.id === c.memberId);
                    return `<tr><td>${i + 1}</td><td>${c.certificateNumber}</td><td>${c.issueDate}</td><td>${member ? member.name : '—'}</td><td>${c.status === 'active' ? 'Действует' : 'Неактивно'}</td></tr>`;
                }).join('')}
            </table>
            
            <p style="margin-top: 15px;">Всего выдано удостоверений: ${certs.length}</p>
            
            <div style="margin-top: 40px;">
                <p>Председатель _________________ / _____________________</p>
                <p>Секретарь _________________ / _____________________</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// 6.3 Протокол общего собрания
function showMeetingProtocolForm() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const legalAddress = cooperativeSettings.legalAddress || '—';
    const chairman = cooperativeSettings.chairman || {};
    const council = cooperativeSettings.council || {};
    
    const activeMembers = members.filter(m => m.status === 'active');
    const quorum = activeMembers.length > 0 ? Math.ceil(activeMembers.length / 2) : 0;
    
    const content = `
        <div class="protocol-form">
            <h2>📋 ПРОТОКОЛ ОБЩЕГО СОБРАНИЯ ЧЛЕНОВ КООПЕРАТИВА</h2>
            
            <div class="protocol-info">
                <p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p>
                <p><strong>Адрес:</strong> ${legalAddress}</p>
            </div>
            
            <form id="protocol-form">
                <div class="form-section">
                    <h4>📅 Общие сведения</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="protocol-number">Номер протокола *</label>
                            <input type="text" id="protocol-number" placeholder="№___" required>
                        </div>
                        <div class="form-group">
                            <label for="protocol-date">Дата проведения *</label>
                            <input type="date" id="protocol-date" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label for="protocol-time">Время начала *</label>
                            <input type="time" id="protocol-time" value="10:00" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="protocol-place">Место проведения *</label>
                        <input type="text" id="protocol-place" placeholder="Адрес проведения собрания" required>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>👥 Кворум</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="total-members">Всего членов кооператива</label>
                            <input type="number" id="total-members" value="${activeMembers.length}" readonly>
                        </div>
                        <div class="form-group">
                            <label for="present-members">Присутствует *</label>
                            <input type="number" id="present-members" min="${quorum}" max="${activeMembers.length}" required>
                        </div>
                        <div class="form-group">
                            <label for="quorum-percent">Процент кворума</label>
                            <input type="text" id="quorum-percent" readonly>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Кворум:</label>
                        <div id="quorum-status" style="padding: 10px; background: #ffebee; color: #c62828; border-radius: 4px;">
                            Недостаточный (требуется минимум ${quorum} человек)
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>📝 Повестка дня</h4>
                    <div id="agenda-items">
                        <div class="agenda-item">
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label for="agenda-1">Вопрос 1 *</label>
                                    <input type="text" id="agenda-1" placeholder="Например: Утверждение годовой отчётности" required>
                                </div>
                                <div class="form-group">
                                    <label for="agenda-reporter-1">Докладчик</label>
                                    <input type="text" id="agenda-reporter-1" placeholder="ФИО">
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="action-button" onclick="addAgendaItem()" style="margin-top: 10px;">+ Добавить вопрос</button>
                </div>
                
                <div class="form-section">
                    <h4>✍️ Подписи</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="protocol-chairman">Председатель собрания *</label>
                            <input type="text" id="protocol-chairman" value="${chairman.name || ''}" placeholder="ФИО председателя" required>
                        </div>
                        <div class="form-group">
                            <label for="protocol-secretary">Секретарь собрания *</label>
                            <input type="text" id="protocol-secretary" value="${council.secretary?.name || ''}" placeholder="ФИО секретаря" required>
                        </div>
                    </div>
                </div>
                
                <div class="protocol-actions">
                    <button type="button" class="action-button save" onclick="generateProtocol()">📄 Сформировать протокол</button>
                    <button type="button" class="action-button" onclick="showAttendanceList()">📋 Лист регистрации</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
        
        <style>
            .protocol-form { padding: 20px; }
            .protocol-form h2 { 
                text-align: center; 
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 18px;
            }
            .protocol-info { 
                background: #f5f5f5; 
                padding: 15px; 
                border-radius: 8px; 
                margin-bottom: 20px;
            }
            .form-section { 
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                margin-bottom: 20px;
            }
            .form-section h4 { 
                margin-top: 0; 
                margin-bottom: 15px; 
                color: #2c3e50;
            }
            .agenda-item { 
                background: white; 
                padding: 15px; 
                border-radius: 4px; 
                margin-bottom: 10px;
                border-left: 3px solid #667eea;
            }
            .protocol-actions { 
                display: flex; 
                gap: 10px; 
                margin-top: 20px;
                flex-wrap: wrap;
            }
            #quorum-status { 
                font-weight: 500;
            }
            #quorum-status.ok { 
                background: #e8f5e9; 
                color: #2e7d32;
            }
        </style>
    `;
    
    showInSideMenu('Протокол общего собрания', content);
    
    // Автоматический расчёт кворума
    setTimeout(() => {
        const presentInput = document.getElementById('present-members');
        const totalMembers = activeMembers.length;
        
        presentInput.addEventListener('input', function() {
            const present = parseInt(this.value) || 0;
            const percent = totalMembers > 0 ? ((present / totalMembers) * 100).toFixed(1) : 0;
            document.getElementById('quorum-percent').value = percent + '%';
            
            const statusDiv = document.getElementById('quorum-status');
            if (present >= quorum) {
                statusDiv.textContent = `Кворум имеется (${percent}%)`;
                statusDiv.className = 'ok';
            } else {
                statusDiv.textContent = `Недостаточный (требуется минимум ${quorum} человек)`;
                statusDiv.className = '';
            }
        });
    }, 100);
}

// Функция добавления вопроса повестки
function addAgendaItem() {
    const container = document.getElementById('agenda-items');
    const itemCount = container.children.length + 1;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'agenda-item';
    itemDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group" style="flex: 1;">
                <label for="agenda-${itemCount}">Вопрос ${itemCount} *</label>
                <input type="text" id="agenda-${itemCount}" placeholder="Формулировка вопроса" required>
            </div>
            <div class="form-group">
                <label for="agenda-reporter-${itemCount}">Докладчик</label>
                <input type="text" id="agenda-reporter-${itemCount}" placeholder="ФИО">
            </div>
            <div class="form-group">
                <label>&nbsp;</label>
                <button type="button" class="action-button delete" onclick="this.closest('.agenda-item').remove()">✕</button>
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
}

// Функция генерации протокола
function generateProtocol() {
    const protocolNumber = document.getElementById('protocol-number').value;
    const protocolDate = document.getElementById('protocol-date').value;
    const protocolTime = document.getElementById('protocol-time').value;
    const protocolPlace = document.getElementById('protocol-place').value;
    const presentMembers = parseInt(document.getElementById('present-members').value) || 0;
    const totalMembers = members.filter(m => m.status === 'active').length;
    const chairman = document.getElementById('protocol-chairman').value;
    const secretary = document.getElementById('protocol-secretary').value;
    
    if (!protocolNumber || !protocolDate || !protocolPlace || !presentMembers) {
        alert('Заполните обязательные поля');
        return;
    }
    
    // Сбор вопросов повестки
    const agendaItems = [];
    document.querySelectorAll('.agenda-item').forEach((item, index) => {
        const question = document.getElementById(`agenda-${index + 1}`).value;
        const reporter = document.getElementById(`agenda-reporter-${index + 1}`).value;
        if (question) {
            agendaItems.push({ question, reporter });
        }
    });
    
    if (agendaItems.length === 0) {
        alert('Добавьте хотя бы один вопрос повестки');
        return;
    }
    
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    const percent = totalMembers > 0 ? ((presentMembers / totalMembers) * 100).toFixed(1) : 0;
    const quorum = Math.ceil(totalMembers / 2);
    const hasQuorum = presentMembers >= quorum;
    
    const dateObj = new Date(protocolDate);
    const dateFormatted = dateObj.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Протокол № ${protocolNumber} от ${protocolDate}</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 14px; line-height: 1.5; }
                h1 { text-align: center; font-size: 16px; margin-bottom: 10px; }
                h2 { text-align: center; font-size: 14px; font-weight: normal; margin-bottom: 20px; }
                .section { margin: 20px 0; }
                .section-title { font-weight: bold; margin-bottom: 10px; }
                p { margin: 10px 0; text-align: justify; }
                ol, ul { margin: 10px 0; padding-left: 30px; }
                li { margin: 5px 0; }
                .signature { margin-top: 40px; }
                .sign-line { 
                    display: flex; 
                    justify-content: space-between; 
                    margin: 20px 0;
                    border-bottom: 1px solid #000;
                    padding-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <h1>ПРОТОКОЛ № ${protocolNumber}</h1>
            <h2>общего собрания членов кооператива "${shortName}"</h2>
            
            <div class="section">
                <p><strong>Дата проведения:</strong> ${dateFormatted}</p>
                <p><strong>Время начала:</strong> ${protocolTime}</p>
                <p><strong>Место проведения:</strong> ${protocolPlace}</p>
            </div>
            
            <div class="section">
                <div class="section-title">ПРИСУТСТВОВАЛИ:</div>
                <p>Всего членов кооператива: ${totalMembers}</p>
                <p>Присутствует: ${presentMembers} (${percent}%)</p>
                <p><strong>Кворум:</strong> ${hasQuorum ? 'ИМЕЕТСЯ' : 'НЕ ИМЕЕТСЯ'} (требуется не менее ${quorum} человек)</p>
            </div>
            
            <div class="section">
                <div class="section-title">ПОВЕСТКА ДНЯ:</div>
                <ol>
                    ${agendaItems.map((item, i) => `
                        <li>
                            ${item.question}
                            ${item.reporter ? `<br><small>Докладчик: ${item.reporter}</small>` : ''}
                        </li>
                    `).join('')}
                </ol>
            </div>
            
            <div class="section">
                <div class="section-title">СЛУШАЛИ:</div>
                <p>[Текст выступлений по каждому вопросу повестки]</p>
            </div>
            
            <div class="section">
                <div class="section-title">ПОСТАНОВИЛИ:</div>
                <ol>
                    ${agendaItems.map((item, i) => `
                        <li>По вопросу ${i + 1}: [Решение по вопросу]</li>
                    `).join('')}
                </ol>
            </div>
            
            <div class="signature">
                <div class="sign-line">
                    <span>Председатель собрания</span>
                    <span>_________________ / ${chairman}</span>
                </div>
                <div class="sign-line">
                    <span>Секретарь собрания</span>
                    <span>_________________ / ${secretary}</span>
                </div>
            </div>
            
            <p style="margin-top: 40px; font-size: 12px; color: #666;">
                Протокол составил: _________________ / _____________________<br>
                «___» __________ 20__ г.
            </p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// 6.4 Лист регистрации участников
function showAttendanceList() {
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const activeMembers = members.filter(m => m.status === 'active');
    
    const attendanceRows = activeMembers.map((m, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${m.name}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    `).join('');
    
    const content = `
        <div class="attendance-container">
            <h2>📋 ЛИСТ РЕГИСТРАЦИИ УЧАСТНИКОВ</h2>
            <p><strong>Организация:</strong> ${shortName}</p>
            <p><strong>Мероприятие:</strong> Общее собрание членов кооператива</p>
            
            <div class="attendance-actions">
                <button class="action-button" onclick="printAttendanceList()">🖨️ Печать листа регистрации</button>
                <button class="action-button" onclick="closeSideMenu()">Закрыть</button>
            </div>
            
            <div class="attendance-preview">
                <table class="attendance-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">№</th>
                            <th>ФИО пайщика</th>
                            <th style="width: 200px;">Подпись</th>
                            <th style="width: 100px;">Время</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendanceRows}
                    </tbody>
                </table>
            </div>
        </div>
        
        <style>
            .attendance-container { padding: 20px; }
            .attendance-container h2 { 
                text-align: center; 
                color: #2c3e50;
                margin-bottom: 10px;
            }
            .attendance-actions { 
                display: flex; 
                gap: 10px; 
                margin: 20px 0;
            }
            .attendance-preview { 
                background: white; 
                padding: 20px; 
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .attendance-table { 
                width: 100%; 
                border-collapse: collapse; 
                font-size: 12px;
            }
            .attendance-table th, 
            .attendance-table td { 
                border: 1px solid #000; 
                padding: 8px;
            }
            .attendance-table th { 
                background: #f0f0f0; 
                font-weight: 600;
                text-align: center;
            }
            .attendance-table td { 
                height: 30px;
            }
        </style>
    `;
    
    showInSideMenu('Лист регистрации', content);
}

// Функция печати листа регистрации
function printAttendanceList() {
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const activeMembers = members.filter(m => m.status === 'active');
    
    const attendanceRows = activeMembers.map((m, i) => `
        <tr>
            <td style="width: 40px;">${i + 1}</td>
            <td>${m.name}</td>
            <td style="width: 200px;"></td>
            <td style="width: 80px;"></td>
        </tr>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Лист регистрации участников</title>
            <style>
                body { font-family: "Times New Roman", serif; padding: 20px; font-size: 12px; }
                h1 { text-align: center; font-size: 16px; }
                .header { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 6px; }
                th { background-color: #f0f0f0; text-align: center; }
                td { height: 25px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ЛИСТ РЕГИСТРАЦИИ УЧАСТНИКОВ</h1>
                <p><strong>Организация:</strong> ${shortName}</p>
                <p><strong>Мероприятие:</strong> Общее собрание членов кооператива</p>
                <p><strong>Дата:</strong> «___» __________ 20__ г.</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>№</th>
                        <th>ФИО пайщика</th>
                        <th>Подпись</th>
                        <th>Время</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendanceRows}
                </tbody>
            </table>
            
            <p style="margin-top: 20px;">Всего зарегистрировано: _____ человек</p>
            
            <div style="margin-top: 40px;">
                <p>Председатель собрания _________________ / _____________________</p>
                <p>Секретарь _________________ / _____________________</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// 6.5 Годовой отчёт по фондам
function showAnnualFundsReport() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const inn = cooperativeSettings.inn || '—';
    
    // Расчёт по фондам
    const funds = {
        share: { beginning: calculateFundBalance('86-1', currentYear - 1), received: calculateFundTurnover('86-1', currentYear, 'credit'), spent: calculateFundTurnover('86-1', currentYear, 'debit'), ending: 0 },
        indivisible: { beginning: calculateFundBalance('86-2', currentYear - 1), received: calculateFundTurnover('86-2', currentYear, 'credit'), spent: calculateFundTurnover('86-2', currentYear, 'debit'), ending: 0 },
        reserve: { beginning: calculateFundBalance('86-3', currentYear - 1), received: calculateFundTurnover('86-3', currentYear, 'credit'), spent: calculateFundTurnover('86-3', currentYear, 'debit'), ending: 0 },
        development: { beginning: calculateFundBalance('86-4', currentYear - 1), received: calculateFundTurnover('86-4', currentYear, 'credit'), spent: calculateFundTurnover('86-4', currentYear, 'debit'), ending: 0 },
        business: { beginning: calculateFundBalance('86-5', currentYear - 1), received: calculateFundTurnover('86-5', currentYear, 'credit'), spent: calculateFundTurnover('86-5', currentYear, 'debit'), ending: 0 }
    };
    Object.keys(funds).forEach(key => { funds[key].ending = funds[key].beginning + funds[key].received - funds[key].spent; });
    
    const total = { beginning: Object.values(funds).reduce((sum, f) => sum + f.beginning, 0), received: Object.values(funds).reduce((sum, f) => sum + f.received, 0), spent: Object.values(funds).reduce((sum, f) => sum + f.spent, 0), ending: Object.values(funds).reduce((sum, f) => sum + f.ending, 0) };
    
    const content = `<div class="annual-report"><h2>📊 ГОДОВОЙ ОТЧЁТ ПО ФОНДАМ</h2><p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p><p><strong>Отчётный период:</strong> ${currentYear} год</p><div class="report-summary"><div class="summary-card"><span class="summary-label">Остаток на начало года</span><span class="summary-value">${total.beginning.toLocaleString()} ₽</span></div><div class="summary-card"><span class="summary-label">Поступило за год</span><span class="summary-value incoming">${total.received.toLocaleString()} ₽</span></div><div class="summary-card"><span class="summary-label">Использовано за год</span><span class="summary-value outgoing">${total.spent.toLocaleString()} ₽</span></div><div class="summary-card"><span class="summary-label">Остаток на конец года</span><span class="summary-value">${total.ending.toLocaleString()} ₽</span></div></div><h3>Движение средств по фондам</h3><table class="funds-table"><thead><tr><th>Фонд</th><th>Счёт</th><th>На начало года</th><th>Поступило</th><th>Использовано</th><th>На конец года</th></tr></thead><tbody><tr><td><strong>Паевой фонд</strong></td><td>86-1</td><td class="amount">${funds.share.beginning.toLocaleString()} ₽</td><td class="amount incoming">${funds.share.received.toLocaleString()} ₽</td><td class="amount outgoing">${funds.share.spent.toLocaleString()} ₽</td><td class="amount"><strong>${funds.share.ending.toLocaleString()} ₽</strong></td></tr><tr><td><strong>Неделимый фонд</strong></td><td>86-2</td><td class="amount">${funds.indivisible.beginning.toLocaleString()} ₽</td><td class="amount incoming">${funds.indivisible.received.toLocaleString()} ₽</td><td class="amount outgoing">${funds.indivisible.spent.toLocaleString()} ₽</td><td class="amount"><strong>${funds.indivisible.ending.toLocaleString()} ₽</strong></td></tr><tr><td><strong>Резервный фонд</strong></td><td>86-3/82</td><td class="amount">${funds.reserve.beginning.toLocaleString()} ₽</td><td class="amount incoming">${funds.reserve.received.toLocaleString()} ₽</td><td class="amount outgoing">${funds.reserve.spent.toLocaleString()} ₽</td><td class="amount"><strong>${funds.reserve.ending.toLocaleString()} ₽</strong></td></tr><tr><td><strong>Фонд развития</strong></td><td>86-4</td><td class="amount">${funds.development.beginning.toLocaleString()} ₽</td><td class="amount incoming">${funds.development.received.toLocaleString()} ₽</td><td class="amount outgoing">${funds.development.spent.toLocaleString()} ₽</td><td class="amount"><strong>${funds.development.ending.toLocaleString()} ₽</strong></td></tr><tr><td><strong>Фонд хоз. деятельности</strong></td><td>86-5</td><td class="amount">${funds.business.beginning.toLocaleString()} ₽</td><td class="amount incoming">${funds.business.received.toLocaleString()} ₽</td><td class="amount outgoing">${funds.business.spent.toLocaleString()} ₽</td><td class="amount"><strong>${funds.business.ending.toLocaleString()} ₽</strong></td></tr><tr class="total-row"><td><strong>ИТОГО</strong></td><td></td><td class="amount"><strong>${total.beginning.toLocaleString()} ₽</strong></td><td class="amount incoming"><strong>${total.received.toLocaleString()} ₽</strong></td><td class="amount outgoing"><strong>${total.spent.toLocaleString()} ₽</strong></td><td class="amount"><strong>${total.ending.toLocaleString()} ₽</strong></td></tr></tbody></table><div class="report-actions"><button class="action-button" onclick="printAnnualFundsReport()">🖨️ Печать</button><button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button></div></div><style>.annual-report{padding:20px}.annual-report h2{text-align:center;color:#2c3e50;margin-bottom:10px}.report-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0}.summary-card{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;border-radius:8px;text-align:center}.summary-label{display:block;font-size:12px;opacity:0.9;margin-bottom:10px}.summary-value{display:block;font-size:20px;font-weight:bold}.summary-value.incoming{color:#a5d6a7}.summary-value.outgoing{color:#ef9a9a}.funds-table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}.funds-table th,.funds-table td{border:1px solid #e0e0e0;padding:10px;text-align:left}.funds-table th{background:#f5f5f5;font-weight:600}.funds-table .amount{text-align:right;font-family:'Courier New',monospace}.funds-table .incoming{color:#2e7d32}.funds-table .outgoing{color:#c62828}.funds-table .total-row{background:#e3f2fd;font-weight:bold}.report-actions{display:flex;gap:10px;margin-top:20px}@media(max-width:768px){.report-summary{grid-template-columns:repeat(2,1fr)}}</style>`;
    
    showInSideMenu('Годовой отчёт по фондам', content);
}

function calculateFundBalance(account, year) { const yearEnd = new Date(year, 11, 31); const credit = transactions.filter(t => t.creditAccount === account && new Date(t.date) <= yearEnd).reduce((sum, t) => sum + (t.amount || 0), 0); const debit = transactions.filter(t => t.debitAccount === account && new Date(t.date) <= yearEnd).reduce((sum, t) => sum + (t.amount || 0), 0); return credit - debit; }
function calculateFundTurnover(account, year, side) { const startDate = new Date(year, 0, 1); const endDate = new Date(year, 11, 31); return transactions.filter(t => { const date = new Date(t.date); return date >= startDate && date <= endDate && t[side + 'Account'] === account; }).reduce((sum, t) => sum + (t.amount || 0), 0); }
function printAnnualFundsReport() { const currentYear = new Date().getFullYear(); const shortName = cooperativeSettings.shortName || 'Потребител����ский кооператив'; const inn = cooperativeSettings.inn || '—'; const printWindow = window.open('', '_blank'); printWindow.document.write(`<html><head><title>Годовой отчёт по фондам за ${currentYear} год</title><style>body{font-family:"Times New Roman",serif;padding:20px;font-size:12px}h1{text-align:center;font-size:16px}.header{margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #000;padding:6px}th{background-color:#f0f0f0}.amount{text-align:right}.total{font-weight:bold;background-color:#e0e0e0}</style></head><body><div class="header"><h1>ГОДОВОЙ ОТЧЁТ ПО ФОНДАМ КООПЕРАТИВА</h1><p><strong>Организация:</strong> ${shortName} (ИНН ${inn})</p><p><strong>Отчётный период:</strong> ${currentYear} год</p></div><table><thead><tr><th>Фонд</th><th>На начало года</th><th>Поступило</th><th>Использовано</th><th>На конец года</th></tr></thead><tbody><tr><td>Паевой фонд</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td></tr><tr><td>Неделимый фонд</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td></tr><tr><td>Резервный фонд</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td></tr><tr><td>Фонд развития</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td></tr><tr><td>Фонд хоз. деятельности</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td></tr><tr class="total"><td>ИТОГО</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td><td class="amount">0 ₽</td></tr></tbody></table><div style="margin-top:40px"><p>Председатель _________________ / _____________________</p><p>Главный бухгалтер _________________ / _____________________</p><p>Дата: «___» __________ ${currentYear + 1} г.</p></div></body></html>`); printWindow.document.close(); printWindow.print(); }

// 6.6 Отчёт ревизионной комиссии
function showSupervisionReport() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const supervision = cooperativeSettings.supervision || {};
    const chairmanName = supervision.chairman?.name || 'Председатель РК';
    
    const content = `<div class="supervision-report"><h2>👁️ ЗАКЛЮЧЕНИЕ РЕВИЗИОННОЙ КОМИССИИ</h2><p><strong>Организация:</strong> ${shortName}</p><p><strong>Отчётный период:</strong> ${currentYear} год</p><div class="report-info"><h4>ℹ️ Информация о ревизионном органе</h4><p><strong>Тип:</strong> ${supervision.type === 'revizor' ? 'Ревизор' : 'Ревизионная комиссия'}</p><p><strong>Председатель:</strong> ${chairmanName || 'Не назначен'}</p></div><form id="supervision-form"><div class="form-section"><h4>📋 Результаты проверки</h4><div class="form-group"><label for="check-period">Проверяемый период *</label><input type="text" id="check-period" placeholder="01.01.2025 - 31.12.2025" required></div><div class="form-group"><label for="check-documents">Проверенные документы</label><textarea id="check-documents" rows="4" placeholder="Перечень проверенных документов"></textarea></div></div><div class="form-section"><h4>✅ Соответствие законодательству</h4><div class="form-group"><label><input type="checkbox" id="compliance-accounting"> Бухгалтерский учёт ведётся правильно</label></div><div class="form-group"><label><input type="checkbox" id="compliance-funds"> Целевое использование средств соблюдается</label></div><div class="form-group"><label><input type="checkbox" id="compliance-reporting"> Отчётность сдаётся своевременно</label></div></div><div class="form-section"><h4>⚠️ Выявленные нарушения</h4><div class="form-group"><label for="violations">Описание нарушений</label><textarea id="violations" rows="4" placeholder="Нарушений не выявлено"></textarea></div></div><div class="form-section"><h4>📝 Рекомендации</h4><div class="form-group"><label for="recommendations">Рекомендации общему собранию</label><textarea id="recommendations" rows="4" placeholder="Рекомендации по устранению нарушений"></textarea></div></div><div class="form-section"><h4>🎯 Заключение</h4><div class="form-group"><label for="conclusion-type">Тип заключения *</label><select id="conclusion-type" required><option value="positive">✅ Положительное</option><option value="conditional">⚠️ Условно-положительное</option><option value="negative">❌ Отрицательное</option></select></div><div class="form-group"><label for="conclusion-text">Текст заключения *</label><textarea id="conclusion-text" rows="3" placeholder="По результатам проверки..." required></textarea></div></div><div class="report-actions"><button type="button" class="action-button save" onclick="generateSupervisionReport()">📄 Сформировать заключение</button><button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button></div></form></div><style>.supervision-report{padding:20px}.supervision-report h2{text-align:center;color:#2c3e50;margin-bottom:10px}.report-info{background:#e3f2fd;padding:15px;border-radius:8px;margin-bottom:20px;border-left:4px solid #2196F3}.form-section{background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:20px}.form-section h4{margin-top:0;margin-bottom:15px;color:#2c3e50}.form-group{margin-bottom:15px}.form-group label{display:block;margin-bottom:5px;font-weight:500}.form-group input[type="checkbox"]{margin-right:10px}.report-actions{display:flex;gap:10px;margin-top:20px}</style>`;
    
    showInSideMenu('Заключение ревизионной комиссии', content);
}

function generateSupervisionReport() {
    const checkPeriod = document.getElementById('check-period').value;
    const violations = document.getElementById('violations').value || 'Нарушений не выявлено';
    const recommendations = document.getElementById('recommendations').value || 'Рекомендаций нет';
    const conclusionType = document.getElementById('conclusion-type').value;
    const conclusionText = document.getElementById('conclusion-text').value;
    if (!checkPeriod || !conclusionText) { alert('Заполните обязательные поля'); return; }
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const supervision = cooperativeSettings.supervision || {};
    const chairmanName = supervision.chairman?.name || 'Председатель РК';
    const conclusionLabels = { 'positive': 'ПОЛОЖИТЕЛЬНОЕ', 'conditional': 'УСЛОВНО-ПОЛОЖИТЕЛЬНОЕ', 'negative': 'ОТРИЦАТЕЛЬНОЕ' };
    const conclusionColors = { 'positive': '#2e7d32', 'conditional': '#f57c00', 'negative': '#c62828' };
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Заключение ревизионной комиссии</title><style>body{font-family:"Times New Roman",serif;padding:20px;font-size:14px;line-height:1.5}h1{text-align:center;font-size:16px;margin-bottom:10px}h2{text-align:center;font-size:14px;font-weight:normal;margin-bottom:20px}.section{margin:20px 0}.section-title{font-weight:bold;margin-bottom:10px}p{margin:10px 0;text-align:justify}.conclusion{text-align:center;font-weight:bold;font-size:16px;padding:15px;margin:20px 0;border:2px solid ${conclusionColors[conclusionType]};color:${conclusionColors[conclusionType]}}.signature{margin-top:40px}.sign-line{display:flex;justify-content:space-between;margin:20px 0;border-bottom:1px solid #000;padding-bottom:5px}</style></head><body><h1>ЗАКЛЮЧЕНИЕ РЕВИЗИОННОЙ КОМИССИИ</h1><h2>по результатам проверки финансово-хозяйственной деятельности</h2><div class="section"><p><strong>Организация:</strong> ${shortName}</p><p><strong>Проверяемый период:</strong> ${checkPeriod}</p></div><div class="section"><div class="section-title">ПРОВЕРЕНЫ ДОКУМЕНТЫ:</div><p>Бухгалтерская отчётность, первичные документы, реестры</p></div><div class="section"><div class="section-title">ВЫЯВЛЕННЫЕ НАРУШЕНИЯ:</div><p>${violations}</p></div><div class="section"><div class="section-title">РЕКОМЕНДАЦИИ:</div><p>${recommendations}</p></div><div class="conclusion">${conclusionLabels[conclusionType]} ЗАКЛЮЧЕНИЕ</div><div class="section"><p>${conclusionText}</p></div><div class="signature"><div class="sign-line"><span>Председатель ревизионной комиссии</span><span>_________________ / ${chairmanName}</span></div><div class="sign-line"><span>Члены комиссии</span><span>_________________ / _____________________</span></div></div><p style="margin-top:40px;font-size:12px;color:#666">Дата: «___» __________ ${currentYear + 1} г.</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
}

// 6.7 Карточка паевого взноса
function showSharePaymentCard(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) { alert('Пайщик не найден'); return; }
    const memberPayments = payments.filter(p => p.memberId === memberId);
    const totalPaid = memberPayments.filter(p => p.paid && p.type !== 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalReturned = memberPayments.filter(p => p.type === 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalPaid - totalReturned;
    const paymentsByType = {};
    memberPayments.forEach(p => { if (!paymentsByType[p.type]) paymentsByType[p.type] = { paid: 0, unpaid: 0, count: 0 }; paymentsByType[p.type].count++; if (p.paid) paymentsByType[p.type].paid += (p.amount || 0); else paymentsByType[p.type].unpaid += (p.amount || 0); });
    const paymentRows = memberPayments.map(p => `<tr><td>${p.date}</td><td>${getPaymentTypeText(p.type)}</td><td>${p.documentNumber || '—'}</td><td class="amount ${p.type === 'return_share' ? 'outgoing' : 'incoming'}">${p.amount.toLocaleString()} ₽</td><td>${p.paid ? '✓' : '—'}</td></tr>`).join('') || '<tr><td colspan="5" style="text-align: center;">Взносов не найдено</td></tr>';
    const content = `<div class="share-card"><div class="card-header"><h2>💳 КАРТОЧКА ПАЕВОГО ВЗНОСА</h2><p><strong>Пайщик:</strong> ${member.name}</p><p><strong>ID:</strong> ${member.id}</p><p><strong>Дата вступления:</strong> ${member.joinDate}</p></div><div class="card-summary"><div class="summary-item"><span class="summary-label">Всего внесено</span><span class="summary-value incoming">${totalPaid.toLocaleString()} ₽</span></div><div class="summary-item"><span class="summary-label">Всего возвращено</span><span class="summary-value outgoing">${totalReturned.toLocaleString()} ₽</span></div><div class="summary-item"><span class="summary-label">Баланс</span><span class="summary-value">${balance.toLocaleString()} ₽</span></div></div><h3>Структура взносов</h3><table class="structure-table"><thead><tr><th>Тип взноса</th><th>Количество</th><th>Оплачено</th><th>Не оплачено</th></tr></thead><tbody>${Object.entries(paymentsByType).map(([type, data]) => `<tr><td>${getPaymentTypeText(type)}</td><td>${data.count}</td><td class="amount incoming">${data.paid.toLocaleString()} ₽</td><td class="amount outgoing">${data.unpaid.toLocaleString()} ₽</td></tr>`).join('')}</tbody></table><h3>История операций</h3><table class="history-table"><thead><tr><th>Дата</th><th>Тип</th><th>Документ</th><th>Сумма</th><th>Оплачено</th></tr></thead><tbody>${paymentRows}</tbody></table><div class="card-actions"><button class="action-button" onclick="printSharePaymentCard('${memberId}')">🖨️ Печать</button><button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button></div></div><style>.share-card{padding:20px}.card-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;border-radius:8px;margin-bottom:20px}.card-header h2{margin:0 0 15px 0;font-size:20px}.card-header p{margin:5px 0;opacity:0.9}.card-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px}.summary-item{background:#f5f5f5;padding:15px;border-radius:8px;text-align:center}.summary-label{display:block;font-size:12px;color:#666;margin-bottom:10px}.summary-value{display:block;font-size:20px;font-weight:bold}.summary-value.incoming{color:#2e7d32}.summary-value.outgoing{color:#c62828}.structure-table,.history-table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px}.structure-table th,.structure-table td,.history-table th,.history-table td{border:1px solid #e0e0e0;padding:10px;text-align:left}.structure-table th,.history-table th{background:#f5f5f5;font-weight:600}.amount{text-align:right;font-family:'Courier New',monospace}.incoming{color:#2e7d32}.outgoing{color:#c62828}.card-actions{display:flex;gap:10px;margin-top:20px}</style>`;
    showInSideMenu(`Карточка взноса: ${member.name}`, content);
}

function printSharePaymentCard(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const memberPayments = payments.filter(p => p.memberId === memberId);
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const totalPaid = memberPayments.filter(p => p.paid && p.type !== 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalReturned = memberPayments.filter(p => p.type === 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalPaid - totalReturned;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Карточка паевого взноса: ${member.name}</title><style>body{font-family:"Times New Roman",serif;padding:20px;font-size:12px}h1{text-align:center;font-size:16px}.header{margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #000;padding:6px}th{background-color:#f0f0f0}.amount{text-align:right}.total{font-weight:bold}</style></head><body><div class="header"><h1>КАРТОЧКА ПАЕВОГО ВЗНОСА</h1><p><strong>Организация:</strong> ${shortName}</p><p><strong>Пайщик:</strong> ${member.name}</p><p><strong>Дата вступления:</strong> ${member.joinDate}</p></div><table><tr><th>Показатель</th><th>Сумма</th></tr><tr><td>Всего внесено</td><td class="amount">${totalPaid.toLocaleString()} ₽</td></tr><tr><td>Всего возвращено</td><td class="amount">${totalReturned.toLocaleString()} ₽</td></tr><tr class="total"><td>Баланс</td><td class="amount">${balance.toLocaleString()} ₽</td></tr></table><h3>История взносов</h3><table><tr><th>Дата</th><th>Тип</th><th>Документ</th><th>Сумма</th><th>Оплачено</th></tr>${memberPayments.map(p => `<tr><td>${p.date}</td><td>${getPaymentTypeText(p.type)}</td><td>${p.documentNumber || '—'}</td><td class="amount">${p.amount.toLocaleString()} ₽</td><td>${p.paid ? '✓' : '—'}</td></tr>`).join('')}</table><div style="margin-top:40px"><p>Главный бухгалтер _________________ / _____________________</p><p>Дата: «___» __________ ${new Date().getFullYear()} г.</p></div></body></html>`);
    printWindow.document.close();
    printWindow.print();
}

// 6.8 Аналитические отчёты
function showAnalyticsReports() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const membershipByMonth = [];
    for (let month = 0; month < 12; month++) { const monthEnd = new Date(currentYear, month + 1, 0); const activeCount = members.filter(m => { const joinDate = new Date(m.joinDate); return m.status === 'active' && joinDate <= monthEnd; }).length; membershipByMonth.push({ month: month + 1, count: activeCount }); }
    const debtPayments = payments.filter(p => !p.paid && p.type !== 'return_share');
    const totalDebt = debtPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const debtByType = {};
    debtPayments.forEach(p => { if (!debtByType[p.type]) debtByType[p.type] = 0; debtByType[p.type] += (p.amount || 0); });
    const incomeByMonth = [];
    for (let month = 0; month < 12; month++) { const monthStart = new Date(currentYear, month, 1); const monthEnd = new Date(currentYear, month + 1, 0); const monthIncome = payments.filter(p => { const date = new Date(p.date); return p.paid && p.type !== 'return_share' && date >= monthStart && date <= monthEnd; }).reduce((sum, p) => sum + (p.amount || 0), 0); incomeByMonth.push({ month: month + 1, income: monthIncome }); }
    const totalIncome = incomeByMonth.reduce((sum, m) => sum + m.income, 0);
    const debtRows = Object.entries(debtByType).map(([type, amount]) => `<tr><td>${getPaymentTypeText(type)}</td><td class="amount outgoing">${amount.toLocaleString()} ₽</td></tr>`).join('') || '<tr><td colspan="2" style="text-align: center;">Задолженностей нет</td></tr>';
    const content = `<div class="analytics-container"><h2>📈 АНАЛИТИЧЕСКИЕ ОТЧЁТЫ</h2><p><strong>Организация:</strong> ${shortName}</p><p><strong>Отчётный период:</strong> ${currentYear} год</p><div class="analytics-grid"><div class="analytics-card"><h3>👥 Динамика численности</h3><div class="chart-placeholder"><div class="bar-chart">${membershipByMonth.map(m => `<div class="bar-container"><div class="bar" style="height: ${Math.max(5, (m.count / Math.max(...membershipByMonth.map(x => x.count))) * 100)}%"></div><span class="bar-label">${m.month}</span></div>`).join('')}</div></div><p style="text-align: center; margin-top: 10px;"><strong>На начало года:</strong> ${membershipByMonth[0].count} | <strong>На конец года:</strong> ${membershipByMonth[11].count}</p></div><div class="analytics-card"><h3>💰 Поступления по месяцам</h3><div class="chart-placeholder"><div class="bar-chart">${incomeByMonth.map(m => `<div class="bar-container"><div class="bar income" style="height: ${Math.max(5, (m.income / Math.max(...incomeByMonth.map(x => x.income))) * 100)}%"></div><span class="bar-label">${m.month}</span></div>`).join('')}</div></div><p style="text-align: center; margin-top: 10px;"><strong>Всего за год:</strong> ${totalIncome.toLocaleString()} ₽</p></div><div class="analytics-card"><h3>⚠️ Анализ задолженностей</h3><div class="debt-summary"><div class="debt-total"><span class="debt-label">Общая задолженность:</span><span class="debt-value outgoing">${totalDebt.toLocaleString()} ₽</span></div><div class="debt-count"><span class="debt-label">Количество должников:</span><span class="debt-value">${debtPayments.length}</span></div></div><table class="debt-table"><thead><tr><th>Тип взноса</th><th>Сумма</th></tr></thead><tbody>${debtRows}</tbody></table></div></div><div class="analytics-actions"><button class="action-button" onclick="printAnalyticsReports()">🖨️ Печать аналитики</button><button class="action-button cancel" onclick="closeSideMenu()">Закрыть</button></div></div><style>.analytics-container{padding:20px}.analytics-container h2{text-align:center;color:#2c3e50;margin-bottom:10px}.analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin:20px 0}.analytics-card{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.analytics-card h3{margin-top:0;margin-bottom:15px;color:#2c3e50;font-size:16px}.chart-placeholder{height:200px;display:flex;align-items:flex-end;justify-content:center}.bar-chart{display:flex;gap:5px;height:100%;align-items:flex-end}.bar-container{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}.bar{width:20px;background:linear-gradient(to top,#667eea,#764ba2);border-radius:3px 3px 0 0;min-height:5%;transition:height 0.3s}.bar.income{background:linear-gradient(to top,#43e97b,#38f9d7)}.bar-label{font-size:10px;color:#666;margin-top:5px}.debt-summary{background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:15px}.debt-total,.debt-count{display:flex;justify-content:space-between;margin:10px 0}.debt-label{color:#666}.debt-value{font-weight:bold;font-size:16px}.debt-value.outgoing{color:#c62828}.debt-table{width:100%;border-collapse:collapse;font-size:13px}.debt-table th,.debt-table td{border:1px solid #e0e0e0;padding:8px;text-align:left}.debt-table th{background:#f5f5f5}.debt-table .amount{text-align:right}.analytics-actions{display:flex;gap:10px;margin-top:20px}</style>`;
    showInSideMenu('Аналитические отчёты', content);
}

function printAnalyticsReports() {
    const currentYear = new Date().getFullYear();
    const shortName = cooperativeSettings.shortName || 'Потребительский кооператив';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Аналитические отчёты за ${currentYear} год</title><style>body{font-family:"Times New Roman",serif;padding:20px;font-size:12px}h1{text-align:center;font-size:16px}.header{margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px}.section{margin:20px 0}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #000;padding:6px}th{background-color:#f0f0f0}</style></head><body><div class="header"><h1>АНАЛИТИЧЕСКИЕ ОТЧЁТЫ</h1><p><strong>Организация:</strong> ${shortName}</p><p><strong>Отчётный период:</strong> ${currentYear} год</p></div><div class="section"><h2>1. Динамика численности пайщиков</h2><p>На начало года: ${members.filter(m => m.status === 'active').length} человек</p><p>Принято: ${members.filter(m => m.status === 'active' && new Date(m.joinDate).getFullYear() === currentYear).length} человек</p><p>Выбыло: ${members.filter(m => m.status === 'withdrawn' || m.status === 'excluded').length} человек</p></div><div class="section"><h2>2. Анализ задолженностей</h2><p>Общая задолженность: 0 ₽</p><p>Количество должников: 0</p></div><div style="margin-top:40px"><p>Председатель _________________ / _____________________</p><p>Главный бухгалтер _________________ / _____________________</p><p>Дата: «___» __________ ${currentYear + 1} г.</p></div></body></html>`);
    printWindow.document.close();
    printWindow.print();
}

// Глобальная функция для переключения формы платежа
function togglePaymentForm() {
    const methodSelect = document.getElementById('payment-method');
    const amountField = document.getElementById('amount-field');
    const propertyDetails = document.getElementById('property-details');

    if (methodSelect && amountField && propertyDetails) {
        if (methodSelect.value === 'property') {
            amountField.style.display = 'none';
            propertyDetails.style.display = 'block';
        } else {
            amountField.style.display = 'block';
            propertyDetails.style.display = 'none';
        }
    }
}

// Функция для добавления юридического лица
function addLegalEntity() {
    const content = `
        <h3>Добавить юридическое лицо</h3>
        <form id="legal-entity-form">
            <h4>Данные юридического лица</h4>
            <div class="form-group">
                <label for="entity-name">Наименование организации *</label>
                <input type="text" id="entity-name" required>
            </div>
            <div class="form-group">
                <label for="entity-address">Место нахождения (юридический адрес) *</label>
                <input type="text" id="entity-address" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="entity-ogrn">ОГРН *</label>
                    <input type="text" id="entity-ogrn" placeholder="XXXXXXXXXXXXXXX" required>
                </div>
                <div class="form-group">
                    <label for="entity-inn">ИНН *</label>
                    <input type="text" id="entity-inn" placeholder="XXXXXXXXXX" required>
                </div>
            </div>
            <div class="form-group">
                <label for="entity-kpp">КПП</label>
                <input type="text" id="entity-kpp" placeholder="XXXXXXXXX">
            </div>
            <h4>Банковские реквизиты *</h4>
            <div class="form-group">
                <label for="entity-bank-name">Наименование банка *</label>
                <input type="text" id="entity-bank-name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="entity-bik">БИК банка *</label>
                    <input type="text" id="entity-bik" placeholder="XXXXXXX" required>
                </div>
                <div class="form-group">
                    <label for="entity-correspondent-account">Корреспондентский счёт *</label>
                    <input type="text" id="entity-correspondent-account" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="entity-settlement-account">Расчётный счёт *</label>
                    <input type="text" id="entity-settlement-account" required>
                </div>
                <div class="form-group">
                    <label for="entity-payment-purpose">Назначение платежа *</label>
                    <input type="text" id="entity-payment-purpose" required>
                </div>
            </div>
            <h4>Данные представителя юридического лица</h4>
            <div class="form-group">
                <label for="representative-name">ФИО *</label>
                <input type="text" id="representative-name" required>
            </div>
            <div class="form-group">
                <label for="representative-position">Должность *</label>
                <input type="text" id="representative-position" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="representative-phone">Контактный телефон *</label>
                    <input type="tel" id="representative-phone" placeholder="+7 (XXX) XXX-XX-XX" required>
                </div>
                <div class="form-group">
                    <label for="representative-email">Email *</label>
                    <input type="email" id="representative-email" required>
                </div>
            </div>
            <div class="form-group">
                <label for="representative-id-doc">Документ, удостоверяющий личность *</label>
                <input type="text" id="representative-id-doc" required>
            </div>
            <h4>Доверенность</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="power-of-attorney-number">Номер доверенности *</label>
                    <input type="text" id="power-of-attorney-number" required>
                </div>
                <div class="form-group">
                    <label for="power-of-attorney-date">Дата выдачи *</label>
                    <input type="date" id="power-of-attorney-date" required>
                </div>
            </div>
            <div class="form-group">
                <label for="power-of-attorney-issued-by">Кем выдана *</label>
                <input type="text" id="power-of-attorney-issued-by" required>
            </div>
            <div class="form-group">
                <label for="entity-cooperative-plot">Кооперативный участок *</label>
                <input type="text" id="entity-cooperative-plot" required>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveLegalEntity()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </form>
    `;
    
    showSideMenu('Добавить юр.лицо', content);
}

// Функция для сохранения юридического лица
function saveLegalEntity() {
    // Получаем значения из формы юрлица
    const entityName = document.getElementById('entity-name').value;
    const entityAddress = document.getElementById('entity-address').value;
    const entityOGRN = document.getElementById('entity-ogrn').value;
    const entityINN = document.getElementById('entity-inn').value;
    const entityKPP = document.getElementById('entity-kpp').value;
    const bankName = document.getElementById('entity-bank-name').value;
    const bankBIK = document.getElementById('entity-bik').value;
    const correspondentAccount = document.getElementById('entity-correspondent-account').value;
    const settlementAccount = document.getElementById('entity-settlement-account').value;
    const paymentPurpose = document.getElementById('entity-payment-purpose').value;
    const representativeName = document.getElementById('representative-name').value;
    const representativePosition = document.getElementById('representative-position').value;
    const representativePhone = document.getElementById('representative-phone').value;
    const representativeEmail = document.getElementById('representative-email').value;
    const representativeIdDoc = document.getElementById('representative-id-doc').value;
    const powerOfAttorneyNumber = document.getElementById('power-of-attorney-number').value;
    const powerOfAttorneyDate = document.getElementById('power-of-attorney-date').value;
    const powerOfAttorneyIssuedBy = document.getElementById('power-of-attorney-issued-by').value;
    const cooperativePlot = document.getElementById('entity-cooperative-plot').value;
    // Удаляем поля, относящиеся к паевому взносу, так как они больше не используются
    const applicationDate = new Date().toISOString().split('T')[0]; // Устанавливаем текущую дату по умолчанию
    const status = 'candidate'; // Устанавливаем статус "Кандидат" по умолчанию

    // Проверяем обязательные поля (без полей паевого взноса)
    if (!entityName || !entityAddress || !entityOGRN || !entityINN || !bankName ||
        !bankBIK || !correspondentAccount || !settlementAccount || !paymentPurpose ||
        !representativeName || !representativePosition ||
        !representativePhone || !representativeEmail || !representativeIdDoc ||
        !powerOfAttorneyNumber || !powerOfAttorneyDate || !powerOfAttorneyIssuedBy || !cooperativePlot) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Формируем ID на основе ИНН
    const entityId = `ENT-${entityINN}`;

    const newEntity = {
        id: entityId,
        type: 'legal_entity', // Тип участника - юридическое лицо
        entityName: entityName,
        entityAddress: entityAddress,
        ogrn: entityOGRN,
        inn: entityINN,
        kpp: entityKPP,
        cooperativePlot: cooperativePlot,
        bankDetails: {
            bankName: bankName,
            bik: bankBIK,
            correspondentAccount: correspondentAccount,
            settlementAccount: settlementAccount,
            paymentPurpose: paymentPurpose
        },
        representative: {
            fullName: representativeName,
            position: representativePosition,
            phone: representativePhone,
            email: representativeEmail,
            idDocument: representativeIdDoc
        },
        powerOfAttorney: {
            number: powerOfAttorneyNumber,
            date: powerOfAttorneyDate,
            issuedBy: powerOfAttorneyIssuedBy
        },
        applicationDate: applicationDate, // Дата подачи заявления
        status: status, // Статус участника
        createdAt: new Date().toISOString()
    };

    // Добавляем юрлицо в общий массив участников
    members.push(newEntity);
    closeSideMenu();
    loadMembersData();
    updateDashboardStats();
    scheduleAutoSave(); // Вызываем автоматическое сохранение
}




// Функция для обновления индикатора состояния подключения папки
function updateFolderStatusIndicator() {
    const indicator = document.getElementById('folder-status-indicator');
    if (!indicator) return;

    // Удаляем старые классы состояния
    indicator.classList.remove('connected', 'disconnected');

    // Проверяем, настроена ли папка
    if (localStorage.getItem('coopDirectoryConfigured') && coopDirectoryHandle) {
        // Папка подключена
        indicator.classList.add('connected');
        indicator.title = 'Папка C:\\КООПЕРАНТ подключена';
    } else {
        // Папка не подключена
        indicator.classList.add('disconnected');
        indicator.title = 'Папка C:\\КООПЕРАНТ не подключена';
    }
}

// Функция для инициализации индикатора состояния
function initFolderStatusIndicator() {
    const indicator = document.getElementById('folder-status-indicator');
    if (!indicator) {
        // Тихая проверка - индикатор может отсутствовать на некоторых страницах
        return;
    }

    // Добавляем обработчик клика для быстрой настройки
    indicator.addEventListener('click', function() {
        if (localStorage.getItem('coopDirectoryConfigured') && coopDirectoryHandle) {
            alert('Папка C:\\КООПЕРАНТ уже подключена');
        } else {
            // Показываем модальное окно настройки
            showSetupModal();
        }
    });

    // Инициализируем состояние индикатора
    updateFolderStatusIndicator();
}

// Вызываем инициализацию индикатора после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем индикатор состояния папки
    setTimeout(initFolderStatusIndicator, 100); // Небольшая задержка для гарантии загрузки всех элементов
});

// Функции для работы с пайщиками
function loadMembersData() {
    const tbody = document.getElementById('members-tbody');
    tbody.innerHTML = '';
    
    members.forEach(member => {
        const row = document.createElement('tr');
        
        // Определяем доступные действия в зависимости от статуса
        let actionButtons = `
            <button class="action-button edit" onclick="editMember('${member.id}')" title="Изменить">&#9998;</button>
        `;

        if (member.status === 'active') {
            actionButtons += `
                <button class="action-button delete" onclick="withdrawMember('${member.id}')" title="Выбытие">&#128711;</button>
            `;
        } else {
            actionButtons += `
                <button class="action-button" onclick="restoreMember('${member.id}')" title="Восстановить членство">&#8633;</button>
            `;
        }
        
        // Добавляем кнопку удаления только дл�� кандидатов или с согласия администратора
        if (member.status === 'candidate') {
            actionButtons += `
                <button class="action-button delete" onclick="deleteMember('${member.id}')" title="Удалить">&#128465;</button>
            `;
        }

        // Определяем тип участника и отображаем соответствующую информацию
        let memberName = member.name || member.entityName || 'Не указано';
        let joinDate = member.joinDate || member.applicationDate || 'Не указана';
        let contactInfo = '';
        let cooperativePlot = member.cooperativePlot || '';

        if (member.type === 'legal_entity') {
            // Для юридических лиц показываем наименование организации
            memberName = member.entityName;
            joinDate = member.applicationDate;
            contactInfo = member.representative?.phone || member.representative?.email || '';
        } else {
            // Для физических лиц - как раньше
            contactInfo = member.phone || member.email || member.contact || '';
        }

        // Добавляем кнопку "Посмотреть" в виде глаза
        const viewButton = `<button class="action-button" onclick="viewMember('${member.id}')" title="Посмотреть информацию о пайщике">👁️</button>`;
        const cardButton = `<button class="action-button" onclick="showMemberCard('${member.id}')" title="Карточка пайщика" style="margin-left: 5px;">📇</button>`;

        row.innerHTML = `
            <td>${member.id}</td>
            <td>${memberName}</td>
            <td>${joinDate}</td>
            <td>${getStatusText(member.status)}</td>
            <td>${cooperativePlot}</td>
            <td>${contactInfo}</td>
            <td>
                ${viewButton}
                ${cardButton}
                ${actionButtons}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Функция для восстановления членства пайщика
function restoreMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    if (confirm(`Вы уверены, что хотите восстановить членство пайщика ${member.name}?`)) {
        member.status = 'active';
        member.updatedAt = new Date().toISOString();
        
        loadMembersData();
        saveData();
    }
}

function getStatusText(status) {
    const statusMap = {
        'candidate': 'Кандидат',
        'active': 'Активный',
        'suspended': 'Приостановлен',
        'excluded': 'Исключен',
        'withdrawn': 'Выбыл'
    };
    return statusMap[status] || status;
}

function addMember() {
    const currentDate = new Date().toISOString().split("T")[0];
    const content = `
        <h3>Добавить нового пайщика</h3>
        <form id="member-form">
            <div class="form-group">
                <label for="member-name">ФИО *</label>
                <input type="text" id="member-name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="member-birth-date">Дата рождения *</label>
                    <input type="date" id="member-birth-date" value="${currentDate}" required>
                </div>
                <div class="form-group">
                    <label for="member-join-date">Дата вступления *</label>
                    <input type="date" id="member-join-date" value="${currentDate}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="member-residence-address">Адрес проживания *</label>
                <input type="text" id="member-residence-address" required>
            </div>
            <div class="form-group">
                <label for="member-phone">Контактный телефон *</label>
                <input type="tel" id="member-phone" placeholder="+7 (XXX) XXX-XX-XX" required>
            </div>
            <div class="form-group">
                <label for="member-status">Статус *</label>
                <select id="member-status" required>
                    <option value="">Выберите статус</option>
                    <option value="candidate">Кандидат</option>
                    <option value="active" selected>Активный</option>
                    <option value="suspended">Приостановлен</option>
                    <option value="excluded">Исключен</option>
                    <option value="withdrawn">Вышел</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="member-no-income"> 
                    Не имеет самостоятельного заработка, получает пособия/пенсию
                </label>
            </div>
            <div class="form-group">
                <label for="member-cooperative-plot">Кооперативный участок *</label>
                <input type="text" id="member-cooperative-plot" required>
            </div>
            <div class="form-group">
                <label for="member-notes">Примечания</label>
                <textarea id="member-notes" rows="3"></textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveMemberDirect()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                <button type="button" class="action-button add-payment" onclick="saveMemberAndAddPayment()">Добавить взнос</button>
            </div>
        </form>
    `;
    
    showSideMenu('Добавить пайщика', content);
}

function saveMember() {
    // Получаем значения из новых полей
    const name = document.getElementById('member-name').value;
    const birthDate = document.getElementById('member-birth-date').value;
    const residenceAddress = document.getElementById('member-residence-address').value;
    const phone = document.getElementById('member-phone').value;
    const joinDate = document.getElementById('member-join-date').value || new Date().toISOString().split('T')[0];
    const status = document.getElementById('member-status').value;
    const noIncome = document.getElementById('member-no-income').checked;
    const cooperativePlot = document.getElementById('member-cooperative-plot').value;
    const notes = document.getElementById('member-notes').value;

    // Проверяем обязательные поля
    if (!name || !birthDate || !residenceAddress || !phone || !status || !cooperativePlot) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Формируем ID на основе номера телефона (удаляем все символы кроме цифр)
    const phoneDigits = phone.replace(/\D/g, '');
    const memberId = phoneDigits.length >= 11 ? phoneDigits : `7${phoneDigits.padEnd(10, '0').substring(0, 10)}`;

    const newMember = {
        id: memberId,
        name: name,
        birthDate: birthDate,
        residenceAddress: residenceAddress,
        phone: phone,
        joinDate: joinDate,
        status: status,
        cooperativePlot: cooperativePlot,
        noIncome: noIncome, // Признак получения пособий/пенсии
        notes: notes,
        createdAt: new Date().toISOString()
    };

    members.push(newMember);
    loadMembersData();
    updateDashboardStats();
    scheduleAutoSave(); // Вызываем автоматическое сохранение
    
    return newMember; // Возвращаем созданног�� пайщика для дальнейшего использования
}

// Функция для прямого сохранения пайщика
function saveMemberDirect() {
    const newMember = saveMember();
    if (newMember) {
        // Автоматически создаем удостоверение для физического лица
        generateCertificateForMember(newMember.id);
        closeSideMenu();
    }
}

// Функция для сохранения пайщика и открытия формы добавления взноса
function saveMemberAndAddPayment() {
    const newMember = saveMember();
    if (newMember) {
        // Автоматически создаем удостоверение для физического лица
        generateCertificateForMember(newMember.id);
        
        // Закрываем текущее боковое меню
        closeSideMenu();
        
        // Открываем форму добавления взноса для только что созданного пайщика
        setTimeout(() => {
            // Устанавливаем выбранного пайщика в форме добавления взноса
            addPaymentForSpecificMember(newMember.id);
        }, 300); // Небольшая задержка для завершения закрытия меню
    }
}

// Функция для добавления взноса для конкретного пайщика
function addPaymentForSpecificMember(memberId) {
    // Генерируем автоматический номер документа
    const nextPaymentNumber = payments.length + 1;
    const paymentDocumentNumber = `DOC-${new Date().getFullYear()}-${nextPaymentNumber.toString().padStart(4, '0')}`;
    const currentDate = new Date().toISOString().split("T")[0];

    const content = `
        <h3>Добавить паевой взнос</h3>
        <form id="payment-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-member">Пайщик *</label>
                    <select id="payment-member" required>
                        <option value="">Выберите пайщика</option>
                        ${members.map(member => 
                            `<option value="${member.id}" ${member.id === memberId ? 'selected' : ''}>${member.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="payment-type">Тип взноса *</label>
                    <select id="payment-type" required onchange="togglePaymentForm()">
                        <option value="entrance">Вступительный взнос</option>
                        <option value="share" selected>Паевой взнос</option>
                        <option value="voluntary_share">Добровольный паевой взнос</option>
                        <option value="membership">Членский взнос</option>
                        <option value="targeted">Целевой взнос</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-method">Форма оплаты *</label>
                    <select id="payment-method" required onchange="togglePaymentDetails()">
                        <option value="cash">Наличные</option>
                        <option value="non_cash">Безналичные</option>
                        <option value="property">Имущество</option>
                    </select>
                </div>
                <div class="form-group" id="amount-field" style="display:block;">
                    <label for="payment-amount">Сумма *</label>
                    <input type="number" id="payment-amount" required>
                </div>
            </div>
            <div class="form-group" id="property-details" style="display:none;">
                <label for="payment-property-desc">Описание имущества *</label>
                <textarea id="payment-property-desc" rows="2" placeholder="Опишите имущество, передаваемое в качестве паевого взноса"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-date">Дата *</label>
                    <input type="date" id="payment-date" value="${currentDate}" required>
                </div>
                <div class="form-group">
                    <label for="payment-document">Номер документа *</label>
                    <input type="text" id="payment-document" value="${paymentDocumentNumber}" readonly required>
                </div>
            </div>
            <div class="form-group">
                <label for="payment-description">Описание</label>
                <textarea id="payment-description" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="payment-paid" checked> Оплачено
                </label>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="savePayment()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </form>
        <script>
            // Внутренняя версия функции для использования в шаблоне
            function togglePaymentForm() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field');
                const propertyDetails = document.getElementById('property-details');

                if (methodSelect && amountField && propertyDetails) {
                    if (methodSelect.value === 'property') {
                        amountField.style.display = 'none';
                        propertyDetails.style.display = 'block';
                    } else {
                        amountField.style.display = 'block';
                        propertyDetails.style.display = 'none';
                    }
                }
            }
            
            function togglePaymentDetails() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field');
                const propertyDetails = document.getElementById('property-details');

                if (methodSelect && amountField && propertyDetails) {
                    if (methodSelect.value === 'property') {
                        amountField.style.display = 'none';
                        propertyDetails.style.display = 'block';
                    } else {
                        amountField.style.display = 'block';
                        propertyDetails.style.display = 'none';
                    }
                }
            }
        </script>
    `;
    
    showSideMenu('Добавить паевой взнос', content);

    // Инициализируем состояние полей
    setTimeout(() => {
        togglePaymentForm();
    }, 100);
}

// Функция просмотра пайщика в боковом меню
function viewMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;
    
    const content = `
        <div class="member-details">
            <h3>Информация о пайщике</h3>
            <div class="detail-item">
                <label>ID:</label>
                <span>${member.id}</span>
            </div>
            <div class="detail-item">
                <label>ФИО:</label>
                <span>${member.name}</span>
            </div>
            <div class="detail-item">
                <label>Дата вступления:</label>
                <span>${member.joinDate}</span>
            </div>
            <div class="detail-item">
                <label>Статус:</label>
                <span>${getStatusText(member.status)}</span>
            </div>
            <div class="detail-item">
                <label>Контакт:</label>
                <span>${member.contact || 'Не указан'}</span>
            </div>
            <div class="detail-item">
                <label>Адрес:</label>
                <span>${member.address || 'Не указан'}</span>
            </div>
            ${member.cooperativePlot ? `
            <div class="detail-item">
                <label>Кооперативный участок:</label>
                <span>${member.cooperativePlot}</span>
            </div>
            ` : ''}
            <div class="detail-item">
                <label>Примечания:</label>
                <span>${member.notes || 'Нет'}</span>
            </div>
            
            <div style="margin-top: 1.5rem;">
                <h4>Паевые взносы пайщика</h4>
                <div class="member-payments">
                    ${getMemberPaymentsSummary(member.id)}
                </div>
            </div>

            <div style="margin-top: 1.5rem;">
                <h4>Удостоверение пайщика</h4>
                ${renderCertificateInfo(member.id)}
            </div>

            <div style="margin-top: 1.5rem; text-align: center;">
                <button class="action-button edit" onclick="editMember('${member.id}')">Редактировать</button>
                ${!hasCertificate(member.id) ? `<button class="action-button" onclick="generateCertificateForMember('${member.id}')">Сформировать удостоверение</button>` : ''}
                <button class="action-button" onclick="downloadCertificate('${member.id}')">Скачать удостоверение</button>
                <button class="action-button" onclick="exportMemberCertificateAsPDF('${member.id}')">Сохранить как PDF</button>
                <button class="action-button delete" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showSideMenu(`Пайщик: ${member.name}`, content);
}

// Функция получения сводки по паевым взносам пайщика
// Функция проверки наличия удостоверения у пайщика
function hasCertificate(memberId) {
    return certificates.some(cert => cert.memberId === memberId);
}

// Функция отображения информации об удостоверении
function renderCertificateInfo(memberId) {
    const certificate = certificates.find(cert => cert.memberId === memberId);
    
    if (certificate) {
        return `
            <div class="certificate-info">
                <p><strong>Номер удостоверения:</strong> ${certificate.certificateNumber}</p>
                <p><strong>Дата выдачи:</strong> ${certificate.issueDate}</p>
                <p><strong>Статус:</strong> ${certificate.status === 'active' ? 'Ак��ивно' : 'Неактивно'}</p>
            </div>
        `;
    } else {
        return '<p>Удостоверение не сформировано</p>';
    }
}

// Функция для скачивания удостоверения
function downloadCertificate(memberId) {
    const certificate = certificates.find(cert => cert.memberId === memberId);
    
    if (!certificate) {
        if (confirm('Удостоверение для этого пайщика не сформировано. Создать удостоверение?')) {
            generateCertificateForMember(memberId);
        }
        return;
    }
    
    // В реальной системе здесь будет генерация и скачивание PDF
    // Для демонстрации покажем сообщение
    alert('В реальной системе удостоверение было бы скачано в формате PDF. Для этого потребуется библиотека jsPDF или аналогичная.');
}

function getMemberPaymentsSummary(memberId) {
    const memberPayments = payments.filter(p => p.memberId === memberId);
    if (memberPayments.length === 0) {
        return '<p>Нет паевых взносов</p>';
    }

    let summaryHtml = '<table style="width: 100%; border-collapse: collapse;">';
    summaryHtml += '<thead><tr><th>Тип</th><th>Сумма</th><th>Дата</th><th>Статус</th></tr></thead>';
    summaryHtml += '<tbody>';

    memberPayments.forEach(payment => {
        summaryHtml += `
            <tr>
                <td>${getPaymentTypeText(payment.type)}</td>
                <td>${(payment.amount || 0).toLocaleString()} ₽</td>
                <td>${payment.date}</td>
                <td>${payment.paid ? 'Оплачено' : 'Не оплачено'}</td>
            </tr>
        `;
    });

    summaryHtml += '</tbody></table>';
    return summaryHtml;
}

// Функция для отображения полной карточки пайщика
function showMemberCard(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // Все операции пайщика
    const memberPayments = payments.filter(p => p.memberId === memberId);
    const totalPaid = memberPayments.filter(p => p.paid && p.type !== 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalReturned = memberPayments.filter(p => p.type === 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalPaid - totalReturned;
    
    // Рассчитываем стоимость пая на текущий момент
    const shareValueResult = calculateShareValue();
    
    let paymentsHtml = '';
    memberPayments.forEach(p => {
        paymentsHtml += `
            <tr>
                <td>${p.date}</td>
                <td>${getPaymentTypeText(p.type)}</td>
                <td>${p.documentNumber || '—'}</td>
                <td class="amount ${p.type === 'return_share' ? 'outgoing' : 'incoming'}">${p.amount.toLocaleString()} ₽</td>
                <td>${p.paid ? '✓' : '—'}</td>
            </tr>
        `;
    });
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>КАРТОЧКА ПАЙЩИКА</h2>
                <p>Потребительский кооператив</p>
            </div>
            
            <div class="member-card-header" style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div class="form-row">
                    <div class="form-group">
                        <label>ФИО:</label>
                        <div style="font-size: 18px; font-weight: bold;">${member.name}</div>
                    </div>
                    <div class="form-group">
                        <label>ID пайщика:</label>
                        <div style="font-size: 18px;">${member.id}</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Дата вступления:</label>
                        <div>${member.joinDate}</div>
                    </div>
                    <div class="form-group">
                        <label>Статус:</label>
                        <div>${getStatusText(member.status)}</div>
                    </div>
                    <div class="form-group">
                        <label>Участок:</label>
                        <div>${member.cooperativePlot || '—'}</div>
                    </div>
                </div>
            </div>
            
            <div class="settings-info">
                <h4>💰 Финансовая сводка</h4>
                <table class="balance-table" style="margin-top: 10px;">
                    <tr><th>Показатель</th><th>Сумма</th></tr>
                    <tr><td>Всего в��есено</td><td class="amount incoming">${totalPaid.toLocaleString()} ₽</td></tr>
                    <tr><td>Всего возвращено</td><td class="amount outgoing">${totalReturned.toLocaleString()} ₽</td></tr>
                    <tr class="total-row"><td>Баланс</td><td class="amount">${balance.toLocaleString()} ₽</td></tr>
                    <tr><td>Действительная стоимость пая</td><td class="amount">${shareValueResult.shareValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
                </table>
            </div>
            
            <h3 style="margin-top: 20px;">История операций</h3>
            <table class="settings-table" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Тип операции</th>
                        <th>Документ</th>
                        <th>Сумма</th>
                        <th>Оплачено</th>
                    </tr>
                </thead>
                <tbody>
                    ${memberPayments.length > 0 ? paymentsHtml : '<tr><td colspan="5" style="text-align: center;">Операций не найдено</td></tr>'}
                </tbody>
            </table>
            
            <div class="report-actions" style="margin-top: 20px;">
                <button class="action-button" onclick="printMemberCard('${memberId}')">Печать карточки</button>
                <button class="action-button" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Карточка пайщика', content);
}

// Функция печати карточки пайщика
function printMemberCard(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const memberPayments = payments.filter(p => p.memberId === memberId);
    const totalPaid = memberPayments.filter(p => p.paid && p.type !== 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalReturned = memberPayments.filter(p => p.type === 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalPaid - totalReturned;
    const shareValueResult = calculateShareValue();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Карточка пайщика: ${member.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                .header { background: #f0f0f0; padding: 15px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                .amount { text-align: right; }
                .total-row { font-weight: bold; background-color: #e0e0e0; }
                .incoming { color: green; }
                .outgoing { color: red; }
            </style>
        </head>
        <body>
            <h2>КАРТОЧКА ПАЙЩИКА</h2>
            <div class="header">
                <p><strong>ФИО:</strong> ${member.name}</p>
                <p><strong>ID:</strong> ${member.id}</p>
                <p><strong>Дата вступления:</strong> ${member.joinDate}</p>
                <p><strong>Статус:</strong> ${getStatusText(member.status)}</p>
            </div>
            <h3>Финансовая сводка</h3>
            <table>
                <tr><th>Показатель</th><th>Сумма</th></tr>
                <tr><td>Всего внесено</td><td class="amount incoming">${totalPaid.toLocaleString()} ₽</td></tr>
                <tr><td>Всего возвращено</td><td class="amount outgoing">${totalReturned.toLocaleString()} ₽</td></tr>
                <tr class="total-row"><td>Баланс</td><td class="amount">${balance.toLocaleString()} ₽</td></tr>
                <tr><td>Дейст��ительная стоимость пая</td><td class="amount">${shareValueResult.shareValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</td></tr>
            </table>
            <h3>История операций</h3>
            <table>
                <tr><th>Дата</th><th>Тип</th><th>Документ</th><th>Сумма</th><th>Оплачено</th></tr>
                ${memberPayments.map(p => `
                    <tr>
                        <td>${p.date}</td>
                        <td>${getPaymentTypeText(p.type)}</td>
                        <td>${p.documentNumber || '—'}</td>
                        <td class="amount">${p.amount.toLocaleString()} ₽</td>
                        <td>${p.paid ? '✓' : '—'}</td>
                    </tr>
                `).join('')}
            </table>
            <p style="margin-top: 30px;">_____________________ / _____________________</p>
            <p>Главный бухгалтер</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function editMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    // Определяем, является ли участник юридическим лицом
    if (member.type === 'legal_entity') {
        // Редактирование юридического лица
        const content = `
            <h3>Редактировать юридическое лицо</h3>
            <form id="legal-entity-form">
                <input type="hidden" id="entity-id" value="${member.id}">
                <h4>Дан��ые юридического лица</h4>
                <div class="form-group">
                    <label for="entity-name-edit">Наименование организации *</label>
                    <input type="text" id="entity-name-edit" value="${member.entityName}" required>
                </div>
                <div class="form-group">
                    <label for="entity-address-edit">Место нахождения (юридический адрес) *</label>
                    <input type="text" id="entity-address-edit" value="${member.entityAddress}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="entity-ogrn-edit">ОГРН *</label>
                        <input type="text" id="entity-ogrn-edit" value="${member.ogrn || ''}" placeholder="XXXXXXXXXXXXXXX" required>
                    </div>
                    <div class="form-group">
                        <label for="entity-inn-edit">ИНН *</label>
                        <input type="text" id="entity-inn-edit" value="${member.inn || ''}" placeholder="XXXXXXXXXX" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="entity-kpp-edit">КПП</label>
                    <input type="text" id="entity-kpp-edit" value="${member.kpp || ''}" placeholder="XXXXXXXXX">
                </div>
                <h4>Банковские реквизиты *</h4>
                <div class="form-group">
                    <label for="entity-bank-name-edit">Наименование банка *</label>
                    <input type="text" id="entity-bank-name-edit" value="${member.bankDetails?.bankName || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="entity-bik-edit">БИК банка *</label>
                        <input type="text" id="entity-bik-edit" value="${member.bankDetails?.bik || ''}" placeholder="XXXXXXX" required>
                    </div>
                    <div class="form-group">
                        <label for="entity-correspondent-account-edit">Корреспон������������������������������ент��������������кий счёт *</label>
                        <input type="text" id="entity-correspondent-account-edit" value="${member.bankDetails?.correspondentAccount || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="entity-settlement-account-edit">Расчётный счёт *</label>
                        <input type="text" id="entity-settlement-account-edit" value="${member.bankDetails?.settlementAccount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="entity-payment-purpose-edit">Назна����������������������������ение платежа *</label>
                        <input type="text" id="entity-payment-purpose-edit" value="${member.bankDetails?.paymentPurpose || ''}" required>
                    </div>
                </div>
                <h4>Данные представителя юридического лица</h4>
                <div class="form-group">
                    <label for="representative-name-edit">ФИО *</label>
                    <input type="text" id="representative-name-edit" value="${member.representative?.fullName || ''}" required>
                </div>
                <div class="form-group">
                    <label for="representative-position-edit">Должность *</label>
                    <input type="text" id="representative-position-edit" value="${member.representative?.position || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="representative-phone-edit">Контактн��й телефон *</label>
                        <input type="tel" id="representative-phone-edit" value="${member.representative?.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX" required>
                    </div>
                    <div class="form-group">
                        <label for="representative-email-edit">Email *</label>
                        <input type="email" id="representative-email-edit" value="${member.representative?.email || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="representative-id-doc-edit">Документ, удостоверяющий личность *</label>
                    <input type="text" id="representative-id-doc-edit" value="${member.representative?.idDocument || ''}" required>
                </div>
                <h4>Доверенность</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="power-of-attorney-number-edit">Номер доверенности *</label>
                        <input type="text" id="power-of-attorney-number-edit" value="${member.powerOfAttorney?.number || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="power-of-attorney-date-edit">Дата выдачи *</label>
                        <input type="date" id="power-of-attorney-date-edit" value="${member.powerOfAttorney?.date || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="power-of-attorney-issued-by-edit">Кем выдана *</label>
                    <input type="text" id="power-of-attorney-issued-by-edit" value="${member.powerOfAttorney?.issuedBy || ''}" required>
                </div>
                <div class="form-group">
                    <label for="entity-cooperative-plot-edit">Кооперативный участок *</label>
                    <input type="text" id="entity-cooperative-plot-edit" value="${member.cooperativePlot || ''}" required>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="updateLegalEntity('${member.id}')">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        `;
        
        showSideMenu('Редактировать юр.лицо', content);
    } else {
        // Редактирование физического лица
        const content = `
            <h3>Редактировать пайщика</h3>
            <form id="member-form">
                <input type="hidden" id="member-id" value="${member.id}">
                <div class="form-group">
                    <label for="member-name">ФИО *</label>
                    <input type="text" id="member-name" value="${member.name}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="member-birth-date">Дата рождения *</label>
                        <input type="date" id="member-birth-date" value="${member.birthDate || new Date().toISOString().split("T")[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="member-gender">Пол *</label>
                        <select id="member-gender" required>
                            <option value="male" ${member.gender === 'male' ? 'selected' : ''}>Мужской</option>
                            <option value="female" ${member.gender === 'female' ? 'selected' : ''}>Женский</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="member-registration-address">Адрес регистрации *</label>
                        <input type="text" id="member-registration-address" value="${member.registrationAddress || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="member-residence-address">Адрес проживания *</label>
                        <input type="text" id="member-residence-address" value="${member.residenceAddress || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="member-phone">Контактный телефон *</label>
                        <input type="tel" id="member-phone" value="${member.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX" required>
                    </div>
                    <div class="form-group">
                        <label for="member-email">Email *</label>
                        <input type="email" id="member-email" value="${member.email || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="member-work-place">Место работы *</label>
                        <input type="text" id="member-work-place" value="${member.workPlace || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="member-position">Должность *</label>
                        <input type="text" id="member-position" value="${member.position || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="member-income">Доход (ежемесячный) *</label>
                        <input type="number" id="member-income" value="${member.income || ''}" placeholder="0" required>
                    </div>
                    <div class="form-group">
                        <label for="member-share-amount">Размер паевого взноса *</label>
                        <input type="number" id="member-share-amount" value="${member.shareAmount || ''}" placeholder="0" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="member-payment-method">Форма оплаты паевого взноса *</label>
                        <select id="member-payment-method" required>
                            <option value="cash" ${member.paymentMethod === 'cash' ? 'selected' : ''}>Наличными</option>
                            <option value="bank_transfer" ${member.paymentMethod === 'bank_transfer' ? 'selected' : ''}>Безналичный перевод</option>
                            <option value="property" ${member.paymentMethod === 'property' ? 'selected' : ''}>Передача имущества</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="member-join-date">Дата вступления *</label>
                        <input type="date" id="member-join-date" value="${member.joinDate || new Date().toISOString().split("T")[0]}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="member-status">Статус *</label>
                    <select id="member-status" required>
                        <option value="candidate" ${member.status === 'candidate' ? 'selected' : ''}>Кандидат</option>
                        <option value="active" ${member.status === 'active' ? 'selected' : ''}>Активный</option>
                        <option value="suspended" ${member.status === 'suspended' ? 'selected' : ''}>Приостановлен</option>
                        <option value="excluded" ${member.status === 'excluded' ? 'selected' : ''}>Исключен</option>
                        <option value="withdrawn" ${member.status === 'withdrawn' ? 'selected' : ''}>Вышел</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="member-no-income" ${member.noIncome ? 'checked' : ''}>
                        Гражданин не имеет самостоятельного заработка, получает государственные пособия, пенсию или стипендию
                    </label>
                </div>
                <div class="form-group">
                    <label for="member-cooperative-plot-edit">Кооперативный участок *</label>
                    <input type="text" id="member-cooperative-plot-edit" value="${member.cooperativePlot || ''}" required>
                </div>
                <div class="form-group">
                    <label for="member-notes">Примечания</label>
                    <textarea id="member-notes" rows="3">${member.notes || ''}</textarea>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="updateMember()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        `;
        
        showSideMenu('Редактировать пайщика', content);
    }
}

function updateMember() {
    const id = document.getElementById('member-id').value;
    const name = document.getElementById('member-name').value;
    const birthDate = document.getElementById('member-birth-date').value;
    const residenceAddress = document.getElementById('member-residence-address').value;
    const phone = document.getElementById('member-phone').value;
    const joinDate = document.getElementById('member-join-date').value;
    const status = document.getElementById('member-status').value;
    const noIncome = document.getElementById('member-no-income').checked;
    const cooperativePlot = document.getElementById('member-cooperative-plot-edit').value;
    const notes = document.getElementById('member-notes').value;

    if (!name || !birthDate || !residenceAddress || !phone || !status || !cooperativePlot) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
        members[index] = {
            ...members[index],
            name: name,
            birthDate: birthDate,
            residenceAddress: residenceAddress,
            phone: phone,
            joinDate: joinDate,
            status: status,
            cooperativePlot: cooperativePlot,
            noIncome: noIncome,
            notes: notes,
            updatedAt: new Date().toISOString()
        };

        closeSideMenu();
        loadMembersData();
        updateDashboardStats();
        scheduleAutoSave(); // Вызываем автоматическое сохранение
    }
}

// Функция для обновления юридического лица
function updateLegalEntity(id) {
    const entityName = document.getElementById('entity-name-edit').value;
    const entityAddress = document.getElementById('entity-address-edit').value;
    const entityOGRN = document.getElementById('entity-ogrn-edit').value;
    const entityINN = document.getElementById('entity-inn-edit').value;
    const entityKPP = document.getElementById('entity-kpp-edit').value;
    const bankName = document.getElementById('entity-bank-name-edit').value;
    const bankBIK = document.getElementById('entity-bik-edit').value;
    const correspondentAccount = document.getElementById('entity-correspondent-account-edit').value;
    const settlementAccount = document.getElementById('entity-settlement-account-edit').value;
    const paymentPurpose = document.getElementById('entity-payment-purpose-edit').value;
    const representativeName = document.getElementById('representative-name-edit').value;
    const representativePosition = document.getElementById('representative-position-edit').value;
    const representativePhone = document.getElementById('representative-phone-edit').value;
    const representativeEmail = document.getElementById('representative-email-edit').value;
    const representativeIdDoc = document.getElementById('representative-id-doc-edit').value;
    const powerOfAttorneyNumber = document.getElementById('power-of-attorney-number-edit').value;
    const powerOfAttorneyDate = document.getElementById('power-of-attorney-date-edit').value;
    const powerOfAttorneyIssuedBy = document.getElementById('power-of-attorney-issued-by-edit').value;
    const cooperativePlot = document.getElementById('entity-cooperative-plot-edit').value;
    // Удаляем поля, связанные с паевым взносом, так как они больше не используются
    // Используем существующие значения или устанавливаем по умолчанию
    const existingMember = members.find(m => m.id === id);
    const applicationDate = existingMember?.applicationDate || new Date().toISOString().split('T')[0]; // Сохраняем существующую дату подачи заявления
    const status = existingMember?.status || 'candidate'; // Сохраняем существующий статус

    // Проверяем обязательные поля (без полей паевого взноса)
    if (!entityName || !entityAddress || !entityOGRN || !entityINN || !bankName ||
        !bankBIK || !correspondentAccount || !settlementAccount || !paymentPurpose ||
        !representativeName || !representativePosition ||
        !representativePhone || !representativeEmail || !representativeIdDoc ||
        !powerOfAttorneyNumber || !powerOfAttorneyDate || !powerOfAttorneyIssuedBy || !cooperativePlot) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
        members[index] = {
            ...members[index],
            entityName: entityName,
            entityAddress: entityAddress,
            ogrn: entityOGRN,
            inn: entityINN,
            kpp: entityKPP,
            cooperativePlot: cooperativePlot,
            bankDetails: {
                bankName: bankName,
                bik: bankBIK,
                correspondentAccount: correspondentAccount,
                settlementAccount: settlementAccount,
                paymentPurpose: paymentPurpose
            },
            representative: {
                fullName: representativeName,
                position: representativePosition,
                phone: representativePhone,
                email: representativeEmail,
                idDocument: representativeIdDoc
            },
            powerOfAttorney: {
                number: powerOfAttorneyNumber,
                date: powerOfAttorneyDate,
                issuedBy: powerOfAttorneyIssuedBy
            },
            applicationDate: applicationDate, // Сохраняем существующую дату
            status: status, // Сохраняем существующий статус
            updatedAt: new Date().toISOString()
        };
        closeSideMenu();
        loadMembersData();
        updateDashboardStats();
        scheduleAutoSave(); // Вызываем автоматическое сохранение
    }
}

function deleteMember(id) {
    if (confirm('Вы уверены, что хотите удалить этого пайщика?')) {
        members = members.filter(m => m.id !== id);
        loadMembersData();
        updateDashboardStats();
        scheduleAutoSave(); // Вызываем автоматическое сохранение
    }
}

function searchMembers() {
    const searchTerm = document.getElementById('member-search').value.toLowerCase();
    const tbody = document.getElementById('members-tbody');
    tbody.innerHTML = '';
    
    const filteredMembers = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm) ||
        member.contact.toLowerCase().includes(searchTerm)
    );
    
    filteredMembers.forEach(member => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>${member.joinDate}</td>
            <td>${getStatusText(member.status)}</td>
            <td>${member.contact}</td>
            <td>
                <button class="action-button edit" onclick="editMember('${member.id}')">Изменить</button>
                <button class="action-button delete" onclick="deleteMember('${member.id}')">Удалить</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Функции для работы с паевыми взносами
function loadPaymentsData() {
    const tbody = document.getElementById('payments-tbody');
    tbody.innerHTML = '';

    payments.forEach(payment => {
        const member = members.find(m => m.id === payment.memberId);
        const memberName = member ? member.name : (payment.expected ? 'Ожидаемый взнос' : 'Неизвестный');

        // Определяем отображение суммы или описания имущества
        let amountDisplay = '';
        if (payment.method === 'property') {
            // Если это имущественный взнос и он не оценен, показываем предупреждение
            if (!payment.amount || payment.amount === 0) {
                amountDisplay = `<div title="${payment.propertyDescription}"><span style="color:red;">Не оценено</span></div>`;
            } else {
                amountDisplay = `<div title="${payment.propertyDescription}">${(payment.amount || 0).toLocaleString()} ₽</div>`;
            }
        } else {
            amountDisplay = `${(payment.amount || 0).toLocaleString()} ₽`;
        }

        // Определяем отображение метода оплаты
        const methodText = getPaymentMethodText(payment.method);

        // Определяем статус оплаты
        let statusDisplay = payment.paid ? 'Оплачено' : 'Не оплачено';
        if (payment.expected) {
            statusDisplay = `<span style="color: orange;">Ожидаемый</span>`;
        } else if (payment.type === 'return_share') {
            statusDisplay = `<span style="color: #4CAF50;">Возвращен</span>`;
        }

        // Определяем доступные действия
        let actionButtons = `
            <button class="action-button" onclick="viewPayment('${payment.id}')">👁️</button>
        `;

        // Добавляем кнопку печати в зависимости от типа платежа
        if (payment.type === 'return_share') {
            actionButtons += `<button class="action-button" onclick="printReturnReceipt('${payment.id}')">📄</button>`;
        } else {
            actionButtons += `<button class="action-button" onclick="printPaymentReceipt('${payment.id}')">📄</button>`;
        }

        // Добавляем кнопку редактирования только для обычных взносов, не для возвратов
        if (payment.type !== 'return_share') {
            actionButtons += `<button class="action-button edit" onclick="editPayment('${payment.id}')">✏️</button>`;
        }

        // Если это имущественный взнос и он не оценен, добавляем кнопку оценки
        if (payment.method === 'property' && (!payment.amount || payment.amount === 0) && payment.type !== 'return_share') {
            actionButtons += `
                <button class="action-button" onclick="evaluateProperty('${payment.memberId || ''}', '${payment.id}')">💰</button>
            `;
        }

        // Добавляем кнопку возврата только для оплаченных обычных взносов
        if (payment.type !== 'return_share' && payment.paid && payment.type !== 'return_share') {
            actionButtons += `
                <button class="action-button" onclick="returnSharePayment('${payment.memberId}', '${payment.id}')">📤</button>
            `;
        }

        // Кнопка удаления (только для обычных взносов, не для возвратов)
        if (payment.type !== 'return_share') {
            actionButtons += `
                <button class="action-button delete" onclick="deletePayment('${payment.id}')">🗑️</button>
            `;
        }

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${memberName}</td>
            <td>${getPaymentTypeText(payment.type)}</td>
            <td>${methodText}</td>
            <td>${amountDisplay}</td>
            <td>${payment.date}</td>
            <td>${statusDisplay}</td>
            <td style="display: flex; gap: 5px; align-items: center; justify-content: center;">
                ${actionButtons}
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Функция для получения текстового описания метода оплаты
function getPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Наличные',
        'non_cash': 'Безналичные',
        'property': 'Имущество'
    };
    return methodMap[method] || method;
}

// Функция для получения текстового описания типа взноса
function getPaymentTypeText(type) {
    const typeMap = {
        'entrance': 'Вступительный взнос',
        'share': 'Паевой взнос',
        'voluntary_share': 'Добровольный паевой взнос',
        'membership': 'Членский взнос',
        'targeted': 'Целевой взнос',
        'return_share': 'Возврат паевого взноса'
    };
    return typeMap[type] || type;
}

function addPayment() {
    const dateValue = getCurrentDate();
    const htmlContent = `
        <h3>Добавить паевой взнос</h3>
        <form id="payment-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-member">Пайщик *</label>
                    <select id="payment-member" required>
                        <option value="">Выберите пайщика</option>
                        ${members.map(member => `<option value="${member.id}">${member.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="payment-type">Тип взноса *</label>
                    <select id="payment-type" required onchange="togglePaymentForm()">
                        <option value="entrance">Вступительный взнос</option>
                        <option value="share" selected>Паевой взнос</option>
                        <option value="voluntary_share">Добровольный паевой взнос</option>
                        <option value="membership">Членский взнос</option>
                        <option value="targeted">Целевой взнос</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-method">Форма оплаты *</label>
                    <select id="payment-method" required onchange="togglePaymentDetails()">
                        <option value="cash">Наличные</option>
                        <option value="non_cash">Безналичные</option>
                        <option value="property">Имущество</option>
                    </select>
                </div>
                <div class="form-group" id="amount-field" style="display:block;">
                    <label for="payment-amount">Сумма *</label>
                    <input type="number" id="payment-amount" required>
                </div>
            </div>
            <div class="form-group" id="property-details" style="display:none;">
                <label for="payment-property-desc">Описание имущества *</label>
                <textarea id="payment-property-desc" rows="2" placeholder="Опишите имущество, передаваемое в качестве паевого взноса"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-date">Дата *</label>
                    <input type="date" id="payment-date" value="\${dateValue}" required>
                </div>
                <div class="form-group">
                    <label for="payment-document">Номер документа</label>
                    <input type="text" id="payment-document" readonly placeholder="Будет сгенерирован автоматически">
                </div>
            </div>
            <div class="form-group">
                <label for="payment-description">Описание</label>
                <textarea id="payment-description" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="payment-paid" checked> Оплачено
                </label>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="savePayment()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
        <script>
            // Внутренняя версия функции для использования в шаблоне
            function togglePaymentForm() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field');
                const propertyDetails = document.getElementById('property-details');

                if (methodSelect && amountField && propertyDetails) {
                    if (methodSelect.value === 'property') {
                        amountField.style.display = 'none';
                        propertyDetails.style.display = 'block';
                    } else {
                        amountField.style.display = 'block';
                        propertyDetails.style.display = 'none';
                    }
                }
            }
            
            function togglePaymentDetails() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field');
                const propertyDetails = document.getElementById('property-details');
                
                if (methodSelect.value === 'property') {
                    amountField.style.display = 'none';
                    propertyDetails.style.display = 'block';
                } else {
                    amountField.style.display = 'block';
                    propertyDetails.style.display = 'none';
                }
            }
            // Функция генерации номера документа
            function generatePaymentDocumentNumber() {
                const type = document.getElementById('payment-type').value;
                const dateValue = document.getElementById('payment-date').value;
                
                if (!dateValue) return;
                
                // Определяем префикс в зависимости от типа взноса
                let prefix = '';
                switch(type) {
                    case 'entrance':
                        prefix = 'Вст';
                        break;
                    case 'share':
                        prefix = 'Пай';
                        break;
                    case 'voluntary_share':
                        prefix = 'ДобПай';
                        break;
                    case 'membership':
                        prefix = 'Член';
                        break;
                    case 'targeted':
                        prefix = 'Цел';
                        break;
                    case 'return_share':
                        prefix = 'Возв';
                        break;
                    default:
                        prefix = 'Док';
                }
                
                // Генерируем номер документа в формате: префикс-год-порядковый_номер
                const year = new Date(dateValue).getFullYear();
                const paymentsOfYear = window.payments ? window.payments.filter(p => 
                    p.date && p.date.startsWith(year.toString()) && p.type === type
                ).length + 1 : 1;
                
                const documentNumber = prefix + '-' + year + '-' + paymentsOfYear.toString().padStart(4, '0');
                document.getElementById('payment-document').value = documentNumber;
            }
            
            // Генерируем номер документа при загрузке формы
            setTimeout(generatePaymentDocumentNumber, 100);
            
            // Добавляем обработчик на изменение типа взноса
            document.getElementById('payment-type').onchange = function() {
                generatePaymentDocumentNumber();
            };
            
            // Добавляем обработчик на изменение даты
            document.getElementById('payment-date').onchange = function() {
                generatePaymentDocumentNumber();
            };
        </script>
    `;
    showModal(htmlContent);

    // Инициализируем состояние полей
    setTimeout(() => {
        togglePaymentForm();
    }, 100);
}

function savePayment() {
    const memberId = document.getElementById('payment-member').value;
    const type = document.getElementById('payment-type').value;
    const method = document.getElementById('payment-method').value;
    const date = document.getElementById('payment-date').value || new Date().toISOString().split("T")[0];
    const description = document.getElementById('payment-description').value;
    const paid = document.getElementById('payment-paid').checked;
    const documentNumber = document.getElementById('payment-document').value;
    
    let amount = 0;
    let propertyDescription = '';
    
    if (method === 'property') {
        propertyDescription = document.getElementById('payment-property-desc').value;
        if (!propertyDescription) {
            alert('Пожалуйста, опишите имущество');
            return;
        }
    } else {
        amount = parseFloat(document.getElementById('payment-amount').value);
        if (!amount || amount <= 0) {
            alert('Пожалуйста, укажите сумму взноса');
            return;
        }
    }
    
    if (!memberId || !type) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    // Генерация номера документа, если он не указан
    let finalDocumentNumber = documentNumber;
    if (!finalDocumentNumber || finalDocumentNumber.trim() === '') {
        // Определяем префикс в зависимости от типа взноса
        let prefix = '';
        switch(type) {
            case 'entrance':
                prefix = 'Вст';
                break;
            case 'share':
                prefix = 'Пай';
                break;
            case 'voluntary_share':
                prefix = 'ДобПай';
                break;
            case 'membership':
                prefix = 'Член';
                break;
            case 'targeted':
                prefix = 'Цел';
                break;
            case 'return_share':
                prefix = 'Возв';
                break;
            default:
                prefix = 'Док';
        }
        
        // Генерируем номер документа в формате: префикс-год-порядковый_номер
        const year = new Date(date).getFullYear();
        const paymentsOfYear = payments.filter(p => 
            p.date && p.date.startsWith(year.toString()) && p.type === type
        ).length + 1;
        
        finalDocumentNumber = `${prefix}-${year}-${paymentsOfYear.toString().padStart(4, '0')}`;
    }

    const newPayment = {
        id: generateId(),
        memberId: memberId,
        type: type,
        method: method, // cash, non_cash, property
        amount: amount,
        propertyDescription: propertyDescription,
        date: date,
        description: description,
        paid: paid,
        documentNumber: finalDocumentNumber,
        createdAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    
    // Создание бухгалтерской проводки
    createAccountingEntryForPayment(newPayment);
    
    closeModal();
    loadPaymentsData();
    updateDashboardStats();
    scheduleAutoSave(); // Вызываем автоматическое сохранение
}

// Функция для создания бухгалтерской проводки при внесении паевого взноса
function createAccountingEntryForPayment(payment) {
    const member = members.find(m => m.id === payment.memberId);
    if (!member) return;

    let debitAccount = '';
    let creditAccount = '';
    let description = '';
    let fundType = ''; // Тип фонда для аналитики

    // Определяем счета в зависимости от типа взноса
    // Согласно руководству: взносы учитываются на счёте 86 с аналитикой по фондам
    switch(payment.type) {
        case 'entrance':
            // Вступительный взнос → Неделимый фонд (86-2)
            debitAccount = '51'; // Расчетный счет (или 50 для наличных)
            creditAccount = '86-2'; // Неделимый фонд
            description = `Вступительный взнос от ${member.name} (Неделимый фонд)`;
            fundType = 'неделимый';
            break;
        case 'share':
            // Паевой взнос → Паевой фонд (86-1)
            debitAccount = '51'; // Расчетный счет (или 08 если имущество)
            creditAccount = '86-1'; // Паевой фонд
            description = `Паевой взнос от ${member.name} (Паевой фонд)`;
            fundType = 'паевой';
            break;
        case 'voluntary_share':
            // Добровольный паевой взнос → Паевой фонд (86-1)
            debitAccount = '51';
            creditAccount = '86-1'; // Паевой фонд
            description = `Добровольный паевой взнос от ${member.name} (Паевой фонд)`;
            fundType = 'паевой';
            break;
        case 'membership':
            // Членский взнос → сначала на счёт 76, потом распределяется
            // Создаем проводку поступления на счёт 76
            debitAccount = '51'; // Расчетный счет
            creditAccount = '76-5'; // Расчеты по членским взносам
            description = `Членский взнос от ${member.name} (ожидает распределения)`;
            fundType = 'членский_взнос';
            
            // Для членских взносов создаем дополнительную запись о необходимости распределения
            // Распределение производится отдельно через форму распределения
            break;
        case 'targeted':
            // Целевой взнос → Фонд развития (86-4)
            debitAccount = '51';
            creditAccount = '86-4'; // Фонд развития
            description = `Целевой взнос от ${member.name} (Фонд развития)`;
            fundType = 'развития';
            break;
        default:
            debitAccount = '51';
            creditAccount = '86-5'; // Фонд хоз. деятельности (по умолчанию)
            description = `Взнос (${payment.type}) от ${member.name} (Фонд хоз. деятельности)`;
            fundType = 'хоз_деятельности';
    }

    // Если взнос в имущественной форме, используем счет 08
    if (payment.method === 'property') {
        debitAccount = '08'; // Вложения во внеоборотные активы
        description = description.replace('51', '08 (имущество)');
    }
    
    // Если взнос наличными, используем счет 50
    if (payment.method === 'cash' && debitAccount === '51') {
        debitAccount = '50'; // Касса
    }

    const newTransaction = {
        id: generateId(),
        date: payment.date,
        amount: payment.amount,
        debitAccount: debitAccount,
        creditAccount: creditAccount,
        description: description,
        relatedPaymentId: payment.id, // Связь с паевым взносом
        fundType: fundType, // Тип фонда для аналитики
        createdAt: new Date().toISOString()
    };

    transactions.push(newTransaction);
}

// Функция просмотра паевого взноса в боковом меню
function viewPayment(id) {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    const member = members.find(m => m.id === payment.memberId);
    const memberName = member ? member.name : 'Неизвестный';
    
    const content = `
        <div class="payment-details">
            <h3>Детали паевого взноса</h3>
            <div class="detail-item">
                <label>ID:</label>
                <span>${payment.id}</span>
            </div>
            <div class="detail-item">
                <label>Пайщик:</label>
                <span>${memberName}</span>
            </div>
            <div class="detail-item">
                <label>Тип взноса:</label>
                <span>${getPaymentTypeText(payment.type)}</span>
            </div>
            <div class="detail-item">
                <label>Метод оплаты:</label>
                <span>${getPaymentMethodText(payment.method)}</span>
            </div>
            <div class="detail-item">
                <label>Сумма:</label>
                <span>${(payment.amount || 0).toLocaleString()} ₽</span>
            </div>
            <div class="detail-item">
                <label>Дата:</label>
                <span>${payment.date}</span>
            </div>
            <div class="detail-item">
                <label>Описание:</label>
                <span>${payment.description || 'Нет'}</span>
            </div>
            <div class="detail-item">
                <label>Статус оплаты:</label>
                <span>${payment.paid ? 'Оплачено' : 'Не оплачено'}</span>
            </div>
            ${payment.propertyDescription ? `
            <div class="detail-item">
                <label>Описание имущества:</label>
                <span>${payment.propertyDescription}</span>
            </div>
            ` : ''}
            <div class="detail-item">
                <label>Номер документа:</label>
                <span>${payment.documentNumber || 'Не указан'}</span>
            </div>
            
            <div style="margin-top: 1.5rem; text-align: center;">
                <button class="action-button edit" onclick="editPayment('${payment.id}')">Редактировать</button>
                <button class="action-button delete" onclick="deletePayment('${payment.id}')">Удалить</button>
                <button class="action-button" onclick="printPaymentReceipt('${payment.id}')">Печать</button>
                <button class="action-button" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showSideMenu(`Паевой взнос: ${payment.id}`, content);
}

function editPayment(id) {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    // Определяем, какой метод оплаты был использован
    const isProperty = payment.method === 'property';

    showModal(`
        <h3>Редактировать паевой взнос</h3>
        <form id="payment-form">
            <input type="hidden" id="payment-id" value="${payment.id}">
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-member">Пайщик *</label>
                    <select id="payment-member" required>
                        ${members.map(member => `<option value="${member.id}" ${member.id === payment.memberId ? 'selected' : ''}>${member.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="payment-type">Тип взноса *</label>
                    <select id="payment-type" required onchange="togglePaymentFormEdit()">
                        <option value="entrance" ${payment.type === 'entrance' ? 'selected' : ''}>Вступительный взнос</option>
                        <option value="share" ${payment.type === 'share' ? 'selected' : ''}>Паевой взнос</option>
                        <option value="voluntary_share" ${payment.type === 'voluntary_share' ? 'selected' : ''}>Добровольный паевой взнос</option>
                        <option value="membership" ${payment.type === 'membership' ? 'selected' : ''}>Членский взнос</option>
                        <option value="targeted" ${payment.type === 'targeted' ? 'selected' : ''}>Целевой взнос</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-method">Форма оплаты *</label>
                    <select id="payment-method" required onchange="togglePaymentDetailsEdit()">
                        <option value="cash" ${payment.method === 'cash' ? 'selected' : ''}>Наличные</option>
                        <option value="non_cash" ${payment.method === 'non_cash' ? 'selected' : ''}>Безналичные</option>
                        <option value="property" ${payment.method === 'property' ? 'selected' : ''}>Имущество</option>
                    </select>
                </div>
                <div class="form-group" id="amount-field-edit" style="display:${isProperty ? 'none' : 'block'};">
                    <label for="payment-amount">Сумма *</label>
                    <input type="number" id="payment-amount" value="${payment.amount || 0}" required>
                </div>
            </div>
            <div class="form-group" id="property-details-edit" style="display:${isProperty ? 'block' : 'none'};">
                <label for="payment-property-desc">Описание имущества *</label>
                <textarea id="payment-property-desc" rows="2">${payment.propertyDescription || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-date">Дата *</label>
                    <input type="date" id="payment-date" value="${payment.date}" required>
                </div>
                <div class="form-group">
                    <label for="payment-document">Номер документа</label>
                    <input type="text" id="payment-document" value="${payment.documentNumber || ''}" placeholder="Акт внесения паевого взноса">
                </div>
            </div>
            <div class="form-group">
                <label for="payment-description">Описание</label>
                <textarea id="payment-description" rows="2">${payment.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="payment-paid" ${payment.paid ? 'checked' : ''}> Оплачено
                </label>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="updatePayment()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
        <script>
            function togglePaymentFormEdit() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field-edit');
                const propertyDetails = document.getElementById('property-details-edit');
                
                if (methodSelect.value === 'property') {
                    amountField.style.display = 'none';
                    propertyDetails.style.display = 'block';
                } else {
                    amountField.style.display = 'block';
                    propertyDetails.style.display = 'none';
                }
            }
            
            function togglePaymentDetailsEdit() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field-edit');
                const propertyDetails = document.getElementById('property-details-edit');
                
                if (methodSelect.value === 'property') {
                    amountField.style.display = 'none';
                    propertyDetails.style.display = 'block';
                } else {
                    amountField.style.display = 'block';
                    propertyDetails.style.display = 'none';
                }
            }
        </script>
        <div style="margin-top: 1rem; display: flex; gap: 10px; justify-content: center;">
            <button type="button" onclick="printPaymentReceipt('${id}')">Печать</button>
        </div>
    `);

    // Инициализируем состояние полей
    setTimeout(() => {
        togglePaymentFormEdit();
    }, 100);
}

function updatePayment() {
    const id = document.getElementById('payment-id').value;
    const memberId = document.getElementById('payment-member').value;
    const type = document.getElementById('payment-type').value;
    const method = document.getElementById('payment-method').value;
    const date = document.getElementById('payment-date').value;
    const description = document.getElementById('payment-description').value;
    const paid = document.getElementById('payment-paid').checked;
    const documentNumber = document.getElementById('payment-document').value;
    
    let amount = 0;
    let propertyDescription = '';
    
    if (method === 'property') {
        propertyDescription = document.getElementById('payment-property-desc').value;
        if (!propertyDescription) {
            alert('Пожалуйста, опишите имущество');
            return;
        }
    } else {
        amount = parseFloat(document.getElementById('payment-amount').value);
        if (!amount || amount <= 0) {
            alert('Пожалуйста, укажите сумму взноса');
            return;
        }
    }
    
    const index = payments.findIndex(p => p.id === id);
    if (index !== -1) {
        // Удаляем старую бухгалтерскую проводку, связанную с этим платежом
        transactions = transactions.filter(t => t.relatedPaymentId !== id);
        
        payments[index] = {
            ...payments[index],
            memberId: memberId,
            type: type,
            method: method,
            amount: amount,
            propertyDescription: propertyDescription,
            date: date,
            description: description,
            paid: paid,
            documentNumber: documentNumber,
            updatedAt: new Date().toISOString()
        };
        
        // Создаем новую бухгалтерскую проводку
        createAccountingEntryForPayment(payments[index]);
        
        closeModal();
        loadPaymentsData();
        updateDashboardStats();
        scheduleAutoSave(); // Вызываем автоматическое сохранение
    }
}

function deletePayment(id) {
    if (confirm('Вы уверены, что хотите удалить этот паевой взнос?')) {
        // Удаляем связанные бухгалтерские проводки
        transactions = transactions.filter(t => t.relatedPaymentId !== id);
        payments = payments.filter(p => p.id !== id);
        loadPaymentsData();
        updateDashboardStats();
        scheduleAutoSave(); // Вызываем автоматическое сохранение
    }
}

// Функция для возврата паевого взноса
function returnSharePayment(memberId, paymentId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert('Пайщик не найден');
        return;
    }

    // Проверяем, есть ли у пайщика неоплаченные взносы
    const unpaidPayments = payments.filter(p => p.memberId === memberId && !p.paid && p.type !== 'return_share');
    if (unpaidPayments.length > 0) {
        alert('Невозможно вернуть паевой взнос пайщику с ���еоплаченными взносами. Сначала погасите задолженность.');
        return;
    }

    // Получаем все оплаченные паевые взносы пайщика
    const sharePayments = payments.filter(p => p.memberId === memberId && p.paid && 
        (p.type === 'share' || p.type === 'entrance' || p.type === 'voluntary_share'));

    if (sharePayments.length === 0) {
        alert('У пайщика нет оплаченных паевых взносов для возврата');
        return;
    }

    // Рассчитываем общую сумму для возврата
    const totalReturnAmount = sharePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Показываем модальное окно для подтверждения возврата
    const currentDate = new Date().toISOString().split("T")[0];
    showModal(`
        <h3>Возврат паевого взноса пайщику: ${member.name}</h3>
        <div class="return-payment-form">
            <p><strong>Пайщик:</strong> ${member.name}</p>
            <p><strong>Общая сумма для возврата:</strong> ${totalReturnAmount.toLocaleString()} ₽</p>
            
            <div class="form-group">
                <label for="return-payment-type">Тип возврата:</label>
                <select id="return-payment-type" required>
                    <option value="cash">Налич��ыми</option>
                    <option value="non_cash">Безналичными</option>
                    <option value="property">Имуществом</option>
                </select>
            </div>
            
            <div class="form-group" id="return-amount-field">
                <label for="return-payment-amount">Сумма возврата:</label>
                <input type="number" id="return-payment-amount" value="${totalReturnAmount}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group" id="return-property-details" style="display:none;">
                <label for="return-property-desc">Описание возвращаемого имущества:</label>
                <textarea id="return-property-desc" rows="3" placeholder="Опишите имущество, возвращаемое пайщику"></textarea>
            </div>
            
            <div class="form-group">
                <label for="return-payment-date">Дата возврата:</label>
                <input type="date" id="return-payment-date" value="${currentDate}" required>
            </div>
            
            <div class="form-group">
                <label for="return-description">Основание для возврата:</label>
                <textarea id="return-description" rows="3" placeholder="Укажите основание для возврата паевого взноса">Возврат паевого взноса при выбытии пайщика</textarea>
            </div>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button type="button" class="action-button save" onclick="processReturnPayment('${memberId}', '${totalReturnAmount}')">Оформить возврат</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);

    // Добавляем обработчик изменения типа возврата
    document.getElementById('return-payment-type').addEventListener('change', function() {
        const propertyDetails = document.getElementById('return-property-details');
        const amountField = document.getElementById('return-amount-field');
        
        if (this.value === 'property') {
            propertyDetails.style.display = 'block';
            amountField.style.display = 'none';
        } else {
            propertyDetails.style.display = 'none';
            amountField.style.display = 'block';
        }
    });
}

// Функция обработки возврата паевого взноса
function processReturnPayment(memberId, totalAmount) {
    const returnPaymentType = document.getElementById('return-payment-type').value;
    const returnAmount = parseFloat(document.getElementById('return-payment-amount').value) || 0;
    const returnPropertyDesc = document.getElementById('return-property-desc')?.value || '';
    const returnDate = document.getElementById('return-payment-date').value;
    const returnDescription = document.getElementById('return-description').value;

    if (returnPaymentType === 'property' && !returnPropertyDesc.trim()) {
        alert('Пожалуйста, ��кажите описание возвращаемого имущества');
        return;
    }

    if ((returnPaymentType !== 'property' && returnAmount <= 0) || 
        (returnPaymentType === 'property' && !returnPropertyDesc.trim())) {
        alert('Пожалуйста, укажите корректные данные для возврата');
        return;
    }

    // Создаем запись о возврате паевого взноса
    const returnPayment = {
        id: generateId(),
        memberId: memberId,
        type: 'return_share', // Тип - возврат паевого взноса
        method: returnPaymentType,
        amount: returnPaymentType !== 'property' ? returnAmount : 0,
        propertyDescription: returnPropertyDesc,
        date: returnDate,
        description: returnDescription,
        paid: true, // Возврат считается выполненным
        documentNumber: 'Возв-' + new Date().getTime(),
        createdAt: new Date().toISOString()
    };

    // Добавляем возврат в массив платежей
    payments.push(returnPayment);

    // Обновляем статус пайщика на "выбыл"
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
        members[memberIndex].status = 'withdrawn';
        members[memberIndex].withdrawalDate = returnDate;
    }

    // Создаем бухгалтерскую запись для возврата
    createAccountingEntryForReturn(returnPayment);

    // Сохраняем данные
    saveData();

    // Закрываем модальное окно
    closeModal();

    // Обновляем отображение
    if (typeof loadPaymentsData === 'function') loadPaymentsData();
    if (typeof loadMembersData === 'function') loadMembersData();
    updateDashboardStats();

    alert('Пайщик успешно выбыл, возврат паевого взн��������са ��фо��мл��н');
}

// Функция создания бухгалтерской записи для возврата
function createAccountingEntryForReturn(returnPayment) {
    // Находим пайщика
    const member = members.find(m => m.id === returnPayment.memberId);
    if (!member) return;

    // Создаем бухгалтерскую проводку для возврата
    // Дебет 86-1 Кредит 50 (51, 76) - Возврат паевого взноса участнику (уменьшение паевого фонда)
    const accountingEntry = {
        id: generateId(),
        date: returnPayment.date,
        debitAccount: '86-1', // Паевой фонд (уменьшается при возврате)
        creditAccount: returnPayment.method === 'cash' ? '50' : (returnPayment.method === 'property' ? '76' : '51'),
        amount: returnPayment.method !== 'property' ? returnPayment.amount : 0,
        propertyDescription: returnPayment.method === 'property' ? returnPayment.propertyDescription : '',
        description: `Возврат паевого взноса пайщику ${member.name} (уменьшение паевого фонда)`,
        documentNumber: returnPayment.documentNumber,
        relatedPaymentId: returnPayment.id,
        fundType: 'паевой', // Для аналитики по фондам
        createdAt: new Date().toISOString()
    };

    // Добавляем проводку в массив транзакций
    if (!window.transactions) window.transactions = [];
    transactions.push(accountingEntry);
}

// Функция для получения текстового описания типа взноса, включая возврат
function getExtendedPaymentTypeText(type) {
    const typeMap = {
        'entrance': 'Вступительный взнос',
        'share': 'Паевой взнос',
        'voluntary_share': 'Добровольный паевой взнос',
        'membership': 'Членский взнос',
        'targeted': 'Целевой взнос',
        'return_share': 'Возврат паевого взноса'
    };
    return typeMap[type] || type;
}

// Функция для открытия формы возврата паевого взноса
function showReturnPaymentForm(selectedMemberId = null, withdrawalDate = null) {
    // Если передан memberId, то это вызов из процесса выбытия пайщика
    if (selectedMemberId) {
        const member = members.find(m => m.id === selectedMemberId);
        if (!member) return;

        // Проверяем наличие необходимых данных
        if (typeof payments === 'undefined' || !Array.isArray(payments)) {
            console.error('Переменная payments не определена или не является массивом');
            alert('Ошибка: данные о ���латежах не загружены');
            return;
        }

        // Рассчитываем сумму к возврату (упрощенный расчет)
        const eligiblePayments = payments.filter(p =>
            p.memberId === selectedMemberId &&
            p.type === 'share' &&
            p.paid === true
        );

        const totalEligibleAmount = eligiblePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Рассчитываем общий баланс паевых взносов пайщика
        const allSharePayments = payments.filter(p =>
            p.memberId === selectedMemberId &&
            p.type === 'share' &&
            p.paid === true
        );
        const totalShareBalance = allSharePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Рассчитываем сумму уже возвращенных паевых взносов
        const returnPayments = payments.filter(p =>
            p.memberId === selectedMemberId &&
            p.type === 'return_share'
        );
        const totalReturnedAmount = returnPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // Доступный баланс для возврата
        const availableBalance = Math.max(0, totalShareBalance - totalReturnedAmount);

        showModal(`
            <h3>Возврат паевого взноса пайщику: ${member.name}</h3>
            <form id="return-payment-form">
                <input type="hidden" id="return-member-id" value="${member.id}">
                <input type="hidden" id="return-withdrawal-date" value="${withdrawalDate || new Date().toISOString().split("T")[0]}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="return-amount">Сумма к возврату</label>
                        <input type="number" id="return-amount" value="${Math.min(totalEligibleAmount, availableBalance)}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Доступный баланс</label>
                        <input type="text" value="${availableBalance.toLocaleString()} ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
                    </div>
                </div>
                <div class="form-group">
                    <label>Об�������� бала���� паевых взносов</label>
                    <input type="text" value="${totalShareBalance.toLocaleString()} ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div class="form-group">
                    <label>Уже возвращено</label>
                    <input type="text" value="${totalReturnedAmount.toLocaleString()} ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="return-method">Форма возврата</label>
                        <select id="return-method" required>
                            <option value="cash">Наличные</option>
                            <option value="non_cash">Безналичные</option>
                            <option value="property">Имущество</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="return-date">Дата возврата *</label>
                        <input type="date" id="return-date" value="${withdrawalDate || new Date().toISOString().split("T")[0]}" required>
                    </div>
                </div>
                <div class="form-group" id="return-property-details" style="display:none;">
                    <label for="return-property-desc">Описание возвращаемого имущества</label>
                    <textarea id="return-property-desc" rows="2" placeholder="Опишите имущество, возвращаемое пайщику"></textarea>
                </div>
                <div class="form-group">
                    <label for="return-document">Номер документа</label>
                    <input type="text" id="return-document" placeholder="Акт возврата паевого взноса">
                </div>
                <div class="form-group">
                    <label for="return-description">Описание операции</label>
                    <textarea id="return-description" rows="2">Возврат паевого взноса при выбытии пайщика</textarea>
                </div>
                <div style="margin-top: 1rem;">
                    <button type="button" onclick="processReturnPayment()">Выполнить возврат</button>
                    <button type="button" onclick="closeModal()">Отмена</button>
                </div>
            </form>
            <script>
                document.getElementById('return-method').addEventListener('change', function() {
                    const propertyDetails = document.getElementById('return-property-details');
                    if (this.value === 'property') {
                        propertyDetails.style.display = 'block';
                    } else {
                        propertyDetails.style.display = 'none';
                    }
                });
            <\/script>
        `);
    } else {
        // Создаем HTML-форму для возврата паевого взноса (стандартный случай)
        const currentDate = new Date().toISOString().split("T")[0];
        let content = `
            <h3>Возврат паевого взноса</h3>
            <form id="return-payment-form">
                <div class="form-group">
                    <label for="return-payment-member">Пайщик *</label>
                    <select id="return-payment-member" required>
                        <option value="">Выберите пайщика</option>
                        ${members.map(member => `<option value="${member.id}">${member.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="return-payment-type">Тип взноса *</label>
                    <select id="return-payment-type" required>
                        <option value="share">Паевой взнос</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="return-payment-method">Форма возврата *</label>
                        <select id="return-payment-method" required onchange="toggleReturnPaymentDetails()">
                            <option value="cash">Наличные</option>
                            <option value="non_cash">Безналичные</option>
                            <option value="property">Иму��ество</option>
                        </select>
                    </div>
                    <div class="form-group" id="return-amount-field" style="display:block;">
                        <label for="return-payment-amount">Сумма *</label>
                        <input type="number" id="return-payment-amount" min="0" step="0.01" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Доступный баланс</label>
                    <input type="text" id="member-balance-display" value="0 ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div class="form-group">
                    <label>Общий баланс паевых взносов</label>
                    <input type="text" id="total-share-balance" value="0 ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div class="form-group">
                    <label>Уже возвращено</label>
                    <input type="text" id="total-returned-amount" value="0 ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
                </div>
                <div class="form-group" id="return-property-details" style="display:none;">
                    <label for="return-payment-property-desc">Описание имущества *</label>
                    <textarea id="return-payment-property-desc" rows="2" placeholder="Опишите и��ущество, возвращаемое пайщику"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="return-payment-date">Дата *</label>
                        <input type="date" id="return-payment-date" value="${currentDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="return-payment-document">Номер документа *</label>
                        <input type="text" id="return-payment-document" required readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label for="return-payment-description">Описание</label>
                    <textarea id="return-payment-description" rows="2">Во��врат паевого взноса</textarea>
                </div>
                <div style="margin-top: 1rem; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveReturnPayment()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
            <script>
                // Функция генерации номера документа возврата
                function generateReturnPaymentDocumentNumber() {
                    // Генерируем номер документа возврата в формате: Возв-год-порядковый_номер
                    const year = new Date().getFullYear();
                    const returnPaymentsOfYear = payments.filter(p => 
                        p.date && p.date.startsWith(year.toString()) && p.type === 'return_share'
                    ).length + 1;
                    
                    const returnPaymentDocumentNumber = 'Возв-' + year + '-' + returnPaymentsOfYear.toString().padStart(4, '0');
                    document.getElementById('return-payment-document').value = returnPaymentDocumentNumber;
                }
                
                // Генерируем номер документа при загрузке формы
                generateReturnPaymentDocumentNumber();

                // Обновляем поля при изменении метода оплаты
                function toggleReturnPaymentDetails() {
                    const methodSelect = document.getElementById('return-payment-method');
                    const amountField = document.getElementById('return-amount-field');
                    const propertyDetails = document.getElementById('return-property-details');

                    if (methodSelect && amountField && propertyDetails) {
                        if (methodSelect.value === 'property') {
                            amountField.style.display = 'none';
                            propertyDetails.style.display = 'block';
                        } else {
                            amountField.style.display = 'block';
                            propertyDetails.style.display = 'none';
                        }
                    }
                }
            <\/script>
            <script>
                // Добавляем обработчик события изменения выбора пайщика
                // Код выполняется после вставки HTML в DOM
                (function() {
                    // Ждем немного, чтобы элементы были доступны в DOM
                    setTimeout(function() {
                        const memberSelect = document.getElementById('return-payment-member');
                        if (memberSelect) {
                            // Устанавливаем обработчик события
                            memberSelect.onchange = function() {
                                // Проверяем наличие необходимых данных
                                if (typeof payments === 'undefined' || !Array.isArray(payments)) {
                                    console.error('Переменная payments не определена или не является массивом');
                                    document.getElementById('member-balance-display').value = 'Ошибка: данные не загружены';
                                    if (document.getElementById('total-share-balance')) {
                                        document.getElementById('total-share-balance').value = 'Ошибка: данные не загружены';
                                    }
                                    if (document.getElementById('total-returned-amount')) {
                                        document.getElementById('total-returned-amount').value = 'Ошибка: данные не загружены';
                                    }
                                    return;
                                }
                                
                                const memberId = this.value;
                                if (!memberId) {
                                    document.getElementById('member-balance-display').value = '0 ₽';
                                    // Обнуляем также поля информации о балансе
                                    if (document.getElementById('total-share-balance')) {
                                        document.getElementById('total-share-balance').value = '0 ₽';
                                    }
                                    if (document.getElementById('total-returned-amount')) {
                                        document.getElementById('total-returned-amount').value = '0 ₽';
                                    }
                                    return;
                                }

                                // Рассчитываем общий баланс паевых взносов пайщика
                                const allSharePayments = payments.filter(p =>
                                    p.memberId === memberId &&
                                    p.type === 'share' &&
                                    p.paid === true
                                );
                                const totalShareBalance = allSharePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

                                // Рассчитываем сумму уже возвращенных паевых взносов
                                const returnPayments = payments.filter(p =>
                                    p.memberId === memberId &&
                                    p.type === 'return_share'
                                );
                                const totalReturnedAmount = returnPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

                                // Доступный баланс для возврата
                                const availableBalance = Math.max(0, totalShareBalance - totalReturnedAmount);

                                document.getElementById('member-balance-display').value = availableBalance.toLocaleString() + ' ₽';

                                // Обновляем также поля информации о балансе, если они существуют
                                if (document.getElementById('total-share-balance')) {
                                    document.getElementById('total-share-balance').value = totalShareBalance.toLocaleString() + ' ₽';
                                }
                                if (document.getElementById('total-returned-amount')) {
                                    document.getElementById('total-returned-amount').value = totalReturnedAmount.toLocaleString() + ' ₽';
                                }
                            };
                            
                            // Вызываем обработчик для начального состояния, если уже выбран пайщик
                            if (memberSelect.value) {
                                memberSelect.onchange();
                            }
                        }
                    }, 10); // Небольшая задержка для гарантии доступности элементов
                })();
            <\/script>
        `;

        showSideMenu('Возврат паевого взноса', content);
    }
}

// Функция сохранения возврата паевого взноса
function saveReturnPayment() {
    const memberId = document.getElementById('return-payment-member').value;
    const type = document.getElementById('return-payment-type').value;
    const method = document.getElementById('return-payment-method').value;
    const amount = parseFloat(document.getElementById('return-payment-amount').value) || 0;
    const propertyDescription = document.getElementById('return-payment-property-desc')?.value || '';
    const date = document.getElementById('return-payment-date').value;
    // Номер документа уже сгенерирован и установлен в поле, используем его
    const documentNumber = document.getElementById('return-payment-document').value;
    const description = document.getElementById('return-payment-description').value;

    // Проверяем обязательные поля
    if (!memberId || !type || !method || (method !== 'property' && amount <= 0) || (method === 'property' && !propertyDescription.trim())) {
        alert('Пожалуйста, заполните все обязательные поля корректно');
        return;
    }

    // Проверяем, что у пайщика есть оплаченные паевые взносы для возврата
    const memberPayments = payments.filter(p => p.memberId === memberId && p.paid && p.type === 'share');
    const totalShareAmount = memberPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    if (totalShareAmount <= 0) {
        alert('У выбранного пайщика нет оплаченных паевых взносов для возврата');
        return;
    }

    if (amount > totalShareAmount) {
        alert('Сумма возврата не может превышать общую сумму оплаченных паевых взносов пайщика (' + totalShareAmount.toLocaleString() + ' ₽)');
        return;
    }

    // Генерация номера документа для возврата, если он не указан
    let finalReturnDocumentNumber = documentNumber;
    if (!finalReturnDocumentNumber || finalReturnDocumentNumber.trim() === '') {
        // Генерируем номер документа возврата в формате: Возв-год-порядковый_номер
        const year = new Date(date).getFullYear();
        const returnPaymentsOfYear = payments.filter(p => 
            p.date && p.date.startsWith(year.toString()) && p.type === 'return_share'
        ).length + 1;
        
        finalReturnDocumentNumber = `Возв-${year}-${returnPaymentsOfYear.toString().padStart(4, '0')}`;
    }

    // Создаем запись о возврате паевого взноса
    const returnPayment = {
        id: generateId(),
        memberId: memberId,
        type: 'return_share', // Тип - возврат паевого взноса
        method: method,
        amount: method !== 'property' ? amount : 0,
        propertyDescription: method === 'property' ? propertyDescription : '',
        date: date,
        description: description,
        paid: true, // Возврат считается выполненным
        documentNumber: finalReturnDocumentNumber,
        createdAt: new Date().toISOString()
    };

    // Добавляем возврат в массив платежей
    payments.push(returnPayment);

    // Обновляем статус пайщика на "выбыл" если вся сумма паевого взноса возвращена
    const remainingAmount = totalShareAmount - amount;
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1 && remainingAmount <= 0) {
        members[memberIndex].status = 'withdrawn';
        members[memberIndex].withdrawalDate = date;
    }

    // Создаем бухгалтерскую запись для возврата
    createAccountingEntryForReturn(returnPayment);

    // Сохраняем данные
    saveData();

    // Закрываем боковое меню
    closeSideMenu();

    // Обновляем отображение
    if (typeof loadPaymentsData === 'function') loadPaymentsData();
    if (typeof loadMembersData === 'function') loadMembersData();
    updateDashboardStats();

    alert('Возврат паевого взноса успешно оформлен');
}

// Функция для выбытия пайщика
function withdrawMember(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // Проверяем, есть ли у пайщика задолженности
    const memberPayments = payments.filter(p => p.memberId === memberId);
    const unpaidPayments = memberPayments.filter(p => !p.paid);
    
    if (unpaidPayments.length > 0) {
        alert('Невозможно исключить пайщика с неоплаченными взносами. Сначала погасите задолженность.');
        return;
    }
    
    // Показываем форму для возврата паевого взноса
    const currentDate = new Date().toISOString().split("T")[0];
    showModal(`
        <h3>Выбытие пайщика: ${member.name}</h3>
        <form id="withdrawal-form">
            <input type="hidden" id="withdrawal-member-id" value="${member.id}">
            <div class="form-group">
                <label for="withdrawal-reason">Причина выбытия</label>
                <select id="withdrawal-reason" required>
                    <option value="voluntary_exit">Добровольный выход</option>
                    <option value="death">Смерть</option>
                    <option value="exclusion">Исключение</option>
                    <option value="reorganization">Реорганизация коо��ератива</option>
                    <option value="other">Прочее</option>
                </select>
            </div>
            <div class="form-group">
                <label for="withdrawal-date">Дата выбытия *</label>
                <input type="date" id="withdrawal-date" value="${currentDate}" required>
            </div>
            <div class="form-group">
                <label for="withdrawal-notes">Примечания</label>
                <textarea id="withdrawal-notes" rows="3"></textarea>
            </div>
            <div style="margin-top: 1rem;">
                <button type="button" onclick="processMemberWithdrawal()">Подтвердить выбытие</button>
                <button type="button" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

// Функция обработки выбытия пайщика
function processMemberWithdrawal() {
    const memberId = document.getElementById('withdrawal-member-id').value;
    const reason = document.getElementById('withdrawal-reason').value;
    const date = document.getElementById('withdrawal-date').value;
    const notes = document.getElementById('withdrawal-notes').value;
    
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert('Пайщик не найден');
        return;
    }
    
    // Обновляем статус пайщика
    member.status = 'withdrawn';
    member.withdrawalDate = date;
    member.withdrawalReason = reason;
    member.withdrawalNotes = notes;
    member.updatedAt = new Date().toISOString();
    
    // Показываем форму для возврата паевого взноса
    showReturnPaymentForm(memberId, date);
}

// Функция для отображения формы возврата пае��ого взноса

// Функция обработки возврата паевого взноса

// Функция для оценки имущества
function evaluateProperty(memberId, paymentId) {
    const member = members.find(m => m.id === memberId);
    const payment = payments.find(p => p.id === paymentId);
    
    if (!member || !payment) {
        alert('Пайщик или платеж не найдены');
        return;
    }

    const currentDate = new Date().toISOString().split("T")[0];
    showModal(`
        <h3>Акт оценки имущества</h3>
        <form id="evaluation-form">
            <input type="hidden" id="eval-member-id" value="${member.id}">
            <input type="hidden" id="eval-payment-id" value="${payment.id}">
            <div class="form-group">
                <label for="eval-property-desc">Описание имущества</label>
                <textarea id="eval-property-desc" rows="3" readonly>${payment.propertyDescription}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="eval-date">Дата оценки *</label>
                    <input type="date" id="eval-date" value="${currentDate}" required>
                </div>
                <div class="form-group">
                    <label for="eval-amount">Оценочная стоимость *</label>
                    <input type="number" id="eval-amount" required>
                </div>
            </div>
            <div class="form-group">
                <label for="eval-method">Метод оценки</label>
                <select id="eval-method">
                    <option value="market">Рыночная стоимость</option>
                    <option value="book">Балансовая стоимость</option>
                    <option value="expert">Экспертная оценка</option>
                    <option value="agreed">Согласованная стоимость</option>
                </select>
            </div>
            <div class="form-group">
                <label for="eval-expert">Оценщик/Эксперт</label>
                <input type="text" id="eval-expert" placeholder="ФИО оценщика">
            </div>
            <div class="form-group">
                <label for="eval-notes">Примечания к оценке</label>
                <textarea id="eval-notes" rows="2"></textarea>
            </div>
            <div style="margin-top: 1rem;">
                <button type="button" onclick="submitEvaluation()">Оформить акт оценки</button>
                <button type="button" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

// Функция для оформления акта оценки
function submitEvaluation() {
    const memberId = document.getElementById('eval-member-id').value;
    const paymentId = document.getElementById('eval-payment-id').value;
    const evalDate = document.getElementById('eval-date').value;
    const evalAmount = parseFloat(document.getElementById('eval-amount').value);
    const evalMethod = document.getElementById('eval-method').value;
    const evalExpert = document.getElementById('eval-expert').value;
    const evalNotes = document.getElementById('eval-notes').value;
    
    if (!evalAmount || evalAmount <= 0) {
        alert('Пожалуйста, укажите оценочную стоимость');
        return;
    }
    
    // Обновляем сумму в платеже на основе оценки
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex !== -1) {
        payments[paymentIndex].amount = evalAmount;
        payments[paymentIndex].evaluation = {
            date: evalDate,
            amount: evalAmount,
            method: evalMethod,
            expert: evalExpert,
            notes: evalNotes,
            createdAt: new Date().toISOString()
        };
    }
    
    // Обновляем связанную бухгалтерскую проводку
    const transactionIndex = transactions.findIndex(t => t.relatedPaymentId === paymentId);
    if (transactionIndex !== -1) {
        transactions[transactionIndex].amount = evalAmount;
    }
    
    closeModal();
    loadPaymentsData();
    saveData();
    
    alert('Акт оценки оформлен, сумма паевого взноса обновлена');
}

// Функции для работы с бухгалтерскими проводками
function loadTransactionsData() {
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Определяем, связана ли проводка с определенной операцией
        let relatedInfo = '';
        if (transaction.relatedPaymentId) {
            const relatedPayment = payments.find(p => p.id === transaction.relatedPaymentId);
            if (relatedPayment) {
                const member = members.find(m => m.id === relatedPayment.memberId);
                const memberName = member ? member.name : 'Неизвестный';
                
                if (transaction.transactionType === 'return') {
                    relatedInfo = `<br><small style="color: red;">(Возврат пая ${memberName})</small>`;
                } else {
                    relatedInfo = `<br><small style="color: green;">(Пай ${memberName})</small>`;
                }
            }
        }
        
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.date}</td>
            <td>${transaction.debitAccount}</td>
            <td>${transaction.creditAccount}</td>
            <td>${(transaction.amount || 0).toLocaleString()} ₽</td>
            <td>${transaction.description}${relatedInfo}</td>
            <td>
                <button class="action-button" onclick="viewTransaction('${transaction.id}')">Просмотр</button>
                <button class="action-button edit" onclick="editTransaction('${transaction.id}')">Изменить</button>
                <button class="action-button delete" onclick="deleteTransaction('${transaction.id}')">Удалить</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function addTransaction() {
    const currentDate = new Date().toISOString().split("T")[0];
    showModal(`
        <h3>Доба��ить бухгалтерскую проводку</h3>
        <form id="transaction-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="transaction-date">Дата *</label>
                    <input type="date" id="transaction-date" value="${currentDate}" required>
                </div>
                <div class="form-group">
                    <label for="transaction-amount">Сумма *</label>
                    <input type="number" id="transaction-amount" step="0.01" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="transaction-debit">Дебет *</label>
                    <input type="text" id="transaction-debit" placeholder="Счет дебета (например, 50, 51, 76)" required>
                </div>
                <div class="form-group">
                    <label for="transaction-credit">Кредит *</label>
                    <input type="text" id="transaction-credit" placeholder="Счет кредита (например, 86, 75, 90)" required>
                </div>
            </div>
            <div class="form-group">
                <label for="transaction-description">Описание</label>
                <textarea id="transaction-description" rows="3"></textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveTransaction()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

function saveTransaction() {
    const date = document.getElementById('transaction-date').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const debitAccount = document.getElementById('transaction-debit').value;
    const creditAccount = document.getElementById('transaction-credit').value;
    const description = document.getElementById('transaction-description').value;
    
    if (!date || !amount || !debitAccount || !creditAccount) {
        alert('Пожалуйста, запол��ите все обязательные поля');
        return;
    }
    
    const newTransaction = {
        id: generateId(),
        date: date,
        amount: amount,
        debitAccount: debitAccount,
        creditAccount: creditAccount,
        description: description,
        createdAt: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    closeModal();
    loadTransactionsData();
    scheduleAutoSave(); // Вызываем автоматическое сохранение
}

// Функция для распределения членских взносов по фондам
function distributeMembershipFees() {
    // Находим все членские взносы на счёте 76-5 (ожидающие распределения)
    const undistributedPayments = transactions.filter(t => 
        t.creditAccount === '76-5' && 
        !t.distributed
    );

    if (undistributedPayments.length === 0) {
        alert('Нет членских взносов, ожидающих распределения');
        return;
    }

    // Рассчитываем общую сумму к распределению
    const totalAmount = undistributedPayments.reduce((sum, t) => sum + (t.amount || 0), 0);

    showModal(`
        <h3>Распределение членских взносов по фондам</h3>
        <p>Общая сумма к распределению: <strong>${totalAmount.toLocaleString()} ₽</strong></p>
        <p class="info-text">Согласно Закону № 3085-1, членские взносы распределяются по фондам кооператива на основании решения общего собрания.</p>
        
        <form id="distribution-form">
            <div class="form-group">
                <label for="distribution-date">Дата распределения</label>
                <input type="date" id="distribution-date" value="${getCurrentDate()}" required>
            </div>
            
            <h4>Направления распределения:</h4>
            <div class="form-group">
                <label for="reserve-fund">В резервный фонд (86-3), руб.</label>
                <input type="number" id="reserve-fund" step="0.01" value="0" min="0" max="${totalAmount}" oninput="validateDistribution(${totalAmount})">
            </div>
            
            <div class="form-group">
                <label for="development-fund">В фонд развития (86-4), руб.</label>
                <input type="number" id="development-fund" step="0.01" value="0" min="0" max="${totalAmount}" oninput="validateDistribution(${totalAmount})">
            </div>
            
            <div class="form-group">
                <label for="business-fund">В фонд хоз. деятельности (86-5), руб.</label>
                <input type="number" id="business-fund" step="0.01" value="0" min="0" max="${totalAmount}" oninput="validateDistribution(${totalAmount})">
            </div>
            
            <div class="form-group">
                <label>Остаток на счёте 76-5:</label>
                <input type="text" id="distribution-balance" value="${totalAmount.toLocaleString()} ₽" readonly style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 8px; border-radius: 4px; width: 100%;">
            </div>
            
            <div class="form-group">
                <label for="distribution-notes">Основание (протокол собрания)</label>
                <input type="text" id="distribution-notes" placeholder="Протокол №___ от «___» ______ 20__ г.">
            </div>
            
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="processDistribution(${totalAmount})">Распределить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
        
        <div id="distribution-error" style="color: red; margin-top: 10px; display: none;"></div>
    `);
}

// Функция проверки корректности распределения
function validateDistribution(totalAmount) {
    const reserve = parseFloat(document.getElementById('reserve-fund').value) || 0;
    const development = parseFloat(document.getElementById('development-fund').value) || 0;
    const business = parseFloat(document.getElementById('business-fund').value) || 0;
    
    const distributed = reserve + development + business;
    const balance = totalAmount - distributed;
    
    document.getElementById('distribution-balance').value = balance.toLocaleString() + ' ₽';
    
    const errorDiv = document.getElementById('distribution-error');
    if (balance < 0) {
        errorDiv.textContent = 'Сумма распределения превышает доступную!';
        errorDiv.style.display = 'block';
        return false;
    } else {
        errorDiv.style.display = 'none';
        return true;
    }
}

// Функция обработки распределения членских взносов
function processDistribution(totalAmount) {
    const date = document.getElementById('distribution-date').value;
    const reserveAmount = parseFloat(document.getElementById('reserve-fund').value) || 0;
    const developmentAmount = parseFloat(document.getElementById('development-fund').value) || 0;
    const businessAmount = parseFloat(document.getElementById('business-fund').value) || 0;
    const notes = document.getElementById('distribution-notes').value || 'Распределение членских взносов';
    
    const distributed = reserveAmount + developmentAmount + businessAmount;
    const balance = totalAmount - distributed;
    
    if (balance < 0) {
        alert('Сумма распределения превышает доступную!');
        return;
    }
    
    // Создаем проводки по распределению
    const newTransactions = [];
    
    if (reserveAmount > 0) {
        newTransactions.push({
            id: generateId(),
            date: date,
            amount: reserveAmount,
            debitAccount: '76-5',
            creditAccount: '86-3',
            description: `${notes} - в резервный фонд`,
            distributionType: 'membership_fees',
            createdAt: new Date().toISOString()
        });
    }
    
    if (developmentAmount > 0) {
        newTransactions.push({
            id: generateId(),
            date: date,
            amount: developmentAmount,
            debitAccount: '76-5',
            creditAccount: '86-4',
            description: `${notes} - в фонд развития`,
            distributionType: 'membership_fees',
            createdAt: new Date().toISOString()
        });
    }
    
    if (businessAmount > 0) {
        newTransactions.push({
            id: generateId(),
            date: date,
            amount: businessAmount,
            debitAccount: '76-5',
            creditAccount: '86-5',
            description: `${notes} - в фонд хоз. деятельности`,
            distributionType: 'membership_fees',
            createdAt: new Date().toISOString()
        });
    }
    
    // Помечаем исходные проводки как распределенные
    transactions.forEach(t => {
        if (t.creditAccount === '76-5' && !t.distributed) {
            t.distributed = true;
            t.distributedAt = new Date().toISOString();
        }
    });
    
    // Добавляем новые проводки
    transactions.push(...newTransactions);
    
    closeModal();
    loadTransactionsData();
    scheduleAutoSave();
    
    alert(`Членские взносы распределены!\n\nСоздано проводок: ${newTransactions.length}`);
}


function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    showModal(`
        <h3>Редактировать бухгалтерскую проводку</h3>
        <form id="transaction-form">
            <input type="hidden" id="transaction-id" value="${transaction.id}">
            <div class="form-row">
                <div class="form-group">
                    <label for="transaction-date">Дата *</label>
                    <input type="date" id="transaction-date" value="${transaction.date}" required>
                </div>
                <div class="form-group">
                    <label for="transaction-amount">Сумма *</label>
                    <input type="number" id="transaction-amount" step="0.01" value="${transaction.amount}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="transaction-debit">Дебет *</label>
                    <input type="text" id="transaction-debit" value="${transaction.debitAccount}" required>
                </div>
                <div class="form-group">
                    <label for="transaction-credit">Кредит *</label>
                    <input type="text" id="transaction-credit" value="${transaction.creditAccount}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="transaction-description">Описание</label>
                <textarea id="transaction-description" rows="3">${transaction.description || ''}</textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="updateTransaction()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

function updateTransaction() {
    const id = document.getElementById('transaction-id').value;
    const date = document.getElementById('transaction-date').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const debitAccount = document.getElementById('transaction-debit').value;
    const creditAccount = document.getElementById('transaction-credit').value;
    const description = document.getElementById('transaction-description').value;
    
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = {
            ...transactions[index],
            date: date,
            amount: amount,
            debitAccount: debitAccount,
            creditAccount: creditAccount,
            description: description,
            updatedAt: new Date().toISOString()
        };
        
        closeModal();
        loadTransactionsData();
        scheduleAutoSave(); // Вызываем автоматическое сохранение
    }
}

function deleteTransaction(id) {
    if (confirm('Вы уверены, что хотите уд��лить эту бухгалтерскую проводку?')) {
        transactions = transactions.filter(t => t.id !== id);
        loadTransactionsData();
        saveData();
    }
}

// Функция просмотра бухгалтерской проводки в боковом меню
function viewTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Получаем информацию о связанной операци��, если есть
    let relatedInfo = '';
    if (transaction.relatedPaymentId) {
        const relatedPayment = payments.find(p => p.id === transaction.relatedPaymentId);
        if (relatedPayment) {
            const member = members.find(m => m.id === relatedPayment.memberId);
            const memberName = member ? member.name : 'Не��звестный';
            
            relatedInfo = `
            <div class="detail-item">
                <label>Связанная операция:</label>
                <span>Паевой взнос от ${memberName}</span>
            </div>
            `;
        }
    }
    
    const content = `
        <div class="transaction-details">
            <h3>Детали бухгалтерской проводки</h3>
            <div class="detail-item">
                <label>ID:</label>
                <span>${transaction.id}</span>
            </div>
            <div class="detail-item">
                <label>Дата:</label>
                <span>${transaction.date}</span>
            </div>
            <div class="detail-item">
                <label>Сумма:</label>
                <span>${(transaction.amount || 0).toLocaleString()} ₽</span>
            </div>
            <div class="detail-item">
                <label>Дебет:</label>
                <span>${transaction.debitAccount}</span>
            </div>
            <div class="detail-item">
                <label>Кредит:</label>
                <span>${transaction.creditAccount}</span>
            </div>
            <div class="detail-item">
                <label>Описание:</label>
                <span>${transaction.description || 'Нет'}</span>
            </div>
            ${relatedInfo}
            
            <div style="margin-top: 1.5rem; text-align: center;">
                <button class="action-button edit" onclick="editTransaction('${transaction.id}')">Редактировать</button>
                <button class="action-button delete" onclick="deleteTransaction('${transaction.id}')">Удалить</button>
                <button class="action-button" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;
    
    showSideMenu(`Проводка: ${transaction.id}`, content);
}

// Функции для работы с документами
function loadDocumentsData() {
    const tbody = document.getElementById('documents-tbody');
    tbody.innerHTML = '';
    
    documents.forEach(doc => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${doc.name}</td>
            <td>${doc.type}</td>
            <td>${doc.date}</td>
            <td>${formatFileSize(doc.size)}</td>
            <td>
                <button class="action-button" onclick="viewDocument('${doc.id}')">Прос������отр</button>
                <button class="action-button delete" onclick="deleteDocument('${doc.id}')">Удалить</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function uploadDocument() {
    showModal(`
        <h3>Загрузить документ</h3>
        <form id="document-form">
            <div class="form-group">
                <label for="document-file">Выберите файл</label>
                <input type="file" id="document-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" required>
            </div>
            <div class="form-group">
                <label for="document-name">Название документа *</label>
                <input type="text" id="document-name" required>
            </div>
            <div class="form-group">
                <label for="document-type">Тип документа</label>
                <select id="document-type">
                    <option value="contract">Договор</option>
                    <option value="report">Отчет</option>
                    <option value="payment">Платежный документ</option>
                    <option value="other">Прочее</option>
                </select>
            </div>
            <div class="form-group">
                <label for="document-description">Описание</label>
                <textarea id="document-description" rows="3"></textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveDocument()">Загрузить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

async function saveDocument() {
    const fileInput = document.getElementById('document-file');
    const name = document.getElementById('document-name').value;
    const type = document.getElementById('document-type').value;
    const description = document.getElementById('document-description').value;
    
    if (!fileInput.files.length || !name) {
        alert('Пожалуйста, выберите файл и введите название документа');
        return;
    }
    
    const file = fileInput.files[0];

    // Проверяем, поддерживается ли File System API
    if (!('showDirectoryPicker' in window)) {
        alert('File System API не поддерживается в вашем браузере. Документ будет сохранен только как метаданные.');
        // Сохраняем только метаданные
        const newDocument = {
            id: generateId(),
            name: name,
            type: type,
            description: description,
            date: new Date().toISOString().split('T')[0],
            size: file.size,
            fileName: file.name,
            mimeType: file.type,
            content: null
        };
        
        documents.push(newDocument);
        closeModal();
        loadDocumentsData();
        saveData();
        return;
    }

    // Проверяем, настроена ли директория
    if (!coopDirectoryHandle) {
        if (!await selectCooperativeDirectory()) {
            return;
        }
    }

    try {
        // Определяем поддиректорию в зависимости от типа документа
        let subdir = 'other';
        switch (type) {
            case 'contract':
                subdir = 'contracts';
                break;
            case 'report':
                subdir = 'reports';
                break;
            case 'payment':
                subdir = 'payments';
                break;
        }

        // Получаем поддиректорию
        const subDirHandle = await coopDirectoryHandle.getDirectoryHandle(subdir);
        
        // Создаем файл в поддиректории
        const fileHandle = await subDirHandle.getFileHandle(file.name, { create: true });
        
        // Записываем содержимое файла
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        // Создаем запись в системе (метаданные)
        const newDocument = {
            id: generateId(),
            name: name,
            type: type,
            description: description,
            date: new Date().toISOString().split('T')[0],
            size: file.size,
            fileName: file.name,
            mimeType: file.type,
            // Путь к файлу для будущего использования
            filePath: `${subdir}/${file.name}`,
            content: null
        };

        documents.push(newDocument);
        closeModal();
        loadDocumentsData();
        saveData(); // Сохраняем метаданные
        
        alert('Документ успешно сохранен в папке C:\\КООПЕРАНТ!');
    } catch (err) {
        console.error('Ошибка при сохранении до��умента:', err);
        alert('Ошибка при сохранении документа: ' + err.message);
    }
}

// Функция для выбора директории C:\КООПЕРАНТ
async function selectCooperativeDirectory() {
    try {
        // Запрашиваем доступ к директории
        coopDirectoryHandle = await window.showDirectoryPicker({
            id: 'coop_documents',
            mode: 'readwrite'
        });

        // Проверяем, что это нужная директория
        if (coopDirectoryHandle.name !== 'КООПЕРАНТ') {
            alert('Пожалуйста, выберите папку C:\\КООПЕРАНТ для хранения документов');
            return false;
        }

        // Создаем поддиректории для разных типов документов
        await createDocumentDirectories(coopDirectoryHandle);

        alert('Директория для хранения документов успешно настроена!');
        return true;
    } catch (err) {
        console.error('Ошибка при выборе директории:', err);
        alert('Не удалось получить доступ к директории. Убедитесь, что вы выбрали папку C:\\КООПЕРАНТ');
        return false;
    }
}

// Функция для создания поддиректорий
async function createDocumentDirectories(directoryHandle) {
    const subdirs = ['Contracts', 'Reports', 'Payments', 'Other'];
    
    for (const subdir of subdirs) {
        try {
            await directoryHandle.getDirectoryHandle(subdir, { create: true });
        } catch (err) {
            console.error(`Ошибка при создании поддиректории ${subdir}:`, err);
        }
    }
}

// Функция для настройки хранения документов
async function setupDocumentStorage() {
    await selectCooperativeDirectory();
    closeSideMenu();
}

// Функция для открытия файла документа
async function openDocumentFile(filePath, docType) {
    try {
        if (!coopDirectoryHandle) {
            alert('Пожалуйста, сначала настройте хранение документов');
            return;
        }
        
        const parts = filePath.split('/');
        const subdir = parts[0];
        const filename = parts[1];
        
        // Получаем поддиректорию
        const subDirHandle = await coopDirectoryHandle.getDirectoryHandle(subdir);
        
        // Получаем файл
        const fileHandle = await subDirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        
        // Создаем URL для открытия файла
        const url = URL.createObjectURL(file);
        
        // Открываем файл в новой вкладке
        window.open(url, '_blank');
        
        // Очищаем URL после использования
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
        console.error('Ошибка при открытии файла:', err);
        alert('Не удалось открыть файл: ' + err.message);
    }
}

function viewDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    // Создаем HTML для просмотра документа с возможностью открытия файла
    let fileActions = '';
    if (coopDirectoryHandle) {
        fileActions = `
            <button type="button" onclick="openDocumentFile('${doc.filePath}', '${doc.type}')" class="action-button">Открыть файл</button>
            <button type="button" onclick="downloadDocument('${id}')" class="action-button">Скачать</button>
        `;
    } else {
        fileActions = '<button type="button" onclick="setupDocumentStorage()" class="action-button">Настроить хранение</button>';
    }

    const content = `
        <div class="document-details">
            <h3>Детали документа</h3>
            <div class="detail-item">
                <label>ID:</label>
                <span>${doc.id}</span>
            </div>
            <div class="detail-item">
                <label>Название:</label>
                <span>${doc.name}</span>
            </div>
            <div class="detail-item">
                <label>Тип:</label>
                <span>${doc.type}</span>
            </div>
            <div class="detail-item">
                <label>Дата:</label>
                <span>${doc.date}</span>
            </div>
            <div class="detail-item">
                <label>Размер:</label>
                <span>${formatFileSize(doc.size)}</span>
            </div>
            <div class="detail-item">
                <label>Описание:</label>
                <span>${doc.description || 'Не указано'}</span>
            </div>
            <div class="detail-item">
                <label>Имя файла:</label>
                <span>${doc.fileName}</span>
            </div>
            
            <div style="margin-top: 1.5rem; text-align: center;">
                ${fileActions}
                <button type="button" onclick="deleteDocument('${id}')" class="action-button delete">Удалить</button>
                <button type="button" onclick="closeSideMenu()" class="action-button">Закрыть</button>
            </div>
        </div>
    `;

    showSideMenu(`Документ: ${doc.name}`, content);
}

// Модифи��ированная функция скачивания документа
async function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    try {
        if (!coopDirectoryHandle) {
            alert('Пожалуйста, сначала настройте хранение документов');
            return;
        }
        
        const parts = doc.filePath.split('/');
        const subdir = parts[0];
        const filename = parts[1];
        
        // Получаем поддиректорию
        const subDirHandle = await coopDirectoryHandle.getDirectoryHandle(subdir);
        
        // Получаем файл
        const fileHandle = await subDirHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        
        // Создаем ссылку для скачивания
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    } catch (err) {
        console.error('Ошибка при скачивании файла:', err);
        alert('Не удалось скачать файл: ' + err.message);
    }
}

function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    alert(`В реальном приложении документ "${doc.name}" будет скачан с использованием File System API`);
    closeSideMenu();
}

// Модифицированная функция удаления документа
async function deleteDocument(id) {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) {
        return;
    }
    
    const docIndex = documents.findIndex(d => d.id === id);
    if (docIndex === -1) return;
    
    const doc = documents[docIndex];
    
    try {
        // Если директория документов настроена, удаляем файл физически
        if (coopDirectoryHandle && doc.filePath) {
            const parts = doc.filePath.split('/');
            const subdir = parts[0];
            const filename = parts[1];
            
            // Получаем поддиректорию
            const subDirHandle = await coopDirectoryHandle.getDirectoryHandle(subdir);
            
            // Удаляем файл
            await subDirHandle.removeEntry(filename);
        }
        
        // Удаляем запись из системы
        documents.splice(docIndex, 1);
        loadDocumentsData();
        saveData();
    } catch (err) {
        console.error('Ошибка при удалении файла:', err);
        // Даже если физическое удаление не удалось, удаляем запись из системы
        documents.splice(docIndex, 1);
        loadDocumentsData();
        saveData();
        alert('Документ удален из системы, но произошла ошибка при удалении физичес��ого файла: ' + err.message);
    }
}

// Функции для генерации отчетов

// Функция для отображения официального бухгалтерского баланса
function showOfficialBalanceSheet() {
    const balanceSheet = generateOfficialBalanceSheet();

    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>БУХГАЛТЕРСКИЙ БАЛАНС</h2>
                <p>Форма № 1</p>
                <p>Организация: Потребительский кооператив</p>
                <p>Отчетный период: ${balanceSheet.header.period}</p>
                <p>Единицы измерения: руб.</p>
            </div>

            <div class="balance-sheet-content">
                <h3>АКТИВ</h3>
                <table class="balance-table">
                    <tr><th>Показатель</th><th>Код</th><th>На конец периода</th></tr>
                    <tr><td>Внеоборотные активы</td><td>1100</td><td class="amount">${balanceSheet.assets.nonCurrentAssets.total.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. основные средства</td><td>1150</td><td class="amount">${balanceSheet.assets.nonCurrentAssets.inventories.endOfYear.toLocaleString()}</td></tr>
                    <tr><td>Оборотные активы</td><td>1200</td><td class="amount">${balanceSheet.assets.currentAssets.total.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. дебиторская задолженность</td><td>1230</td><td class="amount">${balanceSheet.assets.currentAssets.accountsReceivable.endOfYear.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. денежные средства</td><td>1250</td><td class="amount">${balanceSheet.assets.currentAssets.cashAndCashEquivalents.endOfYear.toLocaleString()}</td></tr>
                    <tr class="total-row"><td>БАЛАНС</td><td>1600</td><td class="amount">${balanceSheet.assets.total.toLocaleString()}</td></tr>
                </table>

                <h3>ПАССИВ</h3>
                <table class="balance-table">
                    <tr><th>Показатель</th><th>Код</th><th>На конец периода</th></tr>
                    <tr><td>Капитал и резервы</td><td>1300</td><td class="amount">${balanceSheet.liabilitiesAndEquity.equity.total.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. паевой фонд</td><td>1310</td><td class="amount">${balanceSheet.liabilitiesAndEquity.equity.shareCapital.endOfYear.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. неделимый фонд</td><td>1320</td><td class="amount">${balanceSheet.liabilitiesAndEquity.equity.indivisibleFund.endOfYear.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. резервный фонд</td><td>1330</td><td class="amount">${balanceSheet.liabilitiesAndEquity.equity.reserveFund.endOfYear.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. фонд развития</td><td>1340</td><td class="amount">${balanceSheet.liabilitiesAndEquity.equity.developmentFund.endOfYear.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. нераспределенная прибыль</td><td>1370</td><td class="amount">${balanceSheet.liabilitiesAndEquity.equity.retainedEarnings.endOfYear.toLocaleString()}</td></tr>
                    <tr><td>Долгосрочные обязательства</td><td>1400</td><td class="amount">${balanceSheet.liabilitiesAndEquity.longTermLiabilities.total.toLocaleString()}</td></tr>
                    <tr><td>Краткосрочные обязательства</td><td>1500</td><td class="amount">${balanceSheet.liabilitiesAndEquity.shortTermLiabilities.total.toLocaleString()}</td></tr>
                    <tr class="indent"><td>в т.ч. кредиторская задолженность</td><td>1520</td><td class="amount">${balanceSheet.liabilitiesAndEquity.shortTermLiabilities.accountsPayable.endOfYear.toLocaleString()}</td></tr>
                    <tr class="total-row"><td>БАЛАНС</td><td>1700</td><td class="amount">${balanceSheet.liabilitiesAndEquity.total.toLocaleString()}</td></tr>
                </table>
            </div>

            <div class="report-actions">
                <button class="action-button" onclick="exportBalanceSheetAsExcel()">Экспорт в Excel</button>
                <button class="action-button" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Распределение взносов по фондам', content);
}

// Функция для генерации структуры бухгалтерского баланса
function generateOfficialBalanceSheet() {
    const currentDate = new Date();
    const reportingPeriod = currentDate.getFullYear() + '-12-31';

    // Расчет денежных средств (счёт 50 + 51)
    // Учитываем все поступления и выплаты
    const totalCashIncoming = transactions
        .filter(t => (t.debitAccount === '50' || t.debitAccount === '51') && t.type !== 'return')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCashOutgoing = transactions
        .filter(t => t.creditAccount === '50' || t.creditAccount === '51')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    const cashEnd = totalCashIncoming - totalCashOutgoing;

    // Расчет дебиторской задолженности (неоплаченные взносы)
    const accountsReceivableEnd = payments
        .filter(p => !p.paid && p.type !== 'return_share')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Расчет внеоборотных активов (счёт 01, 08)
    const nonCurrentAssets = transactions
        .filter(t => t.debitAccount && (t.debitAccount.startsWith('01') || t.debitAccount.startsWith('08')))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Расчет паевого фонда (счёт 86-1)
    const shareCapitalEnd = transactions
        .filter(t => t.creditAccount === '86-1')
        .reduce((sum, t) => sum + (t.amount || 0), 0) -
        transactions
            .filter(t => t.debitAccount === '86-1')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Расчет неделимого фонда (счёт 86-2)
    const indivisibleFundEnd = transactions
        .filter(t => t.creditAccount === '86-2')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Расчет резервного фонда (счёт 82 или 86-3)
    const reserveFundEnd = transactions
        .filter(t => t.creditAccount === '82' || t.creditAccount === '86-3')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Расчет фонда развития (счёт 86-4)
    const developmentFundEnd = transactions
        .filter(t => t.creditAccount === '86-4')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Расчет нераспределенной прибыли (счёт 84)
    // Прибыль от деятельности (счёт 99, 84)
    const profitEnd = transactions
        .filter(t => t.creditAccount === '99' || t.creditAccount === '84')
        .reduce((sum, t) => sum + (t.amount || 0), 0) -
        transactions
            .filter(t => t.debitAccount === '99' || t.debitAccount === '84')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Итого капитал и резервы
    const totalEquity = shareCapitalEnd + indivisibleFundEnd + reserveFundEnd + developmentFundEnd + profitEnd;

    // Расчет кредиторской задол��енности (счета 60, 62, 76)
    const accountsPayable = transactions
        .filter(t => t.creditAccount && (t.creditAccount.startsWith('60') || t.creditAccount.startsWith('62') || t.creditAccount.startsWith('76')))
        .reduce((sum, t) => sum + (t.amount || 0), 0) -
        transactions
            .filter(t => t.debitAccount && (t.debitAccount.startsWith('60') || t.debitAccount.startsWith('62') || t.debitAccount.startsWith('76')))
            .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
        header: { period: reportingPeriod },
        assets: {
            nonCurrentAssets: { 
                inventories: { endOfYear: nonCurrentAssets },
                total: nonCurrentAssets 
            },
            currentAssets: {
                inventories: { endOfYear: 0 },
                accountsReceivable: { endOfYear: accountsReceivableEnd },
                cashAndCashEquivalents: { endOfYear: Math.max(0, cashEnd) },
                total: accountsReceivableEnd + Math.max(0, cashEnd)
            },
            total: nonCurrentAssets + accountsReceivableEnd + Math.max(0, cashEnd)
        },
        liabilitiesAndEquity: {
            equity: {
                shareCapital: { endOfYear: shareCapitalEnd, name: 'Паевой фонд' },
                indivisibleFund: { endOfYear: indivisibleFundEnd, name: 'Неделимый фонд' },
                reserveFund: { endOfYear: reserveFundEnd, name: 'Резервн��й фонд' },
                developmentFund: { endOfYear: developmentFundEnd, name: 'Фонд развития' },
                retainedEarnings: { endOfYear: profitEnd, name: 'Нераспределенная прибыль' },
                total: totalEquity
            },
            longTermLiabilities: { total: 0 },
            shortTermLiabilities: { 
                accountsPayable: { endOfYear: Math.max(0, accountsPayable) },
                total: Math.max(0, accountsPayable) 
            },
            total: totalEquity + Math.max(0, accountsPayable)
        }
    };
}

// Функция для экспорта баланса в Excel
function exportBalanceSheetAsExcel() {
    alert('Функция экспорта баланса в Excel будет реализована с использованием библиотеки SheetJS');
}

// Функция для отображения отчета о финансовых результатах
function showOfficialProfitLossStatement() {
    const profitLoss = generateOfficialProfitLossStatement();
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>ОТЧЕТ О ФИНАНСОВЫХ РЕЗУЛЬТАТАХ</h2>
                <p>Форма № 2</p>
                <p>Организация: Потребительский кооператив</p>
                <p>Отчетный период: ${profitLoss.header.period}</p>
            </div>
            
            <table class="profit-loss-table">
                <tr><th>Показатель</th><th>Код</th><th>За ��тчетный период</th></tr>
                <tr><td>Выручка</td><td>2110</td><td class="amount">${profitLoss.revenue.currentYear.toLocaleString()}</td></tr>
                <tr><td>Себестоимость продаж</td><td>2120</td><td class="amount">${profitLoss.costOfGoodsSold.currentYear.toLocaleString()}</td></tr>
                <tr class="subtotal-row"><td>Валовая прибыль</td><td>2100</td><td class="amount">${profitLoss.grossProfit.currentYear.toLocaleString()}</td></tr>
                <tr><td>Управленческие расходы</td><td>2210</td><td class="amount">${profitLoss.administrativeExpenses.currentYear.toLocaleString()}</td></tr>
                <tr class="subtotal-row"><td>Прибыль от продаж</td><td>2200</td><td class="amount">${profitLoss.operatingIncome.currentYear.toLocaleString()}</td></tr>
                <tr><td>Прочие доходы</td><td>2310</td><td class="amount">${profitLoss.otherIncome.currentYear.toLocaleString()}</td></tr>
                <tr><td>Прочие расходы</td><td>2350</td><td class="amount">${profitLoss.otherNonOperatingExpenses.currentYear.toLocaleString()}</td></tr>
                <tr class="subtotal-row"><td>Прибыль до налогообложения</td><td>2300</td><td class="amount">${profitLoss.profitBeforeTax.currentYear.toLocaleString()}</td></tr>
                <tr><td>Налог на прибыль</td><td>2430</td><td class="amount">${profitLoss.taxExpense.currentYear.toLocaleString()}</td></tr>
                <tr class="total-row"><td>Чистая прибыль</td><td>2400</td><td class="amount">${profitLoss.netIncome.currentYear.toLocaleString()}</td></tr>
            </table>
            
            <div class="report-actions">
                <button class="action-button" onclick="exportProfitLossAsExcel()">Экспорт в Excel</button>
                <button class="action-button" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция для генерации структуры отчета о финансовых результатах
function generateOfficialProfitLossStatement() {
    const currentDate = new Date();
    const reportingPeriod = currentDate.getFullYear() + '-12-31';
    const currentYear = currentDate.getFullYear();

    // ВАЖНО: Паевые, вступительные, членские взносы НЕ являются доходом
    // Это целевое финансирование (п. 10 ст. 251 НК РФ)
    // Доходом является только выручка от предпринимательской деятельности
    
    // Выручка от реализации товаров/услуг (счёт 90)
    // В текущей реализации считаем по проводкам Дт 90-1 (выручка)
    const revenue = transactions.filter(t => 
        t.date && 
        new Date(t.date).getFullYear() === currentYear &&
        t.debitAccount && 
        (t.debitAccount.startsWith('50') || t.debitAccount.startsWith('51') || t.debitAccount.startsWith('62')) &&
        t.creditAccount && 
        (t.creditAccount.startsWith('90') || t.creditAccount.startsWith('62'))
    ).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Себестоимость продаж (счёт 90-2)
    const costOfGoodsSold = transactions.filter(t => 
        t.date && 
        new Date(t.date).getFullYear() === currentYear &&
        t.debitAccount && t.debitAccount.startsWith('90') &&
        t.creditAccount && (t.creditAccount.startsWith('41') || t.creditAccount.startsWith('43') || t.creditAccount.startsWith('20'))
    ).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Валовая прибыль
    const grossProfit = revenue - costOfGoodsSold;

    // Управленческие расходы (счёт 26, 44)
    const administrativeExpenses = transactions.filter(t => 
        t.date && 
        new Date(t.date).getFullYear() === currentYear &&
        t.debitAccount && (t.debitAccount.startsWith('26') || t.debitAccount.startsWith('44') || t.debitAccount.startsWith('91')) &&
        t.creditAccount && (t.creditAccount.startsWith('60') || t.creditAccount.startsWith('70') || t.creditAccount.startsWith('69') || t.creditAccount.startsWith('10'))
    ).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Прибыль от продаж
    const operatingIncome = grossProfit - administrativeExpenses;

    // Прочие доходы (счёт 91-1)
    const otherIncome = transactions.filter(t => 
        t.date && 
        new Date(t.date).getFullYear() === currentYear &&
        t.creditAccount && t.creditAccount.startsWith('91') &&
        t.debitAccount && (t.debitAccount.startsWith('50') || t.debitAccount.startsWith('51') || t.debitAccount.startsWith('76'))
    ).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Прочие расходы (счёт 91-2)
    const otherNonOperatingExpenses = transactions.filter(t => 
        t.date && 
        new Date(t.date).getFullYear() === currentYear &&
        t.debitAccount && t.debitAccount.startsWith('91') &&
        t.creditAccount && (t.creditAccount.startsWith('50') || t.creditAccount.startsWith('51') || t.creditAccount.startsWith('76'))
    ).reduce((sum, t) => sum + (t.amount || 0), 0);

    // Прибыль до налогообложения
    const profitBeforeTax = operatingIncome + otherIncome - otherNonOperatingExpenses;

    // Налог на прибыль / УСН
    // Получаем настройку системы налогообложения
    const taxSystem = getTaxSystem();
    let taxExpense = 0;
    
    if (profitBeforeTax > 0) {
        if (taxSystem === 'USN_6') {
            // УСН "Доходы" 6%
            taxExpense = revenue * 0.06;
        } else if (taxSystem === 'USN_15') {
            // УСН "Доходы-Расходы" 15%
            const taxableBase = Math.max(0, revenue - costOfGoodsSold - administrativeExpenses);
            taxExpense = taxableBase * 0.15;
        } else {
            // ОСНО - налог на прибыль 20%
            taxExpense = profitBeforeTax * 0.20;
        }
    }

    // Чистая прибыль
    const netIncome = profitBeforeTax - taxExpense;

    return {
        header: { period: reportingPeriod },
        revenue: { code: '2110', currentYear: revenue, previousYear: 0 },
        costOfGoodsSold: { code: '2120', currentYear: costOfGoodsSold, previousYear: 0 },
        grossProfit: { code: '2100', currentYear: grossProfit, previousYear: 0 },
        administrativeExpenses: { code: '2210', currentYear: administrativeExpenses, previousYear: 0 },
        operatingIncome: { code: '2200', currentYear: operatingIncome, previousYear: 0 },
        otherIncome: { code: '2310', currentYear: otherIncome, previousYear: 0 },
        otherNonOperatingExpenses: { code: '2350', currentYear: otherNonOperatingExpenses, previousYear: 0 },
        profitBeforeTax: { code: '2300', currentYear: profitBeforeTax, previousYear: 0 },
        taxExpense: { code: '2430', currentYear: taxExpense, previousYear: 0 },
        netIncome: { code: '2400', currentYear: netIncome, previousYear: 0 }
    };
}

// Функция для экспорта отчета о финансовых результатах в Excel
function exportProfitLossAsExcel() {
    alert('Функция экспорта отчета о финансовых результатах в Excel будет реализована с использованием библиотеки SheetJS');
}

// Функция для отображения отчета о целевом использовании средств
function showTargetUseReport() {
    const targetUse = generateTargetUseReport();
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>ОТЧЕТ О ЦЕЛЕВОМ ИСПОЛЬЗОВАНИИ СРЕДСТВ</h2>
                <p>Организация: Потребительский кооператив</p>
                <p>Отчетный период: ${targetUse.header.period}</p>
            </div>
            
            <table class="target-use-table">
                <tr><th>Наименование</th><th>На начало года</th><th>Поступило</th><th>Использовано</th><th>Остаток</th></tr>
                <tr><td>Целевые паевые взносы</td><td class="amount">${targetUse.targetReceipts.memberContributions.beginningOfYear.toLocaleString()}</td><td class="amount">${targetUse.targetReceipts.memberContributions.receivedDuringYear.toLocaleString()}</td><td class="amount">${targetUse.targetReceipts.memberContributions.usedDuringYear.toLocaleString()}</td><td class="amount">${targetUse.targetReceipts.memberContributions.endOfYear.toLocaleString()}</td></tr>
                <tr class="total-row"><td>Всего поступлений</td><td class="amount">${targetUse.targetReceipts.total.beginningOfYear.toLocaleString()}</td><td class="amount">${targetUse.targetReceipts.total.receivedDuringYear.toLocaleString()}</td><td class="amount">${targetUse.targetReceipts.total.usedDuringYear.toLocaleString()}</td><td class="amount">${targetUse.targetReceipts.total.endOfYear.toLocaleString()}</td></tr>
                <tr><td>Приобретение основных средств</td><td class="amount">0</td><td class="amount">0</td><td class="amount">0</td><td class="amount">0</td></tr>
                <tr class="total-row"><td>Всего расходов</td><td class="amount">0</td><td class="amount">0</td><td class="amount">0</td><td class="amount">0</td></tr>
            </table>
            
            <div class="report-actions">
                <button class="action-button" onclick="exportTargetUseReportAsExcel()">Экспорт в Excel</button>
                <button class="action-button" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция для генерации структуры отчета о целевом использовании средств
function generateTargetUseReport() {
    const currentDate = new Date();
    const reportingPeriod = currentDate.getFullYear() + '-12-31';
    const currentYear = currentDate.getFullYear();
    
    // Расчет целевых поступлений
    const targetReceipts = payments.filter(p => p.paid && p.date && new Date(p.date).getFullYear() === currentYear && p.type === 'targeted')
                                   .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return {
        header: { period: reportingPeriod },
        targetReceipts: {
            memberContributions: { beginningOfYear: 0, receivedDuringYear: targetReceipts, usedDuringYear: 0, endOfYear: targetReceipts },
            total: { beginningOfYear: 0, receivedDuringYear: targetReceipts, usedDuringYear: 0, endOfYear: targetReceipts }
        },
        targetExpenditures: {
            total: { planned: 0, spent: 0, remaining: 0 }
        },
        targetBalance: {
            total: { beginningOfYear: 0, receivedDuringYear: targetReceipts, usedDuringYear: 0, endOfYear: targetReceipts }
        },
        complianceCheck: { receiptsMatchExpenditures: true, complianceLevel: 'Высокий', recommendations: [] }
    };
}

// Функция для экспорта отчета о целевом использовании средств в Excel
function exportTargetUseReportAsExcel() {
    alert('Функция экспорта отчета о целевом использовании средств в Excel будет реализована с использованием библиотеки SheetJS');
}

// Функция для отображения настроек системы налогообложения
function showTaxSystemSettings() {
    const currentSystem = getTaxSystem();
    
    const content = `
        <div class="settings-container">
            <h3>Настройки системы налогообложения</h3>
            
            <div class="info-box" style="background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <h4>📋 Информация</h4>
                <p>Выбранная система налогообложения влияет на расчет налога в Отчете о финансовых результатах.</p>
                <ul style="margin: 10px 0;">
                    <li><strong>УСН "Доходы" (6%)</strong> — налог уплачивается с суммы всех доходов</li>
                    <li><strong>УСН "Доходы-Расходы" (15%)</strong> — налог уплачивается с разницы между доходами и расходами</li>
                    <li><strong>ОСНО</strong> — общий режим налогообложения (налог на прибыль 20%)</li>
                </ul>
                <p class="important" style="color: #d32f2f;">⚠️ Паевые, вступительные и членские взносы не являются доходом и не облагаются налогом (п. 10 ст. 251 НК РФ).</p>
            </div>
            
            <form id="tax-system-form">
                <div class="form-group">
                    <label>Текущая система:</label>
                    <div style="padding: 10px; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 15px;">
                        <strong>${getTaxSystemName(currentSystem)}</strong>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="tax-system-select">Выберите систему налогообложения:</label>
                    <select id="tax-system-select" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 14px;">
                        <option value="USN_6" ${currentSystem === 'USN_6' ? 'selected' : ''}>УСН "Доходы" (6%)</option>
                        <option value="USN_15" ${currentSystem === 'USN_15' ? 'selected' : ''}>УСН "Доходы-Расходы" (15%)</option>
                        <option value="OSNO" ${currentSystem === 'OSNO' ? 'selected' : ''}>ОСНО (налог на прибыль 20%)</option>
                    </select>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveTaxSystemSettings()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция для получения названия системы налогообложения
function getTaxSystemName(system) {
    const names = {
        'USN_6': 'УСН "Доходы" (6%)',
        'USN_15': 'УСН "Доходы-Расходы" (15%)',
        'OSNO': 'ОСНО (налог на прибыль 20%)'
    };
    return names[system] || system;
}

// Функция для сохранения настроек системы налогообложения
function saveTaxSystemSettings() {
    const newSystem = document.getElementById('tax-system-select').value;
    
    if (setTaxSystem(newSystem)) {
        closeModal();
        alert(`Система налогообложения изменена на ${getTaxSystemName(newSystem)}`);
    } else {
        alert('Ошибка при сохранении настроек');
    }
}


function generateReport(reportType) {
    let reportContent = '';

    switch(reportType) {
        case 'members':
            reportContent = generateMembersReport();
            break;
        case 'payments':
            reportContent = generatePaymentsReport();
            break;
        case 'accounting':
            reportContent = generateAccountingReport();
            break;
        case 'financial':
            reportContent = generateFinancialReport();
            break;
        case 'balance_sheet':
            showOfficialBalanceSheet();
            return;
        case 'profit_loss':
            showOfficialProfitLossStatement();
            return;
        case 'target_use':
            showTargetUseReport();
            return;
        case 'debt_report':
            generateDebtReport();
            return;
        case 'share_return_report':
            generateShareReturnReport();
            return;
        default:
            reportContent = '<p>Неизвестный тип отчета</p>';
    }

    document.getElementById('report-output').innerHTML = reportContent;
}

function generateMembersReport() {
    let content = '<h3>Отчет по пайщикам</h3>';
    content += `<p>Всего пайщиков: ${members.length}</p>`;
    content += '<table><thead><tr><th>ID</th><th>ФИО</th><th>Статус</th><th>Дата вступления</th></tr></thead><tbody>';
    
    members.forEach(member => {
        content += `<tr><td>${member.id}</td><td>${member.name}</td><td>${getStatusText(member.status)}</td><td>${member.joinDate}</td></tr>`;
    });
    
    content += '</tbody></table>';
    return content;
}

function generatePaymentsReport() {
    let content = '<h3>Отчет по паевым взносам</h3>';
    
    // Подсчет общего количества взносов и возвратов
    const totalPayments = payments.filter(p => p.type !== 'return_share').length;
    const totalReturns = payments.filter(p => p.type === 'return_share').length;
    const totalAll = payments.length;
    
    content += `<p>Всего операций: ${totalAll}</p>`;
    content += `<p>Всего взносов: ${totalPayments}</p>`;
    content += `<p>Всего возвратов: ${totalReturns}</p>`;
    
    // Подсчет по типам взносов
    const paymentTypes = {};
    payments.forEach(payment => {
        if (!paymentTypes[payment.type]) {
            paymentTypes[payment.type] = { count: 0, total: 0 };
        }
        paymentTypes[payment.type].count++;
        paymentTypes[payment.type].total += payment.amount || 0;
    });
    
    content += '<h4>Статистика по типам операций:</h4><ul>';
    for (const [type, stats] of Object.entries(paymentTypes)) {
        content += `<li>${getPaymentTypeText(type)}: ${stats.count} шт., на сумму ${stats.total.toLocaleString()} ₽</li>`;
    }
    content += '</ul>';
    
    content += '<table><thead><tr><th>ID</th><th>Пайщик</th><th>Тип</th><th>Метод</th><th>Сумма</th><th>Дата</th><th>Статус</th></tr></thead><tbody>';
    
    payments.forEach(payment => {
        const member = members.find(m => m.id === payment.memberId);
        const memberName = member ? member.name : 'Неизвестный';
        
        // Определяем отображение суммы или описания имущества
        let amountDisplay = '';
        if (payment.method === 'property') {
            if (!payment.amount || payment.amount === 0) {
                amountDisplay = `<span style="color:red;">Не оценено</span>`;
            } else {
                amountDisplay = `${(payment.amount || 0).toLocaleString()} ₽`;
            }
        } else {
            amountDisplay = `${(payment.amount || 0).toLocaleString()} ₽`;
        }
        
        const methodText = getPaymentMethodText(payment.method);
        
        content += `<tr><td>${payment.id}</td><td>${memberName}</td><td>${getPaymentTypeText(payment.type)}</td><td>${methodText}</td><td>${amountDisplay}</td><td>${payment.date}</td><td>${payment.paid ? 'Оплачено' : 'Не оплачено'}</td></tr>`;
    });
    
    content += '</tbody></table>';
    return content;
}

function generateAccountingReport() {
    let content = '<h3>Бухгалтерский баланс</h3>';
    content += `<p>Всего проводок: ${transactions.length}</p>`;
    
    // Подсчет оборотов по дебету и кредиту
    const debitTotal = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const creditTotal = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    content += `<p>Оборот по дебету: ${debitTotal.toLocaleString()} ₽</p>`;
    content += `<p>Оборот по кредиту: ${creditTotal.toLocaleString()} ₽</p>`;
    content += `<p>Сальдо: ${(debitTotal - creditTotal).toLocaleString()} ₽</p>`;
    
    // Подсчет по типам проводок
    const transactionTypes = {
        incoming: { count: 0, total: 0 }, // Взносы
        outgoing: { count: 0, total: 0 }  // Возвраты
    };
    
    transactions.forEach(transaction => {
        if (transaction.transactionType === 'return') {
            transactionTypes.outgoing.count++;
            transactionTypes.outgoing.total += transaction.amount || 0;
        } else {
            transactionTypes.incoming.count++;
            transactionTypes.incoming.total += transaction.amount || 0;
        }
    });
    
    content += '<h4>Статистика по типам проводок:</h4><ul>';
    content += `<li>Проводки поступления: ${transactionTypes.incoming.count} шт., на сумму ${transactionTypes.incoming.total.toLocaleString()} ₽</li>`;
    content += `<li>Проводки возврата: ${transactionTypes.outgoing.count} шт., на сумму ${transactionTypes.outgoing.total.toLocaleString()} ₽</li>`;
    content += '</ul>';
    
    content += '<table><thead><tr><th>ID</th><th>Дата</th><th>Дебет</th><th>Кредит</th><th>Сумма</th><th>Описание</th><th>Тип операции</th></tr></thead><tbody>';
    
    transactions.forEach(transaction => {
        let operationType = 'Поступление';
        if (transaction.transactionType === 'return') {
            operationType = 'Возврат';
        } else if (transaction.relatedPaymentId) {
            const relatedPayment = payments.find(p => p.id === transaction.relatedPaymentId);
            if (relatedPayment && relatedPayment.type === 'return_share') {
                operationType = 'Возврат';
            }
        }
        
        content += `<tr><td>${transaction.id}</td><td>${transaction.date}</td><td>${transaction.debitAccount}</td><td>${transaction.creditAccount}</td><td>${(transaction.amount || 0).toLocaleString()} ₽</td><td>${transaction.description}</td><td>${operationType}</td></tr>`;
    });
    
    content += '</tbody></table>';
    return content;
}

function generateFinancialReport() {
    let content = '<h3>Отчет о финансовых результатах</h3>';

    // Простой пример финансового отчета
    const totalIncome = payments.filter(p => p.paid && p.type !== 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = payments.filter(p => p.type === 'return_share').reduce((sum, p) => sum + (p.amount || 0), 0);

    content += `<p>Всего поступлений: ${totalIncome.toLocaleString()} ₽</p>`;
    content += `<p>Всего расходов (возвратов): ${totalExpenses.toLocaleString()} ₽</p>`;
    content += `<p>Финансовый результат: ${(totalIncome - totalExpenses).toLocaleString()} ₽</p>`;

    return content;
}

// Функция для генерации отчета о задолженностях
function generateDebtReport() {
    let content = '<h3>Отчет о задолженностях пайщиков</h3>';
    
    // Фильтруем неоплаченные паевые взносы
    const unpaidPayments = payments.filter(p => !p.paid && p.type !== 'return_share' && !p.expected);
    const totalDebt = unpaidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    content += `<p>Общая задолженность: ${totalDebt.toLocaleString()} ₽</p>`;
    content += `<p>Количество должников: ${new Set(unpaidPayments.map(p => p.memberId)).size}</p>`;
    
    if (unpaidPayments.length > 0) {
        content += '<table class="balance-table"><thead><tr><th>Пайщик</th><th>Тип взноса</th><th>Сумма</th><th>Дата</th><th>Описание</th></tr></thead><tbody>';
        
        unpaidPayments.forEach(payment => {
            const member = members.find(m => m.id === payment.memberId);
            const memberName = member ? member.name : 'Неизвестный';
            
            content += `<tr><td>${memberName}</td><td>${getPaymentTypeText(payment.type)}</td><td>${(payment.amount || 0).toLocaleString()} ₽</td><td>${payment.date}</td><td>${payment.description || ''}</td></tr>`;
        });
        
        content += '</tbody></table>';
    } else {
        content += '<p style="color: green; font-weight: bold;">Задолженностей не обнаружено</p>';
    }
    
    document.getElementById('report-output').innerHTML = content;
}

// Функция для генерации отчета о возвратах паевых взносов
function generateShareReturnReport() {
    let content = '<h3>Отчет о возвратах паевых взносов</h3>';
    
    // Фильтруем возвраты паевых взносов
    const returnPayments = payments.filter(p => p.type === 'return_share');
    const totalReturns = returnPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    content += `<p>Общая сумма возвратов: ${totalReturns.toLocaleString()} ₽</p>`;
    content += `<p>Количество возвратов: ${returnPayments.length}</p>`;
    
    if (returnPayments.length > 0) {
        content += '<table class="balance-table"><thead><tr><th>Пайщик</th><th>Сумма</th><th>Дата</th><th>Метод возврата</th><th>Описание</th></tr></thead><tbody>';
        
        returnPayments.forEach(payment => {
            const member = members.find(m => m.id === payment.memberId);
            const memberName = member ? member.name : 'Неизвестный';
            
            content += `<tr><td>${memberName}</td><td>${(payment.amount || 0).toLocaleString()} ₽</td><td>${payment.date}</td><td>${getPaymentMethodText(payment.method)}</td><td>${payment.description || ''}</td></tr>`;
        });
        
        content += '</tbody></table>';
    } else {
        content += '<p>Возвратов паевых взносов не обнаружено</p>';
    }
    
    document.getElementById('report-output').innerHTML = content;
}

// Функция для отображения Ведомости движения фондов
function showFundsMovementReport() {
    const fundsMovement = calculateFundsMovement();
    
    const content = `
        <div class="official-report-container">
            <div class="report-header">
                <h2>ВЕДОМОСТЬ ДВИЖЕНИЯ ФОНДОВ</h2>
                <p>Потребительский кооператив</p>
                <p>Отчетный период: ${fundsMovement.period}</p>
            </div>
            
            <table class="balance-table">
                <thead>
                    <tr>
                        <th>Фонд</th>
                        <th>Счёт</th>
                        <th>Остаток на начало</th>
                        <th>Поступило</th>
                        <th>Выбыло</th>
                        <th>Остаток на конец</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Паевой фонд</strong></td>
                        <td>86-1</td>
                        <td class="amount">${fundsMovement.funds.share.beginning.toLocaleString()} ₽</td>
                        <td class="amount incoming">${fundsMovement.funds.share.incoming.toLocaleString()} ₽</td>
                        <td class="amount outgoing">${fundsMovement.funds.share.outgoing.toLocaleString()} ₽</td>
                        <td class="amount"><strong>${fundsMovement.funds.share.ending.toLocaleString()} ₽</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Неделимый фонд</strong></td>
                        <td>86-2</td>
                        <td class="amount">${fundsMovement.funds.indivisible.beginning.toLocaleString()} ₽</td>
                        <td class="amount incoming">${fundsMovement.funds.indivisible.incoming.toLocaleString()} ₽</td>
                        <td class="amount outgoing">${fundsMovement.funds.indivisible.outgoing.toLocaleString()} ₽</td>
                        <td class="amount"><strong>${fundsMovement.funds.indivisible.ending.toLocaleString()} ₽</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Резервный фонд</strong></td>
                        <td>86-3 / 82</td>
                        <td class="amount">${fundsMovement.funds.reserve.beginning.toLocaleString()} ₽</td>
                        <td class="amount incoming">${fundsMovement.funds.reserve.incoming.toLocaleString()} ₽</td>
                        <td class="amount outgoing">${fundsMovement.funds.reserve.outgoing.toLocaleString()} ₽</td>
                        <td class="amount"><strong>${fundsMovement.funds.reserve.ending.toLocaleString()} ₽</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Фонд развития</strong></td>
                        <td>86-4</td>
                        <td class="amount">${fundsMovement.funds.development.beginning.toLocaleString()} ₽</td>
                        <td class="amount incoming">${fundsMovement.funds.development.incoming.toLocaleString()} ₽</td>
                        <td class="amount outgoing">${fundsMovement.funds.development.outgoing.toLocaleString()} ₽</td>
                        <td class="amount"><strong>${fundsMovement.funds.development.ending.toLocaleString()} ₽</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Фонд хоз. деятельности</strong></td>
                        <td>86-5</td>
                        <td class="amount">${fundsMovement.funds.business.beginning.toLocaleString()} ₽</td>
                        <td class="amount incoming">${fundsMovement.funds.business.incoming.toLocaleString()} ₽</td>
                        <td class="amount outgoing">${fundsMovement.funds.business.outgoing.toLocaleString()} ₽</td>
                        <td class="amount"><strong>${fundsMovement.funds.business.ending.toLocaleString()} ₽</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>ИТОГО</strong></td>
                        <td></td>
                        <td class="amount"><strong>${fundsMovement.total.beginning.toLocaleString()} ₽</strong></td>
                        <td class="amount incoming"><strong>${fundsMovement.total.incoming.toLocaleString()} ₽</strong></td>
                        <td class="amount outgoing"><strong>${fundsMovement.total.outgoing.toLocaleString()} ₽</strong></td>
                        <td class="amount"><strong>${fundsMovement.total.ending.toLocaleString()} ₽</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="report-footer" style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
                <h4>Пояснения:</h4>
                <ul style="font-size: 13px; margin: 10px 0;">
                    <li><strong>Паевой фонд (86-1)</strong> — обязательные и добровольные паевые взносы пайщиков</li>
                    <li><strong>Неделимый фонд (86-2)</strong> — вступительные взносы, не распределяемые между пайщиками</li>
                    <li><strong>Резервный фонд (86-3/82)</strong> — формируется из прибыли или членских взносов для покрытия убытков</li>
                    <li><strong>Фонд развития (86-4)</strong> — целевые взносы на развитие кооператива</li>
                    <li><strong>Фонд хоз. деятельности (86-5)</strong> — средства на текущую деятельность кооператива</li>
                </ul>
            </div>
            
            <div class="report-actions">
                <button class="action-button" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция для расчета движения фондов
function calculateFundsMovement() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const period = `${currentYear} год`;
    
    // Функция для расчета оборотов по счёту
    function calculateFundTurnovers(creditAccounts, debitAccounts) {
        const incoming = transactions
            .filter(t => {
                const year = t.date ? new Date(t.date).getFullYear() : 0;
                return year === currentYear && creditAccounts.includes(t.creditAccount);
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const outgoing = transactions
            .filter(t => {
                const year = t.date ? new Date(t.date).getFullYear() : 0;
                return year === currentYear && debitAccounts.includes(t.debitAccount);
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Расчет начального остатка (все операции до текущего года)
        const beginningIncoming = transactions
            .filter(t => {
                const year = t.date ? new Date(t.date).getFullYear() : 0;
                return year < currentYear && creditAccounts.includes(t.creditAccount);
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const beginningOutgoing = transactions
            .filter(t => {
                const year = t.date ? new Date(t.date).getFullYear() : 0;
                return year < currentYear && debitAccounts.includes(t.debitAccount);
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const beginning = beginningIncoming - beginningOutgoing;
        const ending = beginning + incoming - outgoing;
        
        return { beginning, incoming, outgoing, ending };
    }
    
    // Расчет по каждому фонду
    const shareFund = calculateFundTurnovers(['86-1'], ['86-1']);
    const indivisibleFund = calculateFundTurnovers(['86-2'], ['86-2']);
    const reserveFund = calculateFundTurnovers(['86-3', '82'], ['86-3', '82']);
    const developmentFund = calculateFundTurnovers(['86-4'], ['86-4']);
    const businessFund = calculateFundTurnovers(['86-5'], ['86-5']);
    
    // Итого
    const total = {
        beginning: shareFund.beginning + indivisibleFund.beginning + reserveFund.beginning + developmentFund.beginning + businessFund.beginning,
        incoming: shareFund.incoming + indivisibleFund.incoming + reserveFund.incoming + developmentFund.incoming + businessFund.incoming,
        outgoing: shareFund.outgoing + indivisibleFund.outgoing + reserveFund.outgoing + developmentFund.outgoing + businessFund.outgoing,
        ending: shareFund.ending + indivisibleFund.ending + reserveFund.ending + developmentFund.ending + businessFund.ending
    };
    
    return {
        period,
        funds: {
            share: shareFund,
            indivisible: indivisibleFund,
            reserve: reserveFund,
            development: developmentFund,
            business: businessFund
        },
        total
    };
}

// ========================================
// Функции для подотчетных операций
// ========================================

// Глобальные переменные для подотчетных операций
let accountableOperations = [];
let advanceReports = [];

// Функция для выдачи денег в подотчет
function issueMoneyOnAccountability() {
    const currentDate = new Date().toISOString().split("T")[0];
    
    const content = `
        <h3>Выдача денег в подотчет</h3>
        <form id="accountable-issue-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="accountable-person">ФИО сотрудника *</label>
                    <input type="text" id="accountable-person" required>
                </div>
                <div class="form-group">
                    <label for="accountable-position">Должность</label>
                    <input type="text" id="accountable-position">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="accountable-amount">Сумма *</label>
                    <input type="number" id="accountable-amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="accountable-date">Дата выдачи *</label>
                    <input type="date" id="accountable-date" value="${currentDate}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="accountable-purpose">Цель выдачи *</label>
                <textarea id="accountable-purpose" rows="2" required></textarea>
            </div>
            <div class="form-group">
                <label for="accountable-document">Номер документа *</label>
                <input type="text" id="accountable-document" required>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveAccountableIssue()">Выдать</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция для сохранения выдачи денег в подотчет
function saveAccountableIssue() {
    const person = document.getElementById('accountable-person').value;
    const position = document.getElementById('accountable-position').value;
    const amount = parseFloat(document.getElementById('accountable-amount').value);
    const date = document.getElementById('accountable-date').value;
    const purpose = document.getElementById('accountable-purpose').value;
    const documentNumber = document.getElementById('accountable-document').value;

    if (!person || !amount || !date || !purpose || !documentNumber) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const accountableOperation = {
        id: generateId(),
        type: 'advance_issue',
        person: person,
        position: position,
        amount: amount,
        date: date,
        purpose: purpose,
        documentNumber: documentNumber,
        status: 'issued',
        createdAt: new Date().toISOString()
    };

    accountableOperations.push(accountableOperation);
    createAccountingEntryForAccountableIssue(accountableOperation);

    closeModal();
    alert('Денежные средства успешно выданы в подотчет');
    scheduleAutoSave();
}

// Функция для создания бухгалтерской проводки при выдаче в подотчет
function createAccountingEntryForAccountableIssue(operation) {
    const newTransaction = {
        id: generateId(),
        date: operation.date,
        amount: operation.amount,
        debitAccount: '71',
        creditAccount: '50',
        description: `Выдача в подотчет ${operation.person} (${operation.purpose})`,
        relatedOperationId: operation.id,
        transactionType: 'accountable_issue',
        createdAt: new Date().toISOString()
    };

    transactions.push(newTransaction);
}

// Функция для создания командировочного удостоверения
function createBusinessTripCertificate() {
    const currentDate = new Date().toISOString().split("T")[0];
    
    const content = `
        <h3>Формирование командировочного удостоверения</h3>
        <form id="business-trip-certificate-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="trip-employee">ФИО сотрудника *</label>
                    <input type="text" id="trip-employee" required>
                </div>
                <div class="form-group">
                    <label for="trip-position">Должность *</label>
                    <input type="text" id="trip-position" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="trip-destination">Место командировки *</label>
                    <input type="text" id="trip-destination" required>
                </div>
                <div class="form-group">
                    <label for="trip-purpose">Цель командировки *</label>
                    <input type="text" id="trip-purpose" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="trip-start-date">Дата начала *</label>
                    <input type="date" id="trip-start-date" value="${currentDate}" required>
                </div>
                <div class="form-group">
                    <label for="trip-end-date">Дата окончания *</label>
                    <input type="date" id="trip-end-date" value="${currentDate}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="trip-order-number">Номер приказа *</label>
                    <input type="text" id="trip-order-number" required>
                </div>
                <div class="form-group">
                    <label for="trip-order-date">Дата приказа *</label>
                    <input type="date" id="trip-order-date" value="${currentDate}" required>
                </div>
            </div>
            <div class="form-group">
                <label for="trip-finance-source">Источник финансирования</label>
                <input type="text" id="trip-finance-source" value="Средства кооператива">
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveBusinessTripCertificate()">Сформировать</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция для сохранения команд������ровочного удостоверения
function saveBusinessTripCertificate() {
    const employee = document.getElementById('trip-employee').value;
    const position = document.getElementById('trip-position').value;
    const destination = document.getElementById('trip-destination').value;
    const purpose = document.getElementById('trip-purpose').value;
    const startDate = document.getElementById('trip-start-date').value;
    const endDate = document.getElementById('trip-end-date').value;
    const orderNumber = document.getElementById('trip-order-number').value;
    const orderDate = document.getElementById('trip-order-date').value;
    const financeSource = document.getElementById('trip-finance-source').value;

    if (!employee || !position || !destination || !purpose || !startDate || !endDate || !orderNumber || !orderDate) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const certificate = {
        id: generateId(),
        employee: employee,
        position: position,
        destination: destination,
        purpose: purpose,
        startDate: startDate,
        endDate: endDate,
        orderNumber: orderNumber,
        orderDate: orderDate,
        financeSource: financeSource,
        issueDate: new Date().toISOString().split("T")[0],
        status: 'active',
        type: 'business_trip',
        createdAt: new Date().toISOString()
    };

    if (typeof certificates === 'undefined') {
        window.certificates = [];
    }
    certificates.push(certificate);

    closeModal();
    showBusinessTripCertificate(certificate.id);
    scheduleAutoSave();
}

// Функция для отображения командировочного удостоверения
function showBusinessTripCertificate(certificateId) {
    const certificate = certificates.find(c => c.id === certificateId && c.type === 'business_trip');
    if (!certificate) return;

    const content = `
        <div class="business-trip-certificate">
            <div style="font-family: Arial, serif; padding: 20px; border: 2px solid #000; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">КОМАНДИРОВОЧНОЕ УДОСТОВЕРЕНИЕ</h2>
                    <p style="margin: 5px 0;">№ ${certificate.id}</p>
                </div>
                <div style="margin: 20px 0;">
                    <p style="margin: 10px 0;"><strong>ФИО:</strong> ${certificate.employee}</p>
                    <p style="margin: 10px 0;"><strong>Должность:</strong> ${certificate.position}</p>
                    <p style="margin: 10px 0;"><strong>Направление:</strong> ${certificate.destination}</p>
                    <p style="margin: 10px 0;"><strong>Цель командировки:</strong> ${certificate.purpose}</p>
                    <p style="margin: 10px 0;"><strong>Срок командировки:</strong> с ${certificate.startDate} по ${certificate.endDate}</p>
                    <p style="margin: 10px 0;"><strong>Номер приказа:</strong> ${certificate.orderNumber} от ${certificate.orderDate}</p>
                    <p style="margin: 10px 0;"><strong>Источник финансирования:</strong> ${certificate.financeSource}</p>
                    <p style="margin: 10px 0;"><strong>Дата выдачи:</strong> ${certificate.issueDate}</p>
                </div>
                <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 30%;"><p>Руководитель</p><p>_________________</p><p>(подпись)</p></div>
                    <div style="text-align: center; width: 30%;"><p>Главный бухгалтер</p><p>_________________</p><p>(подпись)</p></div>
                    <div style="text-align: center; width: 30%;"><p>Командированный</p><p>_________________</p><p>(подпись)</p></div>
                </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button type="button" class="action-button" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Распределение взносов по фондам', content);
}

// ========================================
// Функции раздела Настройки
// ========================================

// Функция для отображения общих настроек
function showGeneralSettings() {
    const s = cooperativeSettings;

    const content = `
        <div class="settings-form">
            <h3>Общая информация о кооперативе</h3>

            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Укажите полные реквизиты кооператива. Эти данные будут использоваться в документах и отчётности.</p>
            </div>

            <form id="general-settings-form">
                <div class="form-section">
                    <h4>📋 Наименование</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="full-name">Полное наименование *</label>
                            <input type="text" id="full-name" value="${s.fullName}" placeholder="Потребительский кооператив «Название»" required>
                            <div class="hint">Как указано в уставе</div>
                        </div>
                        <div class="form-group">
                            <label for="short-name">Краткое наименование *</label>
                            <input type="text" id="short-name" value="${s.shortName}" placeholder="ПК «Название»" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>📄 Реквизиты</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="inn">ИНН *</label>
                            <input type="text" id="inn" value="${s.inn}" placeholder="XXXXXXXXXX" pattern="[0-9]{10}" required>
                        </div>
                        <div class="form-group">
                            <label for="kpp">КПП</label>
                            <input type="text" id="kpp" value="${s.kpp}" placeholder="XXXXXXXXX" pattern="[0-9]{9}">
                        </div>
                        <div class="form-group">
                            <label for="ogrn">ОГРН *</label>
                            <input type="text" id="ogrn" value="${s.ogrn}" placeholder="XXXXXXXXXXXXX" pattern="[0-9]{13}" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>📍 Адреса</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="legal-address">Юридический адрес *</label>
                            <input type="text" id="legal-address" value="${s.legalAddress}" placeholder="Индекс, область, город, улица, дом" required>
                        </div>
                        <div class="form-group">
                            <label for="postal-address">Почтовый адрес</label>
                            <input type="text" id="postal-address" value="${s.postalAddress}" placeholder="Если отличается от юридического">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="actual-address">Фактический адрес</label>
                        <input type="text" id="actual-address" value="${s.actualAddress}" placeholder="Адрес фактического местонахождения">
                    </div>
                </div>

                <div class="form-section">
                    <h4>📞 Контакты</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">Телефон</label>
                            <input type="text" id="phone" value="${s.phone}" placeholder="+7 (XXX) XXX-XX-XX">
                        </div>
                        <div class="form-group">
                            <label for="email">E-mail *</label>
                            <input type="email" id="email" value="${s.email}" placeholder="info@coop.ru" required>
                        </div>
                        <div class="form-group">
                            <label for="website">Сайт</label>
                            <input type="url" id="website" value="${s.website}" placeholder="https://coop.ru">
                        </div>
                    </div>
                </div>

                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveGeneralSettings()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Настройки кооператива', content);
}

// Функция для сохранения общих настроек
function saveGeneralSettings() {
    cooperativeSettings.fullName = document.getElementById('full-name').value;
    cooperativeSettings.shortName = document.getElementById('short-name').value;
    cooperativeSettings.inn = document.getElementById('inn').value;
    cooperativeSettings.kpp = document.getElementById('kpp').value;
    cooperativeSettings.ogrn = document.getElementById('ogrn').value;
    cooperativeSettings.legalAddress = document.getElementById('legal-address').value;
    cooperativeSettings.postalAddress = document.getElementById('postal-address').value;
    cooperativeSettings.actualAddress = document.getElementById('actual-address').value;
    cooperativeSettings.phone = document.getElementById('phone').value;
    cooperativeSettings.email = document.getElementById('email').value;
    cooperativeSettings.website = document.getElementById('website').value;

    saveSettings();
    closeSideMenu();
    alert('Общая информация сохранена!');
}

// Функция для отображения настроек филиалов
function showBranchesSettings() {
    const branches = cooperativeSettings.branches || [];
    
    let branchesHtml = '';
    branches.forEach((branch, index) => {
        branchesHtml += `
            <tr>
                <td>${branch.name || '—'}</td>
                <td>${branch.address || '—'}</td>
                <td>${branch.phone || '—'}</td>
                <td class="actions">
                    <button class="edit" onclick="editBranch(${index})">Изменить</button>
                    <button class="delete" onclick="deleteBranch(${index})">Удалить</button>
                </td>
            </tr>
        `;
    });
    
    const content = `
        <div class="settings-form">
            <h3>Филиалы и представительства</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Добавьте информацию о филиалах и представительствах кооператива.</p>
            </div>
            
            <button type="button" class="action-button" onclick="addBranchForm()" style="margin-bottom: 15px;">➕ Добавить филиал</button>
            
            <table class="settings-table">
                <thead>
                    <tr>
                        <th>Наименование</th>
                        <th>Адрес</th>
                        <th>Телефон</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${branches.length > 0 ? branchesHtml : '<tr><td colspan="4" style="text-align: center;">Филиалы не добавлены</td></tr>'}
                </tbody>
            </table>
            
            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

// Функция добавления филиала
function addBranchForm() {
    const content = `
        <h3>Добавить филиал</h3>
        <form id="branch-form">
            <div class="form-group">
                <label for="branch-name">Наименование филиала *</label>
                <input type="text" id="branch-name" required>
            </div>
            <div class="form-group">
                <label for="branch-address">Адрес *</label>
                <input type="text" id="branch-address" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="branch-phone">Телефон</label>
                    <input type="text" id="branch-phone">
                </div>
                <div class="form-group">
                    <label for="branch-email">E-mail</label>
                    <input type="email" id="branch-email">
                </div>
            </div>
            <div class="form-group">
                <label for="branch-head">Руководитель</label>
                <input type="text" id="branch-head">
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveBranch()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu(title, content);
}

// Функция сохранения филиала
function saveBranch() {
    const branch = {
        name: document.getElementById('branch-name').value,
        address: document.getElementById('branch-address').value,
        phone: document.getElementById('branch-phone').value,
        email: document.getElementById('branch-email').value,
        head: document.getElementById('branch-head').value
    };
    
    if (!cooperativeSettings.branches) cooperativeSettings.branches = [];
    cooperativeSettings.branches.push(branch);
    saveSettings();
    closeModal();
    showBranchesSettings();
    alert('Филиал добавлен!');
}

// Функция редактирования филиала
function editBranch(index) {
    const branch = cooperativeSettings.branches[index];
    const content = `
        <h3>Редактировать филиал</h3>
        <form id="branch-form">
            <div class="form-group">
                <label for="branch-name-edit">Наименование ��илиала *</label>
                <input type="text" id="branch-name-edit" value="${branch.name}" required>
            </div>
            <div class="form-group">
                <label for="branch-address-edit">Адрес *</label>
                <input type="text" id="branch-address-edit" value="${branch.address}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="branch-phone-edit">Телефон</label>
                    <input type="text" id="branch-phone-edit" value="${branch.phone}">
                </div>
                <div class="form-group">
                    <label for="branch-email-edit">E-mail</label>
                    <input type="email" id="branch-email-edit" value="${branch.email}">
                </div>
            </div>
            <div class="form-group">
                <label for="branch-head-edit">Руководитель</label>
                <input type="text" id="branch-head-edit" value="${branch.head}">
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="updateBranch(${index})">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu(title, content);
}

// Функция обновления филиала
function updateBranch(index) {
    cooperativeSettings.branches[index] = {
        name: document.getElementById('branch-name-edit').value,
        address: document.getElementById('branch-address-edit').value,
        phone: document.getElementById('branch-phone-edit').value,
        email: document.getElementById('branch-email-edit').value,
        head: document.getElementById('branch-head-edit').value
    };
    saveSettings();
    closeModal();
    showBranchesSettings();
    alert('Филиал обновлен!');
}

// Функция удаления филиала
function deleteBranch(index) {
    if (confirm('Вы уверены, что хотите удалить этот филиал?')) {
        cooperativeSettings.branches.splice(index, 1);
        saveSettings();
        showBranchesSettings();
    }
}

// Функция для отображения настроек председателя
function showChairmanSettings() {
    const chairman = cooperativeSettings.chairman || {};

    const content = `
        <div class="settings-form">
            <h3>Председатель кооператива</h3>

            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Информация о председателе кооператива.</p>
            </div>

            <div class="form-section">
                <h4>👔 Данные председателя</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="chairman-name">ФИО председателя *</label>
                        <input type="text" id="chairman-name" value="${chairman.name || ''}" placeholder="Иванов Иван Иванович">
                    </div>
                    <div class="form-group">
                        <label for="chairman-phone">Телефон</label>
                        <input type="text" id="chairman-phone" value="${chairman.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX">
                    </div>
                </div>
                <div class="form-group">
                    <label for="chairman-email">E-mail</label>
                    <input type="email" id="chairman-email" value="${chairman.email || ''}" placeholder="chairman@coop.ru">
                </div>
                <button type="button" class="action-button save" onclick="saveChairman()" style="margin-top: 10px;">Сохранить</button>
            </div>

            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Председатель', content);
}

// Функция для отображения настроек совета
function showCouncilSettings() {
    const council = cooperativeSettings.council || { chairman: {}, secretary: {}, members: [] };

    const membersHtml = council.members && council.members.length > 0 ? council.members.map((member, index) => `
        <tr>
            <td>${member.name || '—'}</td>
            <td>${member.position || 'Член совета'}</td>
            <td class="actions">
                <button class="delete" onclick="deleteCouncilMember(${index})">Удалить</button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center;">Члены совета не добавлены</td></tr>';

    const content = `
        <div class="settings-form">
            <h3>Совет кооператива</h3>

            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Совет кооператива — коллегиальный орган управления.</p>
            </div>

            <div class="form-section">
                <h4>👔 Председатель совета</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="council-chairman-name">ФИО *</label>
                        <input type="text" id="council-chairman-name" value="${council.chairman.name || ''}" placeholder="Иванов Иван Иванович">
                    </div>
                    <div class="form-group">
                        <label for="council-chairman-phone">Телефон</label>
                        <input type="text" id="council-chairman-phone" value="${council.chairman.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX">
                    </div>
                </div>
                <div class="form-group">
                    <label for="council-chairman-email">E-mail</label>
                    <input type="email" id="council-chairman-email" value="${council.chairman.email || ''}" placeholder="council-chair@coop.ru">
                </div>
                <button type="button" class="action-button save" onclick="saveCouncilChairman()" style="margin-top: 10px;">Сохранить</button>
            </div>

            <div class="form-section">
                <h4>📝 Секретарь совета</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="council-secretary-name">ФИО *</label>
                        <input type="text" id="council-secretary-name" value="${council.secretary.name || ''}" placeholder="Петров Пётр Петрович">
                    </div>
                    <div class="form-group">
                        <label for="council-secretary-phone">Телефон</label>
                        <input type="text" id="council-secretary-phone" value="${council.secretary.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX">
                    </div>
                </div>
                <div class="form-group">
                    <label for="council-secretary-email">E-mail</label>
                    <input type="email" id="council-secretary-email" value="${council.secretary.email || ''}" placeholder="council-sec@coop.ru">
                </div>
                <button type="button" class="action-button save" onclick="saveCouncilSecretary()" style="margin-top: 10px;">Сохранить</button>
            </div>

            <div class="form-section">
                <h4>👥 Члены совета</h4>
                <button type="button" class="action-button" onclick="addCouncilMemberForm()" style="margin-bottom: 15px;">➕ Добавить члена совета</button>

                <table class="settings-table">
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Должность</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${membersHtml}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Совет кооператива', content);
}

// Функция для отображения настроек правления
function showBoardSettings() {
    const board = cooperativeSettings.board || { chairman: {}, secretary: {}, members: [] };

    const membersHtml = board.members && board.members.length > 0 ? board.members.map((member, index) => `
        <tr>
            <td>${member.name || '—'}</td>
            <td>${member.position || 'Член правления'}</td>
            <td class="actions">
                <button class="delete" onclick="deleteBoardMember(${index})">Удалить</button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center;">Члены правления не добавлены</td></tr>';

    const content = `
        <div class="settings-form">
            <h3>Правление кооператива</h3>

            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Правление — исполнительный орган кооператива.</p>
            </div>

            <div class="form-section">
                <h4>👔 Председатель правления</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="board-chairman-name">ФИО *</label>
                        <input type="text" id="board-chairman-name" value="${board.chairman.name || ''}" placeholder="Иванов Иван Иванович">
                    </div>
                    <div class="form-group">
                        <label for="board-chairman-phone">Телефон</label>
                        <input type="text" id="board-chairman-phone" value="${board.chairman.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX">
                    </div>
                </div>
                <div class="form-group">
                    <label for="board-chairman-email">E-mail</label>
                    <input type="email" id="board-chairman-email" value="${board.chairman.email || ''}" placeholder="board-chair@coop.ru">
                </div>
                <button type="button" class="action-button save" onclick="saveBoardChairman()" style="margin-top: 10px;">Сохранить</button>
            </div>

            <div class="form-section">
                <h4>📝 Секретарь правления</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="board-secretary-name">ФИО *</label>
                        <input type="text" id="board-secretary-name" value="${board.secretary.name || ''}" placeholder="Петров Пётр Петрович">
                    </div>
                    <div class="form-group">
                        <label for="board-secretary-phone">Телефон</label>
                        <input type="text" id="board-secretary-phone" value="${board.secretary.phone || ''}" placeholder="+7 (XXX) XXX-XX-XX">
                    </div>
                </div>
                <div class="form-group">
                    <label for="board-secretary-email">E-mail</label>
                    <input type="email" id="board-secretary-email" value="${board.secretary.email || ''}" placeholder="board-sec@coop.ru">
                </div>
                <button type="button" class="action-button save" onclick="saveBoardSecretary()" style="margin-top: 10px;">Сохранить</button>
            </div>

            <div class="form-section">
                <h4>👥 Члены правления</h4>
                <button type="button" class="action-button" onclick="addBoardMemberForm()" style="margin-bottom: 15px;">➕ Добавить члена правления</button>

                <table class="settings-table">
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Должность</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${membersHtml}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Правление', content);
}

// Функция для отображения настроек органов управления (устарела, используется для совместимости)
function showControlBodiesSettings() {
    showChairmanSettings();
}

// Функция сохранения председателя совета
function saveCouncilChairman() {
    if (!cooperativeSettings.council) cooperativeSettings.council = { chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.council.chairman = {
        name: document.getElementById('council-chairman-name').value,
        phone: document.getElementById('council-chairman-phone').value,
        email: document.getElementById('council-chairman-email').value
    };
    saveSettings();
    showCouncilSettings();
    alert('Председатель совета сохранён!');
}

// Функция сохранения секретаря совета
function saveCouncilSecretary() {
    if (!cooperativeSettings.council) cooperativeSettings.council = { chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.council.secretary = {
        name: document.getElementById('council-secretary-name').value,
        phone: document.getElementById('council-secretary-phone').value,
        email: document.getElementById('council-secretary-email').value
    };
    saveSettings();
    showCouncilSettings();
    alert('Секретарь совета сохранён!');
}

// Функция добавления члена совета
function addCouncilMemberForm() {
    const content = `
        <h3>Добавить члена совета</h3>
        <form id="council-member-form">
            <div class="form-group">
                <label for="council-name">ФИО *</label>
                <input type="text" id="council-name" required>
            </div>
            <div class="form-group">
                <label for="council-position">Должность</label>
                <input type="text" id="council-position" placeholder="Член совета">
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveCouncilMember()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu('Добавить члена совета', content);
}

function saveCouncilMember() {
    if (!cooperativeSettings.council) cooperativeSettings.council = { chairman: {}, secretary: {}, members: [] };
    if (!cooperativeSettings.council.members) cooperativeSettings.council.members = [];
    cooperativeSettings.council.members.push({
        name: document.getElementById('council-name').value,
        position: document.getElementById('council-position').value || 'Член совета'
    });
    saveSettings();
    closeSideMenu();
    showCouncilSettings();
}

function deleteCouncilMember(index) {
    if (confirm('Удалить члена совета?')) {
        if (!cooperativeSettings.council) cooperativeSettings.council = { chairman: {}, secretary: {}, members: [] };
        if (cooperativeSettings.council.members) {
            cooperativeSettings.council.members.splice(index, 1);
        }
        saveSettings();
        showCouncilSettings();
    }
}

// Функция сохранения председателя правления
function saveBoardChairman() {
    if (!cooperativeSettings.board) cooperativeSettings.board = { chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.board.chairman = {
        name: document.getElementById('board-chairman-name').value,
        phone: document.getElementById('board-chairman-phone').value,
        email: document.getElementById('board-chairman-email').value
    };
    saveSettings();
    showBoardSettings();
    alert('Председатель правления сохранён!');
}

// Функция сохранения секретаря правления
function saveBoardSecretary() {
    if (!cooperativeSettings.board) cooperativeSettings.board = { chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.board.secretary = {
        name: document.getElementById('board-secretary-name').value,
        phone: document.getElementById('board-secretary-phone').value,
        email: document.getElementById('board-secretary-email').value
    };
    saveSettings();
    showBoardSettings();
    alert('Секретарь правления сохранён!');
}

// Функция добавления члена правления
function addBoardMemberForm() {
    const content = `
        <h3>Добавить члена правления</h3>
        <form id="board-member-form">
            <div class="form-group">
                <label for="board-name">ФИО *</label>
                <input type="text" id="board-name" required>
            </div>
            <div class="form-group">
                <label for="board-position">Должность</label>
                <input type="text" id="board-position" placeholder="Член правления">
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveBoardMemberNew()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu('Добавить члена правления', content);
}

function saveBoardMemberNew() {
    if (!cooperativeSettings.board) cooperativeSettings.board = { chairman: {}, secretary: {}, members: [] };
    if (!cooperativeSettings.board.members) cooperativeSettings.board.members = [];
    cooperativeSettings.board.members.push({
        name: document.getElementById('board-name').value,
        position: document.getElementById('board-position').value || 'Член правления'
    });
    saveSettings();
    closeSideMenu();
    showBoardSettings();
}

function deleteBoardMember(index) {
    if (confirm('Удалить члена правления?')) {
        if (!cooperativeSettings.board) cooperativeSettings.board = { chairman: {}, secretary: {}, members: [] };
        if (cooperativeSettings.board.members) {
            cooperativeSettings.board.members.splice(index, 1);
        }
        saveSettings();
        showBoardSettings();
    }
}

// Функция для отображения настроек ревизионной комиссии
function showSupervisionSettings() {
    const supervision = cooperativeSettings.supervision || { type: 'revizor', chairman: {}, secretary: {}, members: [] };

    const membersHtml = supervision.members && supervision.members.length > 0 ? supervision.members.map((m, i) => `
        <tr>
            <td>${m.name || '—'}</td>
            <td>${m.position || 'Член комиссии'}</td>
            <td class="actions">
                <button onclick="deleteCommissionMember(${i})">Удалить</button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="3" style="text-align: center;">Члены комиссии не добавлены</td></tr>';

    const content = `
        <div class="settings-form">
            <h3>Ревизионная комиссия / Ревизор</h3>

            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Орган контроля финансово-хозяйственной деятельности кооператива.</p>
            </div>

            <div class="form-section">
                <h4>⚙️ Тип органа контроля</h4>
                <div class="form-group">
                    <label for="supervision-type">Тип органа контроля:</label>
                    <select id="supervision-type" onchange="toggleSupervisionForm()">
                        <option value="revizor" ${supervision.type === 'revizor' ? 'selected' : ''}>Ревизор (одно лицо)</option>
                        <option value="commission" ${supervision.type === 'commission' ? 'selected' : ''}>Ревизионная комиссия</option>
                    </select>
                </div>
            </div>

            ${supervision.type === 'revizor' ? `
                <div class="form-section">
                    <h4>👤 Ревизор</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="revizor-name">ФИО *</label>
                            <input type="text" id="revizor-name" value="${supervision.chairman.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="revizor-phone">Телефон</label>
                            <input type="text" id="revizor-phone" value="${supervision.chairman.phone || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="revizor-email">E-mail</label>
                        <input type="email" id="revizor-email" value="${supervision.chairman.email || ''}">
                    </div>
                    <button type="button" class="action-button save" onclick="saveRevizor()" style="margin-top: 10px;">Сохранить</button>
                </div>
            ` : `
                <div class="form-section">
                    <h4>👔 Председатель ревизионной комиссии</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supervision-chairman-name">ФИО *</label>
                            <input type="text" id="supervision-chairman-name" value="${supervision.chairman.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="supervision-chairman-phone">Телефон</label>
                            <input type="text" id="supervision-chairman-phone" value="${supervision.chairman.phone || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="supervision-chairman-email">E-mail</label>
                        <input type="email" id="supervision-chairman-email" value="${supervision.chairman.email || ''}">
                    </div>
                    <button type="button" class="action-button save" onclick="saveSupervisionChairman()" style="margin-top: 10px;">Сохранить</button>
                </div>

                <div class="form-section">
                    <h4>📝 Секретарь ревизионной комиссии</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supervision-secretary-name">ФИО *</label>
                            <input type="text" id="supervision-secretary-name" value="${supervision.secretary.name || ''}">
                        </div>
                        <div class="form-group">
                            <label for="supervision-secretary-phone">Телефон</label>
                            <input type="text" id="supervision-secretary-phone" value="${supervision.secretary.phone || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="supervision-secretary-email">E-mail</label>
                        <input type="email" id="supervision-secretary-email" value="${supervision.secretary.email || ''}">
                    </div>
                    <button type="button" class="action-button save" onclick="saveSupervisionSecretary()" style="margin-top: 10px;">Сохранить</button>
                </div>

                <div class="form-section">
                    <h4>👥 Члены ревизионной комиссии</h4>
                    <button type="button" class="action-button" onclick="addCommissionMemberForm()" style="margin-bottom: 15px;">➕ Добавить члена комиссии</button>

                    <table class="settings-table">
                        <thead>
                            <tr>
                                <th>ФИО</th>
                                <th>Должность</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${membersHtml}
                        </tbody>
                    </table>
                </div>
            `}

            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Ревизионная комиссия', content);
}

function toggleSupervisionForm() {
    cooperativeSettings.supervision.type = document.getElementById('supervision-type').value;
    saveSettings();
    showSupervisionSettings();
}

function saveRevizor() {
    if (!cooperativeSettings.supervision) cooperativeSettings.supervision = { type: 'revizor', chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.supervision = {
        type: 'revizor',
        chairman: {
            name: document.getElementById('revizor-name').value,
            phone: document.getElementById('revizor-phone').value,
            email: document.getElementById('revizor-email').value
        },
        secretary: {},
        members: []
    };
    saveSettings();
    showSupervisionSettings();
    alert('Информация о ревизоре сохранена!');
}

function saveSupervisionChairman() {
    if (!cooperativeSettings.supervision) cooperativeSettings.supervision = { type: 'commission', chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.supervision.chairman = {
        name: document.getElementById('supervision-chairman-name').value,
        phone: document.getElementById('supervision-chairman-phone').value,
        email: document.getElementById('supervision-chairman-email').value
    };
    saveSettings();
    showSupervisionSettings();
    alert('Председатель ревизионной комиссии сохранён!');
}

function saveSupervisionSecretary() {
    if (!cooperativeSettings.supervision) cooperativeSettings.supervision = { type: 'commission', chairman: {}, secretary: {}, members: [] };
    cooperativeSettings.supervision.secretary = {
        name: document.getElementById('supervision-secretary-name').value,
        phone: document.getElementById('supervision-secretary-phone').value,
        email: document.getElementById('supervision-secretary-email').value
    };
    saveSettings();
    showSupervisionSettings();
    alert('Секретарь ревизионной комиссии сохранён!');
}

function addCommissionMemberForm() {
    const content = `
        <h3>Добавить члена ревизионной комиссии</h3>
        <form id="commission-member-form">
            <div class="form-group">
                <label for="commission-name">ФИО *</label>
                <input type="text" id="commission-name" required>
            </div>
            <div class="form-group">
                <label for="commission-position">Должность</label>
                <input type="text" id="commission-position" placeholder="Член комиссии">
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveCommissionMemberNew()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu('Добавить члена комиссии', content);
}

function saveCommissionMemberNew() {
    if (!cooperativeSettings.supervision) cooperativeSettings.supervision = { type: 'commission', chairman: {}, secretary: {}, members: [] };
    if (!cooperativeSettings.supervision.members) cooperativeSettings.supervision.members = [];
    cooperativeSettings.supervision.members.push({
        name: document.getElementById('commission-name').value,
        position: document.getElementById('commission-position').value || 'Член комиссии'
    });
    saveSettings();
    closeSideMenu();
    showSupervisionSettings();
}

function deleteCommissionMember(index) {
    if (confirm('Удалить члена комиссии?')) {
        if (!cooperativeSettings.supervision) cooperativeSettings.supervision = { type: 'commission', chairman: {}, secretary: {}, members: [] };
        if (cooperativeSettings.supervision.members) {
            cooperativeSettings.supervision.members.splice(index, 1);
        }
        saveSettings();
        showSupervisionSettings();
    }
}

// Функция для отображения настроек участков
function showAreasSettings() {
    const areas = cooperativeSettings.areas || [];
    
    let areasHtml = '';
    areas.forEach((area, index) => {
        areasHtml += `
            <tr>
                <td>${area.name || '—'}</td>
                <td>${area.description || '—'}</td>
                <td class="actions">
                    <button onclick="editArea(${index})">Изменить</button>
                    <button onclick="deleteArea(${index})">Удалить</button>
                </td>
            </tr>
        `;
    });
    
    const content = `
        <div class="settings-form">
            <h3>Кооперативные участки</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Участки используются для территориального деления пайщиков.</p>
            </div>
            
            <button type="button" class="action-button" onclick="addAreaForm()" style="margin-bottom: 15px;">➕ Добавить участок</button>
            
            <table class="settings-table">
                <thead>
                    <tr>
                        <th>Наименование</th>
                        <th>Описание</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${areas.length > 0 ? areasHtml : '<tr><td colspan="3" style="text-align: center;">Участки не добавлены</td></tr>'}
                </tbody>
            </table>
            
            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function addAreaForm() {
    const content = `
        <h3>Добавить участок</h3>
        <form id="area-form">
            <div class="form-group">
                <label for="area-name">Наименование *</label>
                <input type="text" id="area-name" required>
            </div>
            <div class="form-group">
                <label for="area-description">Описание</label>
                <textarea id="area-description" rows="3"></textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="saveArea()">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu(title, content);
}

function saveArea() {
    if (!cooperativeSettings.areas) cooperativeSettings.areas = [];
    cooperativeSettings.areas.push({
        name: document.getElementById('area-name').value,
        description: document.getElementById('area-description').value
    });
    saveSettings();
    closeModal();
    showAreasSettings();
}

function editArea(index) {
    const area = cooperativeSettings.areas[index];
    const content = `
        <h3>Редактировать участок</h3>
        <form id="area-form">
            <div class="form-group">
                <label for="area-name-edit">Наименование *</label>
                <input type="text" id="area-name-edit" value="${area.name}" required>
            </div>
            <div class="form-group">
                <label for="area-description-edit">Описание</label>
                <textarea id="area-description-edit" rows="3">${area.description || ''}</textarea>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 10px;">
                <button type="button" class="action-button save" onclick="updateArea(${index})">Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `;
    showInSideMenu(title, content);
}

function updateArea(index) {
    cooperativeSettings.areas[index] = {
        name: document.getElementById('area-name-edit').value,
        description: document.getElementById('area-description-edit').value
    };
    saveSettings();
    closeModal();
    showAreasSettings();
}

function deleteArea(index) {
    if (confirm('Удалить участок?')) {
        cooperativeSettings.areas.splice(index, 1);
        saveSettings();
        showAreasSettings();
    }
}

// Функция для отображения настроек видов взносов
function showContributionTypesSettings() {
    const types = cooperativeSettings.contributionTypes || {};
    
    const content = `
        <div class="settings-form">
            <h3>Виды и размеры взносов</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Установите минимальные размеры взносов для каждого типа. Эти значения будут использоваться по умолчанию при приёме взносов.</p>
            </div>
            
            <form id="contribution-types-form">
                <div class="form-section">
                    <h4>💵 Вступительный взнос</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="entrance-name">Наименование</label>
                            <input type="text" id="entrance-name" value="${types.entrance?.name || 'Вступительный'}">
                        </div>
                        <div class="form-group">
                            <label for="entrance-amount">Минимальная сумма, руб.</label>
                            <input type="number" id="entrance-amount" value="${types.entrance?.minAmount || 0}" min="0">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🪙 Паевой взнос</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="share-name">Наименование</label>
                            <input type="text" id="share-name" value="${types.share?.name || 'Паевой'}">
                        </div>
                        <div class="form-group">
                            <label for="share-amount">Минимальная сумма, руб.</label>
                            <input type="number" id="share-amount" value="${types.share?.minAmount || 0}" min="0">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>📋 Членский взнос</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="membership-name">Наименование</label>
                            <input type="text" id="membership-name" value="${types.membership?.name || 'Членский'}">
                        </div>
                        <div class="form-group">
                            <label for="membership-amount">Минимальная сумма, руб.</label>
                            <input type="number" id="membership-amount" value="${types.membership?.minAmount || 0}" min="0">
                        </div>
                        <div class="form-group">
                            <label for="membership-period">Периодичность</label>
                            <select id="membership-period">
                                <option value="monthly" ${types.membership?.period === 'monthly' ? 'selected' : ''}>Ежемесячно</option>
                                <option value="quarterly" ${types.membership?.period === 'quarterly' ? 'selected' : ''}>Ежеквартально</option>
                                <option value="yearly" ${types.membership?.period === 'yearly' ? 'selected' : ''}>Ежегодно</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🎁 Добровольный паевой взнос</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="voluntary-name">Наименование</label>
                            <input type="text" id="voluntary-name" value="${types.voluntary?.name || 'Добровольный'}">
                        </div>
                        <div class="form-group">
                            <label for="voluntary-amount">Минимальная сумма, руб.</label>
                            <input type="number" id="voluntary-amount" value="${types.voluntary?.minAmount || 0}" min="0">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>🎯 Целевой взнос</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="targeted-name">Наименование</label>
                            <input type="text" id="targeted-name" value="${types.targeted?.name || 'Целевой'}">
                        </div>
                        <div class="form-group">
                            <label for="targeted-amount">Минимальная сумма, руб.</label>
                            <input type="number" id="targeted-amount" value="${types.targeted?.minAmount || 0}" min="0">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveContributionTypes()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function saveContributionTypes() {
    cooperativeSettings.contributionTypes = {
        entrance: {
            name: document.getElementById('entrance-name').value,
            minAmount: parseFloat(document.getElementById('entrance-amount').value) || 0,
            required: true
        },
        share: {
            name: document.getElementById('share-name').value,
            minAmount: parseFloat(document.getElementById('share-amount').value) || 0,
            required: true
        },
        membership: {
            name: document.getElementById('membership-name').value,
            minAmount: parseFloat(document.getElementById('membership-amount').value) || 0,
            period: document.getElementById('membership-period').value,
            required: true
        },
        voluntary: {
            name: document.getElementById('voluntary-name').value,
            minAmount: parseFloat(document.getElementById('voluntary-amount').value) || 0,
            required: false
        },
        targeted: {
            name: document.getElementById('targeted-name').value,
            minAmount: parseFloat(document.getElementById('targeted-amount').value) || 0,
            required: false
        }
    };
    saveSettings();
    closeSideMenu();
    alert('Виды взносов сохранены!');
}

// Функция для отображения настроек распределения по фондам
function showFundDistributionSettings() {
    const dist = cooperativeSettings.fundDistribution || { type: 'percent', reserve: 0, development: 0, business: 0, indivisible: 0 };
    
    const total = (dist.reserve || 0) + (dist.development || 0) + (dist.business || 0) + (dist.indivisible || 0);
    const isValid = total === 100;
    
    const content = `
        <div class="settings-form">
            <h3>Распределение членских взносов по фондам</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Укажите пропорции распределения членских взносов по фондам кооператива. Сумма процентов должна равняться 100%.</p>
                <p style="margin-top: 10px;"><strong>Текущая сумма:</strong> <span style="color: ${isValid ? 'green' : 'red'};">${total}%</span></p>
            </div>
            
            <form id="fund-distribution-form">
                <div class="form-group">
                    <label>Тип распределения:</label>
                    <select id="distribution-type">
                        <option value="percent" ${dist.type === 'percent' ? 'selected' : ''}>В процентах (%)</option>
                        <option value="fixed" ${dist.type === 'fixed' ? 'selected' : ''}>В фиксированной сумме (руб.)</option>
                    </select>
                </div>
                
                <div class="form-section">
                    <h4>📊 Фонды</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="reserve-percent">Резервный фонд, %</label>
                            <input type="number" id="reserve-percent" value="${dist.reserve || 0}" min="0" max="100" step="0.1" onchange="validateDistributionPercent()">
                        </div>
                        <div class="form-group">
                            <label for="development-percent">Фонд развития, %</label>
                            <input type="number" id="development-percent" value="${dist.development || 0}" min="0" max="100" step="0.1" onchange="validateDistributionPercent()">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="business-percent">Фонд хоз. деятельности, %</label>
                            <input type="number" id="business-percent" value="${dist.business || 0}" min="0" max="100" step="0.1" onchange="validateDistributionPercent()">
                        </div>
                        <div class="form-group">
                            <label for="indivisible-percent">Неделимый фонд, %</label>
                            <input type="number" id="indivisible-percent" value="${dist.indivisible || 0}" min="0" max="100" step="0.1" onchange="validateDistributionPercent()">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Итого: <span id="distribution-total">${total}%</span></label>
                        <div id="distribution-warning" style="color: red; display: ${!isValid ? 'block' : 'none'};">
                            ⚠️ Сумма процентов должна равняться 100%!
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveFundDistribution()" ${!isValid ? 'disabled' : ''}>Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function validateDistributionPercent() {
    const reserve = parseFloat(document.getElementById('reserve-percent').value) || 0;
    const development = parseFloat(document.getElementById('development-percent').value) || 0;
    const business = parseFloat(document.getElementById('business-percent').value) || 0;
    const indivisible = parseFloat(document.getElementById('indivisible-percent').value) || 0;
    
    const total = reserve + development + business + indivisible;
    document.getElementById('distribution-total').textContent = total.toFixed(1) + '%';
    
    const warning = document.getElementById('distribution-warning');
    const saveBtn = document.querySelector('#fund-distribution-form .action-button.save');
    
    if (total !== 100) {
        warning.style.display = 'block';
        saveBtn.disabled = true;
    } else {
        warning.style.display = 'none';
        saveBtn.disabled = false;
    }
}

function saveFundDistribution() {
    cooperativeSettings.fundDistribution = {
        type: document.getElementById('distribution-type').value,
        reserve: parseFloat(document.getElementById('reserve-percent').value) || 0,
        development: parseFloat(document.getElementById('development-percent').value) || 0,
        business: parseFloat(document.getElementById('business-percent').value) || 0,
        indivisible: parseFloat(document.getElementById('indivisible-percent').value) || 0
    };
    saveSettings();
    closeSideMenu();
    alert('Распределение по фондам сохранено!');
}

// Функция для отображения настроек распределения прибыли
function showProfitDistributionSettings() {
    const dist = cooperativeSettings.profitDistribution || { type: 'percent', reserve: 0, development: 0, members: 0, other: 0, retainedEarnings: 0 };
    
    const total = (dist.reserve || 0) + (dist.development || 0) + (dist.members || 0) + (dist.other || 0) + (dist.retainedEarnings || 0);
    const isValid = total === 100;
    
    const content = `
        <div class="settings-form">
            <h3>Распределение прибыли от предпринимательской деятельности</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Укажите пропорции распределения прибыли, полученной от предпринимательской деятельности кооператива.</p>
                <p style="margin-top: 10px;"><strong>Текущая сумма:</strong> <span style="color: ${isValid ? 'green' : 'red'};">${total}%</span></p>
                <p style="margin-top: 5px; font-size: 13px;">⚠️ Прибыль от деятельности распределяется только после уплаты всех налогов!</p>
            </div>
            
            <form id="profit-distribution-form">
                <div class="form-group">
                    <label>Тип распределения:</label>
                    <select id="profit-distribution-type">
                        <option value="percent" ${dist.type === 'percent' ? 'selected' : ''}>В процентах (%)</option>
                        <option value="fixed" ${dist.type === 'fixed' ? 'selected' : ''}>В фиксированной сумме (руб.)</option>
                    </select>
                </div>
                
                <div class="form-section">
                    <h4>📊 Направления распределения</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="profit-reserve-percent">В резервный фонд, %</label>
                            <input type="number" id="profit-reserve-percent" value="${dist.reserve || 0}" min="0" max="100" step="0.1" onchange="validateProfitDistributionPercent()">
                            <div class="hint">Для покрытия возможных убытков</div>
                        </div>
                        <div class="form-group">
                            <label for="profit-development-percent">В фонд развития, %</label>
                            <input type="number" id="profit-development-percent" value="${dist.development || 0}" min="0" max="100" step="0.1" onchange="validateProfitDistributionPercent()">
                            <div class="hint">На развитие кооператива</div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="profit-members-percent">На выплаты пайщикам, %</label>
                            <input type="number" id="profit-members-percent" value="${dist.members || 0}" min="0" max="100" step="0.1" onchange="validateProfitDistributionPercent()">
                            <div class="hint">Дивиденды по паям</div>
                        </div>
                        <div class="form-group">
                            <label for="profit-other-percent">Прочие направления, %</label>
                            <input type="number" id="profit-other-percent" value="${dist.other || 0}" min="0" max="100" step="0.1" onchange="validateProfitDistributionPercent()">
                            <div class="hint">Благотворительность и др.</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profit-retained-percent">Нераспределённая прибыль, %</label>
                        <input type="number" id="profit-retained-percent" value="${dist.retainedEarnings || 0}" min="0" max="100" step="0.1" onchange="validateProfitDistributionPercent()">
                        <div class="hint">Прибыль, не распределённая в текущем периоде</div>
                    </div>
                    <div class="form-group">
                        <label>Итого: <span id="profit-distribution-total">${total}%</span></label>
                        <div id="profit-distribution-warning" style="color: red; display: ${!isValid ? 'block' : 'none'};">
                            ⚠️ Сумма процентов должна равняться 100%!
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveProfitDistribution()" ${!isValid ? 'disabled' : ''}>Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Распределение прибыли', content);
}

function validateProfitDistributionPercent() {
    const reserve = parseFloat(document.getElementById('profit-reserve-percent').value) || 0;
    const development = parseFloat(document.getElementById('profit-development-percent').value) || 0;
    const members = parseFloat(document.getElementById('profit-members-percent').value) || 0;
    const other = parseFloat(document.getElementById('profit-other-percent').value) || 0;
    const retained = parseFloat(document.getElementById('profit-retained-percent').value) || 0;

    const total = reserve + development + members + other + retained;
    document.getElementById('profit-distribution-total').textContent = total.toFixed(1) + '%';

    const warning = document.getElementById('profit-distribution-warning');
    const saveBtn = document.querySelector('#profit-distribution-form .action-button.save');

    if (total !== 100) {
        warning.style.display = 'block';
        saveBtn.disabled = true;
    } else {
        warning.style.display = 'none';
        saveBtn.disabled = false;
    }
}

function saveProfitDistribution() {
    cooperativeSettings.profitDistribution = {
        type: document.getElementById('profit-distribution-type').value,
        reserve: parseFloat(document.getElementById('profit-reserve-percent').value) || 0,
        development: parseFloat(document.getElementById('profit-development-percent').value) || 0,
        members: parseFloat(document.getElementById('profit-members-percent').value) || 0,
        other: parseFloat(document.getElementById('profit-other-percent').value) || 0,
        retainedEarnings: parseFloat(document.getElementById('profit-retained-percent').value) || 0
    };
    saveSettings();
    closeSideMenu();
    alert('Распределение прибыли сохранено!');
}

// Функция для отображения настроек учётной политики
function showAccountingPolicySettings() {
    const policy = cooperativeSettings.accountingPolicy || { currency: 'RUB', fiscalYearStart: '01-01', inventoryFrequency: 'yearly', fixedAssetLimit: 100000 };
    
    const content = `
        <div class="settings-form">
            <h3>Учётная политика</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Параметры бухгалтерского и налогового учёта.</p>
            </div>
            
            <form id="accounting-policy-form">
                <div class="form-section">
                    <h4>💱 Общие параметры</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="currency">Валюта учёта</label>
                            <select id="currency">
                                <option value="RUB" ${policy.currency === 'RUB' ? 'selected' : ''}>RUB (Российский рубль)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="fiscal-year-start">Начало финансового года</label>
                            <input type="text" id="fiscal-year-start" value="${policy.fiscalYearStart}" placeholder="ММ-ДД" pattern="[0-9]{2}-[0-9]{2}">
                            <div class="hint">Формат: ММ-ДД</div>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>📦 Основные средства</h4>
                    <div class="form-group">
                        <label for="fixed-asset-limit">Лимит стоимости ОС, руб.</label>
                        <input type="number" id="fixed-asset-limit" value="${policy.fixedAssetLimit || 100000}" min="0">
                        <div class="hint">Имущество дешевле этой суммы учитывается как МПЗ</div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>📋 Инвентаризация</h4>
                    <div class="form-group">
                        <label for="inventory-frequency">Периодичность</label>
                        <select id="inventory-frequency">
                            <option value="yearly" ${policy.inventoryFrequency === 'yearly' ? 'selected' : ''}>Ежегодно</option>
                            <option value="halfyearly" ${policy.inventoryFrequency === 'halfyearly' ? 'selected' : ''}>Раз в полгода</option>
                            <option value="quarterly" ${policy.inventoryFrequency === 'quarterly' ? 'selected' : ''}>Ежеквартально</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button type="button" class="action-button save" onclick="saveAccountingPolicy()">Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

function saveAccountingPolicy() {
    cooperativeSettings.accountingPolicy = {
        currency: document.getElementById('currency').value,
        fiscalYearStart: document.getElementById('fiscal-year-start').value,
        inventoryFrequency: document.getElementById('inventory-frequency').value,
        fixedAssetLimit: parseFloat(document.getElementById('fixed-asset-limit').value) || 100000
    };
    saveSettings();
    closeSideMenu();
    alert('Учётная политика сохранена!');
}

// Функция для отображения настроек данных
function showDataSettings() {
    const content = `
        <div class="settings-form">
            <h3>Данные и хранение</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Настройки хранения данных и резервного копирования.</p>
                <p style="margin-top: 10px;"><strong>📁 Папка для хранения:</strong> C:\КООПЕРАНТ</p>
                <p style="font-size: 13px; color: #666;">Данные хранятся в подпапках: Data, Documents, Reports, Applications, Certificates, Protocols</p>
            </div>

            <div class="form-section">
                <h4>💾 Резервное копирование</h4>
                <button type="button" class="action-button" onclick="createBackup()" style="margin-right: 10px;">Создать резервную копию</button>
                <button type="button" class="action-button" onclick="restoreFromBackup()">Восстановить из копии</button>
            </div>
            
            <div class="form-section">
                <h4>🗑️ Очистка данных</h4>
                <p style="color: red;">⚠️ Вни��ание! Эти действия необратимы.</p>
                <button type="button" class="action-button delete" onclick="clearAllData()" style="background-color: #d32f2f;">Очистить все данные</button>
            </div>
            
            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Данные и хранение', content);
}

function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие необратимо!')) {
        if (confirm('Вы действительно уверены? Все пайщики, взносы, проводки будут удалены!')) {
            members = [];
            payments = [];
            transactions = [];
            documents = [];
            applications = [];
            meetings = [];
            certificates = [];
            saveSettings();
            saveData();
            alert('Все данные удалены. Перезагрузите страницу.');
            location.reload();
        }
    }
}

// Функция для отображения системных настроек
function showSystemSettings() {
    const content = `
        <div class="settings-form">
            <h3>Системные параметры</h3>
            
            <div class="settings-info">
                <h4>ℹ️ Информация</h4>
                <p>Дополнительные настройки системы.</p>
            </div>
            
            <div class="form-section">
                <h4>🔔 Уведомления</h4>
                <div class="form-group">
                    <label>
                        <input type="checkbox" checked> Уведомлять о предстоящих платежах
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" checked> Уведомлять о собраниях
                    </label>
                </div>
            </div>
            
            <div class="form-section">
                <h4>📊 Отчётность</h4>
                <div class="form-group">
                    <label for="report-format">Формат отчётов по умолчанию</label>
                    <select id="report-format">
                        <option value="pdf">PDF</option>
                        <option value="xlsx">Excel</option>
                        <option value="html">HTML</option>
                    </select>
                </div>
            </div>
            
            <div class="form-section">
                <h4>ℹ️ О системе</h4>
                <p><strong>Версия:</strong> 1.0.0</p>
                <p><strong>Дата сборки:</strong> 2026</p>
            </div>
            
            <div style="margin-top: 20px;">
                <button type="button" class="action-button cancel" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `;

    showInSideMenu('Учётная политика', content);
}

// ==================== ФУНКЦИИ ЗАГРУЗКИ ДАННЫХ В ТАБЛИЦЫ ====================

// Загрузка данных пайщиков в таблицу
function loadMembersData() {
    const tbody = document.getElementById('members-tbody');
    if (!tbody) {
        // Это нормально для messenger интерфейса
        return;
    }

    tbody.innerHTML = '';
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Пайщики не найдены</td></tr>';
        return;
    }

    members.forEach(member => {
        const row = document.createElement('tr');
        
        // Определение статуса
        let statusText = member.status;
        let statusClass = '';
        if (member.status === 'active') {
            statusText = 'Активен';
            statusClass = 'status-active';
        } else if (member.status === 'suspended') {
            statusText = 'Приостановлен';
            statusClass = 'status-suspended';
        } else if (member.status === 'withdrawn') {
            statusText = 'Выбыл';
            statusClass = 'status-withdrawn';
        } else if (member.status === 'pending') {
            statusText = 'На рассмотрении';
            statusClass = 'status-pending';
        }

        row.innerHTML = `
            <td>${member.id}</td>
            <td>${member.name || '—'}</td>
            <td>${member.joinDate || '—'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${member.cooperativePlot || '—'}</td>
            <td>${member.contact || '—'}</td>
            <td style="display:flex;gap:5px;justify-content:center;">
                <button class="action-button" onclick="editMember('${member.id}')">✏️</button>
                <button class="action-button delete" onclick="deleteMember('${member.id}')">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    console.log('✅ Загружено пайщиков:', members.length);
}

// Загрузка данных взносов в таблицу
function loadPaymentsData() {
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) {
        console.warn('tbody payments-tbody не найден');
        return;
    }

    tbody.innerHTML = '';
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#999">Взносы не найдены</td></tr>';
        return;
    }

    payments.forEach(payment => {
        const row = document.createElement('tr');
        
        // Поиск пайщика по ID
        const member = members.find(m => m.id === payment.memberId);
        
        // Текст типа взноса
        const typeText = getExtendedPaymentTypeText(payment.type);
        
        // Статус оплаты
        const statusText = payment.paid ? 'Оплачено' : 'Не оплачено';
        const statusClass = payment.paid ? 'status-paid' : 'status-unpaid';

        row.innerHTML = `
            <td>${payment.id}</td>
            <td>${member ? member.name : '—'}</td>
            <td>${typeText}</td>
            <td>${payment.method === 'cash' ? 'Наличные' : payment.method === 'non_cash' ? 'Безналичные' : '—'}</td>
            <td>${payment.amount ? payment.amount.toLocaleString() : '0'} ₽</td>
            <td>${payment.date || '—'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td style="display:flex;gap:5px;justify-content:center;">
                <button class="action-button" onclick="editPayment('${payment.id}')">✏️</button>
                <button class="action-button delete" onclick="deletePayment('${payment.id}')">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    console.log('✅ Загружено взносов:', payments.length);
}

// Загрузка данных бухгалтерии в таблицу
function loadTransactionsData() {
    const tbody = document.getElementById('transactions-tbody');
    if (!tbody) {
        console.warn('tbody transactions-tbody не найден');
        return;
    }

    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Проводки не найдены</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.date || '—'}</td>
            <td>${transaction.debitAccount || '—'}</td>
            <td>${transaction.creditAccount || '—'}</td>
            <td>${transaction.amount ? transaction.amount.toLocaleString() : '0'} ₽</td>
            <td>${transaction.description || '—'}</td>
            <td style="display:flex;gap:5px;justify-content:center;">
                <button class="action-button" onclick="editTransaction('${transaction.id}')">✏️</button>
                <button class="action-button delete" onclick="deleteTransaction('${transaction.id}')">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    console.log('✅ Загружено проводок:', transactions.length);
}

// Загрузка данных документов в таблицу
function loadDocumentsData() {
    const tbody = document.getElementById('documents-tbody');
    if (!tbody) {
        console.warn('tbody documents-tbody не найден');
        return;
    }

    tbody.innerHTML = '';
    
    if (documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">Документы не найдены</td></tr>';
        return;
    }

    documents.forEach(doc => {
        const row = document.createElement('tr');
        
        // Тип документа
        const typeText = doc.type || '—';
        
        // Размер в КБ
        const sizeText = doc.size ? (doc.size / 1024).toFixed(2) + ' КБ' : '—';

        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${doc.name || '—'}</td>
            <td>${typeText}</td>
            <td>${doc.date || '—'}</td>
            <td>${sizeText}</td>
            <td style="display:flex;gap:5px;justify-content:center;">
                <button class="action-button" onclick="viewDocument('${doc.id}')">👁️</button>
                <button class="action-button delete" onclick="deleteDocument('${doc.id}')">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    console.log('✅ Загружено документов:', documents.length);
}

// Загрузка данных заявлений в таблицу (уже есть в application_functions.js, но добавим проверку)
function loadApplicationsDataWrapper() {
    // Проверяем, есть ли функция в application_functions.js
    if (typeof window.loadApplicationsData === 'function') {
        window.loadApplicationsData();
    } else {
        const tbody = document.getElementById('applications-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">Заявления не найдены</td></tr>';
            return;
        }

        applications.forEach(app => {
            const row = document.createElement('tr');
            
            let statusText = 'На рассмотрении';
            let statusClass = 'status-pending';
            if (app.status === 'approved') {
                statusText = 'Одобрено';
                statusClass = 'status-approved';
            } else if (app.status === 'rejected') {
                statusText = 'Отклонено';
                statusClass = 'status-rejected';
            }

            row.innerHTML = `
                <td>${app.id}</td>
                <td>${app.applicantName || '—'}</td>
                <td>${app.applicantContact || '—'}</td>
                <td>${app.submissionDate || '—'}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td style="display:flex;gap:5px;justify-content:center;">
                    <button class="action-button" onclick="viewApplication('${app.id}')">👁️</button>
                    <button class="action-button" onclick="processApplication('${app.id}')">⚙️</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        console.log('✅ Загружено заявлений:', applications.length);
    }
}

// Загрузка данных заседаний в таблицу
function loadMeetingsData() {
    const tbody = document.getElementById('meetings-tbody');
    if (!tbody) {
        console.warn('tbody meetings-tbody не найден');
        return;
    }

    tbody.innerHTML = '';
    
    if (meetings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#999">Заседания не найдены</td></tr>';
        return;
    }

    meetings.forEach(meeting => {
        const row = document.createElement('tr');
        
        // Тип заседания
        const typeText = meeting.type || '—';
        
        // Статус
        let statusText = meeting.status || 'Запланировано';
        let statusClass = 'status-pending';
        if (meeting.status === 'completed') {
            statusText = 'Завершено';
            statusClass = 'status-completed';
        } else if (meeting.status === 'cancelled') {
            statusText = 'Отменено';
            statusClass = 'status-cancelled';
        }

        row.innerHTML = `
            <td>${meeting.id}</td>
            <td>${meeting.date || '—'}</td>
            <td>${typeText}</td>
            <td>${meeting.topic || '—'}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td style="display:flex;gap:5px;justify-content:center;">
                <button class="action-button" onclick="viewMeeting('${meeting.id}')">👁️</button>
                <button class="action-button" onclick="editMeeting('${meeting.id}')">✏️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    console.log('✅ Загружено заседаний:', meetings.length);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Вспомогательные функции
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}

// Функция для отображения контента в боковом меню (40% ширины)
function showInSideMenu(title, content) {
    showSideMenu(title, content);
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}


// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==================== ЭКСПОРТ ДАННЫХ ДЛЯ MESSENGER ====================
// Делаем данные доступными для messenger-app-v2.js
window.members = members;
window.payments = payments;
window.transactions = transactions;
window.documents = documents;
window.applications = applications;
window.meetings = meetings;
window.certificates = certificates;
window.cooperativeSettings = cooperativeSettings;

console.log('✅ app.js загружен, данные экспортированы в window');
console.log('📊 Пайщиков:', members.length);
console.log('📊 Взносов:', payments.length);
console.log('📊 Проводок:', transactions.length);

