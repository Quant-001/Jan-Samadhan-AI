import json
from pathlib import Path

from django.core.management.base import BaseCommand

from grievance_app.models import Complaint


class Command(BaseCommand):
    help = "Export resolved/admin-reviewed complaints as JSONL training feedback for AI model improvement."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default="ai_feedback.jsonl",
            help="Output JSONL path. Default: ai_feedback.jsonl",
        )

    def handle(self, *args, **options):
        output_path = Path(options["output"])
        complaints = Complaint.objects.filter(description__isnull=False).exclude(description="")
        count = 0

        with output_path.open("w", encoding="utf-8") as file:
            for complaint in complaints.iterator():
                record = {
                    "ticket_id": complaint.ticket_id,
                    "title": complaint.title,
                    "description": complaint.description,
                    "translated_description": complaint.translated_description,
                    "ai_category": complaint.ai_category,
                    "final_category": complaint.category,
                    "priority": complaint.priority,
                    "department": complaint.department.name if complaint.department else None,
                    "admin_override_note": complaint.admin_override_note,
                    "citizen_rating": complaint.citizen_rating,
                    "citizen_feedback": complaint.citizen_feedback,
                    "status": complaint.status,
                }
                file.write(json.dumps(record, ensure_ascii=False) + "\n")
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Exported {count} feedback records to {output_path}"))
