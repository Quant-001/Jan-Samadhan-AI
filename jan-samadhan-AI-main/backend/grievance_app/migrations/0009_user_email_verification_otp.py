from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0008_ensure_complainant_email_column"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_verification_otp",
            field=models.CharField(blank=True, max_length=6),
        ),
        migrations.AddField(
            model_name="user",
            name="email_verification_otp_created_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
