# Процесс обеспечения качества данных информационной системы учета пайщиков кооператива

## 1. Общая информация

### 1.1 Цель обеспечения качества данных
Целью процесса обеспечения качества данных является гарантия точности, полноты, актуальности, согласованности и надежности всех данных, хранящихся и обрабатываемых в информационной системе учета пайщиков кооператива.

### 1.2 Область применения
Процесс применяется ко всем типам данных в системе:
- Данные пайщиков
- Данные паевых взносов
- Бухгалтерские данные
- Документы
- Заявления на вступление
- Протоколы заседаний
- Удостоверения пайщиков

## 2. Принципы качества данных

### 2.1 Точность
Данные должны точно отражать реальные значения и факты.

### 2.2 Полнота
Все обязательные поля должны быть заполнены, и не должно быть пропущенных важных данных.

### 2.3 Актуальность
Данные должны быть актуальными на момент использования.

### 2.4 Согласованность
Данные должны быть согласованными в разных частях системы.

### 2.5 Достоверность
Данные должны происходить из надежных источников и быть проверенными.

### 2.6 Доступность
Данные должны быть доступны авторизованным пользователям в нужное время.

## 3. Категории качества данных

### 3.1 Синтаксическое качество
- Корректность формата данных
- Соответствие типам данных
- Правильность структуры

### 3.2 Семантическое качество
- Смысловая корректность данных
- Соответствие бизнес-правилам
- Логическая согласованность

### 3.3 Прагматическое качество
- Уместность данных для целей использования
- Ценность данных для бизнеса
- Соответствие ожиданиям пользователей

## 4. Показатели качества данных

### 4.1 Точность
- Процент корректных записей
- Количество ошибок в данных
- Степень соответствия эталонным данным

### 4.2 Полнота
- Процент заполненных обязательных полей
- Количество пропущенных записей
- Покрытие данных по сравнению с ожидаемым

### 4.3 Актуальность
- Среднее время устаревания данных
- Процент актуальных записей
- Частота обновления данных

### 4.4 Согласованность
- Количество противоречий в данных
- Степень согласованности между модулями
- Наличие дубликатов

## 5. Процессы обеспечения качества

### 5.1 Валидация данных при вводе

#### 5.1.1 Проверка обязательных полей
```javascript
// Функция проверки обязательных полей при добавлении пайщика
function validateRequiredFields(memberData) {
    const errors = [];
    
    if (!memberData.name || memberData.name.trim() === '') {
        errors.push('Поле "ФИО" обязательно для заполнения');
    }
    
    if (!memberData.joinDate) {
        errors.push('Поле "Дата вступления" обязательно для заполнения');
    }
    
    if (!isValidDate(memberData.joinDate)) {
        errors.push('Поле "Дата вступления" содержит некорректную дату');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Функция проверки обязательных полей при добавлении паевого взноса
function validatePaymentRequiredFields(paymentData) {
    const errors = [];
    
    if (!paymentData.memberId) {
        errors.push('Не выбран пайщик');
    }
    
    if (!paymentData.type) {
        errors.push('Не указан тип взноса');
    }
    
    if (!paymentData.amount && paymentData.method !== 'property') {
        errors.push('Не указана сумма взноса');
    }
    
    if (!paymentData.date) {
        errors.push('Не указана дата взноса');
    }
    
    if (!isValidDate(paymentData.date)) {
        errors.push('Некорректная дата взноса');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

#### 5.1.2 Проверка формата данных
```javascript
// Функция проверки формата данных
function validateDataFormat(data) {
    const errors = [];
    
    // Проверка формата email
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Некорректный формат email');
    }
    
    // Проверка формата телефона
    if (data.phone && !isValidPhone(data.phone)) {
        errors.push('Некорректный формат телефона');
    }
    
    // Проверка формата суммы
    if (data.amount && (typeof data.amount !== 'number' || data.amount <= 0)) {
        errors.push('Сумма должна быть положительным числом');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[^\d+]/g, ''));
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}
```

#### 5.1.3 Проверка бизнес-правил
```javascript
// Функция проверки бизнес-правил
function validateBusinessRules(data, dataType) {
    const errors = [];
    
    switch(dataType) {
        case 'member':
            // Проверка, что дата вступления не в будущем
            const joinDate = new Date(data.joinDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (joinDate > today) {
                errors.push('Дата вступления не может быть в будущем');
            }
            break;
            
        case 'payment':
            // Проверка, что сумма паевого взноса положительная
            if (data.amount && data.amount <= 0) {
                errors.push('Сумма паевого взноса должна быть положительной');
            }
            
            // Проверка, что дата взноса не в будущем
            const paymentDate = new Date(data.date);
            if (paymentDate > today) {
                errors.push('Дата паевого взноса не может быть в будущем');
            }
            break;
            
        case 'application':
            // Проверка, что сумма взноса в заявлении положительная
            if (data.desiredShareAmount && data.desiredShareAmount <= 0) {
                errors.push('Желаемый размер паевого взноса должен быть положительным');
            }
            break;
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

### 5.2 Очистка данных

#### 5.2.1 Стандартная очистка
```javascript
// Функция стандартной очистки данных
function cleanData(data, dataType) {
    switch(dataType) {
        case 'member':
            // Очистка ФИО
            if (data.name) {
                data.name = data.name.trim().replace(/\s+/g, ' ');
            }
            
            // Очистка контактов
            if (data.contact) {
                data.contact = data.contact.trim();
            }
            
            // Очистка адреса
            if (data.address) {
                data.address = data.address.trim();
            }
            break;
            
        case 'payment':
            // Очистка суммы
            if (data.amount) {
                data.amount = parseFloat(data.amount);
            }
            
            // Очистка описания
            if (data.description) {
                data.description = data.description.trim();
            }
            break;
            
        case 'application':
            // Очистка ФИО заявителя
            if (data.applicantName) {
                data.applicantName = data.applicantName.trim().replace(/\s+/g, ' ');
            }
            
            // Очистка суммы
            if (data.desiredShareAmount) {
                data.desiredShareAmount = parseFloat(data.desiredShareAmount);
            }
            break;
    }
    
    return data;
}
```

#### 5.2.2 Проверка дубликатов
```javascript
// Функция проверки дубликатов пайщиков
function checkMemberDuplicates(newMember) {
    const duplicates = [];
    
    // Проверка по ФИО
    const sameNameMembers = members.filter(member => 
        member.name.toLowerCase() === newMember.name.toLowerCase()
    );
    
    if (sameNameMembers.length > 0) {
        duplicates.push({
            type: 'name',
            existingRecords: sameNameMembers,
            message: 'Найдены пайщики с таким же ФИО'
        });
    }
    
    // Проверка по контактной информации (если доступна)
    if (newMember.contact) {
        const sameContactMembers = members.filter(member => 
            member.contact && member.contact.toLowerCase() === newMember.contact.toLowerCase()
        );
        
        if (sameContactMembers.length > 0) {
            duplicates.push({
                type: 'contact',
                existingRecords: sameContactMembers,
                message: 'Найдены пайщики с такой же контактной информацией'
            });
        }
    }
    
    return {
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates
    };
}

// Функция проверки дубликатов паевых взносов
function checkPaymentDuplicates(newPayment) {
    const duplicates = [];
    
    // Проверка по пайщику, сумме и дате
    const similarPayments = payments.filter(payment => 
        payment.memberId === newPayment.memberId &&
        payment.amount === newPayment.amount &&
        payment.date === newPayment.date &&
        payment.type === newPayment.type
    );
    
    if (similarPayments.length > 0) {
        duplicates.push({
            type: 'payment',
            existingRecords: similarPayments,
            message: 'Найдены похожие паевые взносы'
        });
    }
    
    return {
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates
    };
}
```

### 5.3 Контроль качества при сохранении

#### 5.3.1 Комплексная проверка перед сохранением
```javascript
// Функция комплексной проверки данных перед сохранением
function validateBeforeSave(data, dataType) {
    // Проверка обязательных полей
    const requiredValidation = validateRequiredFields(data, dataType);
    if (!requiredValidation.isValid) {
        return {
            success: false,
            errors: requiredValidation.errors,
            stage: 'required_fields'
        };
    }
    
    // Проверка формата данных
    const formatValidation = validateDataFormat(data);
    if (!formatValidation.isValid) {
        return {
            success: false,
            errors: formatValidation.errors,
            stage: 'format'
        };
    }
    
    // Проверка бизнес-правил
    const businessValidation = validateBusinessRules(data, dataType);
    if (!businessValidation.isValid) {
        return {
            success: false,
            errors: businessValidation.errors,
            stage: 'business_rules'
        };
    }
    
    // Проверка дубликатов
    if (dataType === 'member') {
        const duplicateCheck = checkMemberDuplicates(data);
        if (duplicateCheck.hasDuplicates) {
            return {
                success: false,
                errors: duplicateCheck.duplicates.map(d => d.message),
                stage: 'duplicates'
            };
        }
    }
    
    if (dataType === 'payment') {
        const duplicateCheck = checkPaymentDuplicates(data);
        if (duplicateCheck.hasDuplicates) {
            return {
                success: false,
                errors: duplicateCheck.duplicates.map(d => d.message),
                stage: 'duplicates'
            };
        }
    }
    
    // Если все проверки пройдены
    return {
        success: true,
        errors: [],
        stage: 'all_passed'
    };
}
```

## 6. Мониторинг качества данных

### 6.1 Регулярные проверки

#### 6.1.1 Проверка целостности данных
```javascript
// Функция проверки целостности данных
function checkDataIntegrity() {
    const issues = {
        members: [],
        payments: [],
        transactions: [],
        applications: [],
        meetings: [],
        certificates: []
    };
    
    // Проверка пайщиков
    members.forEach(member => {
        if (!member.id) {
            issues.members.push({id: 'unknown', issue: 'Отсутствует ID'});
        }
        if (!member.name) {
            issues.members.push({id: member.id, issue: 'Отсутствует ФИО'});
        }
        if (!isValidDate(member.joinDate)) {
            issues.members.push({id: member.id, issue: 'Некорректная дата вступления'});
        }
    });
    
    // Проверка паевых взносов
    payments.forEach(payment => {
        if (!payment.id) {
            issues.payments.push({id: 'unknown', issue: 'Отсутствует ID'});
        }
        if (!payment.memberId) {
            issues.payments.push({id: payment.id, issue: 'Отсутствует ID пайщика'});
        }
        if (!isValidDate(payment.date)) {
            issues.payments.push({id: payment.id, issue: 'Некорректная дата взноса'});
        }
        if (payment.amount && payment.amount < 0) {
            issues.payments.push({id: payment.id, issue: 'Отрицательная сумма взноса'});
        }
    });
    
    // Проверка бухгалтерских проводок
    transactions.forEach(transaction => {
        if (!transaction.id) {
            issues.transactions.push({id: 'unknown', issue: 'Отсутствует ID'});
        }
        if (!isValidDate(transaction.date)) {
            issues.transactions.push({id: transaction.id, issue: 'Некорректная дата проводки'});
        }
        if (transaction.amount && transaction.amount <= 0) {
            issues.transactions.push({id: transaction.id, issue: 'Некорректная сумма проводки'});
        }
        if (!transaction.debitAccount || !transaction.creditAccount) {
            issues.transactions.push({id: transaction.id, issue: 'Отсутствуют счета проводки'});
        }
    });
    
    // Проверка заявлений
    applications.forEach(app => {
        if (!app.id) {
            issues.applications.push({id: 'unknown', issue: 'Отсутствует ID'});
        }
        if (!app.applicantName) {
            issues.applications.push({id: app.id, issue: 'Отсутствует ФИО заявителя'});
        }
        if (!isValidDate(app.submissionDate)) {
            issues.applications.push({id: app.id, issue: 'Некорректная дата подачи'});
        }
    });
    
    // Проверка заседаний
    meetings.forEach(meeting => {
        if (!meeting.id) {
            issues.meetings.push({id: 'unknown', issue: 'Отсутствует ID'});
        }
        if (!isValidDate(meeting.date)) {
            issues.meetings.push({id: meeting.id, issue: 'Некорректная дата заседания'});
        }
    });
    
    // Проверка удостоверений
    certificates.forEach(cert => {
        if (!cert.id) {
            issues.certificates.push({id: 'unknown', issue: 'Отсутствует ID'});
        }
        if (!cert.memberId) {
            issues.certificates.push({id: cert.id, issue: 'Отсутствует ID пайщика'});
        }
        if (!isValidDate(cert.issueDate)) {
            issues.certificates.push({id: cert.id, issue: 'Некорректная дата выдачи'});
        }
    });
    
    return {
        issues: issues,
        summary: {
            totalIssues: Object.values(issues).reduce((sum, arr) => sum + arr.length, 0),
            membersIssues: issues.members.length,
            paymentsIssues: issues.payments.length,
            transactionsIssues: issues.transactions.length,
            applicationsIssues: issues.applications.length,
            meetingsIssues: issues.meetings.length,
            certificatesIssues: issues.certificates.length
        }
    };
}
```

#### 6.1.2 Проверка согласованности данных
```javascript
// Функция проверки согласованности данных
function checkDataConsistency() {
    const inconsistencies = [];
    
    // Проверка, что все паевые взносы связаны с существующими пайщиками
    const invalidPayments = payments.filter(payment => 
        !members.some(member => member.id === payment.memberId)
    );
    
    invalidPayments.forEach(payment => {
        inconsistencies.push({
            type: 'payment',
            id: payment.id,
            issue: 'Паевой взнос связан с несуществующим пайщиком',
            relatedId: payment.memberId
        });
    });
    
    // Проверка, что все бухгалтерские проводки связаны с существующими взносами (если есть связь)
    const invalidTransactions = transactions.filter(transaction => 
        transaction.relatedPaymentId && 
        !payments.some(payment => payment.id === transaction.relatedPaymentId)
    );
    
    invalidTransactions.forEach(transaction => {
        inconsistencies.push({
            type: 'transaction',
            id: transaction.id,
            issue: 'Бухгалтерская проводка связана с несуществующим паевым взносом',
            relatedId: transaction.relatedPaymentId
        });
    });
    
    // Проверка, что все удостоверения связаны с существующими пайщиками
    const invalidCertificates = certificates.filter(certificate => 
        !members.some(member => member.id === certificate.memberId)
    );
    
    invalidCertificates.forEach(certificate => {
        inconsistencies.push({
            type: 'certificate',
            id: certificate.id,
            issue: 'Удостоверение связано с несуществующим пайщиком',
            relatedId: certificate.memberId
        });
    });
    
    // Проверка, что все участники заседаний существуют (если есть связь с пайщиками)
    meetings.forEach(meeting => {
        if (meeting.attendees) {
            meeting.attendees.forEach(attendee => {
                if (attendee.memberId && !members.some(member => member.id === attendee.memberId)) {
                    inconsistencies.push({
                        type: 'meeting_attendee',
                        id: meeting.id,
                        issue: 'Участник заседания связан с несуществующим пайщиком',
                        relatedId: attendee.memberId
                    });
                }
            });
        }
    });
    
    return {
        inconsistencies: inconsistencies,
        count: inconsistencies.length
    };
}
```

### 6.2 Автоматические проверки

#### 6.2.1 Проверка при загрузке данных
```javascript
// Функция проверки данных при загрузке
function validateLoadedData(data) {
    const validationResults = {
        valid: true,
        errors: [],
        warnings: []
    };
    
    // Проверка структуры данных
    if (!data.hasOwnProperty('members')) {
        validationResults.errors.push('Отсутствует коллекция members');
        validationResults.valid = false;
    }
    
    if (!data.hasOwnProperty('payments')) {
        validationResults.errors.push('Отсутствует коллекция payments');
        validationResults.valid = false;
    }
    
    if (!data.hasOwnProperty('transactions')) {
        validationResults.errors.push('Отсутствует коллекция transactions');
        validationResults.valid = false;
    }
    
    if (!data.hasOwnProperty('documents')) {
        validationResults.errors.push('Отсутствует коллекция documents');
        validationResults.valid = false;
    }
    
    if (!data.hasOwnProperty('applications')) {
        validationResults.errors.push('Отсутствует коллекция applications');
        validationResults.valid = false;
    }
    
    if (!data.hasOwnProperty('meetings')) {
        validationResults.errors.push('Отсутствует коллекция meetings');
        validationResults.valid = false;
    }
    
    if (!data.hasOwnProperty('certificates')) {
        validationResults.errors.push('Отсутствует коллекция certificates');
        validationResults.valid = false;
    }
    
    // Проверка формата данных (если коллекции существуют)
    if (data.members && !Array.isArray(data.members)) {
        validationResults.errors.push('Коллекция members должна быть массивом');
        validationResults.valid = false;
    }
    
    if (data.payments && !Array.isArray(data.payments)) {
        validationResults.errors.push('Коллекция payments должна быть массивом');
        validationResults.valid = false;
    }
    
    // Проверка отдельных записей
    if (data.members) {
        data.members.forEach((member, index) => {
            if (typeof member !== 'object' || member === null) {
                validationResults.errors.push(`Запись members[${index}] не является объектом`);
                validationResults.valid = false;
            } else if (!member.id) {
                validationResults.warnings.push(`Запись members[${index}] не имеет ID`);
            }
        });
    }
    
    if (data.payments) {
        data.payments.forEach((payment, index) => {
            if (typeof payment !== 'object' || payment === null) {
                validationResults.errors.push(`Запись payments[${index}] не является объектом`);
                validationResults.valid = false;
            } else if (!payment.id) {
                validationResults.warnings.push(`Запись payments[${index}] не имеет ID`);
            }
        });
    }
    
    return validationResults;
}
```

## 7. Улучшение качества данных

### 7.1 Идентификация проблем

#### 7.1.1 Анализ частых ошибок
```javascript
// Функция анализа частых ошибок в данных
function analyzeCommonErrors() {
    const errorPatterns = {
        invalidDates: 0,
        missingNames: 0,
        negativeAmounts: 0,
        invalidContacts: 0,
        duplicateRecords: 0
    };
    
    // Анализ пайщиков
    members.forEach(member => {
        if (!isValidDate(member.joinDate)) {
            errorPatterns.invalidDates++;
        }
        if (!member.name || member.name.trim() === '') {
            errorPatterns.missingNames++;
        }
        if (member.contact && !isValidContact(member.contact)) {
            errorPatterns.invalidContacts++;
        }
    });
    
    // Анализ паевых взносов
    payments.forEach(payment => {
        if (!isValidDate(payment.date)) {
            errorPatterns.invalidDates++;
        }
        if (payment.amount && payment.amount < 0) {
            errorPatterns.negativeAmounts++;
        }
    });
    
    // Анализ дубликатов
    errorPatterns.duplicateRecords = findPotentialDuplicates().length;
    
    return {
        patterns: errorPatterns,
        recommendations: generateRecommendations(errorPatterns)
    };
}

function findPotentialDuplicates() {
    const duplicates = [];
    
    // Поиск дубликатов по ФИО
    const nameGroups = {};
    members.forEach(member => {
        if (member.name) {
            const nameKey = member.name.toLowerCase().trim();
            if (!nameGroups[nameKey]) {
                nameGroups[nameKey] = [];
            }
            nameGroups[nameKey].push(member);
        }
    });
    
    // Добавляем группы с более чем одним пайщиком
    for (const [name, membersList] of Object.entries(nameGroups)) {
        if (membersList.length > 1) {
            duplicates.push({
                type: 'name',
                value: name,
                records: membersList
            });
        }
    }
    
    return duplicates;
}

function generateRecommendations(errorPatterns) {
    const recommendations = [];
    
    if (errorPatterns.invalidDates > 0) {
        recommendations.push('Внедрить проверку формата дат при вводе данных');
    }
    
    if (errorPatterns.missingNames > 0) {
        recommendations.push('Сделать поле "ФИО" обязательным для заполнения');
    }
    
    if (errorPatterns.negativeAmounts > 0) {
        recommendations.push('Внедрить проверку на положительность сумм');
    }
    
    if (errorPatterns.invalidContacts > 0) {
        recommendations.push('Внедрить проверку формата контактной информации');
    }
    
    if (errorPatterns.duplicateRecords > 0) {
        recommendations.push('Внедрить проверку дубликатов при добавлении записей');
    }
    
    return recommendations;
}
```

### 7.2 Исправление данных

#### 7.2.1 Исправление типичных ошибок
```javascript
// Функция исправления типичных ошибок
function fixCommonDataIssues() {
    let fixesApplied = 0;
    
    // Исправление дат в формате DD.MM.YYYY на YYYY-MM-DD
    members.forEach(member => {
        if (member.joinDate && member.joinDate.includes('.')) {
            const dateParts = member.joinDate.split('.');
            if (dateParts.length === 3) {
                member.joinDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                fixesApplied++;
            }
        }
    });
    
    payments.forEach(payment => {
        if (payment.date && payment.date.includes('.')) {
            const dateParts = payment.date.split('.');
            if (dateParts.length === 3) {
                payment.date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                fixesApplied++;
            }
        }
    });
    
    // Исправление отрицательных сумм
    payments.forEach(payment => {
        if (payment.amount && payment.amount < 0) {
            payment.amount = Math.abs(payment.amount);
            fixesApplied++;
        }
    });
    
    // Исправление лишних пробелов в ФИО
    members.forEach(member => {
        if (member.name) {
            member.name = member.name.trim().replace(/\s+/g, ' ');
        }
    });
    
    // Исправление лишних пробелов в описаниях
    payments.forEach(payment => {
        if (payment.description) {
            payment.description = payment.description.trim();
        }
    });
    
    return {
        fixesApplied: fixesApplied,
        message: `Исправлено ${fixesApplied} ошибок в данных`
    };
}
```

## 8. Отчетность по качеству данных

### 8.1 Регулярные отчеты

#### 8.1.1 Отчет о качестве данных
```javascript
// Функция генерации отчета о качестве данных
function generateDataQualityReport() {
    const now = new Date();
    
    // Проверка целостности
    const integrityCheck = checkDataIntegrity();
    
    // Проверка согласованности
    const consistencyCheck = checkDataConsistency();
    
    // Анализ частых ошибок
    const errorAnalysis = analyzeCommonErrors();
    
    // Статистика по данным
    const dataStats = {
        totalMembers: members.length,
        totalPayments: payments.length,
        totalTransactions: transactions.length,
        totalApplications: applications.length,
        totalMeetings: meetings.length,
        totalCertificates: certificates.length
    };
    
    const report = {
        generatedAt: now.toISOString(),
        summary: {
            totalIssues: integrityCheck.summary.totalIssues + consistencyCheck.count,
            integrityIssues: integrityCheck.summary.totalIssues,
            consistencyIssues: consistencyCheck.count
        },
        integrity: integrityCheck,
        consistency: consistencyCheck,
        errorPatterns: errorAnalysis.patterns,
        dataStats: dataStats,
        recommendations: errorAnalysis.recommendations
    };
    
    return report;
}

// Функция отображения отчета о качестве данных
function showDataQualityReport() {
    const report = generateDataQualityReport();
    
    let reportHtml = `
        <h3>Отчет о качестве данных - ${new Date().toLocaleDateString()}</h3>
        
        <div class="report-summary">
            <h4>Сводка</h4>
            <p><strong>Всего проблем:</strong> ${report.summary.totalIssues}</p>
            <p><strong>Проблем целостности:</strong> ${report.summary.integrityIssues}</p>
            <p><strong>Проблем согласованности:</strong> ${report.summary.consistencyIssues}</p>
        </div>
        
        <div class="data-stats">
            <h4>Статистика данных</h4>
            <ul>
                <li>Пайщиков: ${report.dataStats.totalMembers}</li>
                <li>Паевых взносов: ${report.dataStats.totalPayments}</li>
                <li>Бухгалтерских проводок: ${report.dataStats.totalTransactions}</li>
                <li>Заявлений: ${report.dataStats.totalApplications}</li>
                <li>Заседаний: ${report.dataStats.totalMeetings}</li>
                <li>Удостоверений: ${report.dataStats.totalCertificates}</li>
            </ul>
        </div>
        
        <div class="recommendations">
            <h4>Рекомендации</h4>
            <ul>
    `;
    
    report.recommendations.forEach(rec => {
        reportHtml += `<li>${rec}</li>`;
    });
    
    reportHtml += `
            </ul>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="exportDataQualityReport()">Сохранить отчет</button>
            <button onclick="closeModal()">Закрыть</button>
        </div>
    `;
    
    showModal(reportHtml);
}

function exportDataQualityReport() {
    const report = generateDataQualityReport();
    const reportStr = JSON.stringify(report, null, 2);
    
    const blob = new Blob([reportStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_quality_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    alert('Отчет о качестве данных сохранен');
}
```

### 8.2 Мониторинг в реальном времени

#### 8.2.1 Панель мониторинга качества данных
```javascript
// Функция обновления панели мониторинга качества данных
function updateDataQualityDashboard() {
    const qualityMetrics = {
        completeness: calculateCompletenessMetric(),
        accuracy: calculateAccuracyMetric(),
        consistency: calculateConsistencyMetric(),
        timeliness: calculateTimelinessMetric()
    };
    
    // Обновляем элементы интерфейса, если они существуют
    if (document.getElementById('data-quality-score')) {
        const overallScore = Math.round(
            (qualityMetrics.completeness.score + 
             qualityMetrics.accuracy.score + 
             qualityMetrics.consistency.score + 
             qualityMetrics.timeliness.score) / 4
        );
        
        document.getElementById('data-quality-score').textContent = `${overallScore}%`;
    }
    
    if (document.getElementById('data-issues-count')) {
        const integrityCheck = checkDataIntegrity();
        document.getElementById('data-issues-count').textContent = integrityCheck.summary.totalIssues;
    }
}

// Функция расчета метрики полноты
function calculateCompletenessMetric() {
    let totalFields = 0;
    let filledFields = 0;
    
    // Подсчет полей для пайщиков
    members.forEach(member => {
        totalFields += 6; // name, joinDate, contact, address, status, notes
        if (member.name) filledFields++;
        if (member.joinDate) filledFields++;
        if (member.contact) filledFields++;
        if (member.address) filledFields++;
        if (member.status) filledFields++;
        if (member.notes) filledFields++;
    });
    
    // Подсчет полей для паевых взносов
    payments.forEach(payment => {
        totalFields += 7; // memberId, type, amount, date, description, paid, documentNumber
        if (payment.memberId) filledFields++;
        if (payment.type) filledFields++;
        if (payment.amount) filledFields++;
        if (payment.date) filledFields++;
        if (payment.description) filledFields++;
        if (payment.paid !== undefined) filledFields++;
        if (payment.documentNumber) filledFields++;
    });
    
    const score = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 100;
    
    return {
        score: score,
        filledFields: filledFields,
        totalFields: totalFields,
        percentage: score
    };
}

// Функция расчета метрики точности
function calculateAccuracyMetric() {
    // В упрощенном варианте - проверяем корректность форматов данных
    let totalChecks = 0;
    let validChecks = 0;
    
    // Проверка дат
    members.forEach(member => {
        totalChecks++;
        if (isValidDate(member.joinDate)) validChecks++;
    });
    
    payments.forEach(payment => {
        totalChecks++;
        if (isValidDate(payment.date)) validChecks++;
        totalChecks++;
        if (!payment.amount || payment.amount >= 0) validChecks++; // Проверка на неотрицательность
    });
    
    const score = totalChecks > 0 ? Math.round((validChecks / totalChecks) * 100) : 100;
    
    return {
        score: score,
        validChecks: validChecks,
        totalChecks: totalChecks,
        percentage: score
    };
}

// Функция расчета метрики согласованности
function calculateConsistencyMetric() {
    const consistencyCheck = checkDataConsistency();
    const totalRecords = members.length + payments.length + transactions.length;
    
    // Чем меньше несогласованных записей, тем выше метрика
    const inconsistentRatio = totalRecords > 0 ? consistencyCheck.count / totalRecords : 0;
    const score = Math.round((1 - inconsistentRatio) * 100);
    
    return {
        score: Math.max(score, 0), // Не ниже 0
        inconsistentRecords: consistencyCheck.count,
        totalRecords: totalRecords,
        percentage: Math.max(score, 0)
    };
}

// Функция расчета метрики актуальности
function calculateTimelinessMetric() {
    // В упрощенном варианте - проверяем, сколько данных относится к последним 30 дням
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let totalRecords = 0;
    let recentRecords = 0;
    
    // Проверка дат создания/обновления
    members.forEach(member => {
        totalRecords++;
        const recordDate = new Date(member.createdAt || member.updatedAt || member.joinDate);
        if (recordDate >= thirtyDaysAgo) recentRecords++;
    });
    
    payments.forEach(payment => {
        totalRecords++;
        const recordDate = new Date(payment.createdAt || payment.date);
        if (recordDate >= thirtyDaysAgo) recentRecords++;
    });
    
    const score = totalRecords > 0 ? Math.round((recentRecords / totalRecords) * 100) : 100;
    
    return {
        score: score,
        recentRecords: recentRecords,
        totalRecords: totalRecords,
        percentage: score
    };
}
```

## 9. Обучение и осведомленность

### 9.1 Обучение пользователей
- Обучение правильному вводу данных
- Обучение проверке данных перед сохранением
- Обучение идентификации ошибок в данных

### 9.2 Документация
- Руководства по вводу данных
- Стандарты форматирования данных
- Примеры корректных данных

## 10. Постоянное улучшение

### 10.1 Регулярный анализ
- Анализ отчетов о качестве данных
- Идентификация тенденций
- Оценка эффективности мер

### 10.2 Улучшение процессов
- Обновление процедур проверки данных
- Внедрение новых инструментов
- Улучшение интерфейса ввода данных

## 11. Заключение

Обеспечение качества данных является критически важным аспектом успешной эксплуатации информационной системы учета пайщиков кооператива. Регулярный контроль, проверка и улучшение качества данных обеспечивают надежность системы, точность отчетности и эффективность управления кооперативом.

Эффективная система обеспечения качества данных включает в себя:
- Проактивные меры при вводе данных
- Регулярный мониторинг и проверку
- Автоматизированные инструменты анализа
- Обучение пользователей
- Постоянное улучшение процессов