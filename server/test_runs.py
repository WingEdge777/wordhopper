import tempfile
import unittest
from pathlib import Path

from runs import RunStore
from score_validation import ValidationError, max_plausible_score, validate_run_finish


class ScoreValidationTest(unittest.TestCase):
    def test_accepts_realistic_run(self) -> None:
        validate_run_finish(
            difficulty="easy",
            score=916,
            wpm=42,
            words_typed=20,
            duration_sec=120,
            total_chars=420,
            max_combo=8,
            best_word="planet",
        )

    def test_rejects_impossible_score(self) -> None:
        with self.assertRaises(ValidationError):
            validate_run_finish(
                difficulty="easy",
                score=999_999,
                wpm=10,
                words_typed=5,
                duration_sec=30,
                total_chars=25,
                max_combo=5,
                best_word="",
            )

    def test_rejects_wpm_mismatch(self) -> None:
        with self.assertRaises(ValidationError):
            validate_run_finish(
                difficulty="easy",
                score=500,
                wpm=200,
                words_typed=10,
                duration_sec=60,
                total_chars=50,
                max_combo=5,
                best_word="",
            )

    def test_rejects_zero_wpm(self) -> None:
        with self.assertRaises(ValidationError):
            validate_run_finish(
                difficulty="easy",
                score=500,
                wpm=0,
                words_typed=10,
                duration_sec=60,
                total_chars=50,
                max_combo=5,
                best_word="",
            )

    def test_upper_bound_grows_with_duration(self) -> None:
        short = max_plausible_score(30, 10, "easy")
        long = max_plausible_score(300, 100, "easy")
        self.assertGreater(long, short)


class RunStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test.db"
        self.store = RunStore(self.db_path)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_create_and_finish_run(self) -> None:
        created = self.store.create_run("easy", "127.0.0.1")
        valid, reason = self.store.is_run_valid(created["run_id"], "easy")
        self.assertTrue(valid, reason)
        self.store.mark_finished(created["run_id"])
        valid, reason = self.store.is_run_valid(created["run_id"], "easy")
        self.assertFalse(valid)
        self.assertEqual(reason, "Run already finished")

    def test_rejects_difficulty_mismatch(self) -> None:
        created = self.store.create_run("easy")
        valid, reason = self.store.is_run_valid(created["run_id"], "hard")
        self.assertFalse(valid)
        self.assertEqual(reason, "Difficulty mismatch")

    def test_rate_limit_blocks_rapid_submits(self) -> None:
        self.assertTrue(self.store.check_rate_limit("finish:Alice:easy", 30))
        self.assertFalse(self.store.check_rate_limit("finish:Alice:easy", 30))


if __name__ == "__main__":
    unittest.main()
