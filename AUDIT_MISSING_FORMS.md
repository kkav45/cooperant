# 🔍 АУДИТ НЕРЕАЛИЗОВАННЫХ ФОРМ ЛЕВОГО МЕНЮ
## Отчёт главного инженера QA

**Дата:** 17 февраля 2026
**Объект аудита:** index.html vs messenger-app-v2.js
**Фокус:** Соответствие форм в меню реализованным функциям

---

## 📊 МАТРИЦА СООТВЕТСТВИЯ

| № | Форма в меню | data-action | Статус | Приоритет |
|---|-------------|-------------|--------|-----------|
| **👥 ПАЙЩИКИ** |
| 1 | Добавить пайщика | `create-member` | ✅ Реализовано | 🔴 Критично |
| 2 | **Редактировать пайщика** | `edit-member` | ❌ **НЕ реализовано** | 🔴 Критично |
| **💳 ВЗНОСЫ** |
| 3 | Добавить взнос | `create-payment` | ✅ Реализовано | 🔴 Критично |
| 4 | **Возврат взноса** | `create-return-payment` | ❌ **НЕ реализовано** | 🔴 Критично |
| **📘 БУХГАЛТЕРИЯ** |
| 5 | Добавить проводку | `create-transaction` | ✅ Реализовано | 🔴 Критично |
| 6 | ПКО | `pko` | ✅ Отчёт | 🟡 Важно |
| 7 | РКО | `rko` | ✅ Отчёт | 🟡 Важно |
| 8 | **Платёжное поручение** | `payment-order` | ❌ **НЕ реализовано** | 🔴 Критично |
| **📙 НАЛОГИ** |
| 9 | КУДиР | `kudir` | ✅ Отчёт | 🟡 Важно |
| 10 | Декларация УСН | `usn-declaration` | ✅ Отчёт | 🟡 Важно |
| 11 | **Акт сверки** | `act-sverka` | ❌ **НЕ реализовано** | 🟡 Важно |
| 12 | Декларация УСН (нулевая) | `generate-usn-zero` | ❌ **НЕ реализовано** | 🟡 Важно |
| 13 | Баланс (нулевой) | `generate-balance-zero` | ❌ **НЕ реализовано** | 🟡 Важно |
| 14 | СЗВ-СТАЖ (нулевой) | `generate-szv-zero` | ❌ **НЕ реализовано** | 🟡 Важно |
| 15 | РСВ (нулевой) | `generate-rsv-zero` | ❌ **НЕ реализовано** | 🟡 Важно |
| 16 | Среднесписочная (нулевая) | `generate-sredn-zero` | ❌ **НЕ реализовано** | 🟡 Важно |
| **📗 УПРАВЛЕНЧЕСКИЙ** |
| 17 | Создать протокол | `create-meeting` | ✅ Реализовано | 🟢 Желательно |
| **📁 ДОКУМЕНТЫ** |
| 18 | Загрузить документ | `create-document` | ✅ Реализовано | 🟢 Желательно |
| 19 | **Счёт на оплату** | `invoice` | ❌ **НЕ реализовано** | 🟢 Желательно |
| **📋 ЗАЯВЛЕНИЯ** |
| 20 | Подать заявление | `create-application` | ✅ Реализовано | 🟢 Желательно |

---

## 🔴 КРИТИЧЕСКИЕ НЕРЕАЛИЗОВАННЫЕ ФОРМЫ

### 1. Редактирование пайщика (`edit-member`)

**Проблема:** Нет возможности исправить ошибку в данных пайщика

**Влияние:**
- Невозможно исправить опечатку в ФИО
- Невозможно обновить телефон/email
- При ошибке нужно удалять и создавать заново

**Решение:**
```javascript
function editMember(memberId) {
    const member = window.members.find(m => m.id === memberId);
    if (!member) {
        Logger.error('Пайщик не найден', { memberId });
        return;
    }
    
    const content = `
        <div style="padding:20px">
            <h3>✏️ Редактирование пайщика</h3>
            <form onsubmit="updateMember(event, ${member.id})">
                <div style="margin-bottom:15px">
                    <label>ФИО *</label>
                    <input type="text" id="edit-member-name" 
                           value="${Security.escapeHtml(member.name)}" required>
                </div>
                <div style="margin-bottom:15px">
                    <label>Телефон *</label>
                    <input type="tel" id="edit-member-phone" 
                           value="${Security.escapeHtml(member.phone || '')}" required>
                </div>
                <div style="margin-bottom:15px">
                    <label>Email</label>
                    <input type="email" id="edit-member-email" 
                           value="${Security.escapeHtml(member.email || '')}">
                </div>
                <div style="margin-bottom:15px">
                    <label>Дата вступления</label>
                    <input type="date" id="edit-member-join-date" 
                           value="${member.joinDate || ''}">
                </div>
                <div style="margin-bottom:15px">
                    <label>Статус</label>
                    <select id="edit-member-status">
                        <option value="active" ${member.status === 'active' ? 'selected' : ''}>Активен</option>
                        <option value="debt" ${member.status === 'debt' ? 'selected' : ''}>Должник</option>
                        <option value="pending" ${member.status === 'pending' ? 'selected' : ''}>На рассмотрении</option>
                        <option value="suspended" ${member.status === 'suspended' ? 'selected' : ''}>Приостановлен</option>
                    </select>
                </div>
                <div style="display:flex;gap:10px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Редактирование пайщика', content);
}

function updateMember(event, memberId) {
    event.preventDefault();
    try {
        const member = window.members.find(m => m.id === memberId);
        if (!member) {
            Logger.error('Пайщик не найден', { memberId });
            return;
        }
        
        member.name = document.getElementById('edit-member-name').value;
        member.phone = document.getElementById('edit-member-phone').value;
        member.email = document.getElementById('edit-member-email').value;
        member.joinDate = document.getElementById('edit-member-join-date').value;
        member.status = document.getElementById('edit-member-status').value;
        
        saveData();
        renderChats();
        
        Logger.info('Пайщик обновлён', { memberId });
        alert('✅ Данные пайщика обновлены!');
        closeSideMenu();
    } catch (error) {
        Logger.error('Ошибка обновления пайщика', error);
        alert('❌ Ошибка при обновлении');
    }
}
```

---

### 2. Возврат паевого взноса (`create-return-payment`)

**Проблема:** Нет оформления возврата при выходе пайщика

**Влияние:**
- Невозможно оформить выход пайщика
- Нарушение требований закона
- Бухгалтерский учёт не сходится

**Решение:**
```javascript
function createReturnPayment() {
    const members = window.members?.filter(m => m.balance > 0) || [];
    
    const content = `
        <div style="padding:20px">
            <h3>↩️ Возврат паевого взноса</h3>
            <form onsubmit="saveReturnPayment(event)">
                <div style="margin-bottom:15px">
                    <label>Пайщик *</label>
                    <select id="return-member" required>
                        <option value="">Выберите пайщика</option>
                        ${members.map(m => `
                            <option value="${m.id}">${Security.escapeHtml(m.name)} (Баланс: ${m.balance.toLocaleString()} ₽)</option>
                        `).join('')}
                    </select>
                </div>
                <div style="margin-bottom:15px">
                    <label>Сумма возврата (₽) *</label>
                    <input type="number" id="return-amount" required min="1" 
                           placeholder="Максимум: укажите баланс пайщика">
                </div>
                <div style="margin-bottom:15px">
                    <label>Дата возврата *</label>
                    <input type="date" id="return-date" required 
                           value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div style="margin-bottom:15px">
                    <label>Основание *</label>
                    <textarea id="return-reason" required rows="3" 
                              placeholder="Заявление о выходе из кооператива&#10;Протокол №__ от ______"></textarea>
                </div>
                <div style="margin-bottom:15px">
                    <label>Способ выплаты</label>
                    <select id="return-method">
                        <option value="cash">Наличными из кассы</option>
                        <option value="bank">На банковский счёт</option>
                    </select>
                </div>
                <div style="display:flex;gap:10px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">💾 Оформить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Возврат взноса', content);
}

function saveReturnPayment(event) {
    event.preventDefault();
    try {
        const memberId = document.getElementById('return-member').value;
        const amount = parseFloat(document.getElementById('return-amount').value);
        const date = document.getElementById('return-date').value;
        const reason = document.getElementById('return-reason').value;
        const method = document.getElementById('return-method').value;
        
        const member = window.members.find(m => m.id == memberId);
        if (!member) {
            alert('❌ Пайщик не найден');
            return;
        }
        
        if (amount > member.balance) {
            alert('❌ Сумма возврата не может превышать баланс пайщика');
            return;
        }
        
        // Создаём возврат
        const returnPayment = {
            id: Date.now(),
            memberId: parseInt(memberId),
            type: 'return_share',
            amount: amount,
            date: date,
            method: method,
            paid: true,
            reason: reason,
            createdAt: new Date().toISOString()
        };
        
        // Обновляем баланс
        member.balance -= amount;
        member.operations.push({
            id: Date.now(),
            type: 'Возврат паевого взноса',
            amount: amount,
            date: date,
            description: reason,
            status: 'paid'
        });
        
        // Сохраняем
        if (!window.payments) window.payments = [];
        window.payments.push(returnPayment);
        
        saveData();
        renderChats();
        updateStats();
        
        Logger.info('Возврат оформлен', { memberId, amount });
        alert(`✅ Возврат ${amount.toLocaleString()} ₽ оформлен!`);
        closeSideMenu();
    } catch (error) {
        Logger.error('Ошибка оформления возврата', error);
        alert('❌ Ошибка при оформлении возврата');
    }
}
```

---

### 3. Платёжное поручение (`payment-order`)

**Проблема:** Нет формирования платёжек для банка

**Влияние:**
- Невозможно оплатить безналичными
- Ручное создание в банке-клиенте
- Ошибки в реквизитах

**Решение:**
```javascript
function createPaymentOrder() {
    const content = `
        <div style="padding:20px;font-family:'Courier New',monospace;font-size:12px">
            <h2 style="text-align:center;margin-bottom:20px">ПЛАТЁЖНОЕ ПОРУЧЕНИЕ № ___</h2>
            <form onsubmit="savePaymentOrder(event)">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">
                    <div>
                        <label>Дата *</label>
                        <input type="date" required value="${new Date().toISOString().split('T')[0]}" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div>
                        <label>№ документа</label>
                        <input type="text" placeholder="123" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                </div>
                
                <div style="margin-bottom:15px">
                    <label>Сумма (₽) *</label>
                    <input type="number" required min="1" 
                           style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                </div>
                
                <div style="margin-bottom:15px">
                    <label>Получатель *</label>
                    <input type="text" required placeholder="ООО «Ромашка»" 
                           style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">
                    <div>
                        <label>ИНН получателя</label>
                        <input type="text" pattern="[0-9]{10,12}" placeholder="10-12 цифр" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                    <div>
                        <label>КПП</label>
                        <input type="text" pattern="[0-9]{9}" placeholder="9 цифр" 
                               style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                    </div>
                </div>
                
                <div style="margin-bottom:15px">
                    <label>Расчётный счёт получателя *</label>
                    <input type="text" pattern="[0-9]{20}" required placeholder="20 цифр" 
                           style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                </div>
                
                <div style="margin-bottom:15px">
                    <label>БИК банка *</label>
                    <input type="text" pattern="[0-9]{9}" required placeholder="9 цифр" 
                           style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px">
                </div>
                
                <div style="margin-bottom:15px">
                    <label>Назначение платежа *</label>
                    <textarea required rows="3" 
                              placeholder="Оплата по договору №__ от ______&#10;Без НДС" 
                              style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:4px"></textarea>
                </div>
                
                <div style="display:flex;gap:10px">
                    <button type="submit" style="flex:1;padding:12px;background:#0088cc;color:#fff;border:none;border-radius:6px;cursor:pointer">💾 Сохранить</button>
                    <button type="button" onclick="closeSideMenu()" style="flex:1;padding:12px;background:#f5f7fa;border:none;border-radius:6px;cursor:pointer">Отмена</button>
                </div>
            </form>
        </div>
    `;
    
    showInSideMenu('Платёжное поручение', content);
}
```

---

## 🟡 ВАЖНЫЕ НЕРЕАЛИЗОВАННЫЕ ФОРМЫ

### 4. Акт сверки (`act-sverka`)

**Проблема:** Нет автоматической сверки с контрагентами

**Решение:** Форма с выбором контрагента, периода, генерацией акта

### 5-9. Нулевая отчётность

**Проблема:** 5 форм требуют реализации

**Решение:** Использовать `generateZeroReport()` с параметрами

### 10. Счёт на оплату (`invoice`)

**Проблема:** Нет выставления счетов дебиторам

**Решение:** Форма счёта с реквизитами и суммой

---

## 📊 СВОДНАЯ ТАБЛИЦА

| Приоритет | Форм | Оценочное время |
|-----------|------|-----------------|
| 🔴 Критично | 3 | 6 часов |
| 🟡 Важно | 7 | 10 часов |
| 🟢 Желательно | 1 | 2 часа |
| **ИТОГО** | **11** | **18 часов** |

---

## ✅ РЕКОМЕНДАЦИИ

### Спринт 1 (Критично - 1 день):
1. ✅ Редактирование пайщика
2. ✅ Возврат паевого взноса
3. ✅ Платёжное поручение

### Спринт 2 (Важно - 2 дня):
4. ✅ Акт сверки
5. ✅ Счёт на оплату
6-9. ✅ Формы нулевой отчётности (4 шт)

### Спринт 3 (Желательно - 0.5 дня):
10. ✅ Улучшение существующих форм

---

## 🔒 ТРЕБОВАНИЯ К БЕЗОПАСНОСТИ

Для всех новых форм:

1. **Валидация:**
   - Проверка обязательных полей
   - Проверка формата (ИНН, БИК, счета)
   - Проверка сумм (не отрицательные)

2. **Подтверждение:**
   - confirm() для финансовых операций
   - confirm() для возвратов

3. **Аудит:**
   - Логирование всех операций
   - Сохранение пользователя и времени

4. **Права:**
   - Проверка прав на создание/редактирование

---

**Документ требует согласования:**
- [ ] Главный бухгалтер
- [ ] Руководитель IT
- [ ] Юрисконсульт
