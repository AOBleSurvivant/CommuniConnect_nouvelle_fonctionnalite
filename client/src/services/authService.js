import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration axios avec intercepteur pour le token
const authAPI = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
authAPI.interceptors.request.use(
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

// Intercepteur pour gérer les erreurs de réponse
authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Inscription
  register: async (userData) => {
    const response = await authAPI.post('/register', userData);
    return response;
  },

  // Connexion
  login: async (credentials) => {
    const response = await authAPI.post('/login', credentials);
    return response;
  },

  // Déconnexion
  logout: async () => {
    const response = await authAPI.post('/logout');
    return response;
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser: async () => {
    const response = await authAPI.get('/me');
    return response;
  },

  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    const response = await authAPI.put('/profile', profileData);
    return response;
  },

  // Demande de réinitialisation de mot de passe
  forgotPassword: async (email) => {
    const response = await authAPI.post('/forgot-password', { email });
    return response;
  },

  // Réinitialisation de mot de passe
  resetPassword: async (token, password) => {
    const response = await authAPI.post(`/reset-password/${token}`, { password });
    return response;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Supprimer le token
  removeToken: () => {
    localStorage.removeItem('token');
  },
};

export default authService; 