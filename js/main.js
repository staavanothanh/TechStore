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
    successModal
} from './elements.js';
import { updateAuthUI, requireAuth } from './auth-ui.js';
import { updateCartUI } from './cart.js';
import { fetchAllProducts } from './products.js';
import { renderPage, updateFilterUI } from './ui.js';

// Khởi tạo giao diện
updateAuthUI();
updateCartUI();
updateFilterUI();

// Lazy loading sản phẩm
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && state.allProducts.length === 0) {
        fetchAllProducts().then(() => renderPage(1));
        observer.unobserve(loadingEl);
    }
}, { threshold: 0.1 });
observer.observe(loadingEl);

// Sidebar cart mở/đóng
sidebarCartTrigger.addEventListener('click', () => cartSidebar.classList.add('open'));
closeCartBtn.addEventListener('click', () => cartSidebar.classList.remove('open'));

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'cart') {
            cartSidebar.classList.add('open');
            return;
        } else if (page === 'home') {
            state.selectedCategories = [];
            state.searchQuery = '';
            searchInput.value = '';
            state.sortBy = null;
            sortSelect.value = 'default';
            updateFilterUI();
            renderPage(1);
        }
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

// Filter
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        const cat = item.dataset.category;
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

// Checkout
checkoutBtn.addEventListener('click', () => {
    if (!requireAuth()) return;
    if (state.cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    checkoutModal.classList.remove('hidden');
});

checkoutConfirmBtn.addEventListener('click', () => {
    state.cart.length = 0;   // Xóa mảng
    updateCartUI();
    cartSidebar.classList.remove('open');
    checkoutModal.classList.add('hidden');
    successModal.classList.remove('hidden');
    setTimeout(() => successModal.classList.add('hidden'), 2500);
});

successModal.addEventListener('click', (e) => {
    if (e.target === successModal) successModal.classList.add('hidden');
});

checkoutCancelBtn.addEventListener('click', () => checkoutModal.classList.add('hidden'));
checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) checkoutModal.classList.add('hidden');
});

// Search & Sort
let searchTimeout;
function performSearch() {
    state.searchQuery = searchInput.value.trim();
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
    renderPage(1);
});

// Đóng giỏ hàng khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!cartSidebar.classList.contains('open')) return;
    if (!e.target.closest('.cart-sidebar') && !e.target.closest('#cart-sidebar-trigger')) {
        cartSidebar.classList.remove('open');
    }
});