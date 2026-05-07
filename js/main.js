// Main initialization and event listeners
(async function () {
    // --- State ---
    window.allProducts = [];
    window.shuffledProducts = [];
    window.lastShuffleTime = 0;
    window.currentPage = 1;
    const itemsPerPage = 20;
    window.selectedCategories = [];
    window.searchQuery = '';
    window.sortBy = null;
    window.cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    let searchTimeout;

    // --- DOM Elements ---
    const productGrid = document.getElementById('product-grid');
    const loadingEl = document.getElementById('loading-indicator');
    const paginationEl = document.getElementById('pagination');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortSelect = document.getElementById('sort-select');
    const userArea = document.getElementById('user-area');
    const successModal = document.getElementById('success-modal');

    // Make DOM elements globally accessible
    window.productGrid = productGrid;
    window.loadingEl = loadingEl;
    window.paginationEl = paginationEl;
    window.searchInput = searchInput;
    window.searchBtn = searchBtn;
    window.sortSelect = sortSelect;
    window.userArea = userArea;
    window.successModal = successModal;

    // --- Sidebar Elements ---
    const sidebar = document.getElementById('sidebar');
    const sidebarCartTrigger = document.getElementById('cart-sidebar-trigger');
    const sidebarCartBadge = document.getElementById('sidebar-cart-badge');
    const navItems = document.querySelectorAll('.sidebar-item[data-page]');
    const filterItems = document.querySelectorAll('.filter-item[data-category]');

    // Make sidebar elements globally accessible
    window.sidebar = sidebar;
    window.sidebarCartTrigger = sidebarCartTrigger;
    window.sidebarCartBadge = sidebarCartBadge;
    window.navItems = navItems;
    window.filterItems = filterItems;

    // --- Cart Sidebar Elements ---
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Make cart elements globally accessible
    window.cartSidebar = cartSidebar;
    window.closeCartBtn = closeCartBtn;
    window.cartItemsContainer = cartItemsContainer;
    window.cartTotalAmount = cartTotalAmount;
    window.checkoutBtn = checkoutBtn;

    // --- DETAIL MODAL ELEMENTS ---
    const detailOverlay = document.getElementById('detail-overlay');
    const productPopup = document.getElementById('product-popup');

    // Make modal elements globally accessible
    window.detailOverlay = detailOverlay;
    window.productPopup = productPopup;

    // ========== EVENT LISTENERS ==========

    // Sidebar Navigation
    sidebarCartTrigger.addEventListener('click', () => {
        cartSidebar.classList.add('open');
    });

    closeCartBtn.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'cart') {
                cartSidebar.classList.add('open');
                return;
            } else if (page === 'home') {
                window.selectedCategories = [];
                window.searchQuery = '';
                searchInput.value = '';
                window.sortBy = null;
                sortSelect.value = 'default';
                updateFilterUI();
                renderPage(1);
            }
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    filterItems.forEach(item => {
        item.addEventListener('click', () => {
            const cat = item.dataset.category;
            if (cat === 'all') {
                window.selectedCategories = [];
            } else {
                if (window.selectedCategories.includes(cat)) {
                    window.selectedCategories = window.selectedCategories.filter(c => c !== cat);
                } else {
                    window.selectedCategories.push(cat);
                }
            }
            updateFilterUI();
            renderPage(1);
        });
    });

    // ========== CHECKOUT ==========
    checkoutBtn.addEventListener('click', () => {
        if (!requireAuth()) return;
        if (window.cart.length === 0) {
            alert('Giỏ hàng trống!');
            return;
        }
        const modal = document.getElementById('checkout-modal');
        modal.classList.remove('hidden');
    });

    const checkoutModal = document.getElementById('checkout-modal');
    document.getElementById('checkout-confirm-btn').addEventListener('click', () => {
        window.cart = [];
        saveCart();
        updateCartUI();
        cartSidebar.classList.remove('open');
        checkoutModal.classList.add('hidden');
        successModal.classList.remove('hidden');
        setTimeout(() => {
            successModal.classList.add('hidden');
        }, 2500);
    });
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) successModal.classList.add('hidden');
    });
    document.getElementById('checkout-cancel-btn').addEventListener('click', () => {
        checkoutModal.classList.add('hidden');
    });
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) checkoutModal.classList.add('hidden');
    });

    // ========== SEARCH & SORT ==========
    function performSearch() {
        window.searchQuery = searchInput.value.trim();
        renderPage(1);
    }
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 100);
    });

    sortSelect.addEventListener('change', () => {
        const val = sortSelect.value;
        window.sortBy = val === 'default' ? null : val;
        renderPage(1);
    });

    // ========== LAZY LOADING ==========
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && window.allProducts.length === 0) {
            fetchAllProducts();
            observer.unobserve(loadingEl);
        }
    }, { threshold: 0.1 });
    observer.observe(loadingEl);

    // Đóng giỏ hàng khi click ra ngoài (nhưng không ảnh hưởng đến các nút bên trong nhờ stopPropagation)
    document.addEventListener('click', (e) => {
        if (!cartSidebar.classList.contains('open')) return;
        if (!e.target.closest('.cart-sidebar') && !e.target.closest('#cart-sidebar-trigger')) {
            cartSidebar.classList.remove('open');
        }
    });

    // ========== KHỞI ĐỘNG ==========
    updateAuthUI();
    updateCartUI();
    updateFilterUI();
})();
