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
  getByUserId: (userId) => api.get(`/students/user/${userId}`),
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
  updateStatus: (resultId, status, approved_by) =>
    api.put(`/results/${resultId}/status`, { status, approved_by }),
};

// Users API (for admin)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Classes API
export const classesAPI = {
  getAll: (params = {}) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (classId, data) => api.put(`/classes/${classId}`, data),
  delete: (classId) => api.delete(`/classes/${classId}`),
  addSubject: (classId, data) => api.post(`/classes/${classId}/subjects`, data),
  removeSubject: (classId, subjectId) => api.delete(`/classes/${classId}/subjects/${subjectId}`),
  updateSubject: (classId, subjectId, data) => api.put(`/classes/${classId}/subjects/${subjectId}`, data),
  assignTeacher: (classId, teacherId, role = 'assigned') => api.post(`/classes/${classId}/assign-teacher`, { teacherId, role }),
  removeTeacher: (classId, teacherId, role = 'assigned') => api.delete(`/classes/${classId}/remove-teacher/${teacherId}`, { params: { role } }),
  addSemester: (classId, data) => api.post(`/classes/${classId}/semesters`, data),
  updateSemester: (classId, semesterId, data) => api.put(`/classes/${classId}/semesters/${semesterId}`, data),
  removeSemester: (classId, semesterId) => api.delete(`/classes/${classId}/semesters/${semesterId}`),
};

// Feedback API
export const feedbackAPI = {
  getByStudent: (studentId) => api.get(`/feedback/student/${studentId}`),
  create: (data) => api.post('/feedback', data),
};

// Queries API (student-to-teacher queries)
export const queriesAPI = {
  create: (data) => api.post('/queries', data),
  getByStudent: (studentId) => api.get(`/queries/student/${studentId}`),
};

// Notifications API
export const notificationsAPI = {
  getByStudent: (studentId) => api.get(`/notifications/student/${studentId}`),
  create: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Grading Schema API
export const gradingSchemaAPI = {
  getAll: () => api.get('/grading-schemas'),
  getActive: () => api.get('/grading-schemas/active'),
  getById: (id) => api.get(`/grading-schemas/${id}`),
  create: (data) => api.post('/grading-schemas', data),
  update: (id, data) => api.put(`/grading-schemas/${id}`, data),
  delete: (id) => api.delete(`/grading-schemas/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getClassPerformance: (semester) => {
    const params = semester ? { semester } : {};
    return api.get('/analytics/class-performance', { params });
  },
  getSubjectAnalysis: (semester) => {
    const params = semester ? { semester } : {};
    return api.get('/analytics/subject-analysis', { params });
  },
  getRankings: (semester, className) => {
    const params = {};
    if (semester) params.semester = semester;
    if (className) params.class = className;
    return api.get('/analytics/rankings', { params });
  },
  getToppers: (limit = 10, semester) => {
    const params = { limit };
    if (semester) params.semester = semester;
    return api.get('/analytics/toppers', { params });
  },
  getPassFail: (semester, className) => {
    const params = {};
    if (semester) params.semester = semester;
    if (className) params.class = className;
    return api.get('/analytics/pass-fail', { params });
  },
};

export default api;
