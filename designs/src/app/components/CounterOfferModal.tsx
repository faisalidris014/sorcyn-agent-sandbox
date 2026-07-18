'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export interface CounterOfferModalProps {
  onSubmit: (amount: number, message: string) => void;
  onCancel: () => void;
  originalAmount?: number;
  sellerName?: string;
  sellerInitials?: string;
  sellerGradient?: string;
}

/* ─── Main component ────────────────────────────────────────── */
export function CounterOfferModal({
  onSubmit,
  onCancel,
  originalAmount = 450,
  sellerName = 'Marcus Chen',
  sellerInitials = 'MC',
  sellerGradient = 'linear-gradient(135deg,#3B82F6,#2DD4BF)',
}: CounterOfferModalProps) {
  const [counterAmount, setCounterAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const numericAmount = parseFloat(counterAmount) || 0;
  const isBelowHalf = numericAmount > 0 && numericAmount < originalAmount * 0.5;
  const canSubmit = numericAmount > 0 && message.trim().length > 0;

  return (
    /* ── Dimmed backdrop ── */
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
      {/* ── Sheet ── */}
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
        {/* ── Handle ── */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto flex-1" style={{ padding: '4px 20px 0' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Counter Offer
              </h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 3 }}>Suggest a different price</p>
            </div>
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

          {/* ── Original offer summary ── */}
          <div style={{
            borderRadius: 20, padding: '16px',
            background: 'linear-gradient(135deg,rgba(124,58,237,0.05) 0%,rgba(168,85,247,0.04) 100%)',
            border: '1.5px solid rgba(124,58,237,0.15)',
            marginBottom: 20,
          }}>
            <p style={{
              fontSize: '11px', fontWeight: 700, color: '#A855F7',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
            }}>
              Original Offer
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: sellerGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.5)',
              }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>{sellerInitials}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>{sellerName}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  ${originalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ── Counter amount input ── */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Your Counter
            </p>
            <motion.div
              animate={{
                borderColor: isFocused ? '#7C3AED' : '#E5E7EB',
                boxShadow: isFocused ? '0 0 0 4px rgba(124,58,237,0.12)' : '0 0 0 0px rgba(124,58,237,0)',
              }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                height: 56, borderRadius: 16,
                border: '1.5px solid #E5E7EB',
                backgroundColor: '#FAFAFA',
                padding: '0 16px',
              }}
            >
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#7C3AED' }}>$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={counterAmount}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  if (val.split('.').length <= 2) setCounterAmount(val);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                  flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
                  fontSize: '28px', fontWeight: 800, color: '#1F2937',
                  letterSpacing: '-0.02em',
                }}
              />
            </motion.div>
          </div>

          {/* ── Below-market-value warning ── */}
          <AnimatePresence>
            {isBelowHalf && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '12px 14px', borderRadius: 14,
                  backgroundColor: 'rgba(245,158,11,0.08)',
                  border: '1.5px solid rgba(245,158,11,0.22)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                    backgroundColor: 'rgba(245,158,11,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L15 14H1L8 1Z" stroke="#D97706" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M8 6V9" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round"/>
                      <circle cx="8" cy="11.5" r="0.75" fill="#D97706"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
                      Below market value
                    </p>
                    <p style={{ fontSize: '11px', color: '#B45309', lineHeight: 1.5 }}>
                      Your counter is less than 50% of the original offer. Very low counters are less likely to be accepted.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Message textarea ── */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Message
            </p>
            <textarea
              placeholder="Explain your counter offer..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              style={{
                width: '100%', borderRadius: 16,
                border: '1.5px solid #E5E7EB',
                backgroundColor: '#FAFAFA',
                padding: '14px 16px',
                fontSize: '14px', color: '#1F2937',
                lineHeight: 1.6, resize: 'none', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ── Bottom actions ── */}
        <div style={{
          padding: '16px 20px 28px',
          borderTop: '1px solid #F0F0F0',
          display: 'flex', flexDirection: 'column', gap: 8,
          flexShrink: 0,
        }}>
          {/* Submit CTA */}
          <motion.button
            type="button"
            onClick={() => canSubmit && onSubmit(numericAmount, message)}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            style={{
              width: '100%', height: 56, borderRadius: 24,
              background: canSubmit ? 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)' : '#E5E7EB',
              border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canSubmit ? '0 8px 20px rgba(124,58,237,0.35)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {canSubmit && (
              <motion.div
                animate={{ x: ['-130%', '230%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: '35%',
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',
                  transform: 'skewX(-15deg)', pointerEvents: 'none',
                }}
              />
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 2L7 14L5 8L2 7L14 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Send Counter Offer</span>
          </motion.button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="transition-all active:scale-97"
            style={{
              width: '100%', height: 44, borderRadius: 16,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>Cancel</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
