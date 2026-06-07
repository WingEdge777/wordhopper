#!/usr/bin/env python3
"""Build short Chinese translations from local ECDICT for the in-game word lists."""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
DEFAULT_ECDICT = Path("/home/zhu/wsl-workspace/me/ECDICT/ecdict.csv")

FILTERS = {
    "easy": lambda w: 3 <= len(w) <= 5,
    "medium": lambda w: 6 <= len(w) <= 8,
    "hard": lambda w: 8 <= len(w),
}

MAX_ZH_LEN = 4
MAX_MEANINGS = 2
MANUAL_OVERRIDES = {
    "dont": "别",
    "thats": "那是",
    "didnt": "没",
    "doesnt": "不",
}


def collect_needed_words(easy_src: list[str], medium_src: list[str], hard_src: list[str]) -> set[str]:
    needed: set[str] = set()
    for raw in easy_src:
        w = raw.lower().strip()
        if w and FILTERS["easy"](w):
            needed.add(w)
    for raw in medium_src:
        w = raw.lower().strip()
        if w and FILTERS["medium"](w):
            needed.add(w)
    for raw in hard_src:
        w = raw.lower().strip()
        if w and FILTERS["hard"](w):
            needed.add(w)
    return needed


POS_RE = re.compile(r"\b(?:interj|n|vt|vi|v|a|adv|prep|conj|pron|int|art|num|aux|abbr|pl|pref|suf|p|pp|pt)\.\s*", re.IGNORECASE)

def shorten_translation(raw: str) -> str:
    t = raw.replace("\\n", " ").strip()
    t = re.sub(r"\[[^\]]*\]", "", t)
    t = re.sub(r"[（(][^）)]*[A-Za-z]{3,}[^）)]*[）)]", "", t)
    t = re.sub(r"[（(][贬使特尤][）)]", "", t)
    segments = POS_RE.split(t)
    all_parts: list[str] = []
    for seg in segments:
        for p in re.split(r"[，,;；\s]+", seg):
            p = p.strip().rstrip("。、：: ")
            if not p:
                continue
            if not re.search(r"[\u4e00-\u9fff]", p):
                continue
            if len(p) > 2 and p[-1] in "的地得":
                p = p[:-1]
            all_parts.append(p)
    seen = set()
    unique = [p for p in all_parts if not (p in seen or seen.add(p))]
    return "，".join(unique[:MAX_MEANINGS])


def load_ecdict_map(ecdict_path: Path, needed: set[str]) -> dict[str, str]:
    found: dict[str, str] = {}
    with ecdict_path.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)
        for row in reader:
            if len(row) < 4:
                continue
            word = row[0].strip().lower()
            if word not in needed or word in found:
                continue
            translation = row[3].strip()
            if translation:
                found[word] = shorten_translation(translation)
            if len(found) == len(needed):
                break
    return found


def main() -> int:
    ecdict_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_ECDICT
    if not ecdict_path.is_file():
        print(f"ECDICT not found: {ecdict_path}", file=sys.stderr)
        return 1

    easy_src = json.loads((DATA_DIR / "words-easy.json").read_text(encoding="utf-8"))
    medium_src = json.loads((DATA_DIR / "words-medium.json").read_text(encoding="utf-8"))
    hard_src = json.loads((DATA_DIR / "words-hard.json").read_text(encoding="utf-8"))

    needed = collect_needed_words(easy_src, medium_src, hard_src)
    print(f"Words to translate: {len(needed)}")
    print(f"Looking up in {ecdict_path} ...")
    ecdict_map = load_ecdict_map(ecdict_path, needed)

    translations: dict[str, str] = {}
    missing: list[str] = []
    for word in sorted(needed):
        zh = ecdict_map.get(word) or MANUAL_OVERRIDES.get(word)
        if zh:
            translations[word] = zh
        else:
            missing.append(word)

    (DATA_DIR / "word-translations.json").write_text(
        json.dumps(translations, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Translations: {len(translations)}/{len(needed)}")
    if missing:
        preview = ", ".join(missing[:20])
        suffix = "..." if len(missing) > 20 else ""
        print(f"Missing ({len(missing)}): {preview}{suffix}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
