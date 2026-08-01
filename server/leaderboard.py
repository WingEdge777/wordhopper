from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

VALID_DIFFICULTIES = frozenset({"chill", "easy", "medium", "hard"})
VALID_MODES = frozenset({"classic", "daily"})
MAX_SCORE = 999_999_999
MAX_WPM = 300
MAX_NICKNAME_LEN = 16
MAX_BEST_WORD_LEN = 32
DEFAULT_LIMIT = 50
MAX_LIMIT = 100
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

_NICKNAME_RE = re.compile(r"^[\w \-.]+$", re.UNICODE)


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_nickname(raw: str) -> str | None:
    nickname = raw.strip()[:MAX_NICKNAME_LEN]
    if not nickname or not _NICKNAME_RE.match(nickname):
        return None
    return nickname


def normalize_difficulty(raw: str) -> str | None:
    difficulty = raw.strip().lower()
    if difficulty not in VALID_DIFFICULTIES:
        return None
    return difficulty


def normalize_mode(raw: str) -> str | None:
    mode = raw.strip().lower()
    if mode not in VALID_MODES:
        return None
    return mode


def normalize_challenge_date(raw: str) -> str | None:
    date = raw.strip()
    if not _DATE_RE.match(date):
        return None
    return date


def normalize_score(score: int) -> int | None:
    if score < 0 or score > MAX_SCORE:
        return None
    return score


def normalize_wpm(wpm: int) -> int | None:
    if wpm < 0 or wpm > MAX_WPM:
        return None
    return wpm


def normalize_best_word(raw: str) -> str:
    word = raw.strip()[:MAX_BEST_WORD_LEN]
    if word and not re.match(r"^[\w'-]+$", word):
        return ""
    return word


class LeaderboardStore:
    def __init__(self, db_path: str | Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS leaderboard (
                    nickname TEXT NOT NULL,
                    difficulty TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    wpm INTEGER NOT NULL DEFAULT 0,
                    best_word TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (nickname, difficulty)
                )
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_leaderboard_board
                ON leaderboard (difficulty, score DESC, updated_at ASC)
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS daily_leaderboard (
                    challenge_date TEXT NOT NULL,
                    nickname TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    wpm INTEGER NOT NULL DEFAULT 0,
                    best_word TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (challenge_date, nickname)
                )
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_daily_leaderboard_board
                ON daily_leaderboard (challenge_date, score DESC, updated_at ASC)
                """
            )

    def upsert_score(
        self,
        nickname: str,
        difficulty: str,
        score: int,
        wpm: int,
        best_word: str = "",
    ) -> bool:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT score, wpm, best_word FROM leaderboard
                WHERE nickname = ? AND difficulty = ?
                """,
                (nickname, difficulty),
            ).fetchone()
            if row:
                if row["score"] > score:
                    return False
                if row["score"] == score:
                    improved_wpm = wpm > row["wpm"] or (row["wpm"] == 0 and wpm > 0)
                    improved_word = len(best_word) > len(row["best_word"] or "")
                    if not improved_wpm and not improved_word:
                        return False
                    conn.execute(
                        """
                        UPDATE leaderboard
                        SET wpm = ?, best_word = ?, updated_at = ?
                        WHERE nickname = ? AND difficulty = ?
                        """,
                        (
                            max(wpm, row["wpm"]),
                            best_word or row["best_word"],
                            _utc_now(),
                            nickname,
                            difficulty,
                        ),
                    )
                    return True

            conn.execute(
                """
                INSERT INTO leaderboard (nickname, difficulty, score, wpm, best_word, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(nickname, difficulty) DO UPDATE SET
                    score = excluded.score,
                    wpm = excluded.wpm,
                    best_word = excluded.best_word,
                    updated_at = excluded.updated_at
                WHERE excluded.score > leaderboard.score
                """,
                (nickname, difficulty, score, wpm, best_word, _utc_now()),
            )
            return True

    def bootstrap_records(
        self,
        nickname: str,
        records: list[dict[str, object]],
    ) -> tuple[int, list[str]]:
        from score_validation import ValidationError, validate_bootstrap_record

        accepted = 0
        accepted_difficulties: list[str] = []
        for record in records:
            difficulty = normalize_difficulty(str(record.get("difficulty", "")))
            score = record.get("score")
            if difficulty is None or not isinstance(score, int):
                continue
            normalized_score = normalize_score(score)
            if normalized_score is None or normalized_score <= 0:
                continue

            wpm_raw = record.get("wpm", 0)
            wpm = wpm_raw if isinstance(wpm_raw, int) else 0
            normalized_wpm = normalize_wpm(wpm)
            if normalized_wpm is None:
                continue

            best_word = normalize_best_word(str(record.get("best_word", "")))
            try:
                validate_bootstrap_record(
                    difficulty=difficulty,
                    score=normalized_score,
                    wpm=normalized_wpm,
                    best_word=best_word,
                )
            except ValidationError:
                continue

            if self.upsert_score(
                nickname, difficulty, normalized_score, normalized_wpm, best_word
            ):
                accepted += 1
                accepted_difficulties.append(difficulty)
        return accepted, accepted_difficulties

    def get_leaderboard(
        self, difficulty: str, limit: int = DEFAULT_LIMIT
    ) -> list[dict[str, object]]:
        safe_limit = max(1, min(limit, MAX_LIMIT))
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT nickname, score, wpm, best_word, updated_at
                FROM leaderboard
                WHERE difficulty = ?
                ORDER BY score DESC, updated_at ASC
                LIMIT ?
                """,
                (difficulty, safe_limit),
            ).fetchall()

        return [
            {
                "rank": index,
                "nickname": row["nickname"],
                "score": row["score"],
                "wpm": row["wpm"],
                "best_word": row["best_word"],
                "updated_at": row["updated_at"],
            }
            for index, row in enumerate(rows, start=1)
        ]

    def upsert_daily_score(
        self,
        challenge_date: str,
        nickname: str,
        score: int,
        wpm: int,
        best_word: str = "",
    ) -> bool:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT score, wpm, best_word FROM daily_leaderboard
                WHERE challenge_date = ? AND nickname = ?
                """,
                (challenge_date, nickname),
            ).fetchone()
            if row:
                if row["score"] > score:
                    return False
                if row["score"] == score:
                    improved_wpm = wpm > row["wpm"] or (row["wpm"] == 0 and wpm > 0)
                    improved_word = len(best_word) > len(row["best_word"] or "")
                    if not improved_wpm and not improved_word:
                        return False
                    conn.execute(
                        """
                        UPDATE daily_leaderboard
                        SET wpm = ?, best_word = ?, updated_at = ?
                        WHERE challenge_date = ? AND nickname = ?
                        """,
                        (
                            max(wpm, row["wpm"]),
                            best_word or row["best_word"],
                            _utc_now(),
                            challenge_date,
                            nickname,
                        ),
                    )
                    return True

            conn.execute(
                """
                INSERT INTO daily_leaderboard
                    (challenge_date, nickname, score, wpm, best_word, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(challenge_date, nickname) DO UPDATE SET
                    score = excluded.score,
                    wpm = excluded.wpm,
                    best_word = excluded.best_word,
                    updated_at = excluded.updated_at
                WHERE excluded.score > daily_leaderboard.score
                """,
                (challenge_date, nickname, score, wpm, best_word, _utc_now()),
            )
            return True

    def get_daily_leaderboard(
        self, challenge_date: str, limit: int = DEFAULT_LIMIT
    ) -> list[dict[str, object]]:
        safe_limit = max(1, min(limit, MAX_LIMIT))
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT nickname, score, wpm, best_word, updated_at
                FROM daily_leaderboard
                WHERE challenge_date = ?
                ORDER BY score DESC, updated_at ASC
                LIMIT ?
                """,
                (challenge_date, safe_limit),
            ).fetchall()

        return [
            {
                "rank": index,
                "nickname": row["nickname"],
                "score": row["score"],
                "wpm": row["wpm"],
                "best_word": row["best_word"],
                "updated_at": row["updated_at"],
            }
            for index, row in enumerate(rows, start=1)
        ]
