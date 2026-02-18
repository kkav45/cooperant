# Каталог скриптов и утилит информационной системы учета пайщиков кооператива

## 1. Общая информация

### 1.1 Назначение скриптов и утилит
Скрипты и утилиты обеспечивают автоматизацию рутинных операций, проверку целостности системы, запуск приложения и другие вспомогательные функции.

### 1.2 Классификация
- Служебные скрипты (запуск, проверка целостности)
- Утилиты обслуживания (резервное копирование, восстановление)
- Скрипты тестирования (проверка функций)
- Скрипты безопасности (проверка данных)

## 2. Служебные скрипты

### 2.1 start.bat
- **Тип:** Batch-скрипт
- **Назначение:** Запуск системы в браузере
- **Описание:** Открывает главную страницу системы в браузере по умолчанию
- **Параметры:** Нет
- **Требования:** Windows OS, установленный браузер
- **Содержание:**
```batch
@echo off
echo Открытие информационной системы учета пайщиков кооператива...
echo.

REM Получаем путь к файлу index.html
set "indexPath=%~dp0index.html"

REM Открываем в браузере по умолчанию
start "" "%indexPath%"

echo Система открыта в браузере по умолчанию.
echo Убедитесь, что используется поддерживаемый браузер (Chrome, Edge, Opera).
pause
```

### 2.2 integrity_check.bat
- **Тип:** Batch-скрипт
- **Назначение:** Проверка целостности файлов системы
- **Описание:** Проверяет наличие и целостность основных файлов системы
- **Параметры:** Нет
- **Требования:** Windows OS
- **Содержание:**
```batch
@echo off
echo Проверка целостности информационной системы учета пайщиков кооператива
echo ======================================================================

setlocal enabledelayedexpansion

set "required_files=index.html app.js styles.css README.md"
set "optional_files=Техническая_спецификация_информационной_системы_учета_пайщиков_кооператива.md demo_data.json"

echo.
echo Проверка обязательных файлов:
echo ------------------------------

set "missing_count=0"

for %%f in (%required_files%) do (
    if exist "%%f" (
        echo [OK] %%f
    ) else (
        echo [ОШИБКА] Отсутствует обязательный файл: %%f
        set /a missing_count+=1
    )
)

echo.
echo Проверка дополнительных файлов:
echo -------------------------------

for %%f in (%optional_files%) do (
    if exist "%%f" (
        echo [OK] %%f
    ) else (
        echo [ПРЕДУПРЕЖДЕНИЕ] Отсутствует дополнительный файл: %%f
    )
)

echo.
if !missing_count! gtr 0 (
    echo Найдено !missing_count! отсутствующих обязательных файлов.
    echo Система НЕ может работать корректно.
    pause
    exit /b 1
) else (
    echo Все обязательные файлы на месте.
    echo Система готова к использованию.
)

echo.
echo Проверка завершена.
pause
```

## 3. Утилиты обслуживания

### 3.1 backup_utility.js
- **Тип:** JavaScript-модуль
- **Назначение:** Утилита резервного копирования
- **Описание:** Функции для создания и восстановления резервных копий данных
- **Функции:**
  - createBackup() - создание резервной копии
  - restoreFromBackup() - восстановление из резервной копии
  - validateBackup() - проверка целостности резервной копии
  - listBackups() - список доступных резервных копий

#### 3.1.1 Функция createBackup()
```javascript
// Функция создания резервной копии
async function createBackup() {
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
        
        // Если доступен File System API, сохраняем в папку C:\КООПЕРАНТ
        if (coopDirectoryHandle) {
            // Получаем поддиректорию для резервных копий
            const backupDir = await coopDirectoryHandle.getDirectoryHandle('Backups', { create: true });
            
            // Создаем имя файла с датой
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const fileName = `coop_backup_${dateStr}_${Date.now()}.json`;
            
            // Создаем файл резервной копии
            const fileHandle = await backupDir.getFileHandle(fileName, { create: true });
            
            // Записываем данные
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(backupData, null, 2));
            await writable.close();
            
            console.log(`Резервная копия создана: ${fileName}`);
            return { success: true, fileName: fileName, message: 'Резервная копия успешно создана' };
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
            return { success: true, fileName: 'download_required', message: 'Резервная копия создана (через загрузку)' };
        }
    } catch (err) {
        console.error('Ошибка при создании резервной копии:', err);
        return { success: false, error: err.message, message: 'Ошибка при создании резервной копии' };
    }
}
```

#### 3.1.2 Функция restoreFromBackup()
```javascript
// Функция восстановления из резервной копии
async function restoreFromBackup() {
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
            
            // Проверяем целостность данных
            if (!data.backupDate) {
                throw new Error('Файл не является резервной копией системы');
            }
            
            // Проверяем версию данных
            if (data.version && data.version !== '1.0.0') {
                console.warn('Версия резервной копии отличается от текущей версии системы');
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
            // Резервный вариант: через input[type="file"]
            alert('Для восстановления из резервной копии используйте функцию загрузки данных');
            return { success: false, error: 'File System API не поддерживается', message: 'File System API не поддерживается' };
        }
    } catch (err) {
        console.error('Ошибка при восстановлении из резервной копии:', err);
        return { success: false, error: err.message, message: 'Ошибка при восстановлении данных' };
    }
}
```

### 3.2 data_validator.js
- **Тип:** JavaScript-модуль
- **Назначение:** Утилита проверки целостности данных
- **Описание:** Функции для проверки корректности структуры и содержания данных
- **Функции:**
  - validateDataStructure() - проверка структуры данных
  - checkDataIntegrity() - проверка целостности данных
  - findOrphanedRecords() - поиск записей без связей
  - generateIntegrityReport() - формирование отчета о целостности

#### 3.2.1 Функция validateDataStructure()
```javascript
// Функция проверки структуры данных
function validateDataStructure() {
    const validationResult = {
        isValid: true,
        issues: [],
        summary: {}
    };
    
    // Проверка массивов
    if (!Array.isArray(members)) {
        validationResult.issues.push({ type: 'structure', field: 'members', message: 'Поле members должно быть массивом' });
        validationResult.isValid = false;
    }
    
    if (!Array.isArray(payments)) {
        validationResult.issues.push({ type: 'structure', field: 'payments', message: 'Поле payments должно быть массивом' });
        validationResult.isValid = false;
    }
    
    if (!Array.isArray(transactions)) {
        validationResult.issues.push({ type: 'structure', field: 'transactions', message: 'Поле transactions должно быть массивом' });
        validationResult.isValid = false;
    }
    
    // Проверка отдельных записей
    members.forEach((member, index) => {
        if (!member.id) {
            validationResult.issues.push({ type: 'data', field: 'members[' + index + '].id', message: 'Отсутствует ID пайщика' });
            validationResult.isValid = false;
        }
        if (!member.name) {
            validationResult.issues.push({ type: 'data', field: 'members[' + index + '].name', message: 'Отсутствует ФИО пайщика' });
            validationResult.isValid = false;
        }
    });
    
    payments.forEach((payment, index) => {
        if (!payment.id) {
            validationResult.issues.push({ type: 'data', field: 'payments[' + index + '].id', message: 'Отсутствует ID взноса' });
            validationResult.isValid = false;
        }
        if (!payment.memberId) {
            validationResult.issues.push({ type: 'data', field: 'payments[' + index + '].memberId', message: 'Отсутствует ID пайщика в взносе' });
            validationResult.isValid = false;
        }
    });
    
    // Подсчет
    validationResult.summary = {
        membersCount: Array.isArray(members) ? members.length : 0,
        paymentsCount: Array.isArray(payments) ? payments.length : 0,
        transactionsCount: Array.isArray(transactions) ? transactions.length : 0,
        issuesCount: validationResult.issues.length
    };
    
    return validationResult;
}
```

#### 3.2.2 Функция checkDataIntegrity()
```javascript
// Функция проверки целостности данных
function checkDataIntegrity() {
    const integrityResult = {
        isValid: true,
        issues: [],
        summary: {}
    };
    
    // Проверка связей между сущностями
    payments.forEach(payment => {
        const memberExists = members.some(member => member.id === payment.memberId);
        if (!memberExists) {
            integrityResult.issues.push({
                type: 'integrity',
                field: 'payment.memberId',
                message: `Паевой взнос ${payment.id} связан с несуществующим пайщиком ${payment.memberId}`
            });
            integrityResult.isValid = false;
        }
    });
    
    transactions.forEach(transaction => {
        if (transaction.relatedPaymentId) {
            const paymentExists = payments.some(payment => payment.id === transaction.relatedPaymentId);
            if (!paymentExists) {
                integrityResult.issues.push({
                    type: 'integrity',
                    field: 'transaction.relatedPaymentId',
                    message: `Проводка ${transaction.id} связана с несуществующим взносом ${transaction.relatedPaymentId}`
                });
                integrityResult.isValid = false;
            }
        }
    });
    
    // Проверка корректности дат
    members.forEach(member => {
        if (member.joinDate && !isValidDate(member.joinDate)) {
            integrityResult.issues.push({
                type: 'integrity',
                field: 'member.joinDate',
                message: `Некорректная дата вступления для пайщика ${member.id}`
            });
            integrityResult.isValid = false;
        }
    });
    
    payments.forEach(payment => {
        if (payment.date && !isValidDate(payment.date)) {
            integrityResult.issues.push({
                type: 'integrity',
                field: 'payment.date',
                message: `Некорректная дата для взноса ${payment.id}`
            });
            integrityResult.isValid = false;
        }
    });
    
    // Подсчет
    integrityResult.summary = {
        totalChecks: members.length + payments.length + transactions.length,
        issuesCount: integrityResult.issues.length,
        valid: integrityResult.isValid
    };
    
    return integrityResult;
}

// Вспомогательная функция проверки корректности даты
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}
```

## 4. Скрипты тестирования

### 4.1 unit_tests.js
- **Тип:** JavaScript-модуль
- **Назначение:** Модульные тесты функций системы
- **Описание:** Автоматизированные тесты отдельных функций системы
- **Функции:**
  - runUnitTests() - запуск всех модульных тестов
  - testMemberFunctions() - тестирование функций пайщиков
  - testPaymentFunctions() - тестирование функций взносов
  - testTransactionFunctions() - тестирование функций проводок

#### 4.1.1 Функция тестирования добавления пайщика
```javascript
// Функция тестирования добавления пайщика
function testAddMember() {
    const initialCount = members.length;
    
    // Подготовка тестовых данных
    const testMember = {
        id: 'test_member_' + Date.now(),
        name: 'Тестов Тест Тестович',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        contact: '+7 (999) 999-99-99',
        address: 'г. Тест, ул. Тестовая, д. 1',
        notes: 'Тестовый пайщик',
        createdAt: new Date().toISOString()
    };
    
    // Добавление пайщика
    members.push(testMember);
    
    // Проверка
    const finalCount = members.length;
    const addedMember = members.find(m => m.id === testMember.id);
    
    const result = {
        testName: 'Добавление пайщика',
        passed: finalCount === initialCount + 1 && addedMember !== undefined,
        details: {
            initialCount: initialCount,
            finalCount: finalCount,
            memberAdded: addedMember !== undefined
        }
    };
    
    // Удаление тестового пайщика
    members = members.filter(m => m.id !== testMember.id);
    
    console.log(result.passed ? '✓' : '✗', result.testName);
    return result;
}

// Функция запуска всех тестов
function runAllTests() {
    const testResults = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        results: []
    };
    
    // Запуск тестов
    const tests = [
        testAddMember,
        testAddPayment,
        testCalculateDebt,
        testGenerateId
    ];
    
    tests.forEach(testFunction => {
        testResults.totalTests++;
        try {
            const result = testFunction();
            testResults.results.push(result);
            if (result.passed) {
                testResults.passedTests++;
            } else {
                testResults.failedTests++;
            }
        } catch (error) {
            testResults.failedTests++;
            testResults.results.push({
                testName: testFunction.name,
                passed: false,
                error: error.message
            });
        }
    });
    
    return testResults;
}
```

### 4.2 security_tests.js
- **Тип:** JavaScript-модуль
- **Назначение:** Тесты безопасности системы
- **Описание:** Проверка системы на уязвимости и безопасность данных
- **Функции:**
  - runSecurityTests() - запуск всех тестов безопасности
  - testXSSProtection() - тестирование защиты от XSS
  - testDataValidation() - тестирование валидации данных
  - testAccessControl() - тестирование контроля доступа

#### 4.2.1 Функция тестирования защиты от XSS
```javascript
// Функция тестирования защиты от XSS
function testXSSProtection() {
    const testResults = [];
    
    // Тестирование ввода потенциально опасного содержимого
    const xssInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>'
    ];
    
    xssInputs.forEach(input => {
        // Проверяем, как система обрабатывает потенциально опасный ввод
        const sanitized = sanitizeInput(input);
        
        // Проверяем, не выполняется ли скрипт
        const containsScript = sanitized.toLowerCase().includes('<script>');
        const containsJavascript = sanitized.toLowerCase().includes('javascript:');
        
        testResults.push({
            input: input,
            sanitized: sanitized,
            safe: !containsScript && !containsJavascript,
            containsScript: containsScript,
            containsJavascript: containsJavascript
        });
    });
    
    const allSafe = testResults.every(result => result.safe);
    
    return {
        testName: 'Защита от XSS',
        passed: allSafe,
        details: testResults
    };
}

// Функция санитизации ввода
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Удаление потенциально опасных тегов и атрибутов
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
```

## 5. Скрипты безопасности

### 5.1 security_audit.js
- **Тип:** JavaScript-модуль
- **Назначение:** Аудит безопасности системы
- **Описание:** Комплексная проверка системы на наличие уязвимостей
- **Функции:**
  - runSecurityAudit() - запуск полного аудита безопасности
  - checkDataEncryption() - проверка шифрования данных
  - verifyAccessControls() - проверка контроля доступа
  - generateSecurityReport() - формирование отчета безопасности

#### 5.1.1 Функция комплексного аудита безопасности
```javascript
// Функция комплексного аудита безопасности
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
    const dataStructureCheck = validateDataStructure();
    if (!dataStructureCheck.isValid) {
        auditResults.overallSecurity = false;
        dataStructureCheck.issues.forEach(issue => {
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
    
    // Проверка безопасности ввода
    const xssTest = testXSSProtection();
    if (!xssTest.passed) {
        xssTest.details.forEach(detail => {
            if (!detail.safe) {
                auditResults.issues.push({
                    category: 'input_validation',
                    severity: 'high',
                    issue: detail
                });
            }
        });
    }
    
    // Проверка файловой безопасности
    if (!coopDirectoryHandle) {
        auditResults.issues.push({
            category: 'file_security',
            severity: 'medium',
            issue: 'File System API не настроен'
        });
        auditResults.overallSecurity = false;
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

### 5.2 data_encryption.js
- **Тип:** JavaScript-модуль
- **Назначение:** Функции шифрования данных (в будущем)
- **Описание:** Планируемые функции для шифрования чувствительных данных
- **Функции:**
  - encryptSensitiveData() - шифрование чувствительных данных
  - decryptSensitiveData() - расшифровка данных
  - generateEncryptionKey() - генерация ключа шифрования

## 6. Утилиты для разработчиков

### 6.1 dev_utils.js
- **Тип:** JavaScript-модуль
- **Назначение:** Утилиты для разработчиков
- **Описание:** Вспомогательные функции для разработки и отладки
- **Функции:**
  - logSystemState() - логирование состояния системы
  - resetTestData() - сброс тестовых данных
  - generateTestData() - генерация тестовых данных
  - debugFunction() - отладка функций

#### 6.1.1 Функция генерации тестовых данных
```javascript
// Функция генерации тестовых данных
function generateTestData() {
    // Очищаем текущие данные
    members = [];
    payments = [];
    transactions = [];
    documents = [];
    applications = [];
    meetings = [];
    certificates = [];
    
    // Генерируем тестовых пайщиков
    for (let i = 1; i <= 10; i++) {
        members.push({
            id: 'test_member_' + i,
            name: `Тестовый Пайщик ${i}`,
            status: i <= 7 ? 'active' : i <= 9 ? 'candidate' : 'suspended',
            joinDate: new Date(2023, 0, i).toISOString().split('T')[0],
            contact: `+7 (999) 999-99-${i.toString().padStart(2, '0')}`,
            address: `г. Тест, ул. Тестовая, д. ${i}`,
            notes: `Тестовый пайщик #${i}`,
            createdAt: new Date().toISOString()
        });
    }
    
    // Генерируем тестовые взносы
    for (let i = 1; i <= 15; i++) {
        const randomMember = members[Math.floor(Math.random() * members.length)];
        const paymentTypes = ['entrance', 'share', 'membership', 'targeted'];
        const paymentMethods = ['cash', 'non_cash', 'property'];
        
        payments.push({
            id: 'test_payment_' + i,
            memberId: randomMember.id,
            type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            amount: Math.floor(Math.random() * 10000) + 1000,
            date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            description: `Тестовый взнос #${i}`,
            paid: Math.random() > 0.3, // 70% оплачено
            createdAt: new Date().toISOString()
        });
    }
    
    // Генерируем тестовые проводки
    for (let i = 1; i <= 10; i++) {
        transactions.push({
            id: 'test_transaction_' + i,
            date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 50000) + 1000,
            debitAccount: ['50', '51', '76', '86'][Math.floor(Math.random() * 4)],
            creditAccount: ['50', '51', '76', '86'][Math.floor(Math.random() * 4)],
            description: `Тестовая проводка #${i}`,
            createdAt: new Date().toISOString()
        });
    }
    
    console.log('Тестовые данные сгенерированы');
    return {
        membersCount: members.length,
        paymentsCount: payments.length,
        transactionsCount: transactions.length
    };
}
```

## 7. Скрипты автоматизации

### 7.1 auto_save_scheduler.js
- **Тип:** JavaScript-модуль
- **Назначение:** Планировщик автоматического сохранения
- **Описание:** Функции для автоматического сохранения данных
- **Функции:**
  - scheduleAutoSave() - планирование автоматического сохранения
  - cancelAutoSave() - отмена автоматического сохранения
  - forceSave() - принудительное сохранение

### 7.2 notification_scheduler.js
- **Тип:** JavaScript-модуль
- **Назначение:** Планировщик уведомлений
- **Описание:** Функции для автоматических уведомлений
- **Функции:**
  - scheduleNotifications() - планирование уведомлений
  - sendPaymentReminders() - отправка напоминаний о взносах
  - notifyUpcomingMeetings() - уведомления о предстоящих заседаниях

## 8. Заключение

Все созданные скрипты и утилиты обеспечивают комплексное функционирование информационной системы учета пайщиков кооператива. Они обеспечивают:
- Автоматизацию рутинных операций
- Контроль целостности данных
- Безопасность информации
- Удобство обслуживания
- Поддержку разработки и тестирования
- Эффективное управление системой