import { useState } from 'react';

type MarketType = 'B2C' | 'B2B' | 'C2C';

interface ProfileScreenProps {
  userName?: string;
  userEmail?: string;
  memberSince?: string;
  onSignOut?: () => void;
  initialSellerMode?: boolean;
  onSwitchToSeller?: () => void;
  onSwitchToBuyer?: () => void;
}

const MARKET_LABELS: Record<MarketType, { title: string; sub: string }> = {
  B2C: { title: 'B2C', sub: 'Business to Consumer' },
  B2B: { title: 'B2B', sub: 'Business to Business' },
  C2C: { title: 'C2C', sub: 'Consumer to Consumer' },
};

export function ProfileScreen({
  userName = 'Alex Johnson',
  userEmail = 'alex.johnson@example.com',
  memberSince = 'January 2024',
  onSignOut,
  initialSellerMode = false,
  onSwitchToSeller,
  onSwitchToBuyer,
}: ProfileScreenProps) {
  const [market, setMarket] = useState<MarketType>('B2C');
  const [sellerMode, setSellerMode] = useState(initialSellerMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: <EditIcon />,
      color: '#1F2937',
    },
    {
      id: 'seller',
      label: 'Switch to Seller Mode',
      icon: <SellerIcon />,
      color: '#1F2937',
      toggle: true,
    },
    {
      id: 'seller-profile',
      label: 'Seller Profile',
      icon: <SellerProfileIcon />,
      color: '#1F2937',
    },
    {
      id: 'verification',
      label: 'Verification Status',
      icon: <VerifyIcon />,
      color: '#1F2937',
      badge: 'Verified',
    },
    {
      id: 'transactions',
      label: 'My Transactions',
      icon: <TransactionIcon />,
      color: '#1F2937',
    },
    {
      id: 'earnings',
      label: 'Earnings Dashboard',
      icon: <EarningsIcon />,
      color: '#1F2937',
    },
    {
      id: 'payment',
      label: 'Payment Methods',
      icon: <PaymentIcon />,
      color: '#1F2937',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <NotifIcon />,
      color: '#1F2937',
    },
    {
      id: 'language',
      label: 'Language',
      icon: <LanguageIcon />,
      color: '#1F2937',
      value: 'English',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpIcon />,
      color: '#1F2937',
    },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">

      {/* ── Status Bar ── */}
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

      {/* ── App Bar ── */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Profile
        </h1>
        <button
          type="button"
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="#1F2937" strokeWidth="1.8"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#1F2937" strokeWidth="1.8"/>
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 96 }}>

        {/* ── Profile Hero ── */}
        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 96,
                height: 96,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
              }}
            >
              <span style={{ fontSize: '32px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                {initials}
              </span>
            </div>
            {/* Edit photo button */}
            <button
              type="button"
              className="absolute flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                border: '2.5px solid white',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Name */}
          <h2 style={{ fontSize: '21px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em', marginBottom: 4 }}>
            {userName}
          </h2>

          {/* Email */}
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: 10 }}>
            {userEmail}
          </p>

          {/* Account type badge + member since */}
          <div className="flex items-center gap-2">
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#7C3AED',
                backgroundColor: 'rgba(124,58,237,0.1)',
                border: '1.5px solid rgba(124,58,237,0.22)',
                borderRadius: 20,
                padding: '3px 12px',
                letterSpacing: '0.02em',
              }}
            >
              Buyer Account
            </span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>·</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Since {memberSince}</span>
          </div>
        </div>

        {/* ── Market Type Selector ── */}
        <div className="px-6 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Account Mode
          </p>
          <div
            className="flex rounded-2xl p-1 gap-1"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            {(['B2C', 'B2B', 'C2C'] as MarketType[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className="flex-1 flex flex-col items-center justify-center transition-all active:scale-95"
                style={{
                  height: 52,
                  borderRadius: 14,
                  border: 'none',
                  cursor: 'pointer',
                  background: market === m
                    ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                    : 'transparent',
                  boxShadow: market === m ? '0 2px 10px rgba(124,58,237,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: market === m ? 'white' : '#6B7280',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    transition: 'color 0.2s',
                  }}
                >
                  {MARKET_LABELS[m].title}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    color: market === m ? 'rgba(255,255,255,0.8)' : '#9CA3AF',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s',
                  }}
                >
                  {MARKET_LABELS[m].sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Menu List ── */}
        <div className="px-6 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Account
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            {menuItems.map((item, i) => (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => item.id === 'seller' ? setSellerMode(v => !v) : undefined}
                  className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
                  style={{
                    height: 52,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: 'rgba(124,58,237,0.08)',
                    }}
                  >
                    <span style={{ color: '#7C3AED', display: 'flex' }}>{item.icon}</span>
                  </div>

                  {/* Label */}
                  <span
                    className="flex-1"
                    style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}
                  >
                    {item.label}
                  </span>

                  {/* Right side */}
                  {item.toggle ? (
                    /* iOS-style toggle */
                    <div
                      className="relative flex-shrink-0 transition-all"
                      style={{
                        width: 44,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: sellerMode ? '#7C3AED' : '#D1D5DB',
                        transition: 'background-color 0.22s ease',
                      }}
                      onClick={() => {
                        const next = !sellerMode;
                        setSellerMode(next);
                        if (next && onSwitchToSeller) onSwitchToSeller();
                        if (!next && onSwitchToBuyer) onSwitchToBuyer();
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 3,
                          left: sellerMode ? 21 : 3,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'white',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          transition: 'left 0.22s ease',
                        }}
                      />
                    </div>
                  ) : item.badge ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#059669',
                        backgroundColor: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 20,
                        padding: '2px 8px',
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : item.value ? (
                    <span style={{ fontSize: '13px', color: '#9CA3AF', marginRight: 4 }}>
                      {item.value}
                    </span>
                  ) : null}

                  {/* Chevron (not for toggle) */}
                  {!item.toggle && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginLeft: item.badge || item.value ? 4 : 0 }}>
                      <path d="M6 4L10 8L6 12" stroke="#C4C9D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {/* Divider */}
                {i < menuItems.length - 1 && (
                  <div style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 56 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Sign Out ── */}
        <div className="px-6 mb-4">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              height: 52,
              borderRadius: 16,
              backgroundColor: 'rgba(239,68,68,0.07)',
              border: '1.5px solid rgba(239,68,68,0.2)',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>Sign Out</span>
          </button>
        </div>

        {/* ── Delete Account ── */}
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444', textDecoration: 'underline', textDecorationColor: 'rgba(239,68,68,0.4)' }}>
              Delete Account
            </span>
          </button>
        </div>

        {/* ── App version ── */}
        <div className="flex justify-center pb-4">
          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>Sorcyn v1.0.0 · Build 42</span>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 50, backdropFilter: 'blur(2px)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full rounded-t-3xl p-6"
            style={{ backgroundColor: 'white', paddingBottom: 36 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-5">
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </div>
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-4"
              style={{ width: 56, height: 56, backgroundColor: 'rgba(239,68,68,0.1)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6H21M8 6V4H16V6M19 6L18.2 19.2C18.1 20.2 17.2 21 16.2 21H7.8C6.8 21 5.9 20.2 5.8 19.2L5 6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11V17M14 11V17" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', textAlign: 'center', marginBottom: 8 }}>
              Delete Account?
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              This action is permanent and cannot be undone. All your posts, offers, and data will be erased.
            </p>
            <button
              type="button"
              className="w-full flex items-center justify-center transition-all active:scale-[0.97]"
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: '#EF4444',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 12,
                boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Yes, Delete My Account</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full flex items-center justify-center transition-all active:scale-[0.97]"
              style={{
                height: 52,
                borderRadius: 16,
                backgroundColor: '#F3F4F6',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#6B7280' }}>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Menu Icons ─────────────────────────────────────────────── */
function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M14.5 2.5L17.5 5.5L6 17H3V14L14.5 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function SellerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 6h14l-1.5 8H4.5L3 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 6L2 3H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="17" r="1" fill="currentColor"/>
      <circle cx="14" cy="17" r="1" fill="currentColor"/>
    </svg>
  );
}
function SellerProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 18C3 14.686 6.134 12 10 12C13.866 12 17 14.686 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 3L15.5 4.5L13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function VerifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L12.5 4.5H16V8L18.5 10L16 12V15.5H12.5L10 18L7.5 15.5H4V12L1.5 10L4 8V4.5H7.5L10 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function TransactionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 7H17M3 7L6 4M3 7L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 13H3M17 13L14 10M17 13L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function EarningsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 14L7 9L11 11L17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 5H17V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function PaymentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 8.5H18" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="5" y="11" width="3" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  );
}
function NotifIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M15 7A5 5 0 0 0 5 7c0 5.833-2.5 7.5-2.5 7.5h15S15 12.833 15 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.44 17.5a1.667 1.667 0 0 1-2.88 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function LanguageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2C10 2 7 6 7 10C7 14 10 18 10 18" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M10 2C10 2 13 6 13 10C13 14 10 18 10 18" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 10H18" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7.5 7.5C7.5 6.119 8.619 5 10 5C11.381 5 12.5 6.119 12.5 7.5C12.5 8.881 10 10 10 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="14" r="0.75" fill="currentColor"/>
    </svg>
  );
}