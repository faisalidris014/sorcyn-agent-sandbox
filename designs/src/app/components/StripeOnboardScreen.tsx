'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

interface StripeOnboardScreenProps {
  onBack: () => void;
  onStartOnboarding: () => void;
}

export function StripeOnboardScreen({ onBack, onStartOnboarding }: StripeOnboardScreenProps) {
  const [status, setStatus] = useState<OnboardingStatus>('not_started');

  const statusConfig = {
    not_started: {
      title: 'Set Up Payments',
      subtitle: 'Connect your Stripe account to start receiving payments from buyers on the platform.',
      ctaLabel: 'Set Up Stripe',
      ctaBg: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
      ctaShadow: '0 8px 20px rgba(124,58,237,0.35)',
    },
    in_progress: {
      title: 'Complete Setup',
      subtitle: 'Your Stripe account setup is partially complete. Continue where you left off.',
      ctaLabel: 'Continue Setup',
      ctaBg: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
      ctaShadow: '0 8px 20px rgba(124,58,237,0.35)',
    },
    completed: {
      title: 'Payments Connected',
      subtitle: 'Your Stripe account is fully connected. You can now receive payments from buyers.',
      ctaLabel: 'View Dashboard',
      ctaBg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      ctaShadow: '0 8px 20px rgba(16,185,129,0.35)',
    },
  };

  const config = statusConfig[status];

  const benefits = [
    'Receive direct deposits to your bank',
    'Secure payment processing by Stripe',
    'Automatic tax document generation',
    'Real-time payout tracking',
  ];

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
          Payment Setup
        </h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* Hero Section */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6">
          {/* Large status icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="flex items-center justify-center rounded-full mb-5"
            style={{
              width: 80,
              height: 80,
              background: status === 'completed'
                ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                : 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              boxShadow: status === 'completed'
                ? '0 12px 30px rgba(16,185,129,0.4)'
                : '0 12px 30px rgba(124,58,237,0.4)',
            }}
          >
            {status === 'completed' ? (
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M8 18L15 25L28 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect x="5" y="10" width="26" height="18" rx="3" stroke="white" strokeWidth="2.2"/>
                <path d="M5 15H31" stroke="white" strokeWidth="2"/>
                <rect x="9" y="20" width="6" height="3" rx="1" fill="white"/>
              </svg>
            )}
          </motion.div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center' }}>
            {config.title}
          </h2>
          <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
            {config.subtitle}
          </p>
        </div>

        {/* Status Card */}
        <div className="px-6 mb-5">
          <div
            style={{
              borderRadius: 20,
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              padding: '16px',
            }}
          >
            {status === 'not_started' && (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.08)', flexShrink: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2L11.47 7L17 7.74L12.5 12.1L13.82 17L9 14.54L4.18 17L5.5 12.1L1 7.74L6.53 7L9 2Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                  Get started with Stripe Connect to receive payments securely
                </p>
              </div>
            )}

            {status === 'in_progress' && (
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>Setup Progress</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>60%</span>
                </div>
                <div style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 8 }}>
                  Continue in Stripe to complete your account setup
                </p>
              </div>
            )}

            {status === 'completed' && (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: 'rgba(16,185,129,0.1)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M5 9L8 12L13 6" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>Your Stripe account is connected</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 2 }}>Payments will be deposited automatically</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo status switcher */}
        <div className="flex gap-2 px-6 mb-5">
          {(['not_started', 'in_progress', 'completed'] as OnboardingStatus[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className="flex-1 transition-all active:scale-95"
              style={{
                padding: '6px 8px',
                borderRadius: 10,
                border: status === s ? 'none' : '1.5px solid #E5E7EB',
                background: status === s ? 'linear-gradient(135deg, #7C3AED, #A855F7)' : 'white',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 600, color: status === s ? 'white' : '#6B7280', textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>

        {/* Benefits List */}
        <div className="px-6 mb-6">
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
                  <path d="M8 1L3 3.5V7.5C3 11.2 5.2 14.2 8 15C10.8 14.2 13 11.2 13 7.5V3.5L8 1Z" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Benefits</span>
            </div>

            <div className="flex flex-col gap-3">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 24, height: 24, backgroundColor: 'rgba(16,185,129,0.1)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-6 mb-5">
          <motion.button
            type="button"
            onClick={onStartOnboarding}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2"
            style={{
              height: 56,
              borderRadius: 24,
              background: config.ctaBg,
              border: 'none',
              cursor: 'pointer',
              boxShadow: config.ctaShadow,
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
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
              {config.ctaLabel}
            </span>
          </motion.button>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 px-6 pb-6">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <rect x="3.5" y="6" width="7" height="6" rx="1.5" stroke="#9CA3AF" strokeWidth="1.2"/>
            <path d="M5 6V4.5C5 3.4 5.9 2.5 7 2.5C8.1 2.5 9 3.4 9 4.5V6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
            Powered by Stripe  ·  256-bit encryption
          </span>
        </div>
      </div>
    </div>
  );
}
