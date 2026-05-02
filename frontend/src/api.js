import axios from "axios";
const API_BASE = "http://127.0.0.1:8000/api";


const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('access');
    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.data.code === "token_not_valid" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/token/refresh/`, {
            refresh,
          });
          localStorage.setItem("access", res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest); 
        } catch (err) {
          localStorage.clear();
          window.location.href = "/"; 
        }
      } else {
        localStorage.clear();
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);


/*adding exports */
export const addCollege = async (college) => {
  return api.post("/colleges/", college);
};

export const addDegreeProgram = async (program) => {
  return api.post("/programs/", program);
};

export const addDiscipline = async (discipline) => {
  return api.post('/disciplines/', discipline);
};


export const addTeacher = async (teacher)=>{
  return api.post('/teachers/', teacher);
};

export const addStudent = async (student) => {
  return api.post('/students/', student);
};


/*fetching exports (see dev fallback implementations further below) */

export const fetchUsers = async () => {
  return api.get('/users/');
};

export const searchUsers = async (query) => {
  const q = (query || '').trim();
  if (!q) return api.get('/users/');
  return api.get(`/users/?search=${encodeURIComponent(q)}`);
};

/*grade exports */
export const addGrade = async (grade) => {
  return api.post('/grades/', grade);
};

export const fetchGrades = async () => {
  return api.get('/grades/');
};
// Development-friendly mock data fallback when backend is unavailable
export const DEV_MOCK = {
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

const withFallback = async (fn, fallback) => {
  try {
    return await fn();
  } catch (err) {
    console.warn('API call failed, using DEV_MOCK fallback', err);
    return { data: fallback };
  }
};

export const fetchFlags = async () => {
  return withFallback(() => api.get('/flags/'), DEV_MOCK.flags);
};

export const fetchCollege = async () => {
  return withFallback(() => api.get('/colleges/'), DEV_MOCK.colleges);
};

export const fetchProgram = async () => {
  return withFallback(() => api.get('/programs/'), DEV_MOCK.programs);
};

export const fetchDiscipline = async () => {
  return withFallback(() => api.get('/disciplines/'), DEV_MOCK.disciplines);
};

export const fetchTeacher = async () => {
  return withFallback(() => api.get('/teachers/'), DEV_MOCK.teachers);
};

export const fetchStudent = async () => {
  return withFallback(() => api.get('/students/'), DEV_MOCK.students);
};

// Flag action endpoints
export const resolveFlag = async (flagId) => {
  return api.post(`/flags/${flagId}/resolve/`);
};

export const dismissFlag = async (flagId) => {
  return api.post(`/flags/${flagId}/dismiss/`);
};

export const reviewFlag = async (flagId) => {
  return api.post(`/flags/${flagId}/review/`);
};