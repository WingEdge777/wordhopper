#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DICT="/root/workspace/ECDICT/ecdict.csv"
LOG="$ROOT/server/wordhopper.log"

cd "$ROOT"
nohup python3 server/run.py --dict "$DICT" --port 9999 >>"$LOG" 2>&1 &
echo "Started (pid $!) — log: $LOG"
