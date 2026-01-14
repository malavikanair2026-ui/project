import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// Students API
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Marks API
export const marksAPI = {
  getByStudent: (studentId, semester) => {
    const params = semester ? { semester } : {};
    return api.get(`/marks/${studentId}`, { params });
  },
  add: (studentId, data) => api.post(`/marks/${studentId}`, data),
};

// Results API
export const resultsAPI = {
  getAll: () => api.get('/results'),
  getByStudent: (studentId, semester) => {
    const params = semester ? { semester } : {};
    return api.get(`/results/${studentId}`, { params });
  },
  calculate: (studentId, semester) => api.post(`/results/calculate/${studentId}`, { semester }),
};

// Classes API
export const classesAPI = {
  getAll: () => api.get('/classes'),
  create: (data) => api.post('/classes', data),
  addSubject: (classId, data) => api.post(`/classes/${classId}/subjects`, data),
  update: (classId, data) => api.put(`/classes/${classId}`, data),
};

export default api;
