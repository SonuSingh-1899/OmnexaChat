import { useCallback, useEffect, useState } from 'react';
import { chatApi, profileApi } from '../lib/api';
import useWebSocket from './useWebSocket';

const USER_REFRESH_INTERVAL = 20000;
const SEARCH_DEBOUNCE_MS = 250;

const sortMessagesByTime = (messageList) =>
  [...messageList].sort(
    (firstMessage, secondMessage) =>
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

const findUserByEmail = (email, ...userCollections) => {
  if (!email) {
    return null;
  }

  for (const collection of userCollections) {
    const matchedUser = collection.find((chatUser) => chatUser.email === email);
    if (matchedUser) {
      return matchedUser;
    }
  }

  return null;
};

export default function useChat({ user, searchQuery, onConnectionChange }) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);

  const refreshConnectedUsers = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    try {
      const [nextConnectedUsers, nextIncomingRequests] = await Promise.all([
        profileApi.listConnectedUsers(),
        profileApi.listIncomingRequests(),
      ]);

      setConnectedUsers(nextConnectedUsers);
      setIncomingRequests(nextIncomingRequests);
    } catch (error) {
      console.error('Failed to fetch connection data:', error);
    }
  }, [user?.email]);

  const refreshSearchResults = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);

    try {
      const results = await profileApi.searchUsers(normalizedQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  }, [searchQuery, user?.email]);

  useEffect(() => {
    if (!user?.email) {
      return undefined;
    }

    void refreshConnectedUsers();

    const refreshTimer = window.setInterval(() => {
      void refreshConnectedUsers();
    }, USER_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [refreshConnectedUsers, user?.email]);

  useEffect(() => {
    if (!user?.email) {
      return undefined;
    }

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchingUsers(false);
      return undefined;
    }

    const searchTimer = window.setTimeout(() => {
      void refreshSearchResults();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(searchTimer);
    };
  }, [refreshSearchResults, searchQuery, user?.email]);

  useEffect(() => {
    setSelectedUser((currentSelectedUser) => {
      if (!currentSelectedUser?.email) {
        return currentSelectedUser;
      }

      return (
        findUserByEmail(
          currentSelectedUser.email,
          connectedUsers,
          incomingRequests,
          searchResults
        ) || currentSelectedUser
      );
    });
  }, [connectedUsers, incomingRequests, searchResults]);

  const loadConversation = useCallback(async (chatUser) => {
    if (!chatUser?.email || !chatUser.isConnected) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

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

  const selectUser = useCallback(async (chatUser) => {
    if (!chatUser?.email) {
      return;
    }

    setSelectedUser(chatUser);
    await loadConversation(chatUser);
  }, [loadConversation]);

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
    setMessages([]);
  }, []);

  const handleIncomingMessage = useCallback((incomingMessage) => {
    setMessages((currentMessages) => addMessageIfMissing(currentMessages, incomingMessage));
  }, []);

  const handleUserPreviewUpdate = useCallback((incomingMessage) => {
    setConnectedUsers((currentUsers) =>
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

  const syncAfterRelationshipChange = useCallback(async () => {
    await Promise.all([refreshConnectedUsers(), refreshSearchResults()]);
  }, [refreshConnectedUsers, refreshSearchResults]);

  const sendFollowRequest = useCallback(async (chatUser) => {
    if (!chatUser?.id || actionUserId) {
      return;
    }

    setActionUserId(chatUser.id);

    try {
      const updatedUser = await profileApi.sendFollowRequest(chatUser.id);
      setSelectedUser((currentSelectedUser) =>
        currentSelectedUser?.id === updatedUser.id ? updatedUser : currentSelectedUser
      );
      await syncAfterRelationshipChange();
    } catch (error) {
      console.error('Failed to send follow request:', error);
    } finally {
      setActionUserId(null);
    }
  }, [actionUserId, syncAfterRelationshipChange]);

  const acceptFollowRequest = useCallback(async (chatUser, options = {}) => {
    const { openChat = false } = options;

    if (!chatUser?.id || actionUserId) {
      return;
    }

    setActionUserId(chatUser.id);

    try {
      const updatedUser = await profileApi.acceptFollowRequest(chatUser.id);
      await syncAfterRelationshipChange();
      await onConnectionChange?.();

      if (openChat) {
        await selectUser({ ...updatedUser, isConnected: true });
      } else {
        setSelectedUser((currentSelectedUser) =>
          currentSelectedUser?.id === updatedUser.id
            ? { ...currentSelectedUser, ...updatedUser, isConnected: true }
            : currentSelectedUser
        );
      }
    } catch (error) {
      console.error('Failed to accept follow request:', error);
    } finally {
      setActionUserId(null);
    }
  }, [actionUserId, onConnectionChange, selectUser, syncAfterRelationshipChange]);

  const sendMessage = useCallback(async (event) => {
    event.preventDefault();

    if (!newMessage.trim() || !selectedUser || !selectedUser.isConnected || sendingMessage) {
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
    setConnectedUsers((currentUsers) =>
      updateUserPreview(currentUsers, selectedUser.email, content, sentAt)
    );
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
    users: connectedUsers,
    incomingRequests,
    searchResults,
    selectedUser,
    messages,
    newMessage,
    setNewMessage,
    loading: loadingMessages,
    sending: sendingMessage,
    searchingUsers,
    actionUserId,
    selectUser,
    clearSelectedUser,
    sendMessage,
    sendFollowRequest,
    acceptFollowRequest,
  };
}
