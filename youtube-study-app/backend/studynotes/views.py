from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import StudyMaterial
from .serializers import (
    CreateStudyMaterialSerializer,
    StudyMaterialDetailSerializer,
    StudyMaterialListSerializer,
)
from .services import (
    extract_video_id,
    fetch_transcript,
    fetch_video_title,
    structure_material,
    TranscriptError,
)


@api_view(["GET"])
def health(_request):
    return Response({"status": "ok"})


class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = StudyMaterial.objects.all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateStudyMaterialSerializer
        return StudyMaterialListSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateStudyMaterialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        url = serializer.validated_data["url"]
        language = serializer.validated_data.get("language", "en")

        try:
            video_id = extract_video_id(url)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transcript_text, used_language = fetch_transcript(video_id, preferred=language)
        except TranscriptError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        title = fetch_video_title(video_id) or ""
        structured = structure_material(transcript_text, title=title)

        material = StudyMaterial.objects.create(
            video_id=video_id,
            video_url=f"https://www.youtube.com/watch?v={video_id}",
            title=title or structured.get("title", ""),
            language=used_language,
            transcript=transcript_text,
            summary=structured.get("summary", ""),
            sections=structured.get("sections", []),
            key_points=structured.get("key_points", []),
            glossary=structured.get("glossary", []),
            quiz=structured.get("quiz", []),
            source=structured.get("source", "heuristic"),
        )
        out = StudyMaterialDetailSerializer(material).data
        return Response(out, status=status.HTTP_201_CREATED)


class MaterialDetailView(generics.RetrieveDestroyAPIView):
    queryset = StudyMaterial.objects.all()
    serializer_class = StudyMaterialDetailSerializer
