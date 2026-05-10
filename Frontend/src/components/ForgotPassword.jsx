// pages/ForgotPassword.jsx
import { useState } from 'react';
import { profileApi } from '../lib/api';

const ForgotPassword = ({ onNavigateToLogin, onOtpSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Email is required', type: 'error' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage({ text: 'Please enter a valid email', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await profileApi.forgotPassword(email.trim());
      setMessage({
        text: 'Password reset OTP sent to your email!',
        type: 'success',
      });
      window.setTimeout(() => {
        onOtpSent?.(email.trim());
      }, 400);
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.response?.data?.message || 'Failed to send reset OTP',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={onNavigateToLogin}
          className="bg-none border-none cursor-pointer flex items-center gap-1.5 text-stone-400 text-[13px] mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Login
        </button>

        <h1 className="font-serif text-[28px] font-normal text-black mb-2">
          Forgot Password?
        </h1>
        <p className="text-[13px] text-stone-400 mb-8">
          Enter your email and we'll send you an OTP to reset your password.
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

        <form onSubmit={handleSubmit}>
          <div className="mb-7">
            <label className="block text-[11px] font-medium text-stone-400 uppercase tracking-[0.8px] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 border border-stone-200 rounded-lg text-sm font-sans outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 border-none rounded-lg text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;