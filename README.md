# LifeGift

LifeGift gồm hai phần:

- `lifegift-backend/`: REST API Express, Prisma và MySQL.
- `AI/`: Python service phân loại intent tiếng Việt cho chức năng chat.

## Yêu cầu

- Git
- Node.js 18 trở lên và npm 9 trở lên
- Python 3.10 trở lên
- MySQL 8 trở lên

## Lấy đầy đủ file sau khi clone

```powershell
git clone <URL_REPOSITORY>
cd lifegift
```

Các file sau đang bị loại bởi `.gitignore`, vì vậy sẽ **không xuất hiện khi clone**:

- `AI/phobert_dataset/`
- `AI/model/intent_classifier/best_model/`
- Các file model có đuôi `.safetensors`, `.pt`, `.pth`, `.bin`, ...
- Mọi file `.env`

Hãy lấy các file này từ nơi lưu trữ nội bộ hoặc bản sao lưu của dự án, rồi đặt đúng cấu trúc:

```text
AI/
├── phobert_dataset/
│   ├── train_intent.csv
│   ├── validation_intent.csv
│   └── test_intent.csv
└── model/intent_classifier/best_model/
    ├── config.json
    ├── model.safetensors
    ├── tokenizer_config.json
  └── vocab.txt

AI/model/intent_classifier/
└── label_map.json
```

Trên Windows, có thể sao chép từ thư mục backup bằng PowerShell:

```powershell
Copy-Item -Recurse "D:\BACKUP\phobert_dataset" "AI\phobert_dataset"
Copy-Item -Recurse "D:\BACKUP\best_model" "AI\model\intent_classifier\best_model"
```

Nếu không có model đã train, lấy dataset rồi huấn luyện lại theo hướng dẫn trong [`AI/README.md`](AI/README.md):

```powershell
cd AI
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install torch transformers datasets pandas numpy scikit-learn underthesea fastapi uvicorn
python train_intent.py
```

## Cấu hình và chạy backend

Tạo database MySQL, sau đó tạo file `lifegift-backend/.env`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/lifegift"
PORT=8080
AI_SERVICE_URL="http://localhost:5000"
JWT_SECRET="change-this-access-token-secret"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="change-this-refresh-token-secret"
JWT_REFRESH_EXPIRES_IN="7d"
```

Chạy các lệnh sau trong terminal backend:

```powershell
cd lifegift-backend
npm install
npx prisma validate
npx prisma generate
npx prisma db push
npm run dev
```

## Chạy AI service

Mở terminal thứ hai:

```powershell
cd AI
.\.venv\Scripts\Activate.ps1
python -m uvicorn app:app --host 0.0.0.0 --port 5000
```

AI endpoint là `POST http://localhost:5000/predict-intent`. Backend mặc định gọi endpoint này khi xử lý chat.

## Kiểm tra

- Backend API: <http://localhost:8080>
- Swagger UI: <http://localhost:8080/api/docs>
- AI API docs: <http://localhost:5000/docs>

Để kiểm tra nhanh AI:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/predict-intent `
  -ContentType "application/json" `
  -Body '{"text":"cafe robusta còn hàng không?"}'
```

## Lưu ý

- Không commit `.env`, password database hoặc secret JWT.
- Nếu backend không kết nối được AI, kiểm tra AI service đang chạy ở cổng `5000` và `AI_SERVICE_URL` trong `.env`.
- `npm run build` hiện biên dịch JavaScript cạnh source; chạy phát triển bằng `npm run dev` là cách được khuyến nghị.