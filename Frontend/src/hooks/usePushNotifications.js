import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteToken, getToken, onMessage } from 'firebase/messaging';
import { pushApi } from '../lib/api';
import { FIREBASE_VAPID_KEY, getFirebaseMessaging } from '../lib/firebase';

const MESSAGING_SW_URL = '/firebase-messaging-sw.js';
const MESSAGING_SW_SCOPE = '/firebase-cloud-messaging-push-scope';
const TOKEN_STORAGE_KEY = 'pushNotificationToken';

const getDismissKey = (email) => `pushNotificationPromptDismissed:${email || 'guest'}`;

const readStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch (error) {
    console.error('Failed to read stored push token:', error);
    return '';
  }
};

const writeStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to persist push token:', error);
  }
};

const readDismissedPrompt = (email) => {
  try {
    return localStorage.getItem(getDismissKey(email)) === 'true';
  } catch (error) {
    console.error('Failed to read push prompt state:', error);
    return false;
  }
};

const writeDismissedPrompt = (email, dismissed) => {
  try {
    if (!email) {
      return;
    }

    if (dismissed) {
      localStorage.setItem(getDismissKey(email), 'true');
    } else {
      localStorage.removeItem(getDismissKey(email));
    }
  } catch (error) {
    console.error('Failed to store push prompt state:', error);
  }
};

const canUsePushNotifications = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'Notification' in window &&
  'serviceWorker' in navigator;

const ensureMessagingServiceWorker = async () => {
  const existingRegistration = await navigator.serviceWorker.getRegistration(MESSAGING_SW_SCOPE);
  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register(MESSAGING_SW_URL, {
    scope: MESSAGING_SW_SCOPE,
  });
};

export default function usePushNotifications({ user }) {
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [isSupported, setIsSupported] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastForegroundMessage, setLastForegroundMessage] = useState(null);
  const [promptDismissed, setPromptDismissed] = useState(() => readDismissedPrompt(user?.email));

  useEffect(() => {
    setPromptDismissed(readDismissedPrompt(user?.email));
  }, [user?.email]);

  useEffect(() => {
    let isMounted = true;

    const detectSupport = async () => {
      if (!canUsePushNotifications()) {
        if (isMounted) {
          setIsSupported(false);
        }
        return;
      }

      const messaging = await getFirebaseMessaging();
      if (isMounted) {
        setIsSupported(Boolean(messaging));
      }
    };

    void detectSupport();

    return () => {
      isMounted = false;
    };
  }, []);

  const syncPushToken = useCallback(async () => {
    if (!user?.email || permission !== 'granted' || !isSupported) {
      return '';
    }

    setIsSyncing(true);

    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        return '';
      }

      const serviceWorkerRegistration = await ensureMessagingServiceWorker();
      const currentToken = await getToken(messaging, {
        vapidKey: FIREBASE_VAPID_KEY,
        serviceWorkerRegistration,
      });

      if (!currentToken) {
        return '';
      }

      await pushApi.registerToken({
        token: currentToken,
        userAgent: navigator.userAgent,
      });

      writeStoredToken(currentToken);
      writeDismissedPrompt(user.email, false);
      setPromptDismissed(false);
      return currentToken;
    } catch (error) {
      console.error('Failed to sync push notification token:', error);
      return '';
    } finally {
      setIsSyncing(false);
    }
  }, [isSupported, permission, user?.email]);

  const enableNotifications = useCallback(async () => {
    if (!canUsePushNotifications()) {
      return false;
    }

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        return false;
      }

      const token = await syncPushToken();
      return Boolean(token);
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }, [syncPushToken]);

  const unregisterCurrentDevice = useCallback(async () => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      return;
    }

    try {
      await pushApi.unregisterToken(storedToken);
    } catch (error) {
      console.error('Failed to remove push token from backend:', error);
    }

    try {
      const messaging = await getFirebaseMessaging();
      if (messaging) {
        await deleteToken(messaging);
      }
    } catch (error) {
      console.error('Failed to delete browser push token:', error);
    } finally {
      writeStoredToken('');
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    if (!user?.email) {
      return;
    }

    writeDismissedPrompt(user.email, true);
    setPromptDismissed(true);
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email || permission !== 'granted' || !isSupported) {
      return undefined;
    }

    void syncPushToken();

    return undefined;
  }, [isSupported, permission, syncPushToken, user?.email]);

  useEffect(() => {
    if (!user?.email || permission !== 'granted' || !isSupported) {
      return undefined;
    }

    let unsubscribe = () => {};

    const bindForegroundListener = async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        return;
      }

      unsubscribe = onMessage(messaging, (payload) => {
        setLastForegroundMessage(payload);
      });
    };

    void bindForegroundListener();

    return () => {
      unsubscribe();
    };
  }, [isSupported, permission, user?.email]);

  const shouldShowPrompt = useMemo(
    () => Boolean(user?.email) && isSupported && permission === 'default' && !promptDismissed,
    [isSupported, permission, promptDismissed, user?.email]
  );

  return {
    enableNotifications,
    unregisterCurrentDevice,
    dismissPrompt,
    shouldShowPrompt,
    permission,
    isSupported,
    isSyncing,
    lastForegroundMessage,
  };
}
