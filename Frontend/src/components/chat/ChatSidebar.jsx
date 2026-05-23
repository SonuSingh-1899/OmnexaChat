// ChatSidebar.jsx (Updated)
import { useState, useRef } from 'react';
import ProfilePopup from './ProfilePopup';

const formatLastMessageTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const messageDate = new Date(timestamp);
  const now = new Date();
  const dayDifference = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

  if (dayDifference === 0) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (dayDifference === 1) {
    return 'Yesterday';
  }

  if (dayDifference < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  }

  return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getUserInitial = (name) => name?.charAt(0).toUpperCase() || '?';

const matchesSearch = (chatUser, searchQuery) =>
  chatUser.name?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
  chatUser.email?.toLowerCase().includes(searchQuery.trim().toLowerCase());

const getActionConfig = (chatUser, isBusy) => {
  if (chatUser.isConnected) {
    return {
      label: 'Open chat',
      disabled: false,
      appearance: 'secondary',
      action: 'open-chat',
    };
  }

  if (chatUser.isRequestReceived) {
    return {
      label: isBusy ? 'Accepting...' : 'Accept',
      disabled: isBusy,
      appearance: 'primary',
      action: 'accept',
    };
  }

  if (chatUser.isRequestSent) {
    return {
      label: 'Requested',
      disabled: true,
      appearance: 'secondary',
      action: 'requested',
    };
  }

  return {
    label: isBusy ? 'Sending...' : 'Add friend',
    disabled: isBusy,
    appearance: 'primary',
    action: 'send-request',
  };
};

const SectionTitle = ({ children, theme }) => (
  <p
    className="m-0 mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
    style={{ color: theme.muted }}
  >
    {children}
  </p>
);

const getDisplayMessageWithCount = (chatUser) => {
  // Exactly 1 unread → show message content
  if (chatUser.unreadCount === 1) {
    if (chatUser.lastMessage) {
      const message = chatUser.lastMessage;
      return message.length > 32 ? message.slice(0, 32) + '...' : message;
    }
    return 'New message';
  }

  // More than 1 unread → show count + "new messages"
  if (chatUser.unreadCount > 1) {
    return `${chatUser.unreadCount} new messages`;
  }

  // No unread → show last message or fallback
  if (chatUser.lastMessage) {
    const message = chatUser.lastMessage;
    return message.length > 32 ? message.slice(0, 32) + '...' : message;
  }

  return 'Ready to chat';
};

const UserCard = ({
  chatUser,
  theme,
  isSelected,
  subtitle,
  trailingText,
  actionConfig,
  onClick,
  onAction,
  onUnfollow,
  onReject,
  onCancel,
  onAccept,
  onSendRequest,
  actionUserId,
}) => {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  const displayMessage = getDisplayMessageWithCount(chatUser);
  const hasUnread = chatUser.unreadCount > 0;

  const handleTouchStart = (e) => {
    isLongPress.current = false;
    const clientX = e.touches?.[0]?.clientX || e.clientX;
    const clientY = e.touches?.[0]?.clientY || e.clientY;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setPopupPosition({ x: clientX - 100, y: clientY - 60 });
      setShowProfilePopup(true);
    }, 500);
  };

  const handleTouchEnd = (e) => {
    clearTimeout(longPressTimer.current);
    if (isLongPress.current) {
      e?.stopPropagation();
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const handleTouchMove = () => {
    clearTimeout(longPressTimer.current);
  };

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => clearTimeout(longPressTimer.current)}
        className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer mb-2 transition-colors duration-200"
        style={{
          background: isSelected ? theme.subtle : 'transparent',
        }}
        onMouseEnter={(event) => {
          if (!isSelected) {
            event.currentTarget.style.background = theme.subtle;
          }
        }}
        onMouseLeave={(event) => {
          if (!isSelected) {
            event.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <div
          className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-bold relative"
          style={{ background: theme.pageBackground, color: theme.text }}
        >
          {getUserInitial(chatUser.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <p
              className="m-0 truncate"
              style={{
                color: theme.text,
                fontWeight: hasUnread ? '700' : '600',
              }}
            >
              {chatUser.name}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {trailingText && (
                <span
                  className="text-[10px] whitespace-nowrap"
                  style={{
                    color: hasUnread ? theme.accent : theme.muted,
                    fontWeight: hasUnread ? '600' : '400',
                  }}
                >
                  {trailingText}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Display message with proper styling */}
            <p
              className="m-0 text-xs truncate flex-1"
              style={{
                color: hasUnread ? theme.accent : theme.muted,
                fontWeight: hasUnread ? '600' : '400',
              }}
            >
              {displayMessage}
            </p>

            {/* Unread count badge - only show when > 1 */}
            {hasUnread && chatUser.unreadCount > 1 && (
              <span
                className="shrink-0 min-w-4.5 h-4.5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                }}
              >
                {chatUser.unreadCount}
              </span>
            )}

            {/* Single unread dot */}
            {hasUnread && chatUser.unreadCount === 1 && (
              <span
                className="shrink-0 w-2 h-2 rounded-full"
                style={{ background: theme.accent }}
              />
            )}
          </div>
        </div>

        {actionConfig && !chatUser.isConnected && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (actionConfig.action === 'accept') {
                onAccept?.(chatUser);
              } else if (actionConfig.action === 'send-request') {
                onSendRequest?.(chatUser);
              } else if (actionConfig.action === 'requested') {
                onCancel?.(chatUser);
              }
            }}
            disabled={actionConfig.disabled}
            className="shrink-0 px-3 py-2 rounded-xl border-none text-xs font-semibold cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: actionConfig.appearance === 'primary' ? theme.accent : theme.pageBackground,
              color: actionConfig.appearance === 'primary' ? theme.accentText : theme.text,
            }}
          >
            {actionConfig.action === 'requested' ? 'Cancel' : actionConfig.label}
          </button>
        )}
      </div>

      <ProfilePopup
        user={chatUser}
        theme={theme}
        isVisible={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        onUnfollow={onUnfollow}
        onAccept={onAccept}
        onReject={onReject}
        onCancel={onCancel}
        onSendRequest={onSendRequest}
        actionUserId={actionUserId}
        position={popupPosition}
      />
    </>
  );
};

const ChatSidebar = ({
  theme,
  users,
  incomingRequests,
  searchResults,
  selectedUser,
  searchQuery,
  isSearching,
  actionUserId,
  isCompactMobile,
  isSidebarOpen,
  onSelectUser,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onUnfollowUser,
}) => {
  const normalizedSearch = searchQuery.trim();

  const connectedMatches = users.filter((chatUser) => matchesSearch(chatUser, searchQuery));
  const nonConnectedSearchResults = searchResults.filter((chatUser) => !chatUser.isConnected);
  const showRequestSection = !normalizedSearch && incomingRequests.length > 0;
  const showSearchSection = Boolean(normalizedSearch);

  const handleCardAction = (action, chatUser) => {
    if (action === 'accept') {
      void onAcceptRequest(chatUser);
      return;
    }
    if (action === 'send-request') {
      void onSendRequest(chatUser);
      return;
    }
    if (action === 'requested') {
      void onCancelRequest(chatUser);
      return;
    }
    if (action === 'open-chat') {
      void onSelectUser(chatUser);
    }
  };

  const totalUnread = users.reduce((sum, user) => sum + (user.unreadCount || 0), 0);

  return (
    <div
      className={`sidebar w-80 flex flex-col min-h-0 ${
        isSidebarOpen ? 'open' : ''
      } ${isCompactMobile ? 'sidebar--mobile-page' : ''}`}
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: `0 18px 42px ${theme.shadow}`,
      }}
    >
      <div
        className="flex-1 overflow-y-auto px-3 py-2.5"
        style={{ paddingBottom: isCompactMobile ? '96px' : undefined }}
      >
        {showRequestSection && (
          <div className="mb-4">
            <SectionTitle theme={theme}>Pending Requests</SectionTitle>
            {incomingRequests.map((chatUser) => (
              <UserCard
                key={`request-${chatUser.id}`}
                chatUser={chatUser}
                theme={theme}
                isSelected={selectedUser?.id === chatUser.id}
                subtitle={`${chatUser.email} wants to connect`}
                actionConfig={getActionConfig(chatUser, actionUserId === chatUser.id)}
                onClick={() => onSelectUser(chatUser)}
                onAction={handleCardAction}
                onUnfollow={onUnfollowUser}
                onReject={onRejectRequest}
                onCancel={onCancelRequest}
                onAccept={onAcceptRequest}
                onSendRequest={onSendRequest}
                actionUserId={actionUserId}
              />
            ))}
          </div>
        )}

        <div className={showSearchSection ? 'mb-4' : ''}>
          <SectionTitle theme={theme}>
            {showSearchSection ? 'Connected' : 'Chats'}
            {!showSearchSection && totalUnread > 0 && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                }}
              >
                {totalUnread}
              </span>
            )}
          </SectionTitle>

          {connectedMatches.length === 0 && !showSearchSection ? (
            <p className="text-center py-10 px-5 text-sm" style={{ color: theme.muted }}>
              No connected users yet. Search someone above and send a request.
            </p>
          ) : connectedMatches.length === 0 && showSearchSection ? (
            <p className="text-center py-4 px-5 text-sm" style={{ color: theme.muted }}>
              No connected users match your search.
            </p>
          ) : (
            connectedMatches.map((chatUser) => (
              <UserCard
                key={`connected-${chatUser.id}`}
                chatUser={chatUser}
                theme={theme}
                isSelected={selectedUser?.id === chatUser.id}
                subtitle={chatUser.lastMessage || 'Ready to chat'}
                trailingText={
                  chatUser.lastMessageTime
                    ? formatLastMessageTime(chatUser.lastMessageTime)
                    : ''
                }
                onClick={() => onSelectUser(chatUser)}
                onUnfollow={onUnfollowUser}
                onAccept={onAcceptRequest}
                onSendRequest={onSendRequest}
                actionUserId={actionUserId}
              />
            ))
          )}
        </div>

        {showSearchSection && (
          <div className="mt-2">
            <SectionTitle theme={theme}>Other Users</SectionTitle>
            {isSearching ? (
              <p className="text-center py-8 px-5 text-sm" style={{ color: theme.muted }}>
                Searching users...
              </p>
            ) : nonConnectedSearchResults.length === 0 ? (
              <p className="text-center py-4 px-5 text-sm" style={{ color: theme.muted }}>
                No other users found.
              </p>
            ) : (
              nonConnectedSearchResults.map((chatUser) => (
                <UserCard
                  key={`search-${chatUser.id}`}
                  chatUser={chatUser}
                  theme={theme}
                  isSelected={selectedUser?.id === chatUser.id}
                  subtitle={chatUser.bio?.trim() || chatUser.email}
                  actionConfig={getActionConfig(chatUser, actionUserId === chatUser.id)}
                  onClick={() => onSelectUser(chatUser)}
                  onAction={handleCardAction}
                  onUnfollow={onUnfollowUser}
                  onReject={onRejectRequest}
                  onCancel={onCancelRequest}
                  onAccept={onAcceptRequest}
                  onSendRequest={onSendRequest}
                  actionUserId={actionUserId}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;