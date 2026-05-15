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
  chatUser.name?.toLowerCase().includes(searchQuery.trim().toLowerCase());

const ChatSidebar = ({
  theme,
  users,
  selectedUser,
  searchQuery,
  isCompactMobile,
  isSidebarOpen,
  onSelectUser,
  onNavigateToSettings,
}) => {
  const filteredUsers = users.filter((chatUser) => matchesSearch(chatUser, searchQuery));

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
      <div className="flex-1 overflow-y-auto px-3 py-2.5">
        {filteredUsers.length === 0 ? (
          <p className="text-center py-10 px-5" style={{ color: theme.muted }}>
            {searchQuery.trim() ? 'No user found' : 'No other users found'}
          </p>
        ) : (
          filteredUsers.map((chatUser) => {
            const isSelected = selectedUser?.id === chatUser.id;

            return (
              <div
                key={chatUser.id}
                onClick={() => onSelectUser(chatUser)}
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

                    {chatUser.lastMessageTime && (
                      <span className="text-[10px] shrink-0" style={{ color: theme.muted }}>
                        {formatLastMessageTime(chatUser.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <p className="m-0 mt-1 text-[13px] truncate" style={{ color: theme.muted }}>
                    {chatUser.lastMessage || 'Click to start chatting'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button
          type="button"
          onClick={onNavigateToSettings}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer text-left transition-all hover:opacity-80"
          style={{
            background: theme.subtle,
            color: theme.text,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: theme.pageBackground }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="m-0 font-semibold">Settings</p>
            <p className="m-0 mt-1 text-xs" style={{ color: theme.muted }}>
              Theme and password options
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
