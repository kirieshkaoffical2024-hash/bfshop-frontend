// Chat Client JavaScript with Socket.IO

let socket = null;
let currentUser = null;
let orderId = null;
let order = null;
let selectedRating = 0;

// Get order ID from URL
function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('order');
}

// Initialize chat
async function initChat() {
    try {
        orderId = getOrderIdFromUrl();
        
        if (!orderId) {
            window.location.href = 'orders.html';
            return;
        }
        
        currentUser = await checkAuth();
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Load order details
        order = await apiRequest(`/orders/${orderId}`);
        
        // Update UI
        document.getElementById('orderTitle').textContent = order.order.title;
        document.getElementById('orderStatus').textContent = `Статус: ${getStatusText(order.order.status)}`;
        document.getElementById('orderStatus').className = `order-status status-${order.order.status}`;
        
        // Show order actions for seller
        if (currentUser.id === order.order.seller_id && order.order.status === 'pending') {
            document.getElementById('orderActions').style.display = 'block';
        }
        
        // Show review section if completed and buyer
        if (order.order.status === 'completed' && currentUser.id === order.order.buyer_id) {
            document.getElementById('reviewSection').style.display = 'block';
        }
        
        // Load chat messages
        await loadMessages();
        
        // Connect to WebSocket
        connectSocket();
        
    } catch (error) {
        console.error('Error initializing chat:', error);
        showNotification('❌ Ошибка', 'Не удалось загрузить чат', 'error');
    }
}

// Load messages
async function loadMessages() {
    try {
        const messages = await apiRequest(`/chat/${orderId}`);
        
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="no-messages">Нет сообщений. Начните разговор!</div>';
            return;
        }
        
        messages.forEach(msg => {
            appendMessage(msg);
        });
        
        scrollToBottom();
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Connect to Socket.IO
function connectSocket() {
    const SOCKET_URL = 'http://localhost:3000';
    
    socket = io(SOCKET_URL, {
        auth: {
            token: getToken()
        }
    });
    
    socket.on('connect', () => {
        console.log('Connected to chat server');
        socket.emit('join-chat', orderId);
    });
    
    socket.on('new-message', (message) => {
        appendMessage(message);
        scrollToBottom();
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
    });
}

// Append message to chat
function appendMessage(message) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    
    const isOwn = message.sender_id === currentUser.id;
    const isSystem = message.is_system;
    
    if (isSystem) {
        div.className = 'chat-message system';
        div.innerHTML = `
            <div class="message-content">${message.message.replace(/\n/g, '<br>')}</div>
            <div class="message-time">${formatTime(message.created_at)}</div>
        `;
    } else {
        div.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        div.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${isOwn ? 'Вы' : message.sender_username}</span>
                <span class="message-time">${formatTime(message.created_at)}</span>
            </div>
            <div class="message-content">${message.message.replace(/\n/g, '<br>')}</div>
        `;
    }
    
    container.appendChild(div);
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        socket.emit('send-message', {
            orderId: orderId,
            senderId: currentUser.id,
            message: message
        });
        
        input.value = '';
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('❌ Ошибка', 'Не удалось отправить сообщение', 'error');
    }
}

// Confirm order (seller only)
async function confirmOrder() {
    if (!confirm('Подтвердите, что вы получили оплату фруктом?')) {
        return;
    }
    
    try {
        const result = await apiRequest(`/orders/${orderId}/confirm`, {
            method: 'POST'
        });
        
        // Update UI
        order.status = 'completed';
        document.getElementById('orderStatus').textContent = 'Статус: Завершен';
        document.getElementById('orderStatus').className = 'order-status status-completed';
        document.getElementById('orderActions').style.display = 'none';
        
        // Показываем красивое уведомление
        showNotification(
            '✅ Заказ подтвержден!',
            'Данные аккаунта отправлены покупателю в чат',
            'success'
        );
        
        // Перезагружаем сообщения чтобы показать данные аккаунта
        await loadMessages();
        
    } catch (error) {
        console.error('Error confirming order:', error);
        showNotification(
            '❌ Ошибка',
            'Не удалось подтвердить заказ',
            'error'
        );
    }
}

// Submit review
async function submitReview() {
    if (selectedRating === 0) {
        showNotification('⚠️ Внимание', 'Пожалуйста, выберите рейтинг', 'warning');
        return;
    }
    
    const comment = document.getElementById('reviewComment').value.trim();
    
    try {
        await apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify({
                order_id: orderId,
                rating: selectedRating,
                comment: comment
            })
        });
        
        document.getElementById('reviewSection').style.display = 'none';
        showNotification(
            '⭐ Отзыв отправлен!',
            'Спасибо за ваш отзыв!',
            'success'
        );
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification(
            '❌ Ошибка',
            'Не удалось отправить отзыв',
            'error'
        );
    }
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status text in Russian
function getStatusText(status) {
    const statuses = {
        'pending': 'Ожидает оплаты',
        'payment_sent': 'Оплата отправлена',
        'confirmed': 'Подтверждено',
        'completed': 'Завершено',
        'cancelled': 'Отменено'
    };
    return statuses[status] || status;
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Send message
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Confirm order
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmOrder);
    }
    
    // Star rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            
            // Update stars
            stars.forEach((s, index) => {
                if (index < selectedRating) {
                    s.textContent = '★';
                    s.classList.add('active');
                } else {
                    s.textContent = '☆';
                    s.classList.remove('active');
                }
            });
        });
        
        // Hover effect
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.textContent = '★';
                } else {
                    s.textContent = '☆';
                }
            });
        });
    });
    
    // Reset stars on mouse leave
    const starRating = document.getElementById('starRating');
    if (starRating) {
        starRating.addEventListener('mouseleave', () => {
            stars.forEach((s, index) => {
                if (index < selectedRating) {
                    s.textContent = '★';
                } else {
                    s.textContent = '☆';
                }
            });
        });
    }
    
    // Submit review
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', submitReview);
    }
    
    // View order
    const viewOrderBtn = document.getElementById('viewOrderBtn');
    if (viewOrderBtn) {
        viewOrderBtn.addEventListener('click', () => {
            window.location.href = `listing.html?id=${order.listing_id}`;
        });
    }
    
    initChat();
});
