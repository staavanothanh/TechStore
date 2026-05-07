import { state } from './state.js';
import {
    sidebarCartBadge,
    cartItemsContainer,
    cartTotalAmount
} from './elements.js';

export function addToCart(key, quantity) {
    const existing = state.cart.find(item => item.key === key);
    if (existing) {
        existing.quantity += quantity;
    } else {
        const product = state.allProducts.find(p => p.key === key);
        if (product) {
            state.cart.push({ key, product: { ...product }, quantity });
        }
    }
    saveCart();
    updateCartUI();
}

export function removeFromCart(key) {
    state.cart = state.cart.filter(item => item.key !== key);
    saveCart();
    updateCartUI();
}

export function changeCartQuantity(key, delta) {
    const item = state.cart.find(i => i.key === key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(key);
    } else {
        saveCart();
        updateCartUI();
    }
}

export function saveCart() {
    sessionStorage.setItem('cart', JSON.stringify(state.cart));
}

export function updateCartUI() {
    const totalItems = state.cart.reduce((sum, i) => sum + i.quantity, 0);
    sidebarCartBadge.style.display = totalItems === 0 ? 'none' : '';
    sidebarCartBadge.textContent = totalItems > 0 ? totalItems : '';
    sidebarCartBadge.textContent = totalItems;

    const reversedItems = [...state.cart].reverse();
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

    // Gán sự kiện (có thể tránh dùng querySelectorAll để không ảnh hưởng overlay)
    document.querySelectorAll('.cart-qty-minus').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            changeCartQuantity(btn.dataset.key, -1);
        };
    });
    document.querySelectorAll('.cart-qty-plus').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            changeCartQuantity(btn.dataset.key, 1);
        };
    });
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            removeFromCart(btn.dataset.key);
        };
    });

    const total = state.cart.reduce((sum, item) => {
        const price = parseInt(item.product.price.replace(/[^\d]/g, '')) || 0;
        return sum + price * item.quantity;
    }, 0);
    cartTotalAmount.textContent = total.toLocaleString('vi-VN') + ' đ';
}