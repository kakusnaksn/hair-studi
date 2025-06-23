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

// Appointment calls
export const createAppointment = (bookingData) => {
  // Ensure bookingData includes: serviceId, stylistId, appointmentDateTime (ISO string), notes (optional)
  return apiClient.post('/appointments', bookingData);
};

export const getMyAppointments = () => {
  // This backend route GET /api/appointments/my-appointments needs to be created
  return apiClient.get('/appointments/my-appointments');
};

// Stylist specific calls
export const getStylistMySchedule = () => {
  return apiClient.get('/schedules/stylist/me'); // Endpoint created in previous backend step
};

// Admin specific calls
export const createStylistByAdmin = (stylistData) => {
  return apiClient.post('/admin/stylists', stylistData); // Endpoint from previous backend step
};

// User profile (example, if/when needed)
// export const getUserProfile = () => apiClient.get('/users/me');
