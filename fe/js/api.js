const ApiService = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const config = { ...options, headers };
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = Array.isArray(data.message) 
        ? data.message.join(', ') 
        : (data.message || data.error || 'Có lỗi xảy ra.');
      throw new Error(errorMsg);
    }
    return data;
  },

  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  register(userInfo) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userInfo)
    });
  },

  logout(refreshToken) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }).catch(err => console.warn('Lỗi gọi API logout:', err));
  },

  sendMessage(payload) {
    return this.request('/chat/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getCart() {
    return this.request('/cart');
  },

  createOrder(payload) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'CANCELLED',
        note: 'Khách hàng hủy đơn hàng từ giao diện'
      })
    });
  },

  applyCoupon(payload) {
    return this.request('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};