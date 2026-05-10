// pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import ChatNavbar from '../components/chat/ChatNavbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useChat from '../hooks/useChat';

window.global = window;

const defaultTheme = {
  pageBackground: '#f5f3ef',
  surface: '#ffffff',
  subtle: '#faf7f2',
  border: '#e8e0d6',
  accent: '#111111',
  accentText: '#ffffff',
  muted: '#8d8479',
  text: '#111111',
  shadow: 'rgba(24, 18, 12, 0.08)',
};

const Dashboard = ({
  theme = defaultTheme,
  user,
  onLogout,
  onNavigateToProfile,
  onNavigateToSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCompactMobile, setIsCompactMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  );

  const {
    users,
    selectedUser,
    messages,
    newMessage,
    setNewMessage,
    loading,
    sending,
    isConnected,
    selectUser,
    clearSelectedUser,
    sendMessage,
  } = useChat({ currentUser: user });

  // Responsive listener
  useEffect(() => {
    const onResize = () => setIsCompactMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mobile menu close karo jab compact mode se bahar jao
  useEffect(() => {
    if (isCompactMobile) setMobileMenuOpen(false);
  }, [isCompactMobile]);

  const showMobileListPage = isCompactMobile && !selectedUser;
  const showSidebarPanel = !isCompactMobile || !selectedUser;
  const showChatPanel = !isCompactMobile || Boolean(selectedUser);

  return (
    <div
      className="dashboard-page min-h-screen flex flex-col overflow-hidden"
      style={{
        background: theme.pageBackground,
        fontFamily: "'DM Sans', sans-serif",
        color: theme.text,
      }}
    >
      <ChatNavbar
        theme={theme}
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={showMobileListPage || !isCompactMobile}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToSettings={onNavigateToSettings}
        onLogout={onLogout}
        onOpenSidebar={() => setMobileMenuOpen(true)}
      />

      {/* Overlay for mobile sidebar */}
      {!isCompactMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/35 z-[998]"
        />
      )}

      {/* Main Layout */}
      <div
        className={`flex-1 flex min-h-0 p-[18px] gap-[18px] ${
          showMobileListPage ? 'dashboard-layout--mobile-list' : ''
        } ${isCompactMobile && selectedUser ? 'dashboard-layout--mobile-chat' : ''}`}
      >
        {showSidebarPanel && (
          <ChatSidebar
            theme={theme}
            users={users}
            selectedUser={selectedUser}
            searchQuery={searchQuery}
            isCompactMobile={isCompactMobile}
            mobileMenuOpen={mobileMenuOpen}
            onSelectUser={selectUser}
            onNavigateToSettings={onNavigateToSettings}
          />
        )}

        {showChatPanel && (
          <div
            className={`flex-1 min-h-0 flex flex-col ${
              isCompactMobile ? 'dashboard-chat-window--mobile-page' : ''
            }`}
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '32px',
              boxShadow: `0 18px 42px ${theme.shadow}`,
              overflow: 'hidden',
            }}
          >
            <ChatWindow
              theme={theme}
              selectedUser={selectedUser}
              messages={messages}
              newMessage={newMessage}
              loading={loading}
              sending={sending}
              isConnected={isConnected}
              currentUserEmail={user?.email}
              isCompactMobile={isCompactMobile}
              onNewMessageChange={setNewMessage}
              onSendMessage={sendMessage}
              onBack={clearSelectedUser}
            />
          </div>
        )}
      </div>

      <style>{`
        .dashboard-page { overflow: hidden; }

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
          .dashboard-page { overflow: auto; }
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
            padding: 0 !important; gap: 0 !important; min-height: calc(100dvh - 94px);
          }
          .sidebar--mobile-page, .dashboard-chat-window--mobile-page {
            position: relative !important; left: auto !important; top: auto !important;
            bottom: auto !important; transform: none !important; z-index: auto !important;
            width: 100% !important; max-width: 100% !important; min-height: 100%;
            border-radius: 0 !important; border: none !important; box-shadow: none !important;
          }
          .mobile-menu-btn { display: none !important; }
          .dashboard-chat-window { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          .dashboard-chat-header { flex-wrap: wrap; align-items: center !important; padding: 14px 12px !important; }
          .dashboard-chat-status { width: 100%; text-align: left; }
          .dashboard-composer { flex-direction: column; align-items: stretch !important; padding: 12px !important; }
          .dashboard-send-button { width: 100%; justify-content: center; padding: 14px 20px !important; }
          .dashboard-chat-window input[type="text"] { width: 100%; }
          .sidebar--mobile-page > div:first-child { padding: 14px 12px 10px !important; }
          .sidebar--mobile-page > div:nth-child(2) { padding: 8px 8px 10px !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;