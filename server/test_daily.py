import tempfile
import unittest
from pathlib import Path

from leaderboard import LeaderboardStore


class DailyLeaderboardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.store = LeaderboardStore(Path(self.tmp.name) / "test.db")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_daily_upsert_keeps_highest_per_day(self) -> None:
        self.assertTrue(
            self.store.upsert_daily_score("2026-08-07", "Alice", 100, 20, "cat")
        )
        self.assertFalse(
            self.store.upsert_daily_score("2026-08-07", "Alice", 80, 25, "dog")
        )
        self.assertTrue(
            self.store.upsert_daily_score("2026-08-07", "Alice", 150, 22, "leaf")
        )
        board = self.store.get_daily_leaderboard("2026-08-07")
        self.assertEqual(len(board), 1)
        self.assertEqual(board[0]["score"], 150)

    def test_daily_boards_are_date_scoped(self) -> None:
        self.store.upsert_daily_score("2026-08-07", "Alice", 100, 20, "cat")
        self.store.upsert_daily_score("2026-08-08", "Bob", 200, 30, "tree")
        self.assertEqual(len(self.store.get_daily_leaderboard("2026-08-07")), 1)
        self.assertEqual(
            self.store.get_daily_leaderboard("2026-08-07")[0]["nickname"], "Alice"
        )
        self.assertEqual(
            self.store.get_daily_leaderboard("2026-08-08")[0]["nickname"], "Bob"
        )


if __name__ == "__main__":
    unittest.main()
