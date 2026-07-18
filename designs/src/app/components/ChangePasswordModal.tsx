'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ChangePasswordModalProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export function ChangePasswordModal({ onSubmit, onCancel }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const requirements = useMemo(() => [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One number', met: /\d/.test(newPassword) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const strength = useMemo(() => requirements.filter(r => r.met).length, [requirements]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || '';
  const strengthColor = ['#E5E7EB', '#EF4444', '#F59E0B', '#84CC16', '#10B981'][strength] || '#E5E7EB';

  const allMet = strength === 4;
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && allMet && passwordsMatch;

  const handleSubmit = () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmit();
      }, 1600);
    }, 1200);
  };

  return (
    /* Dimmed backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 80,
        backgroundColor: 'rgba(10,4,22,0.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '110%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.85 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '28px 28px 0 0',
          overflow: 'hidden',
          position: 'relative',
          maxHeight: '90%',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Success overlay */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0, zIndex: 10,
                borderRadius: 'inherit',
                backgroundColor: 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px',
              }}
            >
              {/* Burst rings */}
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0.6 }}
                  animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                  transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: 80, height: 80, borderRadius: '50%',
                    border: '2px solid rgba(16,185,129,0.3)',
                  }}
                />
              ))}

              {/* Check circle */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 14px 36px rgba(16,185,129,0.42)',
                  marginBottom: 24,
                }}
              >
                <motion.svg width="38" height="38" viewBox="0 0 38 38" fill="none"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                  <motion.path
                    d="M8 19L15 26L30 11"
                    stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center' }}
              >
                Password Updated!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}
              >
                Your password has been changed successfully.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1" style={{ padding: '4px 20px 0' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em' }}>
              Change Password
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center transition-all active:scale-90"
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Current Password */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
              Current Password
            </label>
            <div
              className="flex items-center gap-3 px-4 rounded-xl"
              style={{
                height: 52,
                border: `1.5px solid ${currentFocused ? '#7C3AED' : '#E5E7EB'}`,
                backgroundColor: currentFocused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
                transition: 'border-color 0.18s, background-color 0.18s',
              }}
            >
              <span style={{ color: currentFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                <LockIcon />
              </span>
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                onFocus={() => setCurrentFocused(true)}
                onBlur={() => setCurrentFocused(false)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
              New Password
            </label>
            <div
              className="flex items-center gap-3 px-4 rounded-xl"
              style={{
                height: 52,
                border: `1.5px solid ${newFocused ? '#7C3AED' : '#E5E7EB'}`,
                backgroundColor: newFocused ? 'rgba(124,58,237,0.03)' : '#F9FAFB',
                transition: 'border-color 0.18s, background-color 0.18s',
              }}
            >
              <span style={{ color: newFocused ? '#7C3AED' : '#9CA3AF', display: 'flex', flexShrink: 0, transition: 'color 0.18s' }}>
                <LockIcon />
              </span>
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onFocus={() => setNewFocused(true)}
                onBlur={() => setNewFocused(false)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showNew ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Strength indicator */}
            {newPassword.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="flex gap-1" style={{ marginBottom: 6 }}>
                  {[1, 2, 3, 4].map(bar => (
                    <div
                      key={bar}
                      style={{
                        flex: 1, height: 4, borderRadius: 2,
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

          {/* Confirm New Password */}
          <div style={{ marginBottom: 16, marginTop: 16 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                Confirm New Password
              </label>
              {newPassword.length > 0 && confirmPassword.length > 0 && (
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
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#1F2937', fontFamily: 'Inter, sans-serif',
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

          {/* Bottom spacing */}
          <div style={{ height: 8 }} />
        </div>

        {/* Sticky action buttons */}
        <div style={{
          flexShrink: 0,
          padding: '14px 20px 32px',
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* Update Password */}
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !canSubmit}
            whileTap={{ scale: isLoading || !canSubmit ? 1 : 0.97 }}
            style={{
              height: 54, borderRadius: 20,
              background: canSubmit
                ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
                : '#E5E7EB',
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 10px 28px rgba(124,58,237,0.38)' : 'none',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: isLoading ? 0.85 : 1,
              transition: 'opacity 0.2s, background 0.2s, box-shadow 0.2s',
            }}
          >
            {/* Shimmer */}
            {!isLoading && canSubmit && (
              <motion.div
                animate={{ x: ['-120%', '220%'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: '35%',
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)',
                  transform: 'skewX(-15deg)', pointerEvents: 'none',
                }}
              />
            )}
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }}
              />
            ) : (
              <span style={{ fontSize: '16px', fontWeight: 700, color: canSubmit ? 'white' : '#9CA3AF' }}>
                Update Password
              </span>
            )}
          </motion.button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="transition-all active:scale-[0.97]"
            style={{
              height: 48, borderRadius: 18,
              border: 'none',
              backgroundColor: '#F3F4F6',
              cursor: 'pointer',
              fontSize: '15px', fontWeight: 700, color: '#6B7280',
            }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */
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
