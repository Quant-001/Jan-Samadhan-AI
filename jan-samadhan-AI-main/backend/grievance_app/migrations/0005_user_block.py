from django.db import migrations, models


def ensure_user_block_column(apps, schema_editor):
    User = apps.get_model("grievance_app", "User")
    table_name = User._meta.db_table

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    if "block" not in existing_columns:
        field = models.CharField(blank=True, default="", max_length=80)
        field.set_attributes_from_name("block")
        schema_editor.add_field(User, field)
        return

    quoted_table = schema_editor.quote_name(table_name)
    quoted_column = schema_editor.quote_name("block")
    schema_editor.execute(
        f"UPDATE {quoted_table} SET {quoted_column} = %s WHERE {quoted_column} IS NULL",
        [""],
    )


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0004_complaint_identity_fields"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    ensure_user_block_column,
                    reverse_code=migrations.RunPython.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="user",
                    name="block",
                    field=models.CharField(blank=True, default="", max_length=80),
                ),
            ],
        ),
    ]
