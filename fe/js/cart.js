const CartModule = {
  cart: { items: [], subtotal: 0 },
  selectedIds: new Set(),
  coupon: null,

  init() {
    this.panel = document.getElementById('cart-panel');
    this.itemsContainer = document.getElementById('cart-items');
    this.count = document.getElementById('cart-count');
    this.subtotal = document.getElementById('cart-subtotal');
    this.checkoutModal = document.getElementById('checkout-modal');
    document.getElementById('btn-cart').addEventListener('click', () => this.openPanel());
    document.getElementById('cart-close').addEventListener('click', () => this.closePanel());
    document.getElementById('checkout-btn').addEventListener('click', () => this.openCheckout());
    document.getElementById('checkout-close').addEventListener('click', () => this.closeCheckout());
    document.getElementById('apply-coupon').addEventListener('click', () => this.applyCoupon());
    document.getElementById('checkout-form').addEventListener('submit', (event) => this.submitOrder(event));
  },

  async load() {
    try {
      const response = await ApiService.getCart();
      this.cart = response.data || { items: [], subtotal: 0 };
      const availableIds = new Set(this.cart.items.map((item) => String(item.id)));
      this.selectedIds = new Set([...this.selectedIds].filter((id) => availableIds.has(id)));
      this.render();
    } catch (error) {
      console.warn('Không thể tải giỏ hàng:', error.message);
    }
  },

  formatMoney(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
  },

  render() {
    const items = this.cart.items || [];
    this.count.textContent = String(this.cart.totalQuantity || 0);
    this.subtotal.textContent = this.formatMoney(this.selectedItems().reduce((sum, item) => sum + Number(item.subtotal || 0), 0));

    if (items.length === 0) {
      this.itemsContainer.innerHTML = '<div class="empty-cart">Giỏ hàng của bạn đang trống.</div>';
      return;
    }

    this.itemsContainer.innerHTML = items.map((item) => `
      <label class="cart-item">
        <input class="cart-select" type="checkbox" value="${this.escape(item.id)}" ${this.selectedIds.has(String(item.id)) ? 'checked' : ''}>
        <span class="cart-item-copy"><strong>${this.escape(item.productName)}</strong><small>${item.quantity} x ${this.formatMoney(item.price)}</small></span>
        <strong class="cart-item-price">${this.formatMoney(item.subtotal)}</strong>
      </label>
    `).join('');

    this.itemsContainer.querySelectorAll('.cart-select').forEach((input) => {
      input.addEventListener('change', (event) => {
        const id = String(event.target.value);
        if (event.target.checked) this.selectedIds.add(id);
        else this.selectedIds.delete(id);
        this.coupon = null;
        this.render();
      });
    });
  },

  selectedItems() {
    return (this.cart.items || []).filter((item) => this.selectedIds.has(String(item.id)));
  },

  openPanel() {
    this.panel.classList.remove('hidden');
    this.load();
  },

  closePanel() {
    this.panel.classList.add('hidden');
  },

  openCheckout() {
    const selected = this.selectedItems();
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('checkout-name').value = user.fullName || '';
    document.getElementById('checkout-phone').value = user.phone || '';
    document.getElementById('checkout-error').textContent = '';
    document.getElementById('checkout-error').style.display = 'none';
    this.coupon = null;
    document.getElementById('coupon-message').textContent = '';
    this.renderSummary();
    this.checkoutModal.classList.remove('hidden');
  },

  closeCheckout() {
    this.checkoutModal.classList.add('hidden');
  },

  renderSummary() {
    const subtotal = this.selectedItems().reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const discount = Number(this.coupon?.discountAmount || 0);
    document.getElementById('checkout-summary').innerHTML = `
      <span>${this.selectedItems().length} sản phẩm đã chọn</span>
      <strong>Tạm tính: ${this.formatMoney(subtotal)}</strong>
      ${discount ? `<span class="discount-line">Giảm: -${this.formatMoney(discount)}</span><strong>Thanh toán dự kiến: ${this.formatMoney(Math.max(0, subtotal - discount))}</strong>` : ''}
    `;
  },

  async applyCoupon() {
    const input = document.getElementById('checkout-coupon');
    const message = document.getElementById('coupon-message');
    const code = input.value.trim();
    if (!code) {
      message.textContent = 'Nhập mã giảm giá trước.';
      message.className = 'coupon-invalid';
      return;
    }

    try {
      const subtotal = this.selectedItems().reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const response = await ApiService.applyCoupon({ code, subtotal });
      this.coupon = response.data;
      message.textContent = `Đã áp dụng ${this.coupon.code}: giảm ${this.formatMoney(this.coupon.discountAmount)}.`;
      message.className = 'coupon-valid';
      this.renderSummary();
    } catch (error) {
      this.coupon = null;
      message.textContent = error.message;
      message.className = 'coupon-invalid';
      this.renderSummary();
    }
  },

  async submitOrder(event) {
    event.preventDefault();
    const errorBox = document.getElementById('checkout-error');
    const button = document.getElementById('place-order');
    const selected = this.selectedItems();
    const requiredIds = ['checkout-name', 'checkout-phone', 'checkout-province', 'checkout-address'];
    const missing = requiredIds.some((id) => !document.getElementById(id).value.trim());
    if (selected.length === 0 || missing) {
      errorBox.textContent = selected.length === 0 ? 'Vui lòng chọn sản phẩm.' : 'Vui lòng điền đầy đủ thông tin bắt buộc.';
      errorBox.style.display = 'block';
      return;
    }

    button.disabled = true;
    errorBox.style.display = 'none';
    const value = (id) => document.getElementById(id).value.trim();
    const payload = {
      warehouseId: 1,
      cartItemIds: selected.map((item) => Number(item.id)),
      receiverName: value('checkout-name'),
      receiverPhone: value('checkout-phone'),
      shippingProvince: value('checkout-province'),
      shippingDistrict: value('checkout-district'),
      shippingWard: value('checkout-ward'),
      shippingAddress: value('checkout-address'),
      shippingFee: 0,
      couponCode: this.coupon?.code || value('checkout-coupon') || undefined,
      note: value('checkout-note') || undefined,
      payment: { paymentMethod: document.getElementById('checkout-payment').value }
    };

    try {
      const response = await ApiService.createOrder(payload);
      const order = response.data || {};
      this.closeCheckout();
      this.closePanel();
      this.selectedIds.clear();
      await this.load();
      ChatModule.addMessage(`Đặt hàng thành công! Mã đơn hàng của bạn là #${order.id || order.orderCode}.`, 'assistant');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
    }
  },

  escape(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
  }
};
