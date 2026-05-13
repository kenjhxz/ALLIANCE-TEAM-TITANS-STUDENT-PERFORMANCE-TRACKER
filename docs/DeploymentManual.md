# Student Performance Tracker — Deployment Manual

## Local Development (Windows)
### Backend
1. Open a terminal and go to `backend/`.
2. Create and activate a virtual environment.
3. Install dependencies from `requirements.txt`.
4. Run migrations and start the server.

### Frontend
1. Open another terminal and go to `frontend/`.
2. Install dependencies using npm.
3. Start the Vite dev server.

## Environment Variables (Backend)
Create `backend/.env` and set:
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `FRONTEND_URL`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`

## Production Notes
- Replace SQLite with PostgreSQL or MySQL.
- Set `DEBUG=False`.
- Configure `ALLOWED_HOSTS` for the deployment domain.
- Use a real SMTP provider for email.
- Serve the frontend with a production build (`npm run build`).

## Optional: Static Files
- Configure Django static files in `core/settings.py` for production.

## Smoke Checklist
- Login works for admin/teacher/student
- Enrollment flow works end‑to‑end
- Grade posting and viewing works
- Reports export functions work
- Notifications and audit logs load
