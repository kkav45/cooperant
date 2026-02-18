// ============================================
// YANDEX DISK INTEGRATION v2.0
// ============================================
// Интеграция с Яндекс Диском для хранения данных кооператива
// С поддержкой Telegram Mini App
// Версия: 2.0
// Дата: 18 февраля 2026

// ============================================
// LOGGER
// ============================================
if (typeof Logger === 'undefined') {
    window.Logger = {
        info: function(msg, data) {
            console.log('[Yandex] ' + msg, data || '');
            if (window.TelegramMiniApp) {
                console.log('[TG Theme]', window.TelegramMiniApp.getColorScheme());
            }
        },
        error: function(msg, error) {
            console.error('[Yandex] ' + msg, error || '');
        },
        warn: function(msg, data) {
            console.warn('[Yandex] ' + msg, data || '');
        },
        success: function(msg) {
            console.log('%c[Yandex] ' + msg, 'color: #4caf50; font-weight: bold;');
        }
    };
} else {
    // Logger уже определён (например, в messenger-app-v2.js)
    // Добавляем только недостающие методы
    if (!Logger.success) {
        Logger.success = function(msg) {
            console.log('%c[Yandex] ' + msg, 'color: #4caf50; font-weight: bold;');
        };
    }
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const YANDEX_DISK_CONFIG = {
    // ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ ИЗ YANDEX CONSOLE
    // Получите на https://oauth.yandex.ru/client/new
    CLIENT_ID: '3772de21483443aba93e1889bd7ca4dc',
    CLIENT_SECRET: 'ce41843eb4cf4e5eb8d2e5167ba01b95',
    
    // ВАЖНО: Redirect URI должен ТОЧНО совпадать с указанным в Яндекс Console
    // Для Telegram Mini App укажите полный URL вашего приложения
    // Примеры:
    // - GitHub Pages: 'https://YOUR_USERNAME.github.io/koop/yandex-auth-callback.html'
    // - Vercel: 'https://YOUR_APP.vercel.app/yandex-auth-callback.html'
    // - Локально: 'http://localhost:8080/yandex-auth-callback.html'
    // 
    // ТЕКУЩИЙ URL: https://kkav45.github.io/cooperant/messenger_interface.html
    REDIRECT_URI: 'https://kkav45.github.io/cooperant/yandex-auth-callback.html',
    
    // Альтернативно: использовать текущий URL (может не работать в Telegram)
    // REDIRECT_URI: window.location.href.split('?')[0],
    
    FOLDER_NAME: 'КООПЕРАНТ',
    AUTO_SAVE_INTERVAL: 30000, // 30 секунд
    MAX_BACKUP_COUNT: 10,      // Максимум резервных копий
    COMPRESSION_ENABLED: true  // Сжатие данных
};

// Глобальные переменные
let yandexDiskToken = null;
let cooperativFolderId = null;
let lastSyncTime = null;
let autoSaveTimer = null;
let isSyncing = false;
let syncQueue = [];

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

/**
 * Проверка авторизации
 */
function isAuthorizedYandex() {
    return yandexDiskToken !== null;
}

/**
 * Проверка необходимости авторизации
 */
function needsYandexAuth() {
    const disabled = localStorage.getItem('yandexDiskDisabled') === 'true';
    const token = localStorage.getItem('yandexDiskToken');
    const folderId = localStorage.getItem('yandexCooperativFolderId');
    
    return !disabled && (!token || !folderId);
}

/**
 * Авторизация через Яндекс
 */
async function authorizeYandexDisk() {
    return new Promise((resolve, reject) => {
        try {
            // Проверяем сохранённый токен
            const savedToken = localStorage.getItem('yandexDiskToken');
            if (savedToken) {
                yandexDiskToken = savedToken;
                const folderId = localStorage.getItem('yandexCooperativFolderId');
                if (folderId) {
                    cooperativFolderId = folderId;
                    Logger.success('Авторизация восстановлена');
                    resolve(folderId);
                    return;
                }
            }

            // Проверяем, есть ли токен в URL (после редиректа)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('access_token');

            if (tokenFromUrl) {
                // Очищаем URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // Сохраняем токен
                handleYandexToken(tokenFromUrl);
                resolve(tokenFromUrl);
                return;
            }

            // Проверяем правильность redirect_uri
            const currentUrl = window.location.href.split('?')[0];
            const configRedirect = YANDEX_DISK_CONFIG.REDIRECT_URI;
            
            Logger.info('Текущий URL:', currentUrl);
            Logger.info('Configured Redirect URI:', configRedirect);
            
            if (currentUrl !== configRedirect && !configRedirect.includes('github.io')) {
                Logger.warn('⚠️ Redirect URI может не совпадать с текущим URL!');
                Logger.warn('Убедитесь, что в Яндекс Console указан:', configRedirect);
            }

            // Открываем окно авторизации
            const authUrl = `https://oauth.yandex.ru/authorize?` +
                `response_type=token&` +
                `client_id=${YANDEX_DISK_CONFIG.CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(YANDEX_DISK_CONFIG.REDIRECT_URI)}&` +
                `scope=cloud_api:disk.app_folder`;

            Logger.info('Открытие окна авторизации...');

            // Для Telegram Mini App используем внешний браузер
            if (window.TelegramMiniApp && window.TelegramMiniApp.getTelegram()) {
                const tg = window.TelegramMiniApp.getTelegram();

                // В Telegram открываем ссылку во внешнем браузере
                tg.openLink(authUrl);

                // Показываем инструкцию
                if (typeof window.showToast === 'function') {
                    window.showToast({
                        type: 'info',
                        message: 'Авторизация откроется в браузере. После успеха вернитесь в приложение.',
                        duration: 8000
                    });
                }
                
                // Для Telegram: показываем более подробную инструкцию
                if (typeof window.showYandexDiskAuthHelp === 'function') {
                    window.showYandexDiskAuthHelp(authUrl);
                }

                // Ждём возврата с токеном
                reject(new Error('AUTH_IN_BROWSER'));
                return;
            }

            // Обычный режим (не Telegram)
            const authWindow = window.open(authUrl, '_blank', 'width=600,height=700');

            // Проверяем закрытие окна
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    const token = localStorage.getItem('yandexDiskToken');
                    if (token) {
                        resolve(token);
                    } else {
                        reject(new Error('Авторизация отменена'));
                    }
                }
            }, 1000);

        } catch (error) {
            Logger.error('Ошибка авторизации Яндекс Диска', error);
            reject(error);
        }
    });
}

/**
 * Обработка токена после редиректа
 */
function handleYandexToken(token) {
    if (token) {
        yandexDiskToken = token;
        localStorage.setItem('yandexDiskToken', token);
        Logger.success('Яндекс Диск авторизация успешна');

        // Для Telegram Mini App
        if (window.opener) {
            window.opener.postMessage({ type: 'YANDEX_TOKEN', token: token }, '*');
            window.close();
        }
        
        // Запускаем дальнейшую инициализацию
        setTimeout(() => {
            initYandexDiskAfterAuth();
        }, 500);
    }
}

/**
 * Инициализация после авторизации
 */
async function initYandexDiskAfterAuth() {
    try {
        // Находим или создаём папку
        const folderId = await findOrCreateYandexCooperativFolder();
        
        if (folderId) {
            cooperativFolderId = folderId;
            localStorage.setItem('yandexCooperativFolderId', folderId);
            
            Logger.success('Папка КООПЕРАНТ готова');
            
            // Загружаем данные
            await loadAllDataFromYandex();
            
            // Запускаем автосохранение
            startAutoSaveYandex();
            
            // Показываем уведомление
            if (typeof window.showToast === 'function') {
                window.showToast({
                    type: 'success',
                    message: '☁️ Яндекс Диск подключён!',
                    duration: 3000
                });
            }
            
            // Тактильный отклик для Telegram
            if (window.TelegramMiniApp) {
                window.TelegramMiniApp.hapticFeedback('success');
            }
        }
    } catch (error) {
        Logger.error('Ошибка инициализации после авторизации', error);
    }
}

/**
 * Выход из Яндекс Диска
 */
function logoutYandexDisk() {
    localStorage.removeItem('yandexDiskToken');
    localStorage.removeItem('yandexCooperativFolderId');
    yandexDiskToken = null;
    cooperativFolderId = null;
    stopAutoSaveYandex();
    Logger.info('Выход из Яндекс Диска');
    
    if (typeof window.showToast === 'function') {
        window.showToast({
            type: 'info',
            message: 'Выход из Яндекс Диска выполнен',
            duration: 2000
        });
    }
}

// ============================================
// РАБОТА С ПАПКАМИ
// ============================================

/**
 * Поиск папки КООПЕРАНТ
 */
async function findYandexCooperativFolder() {
    try {
        const response = await fetch('https://cloud-api.yandex.net/v1/disk/resources?path=app:/', {
            headers: {
                'Authorization': 'OAuth ' + yandexDiskToken
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка получения списка файлов');
        }

        const data = await response.json();

        // Ищем папку КООПЕРАНТ
        if (data._embedded && data._embedded.items) {
            const folder = data._embedded.items.find(item =>
                item.name === YANDEX_DISK_CONFIG.FOLDER_NAME && item.type === 'dir'
            );

            if (folder) {
                Logger.info('Папка КООПЕРАНТ найдена', folder);
                return folder.path.replace('app:/', '');
            }
        }

        return null;
    } catch (error) {
        Logger.error('Ошибка поиска папки Яндекс', error);
        return null;
    }
}

/**
 * Создание папки КООПЕРАНТ
 */
async function createYandexCooperativFolder() {
    try {
        const folderPath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}`;

        const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(folderPath)}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'OAuth ' + yandexDiskToken
            }
        });

        if (response.ok) {
            Logger.success('Папка КООПЕРАНТ создана');
            return folderPath;
        }

        return null;
    } catch (error) {
        Logger.error('Ошибка создания папки Яндекс', error);
        return null;
    }
}

/**
 * Поиск или создание папки
 */
async function findOrCreateYandexCooperativFolder() {
    let folderId = await findYandexCooperativFolder();

    if (!folderId) {
        Logger.info('Папка не найдена, создаём...');
        folderId = await createYandexCooperativFolder();
    }

    // Создаём подпапки
    if (folderId) {
        await createYandexSubfolders(folderId);
    }

    return folderId;
}

/**
 * Создание подпапок
 */
async function createYandexSubfolders(parentFolderId) {
    const subfolders = [
        'Data',           // Основные данные
        'Applications',   // Заявления
        'Certificates',   // Удостоверения
        'Protocols',      // Протоколы
        'Documents',      // Документы
        'Backup',         // Резервные копии
        'Reports',        // Отчёты
        'Exports'         // Экспорт данных
    ];

    for (const subfolder of subfolders) {
        try {
            const folderPath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/${subfolder}`;

            await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(folderPath)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'OAuth ' + yandexDiskToken
                }
            });

            Logger.success(`Подпапка ${subfolder} создана`);
        } catch (error) {
            Logger.error(`Ошибка создания подпапки ${subfolder}`, error);
        }
    }
    
    Logger.success('Структура папок создана: КООПЕРАНТ/Data, Applications, Certificates, Protocols, Documents, Backup, Reports, Exports');
}

// ============================================
// РАБОТА С ФАЙЛАМИ
// ============================================

/**
 * Загрузка файла из Яндекс Диска
 */
async function loadFileFromYandex(fileName, subfolder = 'Data') {
    try {
        if (!cooperativFolderId) {
            throw new Error('Папка не выбрана');
        }

        const filePath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/${subfolder}/${fileName}`;

        // Получаем ссылку на скачивание
        const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`, {
            headers: {
                'Authorization': 'OAuth ' + yandexDiskToken
            }
        });

        if (response.status === 404) {
            Logger.info(`Файл ${fileName} не найден`);
            return null;
        }

        if (!response.ok) {
            throw new Error('Ошибка получения ссылки на скачивание');
        }

        const data = await response.json();

        // Скачиваем файл
        const downloadResponse = await fetch(data.href);
        
        // Проверяем, JSON ли это
        const contentType = downloadResponse.headers.get('content-type');
        let jsonData;
        
        if (contentType && contentType.includes('application/json')) {
            jsonData = await downloadResponse.json();
        } else {
            // Пытаемся распарсить как JSON
            const text = await downloadResponse.text();
            try {
                jsonData = JSON.parse(text);
            } catch (e) {
                Logger.warn(`Файл ${fileName} не является JSON`);
                return text;
            }
        }

        Logger.info(`Файл ${fileName} загружен`);
        lastSyncTime = new Date();
        return jsonData;

    } catch (error) {
        Logger.error(`Ошибка загрузки файла ${fileName}`, error);
        return null;
    }
}

/**
 * Сохранение файла в Яндекс Диск
 */
async function saveFileToYandex(fileName, data, subfolder = 'Data') {
    try {
        if (!cooperativFolderId) {
            throw new Error('Папка не выбрана');
        }

        const filePath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/${subfolder}/${fileName}`;
        
        // Сжатие данных (опционально)
        const jsonString = YANDEX_DISK_CONFIG.COMPRESSION_ENABLED 
            ? JSON.stringify(data)
            : JSON.stringify(data, null, 2);
        
        const fileContent = new Blob([jsonString], { type: 'application/json' });

        // Получаем ссылку на загрузку
        const uploadResponse = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`, {
            headers: {
                'Authorization': 'OAuth ' + yandexDiskToken
            }
        });

        if (!uploadResponse.ok) {
            throw new Error('Ошибка получения ссылки на загрузку');
        }

        const uploadData = await uploadResponse.json();

        // Загружаем файл
        const formData = new FormData();
        formData.append('file', fileContent);

        const uploadResult = await fetch(uploadData.href, {
            method: 'POST',
            body: formData
        });

        if (uploadResult.ok) {
            Logger.success(`Файл ${fileName} сохранён`);
            lastSyncTime = new Date();
            return true;
        }

        return false;

    } catch (error) {
        Logger.error(`Ошибка сохранения файла ${fileName}`, error);
        return false;
    }
}

/**
 * Удаление файла с Яндекс Диска
 */
async function deleteFileFromYandex(fileName, subfolder = 'Data') {
    try {
        if (!cooperativFolderId) {
            throw new Error('Папка не выбрана');
        }

        const filePath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/${subfolder}/${fileName}`;

        const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'OAuth ' + yandexDiskToken
            }
        });

        if (response.ok) {
            Logger.success(`Файл ${fileName} удалён`);
            return true;
        }

        return false;

    } catch (error) {
        Logger.error(`Ошибка удаления файла ${fileName}`, error);
        return false;
    }
}

/**
 * Создание резервной копии
 */
async function createBackupYandex() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `backup_${timestamp}.json`;
        
        // Собираем все данные
        const allData = {
            timestamp: timestamp,
            members: JSON.parse(localStorage.getItem('members') || '[]'),
            payments: JSON.parse(localStorage.getItem('payments') || '[]'),
            transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
            documents: JSON.parse(localStorage.getItem('documents') || '[]'),
            applications: JSON.parse(localStorage.getItem('applications') || '[]'),
            meetings: JSON.parse(localStorage.getItem('meetings') || '[]'),
            certificates: JSON.parse(localStorage.getItem('certificates') || '[]'),
            settings: JSON.parse(localStorage.getItem('coopSettings') || '{}')
        };
        
        // Сохраняем в Backup
        await saveFileToYandex(backupFileName, allData, 'Backup');
        
        // Удаляем старые резервные копии
        await cleanupOldBackups();
        
        Logger.success(`Резервная копия создана: ${backupFileName}`);
        
        if (typeof window.showToast === 'function') {
            window.showToast({
                type: 'success',
                message: `Резервная копия создана`,
                duration: 2000
            });
        }
        
        // Тактильный отклик
        if (window.TelegramMiniApp) {
            window.TelegramMiniApp.hapticFeedback('success');
        }
        
        return true;
        
    } catch (error) {
        Logger.error('Ошибка создания резервной копии', error);
        return false;
    }
}

/**
 * Очистка старых резервных копий
 */
async function cleanupOldBackups() {
    try {
        // Получаем список файлов в папке Backup
        const backupPath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/Backup`;
        
        const response = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(backupPath)}`, {
            headers: {
                'Authorization': 'OAuth ' + yandexDiskToken
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data._embedded && data._embedded.items) {
            const backups = data._embedded.items
                .filter(item => item.name.startsWith('backup_') && item.type === 'file')
                .sort((a, b) => new Date(b.created) - new Date(a.created));
            
            // Удаляем старые, если их больше MAX_BACKUP_COUNT
            if (backups.length > YANDEX_DISK_CONFIG.MAX_BACKUP_COUNT) {
                for (let i = YANDEX_DISK_CONFIG.MAX_BACKUP_COUNT; i < backups.length; i++) {
                    await deleteFileFromYandex(backups[i].name, 'Backup');
                }
                Logger.info(`Удалено ${backups.length - YANDEX_DISK_CONFIG.MAX_BACKUP_COUNT} старых резервных копий`);
            }
        }
        
    } catch (error) {
        Logger.error('Ошибка очистки резервных копий', error);
    }
}

// ============================================
// СИНХРОНИЗАЦИЯ ДАННЫХ
// ============================================

/**
 * Загрузка всех данных из Яндекс Диска
 */
async function loadAllDataFromYandex() {
    if (isSyncing) {
        Logger.warn('Синхронизация уже выполняется');
        return false;
    }
    
    try {
        isSyncing = true;
        Logger.info('Загрузка данных из Яндекс Диска...');

        const files = [
            { name: 'coop_members.json', key: 'members' },
            { name: 'coop_payments.json', key: 'payments' },
            { name: 'coop_transactions.json', key: 'transactions' },
            { name: 'coop_documents.json', key: 'documents' },
            { name: 'coop_applications.json', key: 'applications' },
            { name: 'coop_meetings.json', key: 'meetings' },
            { name: 'coop_certificates.json', key: 'certificates' },
            { name: 'coop_settings.json', key: 'coopSettings' }
        ];

        let loadedCount = 0;

        for (const file of files) {
            try {
                const data = await loadFileFromYandex(file.name);
                if (data !== null) {
                    localStorage.setItem(file.key, JSON.stringify(data));
                    Logger.info(`Данные ${file.key} загружены`);
                    loadedCount++;
                }
            } catch (e) {
                Logger.warn(`Не удалось загрузить ${file.name}`, e);
            }
        }

        Logger.success(`Загружено ${loadedCount} из ${files.length} файлов`);
        lastSyncTime = new Date();
        isSyncing = false;
        
        // Обновляем UI
        if (typeof window.updateYandexStatus === 'function') {
            window.updateYandexStatus();
        }
        
        return true;

    } catch (error) {
        Logger.error('Ошибка загрузки данных', error);
        isSyncing = false;
        return false;
    }
}

/**
 * Сохранение всех данных в Яндекс Диск
 */
async function saveAllDataToYandex() {
    if (isSyncing) {
        Logger.warn('Синхронизация уже выполняется');
        return false;
    }
    
    try {
        isSyncing = true;
        Logger.info('Сохранение данных в Яндекс Диск...');

        const files = [
            { name: 'coop_members.json', key: 'members' },
            { name: 'coop_payments.json', key: 'payments' },
            { name: 'coop_transactions.json', key: 'transactions' },
            { name: 'coop_documents.json', key: 'documents' },
            { name: 'coop_applications.json', key: 'applications' },
            { name: 'coop_meetings.json', key: 'meetings' },
            { name: 'coop_certificates.json', key: 'certificates' },
            { name: 'coop_settings.json', key: 'coopSettings' }
        ];

        let savedCount = 0;

        for (const file of files) {
            try {
                const data = JSON.parse(localStorage.getItem(file.key) || '[]');
                if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
                    const result = await saveFileToYandex(file.name, data);
                    if (result) {
                        savedCount++;
                    }
                }
            } catch (e) {
                Logger.warn(`Не удалось сохранить ${file.name}`, e);
            }
        }

        Logger.success(`Сохранено ${savedCount} из ${files.length} файлов`);
        lastSyncTime = new Date();
        isSyncing = false;
        
        // Обновляем UI
        if (typeof window.updateYandexStatus === 'function') {
            window.updateYandexStatus();
        }
        
        return true;

    } catch (error) {
        Logger.error('Ошибка сохранения данных', error);
        isSyncing = false;
        return false;
    }
}

/**
 * Синхронизация одного файла
 */
async function syncFileToYandex(key, fileName, subfolder = 'Data') {
    try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const result = await saveFileToYandex(fileName, data, subfolder);
        
        if (result) {
            Logger.success(`Файл ${fileName} синхронизирован`);
            lastSyncTime = new Date();
        }
        
        return result;
    } catch (error) {
        Logger.error(`Ошибка синхронизации ${fileName}`, error);
        return false;
    }
}

// ============================================
// АВТОСОХРАНЕНИЕ
// ============================================

/**
 * Запуск автосохранения
 */
function startAutoSaveYandex() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }

    autoSaveTimer = setInterval(async () => {
        if (!isSyncing && cooperativFolderId && yandexDiskToken) {
            Logger.info('🔄 Автосохранение в Яндекс Диск...');
            
            try {
                const result = await saveAllDataToYandex();
                
                if (result) {
                    Logger.success('✅ Автосохранение выполнено успешно');
                    
                    // Показываем уведомление (если функция доступна)
                    if (typeof window.showToast === 'function') {
                        window.showToast({
                            type: 'success',
                            message: `Данные сохранены в ${new Date().toLocaleTimeString()}`,
                            duration: 2000
                        });
                    }
                } else {
                    Logger.warn('⚠️ Автосохранение выполнено с ошибками');
                }
            } catch (error) {
                Logger.error('❌ Ошибка автосохранения:', error);
            }
        }
    }, YANDEX_DISK_CONFIG.AUTO_SAVE_INTERVAL);

    Logger.success(`⏰ Автосохранение запущено (интервал: ${YANDEX_DISK_CONFIG.AUTO_SAVE_INTERVAL / 1000} сек)`);
}

/**
 * Остановка автосохранения
 */
function stopAutoSaveYandex() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
        Logger.info('Автосохранение остановлено');
    }
}

/**
 * Принудительная синхронизация
 */
async function forceSyncYandex() {
    if (isSyncing) {
        Logger.warn('Синхронизация уже выполняется');
        return false;
    }
    
    Logger.info('Принудительная синхронизация...');
    
    // Тактильный отклик
    if (window.TelegramMiniApp) {
        window.TelegramMiniApp.hapticFeedback('medium');
    }
    
    const result = await saveAllDataToYandex();
    
    if (result) {
        if (typeof window.showToast === 'function') {
            window.showToast({
                type: 'success',
                message: `Данные синхронизированы ${new Date().toLocaleTimeString()}`,
                duration: 2000
            });
        }
    }
    
    return result;
}

// ============================================
// UI ФУНКЦИИ
// ============================================

/**
 * Показ окна авторизации Яндекс (Telegram-стиль)
 */
function showYandexAuthModal() {
    const isDark = window.TelegramMiniApp && window.TelegramMiniApp.isDarkTheme();
    
    const content = `
        <div style="padding:40px;text-align:center;max-width:500px;margin:0 auto">
            <div style="font-size:64px;margin-bottom:20px">☁️</div>
            <h2 style="margin-bottom:10px;font-size:22px;font-weight:600">Яндекс Диск</h2>
            <p style="color:${isDark ? '#999' : '#666'};margin-bottom:30px;line-height:1.5">
                Для надёжного хранения данных кооператива подключитесь к Яндекс Диску.
                Данные будут автоматически сохраняться в папку "КООПЕРАНТ".
            </p>
            <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px">
                <button onclick="connectYandexDisk()"
                        style="min-height:44px;padding:12px 24px;background:#fc0;color:#000;border:none;border-radius:12px;cursor:pointer;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity 0.2s">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#000"/>
                    </svg>
                    Войти через Яндекс
                </button>
                <button onclick="useLocalStorage()"
                        style="min-height:44px;padding:12px 24px;background:${isDark ? '#2a2a2a' : '#f5f7fa'};color:${isDark ? '#fff' : '#333'};border:none;border-radius:12px;cursor:pointer;font-size:15px;transition:opacity 0.2s">
                    Работать без Яндекс Диска
                </button>
            </div>
            <div style="display:flex;justify-content:center;gap:20px;margin-top:20px;font-size:12px;color:${isDark ? '#666' : '#999'}">
                <span>🔒 Безопасно</span>
                <span>📦 Надёжно</span>
                <span>⚡ Автоматически</span>
            </div>
        </div>
    `;

    if (typeof window.showModal === 'function') {
        window.showModal(content);
    } else {
        // Fallback
        alert('Яндекс Диск: необходимо подключиться для синхронизации данных');
    }
}

/**
 * Подключение к Яндекс Диску
 */
async function connectYandexDisk() {
    try {
        if (typeof window.showToast === 'function') {
            window.showToast({ 
                type: 'info', 
                message: 'Подключение к Яндекс Диску...', 
                duration: 5000 
            });
        }

        await authorizeYandexDisk();
        
    } catch (error) {
        if (error.message !== 'AUTH_IN_BROWSER') {
            Logger.error('Ошибка подключения', error);

            if (typeof window.showToast === 'function') {
                window.showToast({ 
                    type: 'error', 
                    message: 'Ошибка подключения к Яндекс Диску', 
                    duration: 5000 
                });
            }
            
            // Тактильный отклик об ошибке
            if (window.TelegramMiniApp) {
                window.TelegramMiniApp.hapticFeedback('error');
            }
        }
    }
}

/**
 * Работа без Яндекс Диска (localStorage)
 */
function useLocalStorage() {
    localStorage.setItem('yandexDiskDisabled', 'true');
    
    if (typeof window.closeModal === 'function') {
        window.closeModal();
    }
    
    Logger.info('Работа без Яндекс Диска');

    if (typeof window.showToast === 'function') {
        window.showToast({ 
            type: 'info', 
            message: 'Данные сохраняются локально в браузере', 
            duration: 3000 
        });
    }
}

/**
 * Статус синхронизации (для UI)
 */
function getYandexSyncStatus() {
    return {
        authorized: isAuthorizedYandex(),
        folderId: cooperativFolderId,
        lastSync: lastSyncTime,
        isSyncing: isSyncing
    };
}

/**
 * Обновление статуса в UI
 */
function updateYandexStatusUI() {
    const statusEl = document.getElementById('yandexStatus');
    if (!statusEl) return;
    
    const status = getYandexSyncStatus();
    
    if (!status.authorized) {
        statusEl.innerHTML = '<span style="color:#f44336">●</span> Не подключён';
    } else if (status.isSyncing) {
        statusEl.innerHTML = '<span style="color:#ff9800">●</span> Синхронизация...';
    } else if (status.lastSync) {
        const timeStr = status.lastSync.toLocaleTimeString();
        statusEl.innerHTML = `<span style="color:#4caf50">●</span> Синхронизировано в ${timeStr}`;
    } else {
        statusEl.innerHTML = '<span style="color:#4caf50">●</span> Подключён';
    }
}

// ============================================
// ИНТЕГРАЦИЯ С TELEGRAM MINI APP
// ============================================

/**
 * Проверка валидности initData Telegram
 * ВАЖНО: Полная валидация должна быть на бэкенде!
 */
function validateTelegramInitData(initData) {
    if (!initData) {
        Logger.warn('initData не предоставлен');
        return false;
    }
    
    try {
        const urlParams = new URLSearchParams(initData);
        const authDate = new Date(parseInt(urlParams.get('auth_date')) * 1000);
        const now = new Date();
        
        // Проверяем, не старше 24 часов
        const hoursDiff = (now - authDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            Logger.warn('initData старше 24 часов');
            return false;
        }
        
        // Проверяем наличие hash
        if (!urlParams.get('hash')) {
            Logger.warn('hash отсутствует в initData');
            return false;
        }
        
        Logger.success('initData валиден');
        return true;
        
    } catch (error) {
        Logger.error('Ошибка валидации initData', error);
        return false;
    }
}

/**
 * Получение данных пользователя из Telegram для именования файлов
 */
function getTelegramUserInfo() {
    if (!window.TelegramMiniApp) {
        return null;
    }
    
    const userData = window.TelegramMiniApp.getUserData();
    if (!userData) {
        return null;
    }
    
    return {
        id: userData.id,
        username: userData.username || userData.firstName,
        displayName: `${userData.firstName} ${userData.lastName || ''}`.trim()
    };
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ИНТЕГРАЦИИ
// ============================================

async function initYandexDiskIntegration() {
    try {
        // Проверяем, отключён ли Яндекс Диск
        const disabled = localStorage.getItem('yandexDiskDisabled') === 'true';
        if (disabled) {
            Logger.info('Яндекс Диск отключён пользователем');
            return;
        }

        // Проверяем токен в URL (после редиректа авторизации)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('access_token');
        
        if (tokenFromUrl) {
            Logger.info('Обнаружен токен в URL');
            window.history.replaceState({}, document.title, window.location.pathname);
            handleYandexToken(tokenFromUrl);
            return;
        }

        // Проверяем авторизацию
        const folderId = localStorage.getItem('yandexCooperativFolderId');
        const token = localStorage.getItem('yandexDiskToken');

        if (folderId && token) {
            Logger.info('Яндекс Диск авторизован, загружаем данные...');
            yandexDiskToken = token;
            cooperativFolderId = folderId;

            // Загружаем данные
            await loadAllDataFromYandex();

            // Запускаем автосохранение
            startAutoSaveYandex();

            Logger.success('Яндекс Диск готов к работе');
            return;
        }

        // Показываем окно авторизации
        Logger.info('Требуется авторизация Яндекс Диска');
        setTimeout(() => {
            showYandexAuthModal();
        }, 1000);

    } catch (error) {
        Logger.error('Ошибка инициализации Яндекс Диска', error);
        setTimeout(() => {
            showYandexAuthModal();
        }, 1000);
    }
}

// ============================================
// CRUD ОПЕРАЦИИ (CREATE, READ, UPDATE, DELETE)
// ============================================

/**
 * Получить все данные из файла
 * @param {string} dataType - тип данных (members, payments, etc.)
 * @returns {Promise<Array>}
 */
async function getData(dataType) {
    try {
        const fileName = `coop_${dataType}.json`;
        const data = await loadFileFromYandex(fileName, 'Data');
        return data || [];
    } catch (error) {
        Logger.error(`Ошибка получения ${dataType}`, error);
        return [];
    }
}

/**
 * Сохранить все данные в файл
 * @param {string} dataType - тип данных
 * @param {Array} data - данные для сохранения
 * @returns {Promise<boolean>}
 */
async function saveData(dataType, data) {
    try {
        const fileName = `coop_${dataType}.json`;
        const result = await saveFileToYandex(fileName, data, 'Data');
        
        if (result) {
            Logger.success(`${dataType} сохранены`);
            
            // Обновляем localStorage
            localStorage.setItem(`coop_${dataType}`, JSON.stringify(data));
        }
        
        return result;
    } catch (error) {
        Logger.error(`Ошибка сохранения ${dataType}`, error);
        return false;
    }
}

/**
 * Добавить запись
 * @param {string} dataType - тип данных
 * @param {Object} item - запись для добавления
 * @returns {Promise<Object|null>}
 */
async function createItem(dataType, item) {
    try {
        const data = await getData(dataType);
        
        // Генерируем ID
        const maxId = data.length > 0 ? Math.max(...data.map(i => i.id)) : 0;
        item.id = maxId + 1;
        item.createdAt = new Date().toISOString();
        
        data.push(item);
        
        const saved = await saveData(dataType, data);
        
        if (saved) {
            Logger.success(`Запись #${item.id} добавлена в ${dataType}`);
            return item;
        }
        
        return null;
    } catch (error) {
        Logger.error(`Ошибка создания записи в ${dataType}`, error);
        return null;
    }
}

/**
 * Обновить запись
 * @param {string} dataType - тип данных
 * @param {number} id - ID записи
 * @param {Object} updates - обновляемые поля
 * @returns {Promise<Object|null>}
 */
async function updateItem(dataType, id, updates) {
    try {
        const data = await getData(dataType);
        const index = data.findIndex(i => i.id === id);
        
        if (index === -1) {
            Logger.warn(`Запись #${id} не найдена в ${dataType}`);
            return null;
        }
        
        // Обновляем запись
        data[index] = { 
            ...data[index], 
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        const saved = await saveData(dataType, data);
        
        if (saved) {
            Logger.success(`Запись #${id} обновлена в ${dataType}`);
            return data[index];
        }
        
        return null;
    } catch (error) {
        Logger.error(`Ошибка обновления записи #${id} в ${dataType}`, error);
        return null;
    }
}

/**
 * Удалить запись
 * @param {string} dataType - тип данных
 * @param {number} id - ID записи
 * @returns {Promise<boolean>}
 */
async function deleteItem(dataType, id) {
    try {
        const data = await getData(dataType);
        const filtered = data.filter(i => i.id !== id);
        
        if (filtered.length === data.length) {
            Logger.warn(`Запись #${id} не найдена в ${dataType}`);
            return false;
        }
        
        const saved = await saveData(dataType, filtered);
        
        if (saved) {
            Logger.success(`Запись #${id} удалена из ${dataType}`);
            return true;
        }
        
        return false;
    } catch (error) {
        Logger.error(`Ошибка удаления записи #${id} из ${dataType}`, error);
        return false;
    }
}

/**
 * Найти запись по ID
 * @param {string} dataType - тип данных
 * @param {number} id - ID записи
 * @returns {Promise<Object|null>}
 */
async function findItemById(dataType, id) {
    try {
        const data = await getData(dataType);
        return data.find(i => i.id === id) || null;
    } catch (error) {
        Logger.error(`Ошибка поиска записи #${id} в ${dataType}`, error);
        return null;
    }
}

/**
 * Найти записи по фильтру
 * @param {string} dataType - тип данных
 * @param {Function} filterFn - функция фильтрации
 * @returns {Promise<Array>}
 */
async function findItems(dataType, filterFn) {
    try {
        const data = await getData(dataType);
        return data.filter(filterFn);
    } catch (error) {
        Logger.error(`Ошибка поиска в ${dataType}`, error);
        return [];
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

// Основные функции
window.connectYandexDisk = connectYandexDisk;
window.useLocalStorage = useLocalStorage;
window.logoutYandexDisk = logoutYandexDisk;
window.saveAllDataToYandex = saveAllDataToYandex;
window.loadAllDataFromYandex = loadAllDataFromYandex;
window.handleYandexToken = handleYandexToken;
window.initYandexDiskIntegration = initYandexDiskIntegration;

// Синхронизация
window.forceSyncYandex = forceSyncYandex;
window.startAutoSaveYandex = startAutoSaveYandex;
window.stopAutoSaveYandex = stopAutoSaveYandex;
window.createBackupYandex = createBackupYandex;
window.syncFileToYandex = syncFileToYandex;

// CRUD операции
window.getData = getData;
window.saveData = saveData;
window.createItem = createItem;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.findItemById = findItemById;
window.findItems = findItems;

// Утилиты
window.getYandexSyncStatus = getYandexSyncStatus;
window.updateYandexStatusUI = updateYandexStatusUI;
window.validateTelegramInitData = validateTelegramInitData;
window.getTelegramUserInfo = getTelegramUserInfo;
window.getYandexSyncStatus = getYandexSyncStatus;
window.updateYandexStatusUI = updateYandexStatusUI;
window.validateTelegramInitData = validateTelegramInitData;
window.getTelegramUserInfo = getTelegramUserInfo;

// Авто-инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYandexDiskIntegration);
} else {
    initYandexDiskIntegration();
}

Logger.success('Yandex Disk Integration v2.0 загружен');
