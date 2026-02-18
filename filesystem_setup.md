# Настройка File System API для хранения документов в папке C:\\КООПЕРАНТ

## 1. Подготовка папки для хранения

### 1.1 Создание папки
1. Убедитесь, что на вашем компьютере создана папка `C:\\КООПЕРАНТ`
2. Если папка не существует, создайте её вручную:
   - Нажмите Win+R
   - Введите `cmd` и нажмите Enter
   - Введите команду: `mkdir C:\\КООПЕРАНТ`

### 1.2 Проверка прав доступа
1. Убедитесь, что у вашего пользователя есть права на чтение и запись в папку `C:\\КОПЕРАНТ`
2. Проверьте, что антивирус не блокирует доступ к этой папке

## 2. Модификация системы для использования File System API

### 2.1 Обновление app.js для поддержки File System API

Добавим в нашу систему возможность сохранения документов в указанную папку:

```javascript
// Добавляем переменную для хранения выбранной директории
let coopDirectoryHandle = null;

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
    const subdirs = ['contracts', 'reports', 'payments', 'other'];
    
    for (const subdir of subdirs) {
        try {
            await directoryHandle.getDirectoryHandle(subdir, { create: true });
        } catch (err) {
            console.error(`Ошибка при создании поддиректории ${subdir}:`, err);
        }
    }
}

// Модифицированная функция загрузки документа
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
        console.error('Ошибка при сохранении документа:', err);
        alert('Ошибка при сохранении документа: ' + err.message);
    }
}

// Модифицированная функция просмотра документа
async function viewDocument(id) {
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
    
    showModal(`
        <h3>Просмотр документа: ${doc.name}</h3>
        <div>
            <p><strong>Тип:</strong> ${doc.type}</p>
            <p><strong>Дата:</strong> ${doc.date}</p>
            <p><strong>Размер:</strong> ${formatFileSize(doc.size)}</p>
            <p><strong>Описание:</strong> ${doc.description || 'Не указано'}</p>
            <p><strong>Файл:</strong> ${doc.fileName}</p>
            <div style="margin-top: 1rem; text-align: center;">
                ${fileActions}
                <button type="button" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `);
}

// Функция для открытия файла документа
async function openDocumentFile(filePath, docType) {
    try {
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

// Функция для настройки хранения документов
async function setupDocumentStorage() {
    await selectCooperativeDirectory();
    closeModal();
}

// Модифицированная функция скачивания документа
async function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    try {
        if (coopDirectoryHandle) {
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
        } else {
            alert('Пожалуйста, сначала настройте хранение документов');
        }
    } catch (err) {
        console.error('Ошибка при скачивании файла:', err);
        alert('Не удалось скачать файл: ' + err.message);
    }
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
        alert('Документ удален из системы, но произошла ошибка при удалении физического файла: ' + err.message);
    }
}
```

### 2.2 Обновление интерфейса для настройки хранения

Добавим кнопку для настройки хранения документов в интерфейс:

```html
<!-- Добавляем в раздел документов кнопку настройки -->
<div id="documents" class="section">
    <h2>Документооборот</h2>
    <div class="toolbar">
        <button onclick="setupDocumentStorage()">Настроить хранение</button>
        <button onclick="uploadDocument()">Загрузить документ</button>
    </div>
    <table id="documents-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Тип</th>
                <th>Дата</th>
                <th>Размер</th>
                <th>Действия</th>
            </tr>
        </thead>
        <tbody id="documents-tbody">
            <!-- Данные будут загружаться сюда -->
        </tbody>
    </table>
</div>
```

## 3. Инструкция для пользователя

### 3.1 Первый запуск
1. Откройте систему в поддерживаемом браузере (Chrome 86+, Edge 86+, Opera 72+)
2. Перейдите в раздел "Документы"
3. Нажмите кнопку "Настроить хранение"
4. В появившемся окне выберите папку `C:\\КООПЕРАНТ`
5. Подтвердите доступ к папке

### 3.2 Загрузка документов
1. Нажмите "Загрузить документ"
2. Выберите файл для загрузки
3. Укажите название и тип документа
4. Нажмите "Загрузить"
5. Документ будет сохранен в соответствующей подпапке внутри `C:\\КООПЕРАНТ`

### 3.3 Просмотр и открытие документов
1. Найдите документ в списке
2. Нажмите "Просмотр"
3. Используйте кнопку "Открыть файл" для открытия документа во внешней программе

## 4. Структура папок

После настройки система создаст следующую структуру в папке `C:\\КООПЕРАНТ`:

```
C:\КООПЕРАНТ\
├── contracts\     # Договоры
├── reports\       # Отчеты
├── payments\      # Платежные документы
└── other\         # Прочие документы
```

## 5. Важные замечания

- File System API работает только в защищенном контексте (HTTPS или localhost)
- Пользователь должен явно разрешить доступ к файловой системе
- Система хранит только метаданные документов, сами файлы хранятся в указанной папке
- Для работы с локальным файлом HTML необходимо использовать современный браузер с поддержкой File System API