// ============================================
// MEMBER APP - Личный кабинет пайщика
// ============================================
// Версия: 1.0
// Дата: 20 февраля 2026
// Назначение: Логика взаимодействия пайщика с кооперативами
// ============================================

(function() {
    'use strict';

    // ============================================
    // КОНФИГУРАЦИЯ
    // ============================================
    
    const CONFIG = {
        // Яндекс.Диск OAuth
        YANDEX_CLIENT_ID: '3772de21483443aba93e1889bd7ca4dc',
        YANDEX_REDIRECT_URI: window.location.origin + '/yandex-auth-callback.html',
        
        // Папки на Яндекс.Диске
        FOLDER_NAME: 'КООПЕРАНТ',
        MEMBER_DATA_FOLDER: 'member_data',
        COOPERATIVES_FOLDER: 'cooperatives',
        
        // Таймауты
        SYNC_TIMEOUT: 30000,
        AUTO_SYNC_INTERVAL: 300000, // 5 минут
        
        // Реестр кооперативов (URL к центральному реестру)
        COOPERATIVES_REGISTRY_URL: 'https://koopérant.ru/api/cooperatives.json',
        
        // Отладка
        DEBUG: true
    };

    // ============================================
    // ГЛОБАЛЬНОЕ СОСТОЯНИЕ
    // ============================================
    
    const state = {
        // Профиль пайщика
        profile: null,
        
        // Токены
        yandexToken: null,
        yandexUserInfo: null,
        
        // Данные
        cooperatives: [],      // Все кооперативы (реестр)
        memberships: [],       // Мои членства
        applications: [],      // Мои заявления
        
        // Синхронизация
        isSyncing: false,
        lastSyncTime: null,
        syncQueue: [],
        
        // Уведомления
        notifications: [],
        discrepancies: []
    };

    // ============================================
    // LOGGER
    // ============================================
    
    const Logger = {
        info: function(msg, data) {
            if (CONFIG.DEBUG) {
                console.log('[MemberApp] ' + msg, data || '');
            }
        },
        
        error: function(msg, error) {
            console.error('[MemberApp] ' + msg, error || '');
        },
        
        warn: function(msg, data) {
            console.warn('[MemberApp] ' + msg, data || '');
        },
        
        success: function(msg) {
            console.log('%c[MemberApp] ' + msg, 'color: #4caf50; font-weight: bold;');
        }
    };

    // ============================================
    // YANDEX DISK API
    // ============================================
    
    const YandexDisk = {
        /**
         * Проверка авторизации
         */
        isAuthorized: function() {
            const token = localStorage.getItem('yandex_member_token');
            return !!token;
        },
        
        /**
         * Получить токен из localStorage
         */
        getToken: function() {
            return localStorage.getItem('yandex_member_token');
        },
        
        /**
         * Сохранить токен
         */
        saveToken: function(token) {
            localStorage.setItem('yandex_member_token', token);
            Logger.success('Токен Яндекс.Диска сохранён');
        },
        
        /**
         * Очистить токен
         */
        clearToken: function() {
            localStorage.removeItem('yandex_member_token');
            localStorage.removeItem('yandex_member_user');
        },
        
        /**
         * Получить информацию о пользователе
         */
        getUserInfo: async function(token) {
            try {
                const response = await fetch('https://login.yandex.ru/info', {
                    headers: {
                        'Authorization': `OAuth ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Ошибка получения информации о пользователе');
                }
                
                const userInfo = await response.json();
                return userInfo;
            } catch (error) {
                Logger.error('getUserInfo', error);
                throw error;
            }
        },
        
        /**
         * Создать папку на Яндекс.Диске
         */
        createFolder: async function(path, token) {
            try {
                const response = await fetch('https://cloud-api.yandex.net/v1/disk/resources', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `OAuth ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        path: path
                    })
                });
                
                return response.ok || response.status === 201;
            } catch (error) {
                Logger.error('createFolder', error);
                return false;
            }
        },
        
        /**
         * Загрузить файл на Яндекс.Диск
         */
        uploadFile: async function(path, content, token) {
            try {
                // Получаем ссылку для загрузки
                const uploadUrlResponse = await fetch(
                    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(path)}&overwrite=true`,
                    {
                        headers: {
                            'Authorization': `OAuth ${token}`
                        }
                    }
                );
                
                if (!uploadUrlResponse.ok) {
                    throw new Error('Ошибка получения ссылки для загрузки');
                }
                
                const uploadData = await uploadUrlResponse.json();
                const uploadUrl = uploadData.href;
                
                // Загружаем файл
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(content, null, 2)
                });
                
                return uploadResponse.ok;
            } catch (error) {
                Logger.error('uploadFile', error);
                throw error;
            }
        },
        
        /**
         * Скачать файл с Яндекс.Диска
         */
        downloadFile: async function(path, token) {
            try {
                // Получаем ссылку для скачивания
                const downloadUrlResponse = await fetch(
                    `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(path)}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${token}`
                        }
                    }
                );
                
                if (!downloadUrlResponse.ok) {
                    return null; // Файл не существует
                }
                
                const downloadData = await downloadUrlResponse.json();
                const downloadUrl = downloadData.href;
                
                // Скачиваем файл
                const response = await fetch(downloadUrl);
                const content = await response.json();
                
                return content;
            } catch (error) {
                Logger.error('downloadFile', error);
                return null;
            }
        },
        
        /**
         * Получить список файлов в папке
         */
        listFiles: async function(path, token) {
            try {
                const response = await fetch(
                    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(path)}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${token}`
                        }
                    }
                );
                
                if (!response.ok) {
                    return [];
                }
                
                const data = await response.json();
                return data._embedded ? data._embedded.items : [];
            } catch (error) {
                Logger.error('listFiles', error);
                return [];
            }
        }
    };

    // ============================================
    // MEMBER PROFILE API
    // ============================================
    
    const MemberProfile = {
        /**
         * Путь к профилю на Яндекс.Диске пайщика
         */
        getProfilePath: function() {
            return `/${CONFIG.FOLDER_NAME}/${CONFIG.MEMBER_DATA_FOLDER}/profile.json`;
        },
        
        /**
         * Путь к данным членства
         */
        getMembershipPath: function(cooperativeId) {
            return `/${CONFIG.FOLDER_NAME}/${CONFIG.MEMBER_DATA_FOLDER}/${CONFIG.COOPERATIVES_FOLDER}/${cooperativeId}/data.json`;
        },
        
        /**
         * Загрузить профиль пайщика
         */
        load: async function() {
            try {
                const token = YandexDisk.getToken();
                if (!token) {
                    throw new Error('Нет токена авторизации');
                }
                
                const profile = await YandexDisk.downloadFile(MemberProfile.getProfilePath(), token);
                
                if (profile) {
                    state.profile = profile;
                    state.memberships = profile.memberships || [];
                    state.applications = profile.applications || [];
                    Logger.success('Профиль загружен');
                } else {
                    // Профиль не существует - создаём новый
                    await MemberProfile.create();
                }
                
                return state.profile;
            } catch (error) {
                Logger.error('Profile load', error);
                throw error;
            }
        },
        
        /**
         * Создать новый профиль
         */
        create: async function() {
            try {
                const token = YandexDisk.getToken();
                const userInfo = await YandexDisk.getUserInfo(token);
                
                const newProfile = {
                    profile: {
                        id: userInfo.default_email || userInfo.login,
                        type: 'individual',
                        name: userInfo.display_name || '',
                        email: userInfo.default_email || '',
                        phone: '',
                        registeredAt: new Date().toISOString(),
                        yandexDisk: {
                            email: userInfo.default_email,
                            login: userInfo.login
                        }
                    },
                    memberships: [],
                    applications: []
                };
                
                await MemberProfile.save(newProfile);
                state.profile = newProfile;
                state.memberships = [];
                state.applications = [];
                
                Logger.success('Профиль создан');
                return newProfile;
            } catch (error) {
                Logger.error('Profile create', error);
                throw error;
            }
        },
        
        /**
         * Сохранить профиль
         */
        save: async function(profileData) {
            try {
                const token = YandexDisk.getToken();
                const path = MemberProfile.getProfilePath();
                
                // Создаём папки
                await YandexDisk.createFolder(`/${CONFIG.FOLDER_NAME}`, token);
                await YandexDisk.createFolder(`/${CONFIG.FOLDER_NAME}/${CONFIG.MEMBER_DATA_FOLDER}`, token);
                await YandexDisk.createFolder(
                    `/${CONFIG.FOLDER_NAME}/${CONFIG.MEMBER_DATA_FOLDER}/${CONFIG.COOPERATIVES_FOLDER}`, 
                    token
                );
                
                // Сохраняем профиль
                const saved = await YandexDisk.uploadFile(path, profileData, token);
                
                if (saved) {
                    Logger.success('Профиль сохранён');
                }
                
                return saved;
            } catch (error) {
                Logger.error('Profile save', error);
                throw error;
            }
        },
        
        /**
         * Обновить данные профиля
         */
        update: function(updates) {
            if (!state.profile) {
                throw new Error('Профиль не загружен');
            }
            
            Object.assign(state.profile.profile, updates);
            return MemberProfile.save(state.profile);
        },
        
        /**
         * Добавить членство
         */
        addMembership: function(membership) {
            if (!state.memberships.find(m => m.cooperativeId === membership.cooperativeId)) {
                state.memberships.push(membership);
                state.profile.memberships = state.memberships;
                return MemberProfile.save(state.profile);
            }
            return Promise.resolve();
        },
        
        /**
         * Обновить членство
         */
        updateMembership: function(cooperativeId, updates) {
            const membership = state.memberships.find(m => m.cooperativeId === cooperativeId);
            if (membership) {
                Object.assign(membership, updates);
                state.profile.memberships = state.memberships;
                return MemberProfile.save(state.profile);
            }
            return Promise.resolve();
        },
        
        /**
         * Добавить заявление
         */
        addApplication: function(application) {
            state.applications.push(application);
            state.profile.applications = state.applications;
            return MemberProfile.save(state.profile);
        },
        
        /**
         * Обновить заявление
         */
        updateApplication: function(applicationId, updates) {
            const application = state.applications.find(a => a.id === applicationId);
            if (application) {
                Object.assign(application, updates);
                state.profile.applications = state.applications;
                return MemberProfile.save(state.profile);
            }
            return Promise.resolve();
        }
    };

    // ============================================
    // COOPERATIVES REGISTRY API
    // ============================================
    
    const CooperativeRegistry = {
        /**
         * Загрузить реестр всех кооперативов
         */
        load: async function() {
            try {
                // В реальной реализации - запрос к центральному реестру
                // Для демо - используем локальные данные
                
                const response = await fetch(CONFIG.COOPERATIVES_REGISTRY_URL);
                
                if (response.ok) {
                    const data = await response.json();
                    state.cooperatives = data.cooperatives || [];
                } else {
                    // Если реестр недоступен, используем демо-данные
                    state.cooperatives = window.cooperatives || [];
                }
                
                Logger.success(`Реестр загружен: ${state.cooperatives.length} кооперативов`);
                return state.cooperatives;
            } catch (error) {
                Logger.warn('Registry load failed, using demo data', error);
                state.cooperatives = window.cooperatives || [];
                return state.cooperatives;
            }
        },
        
        /**
         * Поиск кооперативов
         */
        search: function(query, filters = {}) {
            let results = state.cooperatives;
            
            // Поиск по тексту
            if (query) {
                const q = query.toLowerCase();
                results = results.filter(coop => 
                    coop.name.toLowerCase().includes(q) ||
                    coop.inn.includes(q) ||
                    coop.region.toLowerCase().includes(q)
                );
            }
            
            // Фильтр по региону
            if (filters.region) {
                results = results.filter(coop => coop.region === filters.region);
            }
            
            // Фильтр по типу
            if (filters.type) {
                results = results.filter(coop => coop.type === filters.type);
            }
            
            // Исключаем кооперативы, где уже состоим
            if (filters.excludeMemberships) {
                const memberCoopIds = state.memberships.map(m => m.cooperativeId);
                results = results.filter(coop => !memberCoopIds.includes(coop.id));
            }
            
            return results;
        },
        
        /**
         * Получить кооператив по ID
         */
        get: function(cooperativeId) {
            return state.cooperatives.find(c => c.id === cooperativeId);
        }
    };

    // ============================================
    // DATA SYNCHRONIZATION
    // ============================================
    
    const DataSync = {
        /**
         * Синхронизировать данные с кооперативом
         */
        syncWithCooperative: async function(cooperativeId) {
            const startTime = Date.now();
            state.isSyncing = true;
            
            try {
                const membership = state.memberships.find(m => m.cooperativeId === cooperativeId);
                const cooperative = CooperativeRegistry.get(cooperativeId);
                
                if (!membership || !cooperative) {
                    throw new Error('Членство или кооператив не найдены');
                }
                
                Logger.info(`Синхронизация с ${cooperative.name}...`);
                
                // Загружаем данные кооператива с его Яндекс.Диска
                const coopData = await DataSync.loadCooperativeData(cooperative, membership.memberId);
                
                if (!coopData) {
                    throw new Error('Данные кооператива недоступны');
                }
                
                // Сравниваем данные
                const discrepancies = DataSync.compareData(membership, coopData);
                
                if (discrepancies.length > 0) {
                    // Есть расхождения
                    state.discrepancies = discrepancies;
                    membership.discrepancies = discrepancies;
                    membership.lastSync = new Date().toISOString();
                    
                    Logger.warn(`Найдено расхождений: ${discrepancies.length}`);
                    
                    // Показываем UI расхождений
                    MemberUI.showDiscrepancies(cooperativeId, discrepancies);
                } else {
                    // Всё синхронизировано
                    membership.lastSync = new Date().toISOString();
                    membership.discrepancies = [];
                    
                    // Обновляем локальные данные
                    await MemberProfile.updateMembership(cooperativeId, {
                        lastSync: membership.lastSync,
                        paidAmount: coopData.paidAmount || membership.paidAmount,
                        debt: coopData.debt || membership.debt
                    });
                    
                    Logger.success('Синхронизация завершена без расхождений');
                    MemberUI.showSyncSuccess(cooperativeId);
                }
                
                await MemberProfile.save(state.profile);
                
            } catch (error) {
                Logger.error('Sync failed', error);
                MemberUI.showSyncError(cooperativeId, error.message);
            } finally {
                state.isSyncing = false;
                state.lastSyncTime = new Date();
            }
        },
        
        /**
         * Загрузить данные кооператива
         */
        loadCooperativeData: async function(cooperative, memberId) {
            try {
                // В реальной реализации:
                // 1. Получаем токен доступа к Яндекс.Диску кооператива
                // 2. Загружаем members.json и payments.json
                // 3. Фильтруем по memberId
                
                // Для демо - имитация задержки и данных
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Имитация данных от кооператива
                return {
                    memberId: memberId,
                    paidAmount: 105000,
                    debt: 0,
                    status: 'active',
                    transactions: [],
                    documents: []
                };
                
            } catch (error) {
                Logger.error('loadCooperativeData', error);
                return null;
            }
        },
        
        /**
         * Сравнить данные и найти расхождения
         */
        compareData: function(localMembership, remoteData) {
            const discrepancies = [];
            
            // Сравниваем сумму взносов
            if (localMembership.paidAmount !== remoteData.paidAmount) {
                discrepancies.push({
                    field: 'paidAmount',
                    fieldName: 'Сумма взносов',
                    localValue: localMembership.paidAmount,
                    remoteValue: remoteData.paidAmount,
                    severity: 'high'
                });
            }
            
            // Сравниваем задолженность
            if (localMembership.debt !== remoteData.debt) {
                discrepancies.push({
                    field: 'debt',
                    fieldName: 'Задолженность',
                    localValue: localMembership.debt,
                    remoteValue: remoteData.debt,
                    severity: 'high'
                });
            }
            
            // Сравниваем статус
            if (localMembership.status !== remoteData.status) {
                discrepancies.push({
                    field: 'status',
                    fieldName: 'Статус',
                    localValue: localMembership.status,
                    remoteValue: remoteData.status,
                    severity: 'critical'
                });
            }
            
            return discrepancies;
        },
        
        /**
         * Разрешить расхождение
         */
        resolveDiscrepancy: async function(cooperativeId, discrepancy, action) {
            const membership = state.memberships.find(m => m.cooperativeId === cooperativeId);
            
            if (!membership) return;
            
            switch (action) {
                case 'accept_remote':
                    // Принять версию кооператива
                    membership[discrepancy.field] = discrepancy.remoteValue;
                    break;
                    
                case 'keep_local':
                    // Оставить локальную версию
                    // Ничего не меняем
                    break;
                    
                case 'request_correction':
                    // Запросить исправление
                    await Applications.createCorrectionRequest(cooperativeId, discrepancy);
                    break;
            }
            
            // Удаляем расхождение из списка
            membership.discrepancies = membership.discrepancies.filter(
                d => d.field !== discrepancy.field
            );
            
            await MemberProfile.save(state.profile);
        },
        
        /**
         * Синхронизировать все кооперативы
         */
        syncAll: async function() {
            Logger.info('Запуск синхронизации всех кооперативов...');
            
            for (const membership of state.memberships) {
                await DataSync.syncWithCooperative(membership.cooperativeId);
            }
            
            Logger.success('Все кооперативы синхронизированы');
        }
    };

    // ============================================
    // APPLICATIONS API
    // ============================================
    
    const Applications = {
        /**
         * Подать заявление на вступление
         */
        submit: async function(cooperativeId, applicationData) {
            try {
                const cooperative = CooperativeRegistry.get(cooperativeId);
                
                if (!cooperative) {
                    throw new Error('Кооператив не найден');
                }
                
                const newApplication = {
                    id: `app_${Date.now()}`,
                    cooperativeId: cooperativeId,
                    cooperativeName: cooperative.name,
                    type: 'join',
                    status: 'pending',
                    submittedAt: new Date().toISOString(),
                    data: applicationData
                };
                
                // Сохраняем в профиль
                await MemberProfile.addApplication(newApplication);
                state.applications.push(newApplication);
                
                // Отправляем уведомление кооперативу
                await Applications.notifyCooperative(cooperative, newApplication);
                
                Logger.success(`Заявление подано в ${cooperative.name}`);
                return newApplication;
                
            } catch (error) {
                Logger.error('Submit application', error);
                throw error;
            }
        },
        
        /**
         * Уведомить кооператив о заявлении
         */
        notifyCooperative: async function(cooperative, application) {
            // В реальной реализации:
            // 1. Отправляем данные на Яндекс.Диск кооператива
            // 2. Или через центральный сервис уведомлений
            
            Logger.info(`Уведомление отправлено в ${cooperative.name}`);
        },
        
        /**
         * Проверить статус заявления
         */
        checkStatus: async function(applicationId) {
            const application = state.applications.find(a => a.id === applicationId);
            
            if (!application) {
                throw new Error('Заявление не найдено');
            }
            
            // В реальной реализации - запрос к кооперативу
            // Для демо - возвращаем текущий статус
            
            return application.status;
        },
        
        /**
         * Отозвать заявление
         */
        cancel: async function(applicationId) {
            const application = state.applications.find(a => a.id === applicationId);
            
            if (!application) {
                throw new Error('Заявление не найдено');
            }
            
            application.status = 'cancelled';
            await MemberProfile.updateApplication(applicationId, { status: 'cancelled' });
            
            Logger.success('Заявление отозвано');
        },
        
        /**
         * Создать запрос на исправление данных
         */
        createCorrectionRequest: async function(cooperativeId, discrepancy) {
            const request = {
                id: `req_${Date.now()}`,
                cooperativeId: cooperativeId,
                type: 'data_correction',
                field: discrepancy.field,
                currentValue: discrepancy.localValue,
                requestedValue: discrepancy.remoteValue,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Сохраняем запрос
            state.applications.push(request);
            await MemberProfile.save(state.profile);
            
            // Отправляем кооперативу
            const cooperative = CooperativeRegistry.get(cooperativeId);
            await Applications.notifyCooperative(cooperative, request);
            
            Logger.success('Запрос на исправление отправлен');
            return request;
        }
    };

    // ============================================
    // MEMBER UI
    // ============================================
    
    const MemberUI = {
        /**
         * Обновить статистику
         */
        updateStats: function() {
            const totalCoops = state.memberships.length;
            const activeCoops = state.memberships.filter(m => m.status === 'active').length;
            const pendingApps = state.applications.filter(a => a.status === 'pending').length;
            const totalInvested = state.memberships.reduce((sum, m) => sum + (m.paidAmount || 0), 0);
            
            document.getElementById('totalCoops').textContent = totalCoops;
            document.getElementById('activeCoops').textContent = activeCoops;
            document.getElementById('pendingApps').textContent = pendingApps;
            document.getElementById('totalInvested').textContent = MemberUI.formatMoney(totalInvested);
        },
        
        /**
         * Показать расхождения
         */
        showDiscrepancies: function(cooperativeId, discrepancies) {
            const tbody = document.getElementById('discrepancyTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = discrepancies.map(d => `
                <tr>
                    <td>${d.fieldName}</td>
                    <td>${MemberUI.formatValue(d.field, d.localValue)}</td>
                    <td>${MemberUI.formatValue(d.field, d.remoteValue)}</td>
                </tr>
            `).join('');
            
            // Сохраняем текущий кооператив для разрешения
            window.currentDiscrepancyCoopId = cooperativeId;
            
            // Показываем модальное окно
            document.getElementById('discrepancyModal').classList.add('active');
        },
        
        /**
         * Показать успех синхронизации
         */
        showSyncSuccess: function(cooperativeId) {
            const membership = state.memberships.find(m => m.cooperativeId === cooperativeId);
            const syncText = document.getElementById('syncText');
            const syncIndicator = document.getElementById('syncIndicator');
            
            if (syncText) {
                syncText.textContent = 'Синхронизировано: только что';
            }
            if (syncIndicator) {
                syncIndicator.classList.remove('syncing');
                syncIndicator.style.background = '#4caf50';
            }
            
            // Перерисовываем карточку
            MemberUI.renderMyCooperatives();
        },
        
        /**
         * Показать ошибку синхронизации
         */
        showSyncError: function(cooperativeId, message) {
            alert(`❌ Ошибка синхронизации\n\n${message}`);
            
            const syncIndicator = document.getElementById('syncIndicator');
            if (syncIndicator) {
                syncIndicator.classList.remove('syncing');
                syncIndicator.style.background = '#f44336';
            }
        },
        
        /**
         * Отформатировать значение
         */
        formatValue: function(field, value) {
            if (field === 'paidAmount' || field === 'debt') {
                return MemberUI.formatMoney(value);
            }
            if (field === 'status') {
                const statusNames = {
                    'active': '✅ Активный',
                    'suspended': '⛔ Приостановлен',
                    'excluded': '❌ Исключён'
                };
                return statusNames[value] || value;
            }
            return value;
        },
        
        /**
         * Форматировать деньги
         */
        formatMoney: function(amount) {
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 0
            }).format(amount);
        },
        
        /**
         * Рендеринг списка кооперативов
         */
        renderMyCooperatives: function() {
            const grid = document.getElementById('myCoopsGrid');
            if (!grid) return;
            
            if (state.memberships.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <div class="empty-icon">📋</div>
                        <div class="empty-title">Нет кооперативов</div>
                        <p>Найдите кооператив в каталоге и подайте заявление</p>
                        <button class="btn btn-primary" onclick="switchTab('search')" style="margin-top: 16px;">
                            🔍 Найти кооператив
                        </button>
                    </div>
                `;
                return;
            }
            
            // Вызываем функцию из HTML (если есть) или рендерим сами
            if (typeof window.renderMyCooperatives === 'function') {
                window.renderMyCooperatives();
            }
        },
        
        /**
         * Рендеринг поиска
         */
        renderSearchResults: function() {
            if (typeof window.renderSearchResults === 'function') {
                window.renderSearchResults();
            }
        },
        
        /**
         * Рендеринг заявлений
         */
        renderApplications: function() {
            if (typeof window.renderApplications === 'function') {
                window.renderApplications();
            }
        }
    };

    // ============================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================
    
    const App = {
        /**
         * Инициализация приложения
         */
        init: async function() {
            Logger.info('Инициализация приложения...');
            
            // Проверяем авторизацию
            if (!YandexDisk.isAuthorized()) {
                Logger.warn('Нет авторизации, показываем экран входа');
                MemberUI.showLoginScreen();
                return;
            }
            
            try {
                // Загружаем профиль
                await MemberProfile.load();
                
                // Загружаем реестр кооперативов
                await CooperativeRegistry.load();
                
                // Обновляем UI
                MemberUI.updateStats();
                MemberUI.renderMyCooperatives();
                MemberUI.renderSearchResults();
                MemberUI.renderApplications();
                
                Logger.success('Приложение инициализировано');
                
                // Запускаем автосинхронизацию
                App.startAutoSync();
                
            } catch (error) {
                Logger.error('Init failed', error);
                MemberUI.showError('Ошибка загрузки данных');
            }
        },
        
        /**
         * Запустить автосинхронизацию
         */
        startAutoSync: function() {
            setInterval(async function() {
                if (!state.isSyncing && state.memberships.length > 0) {
                    Logger.info('Автосинхронизация...');
                    await DataSync.syncAll();
                }
            }, CONFIG.AUTO_SYNC_INTERVAL);
        },
        
        /**
         * Показать экран входа
         */
        showLoginScreen: function() {
            // Создаём экран входа если нет в HTML
            let loginScreen = document.getElementById('loginScreen');
            
            if (!loginScreen) {
                loginScreen = document.createElement('div');
                loginScreen.id = 'loginScreen';
                loginScreen.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, #2196F3, #1976D2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                    ">
                        <div style="
                            background: white;
                            padding: 40px;
                            border-radius: 16px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                            text-align: center;
                            max-width: 400px;
                        ">
                            <div style="font-size: 64px; margin-bottom: 16px;">🏠</div>
                            <h1 style="margin-bottom: 16px; color: #212121;">КООПЕРАНТ</h1>
                            <p style="margin-bottom: 24px; color: #757575;">
                                Личный кабинет пайщика
                            </p>
                            <button onclick="MemberApp.login()" style="
                                background: #fc0;
                                color: #212121;
                                border: none;
                                padding: 16px 32px;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                width: 100%;
                            ">
                                ☁️ Войти через Яндекс
                            </button>
                            <p style="margin-top: 16px; font-size: 12px; color: #9e9e9e;">
                                Для входа используется Яндекс.Диск для хранения данных
                            </p>
                        </div>
                    </div>
                `;
                document.body.appendChild(loginScreen);
            }
        },
        
        /**
         * Ошибка
         */
        showError: function(message) {
            alert('❌ Ошибка\n\n' + message);
        }
    };

    // ============================================
    // ЭКСПОРТ В GLOBAL SCOPE
    // ============================================
    
    window.MemberApp = {
        // Состояние
        state: state,
        config: CONFIG,
        
        // API
        YandexDisk: YandexDisk,
        MemberProfile: MemberProfile,
        CooperativeRegistry: CooperativeRegistry,
        DataSync: DataSync,
        Applications: Applications,
        
        // UI
        UI: MemberUI,
        
        // Публичные методы
        init: App.init.bind(App),
        login: function() {
            // Запускаем OAuth Яндекс
            const authUrl = `https://oauth.yandex.ru/authorize?` +
                `response_type=token&` +
                `client_id=${CONFIG.YANDEX_CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(CONFIG.YANDEX_REDIRECT_URI)}`;
            
            window.location.href = authUrl;
        },
        logout: function() {
            YandexDisk.clearToken();
            state.profile = null;
            state.memberships = [];
            state.applications = [];
            window.location.reload();
        },
        
        // Синхронизация
        sync: DataSync.syncWithCooperative.bind(DataSync),
        syncAll: DataSync.syncAll.bind(DataSync),
        
        // Заявления
        submitApplication: Applications.submit.bind(Applications),
        cancelApplication: Applications.cancel.bind(Applications),
        
        // Разрешение расхождений
        resolveDiscrepancy: DataSync.resolveDiscrepancy.bind(DataSync)
    };

    // ============================================
    // AUTO-INIT
    // ============================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', App.init);
    } else {
        App.init();
    }

})();
