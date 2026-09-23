"""Train a PhoBERT BIO token-classification model for LifeGift entities."""

import json
from pathlib import Path

import numpy as np
from datasets import Dataset
from sklearn.metrics import classification_report
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
    set_seed,
)

from src.model_training_config import MODEL_NAME, MAX_LENGTH, SEED, DEVICE, USE_FP16

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "phobert_dataset" / "ner"
OUTPUT_DIR = BASE_DIR / "model" / "ner_model"
MODEL_DIR = OUTPUT_DIR / "best_model"

LABELS = ["O", "B-PRODUCT", "I-PRODUCT", "B-CATEGORY", "I-CATEGORY", "B-BRAND", "I-BRAND",
          "B-LOCATION", "I-LOCATION", "B-MONEY", "I-MONEY", "B-QUANTITY", "I-QUANTITY",
          "B-UNIT", "I-UNIT", "B-ORDER_ID", "I-ORDER_ID", "B-PAYMENT_METHOD", "I-PAYMENT_METHOD",
          "B-PERSON_NAME", "I-PERSON_NAME", "B-PHONE", "I-PHONE", "B-ADDRESS", "I-ADDRESS"]
LABEL2ID = {label: index for index, label in enumerate(LABELS)}
ID2LABEL = {index: label for index, label in enumerate(LABELS)}


def load_jsonl(path: Path) -> Dataset:
    records = []
    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue
            record = json.loads(line)
            if len(record["tokens"]) != len(record["tags"]):
                raise ValueError(f"{path.name}:{line_number} tokens/tags length mismatch")
            records.append(record)
    return Dataset.from_list(records)


def tokenize_and_align_labels(batch, tokenizer):
    output = {"input_ids": [], "attention_mask": [], "labels": []}
    for words, tags in zip(batch["tokens"], batch["tags"]):
        input_ids = [tokenizer.cls_token_id]
        labels = [-100]
        for word, tag in zip(words, tags):
            word_ids = tokenizer(word, add_special_tokens=False)["input_ids"]
            input_ids.extend(word_ids)
            labels.append(LABEL2ID[tag])
            labels.extend([
                LABEL2ID[f"I-{tag[2:]}" if tag.startswith("B-") else tag]
                for _ in word_ids[1:]
            ])
        input_ids.append(tokenizer.sep_token_id)
        labels.append(-100)
        input_ids = input_ids[:MAX_LENGTH]
        labels = labels[:MAX_LENGTH]
        output["input_ids"].append(input_ids)
        output["attention_mask"].append([1] * len(input_ids))
        output["labels"].append(labels)
    return output


def compute_metrics(eval_prediction):
    predictions, labels = eval_prediction
    predictions = np.argmax(predictions, axis=-1)
    true_labels = []
    true_predictions = []
    for prediction_row, label_row in zip(predictions, labels):
        for prediction, label in zip(prediction_row, label_row):
            if label != -100:
                true_predictions.append(ID2LABEL[int(prediction)])
                true_labels.append(ID2LABEL[int(label)])
    report = classification_report(true_labels, true_predictions, labels=LABELS, output_dict=True, zero_division=0)
    return {
        "token_f1_macro": report["macro avg"]["f1-score"],
        "token_precision_macro": report["macro avg"]["precision"],
        "token_recall_macro": report["macro avg"]["recall"],
    }


def main():
    set_seed(SEED)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
    datasets = {
        split: load_jsonl(DATA_DIR / f"{split}.jsonl")
        for split in ("train", "validation", "test")
    }
    tokenized = {
        split: dataset.map(
            lambda batch: tokenize_and_align_labels(batch, tokenizer),
            batched=True,
            remove_columns=dataset.column_names,
        )
        for split, dataset in datasets.items()
    }

    model = AutoModelForTokenClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(LABELS),
        label2id=LABEL2ID,
        id2label=ID2LABEL,
    )
    args = TrainingArguments(
        output_dir=str(OUTPUT_DIR / "checkpoints"),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=10,
        weight_decay=0.01,
        load_best_model_at_end=True,
        metric_for_best_model="token_f1_macro",
        greater_is_better=True,
        save_total_limit=2,
        fp16=USE_FP16,
        report_to="none",
        seed=SEED,
    )
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized["train"],
        eval_dataset=tokenized["validation"],
        processing_class=tokenizer,
        data_collator=DataCollatorForTokenClassification(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )
    trainer.train()
    test_result = trainer.predict(tokenized["test"])
    print(test_result.metrics)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(MODEL_DIR))
    tokenizer.save_pretrained(str(MODEL_DIR))
    with (OUTPUT_DIR / "label_map.json").open("w", encoding="utf-8") as file:
        json.dump({str(key): value for key, value in ID2LABEL.items()}, file, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
