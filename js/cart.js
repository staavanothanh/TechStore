// Cart Management

function addToCart(key, quantity) {
    const existing = cart.find(item => item.key === key);
    if (existing) {
        existing.quantity += quantity;
    } else {
        const product = allProducts.find(p => p.key === key);
        if (product) {
            cart.push({ key, product: { ...product }, quantity });
        }
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(key) {
    cart = cart.filter(item => item.key !== key);
    saveCart();
    updateCartUI();
}

function changeCartQuantity(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(key);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    if (totalItems === 0) {
        sidebarCartBadge.style.display = 'none';
    } else {
        sidebarCartBadge.style.display = '';
        sidebarCartBadge.textContent = totalItems;
    }

    const reversedItems = cart.toReversed();
    cartItemsContainer.innerHTML = reversedItems.map(item => {
        const p = item.product;
        return `
            <div class="cart-item">
                <img src="${p.image}" alt="${p.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${p.name}</div>
                    <div class="cart-item-price">${p.price}</div>
                    <div class="cart-item-quantity">
                        <button class="cart-qty-btn cart-qty-minus" data-key="${item.key}">-</button>
                        <span>${item.quantity}</span>
                        <button class="cart-qty-btn cart-qty-plus" data-key="${item.key}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-key="${item.key}">&times;</button>
            </div>
        `;
    }).join('');

    // Thêm stopPropagation để tránh đóng giỏ hàng khi tương tác
    document.querySelectorAll('.cart-qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            changeCartQuantity(btn.dataset.key, -1);
        });
    });
    document.querySelectorAll('.cart-qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            changeCartQuantity(btn.dataset.key, 1);
        });
    });
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromCart(btn.dataset.key);
        });
    });

    const total = cart.reduce((sum, item) => {
        const price = parseInt(item.product.price.replace(/[^\d]/g, '')) || 0;
        return sum + price * item.quantity;
    }, 0);
    cartTotalAmount.textContent = total.toLocaleString('vi-VN') + ' đ';
}
