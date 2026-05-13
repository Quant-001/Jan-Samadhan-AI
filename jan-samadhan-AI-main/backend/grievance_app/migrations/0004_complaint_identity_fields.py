from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0003_area_routing_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="complaint",
            name="complainant_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="complaint",
            name="valid_id_number",
            field=models.CharField(blank=True, max_length=80),
        ),
    ]
