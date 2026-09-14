const ModalModule = {
  init() {
    this.modal = document.getElementById('product-modal');
    this.closeBtn = document.getElementById('modal-close-btn');

    this.closeBtn.addEventListener('click', () => this.hide());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });
  },

  show(product) {
    const modalImg = document.getElementById('modal-img');
    modalImg.onerror = () => { modalImg.src = DEFAULT_IMAGE; };
    modalImg.src = getProductImage(product);

    document.getElementById('modal-brand').textContent = product.brand || product.brandName || 'Nông sản LifeGift';
    document.getElementById('modal-title').textContent = product.name || product.productName || 'Sản phẩm LifeGift';
    
    const price = Number(product.salePrice || product.price || 0);
    document.getElementById('modal-price').textContent = price > 0 ? `${price.toLocaleString('vi-VN')}đ` : 'Chưa có giá';

    const stock = product.totalAvailableQuantity ?? product.totalStockQuantity ?? product.stock ?? 0;
    document.getElementById('modal-stock').textContent = `Khả dụng: ${stock}`;

    document.getElementById('modal-desc').textContent = product.description || product.detail || 'Hiện chưa có thêm thông tin chi tiết cho sản phẩm này.';

    this.modal.classList.remove('hidden');
  },

  hide() {
    this.modal.classList.add('hidden');
  }
};