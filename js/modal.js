import { state } from './state.js';
import { detailOverlay, productPopup } from './elements.js';
import { requireAuth } from './auth-ui.js';
import { addToCart } from './cart.js';
import { getPriceForSort } from './products.js';

let overlayClickHandler = null;
let popupClickHandler = null;

export function openProductDetail(product) {
    const noBuy = getPriceForSort(product) === Infinity;
    const dis = noBuy ? 'disabled' : '';
    const btnText = noBuy ? 'Không thể mua' : 'Thêm vào giỏ';

    const html = `
    <button class="modal-close-btn">&times;</button>
    <img src="${product.image}" alt="${product.name}" class="popup-image">
    <h2 class="popup-name">${product.name}</h2>
    <div class="popup-price-row">
      <span class="popup-current-price">${product.price}</span>
      ${product.original_price ? `<span class="popup-original-price">${product.original_price}</span>` : ''}
      ${product.discount ? `<span class="popup-discount">-${product.discount}</span>` : ''}
    </div>
    <div class="popup-brand"><strong>Thương hiệu:</strong> ${product.brand || 'Không rõ'}</div>
    <div class="popup-specs"><strong>Thông số:</strong> ${product.specs || 'Chưa có'}</div>
    <div class="popup-features"><strong>Tính năng:</strong> ${product.features || 'Chưa có'}</div>
    ${product.installment ? `<div class="popup-installment"><strong>Trả góp:</strong> ${product.installment}</div>` : ''}
    ${product.ports ? `<div class="popup-ports"><strong>Cổng kết nối:</strong> ${product.ports}</div>` : ''}
    <div class="quantity-control">
      <button class="qty-btn qty-minus" ${dis}>-</button>
      <span class="qty-value" data-qty="1">1</span>
      <button class="qty-btn qty-plus" ${dis}>+</button>
    </div>
    <button class="btn-add-cart detail-add-cart" ${dis}>${btnText}</button>
  `;
    productPopup.innerHTML = html;
    detailOverlay.classList.remove('hidden');

    // Quantity buttons
    const qtyMinus = productPopup.querySelector('.qty-minus');
    const qtyPlus = productPopup.querySelector('.qty-plus');
    const qtyValue = productPopup.querySelector('.qty-value');
    const addCartBtn = productPopup.querySelector('.detail-add-cart');

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
    addCartBtn.onclick = (e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        const quantity = parseInt(qtyValue.dataset.qty) || 1;
        addToCart(product.key, quantity);
        qtyValue.dataset.qty = 1;
        qtyValue.textContent = '1';
        addCartBtn.textContent = 'Đã thêm ✓';
        addCartBtn.classList.add('added');
        setTimeout(() => {
            addCartBtn.textContent = 'Thêm vào giỏ';
            addCartBtn.classList.remove('added');
        }, 2000);
    };

    productPopup.querySelector('.modal-close-btn').onclick = (e) => {
        e.stopPropagation();
        closeProductDetail();
    };

    // Ngăn click từ popup lan ra overlay
    if (popupClickHandler) productPopup.removeEventListener('click', popupClickHandler);
    popupClickHandler = (e) => e.stopPropagation();
    productPopup.addEventListener('click', popupClickHandler);

    if (overlayClickHandler) detailOverlay.removeEventListener('click', overlayClickHandler);
    overlayClickHandler = (e) => {
        if (e.target === detailOverlay) closeProductDetail();
    };
    detailOverlay.addEventListener('click', overlayClickHandler);
}

export function closeProductDetail() {
    detailOverlay.classList.add('hidden');
    if (overlayClickHandler) {
        detailOverlay.removeEventListener('click', overlayClickHandler);
        overlayClickHandler = null;
    }
    if (popupClickHandler) {
        productPopup.removeEventListener('click', popupClickHandler);
        popupClickHandler = null;
    }
}