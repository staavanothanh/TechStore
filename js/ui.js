import { state } from './state.js';
import {
    productGrid,
    paginationEl,
    filterItems,
    landingView       // <-- import landingView
} from './elements.js';
import { getProcessedProducts, getPriceForSort } from './products.js';
import { handleMouseMove, handleMouseLeave } from './effects.js';
import { requireAuth } from './auth-ui.js';
import { addToCart } from './cart.js';
import { openProductDetail } from './modal.js';

const itemsPerPage = 20;

export function renderPage(pageNumber) {
    const processed = getProcessedProducts();
    const totalPages = Math.ceil(processed.length / itemsPerPage) || 1;
    pageNumber = Math.max(1, Math.min(pageNumber, totalPages));
    state.currentPage = pageNumber;

    const start = (pageNumber - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = processed.slice(start, end);

    if (processed.length === 0) {
        productGrid.innerHTML = `<div class="no-products">Không tìm thấy sản phẩm nào...</div>`;
        paginationEl.innerHTML = '';
        return;
    }

    productGrid.innerHTML = pageItems.map(product => {
        const noBuy = getPriceForSort(product) === Infinity;
        const dis = noBuy ? 'disabled' : '';
        const btnText = noBuy ? 'Không thể mua' : 'Thêm vào giỏ';

        return `
    <div class="cyber-card product-card ${noBuy ? 'special-price' : ''}" 
         data-key="${product.key}" data-cat="${product.category}">
      <div class="noise-overlay"></div>
      <div class="cyber-card-inner">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
        <div class="product-details">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">${product.price}</p>
          <p class="product-specs">${product.specs || ''}</p>
        </div>
        <div class="product-actions">
          <div class="quantity-control">
            <button class="qty-btn qty-minus" ${dis}>-</button>
            <span class="qty-value" data-qty="1">1</span>
            <button class="qty-btn qty-plus" ${dis}>+</button>
          </div>
          <button class="btn-add-cart" ${dis}>${btnText}</button>
        </div>
      </div>
    </div>
  `;
    }).join('');

    attachCardEvents();
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = `<button class="page-btn" data-page="prev" ${state.currentPage === 1 ? 'disabled' : ''}>&laquo; Trước</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page="next" ${state.currentPage === totalPages ? 'disabled' : ''}>Sau &raquo;</button>`;
    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'prev') renderPage(state.currentPage - 1);
            else if (page === 'next') renderPage(state.currentPage + 1);
            else renderPage(parseInt(page));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

export function updateFilterUI() {
    const isLandingVisible = landingView && !landingView.classList.contains('hidden');

    filterItems.forEach(item => {
        const cat = item.dataset.category;
        if (isLandingVisible) {
            // Khi đang ở landing, không filter nào được active
            item.classList.remove('active');
        } else {
            if (cat === 'all') {
                item.classList.toggle('active', state.selectedCategories.length === 0);
            } else {
                item.classList.toggle('active', state.selectedCategories.includes(cat));
            }
        }
    });
}

function attachCardEvents() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);

        const qtyMinus = card.querySelector('.qty-minus');
        const qtyPlus = card.querySelector('.qty-plus');
        const qtyValue = card.querySelector('.qty-value');
        if (qtyMinus && qtyPlus && qtyValue) {
            qtyMinus.onclick = (e) => {
                e.stopPropagation();
                let val = parseInt(qtyValue.dataset.qty) || 1;
                if (val > 1) val--;
                qtyValue.dataset.qty = val;
                qtyValue.textContent = val;
            };
            qtyPlus.onclick = (e) => {
                e.stopPropagation();
                let val = parseInt(qtyValue.dataset.qty) || 1;
                val++;
                qtyValue.dataset.qty = val;
                qtyValue.textContent = val;
            };
        }

        const addBtn = card.querySelector('.btn-add-cart');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                if (!requireAuth()) return;
                const key = card.dataset.key;
                const qtyEl = card.querySelector('.qty-value');
                const quantity = parseInt(qtyEl?.dataset.qty) || 1;
                addToCart(key, quantity);
                qtyEl.dataset.qty = 1;
                qtyEl.textContent = 1;
                if (!addBtn.classList.contains('added')) {
                    addBtn.textContent = 'Đã thêm ✓';
                    addBtn.classList.add('added');
                    setTimeout(() => {
                        addBtn.textContent = 'Thêm vào giỏ';
                        addBtn.classList.remove('added');
                    }, 2000);
                }
            };
        }
    });

    // Mở chi tiết khi click vào card (trừ button)
    productGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        if (e.target.closest('button, .qty-btn, .btn-add-cart')) return;
        const key = card.dataset.key;
        const product = state.allProducts.find(p => p.key === key);
        if (product) openProductDetail(product);
    });
}