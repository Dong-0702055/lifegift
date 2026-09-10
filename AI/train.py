import json
import random
import numpy as np
import pandas as pd
import torch
from datasets import Dataset
from sklearn.metrics import classification_report, confusion_matrix
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
    set_seed,
)

from src.config import *
from src.dataset import prepare_data
from src.metrics import compute_metrics
from src.visualization import create_training_charts

def main():
    # Reproducibility
    set_seed(SEED)
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    print("=" * 70)
    print(f"PHOBERT INTENT CLASSIFICATION | Device: {DEVICE}")
    print("=" * 70)

    # 1. Load Data
    train_df, val_df, test_df, label_encoder = prepare_data(TRAIN_FILE, VAL_FILE, TEST_FILE)
    labels = list(label_encoder.classes_)
    num_labels = len(labels)
    label2id = {label: i for i, label in enumerate(labels)}
    id2label = {i: label for i, label in enumerate(labels)}

    # 2. Tokenize & Create Dataset
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    
    def tokenize(batch):
        return tokenizer(batch["text"], truncation=True, max_length=MAX_LENGTH)

    train_ds = Dataset.from_pandas(train_df[["text", "label"]], preserve_index=False).map(tokenize, batched=True)
    val_ds = Dataset.from_pandas(val_df[["text", "label"]], preserve_index=False).map(tokenize, batched=True)
    test_ds = Dataset.from_pandas(test_df[["text", "label"]], preserve_index=False).map(tokenize, batched=True)

    # 3. Model
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=num_labels, label2id=label2id, id2label=id2label
    )

    # 4. Training Arguments & Trainer
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    args = TrainingArguments(
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
        logging_steps=10,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,
        save_total_limit=2,
        fp16=USE_FP16,
        report_to="none",
        seed=SEED,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        processing_class=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=EARLY_STOPPING_PATIENCE)],
    )

    # 5. Train & Test
    print("\n[Start Fine-tuning...]")
    trainer.train()

    print("\n[Evaluating on Test Set...]")
    prediction = trainer.predict(test_ds)
    preds = np.argmax(prediction.predictions[0] if isinstance(prediction.predictions, tuple) else prediction.predictions, axis=-1)
    
    report = classification_report(prediction.label_ids, preds, target_names=labels, digits=4, zero_division=0)
    print("\nClassification Report:\n", report)

    # 6. Save Artifacts & Charts
    BEST_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    trainer.save_model(str(BEST_MODEL_DIR))
    tokenizer.save_pretrained(str(BEST_MODEL_DIR))

    cm = confusion_matrix(prediction.label_ids, preds, labels=list(range(num_labels)))
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)
    cm_df.to_csv(OUTPUT_DIR / "confusion_matrix.csv", encoding="utf-8-sig")

    with open(OUTPUT_DIR / "labels.json", "w", encoding="utf-8") as f:
        json.dump(labels, f, ensure_ascii=False, indent=2)

    create_training_charts(
        history=trainer.state.log_history,
        output_dir=CHART_DIR,
        labels=labels,
        cm_df=cm_df
    )

    print(f"\nTraining completed! Model saved at: {BEST_MODEL_DIR}")

if __name__ == "__main__":
    main()