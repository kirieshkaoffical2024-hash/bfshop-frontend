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
        listing = await apiRequest(`/listings/${listingId}`);
        
        // Update UI
        const typeEmoji = {
            'account': '🎮',
            'boost': '⚡',
            'quest': '🗡️',
            'boss': '👹'
        };
        
        document.getElementById('listingType').textContent = `${typeEmoji[listing.type]} ${listing.type}`;
        document.getElementById('listingTitle').textContent = listing.title;
        document.getElementById('listingDescription').textContent = listing.description;
        document.getElementById('listingPrice').textContent = `🍎 ${listing.price_amount}x ${listing.price_fruit}`;
        
        // Seller info
        document.getElementById('sellerAvatar').src = listing.seller_avatar || '/assets/images/default-avatar.png';
        document.getElementById('sellerName').textContent = listing.seller_username;
        document.getElementById('sellerRating').textContent = formatRating(listing.seller_rating || 0);
        
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
        const reviews = await apiRequest(`/reviews/${listing.seller_id}`);
        
        const container = document.getElementById('reviewsList');
        container.innerHTML = '';
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-reviews">No reviews yet</p>';
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
    
    const stars = '⭐'.repeat(review.rating);
    
    div.innerHTML = `
        <div class="review-header">
            <img src="${review.reviewer_avatar || '/assets/images/default-avatar.png'}" alt="Reviewer" class="review-avatar">
            <div class="review-info">
                <div class="review-author">${review.reviewer_username}</div>
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
    modal.style.display = 'flex';
    
    document.getElementById('cancelBuyBtn').onclick = () => {
        modal.style.display = 'none';
    };
    
    document.getElementById('confirmBuyBtn').onclick = confirmPurchase;
}

// Confirm purchase
async function confirmPurchase() {
    try {
        const order = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({
                listing_id: listingId,
                fruit_offered: listing.price_fruit,
                fruit_amount: listing.price_amount
            })
        });
        
        // Close modal
        document.getElementById('buyModal').style.display = 'none';
        
        // Redirect to chat
        window.location.href = `chat.html?order=${order.id}`;
        
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Failed to create order: ' + error.message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadListing();
});
