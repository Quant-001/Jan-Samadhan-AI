#!/usr/bin/env bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Ensuring default admin user (admin/admin) for dev..."
python manage.py shell <<'PY'
import os
from django.contrib.auth import get_user_model
User = get_user_model()
username = "admin"
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, "admin@example.com", "admin")
    print("Created default superuser: admin / admin")
PY

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
