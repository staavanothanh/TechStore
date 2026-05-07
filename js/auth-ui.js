// Auth UI Management
function updateAuthUI() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    userArea.innerHTML = '';
    if (isLoggedIn && currentUser) {
        userArea.innerHTML = `
            <span class="user-greeting">Xin chào, ${currentUser.fullName || currentUser.username}</span>
            <button id="logout-btn" class="btn-logout">Đăng xuất</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        userArea.innerHTML = `<button id="login-nav-btn" class="btn-login-nav">Đăng nhập</button>`;
        document.getElementById('login-nav-btn').addEventListener('click', () => {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
        });
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function requireAuth() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
