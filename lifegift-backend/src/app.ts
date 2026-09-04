import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import { authenticateJwt } from './common/middlewares/auth.middleware';
import { errorHandler } from './common/middlewares/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import categoryRoutes from './modules/category/category.routes';
import brandRoutes from './modules/brand/brand.routes';
import productsRoutes from './modules/product/product.routes';
import warehouseRoutes from './modules/warehouse/warehouse.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import purchaseRoutes from './modules/purchase/purchase.routes';
import cartRoutes from './modules/cart/cart.routes'; 
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import supplierRoutes from './modules/supplier/supplier.router';
import goodsReceiptRoutes from './modules/goods_receipt/goods-receipt.router';
import couponRoutes from './modules/coupon/coupon.router';
import reviewRoutes from './modules/review/review.routes';
import blogRoutes from './modules/blog/blog.routes';
import chatRoutes from './modules/chat/chat.router';

// Import file Swagger Output bằng require để tránh lỗi TypeScript
const swaggerDocument = require('../swagger-output.json');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 1. Route cho Swagger UI (Đặt TRƯỚC authenticateJwt để xem công khai)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 2. Đăng ký JwtFilter toàn cục (tương đương JwtAuthenticationFilter)
app.use(authenticateJwt);

// 3. Khai báo Routes chính
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchase-orders', purchaseRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/goods-receipts', goodsReceiptRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`Tài liệu Swagger API: http://localhost:${PORT}/api/docs`);
});

export default app;