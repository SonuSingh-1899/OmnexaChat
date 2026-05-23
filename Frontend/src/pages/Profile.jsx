// pages/Profile.jsx
import { useState, useEffect, useRef } from 'react';
import Avatar from '../components/common/Avatar';
import MobileTopBar from '../components/layout/MobileTopBar';
import { profileApi } from '../lib/api';

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M8.5 6.5 10 4h4l1.5 2.5H18A3 3 0 0 1 21 9.5v7A3.5 3.5 0 0 1 17.5 20h-11A3.5 3.5 0 0 1 3 16.5v-7A3 3 0 0 1 6 6.5h2.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [avatarMenuPosition, setAvatarMenuPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef(null);
  const avatarMenuRef = useRef(null);
  const avatarActionButtonRef = useRef(null);
  const editAvatarActionButtonRef = useRef(null);

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

  useEffect(() => {
    if (!isAvatarMenuOpen && !isAvatarPreviewOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAvatarMenuOpen(false);
        setIsAvatarPreviewOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      const clickedMenu = avatarMenuRef.current?.contains(event.target);
      const clickedMainButton = avatarActionButtonRef.current?.contains(event.target);
      const clickedEditButton = editAvatarActionButtonRef.current?.contains(event.target);

      if (!clickedMenu && !clickedMainButton && !clickedEditButton) {
        setIsAvatarMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAvatarMenuOpen, isAvatarPreviewOpen]);

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

  const syncUserAfterAvatarUpdate = (nextUser) => {
    onUserUpdated?.(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setFormData((prev) => ({
      ...prev,
      avatarUrl: nextUser.avatarUrl || '',
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setIsAvatarMenuOpen(false);
    setErrors({});
    setMessage({ text: '', type: '' });

    try {
      const updatedProfile = await profileApi.uploadAvatar(file);
      syncUserAfterAvatarUpdate(updatedProfile);
      setMessage({ text: 'Profile photo updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to upload profile photo',
        type: 'error',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!formData.avatarUrl && !user?.avatarUrl) {
      setIsAvatarMenuOpen(false);
      setMessage({ text: 'No profile photo to remove yet.', type: 'error' });
      return;
    }

    setRemovingAvatar(true);
    setIsAvatarMenuOpen(false);
    setErrors({});
    setMessage({ text: '', type: '' });

    try {
      const updatedProfile = await profileApi.removeAvatar();
      syncUserAfterAvatarUpdate(updatedProfile);
      setMessage({ text: 'Profile photo removed successfully!', type: 'success' });
      setIsAvatarPreviewOpen(false);
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to remove profile photo',
        type: 'error',
      });
    } finally {
      setRemovingAvatar(false);
    }
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

  const openAvatarPicker = () => {
    if (!uploadingAvatar && !loading && !removingAvatar) {
      setIsAvatarMenuOpen(false);
      fileInputRef.current?.click();
    }
  };

  const openAvatarMenu = (event) => {
    if (uploadingAvatar || loading || removingAvatar) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const popupWidth = 220;
    const horizontalPadding = 16;
    const top = Math.min(window.innerHeight - 180, rect.bottom + 10);
    const left = Math.min(
      window.innerWidth - popupWidth - horizontalPadding,
      Math.max(horizontalPadding, rect.right - popupWidth)
    );

    setAvatarMenuPosition({
      top: Math.max(16, top),
      left: Math.max(16, left),
    });
    setIsAvatarMenuOpen(true);
  };

  const handleShowAvatar = () => {
    if (!formData.avatarUrl && !user?.avatarUrl) {
      setIsAvatarMenuOpen(false);
      setMessage({ text: 'No profile photo to show yet.', type: 'error' });
      return;
    }

    setIsAvatarMenuOpen(false);
    setIsAvatarPreviewOpen(true);
  };

  const currentAvatarUrl = formData.avatarUrl || user?.avatarUrl || '';
  const hasAvatarImage = Boolean(currentAvatarUrl);
  const isAvatarActionBusy = uploadingAvatar || loading || removingAvatar;

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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        <div className="text-center mb-8">
          <div className="relative inline-flex mx-auto mb-4">
            <Avatar
              name={formData.name || user?.name}
              avatarUrl={currentAvatarUrl}
              className="w-24 h-24 rounded-full text-white text-4xl font-medium shadow-lg"
              style={{ background: theme.accent }}
            />
            <button
              ref={avatarActionButtonRef}
              type="button"
              onClick={openAvatarMenu}
              disabled={isAvatarActionBusy}
              aria-label={isAvatarActionBusy ? 'Updating profile photo' : 'Open profile photo actions'}
              className="absolute -right-1 bottom-0 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              }}
            >
              <CameraIcon />
            </button>
          </div>
          <p className="text-sm" style={{ color: theme.muted }}>
            {user?.email}
          </p>
          {/* <p className="mt-2 text-xs" style={{ color: theme.muted }}>
            {uploadingAvatar
              ? 'Uploading profile photo...'
              : removingAvatar
                ? 'Removing profile photo...'
                : 'Tap the camera icon to manage your photo'}
          </p> */}
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

      {isAvatarMenuOpen && (
        <div
          ref={avatarMenuRef}
          className="fixed z-50 w-56 rounded-2xl border p-2 shadow-2xl"
          style={{
            top: `${avatarMenuPosition.top}px`,
            left: `${avatarMenuPosition.left}px`,
            background: theme.surface,
            borderColor: theme.border,
            boxShadow: `0 18px 45px -20px ${theme.shadow}`,
          }}
        >
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={!hasAvatarImage || isAvatarActionBusy}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: '#dc2626' }}
          >
            <span>Remove image</span>
            <span className="text-xs">{removingAvatar ? '...' : ''}</span>
          </button>
          <button
            type="button"
            onClick={openAvatarPicker}
            disabled={isAvatarActionBusy}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: theme.text }}
          >
            <span>Upload image</span>
            <span className="text-xs">{uploadingAvatar ? '...' : ''}</span>
          </button>
          <button
            type="button"
            onClick={handleShowAvatar}
            disabled={!hasAvatarImage}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: theme.text }}
          >
            <span>Show image</span>
            {/* <span className="text-xs">{hasAvatarImage ? 'Open' : 'N/A'}</span> */}
          </button>
        </div>
      )}

      {isAvatarPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute inset-0 border-none"
            style={{ background: 'rgba(15, 23, 42, 0.72)' }}
            onClick={() => setIsAvatarPreviewOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border p-3 shadow-2xl"
            style={{
              background: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="flex items-center justify-between px-2 pb-3">
              <div>
                <p className="m-0 text-sm font-semibold" style={{ color: theme.text }}>
                  Profile image
                </p>
                <p className="m-0 text-xs" style={{ color: theme.muted }}>
                  {user?.name || 'User'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarPreviewOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-sm"
                style={{
                  borderColor: theme.border,
                  color: theme.text,
                  background: theme.pageBackground,
                }}
              >
                X
              </button>
            </div>
            <div
              className="overflow-hidden rounded-2xl"
              style={{ background: theme.pageBackground }}
            >
              <img
                src={currentAvatarUrl}
                alt={`${user?.name || 'User'} profile`}
                className="block h-auto max-h-[70vh] w-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
