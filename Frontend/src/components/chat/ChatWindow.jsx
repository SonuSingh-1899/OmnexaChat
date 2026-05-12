// components/chat/ChatWindow.jsx
import { useEffect, useRef } from 'react';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const ChatWindow = ({
  theme,
  selectedUser,
  messages,
  newMessage,
  loading,
  sending,
  isConnected,
  currentUserEmail,
  isCompactMobile,
  onNewMessageChange,
  onSendMessage,
  onBack,
}) => {
  const messagesEndRef = useRef(null);
  const initials = selectedUser?.name?.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div 
        className="flex items-center justify-center h-full text-center p-5"
        style={{ color: theme.muted, background: theme.subtle }}
      >
        <div>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="mt-4 text-sm">
            Select a conversation to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div
        className="dashboard-chat-header flex items-center gap-3 px-5 py-4 shrink-0"
        style={{
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surface,
        }}
      >
        {isCompactMobile && (
          <button
            type="button"
            onClick={onBack}
            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg flex items-center shrink-0 hover:opacity-80 transition-opacity"
            style={{ color: theme.text }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}

        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0"
          style={{ background: theme.pageBackground, color: theme.text }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="m-0 text-base font-semibold truncate" style={{ color: theme.text }}>
            {selectedUser.name}
          </h3>
          <p 
            className="mt-1 text-xs min-h-5"
            style={{ color: newMessage.trim() ? theme.accent : theme.muted }}
          >
            {newMessage.trim() ? 'Typing...' : '\u00A0'}
          </p>
        </div>

        <span
          className="dashboard-chat-status text-xs px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: isConnected ? theme.subtle : theme.pageBackground,
            color: isConnected ? theme.accent : theme.muted,
          }}
        >
          {isConnected ? 'Connected' : 'Reconnecting...'}
        </span>
      </div>

      {/* Messages Area - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-5"
        style={{ background: theme.subtle }}
      >
        {loading ? (
          <div className="text-center py-10" style={{ color: theme.muted }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 px-5" style={{ color: theme.muted }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="1.5" className="mx-auto">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="mt-4 text-sm">No messages yet</p>
            <p className="text-xs">Send a message to start chatting!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.senderEmail === currentUserEmail;
              const showDate =
                idx === 0 ||
                new Date(msg.timestamp).toDateString() !==
                  new Date(messages[idx - 1]?.timestamp).toDateString();

              return (
                <div key={msg.id || idx}>
                  {showDate && (
                    <div className="text-center my-6 mb-4">
                      <span 
                        className="text-xs px-3 py-1 rounded-full inline-block"
                        style={{ color: theme.muted, background: theme.surface }}
                      >
                        {new Date(msg.timestamp).toDateString() === new Date().toDateString()
                          ? 'TODAY'
                          : new Date(msg.timestamp)
                              .toLocaleDateString([], { month: 'long', day: 'numeric' })
                              .toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className="max-w-[70%] px-4 py-3 break-words relative shadow-lg"
                      style={{
                        borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isOwn ? theme.accent : theme.surface,
                        color: isOwn ? theme.accentText : theme.text,
                        boxShadow: `0 10px 24px ${theme.shadow}`,
                        ...(msg.error && { border: '1px solid #f44336' }),
                        opacity: msg.isTemp ? 0.7 : 1,
                      }}
                    >
                      <p className="m-0 text-sm leading-relaxed break-words">
                        {msg.content}
                      </p>
                      <p className="mt-1 text-[10px] opacity-70 text-right">
                        {msg.isTemp ? 'Sending...' : formatTime(msg.timestamp)}
                        {msg.error && <span className="ml-2 text-red-500">Failed</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <form
        className="dashboard-composer flex gap-3 px-5 py-4 shrink-0"
        onSubmit={onSendMessage}
        style={{
          background: theme.surface,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onNewMessageChange(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-full outline-none font-sans text-sm transition-all focus:ring-2"
          style={{
            border: `1px solid ${theme.border}`,
            background: theme.subtle,
            color: theme.text,
          }}
        />
        <button
          className="dashboard-send-button rounded-full px-5 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={sending || !newMessage.trim()}
          style={{
            background: theme.accent,
            color: theme.accentText,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <span className="text-sm">Send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;