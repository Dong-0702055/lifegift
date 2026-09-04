import json
import unicodedata
from pathlib import Path
import uvicorn

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from underthesea import word_tokenize

# --- CẤU HÌNH ---
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model" / "intent_classifier" / "best_model"
MAX_LENGTH = 128
TEMPERATURE = 0.3

app = FastAPI(title="LifeGift AI Intent Service", version="1.0")

# --- LOAD MODEL & LABEL MAP ---
print("Loading model and tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))
model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))

label_map_path = MODEL_DIR / "label_map.json"
if label_map_path.exists():
    with open(label_map_path, "r", encoding="utf-8") as f:
        id2label = {int(k): v for k, v in json.load(f).items()}
else:
    id2label = model.config.id2label

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()


def preprocess(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = " ".join(text.strip().split())
    return word_tokenize(text, format="text")


class PredictRequest(BaseModel):
    text: str


@app.post("/predict-intent")
def predict_intent(req: PredictRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    segmented = preprocess(req.text)
    inputs = tokenizer(
        segmented,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits / TEMPERATURE
    probabilities = torch.softmax(logits, dim=-1)[0]
    values, indices = torch.topk(probabilities, k=min(3, len(probabilities)))

    results = []
    for val, idx in zip(values, indices):
        results.append(
            {
                "intent": id2label.get(int(idx.item()), "UNKNOWN"),
                "confidence": float(val.item()),
            }
        )

    best = results[0]
    return {
        "text": req.text,
        "segmented": segmented,
        "intent": best["intent"],
        "confidence": round(best["confidence"], 4),
        "top_3": results,
    }
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)