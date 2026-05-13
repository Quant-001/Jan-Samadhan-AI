from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0002_department_hierarchy_officer_levels"),
    ]

    operations = [
        migrations.AddField(
            model_name="complaint",
            name="pin_code",
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name="complaint",
            name="routing_note",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="complaint",
            name="sector",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="user",
            name="pin_code",
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name="user",
            name="sector",
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
