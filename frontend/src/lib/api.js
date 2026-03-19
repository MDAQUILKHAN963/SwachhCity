import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage'); // Clear Zustand persisted state
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Complaint API
export const complaintAPI = {
  submit: (formData) => api.post('/complaints/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  assign: (id, workerId) => api.post(`/complaints/${id}/assign`, { workerId }),
  analyze: (formData) => api.post('/complaints/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPublic: () => api.get('/complaints/public'),
};

// Worker API
export const workerAPI = {
  getMyAssignments: () => api.get('/workers/my-assignments'),
  getAssignments: (id) => api.get(`/workers/${id}/assignments`),
  updateAssignment: (id, data) => api.put(`/assignments/${id}/update`, data),
  getNearestWorker: (lat, lng) => api.get('/workers/nearest', { params: { lat, lng } }),
  getAvailable: () => api.get('/workers/available'),
};

// Location API
export const locationAPI = {
  getCities: () => api.get('/location/cities'),
  getCityDetails: (name) => api.get(`/location/cities/${name}`),
  reverseGeocode: (lat, lng) => api.get('/location/reverse-geocode', { params: { lat, lng } }),
  geocode: (address, city) => api.get('/location/geocode', { params: { address, city } }),
  searchPlaces: (query, city) => api.get('/location/search', { params: { q: query, city } }),
  getLocationPriority: (lat, lng) => api.get('/location/priority', { params: { lat, lng } }),
  getCityLocations: (name) => api.get(`/location/cities/${name}/locations`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getUserStats: () => api.get('/analytics/user-stats'),
  getMapData: () => api.get('/analytics/map-data'),
  getHotspots: () => api.get('/analytics/hotspots'),
  getPredictions: () => api.get('/analytics/predictions'),
  getLeaderboard: () => api.get('/analytics/leaderboard'),
  getWorkerPerformance: () => api.get('/analytics/worker-performance'),
};

export default api;
