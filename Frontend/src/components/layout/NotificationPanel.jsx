import { useEffect } from 'react';

const getNotificationBadgeStyle = (theme, type) => ({
  background: type === 'incoming-request' ? theme.accent : theme.subtle,
  color: type === 'incoming-request' ? theme.accentText : theme.text,
});

const NotificationPanel = ({
  theme,
  isOpen,
  notifications,
  pendingIncomingRequestIds,
  actionUserId,
  onClose,
  onAcceptRequest,
  onDismissNotification,
}) => {
  // Prevent body scroll when notification page is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Mobile full page view
  const MobileView = () => (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: theme.surface }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b" style={{ 
        background: theme.surface,
        borderColor: theme.border 
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="m-0 text-xl font-semibold" style={{ color: theme.text }}>
              Notifications
            </p>
            <p className="m-0 mt-1 text-xs" style={{ color: theme.muted }}>
              Requests and updates
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-none bg-transparent p-2 text-sm cursor-pointer"
            style={{ color: theme.muted }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {notifications.length ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isIncomingRequest =
                notification.type === 'incoming-request' &&
                pendingIncomingRequestIds.includes(notification.userId);

              return (
                <div
                  key={notification.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: notification.read ? theme.surface : theme.subtle,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                          style={getNotificationBadgeStyle(theme, notification.type)}
                        >
                          {notification.type === 'incoming-request' ? 'Request' : 'Accepted'}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
                        )}
                      </div>

                      <p className="m-0 mt-2 text-base font-semibold" style={{ color: theme.text }}>
                        {notification.title}
                      </p>
                      <p className="m-0 mt-1 text-sm leading-5" style={{ color: theme.muted }}>
                        {notification.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissNotification(notification.id)}
                      className="border-none bg-transparent p-1 cursor-pointer shrink-0"
                      style={{ color: theme.muted }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>

                  {isIncomingRequest && (
                    <button
                      type="button"
                      onClick={() => onAcceptRequest(notification.userId)}
                      disabled={actionUserId === notification.userId}
                      className="mt-3 w-full rounded-xl border-none px-3 py-3 text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: theme.accent,
                        color: theme.accentText,
                      }}
                    >
                      {actionUserId === notification.userId ? 'Accepting...' : 'Accept request'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl px-4 py-20 text-center" style={{ background: theme.subtle }}>
            <p className="m-0 text-base font-semibold" style={{ color: theme.text }}>
              No notifications yet
            </p>
            <p className="m-0 mt-2 text-sm" style={{ color: theme.muted }}>
              When you receive notifications, they'll appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Desktop panel view
  const DesktopView = () => (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="fixed inset-0 border-none bg-black/30 z-40"
      />

      <div
        className="fixed right-3 top-18 z-50 w-[calc(100vw-24px)] max-w-sm rounded-3xl p-3 shadow-2xl md:right-6 md:top-22"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 24px 60px ${theme.shadow}`,
        }}
      >
        <div className="flex items-center justify-between px-2 pb-3">
          <div>
            <p className="m-0 text-lg font-semibold" style={{ color: theme.text }}>
              Notifications
            </p>
            <p className="m-0 mt-1 text-xs" style={{ color: theme.muted }}>
              Requests and updates
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-none bg-transparent p-2 text-sm cursor-pointer"
            style={{ color: theme.muted }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {notifications.length ? (
            notifications.map((notification) => {
              const isIncomingRequest =
                notification.type === 'incoming-request' &&
                pendingIncomingRequestIds.includes(notification.userId);

              return (
                <div
                  key={notification.id}
                  className="mb-2 rounded-2xl p-3"
                  style={{
                    background: notification.read ? theme.surface : theme.subtle,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                          style={getNotificationBadgeStyle(theme, notification.type)}
                        >
                          {notification.type === 'incoming-request' ? 'Request' : 'Accepted'}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
                        )}
                      </div>

                      <p className="m-0 mt-2 text-sm font-semibold" style={{ color: theme.text }}>
                        {notification.title}
                      </p>
                      <p className="m-0 mt-1 text-xs leading-5" style={{ color: theme.muted }}>
                        {notification.message}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissNotification(notification.id)}
                      className="border-none bg-transparent p-1 cursor-pointer"
                      style={{ color: theme.muted }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>

                  {isIncomingRequest && (
                    <button
                      type="button"
                      onClick={() => onAcceptRequest(notification.userId)}
                      disabled={actionUserId === notification.userId}
                      className="mt-3 rounded-xl border-none px-3 py-2 text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: theme.accent,
                        color: theme.accentText,
                      }}
                    >
                      {actionUserId === notification.userId ? 'Accepting...' : 'Accept request'}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl px-4 py-10 text-center" style={{ background: theme.subtle }}>
              <p className="m-0 text-sm font-semibold" style={{ color: theme.text }}>
                No notifications yet
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Responsive rendering
  return (
    <div className="notification-container">
      {/* Mobile view (below 768px) */}
      <div className="block md:hidden">
        <MobileView />
      </div>
      
      {/* Desktop view (768px and above) */}
      <div className="hidden md:block">
        <DesktopView />
      </div>
    </div>
  );
};

export default NotificationPanel;