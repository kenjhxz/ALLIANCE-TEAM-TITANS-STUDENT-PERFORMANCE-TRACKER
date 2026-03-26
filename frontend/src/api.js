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


/*fetching exports */
export const fetchCollege = async () => {
    return api.get('/colleges/');
};

export const fetchProgram = async () => {
  return api.get('/programs/');
};

export const fetchTeacher = async () => {
  return api.get('/teachers/');
};