# LifeGift Backend

Backend API cho hệ thống thương mại điện tử LifeGift. Dự án cung cấp các chức năng quản lý người dùng, sản phẩm, danh mục, thương hiệu, giỏ hàng, đơn hàng, thanh toán, kho hàng, nhập hàng, mã giảm giá, đánh giá, bài viết và chat.

## Công nghệ sử dụng

- Node.js
- TypeScript
- Express 5
- Prisma ORM
- MySQL
- JWT cho xác thực và phân quyền
- bcryptjs để băm mật khẩu
- class-validator và class-transformer để kiểm tra dữ liệu đầu vào
- Swagger UI và swagger-autogen để tạo tài liệu API
- CORS và dotenv

## Yêu cầu môi trường

- Node.js 18 trở lên
- npm 9 trở lên
- MySQL 8 trở lên

## Cài đặt

```bash
git clone <URL_REPOSITORY>
cd lifegift/lifegift-backend
npm install
```

Tạo file `.env` ở thư mục gốc:

```env
DATABASE_URL="mysql://<username>:<password>@localhost:3306/<database_name>"

PORT=8080
JWT_SECRET="change-this-access-token-secret"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="change-this-refresh-token-secret"
JWT_REFRESH_EXPIRES_IN="7d"
AI_SERVICE_URL="http://localhost:5000"
```

> Không đưa file `.env` hoặc các secret thật lên Git. Các giá trị mặc định trong source code chỉ phù hợp cho môi trường phát triển và nên được thay thế khi triển khai.

## Cơ sở dữ liệu và Prisma

Schema Prisma nằm tại `prisma/schema.prisma` và đang sử dụng MySQL.

### Tạo database từ Prisma

Prisma hiện cung cấp dịch vụ **Prisma Postgres**. Database này không phải MySQL, trong khi dự án hiện tại đang khai báo:

```prisma
datasource db {
  provider = "mysql"
}
```

Nếu bạn chưa có database, có hai lựa chọn:

**Lựa chọn 1: dùng MySQL (khuyến nghị cho source hiện tại)**

Tạo một database MySQL từ nhà cung cấp bạn sử dụng, sau đó lấy connection string dạng:

```env
DATABASE_URL="mysql://username:password@host:3306/database_name"
```

Đặt chuỗi này vào file `.env` rồi thực hiện các bước Prisma bên dưới.

**Lựa chọn 2: tạo database bằng Prisma Postgres**

1. Truy cập [Prisma Console](https://console.prisma.io/) và đăng nhập.
2. Tạo workspace hoặc chọn workspace hiện có.
3. Chọn **Create project**, đặt tên project và chọn region.
4. Tạo database PostgreSQL trong project.
5. Mở phần kết nối database, sao chép **Direct connection string**.
6. Đặt chuỗi nhận được vào `.env`:

```env
DATABASE_URL="postgresql://username:password@host:5432/database_name?schema=public"
```

Để dùng Prisma Postgres, cần đổi `provider` trong `prisma/schema.prisma` thành `postgresql` và chuyển đổi các kiểu dữ liệu MySQL trong schema, ví dụ `@db.LongText`, `@db.VarChar(...)` và các annotation đặc thù khác. Không nên chỉ thay `DATABASE_URL`, vì schema hiện tại có thể không tương thích với PostgreSQL.

Sau khi schema đã được chuyển đổi, chạy:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init
```

Không chia sẻ connection string hoặc đưa nó vào Git. Prisma Console cũng có thể mở database bằng Prisma Studio sau khi project đã kết nối thành công.

Sinh Prisma Client:

```bash
npx prisma generate
```

Đồng bộ schema với database trong môi trường phát triển:

```bash
npx prisma db push
```

Kiểm tra schema:

```bash
npx prisma validate
```

Mở Prisma Studio:

```bash
npx prisma studio
```

Dự án hiện chưa có thư mục migration hoặc script seed được khai báo. Trước khi đăng ký tài khoản, database cần có role `CUSTOMER`, vì quy trình đăng ký sẽ tự động gán role này cho người dùng mới.

## Chạy dự án

Chạy ở chế độ phát triển, tự khởi động lại khi source thay đổi:

```bash
npm run dev
```

Biên dịch TypeScript:

```bash
npm run build
```

Hiện tại `tsconfig.json` chưa cấu hình `outDir`, vì vậy lệnh build sinh file JavaScript cạnh file TypeScript trong `src`. Sau khi build, chạy bằng:

```bash
node src/app.js
```

`npm start` hiện chưa phù hợp với cấu hình build hiện tại vì script trỏ tới `dist/app.ts`, trong khi `dist` không được tạo. Dùng `npm run dev` để phát triển hoặc cấu hình lại `outDir` và script trước khi chạy production.

Tạo hoặc cập nhật tài liệu Swagger:

```bash
npm run swagger
```

Các script có sẵn:

| Script | Mô tả |
| --- | --- |
| `npm run dev` | Chạy server phát triển bằng `ts-node-dev` |
| `npm run build` | Biên dịch TypeScript sang JavaScript cạnh source trong `src` |
| `npm start` | Chạy bản build, cần lưu ý entry point hiện tại |
| `npm run swagger` | Sinh lại `swagger-output.json` |

## Địa chỉ mặc định

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/api/docs`

Nếu đặt biến `PORT`, server sẽ sử dụng cổng trong biến đó.

## Các nhóm API

Tất cả route nghiệp vụ được đăng ký trong `src/app.ts` với các prefix sau:

| Nhóm | Prefix | Chức năng |
| --- | --- | --- |
| Auth | `/api/auth` | Đăng ký, đăng nhập, refresh token, đăng xuất |
| Users | `/api/users` | Quản lý người dùng và thông tin tài khoản |
| Categories | `/api/categories` | Quản lý danh mục sản phẩm |
| Brands | `/api/brands` | Quản lý thương hiệu |
| Products | `/api/products` | Quản lý sản phẩm |
| Warehouses | `/api/warehouses` | Quản lý kho |
| Inventory | `/api/inventory` | Tồn kho và giao dịch kho |
| Purchase orders | `/api/purchase-orders` | Quản lý đơn mua hàng |
| Cart | `/api/cart` | Quản lý giỏ hàng |
| Orders | `/api/orders` | Tạo và quản lý đơn bán hàng |
| Payments | `/api/payments` | Xử lý thông tin thanh toán |
| Suppliers | `/api/suppliers` | Quản lý nhà cung cấp |
| Goods receipts | `/api/goods-receipts` | Quản lý phiếu nhập kho |
| Coupons | `/api/coupons` | Quản lý mã giảm giá |
| Reviews | `/api/reviews` | Quản lý đánh giá sản phẩm |
| Blog | `/api/blog` | Quản lý danh mục và bài viết |
| Chat | `/api/chat` | Chức năng chat |

Danh sách method, request body, tham số, response và mã lỗi đầy đủ được xem tại Swagger UI.

## Xác thực và phân quyền

Middleware JWT được đăng ký toàn cục. Route công khai có thể truy cập mà không cần token; các route yêu cầu đăng nhập sẽ sử dụng `requireAuth`, còn route giới hạn quyền sử dụng `authorizeRoles`.

Gửi access token trong header:

```http
Authorization: Bearer <access-token>
```

Các endpoint xác thực chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/api/auth/login` | Đăng nhập và nhận access/refresh token |
| `POST` | `/api/auth/refresh-token` | Cấp lại token |
| `POST` | `/api/auth/logout` | Hủy refresh token |

Mặc định:

- Access token hết hạn sau `1d`.
- Refresh token hết hạn sau `7d`.
- Một tài khoản tối đa 5 refresh session theo logic hiện tại.
- Người dùng đăng ký mới được gán role `CUSTOMER`.

## Định dạng request mẫu

Đăng ký:

```json
{
  "username": "nguyenvanA",
  "password": "123456",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "email": "a@example.com"
}
```

Đăng nhập:

```json
{
  "username": "nguyenvanA",
  "password": "123456"
}
```

Làm mới token hoặc đăng xuất:

```json
{
  "refreshToken": "<refresh-token>"
}
```

## Validation và response

Request body được chuyển thành DTO và kiểm tra bằng `class-validator`. Các thuộc tính không được khai báo trong DTO sẽ bị từ chối.

Response thành công thường có dạng:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Response lỗi thường có dạng:

```json
{
  "success": false,
  "message": "...",
  "data": null
}
```

Một số mã HTTP thường gặp:

- `400 Bad Request`: dữ liệu gửi lên không hợp lệ hoặc thao tác thất bại.
- `401 Unauthorized`: thiếu hoặc không hợp lệ access token.
- `403 Forbidden`: người dùng không đủ quyền.
- `404 Not Found`: không tìm thấy tài nguyên.
- `500 Internal Server Error`: lỗi phía server.

## Cấu trúc thư mục

```text
prisma/
  schema.prisma          # Mô hình dữ liệu Prisma
src/
  app.ts                 # Khởi tạo Express, middleware và route
  common/                # Middleware, exception, response, type và utility dùng chung
  config/                # Cấu hình database
  modules/               # Các module theo nghiệp vụ
    auth/
    blog/
    brand/
    cart/
    category/
    chat/
    coupon/
    goods_receipt/
    inventory/
    order/
    payment/
    product/
    purchase/
    review/
    supplier/
    user/
    warehouse/
  routes/                # Route dùng chung nếu có
  services/              # Service dùng chung, ví dụ alias resolver
swagger.js               # Cấu hình sinh Swagger
swagger-output.json      # Tài liệu Swagger được sinh tự động
```

Mỗi module nghiệp vụ thường được chia thành:

- `*.controller.ts`: nhận request và trả response.
- `*.service.ts`: xử lý nghiệp vụ và truy vấn database.
- `*.dto.ts`: định nghĩa và kiểm tra dữ liệu đầu vào.
- `*.routes.ts` hoặc `*.router.ts`: khai báo endpoint.

## Luồng xử lý tổng quát

```text
Client
  -> Express middleware
  -> JWT authentication
  -> DTO validation
  -> Controller
  -> Service
  -> Prisma Client
  -> MySQL
```

Middleware xử lý lỗi được đăng ký ở cuối pipeline Express để chuẩn hóa lỗi phát sinh từ các route và service.

## Phát triển và đóng góp

1. Tạo branch cho thay đổi mới.
2. Cập nhật `.env` cục bộ, không commit secret.
3. Cập nhật Prisma schema nếu thay đổi mô hình dữ liệu.
4. Chạy `npx prisma validate` và `npm run build` trước khi tạo pull request.
5. Nếu thay đổi endpoint, chạy `npm run swagger` và kiểm tra lại Swagger UI.
6. Mô tả rõ endpoint, quyền truy cập và thay đổi database trong pull request.

## Giấy phép

Dự án hiện khai báo giấy phép `ISC` trong `package.json`.
