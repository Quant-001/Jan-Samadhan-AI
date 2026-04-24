from django.db import models


class StudyMaterial(models.Model):
    """A structured study guide generated from a YouTube video."""

    video_id = models.CharField(max_length=32, db_index=True)
    video_url = models.URLField()
    title = models.CharField(max_length=512, blank=True, default="")
    language = models.CharField(max_length=12, default="en")
    transcript = models.TextField(blank=True, default="")
    summary = models.TextField(blank=True, default="")

    # Structured payloads (JSON)
    sections = models.JSONField(default=list, blank=True)   # [{title, content, key_points:[...]}, ...]
    key_points = models.JSONField(default=list, blank=True)  # [str, ...]
    glossary = models.JSONField(default=list, blank=True)    # [{term, definition}, ...]
    quiz = models.JSONField(default=list, blank=True)        # [{question, options:[...], answer_index, explanation}]

    source = models.CharField(max_length=32, default="heuristic")  # "heuristic" | "openai"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title or self.video_id} ({self.video_id})"
