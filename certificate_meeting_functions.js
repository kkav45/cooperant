// Функции для работы с удостоверениями пайщиков
function generateCertificate(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // Создаем удостоверение
    const certificate = {
        id: generateId(),
        memberId: memberId,
        memberName: member.name,
        issueDate: new Date().toISOString().split('T')[0],
        certificateNumber: generateCertificateNumber(),
        status: 'active',
        issuedBy: '', // Будет заполнено при формировании
        createdAt: new Date().toISOString()
    };
    
    certificates.push(certificate);
    saveData();
    
    // Показываем удостоверение
    showCertificate(certificate);
}

function generateCertificateNumber() {
    // Генерируем номер удостоверения (например, УД-ГГГГ-Номер)
    const year = new Date().getFullYear().toString().slice(-2);
    const count = certificates.filter(c => c.certificateNumber.startsWith(`УД-${year}`)).length + 1;
    return `УД-${year}-${count.toString().padStart(4, '0')}`;
}

function showCertificate(certificate) {
    // В реальной системе это будет генерация PDF, но для демонстрации покажем в модальном окне
    showModal(`
        <div style="font-family: Arial, serif; padding: 20px; border: 2px solid #000; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">УДОСТОВЕРЕНИЕ</h2>
                <p style="margin: 5px 0;">члена потребительского кооператива</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>${certificate.memberName}</strong></p>
                <p style="margin: 10px 0;">выдано: ${certificate.issueDate}</p>
                <p style="margin: 10px 0;">№ ${certificate.certificateNumber}</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <p style="margin: 10px 0;">Подпись _________________________</p>
                <p style="margin: 10px 0;">Печать</p>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button type="button" onclick="exportCertificateAsPDF('${certificate.id}')">Сохранить как PDF</button>
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

function exportCertificateAsPDF(certificateId) {
    // В реальной системе здесь будет генерация PDF
    // Для демонстрации покажем сообщение
    alert('В реальной системе удостоверение было бы экспортировано в формате PDF. Для этого потребуется библиотека jsPDF или аналогичная.');
}

// Функции для работы с заседаниями и протоколами
function scheduleMeeting() {
    showModal(`
        <h3>Назначить заседание</h3>
        <form id="meeting-form">
            <div class="form-group">
                <label for="meeting-date">Дата заседания *</label>
                <input type="date" id="meeting-date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label for="meeting-time">Время заседания</label>
                <input type="time" id="meeting-time" value="10:00">
            </div>
            <div class="form-group">
                <label for="meeting-place">Место проведения</label>
                <input type="text" id="meeting-place" placeholder="Адрес или название помещения">
            </div>
            <div class="form-group">
                <label for="meeting-type">Тип заседания</label>
                <select id="meeting-type">
                    <option value="board">Заседание правления</option>
                    <option value="general">Общее собрание</option>
                    <option value="committee">Заседание комитета</option>
                    <option value="other">Прочее</option>
                </select>
            </div>
            <div class="form-group">
                <label for="meeting-topic">Тема заседания</label>
                <input type="text" id="meeting-topic" placeholder="Краткое описание темы заседания">
            </div>
            <div class="form-group">
                <label for="meeting-description">Повестка дня</label>
                <textarea id="meeting-description" rows="4" placeholder="Подробное описание вопросов, выносимых на заседание"></textarea>
            </div>
            <div style="margin-top: 1rem; text-align: center;">
                <button type="button" onclick="createMeeting()">Создать заседание</button>
                <button type="button" onclick="closeModal()">Отмена</button>
            </div>
        </form>
    `);
}

function createMeeting() {
    const date = document.getElementById('meeting-date').value;
    const time = document.getElementById('meeting-time').value;
    const place = document.getElementById('meeting-place').value;
    const type = document.getElementById('meeting-type').value;
    const topic = document.getElementById('meeting-topic').value;
    const description = document.getElementById('meeting-description').value;
    
    const meeting = {
        id: generateId(),
        date: date,
        time: time,
        place: place,
        type: type,
        topic: topic,
        agenda: description,
        status: 'scheduled', // Запланировано
        attendees: [], // Участники
        decisions: [], // Принятые решения
        createdAt: new Date().toISOString()
    };
    
    meetings.push(meeting);
    closeModal();
    loadMeetingsData();
    saveData();
    alert('Заседание успешно запланировано');
}

function conductMeeting(id) {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;
    
    // Показываем форму для проведения заседания
    showModal(`
        <h3>Проведение заседания #${meeting.id}</h3>
        <div class="meeting-conduct">
            <h4>Информация о заседании</h4>
            <p><strong>Дата:</strong> ${meeting.date}</p>
            <p><strong>Время:</strong> ${meeting.time}</p>
            <p><strong>Место:</strong> ${meeting.place || 'Не указано'}</p>
            <p><strong>Тип:</strong> ${getMeetingTypeText(meeting.type)}</p>
            <p><strong>Тема:</strong> ${meeting.topic || 'Не указана'}</p>
            
            <h4>Присутствующие</h4>
            <div id="attendees-list">
                <!-- Список участников будет загружен здесь -->
            </div>
            <button type="button" onclick="addAttendeeToMeeting('${meeting.id}')">Добавить участника</button>
            
            <h4>Принятые решения</h4>
            <div id="decisions-list">
                <!-- Список решений будет загружен здесь -->
            </div>
            <button type="button" onclick="addDecisionToMeeting('${meeting.id}')">Добавить решение</button>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button type="button" onclick="finalizeMeeting('${meeting.id}')">Завершить заседание</button>
                <button type="button" onclick="closeModal()">Отмена</button>
            </div>
        </div>
    `);
    
    // Загружаем участников и решения
    loadMeetingAttendeesAndDecisions(meeting.id);
}

function loadMeetingAttendeesAndDecisions(meetingId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    // Загружаем участников
    const attendeesList = document.getElementById('attendees-list');
    if (meeting.attendees && meeting.attendees.length > 0) {
        attendeesList.innerHTML = '<ul>' + meeting.attendees.map(attendee => 
            `<li>${attendee.name} (${attendee.position || 'Участник'}) 
            <button onclick="removeAttendeeFromMeeting('${meetingId}', '${attendee.id}')" class="action-button delete" style="padding: 2px 5px; font-size: 12px;">Удалить</button>
            </li>`
        ).join('') + '</ul>';
    } else {
        attendeesList.innerHTML = '<p>Нет добавленных участников</p>';
    }
    
    // Загружаем решения
    const decisionsList = document.getElementById('decisions-list');
    if (meeting.decisions && meeting.decisions.length > 0) {
        decisionsList.innerHTML = '<ul>' + meeting.decisions.map(decision => 
            `<li><strong>${decision.title}</strong>: ${decision.content} 
            <button onclick="removeDecisionFromMeeting('${meetingId}', '${decision.id}')" class="action-button delete" style="padding: 2px 5px; font-size: 12px;">Удалить</button>
            </li>`
        ).join('') + '</ul>';
    } else {
        decisionsList.innerHTML = '<p>Нет принятых решений</p>';
    }
}

function addAttendeeToMeeting(meetingId) {
    showModal(`
        <h3>Добавить участника заседания</h3>
        <div class="form-group">
            <label for="attendee-name">ФИО участника *</label>
            <input type="text" id="attendee-name" placeholder="Фамилия Имя Отчество" required>
        </div>
        <div class="form-group">
            <label for="attendee-position">Должность/Статус</label>
            <input type="text" id="attendee-position" placeholder="Должность или статус участника">
        </div>
        <div class="form-group">
            <label for="attendee-role">Роль на заседании</label>
            <select id="attendee-role">
                <option value="member">Член кооператива</option>
                <option value="observer">Наблюдатель</option>
                <option value="guest">Гость</option>
                <option value="chairman">Председатель</option>
                <option value="secretary">Секретарь</option>
            </select>
        </div>
        <div style="margin-top: 1rem; text-align: center;">
            <button type="button" onclick="saveAttendeeToMeeting('${meetingId}')">Добавить участника</button>
            <button type="button" onclick="closeModal()">Отмена</button>
        </div>
    `);
}

function saveAttendeeToMeeting(meetingId) {
    const name = document.getElementById('attendee-name').value;
    const position = document.getElementById('attendee-position').value;
    const role = document.getElementById('attendee-role').value;
    
    if (!name) {
        alert('Пожалуйста, укажите ФИО участника');
        return;
    }
    
    const attendee = {
        id: generateId(),
        name: name,
        position: position,
        role: role,
        addedAt: new Date().toISOString()
    };
    
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        if (!meeting.attendees) meeting.attendees = [];
        meeting.attendees.push(attendee);
        saveData();
        closeModal();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function removeAttendeeFromMeeting(meetingId, attendeeId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting && meeting.attendees) {
        meeting.attendees = meeting.attendees.filter(a => a.id !== attendeeId);
        saveData();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function addDecisionToMeeting(meetingId) {
    showModal(`
        <h3>Добавить решение заседания</h3>
        <div class="form-group">
            <label for="decision-title">Заголовок решения *</label>
            <input type="text" id="decision-title" placeholder="Краткое описание решения" required>
        </div>
        <div class="form-group">
            <label for="decision-content">Содержание решения *</label>
            <textarea id="decision-content" rows="4" placeholder="Полный текст принятого решения" required></textarea>
        </div>
        <div class="form-group">
            <label for="decision-responsible">Ответственный за исполнение</label>
            <input type="text" id="decision-responsible" placeholder="ФИО ответственного">
        </div>
        <div class="form-group">
            <label for="decision-deadline">Срок исполнения</label>
            <input type="date" id="decision-deadline">
        </div>
        <div style="margin-top: 1rem; text-align: center;">
            <button type="button" onclick="saveDecisionToMeeting('${meetingId}')">Добавить решение</button>
            <button type="button" onclick="closeModal()">Отмена</button>
        </div>
    `);
}

function saveDecisionToMeeting(meetingId) {
    const title = document.getElementById('decision-title').value;
    const content = document.getElementById('decision-content').value;
    const responsible = document.getElementById('decision-responsible').value;
    const deadline = document.getElementById('decision-deadline').value;
    
    if (!title || !content) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
    }
    
    const decision = {
        id: generateId(),
        title: title,
        content: content,
        responsible: responsible,
        deadline: deadline,
        status: 'adopted', // Принято
        adoptedAt: new Date().toISOString()
    };
    
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        if (!meeting.decisions) meeting.decisions = [];
        meeting.decisions.push(decision);
        saveData();
        closeModal();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function removeDecisionFromMeeting(meetingId, decisionId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting && meeting.decisions) {
        meeting.decisions = meeting.decisions.filter(d => d.id !== decisionId);
        saveData();
        loadMeetingAttendeesAndDecisions(meetingId);
    }
}

function finalizeMeeting(meetingId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
        meeting.status = 'completed';
        meeting.completedAt = new Date().toISOString();
        saveData();
        closeModal();
        loadMeetingsData();
        alert('Заседание завершено, протокол сформирован');
    }
}

function viewMeetingProtocol(meetingId) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    let attendeesHtml = '';
    if (meeting.attendees && meeting.attendees.length > 0) {
        attendeesHtml = '<ul>' + meeting.attendees.map(attendee => 
            `<li>${attendee.name} (${attendee.position || attendee.role})</li>`
        ).join('') + '</ul>';
    } else {
        attendeesHtml = '<p>Нет участников</p>';
    }
    
    let decisionsHtml = '';
    if (meeting.decisions && meeting.decisions.length > 0) {
        decisionsHtml = '<ol>' + meeting.decisions.map((decision, index) => 
            `<li><strong>${decision.title}</strong><br>${decision.content}
            ${decision.responsible ? '<br><em>Ответственный: ' + decision.responsible + '</em>' : ''}
            ${decision.deadline ? '<br><em>Срок исполнения: ' + decision.deadline + '</em>' : ''}
            </li>`
        ).join('') + '</ol>';
    } else {
        decisionsHtml = '<p>Нет принятых решений</p>';
    }
    
    showModal(`
        <div style="font-family: Arial, serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">ПРОТОКОЛ ЗАСЕДАНИЯ</h2>
                <p style="margin: 5px 0;">${getMeetingTypeText(meeting.type)}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <p><strong>Дата:</strong> ${meeting.date}</p>
                <p><strong>Время:</strong> ${meeting.time}</p>
                <p><strong>Место:</strong> ${meeting.place || 'Не указано'}</p>
                <p><strong>Тема:</strong> ${meeting.topic || 'Не указана'}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>Повестка дня:</h4>
                <p>${meeting.agenda || 'Не указана'}</p>
            </div>
            
            <div style="margin: 15px 0;">
                <h4>Присутствовали:</h4>
                ${attendeesHtml}
            </div>
            
            <div style="margin: 15px 0;">
                <h4>Принятые решения:</h4>
                ${decisionsHtml}
            </div>
            
            <div style="margin-top: 30px; text-align: right;">
                <p>Председатель _________________________</p>
                <p>Секретарь _________________________</p>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button type="button" onclick="exportProtocolAsPDF('${meeting.id}')">Сохранить протокол как PDF</button>
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

function exportProtocolAsPDF(meetingId) {
    // В реальной системе здесь будет генерация PDF протокола
    alert('В реальной системе протокол был бы экспортирован в формате PDF. Для этого потребуется библиотека jsPDF или аналогичная.');
}

function getMeetingTypeText(type) {
    const typeMap = {
        'board': 'Заседание правления',
        'general': 'Общее собрание',
        'committee': 'Заседание комитета',
        'other': 'Прочее заседание'
    };
    return typeMap[type] || type;
}

// Функция для пакетного рассмотрения заявлений
function batchProcessApplications() {
    const pendingApps = applications.filter(app => app.status === 'pending');
    
    if (pendingApps.length === 0) {
        alert('Нет заявлений на рассмотрении');
        return;
    }
    
    showModal(`
        <h3>Пакетное рассмотрение заявлений</h3>
        <p>Найдено ${pendingApps.length} заявлений на рассмотрении</p>
        
        <div style="max-height: 400px; overflow-y: auto; margin: 15px 0; border: 1px solid #ccc; padding: 10px;">
            ${pendingApps.map(app => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${app.applicantName}</strong><br>
                        <small>Дата подачи: ${app.submissionDate}, Взнос: ${(app.desiredShareAmount || 0).toLocaleString()} ₽</small>
                    </div>
                    <div>
                        <button class="action-button edit" onclick="processApplication('${app.id}')">Обработать</button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 1rem; text-align: center;">
            <button type="button" onclick="scheduleMeetingForApplications()">Назначить заседание для рассмотрения</button>
            <button type="button" onclick="closeModal()">Закрыть</button>
        </div>
    `);
}

function scheduleMeetingForApplications() {
    // Автоматически создаем заседание для рассмотрения заявлений
    const meeting = {
        id: generateId(),
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Через неделю
        time: '10:00',
        place: 'Конференц-зал',
        type: 'board',
        topic: 'Рассмотрение заявлений на вступление',
        agenda: 'Рассмотрение заявлений на вступление в кооператив и принятие решений',
        status: 'scheduled',
        attendees: [],
        decisions: [],
        applicationIds: applications.filter(app => app.status === 'pending').map(app => app.id), // Связываем с заявлениями
        createdAt: new Date().toISOString()
    };
    
    meetings.push(meeting);
    closeModal();
    loadMeetingsData();
    saveData();
    alert('Заседание назначено для рассмотрения заявлений на вступление');
}