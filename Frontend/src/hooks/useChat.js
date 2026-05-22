import { useCallback, useEffect, useState, useRef } from 'react';
import { chatApi, profileApi } from '../lib/api';
import useWebSocket from './useWebSocket';

const USER_REFRESH_INTERVAL = 20000;
const SEARCH_DEBOUNCE_MS = 250;

const getTimestampValue = (timestamp) => {
  const resolvedTimestamp = new Date(timestamp).getTime();
  return Number.isNaN(resolvedTimestamp) ? 0 : resolvedTimestamp;
};

const sortMessagesByTime = (messageList) =>
  [...messageList].sort(
    (firstMessage, secondMessage) =>
      getTimestampValue(firstMessage.timestamp) - getTimestampValue(secondMessage.timestamp)
  );

// ❌ REMOVED: sortUsersByRecentActivity - Backend will handle sorting now

const addMessageIfMissing = (messageList, incomingMessage) => {
  const messageAlreadyExists = messageList.some((message) => message.id === incomingMessage.id);

  if (messageAlreadyExists) {
    return messageList;
  }

  return sortMessagesByTime([...messageList, incomingMessage]);
};

// ✅ Updated: No sorting here - just update the user
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
  
  const [unreadCounts, setUnreadCounts] = useState({});
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  const prevUnreadCountsRef = useRef({});

  const refreshConnectedUsers = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    try {
      const [nextConnectedUsers, nextIncomingRequests] = await Promise.all([
        profileApi.listConnectedUsers(),
        profileApi.listIncomingRequests(),
      ]);

      // ✅ NO SORTING - Backend already returns sorted data
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

  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const [totalResponse, bySenderResponse] = await Promise.all([
        chatApi.getUnreadCount(),
        chatApi.getUnreadCountsBySender()
      ]);
      
      setUnreadTotal(totalResponse.unreadCount || 0);
      setUnreadCounts(bySenderResponse || {});
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [user?.email]);

  
const handleIncomingMessage = useCallback((incomingMessage) => {
  setMessages((currentMessages) => addMessageIfMissing(currentMessages, incomingMessage));
  
  const isFromSelectedUser = incomingMessage.senderEmail === selectedUser?.email;
  
  // ✅ CRITICAL FIX: Update connectedUsers with lastMessage and unreadCount
  setConnectedUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.email === incomingMessage.senderEmail
        ? {
            ...user,
            lastMessage: incomingMessage.content,
            lastMessageTime: incomingMessage.timestamp,
            unreadCount: isFromSelectedUser 
              ? (user.unreadCount || 0)
              : (user.unreadCount || 0) + 1
          }
        : user
    )
  );
  
  // Update selected user's preview
  if (selectedUser?.email === incomingMessage.senderEmail) {
    setSelectedUser((current) => ({
      ...current,
      lastMessage: incomingMessage.content,
      lastMessageTime: incomingMessage.timestamp,
    }));
  }
  
  // Update unread counts
  if (!isFromSelectedUser) {
    setUnreadCounts((prev) => ({
      ...prev,
      [incomingMessage.senderEmail]: (prev[incomingMessage.senderEmail] || 0) + 1,
    }));
    setUnreadTotal((prev) => prev + 1);
  } else if (selectedUser?.isConnected) {
    setTimeout(() => {
      markConversationAsRead(incomingMessage.senderEmail);
    }, 100);
  }
}, [selectedUser?.email, selectedUser?.isConnected]);

const handleUserPreviewUpdate = useCallback((incomingMessage) => {
  // ✅ Also update connectedUsers here for WebSocket messages
  setConnectedUsers((currentUsers) =>
    currentUsers.map((user) =>
      user.email === incomingMessage.senderEmail
        ? {
            ...user,
            lastMessage: incomingMessage.content,
            lastMessageTime: incomingMessage.timestamp,
          }
        : user
    )
  );

  setSelectedUser((currentSelectedUser) => {
    const isActiveConversation =
      currentSelectedUser?.email === incomingMessage.senderEmail ||
      currentSelectedUser?.email === incomingMessage.receiverEmail;

    if (!isActiveConversation) {
      return currentSelectedUser;
    }

    return {
      ...currentSelectedUser,
      lastMessage: incomingMessage.content,
      lastMessageTime: incomingMessage.timestamp,
    };
  });
}, []);

  const handleReadReceipt = useCallback((receipt) => {
    console.log('Received read receipt:', receipt);
    
    if (receipt.type === 'READ_RECEIPT') {
      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (message.senderEmail === user?.email && 
              message.receiverEmail === receipt.reader &&
              message.isread !== 'READ') {
            return { 
              ...message, 
              isread: 'READ', 
              readAt: receipt.timestamp 
            };
          }
          return message;
        })
      );
      
      setUnreadCounts(prev => ({
        ...prev,
        [receipt.reader]: 0
      }));
      
    } else if (receipt.type === 'MESSAGE_READ') {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === receipt.messageId
            ? { ...message, isread: 'READ', readAt: receipt.readAt }
            : message
        )
      );
    }
  }, [user?.email]);

  // ========== WebSocket Hook ==========
  
  const { sendReadReceipt } = useWebSocket({
    currentUserEmail: user?.email,
    selectedUserEmail: selectedUser?.email || '',
    onMessageReceived: handleIncomingMessage,
    onUserLastMessageUpdate: handleUserPreviewUpdate,
    onReadReceipt: handleReadReceipt,
  });

  // ========== markConversationAsRead ==========
  
  const markConversationAsRead = useCallback(async (senderEmail) => {
    if (!senderEmail) return;
    
    try {
      sendReadReceipt?.(senderEmail);
      await chatApi.markAsRead(senderEmail);
      
      setUnreadCounts(prev => ({ ...prev, [senderEmail]: 0 }));
      setUnreadTotal(prev => Math.max(0, prev - (unreadCounts[senderEmail] || 0)));
      
      // ✅ Update unreadCount in connectedUsers - NO SORTING
      setConnectedUsers(currentUsers => {
        return currentUsers.map(user =>
          user.email === senderEmail
            ? { ...user, unreadCount: 0 }
            : user
        );
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [unreadCounts, sendReadReceipt]);

  // ========== useEffect Hooks ==========
  
  useEffect(() => {
    if (!user?.email) {
      return undefined;
    }

    void refreshConnectedUsers();
    void fetchUnreadCounts();

    const refreshTimer = window.setInterval(() => {
      void refreshConnectedUsers();
      void fetchUnreadCounts();
    }, USER_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [refreshConnectedUsers, fetchUnreadCounts, user?.email]);

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

  // ✅ Updated: Update unreadCounts without sorting
  useEffect(() => {
    if (connectedUsers.length > 0 && Object.keys(unreadCounts).length > 0) {
      const hasChanges = Object.keys(unreadCounts).some(
        email => unreadCounts[email] !== (prevUnreadCountsRef.current[email] || 0)
      );
      
      if (hasChanges) {
        setConnectedUsers(currentUsers => {
          return currentUsers.map(user => ({
            ...user,
            unreadCount: unreadCounts[user.email] || 0
          }));
          // ✅ NO SORTING HERE
        });
        prevUnreadCountsRef.current = { ...unreadCounts };
      }
    }
  }, [unreadCounts, connectedUsers]);

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
    
    if (chatUser.isConnected && chatUser.email) {
      await markConversationAsRead(chatUser.email);
    }
  }, [loadConversation, markConversationAsRead]);

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
    setMessages([]);
  }, []);

  const syncAfterRelationshipChange = useCallback(async () => {
    await Promise.all([refreshConnectedUsers(), refreshSearchResults(), fetchUnreadCounts()]);
  }, [refreshConnectedUsers, refreshSearchResults, fetchUnreadCounts]);

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

  const unfollowUser = useCallback(async (chatUser) => {
    if (!chatUser?.id || actionUserId) {
      return;
    }

    setActionUserId(chatUser.id);

    try {
      await profileApi.unfollowUser(chatUser.id);
      await syncAfterRelationshipChange();
      
      if (selectedUser?.id === chatUser.id) {
        clearSelectedUser();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    } finally {
      setActionUserId(null);
    }
  }, [actionUserId, syncAfterRelationshipChange, selectedUser, clearSelectedUser]);

  const rejectFollowRequest = useCallback(async (requesterUser) => {
    if (!requesterUser?.id || actionUserId) {
      return;
    }

    setActionUserId(requesterUser.id);

    try {
      await profileApi.rejectFollowRequest(requesterUser.id);
      await syncAfterRelationshipChange();
      
      if (selectedUser?.id === requesterUser.id) {
        clearSelectedUser();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    } finally {
      setActionUserId(null);
    }
  }, [actionUserId, syncAfterRelationshipChange, selectedUser, clearSelectedUser]);

  const cancelSentRequest = useCallback(async (targetUser) => {
    if (!targetUser?.id || actionUserId) {
      return;
    }

    setActionUserId(targetUser.id);

    try {
      await profileApi.cancelSentRequest(targetUser.id);
      await syncAfterRelationshipChange();
      
      if (selectedUser?.id === targetUser.id) {
        clearSelectedUser();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cancel request:', error);
      throw error;
    } finally {
      setActionUserId(null);
    }
  }, [actionUserId, syncAfterRelationshipChange, selectedUser, clearSelectedUser]);

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
    setMessages((currentMessages) => sortMessagesByTime([...currentMessages, temporaryMessage]));
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
    unreadCounts,
    unreadTotal,
    selectUser,
    clearSelectedUser,
    sendMessage,
    sendFollowRequest,
    acceptFollowRequest,
    unfollowUser,
    rejectFollowRequest,
    cancelSentRequest,
    markConversationAsRead,
  };
}