// Chat Client JavaScript (без WebSocket, на polling)

let currentUser = null;
let currentOrder = null;
let orderId = null;
let pollingInterval = null;
let lastMessageId = 0;

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
        const orderResponse = await apiRequest(`/orders/${orderId}`);
        currentOrder = orderResponse.order;
        
        // Update UI
        document.getElementById('chatTitle').textContent = `Заказ #${orderId}: ${currentOrder.listing_title}`;
        
        // Load messages
        await loadMessages();
        
        // Start polling (обновление каждую секунду для реального времени)
        pollingInterval = setInterval(loadMessages, 1000);
        
        // Send message handler
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Show chat
        document.getElementById('loading').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'flex';
        
    } catch (error) {
        console.error('Error initializing chat:', error);
        document.getElementById('loading').textContent = 'Ошибка загрузки чата';
    }
}

// Load messages
async function loadMessages() {
    try {
        const response = await apiRequest(`/chat/${orderId}`);
        const messages = response.messages || [];
        
        const messagesContainer = document.getElementById('messages');
        
        // Проверяем есть ли новые сообщения
        if (messages.length > 0) {
            const latestId = messages[messages.length - 1].id;
            
            if (latestId > lastMessageId) {
                // Есть новые сообщения - обновляем
                messagesContainer.innerHTML = '';
                
                messages.forEach(msg => {
                    const messageEl = createMessageElement(msg);
                    messagesContainer.appendChild(messageEl);
                });
                
                lastMessageId = latestId;
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } else if (lastMessageId === 0) {
            // Первая загрузка, сообщений нет
            messagesContainer.innerHTML = '<div class="no-messages">Нет сообщений. Начните диалог!</div>';
        }
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Create message element
function createMessageElement(message) {
    const div = document.createElement('div');
    
    // Системное сообщение
    if (message.is_system) {
        div.className = 'message system';
        div.innerHTML = `
            <div class="message-text">${escapeHtml(message.message).replace(/\n/g, '<br>')}</div>
        `;
        return div;
    }
    
    // Обычное сообщение
    const isOwn = message.sender_id === currentUser.id;
    div.className = `message ${isOwn ? 'own' : 'other'}`;
    
    const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    div.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${message.sender_name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(message.message)}</div>
    `;
    
    return div;
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        await apiRequest(`/chat/${orderId}`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });
        
        input.value = '';
        
        // Сразу загружаем новые сообщения
        await loadMessages();
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Ошибка отправки сообщения');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initChat();
});
