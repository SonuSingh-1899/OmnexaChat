// pages/Profile.jsx
import { useState, useEffect } from 'react';
import { profileApi } from '../lib/api';

const Profile = ({ user, onUserUpdated, onLogout, onNavigateToDashboard }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-100 to-stone-200">
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onNavigateToDashboard}
          className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-sm">Back to Chat</span>
        </button>
        <h1 className="font-serif text-xl font-normal text-stone-800">
          Profile
        </h1>
        <div className="w-20" />
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-stone-800 to-stone-700 flex items-center justify-center text-white text-4xl font-medium shadow-lg">
            {formData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="text-sm text-stone-500">
            {user?.email}
          </p>
        </div>

        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm text-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    errors.name ? 'border-red-400' : 'border-stone-200'
                  } focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-white text-stone-800`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <div>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  maxLength="200"
                  autoFocus
                  placeholder="Tell something about yourself..."
                  className={`w-full px-3 py-2.5 rounded-lg border ${
                    errors.bio ? 'border-red-400' : 'border-stone-200'
                  } focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent bg-white text-stone-800 resize-none`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.bio ? (
                    <p className="text-red-500 text-xs">{errors.bio}</p>
                  ) : (
                    <span className="text-xs text-stone-400">Max 200 characters</span>
                  )}
                  <span className="text-xs text-stone-400">{formData.bio.length}/200</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-stone-900 hover:bg-black text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={closeEditMode}
                className="flex-1 bg-white hover:bg-stone-50 text-stone-700 px-4 py-2.5 rounded-lg border border-stone-200 font-medium transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <p className="py-2 text-stone-800 border-b border-stone-200">
                {user?.name || '-'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <p className={`py-2 border-b border-stone-200 ${!user?.bio ? 'text-stone-400' : 'text-stone-800'}`}>
                {user?.bio || 'No bio added yet'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={openEditMode}
                className="flex-1 bg-stone-900 hover:bg-black text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 bg-white hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-lg border border-red-200 font-medium transition-all duration-200"
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
