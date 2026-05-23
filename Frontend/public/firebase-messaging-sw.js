/* global importScripts, firebase */

importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDBVqDR7J-YiiULCt24kd86jZtqEP3WfqQ',
  authDomain: 'omnexa-26a79.firebaseapp.com',
  projectId: 'omnexa-26a79',
  storageBucket: 'omnexa-26a79.firebasestorage.app',
  messagingSenderId: '458613702242',
  appId: '1:458613702242:web:c8dbc3de2a8830303c5b3b',
  measurementId: 'G-97Q04BM2QD',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || `New message from ${data.senderName || 'Omnexa'}`;
  const body = notification.body || data.content || 'You have a new chat message.';
  const icon = notification.icon || '/icons/manifest-icon-192.maskable.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/icons/manifest-icon-192.maskable.png',
    tag: data.senderEmail ? `chat-${data.senderEmail}` : 'omnexa-chat-message',
    data: {
      url: data.url || '/dashboard',
      senderEmail: data.senderEmail || '',
      messageId: data.messageId || '',
    },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil((async () => {
    const allClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of allClients) {
      if ('focus' in client) {
        client.focus();
        client.postMessage({
          type: 'PUSH_NOTIFICATION_CLICK',
          url: targetUrl,
          senderEmail: event.notification.data?.senderEmail || '',
          messageId: event.notification.data?.messageId || '',
        });
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
