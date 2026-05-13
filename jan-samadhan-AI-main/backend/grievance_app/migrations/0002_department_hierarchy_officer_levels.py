from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="department",
            name="government_level",
            field=models.CharField(
                choices=[
                    ("STATE", "State Government"),
                    ("CENTRAL", "Central Government"),
                    ("LOCAL", "Local Body"),
                ],
                default="STATE",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="department",
            name="parent_department",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sub_departments",
                to="grievance_app.department",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="jurisdiction",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="user",
            name="officer_level",
            field=models.CharField(
                blank=True,
                choices=[
                    ("MAIN_OFFICER", "Main Officer"),
                    ("DEPARTMENT_HEAD", "Department-Wise Main Officer"),
                    ("DEPARTMENT_OFFICER", "Department Officer"),
                    ("SUB_OFFICER", "Sub Officer"),
                    ("FIELD_OFFICER", "Sub-Section / Field Officer"),
                ],
                default="",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="supervisor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="sub_officers",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
