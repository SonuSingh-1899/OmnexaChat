import { useEffect, useRef } from 'react';

const getTimestampValue = (timestamp) => {
  const resolvedTimestamp = new Date(timestamp).getTime();
  return Number.isNaN(resolvedTimestamp) ? 0 : resolvedTimestamp;
};

const sortMessagesByTime = (messageList) =>
  [...messageList].sort(
    (firstMessage, secondMessage) =>
      getTimestampValue(firstMessage.timestamp) - getTimestampValue(secondMessage.timestamp)
  );

const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const messageDate = new Date(timestamp);
  const isToday = messageDate.toDateString() === new Date().toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatMessageDate = (timestamp) => {
  const messageDate = new Date(timestamp);

  if (messageDate.toDateString() === new Date().toDateString()) {
    return 'TODAY';
  }

  return messageDate
    .toLocaleDateString([], { month: 'long', day: 'numeric' })
    .toUpperCase();
};

const getConversationSubtitle = (selectedUser) => {
  const userBio = selectedUser?.bio?.trim() || '';

  if (!userBio) {
    return selectedUser?.isActive ? 'Online' : 'Offline';
  }

  return userBio.length > 42 ? `${userBio.slice(0, 42).trim()}...` : userBio;
};

const EmptyConversationState = ({ theme }) => (
  <div
    className="flex items-center justify-center h-full text-center p-5"
    style={{ color: theme.muted, background: theme.subtle }}
  >
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

const RelationshipState = ({
  theme,
  selectedUser,
  actionUserId,
  onSendRequest,
  onAcceptRequest,
}) => {
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
    <div
      className="flex-1 flex items-center justify-center px-6 py-8 text-center"
      style={{ background: theme.subtle }}
    >
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
            <span
              className="inline-flex px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: theme.surface, color: theme.muted }}
            >
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
  onBack,
  onNavigateToDashboard,
}) => {
  const messagesContainerRef = useRef(null);
  const orderedMessages = sortMessagesByTime(messages);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;

    if (!messagesContainer) {
      return;
    }

    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth',
    });
  }, [orderedMessages, selectedUser?.email]);

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
      <div
        className="dashboard-chat-header flex items-center gap-3 px-5 py-4 shrink-0"
        style={{
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surface,
        }}
      >
      <button
        onClick={onBack}  // Change this line
        className="flex md:hidden items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        <span className="hidden text-sm md:inline">Back to Chat</span>
      </button>

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0"
          style={{ background: theme.pageBackground, color: theme.text }}
        >
          {userInitial}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="m-0 text-base font-semibold truncate" style={{ color: theme.text }}>
            {selectedUser.name}
          </h3>
          <p className="mt-1 text-xs min-h-5 truncate" style={{ color: theme.muted }}>
            {conversationSubtitle}
          </p>
        </div>

        <span
          className="dashboard-chat-status text-xs px-2.5 py-1 rounded-full shrink-0"
          style={{
            background: selectedUser.isConnected && isUserOnline ? theme.subtle : theme.pageBackground,
            color: selectedUser.isConnected && isUserOnline ? theme.accent : theme.muted,
          }}
        >
          {userStatusText}
        </span>
      </div>

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
            className="dashboard-messages flex-1 overflow-y-auto px-3 py-5"
            style={{ background: theme.subtle, overscrollBehavior: 'contain' }}
          >
            {loading ? (
              <div className="text-center py-10" style={{ color: theme.muted }}>
                Loading messages...
              </div>
            ) : orderedMessages.length === 0 ? (
              <EmptyMessagesState theme={theme} />
            ) : (
              <>
                {orderedMessages.map((message, index) => {
                  const isOwnMessage = message.senderEmail === currentUserEmail;
                  const previousMessage = orderedMessages[index - 1];
                  const shouldShowDate =
                    index === 0 ||
                    new Date(message.timestamp).toDateString() !==
                      new Date(previousMessage?.timestamp).toDateString();

                  return (
                    <div key={message.id || index}>
                      {shouldShowDate && (
                        <div className="text-center my-6 mb-4">
                          <span
                            className="text-xs px-3 py-1 rounded-full inline-block"
                            style={{ color: theme.muted, background: theme.surface }}
                          >
                            {formatMessageDate(message.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className={`flex mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[85%] md:max-w-[70%] px-3 md:px-4 py-2 md:py-3 wrap-break-word relative shadow-lg"
                          style={{
                            borderRadius: isOwnMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background: isOwnMessage ? theme.accent : theme.surface,
                            color: isOwnMessage ? theme.accentText : theme.text,
                            boxShadow: `0 10px 24px ${theme.shadow}`,
                            ...(message.error ? { border: '1px solid #f44336' } : {}),
                            opacity: message.isTemp ? 0.7 : 1,
                          }}
                        >
                          <p className="m-0 text-xs md:text-sm leading-relaxed wrap-break-word">
                            {message.content}
                          </p>
                          <p className="mt-1 text-[10px] opacity-70 text-right">
                            {message.isTemp ? 'Sending...' : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {message.error && <span className="ml-2 text-red-500">Failed</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <form
            className="dashboard-composer flex flex-nowrap w-full items-center gap-2 px-3 py-2 md:px-5 md:py-4 shrink-0"
            onSubmit={onSendMessage}
            style={{
              background: theme.surface,
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(event) => onNewMessageChange(event.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 min-w-0 px-4 py-2.5 md:py-3 rounded-full outline-none font-sans text-sm transition-all focus:ring-2"
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.subtle,
                color: theme.text,
              }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="dashboard-send-button min-w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: theme.accent,
                color: theme.accentText,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
