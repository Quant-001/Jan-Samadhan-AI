from rest_framework import serializers
from .models import StudyMaterial


class StudyMaterialListSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyMaterial
        fields = (
            "id",
            "video_id",
            "video_url",
            "title",
            "language",
            "source",
            "created_at",
        )


class StudyMaterialDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyMaterial
        fields = (
            "id",
            "video_id",
            "video_url",
            "title",
            "language",
            "transcript",
            "summary",
            "sections",
            "key_points",
            "glossary",
            "quiz",
            "source",
            "created_at",
            "updated_at",
        )


class CreateStudyMaterialSerializer(serializers.Serializer):
    url = serializers.URLField()
    language = serializers.CharField(required=False, default="en", max_length=12)
