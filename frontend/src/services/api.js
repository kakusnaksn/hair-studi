// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth calls
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);

// Service calls
export const getAllServices = () => apiClient.get('/services');

// Schedule/Availability calls
export const getAvailableSlots = (serviceId, date, stylistId = null) => {
  let queryString = `serviceId=${serviceId}&date=${date}`;
  if (stylistId) {
    queryString += `&stylistId=${stylistId}`;
  }
  return apiClient.get(`/schedules/availability?${queryString}`);
};

// Placeholder for submitting a booking later
// export const createAppointment = (bookingData) => apiClient.post('/appointments', bookingData);

// User profile (example, if/when needed)
// export const getUserProfile = () => apiClient.get('/users/me');
