import matplotlib.pyplot as plt
import numpy as np

def create_training_charts(history, output_dir, labels, cm_df):
    output_dir.mkdir(parents=True, exist_ok=True)

    train_steps, train_losses = [], []
    eval_epochs, eval_losses, eval_accuracy, eval_f1, eval_f1_macro = [], [], [], [], []

    for item in history:
        if "loss" in item and "step" in item:
            train_steps.append(item["step"])
            train_losses.append(item["loss"])
        if "eval_loss" in item:
            eval_epochs.append(item.get("epoch", len(eval_epochs) + 1))
            eval_losses.append(item["eval_loss"])
            eval_accuracy.append(item.get("eval_accuracy"))
            eval_f1.append(item.get("eval_f1"))
            eval_f1_macro.append(item.get("eval_f1_macro"))

    # 1. Training Loss
    if train_losses:
        plt.figure(figsize=(10, 6))
        plt.plot(train_steps, train_losses, marker="o")
        plt.xlabel("Training Step")
        plt.ylabel("Loss")
        plt.title("Training Loss")
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(output_dir / "training_loss.png", dpi=300)
        plt.close()

    # 2. Validation Loss
    if eval_losses:
        plt.figure(figsize=(10, 6))
        plt.plot(eval_epochs, eval_losses, marker="o")
        plt.xlabel("Epoch")
        plt.ylabel("Validation Loss")
        plt.title("Validation Loss")
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(output_dir / "validation_loss.png", dpi=300)
        plt.close()

    # 3. Validation Metrics
    if any(eval_accuracy):
        plt.figure(figsize=(10, 6))
        if any(eval_accuracy): plt.plot(eval_epochs, eval_accuracy, marker="o", label="Accuracy")
        if any(eval_f1): plt.plot(eval_epochs, eval_f1, marker="o", label="F1 Weighted")
        if any(eval_f1_macro): plt.plot(eval_epochs, eval_f1_macro, marker="o", label="F1 Macro")
        plt.xlabel("Epoch")
        plt.ylabel("Score")
        plt.title("Validation Metrics")
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(output_dir / "validation_metrics.png", dpi=300)
        plt.close()

    # 4. Confusion Matrix
    plt.figure(figsize=(12, 10))
    plt.imshow(cm_df.values, cmap="Blues")
    plt.title("Confusion Matrix")
    plt.colorbar()
    ticks = np.arange(len(labels))
    plt.xticks(ticks, labels, rotation=90, fontsize=8)
    plt.yticks(ticks, labels, fontsize=8)
    plt.xlabel("Predicted Intent")
    plt.ylabel("Actual Intent")
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png", dpi=300)
    plt.close()