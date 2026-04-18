// Orders Page JavaScript

let currentUser = null;

// Load orders
async function loadOrders() {
    try {
        currentUser = await checkAuth();
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Load buying orders
        await loadBuyingOrders();
        
        // Load selling orders
        await loadSellingOrders();
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load buying orders
async function loadBuyingOrders() {
    try {
        const orders = await apiRequest('/orders?type=buying');
        
        const container = document.getElementById('buyingOrders');
        const loading = document.getElementById('buyingLoading');
        const noResults = document.getElementById('noBuyingOrders');
        
        loading.style.display = 'none';
        
        if (orders.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        container.innerHTML = '';
        
        orders.forEach(order => {
            const orderEl = createOrderElement(order, 'buyer');
            container.appendChild(orderEl);
        });
        
    } catch (error) {
        console.error('Error loading buying orders:', error);
        document.getElementById('buyingLoading').textContent = 'Failed to load orders';
    }
}

// Load selling orders
async function loadSellingOrders() {
    try {
        const orders = await apiRequest('/orders?type=selling');
        
        const container = document.getElementById('sellingOrders');
        const loading = document.getElementById('sellingLoading');
        const noResults = document.getElementById('noSellingOrders');
        
        loading.style.display = 'none';
        
        if (orders.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        container.innerHTML = '';
        
        orders.forEach(order => {
            const orderEl = createOrderElement(order, 'seller');
            container.appendChild(orderEl);
        });
        
    } catch (error) {
        console.error('Error loading selling orders:', error);
        document.getElementById('sellingLoading').textContent = 'Failed to load orders';
    }
}

// Create order element
function createOrderElement(order, role) {
    const div = document.createElement('div');
    div.className = 'order-card';
    
    const statusColors = {
        'pending': 'warning',
        'confirmed': 'success',
        'completed': 'success',
        'cancelled': 'error'
    };
    
    const statusColor = statusColors[order.status] || 'secondary';
    
    const otherUser = role === 'buyer' ? order.seller : order.buyer;
    
    div.innerHTML = `
        <div class="order-header">
            <div class="order-id">Order #${order.id}</div>
            <div class="order-status status-${statusColor}">${order.status}</div>
        </div>
        <div class="order-body">
            <div class="order-listing">
                <h4>${order.listing_title}</h4>
                <p>${order.listing_description}</p>
            </div>
            <div class="order-details">
                <div class="order-price">
                    <span class="label">Price:</span>
                    <span class="value">🍎 ${order.fruit_amount}x ${order.fruit_offered}</span>
                </div>
                <div class="order-user">
                    <span class="label">${role === 'buyer' ? 'Seller' : 'Buyer'}:</span>
                    <span class="value">${otherUser.username}</span>
                </div>
                <div class="order-date">
                    <span class="label">Created:</span>
                    <span class="value">${formatDate(order.created_at)}</span>
                </div>
            </div>
        </div>
        <div class="order-actions">
            <button class="btn btn-secondary btn-sm" onclick="viewOrder(${order.id})">View Details</button>
            <button class="btn btn-primary btn-sm" onclick="openChat(${order.id})">💬 Chat</button>
            ${order.status === 'completed' && !order.has_review ? 
                `<button class="btn btn-primary btn-sm" onclick="leaveReview(${order.id})">⭐ Review</button>` : ''}
        </div>
    `;
    
    return div;
}

// View order details
function viewOrder(orderId) {
    window.location.href = `listing.html?order=${orderId}`;
}

// Open chat
function openChat(orderId) {
    window.location.href = `chat.html?order=${orderId}`;
}

// Leave review
function leaveReview(orderId) {
    window.location.href = `chat.html?order=${orderId}#review`;
}

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.style.display = 'none';
            });
            
            if (tab === 'buying') {
                document.getElementById('buyingTab').style.display = 'block';
            } else if (tab === 'selling') {
                document.getElementById('sellingTab').style.display = 'block';
            }
        });
    });
    
    loadOrders();
});
