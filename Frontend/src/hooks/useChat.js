import { useCallback, useEffect, useState } from 'react';
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

const createReplySnapshot = (message) => {
  if (!message?.id || !message?.content || !message?.senderEmail) {
    return null;
  }

  return {
    id: message.id,
    content: message.content,
    senderEmail: message.senderEmail,
  };
};

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

export default function useChat({ user, searchQuery, onConnectionChange, onNotifyMessage }) {
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
  const [replyingTo, setReplyingTo] = useState(null);

  const normalizeUnreadCount = useCallback((nextCount) => Math.max(0, Number(nextCount) || 0), []);

  const applyUnreadCountUpdate = useCallback((senderEmail, nextCount) => {
    if (!senderEmail) {
      return;
    }

    const normalizedCount = normalizeUnreadCount(nextCount);

    setUnreadCounts((prev) => {
      const previousCount = prev[senderEmail] || 0;

      if (previousCount === normalizedCount) {
        return prev;
      }

      setUnreadTotal((total) => Math.max(0, total - previousCount + normalizedCount));

      return {
        ...prev,
        [senderEmail]: normalizedCount,
      };
    });

    setConnectedUsers((currentUsers) =>
      currentUsers.map((chatUser) =>
        chatUser.email === senderEmail
          ? { ...chatUser, unreadCount: normalizedCount }
          : chatUser
      )
    );
  }, [normalizeUnreadCount]);

  const handleSidebarMessageEvent = useCallback(({ message, unreadCount, isActiveConversation }) => {
    if (!message?.senderEmail) {
      return;
    }

    setConnectedUsers((currentUsers) =>
      currentUsers.map((chatUser) => {
        if (chatUser.email !== message.senderEmail) {
          return chatUser;
        }

        const fallbackUnreadCount = isActiveConversation
          ? 0
          : (chatUser.unreadCount || 0) + 1;
        const resolvedUnreadCount =
          unreadCount === undefined
            ? fallbackUnreadCount
            : normalizeUnreadCount(unreadCount);

        return {
          ...chatUser,
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
          unreadCount: resolvedUnreadCount,
        };
      })
    );

    setUnreadCounts((previousUnreadCounts) => {
      const previousCount = previousUnreadCounts[message.senderEmail] || 0;
      const fallbackUnreadCount = isActiveConversation ? 0 : previousCount + 1;
      const resolvedUnreadCount =
        unreadCount === undefined
          ? fallbackUnreadCount
          : normalizeUnreadCount(unreadCount);

      if (previousCount === resolvedUnreadCount) {
        return previousUnreadCounts;
      }

      setUnreadTotal((total) => Math.max(0, total - previousCount + resolvedUnreadCount));

      return {
        ...previousUnreadCounts,
        [message.senderEmail]: resolvedUnreadCount,
      };
    });

    setSelectedUser((currentSelectedUser) => {
      const isCurrentConversation =
        currentSelectedUser?.email === message.senderEmail ||
        currentSelectedUser?.email === message.receiverEmail;

      if (!isCurrentConversation) {
        return currentSelectedUser;
      }

      return {
        ...currentSelectedUser,
        lastMessage: message.content,
        lastMessageTime: message.timestamp,
      };
    });
  }, [normalizeUnreadCount]);

  const refreshConnectedUsers = useCallback(async () => {
    if (!user?.email) return;
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
    if (!user?.email) return;
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
        chatApi.getUnreadCountsBySender(),
      ]);
      const nextUnreadCounts = bySenderResponse || {};
      setUnreadTotal(totalResponse.unreadCount || 0);
      setUnreadCounts(nextUnreadCounts);
      setConnectedUsers((currentUsers) =>
        currentUsers.map((chatUser) => ({
          ...chatUser,
          unreadCount: nextUnreadCounts[chatUser.email] || 0,
        }))
      );
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [user?.email]);

  const markConversationAsRead = useCallback(async (senderEmail) => {
    if (!senderEmail) return;

    const fallbackUnread =
      connectedUsers.find((chatUser) => chatUser.email === senderEmail)?.unreadCount || 0;
    const currentUnread = unreadCounts[senderEmail] ?? fallbackUnread;

    console.log(`Marking conversation as read with ${senderEmail} (${currentUnread} messages)`);

    try {
      if (currentUnread > 0) {
        applyUnreadCountUpdate(senderEmail, 0);
      }

      const response = await chatApi.markAsRead(senderEmail);

      if (currentUnread === 0 && (response?.count || 0) > 0) {
        setUnreadTotal((total) => Math.max(0, total - response.count));
        setConnectedUsers((currentUsers) =>
          currentUsers.map((chatUser) =>
            chatUser.email === senderEmail
              ? { ...chatUser, unreadCount: 0 }
              : chatUser
          )
        );
      }

      console.log(`Successfully marked messages from ${senderEmail} as read`);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      if (currentUnread > 0) {
        applyUnreadCountUpdate(senderEmail, currentUnread);
      }
    }
  }, [applyUnreadCountUpdate, connectedUsers, unreadCounts]);

  const handleIncomingMessage = useCallback((incomingMessage) => {
    setMessages((currentMessages) => addMessageIfMissing(currentMessages, incomingMessage));

    const isFromSelectedUser = incomingMessage.senderEmail === selectedUser?.email;
    const isCurrentUserSender = incomingMessage.senderEmail === user?.email;

    if (isCurrentUserSender) return;

    if (document.visibilityState !== 'visible') {
      const senderName =
        connectedUsers.find((chatUser) => chatUser.email === incomingMessage.senderEmail)?.name ||
        selectedUser?.name ||
        incomingMessage.senderEmail;

      void onNotifyMessage?.({
        title: `New message from ${senderName}`,
        body: incomingMessage.content,
        data: {
          senderEmail: incomingMessage.senderEmail,
          messageId: String(incomingMessage.id || ''),
          content: incomingMessage.content || '',
          url: '/dashboard',
        },
      });
    }

    if (isFromSelectedUser && selectedUser?.isConnected) {
      setTimeout(() => {
        markConversationAsRead(incomingMessage.senderEmail);
      }, 100);
    }
  }, [
    markConversationAsRead,
    selectedUser?.email,
    selectedUser?.isConnected,
    selectedUser?.name,
    connectedUsers,
    onNotifyMessage,
    user?.email,
  ]);

  const handleUserPreviewUpdate = useCallback((incomingMessage) => {
    setConnectedUsers((currentUsers) =>
      currentUsers.map((chatUser) =>
        chatUser.email === incomingMessage.senderEmail
          ? {
              ...chatUser,
              lastMessage: incomingMessage.content,
              lastMessageTime: incomingMessage.timestamp,
            }
          : chatUser
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
    console.log('Received message status:', receipt);

    if (receipt.type === 'READ_RECEIPT') {
      setMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (
            message.senderEmail === user?.email &&
            message.receiverEmail === receipt.reader &&
            message.isread !== 'READ'
          ) {
            return {
              ...message,
              isread: 'READ',
              readAt: receipt.timestamp,
            };
          }
          return message;
        })
      );
    } else if (receipt.type === 'MESSAGE_READ') {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === receipt.messageId
            ? { ...message, isread: 'READ', readAt: receipt.readAt }
            : message
        )
      );
    } else if (receipt.type === 'DELIVERED') {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === receipt.messageId
            ? { ...message, deliveredAt: receipt.deliveredAt }
            : message
        )
      );
    }
  }, [applyUnreadCountUpdate, user?.email]);

  useWebSocket({
    currentUserEmail: user?.email,
    selectedUserEmail: selectedUser?.email || '',
    onMessageReceived: handleIncomingMessage,
    onMessageEnvelope: handleSidebarMessageEvent,
    onUserLastMessageUpdate: handleUserPreviewUpdate,
    onReadReceipt: handleReadReceipt,
    onUnreadCountUpdate: (senderEmail, unreadCount) => {
      applyUnreadCountUpdate(senderEmail, unreadCount);
    },
  });

  useEffect(() => {
    if (!user?.email) return;
    void refreshConnectedUsers();
    void fetchUnreadCounts();

    const refreshTimer = window.setInterval(() => {
      void refreshConnectedUsers();
      void fetchUnreadCounts();
    }, USER_REFRESH_INTERVAL);

    return () => window.clearInterval(refreshTimer);
  }, [refreshConnectedUsers, fetchUnreadCounts, user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    const searchTimer = window.setTimeout(() => {
      void refreshSearchResults();
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(searchTimer);
  }, [refreshSearchResults, searchQuery, user?.email]);

  useEffect(() => {
    setSelectedUser((currentSelectedUser) => {
      if (!currentSelectedUser?.email) return currentSelectedUser;
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
    if (!chatUser?.email) return;
    setReplyingTo(null);
    setSelectedUser(chatUser);
    await loadConversation(chatUser);
    if (chatUser.isConnected && chatUser.email) {
      await markConversationAsRead(chatUser.email);
    }
  }, [loadConversation, markConversationAsRead]);

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
    setMessages([]);
    setReplyingTo(null);
  }, []);

  const startReply = useCallback((message) => {
    const replySnapshot = createReplySnapshot(message);
    if (!replySnapshot) {
      return;
    }

    setReplyingTo(replySnapshot);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const syncAfterRelationshipChange = useCallback(async () => {
    await Promise.all([refreshConnectedUsers(), refreshSearchResults(), fetchUnreadCounts()]);
  }, [refreshConnectedUsers, refreshSearchResults, fetchUnreadCounts]);

  const sendFollowRequest = useCallback(async (chatUser) => {
    if (!chatUser?.id || actionUserId) return;
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
    if (!chatUser?.id || actionUserId) return;
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
    if (!chatUser?.id || actionUserId) return;
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
  }, [actionUserId, clearSelectedUser, selectedUser, syncAfterRelationshipChange]);

  const rejectFollowRequest = useCallback(async (requesterUser) => {
    if (!requesterUser?.id || actionUserId) return;
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
  }, [actionUserId, clearSelectedUser, selectedUser, syncAfterRelationshipChange]);

  const cancelSentRequest = useCallback(async (targetUser) => {
    if (!targetUser?.id || actionUserId) return;
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
  }, [actionUserId, clearSelectedUser, selectedUser, syncAfterRelationshipChange]);

  const sendMessage = useCallback(async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !selectedUser || !selectedUser.isConnected || sendingMessage) return;
    const content = newMessage.trim();
    const tempMessageId = Date.now();
    const sentAt = new Date().toISOString();
    const activeReply = replyingTo;
    const temporaryMessage = {
      id: tempMessageId,
      senderEmail: user.email,
      receiverEmail: selectedUser.email,
      content,
      timestamp: sentAt,
      isTemp: true,
      replyToMessageId: activeReply?.id || null,
      replyToSenderEmail: activeReply?.senderEmail || '',
      replyToContent: activeReply?.content || '',
    };
    setNewMessage('');
    setReplyingTo(null);
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
        replyToMessageId: activeReply?.id || null,
        replyToSenderEmail: activeReply?.senderEmail || '',
        replyToContent: activeReply?.content || '',
      });
      setMessages((currentMessages) => {
        const messagesWithoutTemp = currentMessages.filter(
          (message) => message.id !== tempMessageId
        );
        return sortMessagesByTime([...messagesWithoutTemp, savedMessage]);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      if (activeReply) {
        setReplyingTo(activeReply);
      }
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
  }, [newMessage, replyingTo, selectedUser, sendingMessage, user?.email]);

  return {
    users: connectedUsers,
    incomingRequests,
    searchResults,
    selectedUser,
    messages,
    newMessage,
    setNewMessage,
    replyingTo,
    loading: loadingMessages,
    sending: sendingMessage,
    searchingUsers,
    actionUserId,
    unreadCounts,
    unreadTotal,
    selectUser,
    clearSelectedUser,
    startReply,
    cancelReply,
    sendMessage,
    sendFollowRequest,
    acceptFollowRequest,
    unfollowUser,
    rejectFollowRequest,
    cancelSentRequest,
    markConversationAsRead,
  };
}
