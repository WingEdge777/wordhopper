import argparse
import os
from pathlib import Path

import uvicorn
from dictionary import DEFAULT_DICT_PATH

SERVER_DIR = Path(__file__).resolve().parent
os.chdir(SERVER_DIR)


def main():
    parser = argparse.ArgumentParser(description="WordHopper API Server")
    parser.add_argument(
        "--dict", default=DEFAULT_DICT_PATH, help="Path to ECDICT CSV file"
    )
    parser.add_argument("--db", default="", help="Path to SQLite leaderboard database")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host")
    parser.add_argument("--port", type=int, default=9999, help="Bind port")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()

    os.environ["DICT_PATH"] = args.dict
    if args.db:
        os.environ["DB_PATH"] = args.db
    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
