/**
 * Mock API Server for local development
 * Serves DEV_MOCK data as REST endpoints
 * Run: node mock-server.js
 * Access: http://127.0.0.1:8000/api/
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock data matching frontend/src/api.js DEV_MOCK
const mockData = {
  colleges: [
    { id: 1, name: 'College of Engineering', code: 'COE' },
    { id: 2, name: 'College of Education', code: 'COED' }
  ],
  programs: [
    { id: 1, name: 'Computer Science', college: 1 },
    { id: 2, name: 'Software Engineering', college: 1 },
    { id: 3, name: 'Education Major', college: 2 }
  ],
  disciplines: [
    { id: 1, name: 'CS101', program: 1 },
    { id: 2, name: 'CS301', program: 1 }
  ],
  students: [
    { id: 1, first_name: 'Jane', last_name: 'Doe', course: 1 },
    { id: 2, first_name: 'John', last_name: 'Smith', course: 2 }
  ],
  teachers: [
    { id: 1, first_name: 'Alice', last_name: 'Ng', department: 1 },
    { id: 2, first_name: 'Bob', last_name: 'Tan', department: 2 }
  ],
  flags: [
    { id: 1, title: 'Grade encoding error — COE · CS301', desc: 'Finals grades mismatch detected', meta: 'Today · System', action: 'Resolve' },
    { id: 2, title: 'Course overload request', desc: '3 students awaiting approval', meta: 'Yesterday · COED', action: 'Review' }
  ]
};

// Store flags in memory (for demo actions)
let flags = JSON.parse(JSON.stringify(mockData.flags));

// GET endpoints
app.get('/api/colleges/', (req, res) => {
  res.json(mockData.colleges);
});

app.get('/api/programs/', (req, res) => {
  res.json(mockData.programs);
});

app.get('/api/disciplines/', (req, res) => {
  res.json(mockData.disciplines);
});

app.get('/api/students/', (req, res) => {
  res.json(mockData.students);
});

app.get('/api/teachers/', (req, res) => {
  res.json(mockData.teachers);
});

app.get('/api/flags/', (req, res) => {
  res.json(flags);
});

// Mock login endpoint
app.post('/api/login/', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    res.json({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user_id: 1,
      is_admin: true,
      is_teacher: false,
      is_student: false,
      first_name: 'Super',
      last_name: 'Admin'
    });
  } else {
    res.status(400).json({ detail: 'Invalid credentials' });
  }
});

// Mock token refresh endpoint
app.post('/api/token/refresh/', (req, res) => {
  res.json({ access: 'mock-access-token-refreshed' });
});

// Flag actions (demo)
app.post('/api/flags/:id/resolve/', (req, res) => {
  const flag = flags.find(f => f.id === parseInt(req.params.id));
  if (flag) {
    res.json({ ...flag, status: 'resolved' });
  } else {
    res.status(404).json({ detail: 'Flag not found' });
  }
});

app.post('/api/flags/:id/dismiss/', (req, res) => {
  flags = flags.filter(f => f.id !== parseInt(req.params.id));
  res.json({ status: 'dismissed' });
});

app.post('/api/flags/:id/review/', (req, res) => {
  const flag = flags.find(f => f.id === parseInt(req.params.id));
  if (flag) {
    res.json({ ...flag, status: 'in_review' });
  } else {
    res.status(404).json({ detail: 'Flag not found' });
  }
});

const PORT = 8000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock API Server running at http://127.0.0.1:${PORT}/api/`);
  console.log('Endpoints: /api/colleges/, /api/programs/, /api/disciplines/, /api/students/, /api/teachers/, /api/flags/');
});
