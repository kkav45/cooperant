# Структура данных информационной системы учета пайщиков кооператива

## Общая структура

Данные системы представлены в формате JSON и включают следующие основные коллекции:
- `members` - информация о пайщиках
- `payments` - данные о паевых взносах
- `transactions` - бухгалтерские проводки
- `documents` - документы
- `lastUpdated` - дата последнего обновления

## Структура пайщика (member)

```javascript
{
  "id": "уникальный_идентификатор",
  "name": "ФИО пайщика",
  "status": "статус (candidate|active|suspended|excluded|withdrawn)",
  "joinDate": "дата вступления (YYYY-MM-DD)",
  "contact": "контактная информация",
  "address": "адрес",
  "notes": "примечания",
  "createdAt": "дата создания записи (ISO 8601)",
  "updatedAt": "дата последнего обновления (ISO 8601)", // опционально
}
```

## Структура паевого взноса (payment)

```javascript
{
  "id": "уникальный_идентификатор",
  "memberId": "идентификатор пайщика",
  "type": "тип взноса (entrance|share|voluntary_share|membership|targeted)",
  "amount": "сумма взноса (число)",
  "date": "дата взноса (YYYY-MM-DD)",
  "description": "описание",
  "paid": "оплачено (true|false)",
  "createdAt": "дата создания записи (ISO 8601)",
  "updatedAt": "дата последнего обновления (ISO 8601)", // опционально
}
```

## Структура бухгалтерской проводки (transaction)

```javascript
{
  "id": "уникальный_идентификатор",
  "date": "дата проводки (YYYY-MM-DD)",
  "amount": "сумма проводки (число)",
  "debitAccount": "дебетовый счет (строка)",
  "creditAccount": "кредитовый счет (строка)",
  "description": "описание проводки",
  "createdAt": "дата создания записи (ISO 8601)",
  "updatedAt": "дата последнего обновления (ISO 8601)", // опционально
}
```

## Структура документа (document)

```javascript
{
  "id": "уникальный_идентификатор",
  "name": "название документа",
  "type": "тип документа (contract|report|payment|other)",
  "description": "описание документа",
  "date": "дата документа (YYYY-MM-DD)",
  "size": "размер файла в байтах (число)",
  "fileName": "имя файла",
  "mimeType": "MIME-тип файла",
  "content": "содержимое файла или null", // в текущей реализации
  "createdAt": "дата создания записи (ISO 8601)",
  "updatedAt": "дата последнего обновления (ISO 8601)", // опционально
}
```

## Значения статусов пайщиков

- `candidate` - Кандидат в члены кооператива
- `active` - Активный член кооператива
- `suspended` - Член с приостановленными правами
- `excluded` - Исключен из кооператива
- `withdrawn` - Вышел из кооператива

## Типы паевых взносов

- `entrance` - Вступительный взнос
- `share` - Обязательный паевой взнос
- `voluntary_share` - Добровольный паевой взнос
- `membership` - Членский взнос
- `targeted` - Целевой взнос

## Типы документов

- `contract` - Договор
- `report` - Отчет
- `payment` - Платежный документ
- `other` - Прочее

## Пример использования File System API

При сохранении данных приложение использует File System API браузера:

```javascript
// Запрос у пользователя места для сохранения файла
const fileHandle = await window.showSaveFilePicker({
  suggestedName: 'coop_data.json',
  types: [{
    description: 'JSON Files',
    accept: { 'application/json': ['.json'] }
  }]
});

// Запись данных в файл
const writable = await fileHandle.createWritable();
await writable.write(JSON.stringify(data, null, 2));
await writable.close();
```

При загрузке данных:

```javascript
// Запрос у пользователя файла для загрузки
[fileHandle] = await window.showOpenFilePicker({
  types: [{
    description: 'JSON Files',
    accept: { 'application/json': ['.json'] }
  }],
  excludeAcceptAllOption: true,
  multiple: false
});

// Чтение данных из файла
const file = await fileHandle.getFile();
const contents = await file.text();
const data = JSON.parse(contents);
```

Для браузеров без поддержки File System API реализован резервный вариант с использованием localStorage.