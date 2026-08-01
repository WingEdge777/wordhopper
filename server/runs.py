from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

RUN_TTL_MINUTES = 30


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def _utc_now_iso() -> str:
    return _utc_now().isoformat()


class RunStore:
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
                CREATE TABLE IF NOT EXISTS runs (
                    run_id TEXT PRIMARY KEY,
                    difficulty TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    finished_at TEXT,
                    client_ip TEXT NOT NULL DEFAULT '',
                    mode TEXT NOT NULL DEFAULT 'classic',
                    challenge_date TEXT NOT NULL DEFAULT ''
                )
                """
            )
            # Migrate older DBs that predate mode/challenge_date.
            cols = {
                row["name"]
                for row in conn.execute("PRAGMA table_info(runs)").fetchall()
            }
            if "mode" not in cols:
                conn.execute(
                    "ALTER TABLE runs ADD COLUMN mode TEXT NOT NULL DEFAULT 'classic'"
                )
            if "challenge_date" not in cols:
                conn.execute(
                    "ALTER TABLE runs ADD COLUMN challenge_date TEXT NOT NULL DEFAULT ''"
                )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_runs_expires
                ON runs (expires_at)
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS submit_rate (
                    key TEXT PRIMARY KEY,
                    last_submit_at TEXT NOT NULL
                )
                """
            )

    def create_run(
        self,
        difficulty: str,
        client_ip: str = "",
        mode: str = "classic",
        challenge_date: str = "",
    ) -> dict[str, str]:
        now = _utc_now()
        expires = now + timedelta(minutes=RUN_TTL_MINUTES)
        run_id = uuid.uuid4().hex
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO runs (
                    run_id, difficulty, created_at, expires_at,
                    client_ip, mode, challenge_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_id,
                    difficulty,
                    now.isoformat(),
                    expires.isoformat(),
                    client_ip,
                    mode,
                    challenge_date,
                ),
            )
        return {
            "run_id": run_id,
            "expires_at": expires.isoformat(),
            "mode": mode,
            "challenge_date": challenge_date,
        }

    def get_run(self, run_id: str) -> sqlite3.Row | None:
        with self._connect() as conn:
            return conn.execute(
                "SELECT * FROM runs WHERE run_id = ?",
                (run_id,),
            ).fetchone()

    def mark_finished(self, run_id: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "UPDATE runs SET finished_at = ? WHERE run_id = ?",
                (_utc_now_iso(), run_id),
            )

    def is_run_valid(
        self,
        run_id: str,
        difficulty: str,
        mode: str = "classic",
        challenge_date: str = "",
    ) -> tuple[bool, str]:
        row = self.get_run(run_id)
        if row is None:
            return False, "Unknown run"
        if row["difficulty"] != difficulty:
            return False, "Difficulty mismatch"
        row_mode = row["mode"] if "mode" in row.keys() else "classic"
        row_date = row["challenge_date"] if "challenge_date" in row.keys() else ""
        if row_mode != mode:
            return False, "Mode mismatch"
        if mode == "daily" and row_date != challenge_date:
            return False, "Challenge date mismatch"
        if row["finished_at"]:
            return False, "Run already finished"
        expires_at = datetime.fromisoformat(row["expires_at"])
        if _utc_now() > expires_at:
            return False, "Run expired"
        return True, ""

    def check_rate_limit(self, key: str, cooldown_sec: int) -> bool:
        now = _utc_now()
        with self._connect() as conn:
            row = conn.execute(
                "SELECT last_submit_at FROM submit_rate WHERE key = ?",
                (key,),
            ).fetchone()
            if row:
                last = datetime.fromisoformat(row["last_submit_at"])
                if (now - last).total_seconds() < cooldown_sec:
                    return False
            conn.execute(
                """
                INSERT INTO submit_rate (key, last_submit_at)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET last_submit_at = excluded.last_submit_at
                """,
                (key, now.isoformat()),
            )
        return True

    def count_recent_starts(
        self, client_ip: str, window_sec: int, max_count: int
    ) -> bool:
        if not client_ip:
            return True
        cutoff = (_utc_now() - timedelta(seconds=window_sec)).isoformat()
        with self._connect() as conn:
            count = conn.execute(
                """
                SELECT COUNT(*) AS total FROM runs
                WHERE client_ip = ? AND created_at >= ?
                """,
                (client_ip, cutoff),
            ).fetchone()["total"]
        return count < max_count

    def purge_expired(self) -> None:
        now = _utc_now_iso()
        with self._connect() as conn:
            conn.execute("DELETE FROM runs WHERE expires_at < ?", (now,))
