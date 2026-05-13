from django.core.management.base import BaseCommand

from grievance_app.ai_service import SUPERVISED_MODEL_PATH
from grievance_app.ml_training import build_training_dataset, save_model, train_naive_bayes_model
from grievance_app.models import Complaint


class Command(BaseCommand):
    help = "Train the local supervised grievance classifier from seed examples and admin feedback."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            default=str(SUPERVISED_MODEL_PATH),
            help="Output model JSON path.",
        )

    def handle(self, *args, **options):
        feedback_records = []
        complaints = Complaint.objects.exclude(description="")
        for complaint in complaints.iterator():
            feedback_records.append({
                "title": complaint.title,
                "description": complaint.description,
                "translated_description": complaint.translated_description,
                "final_category": complaint.category,
            })

        dataset = build_training_dataset(feedback_records)
        model = train_naive_bayes_model(dataset)
        output_path = save_model(model, options["output"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Trained local AI model with {model['total_docs']} examples at {output_path}"
            )
        )
