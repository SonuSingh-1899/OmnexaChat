import { ROUTES } from '../../routes/appRoutes';

const navItems = [
  {
    route: ROUTES.dashboard,
    label: 'Home',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    route: ROUTES.stories,
    label: 'Stories',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    route: ROUTES.settings,
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    route: ROUTES.profile,
    label: 'Profile',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21a8 8 0 1 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    ),
  },
];

const MobileBottomBar = ({ theme, currentRoute, onNavigate }) => (
  <div
    className="fixed inset-x-0 bottom-0 z-30 rounded-xs px-1 py-1 md:hidden"
    style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      boxShadow: `0 20px 40px ${theme.shadow}`,
    }}
  >
    <div className="grid grid-cols-4 gap-1">
      {navItems.map((item) => {
        const isActive = currentRoute === item.route;

        return (
          <button
            key={item.route}
            type="button"
            onClick={() => onNavigate(item.route)}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border-none px-1 py-1.5 text-[11px] font-medium cursor-pointer"
            style={{
              background: isActive ? theme.accent : 'transparent',
              color: isActive ? theme.accentText : theme.muted,
            }}
          >
            {item.icon}
            <span className='text-[12px]' >{item.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default MobileBottomBar;
