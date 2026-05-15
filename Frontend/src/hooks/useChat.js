import { useCallback, useEffect, useState } from 'react';
import { chatApi, profileApi } from '../lib/api';
import useWebSocket from './useWebSocket';

const USER_REFRESH_INTERVAL = 20000;

const sortMessagesByTime = (messageList) =>
  [...messageList].sort((firstMessage, secondMessage) =>
    new Date(firstMessage.timestamp) - new Date(secondMessage.timestamp)
  );

const addMessageIfMissing = (messageList, incomingMessage) => {
  const messageAlreadyExists = messageList.some((message) => message.id === incomingMessage.id);

  if (messageAlreadyExists) {
    return messageList;
  }

  return sortMessagesByTime([...messageList, incomingMessage]);
};

const updateUserPreview = (userList, email, content, timestamp) =>
  userList.map((chatUser) =>
    chatUser.email === email
      ? { ...chatUser, lastMessage: content, lastMessageTime: timestamp }
      : chatUser
  );

export default function useChat({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const refreshUsers = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    try {
      const allUsers = await profileApi.listUsers();
      const otherUsers = allUsers.filter((chatUser) => chatUser.email !== user.email);

      setUsers(otherUsers);
      setSelectedUser((currentSelectedUser) => {
        if (!currentSelectedUser) {
          return null;
        }

        const latestSelectedUser = otherUsers.find(
          (chatUser) => chatUser.email === currentSelectedUser.email
        );

        return latestSelectedUser || currentSelectedUser;
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) {
      return undefined;
    }

    void refreshUsers();

    const refreshTimer = window.setInterval(() => {
      void refreshUsers();
    }, USER_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [refreshUsers, user?.email]);

  const selectUser = useCallback(async (chatUser) => {
    if (!chatUser?.email) {
      return;
    }

    setSelectedUser(chatUser);
    setLoadingMessages(true);

    try {
      const conversation = await chatApi.getConversation(chatUser.email);
      setMessages(sortMessagesByTime(conversation));
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
    setMessages([]);
  }, []);

  const handleIncomingMessage = useCallback((incomingMessage) => {
    setMessages((currentMessages) => addMessageIfMissing(currentMessages, incomingMessage));
  }, []);

  const handleUserPreviewUpdate = useCallback((incomingMessage) => {
    setUsers((currentUsers) =>
      updateUserPreview(
        currentUsers,
        incomingMessage.senderEmail,
        incomingMessage.content,
        incomingMessage.timestamp
      )
    );

    setSelectedUser((currentSelectedUser) => {
      if (currentSelectedUser?.email !== incomingMessage.senderEmail) {
        return currentSelectedUser;
      }

      return {
        ...currentSelectedUser,
        lastMessage: incomingMessage.content,
        lastMessageTime: incomingMessage.timestamp,
      };
    });
  }, []);

  useWebSocket({
    currentUserEmail: user?.email,
    selectedUserEmail: selectedUser?.email || '',
    onMessageReceived: handleIncomingMessage,
    onUserLastMessageUpdate: handleUserPreviewUpdate,
  });

  const sendMessage = useCallback(async (event) => {
    event.preventDefault();

    if (!newMessage.trim() || !selectedUser || sendingMessage) {
      return;
    }

    const content = newMessage.trim();
    const tempMessageId = Date.now();
    const sentAt = new Date().toISOString();

    const temporaryMessage = {
      id: tempMessageId,
      senderEmail: user.email,
      receiverEmail: selectedUser.email,
      content,
      timestamp: sentAt,
      isTemp: true,
    };

    setNewMessage('');
    setSendingMessage(true);
    setMessages((currentMessages) => [...currentMessages, temporaryMessage]);
    setUsers((currentUsers) => updateUserPreview(currentUsers, selectedUser.email, content, sentAt));
    setSelectedUser((currentSelectedUser) =>
      currentSelectedUser
        ? {
            ...currentSelectedUser,
            lastMessage: content,
            lastMessageTime: sentAt,
          }
        : currentSelectedUser
    );

    try {
      const savedMessage = await chatApi.sendMessage({
        receiverEmail: selectedUser.email,
        content,
      });

      setMessages((currentMessages) => {
        const messagesWithoutTemp = currentMessages.filter(
          (message) => message.id !== tempMessageId
        );

        return sortMessagesByTime([...messagesWithoutTemp, savedMessage]);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === tempMessageId
            ? { ...message, error: true, isTemp: false }
            : message
        )
      );
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedUser, sendingMessage, user?.email]);

  return {
    users,
    selectedUser,
    messages,
    newMessage,
    setNewMessage,
    loading: loadingMessages,
    sending: sendingMessage,
    selectUser,
    clearSelectedUser,
    sendMessage,
  };
}
