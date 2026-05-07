(async function () {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheck = document.getElementById('remember-me');
    const errorEl = document.getElementById('login-error');

    // Tự động điền nếu đã lưu Remember me
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
        try {
            const creds = JSON.parse(remembered);
            if (creds.username) usernameInput.value = creds.username;
            if (creds.password) passwordInput.value = creds.password;
            rememberCheck.checked = true;
        } catch (e) { }
    }

    const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';

    let users = [];
    try {
        const res = await fetch('./json/account.json');
        if (!res.ok) throw new Error('Không thể tải dữ liệu người dùng');
        users = await res.json();
    } catch (err) {
        errorEl.textContent = 'Lỗi tải dữ liệu đăng nhập.';
        return;
    }
    // Xử lý đăng nhập
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            errorEl.textContent = 'Sai tên đăng nhập hoặc mật khẩu.';
            return;
        }

        // Lưu trạng thái đăng nhập và thông tin người dùng
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            fullName: user.fullName
        }));

        // Lưu người dùng với Remember me
        if (rememberCheck.checked) {
            localStorage.setItem('rememberedUser', JSON.stringify({
                username: user.username,
                password: user.password
            }));
        } else {
            localStorage.removeItem('rememberedUser');
        }

        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    });
})();
