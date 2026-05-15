// pages/ResetPassword.jsx
import { useState } from 'react';
import AuthCard from './AuthCard';
import InputField from './InputField';
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
    <AuthCard
      title="Reset Password"
      subtitle={
        isSuccess
          ? 'Your password has been updated successfully. You can now continue to the Omnexa login page.'
          : `Enter the OTP sent to ${email || 'your email'} and set a fresh password.`
      }
      showBack={!isSuccess}
      onBack={email ? onNavigateToForgotPassword : onNavigateToLogin}
    >
      {message.text && (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {!isSuccess && email && (
        <form onSubmit={handleSubmit}>
          <InputField
            label="OTP"
            name="otp"
            value={otp}
            onChange={(event) => {
              setOtp(event.target.value);
              setMessage({ text: '', type: '' });
            }}
            placeholder="Enter 6-digit OTP"
          />

          <InputField
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            error={errors.newPassword}
          />

          <InputField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full cursor-pointer rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      {isSuccess && (
        <button
          onClick={onNavigateToLogin}
          className="w-full cursor-pointer rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
        >
          Go to Login
        </button>
      )}

      {!email && !isSuccess && (
        <button
          onClick={onNavigateToForgotPassword}
          className="w-full cursor-pointer rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
        >
          Back to Forgot Password
        </button>
      )}
    </AuthCard>
  );
};

export default ResetPassword;
