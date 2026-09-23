"""Optional PhoBERT NER inference used by the AI HTTP service."""

import json
import unicodedata
from pathlib import Path

import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer
from underthesea import word_tokenize

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model" / "ner_model" / "best_model"
LOCATION_FILE = BASE_DIR / "knowledge" / "vietnam_locations.json"
MAX_LENGTH = 128
MIN_ENTITY_CONFIDENCE = 0.5


class EntityRecognizer:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.available = model_dir.exists() and (model_dir / "config.json").exists()
        self.model = None
        self.tokenizer = None
        self.id2label = {}
        self.locations = []
        if LOCATION_FILE.exists():
            with LOCATION_FILE.open("r", encoding="utf-8") as file:
                self.locations = sorted(json.load(file), key=len, reverse=True)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if not self.available:
            return
        self.tokenizer = AutoTokenizer.from_pretrained(str(model_dir), use_fast=True)
        self.model = AutoModelForTokenClassification.from_pretrained(str(model_dir))
        self.model.to(self.device)
        self.model.eval()
        label_map_path = model_dir.parent / "label_map.json"
        if label_map_path.exists():
            with label_map_path.open("r", encoding="utf-8") as file:
                self.id2label = {int(key): value for key, value in json.load(file).items()}
        else:
            self.id2label = {int(key): value for key, value in self.model.config.id2label.items()}

    @staticmethod
    def _normalize(text: str) -> str:
        text = unicodedata.normalize("NFC", text)
        return " ".join(text.strip().split())

    def _find_known_locations(self, text: str) -> list[dict]:
        lowered_text = text.casefold()
        found = []
        occupied_ranges = []
        for location in self.locations:
            start = lowered_text.find(location.casefold())
            if start < 0:
                continue
            end = start + len(location)
            if any(start < occupied_end and end > occupied_start for occupied_start, occupied_end in occupied_ranges):
                continue
            occupied_ranges.append((start, end))
            found.append({"text": text[start:end], "type": "LOCATION", "confidence": 1.0})
        return found

    def predict(self, text: str) -> list[dict]:
        if not text.strip():
            return []
        normalized_text = self._normalize(text)
        known_locations = self._find_known_locations(normalized_text)
        if not self.available:
            return known_locations
        segmented = word_tokenize(normalized_text, format="text")
        words = segmented.split()
        input_ids = [self.tokenizer.cls_token_id]
        token_word_ids = [None]
        for word_index, word in enumerate(words):
            word_ids = self.tokenizer(word, add_special_tokens=False)["input_ids"]
            input_ids.extend(word_ids)
            token_word_ids.extend([word_index] * len(word_ids))
        input_ids.append(self.tokenizer.sep_token_id)
        token_word_ids.append(None)
        input_ids = input_ids[:MAX_LENGTH]
        token_word_ids = token_word_ids[:MAX_LENGTH]
        encoded = {
            "input_ids": torch.tensor([input_ids], dtype=torch.long),
            "attention_mask": torch.ones((1, len(input_ids)), dtype=torch.long),
        }
        model_inputs = {key: value.to(self.device) for key, value in encoded.items()}
        with torch.no_grad():
            logits = self.model(**model_inputs).logits
        probabilities = torch.softmax(logits, dim=-1)[0]
        predictions = torch.argmax(probabilities, dim=-1).cpu().tolist()
        entities = []
        current = None
        for token_index, word_id in enumerate(token_word_ids):
            if word_id is None or word_id >= len(words):
                continue
            label = self.id2label.get(predictions[token_index], "O")
            if label == "O":
                if current:
                    entities.append(current)
                    current = None
                continue
            prefix, entity_type = label.split("-", 1)
            value = words[word_id].replace("_", " ")
            confidence = float(probabilities[token_index, predictions[token_index]].item())
            if prefix == "B" or current is None or current["type"] != entity_type:
                if current:
                    entities.append(current)
                current = {"text": value, "type": entity_type, "confidence": confidence}
            else:
                current["text"] += f" {value}"
                current["confidence"] = min(current["confidence"], confidence)
        if current:
            entities.append(current)

        # Gazetteer wins for locations because it is more reliable than a tiny NER dataset.
        non_location_entities = [
            entity for entity in entities
            if entity["type"] != "LOCATION" and entity["confidence"] >= MIN_ENTITY_CONFIDENCE
        ]
        return non_location_entities + known_locations
