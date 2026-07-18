'use client';

interface VerificationScreenProps {
  onBack: () => void;
}

type BadgeStatus = 'verified' | 'pending' | 'not_started';

interface Badge {
  label: string;
  status: BadgeStatus;
  iconType: string;
}

const BADGES: Badge[] = [
  { label: 'Email', status: 'verified', iconType: 'email' },
  { label: 'Phone', status: 'verified', iconType: 'phone' },
  { label: 'ID', status: 'pending', iconType: 'id' },
  { label: 'License', status: 'not_started', iconType: 'license' },
  { label: 'Insurance', status: 'not_started', iconType: 'insurance' },
  { label: 'Background', status: 'not_started', iconType: 'background' },
];

const BADGE_ICONS: Record<string, React.ReactNode> = {
  email: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 6L9 10L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="5" y="1.5" width="8" height="15" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 13.5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  id: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="7" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 12.5C4 11 5.3 10 7 10C8.7 10 10 11 10 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M12 7H14M12 9.5H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  license: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M12 2H6C4.9 2 4 2.9 4 4V14C4 15.1 4.9 16 6 16H12C13.1 16 14 15.1 14 14V4C14 2.9 13.1 2 12 2Z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 6H11M7 9H11M7 12H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  insurance: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5L3 4.5V8.5C3 12.5 5.5 15.5 9 16.5C12.5 15.5 15 12.5 15 8.5V4.5L9 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 6V10M9 12V12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  background: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M3 16.5C3 13.186 5.686 10.5 9 10.5C12.314 10.5 15 13.186 15 16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M11.5 5.5L13 7L16 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const STATUS_CONFIG: Record<BadgeStatus, { bg: string; iconColor: string; labelColor: string; statusLabel: string; statusColor: string }> = {
  verified: {
    bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    iconColor: 'white',
    labelColor: '#059669',
    statusLabel: 'Verified',
    statusColor: '#059669',
  },
  pending: {
    bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    iconColor: 'white',
    labelColor: '#D97706',
    statusLabel: 'Pending Review',
    statusColor: '#D97706',
  },
  not_started: {
    bg: '#F3F4F6',
    iconColor: '#9CA3AF',
    labelColor: '#9CA3AF',
    statusLabel: 'Not Started',
    statusColor: '#9CA3AF',
  },
};

const VERIFY_TYPES = ['License', 'Insurance', 'ID', 'Background'];

export function VerificationScreen({ onBack }: VerificationScreenProps) {
  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">
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

      {/* App Bar */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
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
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Verification
        </h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* Verification Badges Grid */}
        <div className="px-6 mb-5" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {BADGES.map(badge => {
              const cfg = STATUS_CONFIG[badge.status];
              return (
                <div
                  key={badge.label}
                  style={{
                    borderRadius: 20,
                    border: '1.5px solid #F0F0F0',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {/* Icon circle */}
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 44,
                      height: 44,
                      background: cfg.bg,
                      boxShadow: badge.status !== 'not_started' ? `0 4px 12px ${badge.status === 'verified' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` : 'none',
                      color: cfg.iconColor,
                    }}
                  >
                    {badge.status === 'verified' ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10L8.5 13.5L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : badge.status === 'pending' ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.5"/>
                        <path d="M9 5.5V9L11 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span style={{ color: cfg.iconColor }}>{BADGE_ICONS[badge.iconType]}</span>
                    )}
                  </div>

                  {/* Badge name */}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>
                    {badge.label}
                  </span>

                  {/* Status label */}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: cfg.statusColor }}>
                    {cfg.statusLabel}
                  </span>

                  {/* Action */}
                  {badge.status === 'not_started' && (
                    <button
                      type="button"
                      className="transition-all active:scale-95"
                      style={{
                        padding: '4px 14px',
                        borderRadius: 12,
                        border: '1.5px solid rgba(124,58,237,0.3)',
                        backgroundColor: 'rgba(124,58,237,0.05)',
                        cursor: 'pointer',
                        marginTop: 2,
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>Verify</span>
                    </button>
                  )}
                  {badge.status === 'pending' && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#D97706', marginTop: 2 }}>
                      Under Review
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Requests Section */}
        <div className="px-6 mb-5">
          <div
            style={{
              borderRadius: 20,
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '16px',
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(245,158,11,0.08)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#F59E0B" strokeWidth="1.3"/>
                  <path d="M8 4.5V8L10 9.5" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Pending Requests</span>
            </div>

            <div
              className="flex items-center justify-between"
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                backgroundColor: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: 3 }}>
                  Government ID Verification
                </p>
                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Submitted Apr 15</p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#D97706',
                  backgroundColor: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 20,
                  padding: '3px 10px',
                }}
              >
                Under Review
              </span>
            </div>
          </div>
        </div>

        {/* Upload New Section */}
        <div className="px-6 mb-5">
          <div
            style={{
              borderRadius: 20,
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '16px',
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Start New Verification</span>
            </div>

            {/* Type selector 2x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
              {VERIFY_TYPES.map((type, idx) => (
                <button
                  key={type}
                  type="button"
                  className="flex items-center gap-2 transition-all active:scale-95"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: idx === 0 ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                    backgroundColor: idx === 0 ? 'rgba(124,58,237,0.05)' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: idx === 0 ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0 }}>
                    {BADGE_ICONS[type.toLowerCase()] || BADGE_ICONS['license']}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? '#7C3AED' : '#6B7280' }}>
                    {type}
                  </span>
                </button>
              ))}
            </div>

            {/* Upload area */}
            <button
              type="button"
              className="w-full flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                padding: '24px 16px',
                borderRadius: 16,
                border: '2px dashed rgba(124,58,237,0.3)',
                backgroundColor: 'rgba(124,58,237,0.02)',
                cursor: 'pointer',
                marginBottom: 14,
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 44, height: 44, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3V13M6 7L10 3L14 7" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 13V15C3 16.1 3.9 17 5 17H15C16.1 17 17 16.1 17 15V13" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED' }}>Upload Document</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>JPG, PNG, or PDF up to 10 MB</span>
            </button>

            {/* Submit button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                height: 52,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 14L14 2M14 2H8M14 2V8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Submit for Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
