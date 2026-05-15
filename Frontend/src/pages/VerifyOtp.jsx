// pages/VerifyOtp.jsx
import { useState } from 'react';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import { authApi } from '../lib/api';

const VerifyOtp = ({ signupData, onNavigateToLogin, onRegistrationSuccess }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const email = signupData?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!signupData) {
      setError("Signup session missing. Please sign up again.");
      return;
    }

    if (!otp) {
      setError("OTP is required");
      return;
    }

    try {
      setLoading(true);

      await authApi.verifyOtp(email, otp);

      await authApi.register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password
      });

      onRegistrationSuccess?.();

    } catch (err) {
      console.error(err);

      if (err.response) {
        setError(err.response.data.message || "OTP verification failed");
      } else {
        setError("Server error");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Verify OTP"
      subtitle="Enter the code sent to your email to finish setting up your Omnexa account."
      showBack
      onBack={onNavigateToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          OTP sent to {email || 'your email'}
        </p>

        <InputField
          label="Enter OTP"
          name="otp"
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            setError('');
          }}
          error={error}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-2xl bg-zinc-950 px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

      </form>
    </AuthCard>
  );
};

export default VerifyOtp;
