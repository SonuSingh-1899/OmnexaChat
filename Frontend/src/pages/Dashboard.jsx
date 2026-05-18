import { useEffect, useState } from 'react';
import ChatNavbar from '../components/chat/ChatNavbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useChat from '../hooks/useChat';
import { getTheme } from '../theme/themeOptions';

window.global = window;

const MOBILE_BREAKPOINT = 640;

const DASHBOARD_RESPONSIVE_STYLES = `
  .dashboard-page {
    height: var(--dashboard-app-height, 100vh);
    min-height: var(--dashboard-app-height, 100vh);
    max-height: var(--dashboard-app-height, 100vh);
    overflow: hidden;
  }

  .dashboard-page--mobile-chat {
    overflow: hidden !important;
  }

  .dashboard-layout,
  .dashboard-chat-window,
  .dashboard-chat-window > div {
    min-height: 0;
  }

  @media (max-width: 900px) {
    .dashboard-page { min-height: 100dvh; }
    .dashboard-navbar {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: "brand actions" "search search";
      align-items: center !important;
      padding: 14px 16px !important;
    }
    .dashboard-brand { grid-area: brand; min-width: 0; flex: initial !important; }
    .dashboard-search { grid-area: search; flex: initial !important; max-width: 100% !important; width: 100%; }
    .dashboard-actions { grid-area: actions; margin-left: 0; justify-self: end; }
    .dashboard-layout { padding: 14px !important; }
    .sidebar {
      position: fixed; left: 14px; top: 94px; bottom: 14px;
      z-index: 1000; transform: translateX(-120%); transition: transform 0.3s ease;
      max-width: calc(100vw - 28px);
      width: min(320px, calc(100vw - 28px)) !important;
    }
    .sidebar.open { transform: translateX(0); }
    .mobile-menu-btn { display: flex !important; }
    .dashboard-chat-window { border-radius: 24px !important; }
    .dashboard-chat-header { padding: 16px !important; }
    .dashboard-composer { padding: 14px 16px !important; }
  }

  @media (max-width: 640px) {
    .dashboard-page {
      height: var(--dashboard-app-height, 100vh) !important;
      min-height: var(--dashboard-app-height, 100vh) !important;
      max-height: var(--dashboard-app-height, 100vh) !important;
      overflow: hidden !important;
    }
    .dashboard-page--mobile-chat {
      position: fixed !important;
      inset: 0 !important;
      width: 100% !important;
      height: var(--dashboard-app-height, 100vh) !important;
      min-height: var(--dashboard-app-height, 100vh) !important;
      max-height: var(--dashboard-app-height, 100vh) !important;
      overflow: hidden !important;
    }
    .dashboard-navbar { gap: 12px !important; padding: 12px 12px 14px !important; grid-template-columns: minmax(0, 1fr) auto; }
    .dashboard-brand { gap: 8px !important; }
    .dashboard-brand-badge { width: 36px !important; height: 36px !important; border-radius: 12px !important; font-size: 13px !important; }
    .dashboard-brand-copy h1 { font-size: 18px !important; line-height: 1.1; }
    .dashboard-brand-copy p { display: none; }
    .dashboard-search { padding: 10px 12px !important; gap: 8px !important; }
    .dashboard-search-input { font-size: 13px !important; }
    .dashboard-actions { gap: 4px !important; }
    .dashboard-profile-button { width: 34px !important; height: 34px !important; font-size: 12px !important; }
    .dashboard-logout-button, .mobile-menu-btn { padding: 6px !important; }
    .dashboard-layout { padding: 0 !important; gap: 0 !important; }
    .dashboard-layout--mobile-list, .dashboard-layout--mobile-chat {
      padding: 0 !important;
      gap: 0 !important;
      height: 100% !important;
      min-height: 0 !important;
      max-height: 100% !important;
    }
    .dashboard-page--mobile-chat .dashboard-layout--mobile-chat {
      flex: 1 1 auto !important;
      height: 100% !important;
      min-height: 0 !important;
      max-height: 100% !important;
      overflow: hidden !important;
    }
    .dashboard-chat-window--mobile-page {
      height: 100% !important;
      min-height: 0 !important;
      max-height: 100% !important;
      flex: 1 1 auto !important;
      overflow: hidden !important;
    }
    .sidebar--mobile-page, .dashboard-chat-window--mobile-page {
      position: relative !important; left: auto !important; top: auto !important;
      bottom: auto !important; transform: none !important; z-index: auto !important;
      width: 100% !important; max-width: 100% !important; min-height: 0 !important;
      border-radius: 0 !important; border: none !important; box-shadow: none !important;
    }
    .dashboard-chat-window--mobile-page > div {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }
    .mobile-menu-btn { display: none !important; }
    .dashboard-chat-window { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
    .dashboard-chat-header {
      flex-wrap: nowrap !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 12px !important;
    }
    .dashboard-chat-header > div:nth-child(2) {
      width: 40px !important;
      height: 40px !important;
      border-radius: 14px !important;
    }
    .dashboard-chat-status {
      width: auto !important;
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px !important;
      padding: 6px 8px !important;
    }
    .dashboard-composer {
      flex-direction: row !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) !important;
    }
    .dashboard-send-button {
      width: 44px !important;
      min-width: 44px !important;
      height: 44px !important;
      padding: 0 !important;
      justify-content: center !important;
    }
    .dashboard-chat-window input[type="text"] {
      width: auto !important;
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }
    .dashboard-messages {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      max-height: 100% !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    .sidebar--mobile-page > div:first-child { padding: 14px 12px 10px !important; }
    .sidebar--mobile-page > div:nth-child(2) { padding: 8px 8px 10px !important; }
  }
`;

const getCurrentCompactMode = () =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;

const getLayoutState = (isCompactMobile, selectedUser) => {
  const hasSelectedUser = Boolean(selectedUser);

  return {
    showTopNavbar: !isCompactMobile || !hasSelectedUser,
    showSidebar: !isCompactMobile || !hasSelectedUser,
    showChatWindow: !isCompactMobile || hasSelectedUser,
    showMobileListPage: isCompactMobile && !hasSelectedUser,
    showMobileChatPage: isCompactMobile && hasSelectedUser,
  };
};

const chatWindowStyle = (theme, isCompactMobile) => ({
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  boxShadow: `0 18px 42px ${theme.shadow}`,
  overflow: 'hidden',
  ...(isCompactMobile ? {} : {}),
});

const Dashboard = ({
  theme = getTheme(),
  user,
  onNavigateToProfile,
  onNavigateToSettings,
  onRefreshCurrentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompactMobile, setIsCompactMobile] = useState(getCurrentCompactMode);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    users,
    incomingRequests,
    searchResults,
    selectedUser,
    messages,
    newMessage,
    setNewMessage,
    loading,
    sending,
    searchingUsers,
    actionUserId,
    selectUser,
    clearSelectedUser,
    sendMessage,
    sendFollowRequest,
    acceptFollowRequest,
  } = useChat({
    user,
    searchQuery,
    onConnectionChange: onRefreshCurrentUser,
  });

  useEffect(() => {
    const updateCompactMode = () => {
      setIsCompactMobile(getCurrentCompactMode());
    };

    window.addEventListener('resize', updateCompactMode);

    return () => {
      window.removeEventListener('resize', updateCompactMode);
    };
  }, []);

  useEffect(() => {
    if (isCompactMobile) {
      setIsSidebarOpen(false);
    }
  }, [isCompactMobile]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-page-background', theme.pageBackground);
    document.body.style.background = theme.pageBackground;

    return () => {
      document.documentElement.style.removeProperty('--app-page-background');
      document.body.style.removeProperty('background');
    };
  }, [theme.pageBackground]);

  useEffect(() => {
    const syncViewportHeight = () => {
      const nextHeight = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--dashboard-app-height', `${nextHeight}px`);
    };

    syncViewportHeight();

    window.addEventListener('resize', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);
    window.visualViewport?.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('scroll', syncViewportHeight);

    return () => {
      window.removeEventListener('resize', syncViewportHeight);
      window.removeEventListener('orientationchange', syncViewportHeight);
      window.visualViewport?.removeEventListener('resize', syncViewportHeight);
      window.visualViewport?.removeEventListener('scroll', syncViewportHeight);
      document.documentElement.style.removeProperty('--dashboard-app-height');
    };
  }, []);

  const layout = getLayoutState(isCompactMobile, selectedUser);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <div
      className={`dashboard-page flex flex-col overflow-hidden ${
        layout.showMobileListPage ? 'dashboard-page--mobile-list' : ''
      } ${
        layout.showMobileChatPage ? 'dashboard-page--mobile-chat' : ''
      }`}
      style={{
        background: theme.pageBackground,
        fontFamily: "'DM Sans', sans-serif",
        color: theme.text,
      }}
    >
      {layout.showTopNavbar && (
        <ChatNavbar
          theme={theme}
          user={user}
          searchQuery={searchQuery}
          showSearch={layout.showMobileListPage || !isCompactMobile}
          onSearchChange={setSearchQuery}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToSettings={onNavigateToSettings}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      )}

      {!isCompactMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/35 z-998"
        />
      )}

      <div
        className={`dashboard-layout flex-1 flex overflow-hidden min-h-0 ${
          layout.showMobileListPage ? 'dashboard-layout--mobile-list' : ''
        } ${layout.showMobileChatPage ? 'dashboard-layout--mobile-chat' : ''}`}
        style={{ background: theme.pageBackground }}
      >
        {layout.showSidebar && (
          <ChatSidebar
            theme={theme}
            users={users}
            incomingRequests={incomingRequests}
            searchResults={searchResults}
            selectedUser={selectedUser}
            searchQuery={searchQuery}
            isSearching={searchingUsers}
            actionUserId={actionUserId}
            isCompactMobile={isCompactMobile}
            isSidebarOpen={isSidebarOpen}
            onSelectUser={(chatUser) => {
              setIsSidebarOpen(false);
              void selectUser(chatUser);
            }}
            onSendRequest={(chatUser) => {
              void sendFollowRequest(chatUser);
            }}
            onAcceptRequest={(chatUser) => {
              void acceptFollowRequest(chatUser, { openChat: true });
            }}
            onNavigateToSettings={onNavigateToSettings}
          />
        )}

        {layout.showChatWindow && (
          <div
            className={`dashboard-chat-window flex-1 min-h-0 overflow-hidden flex flex-col ${
              isCompactMobile ? 'dashboard-chat-window--mobile-page' : ''
            }`}
            style={chatWindowStyle(theme, isCompactMobile)}
          >
            <ChatWindow
              theme={theme}
              selectedUser={selectedUser}
              messages={messages}
              newMessage={newMessage}
              loading={loading}
              sending={sending}
              currentUserEmail={user?.email}
              actionUserId={actionUserId}
              isCompactMobile={isCompactMobile}
              onNewMessageChange={setNewMessage}
              onSendMessage={sendMessage}
              onSendRequest={(chatUser) => {
                void sendFollowRequest(chatUser);
              }}
              onAcceptRequest={(chatUser) => {
                void acceptFollowRequest(chatUser, { openChat: true });
              }}
              onBack={clearSelectedUser}
            />
          </div>
        )}
      </div>

      <style>{DASHBOARD_RESPONSIVE_STYLES}</style>
    </div>
  );
};

export default Dashboard;
