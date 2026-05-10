// pages/ChangePassword.jsx
import { useState } from 'react';
import { profileApi } from '../lib/api';

const defaultTheme = {
  pageBackground: '#f5f3ef',
  surface: '#ffffff',
  subtle: '#faf7f2',
  border: '#e8e0d6',
  accent: '#111111',
  accentText: '#ffffff',
  muted: '#8d8479',
  text: '#111111',
};

const ChangePassword = ({ theme = defaultTheme, onNavigateToDashboard, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setMessage({ text: '', type: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await profileApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      setMessage({ text: 'Password changed successfully!', type: 'success' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        onSuccess?.();
        onNavigateToDashboard?.();
      }, 1500);
    } catch (err) {
      console.error(err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to change password', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{
      background: theme.pageBackground,
      fontFamily: "'DM Sans', sans-serif",
      color: theme.text,
    }}>
      <div className="flex flex-col md:flex-row items-start md:items-center p-4 md:p-6 border-b" style={{
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
          Back
        </button>
        <h1 className="font-serif text-xl font-normal m-0 md:mx-auto" style={{ color: theme.text }}>
          Change Password
        </h1>
        <div className="hidden md:block w-[70px]" />
      </div>

      <div className="max-w-md mx-auto my-8 md:my-16 px-6">
        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm text-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-[11px] font-medium uppercase tracking-[0.8px] mb-1.5" style={{ color: theme.muted }}>
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-lg text-sm font-sans outline-none"
              style={{
                border: `1px solid ${errors.currentPassword ? '#c62828' : theme.border}`,
                background: theme.surface,
                color: theme.text,
              }}
            />
            {errors.currentPassword && (
              <p className="text-red-600 text-[11px] mt-1">{errors.currentPassword}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-[11px] font-medium uppercase tracking-[0.8px] mb-1.5" style={{ color: theme.muted }}>
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-lg text-sm font-sans outline-none"
              style={{
                border: `1px solid ${errors.newPassword ? '#c62828' : theme.border}`,
                background: theme.surface,
                color: theme.text,
              }}
            />
            {errors.newPassword && (
              <p className="text-red-600 text-[11px] mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div className="mb-7">
            <label className="block text-[11px] font-medium uppercase tracking-[0.8px] mb-1.5" style={{ color: theme.muted }}>
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 rounded-lg text-sm font-sans outline-none"
              style={{
                border: `1px solid ${errors.confirmPassword ? '#c62828' : theme.border}`,
                background: theme.surface,
                color: theme.text,
              }}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-[11px] mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 border-none rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: theme.accent,
              color: theme.accentText,
            }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;