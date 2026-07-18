import { useState } from 'react';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onBackToSignIn: () => void;
}

export function ForgotPasswordScreen({ onBack, onBackToSignIn }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1400);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
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

      {/* Back button */}
      <div className="px-6 pt-4 flex-shrink-0">
        <button
          type="button"
          onClick={submitted ? onBackToSignIn : onBack}
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
        {submitted ? (
          <SuccessState onBackToSignIn={onBackToSignIn} email={email} />
        ) : (
          <RequestState
            email={email}
            setEmail={setEmail}
            focused={focused}
            setFocused={setFocused}
            loading={loading}
            onSend={handleSend}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Request State ─────────────────────────────────────────── */
function RequestState({
  email,
  setEmail,
  focused,
  setFocused,
  loading,
  onSend,
}: {
  email: string;
  setEmail: (v: string) => void;
  focused: boolean;
  setFocused: (v: boolean) => void;
  loading: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero lock icon */}
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
            <LockIcon />
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
          Reset Your Password
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
          Enter the email address linked to your account and we'll send you a reset link.
        </p>
      </div>

      {/* Email field */}
      <div className="mb-6">
        <label
          style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}
        >
          Email Address
        </label>
        <div
          className="flex items-center gap-3 px-4 rounded-xl"
          style={{
            height: 52,
            border: `1.5px solid ${focused ? '#7C3AED' : '#E5E7EB'}`,
            backgroundColor: focused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
            transition: 'border-color 0.18s, background-color 0.18s',
          }}
        >
          <span style={{ color: focused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1.5 4.5C1.5 3.675 2.175 3 3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1.5 4.5L9 9.75L16.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Enter' && onSend()}
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
          {/* Clear button */}
          {email.length > 0 && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setEmail(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 18, height: 18, backgroundColor: '#D1D5DB' }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Hint text */}
      <div
        className="flex items-start gap-2 rounded-xl px-4 py-3 mb-8"
        style={{ backgroundColor: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="8" cy="8" r="7" stroke="#7C3AED" strokeWidth="1.4"/>
          <path d="M8 7V11" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="5" r="0.75" fill="#7C3AED"/>
        </svg>
        <p style={{ fontSize: '12px', color: '#7C3AED', lineHeight: '1.6' }}>
          Check your spam folder if you don't see the email within a few minutes.
        </p>
      </div>

      {/* Send Button */}
      <button
        type="button"
        onClick={onSend}
        disabled={loading || !email.trim()}
        className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
        style={{
          height: 56,
          borderRadius: 24,
          background:
            email.trim()
              ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              : '#E5E7EB',
          border: 'none',
          cursor: email.trim() ? 'pointer' : 'not-allowed',
          boxShadow: email.trim() ? '0 8px 20px rgba(124,58,237,0.32)' : 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
          marginBottom: 24,
        }}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2L16 9L2 16V11L12 9L2 7V2Z" fill={email.trim() ? 'white' : '#9CA3AF'} strokeLinejoin="round"/>
            </svg>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: email.trim() ? 'white' : '#9CA3AF',
                letterSpacing: '0.01em',
                transition: 'color 0.2s',
              }}
            >
              Send Reset Link
            </span>
          </>
        )}
      </button>

      {/* Bottom spacer */}
      <div className="flex-1" />
    </div>
  );
}

/* ─── Success State ─────────────────────────────────────────── */
function SuccessState({ onBackToSignIn, email }: { onBackToSignIn: () => void; email: string }) {
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
          Check your email
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.65',
            textAlign: 'center',
            maxWidth: 272,
            marginBottom: 10,
          }}
        >
          We sent a password reset link to
        </p>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#7C3AED',
            textAlign: 'center',
            marginBottom: 32,
            wordBreak: 'break-all',
            maxWidth: 280,
          }}
        >
          {email || 'your email address'}
        </span>

        {/* Info card */}
        <div
          className="w-full rounded-2xl p-4 mb-10 flex flex-col gap-3"
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
          }}
        >
          {[
            { step: '1', text: 'Open the email from Sorcyn' },
            { step: '2', text: 'Tap "Reset Password"' },
            { step: '3', text: 'Create your new password' },
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

        {/* Resend link */}
        <div className="flex items-center justify-center gap-1">
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Didn't get it?</span>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>Resend email</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */
function LockIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="6" y="16" width="24" height="17" rx="4" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="2"/>
      <path
        d="M11 16V11C11 7.686 14.134 5 18 5C21.866 5 25 7.686 25 11V16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="24.5" r="2.5" fill="white"/>
      <path d="M18 27V30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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
