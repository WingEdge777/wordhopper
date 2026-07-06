from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"

DIFFICULTY_WORD_FILES = {
    "chill": "words-easy.json",
    "easy": "words-easy.json",
    "medium": "words-medium.json",
    "hard": "words-hard.json",
}

DIFFICULTY_WORD_LENGTH = {
    "chill": (3, 5),
    "easy": (3, 5),
    "medium": (6, 8),
    "hard": (8, 32),
}


@lru_cache(maxsize=4)
def _load_word_set(word_file: str) -> frozenset[str]:
    path = DATA_DIR / word_file
    with path.open(encoding="utf-8") as handle:
        words = json.load(handle)
    return frozenset(str(word).lower() for word in words)


def get_word_set(difficulty: str) -> frozenset[str]:
    word_file = DIFFICULTY_WORD_FILES.get(difficulty)
    if word_file is None:
        return frozenset()
    return _load_word_set(word_file)


def is_valid_best_word(difficulty: str, word: str) -> bool:
    normalized = word.strip().lower()
    if not normalized:
        return True
    word_set = get_word_set(difficulty)
    if normalized not in word_set:
        return False
    min_len, max_len = DIFFICULTY_WORD_LENGTH[difficulty]
    length = len(normalized)
    return min_len <= length <= max_len
