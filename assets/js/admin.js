// Admin Panel JavaScript

let currentUser = null;
let currentTicket = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await checkAuth();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Проверка прав администратора
    if (!currentUser.is_admin) {
        showNotification('❌ Доступ запрещен', 'Только для администраторов', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Load initial data
    loadAllTickets();
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Ticket status filter
    const statusFilter = document.getElementById('ticketStatusFilter');
    statusFilter.addEventListener('change', () => {
        loadAllTickets(statusFilter.value);
    });
    
    // User search
    const userSearch = document.getElementById('userSearch');
    userSearch.addEventListener('input', debounce(searchUsers, 500));
});

// Switch tabs
function switchTab(tab) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    // Update content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = 'none';
    });
    document.getElementById(`${tab}Tab`).style.display = 'block';
    
    // Load data
    if (tab === 'tickets') {
        loadAllTickets();
    } else if (tab === 'banned') {
        loadBannedUsers();
    } else if (tab === 'users') {
        loadAllUsers();
    }
}

// Load all tickets
async function loadAllTickets(status = '') {
    try {
        const url = status ? `/support/tickets/all?status=${status}` : '/support/tickets/all';
        const response = await apiRequest(url);
        const container = document.getElementById('adminTicketsList');
        
        if (response.tickets.length === 0) {
            container.innerHTML = '<p class="no-results">Нет жалоб</p>';
            return;
        }
        
        container.innerHTML = response.tickets.map(ticket => `
            <div class="admin-ticket-card status-${ticket.status}" onclick="openTicketModal(${ticket.id})">
                <div class="ticket-header">
                    <span class="ticket-id">#${ticket.id}</span>
                    <span class="ticket-status status-badge-${ticket.status}">${getStatusText(ticket.status)}</span>
                </div>
                <div class="ticket-info">
                    <p><strong>От:</strong> ${ticket.reporter_name}</p>
                    <p><strong>На:</strong> <span class="reported-user">${ticket.reported_user_name}</span></p>
                    <p><strong>Причина:</strong> ${getReasonText(ticket.reason)}</p>
                    <p><strong>Дата:</strong> ${formatDate(ticket.created_at)}</p>
                </div>
                ${ticket.admin_name ? `<p class="admin-info">Обработал: ${ticket.admin_name}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('❌ Ошибка', 'Не удалось загрузить жалобы', 'error');
    }
}

// Open ticket modal
async function openTicketModal(ticketId) {
    try {
        const response = await apiRequest('/support/tickets/all');
        currentTicket = response.tickets.find(t => t.id === ticketId);
        
        if (!currentTicket) return;
        
        document.getElementById('modalTicketId').textContent = currentTicket.id;
        document.getElementById('modalReporter').textContent = currentTicket.reporter_name;
        document.getElementById('modalReported').textContent = currentTicket.reported_user_name;
        document.getElementById('modalReason').textContent = getReasonText(currentTicket.reason);
        document.getElementById('modalDate').textContent = formatDate(currentTicket.created_at);
        document.getElementById('modalStatus').textContent = getStatusText(currentTicket.status);
        document.getElementById('modalDescription').textContent = currentTicket.description;
        
        if (currentTicket.admin_response) {
            document.getElementById('adminResponse').value = currentTicket.admin_response;
        }
        
        document.getElementById('ticketModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error opening ticket:', error);
    }
}

// Close ticket modal
function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
    currentTicket = null;
}

// Respond to ticket
async function respondToTicket() {
    const response = document.getElementById('adminResponse').value.trim();
    const status = document.getElementById('ticketNewStatus').value;
    
    if (!response) {
        showNotification('⚠️ Внимание', 'Введите ответ', 'warning');
        return;
    }
    
    try {
        await apiRequest(`/support/tickets/${currentTicket.id}/respond`, {
            method: 'POST',
            body: JSON.stringify({ response, status })
        });
        
        showNotification('✅ Успешно', 'Ответ отправлен', 'success');
        closeTicketModal();
        loadAllTickets();
        
    } catch (error) {
        console.error('Error responding to ticket:', error);
        showNotification('❌ Ошибка', 'Не удалось отправить ответ', 'error');
    }
}

// Ban user from ticket
function banUserFromTicket() {
    document.getElementById('banUsername').value = currentTicket.reported_user_name;
    document.getElementById('banUserId').value = currentTicket.reported_user_id;
    document.getElementById('banReason').value = `Жалоба #${currentTicket.id}: ${currentTicket.reason}`;
    
    closeTicketModal();
    document.getElementById('banModal').style.display = 'flex';
}

// Close ban modal
function closeBanModal() {
    document.getElementById('banModal').style.display = 'none';
}

// Confirm ban
async function confirmBan() {
    const userId = document.getElementById('banUserId').value;
    const reason = document.getElementById('banReason').value.trim();
    const duration = parseInt(document.getElementById('banDuration').value);
    
    if (!reason) {
        showNotification('⚠️ Внимание', 'Укажите причину бана', 'warning');
        return;
    }
    
    try {
        await apiRequest('/support/ban', {
            method: 'POST',
            body: JSON.stringify({
                user_id: parseInt(userId),
                reason: reason,
                duration_days: duration || null
            })
        });
        
        const durationText = duration ? `на ${duration} дней` : 'навсегда';
        showNotification('✅ Пользователь забанен', durationText, 'success');
        
        closeBanModal();
        loadAllTickets();
        
    } catch (error) {
        console.error('Error banning user:', error);
        showNotification('❌ Ошибка', error.message || 'Не удалось забанить', 'error');
    }
}

// Load banned users
async function loadBannedUsers() {
    try {
        const response = await apiRequest('/support/banned');
        const container = document.getElementById('bannedUsersList');
        
        if (response.banned_users.length === 0) {
            container.innerHTML = '<p class="no-results">Нет забаненных пользователей</p>';
            return;
        }
        
        container.innerHTML = response.banned_users.map(ban => `
            <div class="banned-user-card">
                <div class="banned-user-info">
                    <h4>${ban.banned_username}</h4>
                    <p><strong>Причина:</strong> ${ban.reason}</p>
                    <p><strong>Забанил:</strong> ${ban.banned_by_name}</p>
                    <p><strong>Дата:</strong> ${formatDate(ban.banned_at)}</p>
                    ${ban.expires_at ? `<p><strong>До:</strong> ${formatDate(ban.expires_at)}</p>` : '<p><strong>Навсегда</strong></p>'}
                </div>
                <button class="btn btn-secondary btn-sm" onclick="unbanUser(${ban.user_id})">Разбанить</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading banned users:', error);
        showNotification('❌ Ошибка', 'Не удалось загрузить список', 'error');
    }
}

// Unban user
async function unbanUser(userId) {
    if (!confirm('Разбанить этого пользователя?')) return;
    
    try {
        await apiRequest('/support/unban', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
        
        showNotification('✅ Успешно', 'Пользователь разбанен', 'success');
        loadBannedUsers();
        
    } catch (error) {
        console.error('Error unbanning user:', error);
        showNotification('❌ Ошибка', 'Не удалось разбанить', 'error');
    }
}

// Load all users
async function loadAllUsers() {
    try {
        const response = await apiRequest('/users');
        const container = document.getElementById('usersList');
        
        if (response.users.length === 0) {
            container.innerHTML = '<p class="no-results">Нет пользователей</p>';
            return;
        }
        
        container.innerHTML = response.users.map(user => `
            <div class="user-card">
                <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=667eea&color=fff&size=80`}" alt="${user.username}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.username} ${user.is_admin ? '👑' : ''} ${user.is_banned ? '🚫' : ''}</h4>
                    <p>Рейтинг: ${user.rating ? user.rating.toFixed(1) : '0.0'} ⭐ (${user.total_reviews || 0} отзывов)</p>
                    <p>Зарегистрирован: ${formatDate(user.created_at)}</p>
                </div>
                ${!user.is_admin && !user.is_banned ? `
                    <button class="btn btn-error btn-sm" onclick="openBanModalForUser(${user.id}, '${user.username}')">Забанить</button>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('❌ Ошибка', 'Не удалось загрузить пользователей', 'error');
    }
}

// Open ban modal for user
function openBanModalForUser(userId, username) {
    document.getElementById('banUsername').value = username;
    document.getElementById('banUserId').value = userId;
    document.getElementById('banReason').value = '';
    document.getElementById('banModal').style.display = 'flex';
}

// Search users
async function searchUsers() {
    const query = document.getElementById('userSearch').value.trim();
    
    if (!query) {
        loadAllUsers();
        return;
    }
    
    try {
        const response = await apiRequest(`/users/search?username=${query}`);
        const container = document.getElementById('usersList');
        
        if (response.users.length === 0) {
            container.innerHTML = '<p class="no-results">Пользователи не найдены</p>';
            return;
        }
        
        container.innerHTML = response.users.map(user => `
            <div class="user-card">
                <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=667eea&color=fff&size=80`}" alt="${user.username}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.username} ${user.is_admin ? '👑' : ''} ${user.is_banned ? '🚫' : ''}</h4>
                    <p>Рейтинг: ${user.rating ? user.rating.toFixed(1) : '0.0'} ⭐</p>
                </div>
                ${!user.is_admin && !user.is_banned ? `
                    <button class="btn btn-error btn-sm" onclick="openBanModalForUser(${user.id}, '${user.username}')">Забанить</button>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

// Helper functions
function getStatusText(status) {
    const statuses = {
        'open': 'Открыта',
        'in_progress': 'В работе',
        'resolved': 'Решена',
        'rejected': 'Отклонена'
    };
    return statuses[status] || status;
}

function getReasonText(reason) {
    const reasons = {
        'scam': 'Скам',
        'fake_account': 'Фейковый аккаунт',
        'wrong_data': 'Неверные данные',
        'no_payment': 'Не получил оплату',
        'other': 'Другое'
    };
    return reasons[reason] || reason;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
