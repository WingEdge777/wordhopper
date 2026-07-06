import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from dictionary import load, lookup
from leaderboard import (
    DEFAULT_LIMIT,
    LeaderboardStore,
    normalize_best_word,
    normalize_difficulty,
    normalize_nickname,
    normalize_score,
    normalize_wpm,
)

DEFAULT_DB_PATH = Path(__file__).parent / "wordhopper.db"
store: LeaderboardStore | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global store
    dict_path = os.environ.get("DICT_PATH", "")
    load(dict_path)
    db_path = os.environ.get("DB_PATH", str(DEFAULT_DB_PATH))
    store = LeaderboardStore(db_path)
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


def _require_store() -> LeaderboardStore:
    if store is None:
        raise HTTPException(status_code=503, detail="Leaderboard store unavailable")
    return store


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    return lookup(req.words)


@app.post("/api/scores")
async def submit_score(req: SubmitScoreRequest):
    nickname = normalize_nickname(req.nickname)
    difficulty = normalize_difficulty(req.difficulty)
    score = normalize_score(req.score)
    wpm = normalize_wpm(req.wpm)
    if nickname is None or difficulty is None or score is None or wpm is None:
        raise HTTPException(status_code=400, detail="Invalid score payload")
    if score <= 0:
        raise HTTPException(status_code=400, detail="Score must be positive")

    best_word = normalize_best_word(req.best_word)
    accepted = _require_store().upsert_score(
        nickname, difficulty, score, wpm, best_word
    )
    return {"accepted": accepted}


@app.post("/api/scores/bootstrap")
async def bootstrap_scores(req: BootstrapScoresRequest):
    nickname = normalize_nickname(req.nickname)
    if nickname is None:
        raise HTTPException(status_code=400, detail="Invalid nickname")

    records = [record.model_dump() for record in req.records]
    accepted = _require_store().bootstrap_records(nickname, records)
    return {"accepted": accepted}


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
