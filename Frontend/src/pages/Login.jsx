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
    <AuthCard title="Login" showLogo>
      <form onSubmit={handleSubmit} className="space-y-4">

        {notice && (
          <p className="text-stone-500 text-sm mb-2">
            {notice}
          </p>
        )}

        {errors.general && (
          <p className="text-red-500 text-sm mb-2">
            {errors.general}
          </p>
        )}

        <InputField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <InputField
          label="Password"
          type="password"
          name="password"
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
            className="inline-flex items-center gap-1.5 text-stone-500 no-underline text-xs font-medium"
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
          className="w-full bg-black text-white py-4 rounded-xl cursor-pointer disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center mt-5 text-sm text-stone-400">
          Don't have an account?{' '}
          <a
            href="#"
            onClick={e => { e.preventDefault(); onNavigateToSignup?.(); }}
            className="text-black no-underline font-medium"
          >
            Sign Up
          </a>
        </div>

      </form>
    </AuthCard>
  );
};

export default Login;