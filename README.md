# LifeGift

LifeGift là hệ thống thương mại điện tử dành cho ngành nông sản và thực phẩm, tích hợp backend API, frontend quản trị/website và dịch vụ AI để hỗ trợ chatbot theo intent tiếng Việt.

Dự án gồm 3 thành phần chính:

- `lifegift-backend/`: API REST, xác thực người dùng, quản lý đơn hàng, sản phẩm, kho hàng, thanh toán và tích hợp AI
- `lifegift-frontend/`: giao diện web người dùng và admin bằng React + Vite
- `AI/`: mô hình PhoBERT cho phân loại intent và extraction entity tiếng Việt

## Tính năng chính

- Quản lý sản phẩm, danh mục, đơn hàng và kho hàng
- Hệ thống người dùng, phân quyền và xác thực JWT
- Chatbot AI hỗ trợ hiểu ý định khách hàng bằng tiếng Việt
- Tích hợp Redis, MySQL, Prisma ORM
- Giao diện web hiện đại, nhanh và responsive
- API documentation với Swagger
- Có thể chạy bằng Docker Compose hoặc cài đặt thủ công

## Công nghệ sử dụng

### Backend
- Node.js
- TypeScript
- Express.js
- Prisma ORM
- MySQL
- Redis
- Swagger

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS (đang được tích hợp/áp dụng)

### AI
- Python
- FastAPI
- PyTorch
- Transformers
- PhoBERT
- underthesea

## Cấu trúc repository

```text
lifegift/
├── AI/
│   ├── src/
│   ├── knowledge/
│   ├── model/
│   ├── phobert_dataset/
│   ├── ai_service_api.py
│   ├── train_intent_classifier.py
│   ├── train_ner_model.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
├── lifegift-backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
├── lifegift-frontend/
│   ├── src/
│   ├── public/
│   ├── scripts/
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml
├── lifegift.sql
├── README.md
└── .gitignore
```

## Yêu cầu hệ thống

- Git
- Node.js 18+
- npm 9+
- Python 3.10+
- MySQL 8+
- Redis 7+
- Docker + Docker Compose (tùy chọn, khuyến nghị cho môi trường phát triển)

## Khởi chạy nhanh với Docker

Tại root của dự án:

```bash
docker compose up --build
```

Sau khi chạy xong, các dịch vụ sẽ có các cổng:

- Frontend: http://localhost:5500
- Backend API: http://localhost:8080
- Swagger: http://localhost:8080/api/docs
- AI Service: http://localhost:5000
- MySQL: localhost:3306
- Redis: localhost:6379

Dịch vụ MySQL trong Docker sẽ tự khởi tạo database từ file `lifegift.sql`.

## Cài đặt và chạy thủ công

### 1. Backend

Tạo file `.env` trong `lifegift-backend/`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/lifegift"
PORT=8080
AI_SERVICE_URL="http://localhost:5000"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="change-this-access-token-secret"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="change-this-refresh-token-secret"
JWT_REFRESH_EXPIRES_IN="7d"
```

Sau đó chạy:

```bash
cd lifegift-backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend sẽ chạy ở:

- http://localhost:8080
- Swagger UI: http://localhost:8080/api/docs

### 2. Frontend

```bash
cd lifegift-frontend
npm install
npm run dev
```

Mặc định Vite sẽ chạy trên port 5173, ví dụ:

- http://localhost:5173

### 3. AI Service

Khởi tạo môi trường Python:

```bash
cd AI
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Nếu chưa có model đã train, cần chuẩn bị dữ liệu trong `AI/phobert_dataset/` và `AI/model/intent_classifier/best_model/` như mô tả trong [AI/README.md](AI/README.md).

Chạy AI service:

```bash
python -m uvicorn ai_service_api:app --host 0.0.0.0 --port 5000
```

AI docs sẽ có tại:

- http://localhost:5000/docs

## Biến môi trường quan trọng

### Backend
- `DATABASE_URL`: kết nối MySQL
- `PORT`: cổng chạy API
- `AI_SERVICE_URL`: địa chỉ API của AI service
- `REDIS_HOST` / `REDIS_PORT`: thông tin Redis
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: khóa bí mật JWT

### AI
- Chạy trên port 5000 theo mặc định
- Backend sẽ gọi endpoint `POST /predict-intent` để phân loại ý định khách hàng

## Dữ liệu và model AI

Một số file dữ liệu/model đang bị loại bỏ khỏi Git tracking nhờ `.gitignore`, bao gồm:

- `AI/phobert_dataset/`
- `AI/model/intent_classifier/best_model/`
- file model dạng `.safetensors`, `.pt`, `.pth`, `.bin`
- các file `.env`

Do đó, khi clone repo mới, bạn cần chuẩn bị lại các tài nguyên này hoặc lấy từ bản backup nội bộ của dự án.

Chi tiết triển khai và mô hình AI nằm trong [AI/README.md](AI/README.md).

## Gợi ý phát triển

- Không commit thông tin nhạy cảm như `.env`, mật khẩu database hoặc JWT secret.
- Nếu backend không kết nối được AI, hãy kiểm tra `AI_SERVICE_URL` và trạng thái service trên port `5000`.
- Khi phát triển, nên dùng `npm run dev` cho backend/frontend để dễ debug hơn.
- Sử dụng `npm run build` trong giai đoạn kiểm tra production build trước khi deploy.

## Lưu ý

Dự án này đang được phát triển theo mô hình monorepo gồm backend, frontend và AI service. Việc quản lý source, môi trường và data thực tế nên được thực hiện đồng bộ giữa các thành phần để tránh lỗi khi chạy cục bộ hoặc trên môi trường deployment.

Nếu bạn muốn, tôi có thể tiếp tục viết tiếp một phiên bản README theo phong cách:

1. README ngắn gọn cho GitHub
2. README chi tiết cho team developer
3. README chuyên nghiệp dành cho khách hàng/đối tác
4. README có thêm hình ảnh, badges và cấu trúc chuẩn GitHub.