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

const normalizeUserProfile = (user) => {
  if (!user) {
    return user;
  }

  return {
    ...user,
    isVerified: Boolean(user.isVerified ?? user.verified),
    isActive: Boolean(user.isActive ?? user.active),
    isConnected: Boolean(user.isConnected ?? user.connected),
    isRequestSent: Boolean(user.isRequestSent ?? user.requestSent),
    isRequestReceived: Boolean(user.isRequestReceived ?? user.requestReceived),
    followersCount: user.followersCount ?? 0,
    followingCount: user.followingCount ?? 0,
  };
};

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
    return normalizeUserProfile(data);
  },
  update: async (payload) => {
    const { data } = await api.put('/profile/update', payload);
    return normalizeUserProfile(data);
  },
  changePassword: async (payload) => {
    const { data } = await api.post('/profile/change-password', payload);
    return data;
  },
  listUsers: async () => {
    const { data } = await api.get('/profile/users');
    return data.map(normalizeUserProfile);
  },
  listConnectedUsers: async () => {
    const { data } = await api.get('/profile/connections');
    return data.map(normalizeUserProfile);
  },
  searchUsers: async (query) => {
    const { data } = await api.get(`/profile/users/search?query=${encodeURIComponent(query)}`);
    return data.map(normalizeUserProfile);
  },
  listIncomingRequests: async () => {
    const { data } = await api.get('/profile/requests/incoming');
    return data.map(normalizeUserProfile);
  },
  sendFollowRequest: async (userId) => {
    const { data } = await api.post(`/profile/requests/${userId}`);
    return normalizeUserProfile(data);
  },
  acceptFollowRequest: async (userId) => {
    const { data } = await api.post(`/profile/requests/${userId}/accept`);
    return normalizeUserProfile(data);
  },

    // Unfollow a connected user
  unfollowUser: async (userId) => {
    const { data } = await api.delete(`/profile/users/${userId}/unfollow`);
    return data; // Returns { message: "Unfollowed successfully" }
  },
  
  // Reject a pending follow request
  rejectFollowRequest: async (requesterId) => {
    const { data } = await api.delete(`/profile/requests/${requesterId}/reject`);
    return data; // Returns { message: "Follow request rejected successfully" }
  },
  
  // Cancel your own sent follow request
  cancelSentRequest: async (targetId) => {
    const { data } = await api.delete(`/profile/requests/${targetId}/cancel`);
    return data; // Returns { message: "Follow request cancelled successfully" }
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
    const encodedEmail = encodeURIComponent(otherEmail);
    const { data } = await api.get(`/api/chat/conversation/${encodedEmail}`);
    return data;
  },
  sendMessage: async (payload) => {
    const { data } = await api.post('/api/chat/messages', payload);
    return data;
  },

  // lib/api.js - Add these methods to chatApi
  getConversation: async (otherEmail) => {
    const encodedEmail = encodeURIComponent(otherEmail);
    const { data } = await api.get(`/api/chat/conversation/${encodedEmail}`);
    return data;
  },
  sendMessage: async (payload) => {
    const { data } = await api.post('/api/chat/messages', payload);
    return data;
  },
  // Add these new methods
  markAsRead: async (senderEmail) => {
    const { data } = await api.post(`/api/chat/read/${senderEmail}`);
    return data;
  },
  getUnreadCount: async () => {
    const { data } = await api.get('/api/chat/unread/count');
    return data;
  },
  getUnreadCountsBySender: async () => {
    const { data } = await api.get('/api/chat/unread/by-sender');
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
