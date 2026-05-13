from django.db import migrations


def relax_legacy_user_columns(apps, schema_editor):
    User = apps.get_model("grievance_app", "User")
    table_name = User._meta.db_table
    model_columns = {field.column for field in User._meta.local_fields}

    with schema_editor.connection.cursor() as cursor:
        table_columns = schema_editor.connection.introspection.get_table_description(
            cursor,
            table_name,
        )

    quoted_table = schema_editor.quote_name(table_name)
    for column in table_columns:
        if column.name in model_columns or column.null_ok:
            continue

        quoted_column = schema_editor.quote_name(column.name)
        schema_editor.execute(f"ALTER TABLE {quoted_table} ALTER COLUMN {quoted_column} DROP NOT NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("grievance_app", "0005_user_block"),
    ]

    operations = [
        migrations.RunPython(
            relax_legacy_user_columns,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
