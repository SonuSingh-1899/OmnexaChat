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

const UserCard = ({
  chatUser,
  theme,
  isSelected,
  subtitle,
  trailingText,
  actionConfig,
  onClick,
  onAction,
}) => (
  <div
    onClick={onClick}
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
      className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-bold"
      style={{ background: theme.pageBackground, color: theme.text }}
    >
      {getUserInitial(chatUser.name)}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline gap-2">
        <p className="m-0 font-semibold truncate" style={{ color: theme.text }}>
          {chatUser.name}
        </p>

        {trailingText && (
          <span className="text-[10px] shrink-0" style={{ color: theme.muted }}>
            {trailingText}
          </span>
        )}
      </div>

      <p className="m-0 mt-1 text-[13px] truncate" style={{ color: theme.muted }}>
        {subtitle}
      </p>
    </div>

    {actionConfig && (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAction?.(actionConfig.action, chatUser);
        }}
        disabled={actionConfig.disabled}
        className="shrink-0 px-3 py-2 rounded-xl border-none text-xs font-semibold cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: actionConfig.appearance === 'primary' ? theme.accent : theme.pageBackground,
          color: actionConfig.appearance === 'primary' ? theme.accentText : theme.text,
        }}
      >
        {actionConfig.label}
      </button>
    )}
  </div>
);

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
}) => {
  const normalizedSearch = searchQuery.trim();

  // Connected users jo search query se match karte hain (local filter)
  const connectedMatches = users.filter((chatUser) => matchesSearch(chatUser, searchQuery));

  // DB search results mein se sirf wo jo connected nahi hain (duplicate avoid karne ke liye)
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

    if (action === 'open-chat') {
      void onSelectUser(chatUser);
    }
  };

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
        {/* Pending Requests — sirf tab jab search nahi ho raha */}
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
              />
            ))}
          </div>
        )}

        {/* Connected Users — hamesha dikhega, search hone par filtered */}
        <div className={showSearchSection ? 'mb-4' : ''}>
          <SectionTitle theme={theme}>
            {showSearchSection ? 'Connected' : 'Connected Users'}
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
              />
            ))
          )}
        </div>

        {/* DB Search Results — sirf non-connected users, desktop + mobile dono pe */}
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