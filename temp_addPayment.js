function addPayment() {
    // Генерируем автоматический номер документа
    const nextPaymentNumber = payments.length + 1;
    const paymentDocumentNumber = `DOC-${new Date().getFullYear()}-${nextPaymentNumber.toString().padStart(4, '0')}`;
    
    const content = `
        <h3>Добавить паевой взнос</h3>
        <form id="payment-form">
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-member">Пайщик *</label>
                    <select id="payment-member" required>
                        <option value="">Выберите пайщика</option>
                        ${members.map(member => `<option value="${member.id}">${member.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="payment-type">Тип взноса *</label>
                    <select id="payment-type" required onchange="togglePaymentForm()">
                        <option value="entrance">Вступительный взнос</option>
                        <option value="share" selected>Паевой взнос</option>
                        <option value="voluntary_share">Добровольный паевой взнос</option>
                        <option value="membership">Членский взнос</option>
                        <option value="targeted">Целевой взнос</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-method">Форма оплаты *</label>
                    <select id="payment-method" required onchange="togglePaymentDetails()">
                        <option value="cash">Наличные</option>
                        <option value="non_cash">Безналичные</option>
                        <option value="property">Имущество</option>
                    </select>
                </div>
                <div class="form-group" id="amount-field" style="display:block;">
                    <label for="payment-amount">Сумма *</label>
                    <input type="number" id="payment-amount" required>
                </div>
            </div>
            <div class="form-group" id="property-details" style="display:none;">
                <label for="payment-property-desc">Описание имущества *</label>
                <textarea id="payment-property-desc" rows="2" placeholder="Опишите имущество, передаваемое в качестве паевого взноса"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="payment-date">Дата *</label>
                    <input type="date" id="payment-date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="payment-document">Номер документа *</label>
                    <input type="text" id="payment-document" value="${paymentDocumentNumber}" readonly required>
                </div>
            </div>
            <div class="form-group">
                <label for="payment-description">Описание</label>
                <textarea id="payment-description" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="payment-paid" checked> Оплачено
                </label>
            </div>
            <div style="margin-top: 1rem;">
                <button type="button" onclick="savePayment()">Сохранить</button>
                <button type="button" onclick="closeSideMenu()">Отмена</button>
            </div>
        </form>
        <script>
            // Внутренняя версия функции для использования в шаблоне
            function togglePaymentForm() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field');
                const propertyDetails = document.getElementById('property-details');

                if (methodSelect && amountField && propertyDetails) {
                    if (methodSelect.value === 'property') {
                        amountField.style.display = 'none';
                        propertyDetails.style.display = 'block';
                    } else {
                        amountField.style.display = 'block';
                        propertyDetails.style.display = 'none';
                    }
                }
            }
            
            function togglePaymentDetails() {
                const methodSelect = document.getElementById('payment-method');
                const amountField = document.getElementById('amount-field');
                const propertyDetails = document.getElementById('property-details');

                if (methodSelect && amountField && propertyDetails) {
                    if (methodSelect.value === 'property') {
                        amountField.style.display = 'none';
                        propertyDetails.style.display = 'block';
                    } else {
                        amountField.style.display = 'block';
                        propertyDetails.style.display = 'none';
                    }
                }
            }
        </script>
    `;
    
    showSideMenu('Добавить паевой взнос', content);

    // Инициализируем состояние полей
    setTimeout(() => {
        togglePaymentForm();
    }, 100);
}