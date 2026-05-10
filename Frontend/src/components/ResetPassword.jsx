// pages/ResetPassword.jsx
import { useState } from 'react';
import { profileApi } from '../lib/api';

const ResetPassword = ({ email, onNavigateToForgotPassword, onNavigateToLogin }) => {
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage({ text: '', type: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
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

    if (!email) {
      setMessage({ text: 'Please request a new OTP first.', type: 'error' });
      return;
    }

    if (!otp.trim()) {
      setMessage({ text: 'OTP is required.', type: 'error' });
      return;
    }

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await profileApi.resetPassword(email, otp.trim(), formData.newPassword);
      setIsSuccess(true);
      setMessage({ text: 'Password reset successfully!', type: 'success' });

      setTimeout(() => {
        onNavigateToLogin?.();
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.response?.data?.message || 'Failed to reset password. OTP may be invalid or expired.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <h1 className="font-serif text-2xl font-normal text-black mb-2">
          {isSuccess ? 'Password Reset!' : 'Reset Password'}
        </h1>
        <p className="text-[13px] text-stone-400 mb-8">
          {isSuccess
            ? 'Your password has been changed successfully.'
            : `Enter the OTP sent to ${email || 'your email'} and set a new password.`}
        </p>

        {message.text && (
          <div className={`p-3 rounded-lg mb-6 text-sm text-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {!isSuccess && email && (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-[11px] font-medium text-stone-400 uppercase tracking-[0.8px] mb-1.5">
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setMessage({ text: '', type: '' });
                }}
                placeholder="Enter 6-digit OTP"
                className="w-full p-3 border border-stone-200 rounded-lg text-sm font-sans outline-none"
              />
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-medium text-stone-400 uppercase tracking-[0.8px] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className={`w-full p-3 rounded-lg text-sm font-sans outline-none ${
                  errors.newPassword ? 'border-red-600' : 'border-stone-200'
                } border`}
              />
              {errors.newPassword && (
                <p className="text-red-600 text-[11px] mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div className="mb-7">
              <label className="block text-[11px] font-medium text-stone-400 uppercase tracking-[0.8px] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={`w-full p-3 rounded-lg text-sm font-sans outline-none ${
                  errors.confirmPassword ? 'border-red-600' : 'border-stone-200'
                } border`}
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-[11px] mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3.5 border-none rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {isSuccess && (
          <button
            onClick={onNavigateToLogin}
            className="w-full bg-black text-white py-3.5 border-none rounded-lg text-sm font-medium cursor-pointer"
          >
            Go to Login
          </button>
        )}

        {!email && !isSuccess && (
          <button
            onClick={onNavigateToForgotPassword}
            className="w-full bg-black text-white py-3.5 border-none rounded-lg text-sm font-medium cursor-pointer"
          >
            Back to Forgot Password
          </button>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;