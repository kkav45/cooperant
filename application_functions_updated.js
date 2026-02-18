// Функции для работы с заявлениями на вступление

// Стили для уменьшения шрифтов в реестре пайщиков
function applyRegistryStyles() {
    // Создаем стиль для уменьшения шрифтов в таблице реестра пайщиков
    const style = document.createElement('style');
    style.textContent = `
        #members-table th,
        #members-table td {
            font-size: 12px;
            padding: 6px 8px;
        }
        
        #members-table {
            font-size: 12px;
        }
        
        .action-button {
            font-size: 12px;
            padding: 4px 6px;
        }
    `;
    document.head.appendChild(style);
}

// Применяем стили при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRegistryStyles);
} else {
    applyRegistryStyles();
}
function loadApplicationsData() {
    const tbody = document.getElementById('applications-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    applications.forEach(app => {
        const row = document.createElement('tr');

        // Определяем статус обработки заявления
        let statusText = 'На рассмотрении';
        let statusClass = 'status-pending';
        if (app.status === 'approved') {
            statusText = 'Одобрено';
            statusClass = 'status-approved';
        } else if (app.status === 'rejected') {
            statusText = 'Отклонено';
            statusClass = 'status-rejected';
        }

        row.innerHTML = `
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${app.id}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${app.applicantName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${app.applicantContact}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${app.submissionDate}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="${statusClass}" style="padding: 4px 8px; border-radius: 4px; display: inline-block;">${statusText}</span></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; display: flex; gap: 5px; align-items: center; justify-content: center;">
                <button class="action-button" style="min-width: 36px; height: 32px; padding: 6px 8px; font-size: 12px; display: flex; align-items: center; justify-content: center; margin: 0;" onclick="viewApplication('${app.id}')">👁️</button>
                <button class="action-button edit" style="min-width: 36px; height: 32px; padding: 6px 8px; font-size: 12px; display: flex; align-items: center; justify-content: center; margin: 0;" onclick="processApplication('${app.id}')">⚙️</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function addApplication() {
    // Открываем отдельное окно/вкладку с формой заявления
    const applicationWindow = window.open('', '_blank');
    applicationWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Заявление на вступление в кооператив</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 20px; 
                    background-color: #f5f7fa;
                    color: #333;
                }
                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h2 {
                    color: #2c3e50;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 10px;
                    margin-top: 0;
                }
                .form-group { 
                    margin-bottom: 15px; 
                }
                .form-group label { 
                    display: block; 
                    margin-bottom: 5px; 
                    font-weight: 600; 
                    color: #2c3e50;
                }
                .form-group input, .form-group textarea, .form-group select { 
                    width: 100%; 
                    padding: 10px; 
                    border: 1px solid #bdc3c7; 
                    border-radius: 6px; 
                    font-size: 14px;
                    transition: border-color 0.3s;
                }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }
                .form-row { 
                    display: flex; 
                    gap: 15px; 
                }
                .form-row .form-group { 
                    flex: 1; 
                }
                .btn-container {
                    margin-top: 25px;
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                button { 
                    background-color: #3498db; 
                    color: white; 
                    padding: 12px 25px; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer; 
                    font-size: 16px;
                    font-weight: 600;
                    transition: background-color 0.3s, transform 0.2s;
                }
                button:hover { 
                    background-color: #2980b9; 
                    transform: translateY(-2px);
                }
                button[type="button"]:nth-child(2) {
                    background-color: #e74c3c;
                }
                button[type="button"]:nth-child(2):hover {
                    background-color: #c0392b;
                }
                .required { 
                    color: #e74c3c; 
                }
                .section-title {
                    background-color: #ecf0f1;
                    padding: 10px 15px;
                    border-radius: 6px;
                    margin: 20px 0 15px 0;
                    border-left: 4px solid #3498db;
                    font-weight: 600;
                    color: #2c3e50;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Заявление на вступление в потребительский кооператив</h2>
                <form id="application-form">
                    <div class="section-title">Личные данные</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicant-last-name">Фамилия <span class="required">*</span></label>
                            <input type="text" id="applicant-last-name" required>
                        </div>
                        <div class="form-group">
                            <label for="applicant-first-name">Имя <span class="required">*</span></label>
                            <input type="text" id="applicant-first-name" required>
                        </div>
                        <div class="form-group">
                            <label for="applicant-middle-name">Отчество</label>
                            <input type="text" id="applicant-middle-name">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicant-birth-date">Дата рождения</label>
                            <input type="date" id="applicant-birth-date">
                        </div>
                        <div class="form-group">
                            <label for="applicant-passport">Паспортные данные</label>
                            <input type="text" id="applicant-passport" placeholder="Серия и номер, кем и когда выдан">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="applicant-address">Адрес регистрации</label>
                        <textarea id="applicant-address" rows="2" placeholder="Полный адрес регистрации"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="applicant-residence-address">Адрес фактического проживания</label>
                        <textarea id="applicant-residence-address" rows="2" placeholder="Адрес фактического проживания"></textarea>
                    </div>

                    <div class="section-title">Контактная информация</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="applicant-phone">Контактный телефон <span class="required">*</span></label>
                            <input type="tel" id="applicant-phone" required placeholder="+7 (XXX) XXX-XX-XX">
                        </div>
                        <div class="form-group">
                            <label for="applicant-email">Email</label>
                            <input type="email" id="applicant-email" placeholder="email@example.com">
                        </div>
                    </div>

                    <div class="section-title">Финансовая информация</div>
                    <div class="form-group">
                        <label for="applicant-occupation">Род занятий / Место работы</label>
                        <input type="text" id="applicant-occupation" placeholder="Укажите род занятий или место работы">
                    </div>

                    <div class="form-group">
                        <label for="applicant-income">Источник и размер дохода</label>
                        <input type="text" id="applicant-income" placeholder="Укажите источники и примерный размер дохода">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="desired-share-amount">Желаемый размер паевого взноса (руб.) <span class="required">*</span></label>
                            <input type="number" id="desired-share-amount" required min="1" placeholder="Введите сумму">
                        </div>
                        <div class="form-group">
                            <label for="payment-method">Форма оплаты паевого взноса <span class="required">*</span></label>
                            <select id="payment-method" required>
                                <option value="">Выберите форму оплаты</option>
                                <option value="cash">Наличными деньгами</option>
                                <option value="non_cash">Безналичным переводом</option>
                                <option value="property">Иным имуществом</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group" id="property-details" style="display: none;">
                        <label for="property-description">Описание имущества (при оплате имуществом)</label>
                        <textarea id="property-description" rows="3" placeholder="Опишите имущество, которое планируете передать в качестве паевого взноса"></textarea>
                    </div>

                    <div class="section-title">Дополнительная информация</div>
                    <div class="form-group">
                        <label for="cooperative-plot">Кооперативный участок <span class="required">*</span></label>
                        <input type="text" id="cooperative-plot" required placeholder="Введите кооперативный участок">
                    </div>

                    <div class="form-group">
                        <label for="additional-info">Дополнительная информация</label>
                        <textarea id="additional-info" rows="3" placeholder="Любая дополнительная информация, которую считаете нужной сообщить"></textarea>
                    </div>

                    <div class="section-title">Согласия и подтверждения</div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="terms-agreement" required>
                            Я ознакомлен(а) с Уставом кооператива и обязуюсь его соблюдать <span class="required">*</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="personal-data-consent" required>
                            Я даю согласие на обработку моих персональных данных <span class="required">*</span>
                        </label>
                    </div>

                    <div class="btn-container">
                        <button type="button" onclick="submitApplication()">✓ Подать заявление</button>
                        <button type="button" onclick="window.close()">✗ Отмена</button>
                    </div>
                </form>
            </div>
            
            <script>
                document.getElementById('payment-method').addEventListener('change', function() {
                    const propertyDetails = document.getElementById('property-details');
                    if (this.value === 'property') {
                        propertyDetails.style.display = 'block';
                    } else {
                        propertyDetails.style.display = 'none';
                    }
                });

                function submitApplication() {
                    // Собираем данные из формы
                    const lastName = document.getElementById('applicant-last-name').value;
                    const firstName = document.getElementById('applicant-first-name').value;
                    const middleName = document.getElementById('applicant-middle-name').value;
                    const birthDate = document.getElementById('applicant-birth-date').value;
                    const passport = document.getElementById('applicant-passport').value;
                    const regAddress = document.getElementById('applicant-address').value;
                    const resAddress = document.getElementById('applicant-residence-address').value;
                    const phone = document.getElementById('applicant-phone').value;
                    const email = document.getElementById('applicant-email').value;
                    const occupation = document.getElementById('applicant-occupation').value;
                    const income = document.getElementById('applicant-income').value;
                    const shareAmount = document.getElementById('desired-share-amount').value;
                    const paymentMethod = document.getElementById('payment-method').value;
                    const propertyDesc = document.getElementById('property-description').value;
                    const cooperativePlot = document.getElementById('cooperative-plot').value;
                    const additionalInfo = document.getElementById('additional-info').value;

                    // Проверяем обязательные поля
                    if (!lastName || !firstName || !phone || !shareAmount || !paymentMethod || !cooperativePlot) {
                        alert('Пожалуйста, заполните все обязательные поля');
                        return;
                    }

                    // Проверяем согласие с условиями
                    const termsAgreement = document.getElementById('terms-agreement').checked;
                    const personalDataConsent = document.getElementById('personal-data-consent').checked;

                    if (!termsAgreement || !personalDataConsent) {
                        alert('Пожалуйста, подтвердите согласие с условиями');
                        return;
                    }

                    // Формируем объект заявления
                    const application = {
                        id: generateId(),
                        applicantName: \`\${lastName} \${firstName} \${middleName}\`.trim(),
                        applicantContact: phone + (email ? ', ' + email : ''),
                        birthDate: birthDate,
                        passport: passport,
                        registrationAddress: regAddress,
                        residenceAddress: resAddress,
                        occupation: occupation,
                        income: income,
                        desiredShareAmount: parseFloat(shareAmount),
                        paymentMethod: paymentMethod,
                        propertyDescription: propertyDesc,
                        cooperativePlot: cooperativePlot,
                        additionalInfo: additionalInfo,
                        submissionDate: new Date().toISOString().split('T')[0],
                        status: 'pending', // На рассмотрении
                        createdAt: new Date().toISOString()
                    };

                    // Отправляем данные в основное окно
                    window.opener.handleApplicationSubmission(application);
                    window.close();
                }

                function generateId() {
                    return Date.now().toString(36) + Math.random().toString(36).substr(2);
                }
            <\/script>
        </body>
        </html>
    `);
}

// Функция для генерации ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getApplicationPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Наличными деньгами',
        'non_cash': 'Безналичным переводом',
        'property': 'Иным имуществом'
    };
    return methodMap[method] || method;
}

function getApplicationStatusText(status) {
    const statusMap = {
        'pending': 'На рассмотрении',
        'approved': 'Одобрено',
        'rejected': 'Отклонено'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classMap[status] || 'status-pending';
}

function viewApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    showModal(`
        <h3 style="margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee;">Заявление на вступление #${app.id}</h3>
        <div class="application-details" style="max-height: 70vh; overflow-y: auto; padding: 10px 0;">
            <h4 style="margin: 15px 0 10px 0; color: #333; border-left: 3px solid #4CAF50; padding-left: 10px;">Личные данные</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 8px; margin-bottom: 15px;">
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>ФИО:</strong> ${app.applicantName}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Контакт:</strong> ${app.applicantContact}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Дата рождения:</strong> ${app.birthDate || 'Не указана'}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Паспорт:</strong> ${app.passport || 'Не указан'}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Адрес регистрации:</strong> ${app.registrationAddress || 'Не указан'}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Адрес проживания:</strong> ${app.residenceAddress || 'Не указан'}</p>
            </div>

            <h4 style="margin: 15px 0 10px 0; color: #333; border-left: 3px solid #2196F3; padding-left: 10px;">Дополнительная информация</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 8px; margin-bottom: 15px;">
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Род занятий:</strong> ${app.occupation || 'Не указан'}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Доход:</strong> ${app.income || 'Не указан'}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Желаемый размер паевого взноса:</strong> ${(app.desiredShareAmount || 0).toLocaleString()} ₽</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Форма оплаты:</strong> ${getApplicationPaymentMethodText(app.paymentMethod)}</p>
                ${app.propertyDescription ? \`<p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Описание имущества:</strong> \${app.propertyDescription}</p>\` : ''}
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Кооперативный участок:</strong> ${app.cooperativePlot || 'Не указан'}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Дополнительная информация:</strong> ${app.additionalInfo || 'Не указана'}</p>
            </div>

            <h4 style="margin: 15px 0 10px 0; color: #333; border-left: 3px solid #FF9800; padding-left: 10px;">Статус и дата подачи</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Дата подачи:</strong> ${app.submissionDate}</p>
                <p style="margin: 5px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;"><strong>Статус:</strong> <span class="\${getStatusClass(app.status)}" style="padding: 4px 8px; border-radius: 4px; display: inline-block;">\${getApplicationStatusText(app.status)}</span></p>
            </div>
        </div>
        <div style="margin-top: 1rem; text-align: center; padding-top: 15px; border-top: 1px solid #eee;">
            <button type="button" style="background-color: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

function processApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    showModal(`
        <h3 style="margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee; color: #333;">Обработка заявления #${app.id}</h3>
        <div class="application-processing" style="padding: 15px 0;">
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4 style="margin-top: 0; color: #333; border-left: 3px solid #2196F3; padding-left: 10px;">Информация о заявлении</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-top: 10px;">
                    <p style="margin: 5px 0; padding: 8px; background-color: white; border-radius: 4px;"><strong>Заявитель:</strong> ${app.applicantName}</p>
                    <p style="margin: 5px 0; padding: 8px; background-color: white; border-radius: 4px;"><strong>Желаемый взнос:</strong> ${(app.desiredShareAmount || 0).toLocaleString()} ₽</p>
                    <p style="margin: 5px 0; padding: 8px; background-color: white; border-radius: 4px;"><strong>Форма оплаты:</strong> ${getApplicationPaymentMethodText(app.paymentMethod)}</p>
                </div>
            </div>

            <div class="form-group" style="margin-top: 1rem; padding: 15px; background-color: #fafafa; border-radius: 8px;">
                <label for="processing-decision" style="display: block; margin-bottom: 8px; font-weight: bold;">Решение по заявлению:</label>
                <select id="processing-decision" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
                    <option value="approve">Принять в члены кооператива</option>
                    <option value="reject">Отказать во вступлении</option>
                </select>
            </div>

            <div class="form-group" style="margin-top: 1rem; padding: 15px; background-color: #fafafa; border-radius: 8px;">
                <label for="processing-notes" style="display: block; margin-bottom: 8px; font-weight: bold;">Комментарии к решению:</label>
                <textarea id="processing-notes" rows="3" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" placeholder="Укажите причины принятого решения"></textarea>
            </div>

            <div style="margin-top: 1.5rem; text-align: center; padding-top: 15px; border-top: 1px solid #eee;">
                <button type="button" style="background-color: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-size: 14px;" onclick="finalizeApplicationProcess('${app.id}')">✓ Принять решение</button>
                <button type="button" style="background-color: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;" onclick="closeModal()">Закрыть</button>
            </div>
        </div>
    `);
}

function finalizeApplicationProcess(id) {
    const decision = document.getElementById('processing-decision').value;
    const notes = document.getElementById('processing-notes').value;

    const appIndex = applications.findIndex(a => a.id === id);
    if (appIndex !== -1) {
        applications[appIndex].status = decision === 'approve' ? 'approved' : 'rejected';
        applications[appIndex].decisionNotes = notes;
        applications[appIndex].processedAt = new Date().toISOString();

        if (decision === 'approve') {
            // Создаем нового пайщика
            const newMember = {
                id: generateId(),
                name: applications[appIndex].applicantName,
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0],
                contact: applications[appIndex].applicantContact,
                address: applications[appIndex].residenceAddress || applications[appIndex].registrationAddress,
                cooperativePlot: applications[appIndex].cooperativePlot,
                notes: 'Принят по заявлению #' + applications[appIndex].id,
                createdAt: new Date().toISOString()
            };

            members.push(newMember);

            // Если был взнос, создаем запись о нем
            if (applications[appIndex].desiredShareAmount > 0) {
                const newPayment = {
                    id: generateId(),
                    memberId: newMember.id,
                    type: 'entrance', // Вступительный взнос
                    method: applications[appIndex].paymentMethod,
                    amount: applications[appIndex].desiredShareAmount,
                    propertyDescription: applications[appIndex].propertyDescription,
                    date: new Date().toISOString().split('T')[0],
                    description: 'Вступительный взнос по заявлению #' + applications[appIndex].id,
                    paid: true, // Считаем оплаченным при принятии
                    documentNumber: 'Вст-' + new Date().getTime(),
                    createdAt: new Date().toISOString()
                };

                payments.push(newPayment);

                // Создаем бухгалтерскую проводку
                createAccountingEntryForPayment(newPayment);
            }
        }

        loadApplicationsData();
        if (typeof loadMembersData === 'function') loadMembersData();
        if (typeof loadPaymentsData === 'function') loadPaymentsData();
        updateDashboardStats();
        saveData();

        closeModal();
        alert('Решение по заявлению принято и оформлено');
    }
}

function getApplicationPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Наличными деньгами',
        'non_cash': 'Безналичным переводом',
        'property': 'Иным имуществом'
    };
    return methodMap[method] || method;
}

function getApplicationStatusText(status) {
    const statusMap = {
        'pending': 'На рассмотрении',
        'approved': 'Одобрено',
        'rejected': 'Отклонено'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classMap[status] || 'status-pending';
}

// Функция для возврата паевого взноса
function returnSharePayment(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        alert('Пайщик не найден');
        return;
    }

    // Проверяем, есть ли у пайщика неоплаченные взносы
    const unpaidPayments = payments.filter(p => p.memberId === memberId && !p.paid && p.type !== 'return_share');
    if (unpaidPayments.length > 0) {
        alert('Невозможно вернуть паевой взнос пайщику с неоплаченными взносами. Сначала погасите задолженность.');
        return;
    }

    // Получаем все оплаченные паевые взносы пайщика
    const sharePayments = payments.filter(p => p.memberId === memberId && p.paid && 
        (p.type === 'share' || p.type === 'entrance' || p.type === 'voluntary_share'));

    if (sharePayments.length === 0) {
        alert('У пайщика нет оплаченных паевых взносов для возврата');
        return;
    }

    // Рассчитываем общую сумму для возврата
    const totalReturnAmount = sharePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    // Показываем модальное окно для подтверждения возврата
    showModal(`
        <h3>Возврат паевого взноса пайщику: ${member.name}</h3>
        <div class="return-payment-form">
            <p><strong>Пайщик:</strong> ${member.name}</p>
            <p><strong>Общая сумма для возврата:</strong> ${totalReturnAmount.toLocaleString()} ₽</p>
            
            <div class="form-group">
                <label for="return-payment-type">Тип возврата:</label>
                <select id="return-payment-type" required>
                    <option value="cash">Наличными</option>
                    <option value="non_cash">Безналичными</option>
                    <option value="property">Имуществом</option>
                </select>
            </div>
            
            <div class="form-group" id="return-amount-field">
                <label for="return-payment-amount">Сумма возврата:</label>
                <input type="number" id="return-payment-amount" value="${totalReturnAmount}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group" id="return-property-details" style="display:none;">
                <label for="return-property-desc">Описание возвращаемого имущества:</label>
                <textarea id="return-property-desc" rows="3" placeholder="Опишите имущество, возвращаемое пайщику"></textarea>
            </div>
            
            <div class="form-group">
                <label for="return-payment-date">Дата возврата:</label>
                <input type="date" id="return-payment-date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            
            <div class="form-group">
                <label for="return-description">Основание для возврата:</label>
                <textarea id="return-description" rows="3" placeholder="Укажите основание для возврата паевого взноса">Возврат паевого взноса при выбытии пайщика</textarea>
            </div>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button type="button" class="action-button save" onclick="processReturnPayment('${memberId}', '${totalReturnAmount}')">Оформить возврат</button>
                <button type="button" class="action-button cancel" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);

    // Добавляем обработчик изменения типа возврата
    document.getElementById('return-payment-type').addEventListener('change', function() {
        const propertyDetails = document.getElementById('return-property-details');
        const amountField = document.getElementById('return-amount-field');
        
        if (this.value === 'property') {
            propertyDetails.style.display = 'block';
            amountField.style.display = 'none';
        } else {
            propertyDetails.style.display = 'none';
            amountField.style.display = 'block';
        }
    });
}

// Функция обработки возврата паевого взноса
function processReturnPayment(memberId, totalAmount) {
    const returnPaymentType = document.getElementById('return-payment-type').value;
    const returnAmount = parseFloat(document.getElementById('return-payment-amount').value) || 0;
    const returnPropertyDesc = document.getElementById('return-property-desc')?.value || '';
    const returnDate = document.getElementById('return-payment-date').value;
    const returnDescription = document.getElementById('return-description').value;

    if (returnPaymentType === 'property' && !returnPropertyDesc.trim()) {
        alert('Пожалуйста, укажите описание возвращаемого имущества');
        return;
    }

    if ((returnPaymentType !== 'property' && returnAmount <= 0) || 
        (returnPaymentType === 'property' && !returnPropertyDesc.trim())) {
        alert('Пожалуйста, укажите корректные данные для возврата');
        return;
    }

    // Создаем запись о возврате паевого взноса
    const returnPayment = {
        id: generateId(),
        memberId: memberId,
        type: 'return_share', // Тип - возврат паевого взноса
        method: returnPaymentType,
        amount: returnPaymentType !== 'property' ? returnAmount : 0,
        propertyDescription: returnPropertyDesc,
        date: returnDate,
        description: returnDescription,
        paid: true, // Возврат считается выполненным
        documentNumber: 'Возв-' + new Date().getTime(),
        createdAt: new Date().toISOString()
    };

    // Добавляем возврат в массив платежей
    payments.push(returnPayment);

    // Обновляем статус пайщика на "выбыл"
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
        members[memberIndex].status = 'withdrawn';
        members[memberIndex].withdrawalDate = returnDate;
    }

    // Создаем бухгалтерскую запись для возврата
    createAccountingEntryForReturn(returnPayment);

    // Сохраняем данные
    saveData();

    // Закрываем модальное окно
    closeModal();

    // Обновляем отображение
    if (typeof loadPaymentsData === 'function') loadPaymentsData();
    if (typeof loadMembersData === 'function') loadMembersData();
    updateDashboardStats();

    alert('Пайщик успешно выбыл, возврат паевого взноса оформлен');
}

// Функция создания бухгалтерской записи для возврата
function createAccountingEntryForReturn(returnPayment) {
    // Находим пайщика
    const member = members.find(m => m.id === returnPayment.memberId);
    if (!member) return;

    // Создаем бухгалтерскую проводку для возврата
    // Дебет 50 (51, 76) Кредит 75 - Возврат паевого взноса участнику
    const accountingEntry = {
        id: generateId(),
        date: returnPayment.date,
        debitAccount: returnPayment.method === 'cash' ? '50' : (returnPayment.method === 'property' ? '76' : '51'),
        creditAccount: '75',
        amount: returnPayment.method !== 'property' ? returnPayment.amount : 0,
        propertyDescription: returnPayment.method === 'property' ? returnPayment.propertyDescription : '',
        description: `Возврат паевого взноса пайщику ${member.name}`,
        documentNumber: returnPayment.documentNumber,
        createdAt: new Date().toISOString()
    };

    // Добавляем проводку в массив транзакций
    if (!window.transactions) window.transactions = [];
    transactions.push(accountingEntry);
}

// Функция для получения текстового описания типа взноса, включая возврат
function getExtendedPaymentTypeText(type) {
    const typeMap = {
        'entrance': 'Вступительный взнос',
        'share': 'Паевой взнос',
        'voluntary_share': 'Добровольный паевой взнос',
        'membership': 'Членский взнос',
        'targeted': 'Целевой взнос',
        'return_share': 'Возврат паевого взноса'
    };
    return typeMap[type] || type;
}

// Функция для возврата паевого взноса (для вызова из других частей приложения)
function initiateReturnPayment(memberId) {
    // Эта функция будет вызывать соответствующую функцию в основном приложении
    if (typeof returnSharePayment === 'function') {
        returnSharePayment(memberId);
    } else {
        alert('Функция возврата взносов недоступна. Обратитесь к разработчику.');
    }
}