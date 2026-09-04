import json
import random
import unicodedata
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support
from sklearn.preprocessing import LabelEncoder
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
    set_seed,
)
from underthesea import word_tokenize

# ============================================================
# CONFIG
# ============================================================
MODEL_NAME = "vinai/phobert-base-v2"
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "phobert_dataset"

TRAIN_FILE = DATA_DIR / "train_intent.csv"
VAL_FILE = DATA_DIR / "validation_intent.csv"
TEST_FILE = DATA_DIR / "test_intent.csv"

OUTPUT_DIR = BASE_DIR / "model" / "intent_classifier"
BEST_MODEL_DIR = OUTPUT_DIR / "best_model"

SEED = 42
MAX_LENGTH = 128
LEARNING_RATE = 2e-5
TRAIN_BATCH_SIZE = 8
EVAL_BATCH_SIZE = 8
GRADIENT_ACCUMULATION_STEPS = 2
NUM_EPOCHS = 8
WEIGHT_DECAY = 0.01
WARMUP_RATIO = 0.1
EARLY_STOPPING_PATIENCE = 2

# ============================================================
# REPRODUCIBILITY
# ============================================================
set_seed(SEED)
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

# ============================================================
# DEVICE
# ============================================================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
USE_FP16 = torch.cuda.is_available()


# ============================================================
# TEXT PREPROCESSING
# ============================================================
def preprocess_text(text):
    # Unicode normalize
    text = unicodedata.normalize("NFC", str(text))

    # Remove duplicate spaces
    text = " ".join(text.strip().split())

    if not text:
        return ""

    # Vietnamese word segmentation (e.g. "cà phê robusta" -> "cà_phê robusta")
    text = word_tokenize(text, format="text")
    return text


# ============================================================
# LOAD CSV
# ============================================================
def load_csv(file_path):
    if not file_path.exists():
        raise FileNotFoundError(
            f"\nKhông tìm thấy file:\n{file_path}\n\nHãy kiểm tra thư mục:\n{DATA_DIR}"
        )

    df = pd.read_csv(file_path, encoding="utf-8-sig")
    required_columns = {"text", "intent"}
    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(f"{file_path.name} thiếu cột: {missing}")

    df = df[["text", "intent"]].copy()
    df["text"] = df["text"].apply(preprocess_text)
    df["intent"] = df["intent"].astype(str).str.strip()

    # Remove empty rows & duplicate questions
    df = df[(df["text"] != "") & (df["intent"] != "")]
    df = df.drop_duplicates(subset=["text"])

    return df.reset_index(drop=True)


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 70)
    print("PHOBERT INTENT CLASSIFICATION")
    print("=" * 70)
    print(f"Model : {MODEL_NAME}")
    print(f"Device: {DEVICE}")

    if torch.cuda.is_available():
        print("GPU   :", torch.cuda.get_device_name(0))

    # --------------------------------------------------------
    # LOAD DATA
    # --------------------------------------------------------
    print("\n[1] Loading dataset...")
    train_df = load_csv(TRAIN_FILE)
    val_df = load_csv(VAL_FILE)
    test_df = load_csv(TEST_FILE)

    print(f"Train      : {len(train_df)}")
    print(f"Validation : {len(val_df)}")
    print(f"Test       : {len(test_df)}")

    # --------------------------------------------------------
    # DATA LEAKAGE CHECK
    # --------------------------------------------------------
    train_texts = set(train_df["text"])
    val_texts = set(val_df["text"])
    test_texts = set(test_df["text"])

    if train_texts & val_texts:
        raise ValueError("Data leakage: train <-> validation")
    if train_texts & test_texts:
        raise ValueError("Data leakage: train <-> test")
    if val_texts & test_texts:
        raise ValueError("Data leakage: validation <-> test")

    print("Data leakage: PASSED")

    # --------------------------------------------------------
    # LABEL ENCODER
    # --------------------------------------------------------
    print("\n[2] LabelEncoder...")
    label_encoder = LabelEncoder()
    label_encoder.fit(train_df["intent"])

    labels = list(label_encoder.classes_)
    num_labels = len(labels)

    train_intents = set(train_df["intent"])
    val_intents = set(val_df["intent"])
    test_intents = set(test_df["intent"])

    unknown_val = val_intents - train_intents
    unknown_test = test_intents - train_intents

    if unknown_val:
        raise ValueError(f"Validation chứa intent không có trong train: {unknown_val}")
    if unknown_test:
        raise ValueError(f"Test chứa intent không có trong train: {unknown_test}")

    train_df["label"] = label_encoder.transform(train_df["intent"])
    val_df["label"] = label_encoder.transform(val_df["intent"])
    test_df["label"] = label_encoder.transform(test_df["intent"])

    print(f"Number of intents: {num_labels}")
    print("\nIntent list:")
    for i, label in enumerate(labels):
        print(f"{i:02d} -> {label}")

    # --------------------------------------------------------
    # CREATE DATASET
    # --------------------------------------------------------
    print("\n[3] Creating datasets...")
    train_dataset = Dataset.from_pandas(train_df[["text", "label"]], preserve_index=False)
    val_dataset = Dataset.from_pandas(val_df[["text", "label"]], preserve_index=False)
    test_dataset = Dataset.from_pandas(test_df[["text", "label"]], preserve_index=False)

    # --------------------------------------------------------
    # TOKENIZER
    # --------------------------------------------------------
    print("\n[4] Loading PhoBERT tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=MAX_LENGTH)

    train_dataset = train_dataset.map(tokenize, batched=True)
    val_dataset = val_dataset.map(tokenize, batched=True)
    test_dataset = test_dataset.map(tokenize, batched=True)

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # --------------------------------------------------------
    # MODEL
    # --------------------------------------------------------
    print("\n[5] Loading PhoBERT...")
    label2id = {label: i for i, label in enumerate(labels)}
    id2label = {i: label for i, label in enumerate(labels)}

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=num_labels,
        label2id=label2id,
        id2label=id2label,
    )

    # --------------------------------------------------------
    # METRICS
    # --------------------------------------------------------
    def compute_metrics(eval_prediction):
        logits = eval_prediction.predictions
        labels_true = eval_prediction.label_ids

        if isinstance(logits, tuple):
            logits = logits[0]

        predictions = np.argmax(logits, axis=-1)
        accuracy = accuracy_score(labels_true, predictions)

        precision, recall, f1, _ = precision_recall_fscore_support(
            labels_true, predictions, average="weighted", zero_division=0
        )
        precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
            labels_true, predictions, average="macro", zero_division=0
        )

        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "precision_macro": precision_macro,
            "recall_macro": recall_macro,
            "f1_macro": f1_macro,
        }

    # --------------------------------------------------------
    # TRAINING ARGUMENTS
    # --------------------------------------------------------
    print("\n[6] Preparing Trainer...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "checkpoints"),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=LEARNING_RATE,
        per_device_train_batch_size=TRAIN_BATCH_SIZE,
        per_device_eval_batch_size=EVAL_BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        num_train_epochs=NUM_EPOCHS,
        weight_decay=WEIGHT_DECAY,
        warmup_steps=100,
        logging_strategy="steps",
        logging_steps=10,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        save_total_limit=2,
        fp16=USE_FP16,
        report_to="none",
        seed=SEED,
        dataloader_num_workers=0,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=EARLY_STOPPING_PATIENCE)],
    )

    # --------------------------------------------------------
    # TRAIN
    # --------------------------------------------------------
    print("\n[7] Fine-tuning...")
    print("-" * 70)
    trainer.train()
    print("-" * 70)

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------
    print("\nVALIDATION")
    validation_result = trainer.evaluate(val_dataset)
    print(f"Accuracy : {validation_result.get('eval_accuracy', 0):.4f}")
    print(f"Precision: {validation_result.get('eval_precision', 0):.4f}")
    print(f"Recall   : {validation_result.get('eval_recall', 0):.4f}")
    print(f"F1       : {validation_result.get('eval_f1', 0):.4f}")
    print(f"F1 Macro : {validation_result.get('eval_f1_macro', 0):.4f}")

    # --------------------------------------------------------
    # TEST
    # --------------------------------------------------------
    print("\n[8] Testing...")
    prediction = trainer.predict(test_dataset)
    logits = prediction.predictions

    if isinstance(logits, tuple):
        logits = logits[0]

    predictions = np.argmax(logits, axis=-1)
    true_labels = prediction.label_ids

    accuracy = accuracy_score(true_labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        true_labels, predictions, average="weighted", zero_division=0
    )
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        true_labels, predictions, average="macro", zero_division=0
    )

    print("\n" + "=" * 70)
    print("FINAL TEST RESULT")
    print("=" * 70)
    print(f"Accuracy          : {accuracy:.4f}")
    print(f"Precision weighted : {precision:.4f}")
    print(f"Recall weighted    : {recall:.4f}")
    print(f"F1 weighted        : {f1:.4f}")
    print(f"Precision macro    : {precision_macro:.4f}")
    print(f"Recall macro       : {recall_macro:.4f}")
    print(f"F1 macro           : {f1_macro:.4f}")

    # --------------------------------------------------------
    # CLASSIFICATION REPORT & CONFUSION MATRIX
    # --------------------------------------------------------
    report = classification_report(
        true_labels,
        predictions,
        labels=list(range(num_labels)),
        target_names=labels,
        digits=4,
        zero_division=0,
    )
    print("\nClassification report:")
    print(report)

    cm = confusion_matrix(true_labels, predictions, labels=list(range(num_labels)))
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)

    # --------------------------------------------------------
    # SAVE BEST MODEL & ARTIFACTS
    # --------------------------------------------------------
    print("\nSaving best model...")
    BEST_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(BEST_MODEL_DIR))
    tokenizer.save_pretrained(str(BEST_MODEL_DIR))

    with open(OUTPUT_DIR / "labels.json", "w", encoding="utf-8") as f:
        json.dump(labels, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_DIR / "label_map.json", "w", encoding="utf-8") as f:
        json.dump({"label2id": label2id, "id2label": id2label}, f, ensure_ascii=False, indent=2)

    metrics = {
        "model": MODEL_NAME,
        "train_samples": len(train_df),
        "validation_samples": len(val_df),
        "test_samples": len(test_df),
        "num_intents": num_labels,
        "test": {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "precision_macro": float(precision_macro),
            "recall_macro": float(recall_macro),
            "f1_macro": float(f1_macro),
        },
    }

    with open(OUTPUT_DIR / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_DIR / "classification_report.txt", "w", encoding="utf-8") as f:
        f.write(report)

    cm_df.to_csv(OUTPUT_DIR / "confusion_matrix.csv", encoding="utf-8-sig")

    with open(OUTPUT_DIR / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(trainer.state.log_history, f, ensure_ascii=False, indent=2)

    # --------------------------------------------------------
    # DONE
    # --------------------------------------------------------
    print("\n" + "=" * 70)
    print("TRAINING COMPLETED")
    print("=" * 70)
    print(f"\nBest model:\n{BEST_MODEL_DIR}")
    print("\nFiles created:")
    print(" - best_model/")
    print(" - labels.json")
    print(" - label_map.json")
    print(" - metrics.json")
    print(" - classification_report.txt")
    print(" - confusion_matrix.csv")
    print(" - training_history.json")


if __name__ == "__main__":
    main()