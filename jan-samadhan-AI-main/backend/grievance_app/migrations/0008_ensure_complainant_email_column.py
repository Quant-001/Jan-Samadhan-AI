from django.db import migrations, models


def ensure_complainant_email_column(apps, schema_editor):
    Complaint = apps.get_model("grievance_app", "Complaint")
    table_name = Complaint._meta.db_table

    with schema_editor.connection.cursor() as cursor:
        columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    if "complainant_email" in columns:
        return

    field = models.EmailField(blank=True, default="", max_length=254)
    field.set_attributes_from_name("complainant_email")
    schema_editor.add_field(Complaint, field)


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0007_complaint_complainant_email"),
    ]

    operations = [
        migrations.RunPython(
            ensure_complainant_email_column,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
