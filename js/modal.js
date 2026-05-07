// Product Detail Modal

let detailOverlayClickHandler = null;
let detailPopupClickHandler = null;

function openProductDetail(product) {
    const key = product.key;
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
            <button class="qty-btn qty-minus">-</button>
            <span class="qty-value" data-qty="1">1</span>
            <button class="qty-btn qty-plus">+</button>
        </div>
        <button class="btn-add-cart detail-add-cart">Thêm vào giỏ</button>
    `;
    productPopup.innerHTML = html;

    // Hiện overlay (popup sẽ hiện theo vì là con của overlay)
    detailOverlay.classList.remove('hidden');

    // Gán sự kiện cho các nút trong popup
    const qtyMinus = productPopup.querySelector('.qty-minus');
    const qtyPlus = productPopup.querySelector('.qty-plus');
    const qtyValue = productPopup.querySelector('.qty-value');
    const addCartBtn = productPopup.querySelector('.detail-add-cart');

    qtyMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseInt(qtyValue.dataset.qty) || 1;
        if (val > 1) val--;
        qtyValue.dataset.qty = val;
        qtyValue.textContent = val;
    });
    qtyPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseInt(qtyValue.dataset.qty) || 1;
        val++;
        qtyValue.dataset.qty = val;
        qtyValue.textContent = val;
    });
    addCartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!requireAuth()) return;
        const quantity = parseInt(qtyValue.dataset.qty) || 1;
        addToCart(key, quantity);
        qtyValue.dataset.qty = 1;
        qtyValue.textContent = '1';
        addCartBtn.textContent = 'Đã thêm ✓';
        addCartBtn.classList.add('added');
        setTimeout(() => {
            addCartBtn.textContent = 'Thêm vào giỏ';
            addCartBtn.classList.remove('added');
        }, 2000);
    });

    productPopup.querySelector('.modal-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        closeProductDetail();
    });

    // Ngăn click vào popup lan ra overlay
    if (detailPopupClickHandler) {
        productPopup.removeEventListener('click', detailPopupClickHandler);
    }
    detailPopupClickHandler = (e) => e.stopPropagation();
    productPopup.addEventListener('click', detailPopupClickHandler);

    // Đóng khi click overlay
    if (detailOverlayClickHandler) {
        detailOverlay.removeEventListener('click', detailOverlayClickHandler);
    }
    detailOverlayClickHandler = (e) => {
        if (e.target === detailOverlay) closeProductDetail();
    };
    detailOverlay.addEventListener('click', detailOverlayClickHandler);
}

function closeProductDetail() {
    detailOverlay.classList.add('hidden');
    if (detailOverlayClickHandler) {
        detailOverlay.removeEventListener('click', detailOverlayClickHandler);
        detailOverlayClickHandler = null;
    }
    if (detailPopupClickHandler) {
        productPopup.removeEventListener('click', detailPopupClickHandler);
        detailPopupClickHandler = null;
    }
}
