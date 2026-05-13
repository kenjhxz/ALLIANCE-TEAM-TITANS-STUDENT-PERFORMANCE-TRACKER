# Student Performance Tracker — Documentation

## Overview
The Student Performance Tracker (SPT) is a web application for managing student performance data. It includes:
- Role-based authentication for admins, teachers, and students.
- Enrollment workflows and subject offerings.
- Grade entry, review, reporting, and audit logging.
- Notifications and email verification flows.

## Architecture
- **Frontend:** React + Vite (`frontend/`)
- **Backend:** Django REST Framework (`backend/`)
- **Database:** SQLite (default `backend/db.sqlite3`)

## Key Modules
### Authentication & Profiles
- Registration, login, logout, email verification, password reset.
- Role-specific profiles (student, teacher, admin).

### Enrollment & Offerings
- Admin: create programs, disciplines, offerings.
- Student: submit enrollment requests and select schedules.
- Admin: approve/reject enrollment queue.

### Grades
- Teacher: post/update/delete grades.
- Student: view grades, timeline, export.
- Admin: override grade entries.

### Reports & Audit
- Admin: generate grade summary reports, export PDF/CSV/XLSX, print.
- Audit logs for key actions.

### Notifications
- System notifications for offerings, enrollment, and grade updates.

## API Surface (High-level)
- Auth: `/auth/*`
- System: `/system/*`
- Reports: `/system/reports/*`

## Tech Notes
- CORS enabled for local dev.
- Email delivery configured via SMTP settings in `backend/.env`.

## Known Constraints
- SQLite is for development only. Use a production-grade database for deployment.

## File Map (Core)
- `backend/core/settings.py` — Django settings
- `backend/profiles/` — auth, profiles, notifications
- `backend/system/` — offerings, enrollment, grades, reports
- `frontend/src/pages/` — role dashboards
- `frontend/src/services/api.jsx` — API client
