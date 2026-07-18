import { useState, useEffect } from 'react';

interface EmailVerificationScreenProps {
  email?: string;
  onSwitchAccount: () => void;
}

const RESEND_COOLDOWN = 30;

export function EmailVerificationScreen({ email = 'you@example.com', onSwitchAccount }: EmailVerificationScreenProps) {
  const [loading, setLoading]       = useState(false);
  const [resent, setResent]         = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [resentCount, setResentCount] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = () => {
    if (loading || cooldown > 0) return;
    setLoading(true);
    setResent(false);
    setTimeout(() => {
      setLoading(false);
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
      setResentCount(n => n + 1);
    }, 1800);
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto flex flex-col px-6">

        {/* ── App Logo ── */}
        <div className="flex justify-center mt-8 mb-6">
          <div
            className="flex items-center gap-2.5"
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            <div
              className="flex items-center justify-center rounded-[14px]"
              style={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                boxShadow: '0 6px 16px rgba(124,58,237,0.3)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 44 44" fill="none">
                <path d="M26 4L10 24H22L18 40L34 20H22L26 4Z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
              Sorcyn
            </span>
          </div>
        </div>

        {/* ── Hero mail icon ── */}
        <div className="flex justify-center mb-8">
          <MailHero loading={loading} resent={resent} />
        </div>

        {/* ── Heading & email chip ── */}
        <div className="flex flex-col items-center mb-5">
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
            Verify Your Email
          </h1>

          {/* Email chip */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.18)',
              maxWidth: '100%',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1 3C1 2.448 1.448 2 2 2H12C12.552 2 13 2.448 13 3V10C13 10.552 12.552 11 12 11H2C1.448 11 1 10.552 1 10V3Z" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 3L7 7.5L13 3" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#7C3AED',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email}
            </span>
          </div>
        </div>

        {/* ── Instruction text ── */}
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.7',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          We've sent a verification link to your email address. Open it to activate your Sorcyn account. The link expires in{' '}
          <span style={{ color: '#1F2937', fontWeight: 600 }}>24 hours</span>.
        </p>

        {/* ── Steps card ── */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
        >
          {[
            { n: '1', text: 'Open your email inbox' },
            { n: '2', text: 'Find the email from Sorcyn' },
            { n: '3', text: "Tap 'Verify My Email' in the email" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-center gap-3 py-2">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{n}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.4' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* ── Resent success toast ── */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: resent ? 56 : 0,
            opacity: resent ? 1 : 0,
            marginBottom: resent ? 16 : 0,
            transition: 'max-height 0.3s ease, opacity 0.3s ease, margin-bottom 0.3s ease',
          }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 22, height: 22, backgroundColor: '#10B981' }}
            >
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4L3.8 7L10 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', color: '#065F46', fontWeight: 500 }}>
              Verification email sent!
              {resentCount > 1 ? ` (×${resentCount})` : ''}
            </span>
          </div>
        </div>

        {/* ── Spam hint ── */}
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-7"
          style={{ backgroundColor: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="7.5" cy="7.5" r="6.5" stroke="#7C3AED" strokeWidth="1.3"/>
            <path d="M7.5 6.5V10.5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="7.5" cy="4.75" r="0.75" fill="#7C3AED"/>
          </svg>
          <p style={{ fontSize: '12px', color: '#7C3AED', lineHeight: '1.6' }}>
            Can't find it? Check your <span style={{ fontWeight: 700 }}>spam</span> or{' '}
            <span style={{ fontWeight: 700 }}>promotions</span> folder.
          </p>
        </div>

        {/* ── Primary CTA ── */}
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || cooldown > 0}
          className="w-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            height: 56,
            borderRadius: 24,
            background:
              loading || cooldown > 0
                ? '#E5E7EB'
                : 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none',
            cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
            boxShadow:
              loading || cooldown > 0 ? 'none' : '0 8px 20px rgba(124,58,237,0.32)',
            transition: 'background 0.25s, box-shadow 0.25s',
            marginBottom: 14,
          }}
        >
          {loading ? (
            <ButtonSpinner />
          ) : cooldown > 0 ? (
            <>
              <CooldownIcon />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#9CA3AF' }}>
                Resend in {cooldown}s
              </span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M1.5 4.5C1.5 3.675 2.175 3 3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 4.5L9 9.75L16.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.5 10.5L16.5 7.5M16.5 7.5L13.5 7.5M16.5 7.5V10.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>
                Resend Verification Email
              </span>
            </>
          )}
        </button>

        {/* ── Switch account link ── */}
        <div className="flex items-center justify-center pb-10">
          <button
            type="button"
            onClick={onSwitchAccount}
            className="flex items-center gap-1.5 transition-opacity active:opacity-60"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED' }}>
              Sign in with a different account
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Mail Hero ─────────────────────────────────────────────── */
function MailHero({ loading, resent }: { loading: boolean; resent: boolean }) {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes dotPop {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.3); opacity: 1; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(0.88); opacity: 0.6; }
          50%  { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(0.88); opacity: 0.6; }
        }
        @keyframes emailSend {
          0%   { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
          40%  { transform: translateX(12px) translateY(-10px) scale(0.85); opacity: 0.6; }
          70%  { transform: translateX(20px) translateY(-20px) scale(0.6); opacity: 0; }
          71%  { transform: translateX(-20px) translateY(10px) scale(0.6); opacity: 0; }
          100% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
        }
        .mail-float  { animation: float 3.2s ease-in-out infinite; }
        .ring-pulse  { animation: ringPulse 2.8s ease-in-out infinite; }
        .mail-send   { animation: emailSend 1.8s cubic-bezier(0.4,0,0.2,1) forwards; }
        .dot1-pop    { animation: dotPop 1.4s ease-in-out 0s infinite; }
        .dot2-pop    { animation: dotPop 1.4s ease-in-out 0.22s infinite; }
        .dot3-pop    { animation: dotPop 1.4s ease-in-out 0.44s infinite; }
      `}</style>

      <div className="relative flex items-center justify-center" style={{ width: 148, height: 148 }}>
        {/* Outermost glow */}
        <div
          className="absolute inset-0 rounded-full ring-pulse"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 72%)' }}
        />
        {/* Mid ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 14,
            border: '1.5px solid rgba(124,58,237,0.14)',
            borderRadius: '50%',
          }}
        />
        {/* Icon circle */}
        <div
          className={`relative flex items-center justify-center rounded-full ${loading ? 'mail-send' : 'mail-float'}`}
          style={{
            width: 96,
            height: 96,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            boxShadow: '0 16px 40px rgba(124,58,237,0.4), 0 2px 8px rgba(124,58,237,0.2)',
          }}
        >
          {loading ? (
            /* Spinner overlay while sending */
            <HeroSpinner />
          ) : resent ? (
            /* Brief success check before returning to mail */
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <path
                d="M10 22L19 31L34 13"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            /* Default mail icon */
            <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
              {/* Envelope body */}
              <rect x="4" y="10" width="38" height="26" rx="5" fill="rgba(255,255,255,0.22)" stroke="white" strokeWidth="2"/>
              {/* Flap */}
              <path d="M4 15L23 27L42 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Lines inside (paper) */}
              <path d="M13 32H24" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 36H20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Star sparkle top-right */}
              <path d="M37 8L38 11L41 8L38 5L37 8Z" fill="rgba(255,255,255,0.7)"/>
            </svg>
          )}

          {/* Loading dots below icon when sending */}
          {loading && (
            <div className="absolute -bottom-7 flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 dot1-pop"/>
              <div className="w-2 h-2 rounded-full bg-violet-500 dot2-pop"/>
              <div className="w-2 h-2 rounded-full bg-purple-400 dot3-pop"/>
            </div>
          )}
        </div>

        {/* Floating mini envelopes */}
        {!loading && (
          <>
            <MiniEnvelope
              style={{ top: 10, right: 8, animationDelay: '0.6s', animationDuration: '3.8s' }}
              size={20}
              opacity={0.55}
            />
            <MiniEnvelope
              style={{ bottom: 14, left: 4, animationDelay: '1.4s', animationDuration: '4.2s' }}
              size={15}
              opacity={0.38}
            />
          </>
        )}
      </div>
    </>
  );
}

function MiniEnvelope({ style, size, opacity }: { style: React.CSSProperties; size: number; opacity: number }) {
  return (
    <div
      className="absolute mail-float"
      style={{ ...style, opacity }}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <rect x="1" y="4" width="18" height="13" rx="2.5" fill="#A855F7" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
        <path d="M1 7L10 13L19 7" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function HeroSpinner() {
  return (
    <>
      <style>{`
        @keyframes heroSpin { to { transform: rotate(360deg); } }
        .hero-spin { animation: heroSpin 0.85s linear infinite; }
      `}</style>
      <svg className="hero-spin" width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
        <path d="M20 4 A16 16 0 0 1 36 20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </>
  );
}

function ButtonSpinner() {
  return (
    <>
      <style>{`
        @keyframes btnSpin2 { to { transform: rotate(360deg); } }
        .btn-spin2 { animation: btnSpin2 0.75s linear infinite; }
      `}</style>
      <svg className="btn-spin2" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8.5" stroke="rgba(156,163,175,0.5)" strokeWidth="2.5"/>
        <path d="M11 2.5 A8.5 8.5 0 0 1 19.5 11" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: '16px', fontWeight: 700, color: '#9CA3AF' }}>Sending…</span>
    </>
  );
}

function CooldownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke="#9CA3AF" strokeWidth="1.5"/>
      <path d="M9 5V9L12 11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
