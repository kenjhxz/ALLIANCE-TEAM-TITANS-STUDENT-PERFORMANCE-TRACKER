 # Student Performance Tracker

A comprehensive web application for managing student grades and performance tracking, built with Django REST Framework (backend) and React (frontend).

## 🚀 Features

### User Management
- **Role-based Authentication**: Separate dashboards for Students, Teachers, and Admins
- **Secure Login**: JWT-based authentication with automatic token refresh
- **User Profiles**: Detailed user information with role-specific data

### Grade Management
- **Grade Entry**: Teachers can add grades for students in specific disciplines
- **Grade Viewing**: Students can view their grades and performance history
- **Grade Editing**: Teachers can update grades and add remarks
- **Real-time Updates**: Immediate reflection of grade changes

### Reporting System
- **Detailed Reports**: Comprehensive grade reports with GPA calculation
- **Printable Format**: Print-friendly reports with professional styling
- **Performance Analytics**: GPA and grade summaries

### Administrative Features
- **User Management**: Admins can manage students, teachers, and user accounts
- **Academic Structure**: Manage colleges, degree programs, disciplines
- **System Configuration**: Full control over academic data

## 🛠️ Tech Stack

### Backend
- **Django 6.0.3**: Web framework
- **Django REST Framework**: API development
- **Simple JWT**: Authentication
- **SQLite**: Database (development)
- **CORS Headers**: Cross-origin resource sharing

### Frontend
- **React 19.2.4**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors
- **React Scripts**: Build and development tools

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## 🚀 Installation & Setup

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kenjhxz/ALLIANCE-TEAM-TITANS-STUDENT-PERFORMANCE-TRACKER.git
   cd ALLIANCE-TEAM-TITANS-STUDENT-PERFORMANCE-TRACKER
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start Django server**
   ```bash
   python manage.py runserver
   ```
   Server will run on http://127.0.0.1:8000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start React development server**
   ```bash
   npm start
   ```
   Frontend will run on http://localhost:3000

### Quick commands (run from repo root)

You can run these helper scripts from the project root (recommended):

```powershell
npm run frontend:install   # installs dependencies in frontend/
npm run frontend:start     # starts the React dev server (frontend)
npm run frontend:build     # builds production bundle into frontend/build
npm run mock-server       # starts local mock API server (http://127.0.0.1:8000/api/)
```

Or run directly from the `frontend` folder:

```powershell
cd frontend
npm install
npm start
```

### Mock API Server (for local development)

For UI development without the backend Django server, run the mock API server:

```powershell
npm run mock-server
```

This starts a lightweight Express server that serves mock data for colleges, programs, disciplines, students, teachers, and flags. The frontend will automatically use this when running `npm run frontend:start`.

**In separate terminals:**
```powershell
# Terminal 1: Start mock API server
npm run mock-server

# Terminal 2: Start React dev server  
npm run frontend:start
```

Access the app at http://localhost:3000. Admin panel is at http://localhost:3000/admin-dashboard.
*** End Patch

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Database Configuration

For production, update `settings.py` to use PostgreSQL or another database:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/login/
Login endpoint for all user types.

**Request Body:**
```json
{
  "username": "student1",
  "password": "password123"
}
```

**Response:**
```json
{
  "refresh": "refresh_token",
  "access": "access_token",
  "user_id": 1,
  "is_teacher": false,
  "is_student": true,
  "is_admin": false,
  "first_name": "John",
  "last_name": "Doe",
  "profile": {...}
}
```

### Grade Management Endpoints

#### GET /api/grades/
Retrieve grades (filtered by user role)

#### POST /api/grades/
Add new grade (teacher/admin only)

**Request Body:**
```json
{
  "student": 1,
  "discipline": 1,
  "score": 95.5,
  "remarks": "Excellent work"
}
```

### Administrative Endpoints

#### GET/POST /api/students/
Manage students

#### GET/POST /api/teachers/
Manage teachers

#### GET/POST /api/colleges/
Manage colleges

#### GET/POST /api/programs/
Manage degree programs

#### GET/POST /api/disciplines/
Manage disciplines

## 🎯 Usage

### For Students
1. Login with student credentials
2. View grades on the dashboard
3. Access detailed reports with GPA calculation
4. Print reports for records

### For Teachers
1. Login with teacher credentials
2. Add new grades for students
3. View and edit existing grades
4. Manage student performance

### For Admins
1. Login with admin credentials
2. Manage users (students/teachers)
3. Configure academic structure
4. Access all system data

## 🧪 Testing

### Backend Tests
```bash
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set `DEBUG=False` in settings.py
2. Configure production database
3. Use a WSGI server like Gunicorn
4. Set up reverse proxy with Nginx

### Frontend Deployment
1. Build production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Serve static files from `build/` directory
3. Configure API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

**Alliance Team Titans**
- Project developed as part of academic coursework

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.
