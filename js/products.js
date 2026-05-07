// Product Data Fetching and Processing

async function fetchAllProducts() {
    try {
        const [phones, laptops, desktops, accessories] = await Promise.all([
            fetch('./json/dien_thoai.json').then(r => r.json()),
            fetch('./json/laptop.json').then(r => r.json()),
            fetch('./json/may_tinh_de_ban.json').then(r => r.json()),
            fetch('./json/phu_kien.json').then(r => r.json())
        ]);
        allProducts = [
            ...phones.map(p => ({ ...p, category: 'smartphone' })),
            ...laptops.map(p => ({ ...p, category: 'laptop' })),
            ...desktops.map(p => ({ ...p, category: 'desktop' })),
            ...accessories.map(p => ({ ...p, category: 'accessory' }))
        ];
        allProducts.forEach(p => { p.key = `${p.category}-${p.id}`; });
        localStorage.setItem('allProducts', JSON.stringify(allProducts));
        shuffledProducts = getShuffledProducts();
        renderPage(1);
    } catch (err) {
        loadingEl.textContent = 'Lỗi tải sản phẩm. Vui lòng thử lại.';
    }
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getShuffledProducts(forceNew = false) {
    const now = Date.now();
    let products = allProducts;
    if (!products.length) {
        const saved = JSON.parse(localStorage.getItem('allProducts') || 'null');
        if (saved) products = saved;
    }
    const stored = JSON.parse(localStorage.getItem('shuffledProducts') || 'null');
    const storedTime = parseInt(localStorage.getItem('shuffleTime') || '0');
    const twoMinutes = 2 * 60 * 1000;
    if (stored && stored.length > 0 && (now - storedTime) < twoMinutes && !forceNew) {
        return stored;
    }
    const newShuffled = shuffleArray([...products]);
    localStorage.setItem('shuffledProducts', JSON.stringify(newShuffled));
    localStorage.setItem('shuffleTime', now.toString());
    return newShuffled;
}

function getProcessedProducts() {
    let source = sortBy ? [...allProducts] : [...shuffledProducts];
    if (selectedCategories.length > 0) {
        source = source.filter(p => selectedCategories.includes(p.category));
    }
    if (searchQuery) {
        const kw = searchQuery.toLowerCase();
        source = source.filter(p => p.name.toLowerCase().includes(kw));
    }
    if (sortBy) {
        switch (sortBy) {
            case 'price-asc':
                source.sort((a, b) => {
                    const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
                    const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
                    return priceA - priceB;
                });
                break;
            case 'price-desc':
                source.sort((a, b) => {
                    const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0;
                    const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0;
                    return priceB - priceA;
                });
                break;
            case 'name-asc':
                source.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                source.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
    }
    return source;
}
