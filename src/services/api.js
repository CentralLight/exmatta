// API Service per la comunicazione con il backend
const API_BASE_URL = 'http://localhost:3001/api';

// Utility per le chiamate HTTP
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      ...options.headers,
    },
    ...options,
  };

  // Aggiungi token di autenticazione se presente
  const token = localStorage.getItem('adminToken');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  // Se non stiamo inviando FormData, imposta Content-Type JSON e serializza i dati
  if (!(options.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json';
    if (options.body) {
      defaultOptions.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Metodi HTTP
export const api = {
  get: (endpoint) => apiCall(endpoint),
  
  post: (endpoint, data) => apiCall(endpoint, {
    method: 'POST',
    body: data, // Passa direttamente il body senza serializzarlo
  }),
  
  put: (endpoint, data) => apiCall(endpoint, {
    method: 'PUT',
    body: data, // Passa direttamente il body senza serializzarlo
  }),
  
  delete: (endpoint) => apiCall(endpoint, {
    method: 'DELETE',
  }),
};

// Servizi specifici per dominio
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

export const newsService = {
  getAll: () => api.get('/news/all'),
  getPublished: () => api.get('/news'),
  getById: (id) => api.get(`/news/${id}`),
  create: (newsData) => api.post('/news', newsData),
  update: (id, newsData) => api.put(`/news/${id}`, newsData),
  updateStatus: (id, status) => api.put(`/news/${id}/status`, { stato: status }),
  delete: (id) => api.delete(`/news/${id}`),
  getStats: () => api.get('/news/stats'),
};

export const courseService = {
  getAll: () => api.get('/courses'),
  getStats: () => api.get('/courses/stats'),
  create: (courseData) => api.post('/courses', courseData),
  updateStatus: (id, status) => api.put(`/courses/${id}/status`, { status }),
  updateDetails: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const bookingService = {
  // Get all bookings (admin only)
  getAll: () => api.get('/bookings'),
  
  // Check availability for a specific date
  checkAvailability: (date, startTime, duration) => 
    api.get(`/bookings/available/${date}`),
  
  // Create new booking
  create: (bookingData) => api.post('/bookings', bookingData),
  
  // Update booking status
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  
  // Update booking details
  update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  
  // Delete booking
  delete: (id) => api.delete(`/bookings/${id}`),
  
  // Get bookings for a specific client
  getClientBookings: (email) => api.get(`/bookings/client/${email}`),
  
  // Get all bookings for a specific date
  getDateBookings: (date) => api.get(`/bookings/date/${date}`),
  
  // Get booking statistics
  getStats: () => api.get('/bookings/stats/overview'),
  
  // Utility functions
  formatDate: (date) => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  },
  
  formatTime: (time) => {
    if (typeof time === 'string') {
      return time;
    }
    return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
  },
  
  validateBookingData: (data) => {
    const errors = [];
    
    if (!data.date) errors.push('Data è richiesta');
    if (!data.start_time) errors.push('Orario di inizio è richiesto');
    if (!data.duration) errors.push('Durata è richiesta');
    if (!data.band_name) errors.push('Nome band è richiesto');
    if (!data.email) errors.push('Email è richiesta');
    
    if (data.duration && ![1, 2, 3, 4].includes(data.duration)) {
      errors.push('Durata deve essere 1, 2, 3 o 4 ore');
    }
    
    if (data.members_count && (data.members_count < 1 || data.members_count > 6)) {
      errors.push('Numero componenti deve essere tra 1 e 6');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email non valida');
    }
    
    return errors;
  }
};

export const emailService = {
  getStats: () => api.get('/email/stats')
};

export const exportService = {
  exportBookings: () => fetch(`${API_BASE_URL}/export/bookings`).then(res => res.text()),
  exportCourses: () => fetch(`${API_BASE_URL}/export/courses`).then(res => res.text()),
  exportNews: () => fetch(`${API_BASE_URL}/export/news`).then(res => res.text()),
  exportAll: () => fetch(`${API_BASE_URL}/export/all`).then(res => res.json())
};

export const backupService = {
  createBackup: () => {
    const link = document.createElement('a')
    link.href = `${API_BASE_URL}/backup/database`
    link.download = `ariaperta_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return Promise.resolve()
  },
  getStatus: () => api.get('/backup/status')
};

export default api;
