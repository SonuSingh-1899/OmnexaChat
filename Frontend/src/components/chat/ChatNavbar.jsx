import { useEffect, useRef } from 'react';
import Avatar from '../common/Avatar';
import UnionImg from '../../assets/Union.png';

const ChatNavbar = ({
  theme,
  user,
  searchQuery,
  showSearch,
  onSearchChange,
  notificationCount,
  isCompactMobile,
  onOpenNotifications,
  onNavigateToProfile,
  onNavigateToSettings,
  onOpenSidebar,
  onMobileSearch,
  isMobileSearchExpanded,
  onToggleMobileSearch,
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isMobileSearchExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobileSearchExpanded]);

  const handleClearAndClose = () => {
    onMobileSearch('');
    onToggleMobileSearch();
  };

  return (
    <div
      className="dashboard-navbar flex items-center justify-between gap-4 px-5 md:py-0 py-0"
      style={{
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: `0 10px 32px ${theme.shadow}`,
      }}
    >
      {/* Brand — hide karo jab mobile search expanded ho */}
      {!isMobileSearchExpanded && (
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
      )}

      {/* Desktop search bar */}
      {showSearch && !isCompactMobile && (
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

      {/* Mobile expanded search input — notification ke baad, full width leta hai */}
      {isCompactMobile && isMobileSearchExpanded && (
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{
            background: theme.subtle,
            border: `1px solid ${theme.border}`,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search users..."
            className="flex-1 border-none outline-none bg-transparent text-sm min-w-0"
            style={{
              color: theme.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
            onChange={(e) => onMobileSearch(e.target.value)}
          />
        </div>
      )}

      <div className="dashboard-actions flex items-center gap-2 shrink-0">
        {/* Mobile: Search toggle button ya X button — pehle */}
        {isCompactMobile && (
          <button
            type="button"
            title={isMobileSearchExpanded ? 'Close search' : 'Search'}
            onClick={isMobileSearchExpanded ? handleClearAndClose : onToggleMobileSearch}
            className="w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              background: theme.subtle,
              color: theme.text,
            }}
          >
            {isMobileSearchExpanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>
        )}

        {/* Notification button — baad mein */}
        {!isMobileSearchExpanded && (
          <button
            type="button"
            title="Notifications"
            onClick={onOpenNotifications}
            className="dashboard-notification-button relative w-10 h-10 rounded-2xl border-none cursor-pointer"
            style={{
              background: theme.subtle,
              color: theme.text,
            }}
          >
            <svg className="w-7 h-6 sm:w-10 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M10 17a2 2 0 0 0 4 0" />
            </svg>

            {notificationCount > 0 && (
              <span
                className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full px-1 text-[10px] font-semibold flex items-center justify-center"
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* Desktop buttons */}
        {!isCompactMobile && (
          <>
            <button
              type="button"
              title="Profile"
              onClick={onNavigateToProfile}
              className="dashboard-profile-button w-9 h-9 rounded-full border-none cursor-pointer overflow-hidden p-0"
              style={{ background: 'transparent' }}
            >
              <Avatar
                name={user?.name}
                avatarUrl={user?.avatarUrl}
                className="w-9 h-9 rounded-full text-xs"
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                }}
              />
            </button>

            <button
              type="button"
              title="Settings"
              onClick={onNavigateToSettings}
              className="dashboard-settings-button bg-transparent border-none cursor-pointer p-2 rounded-lg"
              style={{ color: theme.muted }}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatNavbar;
