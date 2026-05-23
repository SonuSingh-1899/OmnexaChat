// pages/Signup.jsx
import { useState } from 'react';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import { authApi } from '../lib/api';

const Signup = ({ onNavigateToLogin, onNavigateToForgotPassword, onNavigateToOtp }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
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

    try {
      setLoading(true);

      await authApi.sendOtp(formData.email.trim());

      alert("OTP sent to your email");

      onNavigateToOtp?.({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

    } catch (err) {
      console.error(err);

      if (err.response) {
        alert(err.response.data.message || "Signup failed");
      } else {
        alert("Server error");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Sign Up"
      subtitle="Create your Omnexa profile, verify with OTP, and step into the same branded chat experience."
      showLogo
      showBack
      onBack={onNavigateToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        <InputField
          label="Name"
          name="name"
          placeholder="Your full name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />

        <InputField
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <InputField
          label="Password"
          type="password"
          name="password"
          placeholder="Minimum 6 characters"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <InputField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#09090b_0%,#27272a_100%)] px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(17,24,39,0.20)] disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs leading-6 text-zinc-600">
          We will send an OTP to your email so your account setup stays secure from the very first step.
        </div>

        <div className="flex justify-center mt-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToForgotPassword?.();
            }}
            className="inline-flex items-center gap-1.5 text-zinc-500 no-underline text-xs font-semibold transition hover:text-zinc-950"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Forgot Password?
          </a>
        </div>

        <div className="text-center mt-5 text-sm text-zinc-500">
          Already have an account?{' '}
          <a
            href="#"
            onClick={e => { e.preventDefault(); onNavigateToLogin?.(); }}
            className="text-zinc-950 no-underline font-semibold"
          >
            Sign In
          </a>
        </div>

      </form>
    </AuthCard>
  );
};

export default Signup;
