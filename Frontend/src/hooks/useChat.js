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
      console.log('All users:', userList);
      console.log('Current user email:', user?.email);
      
      // Filter out current user from the list
      const filteredUsers = userList.filter(u => u.email !== user?.email);
      console.log('Filtered users:', filteredUsers);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchUsers();
    }
  }, [fetchUsers, user?.email]);

  const selectUser = useCallback(async (u) => {
    if (!u || !u.email) {
      console.error('Invalid user selected:', u);
      return;
    }
    
    console.log('Selecting user:', u);
    setSelectedUser(u);
    selectedRef.current = u;
    setLoading(true);
    
    try {
      const conv = await chatApi.getConversation(u.email);
      console.log('Conversation loaded:', conv);
      setMessages(conv.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    } catch (err) {
      console.error('Error loading conversation:', err);
      // Agar conversation nahi milti to empty array set karo
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

  const { isConnected } = useWebSocket({
    userEmail: user?.email,
    selectedUserRef: selectedRef,
    onMessage: (msg) => {
      console.log('New message received:', msg);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
      
      // Update last message in users list
      setUsers(prev => prev.map(u => 
        u.email === msg.senderEmail 
          ? { ...u, lastMessage: msg.content, lastMessageTime: msg.timestamp } 
          : u
      ));
    },
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
      console.log('Message sent successfully:', saved);
      
      setMessages(prev => 
        prev.filter(m => m.id !== tempId)
          .concat(saved)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      );
      
      // Update last message in users list
      setUsers(prev => prev.map(u => 
        u.email === selectedUser.email 
          ? { ...u, lastMessage: content, lastMessageTime: new Date().toISOString() } 
          : u
      ));
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
    isConnected, 
    fetchUsers,
    selectUser, 
    clearSelectedUser, 
    sendMessage 
  };
}