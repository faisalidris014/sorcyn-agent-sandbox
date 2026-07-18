import { useState, useMemo } from 'react';

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (email?: string) => void;
  onSignIn: () => void;
}

type AccountType = 'buy' | 'sell' | 'both' | null;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
  if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
  if (score === 3) return { score: 3, label: 'Good', color: '#7C3AED' };
  return { score: 4, label: 'Strong', color: '#A855F7' };
}

// Generic text input with icon
function InputField({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  rightSlot,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '7px' }}>
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 rounded-xl"
        style={{
          height: 50,
          border: `1.5px solid ${focused ? '#7C3AED' : '#E5E7EB'}`,
          backgroundColor: focused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
          transition: 'border-color 0.18s, background-color 0.18s',
        }}
      >
        <span style={{ flexShrink: 0, color: focused ? '#7C3AED' : '#9CA3AF', display: 'flex', transition: 'color 0.18s' }}>
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: '#1F2937',
            fontFamily: 'Inter, sans-serif',
            minWidth: 0,
          }}
        />
        {rightSlot}
      </div>
    </div>
  );
}

// Isolated password field
function PasswordField({
  value,
  onChange,
  showPassword,
  setShowPassword,
}: {
  value: string;
  onChange: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-4 rounded-xl"
      style={{
        height: 50,
        border: `1.5px solid ${focused ? '#7C3AED' : '#E5E7EB'}`,
        backgroundColor: focused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
        transition: 'border-color 0.18s, background-color 0.18s',
      }}
    >
      <span style={{ color: focused ? '#7C3AED' : '#9CA3AF', flexShrink: 0, display: 'flex', transition: 'color 0.18s' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 8V5.5C6 3.843 7.343 2.5 9 2.5C10.657 2.5 12 3.843 12 5.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="9" cy="12" r="1" fill="currentColor"/>
        </svg>
      </span>
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
        onClick={() => setShowPassword(!showPassword)}
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
  );
}

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 16C2 13.24 5.13 11 9 11C12.87 11 16 13.24 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1.5 4.5C1.5 3.675 2.175 3 3 3H15C15.825 3 16.5 3.675 16.5 4.5V13.5C16.5 14.325 15.825 15 15 15H3C2.175 15 1.5 14.325 1.5 13.5V4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.5 4.5L9 9.75L16.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3.5 2H6.5L8 5.5L6.25 6.75C7.07 8.51 8.49 9.93 10.25 10.75L11.5 9L15 10.5V13.5C15 14.33 14.33 15 13.5 15C7.14 15 2 9.86 2 3.5C2 2.67 2.67 2 3.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 1.5C6.515 1.5 4.5 3.515 4.5 6C4.5 9.375 9 16.5 9 16.5C9 16.5 13.5 9.375 13.5 6C13.5 3.515 11.485 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export function RegisterScreen({ onBack, onRegister, onSignIn }: RegisterScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone]         = useState('');
  const [zip, setZip]             = useState('');
  const [accountType, setAccountType] = useState<AccountType>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const accountTypes: { id: AccountType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'buy',
      label: 'Buy',
      desc: 'Shop & discover',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 3H5L5.68 6M5.68 6L7.5 14H17.5L19.5 6H5.68Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="17.5" r="1.5" fill="currentColor"/>
          <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor"/>
        </svg>
      ),
    },
    {
      id: 'sell',
      label: 'Sell',
      desc: 'List & earn',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="10" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M6 10V7C6 4.79 8.24 3 11 3C13.76 3 16 4.79 16 7V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M8 15H14M11 12V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'both',
      label: 'Both',
      desc: 'Full access',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 8L11 3L18 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 14L11 19L18 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 3V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 2"/>
        </svg>
      ),
    },
  ];

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
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center transition-all active:scale-90 mb-5"
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

          {/* Heading */}
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: '5px' }}>
            Create Account
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5', marginBottom: '24px' }}>
            Join Sorcyn and start today
          </p>

          {/* First Name — full width */}
          <div className="mb-4">
            <InputField
              label="First Name"
              placeholder="Jane"
              value={firstName}
              onChange={setFirstName}
              icon={<PersonIcon />}
            />
          </div>

          {/* Last Name — full width, stacked below */}
          <div className="mb-4">
            <InputField
              label="Last Name"
              placeholder="Doe"
              value={lastName}
              onChange={setLastName}
              icon={<PersonIcon />}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <InputField
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              icon={<MailIcon />}
            />
          </div>

          {/* Password + strength */}
          <div className="mb-4">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '7px' }}>
              Password
            </label>
            <PasswordField
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1.5 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 4,
                        background:
                          i <= strength.score
                            ? i <= 1
                              ? '#EF4444'
                              : i === 2
                              ? '#F59E0B'
                              : 'linear-gradient(90deg, #7C3AED, #A855F7)'
                            : '#E5E7EB',
                        transition: 'background 0.25s',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="mb-4">
            <InputField
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={setPhone}
              icon={<PhoneIcon />}
            />
          </div>

          {/* ZIP Code */}
          <div className="mb-6">
            <InputField
              label="ZIP Code"
              type="text"
              placeholder="90210"
              value={zip}
              onChange={setZip}
              icon={<PinIcon />}
            />
          </div>

          {/* Account Type */}
          <div className="mb-6">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '10px' }}>
              Account Type
            </label>
            <div className="flex gap-3">
              {accountTypes.map(({ id, label, desc, icon }) => {
                const selected = accountType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAccountType(id)}
                    className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95 relative"
                    style={{
                      border: `1.5px solid ${selected ? '#7C3AED' : '#E5E7EB'}`,
                      backgroundColor: selected ? 'rgba(124,58,237,0.07)' : '#F9FAFB',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {/* Icon circle */}
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 44,
                        height: 44,
                        background: selected
                          ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                          : '#EDEDF0',
                        transition: 'background 0.18s',
                      }}
                    >
                      <span style={{ color: selected ? 'white' : '#6B7280', display: 'flex', transition: 'color 0.18s' }}>
                        {icon}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: selected ? '#7C3AED' : '#1F2937', transition: 'color 0.18s' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '11px', color: selected ? '#9F67FA' : '#9CA3AF', transition: 'color 0.18s' }}>
                      {desc}
                    </span>
                    {/* Checkmark badge */}
                    {selected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#7C3AED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terms */}
          <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: '1.6', textAlign: 'center', marginBottom: '20px' }}>
            By creating an account you agree to our{' '}
            <span style={{ color: '#7C3AED', fontWeight: 600 }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#7C3AED', fontWeight: 600 }}>Privacy Policy</span>
          </p>

          {/* Create Account Button */}
          <button
            type="button"
            onClick={() => onRegister(email)}
            className="w-full flex items-center justify-center transition-all active:scale-[0.97]"
            style={{
              height: 56,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '0.01em' }}>
              Create Account
            </span>
          </button>

          {/* Sign In link */}
          <div className="flex items-center justify-center pb-10">
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Already have an account?&nbsp;</span>
            <button
              type="button"
              onClick={onSignIn}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}