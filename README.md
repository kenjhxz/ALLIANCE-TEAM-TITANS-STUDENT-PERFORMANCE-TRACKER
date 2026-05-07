# Alliance Team Titans Student Performance Tracker

## Project Overview
The **Alliance Team Titans Student Performance Tracker** is a web application designed to help administrators, teachers, and students manage and track academic performance efficiently. The platform includes features for user authentication, student enrollment, discipline management, and performance tracking.

## Features
### Frontend
- Built with **React** and **Vite** for a fast and modern user interface.
- Pages include:
  - **Login** and **Sign Up** for user authentication.
  - **Admin Home**, **Teacher Home**, and **Student Home** for role-specific dashboards.
  - **Verify Email** for account verification.

### Backend
- Developed using **Django** for robust and scalable server-side logic.
- Features include:
  - User authentication and profile management.
  - Discipline and enrollment management.
  - API endpoints for frontend integration.

## Project Structure
### Frontend
```
frontend/
├── public/          # Static assets
├── src/
│   ├── assets/      # Images and other assets
│   ├── components/  # Reusable components
│   ├── pages/       # Page components
│   ├── services/    # API service files
│   ├── styles/      # CSS files
│   ├── App.jsx      # Main app component
│   ├── main.jsx     # Entry point
│   └── index.html   # HTML template
```

### Backend
```
backend/
├── core/            # Django project settings
├── profiles/        # User profile management
├── system/          # Discipline and enrollment management
├── db.sqlite3       # SQLite database (for development)
├── manage.py        # Django management script
```

## Installation
### Prerequisites
- **Python 3.9+** (for the backend)
- **Node.js 18+** and **npm** (for the frontend)
- A terminal for running the backend and frontend separately

### What To Install
Install these before running the app:
- Backend Python packages from `backend/requirements.txt`
- Frontend Node packages from `frontend/package.json` using `npm install`
- Optional but recommended: a Python virtual environment for the backend

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```

Backend package install command:
```bash
pip install -r requirements.txt
```

Backend explicit install (alternative):
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv python-decouple
```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

Frontend package install command:
```bash
npm install
```

Frontend explicit install (additional):
```bash
npm install axios
```

### Run The App
Use two terminals:
- Backend: `cd backend` then `python manage.py runserver`
- Frontend: `cd frontend` then `npm run dev`

If your team uses the seed data for testing:
```bash
cd backend
python scripts/seed_test_data.py
```

### Role-separated login flow
- The landing page now routes users to separate login links for:
   - Student login: `/login/student`
   - Professor login: `/login/teacher`
   - Admin login: `/login/admin`
- The general login page still exists at `/login`, but the dashboard-specific links are separated for cleaner navigation.

### Verified integration commands
The following scripts were run successfully during integration checks:
```bash
cd backend
python scripts/seed_test_data.py
python scripts/e2e_test.py
```

The end-to-end flow verified:
- professor login
- teacher offerings and enrollment roster lookup
- grade posting and editing
- student grade view
- CSV grade export

## Contributing
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-branch-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Description of changes"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-branch-name
   ```
5. Open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.