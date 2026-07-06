import tempfile
import unittest
from pathlib import Path

from leaderboard import LeaderboardStore, normalize_nickname


class LeaderboardStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test.db"
        self.store = LeaderboardStore(self.db_path)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_upsert_keeps_highest_score_per_nickname_and_difficulty(self) -> None:
        self.assertTrue(self.store.upsert_score("Alice", "easy", 100, 10, "cat"))
        self.assertFalse(self.store.upsert_score("Alice", "easy", 80, 12, "dog"))
        self.assertTrue(self.store.upsert_score("Alice", "easy", 150, 15, "leaf"))

        board = self.store.get_leaderboard("easy")
        self.assertEqual(len(board), 1)
        self.assertEqual(board[0]["score"], 150)
        self.assertEqual(board[0]["best_word"], "leaf")

    def test_upsert_fills_missing_wpm_when_score_is_unchanged(self) -> None:
        self.assertTrue(self.store.upsert_score("Alice", "easy", 500, 0, ""))
        self.assertTrue(self.store.upsert_score("Alice", "easy", 500, 42, "planet"))

        board = self.store.get_leaderboard("easy")
        self.assertEqual(board[0]["score"], 500)
        self.assertEqual(board[0]["wpm"], 42)
        self.assertEqual(board[0]["best_word"], "planet")

    def test_bootstrap_accepts_multiple_difficulties(self) -> None:
        accepted = self.store.bootstrap_records(
            "Bob",
            [
                {"difficulty": "easy", "score": 200, "wpm": 0, "best_word": ""},
                {"difficulty": "hard", "score": 300, "wpm": 0, "best_word": ""},
            ],
        )
        self.assertEqual(accepted, 2)
        self.assertEqual(len(self.store.get_leaderboard("easy")), 1)
        self.assertEqual(len(self.store.get_leaderboard("hard")), 1)

    def test_bootstrap_rejects_high_scores(self) -> None:
        accepted = self.store.bootstrap_records(
            "Bob",
            [{"difficulty": "easy", "score": 900, "wpm": 0, "best_word": ""}],
        )
        self.assertEqual(accepted, 0)

    def test_leaderboard_orders_by_score_desc(self) -> None:
        self.store.upsert_score("Alice", "easy", 300, 10)
        self.store.upsert_score("Bob", "easy", 500, 20)
        board = self.store.get_leaderboard("easy")
        self.assertEqual([entry["nickname"] for entry in board], ["Bob", "Alice"])
        self.assertEqual(board[0]["rank"], 1)


class NormalizeNicknameTest(unittest.TestCase):
    def test_rejects_empty_or_invalid_nickname(self) -> None:
        self.assertIsNone(normalize_nickname(""))
        self.assertIsNone(normalize_nickname("<script>"))


if __name__ == "__main__":
    unittest.main()
