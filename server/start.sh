#!/bin/bash
set -euo pipefail

SERVER="$(cd "$(dirname "$0")" && pwd)"
LOG="$SERVER/wordhopper.log"

cd "$SERVER"
nohup python3 run.py >>"$LOG" 2>&1 &
echo "Started (pid $!) — log: $LOG"
