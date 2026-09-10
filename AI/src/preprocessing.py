import unicodedata
from underthesea import word_tokenize

def preprocess_text(text: str) -> str:
    text = unicodedata.normalize("NFC", str(text))
    text = " ".join(text.strip().split())
    if not text:
        return ""
    return word_tokenize(text, format="text")