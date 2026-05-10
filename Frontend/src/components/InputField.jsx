// components/InputField.jsx
import { useState } from 'react';

const InputField = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  name,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-5">
      <label className={`block text-[11px] font-medium uppercase tracking-[0.8px] mb-1.5 font-sans ${
        error ? 'text-red-500' : 'text-stone-400'
      }`}>
        {label}
      </label>

      <div className={`flex items-center pb-2 transition-colors duration-200 ${
        error ? 'border-b-[1.5px] border-red-500' : focused ? 'border-b-[1.5px] border-black' : 'border-b-[1.5px] border-[#e0ddd8]'
      }`}>
        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="border-none bg-transparent font-sans text-sm text-[#1a1a1a] outline-none w-full font-normal"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="bg-none border-none cursor-pointer p-0 text-stone-400 flex-shrink-0 flex items-center"
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-[11px] mt-1 font-sans">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;