import { useEffect, useRef, useState, useCallback } from 'react';

const getTimestampValue = (timestamp) => {
  const resolvedTimestamp = new Date(timestamp).getTime();
  return Number.isNaN(resolvedTimestamp) ? 0 : resolvedTimestamp;
};

const sortMessagesByTime = (messageList) =>
  [...messageList].sort(
    (firstMessage, secondMessage) =>
      getTimestampValue(firstMessage.timestamp) - getTimestampValue(secondMessage.timestamp)
  );

const formatMessageDate = (timestamp) => {
  const messageDate = new Date(timestamp);
  if (messageDate.toDateString() === new Date().toDateString()) {
    return 'TODAY';
  }
  return messageDate.toLocaleDateString([], { month: 'long', day: 'numeric' }).toUpperCase();
};

const getConversationSubtitle = (selectedUser) => {
  const userBio = selectedUser?.bio?.trim() || '';
  if (!userBio) {
    return selectedUser?.isActive ? 'Online' : 'Offline';
  }
  return userBio.length > 42 ? `${userBio.slice(0, 42).trim()}...` : userBio;
};

// ✅ FIXED: Compact Message Status - sirf icon, no background pill
const MessageStatus = ({ message, isOwnMessage }) => {
  if (!isOwnMessage || message.isTemp) return null;

  if (message.isread === 'READ') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
        <polyline points="18 6 9 17 4 12" />
        <polyline points="20 10 9 21 4 16" />
      </svg>
    );
  }

  if (message.deliveredAt) {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
        <polyline points="18 6 9 17 4 12" />
        <polyline points="20 10 9 21 4 16" />
      </svg>
    );
  }

  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

const EmptyConversationState = ({ theme }) => (
  <div className="flex items-center justify-center h-full text-center p-5" style={{ color: theme.muted, background: theme.subtle }}>
    <div>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <p className="mt-4 text-sm">Select a connected user or search someone new</p>
    </div>
  </div>
);

const EmptyMessagesState = ({ theme }) => (
  <div className="text-center py-16 px-5" style={{ color: theme.muted }}>
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="1.5" className="mx-auto">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    <p className="mt-4 text-sm">No messages yet</p>
    <p className="text-xs">Send a message to start chatting!</p>
  </div>
);

const RelationshipState = ({ theme, selectedUser, actionUserId, onSendRequest, onAcceptRequest }) => {
  const isBusy = actionUserId === selectedUser.id;
  const statusCopy = selectedUser.isRequestReceived
    ? {
        title: `${selectedUser.name} sent you a request`,
        description: 'Accept this request to connect and unlock chat for both of you.',
        actionLabel: isBusy ? 'Accepting...' : 'Accept Request',
        actionType: 'accept',
      }
    : selectedUser.isRequestSent
      ? {
          title: 'Request sent',
          description: `You can start chatting with ${selectedUser.name} once they accept your request.`,
          actionLabel: 'Waiting for acceptance',
          actionType: 'waiting',
        }
      : {
          title: `Connect with ${selectedUser.name}`,
          description: 'Send a follow request first. After acceptance, both of you will appear in each others followers, following, and chat list.',
          actionLabel: isBusy ? 'Sending...' : 'Send Request',
          actionType: 'send',
        };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-8 text-center" style={{ background: theme.subtle }}>
      <div className="max-w-md">
        <div
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{ background: theme.surface, color: theme.text, boxShadow: `0 14px 30px ${theme.shadow}` }}
        >
          {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <h3 className="mt-5 mb-2 text-xl" style={{ color: theme.text }}>
          {statusCopy.title}
        </h3>
        <p className="m-0 text-sm leading-6" style={{ color: theme.muted }}>
          {statusCopy.description}
        </p>

        <div className="mt-6">
          {statusCopy.actionType === 'accept' && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAcceptRequest(selectedUser)}
              className="px-5 py-3 rounded-2xl border-none cursor-pointer text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: theme.accent, color: theme.accentText }}
            >
              {statusCopy.actionLabel}
            </button>
          )}

          {statusCopy.actionType === 'send' && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onSendRequest(selectedUser)}
              className="px-5 py-3 rounded-2xl border-none cursor-pointer text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: theme.accent, color: theme.accentText }}
            >
              {statusCopy.actionLabel}
            </button>
          )}

          {statusCopy.actionType === 'waiting' && (
            <span className="inline-flex px-4 py-2 rounded-full text-sm font-medium" style={{ background: theme.surface, color: theme.muted }}>
              {statusCopy.actionLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatWindow = ({
  theme,
  selectedUser,
  messages,
  newMessage,
  loading,
  sending,
  currentUserEmail,
  actionUserId,
  isCompactMobile,
  onNewMessageChange,
  onSendMessage,
  onSendRequest,
  onAcceptRequest,
  onUnfollow,
  onBack,
  onMarkAsRead,
}) => {
  const messagesContainerRef = useRef(null);
  const orderedMessages = sortMessagesByTime(messages);
  const [showMenu, setShowMenu] = useState(false);
  const hasMarkedAsReadRef = useRef(false);

  useEffect(() => {
    if (selectedUser?.isConnected && selectedUser?.email && !loading) {
      hasMarkedAsReadRef.current = false;
    }
  }, [selectedUser?.email, selectedUser?.isConnected, loading]);

  useEffect(() => {
    if (!selectedUser?.isConnected || loading || hasMarkedAsReadRef.current) return;

    const timer = setTimeout(() => {
      if (selectedUser?.email) {
        onMarkAsRead?.(selectedUser.email);
        hasMarkedAsReadRef.current = true;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedUser?.email, selectedUser?.isConnected, loading, onMarkAsRead]);

  useEffect(() => {
    if (!selectedUser?.isConnected) return;

    const intervalId = setInterval(() => {
      if (selectedUser?.email && document.visibilityState === 'visible') {
        onMarkAsRead?.(selectedUser.email);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [selectedUser?.email, selectedUser?.isConnected, onMarkAsRead]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedUser?.isConnected && selectedUser?.email) {
        onMarkAsRead?.(selectedUser.email);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedUser?.email, selectedUser?.isConnected, onMarkAsRead]);

  const handleScroll = useCallback(() => {
    if (!selectedUser?.isConnected || hasMarkedAsReadRef.current) return;

    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      if (isAtBottom) {
        onMarkAsRead?.(selectedUser.email);
        hasMarkedAsReadRef.current = true;
      }
    }
  }, [selectedUser?.email, selectedUser?.isConnected, onMarkAsRead]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [orderedMessages]);

  if (!selectedUser) {
    return <EmptyConversationState theme={theme} />;
  }

  const userInitial = selectedUser.name?.charAt(0).toUpperCase() || '?';
  const isUserOnline = Boolean(selectedUser.isActive);
  const userStatusText = selectedUser.isConnected
    ? isUserOnline ? 'Online' : 'Offline'
    : selectedUser.isRequestReceived
      ? 'Request received'
      : selectedUser.isRequestSent
        ? 'Pending request'
        : 'Not connected';
  const conversationSubtitle = getConversationSubtitle(selectedUser);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div
        className="chat-header flex items-center gap-3 px-4 py-3 shrink-0 border-b"
        style={{ borderColor: theme.border, background: theme.surface }}
      >
        <button
          onClick={onBack}
          className="flex md:hidden items-center gap-2 transition-colors hover:opacity-70"
          style={{ color: theme.text }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 text-sm"
          style={{ background: theme.pageBackground, color: theme.text }}
        >
          {userInitial}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="m-0 text-sm font-semibold truncate leading-tight" style={{ color: theme.text }}>
            {selectedUser.name}
          </h3>
          <p className="m-0 text-[11px] leading-tight mt-0.5 truncate" style={{ color: theme.muted }}>
            {conversationSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedUser.isConnected && (
            <span
              className="text-[11px] px-2 py-1 rounded-full whitespace-nowrap"
              style={{
                background: isUserOnline ? theme.subtle : theme.pageBackground,
                color: isUserOnline ? theme.accent : theme.muted,
              }}
            >
              {userStatusText}
            </span>
          )}

          {selectedUser.isConnected && onUnfollow && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-full transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: theme.muted }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-32 rounded-xl shadow-lg z-50 overflow-hidden"
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                      boxShadow: `0 10px 25px ${theme.shadow}`,
                    }}
                  >
                    <button
                      onClick={() => {
                        onUnfollow?.(selectedUser);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm transition-colors bg-transparent border-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ color: theme.text }}
                    >
                      Unfollow
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Content */}
      {!selectedUser.isConnected ? (
        <RelationshipState
          theme={theme}
          selectedUser={selectedUser}
          actionUserId={actionUserId}
          onSendRequest={onSendRequest}
          onAcceptRequest={onAcceptRequest}
        />
      ) : (
        <>
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5"
            style={{ background: theme.subtle, overscrollBehavior: 'contain' }}
          >
            {loading ? (
              <div className="text-center py-10" style={{ color: theme.muted }}>
                Loading messages...
              </div>
            ) : orderedMessages.length === 0 ? (
              <EmptyMessagesState theme={theme} />
            ) : (
              orderedMessages.map((message, index) => {
                const isOwnMessage = message.senderEmail === currentUserEmail;
                const previousMessage = orderedMessages[index - 1];
                const shouldShowDate =
                  index === 0 ||
                  new Date(message.timestamp).toDateString() !==
                    new Date(previousMessage?.timestamp).toDateString();

                return (
                  <div key={message.id || index}>
                    {shouldShowDate && (
                      <div className="text-center my-3">
                        <span
                          className="text-[10px] px-2.5 py-1 rounded-full inline-block"
                          style={{ color: theme.muted, background: theme.surface }}
                        >
                          {formatMessageDate(message.timestamp)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      {/* ✅ FIXED: Smaller bubble padding, compact text */}
                      <div
                        className={`max-w-[78%] md:max-w-[62%] px-3 py-1.5 ${
                          isOwnMessage
                            ? 'rounded-2xl rounded-br-sm'
                            : 'rounded-2xl rounded-bl-sm'
                        }`}
                        style={{
                          background: isOwnMessage ? theme.accent : theme.surface,
                          color: isOwnMessage ? theme.accentText : theme.text,
                          boxShadow: `0 1px 4px ${theme.shadow}`,
                          opacity: message.isTemp ? 0.7 : 1,
                        }}
                      >
                        <p className="m-0 text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap">
                          {message.content}
                        </p>

                        {/* ✅ FIXED: Time + status inline, very compact */}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[9px] opacity-55">
                            {message.isTemp
                              ? 'Sending…'
                              : new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                          </span>

                          <MessageStatus message={message} isOwnMessage={isOwnMessage} />

                          {message.error && (
                            <span className="text-red-400 text-[9px]">!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="flex items-center gap-2 px-3 py-2.5 shrink-0 border-t"
            onSubmit={onSendMessage}
            style={{ background: theme.surface, borderColor: theme.border }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(event) => onNewMessageChange(event.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-3.5 py-2 rounded-full outline-none text-sm transition-all focus:ring-2 bg-gray-100 dark:bg-gray-800"
              style={{ border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: theme.accent, color: theme.accentText }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatWindow;