import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

from dictionary import load, lookup


@asynccontextmanager
async def lifespan(app: FastAPI):
    dict_path = os.environ.get("DICT_PATH", "")
    load(dict_path)
    yield


app = FastAPI(lifespan=lifespan)


class TranslateRequest(BaseModel):
    words: list[str]


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    return lookup(req.words)
