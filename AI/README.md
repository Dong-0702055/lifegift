# LifeGift Intent Classifier

>Mô hình phân loại ý định tiếng Việt cho chatbot bán nông sản LifeGift, sử dụng PhoBERT và Hugging Face Transformers.

Project hiện có hai chức năng chính:

- Fine-tune PhoBERT trên bộ dữ liệu intent tiếng Việt.
- Nạp model đã huấn luyện để dự đoán intent, confidence và top 3 kết quả.

## Công nghệ

- Python
- [PhoBERT v2](https://huggingface.co/vinai/phobert-base-v2)
- PyTorch
- Hugging Face Transformers và Datasets
- pandas, NumPy, scikit-learn
- underthesea để tách từ tiếng Việt

## Cấu trúc project

```text
.
├── train_intent.py                  # Huấn luyện, đánh giá và lưu model
├── predict_intent.py                # Dự đoán intent tương tác trên terminal
├── knowledge/
│   ├── intent_schema.json            # Mô tả 22 intent
│   ├── entity_dataset.jsonl          # Ví dụ entity và SKU chuẩn hóa
│   ├── product_aliases.json          # Alias sản phẩm -> SKU
│   └── category_aliases.json         # Alias danh mục
├── phobert_dataset/
│   ├── train_intent.csv              # 752 mẫu train
│   ├── validation_intent.csv         # 94 mẫu validation
│   └── test_intent.csv               # 94 mẫu test
└── model/intent_classifier/
	├── best_model/                   # Model/tokenizer tốt nhất
	├── checkpoints/                  # Checkpoint trong quá trình train
	├── metrics.json
	├── labels.json
	├── label_map.json
	├── classification_report.txt
	├── confusion_matrix.csv
	└── training_history.json
```

## Cài đặt

Khuyến nghị sử dụng Python 3.10 trở lên trong virtual environment:

```bash
python -m venv .venv
```

Kích hoạt môi trường trên Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Cài các thư viện cần thiết:

```bash
pip install torch transformers datasets pandas numpy scikit-learn underthesea
```

PhoBERT sẽ được tải từ Hugging Face khi chạy huấn luyện lần đầu. Vì vậy cần kết nối Internet ở lần chạy đó, trừ khi model đã có sẵn trong cache.

## Huấn luyện model

Đảm bảo ba file CSV nằm trong `phobert_dataset/`, sau đó chạy:

```bash
python train_intent.py
```

Pipeline sẽ:

1. Đọc và kiểm tra các cột `text`, `intent`.
2. Chuẩn hóa Unicode, loại dòng rỗng và câu hỏi trùng lặp.
3. Tách từ tiếng Việt bằng underthesea.
4. Kiểm tra data leakage giữa train, validation và test.
5. Fine-tune `vinai/phobert-base-v2` với early stopping.
6. Đánh giá trên validation và test.
7. Lưu model tốt nhất cùng các báo cáo vào `model/intent_classifier/`.

Các cấu hình chính trong `train_intent.py`:

| Cấu hình | Giá trị |
| --- | --- |
| Model | `vinai/phobert-base-v2` |
| Max sequence length | `128` |
| Learning rate | `2e-5` |
| Batch size train/eval | `8 / 8` |
| Gradient accumulation | `2` |
| Số epoch tối đa | `8` |
| Seed | `42` |
| Thiết bị | CUDA nếu có, nếu không dùng CPU |

## Dự đoán intent

Model có sẵn được lưu tại `model/intent_classifier/best_model/`. Chạy:

```bash
python predict_intent.py
```

Script sẽ chạy một số câu mẫu trước, sau đó mở chế độ nhập tương tác:

```text
Khách hàng: shop ơi cafe robusta còn hàng không?
Intent: kiem_tra_ton_kho
Confidence: 0.9999
```

Nhập `exit` để thoát. Kết quả của hàm `predict_intent()` gồm:

- `intent`: intent có xác suất cao nhất.
- `confidence`: độ tin cậy sau temperature scaling.
- `accepted`: `true` khi confidence từ `0.35` trở lên.
- `top_3`: ba intent có xác suất cao nhất.
- `segmented`: câu sau khi được tách từ.

Khi `accepted` là `false`, nên chuyển câu hỏi sang fallback hoặc yêu cầu người dùng diễn đạt lại.

## Các intent hiện hỗ trợ

Project có 22 intent, được mô tả đầy đủ trong [`knowledge/intent_schema.json`](knowledge/intent_schema.json):

```text
chao_hoi, tam_biet, cam_on, tim_kiem_san_pham,
chi_tiet_san_pham, goi_y_san_pham, so_sanh_san_pham, hoi_gia,
tim_san_pham_theo_gia, kiem_tra_ton_kho, hoi_nguon_goc,
hoi_khoi_luong, hoi_thuong_hieu, hoi_don_vi, khuyen_mai,
hoi_phi_ship, thoi_gian_giao_hang, phuong_thuc_thanh_toan,
chinh_sach_doi_tra, tra_cuu_don_hang, huy_don_hang, khong_hieu
```

## Dữ liệu entity và alias

`knowledge/entity_dataset.jsonl` chứa ví dụ entity sản phẩm với các loại như `PRODUCT`. Những file knowledge hỗ trợ bước chuẩn hóa sau khi nhận diện intent:

- `product_aliases.json`: chuẩn hóa tên hoặc alias sản phẩm về SKU.
- `category_aliases.json`: chuẩn hóa alias danh mục.
- `entity_dataset.jsonl`: dữ liệu mẫu entity/slot, hiện có các nhóm sản phẩm như cà phê và trà.

Các entity dự kiến của pipeline nghiệp vụ gồm `PRODUCT`, `CATEGORY`, `MONEY`, `WEIGHT` và `VOLUME`. Hai script hiện tại tập trung vào intent classification; bước resolver, truy vấn database và sinh response cần được tích hợp ở tầng chatbot phía trên.

## Kết quả hiện tại

Kết quả được ghi trong `model/intent_classifier/metrics.json` trên bộ test 94 mẫu:

| Chỉ số | Giá trị |
| --- | ---: |
| Accuracy | 96.81% |
| Precision weighted | 98.01% |
| Recall weighted | 96.81% |
| F1 weighted | 96.99% |
| F1 macro | 96.96% |

Đây là kết quả trên dataset hiện tại, không đại diện đầy đủ cho dữ liệu hội thoại thực tế.

## Lưu ý phát triển

- Dataset hiện là bộ dữ liệu khởi đầu; nên bổ sung câu hỏi thực tế từ log chatbot.
- Cần tăng dữ liệu cho câu không dấu, viết tắt, lỗi chính tả và câu có nhiều điều kiện.
- Nên theo dõi các cặp intent thường bị nhầm trong `confusion_matrix.csv`.
- Ngưỡng confidence `0.35` là cấu hình hiện tại, nên được hiệu chỉnh thêm trên dữ liệu production.
- Không nên dùng trực tiếp intent prediction để thay thế entity extraction và kiểm tra nghiệp vụ.
