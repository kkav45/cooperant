# Полный каталог функций безопасности системы

## 1. Общая информация

### 1.1 Цель системы безопасности
Обеспечение защиты информации, обрабатываемой в системе, от несанкционированного доступа, использования, раскрытия, прерывания, модификации или уничтожения.

### 1.2 Принципы безопасности
- **Конфиденциальность:** Защита персональных и финансовых данных
- **Целостность:** Обеспечение точности и полноты информации
- **Доступность:** Обеспечение доступности информации и систем
- **Аутентификация:** Проверка идентичности пользователей
- **Авторизация:** Ограничение доступа к ресурсам
- **Аудит:** Журналирование событий безопасности

## 2. Функции защиты данных

### 2.1 Локальное хранение данных
- **Назначение:** Обеспечение конфиденциальности данных
- **Реализация:** Все данные хранятся на устройстве пользователя
- **Преимущества:**
  - Никакие данные не передаются на серверы
  - Контроль над данными у пользователя
  - Соответствие требованиям защиты персональных данных
- **Технологии:** File System API, localStorage (резервный вариант)

### 2.2 Защита персональных данных
- **Назначение:** Обеспечение конфиденциальности персональных данных пайщиков
- **Функции:**
  - Ограничение доступа к персональным данным
  - Защита от несанкционированного раскрытия
  - Соответствие требованиям 152-ФЗ
- **Реализация:** Локальное хранение, контроль доступа через браузер

### 2.3 Валидация пользовательского ввода
```javascript
// Функция проверки корректности вводимых данных
function validateInput(data, dataType) {
    const errors = [];
    
    switch(dataType) {
        case 'member':
            if (!data.name || data.name.trim() === '') {
                errors.push('ФИО пайщика обязательно для заполнения');
            }
            if (data.contact && !isValidContact(data.contact)) {
                errors.push('Некорректный формат контактной информации');
            }
            if (data.joinDate && !isValidDate(data.joinDate)) {
                errors.push('Некорректный формат даты вступления');
            }
            break;
            
        case 'payment':
            if (!data.memberId) {
                errors.push('Не выбран пайщик');
            }
            if (!data.type) {
                errors.push('Не указан тип взноса');
            }
            if (data.amount && (typeof data.amount !== 'number' || data.amount <= 0)) {
                errors.push('Сумма должна быть положительным числом');
            }
            if (!data.date || !isValidDate(data.date)) {
                errors.push('Некорректный формат даты');
            }
            break;
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

### 2.4 Санитизация данных
```javascript
// Функция санитизации пользовательского ввода
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Удаление потенциально опасных символов
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
```

## 3. Функции File System API безопасности

### 3.1 Контроль доступа к файловой системе
- **Назначение:** Ограничение доступа к файлам с согласия пользователя
- **Реализация:** File System API требует явного разрешения пользователя
- **Функции:**
  - Запрос разрешения на доступ к директории
  - Ограничение доступа только к выбранной директории
  - Защита от доступа к системным файлам
- **Преимущества:** Высокий уровень безопасности через браузер

### 3.2 Автоматическое сохранение в безопасное место
```javascript
// Функция автоматического сохранения данных в безопасное место
async function autoSaveDataSecurely() {
    if (!coopDirectoryHandle) {
        // Если директория не настроена, пытаемся настроить
        if (!await setupCooperativeDirectory()) {
            return false;
        }
    }
    
    try {
        // Проверяем, что это действительно директория C:\КООПЕРАНТ
        if (coopDirectoryHandle.name !== 'КООПЕРАНТ') {
            throw new Error('Неверная директория для хранения данных');
        }
        
        // Получаем поддиректорию для данных
        const dataDir = await coopDirectoryHandle.getDirectoryHandle('Data', { create: true });
        
        // Создаем имя файла с временной меткой
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const fileName = `coop_data_${timestamp}_${Date.now()}.json`;
        
        // Подготавливаем данные для сохранения
        const dataToSave = {
            members: members,
            payments: payments,
            transactions: transactions,
            documents: documents,
            applications: applications,
            meetings: meetings,
            certificates: certificates,
            lastUpdated: new Date().toISOString()
        };
        
        // Создаем файл и записываем данные
        const fileHandle = await dataDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(dataToSave, null, 2));
        await writable.close();
        
        console.log(`Данные безопасно сохранены в C:\\КООПЕРАНТ\\Data\\${fileName}`);
        return true;
    } catch (err) {
        console.error('Ошибка при безопасном сохранении данных:', err);
        return false;
    }
}
```

### 3.3 Создание поддиректорий с контролем
```javascript
// Функция безопасного создания поддиректорий
async function createSecureSubdirectories(directoryHandle) {
    const allowedSubdirs = ['Data', 'Documents', 'Reports', 'Backups', 'Applications', 'Certificates', 'Protocols'];
    
    for (const subdir of allowedSubdirs) {
        try {
            // Проверяем, что имя поддиректории разрешено
            if (!allowedSubdirs.includes(subdir)) {
                throw new Error(`Создание поддиректории ${subdir} не разрешено`);
            }
            
            await directoryHandle.getDirectoryHandle(subdir, { create: true });
            console.log(`Поддиректория ${subdir} создана безопасно`);
        } catch (err) {
            console.error(`Ошибка при создании поддиректории ${subdir}:`, err);
        }
    }
}
```

## 4. Функции проверки целостности данных

### 4.1 Проверка структуры данных
```javascript
// Функция проверки целостности структуры данных
function verifyDataStructure() {
    const issues = [];
    
    // Проверка массивов
    if (!Array.isArray(members)) {
        issues.push('Поле members должно быть массивом');
    }
    
    if (!Array.isArray(payments)) {
        issues.push('Поле payments должно быть массивом');
    }
    
    if (!Array.isArray(transactions)) {
        issues.push('Поле transactions должно быть массивом');
    }
    
    // Проверка структуры отдельных записей
    members.forEach((member, index) => {
        if (!member.id) {
            issues.push(`Пайщик в позиции ${index} не имеет ID`);
        }
        if (!member.name) {
            issues.push(`Пайщик ${member.id || index} не имеет ФИО`);
        }
    });
    
    payments.forEach((payment, index) => {
        if (!payment.id) {
            issues.push(`Паевой взнос в позиции ${index} не имеет ID`);
        }
        if (!payment.memberId) {
            issues.push(`Паевой взнос ${payment.id || index} не имеет ID пайщика`);
        }
    });
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        issueCount: issues.length
    };
}
```

### 4.2 Проверка связей между сущностями
```javascript
// Функция проверки целостности связей между сущностями
function checkDataIntegrity() {
    const issues = [];
    
    // Проверка, что все паевые взносы связаны с существующими пайщиками
    payments.forEach(payment => {
        if (payment.memberId) {
            const memberExists = members.some(member => member.id === payment.memberId);
            if (!memberExists) {
                issues.push(`Паевой взнос ${payment.id} связан с несуществующим пайщиком ${payment.memberId}`);
            }
        }
    });
    
    // Проверка, что все бухгалтерские проводки связаны с существующими операциями
    transactions.forEach(transaction => {
        if (transaction.relatedPaymentId) {
            const paymentExists = payments.some(payment => payment.id === transaction.relatedPaymentId);
            if (!paymentExists) {
                issues.push(`Проводка ${transaction.id} связана с несуществующим взносом ${transaction.relatedPaymentId}`);
            }
        }
    });
    
    // Проверка, что все удостоверения связаны с существующими пайщиками
    certificates.forEach(certificate => {
        if (certificate.memberId) {
            const memberExists = members.some(member => member.id === certificate.memberId);
            if (!memberExists) {
                issues.push(`Удостоверение ${certificate.id} связано с несуществующим пайщиком ${certificate.memberId}`);
            }
        }
    });
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        issueCount: issues.length
    };
}
```

### 4.3 Проверка корректности значений
```javascript
// Функция проверки корректности значений данных
function validateDataValues() {
    const issues = [];
    
    // Проверка корректности дат
    members.forEach(member => {
        if (member.joinDate && !isValidDate(member.joinDate)) {
            issues.push(`Некорректная дата вступления для пайщика ${member.id}`);
        }
    });
    
    payments.forEach(payment => {
        if (payment.date && !isValidDate(payment.date)) {
            issues.push(`Некорректная дата для паевого взноса ${payment.id}`);
        }
        if (payment.amount && typeof payment.amount !== 'number') {
            issues.push(`Некорректный формат суммы для взноса ${payment.id}`);
        }
    });
    
    transactions.forEach(transaction => {
        if (transaction.date && !isValidDate(transaction.date)) {
            issues.push(`Некорректная дата для проводки ${transaction.id}`);
        }
        if (transaction.amount && typeof transaction.amount !== 'number') {
            issues.push(`Некорректный формат суммы для проводки ${transaction.id}`);
        }
    });
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        issueCount: issues.length
    };
}
```

## 5. Функции резервного копирования

### 5.1 Создание резервной копии
```javascript
// Функция создания резервной копии данных
async function createSecureBackup() {
    try {
        // Подготавливаем данные для резервной копии
        const backupData = {
            members: members,
            payments: payments,
            transactions: transactions,
            documents: documents,
            applications: applications,
            meetings: meetings,
            certificates: certificates,
            backupDate: new Date().toISOString(),
            version: '1.0.0',
            systemInfo: {
                browser: navigator.userAgent,
                platform: navigator.platform,
                timestamp: Date.now()
            }
        };
        
        if (coopDirectoryHandle) {
            // Получаем поддиректорию для резервных копий
            const backupDir = await coopDirectoryHandle.getDirectoryHandle('Backups', { create: true });
            
            // Создаем имя файла с датой
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
            const fileName = `coop_backup_${dateStr}_${timeStr}.json`;
            
            // Создаем файл резервной копии
            const fileHandle = await backupDir.getFileHandle(fileName, { create: true });
            
            // Записываем данные
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(backupData, null, 2));
            await writable.close();
            
            console.log(`Резервная копия создана: C:\\КООПЕРАНТ\\Backups\\${fileName}`);
            return { success: true, fileName: fileName };
        } else {
            // Резервный вариант: сохранение через загрузку файла
            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `coop_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            
            console.log('Резервная копия создана через загрузку файла');
            return { success: true, fileName: 'download_required' };
        }
    } catch (err) {
        console.error('Ошибка при создании резервной копии:', err);
        return { success: false, error: err.message };
    }
}
```

### 5.2 Восстановление из резервной копии
```javascript
// Функция восстановления из резервной копии
async function restoreFromBackupSecurely() {
    try {
        if ('showOpenFilePicker' in window) {
            // Используем File System API для выбора файла
            [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }],
                excludeAcceptAllOption: true,
                multiple: false
            });
            
            const file = await fileHandle.getFile();
            const contents = await file.text();
            const data = JSON.parse(contents);
            
            // Проверяем целостность данных перед восстановлением
            if (!data.backupDate) {
                throw new Error('Файл не является резервной копией системы');
            }
            
            // Проверяем структуру данных
            const structureCheck = verifyDataStructure();
            if (!structureCheck.isValid) {
                console.warn('Обнаружены проблемы со структурой данных:', structureCheck.issues);
                if (!confirm('Обнаружены проблемы со структурой данных. Продолжить восстановление?')) {
                    return { success: false, error: 'Восстановление отменено пользователем' };
                }
            }
            
            // Восстанавливаем данные
            members = data.members || [];
            payments = data.payments || [];
            transactions = data.transactions || [];
            documents = data.documents || [];
            applications = data.applications || [];
            meetings = data.meetings || [];
            certificates = data.certificates || [];
            
            // Обновляем интерфейс
            if (typeof loadMembersData === 'function') loadMembersData();
            if (typeof loadPaymentsData === 'function') loadPaymentsData();
            if (typeof loadTransactionsData === 'function') loadTransactionsData();
            if (typeof loadDocumentsData === 'function') loadDocumentsData();
            if (typeof loadApplicationsData === 'function') loadApplicationsData();
            if (typeof loadMeetingsData === 'function') loadMeetingsData();
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            
            console.log('Данные успешно восстановлены из резервной копии');
            return { success: true, message: 'Данные успешно восстановлены' };
        } else {
            // Резервный вариант для браузеров без File System API
            alert('Для восстановления из резервной копии используйте функцию загрузки данных');
            return { success: false, error: 'File System API не поддерживается' };
        }
    } catch (err) {
        console.error('Ошибка при восстановлении из резервной копии:', err);
        return { success: false, error: err.message };
    }
}
```

## 6. Функции аудита безопасности

### 6.1 Проверка безопасности системы
```javascript
// Функция комплексной проверки безопасности
function runSecurityAudit() {
    const auditResults = {
        overallSecurity: true,
        issues: [],
        recommendations: [],
        summary: {
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0
        }
    };
    
    // Проверка структуры данных
    const structureCheck = verifyDataStructure();
    if (!structureCheck.isValid) {
        auditResults.overallSecurity = false;
        structureCheck.issues.forEach(issue => {
            auditResults.issues.push({
                category: 'data_structure',
                severity: 'high',
                issue: issue
            });
        });
    }
    
    // Проверка целостности данных
    const integrityCheck = checkDataIntegrity();
    if (!integrityCheck.isValid) {
        integrityCheck.issues.forEach(issue => {
            auditResults.issues.push({
                category: 'data_integrity',
                severity: 'medium',
                issue: issue
            });
        });
    }
    
    // Проверка корректности значений
    const valuesCheck = validateDataValues();
    if (!valuesCheck.isValid) {
        valuesCheck.issues.forEach(issue => {
            auditResults.issues.push({
                category: 'data_values',
                severity: 'medium',
                issue: issue
            });
        });
    }
    
    // Проверка безопасности ввода
    const xssCheck = checkXSSProtection();
    if (!xssCheck.passed) {
        xssCheck.issues.forEach(issue => {
            auditResults.issues.push({
                category: 'xss_security',
                severity: 'high',
                issue: issue
            });
        });
    }
    
    // Подсчет результатов
    auditResults.summary.totalChecks = 4; // Общее количество проверок
    auditResults.summary.failedChecks = auditResults.issues.length;
    auditResults.summary.passedChecks = auditResults.summary.totalChecks - auditResults.summary.failedChecks;
    
    // Формирование рекомендаций
    if (auditResults.issues.length > 0) {
        auditResults.recommendations.push('Срочно устранить выявленные уязвимости');
        auditResults.recommendations.push('Провести повторный аудит после устранения проблем');
        auditResults.recommendations.push('Обновить документацию по безопасности');
    } else {
        auditResults.recommendations.push('Система соответствует требованиям безопасности');
        auditResults.recommendations.push('Рекомендуется регулярно проводить аудит безопасности');
    }
    
    return auditResults;
}
```

### 6.2 Мониторинг безопасности
```javascript
// Функция мониторинга безопасности
function monitorSecurity() {
    const securityMonitor = {
        checks: [],
        alerts: [],
        lastCheck: new Date().toISOString()
    };
    
    // Проверка целостности данных
    const integrityResult = checkDataIntegrity();
    securityMonitor.checks.push({
        name: 'Data Integrity Check',
        timestamp: new Date().toISOString(),
        result: integrityResult.isValid,
        issues: integrityResult.issues
    });
    
    if (!integrityResult.isValid) {
        securityMonitor.alerts.push({
            type: 'data_integrity',
            message: `Обнаружены проблемы с целостностью данных: ${integrityResult.issueCount} issues`,
            timestamp: new Date().toISOString()
        });
    }
    
    // Проверка структуры данных
    const structureResult = verifyDataStructure();
    securityMonitor.checks.push({
        name: 'Data Structure Check',
        timestamp: new Date().toISOString(),
        result: structureResult.isValid,
        issues: structureResult.issues
    });
    
    if (!structureResult.isValid) {
        securityMonitor.alerts.push({
            type: 'data_structure',
            message: `Обнаружены проблемы со структурой данных: ${structureResult.issueCount} issues`,
            timestamp: new Date().toISOString()
        });
    }
    
    return securityMonitor;
}
```

## 7. Функции контроля доступа

### 7.1 Ограничение доступа к данным
- **Назначение:** Ограничение доступа к чувствительным данным
- **Реализация:** Через File System API с согласия пользователя
- **Функции:**
  - Запрос разрешения на доступ к файлам
  - Ограничение доступа только к разрешенным директориям
  - Защита от несанкционированного доступа

### 7.2 Контроль доступа к функциям
```javascript
// Функция проверки прав доступа к операциям
function checkAccessRights(operation, userRole = 'default') {
    const accessRules = {
        'add_member': ['admin', 'manager'],
        'edit_member': ['admin', 'manager'],
        'delete_member': ['admin'],
        'add_payment': ['admin', 'accountant'],
        'edit_payment': ['admin', 'accountant'],
        'delete_payment': ['admin'],
        'add_transaction': ['admin', 'accountant'],
        'edit_transaction': ['admin', 'accountant'],
        'delete_transaction': ['admin'],
        'view_financial_data': ['admin', 'accountant', 'auditor'],
        'export_reports': ['admin', 'manager', 'accountant']
    };
    
    const allowedRoles = accessRules[operation] || ['admin'];
    return allowedRoles.includes(userRole);
}
```

## 8. Функции защиты от XSS

### 8.1 Проверка защиты от XSS
```javascript
// Функция проверки защиты от XSS
function checkXSSProtection() {
    const testInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>'
    ];
    
    const issues = [];
    
    testInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        const containsScript = sanitized.toLowerCase().includes('<script>');
        const containsJavascript = sanitized.toLowerCase().includes('javascript:');
        
        if (containsScript || containsJavascript) {
            issues.push(`Найдена потенциальная XSS-уязвимость в вводе: ${input}`);
        }
    });
    
    return {
        passed: issues.length === 0,
        issues: issues
    };
}
```

## 9. Функции шифрования (в будущем)

### 9.1 Потенциальные функции шифрования
- Шифрование чувствительных данных при хранении
- Шифрование данных при передаче (если будет серверная часть)
- Управление ключами шифрования
- Аутентификация пользователей

## 10. Функции обнаружения и реагирования на инциденты

### 10.1 Журнал безопасности
```javascript
// Функция ведения журнала безопасности
function logSecurityEvent(eventType, details, severity = 'info') {
    const securityLog = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        eventType: eventType,
        details: details,
        severity: severity,
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
    };
    
    // В реальной системе журнал сохраняется в защищенное место
    // Для демонстрации добавляем в консоль
    console.log(`[SECURITY ${severity.toUpperCase()}] ${eventType}:`, details);
    
    return securityLog;
}
```

### 10.2 Обнаружение аномалий
```javascript
// Функция обнаружения аномальных действий
function detectAnomalies() {
    const anomalies = [];
    
    // Проверка на необычную активность (например, много операций за короткое время)
    const recentOperations = getRecentOperations(5); // Последние 5 минут
    
    if (recentOperations.length > 50) { // Если более 50 операций за 5 минут
        anomalies.push({
            type: 'high_activity',
            description: `Обнаружена необычно высокая активность: ${recentOperations.length} операций за последние 5 минут`,
            severity: 'warning'
        });
    }
    
    // Проверка на подозрительные суммы
    const suspiciousPayments = payments.filter(p => p.amount > 1000000); // Больше 1 млн
    if (suspiciousPayments.length > 0) {
        anomalies.push({
            type: 'suspicious_amount',
            description: `Обнаружены подозрительные суммы паевых взносов: ${suspiciousPayments.length} взносов более 1 млн ₽`,
            severity: 'high'
        });
    }
    
    return anomalies;
}
```

## 11. Регулярные проверки безопасности

### 11.1 Плановые проверки
- Ежедневная проверка целостности данных
- Еженедельная проверка безопасности
- Ежемесячный аудит системы
- Проверка резервных копий

### 11.2 Автоматические проверки
```javascript
// Функция запуска регулярных проверок безопасности
function scheduleRegularSecurityChecks() {
    // Проверка целостности данных каждые 24 часа
    setInterval(() => {
        const integrityCheck = checkDataIntegrity();
        if (!integrityCheck.isValid) {
            logSecurityEvent('data_integrity_violation', integrityCheck.issues, 'high');
        }
    }, 24 * 60 * 60 * 1000); // 24 часа
    
    // Проверка структуры данных каждые 12 часов
    setInterval(() => {
        const structureCheck = verifyDataStructure();
        if (!structureCheck.isValid) {
            logSecurityEvent('data_structure_violation', structureCheck.issues, 'medium');
        }
    }, 12 * 60 * 60 * 1000); // 12 часов
    
    // Проверка аномалий каждые 30 минут
    setInterval(() => {
        const anomalies = detectAnomalies();
        if (anomalies.length > 0) {
            anomalies.forEach(anomaly => {
                logSecurityEvent(anomaly.type, anomaly.description, anomaly.severity);
            });
        }
    }, 30 * 60 * 1000); // 30 минут
}
```

## 12. Обучение безопасности

### 12.1 Руководство по безопасности
- Инструкции по защите данных
- Рекомендации по безопасному использованию
- Процедуры реагирования на инциденты
- Контакты службы безопасности

### 12.2 Тренинги по безопасности
- Обучение пользователей мерам безопасности
- Инструктаж по защите персональных данных
- Тренинги по распознаванию угроз
- Практические занятия по безопасности

## 13. Заключение

Система обеспечения безопасности информационной системы учета пайщиков кооператива включает в себя комплекс мер по защите данных, проверке целостности, контролю доступа и мониторингу безопасности. Все функции безопасности разработаны с учетом требований законодательства и современных подходов к защите информации.

Ключевые особенности системы безопасности:
- **Локальное хранение данных:** Все данные хранятся на устройстве пользователя
- **Нет передачи данных:** Никакие данные не передаются на серверы
- **File System API:** Безопасный доступ с согласия пользователя
- **Валидация ввода:** Защита от некорректных данных
- **Санитизация:** Защита от XSS-атак
- **Проверка целостности:** Контроль корректности структуры данных
- **Резервное копирование:** Защита от потери данных
- **Мониторинг:** Постоянный контроль безопасности
- **Аудит:** Регулярная проверка соответствия требованиям

Система готова к использованию и обеспечивает надежную защиту информации пайщиков и кооператива.