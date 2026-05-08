// main.js
import { state } from './state.js';
import {
    loadingEl,
    searchInput,
    searchBtn,
    sortSelectWrapper,
    sortSelectTrigger,
    sortOptions,
    sortCurrentText,
    sidebarCartTrigger,
    closeCartBtn,
    navItems,
    filterItems,
    cartSidebar,
    checkoutBtn,
    checkoutModal,
    checkoutConfirmBtn,
    checkoutCancelBtn,
    successModal,
    productGrid,
    paginationEl,
    landingView
} from './elements.js';
import { updateAuthUI, requireAuth } from './auth-ui.js';
import { updateCartUI, saveCart } from './cart.js';
import { fetchAllProducts } from './products.js';
import { renderPage, updateFilterUI } from './ui.js';

// ========== LANDING VIEW ==========
const exploreBtn = document.getElementById('explore-btn');
const logo = document.getElementById('logo');
const globalNoise = document.querySelector('.global-noise');

if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
        state.selectedCategories = [];
        showStoreView();
    });
}

// ========== HÀM ĐỒNG BỘ SORT UI (CUSTOM DROPDOWN) ==========
function syncSortUI(sortValue) {
    if (!sortCurrentText || !sortOptions) return;
    const value = sortValue || 'default';
    const target = sortOptions.querySelector(`.custom-option[data-value="${value}"]`);
    if (target) {
        sortCurrentText.textContent = target.textContent;
        sortOptions.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('active'));
        target.classList.add('active');
    }
}

// ========== HIỂN THỊ STORE ==========
function showStoreView() {
    if (landingView) {
        landingView.classList.add('hidden');
    }
    if (globalNoise) globalNoise.style.display = 'block';
    if (sortSelectWrapper) sortSelectWrapper.closest('.search-sort')?.classList.remove('sort-hidden');

    // Bỏ active "Trang chủ"
    navItems.forEach(i => i.classList.remove('active'));
    updateFilterUI();

    // Đồng bộ lại hiển thị text sort hiện tại
    syncSortUI(state.sortBy);

    if (state.allProducts.length === 0) {
        fetchAllProducts().then(() => renderPage(1));
    } else {
        renderPage(1);
    }
}

// ========== VỀ LANDING ==========
function goToLanding() {
    state.selectedCategories = [];
    state.searchQuery = '';
    if (searchInput) searchInput.value = '';
    state.sortBy = null;
    syncSortUI(null);

    if (sortSelectWrapper) sortSelectWrapper.closest('.search-sort')?.classList.add('sort-hidden');

    navItems.forEach(i => {
        if (i.dataset.page === 'home') i.classList.add('active');
        else i.classList.remove('active');
    });
    filterItems.forEach(i => i.classList.remove('active'));

    if (landingView) {
        landingView.classList.remove('hidden');
        productGrid.innerHTML = '';
        paginationEl.innerHTML = '';
        if (globalNoise) globalNoise.style.display = 'none';
    }
}

if (logo) {
    logo.addEventListener('click', goToLanding);
}

// ========== KHÔI PHỤC TRẠNG THÁI TỪ LOGIN ==========
function restoreStateIfNeeded() {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    const appStateStr = sessionStorage.getItem('appState');
    if (!redirectUrl || !appStateStr) return false;
    if (!redirectUrl.includes('index.html')) return false;

    try {
        const appState = JSON.parse(appStateStr);
        state.selectedCategories = appState.selectedCategories || [];
        state.searchQuery = appState.searchQuery || '';
        if (searchInput) searchInput.value = state.searchQuery;

        state.sortBy = (appState.sortBy && appState.sortBy !== 'default') ? appState.sortBy : null;
        syncSortUI(state.sortBy);

        updateFilterUI();

        if (appState.isLandingHidden) {
            showStoreView();
        } else {
            goToLanding();
        }

        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('appState');
        return true;
    } catch (e) {
        // fallback
    }
    return false;
}

// ========== KHỞI TẠO ==========
updateAuthUI();
updateCartUI();

if (!landingView) {
    initLazyLoad();
} else {
    if (!restoreStateIfNeeded()) {
        goToLanding();
    }
}

// ========== LAZY LOADING ==========
function initLazyLoad() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && state.allProducts.length === 0) {
            fetchAllProducts().then(() => renderPage(1));
            observer.unobserve(loadingEl);
        }
    }, { threshold: 0.1 });
    observer.observe(loadingEl);
}

// ========== SIDEBAR CART ==========
sidebarCartTrigger.addEventListener('click', () => {
    cartSidebar.classList.add('open');
});
closeCartBtn.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
});

// ========== NAVIGATION (TRANG CHỦ, GIỎ HÀNG) ==========
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'cart') {
            cartSidebar.classList.add('open');
            return;
        } else if (page === 'home') {
            goToLanding();
            return;
        }
    });
});

// ========== FILTER DANH MỤC ==========
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        const cat = item.dataset.category;
        if (landingView && !landingView.classList.contains('hidden')) {
            showStoreView();
        }

        if (cat === 'all') {
            state.selectedCategories = [];
        } else {
            if (state.selectedCategories.includes(cat)) {
                state.selectedCategories = state.selectedCategories.filter(c => c !== cat);
            } else {
                state.selectedCategories.push(cat);
            }
        }
        updateFilterUI();
        renderPage(1);
    });
});

// ========== CHECKOUT ==========
checkoutBtn.addEventListener('click', () => {
    if (!requireAuth()) return;
    if (state.cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    checkoutModal.classList.remove('hidden');
});

checkoutConfirmBtn.addEventListener('click', () => {
    state.cart = [];
    saveCart();
    updateCartUI();
    cartSidebar.classList.remove('open');
    checkoutModal.classList.add('hidden');
    successModal.classList.remove('hidden');
    setTimeout(() => successModal.classList.add('hidden'), 2500);
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) successModal.classList.add('hidden');
});
checkoutCancelBtn.addEventListener('click', () => {
    checkoutModal.classList.add('hidden');
});
checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) checkoutModal.classList.add('hidden');
});

// ========== SEARCH ==========
let searchTimeout;
function performSearch() {
    state.searchQuery = searchInput.value.trim();
    if (landingView && !landingView.classList.contains('hidden')) {
        showStoreView();
    }
    renderPage(1);
}
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 100);
});

// ========== CUSTOM SORT DROPDOWN ==========
sortSelectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    sortSelectWrapper.classList.toggle('open');
});

sortOptions.addEventListener('click', (e) => {
    const option = e.target.closest('.custom-option');
    if (!option) return;

    const value = option.dataset.value;
    state.sortBy = (value === 'default') ? null : value;
    syncSortUI(state.sortBy);

    if (landingView && !landingView.classList.contains('hidden')) {
        showStoreView();
    }
    renderPage(1);

    sortSelectWrapper.classList.remove('open');
});

// Đóng dropdown khi click bên ngoài
document.addEventListener('click', (e) => {
    if (!sortSelectWrapper.contains(e.target)) {
        sortSelectWrapper.classList.remove('open');
    }
});

// ========== ĐÓNG GIỎ HÀNG KHI CLICK RA NGOÀI ==========
document.addEventListener('click', (e) => {
    if (!cartSidebar.classList.contains('open')) return;
    if (!e.target.closest('.cart-sidebar') && !e.target.closest('#cart-sidebar-trigger')) {
        cartSidebar.classList.remove('open');
    }
});