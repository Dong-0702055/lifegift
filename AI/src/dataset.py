import pandas as pd
from sklearn.preprocessing import LabelEncoder
from src.config import DATA_DIR
from src.preprocessing import preprocess_text

def load_csv(file_path):
    if not file_path.exists():
        raise FileNotFoundError(f"\nKhông tìm thấy file:\n{file_path}\n\nHãy kiểm tra thư mục:\n{DATA_DIR}")

    df = pd.read_csv(file_path, encoding="utf-8-sig")
    required_columns = {"text", "intent"}
    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(f"{file_path.name} thiếu cột: {missing}")

    df = df[["text", "intent"]].copy()
    df["text"] = df["text"].apply(preprocess_text)
    df["intent"] = df["intent"].astype(str).str.strip()

    df = df[(df["text"] != "") & (df["intent"] != "")]
    df = df.drop_duplicates(subset=["text"])

    return df.reset_index(drop=True)

def prepare_data(train_file, val_file, test_file):
    train_df = load_csv(train_file)
    val_df = load_csv(val_file)
    test_df = load_csv(test_file)

    # Check Data Leakage
    train_texts, val_texts, test_texts = set(train_df["text"]), set(val_df["text"]), set(test_df["text"])
    if train_texts & val_texts or train_texts & test_texts or val_texts & test_texts:
        raise ValueError("Phát hiện Data Leakage giữa các tập dữ liệu!")

    # Label Encoding
    label_encoder = LabelEncoder()
    train_df["label"] = label_encoder.fit_transform(train_df["intent"])
    val_df["label"] = label_encoder.transform(val_df["intent"])
    test_df["label"] = label_encoder.transform(test_df["intent"])

    return train_df, val_df, test_df, label_encoder