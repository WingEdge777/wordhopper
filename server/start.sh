#!/bin/bash
set -euo pipefail

SERVER="$(cd "$(dirname "$0")" && pwd)"
LOG="$SERVER/wordhopper.log"
PORT=9999

cd "$SERVER"

if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
else
  pkill -f "${SERVER}/run.py" >/dev/null 2>&1 || true
fi

sleep 0.5

nohup python3 run.py >>"$LOG" 2>&1 &
echo "Started (pid $!) — log: $LOG"
