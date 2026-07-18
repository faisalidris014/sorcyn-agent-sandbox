'use client';

import { useState } from 'react';

interface EditProfileScreenProps {
  onBack: () => void;
  onSave: () => void;
  onChangePassword: () => void;
}

export function EditProfileScreen({ onBack, onSave, onChangePassword }: EditProfileScreenProps) {
  const [firstName, setFirstName] = useState('Alex');
  const [lastName, setLastName] = useState('Johnson');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [zip, setZip] = useState('75001');

  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [zipFocused, setZipFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);

  const email = 'alex.johnson@example.com';

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
          Edit Profile
        </h1>
        <button
          type="button"
          onClick={onSave}
          className="transition-all active:scale-95"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Save</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* Profile Photo Section */}
        <div className="flex flex-col items-center px-6 pt-4 pb-5">
          <div className="relative mb-2">
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
                AJ
              </span>
            </div>
            {/* Camera overlay button */}
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
                <path d="M6 2L5 4H3C2.45 4 2 4.45 2 5V12C2 12.55 2.45 13 3 13H13C13.55 13 14 12.55 14 12V5C14 4.45 13.55 4 13 4H11L10 2H6Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8" cy="8.5" r="2.5" stroke="white" strokeWidth="1.3"/>
              </svg>
            </button>
          </div>
          <span style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 4 }}>Tap to change photo</span>
        </div>

        {/* Form Fields */}
        <div className="px-6">

          {/* First Name + Last Name Row */}
          <div className="flex gap-3" style={{ marginBottom: 18 }}>
            {/* First Name */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
                First Name
              </label>
              <div
                className="flex items-center gap-3 px-4"
                style={{
                  height: 52,
                  borderRadius: 14,
                  border: `1.5px solid ${firstNameFocused ? '#7C3AED' : '#E5E7EB'}`,
                  backgroundColor: firstNameFocused ? 'rgba(124,58,237,0.03)' : 'white',
                  transition: 'border-color 0.18s, background-color 0.18s',
                }}
              >
                <span style={{ color: firstNameFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 16.5C3 13.186 5.686 10.5 9 10.5C12.314 10.5 15 13.186 15 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  onFocus={() => setFirstNameFocused(true)}
                  onBlur={() => setFirstNameFocused(false)}
                  placeholder="First name"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            </div>

            {/* Last Name */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
                Last Name
              </label>
              <div
                className="flex items-center gap-3 px-4"
                style={{
                  height: 52,
                  borderRadius: 14,
                  border: `1.5px solid ${lastNameFocused ? '#7C3AED' : '#E5E7EB'}`,
                  backgroundColor: lastNameFocused ? 'rgba(124,58,237,0.03)' : 'white',
                  transition: 'border-color 0.18s, background-color 0.18s',
                }}
              >
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  onFocus={() => setLastNameFocused(true)}
                  onBlur={() => setLastNameFocused(false)}
                  placeholder="Last name"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Email (disabled) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
              Email
            </label>
            <div
              className="flex items-center gap-3 px-4"
              style={{
                height: 52,
                borderRadius: 14,
                border: '1.5px solid #E5E7EB',
                backgroundColor: '#F3F4F6',
                opacity: 0.7,
              }}
            >
              <span style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M2 6L9 10L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={{ flex: 1, fontSize: '15px', color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
                {email}
              </span>
              <span style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5.5 7V5.5C5.5 4.12 6.62 3 8 3C9.38 3 10.5 4.12 10.5 5.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
              Phone
            </label>
            <div
              className="flex items-center gap-3 px-4"
              style={{
                height: 52,
                borderRadius: 14,
                border: `1.5px solid ${phoneFocused ? '#7C3AED' : '#E5E7EB'}`,
                backgroundColor: phoneFocused ? 'rgba(124,58,237,0.03)' : 'white',
                transition: 'border-color 0.18s, background-color 0.18s',
              }}
            >
              <span style={{ color: phoneFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M16 12.5C16 12.95 15.83 13.38 15.54 13.71C15.25 14.04 14.85 14.25 14.4 14.3C12.45 14.55 10.56 14.18 8.89 13.25C7.34 12.41 6.04 11.11 5.2 9.56C4.27 7.87 3.9 5.96 4.15 4.09C4.2 3.64 4.41 3.24 4.74 2.95C5.07 2.67 5.5 2.5 5.95 2.5H7.5C8.33 2.5 9.04 3.1 9.15 3.92L9.4 5.73C9.46 6.13 9.27 6.53 8.93 6.74L8.15 7.2C8.96 8.61 10.07 9.72 11.48 10.53L11.94 9.75C12.15 9.41 12.55 9.22 12.95 9.28L14.76 9.53C15.58 9.64 16.18 10.35 16.18 11.18L16 12.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="(555) 000-0000"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          </div>

          {/* ZIP Code */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
              ZIP Code
            </label>
            <div
              className="flex items-center gap-3 px-4"
              style={{
                height: 52,
                borderRadius: 14,
                border: `1.5px solid ${zipFocused ? '#7C3AED' : '#E5E7EB'}`,
                backgroundColor: zipFocused ? 'rgba(124,58,237,0.03)' : 'white',
                transition: 'border-color 0.18s, background-color 0.18s',
              }}
            >
              <span style={{ color: zipFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1.5C6.52 1.5 4.5 3.52 4.5 6C4.5 9.75 9 15.5 9 15.5S13.5 9.75 13.5 6C13.5 3.52 11.48 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </span>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                onFocus={() => setZipFocused(true)}
                onBlur={() => setZipFocused(false)}
                placeholder="ZIP code"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 18 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                Bio
              </label>
              <span style={{ fontSize: '12px', fontWeight: 600, color: bio.length > 450 ? '#EF4444' : '#9CA3AF' }}>
                {bio.length}/500
              </span>
            </div>
            <div
              style={{
                borderRadius: 14,
                border: `1.5px solid ${bioFocused ? '#7C3AED' : '#E5E7EB'}`,
                backgroundColor: bioFocused ? 'rgba(124,58,237,0.03)' : 'white',
                transition: 'border-color 0.18s, background-color 0.18s',
                position: 'relative',
              }}
            >
              <div className="flex gap-3 px-4 pt-3">
                <span style={{ color: bioFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, marginTop: 2, transition: 'color 0.18s' }}>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M13 2H5C3.9 2 3 2.9 3 4V14C3 15.1 3.9 16 5 16H13C14.1 16 15 15.1 15 14V4C15 2.9 14.1 2 13 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6H12M6 9H12M6 12H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </span>
                <textarea
                  value={bio}
                  onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value); }}
                  onFocus={() => setBioFocused(true)}
                  onBlur={() => setBioFocused(false)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                    resize: 'none', lineHeight: 1.6, minHeight: 120,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <button
            type="button"
            onClick={onChangePassword}
            className="w-full flex items-center justify-between transition-all active:scale-[0.98]"
            style={{
              height: 48,
              borderRadius: 14,
              border: '1.5px solid rgba(124,58,237,0.2)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              padding: '0 16px',
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>
              Change Password
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
