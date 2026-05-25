import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { session, SOCKET_ENDPOINT_URL } from '../lib/api';

const buildInboxDestination = (email) => `/topic/messages/${email}`;

const useWebSocket = ({
  currentUserEmail,
  selectedUserEmail,
  onMessageReceived,
  onMessageEnvelope,
  onUserLastMessageUpdate,
  onReadReceipt,
  onUnreadCountUpdate,
  onMessageEdited,
  onMessageDeleted,
  onTypingStatus,
}) => {
  const stompClientRef = useRef(null);
  const selectedUserEmailRef = useRef(selectedUserEmail);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onMessageEnvelopeRef = useRef(onMessageEnvelope);
  const onUserLastMessageUpdateRef = useRef(onUserLastMessageUpdate);
  const onReadReceiptRef = useRef(onReadReceipt);
  const onUnreadCountUpdateRef = useRef(onUnreadCountUpdate);
  const onMessageEditedRef = useRef(onMessageEdited);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onTypingStatusRef = useRef(onTypingStatus);

  useEffect(() => {
    selectedUserEmailRef.current = selectedUserEmail;
  }, [selectedUserEmail]);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    onMessageEnvelopeRef.current = onMessageEnvelope;
  }, [onMessageEnvelope]);

  useEffect(() => {
    onUserLastMessageUpdateRef.current = onUserLastMessageUpdate;
  }, [onUserLastMessageUpdate]);

  useEffect(() => {
    onReadReceiptRef.current = onReadReceipt;
  }, [onReadReceipt]);

  useEffect(() => {
    onUnreadCountUpdateRef.current = onUnreadCountUpdate;
  }, [onUnreadCountUpdate]);

  useEffect(() => {
    onMessageEditedRef.current = onMessageEdited;
  }, [onMessageEdited]);

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

  useEffect(() => {
    onTypingStatusRef.current = onTypingStatus;
  }, [onTypingStatus]);

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
      ...(messageId && { messageId }),
    };

    const destination = `/app/mark.read/${senderEmail}`;
    console.log('Sending read receipt to:', destination, receipt);

    try {
      client.publish({
        destination,
        body: JSON.stringify(receipt),
      });
      return true;
    } catch (error) {
      console.error('Failed to send read receipt:', error);
      return false;
    }
  }, [currentUserEmail]);

  const sendTypingStatus = useCallback((receiverEmail, isTyping) => {
    const client = stompClientRef.current;
    if (!client || !client.connected || !currentUserEmail || !receiverEmail) {
      return false;
    }

    try {
      client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          senderEmail: currentUserEmail,
          receiverEmail,
          typing: Boolean(isTyping),
        }),
      });
      return true;
    } catch (error) {
      console.error('Failed to send typing status:', error);
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
            console.log('WebSocket message received:', data.type || 'MESSAGE');

            if (data.type === 'READ_RECEIPT') {
              console.log(`Read receipt received from ${data.reader}`);
              onReadReceiptRef.current?.(data);
            } else if (data.type === 'MESSAGE_READ') {
              console.log(`Single message read: ${data.messageId}`);
              onReadReceiptRef.current?.(data);
            } else if (data.type === 'MESSAGE_EDITED') {
              onMessageEditedRef.current?.(data);
            } else if (data.type === 'MESSAGE_DELETED') {
              onMessageDeletedRef.current?.(data);
            } else if (data.type === 'TYPING') {
              onTypingStatusRef.current?.(data);
            } else if (data.type === 'MESSAGE') {
              const message = data.message;
              const isActiveConversation = message.senderEmail === selectedUserEmailRef.current;
              const nextUnreadCount = isActiveConversation ? 0 : data.unreadCount;
              console.log(`Message from ${message.senderEmail}, unreadCount: ${data.unreadCount}`);

              if (onMessageEnvelopeRef.current) {
                onMessageEnvelopeRef.current({
                  message,
                  unreadCount: nextUnreadCount,
                  isActiveConversation,
                });
              } else {
                onUserLastMessageUpdateRef.current?.(message);

                if (data.unreadCount !== undefined && onUnreadCountUpdateRef.current) {
                  onUnreadCountUpdateRef.current(message.senderEmail, nextUnreadCount);
                }
              }

              if (isActiveConversation) {
                onMessageReceivedRef.current?.(message);
              }
            } else if (data.senderEmail || data.content) {
              const isActiveConversation = data.senderEmail === selectedUserEmailRef.current;

              if (onMessageEnvelopeRef.current) {
                onMessageEnvelopeRef.current({
                  message: data,
                  unreadCount: undefined,
                  isActiveConversation,
                });
              } else {
                onUserLastMessageUpdateRef.current?.(data);
              }

              if (isActiveConversation) {
                onMessageReceivedRef.current?.(data);
              }
            } else if (data.type === 'DELIVERED') {
              console.log('Message delivered:', data.messageId);
              onReadReceiptRef.current?.(data);
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

  return { sendReadReceipt, sendTypingStatus };
};

export default useWebSocket;
