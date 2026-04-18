// Profile Page JavaScript

let currentUser = null;
let profileUserId = null;
let isOwnProfile = false;

// Get user ID from URL
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load profile data
async function loadProfile() {
    try {
        profileUserId = getUserIdFromUrl();
        currentUser = await checkAuth();
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // If no ID specified, show own profile
        if (!profileUserId) {
            profileUserId = currentUser.id;
        }
        
        isOwnProfile = (profileUserId == currentUser.id);
        
        // Load user data
        const userData = await apiRequest(`/users/${profileUserId}`);
        
        // Update UI
        document.getElementById('profileAvatar').src = userData.avatar_url || '/assets/images/default-avatar.png';
        document.getElementById('profileUsername').textContent = userData.username;
        document.getElementById('profileRating').textContent = formatRating(userData.rating || 0);
        document.getElementById('totalReviews').textContent = userData.total_reviews || 0;
        
        // Show avatar upload for own profile
        if (isOwnProfile) {
            document.getElementById('avatarUpload').style.display = 'block';
        }
        
        // Load listings
        await loadUserListings();
        
        // Load reviews
        await loadUserReviews();
        
        // Show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Failed to load profile', 'error');
    }
}

// Load user listings
async function loadUserListings() {
    try {
        const listings = await apiRequest(`/listings?seller_id=${profileUserId}`);
        
        const container = document.getElementById('userListings');
        container.innerHTML = '';
        
        if (listings.length === 0) {
            document.getElementById('noListings').style.display = 'block';
            return;
        }
        
        document.getElementById('totalListings').textContent = listings.length;
        
        listings.forEach(listing => {
            const card = createListingCard(listing);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading listings:', error);
    }
}

// Load user reviews
async function loadUserReviews() {
    try {
        const reviews = await apiRequest(`/reviews/${profileUserId}`);
        
        const container = document.getElementById('userReviews');
        container.innerHTML = '';
        
        if (reviews.length === 0) {
            document.getElementById('noReviews').style.display = 'block';
            return;
        }
        
        reviews.forEach(review => {
            const reviewEl = createReviewElement(review);
            container.appendChild(reviewEl);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Create listing card
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.onclick = () => window.location.href = `listing.html?id=${listing.id}`;
    
    const typeEmoji = {
        'account': '🎮',
        'boost': '⚡',
        'quest': '🗡️',
        'boss': '👹'
    };
    
    card.innerHTML = `
        <div class="listing-image"></div>
        <div class="listing-content">
            <div class="listing-type">${typeEmoji[listing.type]} ${listing.type}</div>
            <h3 class="listing-title">${listing.title}</h3>
            <p class="listing-description">${listing.description}</p>
            <div class="listing-price">
                <span>🍎 ${listing.price_amount}x ${listing.price_fruit}</span>
            </div>
            <div class="listing-status">Status: ${listing.status}</div>
        </div>
    `;
    
    return card;
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
        <div class="review-comment">${review.comment || 'No comment'}</div>
    `;
    
    return div;
}

// Avatar upload
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('avatar', file);
            
            try {
                const response = await fetch(`${API_URL}/users/avatar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('profileAvatar').src = data.avatar_url;
                    showMessage('Avatar updated!', 'success');
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                console.error('Error uploading avatar:', error);
                showMessage('Failed to upload avatar', 'error');
            }
        });
    }
    
    // Tab switching
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
            
            if (tab === 'listings') {
                document.getElementById('listingsTab').style.display = 'block';
            } else if (tab === 'reviews') {
                document.getElementById('reviewsTab').style.display = 'block';
            }
        });
    });
    
    loadProfile();
});

function showMessage(message, type) {
    // Simple alert for now
    alert(message);
}
