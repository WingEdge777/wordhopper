import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from dictionary import DEFAULT_DICT_PATH, load, lookup
from leaderboard import (
    DEFAULT_LIMIT,
    LeaderboardStore,
    normalize_best_word,
    normalize_challenge_date,
    normalize_difficulty,
    normalize_mode,
    normalize_nickname,
    normalize_score,
    normalize_wpm,
)
from runs import RunStore
from score_validation import ValidationError, validate_run_finish
from word_lists import is_valid_best_word

DEFAULT_DB_PATH = Path(__file__).parent / "wordhopper.db"
store: LeaderboardStore | None = None
run_store: RunStore | None = None

FINISH_COOLDOWN_SEC = 30
START_WINDOW_SEC = 60
MAX_STARTS_PER_IP = 20


@asynccontextmanager
async def lifespan(app: FastAPI):
    global store, run_store
    load(os.environ.get("DICT_PATH", DEFAULT_DICT_PATH))
    db_path = os.environ.get("DB_PATH", str(DEFAULT_DB_PATH))
    store = LeaderboardStore(db_path)
    run_store = RunStore(db_path)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranslateRequest(BaseModel):
    words: list[str]


class ScoreRecord(BaseModel):
    difficulty: str
    score: int
    wpm: int = 0
    best_word: str = ""


class SubmitScoreRequest(BaseModel):
    nickname: str
    difficulty: str
    score: int
    wpm: int = 0
    best_word: str = ""


class BootstrapScoresRequest(BaseModel):
    nickname: str
    records: list[ScoreRecord] = Field(default_factory=list)


class StartRunRequest(BaseModel):
    difficulty: str
    mode: str = "classic"
    challenge_date: str = ""


class FinishRunRequest(BaseModel):
    run_id: str
    nickname: str
    difficulty: str
    score: int
    wpm: int = 0
    words_typed: int = 0
    total_chars: int = 0
    max_combo: int = 0
    duration_sec: float = Field(gt=0)
    best_word: str = ""
    mode: str = "classic"
    challenge_date: str = ""


def _require_store() -> LeaderboardStore:
    if store is None:
        raise HTTPException(status_code=503, detail="Leaderboard store unavailable")
    return store


def _require_run_store() -> RunStore:
    if run_store is None:
        raise HTTPException(status_code=503, detail="Run store unavailable")
    return run_store


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return ""


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    return lookup(req.words)


@app.post("/api/runs/start")
async def start_run(req: StartRunRequest, request: Request):
    difficulty = normalize_difficulty(req.difficulty)
    mode = normalize_mode(req.mode)
    if difficulty is None or mode is None:
        raise HTTPException(status_code=400, detail="Invalid difficulty or mode")

    challenge_date = ""
    if mode == "daily":
        challenge_date = normalize_challenge_date(req.challenge_date) or ""
        if not challenge_date:
            raise HTTPException(status_code=400, detail="Invalid challenge date")
        # Daily Challenge is fixed to easy.
        if difficulty != "easy":
            raise HTTPException(status_code=400, detail="Daily mode requires easy")

    runs = _require_run_store()
    client_ip = _client_ip(request)
    if not runs.count_recent_starts(client_ip, START_WINDOW_SEC, MAX_STARTS_PER_IP):
        raise HTTPException(status_code=429, detail="Too many runs started")

    runs.purge_expired()
    return runs.create_run(
        difficulty, client_ip, mode=mode, challenge_date=challenge_date
    )


@app.post("/api/runs/finish")
async def finish_run(req: FinishRunRequest, request: Request):
    nickname = normalize_nickname(req.nickname)
    difficulty = normalize_difficulty(req.difficulty)
    mode = normalize_mode(req.mode) or "classic"
    score = normalize_score(req.score)
    wpm = normalize_wpm(req.wpm)
    if nickname is None or difficulty is None or score is None or wpm is None:
        raise HTTPException(status_code=400, detail="Invalid finish payload")
    if score <= 0:
        raise HTTPException(status_code=400, detail="Score must be positive")

    challenge_date = ""
    if mode == "daily":
        challenge_date = normalize_challenge_date(req.challenge_date) or ""
        if not challenge_date:
            raise HTTPException(status_code=400, detail="Invalid challenge date")
        if difficulty != "easy":
            raise HTTPException(status_code=400, detail="Daily mode requires easy")

    best_word = normalize_best_word(req.best_word)
    if best_word and not is_valid_best_word(difficulty, best_word):
        raise HTTPException(status_code=400, detail="Invalid best word")

    runs = _require_run_store()
    valid, reason = runs.is_run_valid(
        req.run_id, difficulty, mode=mode, challenge_date=challenge_date
    )
    if not valid:
        raise HTTPException(status_code=400, detail=reason)

    rate_key = (
        f"finish:{mode}:{challenge_date}:{nickname}"
        if mode == "daily"
        else f"finish:{nickname}:{difficulty}"
    )
    if not runs.check_rate_limit(rate_key, FINISH_COOLDOWN_SEC):
        raise HTTPException(status_code=429, detail="Submit too soon")

    try:
        validate_run_finish(
            difficulty=difficulty,
            score=score,
            wpm=wpm,
            words_typed=req.words_typed,
            duration_sec=req.duration_sec,
            total_chars=req.total_chars,
            max_combo=req.max_combo,
            best_word=best_word,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.detail) from exc

    board = _require_store()
    if mode == "daily":
        accepted = board.upsert_daily_score(
            challenge_date, nickname, score, wpm, best_word
        )
    else:
        accepted = board.upsert_score(nickname, difficulty, score, wpm, best_word)
    runs.mark_finished(req.run_id)
    return {"accepted": accepted}


@app.post("/api/scores")
async def submit_score(_req: SubmitScoreRequest):
    raise HTTPException(
        status_code=403,
        detail="Direct score submit disabled; start a run and use /api/runs/finish",
    )


@app.post("/api/scores/bootstrap")
async def bootstrap_scores(req: BootstrapScoresRequest):
    nickname = normalize_nickname(req.nickname)
    if nickname is None:
        raise HTTPException(status_code=400, detail="Invalid nickname")

    rate_key = f"bootstrap:{nickname}"
    runs = _require_run_store()
    if not runs.check_rate_limit(rate_key, 3600):
        raise HTTPException(status_code=429, detail="Bootstrap already used recently")

    records = [record.model_dump() for record in req.records]
    accepted, difficulties = _require_store().bootstrap_records(nickname, records)
    return {"accepted": accepted, "difficulties": difficulties}


@app.get("/api/leaderboard")
async def get_leaderboard(
    difficulty: str = Query(...),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=100),
):
    normalized = normalize_difficulty(difficulty)
    if normalized is None:
        raise HTTPException(status_code=400, detail="Invalid difficulty")

    entries = _require_store().get_leaderboard(normalized, limit)
    return {"difficulty": normalized, "entries": entries}


@app.get("/api/daily/leaderboard")
async def get_daily_leaderboard(
    date: str = Query(..., description="UTC challenge date YYYY-MM-DD"),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=100),
):
    challenge_date = normalize_challenge_date(date)
    if challenge_date is None:
        raise HTTPException(status_code=400, detail="Invalid challenge date")

    entries = _require_store().get_daily_leaderboard(challenge_date, limit)
    return {"challenge_date": challenge_date, "entries": entries}
