// hooks/useChat.js (Updated)
import { useState, useCallback, useRef, useEffect } from 'react';
import { chatApi, profileApi } from '../lib/api';
import useWebSocket from './useWebSocket';

export default function useChat({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const selectedRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const userList = await profileApi.listUsers();
      const filteredUsers = userList.filter(u => u.email !== user?.email);
      setUsers(filteredUsers);
      setSelectedUser((prev) => {
        if (!prev) {
          return prev;
        }

        const latestSelectedUser = filteredUsers.find((candidate) => candidate.email === prev.email);
        if (latestSelectedUser) {
          selectedRef.current = { ...prev, ...latestSelectedUser };
          return selectedRef.current;
        }

        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchUsers();
    }
  }, [fetchUsers, user?.email]);

  useEffect(() => {
    if (!user?.email) {
      return undefined;
    }

    const refreshTimer = window.setInterval(() => {
      void fetchUsers();
    }, 20000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [fetchUsers, user?.email]);

  const selectUser = useCallback(async (u) => {
    if (!u || !u.email) {
      console.error('Invalid user selected:', u);
      return;
    }
    
    setSelectedUser(u);
    selectedRef.current = u;
    setLoading(true);
    
    try {
      const conv = await chatApi.getConversation(u.email);
      setMessages(conv.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    } catch (err) {
      console.error('Error loading conversation:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
    selectedRef.current = null;
    setMessages([]);
  }, []);

  const handleIncomingMessage = useCallback((msg) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });
  }, []);

  const handleUserLastMessageUpdate = useCallback((msg) => {
    setUsers(prev => prev.map(u =>
      u.email === msg.senderEmail
        ? { ...u, lastMessage: msg.content, lastMessageTime: msg.timestamp }
        : u
    ));
    setSelectedUser((prev) => {
      if (prev?.email !== msg.senderEmail) {
        return prev;
      }

      selectedRef.current = { ...prev, lastMessage: msg.content, lastMessageTime: msg.timestamp };
      return selectedRef.current;
    });
  }, []);

  useWebSocket({
    currentUserEmail: user?.email,
    selectedUserRef: selectedRef,
    onMessageReceived: handleIncomingMessage,
    onUserLastMessageUpdate: handleUserLastMessageUpdate,
  });

  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    // Optimistic update
    const tempId = Date.now();
    const tempMessage = {
      id: tempId,
      senderEmail: user.email,
      receiverEmail: selectedUser.email,
      content,
      timestamp: new Date().toISOString(),
      isTemp: true,
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const saved = await chatApi.sendMessage({ 
        receiverEmail: selectedUser.email, 
        content 
      });
      setMessages(prev => 
        prev.filter(m => m.id !== tempId)
          .concat(saved)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      );
      
      setUsers(prev => prev.map(u => 
        u.email === selectedUser.email 
          ? { ...u, lastMessage: content, lastMessageTime: new Date().toISOString() } 
          : u
      ));
      setSelectedUser((prev) =>
        prev?.email === selectedUser.email
          ? { ...prev, lastMessage: content, lastMessageTime: new Date().toISOString() }
          : prev
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, error: true, isTemp: false } : m)
      );
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedUser, sending, user?.email]);

  return { 
    users, 
    selectedUser, 
    messages, 
    newMessage, 
    setNewMessage, 
    loading, 
    sending, 
    fetchUsers,
    selectUser, 
    clearSelectedUser, 
    sendMessage 
  };
}
