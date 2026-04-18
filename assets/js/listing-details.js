// Listing Details JavaScript

let currentUser = null;
let listing = null;
let listingId = null;

// Get listing ID from URL
function getListingIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load listing details
async function loadListing() {
    try {
        listingId = getListingIdFromUrl();
        
        if (!listingId) {
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = await checkAuth();
        
        // Load listing
        const response = await apiRequest(`/listings/${listingId}`);
        listing = response.listing;
        
        // Update UI
        const typeEmoji = {
            'account': '🎮',
            'boost': '⚡',
            'quest': '🗡️',
            'boss': '👹'
        };
        
        document.getElementById('listingType').textContent = `${typeEmoji[listing.type] || ''} ${listing.type.toUpperCase()}`;
        document.getElementById('listingTitle').textContent = listing.title;
        document.getElementById('listingDescription').textContent = listing.description || 'Нет описания';
        document.getElementById('listingPrice').textContent = `🍎 ${listing.price_amount}x ${listing.price_fruit}`;
        
        // Seller info
        const sellerAvatar = document.getElementById('sellerAvatar');
        if (sellerAvatar) {
            sellerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller_name)}&background=e94560&color=fff`;
        }
        document.getElementById('sellerName').textContent = listing.seller_name;
        const sellerRating = parseFloat(listing.seller_rating) || 0;
        document.getElementById('sellerRating').textContent = `⭐ ${sellerRating.toFixed(1)}`;
        
        // Buy button
        const buyBtn = document.getElementById('buyBtn');
        if (currentUser && currentUser.id !== listing.seller_id && listing.status === 'active') {
            buyBtn.style.display = 'block';
            buyBtn.addEventListener('click', showBuyModal);
        } else {
            buyBtn.style.display = 'none';
        }
        
        // Load seller reviews
        await loadSellerReviews();
        
        // Show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('listingContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading listing:', error);
        document.getElementById('loading').textContent = 'Failed to load listing';
    }
}

// Load seller reviews
async function loadSellerReviews() {
    try {
        const response = await apiRequest(`/reviews/${listing.seller_id}`);
        const reviews = response.reviews || [];
        
        const container = document.getElementById('reviewsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-reviews">Нет отзывов</p>';
            return;
        }
        
        reviews.slice(0, 5).forEach(review => {
            const reviewEl = createReviewElement(review);
            container.appendChild(reviewEl);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Create review element
function createReviewElement(review) {
    const div = document.createElement('div');
    div.className = 'review-item';
    
    const stars = '⭐'.repeat(review.rating || 0);
    
    div.innerHTML = `
        <div class="review-header">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer_name)}&background=e94560&color=fff" alt="Reviewer" class="review-avatar">
            <div class="review-info">
                <div class="review-author">${review.reviewer_name}</div>
                <div class="review-rating">${stars} ${review.rating}/5</div>
            </div>
            <div class="review-date">${formatDate(review.created_at)}</div>
        </div>
        ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
    `;
    
    return div;
}

// Show buy modal
function showBuyModal() {
    const modal = document.getElementById('buyModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    const cancelBtn = document.getElementById('cancelBuyBtn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    const confirmBtn = document.getElementById('confirmBuyBtn');
    if (confirmBtn) {
        confirmBtn.onclick = confirmPurchase;
    }
}

// Confirm purchase
async function confirmPurchase() {
    try {
        const response = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({
                listing_id: listingId,
                fruit_offered: listing.price_fruit,
                fruit_amount: listing.price_amount
            })
        });
        
        // Close modal
        const modal = document.getElementById('buyModal');
        if (modal) modal.style.display = 'none';
        
        // Redirect to chat
        window.location.href = `chat.html?order=${response.order.id}`;
        
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Ошибка создания заказа: ' + error.message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadListing();
});
