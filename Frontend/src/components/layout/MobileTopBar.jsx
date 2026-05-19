import UnionImg from '../../assets/Union.png';

const MobileTopBar = ({ theme, notificationCount, onOpenNotifications }) => (
  <div
    className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden"
    style={{
      background: theme.surface,
      borderBottom: `1px solid ${theme.border}`,
      boxShadow: `0 10px 32px ${theme.shadow}`,
    }}
  >
    <img src={UnionImg} alt="Logo" className="h-10 w-10 rounded-xl object-contain" />

    <button
      type="button"
      onClick={onOpenNotifications}
      className="relative rounded-2xl border-none p-2 cursor-pointer"
      style={{ background: theme.subtle, color: theme.text }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          {notificationCount > 4 ? '4+' : notificationCount}
        </span>
      )}
    </button>
  </div>
);

export default MobileTopBar;
