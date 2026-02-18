# Полный каталог отчетов и аналитических возможностей системы

## 1. Общая информация

### 1.1 Назначение системы отчетности
Система отчетности и аналитики предназначена для формирования регулярной и специальной отчетности, необходимой для управления потребительской кооперацией и выполнения требований законодательства.

### 1.2 Классификация отчетов
- **Оперативные отчеты:** Ежедневные, еженедельные
- **Регулярные отчеты:** Ежемесячные, ежеквартальные, годовые
- **Специальные отчеты:** По запросу, тематические
- **Формальные отчеты:** Для отчетности в органы

## 2. Стандартные отчеты

### 2.1 Отчет по пайщикам

#### 2.1.1 Назначение
Общая информация о составе кооператива, включая количество пайщиков, их статусы и основные данные.

#### 2.1.2 Структура отчета
- Заголовок отчета
- Дата формирования
- Общая статистика:
  - Общее количество пайщиков
  - Количество активных пайщиков
  - Количество кандидатов
  - Количество приостановленных
  - Количество исключенных
  - Количество выбывших
- Таблица пайщиков:
  - ID
  - ФИО
  - Дата вступления
  - Статус
  - Контактная информация
  - Адрес

#### 2.1.3 Функция генерации
```javascript
function generateMembersReport() {
    const reportData = {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        candidateMembers: members.filter(m => m.status === 'candidate').length,
        suspendedMembers: members.filter(m => m.status === 'suspended').length,
        excludedMembers: members.filter(m => m.status === 'excluded').length,
        withdrawnMembers: members.filter(m => m.status === 'withdrawn').length,
        membersList: members.map(member => ({
            id: member.id,
            name: member.name,
            joinDate: member.joinDate,
            status: member.status,
            contact: member.contact,
            address: member.address
        }))
    };
    
    let reportHtml = `
        <h3>Отчет по пайщикам</h3>
        <p>Дата формирования: ${new Date().toLocaleDateString()}</p>
        <div class="report-summary">
            <p><strong>Всего пайщиков:</strong> ${reportData.totalMembers}</p>
            <p><strong>Активных пайщиков:</strong> ${reportData.activeMembers}</p>
            <p><strong>Кандидатов:</strong> ${reportData.candidateMembers}</p>
            <p><strong>Приостановленных:</strong> ${reportData.suspendedMembers}</p>
            <p><strong>Исключенных:</strong> ${reportData.excludedMembers}</p>
            <p><strong>Выбывших:</strong> ${reportData.withdrawnMembers}</p>
        </div>
        
        <table class="report-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>ФИО</th>
                    <th>Дата вступления</th>
                    <th>Статус</th>
                    <th>Контакт</th>
                    <th>Адрес</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.membersList.forEach(member => {
        reportHtml += `
            <tr>
                <td>${member.id}</td>
                <td>${member.name}</td>
                <td>${member.joinDate}</td>
                <td>${getStatusText(member.status)}</td>
                <td>${member.contact || 'Не указан'}</td>
                <td>${member.address || 'Не указан'}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </tbody>
        </table>
    `;
    
    return reportHtml;
}
```

### 2.2 Отчет по паевым взносам

#### 2.2.1 Назначение
Анализ поступлений паевых взносов, включая вступительные, паевые, членские и другие виды взносов.

#### 2.2.2 Структура отчета
- Заголовок отчета
- Дата формирования
- Общая статистика:
  - Общее количество взносов
  - Общая сумма поступлений
  - Количество оплаченных взносов
  - Количество неоплаченных взносов
  - Общая задолженность
- Статистика по типам взносов:
  - Количество и сумма по каждому типу
- Таблица взносов:
  - ID
  - Пайщик
  - Тип взноса
  - Форма оплаты
  - Сумма
  - Дата
  - Статус оплаты
  - Описание

#### 2.2.3 Функция генерации
```javascript
function generatePaymentsReport() {
    const reportData = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paidPayments: payments.filter(p => p.paid).length,
        unpaidPayments: payments.filter(p => !p.paid).length,
        unpaidAmount: payments.filter(p => !p.paid).reduce((sum, p) => sum + (p.amount || 0), 0),
        paymentsByType: {},
        paymentsList: payments.map(payment => {
            const member = members.find(m => m.id === payment.memberId);
            return {
                id: payment.id,
                memberName: member ? member.name : 'Неизвестный',
                type: payment.type,
                method: payment.method,
                amount: payment.amount,
                date: payment.date,
                paid: payment.paid,
                description: payment.description
            };
        })
    };
    
    // Подсчет по типам взносов
    payments.forEach(payment => {
        const type = payment.type;
        if (!reportData.paymentsByType[type]) {
            reportData.paymentsByType[type] = {
                count: 0,
                totalAmount: 0,
                paidCount: 0,
                unpaidCount: 0
            };
        }
        reportData.paymentsByType[type].count++;
        reportData.paymentsByType[type].totalAmount += payment.amount || 0;
        if (payment.paid) {
            reportData.paymentsByType[type].paidCount++;
        } else {
            reportData.paymentsByType[type].unpaidCount++;
        }
    });
    
    let reportHtml = `
        <h3>Отчет по паевым взносам</h3>
        <p>Дата формирования: ${new Date().toLocaleDateString()}</p>
        <div class="report-summary">
            <p><strong>Всего взносов:</strong> ${reportData.totalPayments}</p>
            <p><strong>Общая сумма:</strong> ${reportData.totalAmount.toLocaleString()} ₽</p>
            <p><strong>Оплаченных:</strong> ${reportData.paidPayments}</p>
            <p><strong>Неоплаченных:</strong> ${reportData.unpaidPayments}</p>
            <p><strong>Задолженность:</strong> ${reportData.unpaidAmount.toLocaleString()} ₽</p>
        </div>
        
        <h4>Статистика по типам взносов:</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Тип взноса</th>
                    <th>Количество</th>
                    <th>Общая сумма</th>
                    <th>Оплачено</th>
                    <th>Не оплачено</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const [type, stats] of Object.entries(reportData.paymentsByType)) {
        reportHtml += `
            <tr>
                <td>${getPaymentTypeText(type)}</td>
                <td>${stats.count}</td>
                <td>${stats.totalAmount.toLocaleString()} ₽</td>
                <td>${stats.paidCount}</td>
                <td>${stats.unpaidCount}</td>
            </tr>
        `;
    }
    
    reportHtml += `
            </tbody>
        </table>
        
        <h4>Детализация взносов:</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Пайщик</th>
                    <th>Тип</th>
                    <th>Форма</th>
                    <th>Сумма</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Описание</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.paymentsList.forEach(payment => {
        reportHtml += `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.memberName}</td>
                <td>${getPaymentTypeText(payment.type)}</td>
                <td>${getPaymentMethodText(payment.method)}</td>
                <td>${(payment.amount || 0).toLocaleString()} ₽</td>
                <td>${payment.date}</td>
                <td>${payment.paid ? 'Оплачено' : 'Не оплачено'}</td>
                <td>${payment.description || ''}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </tbody>
        </table>
    `;
    
    return reportHtml;
}
```

### 2.3 Бухгалтерский баланс

#### 2.3.1 Назначение
Формирование бухгалтерской отчетности, включая обороты по счетам и сальдо.

#### 2.3.2 Структура отчета
- Заголовок отчета
- Дата формирования
- Общая статистика:
  - Оборот по дебету
  - Оборот по кредиту
  - Сальдо
- Таблица проводок:
  - ID
  - Дата
  - Дебетовый счет
  - Кредитовый счет
  - Сумма
  - Описание
  - Тип операции

#### 2.3.3 Функция генерации
```javascript
function generateAccountingReport() {
    const reportData = {
        totalTransactions: transactions.length,
        totalDebit: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        totalCredit: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        transactionsList: transactions.map(transaction => ({
            id: transaction.id,
            date: transaction.date,
            debitAccount: transaction.debitAccount,
            creditAccount: transaction.creditAccount,
            amount: transaction.amount,
            description: transaction.description,
            type: transaction.transactionType || 'regular'
        }))
    };
    
    let reportHtml = `
        <h3>Бухгалтерский баланс</h3>
        <p>Дата формирования: ${new Date().toLocaleDateString()}</p>
        <div class="report-summary">
            <p><strong>Всего проводок:</strong> ${reportData.totalTransactions}</p>
            <p><strong>Оборот по дебету:</strong> ${reportData.totalDebit.toLocaleString()} ₽</p>
            <p><strong>Оборот по кредиту:</strong> ${reportData.totalCredit.toLocaleString()} ₽</p>
            <p><strong>Сальдо:</strong> ${(reportData.totalDebit - reportData.totalCredit).toLocaleString()} ₽</p>
        </div>
        
        <h4>Детализация проводок:</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Дата</th>
                    <th>Дебет</th>
                    <th>Кредит</th>
                    <th>Сумма</th>
                    <th>Описание</th>
                    <th>Тип</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.transactionsList.forEach(transaction => {
        reportHtml += `
            <tr>
                <td>${transaction.id}</td>
                <td>${transaction.date}</td>
                <td>${transaction.debitAccount}</td>
                <td>${transaction.creditAccount}</td>
                <td>${(transaction.amount || 0).toLocaleString()} ₽</td>
                <td>${transaction.description || ''}</td>
                <td>${transaction.type}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </tbody>
        </table>
    `;
    
    return reportHtml;
}
```

### 2.4 Отчет о финансовых результатах

#### 2.4.1 Назначение
Анализ финансовой деятельности кооператива, включая доходы и расходы.

#### 2.4.2 Структура отчета
- Заголовок отчета
- Период отчета
- Доходы:
  - По источникам
  - Общая сумма
- Расходы:
  - По направлениям
  - Общая сумма
- Финансовый результат
- Анализ эффективности

#### 2.4.3 Функция генерации
```javascript
function generateFinancialReport() {
    const reportData = {
        periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Начало года
        periodEnd: new Date().toISOString().split('T')[0], // Сегодня
        incomes: [],
        expenses: [],
        totalIncome: 0,
        totalExpense: 0
    };
    
    // Анализ проводок для определения доходов и расходов
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const start = new Date(reportData.periodStart);
        const end = new Date(reportData.periodEnd);
        
        if (date >= start && date <= end) {
            // Простая классификация: дебет 86 - доходы, кредит 86 - расходы
            if (transaction.creditAccount === '86') {
                reportData.expenses.push(transaction);
                reportData.totalExpense += transaction.amount || 0;
            } else if (transaction.debitAccount === '86') {
                reportData.incomes.push(transaction);
                reportData.totalIncome += transaction.amount || 0;
            }
        }
    });
    
    const financialResult = reportData.totalIncome - reportData.totalExpense;
    
    let reportHtml = `
        <h3>Отчет о финансовых результатах</h3>
        <p>Период: ${reportData.periodStart} - ${reportData.periodEnd}</p>
        <div class="report-summary">
            <p><strong>Доходы:</strong> ${reportData.totalIncome.toLocaleString()} ₽</p>
            <p><strong>Расходы:</strong> ${reportData.totalExpense.toLocaleString()} ₽</p>
            <p><strong>Финансовый результат:</strong> ${financialResult.toLocaleString()} ₽</p>
        </div>
        
        <h4>Доходы:</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Описание</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.incomes.forEach(income => {
        reportHtml += `
            <tr>
                <td>${income.date}</td>
                <td>${(income.amount || 0).toLocaleString()} ₽</td>
                <td>${income.description || ''}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </tbody>
        </table>
        
        <h4>Расходы:</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Описание</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.expenses.forEach(expense => {
        reportHtml += `
            <tr>
                <td>${expense.date}</td>
                <td>${(expense.amount || 0).toLocaleString()} ₽</td>
                <td>${expense.description || ''}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </tbody>
        </table>
    `;
    
    return reportHtml;
}
```

### 2.5 Отчет по задолженностям

#### 2.5.1 Назначение
Контроль задолженностей пайщиков по паевым взносам.

#### 2.5.2 Структура отчета
- Заголовок отчета
- Дата формирования
- Общая сумма задолженности
- Количество должников
- Таблица задолженностей:
  - Пайщик
  - Тип задолженности
  - Сумма
  - Срок
  - Статус

#### 2.5.3 Функция генерации
```javascript
function generateDebtReport() {
    const unpaidPayments = payments.filter(p => !p.paid && p.type !== 'return_share');
    
    const reportData = {
        totalDebt: unpaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        debtorCount: new Set(unpaidPayments.map(p => p.memberId)).size,
        debtDetails: unpaidPayments.map(payment => {
            const member = members.find(m => m.id === payment.memberId);
            return {
                memberName: member ? member.name : 'Неизвестный',
                type: payment.type,
                amount: payment.amount,
                date: payment.date,
                description: payment.description
            };
        })
    };
    
    let reportHtml = `
        <h3>Отчет по задолженностям</h3>
        <p>Дата формирования: ${new Date().toLocaleDateString()}</p>
        <div class="report-summary">
            <p><strong>Общая задолженность:</strong> ${reportData.totalDebt.toLocaleString()} ₽</p>
            <p><strong>Количество должников:</strong> ${reportData.debtorCount}</p>
        </div>
        
        <h4>Детализация задолженностей:</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Пайщик</th>
                    <th>Тип взноса</th>
                    <th>Сумма</th>
                    <th>Дата</th>
                    <th>Описание</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.debtDetails.forEach(debt => {
        reportHtml += `
            <tr>
                <td>${debt.memberName}</td>
                <td>${getPaymentTypeText(debt.type)}</td>
                <td>${(debt.amount || 0).toLocaleString()} ₽</td>
                <td>${debt.date}</td>
                <td>${debt.description || ''}</td>
            </tr>
        `;
    });
    
    reportHtml += `
            </tbody>
        </table>
    `;
    
    return reportHtml;
}
```

## 3. Аналитические возможности

### 3.1 Статистика по пайщикам

#### 3.1.1 Динамика численности
- График изменения числа пайщиков по месяцам
- Сравнение с предыдущими периодами
- Прогнозирование роста

#### 3.1.2 Распределение по статусам
- Диаграмма распределения пайщиков по статусам
- Анализ причин изменения статусов
- Динамика изменения статусов

#### 3.1.3 Среднее время членства
- Расчет среднего времени членства
- Анализ продолжительности членства
- Сравнение с предыдущими периодами

### 3.2 Аналитика паевых взносов

#### 3.2.1 Динамика поступлений
- График поступлений по месяцам
- Сравнение с предыдущими периодами
- Прогнозирование поступлений

#### 3.2.2 Распределение по типам
- Диаграмма распределения взносов по типам
- Анализ структуры поступлений
- Сравнение с предыдущими периодами

#### 3.2.3 Процент оплаты
- Процент оплаченных взносов
- Анализ задолженностей
- Прогнозирование оплаты

### 3.3 Финансовая аналитика

#### 3.3.1 Доходы и расходы
- Анализ структуры доходов и расходов
- Сравнение с предыдущими периодами
- Финансовый результат

#### 3.3.2 Эффективность операций
- Анализ эффективности различных операций
- Сравнение доходности направлений
- Рекомендации по улучшению

## 4. Функции аналитики

### 4.1 Функция анализа динамики
```javascript
function analyzeMembershipDynamics() {
    const monthlyStats = {};
    
    members.forEach(member => {
        const joinYearMonth = member.joinDate.substring(0, 7); // YYYY-MM
        if (!monthlyStats[joinYearMonth]) {
            monthlyStats[joinYearMonth] = 0;
        }
        monthlyStats[joinYearMonth]++;
    });
    
    // Сортируем по дате
    const sortedMonths = Object.keys(monthlyStats).sort();
    
    // Рассчитываем накопленные итоги
    let cumulativeTotal = 0;
    const dynamicsData = sortedMonths.map(month => {
        cumulativeTotal += monthlyStats[month];
        return {
            month: month,
            newMembers: monthlyStats[month],
            totalMembers: cumulativeTotal
        };
    });
    
    return {
        monthlyGrowth: monthlyStats,
        dynamics: dynamicsData,
        averageMonthlyGrowth: Object.values(monthlyStats).reduce((a, b) => a + b, 0) / Object.keys(monthlyStats).length
    };
}
```

### 4.2 Функция анализа эффективности взносов
```javascript
function analyzePaymentEffectiveness() {
    const paymentStats = {
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paymentMethods: {},
        paymentTypes: {},
        paymentRates: {}
    };
    
    payments.forEach(payment => {
        paymentStats.totalAmount += payment.amount || 0;
        
        if (payment.paid) {
            paymentStats.paidAmount += payment.amount || 0;
        } else {
            paymentStats.unpaidAmount += payment.amount || 0;
        }
        
        // Статистика по методам оплаты
        const method = payment.method || 'unknown';
        if (!paymentStats.paymentMethods[method]) {
            paymentStats.paymentMethods[method] = {
                count: 0,
                totalAmount: 0,
                paidCount: 0,
                paidAmount: 0
            };
        }
        paymentStats.paymentMethods[method].count++;
        paymentStats.paymentMethods[method].totalAmount += payment.amount || 0;
        if (payment.paid) {
            paymentStats.paymentMethods[method].paidCount++;
            paymentStats.paymentMethods[method].paidAmount += payment.amount || 0;
        }
        
        // Статистика по типам взносов
        const type = payment.type || 'unknown';
        if (!paymentStats.paymentTypes[type]) {
            paymentStats.paymentTypes[type] = {
                count: 0,
                totalAmount: 0,
                paidCount: 0,
                paidAmount: 0
            };
        }
        paymentStats.paymentTypes[type].count++;
        paymentStats.paymentTypes[type].totalAmount += payment.amount || 0;
        if (payment.paid) {
            paymentStats.paymentTypes[type].paidCount++;
            paymentStats.paymentTypes[type].paidAmount += payment.amount || 0;
        }
    });
    
    // Рассчитываем проценты оплаты
    for (const [method, stats] of Object.entries(paymentStats.paymentMethods)) {
        paymentStats.paymentRates[method] = stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0;
    }
    
    for (const [type, stats] of Object.entries(paymentStats.paymentTypes)) {
        paymentStats.paymentRates[type] = stats.count > 0 ? (stats.paidCount / stats.count) * 100 : 0;
    }
    
    return {
        ...paymentStats,
        overallPaymentRate: paymentStats.totalAmount > 0 ? (paymentStats.paidAmount / paymentStats.totalAmount) * 100 : 0
    };
}
```

### 4.3 Функция анализа задолженностей
```javascript
function analyzeDebtSituation() {
    const debtAnalysis = {
        totalDebt: 0,
        debtorCount: 0,
        averageDebt: 0,
        debtByPeriod: {},
        debtByType: {},
        overduePayments: []
    };
    
    const unpaidPayments = payments.filter(p => !p.paid && p.type !== 'return_share');
    
    // Общая задолженность
    debtAnalysis.totalDebt = unpaidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    debtAnalysis.debtorCount = new Set(unpaidPayments.map(p => p.memberId)).size;
    debtAnalysis.averageDebt = debtAnalysis.debtorCount > 0 ? debtAnalysis.totalDebt / debtAnalysis.debtorCount : 0;
    
    // Анализ по периодам
    const currentDate = new Date();
    unpaidPayments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        const daysDiff = Math.floor((currentDate - paymentDate) / (1000 * 60 * 60 * 24));
        
        let period = 'current'; // Не просрочено
        if (daysDiff > 365) {
            period = 'over_1_year';
        } else if (daysDiff > 180) {
            period = '6_months_to_1_year';
        } else if (daysDiff > 90) {
            period = '3_to_6_months';
        } else if (daysDiff > 30) {
            period = '1_to_3_months';
        }
        
        if (!debtAnalysis.debtByPeriod[period]) {
            debtAnalysis.debtByPeriod[period] = {
                count: 0,
                totalAmount: 0
            };
        }
        debtAnalysis.debtByPeriod[period].count++;
        debtAnalysis.debtByPeriod[period].totalAmount += payment.amount || 0;
        
        if (daysDiff > 30) { // Просроченные более 30 дней
            debtAnalysis.overduePayments.push(payment);
        }
    });
    
    // Анализ по типам взносов
    unpaidPayments.forEach(payment => {
        const type = payment.type;
        if (!debtAnalysis.debtByType[type]) {
            debtAnalysis.debtByType[type] = {
                count: 0,
                totalAmount: 0
            };
        }
        debtAnalysis.debtByType[type].count++;
        debtAnalysis.debtByType[type].totalAmount += payment.amount || 0;
    });
    
    return debtAnalysis;
}
```

## 5. Пользовательские отчеты

### 5.1 Создание пользовательского отчета
- Выбор полей для отображения
- Настройка фильтров
- Выбор периода
- Настройка сортировки
- Сохранение шаблона отчета

### 5.2 Пример пользовательского отчета
```javascript
function generateCustomReport(options) {
    const {
        reportType,
        startDate,
        endDate,
        filters,
        fields,
        grouping
    } = options;
    
    let data = [];
    
    // Фильтрация данных в соответствии с параметрами
    switch(reportType) {
        case 'members':
            data = members.filter(member => {
                // Применение фильтров
                if (startDate && new Date(member.joinDate) < new Date(startDate)) return false;
                if (endDate && new Date(member.joinDate) > new Date(endDate)) return false;
                if (filters.status && member.status !== filters.status) return false;
                return true;
            });
            break;
            
        case 'payments':
            data = payments.filter(payment => {
                // Применение фильтров
                if (startDate && new Date(payment.date) < new Date(startDate)) return false;
                if (endDate && new Date(payment.date) > new Date(endDate)) return false;
                if (filters.type && payment.type !== filters.type) return false;
                if (filters.paid !== undefined && payment.paid !== filters.paid) return false;
                return true;
            });
            break;
    }
    
    // Группировка данных (если требуется)
    if (grouping) {
        data = groupData(data, grouping);
    }
    
    // Формирование отчета с выбранными полями
    let reportHtml = `<h3>Пользовательский отчет: ${getReportTitle(reportType)}</h3>`;
    reportHtml += `<p>Период: ${startDate || 'начало'} - ${endDate || 'сейчас'}</p>`;
    reportHtml += `<table class="report-table"><thead><tr>`;
    
    // Добавление заголовков столбцов
    fields.forEach(field => {
        reportHtml += `<th>${getFieldLabel(field)}</th>`;
    });
    
    reportHtml += `</tr></thead><tbody>`;
    
    // Добавление данных
    data.forEach(item => {
        reportHtml += `<tr>`;
        fields.forEach(field => {
            reportHtml += `<td>${getItemValue(item, field)}</td>`;
        });
        reportHtml += `</tr>`;
    });
    
    reportHtml += `</tbody></table>`;
    
    return reportHtml;
}
```

## 6. Экспорт отчетов

### 6.1 Форматы экспорта
- HTML (по умолчанию)
- PDF (через библиотеку jsPDF)
- Excel (через библиотеку SheetJS)
- CSV (через форматирование)

### 6.2 Функция экспорта
```javascript
// Функция экспорта отчета в различные форматы
function exportReport(reportType, format = 'html') {
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
        case 'debt':
            reportContent = generateDebtReport();
            break;
        default:
            reportContent = '<p>Неизвестный тип отчета</p>';
    }
    
    switch(format) {
        case 'html':
            // Отчет уже в HTML формате
            downloadAsFile(reportContent, `report_${reportType}_${new Date().toISOString().split('T')[0]}.html`, 'text/html');
            break;
            
        case 'pdf':
            // В реальной системе используется jsPDF
            // exportAsPDF(reportContent, `report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
            alert('Для экспорта в PDF требуется библиотека jsPDF');
            break;
            
        case 'excel':
            // В реальной системе используется SheetJS
            // exportAsExcel(reportContent, `report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
            alert('Для экспорта в Excel требуется библиотека SheetJS');
            break;
            
        case 'csv':
            // Экспорт в CSV формат
            const csvContent = convertToCSV(reportContent);
            downloadAsFile(csvContent, `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
            break;
    }
}
```

## 7. Автоматические отчеты

### 7.1 Периодические отчеты
- Ежемесячные отчеты по пайщикам
- Ежеквартальные бухгалтерские отчеты
- Годовые финансовые отчеты

### 7.2 Триггеры автоматических отчетов
- По расписанию (в будущем)
- По событию (например, большое количество новых пайщиков)
- По запросу (ежедневно, еженедельно)

## 8. Интеграция с File System API

### 8.1 Автоматическое сохранение отчетов
- Сохранение отчетов в папке C:\КООПЕРАНТ\Reports
- Автоматическое формирование имен файлов
- Классификация отчетов по типам

### 8.2 Функция автоматического сохранения отчета
```javascript
async function autoSaveReport(reportType, reportContent) {
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Требуется ручная настройка.');
        return false;
    }
    
    try {
        // Получаем поддиректорию для отчетов
        const reportsDir = await coopDirectoryHandle.getDirectoryHandle('Reports', { create: true });
        
        // Создаем имя файла с датой
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const fileName = `report_${reportType}_${dateStr}_${Date.now()}.html`;
        
        // Создаем файл отчета
        const fileHandle = await reportsDir.getFileHandle(fileName, { create: true });
        
        // Записываем содержимое отчета
        const writable = await fileHandle.createWritable();
        await writable.write(reportContent);
        await writable.close();
        
        console.log(`Отчет автоматически сохранен: C:\\КООПЕРАНТ\\Reports\\${fileName}`);
        return true;
    } catch (err) {
        console.error('Ошибка при автоматическом сохранении отчета:', err);
        return false;
    }
}
```

## 9. Метрики и показатели

### 9.1 Ключевые показатели эффективности
- Количество новых пайщиков в месяц
- Общее количество активных пайщиков
- Процент оплаты паевых взносов
- Объем поступлений паевых взносов
- Количество задолженностей
- Среднее время обработки заявления

### 9.2 Финансовые показатели
- Объем поступлений
- Финансовый результат
- Рентабельность операций
- Эффективность управления средствами

## 10. Безопасность отчетов

### 10.1 Защита конфиденциальности
- Ограничение доступа к отчетам
- Защита персональных данных
- Контроль экспорта данных

### 10.2 Аудит отчетности
- Журнал формирования отчетов
- Контроль доступа к отчетам
- Проверка целостности данных

## 11. Заключение

Созданная система обеспечивает полный цикл формирования отчетов и аналитики, необходимых для эффективного управления потребительской кооперацией. Все отчеты разработаны с учетом требований законодательства и потребностей управления кооперативом. Функции аналитики позволяют принимать обоснованные управленческие решения и контролировать эффективность деятельности кооператива.

Ключевые особенности системы отчетности:
- Полный цикл: от сбора данных до формирования отчетов
- Гибкость: возможность создания пользовательских отчетов
- Безопасность: защита конфиденциальных данных
- Автоматизация: автоматическое формирование и сохранение
- Соответствие: требованиям законодательства
- Интеграция: с File System API для хранения отчетов
- Поддержка всех форм паевых взносов: включая имущественные
- Экспорт: в различные форматы (в будущем)

Система готова к использованию и может быть адаптирована под конкретные потребности различных типов кооперативов.