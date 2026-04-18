// BFshop - Main App JavaScript

const API_URL = 'https://bfshop-backend.vercel.app/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token
function removeToken() {
    localStorage.removeItem('token');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Check if user is logged in
async function checkAuth() {
    const token = getToken();
    
    if (!token) {
        return null;
    }
    
    try {
        const data = await apiRequest('/auth/me');
        return data.user;
    } catch (error) {
        removeToken();
        return null;
    }
}

// Update UI based on auth status
async function updateAuthUI() {
    const user = await checkAuth();
    
    const userMenu = document.getElementById('userMenu');
    const authButtons = document.getElementById('authButtons');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const adminLink = document.getElementById('adminLink');
    
    if (user) {
        if (userMenu) userMenu.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        if (userName) userName.textContent = user.username;
        if (userAvatar) {
            userAvatar.src = user.avatar_url || '/assets/images/default-avatar.png';
        }
        
        // Показываем ссылку на админ-панель для админов
        if (adminLink && user.is_admin) {
            adminLink.style.display = 'inline-block';
        }
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (adminLink) adminLink.style.display = 'none';
    }
    
    return user;
}

// Logout
function logout() {
    removeToken();
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const user = await updateAuthUI();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation links
    const myListingsLink = document.getElementById('myListingsLink');
    const myOrdersLink = document.getElementById('myOrdersLink');
    
    if (myListingsLink && user) {
        myListingsLink.href = `profile.html?id=${user.id}`;
    }
    
    if (myOrdersLink && user) {
        myOrdersLink.href = 'orders.html';
    }
});

// Show message
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Показать красивое уведомление
function showNotification(title, message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        <div class="notification-header">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-title">${title}</span>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format rating
function formatRating(rating) {
    const stars = '⭐'.repeat(Math.round(rating));
    return `${stars} ${rating.toFixed(1)}`;
}
