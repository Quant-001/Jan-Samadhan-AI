# YouTube → Structured Study Material

A full-stack web app that takes a YouTube video URL, fetches its transcript,
and turns it into structured study material: a summary, sectioned outline,
key points, glossary, and a short quiz.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Django 5 + Django REST Framework + PostgreSQL
- **Transcript:** `youtube-transcript-api`
- **Optional AI summarization:** OpenAI (set `OPENAI_API_KEY`)
  Falls back to a built-in heuristic structuring engine when no key is set,
  so the app works fully out-of-the-box.
- **Containerization:** Docker + docker-compose
- **Reverse proxy:** Nginx (serves built frontend + proxies `/api` to Django)

## Project layout

```
youtube-study-app/
├── docker-compose.yml
├── .env.example
├── backend/                 # Django + DRF
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── entrypoint.sh
│   ├── config/              # Django project (settings, urls, wsgi)
│   └── studynotes/          # Main app: models, serializers, views, services
└── frontend/                # React + Vite + Tailwind
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── api/             # Axios client
        ├── components/      # UI building blocks
        └── pages/           # Routed pages
```

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: http://localhost:8080
- API:      http://localhost:8080/api/
- Django admin: http://localhost:8080/admin/  (user: `admin` / `admin`)

The frontend container runs Nginx, which serves the built React app and
proxies `/api/*` and `/admin/*` to the Django container.

## Local dev (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DJANGO_SECRET_KEY=dev DJANGO_DEBUG=1 DATABASE_URL=sqlite:///db.sqlite3
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on http://localhost:5173 and proxies `/api` to Django.

## API

| Method | Path                          | Description                                |
| ------ | ----------------------------- | ------------------------------------------ |
| POST   | `/api/materials/`             | Create study material from a YouTube URL   |
| GET    | `/api/materials/`             | List previously generated materials        |
| GET    | `/api/materials/{id}/`        | Retrieve a single study material           |
| DELETE | `/api/materials/{id}/`        | Delete a study material                    |
| GET    | `/api/health/`                | Health check                               |

Request body for POST:

```json
{ "url": "https://www.youtube.com/watch?v=VIDEO_ID", "language": "en" }
```

## Environment variables

| Variable             | Default                      | Notes                                |
| -------------------- | ---------------------------- | ------------------------------------ |
| `DJANGO_SECRET_KEY`  | _(required)_                 | Django secret key                    |
| `DJANGO_DEBUG`       | `0`                          | `1` to enable debug                  |
| `DJANGO_ALLOWED_HOSTS` | `*`                        | Comma-separated                      |
| `DATABASE_URL`       | `postgres://...` (compose)   | Falls back to SQLite locally         |
| `OPENAI_API_KEY`     | _(unset)_                    | Optional — enables LLM structuring   |
| `OPENAI_MODEL`       | `gpt-4o-mini`                | Model used when AI is enabled        |

## License

MIT
