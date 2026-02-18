# Полный каталог файлов данных и их структура

## 1. Общая информация

### 1.1 Назначение файлов данных
Файлы данных системы содержат всю информацию, необходимую для функционирования информационной системы учета пайщиков кооператива, включая данные о пайщиках, паевых взносах, бухгалтерских проводках, документах, заявлениях и заседаниях.

### 1.2 Формат данных
Все данные хранятся в формате JSON (JavaScript Object Notation), что обеспечивает:
- Удобство чтения и записи
- Совместимость с JavaScript
- Простоту валидации
- Легкость миграции данных

## 2. Основные файлы данных

### 2.1 demo_data.json
- **Тип:** JSON-файл
- **Назначение:** Демонстрационные данные для системы
- **Расположение:** d:\!Минкооп_рф\! КООП\demo_data.json
- **Структура:**
```json
{
  "members": [
    {
      "id": "string",
      "name": "string",
      "status": "enum('candidate'|'active'|'suspended'|'excluded'|'withdrawn')",
      "joinDate": "string (YYYY-MM-DD)",
      "contact": "string",
      "address": "string",
      "notes": "string",
      "withdrawalDate": "string (YYYY-MM-DD)",
      "withdrawalReason": "string",
      "withdrawalNotes": "string",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ],
  "payments": [
    {
      "id": "string",
      "memberId": "string",
      "type": "enum('entrance'|'share'|'voluntary_share'|'membership'|'targeted'|'return_share')",
      "method": "enum('cash'|'non_cash'|'property')",
      "amount": "number",
      "propertyDescription": "string",
      "date": "string (YYYY-MM-DD)",
      "description": "string",
      "paid": "boolean",
      "documentNumber": "string",
      "expected": "boolean",
      "applicationId": "string",
      "evaluation": {
        "date": "string (YYYY-MM-DD)",
        "amount": "number",
        "method": "enum('market'|'book'|'expert'|'agreed')",
        "expert": "string",
        "notes": "string",
        "createdAt": "string (ISO 8601)"
      },
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ],
  "transactions": [
    {
      "id": "string",
      "date": "string (YYYY-MM-DD)",
      "amount": "number",
      "debitAccount": "string",
      "creditAccount": "string",
      "description": "string",
      "relatedPaymentId": "string",
      "transactionType": "enum('incoming'|'return')",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ],
  "documents": [
    {
      "id": "string",
      "name": "string",
      "type": "enum('contract'|'report'|'payment'|'other')",
      "description": "string",
      "date": "string (YYYY-MM-DD)",
      "size": "number",
      "fileName": "string",
      "mimeType": "string",
      "filePath": "string",
      "content": "any (null в текущей реализации)",
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ],
  "applications": [
    {
      "id": "string",
      "applicantName": "string",
      "applicantContact": "string",
      "birthDate": "string (YYYY-MM-DD)",
      "passport": "string",
      "registrationAddress": "string",
      "residenceAddress": "string",
      "occupation": "string",
      "income": "string",
      "desiredShareAmount": "number",
      "paymentMethod": "enum('cash'|'non_cash'|'property')",
      "propertyDescription": "string",
      "additionalInfo": "string",
      "submissionDate": "string (YYYY-MM-DD)",
      "status": "enum('pending'|'approved'|'rejected')",
      "decisionNotes": "string",
      "processedAt": "string (ISO 8601)",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "meetings": [
    {
      "id": "string",
      "date": "string (YYYY-MM-DD)",
      "time": "string (HH:MM)",
      "place": "string",
      "type": "enum('board'|'general'|'committee'|'other')",
      "topic": "string",
      "agenda": "string",
      "status": "enum('scheduled'|'completed'|'cancelled')",
      "attendees": [
        {
          "id": "string",
          "name": "string",
          "position": "string",
          "role": "string",
          "addedAt": "string (ISO 8601)"
        }
      ],
      "decisions": [
        {
          "id": "string",
          "title": "string",
          "content": "string",
          "responsible": "string",
          "deadline": "string (YYYY-MM-DD)",
          "status": "enum('adopted'|'executed'|'cancelled')",
          "adoptedAt": "string (ISO 8601)"
        }
      ],
      "applicationIds": "array",
      "createdAt": "string (ISO 8601)",
      "completedAt": "string (ISO 8601)"
    }
  ],
  "certificates": [
    {
      "id": "string",
      "memberId": "string",
      "memberName": "string",
      "issueDate": "string (YYYY-MM-DD)",
      "certificateNumber": "string",
      "status": "enum('active'|'inactive')",
      "issuedBy": "string",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "lastUpdated": "string (ISO 8601)",
  "version": "string"
}
```

### 2.2 coop_data.json (генерируемый файл)
- **Тип:** JSON-файл
- **Назначение:** Основной файл данных системы (генерируется при работе)
- **Расположение:** d:\!Минкооп_рф\! КООП\coop_data.json
- **Структура:** Та же, что и demo_data.json, но с реальными данными
- **Создание:** При первом сохранении данных в системе
- **Обновление:** При каждом автоматическом сохранении

## 3. Структура данных в системе

### 3.1 Пайщики (members)
```javascript
// Структура объекта пайщика
const memberStructure = {
    id: String,                    // Уникальный идентификатор
    name: String,                  // ФИО пайщика
    status: String,                // Статус (candidate, active, suspended, excluded, withdrawn)
    joinDate: String,              // Дата вступления (YYYY-MM-DD)
    contact: String,               // Контактная информация
    address: String,               // Адрес
    notes: String,                 // Примечания
    withdrawalDate: String,        // Дата выбытия (для выбывших)
    withdrawalReason: String,      // Причина выбытия
    withdrawalNotes: String,       // Примечания к выбытию
    createdAt: String,             // Дата создания (ISO 8601)
    updatedAt: String              // Дата обновления (ISO 8601)
};
```

### 3.2 Паевые взносы (payments)
```javascript
// Структура объекта паевого взноса
const paymentStructure = {
    id: String,                    // Уникальный идентификатор
    memberId: String,              // ID пайщика
    type: String,                  // Тип взноса
    method: String,                // Метод оплаты
    amount: Number,                // Сумма (для имущества - после оценки)
    propertyDescription: String,   // Описание имущества (если method='property')
    date: String,                  // Дата взноса
    description: String,           // Описание
    paid: Boolean,                 // Статус оплаты
    documentNumber: String,        // Номер документа
    expected: Boolean,             // Признак ожидаемого взноса
    applicationId: String,         // Связь с заявлением (если есть)
    evaluation: Object,            // Информация об оценке (для имущества)
    createdAt: String,             // Дата создания
    updatedAt: String              // Дата обновления
};
```

### 3.3 Бухгалтерские проводки (transactions)
```javascript
// Структура объекта бухгалтерской проводки
const transactionStructure = {
    id: String,                    // Уникальный идентификатор
    date: String,                  // Дата проводки
    amount: Number,                // Сумма
    debitAccount: String,          // Дебетовый счет
    creditAccount: String,         // Кредитовый счет
    description: String,           // Описание
    relatedPaymentId: String,      // Связь с паевым взносом
    transactionType: String,       // Тип операции (incoming, return)
    createdAt: String,             // Дата создания
    updatedAt: String              // Дата обновления
};
```

### 3.4 Документы (documents)
```javascript
// Структура объекта документа
const documentStructure = {
    id: String,                    // Уникальный идентификатор
    name: String,                  // Название документа
    type: String,                  // Тип документа
    description: String,           // Описание
    date: String,                  // Дата документа
    size: Number,                  // Размер файла в байтах
    fileName: String,              // Имя файла
    mimeType: String,              // MIME-тип файла
    filePath: String,              // Путь к файлу (для хранения в File System API)
    content: Any,                  // Содержимое файла (в текущей реализации null)
    createdAt: String,             // Дата создания
    updatedAt: String              // Дата обновления
};
```

### 3.5 Заявления (applications)
```javascript
// Структура объекта заявления
const applicationStructure = {
    id: String,                    // Уникальный идентификатор
    applicantName: String,         // ФИО заявителя
    applicantContact: String,      // Контактная информация
    birthDate: String,             // Дата рождения
    passport: String,              // Паспортные данные
    registrationAddress: String,   // Адрес регистрации
    residenceAddress: String,      // Адрес проживания
    occupation: String,            // Род занятий
    income: String,                // Доход
    desiredShareAmount: Number,    // Желаемый размер взноса
    paymentMethod: String,         // Метод оплаты
    propertyDescription: String,   // Описание имущества (если paymentMethod='property')
    additionalInfo: String,        // Дополнительная информация
    submissionDate: String,        // Дата подачи
    status: String,                // Статус (pending, approved, rejected)
    decisionNotes: String,         // Комментарии к решению
    processedAt: String,           // Дата обработки
    createdAt: String              // Дата создания
};
```

### 3.6 Заседания (meetings)
```javascript
// Структура объекта заседания
const meetingStructure = {
    id: String,                    // Уникальный идентификатор
    date: String,                  // Дата заседания
    time: String,                  // Время заседания
    place: String,                 // Место проведения
    type: String,                  // Тип заседания
    topic: String,                 // Тема заседания
    agenda: String,                // Повестка дня
    status: String,                // Статус (scheduled, completed, cancelled)
    attendees: Array,              // Участники [{id, name, position, role}]
    decisions: Array,              // Принятые решения [{id, title, content, responsible, deadline}]
    applicationIds: Array,         // Связанные заявления
    createdAt: String,             // Дата создания
    completedAt: String            // Дата завершения
};
```

### 3.7 Удостоверения (certificates)
```javascript
// Структура объекта удостоверения
const certificateStructure = {
    id: String,                    // Уникальный идентификатор
    memberId: String,              // ID пайщика
    memberName: String,            // Имя пайщика
    issueDate: String,             // Дата выдачи
    certificateNumber: String,     // Номер удостоверения
    status: String,                // Статус (active, inactive)
    issuedBy: String,              // Кем выдано
    createdAt: String              // Дата создания
};
```

## 4. Связи между сущностями

### 4.1 Связи в системе
```
members ↔ payments (один ко многим, через memberId)
payments ↔ transactions (один к одному/многим, через relatedPaymentId)
applications → members (один к одному при одобрении)
meetings ↔ applications (многие ко многим, через applicationIds)
documents ↔ members (через метаданные)
certificates ↔ members (один к одному/многим, через memberId)
```

### 4.2 Валидация связей
- Проверка существования связанных пайщиков при добавлении взносов
- Проверка существования связанных взносов при создании проводок
- Проверка существования связанных пайщиков при создании удостоверений
- Проверка целостности всех связей при загрузке данных

## 5. Файловая структура в C:\КООПЕРАНТ

### 5.1 Поддиректории
При настройке File System API система создает следующую структуру:
```
C:\КООПЕРАНТ\
├── Data\              # Основные данные системы (coop_data.json)
├── Documents\         # Документы кооператива
├── Reports\           # Сформированные отчеты
├── Applications\      # Заявления на вступление
├── Certificates\      # Удостоверения пайщиков
├── Protocols\         # Протоколы заседаний
├── Backups\           # Резервные копии данных
└── Other\             # Прочие документы
```

### 5.2 Файлы в поддиректориях
- **Data:** JSON-файлы с основными данными системы
- **Documents:** Файлы документов в различных форматах
- **Reports:** HTML-файлы сформированных отчетов
- **Applications:** JSON-файлы с данными заявлений
- **Certificates:** JSON-файлы с данными удостоверений
- **Protocols:** JSON-файлы протоколов заседаний
- **Backups:** Резервные копии данных системы
- **Other:** Прочие файлы системы

## 6. Форматы файлов

### 6.1 JSON-файлы
- **Расширение:** .json
- **Назначение:** Хранение структурированных данных
- **Кодировка:** UTF-8
- **Структура:** Объекты и массивы JavaScript

### 6.2 HTML-файлы (отчеты)
- **Расширение:** .html
- **Назначение:** Формирование отчетов
- **Кодировка:** UTF-8
- **Структура:** HTML с встроенными стилями

### 6.3 Документы пользователей
- **Форматы:** PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG
- **Назначение:** Хранение первичных документов
- **Размещение:** В соответствующих поддиректориях

## 7. Процессы работы с данными

### 7.1 Загрузка данных
```javascript
// Процесс загрузки данных из JSON-файла
async function loadData() {
    try {
        if ('showOpenFilePicker' in window) {
            // Используем File System API
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
            
            // Загружаем данные в переменные системы
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
        } else {
            // Резервный вариант: localStorage
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
            }
        }
    } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        // Инициализируем пустые массивы при ошибке
        members = members || [];
        payments = payments || [];
        transactions = transactions || [];
        documents = documents || [];
        applications = applications || [];
        meetings = meetings || [];
        certificates = certificates || [];
    }
}
```

### 7.2 Сохранение данных
```javascript
// Процесс сохранения данных в JSON-файл
async function saveData() {
    try {
        if ('showSaveFilePicker' in window) {
            // Подготавливаем данные для сохранения
            const data = {
                members: members,
                payments: payments,
                transactions: transactions,
                documents: documents,
                applications: applications,
                meetings: meetings,
                certificates: certificates,
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            };
            
            // Используем File System API для сохранения
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: 'coop_data.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            
            console.log('Данные успешно сохранены через File System API');
        } else {
            // Резервный вариант: через загрузку файла
            const dataStr = JSON.stringify({
                members: members,
                payments: payments,
                transactions: transactions,
                documents: documents,
                applications: applications,
                meetings: meetings,
                certificates: certificates,
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
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
            
            console.log('Данные сохранены через загрузку файла');
        }
    } catch (err) {
        console.error('Ошибка при сохранении данных:', err);
        alert('Ошибка при сохранении данных: ' + err.message);
    }
}
```

### 7.3 Автоматическое сохранение
```javascript
// Функция автоматического сохранения данных
function scheduleAutoSave() {
    // Очищаем предыдущий таймер
    if (window.autoSaveTimer) {
        clearTimeout(window.autoSaveTimer);
    }
    
    // Устанавливаем таймер для автоматического сохранения через 2 секунды
    window.autoSaveTimer = setTimeout(async () => {
        try {
            await saveData();
            console.log('Данные автоматически сохранены');
        } catch (err) {
            console.error('Ошибка при автоматическом сохранении:', err);
        }
    }, 2000);
}
```

## 8. Безопасность данных

### 8.1 Защита персональных данных
- Локальное хранение на устройстве пользователя
- Нет передачи данных на серверы
- Защита конфиденциальности информации
- Контроль доступа через File System API

### 8.2 Валидация данных
- Проверка структуры JSON при загрузке
- Проверка обязательных полей
- Проверка формата данных
- Проверка бизнес-правил

### 8.3 Резервное копирование
- Автоматическое создание резервных копий
- Хранение в подпапке Backups
- Возможность восстановления
- Проверка целостности копий

## 9. Миграция данных

### 9.1 Из других систем
- Импорт из CSV-файлов
- Импорт из Excel-файлов
- Импорт из других форматов
- Проверка корректности миграции

### 9.2 Форматы импорта
```javascript
// Пример функции импорта из CSV
function importFromCSV(csvData) {
    const parsedData = parseCSV(csvData);
    
    // Преобразование данных в формат системы
    const importedMembers = parsedData.members.map(row => ({
        id: generateId(),
        name: row['ФИО'],
        status: mapStatus(row['Статус']),
        joinDate: formatDate(row['Дата вступления']),
        contact: row['Контакт'],
        address: row['Адрес'],
        notes: row['Примечания'],
        createdAt: new Date().toISOString()
    }));
    
    // Добавление данных в систему
    members = [...members, ...importedMembers];
    
    return {
        importedCount: importedMembers.length,
        errors: []
    };
}
```

## 10. Проверка целостности данных

### 10.1 Структурная проверка
```javascript
// Функция проверки структуры данных
function verifyDataStructure() {
    const issues = [];
    
    // Проверка массивов
    if (!Array.isArray(members)) {
        issues.push('Поле members должно быть массивом');
    }
    
    if (!Array.isArray(payments)) {
        issues.push('Поле payments должно быть массивом');
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
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        issueCount: issues.length
    };
}
```

### 10.2 Проверка связей
```javascript
// Функция проверки целостности связей
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
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        issueCount: issues.length
    };
}
```

## 11. Объем данных

### 11.1 Размер файлов
- **demo_data.json:** ~3 KB (с демонстрационными данными)
- **coop_data.json:** Переменный (зависит от объема данных)
- **Размер данных в памяти:** Зависит от объема записей

### 11.2 Ограничения
- Ограничения браузера на объем localStorage (при резервном механизме)
- Ограничения на размер файлов (практически нет ограничений при File System API)
- Ограничения на количество записей (практически нет ограничений)

## 12. Резервное копирование и восстановление

### 12.1 Создание резервной копии
```javascript
// Функция создания резервной копии данных
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
        
        if (coopDirectoryHandle) {
            // Сохраняем в поддиректорию Backups
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
            // Резервный вариант: через загрузку файла
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

### 12.2 Восстановление из резервной копии
```javascript
// Функция восстановления из резервной копии
async function restoreFromBackup() {
    try {
        if ('showOpenFilePicker' in window) {
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
            
            // Проверяем, что это действительно резервная копия
            if (!data.backupDate) {
                throw new Error('Файл не является резервной копией системы');
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
            alert('Для восстановления из резервной копии используйте функцию загрузки данных');
            return { success: false, error: 'File System API не поддерживается' };
        }
    } catch (err) {
        console.error('Ошибка при восстановлении из резервной копии:', err);
        return { success: false, error: err.message };
    }
}
```

## 13. Автоматическое сохранение документов

### 13.1 Сохранение документов в C:\КООПЕРАНТ
- Автоматическое сохранение при загрузке документов
- Классификация по типам документов
- Создание поддиректорий для разных типов
- Сохранение метаданных в системе

### 13.2 Функция автоматического сохранения документа
```javascript
// Функция автоматического сохранения документа
async function autoSaveDocument(file, metadata) {
    if (!coopDirectoryHandle) {
        console.log('Директория C:\\КООПЕРАНТ не настроена. Требуется ручная настройка.');
        return false;
    }
    
    try {
        // Получаем поддиректорию для документов
        const documentsDir = await coopDirectoryHandle.getDirectoryHandle('Documents', { create: true });
        
        // Создаем безопасное имя файла
        const safeFileName = sanitizeFileName(metadata.fileName);
        const fileHandle = await documentsDir.getFileHandle(safeFileName, { create: true });
        
        // Записываем файл
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        
        // Создаем запись о документе в системе
        const documentRecord = {
            id: generateId(),
            name: metadata.name,
            type: metadata.type,
            description: metadata.description,
            date: metadata.date,
            size: file.size,
            fileName: safeFileName,
            mimeType: file.type,
            filePath: `Documents/${safeFileName}`,
            createdAt: new Date().toISOString()
        };
        
        documents.push(documentRecord);
        
        console.log(`Документ автоматически сохранен: C:\\КООПЕРАНТ\\Documents\\${safeFileName}`);
        return { success: true, documentId: documentRecord.id };
    } catch (err) {
        console.error('Ошибка при автоматическом сохранении документа:', err);
        return { success: false, error: err.message };
    }
}
```

## 14. Заключение

Все созданные файлы данных обеспечивают полную функциональность информационной системы учета пайщиков кооператива. Структура данных унифицирована и позволяет эффективно хранить и обрабатывать информацию о пайщиках, паевых взносах, бухгалтерских проводках, документах, заявлениях и заседаниях.

Система обеспечивает:
- Безопасное локальное хранение данных
- Целостность и согласованность данных
- Резервное копирование и восстановление
- Миграцию данных из других систем
- Проверку корректности данных
- Автоматическое сохранение при каждом изменении
- Интеграцию с файловой системой через File System API
- Соответствие требованиям законодательства

Файловая структура в папке C:\КООПЕРАНТ обеспечивает организованное хранение всех данных системы с возможностью быстрого доступа и управления.