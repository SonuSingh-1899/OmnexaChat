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
    <AuthCard title="Sign Up" showBack onBack={onNavigateToLogin}>
      <form onSubmit={handleSubmit} className="space-y-4">

        <InputField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />

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

        <InputField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-xl py-4 cursor-pointer mt-1 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="flex justify-center mt-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToForgotPassword?.();
            }}
            className="inline-flex items-center gap-1.5 text-stone-500 no-underline text-xs font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Forgot Password?
          </a>
        </div>

        <div className="text-center mt-5 text-sm text-stone-400">
          Already have an account?{' '}
          <a
            href="#"
            onClick={e => { e.preventDefault(); onNavigateToLogin?.(); }}
            className="text-black no-underline font-medium"
          >
            Sign In
          </a>
        </div>

      </form>
    </AuthCard>
  );
};

export default Signup;