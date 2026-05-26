# Generated migration for adding login OTP fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('grievance_app', '0009_user_email_verification_otp'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='login_otp',
            field=models.CharField(blank=True, max_length=6),
        ),
        migrations.AddField(
            model_name='user',
            name='login_otp_created_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
