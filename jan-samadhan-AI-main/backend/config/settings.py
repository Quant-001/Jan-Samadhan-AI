"""
Jan Samadhan AI — Django Settings
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me-in-production-use-strong-key")
DEBUG = os.getenv("DEBUG", "True") == "True"

def csv_env(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def append_unique(items, *values):
    for value in values:
        if value and value not in items:
            items.append(value)
    return items


ALLOWED_HOSTS = csv_env(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,0.0.0.0,jan-samadhan-ai.onrender.com,jan-samadhan-backend.onrender.com",
)
append_unique(
    ALLOWED_HOSTS,
    os.getenv("RENDER_EXTERNAL_HOSTNAME"),
    "jan-samadhan-ai.onrender.com",
    "jan-samadhan-backend.onrender.com",
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "axes",
    "django_celery_beat",
    "drf_spectacular",
    "grievance_app",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DB_SSLMODE = os.getenv("DB_SSLMODE", "disable" if DEBUG else "require")
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=DB_SSLMODE != "disable",
        )
    }
else:
    DB_OPTIONS = {}
    if DB_SSLMODE and DB_SSLMODE != "disable":
        DB_OPTIONS["sslmode"] = DB_SSLMODE
    if os.getenv("DB_CHANNEL_BINDING"):
        DB_OPTIONS["channel_binding"] = os.getenv("DB_CHANNEL_BINDING")

    # --- Database (local PostgreSQL by default, Neon/managed Postgres via env) ---
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "jan_samadhan"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", ""),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "OPTIONS": DB_OPTIONS,
        }
    }
# --- Redis & Celery ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TIMEZONE = "Asia/Kolkata"

# --- Cache ---
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# --- Auth ---
AUTH_USER_MODEL = "grievance_app.User"

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}

# --- CORS ---
CORS_ALLOWED_ORIGINS = csv_env(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,https://jan-samadhan.vercel.app,https://jan-samadhan-ai-ten.vercel.app",
)
append_unique(
    CORS_ALLOWED_ORIGINS,
    os.getenv("FRONTEND_URL"),
    "https://jan-samadhan.vercel.app",
    "https://jan-samadhan-ai-ten.vercel.app",
)
CORS_ALLOWED_ORIGIN_REGEXES = csv_env(
    "CORS_ALLOWED_ORIGIN_REGEXES",
    r"^https://.*\.vercel\.app$",
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = csv_env(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,https://jan-samadhan.vercel.app,https://jan-samadhan-ai-ten.vercel.app,https://*.vercel.app",
)
append_unique(
    CSRF_TRUSTED_ORIGINS,
    os.getenv("FRONTEND_URL"),
    "https://jan-samadhan.vercel.app",
    "https://jan-samadhan-ai-ten.vercel.app",
)

# --- Static & Media ---
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Email / Verification ---
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend"
    if os.getenv("EMAIL_HOST_USER")
    else "django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False") == "True"
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "15"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL") or EMAIL_HOST_USER or "noreply@jansamadhan.in"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
EMAIL_VERIFICATION_REQUIRED = os.getenv("EMAIL_VERIFICATION_REQUIRED", "True") == "True"
EMAIL_VERIFICATION_MAX_AGE_SECONDS = int(os.getenv("EMAIL_VERIFICATION_MAX_AGE_SECONDS", "172800"))

# --- Axes (Brute-force protection) ---
AXES_ENABLED = os.getenv("AXES_ENABLED", "False" if DEBUG else "True") == "True"
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_LOCKOUT_CALLABLE = None

# --- SLA defaults (hours) ---
SLA_HOURS = {
    "LOW": 168,       # 7 days
    "MEDIUM": 72,     # 3 days
    "HIGH": 24,       # 24 hours
    "CRITICAL": 2,    # 2 hours
}

# --- Spectacular (Swagger) ---
SPECTACULAR_SETTINGS = {
    "TITLE": "Jan Samadhan AI API",
    "DESCRIPTION": "AI-Based Citizen Grievance Classification System",
    "VERSION": "1.0.0",
}

# --- Sentry (optional) ---
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.2)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True
