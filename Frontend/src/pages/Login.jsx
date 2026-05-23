// pages/Login.jsx
import { useState } from 'react';
import AuthCard from '../components/AuthCard';
import InputField from '../components/InputField';
import { authApi } from '../lib/api';

const Login = ({ onNavigateToSignup, onNavigateToForgotPassword, onLoginSuccess, notice }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
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

      const res = await authApi.login({
        email: formData.email,
        password: formData.password
      });

      onLoginSuccess?.(res.token);

    } catch (err) {
      console.error(err);

      if (err.response) {
        setErrors({
          general: err.response.data.message || "Invalid credentials"
        });
      } else {
        setErrors({
          general: "Server error"
        });
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Login"
      subtitle="Access your Omnexa dashboard, continue chats, and jump back into your workspace with the same polished flow as the main app."
      showLogo
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {notice && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {notice}
          </p>
        )}

        {errors.general && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.general}
          </p>
        )}

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
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="flex justify-end mt-0 mb-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToForgotPassword?.();
            }}
            className="inline-flex items-center gap-1.5 text-zinc-500 no-underline text-xs font-semibold transition hover:text-zinc-950"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            </svg>
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-2xl bg-[linear-gradient(135deg,#09090b_0%,#27272a_100%)] px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(17,24,39,0.20)] disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs leading-6 text-zinc-600">
          Use the same Omnexa identity to continue chats, profile updates, and notifications without switching flows.
        </div>

        <div className="text-center mt-5 text-sm text-zinc-500">
          Don't have an account?{' '}
          <a
            href="#"
            onClick={e => { e.preventDefault(); onNavigateToSignup?.(); }}
            className="text-zinc-950 no-underline font-semibold"
          >
            Sign Up
          </a>
        </div>

      </form>
    </AuthCard>
  );
};

export default Login;
