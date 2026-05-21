// pages/Profile.jsx
import { useState, useEffect } from 'react';
import MobileTopBar from '../components/layout/MobileTopBar';
import { profileApi } from '../lib/api';

const Profile = ({
  theme,
  user,
  isCompactMobile,
  notificationCount,
  onOpenNotifications,
  onUserUpdated,
  onLogout,
  onNavigateToDashboard,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const refreshProfile = async () => {
      try {
        const latestProfile = await profileApi.getMe();
        if (isMounted) {
          onUserUpdated?.(latestProfile);
          localStorage.setItem('user', JSON.stringify(latestProfile));
        }
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    };

    void refreshProfile();

    return () => {
      isMounted = false;
    };
  }, [onUserUpdated]);

  const openEditMode = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
    });
    setErrors({});
    setMessage({ text: '', type: '' });
    setIsEditing(true);
  };

  const closeEditMode = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
    });
    setErrors({});
    setMessage({ text: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setMessage({ text: '', type: '' });
  };

  const validateProfileForm = () => {
    const nextErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedBio = formData.bio.trim();

    if (!trimmedName) {
      nextErrors.name = 'Name is required';
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      nextErrors.name = 'Name must be less than 50 characters';
    }

    if (trimmedBio.length > 200) {
      nextErrors.bio = 'Bio must be less than 200 characters';
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateProfileForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setMessage({ text: '', type: '' });

    try {
      const payload = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
      };

      const updated = await profileApi.update({
        ...payload,
        avatarUrl: formData.avatarUrl,
      });

      const refreshedProfile = await profileApi.getMe().catch(() => updated);
      const nextUser = { ...updated, ...refreshedProfile };

      onUserUpdated?.(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
      setFormData(prev => ({
        ...prev,
        name: nextUser.name || payload.name,
        bio: nextUser.bio || '',
        avatarUrl: nextUser.avatarUrl || '',
      }));
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update profile', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
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

      {/* Header - Same as Settings page */}
      <div
        className={`flex items-center justify-between px-4 py-4 md:px-8 md:py-6 border-b ${isCompactMobile ? 'hidden md:flex' : 'flex'}`}
        style={{
          background: theme.pageBackground,
          borderBottomColor: theme.border,
        }}
      >
        <button
          onClick={onNavigateToDashboard}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: theme.text }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden md:inline">Back to Chat</span>
        </button>
        <h1 className="font-serif text-xl md:text-2xl font-normal m-0 flex-1 text-center md:flex-none">
          Profile
        </h1>
        <div className="w-17.5 md:w-27.5" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div 
            className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-4xl font-medium shadow-lg"
            style={{
              background: theme.accent,
            }}
          >
            {formData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="text-sm" style={{ color: theme.muted }}>
            {user?.email}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div 
              className="rounded-xl p-4"
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.surface,
              }}
            >
              <p className="m-0 text-xs uppercase tracking-wide" style={{ color: theme.muted }}>
                Followers
              </p>
              <p className="mt-2 mb-0 text-2xl font-semibold" style={{ color: theme.text }}>
                {user?.followersCount ?? 0}
              </p>
            </div>
            <div 
              className="rounded-xl p-4"
              style={{
                border: `1px solid ${theme.border}`,
                background: theme.surface,
              }}
            >
              <p className="m-0 text-xs uppercase tracking-wide" style={{ color: theme.muted }}>
                Following
              </p>
              <p className="mt-2 mb-0 text-2xl font-semibold" style={{ color: theme.text }}>
                {user?.followingCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm text-center ${
            message.type === 'success' 
              ? 'border border-green-200' 
              : 'border border-red-200'
          }`} style={{
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
          }}>
            {message.text}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: theme.muted }}>
                Name
              </label>
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-lg outline-none transition-all"
                  style={{
                    border: `1px solid ${errors.name ? '#ef4444' : theme.border}`,
                    background: theme.surface,
                    color: theme.text,
                  }}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: theme.muted }}>
                Bio
              </label>
              <div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  maxLength="200"
                  placeholder="Tell something about yourself..."
                  className="w-full px-3 py-2.5 rounded-lg outline-none transition-all resize-none"
                  style={{
                    border: `1px solid ${errors.bio ? '#ef4444' : theme.border}`,
                    background: theme.surface,
                    color: theme.text,
                  }}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.bio ? (
                    <p className="text-red-500 text-xs">{errors.bio}</p>
                  ) : (
                    <span className="text-xs" style={{ color: theme.muted }}>Max 200 characters</span>
                  )}
                  <span className="text-xs" style={{ color: theme.muted }}>{formData.bio.length}/200</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={closeEditMode}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200"
                style={{
                  background: 'transparent',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: theme.muted }}>
                Name
              </label>
              <p className="py-2 border-b" style={{ 
                color: theme.text,
                borderBottomColor: theme.border,
              }}>
                {user?.name || '-'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: theme.muted }}>
                Bio
              </label>
              <p className="py-2 border-b" style={{ 
                color: user?.bio ? theme.text : theme.muted,
                borderBottomColor: theme.border,
              }}>
                {user?.bio || 'No bio added yet'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={openEditMode}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200"
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                }}
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200"
                style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: `1px solid #ef4444`,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;