from django.test import TestCase

from .services import extract_video_id, heuristic_structure


class ExtractVideoIdTests(TestCase):
    def test_watch_url(self):
        self.assertEqual(
            extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        )

    def test_short_url(self):
        self.assertEqual(
            extract_video_id("https://youtu.be/dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        )

    def test_embed_url(self):
        self.assertEqual(
            extract_video_id("https://www.youtube.com/embed/dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        )

    def test_raw_id(self):
        self.assertEqual(extract_video_id("dQw4w9WgXcQ"), "dQw4w9WgXcQ")

    def test_invalid(self):
        with self.assertRaises(ValueError):
            extract_video_id("not a url")


class HeuristicStructureTests(TestCase):
    def test_empty(self):
        out = heuristic_structure("", title="Empty")
        self.assertEqual(out["sections"], [])
        self.assertEqual(out["source"], "heuristic")

    def test_basic(self):
        text = (
            "Photosynthesis is the process by which plants make food. "
            "Plants use sunlight, water, and carbon dioxide. "
            "The chloroplast contains chlorophyll. "
            "Chlorophyll absorbs light energy. "
            "The energy is used to combine water and carbon dioxide. "
            "Glucose is produced as the main energy source. "
            "Oxygen is released as a byproduct of photosynthesis."
        )
        out = heuristic_structure(text, title="Photosynthesis")
        self.assertTrue(out["summary"])
        self.assertGreater(len(out["sections"]), 0)
        self.assertEqual(out["source"], "heuristic")
