import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { session, SOCKET_ENDPOINT_URL } from '../lib/api';

const buildInboxDestination = (email) => `/topic/messages/${email}`;

const useWebSocket = ({
  currentUserEmail,
  selectedUserEmail,
  onMessageReceived,
  onUserLastMessageUpdate,
}) => {
  const stompClientRef = useRef(null);
  const selectedUserEmailRef = useRef(selectedUserEmail);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onUserLastMessageUpdateRef = useRef(onUserLastMessageUpdate);

  useEffect(() => {
    selectedUserEmailRef.current = selectedUserEmail;
  }, [selectedUserEmail]);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onUserLastMessageUpdateRef.current = onUserLastMessageUpdate;
  }, [onUserLastMessageUpdate]);

  const connect = useCallback(() => {
    const token = session.getToken();

    if (!currentUserEmail) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_ENDPOINT_URL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe(buildInboxDestination(currentUserEmail), (frame) => {
          try {
            const message = JSON.parse(frame.body);
            onUserLastMessageUpdateRef.current(message);

            if (message.senderEmail === selectedUserEmailRef.current) {
              onMessageReceivedRef.current(message);
            }
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (err) => {
        console.error('WS error:', err);
      },
      onDisconnect: () => {
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [currentUserEmail]);

  useEffect(() => {
    if (!currentUserEmail) {
      return undefined;
    }

    connect();

    return () => {
      stompClientRef.current?.deactivate();
      stompClientRef.current = null;
    };
  }, [connect, currentUserEmail]);
};

export default useWebSocket;
