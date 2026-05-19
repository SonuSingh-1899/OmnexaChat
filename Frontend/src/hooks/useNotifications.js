import { useCallback, useEffect, useRef, useState } from 'react';
import { profileApi } from '../lib/api';

const NOTIFICATION_REFRESH_INTERVAL = 15000;

const getNotificationsStorageKey = (email) =>
  email ? `chatNotifications:${email}` : 'chatNotifications:guest';

const readStoredNotifications = (email) => {
  try {
    const storedValue = localStorage.getItem(getNotificationsStorageKey(email));
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.error('Failed to read notifications from storage:', error);
    localStorage.removeItem(getNotificationsStorageKey(email));
    return [];
  }
};

const sortNotifications = (notificationList) =>
  [...notificationList].sort(
    (firstNotification, secondNotification) =>
      new Date(secondNotification.createdAt).getTime() -
      new Date(firstNotification.createdAt).getTime()
  );

const createNotification = ({ id, type, userId, title, message }) => ({
  id,
  type,
  userId,
  title,
  message,
  createdAt: new Date().toISOString(),
  read: false,
});

export default function useNotifications({ user, onConnectionChange }) {
  const [notifications, setNotifications] = useState(() => readStoredNotifications(user?.email));
  const [pendingIncomingRequestIds, setPendingIncomingRequestIds] = useState([]);
  const previousOutgoingRequestIdsRef = useRef(new Set());

  useEffect(() => {
    localStorage.setItem(
      getNotificationsStorageKey(user?.email),
      JSON.stringify(sortNotifications(notifications))
    );
  }, [notifications, user?.email]);

  const refreshNotifications = useCallback(async () => {
    if (!user?.email) {
      setPendingIncomingRequestIds([]);
      previousOutgoingRequestIdsRef.current = new Set();
      return;
    }

    try {
      const [allUsers, incomingRequests] = await Promise.all([
        profileApi.listUsers(),
        profileApi.listIncomingRequests(),
      ]);

      setPendingIncomingRequestIds(incomingRequests.map((chatUser) => chatUser.id));

      setNotifications((currentNotifications) => {
        const nextNotifications = [...currentNotifications];
        const existingNotificationIds = new Set(
          currentNotifications.map((notification) => notification.id)
        );

        incomingRequests.forEach((chatUser) => {
          const notificationId = `incoming-request-${chatUser.id}`;

          if (!existingNotificationIds.has(notificationId)) {
            nextNotifications.unshift(
              createNotification({
                id: notificationId,
                type: 'incoming-request',
                userId: chatUser.id,
                title: `${chatUser.name} sent you a request`,
                message: `${chatUser.email} wants to connect with you.`,
              })
            );
            existingNotificationIds.add(notificationId);
          }
        });

        allUsers.forEach((chatUser) => {
          const acceptedNotificationId = `request-accepted-${chatUser.id}`;

          if (
            chatUser.isConnected &&
            previousOutgoingRequestIdsRef.current.has(chatUser.id) &&
            !existingNotificationIds.has(acceptedNotificationId)
          ) {
            nextNotifications.unshift(
              createNotification({
                id: acceptedNotificationId,
                type: 'request-accepted',
                userId: chatUser.id,
                title: `${chatUser.name} accepted your request`,
                message: 'You can start chatting now.',
              })
            );
            existingNotificationIds.add(acceptedNotificationId);
          }
        });

        return sortNotifications(nextNotifications);
      });

      previousOutgoingRequestIdsRef.current = new Set(
        allUsers
          .filter((chatUser) => chatUser.isRequestSent && !chatUser.isConnected)
          .map((chatUser) => chatUser.id)
      );
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    setNotifications(readStoredNotifications(user?.email));
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) {
      setPendingIncomingRequestIds([]);
      previousOutgoingRequestIdsRef.current = new Set();
      return undefined;
    }

    void refreshNotifications();

    const refreshTimer = window.setInterval(() => {
      void refreshNotifications();
    }, NOTIFICATION_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [refreshNotifications, user?.email]);

  const markAllAsRead = useCallback(() => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }, []);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId)
    );
  }, []);

  const acceptRequestFromNotification = useCallback(
    async (userId) => {
      await profileApi.acceptFollowRequest(userId);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.userId === userId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
      await onConnectionChange?.();
      await refreshNotifications();
    },
    [onConnectionChange, refreshNotifications]
  );

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
    pendingIncomingRequestIds,
    refreshNotifications,
    markAllAsRead,
    dismissNotification,
    acceptRequestFromNotification,
  };
}
