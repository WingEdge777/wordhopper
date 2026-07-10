from __future__ import annotations

import math

BASE_SCORE_PER_TICK = 1
TICK_INTERVAL_SEC = 0.1
WORD_SCORE_PER_CHAR = 5
COMBO_BONUS = 3
PERFECT_MULTIPLIER = 1.2

DIFFICULTY_SPEED_BASE = {
    "chill": 0.5,
    "easy": 1.0,
    "medium": 1.0,
    "hard": 1.0,
}

MAX_SPEED_MULTIPLIER = 2.5
MAX_RUN_DURATION_SEC = 3600
MIN_RUN_DURATION_SEC = 2
MAX_WORDS_TYPED = 5000
MAX_WORDS_PER_SEC = 2.5
BOOTSTRAP_MAX_SCORE = 500
WPM_TOLERANCE = 3


def _max_word_len(difficulty: str) -> int:
    limits = {
        "chill": 5,
        "easy": 5,
        "medium": 8,
        "hard": 20,
    }
    return limits.get(difficulty, 8)


def _max_speed_multiplier(difficulty: str) -> float:
    return DIFFICULTY_SPEED_BASE.get(difficulty, 1.0) * MAX_SPEED_MULTIPLIER


def _tick_score_upper_bound(duration_sec: float) -> int:
    return int(math.floor(duration_sec / TICK_INTERVAL_SEC)) * BASE_SCORE_PER_TICK


def _word_score_upper_bound(words_typed: int, difficulty: str) -> int:
    if words_typed <= 0:
        return 0
    max_len = _max_word_len(difficulty)
    speed_mult = _max_speed_multiplier(difficulty)
    per_word_base = WORD_SCORE_PER_CHAR * max_len * speed_mult * PERFECT_MULTIPLIER
    total = 0
    for combo in range(1, words_typed + 1):
        total += math.ceil(per_word_base + combo * COMBO_BONUS)
    return total


def max_plausible_score(duration_sec: float, words_typed: int, difficulty: str) -> int:
    tick_max = _tick_score_upper_bound(duration_sec)
    word_max = _word_score_upper_bound(words_typed, difficulty)
    return tick_max + word_max + 50


def compute_wpm(total_chars: int, duration_sec: float) -> int:
    if duration_sec <= 0 or total_chars <= 0:
        return 0
    return round((total_chars / 5) / (duration_sec / 60))


class ValidationError(Exception):
    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


def validate_run_finish(
    *,
    difficulty: str,
    score: int,
    wpm: int,
    words_typed: int,
    duration_sec: float,
    total_chars: int,
    max_combo: int,
    best_word: str,
    strict: bool = True,
) -> None:
    if duration_sec < MIN_RUN_DURATION_SEC:
        raise ValidationError("Run too short")
    if duration_sec > MAX_RUN_DURATION_SEC:
        raise ValidationError("Run too long")
    if words_typed < 0 or words_typed > MAX_WORDS_TYPED:
        raise ValidationError("Invalid words typed count")
    if max_combo < 0 or max_combo > max(words_typed, 1):
        raise ValidationError("Invalid combo count")
    if total_chars < 0:
        raise ValidationError("Invalid character count")
    if words_typed == 0 and total_chars > 0:
        raise ValidationError("Character count mismatch")
    if words_typed > 0 and total_chars < words_typed:
        raise ValidationError("Character count too low")

    if strict and words_typed > duration_sec * MAX_WORDS_PER_SEC:
        raise ValidationError("Words typed too fast")

    upper_bound = max_plausible_score(duration_sec, words_typed, difficulty)
    if score > upper_bound:
        raise ValidationError("Score exceeds plausible maximum")

    if wpm <= 0:
        raise ValidationError("Incomplete score: missing WPM")
    if total_chars <= 0:
        raise ValidationError("Incomplete score: missing character count")
    if words_typed <= 0:
        raise ValidationError("Incomplete score: missing words typed")

    expected_wpm = compute_wpm(total_chars, duration_sec)
    if abs(expected_wpm - wpm) > WPM_TOLERANCE:
        raise ValidationError("WPM mismatch")


def validate_bootstrap_record(
    *,
    difficulty: str,
    score: int,
    wpm: int,
    best_word: str,
) -> None:
    if score <= 0 or score > BOOTSTRAP_MAX_SCORE:
        raise ValidationError("Bootstrap score out of allowed range")
    if wpm <= 0 or wpm > 300:
        raise ValidationError("Incomplete bootstrap: missing or invalid WPM")
    if best_word and not _word_is_plausible(difficulty, best_word):
        raise ValidationError("Invalid bootstrap best word")


def _word_is_plausible(difficulty: str, word: str) -> bool:
    from word_lists import is_valid_best_word

    return is_valid_best_word(difficulty, word)
