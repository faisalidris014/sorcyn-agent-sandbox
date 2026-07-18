'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

interface SellerProfileSetupScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function SellerProfileSetupScreen({ onBack, onSave }: SellerProfileSetupScreenProps) {
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [experience, setExperience] = useState('');
  const [website, setWebsite] = useState('');
  const [emergencyServices, setEmergencyServices] = useState(false);

  const [businessNameFocused, setBusinessNameFocused] = useState(false);
  const [bioFocused, setBioFocused] = useState(false);
  const [radiusFocused, setRadiusFocused] = useState(false);
  const [experienceFocused, setExperienceFocused] = useState(false);
  const [websiteFocused, setWebsiteFocused] = useState(false);

  const selectedCategories = ['Graphic Design', 'Branding'];

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden" style={{ position: 'relative' }}>
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
          Set Up Seller Profile
        </h1>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 18px', paddingBottom: 120 }}>

        {/* Business Name */}
        <div style={{ marginBottom: 18 }}>
          <div className="flex items-center gap-1" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>Business Name</label>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>(optional)</span>
          </div>
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 52,
              borderRadius: 14,
              border: `1.5px solid ${businessNameFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: businessNameFocused ? 'rgba(124,58,237,0.03)' : 'white',
              transition: 'border-color 0.18s, background-color 0.18s',
            }}
          >
            <span style={{ color: businessNameFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3 16V5L9 2L15 5V16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 16V12H11V16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 8H7.01M11 8H11.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onFocus={() => setBusinessNameFocused(true)}
              onBlur={() => setBusinessNameFocused(false)}
              placeholder="Your business name"
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
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>Bio</label>
            <span style={{ fontSize: '12px', fontWeight: 600, color: bio.length > 450 ? '#EF4444' : '#9CA3AF' }}>
              {bio.length}/500
            </span>
          </div>
          <textarea
            value={bio}
            onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value); }}
            onFocus={() => setBioFocused(true)}
            onBlur={() => setBioFocused(false)}
            placeholder="Tell buyers about your skills and experience..."
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 16px',
              borderRadius: 14,
              border: `1.5px solid ${bioFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: bioFocused ? 'rgba(124,58,237,0.03)' : 'white',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#1F2937',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Inter, sans-serif',
              minHeight: 100,
              transition: 'border-color 0.18s, background-color 0.18s',
            }}
          />
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
            Selected Categories
          </label>
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
            {selectedCategories.map(cat => (
              <span
                key={cat}
                className="flex items-center gap-1.5"
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(124,58,237,0.08)',
                  border: '1.5px solid rgba(124,58,237,0.2)',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED' }}>{cat}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3L9 9M9 3L3 9" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 transition-all active:scale-95"
            style={{
              padding: '10px 16px',
              borderRadius: 14,
              border: '2px dashed rgba(124,58,237,0.3)',
              backgroundColor: 'rgba(124,58,237,0.03)',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M3 7H11" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>Add Category</span>
          </button>
        </div>

        {/* Service Radius */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
            Service Radius
          </label>
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 52,
              borderRadius: 14,
              border: `1.5px solid ${radiusFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: radiusFocused ? 'rgba(124,58,237,0.03)' : 'white',
              transition: 'border-color 0.18s, background-color 0.18s',
            }}
          >
            <span style={{ color: radiusFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="9" cy="9" r="1" fill="currentColor"/>
              </svg>
            </span>
            <input
              type="number"
              value={serviceRadius}
              onChange={e => setServiceRadius(e.target.value)}
              onFocus={() => setRadiusFocused(true)}
              onBlur={() => setRadiusFocused(false)}
              placeholder="25"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', flexShrink: 0 }}>miles</span>
          </div>
        </div>

        {/* Years of Experience */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
            Years of Experience
          </label>
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 52,
              borderRadius: 14,
              border: `1.5px solid ${experienceFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: experienceFocused ? 'rgba(124,58,237,0.03)' : 'white',
              transition: 'border-color 0.18s, background-color 0.18s',
            }}
          >
            <span style={{ color: experienceFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L11 6.5L16 7.3L12.5 10.7L13.3 15.7L9 13.4L4.7 15.7L5.5 10.7L2 7.3L7 6.5L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </span>
            <input
              type="number"
              value={experience}
              onChange={e => setExperience(e.target.value)}
              onFocus={() => setExperienceFocused(true)}
              onBlur={() => setExperienceFocused(false)}
              placeholder="e.g. 5"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', flexShrink: 0 }}>years</span>
          </div>
        </div>

        {/* Website URL */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
            Website URL
          </label>
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 52,
              borderRadius: 14,
              border: `1.5px solid ${websiteFocused ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: websiteFocused ? 'rgba(124,58,237,0.03)' : 'white',
              transition: 'border-color 0.18s, background-color 0.18s',
            }}
          >
            <span style={{ color: websiteFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M7.5 10.5L10.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M10.5 11.5L12 10C13.1 8.9 13.1 7.1 12 6L12 6C10.9 4.9 9.1 4.9 8 6L6.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M7.5 6.5L6 8C4.9 9.1 4.9 10.9 6 12L6 12C7.1 13.1 8.9 13.1 10 12L11.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              type="url"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              onFocus={() => setWebsiteFocused(true)}
              onBlur={() => setWebsiteFocused(false)}
              placeholder="https://your-website.com"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Availability */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
            Availability
          </label>
          <div
            className="flex items-center justify-between px-4"
            style={{
              height: 52,
              borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              backgroundColor: 'white',
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M9 5V9L12 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#1F2937' }}>Mon-Fri, 9am-5pm</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M13.5 2.5L15.5 4.5L6 14H4V12L13.5 2.5Z" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Emergency Services Toggle */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '14px 16px',
            borderRadius: 16,
            border: '1.5px solid #F0F0F0',
            marginBottom: 12,
          }}
        >
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block' }}>
              Emergency Services
            </span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Available for urgent requests</span>
          </div>
          <div
            className="relative flex-shrink-0"
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              backgroundColor: emergencyServices ? '#7C3AED' : '#D1D5DB',
              transition: 'background-color 0.22s ease',
              cursor: 'pointer',
            }}
            onClick={() => setEmergencyServices(v => !v)}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: emergencyServices ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.22s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '12px 18px 30px',
          zIndex: 40,
        }}
      >
        <motion.button
          type="button"
          onClick={onSave}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2"
          style={{
            height: 56,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              transform: 'skewX(-15deg)',
              pointerEvents: 'none',
            }}
          />
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Save Profile</span>
        </motion.button>
      </div>
    </div>
  );
}
