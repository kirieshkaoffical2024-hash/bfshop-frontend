// Listings JavaScript

let currentFilter = 'all';
let currentSearch = '';

// Load listings
async function loadListings() {
    const listingsGrid = document.getElementById('listingsGrid');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    
    if (!listingsGrid) return;
    
    loading.style.display = 'block';
    noResults.style.display = 'none';
    listingsGrid.innerHTML = '';
    
    try {
        const params = new URLSearchParams();
        if (currentFilter !== 'all') params.append('type', currentFilter);
        if (currentSearch) params.append('search', currentSearch);
        
        const data = await apiRequest(`/listings?${params.toString()}`);
        
        loading.style.display = 'none';
        
        if (data.listings.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        
        data.listings.forEach(listing => {
            const card = createListingCard(listing);
            listingsGrid.appendChild(card);
        });
    } catch (error) {
        loading.style.display = 'none';
        console.error('Error loading listings:', error);
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
            <span class="listing-type">${typeEmoji[listing.type] || ''} ${listing.type.toUpperCase()}</span>
            <h3 class="listing-title">${listing.title}</h3>
            <p class="listing-description">${listing.description || 'No description'}</p>
            <div class="listing-price">
                🍎 ${listing.price_amount} ${listing.price_fruit}
            </div>
            <div class="listing-seller">
                <img src="${listing.seller_avatar || '/assets/images/default-avatar.png'}" class="seller-avatar">
                <span>${listing.seller_name}</span>
                <span class="seller-rating">${formatRating(listing.seller_rating || 0)}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load listings
    loadListings();
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.type;
            loadListings();
        });
    });
    
    // Search
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    searchBtn?.addEventListener('click', () => {
        currentSearch = searchInput.value;
        loadListings();
    });
    
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value;
            loadListings();
        }
    });
});
