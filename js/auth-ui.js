import {
    userArea, searchInput, sortSelectWrapper,
    sortSelectTrigger,
    sortOptions,
    sortCurrentText, landingView
} from './elements.js';
import { state } from './state.js';

// Lưu trạng thái hiện tại để khôi phục sau khi đăng nhập
function saveAppState() {
    const isLandingHidden = landingView ? landingView.classList.contains('hidden') : true;
    const appState = {
        selectedCategories: [...state.selectedCategories],
        searchQuery: searchInput ? searchInput.value.trim() : '',
        sortBy: sortSelect ? sortSelect.value : 'default',
        isLandingHidden: isLandingHidden
    };
    sessionStorage.setItem('appState', JSON.stringify(appState));
}

export function updateAuthUI() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    userArea.innerHTML = '';

    if (isLoggedIn && currentUser) {
        userArea.innerHTML = `
      <span class="user-greeting">Xin chào, ${currentUser.fullName || currentUser.username}</span>
      <button id="logout-btn" class="btn-logout">Đăng xuất</button>
    `;
        userArea.querySelector('#logout-btn').addEventListener('click', logout);
    } else {
        userArea.innerHTML = `<button id="login-nav-btn" class="btn-login-nav">Đăng nhập</button>`;
        userArea.querySelector('#login-nav-btn').addEventListener('click', () => {
            saveAppState();   // <-- lưu trạng thái trước khi rời trang
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
        });
    }
}

export function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

export function requireAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        saveAppState();   // <-- lưu trạng thái khi bị yêu cầu đăng nhập từ modal/cart
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}