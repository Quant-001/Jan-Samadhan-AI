from django.contrib import admin
from .models import StudyMaterial


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "video_id", "language", "source", "created_at")
    search_fields = ("title", "video_id", "video_url")
    list_filter = ("language", "source")
    readonly_fields = ("created_at", "updated_at")
