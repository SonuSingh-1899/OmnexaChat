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
    <AuthCard title="Verify OTP" showBack onBack={onNavigateToLogin}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <p className="text-sm text-stone-500 mb-2">
          OTP sent to {email || 'your email'}
        </p>

        <InputField
          label="Enter OTP"
          name="otp"
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
          className="w-full bg-black text-white rounded-xl py-4 cursor-pointer disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

      </form>
    </AuthCard>
  );
};

export default VerifyOtp;