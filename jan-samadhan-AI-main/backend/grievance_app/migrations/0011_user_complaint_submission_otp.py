from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0010_user_login_otp"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="complaint_submission_otp",
            field=models.CharField(blank=True, max_length=6),
        ),
        migrations.AddField(
            model_name="user",
            name="complaint_submission_otp_created_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
