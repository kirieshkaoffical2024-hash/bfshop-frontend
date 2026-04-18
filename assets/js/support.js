// Support Page JavaScript

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await checkAuth();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    loadMyTickets();
    
    // Report form
    const reportForm = document.getElementById('reportForm');
    reportForm.addEventListener('submit', handleReportSubmit);
    
    // Username search
    const usernameInput = document.getElementById('reportedUsername');
    usernameInput.addEventListener('blur', searchUser);
});

// Search user by username
async function searchUser() {
    const username = document.getElementById('reportedUsername').value.trim();
    
    if (!username) return;
    
    try {
        const response = await apiRequest(`/users/find?username=${encodeURIComponent(username)}`);
        
        if (response.users && response.users.length > 0) {
            const user = response.users[0];
            document.getElementById('reportedUserId').value = user.id;
            showNotification('✅ Пользователь найден', `${user.username}`, 'success');
        } else {
            document.getElementById('reportedUserId').value = '';
            showNotification('❌ Ошибка', 'Пользователь не найден', 'error');
        }
    } catch (error) {
        console.error('Error searching user:', error);
        showNotification('❌ Ошибка', 'Не удалось найти пользователя', 'error');
    }
}

// Handle report submit
async function handleReportSubmit(e) {
    e.preventDefault();
    
    const reportedUserId = document.getElementById('reportedUserId').value;
    const orderId = document.getElementById('orderId').value;
    const reason = document.getElementById('reason').value;
    const description = document.getElementById('description').value;
    
    if (!reportedUserId) {
        showNotification('⚠️ Внимание', 'Сначала найдите пользователя', 'warning');
        return;
    }
    
    try {
        await apiRequest('/support/tickets', {
            method: 'POST',
            body: JSON.stringify({
                reported_user_id: parseInt(reportedUserId),
                order_id: orderId ? parseInt(orderId) : null,
                reason: reason,
                description: description
            })
        });
        
        showNotification(
            '✅ Жалоба отправлена!',
            'Администратор рассмотрит её в ближайшее время',
            'success'
        );
        
        // Reset form
        document.getElementById('reportForm').reset();
        document.getElementById('reportedUserId').value = '';
        
        // Reload tickets
        loadMyTickets();
        
    } catch (error) {
        console.error('Error submitting report:', error);
        showNotification('❌ Ошибка', error.message || 'Не удалось отправить жалобу', 'error');
    }
}

// Load my tickets
async function loadMyTickets() {
    try {
        const response = await apiRequest('/support/tickets/my');
        const container = document.getElementById('ticketsList');
        
        if (response.tickets.length === 0) {
            container.innerHTML = '<p class="no-results">У вас пока нет жалоб</p>';
            return;
        }
        
        container.innerHTML = response.tickets.map(ticket => `
            <div class="ticket-card status-${ticket.status}">
                <div class="ticket-header">
                    <span class="ticket-id">#${ticket.id}</span>
                    <span class="ticket-status status-badge-${ticket.status}">${getStatusText(ticket.status)}</span>
                </div>
                <div class="ticket-body">
                    <p><strong>На пользователя:</strong> ${ticket.reported_user_name}</p>
                    <p><strong>Причина:</strong> ${getReasonText(ticket.reason)}</p>
                    <p><strong>Дата:</strong> ${formatDate(ticket.created_at)}</p>
                    ${ticket.admin_response ? `
                        <div class="admin-response">
                            <strong>Ответ администратора:</strong>
                            <p>${ticket.admin_response}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('ticketsList').innerHTML = 
            '<p class="error-message">Не удалось загрузить жалобы</p>';
    }
}

// Get status text
function getStatusText(status) {
    const statuses = {
        'open': 'Открыта',
        'in_progress': 'В работе',
        'resolved': 'Решена',
        'rejected': 'Отклонена'
    };
    return statuses[status] || status;
}

// Get reason text
function getReasonText(reason) {
    const reasons = {
        'scam': 'Скам (не отдал товар)',
        'fake_account': 'Фейковый аккаунт',
        'wrong_data': 'Неверные данные аккаунта',
        'no_payment': 'Не получил оплату',
        'other': 'Другое'
    };
    return reasons[reason] || reason;
}

// Format date
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
