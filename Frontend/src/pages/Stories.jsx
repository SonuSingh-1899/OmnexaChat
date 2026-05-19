import MobileTopBar from '../components/layout/MobileTopBar';

const Stories = ({ theme, isCompactMobile, notificationCount, onOpenNotifications }) => {
  const pagePaddingBottom = isCompactMobile ? '96px' : '24px';

  return (
    <div
      className="min-h-screen"
      style={{
        background: theme.pageBackground,
        color: theme.text,
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: pagePaddingBottom,
      }}
    >
      {isCompactMobile ? (
        <MobileTopBar
          theme={theme}
          notificationCount={notificationCount}
          onOpenNotifications={onOpenNotifications}
        />
      ) : (
        <div className="px-6 py-6 md:px-8">
          <h1 className="m-0 text-3xl font-semibold">Stories</h1>
        </div>
      )}

      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-8 text-center">
        <div
          className="w-full rounded-4xl px-6 py-14"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 18px 42px ${theme.shadow}`,
          }}
        >
          <p className="m-0 text-xl font-semibold">Stories page</p>
          <p className="m-0 mt-3 text-sm" style={{ color: theme.muted }}>
            comming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stories;
