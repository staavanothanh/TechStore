// main.js
import { state } from './state.js';
import {
    loadingEl,
    searchInput,
    searchBtn,
    sortSelect,
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
        // Reset danh mục về "Tất cả"
        state.selectedCategories = [];
        updateFilterUI();
        // Chuyển sang chế độ cửa hàng
        showStoreView();
    });
}

// ========== HÀM CHUYỂN ĐỔI GIỮA LANDING / STORE ==========
function showStoreView() {
    if (landingView) {
        landingView.classList.add('hidden');
    }
    // Hiển thị noise, sort select
    if (globalNoise) globalNoise.style.display = 'block';
    if (sortSelect) sortSelect.closest('.search-sort')?.classList.remove('sort-hidden');

    // Bỏ active "Trang chủ" (nếu có)
    navItems.forEach(i => i.classList.remove('active'));

    // Fetch và render nếu cần
    if (state.allProducts.length === 0) {
        fetchAllProducts().then(() => renderPage(1));
    } else {
        renderPage(1);
    }
}

function goToLanding() {
    // Reset các bộ lọc
    state.selectedCategories = [];
    state.searchQuery = '';
    if (searchInput) searchInput.value = '';
    state.sortBy = null;
    if (sortSelect) sortSelect.value = 'default';
    updateFilterUI();

    // Ẩn sort select
    if (sortSelect) sortSelect.closest('.search-sort')?.classList.add('sort-hidden');

    // Active "Trang chủ" và bỏ active tất cả filter
    navItems.forEach(i => {
        if (i.dataset.page === 'home') i.classList.add('active');
        else i.classList.remove('active');
    });
    filterItems.forEach(i => i.classList.remove('active'));   // <-- Đảm bảo không filter nào active

    // Hiển thị landing view
    if (landingView) {
        landingView.classList.remove('hidden');
        productGrid.innerHTML = '';
        paginationEl.innerHTML = '';
        // Tắt noise khi ở landing
        if (globalNoise) globalNoise.style.display = 'none';
    }
}

// ========== KHÔI PHỤC TRẠNG THÁI NẾU VỪA LOGIN XONG ==========
function restoreStateIfNeeded() {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    const appStateStr = sessionStorage.getItem('appState');

    // Chỉ khôi phục nếu đang quay lại từ login và có lưu trạng thái
    if (!redirectUrl || !appStateStr) return false;
    if (!redirectUrl.includes('index.html')) return false;

    try {
        const appState = JSON.parse(appStateStr);
        // Khôi phục state
        state.selectedCategories = appState.selectedCategories || [];
        state.searchQuery = appState.searchQuery || '';
        if (searchInput) searchInput.value = state.searchQuery;
        state.sortBy = (appState.sortBy && appState.sortBy !== 'default') ? appState.sortBy : null;
        if (sortSelect) sortSelect.value = appState.sortBy || 'default';
        updateFilterUI();

        if (appState.isLandingHidden) {
            // Người dùng đang ở store view
            showStoreView();
        } else {
            goToLanding();
        }

        // Xóa dữ liệu đã dùng
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

// Nếu không có landing view thì lazy load như cũ
if (!landingView) {
    initLazyLoad();
} else {
    // Cố gắng khôi phục trạng thái từ login, nếu không thì mặc định landing
    if (!restoreStateIfNeeded()) {
        goToLanding();
    }
}

// ========== LAZY LOADING (chỉ khi không có landing) ==========
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

        // Nếu đang ở landing, chuyển sang store
        if (landingView && !landingView.classList.contains('hidden')) {
            showStoreView();
        }

        // Xử lý category
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

// ========== SEARCH & SORT ==========
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

sortSelect.addEventListener('change', () => {
    const val = sortSelect.value;
    state.sortBy = val === 'default' ? null : val;
    if (landingView && !landingView.classList.contains('hidden')) {
        showStoreView();
    }
    renderPage(1);
});

// ========== ĐÓNG GIỎ HÀNG KHI CLICK RA NGOÀI ==========
document.addEventListener('click', (e) => {
    if (!cartSidebar.classList.contains('open')) return;
    if (!e.target.closest('.cart-sidebar') && !e.target.closest('#cart-sidebar-trigger')) {
        cartSidebar.classList.remove('open');
    }
});