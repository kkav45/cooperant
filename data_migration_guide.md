# Процесс миграции данных в информационную систему учета пайщиков кооператива

## 1. Общая информация

### 1.1 Цель миграции
Целью процесса миграции является перенос данных из существующих систем учета (базы данных, электронные таблицы, бумажные документы) в новую информационную систему учета пайщиков кооператива.

### 1.2 Область применения
Процесс миграции применяется при внедрении системы в действующий кооператив, который ранее использовал другие методы ведения учета.

## 2. Подготовка к миграции

### 2.1 Анализ существующих данных
- Определение источников данных (Excel-файлы, базы данных, бумажные документы)
- Анализ структуры существующих данных
- Определение объема данных для миграции
- Оценка качества и полноты данных

### 2.2 Планирование миграции
- Определение приоритетов миграции (какие данные мигрировать в первую очередь)
- Планирование временного графика миграции
- Назначение ответственных за миграцию
- Подготовка резервных копий исходных данных

### 2.3 Подготовка целевой системы
- Установка и настройка информационной системы
- Проверка корректности работы системы
- Подготовка тестовой среды для проверки миграции

## 3. Структура данных для миграции

### 3.1 Пайщики
Из исходных систем необходимо извлечь следующую информацию:
- Идентификатор пайщика (если существует)
- ФИО
- Дата вступления в кооператив
- Контактная информация
- Адрес
- Статус (активный, исключен, вышедший и т.д.)
- Примечания

### 3.2 Паевые взносы
Из исходных систем необходимо извлечь следующую информацию:
- Идентификатор взноса
- Идентификатор пайщика (для сопоставления)
- Тип взноса (вступительный, паевой, членский и т.д.)
- Сумма взноса
- Дата взноса
- Статус оплаты
- Описание

### 3.3 Бухгалтерские проводки
Из исходных систем необходимо извлечь следующую информацию:
- Идентификатор проводки
- Дата проводки
- Дебетовый счет
- Кредитовый счет
- Сумма
- Описание

### 3.4 Документы
Из исходных систем необходимо извлечь следующую информацию:
- Идентификатор документа
- Название
- Тип документа
- Дата документа
- Описание
- Размер файла (если применимо)

## 4. Процесс миграции

### 4.1 Этап 1: Подготовка данных

#### 4.1.1 Сбор данных
```javascript
// Пример функции для импорта данных из CSV-файла
function importCSVData(csvFilePath) {
    // Чтение CSV-файла
    const fs = require('fs');
    const csv = require('csv-parser');
    
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', reject);
    });
}

// Пример преобразования данных из старой системы в формат новой
function transformMemberData(oldData) {
    return {
        id: generateId(), // генерация нового ID
        name: oldData.fullName || `${oldData.lastName} ${oldData.firstName} ${oldData.middleName}`,
        status: mapOldStatusToNew(oldData.status),
        joinDate: formatDate(oldData.joinDate),
        contact: oldData.phone || oldData.email,
        address: oldData.address,
        notes: oldData.notes || '',
        createdAt: new Date().toISOString()
    };
}
```

#### 4.1.2 Очистка данных
- Удаление дубликатов
- Исправление форматов дат
- Приведение данных к единому формату
- Проверка на полноту обязательных полей

#### 4.1.3 Сопоставление данных
- Сопоставление пайщиков из старой системы с новой
- Сопоставление взносов с соответствующими пайщиками
- Проверка целостности связей между данными

### 4.2 Этап 2: Тестовая миграция

#### 4.2.1 Подготовка тестовой выборки
- Выбор небольшого объема данных для тестирования
- Проверка корректности преобразования данных
- Тестирование загрузки данных в систему

#### 4.2.2 Проверка результатов
- Проверка корректности отображения данных
- Проверка функциональности системы с мигрированными данными
- Проверка сохранения и загрузки данных

### 4.3 Этап 3: Основная миграция

#### 4.3.1 Миграция пайщиков
```javascript
// Пример процесса миграции пайщиков
async function migrateMembers(sourceData) {
    const transformedMembers = sourceData.map(transformMemberData);
    
    // Валидация данных перед сохранением
    const validatedMembers = transformedMembers.filter(validateMember);
    
    // Сохранение в систему
    members = [...members, ...validatedMembers];
    
    // Сохранение в файл
    await saveData();
    
    return validatedMembers.length;
}

function validateMember(member) {
    // Проверка обязательных полей
    return member.name && member.joinDate;
}
```

#### 4.3.2 Миграция паевых взносов
```javascript
// Пример процесса миграции паевых взносов
async function migratePayments(sourceData, memberMapping) {
    const transformedPayments = sourceData.map(payment => {
        return {
            id: generateId(),
            memberId: findMemberId(payment.oldMemberId, memberMapping),
            type: mapOldPaymentType(payment.type),
            amount: parseFloat(payment.amount),
            date: formatDate(payment.date),
            description: payment.description || '',
            paid: payment.paid || true,
            createdAt: new Date().toISOString()
        };
    }).filter(payment => payment.memberId); // Только те, для которых найден пайщик
    
    // Валидация данных
    const validatedPayments = transformedPayments.filter(validatePayment);
    
    // Сохранение в систему
    payments = [...payments, ...validatedPayments];
    
    // Сохранение в файл
    await saveData();
    
    return validatedPayments.length;
}

function validatePayment(payment) {
    return payment.memberId && payment.type && payment.amount && payment.date;
}
```

#### 4.3.3 Миграция бухгалтерских проводок
```javascript
// Пример процесса миграции бухгалтерских проводок
async function migrateTransactions(sourceData) {
    const transformedTransactions = sourceData.map(tx => {
        return {
            id: generateId(),
            date: formatDate(tx.date),
            amount: parseFloat(tx.amount),
            debitAccount: tx.debitAccount,
            creditAccount: tx.creditAccount,
            description: tx.description || '',
            createdAt: new Date().toISOString()
        };
    });
    
    // Валидация данных
    const validatedTransactions = transformedTransactions.filter(validateTransaction);
    
    // Сохранение в систему
    transactions = [...transactions, ...validatedTransactions];
    
    // Сохранение в файл
    await saveData();
    
    return validatedTransactions.length;
}

function validateTransaction(transaction) {
    return transaction.date && transaction.amount && 
           transaction.debitAccount && transaction.creditAccount;
}
```

### 4.4 Этап 4: Проверка и корректировка

#### 4.4.1 Проверка полноты миграции
- Сравнение количества записей до и после миграции
- Проверка соответствия сумм и остатков
- Проверка целостности данных

#### 4.4.2 Корректировка ошибок
- Исправление ошибок, выявленных при проверке
- Повторная проверка после корректировки
- Документирование внесенных изменений

## 5. Примеры миграции из популярных систем

### 5.1 Миграция из Excel-файлов

#### 5.1.1 Структура Excel-файла для пайщиков
```
| ID | Фамилия | Имя | Отчество | Дата вступления | Телефон | Email | Статус |
|----|---------|-----|----------|-----------------|---------|-------|--------|
| 1  | Иванов  | Иван| Иванович | 2023-01-15     | +7...   | mail@example.com | Активный |
```

#### 5.1.2 Процесс миграции
```javascript
// Функция для миграции из Excel
async function migrateFromExcel(excelFilePath) {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(excelFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Преобразование данных
    const members = jsonData.map(row => ({
        id: generateId(),
        name: `${row['Фамилия']} ${row['Имя']} ${row['Отчество']}`,
        joinDate: formatDate(row['Дата вступления']),
        contact: row['Телефон'] || row['Email'],
        status: mapExcelStatus(row['Статус']),
        createdAt: new Date().toISOString()
    }));
    
    // Валидация и сохранение
    const validMembers = members.filter(m => m.name && m.joinDate);
    members = [...members, ...validMembers];
    await saveData();
    
    return validMembers.length;
}
```

### 5.2 Миграция из базы данных

#### 5.2.1 Пример структуры таблицы в MySQL
```sql
-- Таблица пайщиков
CREATE TABLE members (
    id INT PRIMARY KEY,
    full_name VARCHAR(255),
    join_date DATE,
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50)
);

-- Таблица взносов
CREATE TABLE payments (
    id INT PRIMARY KEY,
    member_id INT,
    payment_type VARCHAR(50),
    amount DECIMAL(10,2),
    payment_date DATE,
    is_paid BOOLEAN
);
```

#### 5.2.2 Процесс миграции
```javascript
// Функция для миграции из MySQL
async function migrateFromMySQL(connectionConfig) {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection(connectionConfig);
    
    // Получение пайщиков
    const [memberRows] = await connection.execute('SELECT * FROM members');
    const members = memberRows.map(row => ({
        id: generateId(),
        name: row.full_name,
        joinDate: formatDate(row.join_date),
        contact: row.phone || row.email,
        status: mapDBStatus(row.status),
        createdAt: new Date().toISOString()
    }));
    
    // Получение взносов
    const [paymentRows] = await connection.execute('SELECT * FROM payments');
    const payments = paymentRows.map(row => ({
        id: generateId(),
        memberId: findNewMemberId(row.member_id, members), // Необходимо сопоставление ID
        type: mapDBPaymentType(row.payment_type),
        amount: parseFloat(row.amount),
        date: formatDate(row.payment_date),
        paid: Boolean(row.is_paid),
        createdAt: new Date().toISOString()
    }));
    
    // Сохранение в систему
    members = [...members, ...members];
    payments = [...payments, ...payments];
    await saveData();
    
    await connection.end();
    
    return { migratedMembers: members.length, migratedPayments: payments.length };
}
```

## 6. Проверка миграции

### 6.1 Автоматические проверки
```javascript
// Функция проверки миграции
function verifyMigration(originalCounts, migratedCounts) {
    const results = {
        members: {
            original: originalCounts.members,
            migrated: migratedCounts.members,
            success: originalCounts.members === migratedCounts.members
        },
        payments: {
            original: originalCounts.payments,
            migrated: migratedCounts.payments,
            success: originalCounts.payments === migratedCounts.payments
        }
    };
    
    // Дополнительные проверки
    results.dataIntegrity = checkDataIntegrity();
    
    return results;
}

function checkDataIntegrity() {
    // Проверка, что все взносы связаны с существующими пайщиками
    const invalidPayments = payments.filter(payment => 
        !members.some(member => member.id === payment.memberId)
    );
    
    return {
        valid: invalidPayments.length === 0,
        issues: invalidPayments.length,
        details: invalidPayments
    };
}
```

### 6.2 Ручные проверки
- Сравнение сумм остатков
- Проверка случайных записей
- Проверка корректности отчетов

## 7. Обратная совместимость

### 7.1 Резервное копирование
- Создание резервной копии исходных данных
- Создание резервной копии системы до миграции
- Документирование процесса миграции

### 7.2 Возможность отката
- Сохранение исходных данных
- Возможность восстановления предыдущего состояния
- План действий в случае неудачной миграции

## 8. Документирование миграции

### 8.1 Журнал миграции
- Дата и время миграции
- Объем мигрированных данных
- Выявленные проблемы
- Примененные решения

### 8.2 Отчет о миграции
- Количество мигрированных записей
- Количество ошибок и их типы
- Рекомендации по улучшению

## 9. Заключение

Процесс миграции данных требует тщательной подготовки и внимательного отношения к деталям. Успешная миграция обеспечивает непрерывность учета и позволяет эффективно использовать новую систему с уже существующими данными. Важно уделять особое внимание качеству данных и проверке результатов миграции.