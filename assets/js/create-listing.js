// Create Listing JavaScript

let currentUser = null;

// Check auth on load
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await checkAuth();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Type change handler
    const typeSelect = document.getElementById('listingType');
    typeSelect.addEventListener('change', updateDynamicFields);
    
    // Form submit
    const form = document.getElementById('createListingForm');
    form.addEventListener('submit', handleSubmit);
});

// Update dynamic fields based on type
function updateDynamicFields() {
    const type = document.getElementById('listingType').value;
    const container = document.getElementById('dynamicFields');
    
    container.innerHTML = '';
    
    if (type === 'account') {
        container.innerHTML = `
            <div class="form-group">
                <label for="accountLevel">Уровень аккаунта</label>
                <input type="number" id="accountLevel" name="account_level" min="1" max="2550" placeholder="2550">
            </div>
            <div class="form-group">
                <label for="accountFruits">Фрукты в наличии (через запятую)</label>
                <input type="text" id="accountFruits" name="account_fruits" placeholder="Тигр, Дракон, Тесто">
            </div>
            <div class="form-group">
                <label for="accountBeli">Количество Бели</label>
                <input type="number" id="accountBeli" name="account_beli" placeholder="1000000000">
            </div>
            <div class="form-group">
                <label for="accountData">Данные аккаунта (логин/пароль) *</label>
                <textarea id="accountData" name="account_data" rows="4" placeholder="Логин: example&#10;Пароль: password123&#10;&#10;Эти данные будут переданы покупателю после подтверждения оплаты" required></textarea>
                <small style="color: #888;">⚠️ Данные будут показаны покупателю только после того, как вы подтвердите получение фрукта</small>
            </div>
        `;
    } else if (type === 'boost') {
        container.innerHTML = `
            <div class="form-group">
                <label for="boostFrom">Уровень от</label>
                <input type="number" id="boostFrom" name="boost_from" min="1" placeholder="1">
            </div>
            <div class="form-group">
                <label for="boostTo">Уровень до</label>
                <input type="number" id="boostTo" name="boost_to" min="1" placeholder="2550">
            </div>
            <div class="form-group">
                <label for="boostTime">Примерное время (часов)</label>
                <input type="number" id="boostTime" name="boost_time" min="1" placeholder="24">
            </div>
        `;
    } else if (type === 'quest') {
        container.innerHTML = `
            <div class="form-group">
                <label for="questName">Название квеста/рейда</label>
                <input type="text" id="questName" name="quest_name" placeholder="Рейд Будды, Рейд Теста и т.д.">
            </div>
            <div class="form-group">
                <label for="questDifficulty">Сложность</label>
                <select id="questDifficulty" name="quest_difficulty">
                    <option value="easy">Легко</option>
                    <option value="medium">Средне</option>
                    <option value="hard">Сложно</option>
                    <option value="expert">Эксперт</option>
                </select>
            </div>
        `;
    } else if (type === 'boss') {
        container.innerHTML = `
            <div class="form-group">
                <label for="bossName">Имя босса</label>
                <input type="text" id="bossName" name="boss_name" placeholder="Король Теста, rip_indra и т.д.">
            </div>
            <div class="form-group">
                <label for="bossQuantity">Количество призывов</label>
                <input type="number" id="bossQuantity" name="boss_quantity" min="1" placeholder="1">
            </div>
        `;
    }
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        type: formData.get('type'),
        title: formData.get('title'),
        description: formData.get('description'),
        price_fruit: formData.get('price_fruit'),
        price_amount: parseInt(formData.get('price_amount')),
        details: {}
    };
    
    // Add type-specific details
    const type = data.type;
    if (type === 'account') {
        data.details = {
            level: formData.get('account_level'),
            fruits: formData.get('account_fruits'),
            beli: formData.get('account_beli')
        };
        data.account_data = formData.get('account_data'); // Данные аккаунта
    } else if (type === 'boost') {
        data.details = {
            from_level: formData.get('boost_from'),
            to_level: formData.get('boost_to'),
            estimated_time: formData.get('boost_time')
        };
    } else if (type === 'quest') {
        data.details = {
            quest_name: formData.get('quest_name'),
            difficulty: formData.get('quest_difficulty')
        };
    } else if (type === 'boss') {
        data.details = {
            boss_name: formData.get('boss_name'),
            quantity: formData.get('boss_quantity')
        };
    }
    
    try {
        const result = await apiRequest('/listings', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showFormMessage('Объявление создано успешно!', 'success');
        
        setTimeout(() => {
            window.location.href = `listing.html?id=${result.id}`;
        }, 1500);
        
    } catch (error) {
        console.error('Error creating listing:', error);
        showFormMessage(error.message || 'Не удалось создать объявление', 'error');
    }
}

// Show form message
function showFormMessage(message, type) {
    const messageEl = document.getElementById('formMessage');
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}
