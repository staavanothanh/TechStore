import { state } from './state.js';
import { loadingEl } from './elements.js';

// Hàm trộn mảng
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Lấy hoặc tạo mới danh sách đã trộn, có kiểm tra thời gian 2 phút
export function getShuffledProducts(forceNew = false) {
    const now = Date.now();
    const storedTime = parseInt(localStorage.getItem('shuffleTime') || '0');
    const twoMinutes = 2 * 60 * 1000;
    const stored = JSON.parse(localStorage.getItem('shuffledProducts') || 'null');

    // Nếu đã có dữ liệu, chưa quá 2 phút và không bắt buộc làm mới -> dùng lại
    if (stored && (now - storedTime) < twoMinutes && !forceNew) {
        return stored;
    }

    // Tạo mới từ allProducts
    const newShuffled = shuffleArray([...state.allProducts]);
    localStorage.setItem('shuffledProducts', JSON.stringify(newShuffled));
    localStorage.setItem('shuffleTime', now.toString());
    return newShuffled;
}

// Lấy toàn bộ sản phẩm từ JSON
export async function fetchAllProducts() {
    try {
        const [phones, laptops, desktops, accessories] = await Promise.all([
            fetch('./json/dien_thoai.json').then(r => r.json()),
            fetch('./json/laptop.json').then(r => r.json()),
            fetch('./json/may_tinh_de_ban.json').then(r => r.json()),
            fetch('./json/phu_kien.json').then(r => r.json())
        ]);

        state.allProducts = [
            ...phones.map(p => ({ ...p, category: 'smartphone' })),
            ...laptops.map(p => ({ ...p, category: 'laptop' })),
            ...desktops.map(p => ({ ...p, category: 'desktop' })),
            ...accessories.map(p => ({ ...p, category: 'accessory' }))
        ];
        state.allProducts.forEach(p => { p.key = `${p.category}-${p.id}`; });
        localStorage.setItem('allProducts', JSON.stringify(state.allProducts));

        // Gán shuffled bằng hàm có kiểm tra thời gian (không force)
        state.shuffledProducts = getShuffledProducts();

        return state.allProducts;
    } catch (err) {
        loadingEl.textContent = 'Lỗi tải sản phẩm. Vui lòng thử lại.';
        throw err;
    }
}

// Lọc, sắp xếp và trả về danh sách sẽ hiển thị
export function getProcessedProducts() {
    let source = state.sortBy ? [...state.allProducts] : [...state.shuffledProducts];

    if (state.selectedCategories.length > 0) {
        source = source.filter(p => state.selectedCategories.includes(p.category));
    }
    if (state.searchQuery) {
        const kw = state.searchQuery.toLowerCase();
        source = source.filter(p => p.name.toLowerCase().includes(kw));
    }

    if (state.sortBy) {
        switch (state.sortBy) {
            case 'price-asc':
                source.sort((a, b) => parseInt(a.price.replace(/[^\d]/g, '')) - parseInt(b.price.replace(/[^\d]/g, '')));
                break;
            case 'price-desc':
                source.sort((a, b) => parseInt(b.price.replace(/[^\d]/g, '')) - parseInt(a.price.replace(/[^\d]/g, '')));
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