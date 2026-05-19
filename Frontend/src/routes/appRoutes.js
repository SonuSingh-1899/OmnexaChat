// Is file mein saare app URLs ek jagah define kiye gaye hain.
// Aage naya page banana ho to bas ROUTES mein naya path add karo.
// Example:
// chat: '/chat'
// profile: '/profile'
//
// Agar kisi dynamic route ki zarurat ho to helper bhi bana sakte ho, example:
// chatByUser: (email) => `/chat/${encodeURIComponent(email)}`

export const ROUTES = {
  login: '/login',
  signup: '/signup',
  otp: '/verify-otp',
  dashboard: '/dashboard',
  stories: '/stories',
  profile: '/profile',
  settings: '/settings',
  changePassword: '/change-password',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
};

// Public routes wo hain jo login se pehle bhi open ho sakte hain.
export const PUBLIC_ROUTES = new Set([
  ROUTES.login,
  ROUTES.signup,
  ROUTES.otp,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]);

export const KNOWN_ROUTES = new Set(Object.values(ROUTES));

export const PENDING_SIGNUP_KEY = 'pendingSignup';
export const PENDING_CHAT_USER_KEY = 'pendingChatUser';

export const getCurrentPath = () => window.location.pathname || '/';

export const navigateToPath = (path, { replace = false } = {}) => {
  if (window.location.pathname !== path) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
  }
};
