import csv
from pathlib import Path

_dict: dict[str, str] = {}

CSV_PATH: str = ""
DEFAULT_DICT_PATH = "/root/workspace/ECDICT/ecdict.csv"


def load(path: str = "") -> None:
    global CSV_PATH
    raw = (path or CSV_PATH).strip()
    if not raw:
        return
    p = Path(raw)
    if not p.is_file():
        return
    CSV_PATH = str(p)
    with open(p, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row.get("word", "").strip().lower()
            translation = row.get("translation", "").strip()
            if word and translation:
                _dict[word] = translation


def lookup(words: list[str]) -> dict[str, str]:
    return {w: _dict.get(w.lower(), "") for w in words}
