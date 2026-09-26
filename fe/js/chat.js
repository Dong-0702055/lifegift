function formatComparisonMoney(value) {
  const amount = Number(value || 0);
  return amount > 0 ? `${amount.toLocaleString('vi-VN')}đ` : 'Liên hệ';
}

function createComparisonTable(products) {
  const wrapper = document.createElement('div');
  wrapper.className = 'comparison-table-wrap';

  const table = document.createElement('table');
  table.className = 'comparison-table';
  const fields = [
    ['Sản phẩm', product => product.name || product.productName || '-'],
    ['Giới thiệu', product => product.shortDescription || product.description || '-'],
    ['SKU', product => product.sku || '-'],
    ['Danh mục', product => product.categoryName || '-'],
    ['Thương hiệu', product => product.brandName || '-'],
    ['Giá niêm yết', product => formatComparisonMoney(product.price)],
    ['Giá bán', product => formatComparisonMoney(product.salePrice ?? product.price)],
    ['Tiết kiệm', product => formatComparisonMoney(Math.max(Number(product.price || 0) - Number(product.salePrice ?? (product.price || 0)), 0))],
    ['Quy cách', product => product.unit || '-'],
    ['Khối lượng', product => product.weight ? `${product.weight}g` : '-'],
    ['Xuất xứ', product => product.origin || '-'],
    ['Tồn kho', product => `${product.totalStockQuantity ?? 0}`],
    ['Có thể bán', product => `${product.totalAvailableQuantity ?? 0}`],
    ['Trạng thái', product => product.status || '-'],
    ['Nổi bật', product => product.isFeatured ? 'Có' : 'Không'],
  ];

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  const labelHead = document.createElement('th');
  labelHead.textContent = 'Tiêu chí';
  headRow.appendChild(labelHead);
  products.forEach(product => {
    const cell = document.createElement('th');
    cell.textContent = product.name || product.productName || 'Sản phẩm';
    headRow.appendChild(cell);
  });
  head.appendChild(headRow);

  const body = document.createElement('tbody');
  fields.forEach(([label, getter]) => {
    const row = document.createElement('tr');
    const labelCell = document.createElement('th');
    labelCell.textContent = label;
    row.appendChild(labelCell);
    products.forEach(product => {
      const cell = document.createElement('td');
      cell.textContent = getter(product);
      row.appendChild(cell);
    });
    body.appendChild(row);
  });

  table.append(head, body);
  wrapper.appendChild(table);
  return wrapper;
}

function createOrderTable(orders, chatModule, allowCancel = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'order-table-wrap';

  const table = document.createElement('table');
  table.className = 'order-table';

  const headers = ['Mã đơn hàng', 'Sản phẩm', 'Địa chỉ', 'Ngày đặt', 'Thanh toán', 'Trạng thái'];
  if (allowCancel) headers.push('Thao tác');
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  headers.forEach(label => {
    const cell = document.createElement('th');
    cell.textContent = label;
    headRow.appendChild(cell);
  });
  head.appendChild(headRow);

  const body = document.createElement('tbody');

  orders.forEach(order => {
    const row = document.createElement('tr');
    const products = (order.items || [])
      .map(item => `${item.productName || 'Sản phẩm'} (x${item.quantity || 0})`)
      .join(', ') || 'Không có thông tin';
    const paymentLabels = {
      COD: 'Thanh toán khi nhận hàng',
      BANK_TRANSFER: 'Chuyển khoản',
      MOMO: 'MoMo',
      VNPAY: 'VNPay'
    };
    const statusLabels = {
      PENDING: 'Chờ xử lý',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý'
    };
    const values = [
      `#${order.id}${order.orderCode ? ` (${order.orderCode})` : ''}`,
      products,
      order.shippingAddress || 'Chưa cập nhật',
      order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật',
      paymentLabels[order.payment?.paymentMethod] || order.payment?.paymentMethod || 'Chưa cập nhật',
      statusLabels[order.orderStatus] || order.orderStatus || 'Chưa cập nhật'
    ];

    values.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    if (allowCancel) {
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'order-cancel-button';
      cancelButton.textContent = 'Hủy đơn';
      cancelButton.addEventListener('click', async () => {
        if (cancelButton.disabled) return;
        cancelButton.disabled = true;
        cancelButton.textContent = 'Đang hủy...';

        try {
          const result = await ApiService.cancelOrder(order.id);
          row.remove();
          chatModule.addMessage(
            result.message || `Đã hủy đơn hàng #${order.id} thành công.`,
            'assistant'
          );
        } catch (error) {
          cancelButton.disabled = false;
          cancelButton.textContent = 'Hủy đơn';
          chatModule.addMessage(`Không thể hủy đơn hàng #${order.id}: ${error.message}`, 'assistant');
        }
      });

      const actionCell = document.createElement('td');
      actionCell.appendChild(cancelButton);
      row.appendChild(actionCell);
    }
    body.appendChild(row);
  });

  table.append(head, body);
  wrapper.appendChild(table);
  return wrapper;
}

function createCheckoutEditor(details, products, chatModule) {
  const form = document.createElement('form');
  form.className = 'checkout-edit-form';
  form.addEventListener('submit', (event) => event.preventDefault());

  const heading = document.createElement('h3');
  heading.textContent = 'Thông tin nhận hàng';
  form.appendChild(heading);

  const checkoutProducts = products.length > 0 ? products : (details.checkoutItems || []);
  if (checkoutProducts.length > 0) {
    const orderSummary = document.createElement('div');
    orderSummary.className = 'checkout-edit-items';
    const summaryTitle = document.createElement('strong');
    summaryTitle.textContent = 'Sản phẩm trong đơn';
    orderSummary.appendChild(summaryTitle);
    const list = document.createElement('ul');
    checkoutProducts.forEach((product, index) => {
      const item = document.createElement('li');
      const name = product.name || product.productName || 'Sản phẩm';
      const quantity = Number(product.quantity || 0);
      const unitPrice = Number(product.salePrice || product.price || 0);
      item.textContent = `${index + 1}. ${name} x ${quantity} · ${(unitPrice * quantity).toLocaleString('vi-VN')}đ`;
      list.appendChild(item);
    });
    orderSummary.appendChild(list);
    form.appendChild(orderSummary);
  }

  const fields = document.createElement('div');
  fields.className = 'checkout-edit-fields';
  const addInput = (labelText, name, value, attributes = {}) => {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.name = name;
    input.value = value || '';
    input.required = true;
    input.maxLength = attributes.maxLength || 255;
    input.type = attributes.type || 'text';
    if (attributes.inputMode) input.inputMode = attributes.inputMode;
    if (attributes.autocomplete) input.autocomplete = attributes.autocomplete;
    label.appendChild(input);
    fields.appendChild(label);
  };

  addInput('Tên người nhận', 'receiverName', details.receiverName, { maxLength: 150, autocomplete: 'name' });
  addInput('Số điện thoại', 'receiverPhone', details.receiverPhone, { type: 'tel', maxLength: 11, inputMode: 'numeric', autocomplete: 'tel' });
  addInput('Địa chỉ giao hàng', 'address', details.address, { maxLength: 255, autocomplete: 'street-address' });

  const paymentLabel = document.createElement('label');
  paymentLabel.textContent = 'Phương thức thanh toán';
  const paymentSelect = document.createElement('select');
  paymentSelect.name = 'paymentMethod';
  paymentSelect.required = true;
  [
    ['COD', 'Thanh toán khi nhận hàng (COD)'],
    ['BANK_TRANSFER', 'Chuyển khoản'],
    ['MOMO', 'MoMo'],
    ['VNPAY', 'VNPay'],
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    paymentSelect.appendChild(option);
  });
  paymentSelect.value = details.paymentMethod || 'COD';
  paymentLabel.appendChild(paymentSelect);
  fields.appendChild(paymentLabel);
  form.appendChild(fields);

  const help = document.createElement('p');
  help.className = 'checkout-edit-help';
  help.textContent = 'Kiểm tra đơn hàng và thông tin nhận hàng. Nếu đúng, hãy gõ "Xác nhận đặt hàng" bên dưới. Nếu cần sửa, chỉnh trực tiếp các trường rồi xác nhận.';
  form.appendChild(help);

  return form;
}

const ChatModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
  },

  cacheDOM() {
    this.chatForm = document.getElementById('chat-form');
    this.input = document.getElementById('message');
    this.sendBtn = document.getElementById('send');
    this.messagesContainer = document.getElementById('messages');
    this.welcomeSection = document.getElementById('welcome');
    this.mainChat = document.getElementById('main-chat');
  },

  bindEvents() {
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSend();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.chatForm.requestSubmit();
      }
    });
  },

  async handleSend() {
    const text = this.input.value.trim();
    if (!text || this.sendBtn.disabled) return;

    this.input.value = '';
    await this.sendText(text);
  },

  async sendText(text) {
    if (!text || this.sendBtn.disabled) return;

    const isCheckoutConfirmation = /(?:xác nhận|xac nhan|đặt hàng|dat hang)/i.test(text);
    if (isCheckoutConfirmation && this.currentCheckoutForm) {
      const form = this.currentCheckoutForm;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form).entries());
      const phone = String(values.receiverPhone || '').replace(/\D/g, '');
      const phoneInput = form.querySelector('[name="receiverPhone"]');
      if (!/^0\d{9,10}$/.test(phone)) {
        phoneInput.setCustomValidity('Nhập số điện thoại gồm 10 hoặc 11 chữ số, bắt đầu bằng 0.');
        form.reportValidity();
        return;
      }
      phoneInput.setCustomValidity('');
      const paymentLabels = {
        COD: 'Thanh toán khi nhận hàng',
        BANK_TRANSFER: 'Chuyển khoản',
        MOMO: 'MoMo',
        VNPAY: 'VNPay',
      };
      text = `${text}. Tên người nhận: ${String(values.receiverName).trim()}; Số điện thoại: ${phone}; Địa chỉ giao hàng: ${String(values.address).trim()}; Phương thức thanh toán: ${paymentLabels[values.paymentMethod]}`;
    }

    this.welcomeSection.hidden = true;
    this.addMessage(text, 'user');
    this.sendBtn.disabled = true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    try {
      const data = await ApiService.sendMessage({
        message: text,
        userId: user.id || user.username,
        accessToken: token
      });

      const replyMsg = data.replyMessage || data.response || 'Mình chưa tìm được câu trả lời phù hợp.';
      const products = data.products || data.data?.products || [];

      const intentName = data.intent?.name || data.intent;
      this.addMessage(replyMsg, 'assistant', products, intentName, data.entities || {});
      const cartIntents = [
        'them_gio_hang', 'them_vao_gio_hang', 'xem_gio_hang',
        'cap_nhat_gio_hang', 'xoa_khoi_gio_hang', 'xoa_tat_ca_gio_hang'
      ];

      // Chat cũng trả về snapshot giỏ hàng; cập nhật ngay để panel không giữ dữ liệu rỗng cũ.
      if (cartIntents.includes(intentName)) {
        const cartSnapshot = data.products && !Array.isArray(data.products) && Array.isArray(data.products.items)
          ? data.products
          : null;
        if (cartSnapshot) {
          CartModule.cart = cartSnapshot;
          CartModule.render();
        }
        await CartModule.load();
      }

      if (['bat_dau_dat_hang', 'thanh_toan_don_hang', 'dat_hang'].includes(intentName)) {
        CartModule.openPanel();
      }
    } catch (error) {
      this.addMessage(`Lỗi: ${error.message}`, 'assistant');
    } finally {
      this.sendBtn.disabled = false;
      this.input.focus();
    }
  },

  addMessage: function(text, role, products = [], intentName = '', checkoutInfo = {}) {
    const row = document.createElement('div');
    row.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    if (role === 'assistant') {
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = 'LifeGift';
      row.append(avatar, bubble);
    } else {
      row.appendChild(bubble);
    }

    this.messagesContainer.appendChild(row);

    const checkoutIntents = ['bat_dau_dat_hang', 'thanh_toan_don_hang', 'dat_hang', 'nhap_dia_chi_giao_hang', 'chon_phuong_thuc_thanh_toan'];
    if (role === 'assistant' && checkoutIntents.includes(intentName) && checkoutInfo.checkoutStep) {
      bubble.textContent = 'Kiểm tra đơn hàng và thông tin nhận hàng. Nếu có sai sót, hãy chỉnh sửa trực tiếp bên dưới.';
      const checkoutEditor = createCheckoutEditor(checkoutInfo, Array.isArray(products) ? products : [], this);
      this.currentCheckoutForm = checkoutEditor;
      bubble.appendChild(checkoutEditor);
    }

    if (role === 'assistant' && intentName === 'so_sanh_san_pham' && products.length > 0) {
      bubble.appendChild(createComparisonTable(products));
    }

    const isOrderResponse = role === 'assistant' && ['huy_don_hang', 'tra_cuu_don_hang'].includes(intentName);
    const orderData = Array.isArray(products)
      ? products
      : products && products.orderStatus
        ? [products]
        : [];
    if (isOrderResponse && orderData.length > 0) {
      bubble.appendChild(createOrderTable(orderData, this, intentName === 'huy_don_hang'));
      this.mainChat.scrollTop = this.mainChat.scrollHeight;
      return;
    }

    if (products && products.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'product-grid';

      products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const img = document.createElement('img');
        img.setAttribute('referrerpolicy', 'no-referrer');
        img.src = getProductImage(product);
        img.onerror = () => { img.src = DEFAULT_IMAGE; };
        img.alt = product.name || product.productName || 'Sản phẩm';

        const info = document.createElement('div');
        info.className = 'product-info';

        const brand = document.createElement('span');
        brand.className = 'product-brand';
        brand.textContent = product.brand || product.brandName || 'LifeGift';

        const name = document.createElement('h4');
        name.className = 'product-name';
        name.textContent = product.name || product.productName || 'Sản phẩm LifeGift';

        const stockCount = product.totalAvailableQuantity ?? product.totalStockQuantity ?? product.stock ?? 0;
        const stock = document.createElement('span');
        stock.className = 'product-stock';
        stock.textContent = `Khả dụng: ${stockCount}`;

        const priceVal = Number(product.salePrice || product.price || 0);
        const price = document.createElement('span');
        price.className = 'product-price';
        price.textContent = priceVal > 0 ? `${priceVal.toLocaleString('vi-VN')}đ` : 'Chưa có giá';

        info.append(brand, name, stock, price);
        card.append(img, info);

        card.addEventListener('click', () => {
          ModalModule.show(product);
        });

        grid.appendChild(card);
      });

      bubble.appendChild(grid);
    }

    this.mainChat.scrollTop = this.mainChat.scrollHeight;
  },

};