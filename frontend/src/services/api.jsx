import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const publicRoutes = ['/auth/register/', '/auth/login/', '/auth/verify-email/'];
  const isPublic = publicRoutes.some(route => config.url?.startsWith(route));

  const token = localStorage.getItem('token');
  if (token && !isPublic) config.headers.Authorization = `Token ${token}`;

  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] ??= 'application/json';
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const register            = (payload)       => api.post('/auth/register/', payload);
export const verifyEmail         = (token)         => api.get(`/auth/verify-email/${token}/`);
export const login               = async (payload) => {
  const { data } = await api.post('/auth/login/', payload);
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};
export const logout              = async ()        => {
  await api.post('/auth/logout/');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
export const resendVerification  = (email)         => api.post('/auth/resend-verification/', { email });

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getMe               = ()              => api.get('/auth/me/');
export const updateMe            = (payload)       => api.patch('/auth/me/', payload);
export const updateFCMToken      = (fcmToken)      => api.patch('/auth/me/fcm-token/', { fcm_token: fcmToken });

// ── PROFILES ──────────────────────────────────────────────────────────────────
export const getStudentProfile    = ()        => api.get('/auth/profile/student/');
export const updateStudentProfile = (payload) => api.patch('/auth/profile/student/', payload);
export const getTeacherProfile    = ()        => api.get('/auth/profile/teacher/');
export const updateTeacherProfile = (payload) => api.patch('/auth/profile/teacher/', payload);
export const getAdminProfile      = ()        => api.get('/auth/profile/admin/');
export const updateAdminProfile   = (payload) => api.patch('/auth/profile/admin/', payload);

// ── SYSTEM: School setup ──────────────────────────────────────────────────────
export const addCollege               = (payload)   => api.post('/system/colleges/', payload);
export const fetchCollege             = ()          => api.get('/system/colleges/');
export const addDegreeProgram         = (payload)   => api.post('/system/programs/', payload);
export const fetchProgram             = (collegeId) => api.get(`/system/programs/?college=${collegeId || ''}`);
export const addDiscipline            = (payload)   => api.post('/system/disciplines/', payload);
export const fetchDiscipline          = (programId) => api.get(`/system/disciplines/?program=${programId || ''}`);
export const fetchDisciplineByCollege = (collegeId) => api.get(`/system/disciplines/?college=${collegeId || ''}`);
export const fetchSemesterLoads       = (programId) => api.get(`/system/semester-loads/?program=${programId || ''}`);
export const addSemesterLoad          = (payload)   => api.post('/system/semester-loads/', payload);

// ── SYSTEM: Academic Terms ────────────────────────────────────────────────────
export const fetchTerms   = ()            => api.get('/system/terms/');
export const createTerm   = (payload)     => api.post('/system/terms/', payload);
export const updateTerm   = (id, payload) => api.patch(`/system/terms/${id}/`, payload);

// ── SYSTEM: Offerings ─────────────────────────────────────────────────────────
export const fetchOfferings  = (params)  => api.get('/system/offerings/', { params });
export const createOffering  = (payload) => api.post('/system/offerings/', payload);

// ── SYSTEM: Enrollment (student) ─────────────────────────────────────────────
export const getMyProspectus         = ()               => api.get('/system/enrollment/request/');
export const submitDisciplineRequest = (discipline_ids) => api.post('/system/enrollment/request/', { discipline_ids });
export const getApprovedForSchedule  = ()               => api.get('/system/enrollment/schedule/');
export const selectSchedule          = (enrollment_id, offering_id) =>
  api.post('/system/enrollment/schedule/', { enrollment_id, offering_id });

// ── SYSTEM: Enrollment queue (admin) ─────────────────────────────────────────
export const getEnrollmentQueue       = (queueStatus)              => api.get('/system/enrollment/queue/', { params: { status: queueStatus } });
export const approveRejectEnrollments = (enrollment_ids, action)   => api.patch('/system/enrollment/queue/', { enrollment_ids, action });

// ── SYSTEM: Grades ────────────────────────────────────────────────────────────
export const getMyGrades   = ()              => api.get('/system/grades/mine/');
export const submitGrade   = (payload)       => api.post('/system/grades/', payload);
export const updateGrade   = (id, payload)   => api.patch(`/system/grades/${id}/`, payload);

// ── SYSTEM: Faculty & Students (admin) ───────────────────────────────────────
export const adminCreateTeacher       = (payload)     => api.post('/auth/admin/create-teacher/', payload);
export const fetchTeachers            = ()            => api.get('/auth/admin/teachers/');
export const updateTeacherDisciplines = (id, payload) => api.patch(`/auth/admin/teachers/${id}/`, payload);
export const adminCreateStudent       = (payload)     => api.post('/auth/admin/create-student/', payload);
export const fetchStudents            = ()            => api.get('/auth/admin/students/');