const AuthModule = {
  isLoginMode: true,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.checkAuthStatus();
  },

  cacheDOM() {
    this.authScreen = document.getElementById('auth-screen');
    this.chatScreen = document.getElementById('chat-screen');
    this.authForm = document.getElementById('auth-form');
    this.authTitle = document.getElementById('auth-title');
    this.authSub = document.getElementById('auth-sub');
    this.groupName = document.getElementById('group-name');
    this.groupPhone = document.getElementById('group-phone');
    this.btnSubmitAuth = document.getElementById('btn-submit-auth');
    this.toggleText = document.getElementById('toggle-text');
    this.toggleBtn = document.getElementById('toggle-btn');
    this.authError = document.getElementById('auth-error');
    this.userDisplay = document.getElementById('user-display');
    this.btnLogout = document.getElementById('btn-logout');
  },

  bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggleMode());
    this.authForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.btnLogout.addEventListener('click', () => this.handleLogout());
  },

  checkAuthStatus() {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (token && (user.id || user.username)) {
      this.showChatScreen(user);
    }
  },

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.authError.style.display = 'none';

    if (this.isLoginMode) {
      this.authTitle.textContent = 'Đăng Nhập';
      this.authSub.textContent = 'Chào mừng bạn trở lại với LifeGift AI';
      this.btnSubmitAuth.textContent = 'Đăng Nhập';
      this.groupName.classList.add('hidden');
      this.groupPhone.classList.add('hidden');
      this.toggleText.textContent = 'Chưa có tài khoản?';
      this.toggleBtn.textContent = 'Đăng ký ngay';
    } else {
      this.authTitle.textContent = 'Đăng Ký';
      this.authSub.textContent = 'Tạo tài khoản mới để bắt đầu mua sắm';
      this.btnSubmitAuth.textContent = 'Đăng Ký';
      this.groupName.classList.remove('hidden');
      this.groupPhone.classList.remove('hidden');
      this.toggleText.textContent = 'Đã có tài khoản?';
      this.toggleBtn.textContent = 'Đăng nhập';
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    this.authError.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!username || !password) {
      this.showError('Vui lòng nhập Tên đăng nhập và Mật khẩu!');
      return;
    }

    try {
      if (this.isLoginMode) {
        const res = await ApiService.login({ username, password });
        const userData = res.data || res; 

        if (userData && userData.accessToken) {
          localStorage.setItem('accessToken', userData.accessToken);
          localStorage.setItem('refreshToken', userData.refreshToken || '');

          const userInfo = {
            id: userData.id,
            username: userData.username,
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            roles: userData.roles
          };
          
          localStorage.setItem('user', JSON.stringify(userInfo));
          this.showChatScreen(userInfo);
        } else {
          this.showError('Không nhận được token từ hệ thống!');
        }
      } else {
        if (!fullName || !phone) {
          this.showError('Vui lòng điền đầy đủ Họ tên và Số điện thoại!');
          return;
        }
        await ApiService.register({ username, password, fullName, phone });
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        this.toggleBtn.click();
      }
    } catch (err) {
      this.showError(err.message);
    }
  },

  async handleLogout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await ApiService.logout(refreshToken);
    }
    localStorage.clear();
    this.chatScreen.classList.add('hidden');
    this.authScreen.classList.remove('hidden');
  },

  showChatScreen(user) {
    this.authScreen.classList.add('hidden');
    this.chatScreen.classList.remove('hidden');
    const displayName = user.fullName || user.username || 'Khách';
    this.userDisplay.textContent = `Xin chào, ${displayName}`;
    if (window.CartModule) CartModule.load();
  },

  showError(msg) {
    this.authError.textContent = msg;
    this.authError.style.display = 'block';
  }
};