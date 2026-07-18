'use client';

interface SellerProfileViewScreenProps {
  onBack: () => void;
  onEdit: () => void;
  onManageVerification: () => void;
}

export function SellerProfileViewScreen({ onBack, onEdit, onManageVerification }: SellerProfileViewScreenProps) {
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
      <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-4">
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
            Seller Profile
          </h1>
        </div>
        <button
          type="button"
          onClick={onEdit}
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
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M13.5 2.5L15.5 4.5L6 14H4V12L13.5 2.5Z" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* Profile Hero */}
        <div className="flex flex-col items-center px-6 pt-4 pb-5">
          <div
            className="flex items-center justify-center rounded-full mb-4"
            style={{
              width: 96,
              height: 96,
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
              AJ
            </span>
          </div>
          <h2 style={{ fontSize: '21px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em', marginBottom: 4 }}>
            Alex&apos;s Design Studio
          </h2>
          <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', lineHeight: 1.5, marginBottom: 10, maxWidth: 280 }}>
            Professional graphic designer with 8+ years of experience in brand identity and digital design
          </p>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'white',
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              borderRadius: 20,
              padding: '4px 14px',
              boxShadow: '0 3px 10px rgba(124,58,237,0.3)',
            }}
          >
            Pro Seller
          </span>
        </div>

        {/* Profile Strength Card */}
        <div className="px-6 mb-4">
          <div
            style={{
              borderRadius: 20,
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '16px',
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 12L7 7L11 9L14 4" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 4H14V7" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Profile Strength</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div
                style={{
                  width: '85%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>85% Complete</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-2.5 px-6 mb-4">
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 1L11.47 6L17 6.74L12.5 11.1L13.82 16.58L9 14.02L4.18 16.58L5.5 11.1L1 6.74L6.53 6L9 1Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1"/></svg>, value: '4.9', label: 'Rating' },
            { icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#10B981" strokeWidth="1.5"/><path d="M6 9L8 11L12 7" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, value: '124', label: 'Completed' },
            { icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 4H15C15.55 4 16 4.45 16 5V13C16 13.55 15.55 14 15 14H5L2 16V5C2 4.45 2.45 4 3 4Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>, value: '61', label: 'Reviews' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex-1 flex flex-col items-center"
              style={{
                borderRadius: 20,
                border: '1.5px solid #F0F0F0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                padding: '14px 8px',
              }}
            >
              {stat.icon}
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', marginTop: 6 }}>{stat.value}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', marginTop: 2 }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Verification Badges Card */}
        <div className="px-6 mb-4">
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
                  <path d="M8 1L3 3.5V7.5C3 11.2 5.2 14.2 8 15C10.8 14.2 13 11.2 13 7.5V3.5L8 1Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.5 8L7 9.5L10.5 6" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Verification</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Email', verified: true },
                { label: 'Phone', verified: true },
                { label: 'ID', verified: false },
                { label: 'License', verified: false },
                { label: 'Insurance', verified: false },
                { label: 'Background', verified: false },
              ].map(badge => (
                <div key={badge.label} className="flex flex-col items-center" style={{ padding: '10px 4px' }}>
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: badge.verified ? 'rgba(16,185,129,0.1)' : '#F3F4F6',
                      marginBottom: 6,
                    }}
                  >
                    {badge.verified ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 8L7 11L12 5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M5 8H11" stroke="#D1D5DB" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: badge.verified ? '#059669' : '#9CA3AF' }}>
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Details Card */}
        <div className="px-6 mb-4">
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
                  <circle cx="8" cy="8" r="6.5" stroke="#7C3AED" strokeWidth="1.3"/>
                  <path d="M8 5V8.5M8 10.5V11" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Details</span>
            </div>

            {[
              { label: 'Service Radius', value: '25 miles' },
              { label: 'Experience', value: '8 years' },
              { label: 'Website', value: 'alexdesigns.com' },
              { label: 'Categories', value: 'Graphic Design, Branding' },
              { label: 'Availability', value: 'Mon-Fri, 9am-5pm' },
            ].map((row, idx) => (
              <div
                key={row.label}
                style={{
                  padding: '10px 0',
                  borderBottom: idx < 4 ? '1px solid #F8F8F8' : 'none',
                }}
              >
                <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'block', marginBottom: 2 }}>{row.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stripe Payment Card */}
        <div className="px-6 mb-4">
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
                  <rect x="1.5" y="4" width="13" height="9" rx="2" stroke="#7C3AED" strokeWidth="1.3"/>
                  <path d="M1.5 7H14.5" stroke="#7C3AED" strokeWidth="1.3"/>
                  <rect x="4" y="9.5" width="3" height="1.5" rx="0.5" fill="#7C3AED"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Payment</span>
            </div>

            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Stripe Connect</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 20,
                  padding: '2px 10px',
                }}
              >
                Connected
              </span>
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>View Stripe Dashboard</span>
            </button>
          </div>
        </div>

        {/* Manage Verification Button */}
        <div className="px-6 mb-4">
          <button
            type="button"
            onClick={onManageVerification}
            className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
            style={{
              height: 52,
              borderRadius: 16,
              border: '2px solid #7C3AED',
              backgroundColor: 'rgba(124,58,237,0.05)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L3 3.5V7.5C3 11.2 5.2 14.2 9 15C12.8 14.2 15 11.2 15 7.5V3.5L9 1Z" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 9L8 10.5L11.5 7" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#7C3AED' }}>Manage Verification</span>
          </button>
        </div>
      </div>
    </div>
  );
}
