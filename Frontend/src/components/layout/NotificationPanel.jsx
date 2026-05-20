import { useEffect } from 'react';

const getNotificationBadgeStyle = (theme, type) => ({
  background: type === 'incoming-request' ? theme.accent : theme.subtle,
  color: type === 'incoming-request' ? theme.accentText : theme.text,
});

const getNotificationIcon = (type) => {
  if (type === 'incoming-request') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
};

const NotificationPanel = ({
  theme,
  isOpen,
  notifications,
  pendingIncomingRequestIds,
  actionUserId,
  onClose,
  onAcceptRequest,
  onRejectRequest,
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

  // Notification item component (reused)
  const NotificationItem = ({ notification, isMobile = false }) => {
    const isIncomingRequest =
      notification.type === 'incoming-request' &&
      pendingIncomingRequestIds.includes(notification.userId);
    
    const isAccepted = notification.type === 'request-accepted';

    return (
      <div
        className={`${isMobile ? 'p-3' : 'p-2.5'} rounded-xl transition-all duration-200 ${
          !notification.read ? 'bg-opacity-30' : ''
        }`}
        style={{
          background: notification.read ? 'transparent' : theme.subtle,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex items-start gap-2.5">
          {/* Icon */}
          {/* <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: isIncomingRequest ? theme.accent : theme.subtle,
              color: isIncomingRequest ? theme.accentText : theme.muted,
            }}
          >
            {getNotificationIcon(notification.type)}
          </div> */}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="m-0 text-xs font-semibold" style={{ color: theme.text }}>
                {notification.title}
              </p>
              {!notification.read && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />
              )}
            </div>
            <p className="m-0 mt-0.5 text-[11px] leading-4" style={{ color: theme.muted }}>
              {notification.message}
            </p>
            <p className="m-0 mt-1 text-[9px]" style={{ color: theme.muted }}>
              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => onDismissNotification(notification.id)}
            className="border-none bg-transparent p-1 cursor-pointer shrink-0 rounded-md hover:bg-opacity-10 transition-colors"
            style={{ color: theme.muted }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Action Buttons for incoming requests */}
        {isIncomingRequest && (
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={() => onAcceptRequest(notification.userId)}
              disabled={actionUserId === notification.userId}
              className="flex-1 rounded-lg border-none px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{
                background: theme.accent,
                color: theme.accentText,
              }}
            >
              {actionUserId === notification.userId ? 'Accepting...' : 'Accept'}
            </button>
            <button
              type="button"
              onClick={() => onRejectRequest?.(notification.userId)}
              disabled={actionUserId === notification.userId}
              className="flex-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-5"
              style={{
                background: 'transparent',
                borderColor: theme.border,
                color: theme.muted,
              }}
            >
              Reject
            </button>
          </div>
        )}

        {/* Badge for accepted requests */}
        {isAccepted && (
          <div className="mt-2">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[9px] font-medium"
              style={{
                background: `${theme.accent}15`,
                color: theme.accent,
              }}
            >
              Connection established
            </span>
          </div>
        )}
      </div>
    );
  };

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
            <p className="m-0 text-base font-semibold" style={{ color: theme.text }}>
              Notifications
            </p>
            {/* <p className="m-0 mt-0.5 text-[10px]" style={{ color: theme.muted }}>
              {notifications.filter(n => !n.read).length} unread
            </p> */}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-none bg-transparent p-2 cursor-pointer"
            style={{ color: theme.muted }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {/* Group by date */}
            {(() => {
              const today = [];
              const yesterday = [];
              const older = [];
              const now = new Date();
              
              notifications.forEach(notification => {
                const notifDate = new Date(notification.createdAt);
                const diffDays = Math.floor((now - notifDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) today.push(notification);
                else if (diffDays === 1) yesterday.push(notification);
                else older.push(notification);
              });
              
              return (
                <>
                  {today.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wide px-1 mb-1" style={{ color: theme.muted }}>
                        Today
                      </p>
                      {today.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} isMobile />
                      ))}
                    </>
                  )}
                  
                  {yesterday.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wide px-1 mt-2 mb-1" style={{ color: theme.muted }}>
                        Yesterday
                      </p>
                      {yesterday.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} isMobile />
                      ))}
                    </>
                  )}
                  
                  {older.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wide px-1 mt-2 mb-1" style={{ color: theme.muted }}>
                        Older
                      </p>
                      {older.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} isMobile />
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="rounded-xl px-4 py-16 text-center" style={{ background: theme.subtle }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="1.5" className="mx-auto mb-3">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="m-0 text-sm font-medium" style={{ color: theme.text }}>
              No notifications
            </p>
            <p className="m-0 mt-1 text-[11px]" style={{ color: theme.muted }}>
              When you get notifications, they'll appear here
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
        className="fixed inset-0 border-none bg-black/20 z-40"
      />

      <div
        className="fixed right-3 top-18 z-50 w-80 rounded-xl shadow-xl overflow-hidden animate-fadeIn"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 20px 40px ${theme.shadow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: theme.border }}>
          <div>
            <p className="m-0 text-sm font-semibold" style={{ color: theme.text }}>
              Notifications
            </p>
            {/* <p className="m-0 text-[9px]" style={{ color: theme.muted }}>
              {notifications.filter(n => !n.read).length} unread
            </p> */}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-none bg-transparent p-1.5 cursor-pointer hover:bg-opacity-10 transition-colors"
            style={{ color: theme.muted }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-100 overflow-y-auto p-2">
          {notifications.length > 0 ? (
            <div className="space-y-1.5">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} isMobile={false} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg px-4 py-12 text-center" style={{ background: theme.subtle }}>
              <p className="m-0 text-xs font-medium" style={{ color: theme.text }}>
                No notifications
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
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