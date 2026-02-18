// ============================================
// GOOGLE DRIVE INTEGRATION
// ============================================
// Интеграция с Google Диском для хранения данных кооператива
// Версия: 1.0
// Дата: 17 февраля 2026

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const GOOGLE_DRIVE_CONFIG = {
    // ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ ИЗ GOOGLE CLOUD CONSOLE
    CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    API_KEY: 'YOUR_API_KEY',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    SCOPES: 'https://www.googleapis.com/auth/drive.file',
    FOLDER_NAME: 'КООПЕРАНТ',
    AUTO_SAVE_INTERVAL: 30000 // 30 секунд
};

// Глобальные переменные
let googleDriveToken = null;
let cooperativFolderId = null;
let lastSyncTime = null;
let autoSaveTimer = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// Загрузка Google API
function loadGoogleDriveAPI() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('client', resolve);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Инициализация Google Drive
async function initGoogleDrive() {
    try {
        await loadGoogleDriveAPI();
        
        await gapi.client.init({
            apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
            discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS
        });
        
        Logger.info('Google Drive API инициализирован');
        return true;
    } catch (error) {
        Logger.error('Ошибка инициализации Google Drive', error);
        return false;
    }
}

// ============================================
// АВТОРИЗАЦИЯ
// ============================================

// Проверка авторизации
function isAuthorized() {
    return googleDriveToken !== null;
}

// Авторизация через Google
async function authorizeGoogleDrive() {
    return new Promise(async (resolve, reject) => {
        try {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
                scope: GOOGLE_DRIVE_CONFIG.SCOPES,
                callback: async (response) => {
                    if (response.error) {
                        reject(response);
                        return;
                    }
                    
                    googleDriveToken = response.access_token;
                    localStorage.setItem('googleDriveToken', response.access_token);
                    
                    Logger.info('Google Drive авторизация успешна');
                    
                    // Поиск или создание папки
                    const folderId = await findOrCreateCooperativFolder();
                    if (folderId) {
                        cooperativFolderId = folderId;
                        localStorage.setItem('cooperativFolderId', folderId);
                        resolve(folderId);
                    } else {
                        reject(new Error('Не удалось создать папку'));
                    }
                }
            });
            
            // Проверяем есть ли сохранённый токен
            const savedToken = localStorage.getItem('googleDriveToken');
            if (savedToken) {
                googleDriveToken = savedToken;
                const folderId = localStorage.getItem('cooperativFolderId');
                if (folderId) {
                    cooperativFolderId = folderId;
                    resolve(folderId);
                    return;
                }
            }
            
            // Запрашиваем авторизацию
            tokenClient.requestAccessToken();
            
        } catch (error) {
            Logger.error('Ошибка авторизации Google Drive', error);
            reject(error);
        }
    });
}

// Выход из Google Drive
function logoutGoogleDrive() {
    const token = localStorage.getItem('googleDriveToken');
    if (token && google.accounts.oauth2) {
        google.accounts.oauth2.revoke(token);
    }
    localStorage.removeItem('googleDriveToken');
    localStorage.removeItem('cooperativFolderId');
    googleDriveToken = null;
    cooperativFolderId = null;
    stopAutoSave();
    Logger.info('Выход из Google Drive');
}

// ============================================
// РАБОТА С ПАПКАМИ
// ============================================

// Поиск папки КООПЕРАНТ
async function findCooperativFolder() {
    try {
        const response = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${GOOGLE_DRIVE_CONFIG.FOLDER_NAME}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name, createdTime)'
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            Logger.info('Папка КООПЕРАНТ найдена', files[0]);
            return files[0].id;
        }
        
        return null;
    } catch (error) {
        Logger.error('Ошибка поиска папки', error);
        return null;
    }
}

// Создание папки КООПЕРАНТ
async function createCooperativFolder() {
    try {
        const fileMetadata = {
            'name': GOOGLE_DRIVE_CONFIG.FOLDER_NAME,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        
        const response = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id, name, createdTime'
        });
        
        Logger.info('Папка КООПЕРАНТ создана', response.result);
        return response.result.id;
    } catch (error) {
        Logger.error('Ошибка создания папки', error);
        return null;
    }
}

// Поиск или создание папки
async function findOrCreateCooperativFolder() {
    let folderId = await findCooperativFolder();
    
    if (!folderId) {
        Logger.info('Папка не найдена, создаём...');
        folderId = await createCooperativFolder();
    }
    
    // Создаём подпапки
    if (folderId) {
        await createSubfolders(folderId);
    }
    
    return folderId;
}

// Создание подпапок
async function createSubfolders(parentFolderId) {
    const subfolders = ['Data', 'Applications', 'Certificates', 'Protocols', 'Documents', 'Backup'];
    
    for (const subfolder of subfolders) {
        try {
            const fileMetadata = {
                'name': subfolder,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [parentFolderId]
            };
            
            await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
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

// Загрузка файла из Google Drive
async function loadFileFromDrive(fileName, subfolder = 'Data') {
    try {
        if (!cooperativFolderId) {
            throw new Error('Папка не выбрана');
        }
        
        // Ищем файл
        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${cooperativFolderId}' in parents and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name, modifiedTime)'
        });
        
        const files = response.result.files;
        if (!files || files.length === 0) {
            Logger.info(`Файл ${fileName} не найден`);
            return null;
        }
        
        // Скачиваем файл
        const fileId = files[0].id;
        const downloadResponse = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        Logger.info(`Файл ${fileName} загружен`, downloadResponse.result);
        lastSyncTime = new Date();
        return downloadResponse.result;
        
    } catch (error) {
        Logger.error(`Ошибка загрузки файла ${fileName}`, error);
        return null;
    }
}

// Сохранение файла в Google Drive
async function saveFileToDrive(fileName, data, subfolder = 'Data') {
    try {
        if (!cooperativFolderId) {
            throw new Error('Папка не выбрана');
        }
        
        // Проверяем существует ли файл
        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${cooperativFolderId}' in parents and trashed=false`,
            spaces: 'drive',
            fields: 'files(id)'
        });
        
        const files = response.result.files;
        const fileContent = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        
        if (files && files.length > 0) {
            // Обновляем существующий файл
            const fileId = files[0].id;
            
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify({
                name: fileName,
                modifiedTime: new Date().toISOString()
            })], { type: 'application/json' }));
            formData.append('file', fileContent);
            
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
                method: 'PATCH',
                headers: new Headers({ 'Authorization': 'Bearer ' + googleDriveToken }),
                body: formData
            });
            
            Logger.info(`Файл ${fileName} обновлён`);
        } else {
            // Создаём новый файл
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify({
                name: fileName,
                parents: [cooperativFolderId]
            })], { type: 'application/json' }));
            formData.append('file', fileContent);
            
            const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + googleDriveToken }),
                body: formData
            });
            
            const result = await uploadResponse.json();
            Logger.info(`Файл ${fileName} создан`, result);
        }
        
        lastSyncTime = new Date();
        return true;
        
    } catch (error) {
        Logger.error(`Ошибка сохранения файла ${fileName}`, error);
        return false;
    }
}

// Удаление файла из Google Drive
async function deleteFileFromDrive(fileName) {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and '${cooperativFolderId}' in parents and trashed=false`,
            spaces: 'drive',
            fields: 'files(id)'
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            await gapi.client.drive.files.delete({
                fileId: files[0].id
            });
            Logger.info(`Файл ${fileName} удалён`);
            return true;
        }
        
        return false;
    } catch (error) {
        Logger.error(`Ошибка удаления файла ${fileName}`, error);
        return false;
    }
}

// ============================================
// СИНХРОНИЗАЦИЯ ДАННЫХ
// ============================================

// Загрузка всех данных из Google Drive
async function loadAllDataFromDrive() {
    try {
        Logger.info('Загрузка данных из Google Drive...');
        
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
            const data = await loadFileFromDrive(file.name);
            if (data) {
                localStorage.setItem(file.key, JSON.stringify(data));
                Logger.info(`Данные ${file.key} загружены`);
            }
        }
        
        Logger.info('Все данные загружены из Google Drive');
        return true;
        
    } catch (error) {
        Logger.error('Ошибка загрузки данных', error);
        return false;
    }
}

// Сохранение всех данных в Google Drive
async function saveAllDataToDrive() {
    try {
        Logger.info('Сохранение данных в Google Drive...');
        
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
                await saveFileToDrive(file.name, data);
            }
        }
        
        Logger.info('Все данные сохранены в Google Drive');
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
function startAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    
    autoSaveTimer = setInterval(async () => {
        Logger.info('Автосохранение...');
        await saveAllDataToDrive();
        showToast({
            type: 'success',
            message: `Данные сохранены в Google Drive (${new Date().toLocaleTimeString()})`,
            duration: 2000
        });
    }, GOOGLE_DRIVE_CONFIG.AUTO_SAVE_INTERVAL);
    
    Logger.info('Автосохранение запущено (интервал: 30 сек)');
}

// Остановка автосохранения
function stopAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
        Logger.info('Автосохранение остановлено');
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ИНТЕГРАЦИИ
// ============================================

async function initGoogleDriveIntegration() {
    try {
        // Проверяем, отключён ли Google Drive
        const disabled = localStorage.getItem('googleDriveDisabled') === 'true';
        if (disabled) {
            Logger.info('Google Drive отключён пользователем');
            return;
        }
        
        // Проверяем, авторизованы ли
        const folderId = localStorage.getItem('cooperativFolderId');
        const token = localStorage.getItem('googleDriveToken');
        
        if (folderId && token) {
            Logger.info('Google Drive авторизован, загружаем данные...');
            googleDriveToken = token;
            cooperativFolderId = folderId;
            
            // Инициализируем API
            const initialized = await initGoogleDrive();
            if (initialized) {
                // Загружаем данные
                await loadAllDataFromDrive();
                
                // Запускаем автосохранение
                startAutoSave();
                
                Logger.info('Google Drive готов к работе');
                return;
            }
        }
        
        // Показываем окно авторизации
        Logger.info('Требуется авторизация Google Drive');
        setTimeout(() => {
            showGoogleAuthModal();
        }, 1000);
        
    } catch (error) {
        Logger.error('Ошибка инициализации Google Drive', error);
        // Показываем окно авторизации
        setTimeout(() => {
            showGoogleAuthModal();
        }, 1000);
    }
}

// ============================================
// UI ФУНКЦИИ
// ============================================

// Показ окна авторизации
function showGoogleAuthModal() {
    const content = `
        <div style="padding:40px;text-align:center;max-width:500px;margin:0 auto">
            <div style="font-size:64px;margin-bottom:20px">☁️</div>
            <h2 style="margin-bottom:10px">Google Диск</h2>
            <p style="color:#666;margin-bottom:30px">
                Для хранения данных кооператива необходимо подключиться к Google Диску.
                Данные будут автоматически сохраняться в папку "КООПЕРАНТ".
            </p>
            <div style="display:flex;flex-direction:column;gap:10px">
                <button onclick="connectGoogleDrive()" 
                        style="padding:15px 30px;background:#4285f4;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#fff" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                    Войти через Google
                </button>
                <button onclick="useLocalStorage()" 
                        style="padding:15px 30px;background:#f5f7fa;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:16px">
                    Работать без Google Диска
                </button>
            </div>
            <p style="font-size:12px;color:#999;margin-top:20px">
                🔒 Ваши данные защищены и используются только для работы приложения
            </p>
        </div>
    `;
    
    showModal(content);
}

// Подключение к Google Drive
async function connectGoogleDrive() {
    try {
        showToast({ type: 'info', message: 'Подключение к Google Drive...', duration: 5000 });
        
        const folderId = await authorizeGoogleDrive();
        
        if (folderId) {
            showToast({ type: 'success', message: 'Google Диск подключён!', duration: 3000 });
            
            // Загружаем данные
            await loadAllDataFromDrive();
            
            // Запускаем автосохранение
            startAutoSave();
            
            // Закрываем модальное окно
            closeModal();
            
            // Перезагружаем приложение
            location.reload();
        }
    } catch (error) {
        Logger.error('Ошибка подключения', error);
        showToast({ type: 'error', message: 'Ошибка подключения к Google Drive', duration: 5000 });
    }
}

// Работа без Google Drive (localStorage)
function useLocalStorage() {
    localStorage.setItem('googleDriveDisabled', 'true');
    closeModal();
    Logger.info('Работа без Google Drive');
    showToast({ type: 'info', message: 'Данные сохраняются локально в браузере', duration: 3000 });
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.connectGoogleDrive = connectGoogleDrive;
window.useLocalStorage = useLocalStorage;
window.logoutGoogleDrive = logoutGoogleDrive;
window.saveAllDataToDrive = saveAllDataToDrive;
window.loadAllDataFromDrive = loadAllDataFromDrive;

Logger.info('Google Drive Integration загружен');
