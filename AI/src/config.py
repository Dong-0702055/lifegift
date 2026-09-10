import torch
from pathlib import Path

MODEL_NAME = "vinai/phobert-base-v2"
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "phobert_dataset"
TRAIN_FILE = DATA_DIR / "train_intent.csv"
VAL_FILE = DATA_DIR / "validation_intent.csv"
TEST_FILE = DATA_DIR / "test_intent.csv"

OUTPUT_DIR = BASE_DIR / "model" / "intent_classifier"
BEST_MODEL_DIR = OUTPUT_DIR / "best_model"
CHART_DIR = OUTPUT_DIR / "charts"

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

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
USE_FP16 = torch.cuda.is_available()