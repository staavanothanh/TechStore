// state.js – nơi lưu trạng thái toàn cục
export const state = {
    allProducts: [],
    shuffledProducts: [],
    lastShuffleTime: 0,
    currentPage: 1,
    selectedCategories: [],
    searchQuery: '',
    sortBy: null,
    cart: JSON.parse(sessionStorage.getItem('cart') || '[]')
};