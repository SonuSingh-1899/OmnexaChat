import { useCallback, useEffect, useState } from 'react';
import './App.css';
import ChangePassword from './components/ChangePassword';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import MobileBottomBar from './components/layout/MobileBottomBar';
import NotificationPanel from './components/layout/NotificationPanel';
import useNotifications from './hooks/useNotifications';
import usePresence from './hooks/usePresence';
import { FORGOT_PASSWORD_EMAIL_KEY, profileApi, session } from './lib/api';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Stories from './pages/Stories';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import {
  getCurrentPath,
  KNOWN_ROUTES,
  navigateToPath,
  PENDING_CHAT_USER_KEY,
  PENDING_SIGNUP_KEY,
  PUBLIC_ROUTES,
  ROUTES,
} from './routes/appRoutes';
import { DEFAULT_THEME_KEY, getTheme, THEME_OPTIONS, UI_THEME_KEY } from './theme/themeOptions';

const MOBILE_BREAKPOINT = 640;

const readStoredJson = (storage, key) => {
  try {
    const savedValue = storage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : null;
  } catch (error) {
    console.error(error);
    storage.removeItem(key);
    return null;
  }
};

const readStoredText = (storage, key) => {
  try {
    return storage.getItem(key) || '';
  } catch (error) {
    console.error(error);
    return '';
  }
};

const saveOrRemoveText = (storage, key, value) => {
  if (value) {
    storage.setItem(key, value);
    return;
  }

  storage.removeItem(key);
};

const saveOrRemoveJson = (storage, key, value) => {
  if (value) {
    storage.setItem(key, JSON.stringify(value));
    return;
  }

  storage.removeItem(key);
};

const getRedirectForGuest = (pathname, hasPendingSignup) => {
  const routeExists = pathname === '/' || KNOWN_ROUTES.has(pathname);

  if (pathname === ROUTES.otp && !hasPendingSignup) {
    return {
      nextPath: ROUTES.signup,
      notice: 'signup first to verify otp',
    };
  }

  if (!PUBLIC_ROUTES.has(pathname) || pathname === '/' || !routeExists) {
    return {
      nextPath: ROUTES.login,
      notice: pathname === ROUTES.dashboard ? 'login first' : '',
    };
  }

  return null;
};

const getRedirectForLoggedInUser = (pathname) => {
  const routeExists = pathname === '/' || KNOWN_ROUTES.has(pathname);

  if (PUBLIC_ROUTES.has(pathname) || pathname === ROUTES.dashboard || !routeExists) {
    return ROUTES.dashboard;
  }

  return null;
};

const App = () => {
  const [pathname, setPathname] = useState(getCurrentPath);
  const [isLoading, setIsLoading] = useState(() => Boolean(session.getToken()));
  const [isCompactMobile, setIsCompactMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [authNotice, setAuthNotice] = useState('');
  const [pendingSignup, setPendingSignup] = useState(() =>
    readStoredJson(sessionStorage, PENDING_SIGNUP_KEY)
  );
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(() =>
    readStoredText(sessionStorage, FORGOT_PASSWORD_EMAIL_KEY)
  );
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem(UI_THEME_KEY) || DEFAULT_THEME_KEY
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationActionUserId, setNotificationActionUserId] = useState(null);
  const [pendingChatUser, setPendingChatUser] = useState(() =>
    readStoredJson(sessionStorage, PENDING_CHAT_USER_KEY)
  );

  const currentTheme = getTheme(themeKey);

  const navigateTo = useCallback((path, { replace = false } = {}) => {
    navigateToPath(path, { replace });
    setPathname(path);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const userProfile = await profileApi.getMe();
    localStorage.setItem('user', JSON.stringify(userProfile));
    setCurrentUser(userProfile);
    return userProfile;
  }, []);

  const {
    notifications,
    unreadCount,
    pendingIncomingRequestIds,
    markAllAsRead,
    dismissNotification,
    acceptRequestFromNotification,
  } = useNotifications({
    user: currentUser,
    onConnectionChange: loadCurrentUser,
  });

  const restoreSession = useCallback(async () => {
    try {
      await loadCurrentUser();
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
  }, [loadCurrentUser, navigateTo]);

  usePresence(currentUser);

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
    const handleResize = () => {
      setIsCompactMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    saveOrRemoveJson(sessionStorage, PENDING_SIGNUP_KEY, pendingSignup);
  }, [pendingSignup]);

  useEffect(() => {
    saveOrRemoveJson(sessionStorage, PENDING_CHAT_USER_KEY, pendingChatUser);
  }, [pendingChatUser]);

  useEffect(() => {
    saveOrRemoveText(sessionStorage, FORGOT_PASSWORD_EMAIL_KEY, forgotPasswordEmail);
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
        await restoreSession();
      }
    };

    void syncSession();

    return () => {
      isCancelled = true;
    };
  }, [restoreSession]);

  useEffect(() => {
    if (isLoading) {
      return undefined;
    }

    const redirectPath = currentUser
      ? getRedirectForLoggedInUser(pathname)
      : getRedirectForGuest(pathname, Boolean(pendingSignup));

    if (!redirectPath) {
      return undefined;
    }

    const nextPath = typeof redirectPath === 'string' ? redirectPath : redirectPath.nextPath;
    const notice = typeof redirectPath === 'string' ? '' : redirectPath.notice;

    const redirectTimer = window.setTimeout(() => {
      if (notice) {
        setAuthNotice(notice);
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
    await restoreSession();
  };

  const handleLogout = async () => {
    try {
      await profileApi.markOffline();
    } catch (error) {
      console.error('Failed to mark user offline before logout', error);
    }

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

  const handleOpenNotifications = () => {
    markAllAsRead();
    setIsNotificationsOpen(true);
  };

  const handleCloseNotifications = () => {
    setIsNotificationsOpen(false);
  };

  const handleAcceptNotificationRequest = async (userId) => {
    if (notificationActionUserId) {
      return;
    }

    setNotificationActionUserId(userId);

    try {
      await acceptRequestFromNotification(userId);
      await loadCurrentUser();
    } catch (error) {
      console.error('Failed to accept request from notifications:', error);
    } finally {
      setNotificationActionUserId(null);
    }
  };

  const notificationPanel = currentUser ? (
    <NotificationPanel
      theme={currentTheme}
      isOpen={isNotificationsOpen}
      notifications={notifications}
      pendingIncomingRequestIds={pendingIncomingRequestIds}
      actionUserId={notificationActionUserId}
      onClose={handleCloseNotifications}
      onAcceptRequest={handleAcceptNotificationRequest}
      onDismissNotification={dismissNotification}
    />
  ) : null;

  const globalMobileBottomBar =
    isCompactMobile &&
    currentUser &&
    [ROUTES.profile, ROUTES.settings, ROUTES.stories].includes(pathname) ? (
      <MobileBottomBar
        theme={currentTheme}
        currentRoute={pathname}
        onNavigate={(route) => navigateTo(route)}
      />
    ) : null;

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
        notice={authNotice}
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => {
          setAuthNotice('');
          navigateTo(ROUTES.signup);
        }}
        onNavigateToForgotPassword={() => {
          setAuthNotice('');
          navigateTo(ROUTES.forgotPassword);
        }}
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
      <>
        <Dashboard
          theme={currentTheme}
          user={currentUser}
          pendingChatUser={pendingChatUser}
          onPendingChatUserHandled={() => setPendingChatUser(null)}
          notificationCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
          onNavigateToProfile={() => navigateTo(ROUTES.profile)}
          onNavigateToStories={() => navigateTo(ROUTES.stories)}
          onNavigateToSettings={() => navigateTo(ROUTES.settings)}
          onRefreshCurrentUser={loadCurrentUser}
        />
        {notificationPanel}
      </>
    );
  }

  
  if (pathname === ROUTES.search && currentUser) {
    return (
      <>
        <Search
          theme={currentTheme}
          user={currentUser}
          isCompactMobile={isCompactMobile}
          notificationCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
          onRefreshCurrentUser={loadCurrentUser}
          onOpenChatUser={(chatUser) => {
            setPendingChatUser(chatUser);
            navigateTo(ROUTES.dashboard);
          }}
          onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
        />
        {notificationPanel}
        {globalMobileBottomBar}
      </>
    );
  }

  if (pathname === ROUTES.stories && currentUser) {
    return (
      <>
        <Stories
          theme={currentTheme}
          isCompactMobile={isCompactMobile}
          notificationCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
          onRefreshCurrentUser={loadCurrentUser}
          onOpenChatUser={(chatUser) => {
            setPendingChatUser(chatUser);
            navigateTo(ROUTES.dashboard);
          }}
          onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
        />
        {notificationPanel}
        {globalMobileBottomBar}
      </>
    );
  }

  if (pathname === ROUTES.profile && currentUser) {
    return (
      <>
        <Profile
          theme={currentTheme}
          user={currentUser}
          isCompactMobile={isCompactMobile}
          notificationCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
          onUserUpdated={setCurrentUser}
          onLogout={handleLogout}
          onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
        />
        {notificationPanel}
        {globalMobileBottomBar}
      </>
    );
  }

  if (pathname === ROUTES.settings && currentUser) {
    return (
      <>
        <Settings
          theme={currentTheme}
          isCompactMobile={isCompactMobile}
          notificationCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
          currentThemeKey={themeKey}
          themeOptions={THEME_OPTIONS}
          onThemeChange={setThemeKey}
          onNavigateToDashboard={() => navigateTo(ROUTES.dashboard)}
          onNavigateToChangePassword={() => navigateTo(ROUTES.changePassword)}
        />
        {notificationPanel}
        {globalMobileBottomBar}
      </>
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
