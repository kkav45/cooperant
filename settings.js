// ==================== ФУНКЦИИ НАСТРОЕК КООПЕРАТИВА ====================
// Файл: settings.js
// Версия: 1.0
// Дата: 17 февраля 2026

// ==================== ОБЩАЯ ИНФОРМАЦИЯ ====================

function showGeneralSettings() {
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">📋 Общая информация о кооперативе</h3>
            <form id="general-settings-form" onsubmit="saveGeneralSettings(event)">
                <div class="form-section">
                    <h4>Наименование</h4>
                    <div class="form-group">
                        <label for="fullName">Полное наименование</label>
                        <input type="text" id="fullName" value="${cooperativeSettings.fullName || ''}" placeholder="Потребительский кооператив «Название»">
                    </div>
                    <div class="form-group">
                        <label for="shortName">Краткое наименование</label>
                        <input type="text" id="shortName" value="${cooperativeSettings.shortName || ''}" placeholder="ПК «Название»">
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>Идентификаторы</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="inn">ИНН</label>
                            <input type="text" id="inn" value="${cooperativeSettings.inn || ''}" placeholder="10 цифр" maxlength="10">
                        </div>
                        <div class="form-group">
                            <label for="kpp">КПП</label>
                            <input type="text" id="kpp" value="${cooperativeSettings.kpp || ''}" placeholder="9 цифр" maxlength="9">
                        </div>
                        <div class="form-group">
                            <label for="ogrn">ОГРН</label>
                            <input type="text" id="ogrn" value="${cooperativeSettings.ogrn || ''}" placeholder="13 цифр" maxlength="13">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>Адреса</h4>
                    <div class="form-group">
                        <label for="legalAddress">Юридический адрес</label>
                        <input type="text" id="legalAddress" value="${cooperativeSettings.legalAddress || ''}" placeholder="г. Москва, ул. Примерная, д. 1">
                    </div>
                    <div class="form-group">
                        <label for="postalAddress">Почтовый адрес</label>
                        <input type="text" id="postalAddress" value="${cooperativeSettings.postalAddress || ''}" placeholder="г. Москва, ул. Примерная, д. 1">
                    </div>
                    <div class="form-group">
                        <label for="actualAddress">Фактический адрес</label>
                        <input type="text" id="actualAddress" value="${cooperativeSettings.actualAddress || ''}" placeholder="г. Москва, ул. Примерная, д. 1">
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>Контакты</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="phone">Телефон</label>
                            <input type="tel" id="phone" value="${cooperativeSettings.phone || ''}" placeholder="+7 (___) ___-__-__">
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${cooperativeSettings.email || ''}" placeholder="info@coop.ru">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="website">Сайт</label>
                        <input type="url" id="website" value="${cooperativeSettings.website || ''}" placeholder="https://coop.ru">
                    </div>
                </div>
                
                <div style="margin-top:20px;display:flex;gap:10px">
                    <button type="submit" class="action-button save">💾 Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Общая информация', content);
}

function saveGeneralSettings(event) {
    event.preventDefault();
    
    cooperativeSettings.fullName = document.getElementById('fullName').value;
    cooperativeSettings.shortName = document.getElementById('shortName').value;
    cooperativeSettings.inn = document.getElementById('inn').value;
    cooperativeSettings.kpp = document.getElementById('kpp').value;
    cooperativeSettings.ogrn = document.getElementById('ogrn').value;
    cooperativeSettings.legalAddress = document.getElementById('legalAddress').value;
    cooperativeSettings.postalAddress = document.getElementById('postalAddress').value;
    cooperativeSettings.actualAddress = document.getElementById('actualAddress').value;
    cooperativeSettings.phone = document.getElementById('phone').value;
    cooperativeSettings.email = document.getElementById('email').value;
    cooperativeSettings.website = document.getElementById('website').value;
    
    // Сохраняем в localStorage
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    
    alert('✅ Общая информация сохранена');
    closeSideMenu();
}

// ==================== ФИЛИАЛЫ ====================

function showBranchesSettings() {
    const branches = cooperativeSettings.branches || [];
    
    let branchesHtml = branches.map((b, index) => `
        <div style="padding:15px;background:#f5f7fa;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
            <div>
                <div style="font-weight:600">${b.name || 'Филиал ' + (index + 1)}</div>
                <div style="font-size:12px;color:#666">${b.address || 'Адрес не указан'}</div>
            </div>
            <button onclick="deleteBranch(${index})" style="background:#ffebee;color:#c62828;border:none;padding:8px 12px;border-radius:4px;cursor:pointer">🗑️</button>
        </div>
    `).join('');
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">📍 Филиалы и представительства</h3>
            
            <div id="branches-list" style="margin-bottom:20px">
                ${branchesHtml || '<p style="color:#666;text-align:center;padding:20px">Филиалы не добавлены</p>'}
            </div>
            
            <button onclick="showAddBranchForm()" style="width:100%;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">➕ Добавить филиал</button>
        </div>
    `;
    
    showInSideMenu('Филиалы', content);
}

function showAddBranchForm() {
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">➕ Добавление филиала</h3>
            <form onsubmit="addBranch(event)">
                <div class="form-group">
                    <label for="branchName">Наименование филиала</label>
                    <input type="text" id="branchName" required placeholder="Например: Московский филиал">
                </div>
                <div class="form-group">
                    <label for="branchAddress">Адрес филиала</label>
                    <input type="text" id="branchAddress" required placeholder="г. Москва, ул. Примерная, д. 1">
                </div>
                <div class="form-group">
                    <label for="branchPhone">Телефон</label>
                    <input type="tel" id="branchPhone" placeholder="+7 (___) ___-__-__">
                </div>
                <div class="form-group">
                    <label for="branchEmail">Email</label>
                    <input type="email" id="branchEmail" placeholder="branch@coop.ru">
                </div>
                <div style="margin-top:20px;display:flex;gap:10px">
                    <button type="submit" class="action-button save">💾 Сохранить</button>
                    <button type="button" class="action-button cancel" onclick="showBranchesSettings()">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Добавление филиала', content);
}

function addBranch(event) {
    event.preventDefault();
    
    const branch = {
        id: generateId(),
        name: document.getElementById('branchName').value,
        address: document.getElementById('branchAddress').value,
        phone: document.getElementById('branchPhone').value,
        email: document.getElementById('branchEmail').value
    };
    
    if (!cooperativeSettings.branches) {
        cooperativeSettings.branches = [];
    }
    cooperativeSettings.branches.push(branch);
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    
    alert('✅ Филиал добавлен');
    showBranchesSettings();
}

function deleteBranch(index) {
    if (confirm('Вы уверены, что хотите удалить этот филиал?')) {
        cooperativeSettings.branches.splice(index, 1);
        localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
        showBranchesSettings();
    }
}

// ==================== ОРГАНЫ УПРАВЛЕНИЯ ====================

function showCouncilSettings() {
    const council = cooperativeSettings.council || { chairman: {}, secretary: {}, members: [] };
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">🏛️ Совет кооператива</h3>
            
            <div class="form-section">
                <h4>Председатель совета</h4>
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" id="councilChairmanName" value="${council.chairman.name || ''}" placeholder="Иванов Иван Иванович">
                </div>
                <div class="form-group">
                    <label>Телефон</label>
                    <input type="tel" id="councilChairmanPhone" value="${council.chairman.phone || ''}" placeholder="+7 (___) ___-__-__">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="councilChairmanEmail" value="${council.chairman.email || ''}" placeholder="chairman@coop.ru">
                </div>
            </div>
            
            <div class="form-section">
                <h4>Секретарь совета</h4>
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" id="councilSecretaryName" value="${council.secretary.name || ''}" placeholder="Петрова Мария Сергеевна">
                </div>
                <div class="form-group">
                    <label>Телефон</label>
                    <input type="tel" id="councilSecretaryPhone" value="${council.secretary.phone || ''}" placeholder="+7 (___) ___-__-__">
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveCouncilSettings()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Совет кооператива', content);
}

function saveCouncilSettings() {
    if (!cooperativeSettings.council) {
        cooperativeSettings.council = {};
    }
    
    cooperativeSettings.council.chairman = {
        name: document.getElementById('councilChairmanName').value,
        phone: document.getElementById('councilChairmanPhone').value,
        email: document.getElementById('councilChairmanEmail').value
    };
    
    cooperativeSettings.council.secretary = {
        name: document.getElementById('councilSecretaryName').value,
        phone: document.getElementById('councilSecretaryPhone').value
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Данные совета сохранены');
    closeSideMenu();
}

function showBoardSettings() {
    const board = cooperativeSettings.board || { chairman: {}, secretary: {}, members: [] };
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">📋 Правление кооператива</h3>
            
            <div class="form-section">
                <h4>Председатель правления</h4>
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" id="boardChairmanName" value="${board.chairman.name || ''}" placeholder="Иванов Иван Иванович">
                </div>
                <div class="form-group">
                    <label>Телефон</label>
                    <input type="tel" id="boardChairmanPhone" value="${board.chairman.phone || ''}" placeholder="+7 (___) ___-__-__">
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveBoardSettings()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Правление', content);
}

function saveBoardSettings() {
    if (!cooperativeSettings.board) {
        cooperativeSettings.board = {};
    }
    
    cooperativeSettings.board.chairman = {
        name: document.getElementById('boardChairmanName').value,
        phone: document.getElementById('boardChairmanPhone').value
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Данные правления сохранены');
    closeSideMenu();
}

function showChairmanSettings() {
    // Председатель кооператива (общая информация)
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">👔 Председатель кооператива</h3>
            <div class="form-section">
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" id="chairmanName" value="${cooperativeSettings.council?.chairman?.name || ''}" placeholder="Иванов Иван Иванович">
                </div>
                <div class="form-group">
                    <label>Телефон</label>
                    <input type="tel" id="chairmanPhone" value="${cooperativeSettings.council?.chairman?.phone || ''}" placeholder="+7 (___) ___-__-__">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="chairmanEmail" value="${cooperativeSettings.council?.chairman?.email || ''}" placeholder="chairman@coop.ru">
                </div>
            </div>
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveChairmanSettings()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Председатель', content);
}

function saveChairmanSettings() {
    if (!cooperativeSettings.council) {
        cooperativeSettings.council = {};
    }
    if (!cooperativeSettings.council.chairman) {
        cooperativeSettings.council.chairman = {};
    }
    
    cooperativeSettings.council.chairman = {
        name: document.getElementById('chairmanName').value,
        phone: document.getElementById('chairmanPhone').value,
        email: document.getElementById('chairmanEmail').value
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Данные председателя сохранены');
    closeSideMenu();
}

// ==================== РЕВИЗИОННАЯ КОМИССИЯ ====================

function showSupervisionSettings() {
    const supervision = cooperativeSettings.supervision || { type: 'revizor', chairman: {}, members: [] };
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">👁️ Ревизионная комиссия</h3>
            
            <div class="form-group">
                <label for="supervisionType">Тип контроля</label>
                <select id="supervisionType" onchange="updateSupervisionForm()">
                    <option value="revizor" ${supervision.type === 'revizor' ? 'selected' : ''}>Ревизор</option>
                    <option value="commission" ${supervision.type === 'commission' ? 'selected' : ''}>Ревизионная комиссия</option>
                </select>
            </div>
            
            <div class="form-section">
                <h4>Председатель ревизионной комиссии / Ревизор</h4>
                <div class="form-group">
                    <label>ФИО</label>
                    <input type="text" id="supervisionChairmanName" value="${supervision.chairman.name || ''}" placeholder="Иванов Иван Иванович">
                </div>
                <div class="form-group">
                    <label>Телефон</label>
                    <input type="tel" id="supervisionChairmanPhone" value="${supervision.chairman.phone || ''}" placeholder="+7 (___) ___-__-__">
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveSupervisionSettings()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Ревизионная комиссия', content);
}

function saveSupervisionSettings() {
    if (!cooperativeSettings.supervision) {
        cooperativeSettings.supervision = {};
    }
    
    cooperativeSettings.supervision.type = document.getElementById('supervisionType').value;
    cooperativeSettings.supervision.chairman = {
        name: document.getElementById('supervisionChairmanName').value,
        phone: document.getElementById('supervisionChairmanPhone').value
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Данные ревизионной комиссии сохранены');
    closeSideMenu();
}

// ==================== ВЗНОСЫ И ФОНДЫ ====================

function showContributionTypesSettings() {
    const types = cooperativeSettings.contributionTypes || {};
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">💵 Виды и размеры взносов</h3>
            
            <div class="form-section">
                <h4>Вступительный взнос</h4>
                <div class="form-group">
                    <label>Минимальная сумма (₽)</label>
                    <input type="number" id="entranceAmount" value="${types.entrance?.minAmount || 0}" min="0">
                </div>
            </div>
            
            <div class="form-section">
                <h4>Паевой взнос</h4>
                <div class="form-group">
                    <label>Минимальная сумма (₽)</label>
                    <input type="number" id="shareAmount" value="${types.share?.minAmount || 0}" min="0">
                </div>
            </div>
            
            <div class="form-section">
                <h4>Членский взнос</h4>
                <div class="form-group">
                    <label>Минимальная сумма (₽)</label>
                    <input type="number" id="membershipAmount" value="${types.membership?.minAmount || 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Периодичность</label>
                    <select id="membershipPeriod">
                        <option value="monthly" ${types.membership?.period === 'monthly' ? 'selected' : ''}>Ежемесячно</option>
                        <option value="quarterly" ${types.membership?.period === 'quarterly' ? 'selected' : ''}>Ежеквартально</option>
                        <option value="yearly" ${types.membership?.period === 'yearly' ? 'selected' : ''}>Ежегодно</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveContributionTypes()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Виды взносов', content);
}

function saveContributionTypes() {
    cooperativeSettings.contributionTypes = {
        entrance: {
            name: 'Вступительный',
            minAmount: parseFloat(document.getElementById('entranceAmount').value) || 0,
            required: true
        },
        share: {
            name: 'Паевой',
            minAmount: parseFloat(document.getElementById('shareAmount').value) || 0,
            required: true
        },
        membership: {
            name: 'Членский',
            minAmount: parseFloat(document.getElementById('membershipAmount').value) || 0,
            period: document.getElementById('membershipPeriod').value,
            required: true
        },
        voluntary: { name: 'Добровольный', minAmount: 0, required: false },
        targeted: { name: 'Целевой', minAmount: 0, required: false }
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Виды взносов сохранены');
    closeSideMenu();
}

function showFundDistributionSettings() {
    const distribution = cooperativeSettings.fundDistribution || {};
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">📊 Распределение членских взносов (%)</h3>
            
            <div class="form-section">
                <div class="form-group">
                    <label>Резервный фонд (%)</label>
                    <input type="number" id="reservePercent" value="${distribution.reserve || 0}" min="0" max="100">
                </div>
                <div class="form-group">
                    <label>Фонд развития (%)</label>
                    <input type="number" id="developmentPercent" value="${distribution.development || 0}" min="0" max="100">
                </div>
                <div class="form-group">
                    <label>Фонд хоз. деятельности (%)</label>
                    <input type="number" id="businessPercent" value="${distribution.business || 0}" min="0" max="100">
                </div>
                <div class="form-group">
                    <label>Неделимый фонд (%)</label>
                    <input type="number" id="indivisiblePercent" value="${distribution.indivisible || 0}" min="0" max="100">
                </div>
            </div>
            
            <div style="padding:15px;background:#e3f2fd;border-radius:8px;margin-bottom:20px">
                <div style="font-size:14px;color:#1976d2">Сумма процентов: <strong id="totalPercent">0</strong>%</div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveFundDistribution()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Распределение взносов', content);
    
    // Обновляем сумму процентов
    updateTotalPercent();
}

function saveFundDistribution() {
    cooperativeSettings.fundDistribution = {
        type: 'percent',
        reserve: parseFloat(document.getElementById('reservePercent').value) || 0,
        development: parseFloat(document.getElementById('developmentPercent').value) || 0,
        business: parseFloat(document.getElementById('businessPercent').value) || 0,
        indivisible: parseFloat(document.getElementById('indivisiblePercent').value) || 0
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Распределение взносов сохранено');
    closeSideMenu();
}

function updateTotalPercent() {
    const total = (parseFloat(document.getElementById('reservePercent').value) || 0) +
                  (parseFloat(document.getElementById('developmentPercent').value) || 0) +
                  (parseFloat(document.getElementById('businessPercent').value) || 0) +
                  (parseFloat(document.getElementById('indivisiblePercent').value) || 0);
    
    const totalElement = document.getElementById('totalPercent');
    if (totalElement) {
        totalElement.textContent = total;
        if (total !== 100) {
            totalElement.style.color = '#c62828';
        } else {
            totalElement.style.color = '#2e7d32';
        }
    }
}

// ==================== НАЛОГООБЛОЖЕНИЕ ====================

function showTaxSystemSettings() {
    const currentTax = cooperativeSettings.taxSystem || 'USN_6';
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">📈 Система налогообложения</h3>
            
            <div class="form-section">
                <div class="form-group">
                    <label for="taxSystem">Выберите систему налогообложения</label>
                    <select id="taxSystem" onchange="updateTaxDescription()">
                        <option value="USN_6" ${currentTax === 'USN_6' ? 'selected' : ''}>УСН "Доходы" (6%)</option>
                        <option value="USN_15" ${currentTax === 'USN_15' ? 'selected' : ''}>УСН "Доходы-Расходы" (15%)</option>
                        <option value="OSNO" ${currentTax === 'OSNO' ? 'selected' : ''}>ОСНО (Общая система)</option>
                    </select>
                </div>
                
                <div id="taxDescription" style="padding:15px;background:#f5f7fa;border-radius:8px;margin-top:15px">
                    ${getTaxDescription(currentTax)}
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveTaxSystem()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Система налогообложения', content);
}

function getTaxDescription(taxSystem) {
    const descriptions = {
        'USN_6': '<strong>УСН "Доходы" (6%)</strong><br>Налог уплачивается со всех доходов. Расходы не учитываются. Подходит для кооперативов с небольшими расходами.',
        'USN_15': '<strong>УСН "Доходы-Расходы" (15%)</strong><br>Налог уплачивается с разницы между доходами и расходами. Выгодно при больших расходах.',
        'OSNO': '<strong>ОСНО (Общая система)</strong><br>Полная система налогообложения с НДС. Требует полноценного бухгалтерского учёта.'
    };
    return descriptions[taxSystem] || '';
}

function updateTaxDescription() {
    const taxSystem = document.getElementById('taxSystem').value;
    document.getElementById('taxDescription').innerHTML = getTaxDescription(taxSystem);
}

function saveTaxSystem() {
    cooperativeSettings.taxSystem = document.getElementById('taxSystem').value;
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Система налогообложения сохранена');
    closeSideMenu();
}

// ==================== УЧЁТНАЯ ПОЛИТИКА ====================

function showAccountingPolicySettings() {
    const policy = cooperativeSettings.accountingPolicy || {};
    
    const content = `
        <div class="settings-form">
            <h3 style="margin-bottom:20px">📖 Учётная политика</h3>
            
            <div class="form-section">
                <div class="form-group">
                    <label>Валюта учёта</label>
                    <select id="currency">
                        <option value="RUB" ${(policy.currency || 'RUB') === 'RUB' ? 'selected' : ''}>RUB (Российский рубль)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Начало финансового года</label>
                    <input type="text" id="fiscalYearStart" value="${policy.fiscalYearStart || '01-01'}" placeholder="ММ-ДД" maxlength="5">
                </div>
                <div class="form-group">
                    <label>Лимит основных средств (₽)</label>
                    <input type="number" id="fixedAssetLimit" value="${policy.fixedAssetLimit || 100000}" min="0">
                </div>
                <div class="form-group">
                    <label>Периодичность инвентаризации</label>
                    <select id="inventoryFrequency">
                        <option value="monthly" ${policy.inventoryFrequency === 'monthly' ? 'selected' : ''}>Ежемесячно</option>
                        <option value="quarterly" ${policy.inventoryFrequency === 'quarterly' ? 'selected' : ''}>Ежеквартально</option>
                        <option value="yearly" ${policy.inventoryFrequency === 'yearly' ? 'selected' : ''}>Ежегодно</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-top:20px;display:flex;gap:10px">
                <button onclick="saveAccountingPolicy()" class="action-button save">💾 Сохранить</button>
                <button type="button" class="action-button cancel" onclick="closeSideMenu()">Отмена</button>
            </div>
        </div>
    `;
    
    showInSideMenu('Учётная политика', content);
}

function saveAccountingPolicy() {
    cooperativeSettings.accountingPolicy = {
        currency: document.getElementById('currency').value,
        fiscalYearStart: document.getElementById('fiscalYearStart').value,
        fixedAssetLimit: parseFloat(document.getElementById('fixedAssetLimit').value) || 100000,
        inventoryFrequency: document.getElementById('inventoryFrequency').value
    };
    
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    alert('✅ Учётная политика сохранена');
    closeSideMenu();
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function closeSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu) {
        sideMenu.classList.remove('active');
    }
    const overlay = document.querySelector('.side-menu-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Загрузка настроек из localStorage
function loadCooperativeSettings() {
    const saved = localStorage.getItem('coop_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            // Объединяем с настройками по умолчанию
            cooperativeSettings = { ...cooperativeSettings, ...settings };
            console.log('✅ Настройки кооператива загружены');
        } catch (e) {
            console.error('❌ Ошибка загрузки настроек:', e);
        }
    }
}

// Сохранение настроек в localStorage
function saveCooperativeSettings() {
    localStorage.setItem('coop_settings', JSON.stringify(cooperativeSettings));
    console.log('✅ Настройки кооператива сохранены');
}

// Загружаем настройки при инициализации
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', loadCooperativeSettings);
}

console.log('✅ Settings.js загружен');
