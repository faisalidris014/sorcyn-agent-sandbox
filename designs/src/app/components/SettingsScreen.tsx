'use client';

import { useState } from 'react';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

      {/* Header */}
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* NOTIFICATIONS Section */}
        <div className="px-6 mt-5 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Notifications
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            {/* Push Notifications */}
            <button
              type="button"
              onClick={() => setPushNotifications(v => !v)}
              className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
              style={{ height: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><BellIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Push Notifications
              </span>
              <Toggle active={pushNotifications} onToggle={() => setPushNotifications(v => !v)} />
            </button>

            <div style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 56 }} />

            {/* Email Notifications */}
            <button
              type="button"
              onClick={() => setEmailNotifications(v => !v)}
              className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
              style={{ height: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><MailIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Email Notifications
              </span>
              <Toggle active={emailNotifications} onToggle={() => setEmailNotifications(v => !v)} />
            </button>
          </div>
        </div>

        {/* PREFERENCES Section */}
        <div className="px-6 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Preferences
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            {/* Language */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
              style={{ height: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><GlobeIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Language
              </span>
              <span style={{ fontSize: '13px', color: '#9CA3AF', marginRight: 4 }}>English</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 4L10 8L6 12" stroke="#C4C9D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 56 }} />

            {/* Dark Mode */}
            <div
              className="w-full flex items-center gap-3 px-4"
              style={{ height: 52, opacity: 0.55 }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><MoonIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Dark Mode
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#9CA3AF',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 20,
                  padding: '2px 8px',
                  marginRight: 4,
                }}
              >
                Coming Soon
              </span>
              <Toggle active={false} onToggle={() => {}} disabled />
            </div>
          </div>
        </div>

        {/* ABOUT Section */}
        <div className="px-6 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            About
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
          >
            {/* Privacy Policy */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
              style={{ height: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><ShieldIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Privacy Policy
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 4L10 8L6 12" stroke="#C4C9D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 56 }} />

            {/* Terms of Service */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
              style={{ height: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><FileTextIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Terms of Service
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 4L10 8L6 12" stroke="#C4C9D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 56 }} />

            {/* Contact Support */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 transition-all active:bg-gray-100"
              style={{ height: 52, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 34, height: 34, backgroundColor: 'rgba(124,58,237,0.08)' }}
              >
                <span style={{ color: '#7C3AED', display: 'flex' }}><HeadphonesIcon /></span>
              </div>
              <span className="flex-1" style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                Contact Support
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 4L10 8L6 12" stroke="#C4C9D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="px-6 mb-4" style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
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
              <path d="M3 6H21M8 6V4H16V6M19 6L18.2 19.2C18.1 20.2 17.2 21 16.2 21H7.8C6.8 21 5.9 20.2 5.8 19.2L5 6" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11V17M14 11V17" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>Delete Account</span>
          </button>
        </div>

        {/* App version */}
        <div className="flex justify-center pb-4">
          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>Sorcyn v1.0.0 · Build 42</span>
        </div>
      </div>

      {/* Delete Confirm Modal */}
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
              This action is permanent and cannot be undone. All your data, posts, and transactions will be erased forever.
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

/* ─── Toggle Component ─────────────────────────────────────── */
function Toggle({ active, onToggle, disabled = false }: { active: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        backgroundColor: active ? '#7C3AED' : '#D1D5DB',
        transition: 'background-color 0.22s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={e => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: active ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.22s ease',
        }}
      />
    </div>
  );
}

/* ─── Menu Icons ────────────────────────────────────────────── */
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M15 7A5 5 0 0 0 5 7c0 5.833-2.5 7.5-2.5 7.5h15S15 12.833 15 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.44 17.5a1.667 1.667 0 0 1-2.88 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 6L10 11L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2C10 2 7 6 7 10C7 14 10 18 10 18" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M10 2C10 2 13 6 13 10C13 14 10 18 10 18" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 10H18" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M17.5 10.5C17.5 14.64 14.14 18 10 18C5.86 18 2.5 14.64 2.5 10.5C2.5 6.36 5.86 3 10 3C10.35 3 10.7 3.02 11.04 3.07C9.27 4.28 8.15 6.28 8.15 8.55C8.15 12.24 11.16 15.25 14.85 15.25C15.6 15.25 16.32 15.12 17 14.87C16.25 15.83 15.24 16.58 14.08 17.02" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 5.5V10C3 14.5 6 17.5 10 18.5C14 17.5 17 14.5 17 10V5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 8V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="13.5" r="0.75" fill="currentColor"/>
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M12 2H5C4.45 2 4 2.45 4 3V17C4 17.55 4.45 18 5 18H15C15.55 18 16 17.55 16 17V6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2V6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 10H13M7 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M3 14V10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="1.5" y="12" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="15.5" y="12" width="3" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
