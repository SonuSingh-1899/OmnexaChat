// pages/Settings.jsx
import MobileTopBar from '../components/layout/MobileTopBar';

const Settings = ({
  theme,
  isCompactMobile,
  notificationCount,
  onOpenNotifications,
  currentThemeKey,
  themeOptions,
  onThemeChange,
  onNavigateToDashboard,
  onNavigateToChangePassword,
}) => {
  return (
    <div
      className="settings-page min-h-screen"
      style={{
        background: theme.pageBackground,
        fontFamily: "'DM Sans', sans-serif",
        color: theme.text,
        paddingBottom: isCompactMobile ? '96px' : undefined,
      }}
    >
      {isCompactMobile && (
        <MobileTopBar
          theme={theme}
          notificationCount={notificationCount}
          onOpenNotifications={onOpenNotifications}
        />
      )}

      <div
        className={`settings-header items-center justify-between px-4 py-4 md:px-8 md:py-6 ${isCompactMobile ? 'hidden md:flex' : 'flex'}`}
        style={{
          background: theme.pageBackground,
        }}
      >
        <button
          onClick={onNavigateToDashboard}
          className="bg-none border-none cursor-pointer flex items-center gap-2 text-sm"
          style={{ color: theme.text }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden md:inline">Back to Chat</span>
        </button>
        <h1 className="font-serif text-xl md:text-2xl font-normal m-0 flex-1 text-center md:flex-none">
          Settings
        </h1>
        <div className="w-17.5 md:w-27.5" />
      </div>

      <div className="settings-content w-full px-4 pb-8 md:px-8 md:pb-12">
        <section className="py-4 md:py-6">
          <h2 className="font-serif text-2xl md:text-3xl font-normal mb-2 m-0">
            Theme
          </h2>
          <p className="text-sm mb-5 md:mb-6 max-w-2xl" style={{ color: theme.muted }}>
            Choose one of the 3 logo-inspired black and neutral themes for your chat app.
          </p>

          <div className="settings-theme-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {Object.entries(themeOptions).map(([themeKey, option]) => {
              const isActive = currentThemeKey === themeKey;

              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => onThemeChange(themeKey)}
                  className="p-5 rounded-2xl cursor-pointer text-left transition-all"
                  style={{
                    border: `1px solid ${isActive ? option.accent : theme.border}`,
                    background: option.surface,
                    boxShadow: isActive ? `0 12px 24px ${option.shadow}` : `0 4px 14px ${theme.shadow}`,
                  }}
                >
                  <div className="flex gap-2.5 mb-3.5">
                    <span className="w-5.5 h-5.5 rounded-full" style={{ background: option.accent }} />
                  </div>
                  <p className="font-semibold text-[15px] m-0 mb-1.5" style={{ color: option.text }}>
                    {option.label}
                  </p>
                  <p className="text-[12px] m-0" style={{ color: option.muted }}>
                    {isActive ? 'active' : 'Tap to apply'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="py-6"
          style={{
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <h2 className="font-serif text-2xl md:text-3xl font-normal mb-2 m-0">
            Security
          </h2>
          <p className="text-sm mb-4 md:mb-5 max-w-2xl" style={{ color: theme.muted }}>
            you can change your password using your current password.
          </p>

          <button
            type="button"
            onClick={onNavigateToChangePassword}
            className="border-none rounded-2xl py-3.5 px-4 cursor-pointer text-sm font-semibold"
            style={{
              background: theme.accent,
              color: theme.accentText,
            }}
          >
            Change Password
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
