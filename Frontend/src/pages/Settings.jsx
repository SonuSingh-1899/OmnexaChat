// pages/Settings.jsx
const Settings = ({
  theme,
  currentThemeKey,
  themeOptions,
  onThemeChange,
  onNavigateToDashboard,
  onNavigateToChangePassword,
}) => {
  return (
    <div className="settings-page min-h-screen" style={{
      background: theme.pageBackground,
      fontFamily: "'DM Sans', sans-serif",
      color: theme.text,
    }}>
      <div className="settings-header flex items-center justify-between p-4 md:p-6 border-b" style={{
        background: theme.surface,
        borderBottomColor: theme.border,
      }}>
        <button
          onClick={onNavigateToDashboard}
          className="bg-none border-none cursor-pointer flex items-center gap-2 text-sm"
          style={{ color: theme.text }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Chat
        </button>
        <h1 className="font-serif text-xl md:text-2xl font-normal m-0">
          Settings
        </h1>
        <div className="w-[70px] md:w-[110px]" />
      </div>

      <div className="settings-content max-w-[900px] mx-auto p-6 md:p-8 space-y-6">
        <section className="rounded-2xl p-6" style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 16px 40px ${theme.shadow}`,
        }}>
          <h2 className="font-serif text-2xl font-normal mb-2 m-0">
            Theme
          </h2>
          <p className="text-sm mb-5" style={{ color: theme.muted }}>
            Choose one of the 3 UI colors for your chat app.
          </p>

          <div className="settings-theme-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(themeOptions).map(([themeKey, option]) => {
              const isActive = currentThemeKey === themeKey;

              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => onThemeChange(themeKey)}
                  className="p-[18px] rounded-2xl cursor-pointer text-left"
                  style={{
                    border: `2px solid ${isActive ? option.accent : option.border}`,
                    background: option.surface,
                    boxShadow: isActive ? `0 12px 24px ${option.shadow}` : 'none',
                  }}
                >
                  <div className="flex gap-2.5 mb-3.5">
                    <span className="w-[22px] h-[22px] rounded-full" style={{ background: option.accent }} />
                    <span className="w-[22px] h-[22px] rounded-full border" style={{ background: option.subtle, borderColor: option.border }} />
                    <span className="w-[22px] h-[22px] rounded-full border" style={{ background: option.pageBackground, borderColor: option.border }} />
                  </div>
                  <p className="font-semibold text-[15px] m-0 mb-1.5" style={{ color: option.text }}>
                    {option.label}
                  </p>
                  <p className="text-[12px] m-0" style={{ color: option.muted }}>
                    {isActive ? 'Currently active' : 'Tap to apply'}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl p-6" style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 16px 40px ${theme.shadow}`,
        }}>
          <h2 className="font-serif text-2xl font-normal mb-2 m-0">
            Security
          </h2>
          <p className="text-sm mb-4" style={{ color: theme.muted }}>
            Password change option ab settings page ke andar hai.
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