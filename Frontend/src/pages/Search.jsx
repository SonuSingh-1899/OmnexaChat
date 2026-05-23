import { useState } from 'react';
import Avatar from '../components/common/Avatar';
import MobileTopBar from '../components/layout/MobileTopBar';
import useChat from '../hooks/useChat';

const getActionConfig = (chatUser, isBusy) => {
  if (chatUser.isConnected) {
    return {
      label: 'Open chat',
      action: 'open-chat',
      disabled: false,
      appearance: 'secondary',
    };
  }

  if (chatUser.isRequestReceived) {
    return {
      label: isBusy ? 'Accepting...' : 'Accept',
      action: 'accept',
      disabled: isBusy,
      appearance: 'primary',
    };
  }

  if (chatUser.isRequestSent) {
    return {
      label: 'Requested',
      action: 'requested',
      disabled: true,
      appearance: 'secondary',
    };
  }

  return {
    label: isBusy ? 'Sending...' : 'Add friend',
    action: 'send-request',
    disabled: isBusy,
    appearance: 'primary',
  };
};

const Search = ({
  theme,
  user,
  isCompactMobile,
  notificationCount,
  onOpenNotifications,
  onRefreshCurrentUser,
  onOpenChatUser,
  onNavigateToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    searchResults,
    searchingUsers,
    actionUserId,
    sendFollowRequest,
    acceptFollowRequest,
  } = useChat({
    user,
    searchQuery,
    onConnectionChange: onRefreshCurrentUser,
  });

  const normalizedQuery = searchQuery.trim();

  const handleAction = async (chatUser) => {
    const actionConfig = getActionConfig(chatUser, actionUserId === chatUser.id);

    if (actionConfig.action === 'open-chat') {
      onOpenChatUser(chatUser);
      return;
    }

    if (actionConfig.action === 'accept') {
      await acceptFollowRequest(chatUser);
      return;
    }

    if (actionConfig.action === 'send-request') {
      await sendFollowRequest(chatUser);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: theme.pageBackground,
        color: theme.text,
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: isCompactMobile ? '96px' : '24px',
      }}
    >
      {isCompactMobile ? (
        <MobileTopBar
          theme={theme}
          notificationCount={notificationCount}
          onOpenNotifications={onOpenNotifications}
        />
      ) : (
        <div className="flex items-center justify-between px-6 py-6 md:px-8">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="flex items-center gap-2 border-none bg-transparent cursor-pointer text-sm"
            style={{ color: theme.text }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span>Back to Chat</span>
          </button>

          <h1 className="m-0 text-3xl font-semibold">Search</h1>
          <div className="w-24" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
        <div
          className="rounded-[28px] p-4 md:p-5"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 18px 42px ${theme.shadow}`,
          }}
        >
          <div
            className="flex items-center gap-3 rounded-full px-4 py-3"
            style={{
              background: theme.subtle,
              border: `1px solid ${theme.border}`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users by name or email"
              className="w-full border-none bg-transparent outline-none text-sm"
              style={{ color: theme.text }}
            />
          </div>

          <div className="mt-5">
            {searchingUsers ? (
              <p className="m-0 py-8 text-center text-sm" style={{ color: theme.muted }}>
                Searching users...
              </p>
            ) : null}

            {!searchingUsers && !normalizedQuery ? (
              <p className="m-0 py-8 text-center text-sm" style={{ color: theme.muted }}>
                Search karke users list yahan show hogi.
              </p>
            ) : null}

            {!searchingUsers && normalizedQuery && !searchResults.length ? (
              <p className="m-0 py-8 text-center text-sm" style={{ color: theme.muted }}>
                No users found.
              </p>
            ) : null}

            {searchResults.map((chatUser) => {
              const actionConfig = getActionConfig(chatUser, actionUserId === chatUser.id);

              return (
                <div
                  key={chatUser.id}
                  className="mb-3 flex items-center gap-3 rounded-2xl p-3"
                  style={{
                    background: theme.subtle,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <Avatar
                    name={chatUser.name}
                    avatarUrl={chatUser.avatarUrl}
                    className="h-11 w-11 rounded-xl text-sm"
                    style={{ background: theme.pageBackground, color: theme.text }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm font-semibold">{chatUser.name}</p>
                    <p className="m-0 mt-1 truncate text-xs" style={{ color: theme.muted }}>
                      {chatUser.bio?.trim() || chatUser.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleAction(chatUser);
                    }}
                    disabled={actionConfig.disabled}
                    className="shrink-0 rounded-xl border-none px-3 py-2 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background:
                        actionConfig.appearance === 'primary' ? theme.accent : theme.pageBackground,
                      color: actionConfig.appearance === 'primary' ? theme.accentText : theme.text,
                    }}
                  >
                    {actionConfig.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
