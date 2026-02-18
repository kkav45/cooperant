// ============================================
// YANDEX DISK INTEGRATION
// ============================================
// Интеграция с Яндекс Диском для хранения данных кооператива
// Версия: 1.0
// Дата: 17 февраля 2026

// ============================================
// LOGGER (если не определён)
// ============================================
if (typeof Logger === 'undefined') {
    window.Logger = {
        info: function(msg, data) { console.log('[Yandex] ' + msg, data || ''); },
        error: function(msg, error) { console.error('[Yandex] ' + msg, error || ''); },
        warn: function(msg, data) { console.warn('[Yandex] ' + msg, data || ''); }
    };
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const YANDEX_DISK_CONFIG = {
    // ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ ИЗ YANDEX CONSOLE
    CLIENT_ID: 'YOUR_CLIENT_ID',
    CLIENT_SECRET: 'YOUR_CLIENT_SECRET',
    REDIRECT_URI: 'https://YOUR_USERNAME.github.io/KOOP/',
    FOLDER_NAME: 'КООПЕРАНТ',
    AUTO_SAVE_INTERVAL: 30000 // 30 секунд
};

// Глобальные переменные
let yandexDiskToken = null;
let cooperativFolderId = null;
let lastSyncTime = null;
let autoSaveTimer = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// Проверка авторизации
function isAuthorizedYandex() {
    return yandexDiskToken !== null;
}

// Авторизация через Яндекс
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
                    resolve(folderId);
                    return;
                }
            }
            
            // Открываем окно авторизации
            const authUrl = `https://oauth.yandex.ru/authorize?` +
                `response_type=token&` +
                `client_id=${YANDEX_DISK_CONFIG.CLIENT_ID}&` +
                `redirect_uri=${YANDEX_DISK_CONFIG.REDIRECT_URI}&` +
                `scope=cloud_api:disk.app_folder`;
            
            // Сохраняем состояние для обработки после редиректа
            sessionStorage.setItem('yandexAuthPending', 'true');
            
            // Открываем окно авторизации
            const authWindow = window.open(authUrl, '_blank', 'width=600,height=700');
            
            // Проверяем закрытие окна
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    // Проверяем, был ли получен токен
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

// Обработка токена после редиректа (вызывается из index.html)
function handleYandexToken(token) {
    if (token) {
        yandexDiskToken = token;
        localStorage.setItem('yandexDiskToken', token);
        Logger.info('Яндекс Диск авторизация успешна');
        
        // Закрываем окно и продолжаем
        if (window.opener) {
            window.opener.postMessage({ type: 'YANDEX_TOKEN', token: token }, '*');
            window.close();
        }
    }
}

// Выход из Яндекс Диска
function logoutYandexDisk() {
    localStorage.removeItem('yandexDiskToken');
    localStorage.removeItem('yandexCooperativFolderId');
    yandexDiskToken = null;
    cooperativFolderId = null;
    stopAutoSaveYandex();
    Logger.info('Выход из Яндекс Диска');
}

// ============================================
// РАБОТА С ПАПКАМИ
// ============================================

// Поиск папки КООПЕРАНТ
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

// Создание папки КООПЕРАНТ
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
            Logger.info('Папка КООПЕРАНТ создана');
            return folderPath;
        }
        
        return null;
    } catch (error) {
        Logger.error('Ошибка создания папки Яндекс', error);
        return null;
    }
}

// Поиск или создание папки
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

// Создание подпапок
async function createYandexSubfolders(parentFolderId) {
    const subfolders = ['Data', 'Applications', 'Certificates', 'Protocols', 'Documents', 'Backup'];
    
    for (const subfolder of subfolders) {
        try {
            const folderPath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/${subfolder}`;
            
            await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(folderPath)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'OAuth ' + yandexDiskToken
                }
            });
            
            Logger.info(`Подпапка ${subfolder} создана`);
        } catch (error) {
            Logger.error(`Ошибка создания подпапки ${subfolder}`, error);
        }
    }
}

// ============================================
// РАБОТА С ФАЙЛАМИ
// ============================================

// Загрузка файла из Яндекс Диска
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
        const jsonData = await downloadResponse.json();
        
        Logger.info(`Файл ${fileName} загружен`);
        lastSyncTime = new Date();
        return jsonData;
        
    } catch (error) {
        Logger.error(`Ошибка загрузки файла ${fileName}`, error);
        return null;
    }
}

// Сохранение файла в Яндекс Диск
async function saveFileToYandex(fileName, data, subfolder = 'Data') {
    try {
        if (!cooperativFolderId) {
            throw new Error('Папка не выбрана');
        }
        
        const filePath = `app:/${YANDEX_DISK_CONFIG.FOLDER_NAME}/${subfolder}/${fileName}`;
        const fileContent = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
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
            Logger.info(`Файл ${fileName} сохранён`);
            lastSyncTime = new Date();
            return true;
        }
        
        return false;
        
    } catch (error) {
        Logger.error(`Ошибка сохранения файла ${fileName}`, error);
        return false;
    }
}

// ============================================
// СИНХРОНИЗАЦИЯ ДАННЫХ
// ============================================

// Загрузка всех данных из Яндекс Диска
async function loadAllDataFromYandex() {
    try {
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
        
        for (const file of files) {
            const data = await loadFileFromYandex(file.name);
            if (data) {
                localStorage.setItem(file.key, JSON.stringify(data));
                Logger.info(`Данные ${file.key} загружены`);
            }
        }
        
        Logger.info('Все данные загружены из Яндекс Диска');
        return true;
        
    } catch (error) {
        Logger.error('Ошибка загрузки данных', error);
        return false;
    }
}

// Сохранение всех данных в Яндекс Диск
async function saveAllDataToYandex() {
    try {
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
        
        for (const file of files) {
            const data = JSON.parse(localStorage.getItem(file.key) || '[]');
            if (data && data.length > 0) {
                await saveFileToYandex(file.name, data);
            }
        }
        
        Logger.info('Все данные сохранены в Яндекс Диск');
        return true;
        
    } catch (error) {
        Logger.error('Ошибка сохранения данных', error);
        return false;
    }
}

// ============================================
// АВТОСОХРАНЕНИЕ
// ============================================

// Запуск автосохранения
function startAutoSaveYandex() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    
    autoSaveTimer = setInterval(async () => {
        Logger.info('Автосохранение в Яндекс Диск...');
        await saveAllDataToYandex();
        
        // Показываем уведомление
        if (typeof showToast === 'function') {
            showToast({
                type: 'success',
                message: `Данные сохранены в Яндекс Диск (${new Date().toLocaleTimeString()})`,
                duration: 2000
            });
        }
    }, YANDEX_DISK_CONFIG.AUTO_SAVE_INTERVAL);
    
    Logger.info('Автосохранение запущено (интервал: 30 сек)');
}

// Остановка автосохранения
function stopAutoSaveYandex() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
        Logger.info('Автосохранение остановлено');
    }
}

// ============================================
// UI ФУНКЦИИ
// ============================================

// Показ окна авторизации Яндекс
function showYandexAuthModal() {
    const content = `
        <div style="padding:40px;text-align:center;max-width:500px;margin:0 auto">
            <div style="font-size:64px;margin-bottom:20px">☁️</div>
            <h2 style="margin-bottom:10px">Яндекс Диск</h2>
            <p style="color:#666;margin-bottom:30px">
                Для хранения данных кооператива необходимо подключиться к Яндекс Диску.
                Данные будут автоматически сохраняться в папку "КООПЕРАНТ".
            </p>
            <div style="display:flex;flex-direction:column;gap:10px">
                <button onclick="connectYandexDisk()" 
                        style="padding:15px 30px;background:#fc0;color:#000;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#000" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Войти через Яндекс
                </button>
                <button onclick="useLocalStorage()" 
                        style="padding:15px 30px;background:#f5f7fa;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:16px">
                    Работать без Яндекс Диска
                </button>
            </div>
            <p style="font-size:12px;color:#999;margin-top:20px">
                🔒 Ваши данные защищены и используются только для работы приложения
            </p>
        </div>
    `;
    
    showModal(content);
}

// Подключение к Яндекс Диску
async function connectYandexDisk() {
    try {
        // Показываем уведомление
        if (typeof showToast === 'function') {
            showToast({ type: 'info', message: 'Подключение к Яндекс Диску...', duration: 5000 });
        }
        
        const folderId = await authorizeYandexDisk();
        
        if (folderId) {
            // Показываем уведомление
            if (typeof showToast === 'function') {
                showToast({ type: 'success', message: 'Яндекс Диск подключён!', duration: 3000 });
            }
            
            // Загружаем данные
            await loadAllDataFromYandex();
            
            // Запускаем автосохранение
            startAutoSaveYandex();
            
            // Закрываем модальное окно
            if (typeof closeModal === 'function') {
                closeModal();
            }
            
            Logger.info('Яндекс Диск готов к работе');
        }
    } catch (error) {
        Logger.error('Ошибка подключения', error);
        
        // Показываем уведомление
        if (typeof showToast === 'function') {
            showToast({ type: 'error', message: 'Ошибка подключения к Яндекс Диску', duration: 5000 });
        }
    }
}

// Работа без Яндекс Диска (localStorage)
function useLocalStorage() {
    localStorage.setItem('yandexDiskDisabled', 'true');
    if (typeof closeModal === 'function') {
        closeModal();
    }
    Logger.info('Работа без Яндекс Диска');

    // Показываем уведомление (если функция доступна)
    if (typeof showToast === 'function') {
        showToast({ type: 'info', message: 'Данные сохраняются локально в браузере', duration: 3000 });
    } else if (typeof window.showToast === 'function') {
        window.showToast({ type: 'info', message: 'Данные сохраняются локально в браузере', duration: 3000 });
    } else {
        console.log('ℹ️ Данные сохраняются локально в браузере');
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.useLocalStorage = useLocalStorage;
window.connectYandexDisk = connectYandexDisk;
window.logoutYandexDisk = logoutYandexDisk;
window.saveAllDataToYandex = saveAllDataToYandex;
window.loadAllDataFromYandex = loadAllDataFromYandex;
window.handleYandexToken = handleYandexToken;
window.initYandexDiskIntegration = initYandexDiskIntegration;

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
        
        // Проверяем, авторизованы ли
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
            
            Logger.info('Яндекс Диск готов к работе');
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
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.connectYandexDisk = connectYandexDisk;
window.useLocalStorage = useLocalStorage;
window.logoutYandexDisk = logoutYandexDisk;
window.saveAllDataToYandex = saveAllDataToYandex;
window.loadAllDataFromYandex = loadAllDataFromYandex;
window.handleYandexToken = handleYandexToken;
window.initYandexDiskIntegration = initYandexDiskIntegration;

Logger.info('Yandex Disk Integration загружен');
