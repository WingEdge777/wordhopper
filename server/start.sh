#!/bin/bash
set -euo pipefail

SERVER="$(cd "$(dirname "$0")" && pwd)"
LOG="$SERVER/wordhopper.log"

cd "$SERVER"

ps -ef | grep run.py | grep -v grep | awk '{print $2}' | xargs -r kill -9

nohup python3 run.py >>"$LOG" 2>&1 &
echo "Started (pid $!) — log: $LOG"
