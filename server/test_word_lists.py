import unittest

from score_validation import ValidationError, validate_bootstrap_record
from word_lists import is_valid_best_word


class WordListTest(unittest.TestCase):
    def test_accepts_known_easy_word(self) -> None:
        self.assertTrue(is_valid_best_word("easy", "hello"))

    def test_rejects_unknown_word(self) -> None:
        self.assertFalse(is_valid_best_word("easy", "notawordxyz"))


class BootstrapValidationTest(unittest.TestCase):
    def test_accepts_complete_low_score(self) -> None:
        validate_bootstrap_record(
            difficulty="easy",
            score=500,
            wpm=32,
            best_word="",
        )

    def test_rejects_zero_wpm_bootstrap(self) -> None:
        with self.assertRaises(ValidationError):
            validate_bootstrap_record(
                difficulty="easy",
                score=400,
                wpm=0,
                best_word="",
            )

    def test_rejects_high_bootstrap_score(self) -> None:
        with self.assertRaises(ValidationError):
            validate_bootstrap_record(
                difficulty="easy",
                score=501,
                wpm=32,
                best_word="",
            )


if __name__ == "__main__":
    unittest.main()
