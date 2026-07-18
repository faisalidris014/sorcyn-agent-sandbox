import { useState } from 'react';

interface LoginScreenProps {
  onLogin: () => void;
  onSignUp?: () => void;
  onForgotPassword?: () => void;
}

export function LoginScreen({ onLogin, onSignUp, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignIn = () => {
    onLogin();
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative">

      {/* Status Bar */}
      <div className="h-11 flex items-center justify-between px-6 pt-3 flex-shrink-0">
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div className="flex gap-1 items-center">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <path d="M15.3 0H1.7C0.76 0 0 0.76 0 1.7v8.6C0 11.24 0.76 12 1.7 12h13.6c0.94 0 1.7-0.76 1.7-1.7V1.7C17 0.76 16.24 0 15.3 0zM15.3 10.3H1.7V1.7h13.6V10.3z" fill="#1F2937"/>
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
            <path d="M7.5 0C3.36 0 0 2.24 0 5c0 2.76 3.36 5 7.5 5s7.5-2.24 7.5-5c0-2.76-3.36-5-7.5-5zm0 8.33c-2.76 0-5-1.49-5-3.33s2.24-3.33 5-3.33 5 1.49 5 3.33-2.24 3.33-5 3.33z" fill="#1F2937"/>
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0" y="0" width="22" height="12" rx="2.67" stroke="#1F2937" strokeWidth="1"/>
            <rect x="23" y="4" width="2" height="4" rx="1" fill="#1F2937"/>
            <rect x="2" y="2" width="18" height="8" rx="1.33" fill="#1F2937"/>
          </svg>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto">

        {/* Logo */}
        <div className="flex flex-col items-center mt-10 mb-8">
          <div
            className="flex items-center justify-center rounded-[22px] mb-4"
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
              <path d="M26 4L10 24H22L18 40L34 20H22L26 4Z" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
            Sorcyn
          </span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.5' }}>
            Sign in to continue your momentum
          </p>
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label
            style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}
          >
            Email Address
          </label>
          <div
            className="flex items-center rounded-xl px-4 gap-3"
            style={{
              height: 52,
              border: `1.5px solid ${emailFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: emailFocused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            {/* Mail icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1.5 4.5C1.5 3.675 2.175 3 3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5Z" stroke={emailFocused ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.5 4.5L9 9.75L16.5 4.5" stroke={emailFocused ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                color: '#1F2937',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-5">
          <label
            style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}
          >
            Password
          </label>
          <div
            className="flex items-center rounded-xl px-4 gap-3"
            style={{
              height: 52,
              border: `1.5px solid ${passwordFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: passwordFocused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            {/* Lock icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              <rect x="3" y="8" width="12" height="8" rx="2" stroke={passwordFocused ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.5"/>
              <path d="M6 8V5.5C6 3.843 7.343 2.5 9 2.5C10.657 2.5 12 3.843 12 5.5V8" stroke={passwordFocused ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="12" r="1" fill={passwordFocused ? '#7C3AED' : '#9CA3AF'}/>
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                color: '#1F2937',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="2.5" stroke="#9CA3AF" strokeWidth="1.5"/>
                  <path d="M3 3L17 17" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="2.5" stroke="#9CA3AF" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember me + Forgot Password */}
        <div className="flex items-center justify-between mb-8">
          {/* Remember me */}
          <button
            type="button"
            onClick={() => setRememberMe(v => !v)}
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div
              className="flex items-center justify-center rounded-md"
              style={{
                width: 20,
                height: 20,
                border: `1.5px solid ${rememberMe ? '#7C3AED' : '#D1D5DB'}`,
                backgroundColor: rememberMe ? '#7C3AED' : 'white',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {rememberMe && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4.2 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: '14px', color: '#4B5563', userSelect: 'none' }}>Remember me</span>
          </button>

          {/* Forgot password */}
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={onForgotPassword}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED' }}>Forgot Password?</span>
          </button>
        </div>

        {/* Sign In Button */}
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full flex items-center justify-center transition-all active:scale-[0.97]"
          style={{
            height: 56,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>
            Sign In
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
        </div>

        {/* Social buttons */}
        <div className="flex gap-3 mb-8">
          {/* Google */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              height: 48,
              borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Google</span>
          </button>
          {/* Apple */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              height: 48,
              borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="18" viewBox="0 0 24 29" fill="#1F2937">
              <path d="M23.7 22.4c-.6 1.4-1.3 2.7-2.2 3.9-1.2 1.7-2.1 2.8-2.9 3.4-1.1 1-2.4 1.6-3.7 1.6-1 0-2.1-.3-3.5-.8-1.4-.5-2.6-.8-3.7-.8-1.2 0-2.4.3-3.8.8-1.4.5-2.5.8-3.4.8-1.3.1-2.7-.6-4.2-2-1.7-1.5-3-3.3-4.1-5.7-1.2-2.6-1.8-5.3-1.8-8.2 0-3 .6-5.6 1.9-7.7 1-1.8 2.4-3.2 4.2-4.2 1.8-1 3.7-1.5 5.8-1.6 1.1 0 2.6.4 4.4 1.1 1.7.7 2.8 1.1 3.2 1.1.4 0 1.6-.4 3.7-1.3 2-.8 3.6-1.1 4.9-.9 3.6.3 6.3 1.7 8 4.3-3.2 1.9-4.7 4.7-4.7 8.1 0 2.7 1 5 3 6.9.9.8 1.8 1.4 2.9 1.8-.2.5-.4.9-.6 1.3z"/>
              <path d="M18.3.6c0 2.1-.8 4.1-2.5 5.9-2 2.3-4.3 3.6-6.9 3.4V9.5c0-2.1.9-4.3 2.5-5.9C13 2 14.7.9 16.9 0c.1.2.1.4.1.6H18.3z"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Apple</span>
          </button>
        </div>

        {/* Sign Up prompt */}
        <div className="flex items-center justify-center pb-10">
          <span style={{ fontSize: '14px', color: '#6B7280' }}>Don't have an account?&nbsp;</span>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={onSignUp}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}