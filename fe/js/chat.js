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

    this.welcomeSection.hidden = true;
    this.addMessage(text, 'user');
    this.input.value = '';
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

      this.addMessage(replyMsg, 'assistant', products);
      const intentName = data.intent?.name || data.intent;
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

  addMessage(text, role, products = []) {
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
  }
};