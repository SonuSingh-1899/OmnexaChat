// components/chat/ProfilePopup.jsx
import { useEffect, useRef } from 'react';

const getUserInitial = (name) => name?.charAt(0).toUpperCase() || '?';

const ProfilePopup = ({
  user,
  theme,
  isVisible,
  onClose,
  onUnfollow,
  onAccept,
  onReject,
  onCancel,
  onSendRequest,
  actionUserId,
  position, 
}) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };
    
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target) && isVisible) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !user) return null;

  const isBusy = actionUserId === user.id;

  // Determine popup position
  const getPositionStyle = () => {
    if (position) {
      return {
        top: position.y,
        left: position.x,
      };
    }
    // Default center position for mobile
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <>
      {/* Backdrop - only for mobile */}
      <div 
        className="fixed inset-0 z-40 md:hidden" 
        style={{ background: 'rgba(0,0,0,0.3)' }}
        onClick={onClose} 
      />

      {/* Popup Menu */}
      <div
        ref={popupRef}
        className="fixed z-50 min-w-50 max-w-70] rounded-xl shadow-xl overflow-hidden animate-fadeIn"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 10px 25px -5px ${theme.shadow}`,
          ...getPositionStyle(),
        }}
      >
        {/* User Info Section */}
        <div 
          className="flex items-center gap-3 p-3 border-b"
          style={{ borderColor: theme.border }}
        >
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
            style={{
              background: theme.accent,
              color: theme.accentText,
            }}
          >
            {getUserInitial(user.name)}
          </div>

          {/* Name & Email */}
          <div className="flex-1 min-w-0">
            <p className="m-0 text-sm font-semibold truncate" style={{ color: theme.text }}>
              {user.name}
            </p>
            <p className="m-0 text-[11px] truncate" style={{ color: theme.muted }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-1">
          {user.isConnected && (
            <button
              onClick={() => {
                onUnfollow?.(user);
                onClose();
              }}
              disabled={isBusy}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
              style={{
                background: 'transparent',
                color: '#000000',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.subtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {isBusy ? 'Unfollowing...' : `Unfollow ${user.name.split(' ')[0]}`}
            </button>
          )}

          {!user.isConnected && user.isRequestReceived && (
            <>
              <button
                onClick={() => {
                  onAccept?.(user);
                  onClose();
                }}
                disabled={isBusy}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
                style={{
                  background: 'transparent',
                  color: theme.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.subtle;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {isBusy ? 'Accepting...' : 'Accept Request'}
              </button>
              <button
                onClick={() => {
                  onReject?.(user);
                  onClose();
                }}
                disabled={isBusy}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
                style={{
                  background: 'transparent',
                  color: theme.muted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.subtle;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                Reject
              </button>
            </>
          )}

          {!user.isConnected && !user.isRequestReceived && user.isRequestSent && (
            <button
              onClick={() => {
                onCancel?.(user);
                onClose();
              }}
              disabled={isBusy}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
              style={{
                background: 'transparent',
                color: theme.muted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.subtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {isBusy ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}

          {!user.isConnected && !user.isRequestReceived && !user.isRequestSent && (
            <button
              onClick={() => {
                onSendRequest?.(user);
                onClose();
              }}
              disabled={isBusy}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
              style={{
                background: 'transparent',
                color: theme.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.subtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {isBusy ? 'Sending...' : 'Add Friend'}
            </button>
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
};

export default ProfilePopup;