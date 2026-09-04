import json
import unicodedata
from pathlib import Path

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from underthesea import word_tokenize

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model" / "intent_classifier" / "best_model"

MAX_LENGTH = 128
CONFIDENCE_THRESHOLD = 0.35
TEMPERATURE = 0.3  # Giúp phân bố Softmax sắc nét hơn, phản ánh đúng độ tự tin

# ============================================================
# LOAD
# ============================================================
print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))
model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))

# Load label map chuẩn từ file JSON đã train
label_map_path = MODEL_DIR / "label_map.json"
if label_map_path.exists():
    with open(label_map_path, "r", encoding="utf-8") as f:
        id2label = {int(k): v for k, v in json.load(f).items()}
else:
    id2label = model.config.id2label

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

print(f"Device: {device}")
print("Model loaded successfully.")


# ============================================================
# PREPROCESS
# ============================================================
def preprocess(text):
    text = unicodedata.normalize("NFC", text)
    text = " ".join(text.strip().split())
    return word_tokenize(text, format="text")


# ============================================================
# PREDICT
# ============================================================
def predict_intent(text):
    segmented = preprocess(text)

    inputs = tokenizer(segmented, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    # Áp dụng Temperature Scaling để tính Softmax chuẩn hơn cho bài toán multi-class
    logits = outputs.logits / TEMPERATURE
    probabilities = torch.softmax(logits, dim=-1)[0]
    values, indices = torch.topk(probabilities, k=min(3, len(probabilities)))

    results = []
    for value, index in zip(values, indices):
        idx = int(index.item())
        intent = id2label.get(idx, f"UNKNOWN_{idx}")
        confidence = float(value.item())
        results.append({"intent": intent, "confidence": confidence})

    best = results[0]
    return {
        "text": text,
        "segmented": segmented,
        "intent": best["intent"],
        "confidence": best["confidence"],
        "accepted": best["confidence"] >= CONFIDENCE_THRESHOLD,
        "top_3": results,
    }


# ============================================================
# TEST
# ============================================================
test_cases = [
    "shop ơi cafe robusta còn hàng không?",
    "có loại trà nào khoảng 300 nghìn không?",
    "mình muốn mua quà cho bố mẹ",
    "arabica và robusta loại nào ngon hơn?",
    "cho mình xem các loại hạt",
]

for text in test_cases:
    result = predict_intent(text)
    print("\n" + "-" * 60)
    print("Câu hỏi:", result["text"])
    print("Segmented:", result["segmented"])
    print("Intent:", result["intent"])
    print("Confidence:", f"{result['confidence']:.4f}")
    print("Accepted:", result["accepted"])
    print("Top 3:")
    for item in result["top_3"]:
        print(f"  {item['intent']:<30}{item['confidence']:.4f}")


# ============================================================
# INTERACTIVE
# ============================================================
print("\n")
print("=" * 60)
print("CHATBOT INTENT TEST")
print("Nhập exit để thoát")
print("=" * 60)

while True:
    text = input("\nKhách hàng: ").strip()

    if text.lower() == "exit":
        break

    if not text:
        continue

    result = predict_intent(text)
    print("Intent:", result["intent"])
    print("Confidence:", f"{result['confidence']:.4f}")

    if not result["accepted"]:
        print("⚠ Confidence thấp.")
        print("Nên chuyển sang fallback.")