'use client';

import { useState, useMemo } from 'react';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onBackToSignIn: () => void;
}

export function ResetPasswordScreen({ onBack, onBackToSignIn }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const requirements = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const strength = useMemo(() => requirements.filter(r => r.met).length, [requirements]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || '';
  const strengthColor = ['#E5E7EB', '#EF4444', '#F59E0B', '#84CC16', '#10B981'][strength] || '#E5E7EB';

  const allMet = strength === 4;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = allMet && passwordsMatch;

  const handleSubmit = () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1400);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Status Bar */}
      <div className="h-11 flex items-center justify-between px-6 pt-3 flex-shrink-0">
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div className="flex gap-1.5 items-center">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M0 4.8C2.67 2.06 6.15.5 8 .5s5.33 1.56 8 4.3L14.4 6.5C12.27 4.22 10.22 3 8 3S3.73 4.22 1.6 6.5L0 4.8Z" fill="#1F2937"/>
            <path d="M8 6.5c1.1 0 2.27.5 3.2 1.35L9.6 9.5A2.5 2.5 0 0 0 8 9a2.5 2.5 0 0 0-1.6.5L4.8 7.85C5.73 7 6.9 6.5 8 6.5Z" fill="#1F2937"/>
            <circle cx="8" cy="11.5" r="1" fill="#1F2937"/>
          </svg>
          <svg width="15" height="11" viewBox="0 0 16 12" fill="none">
            <rect x="1" y="1" width="12" height="10" rx="2" stroke="#1F2937" strokeWidth="1.4"/>
            <rect x="14" y="4" width="1.5" height="4" rx="0.75" fill="#1F2937"/>
            <rect x="2.5" y="2.5" width="9" height="7" rx="1.2" fill="#1F2937"/>
          </svg>
        </div>
      </div>

      {/* Back button */}
      <div className="px-6 pt-4 flex-shrink-0">
        <button
          type="button"
          onClick={isSuccess ? onBackToSignIn : onBack}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            border: '1.5px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto">
        {isSuccess ? (
          <SuccessState onBackToSignIn={onBackToSignIn} />
        ) : (
          <div className="flex flex-col flex-1">
            {/* Hero key icon */}
            <div className="flex flex-col items-center mt-10 mb-10">
              <div
                className="relative flex items-center justify-center mb-8"
                style={{ width: 120, height: 120 }}
              >
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
                  }}
                />
                {/* Mid ring */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: 12,
                    border: '1.5px solid rgba(124,58,237,0.15)',
                    borderRadius: '50%',
                  }}
                />
                {/* Icon circle */}
                <div
                  className="relative flex items-center justify-center rounded-full"
                  style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                    boxShadow: '0 12px 32px rgba(124,58,237,0.38), 0 2px 8px rgba(124,58,237,0.2)',
                  }}
                >
                  <KeyIcon />
                </div>
              </div>

              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#1F2937',
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                  marginBottom: 10,
                }}
              >
                Set New Password
              </h1>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.65',
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                Create a strong password for your account
              </p>
            </div>

            {/* New Password field */}
            <div className="mb-4">
              <label
                style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}
              >
                New Password
              </label>
              <div
                className="flex items-center gap-3 px-4 rounded-xl"
                style={{
                  height: 52,
                  border: `1.5px solid ${passwordFocused ? '#7C3AED' : '#E5E7EB'}`,
                  backgroundColor: passwordFocused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
                  transition: 'border-color 0.18s, background-color 0.18s',
                }}
              >
                <span style={{ color: passwordFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
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
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="flex gap-1" style={{ marginBottom: 6 }}>
                    {[1, 2, 3, 4].map(bar => (
                      <div
                        key={bar}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: strength >= bar ? strengthColor : '#E5E7EB',
                          transition: 'background-color 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: strengthColor }}>
                    {strengthLabel}
                  </span>
                </div>
              )}

              {/* Requirements checklist */}
              <div className="flex flex-col gap-1.5" style={{ marginTop: 12 }}>
                {requirements.map(req => (
                  <div key={req.label} className="flex items-center gap-2">
                    {req.met ? (
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#10B981' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <div
                        className="flex-shrink-0"
                        style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #E5E7EB' }}
                      />
                    )}
                    <span style={{ fontSize: '12px', color: req.met ? '#059669' : '#9CA3AF' }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password field */}
            <div className="mb-6">
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                  Confirm Password
                </label>
                {password.length > 0 && confirmPassword.length > 0 && (
                  passwordsMatch ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#10B981"/>
                      <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#EF4444"/>
                      <path d="M5 5L9 9M9 5L5 9" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  )
                )}
              </div>
              <div
                className="flex items-center gap-3 px-4 rounded-xl"
                style={{
                  height: 52,
                  border: `1.5px solid ${confirmFocused ? '#7C3AED' : '#E5E7EB'}`,
                  backgroundColor: confirmFocused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
                  transition: 'border-color 0.18s, background-color 0.18s',
                }}
              >
                <span style={{ color: confirmFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                  <ShieldCheckIcon />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
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
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Reset Password Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !canSubmit}
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                height: 56,
                borderRadius: 24,
                background: canSubmit
                  ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                  : '#E5E7EB',
                border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 8px 20px rgba(124,58,237,0.32)' : 'none',
                transition: 'background 0.2s, box-shadow 0.2s',
                marginBottom: 24,
              }}
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M6 9L8.5 11.5L12 6.5" stroke={canSubmit ? 'white' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="9" r="7" stroke={canSubmit ? 'white' : '#9CA3AF'} strokeWidth="1.5"/>
                  </svg>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: canSubmit ? 'white' : '#9CA3AF',
                      letterSpacing: '0.01em',
                      transition: 'color 0.2s',
                    }}
                  >
                    Reset Password
                  </span>
                </>
              )}
            </button>

            {/* Bottom spacer */}
            <div className="flex-1" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Success State ─────────────────────────────────────────── */
function SuccessState({ onBackToSignIn }: { onBackToSignIn: () => void }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      {/* Animated checkmark */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 120, height: 120 }}>
        {/* Pulse rings */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
            animation: 'successPulse 2s ease-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: 10,
            border: '1.5px solid rgba(16,185,129,0.2)',
            borderRadius: '50%',
            animation: 'successPulse 2s ease-out 0.3s infinite',
          }}
        />
        <style>{`
          @keyframes successPulse {
            0%   { transform: scale(0.95); opacity: 0.8; }
            50%  { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
          @keyframes checkDraw {
            from { stroke-dashoffset: 40; opacity: 0; }
            to   { stroke-dashoffset: 0;  opacity: 1; }
          }
          @keyframes circleGrow {
            from { transform: scale(0.6); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Icon circle */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            boxShadow: '0 12px 32px rgba(16,185,129,0.38)',
            animation: 'circleGrow 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M8 18L15 25L28 11"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="40"
              strokeDashoffset="40"
              style={{ animation: 'checkDraw 0.45s ease-out 0.3s forwards' }}
            />
          </svg>
        </div>
      </div>

      {/* Text block */}
      <div
        className="flex flex-col items-center"
        style={{ animation: 'fadeSlideUp 0.4s ease-out 0.2s both' }}
      >
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#1F2937',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          Password Updated!
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.65',
            textAlign: 'center',
            maxWidth: 272,
            marginBottom: 32,
          }}
        >
          Your password has been reset successfully.
        </p>

        {/* Info card */}
        <div
          className="w-full rounded-2xl p-4 mb-10 flex flex-col gap-3"
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
          }}
        >
          {[
            { step: '1', text: 'Your password has been updated' },
            { step: '2', text: 'Use your new password to sign in' },
            { step: '3', text: 'Keep your password safe and secure' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{step}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#4B5563' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Back to Sign In button */}
        <button
          type="button"
          onClick={onBackToSignIn}
          className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            height: 56,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124,58,237,0.32)',
            marginBottom: 16,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>
            Back to Sign In
          </span>
        </button>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */
function KeyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="14" cy="15" r="6" stroke="white" strokeWidth="2"/>
      <path d="M19 19L28 28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 24L27 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 26L29 23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="15" r="2" fill="rgba(255,255,255,0.5)"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="8" width="12" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5.5 8V6C5.5 4.067 7.067 2.5 9 2.5C10.933 2.5 12.5 4.067 12.5 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="12.5" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5L3 4.5V8.5C3 12.5 5.5 15.5 9 16.5C12.5 15.5 15 12.5 15 8.5V4.5L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 9L8.2 10.8L11.5 7.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1.5 9C1.5 9 4 4 9 4C14 4 16.5 9 16.5 9C16.5 9 14 14 9 14C4 14 1.5 9 1.5 9Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="9" r="2.5" stroke="#9CA3AF" strokeWidth="1.5"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 2.5L15.5 15.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7.5 7.8C6.9 8.4 6.5 9.2 6.5 10C6.5 11.38 7.62 12.5 9 12.5C9.8 12.5 10.6 12.1 11.2 11.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4.2 5.5C2.8 6.8 1.5 9 1.5 9C1.5 9 4 14 9 14C10.4 14 11.6 13.6 12.6 13" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14.5 11.5C15.7 10.2 16.5 9 16.5 9C16.5 9 14 4 9 4C8.4 4 7.8 4.1 7.2 4.2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <>
      <style>{`
        @keyframes btnSpin { to { transform: rotate(360deg); } }
        .btn-spinner { animation: btnSpin 0.75s linear infinite; }
      `}</style>
      <svg className="btn-spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
        <path d="M10 2 A8 8 0 0 1 18 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </>
  );
}
