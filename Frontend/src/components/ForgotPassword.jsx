// pages/ForgotPassword.jsx
import { useState } from 'react';
import AuthCard from './AuthCard';
import InputField from './InputField';
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
    <AuthCard
      title="Forgot Password"
      subtitle="Enter your email and we will send you a one-time code to securely recover your Omnexa account."
      showBack
      onBack={onNavigateToLogin}
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

      <form onSubmit={handleSubmit}>
        <InputField
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full cursor-pointer rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
    </AuthCard>
  );
};

export default ForgotPassword;
