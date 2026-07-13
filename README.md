# Word Hopper

[中文版](./README_CN.md)

**Type to survive. Jump to thrive.**

A free browser game that turns typing practice into a side-scrolling runner.
Type the word on an obstacle, then press **SPACE** at the green timing line to jump through the gap.

**Play now:** [https://wordhopper.wingedge777.com](https://wordhopper.wingedge777.com/)

> Best played on **desktop with a physical keyboard**. Mobile is preview-only.

---

## Why this exists

Typing drills are useful but dull. Word Hopper keeps the practice loop (accuracy, speed, WPM) and wraps it in a hopping runner: pick a word, finish it, nail the jump timing, chase a new best.

## How to play

Obstacles scroll in from the right. Each one shows one or two words.

1. **Type the first letter** to select a word
2. **Finish typing** the rest of the word
3. **Press SPACE** near the **green timing line** to jump the matching gap

Miss a letter and you continue from that position (combo breaks). Hit an obstacle and the run ends.

Closer jumps to the green line score better (`PERFECT` / `GOOD`). Speed rises as you clear obstacles.

### Difficulty

| Mode | Word length | Speed |
|------|-------------|-------|
| **Chill** | 3–5 chars | 0.5× |
| **Easy** | 3–5 chars | 1.0× |
| **Medium** | 6–8 chars | 1.0× |
| **Hard** | 8+ chars | 1.0× |

## Features

- Four difficulty modes with large word lists
- Local best score in-HUD (pulses when you approach a record)
- Global leaderboard per difficulty
- Auto-generated nickname (editable)
- Shareable result links
- First-run tutorial tips
- Chinese glosses for completed words (UI is English)

## Tech

| Layer | Stack |
|-------|--------|
| Game | Phaser 3, TypeScript, Vite, Bun |
| API | FastAPI, SQLite |
| Deploy | GitHub Actions → VPS (Nginx) |

Score submits use a short-lived run token plus server-side plausibility checks (not bulletproof anti-cheat, enough to block casual curl spam).

## Development

```bash
bun install
bun run dev      # game + Vite proxy to /api
bun run build
bun run preview
bun run test
bun run lint
```

### API server

```bash
cd server
python3 -m pip install -r requirements.txt
./start.sh       # kills old run.py, starts on :9999
```

## License

ISC — see `package.json`.
