import { useEffect, useRef, useState } from 'react';
import Avatar from '../common/Avatar';

const SWIPE_REPLY_TRIGGER_DISTANCE = 100;
const SWIPE_REPLY_MAX_HORIZONTAL_DRIFT = 28;
const SWIPE_REPLY_MAX_TRANSLATE = 38;

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

const truncateReplyContent = (content, maxLength = 72) => {
  const normalizedContent = typeof content === 'string' ? content.trim() : '';
  if (!normalizedContent) {
    return 'Replying to a message';
  }
  return normalizedContent.length > maxLength
    ? `${normalizedContent.slice(0, maxLength - 3).trim()}...`
    : normalizedContent;
};

const getReplyAuthorLabel = (senderEmail, currentUserEmail, selectedUser) => {
  if (!senderEmail) {
    return 'Original message';
  }
  if (senderEmail === currentUserEmail) {
    return 'You';
  }
  return selectedUser?.name || senderEmail;
};

const EmptyConversationState = ({ theme }) => (
  <div
    className="flex h-full items-center justify-center p-5 text-center"
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
  <div className="px-5 py-16 text-center" style={{ color: theme.muted }}>
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.border}
      strokeWidth="1.5"
      className="mx-auto"
    >
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
          description:
            'Send a follow request first. After acceptance, both of you will appear in each others followers, following, and chat list.',
          actionLabel: isBusy ? 'Sending...' : 'Send Request',
          actionType: 'send',
        };

  return (
    <div
      className="flex flex-1 items-center justify-center px-6 py-8 text-center"
      style={{ background: theme.subtle }}
    >
      <div className="max-w-md">
        <Avatar
          name={selectedUser.name}
          avatarUrl={selectedUser.avatarUrl}
          className="mx-auto h-20 w-20 rounded-2xl text-2xl"
          style={{
            background: theme.surface,
            color: theme.text,
            boxShadow: `0 14px 30px ${theme.shadow}`,
          }}
        />

        <h3 className="mb-2 mt-5 text-xl" style={{ color: theme.text }}>
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
              className="cursor-pointer rounded-2xl border-none px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
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
              className="cursor-pointer rounded-2xl border-none px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: theme.accent, color: theme.accentText }}
            >
              {statusCopy.actionLabel}
            </button>
          )}

          {statusCopy.actionType === 'waiting' && (
            <span
              className="inline-flex rounded-full px-4 py-2 text-sm font-medium"
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

const ReplySnippet = ({
  theme,
  senderEmail,
  content,
  currentUserEmail,
  selectedUser,
  isOutgoing = false,
}) => (
  <div
    className="mb-2 rounded-xl px-2.5 py-1"
    style={{
      background: isOutgoing ? `${theme.accentText}1c` : theme.pageBackground,
      borderLeft: `3px solid ${isOutgoing ? theme.accentText : theme.accent}`,
    }}
  >
    <p
      className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: isOutgoing ? `${theme.accentText}cc` : theme.accent }}
    >
      {getReplyAuthorLabel(senderEmail, currentUserEmail, selectedUser)}
    </p>
    <p
      className="mt-1 line-clamp-2 text-[11px] leading-4"
      style={{ color: isOutgoing ? `${theme.accentText}cc` : theme.muted }}
    >
      {truncateReplyContent(content)}
    </p>
  </div>
);

const ComposerReplyPreview = ({
  theme,
  replyingTo,
  currentUserEmail,
  selectedUser,
  onCancelReply,
}) => (
  <div
    className="flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2"
    style={{ background: theme.subtle }}
  >
    <div className="min-w-0 flex-1">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.accent }}>
        Replying to {getReplyAuthorLabel(replyingTo?.senderEmail, currentUserEmail, selectedUser)}
      </p>
      <p className="mt-1 truncate text-sm" style={{ color: theme.text }}>
        {truncateReplyContent(replyingTo?.content)}
      </p>
    </div>
    <button
      type="button"
      onClick={onCancelReply}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-none bg-transparent"
      style={{ color: theme.muted }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const MessageBubble = ({
  theme,
  message,
  isOwnMessage,
  isLastMessage,
  currentUserEmail,
  selectedUser,
  isCompactMobile,
  onReplyMessage,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [showReplyHint, setShowReplyHint] = useState(false);
  const touchStartRef = useRef(null);
  const hasTriggeredReplyRef = useRef(false);

  const replyLabel = getReplyAuthorLabel(message.replyToSenderEmail, currentUserEmail, selectedUser);

  const resetReplyGesture = () => {
    touchStartRef.current = null;
    hasTriggeredReplyRef.current = false;
    setDragOffset(0);
    setShowReplyHint(false);
  };

  const handleTouchStart = (event) => {
    if (!isCompactMobile || !onReplyMessage) {
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchMove = (event) => {
    if (!isCompactMobile || !touchStartRef.current || hasTriggeredReplyRef.current) {
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaX = touch.clientX - touchStartRef.current.x;

    if (deltaY <= 0 || Math.abs(deltaX) > SWIPE_REPLY_MAX_HORIZONTAL_DRIFT) {
      setDragOffset(0);
      setShowReplyHint(false);
      return;
    }

    setShowReplyHint(deltaY > 10);
    setDragOffset(Math.min(SWIPE_REPLY_MAX_TRANSLATE, deltaY / 4));

    if (deltaY >= SWIPE_REPLY_TRIGGER_DISTANCE) {
      hasTriggeredReplyRef.current = true;
      onReplyMessage?.(message);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      resetReplyGesture();
    }
  };

  const bubbleBackground = isOwnMessage ? theme.accent : theme.surface;
  const bubbleText = isOwnMessage ? theme.accentText : theme.text;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex max-w-[78%] flex-col md:max-w-[62%] ${
          isOwnMessage ? 'items-end' : 'items-start'
        }`}
      >
        <div className="relative w-full">
          {isCompactMobile && showReplyHint && (
            <div
              className={`pointer-events-none absolute ${
                isOwnMessage ? 'right-2' : 'left-2'
              } top-0 rounded-full px-2 py-1 text-[10px] font-semibold`}
              style={{ background: theme.pageBackground, color: theme.accent }}
            >
              replying.....
            </div>
          )}

          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={resetReplyGesture}
            onTouchCancel={resetReplyGesture}
            className={`px-3 py-1.5 ${
              isOwnMessage ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
            }`}
            style={{
              background: bubbleBackground,
              color: bubbleText,
              boxShadow: `0 1px 4px ${theme.shadow}`,
              opacity: message.isTemp ? 0.7 : 1,
              transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
              transition: dragOffset ? 'none' : 'transform 0.18s ease',
            }}
          >
            {message.replyToContent && (
              <ReplySnippet
                theme={theme}
                senderEmail={message.replyToSenderEmail}
                content={message.replyToContent}
                currentUserEmail={currentUserEmail}
                selectedUser={selectedUser}
                isOutgoing={isOwnMessage}
              />
            )}

            <p className="m-0 whitespace-pre-wrap text-[13px] leading-relaxed wrap-break-word">
              {message.content}
            </p>

            <div className="mt-0.5 flex items-center justify-end gap-1">
              <span className="text-[9px] opacity-55">
                {message.isTemp
                  ? 'Sending...'
                  : new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
              </span>

              {message.error && <span className="text-[9px] text-red-400">!</span>}
            </div>
          </div>
        </div>

        {isLastMessage && isOwnMessage && message.isread === 'READ' && !message.isTemp && (
          <span className="mt-1 px-1 text-[11px] font-medium" style={{ color: theme.muted }}>
            Seen
          </span>
        )}

        {!message.replyToContent ? null : (
          <span className="sr-only">
            Reply to {replyLabel}: {truncateReplyContent(message.replyToContent)}
          </span>
        )}
      </div>
    </div>
  );
};

const ChatWindow = ({
  theme,
  selectedUser,
  messages,
  newMessage,
  replyingTo,
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
  onReplyMessage,
  onCancelReply,
}) => {
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const orderedMessages = sortMessagesByTime(messages);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!selectedUser?.isConnected || loading) {
      return;
    }

    const timer = setTimeout(() => {
      if (selectedUser?.email) {
        onMarkAsRead?.(selectedUser.email);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedUser?.email, selectedUser?.isConnected, loading, onMarkAsRead]);

  useEffect(() => {
    if (!selectedUser?.isConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      if (selectedUser?.email && document.visibilityState === 'visible') {
        onMarkAsRead?.(selectedUser.email);
      }
    }, 15000);

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

  useEffect(() => {
    if (!replyingTo) {
      return;
    }

    inputRef.current?.focus();
  }, [replyingTo]);

  const handleScroll = () => {
    if (!selectedUser?.isConnected) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    if (isAtBottom) {
      onMarkAsRead?.(selectedUser.email);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [orderedMessages, replyingTo]);

  if (!selectedUser) {
    return <EmptyConversationState theme={theme} />;
  }

  const isUserOnline = Boolean(selectedUser.isActive);
  const userStatusText = selectedUser.isConnected
    ? isUserOnline
      ? 'Online'
      : 'Offline'
    : selectedUser.isRequestReceived
      ? 'Request received'
      : selectedUser.isRequestSent
        ? 'Pending request'
        : 'Not connected';
  const conversationSubtitle = getConversationSubtitle(selectedUser);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="chat-header flex shrink-0 items-center gap-3 border-b px-4 py-4"
        style={{ borderColor: theme.border, background: theme.surface }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 transition-colors hover:opacity-70 md:hidden"
          style={{ color: theme.text }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <Avatar
          name={selectedUser.name}
          avatarUrl={selectedUser.avatarUrl}
          className="h-9 w-9 rounded-xl text-sm"
          style={{ background: theme.pageBackground, color: theme.text }}
        />

        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-sm font-semibold leading-tight" style={{ color: theme.text }}>
            {selectedUser.name}
          </h3>
          <p className="m-0 mt-0.5 truncate text-[11px] leading-tight" style={{ color: theme.muted }}>
            {conversationSubtitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {selectedUser.isConnected && (
            <span
              className="whitespace-nowrap rounded-full px-2 py-1 text-[11px]"
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
                onClick={() => setShowMenu((currentValue) => !currentValue)}
                className="flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
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
                    className="absolute right-0 top-full z-50 mt-2 w-32 overflow-hidden rounded-xl shadow-lg"
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
                      className="w-full cursor-pointer border-none bg-transparent px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
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
            className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4"
            style={{ background: theme.subtle, overscrollBehavior: 'contain' }}
          >
            {loading ? (
              <div className="py-10 text-center" style={{ color: theme.muted }}>
                Loading messages...
              </div>
            ) : orderedMessages.length === 0 ? (
              <EmptyMessagesState theme={theme} />
            ) : (
              orderedMessages.map((message, index) => {
                const isOwnMessage = message.senderEmail === currentUserEmail;
                const previousMessage = orderedMessages[index - 1];
                const isLastMessage = index === orderedMessages.length - 1;
                const shouldShowDate =
                  index === 0 ||
                  new Date(message.timestamp).toDateString() !==
                    new Date(previousMessage?.timestamp).toDateString();

                return (
                  <div key={message.id || index}>
                    {shouldShowDate && (
                      <div className="my-3 text-center">
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-[10px]"
                          style={{ color: theme.muted, background: theme.surface }}
                        >
                          {formatMessageDate(message.timestamp)}
                        </span>
                      </div>
                    )}

                    <MessageBubble
                      theme={theme}
                      message={message}
                      isOwnMessage={isOwnMessage}
                      isLastMessage={isLastMessage}
                      currentUserEmail={currentUserEmail}
                      selectedUser={selectedUser}
                      isCompactMobile={isCompactMobile}
                      onReplyMessage={onReplyMessage}
                    />
                  </div>
                );
              })
            )}
          </div>

          <form
            className="flex shrink-0 flex-col gap-2 border-t px-3 py-2.5"
            onSubmit={onSendMessage}
            style={{ background: theme.surface, borderColor: theme.border }}
          >
            {replyingTo && (
              <ComposerReplyPreview
                theme={theme}
                replyingTo={replyingTo}
                currentUserEmail={currentUserEmail}
                selectedUser={selectedUser}
                onCancelReply={onCancelReply}
              />
            )}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(event) => onNewMessageChange(event.target.value)}
                placeholder={replyingTo ? 'Write your reply...' : 'Type a new message...'}
                disabled={sending}
                className="chat-message-input flex-1 rounded-full px-3.5 py-2 text-sm outline-none transition-all"
                style={{
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  background: theme.pageBackground,
                  '--chat-input-placeholder': theme.muted,
                  '--chat-input-focus': `${theme.accent}22`,
                }}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: theme.accent, color: theme.accentText }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>
        </>
      )}

      <style>{`
        .chat-message-input::placeholder {
          color: var(--chat-input-placeholder);
          opacity: 1;
        }

        .chat-message-input:focus {
          box-shadow: 0 0 0 3px var(--chat-input-focus);
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;
