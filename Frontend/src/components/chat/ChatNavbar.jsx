import UnionImg from '../../assets/Union.png';

const ChatNavbar = ({
  theme,
  user,
  searchQuery,
  showSearch,
  onSearchChange,
  onNavigateToProfile,
  onNavigateToSettings,
  onOpenSidebar,
}) => {
  const userInitial = user?.name?.charAt(0).toUpperCase() || '?';

  return (
    <div
      className="dashboard-navbar flex items-center justify-between gap-4 px-5 md:py-0 py-0"
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: `0 10px 32px ${theme.shadow}`,
      }}
    >
      <div className="dashboard-brand flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="mobile-menu-btn hidden bg-transparent border-none cursor-pointer p-2"
          style={{ background: 'none', border: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="p-2">
          <img
            src={UnionImg}
            alt="Logo"
            className="w-11 h-11 rounded-xl object-contain shrink-0"
          />
        </div>
      </div>

      {showSearch && (
        <div
          className="dashboard-search flex-1 max-w-105 flex items-center gap-2.5 px-4 py-3 rounded-full"
          style={{
            background: theme.subtle,
            border: `1px solid ${theme.border}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search users..."
            className="dashboard-search-input w-full border-none outline-none bg-transparent text-sm"
            style={{
              color: theme.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
      )}

      <div className="dashboard-actions flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          title="Profile"
          onClick={onNavigateToProfile}
          className="dashboard-profile-button w-10 h-10 rounded-full border-none font-bold cursor-pointer"
          style={{
            background: theme.accent,
            color: theme.accentText,
          }}
        >
          {userInitial}
        </button>

        <button
          type="button"
          title="Settings"
          onClick={onNavigateToSettings}
          className="dashboard-settings-button bg-transparent border-none cursor-pointer p-2 rounded-lg"
          style={{ color: theme.muted }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatNavbar;
