# Каталог отчетов и аналитических возможностей системы

## 1. Общая информация

### 1.1 Назначение отчетности
Система предоставляет широкие возможности для формирования отчетов и аналитики, необходимых для управления потребительским кооперативом и выполнения требований законодательства.

### 1.2 Классификация отчетов
- Оперативные отчеты (ежедневные, еженедельные)
- Регулярные отчеты (ежемесячные, ежеквартальные)
- Специальные отчеты (по запросу)
- Формальные отчеты (для отчетности в органы)

## 2. Основные отчеты системы

### 2.1 Отчет по пайщикам

#### 2.1.1 Структура отчета
- **Назначение:** Общая информация о составе кооператива
- **Расположение:** Раздел "Отчеты" → "Отчет по пайщикам"
- **Содержание:**
  - Общее количество пайщиков
  - Количество пайщиков по статусам
  - Список всех пайщиков с основными данными
  - Динамика изменения численности
- **Поля:**
  - ID пайщика
  - ФИО
  - Дата вступления
  - Статус
  - Контактная информация
- **Фильтры:** По статусу, дате вступления
- **Сортировка:** По ФИО, дате вступления

#### 2.1.2 Пример структуры данных
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
            contact: member.contact
        }))
    };
    
    return {
        title: 'Отчет по пайщикам',
        date: new Date().toISOString().split('T')[0],
        data: reportData,
        html: generateMembersReportHTML(reportData)
    };
}

function generateMembersReportHTML(data) {
    let html = '<h3>Отчет по пайщикам</h3>';
    html += `<p>Дата формирования: ${new Date().toLocaleDateString()}</p>`;
    html += `<p>Всего пайщиков: ${data.totalMembers}</p>`;
    html += `<p>Активных пайщиков: ${data.activeMembers}</p>`;
    html += `<p>Кандидатов: ${data.candidateMembers}</p>`;
    html += `<p>Приостановленных: ${data.suspendedMembers}</p>`;
    html += `<p>Исключенных: ${data.excludedMembers}</p>`;
    html += `<p>Выбывших: ${data.withdrawnMembers}</p>`;
    
    html += '<table><thead><tr><th>ID</th><th>ФИО</th><th>Дата вступления</th><th>Статус</th><th>Контакт</th></tr></thead><tbody>';
    
    data.membersList.forEach(member => {
        html += `<tr><td>${member.id}</td><td>${member.name}</td><td>${member.joinDate}</td><td>${getStatusText(member.status)}</td><td>${member.contact}</td></tr>`;
    });
    
    html += '</tbody></table>';
    
    return html;
}
```

### 2.2 Отчет по паевым взносам

#### 2.2.1 Структура отчета
- **Назначение:** Анализ поступлений паевых взносов
- **Расположение:** Раздел "Отчеты" → "Отчет по взносам"
- **Содержание:**
  - Общая сумма поступлений
  - Поступления по типам взносов
  - Статусы оплаты
  - Задолженности
  - Список всех паевых взносов
- **Поля:**
  - ID взноса
  - Пайщик
  - Тип взноса
  - Форма оплаты
  - Сумма
  - Дата
  - Статус оплаты
- **Фильтры:** По типу взноса, дате, статусу оплаты
- **Сортировка:** По дате, сумме

#### 2.2.2 Пример структуры данных
```javascript
function generatePaymentsReport() {
    const reportData = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paymentsByType: {},
        unpaidPayments: payments.filter(p => !p.paid),
        paidPayments: payments.filter(p => p.paid)
    };
    
    // Подсчет по типам взносов
    payments.forEach(payment => {
        const type = payment.type;
        if (!reportData.paymentsByType[type]) {
            reportData.paymentsByType[type] = {
                count: 0,
                totalAmount: 0
            };
        }
        reportData.paymentsByType[type].count++;
        reportData.paymentsByType[type].totalAmount += payment.amount || 0;
    });
    
    return {
        title: 'Отчет по паевым взносам',
        date: new Date().toISOString().split('T')[0],
        data: reportData,
        html: generatePaymentsReportHTML(reportData)
    };
}
```

### 2.3 Бухгалтерский баланс

#### 2.3.1 Структура отчета
- **Назначение:** Формирование бухгалтерской отчетности
- **Расположение:** Раздел "Отчеты" → "Бухгалтерский баланс"
- **Содержание:**
  - Обороты по дебету и кредиту
  - Сальдо по счетам
  - Общие итоги
  - Сравнение с предыдущими периодами
- **Поля:**
  - ID проводки
  - Дата
  - Дебетовый счет
  - Кредитовый счет
  - Сумма
  - Описание
  - Тип операции
- **Фильтры:** По дате, счетам, типу операции
- **Сортировка:** По дате, по счетам

### 2.4 Отчет о финансовых результатах

#### 2.4.1 Структура отчета
- **Назначение:** Анализ финансовой деятельности кооператива
- **Расположение:** Раздел "Отчеты" → "Отчет о финансовых результатах"
- **Содержание:**
  - Доходы и расходы
  - Финансовый результат
  - Анализ эффективности
  - Сравнение с предыдущими периодами
- **Поля:**
  - Тип операции
  - Сумма
  - Дата
  - Описание
- **Фильтры:** По дате, типу операции
- **Сортировка:** По дате, по сумме

### 2.5 Отчет по задолженностям

#### 2.5.1 Структура отчета
- **Назначение:** Контроль задолженностей пайщиков
- **Расположение:** Раздел "Отчеты" → "Отчет по задолженностям"
- **Содержание:**
  - Список должников
  - Суммы задолженностей
  - Сроки задолженностей
  - Рекомендации по взысканию
- **Поля:**
  - Пайщик
  - Тип задолженности
  - Сумма
  - Срок
  - Статус
- **Фильтры:** По статусу, сумме, сроку
- **Сортировка:** По сумме, по сроку

## 3. Аналитические возможности

### 3.1 Статистика по пайщикам

#### 3.1.1 Общая статистика
- **Количество пайщиков:** Отображается на главной странице
- **Распределение по статусам:** Диаграмма на главной странице
- **Динамика изменения численности:** График по месяцам
- **Среднее время членства:** Статистика по датам вступления

#### 3.1.2 Функции аналитики
```javascript
// Функция для анализа динамики численности
function analyzeMembershipDynamics() {
    const monthlyStats = {};
    
    members.forEach(member => {
        const joinYearMonth = member.joinDate.substring(0, 7); // YYYY-MM
        if (!monthlyStats[joinYearMonth]) {
            monthlyStats[joinYearMonth] = 0;
        }
        monthlyStats[joinYearMonth]++;
    });
    
    return {
        monthlyGrowth: monthlyStats,
        averageMonthlyGrowth: Object.values(monthlyStats).reduce((a, b) => a + b, 0) / Object.keys(monthlyStats).length,
        totalGrowth: members.length
    };
}
```

### 3.2 Статистика по паевым взносам

#### 3.2.1 Общая статистика
- **Общая сумма взносов:** Отображается на главной странице
- **Средний размер взноса:** Статистика по типам взносов
- **Процент оплаты:** Отношение оплаченных к общему числу
- **Динамика поступлений:** График по месяцам
- **Распределение по типам:** Диаграмма по видам взносов

#### 3.2.2 Функции аналитики
```javascript
// Функция для анализа эффективности взносов
function analyzePaymentEffectiveness() {
    const paymentStats = {
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paymentMethods: {},
        paymentTypes: {}
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
                totalAmount: 0
            };
        }
        paymentStats.paymentMethods[method].count++;
        paymentStats.paymentMethods[method].totalAmount += payment.amount || 0;
        
        // Статистика по типам взносов
        const type = payment.type || 'unknown';
        if (!paymentStats.paymentTypes[type]) {
            paymentStats.paymentTypes[type] = {
                count: 0,
                totalAmount: 0
            };
        }
        paymentStats.paymentTypes[type].count++;
        paymentStats.paymentTypes[type].totalAmount += payment.amount || 0;
    });
    
    return {
        ...paymentStats,
        paymentRate: paymentStats.totalAmount > 0 ? (paymentStats.paidAmount / paymentStats.totalAmount) * 100 : 0
    };
}
```

### 3.3 Финансовая аналитика

#### 3.3.1 Общая аналитика
- **Обороты по периодам:** Месячные, квартальные, годовые обороты
- **Анализ доходов и расходов:** Сравнение по категориям
- **Финансовые показатели:** Рентабельность, эффективность
- **Прогнозирование:** На основе исторических данных

#### 3.3.2 Функции аналитики
```javascript
// Функция для анализа финансовой эффективности
function analyzeFinancialPerformance() {
    const monthlyTransactions = {};
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const yearMonth = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyTransactions[yearMonth]) {
            monthlyTransactions[yearMonth] = {
                debitTotal: 0,
                creditTotal: 0,
                netResult: 0
            };
        }
        
        monthlyTransactions[yearMonth].debitTotal += transaction.amount || 0;
        monthlyTransactions[yearMonth].creditTotal += transaction.amount || 0;
        monthlyTransactions[yearMonth].netResult = monthlyTransactions[yearMonth].debitTotal - monthlyTransactions[yearMonth].creditTotal;
    });
    
    return {
        monthlyPerformance: monthlyTransactions,
        overallDebit: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        overallCredit: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        overallNet: transactions.reduce((sum, t) => sum + (t.amount || 0), 0) - transactions.reduce((sum, t) => sum + (t.amount || 0), 0) // В реальности нужно учитывать дебет/кредит
    };
}
```

## 4. Функции генерации отчетов

### 4.1 Основные функции

#### 4.1.1 generateReport(reportType)
- **Назначение:** Основная функция генерации отчетов
- **Параметры:** reportType - тип отчета
- **Возвращаемое значение:** HTML-контент отчета
- **Описание:** Вызывает соответствующую функцию генерации отчета

#### 4.1.2 generateMembersReport()
- **Назначение:** Генерация отчета по пайщикам
- **Параметры:** -
- **Возвращаемое значение:** HTML-контент отчета
- **Описание:** Формирует полный отчет по пайщикам

#### 4.1.3 generatePaymentsReport()
- **Назначение:** Генерация отчета по паевым взносам
- **Параметры:** -
- **Возвращаемое значение:** HTML-контент отчета
- **Описание:** Формирует отчет по паевым взносам с детализацией

#### 4.1.4 generateAccountingReport()
- **Назначение:** Генерация бухгалтерского баланса
- **Параметры:** -
- **Возвращаемое значение:** HTML-контент отчета
- **Описание:** Формирует бухгалтерский баланс с оборотами

#### 4.1.5 generateFinancialReport()
- **Назначение:** Генерация отчета о финансовых результатах
- **Параметры:** -
- **Возвращаемое значение:** HTML-контент отчета
- **Описание:** Формирует отчет о финансовых результатах

#### 4.1.6 generateDebtReport()
- **Назначение:** Генерация отчета по задолженностям
- **Параметры:** -
- **Возвращаемое значение:** HTML-контент отчета
- **Описание:** Формирует отчет по задолженностям пайщиков

### 4.2 Функции фильтрации и анализа

#### 4.2.1 filterPaymentsByDate(startDate, endDate)
- **Назначение:** Фильтрация паевых взносов по дате
- **Параметры:** startDate, endDate - диапазон дат
- **Возвращаемое значение:** Отфильтрованный массив взносов
- **Описание:** Возвращает взносы в заданном диапазоне дат

#### 4.2.2 calculateMemberDebt(memberId)
- **Назначение:** Расчет задолженности пайщика
- **Параметры:** memberId - идентификатор пайщика
- **Возвращаемое значение:** Сумма задолженности
- **Описание:** Рассчитывает общую задолженность конкретного пайщика

#### 4.2.3 getPaymentStatistics()
- **Назначение:** Получение статистики по паевым взносам
- **Параметры:** -
- **Возвращаемое значение:** Объект статистики
- **Описание:** Возвращает сводную статистику по взносам

## 5. Пользовательские отчеты

### 5.1 Настройка пользовательских отчетов

#### 5.1.1 Выбор полей
- Пользователь может выбрать, какие поля отображать в отчете
- Возможность настройки порядка полей
- Возможность группировки данных

#### 5.1.2 Настройка фильтров
- Фильтрация по дате
- Фильтрация по типу данных
- Фильтрация по статусу
- Комбинированные фильтры

#### 5.1.3 Пример пользовательского отчета
```javascript
// Функция для создания пользовательского отчета
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
    let reportContent = `<h3>Пользовательский отчет: ${getReportTitle(reportType)}</h3>`;
    reportContent += `<p>Период: ${startDate || 'начало'} - ${endDate || 'сейчас'}</p>`;
    reportContent += `<table><thead><tr>`;
    
    // Добавление заголовков столбцов
    fields.forEach(field => {
        reportContent += `<th>${getFieldLabel(field)}</th>`;
    });
    
    reportContent += `</tr></thead><tbody>`;
    
    // Добавление данных
    data.forEach(item => {
        reportContent += `<tr>`;
        fields.forEach(field => {
            reportContent += `<td>${getItemValue(item, field)}</td>`;
        });
        reportContent += `</tr>`;
    });
    
    reportContent += `</tbody></table>`;
    
    return reportContent;
}

// Вспомогательные функции для пользовательских отчетов
function getReportTitle(reportType) {
    const titles = {
        'members': 'Отчет по пайщикам',
        'payments': 'Отчет по паевым взносам',
        'transactions': 'Отчет по бухгалтерским проводкам',
        'documents': 'Отчет по документам'
    };
    return titles[reportType] || reportType;
}

function getFieldLabel(field) {
    const labels = {
        'id': 'ID',
        'name': 'ФИО',
        'joinDate': 'Дата вступления',
        'status': 'Статус',
        'contact': 'Контакт',
        'amount': 'Сумма',
        'date': 'Дата',
        'type': 'Тип',
        'paid': 'Оплачено',
        'description': 'Описание'
    };
    return labels[field] || field;
}

function getItemValue(item, field) {
    if (field === 'paid') {
        return item[field] ? 'Да' : 'Нет';
    }
    if (field === 'status') {
        return getStatusText(item[field]);
    }
    if (field === 'amount') {
        return (item[field] || 0).toLocaleString() + ' ₽';
    }
    return item[field] || '';
}

function groupData(data, grouping) {
    // Группировка данных по указанному полю
    const grouped = {};
    
    data.forEach(item => {
        const key = item[grouping.field];
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });
    
    // Преобразование в плоский массив с заголовками групп
    const result = [];
    for (const [key, items] of Object.entries(grouped)) {
        result.push({ groupHeader: key, isGroup: true });
        result.push(...items);
    }
    
    return result;
}
```

## 6. Экспорт отчетов

### 6.1 Форматы экспорта

#### 6.1.1 HTML (по умолчанию)
- **Назначение:** Отображение в браузере
- **Особенности:** Полнофункциональное форматирование
- **Использование:** Для просмотра и печати

#### 6.1.2 PDF (через jsPDF)
- **Назначение:** Формирование печатных документов
- **Особенности:** Формат для официальных документов
- **Использование:** Для предоставления в органы, архивирование

#### 6.1.3 CSV (через форматирование)
- **Назначение:** Экспорт данных для анализа
- **Особенности:** Простой формат для импорта в Excel
- **Использование:** Для дальнейшего анализа

### 6.2 Функции экспорта

#### 6.2.1 exportReportAsPDF(reportType)
- **Назначение:** Экспорт отчета в формате PDF
- **Параметры:** reportType - тип отчета
- **Возвращаемое значение:** -
- **Описание:** Генерирует и сохраняет отчет в формате PDF

#### 6.2.2 exportReportAsCSV(reportType)
- **Назначение:** Экспорт отчета в формате CSV
- **Параметры:** reportType - тип отчета
- **Возвращаемое значение:** -
- **Описание:** Генерирует и сохраняет отчет в формате CSV

## 7. Автоматические отчеты

### 7.1 Периодические отчеты

#### 7.1.1 Ежемесячные отчеты
- **Частота:** Ежемесячно
- **Содержание:** Отчет по пайщикам, взносам, финансам
- **Автоматизация:** Планирование (в будущем)

#### 7.1.2 Ежеквартальные отчеты
- **Частота:** Ежеквартально
- **Содержание:** Бухгалтерский баланс, отчет о финансовых результатах
- **Автоматизация:** Планирование (в будущем)

#### 7.1.3 Годовые отчеты
- **Частота:** Ежегодно
- **Содержание:** Полный отчет о деятельности кооператива
- **Автоматизация:** Планирование (в будущем)

### 7.2 Триггеры автоматических отчетов

#### 7.2.1 По расписанию
- **Описание:** Отчеты формируются автоматически по календарному расписанию
- **Реализация:** Планирование задач (в будущем)

#### 7.2.2 По событию
- **Описание:** Отчеты формируются при определенных событиях
- **Примеры:** При большом количестве новых пайщиков, при изменении статуса

## 8. Метрики и показатели

### 8.1 Ключевые показатели эффективности (KPI)

#### 8.1.1 По пайщикам
- Количество новых пайщиков в месяц
- Общее количество активных пайщиков
- Процент пайщиков с задолженностью
- Среднее время членства

#### 8.1.2 По взносам
- Общий объем поступлений
- Процент оплаты взносов
- Средний размер паевого взноса
- Количество имущественных взносов

#### 8.1.3 По финансам
- Финансовый результат
- Оборот по счетам
- Рентабельность операций
- Эффективность управления средствами

### 8.2 Функции расчета KPI
```javascript
// Функция для расчета KPI
function calculateKPI() {
    const kpi = {
        // KPI по пайщикам
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        newMembersThisMonth: getNewMembersThisMonth(),
        
        // KPI по взносам
        totalPayments: payments.length,
        totalPaymentAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paymentRate: calculatePaymentRate(),
        
        // KPI по финансам
        totalTransactions: transactions.length,
        totalDebit: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        totalCredit: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        
        // KPI по безопасности
        dataIntegrity: checkDataIntegrity(),
        securityIssues: checkSecurity()
    };
    
    return kpi;
}

function getNewMembersThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return members.filter(member => {
        const joinDate = new Date(member.joinDate);
        return joinDate >= startOfMonth;
    }).length;
}

function calculatePaymentRate() {
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.paid).length;
    
    return totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
}
```

## 9. Визуализация данных

### 9.1 Диаграммы и графики

#### 9.1.1 График роста числа пайщиков
- **Тип:** Линейный график
- **Данные:** Количество пайщиков по месяцам
- **Интервал:** Ежемесячно

#### 9.1.2 Диаграмма распределения по типам взносов
- **Тип:** Круговая диаграмма
- **Данные:** Процентное соотношение типов паевых взносов
- **Интервал:** За выбранный период

#### 9.1.3 График поступлений по месяцам
- **Тип:** Столбчатая диаграмма
- **Данные:** Сумма поступлений по месяцам
- **Интервал:** Ежемесячно

### 9.2 Функции визуализации
```javascript
// Функция для генерации HTML-кода диаграммы (упрощенная версия)
function generateChartHTML(chartType, data, title) {
    let chartHTML = `<div class="chart-container"><h4>${title}</h4>`;
    
    switch(chartType) {
        case 'bar':
            chartHTML += '<div class="bar-chart">';
            data.forEach(item => {
                chartHTML += `<div class="bar" style="height: ${item.value}px;" title="${item.label}: ${item.value}">${item.label}</div>`;
            });
            chartHTML += '</div>';
            break;
            
        case 'pie':
            chartHTML += '<div class="pie-chart">Круговая диаграмма (визуализация будет реализована с использованием Chart.js или другой библиотеки)</div>';
            break;
            
        case 'line':
            chartHTML += '<div class="line-chart">Линейный график (визуализация будет реализована с использованием Chart.js или другой библиотеки)</div>';
            break;
    }
    
    chartHTML += '</div>';
    
    return chartHTML;
}
```

## 10. Заключение

Система предоставляет комплексные возможности для формирования отчетов и аналитики, необходимых для эффективного управления потребительским кооперативом. Все отчеты разработаны с учетом требований законодательства и потребностей управления кооперативом. Функции аналитики позволяют принимать обоснованные управленческие решения и контролировать эффективность деятельности кооператива.