// Подключение библиотеки jsPDF
// Эта библиотека позволяет создавать PDF-файлы на стороне клиента

// Функция для загрузки jsPDF если она не доступна
function loadJSPDF() {
    return new Promise((resolve, reject) => {
        if (window.jspdf && window.jspdf.jsPDF) {
            resolve(window.jspdf.jsPDF);
            return;
        }

        // Создаем скрипт для загрузки jsPDF
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) {
                resolve(window.jspdf.jsPDF);
            } else {
                reject(new Error('jsPDF не загрузилась корректно'));
            }
        };
        script.onerror = () => {
            reject(new Error('Ошибка при загрузке jsPDF'));
        };
        document.head.appendChild(script);
    });
}

// Функция для загрузки jsPDF
function loadJSPDF() {
    return new Promise((resolve, reject) => {
        if (window.jspdf && window.jspdf.jsPDF) {
            resolve(window.jspdf.jsPDF);
            return;
        }

        // Создаем скрипт для загрузки jsPDF
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            // Ждем немного времени для полной загрузки библиотеки
            setTimeout(() => {
                if (window.jspdf && window.jspdf.jsPDF) {
                    resolve(window.jspdf.jsPDF);
                } else if (window.jsPDF) {
                    resolve(window.jsPDF);
                } else {
                    reject(new Error('jsPDF не загрузилась корректно'));
                }
            }, 100);
        };
        script.onerror = () => {
            reject(new Error('Ошибка при загрузке jsPDF'));
        };
        document.head.appendChild(script);
    });
}

// Функция для загрузки кириллического шрифта
async function loadCyrillicFont(doc) {
    // Загружаем шрифт с поддержкой кириллицы
    const fontResponse = await fetch('./fonts/roboto-cyrillic-normal.js');
    const fontScript = await fontResponse.text();
    
    // Выполняем скрипт шрифта
    eval(fontScript);
    
    // Добавляем шрифт к документу
    doc.addFont('./fonts/roboto-cyrillic-normal.js', 'Roboto', 'normal');
    doc.setFont('Roboto');
    
    // Устанавливаем режим кодирования для кириллицы
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(0, 0, 0); // Устанавливаем черный цвет текста
}

// Функция для экспорта удостоверения в PDF
async function exportCertificateAsPDF(certificateId) {
    try {
        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим удостоверение по ID
        const certificate = certificates.find(c => c.id === certificateId);
        if (!certificate) {
            alert('Удостоверение не найдено');
            return;
        }

        // Находим информацию о пайщике
        const member = members.find(m => m.id === certificate.memberId);
        if (!member) {
            alert('Информация о пайщике не найдена');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Добавляем заголовок
        doc.text('УДОСТОВЕРЕНИЕ', 105, 20, null, null, 'center');
        doc.setFontSize(12);
        doc.text('члена потребительского кооператива', 105, 30, null, null, 'center');

        // Добавляем декоративный элемент
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Информация о пайщике
        doc.setFontSize(14);
        doc.text(`ФИО: ${member.name || 'Не указано'}`, 20, 50);

        if (member.birthDate) {
            doc.text(`Дата рождения: ${member.birthDate}`, 20, 60);
        }

        if (member.residenceAddress) {
            doc.text(`Адрес проживания: ${member.residenceAddress}`, 20, 70);
        }

        if (member.phone) {
            doc.text(`Телефон: ${member.phone}`, 20, 80);
        }

        // Дополнительная информация
        if (member.joinDate) {
            doc.text(`Дата вступления: ${member.joinDate}`, 20, 90);
        }

        if (member.status) {
            doc.text(`Статус: ${getStatusText(member.status)}`, 20, 100);
        }

        // Добавляем номер удостоверения и дату выдачи
        doc.setFontSize(12);
        doc.text(`№ ${certificate.certificateNumber || 'Не указан'}`, 20, 120);
        doc.text(`Дата выдачи: ${certificate.issueDate || 'Не указана'}`, 20, 130);

        // Добавляем статус
        doc.text(`Статус удостоверения: ${certificate.status === 'active' ? 'Активно' : 'Неактивно'}`, 20, 140);

        // Добавляем место для подписи и печати
        doc.setFontSize(10);
        doc.text('_________________________', 30, 180); // Линия для подписи пайщика
        doc.text('Подпись пайщика', 30, 185);

        doc.text('_________________________', 120, 180); // Линия для подписи уполномоченного лица
        doc.text('Подпись уполномоченного лица', 120, 185);

        // Прямоугольник для печати
        doc.rect(80, 190, 50, 20); // Прямоугольник для печати
        doc.text('ПЕЧАТЬ', 105, 205, null, null, 'center');

        // Сохраняем PDF
        const fileName = `Udostoverenie_${(member.name || 'Unknown').replace(/\s+/g, '_')}_${certificate.certificateNumber || 'unknown'}.pdf`;
        doc.save(fileName);

        console.log('PDF удостоверения успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF удостоверения:', error);
        alert('Ошибка при создании PDF удостоверения. Проверьте подключение к интернету.');
    }
}

// Функция для экспорта удостоверения пайщика (обертка для вызова из интерфейса)
async function exportMemberCertificateAsPDF(memberId) {
    try {
        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим удостоверение по ID пайщика
        const certificate = certificates.find(c => c.memberId === memberId);
        if (!certificate) {
            // Если удостоверение не найдено, предлагаем создать его
            if (confirm('Удостоверение для этого пайщика не найдено. Создать удостоверение?')) {
                if (typeof generateCertificateForMember === 'function') {
                    generateCertificateForMember(memberId);
                }
            }
            return;
        }

        // Находим информацию о пайщике
        const member = members.find(m => m.id === memberId);
        if (!member) {
            alert('Информация о пайщике не найдена');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF('p', 'mm', 'a4');

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем размер шрифта
        doc.setFontSize(16);

        // Заголовок
        const certPageWidth = doc.internal.pageSize.getWidth();
        doc.text('УДОСТОВЕРЕНИЕ', certPageWidth / 2, 20, {align: 'center'});
        doc.setFontSize(12);
        doc.text('члена потребительского кооператива', certPageWidth / 2, 30, {align: 'center'});

        // Добавляем декоративный элемент
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 35, certPageWidth - 20, 35);

        // Информация о пайщике
        doc.setFontSize(14);
        doc.text(`ФИО: ${member.name || 'Не указано'}`, 20, 50);

        if (member.birthDate) {
            doc.text(`Дата рождения: ${member.birthDate}`, 20, 60);
        }

        if (member.residenceAddress) {
            doc.text(`Адрес проживания: ${member.residenceAddress}`, 20, 70);
        }

        if (member.phone) {
            doc.text(`Телефон: ${member.phone}`, 20, 80);
        }

        // Дополнительная информация
        if (member.joinDate) {
            doc.text(`Дата вступления: ${member.joinDate}`, 20, 90);
        }

        if (member.status) {
            doc.text(`Статус: ${getStatusText(member.status)}`, 20, 100);
        }

        // Номер удостоверения и дата
        doc.setFontSize(12);
        doc.text(`№ ${certificate.certificateNumber || 'Не указан'}`, 20, 120);
        doc.text(`Дата выдачи: ${certificate.issueDate || 'Не указана'}`, 20, 130);
        doc.text(`Статус: ${certificate.status === 'active' ? 'Активно' : 'Неактивно'}`, 20, 140);

        // Место для подписи и печати
        doc.setFontSize(10);
        doc.text('_________________________', 30, 180); // Линия для подписи пайщика
        doc.text('Подпись пайщика', 30, 185);

        doc.text('_________________________', certPageWidth - 80, 180); // Линия для подписи уполномоченного лица
        doc.text('Подпись уполномоченного лица', certPageWidth - 80, 185);

        // Печать
        const rectX = certPageWidth / 2 - 25;
        doc.rect(rectX, 190, 50, 20); // Прямоугольник для печати
        doc.text('ПЕЧАТЬ', certPageWidth / 2, 205, {align: 'center'});

        // Сохраняем PDF
        const fileName = `Udostoverenie_${(member.name || 'Unknown').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${certificate.certificateNumber || 'unknown'}.pdf`;
        doc.save(fileName);

        console.log('PDF удостоверения успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF удостоверения:', error);
        alert('Ошибка при создании PDF удостоверения. Проверьте подключение к интернету.');
    }
}

// Функция для экспорта удостоверения пайщика (обертка для вызова из интерфейса)
async function exportMemberCertificateAsPDF(memberId) {
    try {
        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим удостоверение по ID пайщика
        const certificate = certificates.find(c => c.memberId === memberId);
        if (!certificate) {
            // Если удостоверение не найдено, предлагаем создать его
            if (confirm('Удостоверение для этого пайщика не найдено. Создать удостоверение?')) {
                if (typeof generateCertificateForMember === 'function') {
                    generateCertificateForMember(memberId);
                }
            }
            return;
        }

        // Находим информацию о пайщике
        const member = members.find(m => m.id === memberId);
        if (!member) {
            alert('Информация о пайщике не найдена');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Заголовок
        const certPageWidth = doc.internal.pageSize.getWidth();
        doc.text('УДОСТОВЕРЕНИЕ', certPageWidth / 2, 20, null, null, 'center');
        doc.setFontSize(12);
        doc.text('члена потребительского кооператива', certPageWidth / 2, 30, null, null, 'center');

        // Добавляем декоративный элемент
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 35, certPageWidth - 20, 35);

        // Информация о пайщике
        doc.setFontSize(14);
        doc.text(`ФИО: ${member.name || 'Не указано'}`, 20, 50);

        if (member.birthDate) {
            doc.text(`Дата рождения: ${member.birthDate}`, 20, 60);
        }

        if (member.residenceAddress) {
            doc.text(`Адрес проживания: ${member.residenceAddress}`, 20, 70);
        }

        if (member.phone) {
            doc.text(`Телефон: ${member.phone}`, 20, 80);
        }

        // Дополнительная информация
        if (member.joinDate) {
            doc.text(`Дата вступления: ${member.joinDate}`, 20, 90);
        }

        if (member.status) {
            doc.text(`Статус: ${getStatusText(member.status)}`, 20, 100);
        }

        // Номер удостоверения и дата
        doc.setFontSize(12);
        doc.text(`№ ${certificate.certificateNumber || 'Не указан'}`, 20, 120);
        doc.text(`Дата выдачи: ${certificate.issueDate || 'Не указана'}`, 20, 130);
        doc.text(`Статус: ${certificate.status === 'active' ? 'Активно' : 'Неактивно'}`, 20, 140);

        // Место для подписи и печати
        doc.setFontSize(10);
        doc.text('_________________________', 30, 180); // Линия для подписи пайщика
        doc.text('Подпись пайщика', 30, 185);

        const certPageWidth2 = doc.internal.pageSize.getWidth();
        doc.text('_________________________', certPageWidth2 - 80, 180); // Линия для подписи уполномоченного лица
        doc.text('Подпись уполномоченного лица', certPageWidth2 - 80, 185);

        // Печать
        const rectX = certPageWidth2 / 2 - 25;
        doc.rect(rectX, 190, 50, 20); // Прямоугольник для печати
        doc.text('ПЕЧАТЬ', certPageWidth2 / 2, 205, null, null, 'center');

        // Сохраняем PDF
        const fileName = `Udostoverenie_${(member.name || 'Unknown').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${certificate.certificateNumber || 'unknown'}.pdf`;
        doc.save(fileName);

        console.log('PDF удостоверения успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF удостоверения:', error);
        alert('Ошибка при создании PDF удостоверения. Проверьте подключение к интернету.');
    }
}

// Функция для экспорта протокола заседания в PDF
async function exportMeetingProtocolAsPDF(meetingId) {
    try {
        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим заседание по ID
        const meeting = meetings.find(m => m.id === meetingId);
        if (!meeting) {
            alert('Заседание не найдено');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Заголовок
        const protocolPageWidth = doc.internal.pageSize.width;
        doc.text('ПРОТОКОЛ', protocolPageWidth / 2, 20, null, null, 'center');
        doc.setFontSize(14);
        doc.text('заседания', protocolPageWidth / 2, 30, null, null, 'center');

        // Информация о заседании
        doc.setFontSize(12);
        doc.text(`Тип: ${getMeetingTypeText(meeting.type)}`, 20, 50);
        doc.text(`Дата: ${meeting.date}`, 20, 60);
        doc.text(`Тема: ${meeting.topic || 'Не указана'}`, 20, 70);
        doc.text(`Статус: ${getMeetingStatusText(meeting.status)}`, 20, 80);

        // Участники (если есть)
        if (meeting.attendees && meeting.attendees.length > 0) {
            doc.text('Участники:', 20, 100);
            let yPos = 110;
            meeting.attendees.forEach((attendee, index) => {
                if (yPos > 250) { // Если достигли конца страницы, добавляем новую
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${index + 1}. ${attendee.name} (${attendee.position || 'Участник'})`, 30, yPos);
                yPos += 10;
            });
        }

        // Решения (если есть)
        if (meeting.decisions && meeting.decisions.length > 0) {
            const startY = meeting.attendees && meeting.attendees.length > 0 ? yPos + 20 : 100;
            doc.text('Принятые решения:', 20, startY);
            let yPos = startY + 10;
            meeting.decisions.forEach((decision, index) => {
                if (yPos > 250) { // Если достигли конца страницы, добавляем новую
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${index + 1}. ${decision.title}`, 30, yPos);
                yPos += 10;
                doc.text(decision.content, 40, yPos);
                yPos += 10;

                if (decision.deadline) {
                    doc.text(`Срок исполнения: ${decision.deadline}`, 40, yPos);
                    yPos += 10;
                }
            });
        }

        // Сохраняем PDF
        const fileName = `Protocol_${meeting.topic.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${meeting.date}.pdf`;
        doc.save(fileName);

        console.log('PDF протокола успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF протокола:', error);
        alert('Ошибка при создании PDF протокола. Проверьте подключение к интернету.');
    }
}

// Функция для экспорта отчета в PDF
async function exportReportAsPDF(reportTitle, reportContent) {
    try {
        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Заголовок отчета
        const reportPageWidth = doc.internal.pageSize.width;
        doc.text(reportTitle, reportPageWidth / 2, 20, null, null, 'center');

        // Добавляем дату формирования отчета
        doc.setFontSize(10);
        doc.text(`Сформировано: ${new Date().toLocaleDateString()}`, reportPageWidth - 40, 30, null, null, 'right');

        // Добавляем содержимое отчета
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(reportContent, reportPageWidth - 40);
        let yPos = 40;

        splitText.forEach(textLine => {
            if (yPos > 270) { // Если достигли конца страницы, добавляем новую
                doc.addPage();
                yPos = 20;
            }
            doc.text(textLine, 20, yPos);
            yPos += 7;
        });

        // Сохраняем PDF
        const fileName = `${reportTitle.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        console.log('PDF отчета успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF отчета:', error);
        alert('Ошибка при создании PDF отчета. Проверьте подключение к интернету.');
    }
}

// Функция для экспорта заявления в PDF
async function exportApplicationAsPDF(applicationId) {
    try {
        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим заявление по ID
        const application = applications.find(a => a.id === applicationId);
        if (!application) {
            alert('Заявление не найдено');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Заголовок
        const appPageWidth = doc.internal.pageSize.width;
        doc.text('ЗАЯВЛЕНИЕ', appPageWidth / 2, 20, null, null, 'center');
        doc.setFontSize(12);
        doc.text('на вступление в потребительский кооператив', appPageWidth / 2, 30, null, null, 'center');

        // Добавляем декоративный элемент
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 35, appPageWidth - 20, 35);

        // Информация из заявления
        doc.setFontSize(12);
        let yPos = 50;

        doc.text(`ФИО заявителя: ${application.applicantName}`, 20, yPos);
        yPos += 10;

        doc.text(`Контакт: ${application.applicantContact}`, 20, yPos);
        yPos += 10;

        if (application.birthDate) {
            doc.text(`Дата рождения: ${application.birthDate}`, 20, yPos);
            yPos += 10;
        }

        if (application.passport) {
            doc.text(`Паспорт: ${application.passport}`, 20, yPos);
            yPos += 10;
        }

        if (application.registrationAddress) {
            doc.text(`Адрес регистрации: ${application.registrationAddress}`, 20, yPos);
            yPos += 10;
        }

        if (application.residenceAddress) {
            doc.text(`Адрес проживания: ${application.residenceAddress}`, 20, yPos);
            yPos += 10;
        }

        if (application.occupation) {
            doc.text(`Род занятий: ${application.occupation}`, 20, yPos);
            yPos += 10;
        }

        if (application.income) {
            doc.text(`Доход: ${application.income}`, 20, yPos);
            yPos += 10;
        }

        doc.text(`Желаемый размер паевого взноса: ${(application.desiredShareAmount || 0).toLocaleString()} ₽`, 20, yPos);
        yPos += 10;

        doc.text(`Форма оплаты: ${getApplicationPaymentMethodText(application.paymentMethod)}`, 20, yPos);
        yPos += 10;

        if (application.propertyDescription) {
            doc.text(`Описание имущества: ${application.propertyDescription}`, 20, yPos);
            yPos += 10;
        }

        if (application.additionalInfo) {
            doc.text(`Дополнительная информация: ${application.additionalInfo}`, 20, yPos);
            yPos += 10;
        }

        doc.text(`Дата подачи: ${application.submissionDate}`, 20, yPos);
        yPos += 10;

        doc.text(`Статус: ${getApplicationStatusText(application.status)}`, 20, yPos);
        yPos += 20;

        // Место для подписи
        doc.text('Подпись заявителя _________________________', 20, yPos);
        yPos += 15;

        doc.text(`Дата: _____________ ${new Date().getFullYear()} г.`, 20, yPos);

        // Сохраняем PDF
        const fileName = `Zayavlenie_${application.applicantName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${application.id}.pdf`;
        doc.save(fileName);

        console.log('PDF заявления успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF заявления:', error);
        alert('Ошибка при создании PDF заявления. Проверьте подключение к интернету.');
    }
}

// Функция для преобразования числа в пропись
function numberToWords(amount) {
    const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const unitsF = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']; // для женского рода
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
    
    const currencyNames = [
        ['рубль', 'рубля', 'рублей'],
        ['копейка', 'копейки', 'копеек']
    ];
    
    function getCurrencyName(number, names) {
        const mod10 = number % 10;
        const mod100 = number % 100;
        
        if (mod100 >= 11 && mod100 <= 19) {
            return names[2];
        } else if (mod10 === 1) {
            return names[0];
        } else if (mod10 >= 2 && mod10 <= 4) {
            return names[1];
        } else {
            return names[2];
        }
    }
    
    function convertThreeDigits(num, gender) {
        let result = '';
        
        // Сотни
        if (num >= 100) {
            result += hundreds[Math.floor(num / 100)] + ' ';
            num %= 100;
        }
        
        // Десятки и единицы
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        }
        
        if (num >= 10) { // 10-19
            result += teens[num - 10];
        } else if (num > 0) { // 1-9
            if (gender === 'f' && (num === 1 || num === 2)) {
                result += unitsF[num];
            } else {
                result += units[num];
            }
        }
        
        return result.trim();
    }
    
    if (amount === 0) {
        return 'ноль ' + currencyNames[0][2];
    }
    
    const rubles = Math.floor(amount);
    const kopecks = Math.round((amount - rubles) * 100);
    
    let result = '';
    
    // Рубли
    if (rubles > 0) {
        const billions = Math.floor(rubles / 1000000000);
        const millions = Math.floor((rubles % 1000000000) / 1000000);
        const thousands = Math.floor((rubles % 1000000) / 1000);
        const rest = rubles % 1000;
        
        if (billions > 0) {
            result += convertThreeDigits(billions, 'm') + ' ' + getCurrencyName(billions, ['миллиард', 'миллиарда', 'миллиардов']) + ' ';
        }
        
        if (millions > 0) {
            result += convertThreeDigits(millions, 'm') + ' ' + getCurrencyName(millions, ['миллион', 'миллиона', 'миллионов']) + ' ';
        }
        
        if (thousands > 0) {
            result += convertThreeDigits(thousands, 'm') + ' ' + getCurrencyName(thousands, ['тысяча', 'тысячи', 'тысяч']) + ' ';
        }
        
        if (rest > 0) {
            result += convertThreeDigits(rest, 'm') + ' ';
        }
        
        result += getCurrencyName(rubles, currencyNames[0]);
    } else {
        result += 'ноль ' + currencyNames[0][2];
    }
    
    // Копейки
    if (kopecks > 0) {
        result += ' ' + convertThreeDigits(kopecks, 'f') + ' ' + getCurrencyName(kopecks, currencyNames[1]);
    } else if (rubles > 0) {
        result += ' 00 ' + currencyNames[1][2];
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Функция для генерации HTML-шаблона квитанции о внесении взноса
function generatePaymentReceiptHTML(payment) {
    const member = members.find(m => m.id === payment.memberId);
    if (!member) {
        alert('Информация о пайщике не найдена');
        return null;
    }

    const methodText = typeof getPaymentMethodText === 'function' ? getPaymentMethodText(payment.method) : payment.method;
    const typeText = typeof getPaymentTypeText === 'function' ? getPaymentTypeText(payment.type) : payment.type;

    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Квитанция о приеме паевого взноса</title>
            <style>
                @page {
                    size: 105mm 148mm;
                    margin: 5mm;
                }
                body { 
                    font-family: Arial, sans-serif; 
                    width: 105mm; 
                    height: 148mm; 
                    margin: 0 auto; 
                    padding: 5mm;
                    line-height: 1.3;
                    font-size: 9px;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 1px solid #000; 
                    padding-bottom: 3px; 
                    margin-bottom: 8px;
                }
                .receipt-info { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 8px;
                    font-size: 8px;
                }
                .payer-info { 
                    margin: 8px 0; 
                    padding: 4px; 
                    border: 1px solid #ccc; 
                    background-color: #f9f9f9;
                    font-size: 8px;
                }
                .payment-details { 
                    margin: 8px 0; 
                    font-size: 8px;
                }
                .signatures { 
                    margin-top: 15px; 
                    display: flex; 
                    justify-content: space-between;
                    font-size: 7px;
                }
                .signature-line { 
                    border-top: 1px solid #000; 
                    width: 40%; 
                    text-align: center; 
                    padding-top: 2px;
                    font-size: 7px;
                }
                .stamp-area { 
                    text-align: center; 
                    border: 1px solid #000; 
                    width: 70px; 
                    height: 25px; 
                    margin: 8px auto; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 7px;
                }
                .footer-info { 
                    margin-top: 15px; 
                    font-size: 6px; 
                    text-align: center; 
                    color: #666;
                }
                h1 {
                    font-size: 14px;
                    margin: 0 0 3px 0;
                }
                h2 {
                    font-size: 11px;
                    margin: 0 0 5px 0;
                }
                h3 {
                    font-size: 9px;
                    margin: 5px 0 2px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>КВИТАНЦИЯ</h1>
                <h2>о приеме паевого взноса</h2>
            </div>
            
            <div class="receipt-info">
                <div>Дата: ${payment.date}</div>
                <div>№: ${payment.documentNumber || 'Не указан'}</div>
            </div>
            
            <div class="payer-info">
                <h3>Пайщик:</h3>
                <p><strong>${member.name || 'Не указано'}</strong></p>
                ${member.phone ? `<p><strong>Тел.:</strong> ${member.phone}</p>` : ''}
                ${member.residenceAddress ? `<p><strong>Адрес:</strong> ${member.residenceAddress}</p>` : ''}
            </div>
            
            <div class="payment-details">
                <p><strong>Тип:</strong> ${typeText}</p>
                <p><strong>Форма:</strong> ${methodText}</p>
                ${payment.method === 'property' 
                    ? `<p><strong>Имущество:</strong> ${payment.propertyDescription || 'Не указано'}</p>` 
                    : `<p><strong>Сумма:</strong> ${(payment.amount || 0).toLocaleString()} ₽ (${numberToWords(payment.amount || 0)})</p>`
                }
                ${payment.description ? `<p><strong>Назн.:</strong> ${payment.description}</p>` : ''}
                <p><strong>Статус:</strong> ${payment.paid ? 'Оплачено' : 'Не оплачено'}</p>
            </div>
            
            <div class="signatures">
                <div class="signature-line">Подпись пайщика</div>
                <div class="signature-line">Подпись уполномоченного</div>
            </div>
            
            <div class="stamp-area">ПЕЧАТЬ</div>
            
            <div class="footer-info">
                <p>ID: ${payment.id} | ${new Date().toLocaleString()}</p>
            </div>
            
            <script>
                // Автоматическая печать при загрузке
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;
}

// Функция для генерации HTML-шаблона акта возврата взноса
function generateReturnReceiptHTML(payment) {
    const member = members.find(m => m.id === payment.memberId);
    if (!member) {
        alert('Информация о пайщике не найдена');
        return null;
    }

    const methodText = typeof getPaymentMethodText === 'function' ? getPaymentMethodText(payment.method) : payment.method;
    const typeText = typeof getPaymentTypeText === 'function' ? getPaymentTypeText(payment.type) : payment.type;

    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Акт о возврате паевого взноса</title>
            <style>
                @page {
                    size: 105mm 148mm;
                    margin: 5mm;
                }
                body { 
                    font-family: Arial, sans-serif; 
                    width: 105mm; 
                    height: 148mm; 
                    margin: 0 auto; 
                    padding: 5mm;
                    line-height: 1.3;
                    font-size: 9px;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 1px solid #000; 
                    padding-bottom: 3px; 
                    margin-bottom: 8px;
                }
                .receipt-info { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 8px;
                    font-size: 8px;
                }
                .payer-info { 
                    margin: 8px 0; 
                    padding: 4px; 
                    border: 1px solid #ccc; 
                    background-color: #f9f9f9;
                    font-size: 8px;
                }
                .payment-details { 
                    margin: 8px 0; 
                    font-size: 8px;
                }
                .signatures { 
                    margin-top: 15px; 
                    display: flex; 
                    justify-content: space-between;
                    font-size: 7px;
                }
                .signature-line { 
                    border-top: 1px solid #000; 
                    width: 40%; 
                    text-align: center; 
                    padding-top: 2px;
                    font-size: 7px;
                }
                .stamp-area { 
                    text-align: center; 
                    border: 1px solid #000; 
                    width: 70px; 
                    height: 25px; 
                    margin: 8px auto; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 7px;
                }
                .footer-info { 
                    margin-top: 15px; 
                    font-size: 6px; 
                    text-align: center; 
                    color: #666;
                }
                h1 {
                    font-size: 14px;
                    margin: 0 0 3px 0;
                }
                h2 {
                    font-size: 11px;
                    margin: 0 0 5px 0;
                }
                h3 {
                    font-size: 9px;
                    margin: 5px 0 2px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>АКТ</h1>
                <h2>о возврате паевого взноса</h2>
            </div>
            
            <div class="receipt-info">
                <div>Дата: ${payment.date}</div>
                <div>№: ${payment.documentNumber || 'Не указан'}</div>
            </div>
            
            <div class="payer-info">
                <h3>Пайщик:</h3>
                <p><strong>${member.name || 'Не указано'}</strong></p>
                ${member.phone ? `<p><strong>Тел.:</strong> ${member.phone}</p>` : ''}
                ${member.residenceAddress ? `<p><strong>Адрес:</strong> ${member.residenceAddress}</p>` : ''}
            </div>
            
            <div class="payment-details">
                <p><strong>Тип:</strong> ${typeText}</p>
                <p><strong>Форма:</strong> ${methodText}</p>
                ${payment.method === 'property' 
                    ? `<p><strong>Имущество:</strong> ${payment.propertyDescription || 'Не указано'}</p>` 
                    : `<p><strong>Сумма:</strong> ${(payment.amount || 0).toLocaleString()} ₽ (${numberToWords(payment.amount || 0)})</p>`
                }
                ${payment.description ? `<p><strong>Основание:</strong> ${payment.description}</p>` : ''}
                <p><strong>Статус:</strong> ${payment.paid ? 'Выполнено' : 'Не выполнено'}</p>
            </div>
            
            <div class="signatures">
                <div class="signature-line">Подпись пайщика</div>
                <div class="signature-line">Подпись уполномоченного</div>
            </div>
            
            <div class="stamp-area">ПЕЧАТЬ</div>
            
            <div class="footer-info">
                <p>ID: ${payment.id} | ${new Date().toLocaleString()}</p>
            </div>
            
            <script>
                // Автоматическая печать при загрузке
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;
}

// Функция для печати документа о внесении взноса
function printPaymentReceipt(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
        alert('Платеж не найден');
        return;
    }

    const htmlContent = generatePaymentReceiptHTML(payment);
    if (!htmlContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

// Функция для печати документа о возврате взноса
function printReturnReceipt(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
        alert('Платеж не найден');
        return;
    }

    if (payment.type !== 'return_share') {
        alert('Это не операция возврата взноса');
        return;
    }

    const htmlContent = generateReturnReceiptHTML(payment);
    if (!htmlContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

// Функция для экспорта документа о внесении взноса в PDF (с резервным вариантом)
async function exportPaymentAsPDF(paymentId) {
    try {
        // Проверяем, доступна ли библиотека jsPDF
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.warn('Библиотека jsPDF недоступна, используем HTML-печать');
            printPaymentReceipt(paymentId);
            return;
        }

        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим платеж по ID
        const payment = payments.find(p => p.id === paymentId);
        if (!payment) {
            alert('Платеж не найден');
            return;
        }

        // Находим информацию о пайщике
        const member = members.find(m => m.id === payment.memberId);
        if (!member) {
            alert('Информация о пайщике не найдена');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Заголовок
        const paymentPageWidth = doc.internal.pageSize.width;
        doc.text('КВИТАНЦИЯ', paymentPageWidth / 2, 20, null, null, 'center');
        doc.setFontSize(14);
        doc.text('о приеме паевого взноса', paymentPageWidth / 2, 30, null, null, 'center');

        // Добавляем декоративный элемент
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 35, paymentPageWidth - 20, 35);

        // Информация о платеже
        doc.setFontSize(12);
        let yPos = 50;

        // Дата и номер документа
        doc.text(`Дата: ${payment.date}`, 20, yPos);
        doc.text(`Номер документа: ${payment.documentNumber || 'Не указан'}`, paymentPageWidth - 80, yPos);
        yPos += 10;

        // Информация о пайщике
        doc.text(`Пайщик: ${member.name || 'Не указано'}`, 20, yPos);
        yPos += 10;

        if (member.phone) {
            doc.text(`Телефон: ${member.phone}`, 20, yPos);
            yPos += 10;
        }

        if (member.residenceAddress) {
            doc.text(`Адрес: ${member.residenceAddress}`, 20, yPos);
            yPos += 10;
        }

        // Тип и сумма взноса
        doc.text(`Тип взноса: ${getPaymentTypeText(payment.type)}`, 20, yPos);
        yPos += 10;

        if (payment.method === 'property') {
            doc.text(`Форма оплаты: ${getPaymentMethodText(payment.method)}`, 20, yPos);
            yPos += 10;
            doc.text(`Описание имущества: ${payment.propertyDescription || 'Не указано'}`, 20, yPos);
            yPos += 10;
        } else {
            doc.text(`Форма оплаты: ${getPaymentMethodText(payment.method)}`, 20, yPos);
            yPos += 10;
            doc.text(`Сумма: ${(payment.amount || 0).toLocaleString()} ₽ (${numberToWords(payment.amount || 0)})`, 20, yPos);
            yPos += 10;
        }

        // Описание
        if (payment.description) {
            doc.text(`Назначение: ${payment.description}`, 20, yPos);
            yPos += 10;
        }

        // Статус
        doc.text(`Статус: ${payment.paid ? 'Оплачено' : 'Не оплачено'}`, 20, yPos);
        yPos += 20;

        // Место для подписей
        doc.setFontSize(10);
        doc.text('_________________________', 30, yPos); // Линия для подписи пайщика
        doc.text('Подпись пайщика', 30, yPos + 5);

        doc.text('_________________________', paymentPageWidth - 80, yPos); // Линия для подписи уполномоченного лица
        doc.text('Подпись уполномоченного лица', paymentPageWidth - 80, yPos + 5);

        // Прямоугольник для печати
        const rectX = paymentPageWidth / 2 - 25;
        doc.rect(rectX, yPos + 15, 50, 20); // Прямоугольник для печати
        doc.text('ПЕЧАТЬ', paymentPageWidth / 2, yPos + 28, null, null, 'center');

        // Добавляем уникальный идентификатор документа
        yPos += 40;
        doc.setFontSize(8);
        doc.text(`ID документа: ${payment.id}`, 20, yPos);
        doc.text(`Сформировано: ${new Date().toLocaleString()}`, paymentPageWidth - 60, yPos);

        // Сохраняем PDF
        const fileName = `Kvitancia_${getPaymentTypeText(payment.type).replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${payment.documentNumber || payment.id}.pdf`;
        doc.save(fileName);

        console.log('PDF квитанции успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF квитанции:', error);
        console.warn('Используем резервный вариант - HTML-печать');
        printPaymentReceipt(paymentId);
    }
}

// Функция для экспорта документа о возврате взноса в PDF (с резервным вариантом)
async function exportReturnPaymentAsPDF(paymentId) {
    try {
        // Проверяем, доступна ли библиотека jsPDF
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.warn('Библиотека jsPDF недоступна, используем HTML-печать');
            printReturnReceipt(paymentId);
            return;
        }

        // Загружаем jsPDF
        const jsPDF = await loadJSPDF();

        // Находим платеж по ID
        const payment = payments.find(p => p.id === paymentId);
        if (!payment) {
            alert('Платеж не найден');
            return;
        }

        // Проверяем, что это действительно возврат
        if (payment.type !== 'return_share') {
            alert('Это не операция возврата взноса');
            return;
        }

        // Находим информацию о пайщике
        const member = members.find(m => m.id === payment.memberId);
        if (!member) {
            alert('Информация о пайщике не найдена');
            return;
        }

        // Создаем PDF документ
        const doc = new jsPDF();

        // Загружаем кириллический шрифт
        await loadCyrillicFont(doc);

        // Устанавливаем шрифт и размер
        doc.setFontSize(16);

        // Заголовок
        const returnPageWidth = doc.internal.pageSize.width;
        doc.text('АКТ', returnPageWidth / 2, 20, null, null, 'center');
        doc.setFontSize(14);
        doc.text('о возврате паевого взноса', returnPageWidth / 2, 30, null, null, 'center');

        // Добавляем декоративный элемент
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, 35, returnPageWidth - 20, 35);

        // Информация о возврате
        doc.setFontSize(12);
        let yPos = 50;

        // Дата и номер документа
        doc.text(`Дата: ${payment.date}`, 20, yPos);
        doc.text(`Номер документа: ${payment.documentNumber || 'Не указан'}`, returnPageWidth - 80, yPos);
        yPos += 10;

        // Информация о пайщике
        doc.text(`Пайщик: ${member.name || 'Не указано'}`, 20, yPos);
        yPos += 10;

        if (member.phone) {
            doc.text(`Телефон: ${member.phone}`, 20, yPos);
            yPos += 10;
        }

        if (member.residenceAddress) {
            doc.text(`Адрес: ${member.residenceAddress}`, 20, yPos);
            yPos += 10;
        }

        // Тип и сумма возврата
        doc.text(`Тип операции: ${getPaymentTypeText(payment.type)}`, 20, yPos);
        yPos += 10;

        if (payment.method === 'property') {
            doc.text(`Форма возврата: ${getPaymentMethodText(payment.method)}`, 20, yPos);
            yPos += 10;
            doc.text(`Описание имущества: ${payment.propertyDescription || 'Не указано'}`, 20, yPos);
            yPos += 10;
        } else {
            doc.text(`Форма возврата: ${getPaymentMethodText(payment.method)}`, 20, yPos);
            yPos += 10;
            doc.text(`Сумма возврата: ${(payment.amount || 0).toLocaleString()} ₽ (${numberToWords(payment.amount || 0)})`, 20, yPos);
            yPos += 10;
        }

        // Описание
        if (payment.description) {
            doc.text(`Основание: ${payment.description}`, 20, yPos);
            yPos += 10;
        }

        // Статус
        doc.text(`Статус: ${payment.paid ? 'Выполнено' : 'Не выполнено'}`, 20, yPos);
        yPos += 20;

        // Место для подписей
        doc.setFontSize(10);
        doc.text('_________________________', 30, yPos); // Линия для подписи пайщика
        doc.text('Подпись пайщика', 30, yPos + 5);

        doc.text('_________________________', returnPageWidth - 80, yPos); // Линия для подписи уполномоченного лица
        doc.text('Подпись уполномоченного лица', returnPageWidth - 80, yPos + 5);

        // Прямоугольник для печати
        const rectX = returnPageWidth / 2 - 25;
        doc.rect(rectX, yPos + 15, 50, 20); // Прямоугольник для печати
        doc.text('ПЕЧАТЬ', returnPageWidth / 2, yPos + 28, null, null, 'center');

        // Добавляем уникальный идентификатор документа
        yPos += 40;
        doc.setFontSize(8);
        doc.text(`ID документа: ${payment.id}`, 20, yPos);
        doc.text(`Сформировано: ${new Date().toLocaleString()}`, returnPageWidth - 60, yPos);

        // Сохраняем PDF
        const fileName = `Akt_vozvrata_${payment.documentNumber || payment.id}.pdf`;
        doc.save(fileName);

        console.log('PDF акта возврата успешно создан');
    } catch (error) {
        console.error('Ошибка при создании PDF акта возврата:', error);
        console.warn('Используем резервный вариант - HTML-печать');
        printReturnReceipt(paymentId);
    }
}