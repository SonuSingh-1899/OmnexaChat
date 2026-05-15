import { useEffect } from 'react';
import { API_BASE_URL, profileApi, session } from '../lib/api';

const PRESENCE_PING_INTERVAL = 20000;

const sendOfflineRequest = () => {
  const token = session.getToken();

  if (!token) {
    return;
  }

  void fetch(`${API_BASE_URL}/profile/presence/offline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    keepalive: true,
  }).catch((error) => {
    console.error('Failed to mark user offline', error);
  });
};

export default function usePresence(currentUser) {
  useEffect(() => {
    if (!currentUser || !session.getToken()) {
      return undefined;
    }

    const pingPresence = () => profileApi.pingPresence().catch((error) => {
      console.error('Failed to ping presence', error);
    });

    void pingPresence();

    const presenceTimer = window.setInterval(() => {
      void pingPresence();
    }, PRESENCE_PING_INTERVAL);

    window.addEventListener('pagehide', sendOfflineRequest);
    window.addEventListener('beforeunload', sendOfflineRequest);

    return () => {
      window.clearInterval(presenceTimer);
      window.removeEventListener('pagehide', sendOfflineRequest);
      window.removeEventListener('beforeunload', sendOfflineRequest);
    };
  }, [currentUser]);
}
