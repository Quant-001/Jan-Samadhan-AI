# Jan Samadhan AI

AI-based citizen complaint management system with department assignment, officer hierarchy, complaint tracking, AI classification, and public resolution statistics.

This README is the main project documentation. It combines the project structure, architecture, complaint assignment flow, dashboard roles, and Docker setup in one file.

## Main Idea

Jan Samadhan AI helps citizens submit complaints and helps government users route those complaints through a clear officer chain:

```text
Citizen Submits Complaint
        ↓
AI detects category + department
        ↓
System assigns complaint to Department Main Officer
        ↓
Main Officer assigns nearest Senior Officer by sector / PIN
        ↓
Senior Officer assigns Sub Officer
        ↓
Sub Officer assigns Field Officer when needed
        ↓
Sub Officer / Field Officer resolves complaint
        ↓
Status Updated in Dashboard
        ↓
Citizen Receives Resolution Update
```

Department-wise example for a water complaint:

```text
Citizen submits "No water supply" with Sector 9 / PIN 452002
        ↓
AI classifies category = WATER
        ↓
Complaint is assigned to Water Supply Department Main Officer
        ↓
Water Main Officer forwards to Water Senior Officer for Sector 9 / 452002
        ↓
Senior Officer forwards to Water Sub Officer / Field Officer
        ↓
Resolution proof and remarks are uploaded
        ↓
Citizen dashboard and ticket tracking show updated status
```

Every complaint stores `sector`, `pin_code`, and `routing_note`, so the dashboard can show why and where it was routed.

Legacy/manual assignment flow:

```text
Citizen Submits Complaint
        ↓
Complaint Stored in Database
        ↓
Admin Assigns Department & Department Main Officer
        ↓
Department Main Officer Assigns Senior Officers
        ↓
Senior Officer Assigns Sub Officers
        ↓
Sub Officer Assigns Field Officers
        ↓
Field Officer / Sub Officer Resolves Complaint
        ↓
Status Updated in Dashboard
        ↓
Citizen Receives Resolution Update
```

## Dashboard Structure

### 1. Admin / Main Admin Dashboard

Admin manages only departments and department main officers.

Features:

- Add Department
- Edit Department
- Delete Department
- Add Department Main Officer
- Edit Department Main Officer
- Delete Department Main Officer
- Assign Department to Department Main Officer

Panel section:

```text
[ Assign Department and Officer ]
```

Examples:

```text
Electricity Department → Department Main Officer
Water Department       → Department Main Officer
Road Department        → Department Main Officer
Sanitation Department  → Department Main Officer
```

### 2. Department Main Officer Dashboard

Department Main Officer manages senior officers and department complaints.

Features:

- Add Senior Officer
- Edit Senior Officer
- Delete Senior Officer
- Add Complaint
- Assign / forward complaints
- View complaint management section

Flow:

```text
Department Main Officer
        ↓
Senior Officer
```

### 3. Senior Officer Dashboard

Senior Officer manages sub officers and assigned complaints.

Features:

- Add Sub Officer
- Edit Sub Officer
- Delete Sub Officer
- Add Complaint
- Assign complaints to Sub Officers
- Update complaint status
- Forward complaints

Flow:

```text
Senior Officer
        ↓
Sub Officer
```

### 4. Sub Officer Dashboard

Sub Officer manages field officers and complaint progress.

Features:

- Add Field Officer
- Edit Field Officer
- Delete Field Officer
- Add Complaint
- View assigned complaints
- Update complaint progress
- Upload resolution report / proof
- Mark complaint as resolved

Flow:

```text
Sub Officer
        ↓
Field Officer
```

### 5. Field Officer Dashboard

Field Officer works on ground-level complaint resolution.

Features:

- View assigned complaints
- Update complaint status
- Upload proof / report
- Mark complaint as resolved

## Complete Officer Chain

```text
Admin / Main Admin
   ↓
Department Main Officer
   ↓
Senior Officer
   ↓
Sub Officer
   ↓
Field Officer
   ↓
Complaint Resolution
   ↓
Citizen Notification
```

## Home Page Public Statistics

The home page shows a modern public-facing complaint progress section.

Two main blocks:

- Complaint assigned percentage
- Complaint resolved count

The backend public stats API returns:

```json
{
  "total_complaints": 3,
  "assigned_complaints": 1,
  "assigned_percentage": 33.3,
  "resolved_complaints": 1,
  "pending_complaints": 2,
  "departments": 5,
  "resolution_percentage": 33.3
}
```

Endpoint:

```text
GET /api/public/stats/
```

## Project Structure

```text
JanSamadhan-AI/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   ├── grievance_app/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   ├── ai_service.py
│   │   ├── tasks.py
│   │   ├── migrations/
│   │   └── management/
│   │       └── commands/
│   │           ├── seed.py
│   │           ├── train_local_ai_model.py
│   │           └── export_ai_feedback.py
│   ├── ai_models/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── TrackComplaint.jsx
│   │   │   ├── Citizen/
│   │   │   │   └── CitizenDashboard.jsx
│   │   │   ├── Admin/
│   │   │   │   └── AdminDashboard.jsx
│   │   │   └── Officer/
│   │   │       └── OfficerDashboard.jsx
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Deployment-Friendly Folder Layout

The project is separated into two main deployable parts.

```text
frontend/  = UI only
backend/   = API, database models, AI logic, auth, Celery tasks
root files = Docker and cloud deployment coordination
```

### Frontend Folder

Use this folder for all user interface work.

```text
frontend/
├── src/
│   ├── pages/          # Home, Login, Register, Citizen, Admin, Officer screens
│   ├── components/     # Navbar, chatbot, shared UI components
│   ├── api/            # Axios API client
│   ├── hooks/          # Auth hook
│   └── utils/          # Date and helper functions
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
└── .env.production
```

Deploy frontend on Vercel:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Environment: VITE_API_URL=https://jan-samadhan-backend.onrender.com/api
```

### Backend Folder

Use this folder for all logic and data work.

```text
backend/
├── config/             # Django settings, URLs, Celery config
├── grievance_app/      # Main app logic
│   ├── models.py       # Database structure
│   ├── views.py        # API logic
│   ├── serializers.py  # API data conversion
│   ├── permissions.py  # Role permissions
│   ├── ai_service.py   # Complaint AI classification
│   ├── tasks.py        # Celery background tasks
│   └── management/
│       └── commands/   # seed, train model, export feedback
├── ai_models/          # Local AI model JSON
├── requirements.txt
├── Dockerfile
├── .env.example
└── manage.py
```

Deploy backend on Render:

```text
Blueprint File: render.yaml
Backend Root Directory: backend
Runtime: Python
Start Command: defined in render.yaml
Database: Render Postgres, created by render.yaml
Redis/Key Value: Render Key Value, created by render.yaml
Required manual env vars: EMAIL_HOST_USER and EMAIL_HOST_PASSWORD only if email is needed
```

### Root Files

Root files should only coordinate the project.

```text
docker-compose.yml  # local full-stack run
render.yaml         # Render backend deployment
README.md           # combined project structure + architecture docs
.gitignore          # local/generated files ignored from Git
```

This makes deployment easier:

- Render reads `render.yaml` from the root and deploys `backend/`.
- Vercel deploys only the `frontend/` folder.
- Docker Compose runs the complete project locally.
- UI changes stay in `frontend/`.
- API, database, officer-chain logic, and AI logic stay in `backend/`.

## Important Backend Files

### `backend/grievance_app/models.py`

Main database models:

- `User`
- `Department`
- `Complaint`
- `ComplaintHistory`
- `Notification`

Officer hierarchy fields:

- `officer_level`
- `supervisor`
- `department`
- `jurisdiction`

Officer levels:

```text
MAIN_OFFICER
DEPARTMENT_HEAD
DEPARTMENT_OFFICER
SUB_OFFICER
FIELD_OFFICER
```

### `backend/grievance_app/views.py`

Contains API logic for:

- Citizen complaint create/list
- Admin department management
- Admin department main officer management
- Officer complaint management
- Officer subordinate create/edit/delete
- Public home page statistics
- AI classification endpoint

### `backend/grievance_app/management/commands/seed.py`

Seeds:

- Default departments
- Admin login
- Department main officer
- Senior officer
- Sub officer
- Field officer
- Demo citizen
- Demo complaints

## Important Frontend Files

### `frontend/src/pages/HomePage.jsx`

Public home page:

- Citizen actions
- Assignment workflow
- Complaint assigned percentage block
- Complaint resolved block
- Public complaint progress section

### `frontend/src/pages/Admin/AdminDashboard.jsx`

Admin dashboard:

- Assign Department and Officer
- Department add/edit/delete
- Department Main Officer add/edit/delete
- Department to Main Officer assignment

### `frontend/src/pages/Officer/OfficerDashboard.jsx`

Officer hierarchy dashboard:

- Department Main Officer creates Senior Officers
- Senior Officer creates Sub Officers
- Sub Officer creates Field Officers
- Complaint add, assign, update, proof upload, resolve

### `frontend/src/pages/Citizen/CitizenDashboard.jsx`

Citizen dashboard:

- Submit complaint
- View personal complaints
- Track status
- Give feedback after resolution

## AI Classification Architecture

AI logic lives in:

```text
backend/grievance_app/ai_service.py
```

AI flow:

```text
Complaint Text
  ↓
Language Detection
  ↓
Translation / Text Cleaning
  ↓
Local ML Classification
  ↓
Keyword Fallback
  ↓
Priority Detection
  ↓
Department Mapping
  ↓
Complaint Routing
```

Train local AI model:

```bash
docker-compose exec backend python manage.py train_local_ai_model
```

### AI Layer Functions

```text
detect_language(text)
  Detects complaint language.

translate_to_english(text, source_lang)
  Translates non-English complaint text before classification.

clean_text(text)
  Removes URLs, punctuation, extra spaces, and common stop words.

classify_with_supervised_model(cleaned_text)
  Local supervised classifier loaded from backend/ai_models/grievance_classifier.json.

classify_with_transformer(text)
  Optional pretrained model hook for BERT, DistilBERT, IndicBERT, or MuRIL.

classify_with_keywords(text)
  Local fallback classifier using department and urgency keywords.

classify_complaint(text)
  Main function used by complaint creation and external API integration.
```

### AI/ML Engine Structure

```text
backend/grievance_app/ai_service.py
│
├── Rule / NLP Layer
│   ├── detect_language()
│   ├── translate_to_english()
│   ├── clean_text()
│   └── detect_priority()
│
├── Supervised ML Layer
│   └── classify_with_supervised_model()
│       Uses backend/ai_models/grievance_classifier.json if available.
│
├── Pretrained Model Layer
│   └── classify_with_transformer()
│       Optional BERT / IndicBERT compatible classifier.
│
└── Fallback Layer
    └── classify_with_keywords()
        Always available for reliable local routing.
```

Recommended classification order:

```text
1. Supervised ML model
2. Fine-tuned BERT / IndicBERT model if available
3. Local keyword fallback
```

### Continuous Feedback Loop

```text
AI predicts category
  ↓
Admin / officer reviews routing
  ↓
Final category is stored
  ↓
Feedback export creates training data
  ↓
Model can be retrained
  ↓
Updated model improves future routing
```

Commands:

```bash
docker-compose exec backend python manage.py train_local_ai_model
docker-compose exec backend python manage.py export_ai_feedback --output ai_feedback.jsonl
```

Example AI output:

```json
{
  "category": "WATER",
  "priority": "HIGH",
  "confidence": 0.93,
  "summary": "No water supply in the area for three days.",
  "source": "local_naive_bayes",
  "original_lang": "en",
  "translated_text": "No water supply in my area for three days."
}
```

## Deployment Modes

### Mode 1: Full Portal Mode

Use Jan Samadhan AI as a complete grievance system.

```text
Citizen
  ↓
Jan Samadhan UI
  ↓
Jan Samadhan Backend
  ↓
AI Classification Engine
  ↓
Admin / Officer Dashboards
  ↓
Status Tracking and Feedback
```

### Mode 2: API Integration Mode

Use Jan Samadhan AI as an AI classification service for an existing CPGRAMS, state, or municipal portal.

```text
Existing Government Portal
  ↓
POST /api/ai/classify/
  ↓
Jan Samadhan AI returns category, priority, confidence, and department
  ↓
Government portal routes complaint internally
```

Example request:

```http
POST /api/ai/classify/
```

```json
{
  "external_complaint_id": "CPGRAMS-2026-00123",
  "title": "No water supply",
  "description": "There is no water in my area for 3 days",
  "location": "Ward 18, Sector 9, Indore 452002"
}
```

Portal complaint creation also accepts `sector` and `pin_code` fields. If `pin_code` is not sent, the backend tries to extract a 6-digit PIN from the location or complaint text.

## Main API Endpoints

### Auth

```text
POST /api/auth/login/
POST /api/auth/register/
GET  /api/auth/me/
```

### Citizen

```text
GET  /api/complaints/
POST /api/complaints/
GET  /api/complaints/<id>/
PATCH /api/complaints/<id>/feedback/
GET  /api/track/<ticket_id>/
```

### Admin / Main Admin

```text
GET    /api/admin/departments/
POST   /api/admin/departments/
PATCH  /api/admin/departments/<id>/
DELETE /api/admin/departments/<id>/

GET    /api/admin/users/?role=OFFICER
POST   /api/admin/create-officer/
PATCH  /api/admin/officers/<id>/
DELETE /api/admin/officers/<id>/
```

### Officer Chain

```text
GET    /api/officer/complaints/
POST   /api/officer/add-complaint/
PATCH  /api/officer/complaints/<id>/

GET    /api/officer/assignable-officers/
POST   /api/officer/subordinates/
PATCH  /api/officer/subordinates/<id>/
DELETE /api/officer/subordinates/<id>/
```

### Public Stats

```text
GET /api/public/stats/
```

### AI Classification

```text
POST /api/ai/classify/
```

## Run Project Using Docker

From the project root:

```bash
docker-compose up -d
```

If you need to rebuild images:

```bash
docker-compose up -d --build
```

Check running containers:

```bash
docker-compose ps
```

View backend logs:

```bash
docker-compose logs -f backend
```

Run backend checks:

```bash
docker-compose exec backend python manage.py check
```

Run seed data:

```bash
docker-compose exec backend python manage.py seed
```

Frontend with Docker Compose:

```text
http://127.0.0.1:5174
```

Backend:

```text
http://localhost:8000
```

## Easy Cloud Deploy Steps

### 1. Deploy Backend on Render

1. Push this repo to GitHub.
2. Open Render.
3. Choose Blueprint deployment.
4. Select this repository.
5. Render will read `render.yaml`.
6. Render creates the backend, Postgres database, and Key Value/Redis instance.
7. `DATABASE_URL` is populated automatically from the Render Postgres database in `render.yaml`. Do not override it with a manual Neon or external database URL unless you also update that database password and connection string.
8. Add email variables only if you want SMTP email:

```text
EMAIL_HOST_USER      optional
EMAIL_HOST_PASSWORD  optional
```

Render backend URL:

```text
https://jan-samadhan-backend.onrender.com
```

### 2. Deploy Frontend on Vercel

1. Open Vercel.
2. Import the same GitHub repository.
3. Set root directory to:

```text
frontend
```

4. Set environment variable:

```text
VITE_API_URL=https://jan-samadhan-backend.onrender.com/api
```

5. Deploy.

If you rename the Render backend service, replace `jan-samadhan-backend.onrender.com` in `render.yaml`, `frontend/vercel.json`, `.env.production`, and the Vercel `VITE_API_URL`.

### 3. Update URLs if You Rename Services

If your Render backend URL changes, update these places:

```text
render.yaml
frontend/vercel.json
frontend/.env.production
Vercel environment variable VITE_API_URL
```

## Demo Login IDs

| Role | Username | Password |
|---|---|---|
| Admin / Main Admin | `admin` | `Admin@1234` |
| Department Main Officer | `main_electricity` | `Main@1234` |
| Senior Officer | `senior_electricity` | `Senior@1234` |
| Sub Officer | `sub_electricity` | `Sub@1234` |
| Field Officer | `field_electricity` | `Field@1234` |
| Citizen | `citizen_demo` | `Citizen@1234` |

## Test Flow

1. Open `http://localhost:5173`.
2. Login as `admin`.
3. Add/edit/delete departments.
4. Add/edit/delete Department Main Officer.
5. Assign department to Department Main Officer.
6. Login as `main_electricity`.
7. Add Senior Officer and add/assign complaints.
8. Login as `senior_electricity`.
9. Add Sub Officer and forward complaints.
10. Login as `sub_electricity`.
11. Add Field Officer and update complaint progress.
12. Login as `field_electricity`.
13. Resolve complaint and upload proof.
14. Login as `citizen_demo`.
15. Track complaint and view resolution update.

## Docker Services

`docker-compose.yml` starts:

- `db`: PostgreSQL
- `redis`: Redis
- `backend`: Django REST API
- `frontend`: React/Vite UI
- `celery`: background worker
- `celery-beat`: scheduled SLA checks

## Free and Open-Source Tools Used

| Area | Tool |
|---|---|
| Backend | Django |
| API | Django REST Framework |
| Authentication | SimpleJWT |
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| AI Model | Local supervised classifier |
| AI Fallback | Keyword classifier |
| Database | PostgreSQL |
| Queue | Celery |
| Cache / Broker | Redis |
| Containerization | Docker Compose |
| Deployment | Render / Vercel |

## Why This Matches The Problem Statement

| Requirement | Implementation |
|---|---|
| Automated classification | `classify_complaint()` maps complaint text to departments |
| Multilingual input | Language detection and translation support |
| Priority detection | LOW, MEDIUM, HIGH, CRITICAL urgency levels |
| Intelligent routing | Department and officer assignment workflow |
| Admin dashboard | Department and Department Main Officer assignment |
| Officer dashboard | Senior Officer, Sub Officer, Field Officer chain |
| Citizen tracking | Ticket ID, status, history, notifications, feedback |
| Public progress | Home page assigned percentage and resolved complaint blocks |
| Scalable backend | API-first Django, PostgreSQL, Redis, Celery, Docker |
| Existing portal integration | `/api/ai/classify/` endpoint |

## Project Pitch

Jan Samadhan AI is a CPGRAMS-inspired grievance redress platform with an AI/NLP classification layer. It detects language, classifies complaints, identifies priority, maps grievances to the correct department, and routes work through a strict officer chain from Admin to Department Main Officer, Senior Officer, Sub Officer, and Field Officer. It can run as a complete complaint portal or as an AI routing API for existing government systems.

## Deployment Files

- `render.yaml`: Render deployment config
- `frontend/vercel.json`: Vercel frontend config
- `backend/Dockerfile`: backend container image
- `docker-compose.yml`: local full-stack Docker setup

## Notes

- This `README.md` is the single main documentation file for project structure and architecture.
- The system is built around role-based dashboards and a strict officer chain.
- Public home page statistics come from `GET /api/public/stats/`.
# jan-samadhan-AI
