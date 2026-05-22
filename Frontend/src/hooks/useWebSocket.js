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
  onReadReceipt,
}) => {
  const stompClientRef = useRef(null);
  const selectedUserEmailRef = useRef(selectedUserEmail);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onUserLastMessageUpdateRef = useRef(onUserLastMessageUpdate);
  const onReadReceiptRef = useRef(onReadReceipt);

  useEffect(() => {
    selectedUserEmailRef.current = selectedUserEmail;
  }, [selectedUserEmail]);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onUserLastMessageUpdateRef.current = onUserLastMessageUpdate;
  }, [onUserLastMessageUpdate]);

  useEffect(() => {
    onReadReceiptRef.current = onReadReceipt;
  }, [onReadReceipt]);

  // Function to send read receipt via WebSocket
  const sendReadReceipt = useCallback((senderEmail, messageId = null) => {
    const client = stompClientRef.current;
    if (!client || !client.connected || !currentUserEmail) {
      console.log('Cannot send read receipt - not connected');
      return false;
    }

    const receipt = {
      type: 'READ_RECEIPT',
      reader: currentUserEmail,
      sender: senderEmail,
      timestamp: new Date().toISOString(),
      ...(messageId && { messageId })
    };

    const destination = `/app/mark.read/${senderEmail}`;
    console.log('Sending read receipt to:', destination, receipt);
    
    try {
      client.publish({
        destination,
        body: JSON.stringify(receipt)
      });
      return true;
    } catch (error) {
      console.error('Failed to send read receipt:', error);
      return false;
    }
  }, [currentUserEmail]);

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
        console.log('WebSocket connected for:', currentUserEmail);
        
        client.subscribe(buildInboxDestination(currentUserEmail), (frame) => {
          try {
            const data = JSON.parse(frame.body);
            console.log('WebSocket message received:', data);
            
            if (data.type === 'READ_RECEIPT' || data.type === 'MESSAGE_READ') {
              console.log('Read receipt detected, calling handler');
              onReadReceiptRef.current?.(data);
            } else {
              onUserLastMessageUpdateRef.current(data);
              if (data.senderEmail === selectedUserEmailRef.current) {
                onMessageReceivedRef.current(data);
              }
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
        console.log('WebSocket disconnected');
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

  // Return sendReadReceipt function for use in components
  return { sendReadReceipt };
};

export default useWebSocket;