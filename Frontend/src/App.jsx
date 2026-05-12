// App.jsx
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ChangePassword from './components/ChangePassword';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { FORGOT_PASSWORD_EMAIL_KEY, profileApi, session } from './lib/api';
import {
  getCurrentPath,
  KNOWN_ROUTES,
  navigateToPath,
  PENDING_SIGNUP_KEY,
  PUBLIC_ROUTES,
  ROUTES,
} from './routes/appRoutes';

const UI_THEME_KEY = 'uiTheme';

const THEME_OPTIONS = {
  sand: {
    key: 'sand',
    label: 'Warm Sand',
    pageBackground: '#f5f3ef',
    surface: '#ffffff',
    subtle: '#faf7f2',
    border: '#e8e0d6',
    accent: '#111111',
    accentText: '#ffffff',
    muted: '#8d8479',
    text: '#111111',
    shadow: 'rgba(24, 18, 12, 0.08)',
  },
  ocean: {
    key: 'ocean',
    label: 'Ocean Blue',
    pageBackground: '#eef4ff',
    surface: '#ffffff',
    subtle: '#f5f8ff',
    border: '#d8e3fb',
    accent: '#3157d5',
    accentText: '#ffffff',
    muted: '#6f7da8',
    text: '#17213f',
    shadow: 'rgba(49, 87, 213, 0.12)',
  },
  forest: {
    key: 'forest',
    label: 'Forest Green',
    pageBackground: '#eef6f0',
    surface: '#ffffff',
    subtle: '#f5fbf6',
    border: '#d7e7d9',
    accent: '#2d7a4e',
    accentText: '#ffffff',
    muted: '#6d8673',
    text: '#173222',
    shadow: 'rgba(45, 122, 78, 0.12)',
  },
};

const App = () => {
  console.log(import.meta.env.VITE_API_BASE_URL);
  const [pathname, setPathname] = useState(getCurrentPath);
  const [isLoading, setIsLoading] = useState(() => Boolean(session.getToken()));
  const [pendingSignup, setPendingSignup] = useState(() => {
    try {
      const storedSignup = sessionStorage.getItem(PENDING_SIGNUP_KEY);
      return storedSignup ? JSON.parse(storedSignup) : null;
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem(PENDING_SIGNUP_KEY);
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [authNotice, setAuthNotice] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(() => {
    try {
      return sessionStorage.getItem(FORGOT_PASSWORD_EMAIL_KEY) || '';
    } catch (error) {
      console.error(error);
      return '';
    }
  });
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem(UI_THEME_KEY) || 'sand');
  const currentTheme = THEME_OPTIONS[themeKey] || THEME_OPTIONS.sand;

  const navigateTo = useCallback((path, { replace = false } = {}) => {
    navigateToPath(path, { replace });
    setPathname(path);
  }, []);

  const hydrateSession = useCallback(async () => {
    try {
      const user = await profileApi.getMe();
      console.log("GET ME RESPONSE:", user);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      setAuthNotice('');
      navigateTo(ROUTES.dashboard, { replace: true });
    } catch (error) {
      console.error(error);
      session.clear();
      setCurrentUser(null);
      setAuthNotice('login first');
      navigateTo(ROUTES.login, { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigateTo]);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (pendingSignup) {
      sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pendingSignup));
      return;
    }

    sessionStorage.removeItem(PENDING_SIGNUP_KEY);
  }, [pendingSignup]);

  useEffect(() => {
    if (forgotPasswordEmail) {
      sessionStorage.setItem(FORGOT_PASSWORD_EMAIL_KEY, forgotPasswordEmail);
      return;
    }

    sessionStorage.removeItem(FORGOT_PASSWORD_EMAIL_KEY);
  }, [forgotPasswordEmail]);

  useEffect(() => {
    localStorage.setItem(UI_THEME_KEY, themeKey);
  }, [themeKey]);

  useEffect(() => {
    if (!session.getToken()) {
      setIsLoading(false);
      return undefined;
    }

    let isCancelled = false;

    const syncSession = async () => {
      if (!isCancelled) {
        await hydrateSession();
      }
    };

    void syncSession();

    return () => {
      isCancelled = true;
    };
  }, [hydrateSession]);

  useEffect(() => {
    if (isLoading) {
      return undefined;
    }

    let nextPath = null;
    let nextNotice = '';
    const isKnownPath = pathname === '/' || KNOWN_ROUTES.has(pathname);

    if (currentUser) {
      if (PUBLIC_ROUTES.has(pathname) || pathname === ROUTES.dashboard) {
        nextPath = ROUTES.dashboard;
      } else if (!isKnownPath) {
        nextPath = ROUTES.dashboard;
      }
    } else if (pathname === '/' || pathname === ROUTES.dashboard || !isKnownPath) {
      if (pathname === ROUTES.dashboard) {
        nextNotice = 'login first';
      }
      nextPath = ROUTES.login;
    } else if (!PUBLIC_ROUTES.has(pathname)) {
      nextPath = ROUTES.login;
    } else if (pathname === ROUTES.otp && !pendingSignup) {
      nextNotice = 'signup first to verify otp';
      nextPath = ROUTES.signup;
    }

    if (!nextPath && !nextNotice) {
      return undefined;
    }

    const redirectTimer = window.setTimeout(() => {
      if (nextNotice) {
        setAuthNotice(nextNotice);
      }

      if (nextPath) {
        navigateTo(nextPath, { replace: true });
      }
    }, 0);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [currentUser, isLoading, navigateTo, pathname, pendingSignup]);

  const handleLoginSuccess = async (token) => {
    session.setToken(token);
    await hydrateSession();
  };

  const handleLogout = () => {
    session.clear();
    setCurrentUser(null);
    setPendingSignup(null);
    setForgotPasswordEmail('');
    setAuthNotice('you are logged out');
    navigateTo(ROUTES.login, { replace: true });
  };

  const handleRegistrationSuccess = () => {
    setPendingSignup(null);
    setAuthNotice('Account created! Please login to your account');
    navigateTo(ROUTES.login, { replace: true });

  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-50 via-stone-100 to-stone-200 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-stone-200">
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">Chat Application</p>
          <h1 className="text-xl font-serif text-stone-800 mb-2">Preparing your workspace</h1>
          <p className="text-sm text-stone-400">checking session ...........</p>
        </div>
      </div>
    );
  }

  if (pathname === ROUTES.login) {
    return (
      <Login
        onNavigateToSignup={() => {
          setAuthNotice('');
          navigateTo(ROUTES.signup);
        }}
        onNavigateToForgotPassword={() => {
          setAuthNotice('');
          navigateTo(ROUTES.forgotPassword);
        }}
        onLoginSuccess={handleLoginSuccess}
        notice={authNotice}
      />
    );
  }

  if (pathname === ROUTES.signup) {
    return (
      <Signup
        onNavigateToLogin={() => {
          setAuthNotice('');
          navigateTo(ROUTES.login);
        }}
        onNavigateToForgotPassword={() => {
          setAuthNotice('');
          navigateTo(ROUTES.forgotPassword);
        }}
        onNavigateToOtp={(signupData) => {
          setPendingSignup(signupData);
          navigateTo(ROUTES.otp);
        }}
      />
    );
  }

  if (pathname === ROUTES.otp) {
    return (
      <VerifyOtp
        signupData={pendingSignup}
        onNavigateToLogin={() => navigateTo(ROUTES.login)}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    );
  }

  if (pathname === ROUTES.forgotPassword) {
    return (
      <ForgotPassword
        onOtpSent={(email) => {
          setForgotPasswordEmail(email);
          navigateTo(ROUTES.resetPassword);
        }}
        onNavigateToLogin={() => navigateTo(ROUTES.login)}
      />
    );
  }

  if (pathname === ROUTES.resetPassword) {
    return (
      <ResetPassword
        email={forgotPasswordEmail}
        onNavigateToForgotPassword={() => {
          setForgotPasswordEmail('');
          navigateTo(ROUTES.forgotPassword);
        }}
        onNavigateToLogin={() => {
          setForgotPasswordEmail('');
          navigateTo(ROUTES.login);
        }}
      />
    );
  }

  if (pathname === ROUTES.dashboard && currentUser) {
    return (
      <Dashboard
        theme={currentTheme}
        user={currentUser}
        onUserUpdated={setCurrentUser}
        onLogout={handleLogout}
        onNavigateToProfile={() => navigateTo(ROUTES.profile)}
        onNavigateToSettings={() => navigateTo(ROUTES.settings)}
      />
    );
  }

  if (pathname === ROUTES.profile && currentUser) {
    return (
      <Profile
        user={currentUser}
        onUserUpdated={setCurrentUser}
        onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
      />
    );
  }

  if (pathname === ROUTES.settings && currentUser) {
    return (
      <Settings
        theme={currentTheme}
        currentThemeKey={themeKey}
        themeOptions={THEME_OPTIONS}
        onThemeChange={setThemeKey}
        onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
        onNavigateToChangePassword={() => navigateTo(ROUTES.changePassword)}
      />
    );
  }

  if (pathname === ROUTES.changePassword && currentUser) {
    return (
      <ChangePassword
        theme={currentTheme}
        onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
        onSuccess={() => {
          setAuthNotice('Password changed successfully! Please login again.');
          session.clear();
          setCurrentUser(null);
          navigateTo(ROUTES.login);
        }}
      />
    );
  }

  return null;
};

export default App;