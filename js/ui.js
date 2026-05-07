// UI Rendering and Pagination
const itemsPerPage = 20;

function renderPage(pageNumber) {
    const processed = getProcessedProducts();
    const totalPages = Math.ceil(processed.length / itemsPerPage) || 1;
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    currentPage = pageNumber;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = processed.slice(start, end);

    // 👇 Nếu không có sản phẩm nào, hiển thị thông báo
    if (processed.length === 0) {
        productGrid.innerHTML = `<div class="no-products">Không tìm thấy sản phẩm nào...</div>`;
        paginationEl.innerHTML = '';   // Ẩn phân trang
        return;
    }

    productGrid.innerHTML = pageItems.map(product => `
        <div class="cyber-card product-card" data-key="${product.key}" data-cat="${product.category}">
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
                        <button class="qty-btn qty-minus">-</button>
                        <span class="qty-value" data-qty="1">1</span>
                        <button class="qty-btn qty-plus">+</button>
                    </div>
                    <button class="btn-add-cart">Thêm vào giỏ</button>
                </div>
            </div>
        </div>
    `).join('');

    attachCardEvents();
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    let html = `<button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Trước</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>Sau &raquo;</button>`;
    paginationEl.innerHTML = html;

    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'prev') renderPage(currentPage - 1);
            else if (page === 'next') renderPage(currentPage + 1);
            else renderPage(parseInt(page));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function updateFilterUI() {
    filterItems.forEach(item => {
        const cat = item.dataset.category;
        if (cat === 'all') {
            item.classList.toggle('active', selectedCategories.length === 0);
        } else {
            item.classList.toggle('active', selectedCategories.includes(cat));
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
        }

        const addBtn = card.querySelector('.btn-add-cart');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!requireAuth()) return;
                const key = card.dataset.key;
                const qtyEl = card.querySelector('.qty-value');
                const quantity = parseInt(qtyEl?.dataset.qty) || 1;
                addToCart(key, quantity);
                if (qtyEl) {
                    qtyEl.dataset.qty = 1;
                    qtyEl.textContent = 1;
                }
                if (addBtn.classList.contains('added')) return;
                addBtn.textContent = 'Đã thêm ✓';
                addBtn.classList.add('added');
                setTimeout(() => {
                    addBtn.textContent = 'Thêm vào giỏ';
                    addBtn.classList.remove('added');
                }, 2000);
            });
        }
    });

    // Mở modal chi tiết khi click vào card (trừ các nút)
    productGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        if (e.target.closest('button, .qty-btn, .btn-add-cart')) return;
        const key = card.dataset.key;
        const product = allProducts.find(p => p.key === key);
        if (product) {
            openProductDetail(product);
        }
    });
}
