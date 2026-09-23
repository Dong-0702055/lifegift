const API_HOST = window.location.hostname || 'localhost';
const API_BASE = window.LIFEGIFT_API_BASE || `http://${API_HOST}:8080/api`;
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop';

function getProductImage(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0].trim();
  }
  const url = product.image || product.imageUrl || product.img || product.thumbnail || product.photo || '';
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_IMAGE;
  }
  return url.trim();
}