// lib/api.js - Check karo ki ye functions sahi hain
import axios from 'axios';

const TOKEN_KEY = 'token';
const trimTrailingSlash = (value) => value?.replace(/\/+$/, '');
const getRequiredEnv = (key) => {
  const value = trimTrailingSlash(import.meta.env[key]);

  if (!value) {
    throw new Error(`${key} is required. Set it in your Vercel or local env configuration.`);
  }

  return value;
};

export const API_BASE_URL = getRequiredEnv('VITE_API_BASE_URL');
export const SOCKET_BASE_URL = getRequiredEnv('VITE_SOCKET_BASE_URL');
export const SOCKET_ENDPOINT_URL = `${SOCKET_BASE_URL}/ws`;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const FORGOT_PASSWORD_EMAIL_KEY = 'forgotPasswordEmail';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  sendOtp: async (email) => {
    const { data } = await api.post('/auth/send-otp', { email });
    return data;
  },
  verifyOtp: async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    return data;
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
};

export const profileApi = {
  getMe: async () => {
    const { data } = await api.get('/profile/me');
    return data;
  },
  update: async (payload) => {
    const { data } = await api.put('/profile/update', payload);
    return data;
  },
  changePassword: async (payload) => {
    const { data } = await api.post('/profile/change-password', payload);
    return data;
  },
  listUsers: async () => {
    const { data } = await api.get('/profile/users');
    return data;
  },
  pingPresence: async () => {
    const { data } = await api.post('/profile/presence/ping');
    return data;
  },
  markOffline: async () => {
    const { data } = await api.post('/profile/presence/offline');
    return data;
  },
  forgotPassword: async (email) => {
    const { data } = await api.post(`/profile/forgot-password?email=${encodeURIComponent(email)}`);
    return data;
  },
  resetPassword: async (email, otp, newPassword) => {
    const { data } = await api.post(
      `/profile/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&newPassword=${encodeURIComponent(newPassword)}`
    );
    return data;
  },
};

export const chatApi = {
  getConversation: async (otherEmail) => {
    // Ensure email is properly encoded
    const encodedEmail = encodeURIComponent(otherEmail);
    console.log('Fetching conversation for:', otherEmail, 'Encoded:', encodedEmail);
    const { data } = await api.get(`/api/chat/conversation/${encodedEmail}`);
    return data;
  },
  sendMessage: async (payload) => {
    const { data } = await api.post('/api/chat/messages', payload);
    return data;
  },
};

export const session = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user');
  },
};
