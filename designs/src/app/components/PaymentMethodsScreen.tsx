'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
interface SavedCard {
  id: string;
  last4: string;
  brand: 'visa' | 'mastercard';
  expiry: string;
  isDefault: boolean;
}

export interface PaymentMethodsScreenProps {
  onBack: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
const SAVED_CARDS: SavedCard[] = [
  { id: 'card_1', last4: '4242', brand: 'visa',       expiry: '08/27', isDefault: true  },
  { id: 'card_2', last4: '5555', brand: 'mastercard', expiry: '03/28', isDefault: false },
];

/* ─── Card brand SVG icons ───────────────────────────────────── */
function CardBrandIcon({ brand, size = 38 }: { brand: SavedCard['brand']; size?: number }) {
  const h = Math.round(size * 0.625);
  if (brand === 'visa') return (
    <div style={{ width: size, height: h, borderRadius: 6, backgroundColor: '#1A1F71', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.72} height={h * 0.52} viewBox="0 0 38 12" fill="none">
        <path d="M14.5 11.5H11.5L13.5 0.5H16.5L14.5 11.5Z" fill="white"/>
        <path d="M24.5 0.8C23.8 0.5 22.7 0.2 21.3 0.2C18.3 0.2 16.2 1.8 16.2 4C16.2 5.7 17.7 6.6 18.9 7.1C20.1 7.6 20.5 7.9 20.5 8.4C20.5 9.1 19.6 9.4 18.8 9.4C17.7 9.4 17.1 9.2 16.2 8.8L15.8 8.6L15.4 11.2C16.2 11.6 17.7 11.9 19.2 11.9C22.4 11.9 24.5 10.3 24.5 7.9C24.5 6.6 23.7 5.6 21.9 4.8C20.8 4.3 20.2 3.9 20.2 3.4C20.2 2.9 20.8 2.4 22 2.4C23 2.4 23.7 2.6 24.3 2.9L24.6 3.1L25 0.8H24.5Z" fill="white"/>
        <path d="M29 7.5C29.3 6.8 30.5 3.7 30.5 3.7C30.5 3.7 30.8 2.9 31 2.4L31.2 3.6C31.2 3.6 31.9 7 32.1 7.5H29ZM35 0.5H32.7C32 0.5 31.5 0.7 31.2 1.4L26.8 11.5H30L30.6 9.8H34.5L34.9 11.5H37.9L35 0.5Z" fill="white"/>
        <path d="M10.4 0.5L7.5 7.9L7.2 6.4C6.6 4.6 5 2.6 3.2 1.6L5.9 11.5H9.2L13.7 0.5H10.4Z" fill="white"/>
        <path d="M4.8 0.5H0L0 0.7C3.7 1.7 6.2 3.8 7.2 6.4L6.2 1.5C6 0.8 5.5 0.5 4.8 0.5Z" fill="#F9A51A"/>
      </svg>
    </div>
  );
  return (
    <div style={{ width: size, height: h, borderRadius: 6, backgroundColor: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.8} height={h * 0.72} viewBox="0 0 32 20" fill="none">
        <circle cx="11" cy="10" r="9" fill="#EB001B"/>
        <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
        <path d="M16 3.8C17.8 5.1 19 7.4 19 10C19 12.6 17.8 14.9 16 16.2C14.2 14.9 13 12.6 13 10C13 7.4 14.2 5.1 16 3.8Z" fill="#FF5F00"/>
      </svg>
    </div>
  );
}

/* ─── Apple Pay icon ─────────────────────────────────────────── */
function ApplePayIcon() {
  return (
    <svg width="42" height="18" viewBox="0 0 50 22" fill="none">
      <path d="M9.5 4C8.9 4.7 7.9 5.2 7 5.1C6.9 4.2 7.3 3.3 7.9 2.6C8.5 1.9 9.5 1.4 10.3 1.4C10.4 2.3 10 3.2 9.5 4Z" fill="currentColor"/>
      <path d="M10.3 5.2C9 5.1 7.9 5.9 7.2 5.9C6.5 5.9 5.5 5.2 4.5 5.2C3.1 5.2 1.8 6 1.1 7.3C-0.4 9.9 0.7 13.8 2.2 15.9C2.9 16.9 3.8 18 5 18C6.1 18 6.5 17.3 7.8 17.3C9.1 17.3 9.4 18 10.6 18C11.8 18 12.6 17 13.3 16C14.1 14.9 14.4 13.9 14.4 13.8C14.4 13.8 12.2 12.9 12.2 10.4C12.2 8.2 14 7.2 14.1 7.1C13 5.5 11.3 5.2 10.3 5.2Z" fill="currentColor"/>
      <path d="M22.4 2.5H19L18.9 18H21.1L21.2 13H23.9C26.6 13 28.4 11.3 28.4 8.7C28.4 6.1 26.7 2.5 22.4 2.5ZM21.2 11.1V4.4H23.4C25.3 4.4 26.2 5.5 26.2 7.8C26.2 10.1 25.3 11.1 23.4 11.1H21.2Z" fill="currentColor"/>
      <path d="M33.5 18.1C35 18.1 36.4 17.3 37 16.2V18H39V10.4C39 8.2 37.3 6.8 34.7 6.8C32.3 6.8 30.5 8.3 30.4 10.2H32.3C32.5 9.2 33.5 8.6 34.7 8.6C36.1 8.6 36.9 9.3 36.9 10.6V11.5L34.2 11.7C31.7 11.9 30.3 12.9 30.3 14.9C30.3 16.9 31.8 18.1 33.5 18.1ZM34 16.3C32.9 16.3 32.2 15.7 32.2 14.8C32.2 13.9 32.9 13.3 34.3 13.2L36.9 13V13.9C36.9 15.3 35.6 16.3 34 16.3Z" fill="currentColor"/>
      <path d="M41.8 22C43.7 22 44.7 21.2 45.6 18.7L50 7H47.8L44.8 15.9L41.7 7H39.4L43.6 18.1L43.4 18.8C43 19.9 42.4 20.4 41.5 20.4C41.2 20.4 41 20.4 40.8 20.3V22C41 22 41.5 22 41.8 22Z" fill="currentColor"/>
    </svg>
  );
}

/* ─── Google Pay icon ────────────────────────────────────────── */
function GooglePayIcon() {
  return (
    <svg width="44" height="18" viewBox="0 0 56 22" fill="none">
      <path d="M26.2 11V7.5H34.6C34.7 8 34.8 8.5 34.8 9.2C34.8 11.4 34.1 13.1 32.9 14.3C31.8 15.4 30.2 16 28.1 16C24 16 20.5 12.6 20.5 8.5C20.5 4.4 24 1 28.1 1C30.2 1 31.8 1.8 32.9 2.9L30.5 5.3C29.8 4.6 28.9 4.2 28.1 4.2C25.8 4.2 24 6.1 24 8.5C24 10.9 25.8 12.8 28.1 12.8C29.7 12.8 30.6 12.2 31.2 11.6C31.6 11.2 31.9 10.6 32 10H28.1V11H26.2Z" fill="#4285F4"/>
      <path d="M46.5 8.3H44.7V6.5H43V8.3H41.2V10H43V11.8H44.7V10H46.5V8.3Z" fill="#34A853"/>
      <path d="M37.3 6.5C35.4 6.5 33.8 8 33.8 10.2C33.8 12.4 35.4 13.9 37.3 13.9C38.2 13.9 38.9 13.6 39.4 13.1V13.8H41.1V6.7H39.4V7.4C38.9 6.8 38.2 6.5 37.3 6.5ZM37.5 12.3C36.4 12.3 35.6 11.4 35.6 10.2C35.6 9 36.4 8.1 37.5 8.1C38.6 8.1 39.4 9 39.4 10.2C39.4 11.4 38.6 12.3 37.5 12.3Z" fill="#FBBC04"/>
      <path d="M8 4V8.5H13.4C13.1 9.8 12.4 10.9 11.3 11.6L14.7 14.3C16.7 12.5 17.8 10 17.8 7C17.8 6.3 17.7 5.7 17.6 5.1L8 4Z" fill="#4285F4"/>
      <path d="M8 16C10.4 16 12.5 15.2 14 13.8L10.6 11.1C9.8 11.6 8.9 12 8 12C5.7 12 3.7 10.5 3 8.4L-0.5 11.2C1.1 14.5 4.3 16 8 16Z" fill="#34A853"/>
      <path d="M3 8.4C2.8 7.8 2.7 7.2 2.7 6.5C2.7 5.8 2.8 5.2 3 4.6L-0.5 1.8C-1.2 3.2 -1.5 4.8 -1.5 6.5C-1.5 8.2 -1.2 9.8 -0.5 11.2L3 8.4Z" fill="#FBBC04"/>
      <path d="M8 1C9.6 1 11 1.6 12.1 2.7L14.9 -0.1C13.1 -1.7 10.7 -2.5 8 -2.5C4.3 -2.5 1.1 -0.5 -0.5 1.8L3 4.6C3.7 2.5 5.7 1 8 1Z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onToggle(); }}
      style={{
        width: 46, height: 28, borderRadius: 14, padding: 2,
        backgroundColor: active ? '#7C3AED' : '#E5E7EB',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        transition: 'background-color 0.2s',
        position: 'relative',
      }}
    >
      <motion.div
        animate={{ x: active ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 24, height: 24, borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

/* ─── Main component ────────────────────────────────────────── */
export function PaymentMethodsScreen({ onBack }: PaymentMethodsScreenProps) {
  const [selectedCard, setSelectedCard] = useState(SAVED_CARDS[0].id);
  const [showAddCard, setShowAddCard] = useState(false);
  const [applePay, setApplePay] = useState(true);
  const [googlePay, setGooglePay] = useState(false);

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">

      {/* ── Status Bar ── */}
      <div className="h-11 flex items-center justify-between px-6 pt-3 flex-shrink-0">
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div className="flex gap-1.5 items-center">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M0 4.8C2.67 2.06 6.15.5 8 .5s5.33 1.56 8 4.3L14.4 6.5C12.27 4.22 10.22 3 8 3S3.73 4.22 1.6 6.5L0 4.8Z" fill="#1F2937"/><path d="M8 6.5c1.1 0 2.27.5 3.2 1.35L9.6 9.5A2.5 2.5 0 0 0 8 9a2.5 2.5 0 0 0-1.6.5L4.8 7.85C5.73 7 6.9 6.5 8 6.5Z" fill="#1F2937"/><circle cx="8" cy="11.5" r="1" fill="#1F2937"/></svg>
          <svg width="15" height="11" viewBox="0 0 16 12" fill="none"><rect x="1" y="1" width="12" height="10" rx="2" stroke="#1F2937" strokeWidth="1.4"/><rect x="14" y="4" width="1.5" height="4" rx="0.75" fill="#1F2937"/><rect x="2.5" y="2.5" width="9" height="7" rx="1.2" fill="#1F2937"/></svg>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-2 flex-shrink-0">
        <button type="button" onClick={onBack} className="flex items-center justify-center transition-all active:scale-90" style={{ width: 38, height: 38, borderRadius: 12, border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Payment Methods
        </h1>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* ── Saved Cards ── */}
        <div className="px-5 mt-4">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Saved Cards
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SAVED_CARDS.map(card => {
              const active = selectedCard === card.id;
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCard(card.id)}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 16,
                    border: active ? '2px solid #7C3AED' : '1.5px solid #E5E7EB',
                    backgroundColor: active ? 'rgba(124,58,237,0.04)' : 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.16s, background-color 0.16s',
                  }}
                >
                  {/* Radio */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: active ? '2px solid #7C3AED' : '2px solid #D1D5DB',
                    backgroundColor: active ? '#7C3AED' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {active && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />}
                  </div>

                  {/* Card brand icon */}
                  <CardBrandIcon brand={card.brand} />

                  {/* Card details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', textTransform: 'capitalize' }}>
                        {card.brand}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        .... {card.last4}
                      </span>
                      {card.isDefault && (
                        <div style={{
                          padding: '2px 7px', borderRadius: 6,
                          backgroundColor: 'rgba(124,58,237,0.08)',
                          border: '1px solid rgba(124,58,237,0.18)',
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#7C3AED' }}>Default</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Expires {card.expiry}</span>
                  </div>

                  {/* Active check */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5L4.2 7.8L9 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Add New Card ── */}
        <div className="px-5 mt-4">
          <motion.button
            type="button"
            onClick={() => setShowAddCard(!showAddCard)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 16,
              border: '2px dashed rgba(124,58,237,0.35)',
              backgroundColor: 'rgba(124,58,237,0.02)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 8,
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Add New Card</span>
          </motion.button>

          <AnimatePresence>
            {showAddCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  marginTop: 10, padding: '16px', borderRadius: 16,
                  border: '1.5px solid #F0F0F0',
                  backgroundColor: '#FAFAFA',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Card Number</label>
                    <input type="text" placeholder="0000 0000 0000 0000" style={{
                      width: '100%', height: 44, borderRadius: 12,
                      border: '1.5px solid #E5E7EB', backgroundColor: 'white',
                      padding: '0 14px', fontSize: '14px', color: '#1F2937', outline: 'none',
                      fontFamily: 'inherit',
                    }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Expiry</label>
                      <input type="text" placeholder="MM/YY" style={{
                        width: '100%', height: 44, borderRadius: 12,
                        border: '1.5px solid #E5E7EB', backgroundColor: 'white',
                        padding: '0 14px', fontSize: '14px', color: '#1F2937', outline: 'none',
                        fontFamily: 'inherit',
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>CVV</label>
                      <input type="text" placeholder="123" style={{
                        width: '100%', height: 44, borderRadius: 12,
                        border: '1.5px solid #E5E7EB', backgroundColor: 'white',
                        padding: '0 14px', fontSize: '14px', color: '#1F2937', outline: 'none',
                        fontFamily: 'inherit',
                      }} />
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', height: 44, borderRadius: 14,
                      background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Save Card</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Digital Wallets ── */}
        <div className="px-5 mt-6">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Digital Wallets
          </p>
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            border: '1.5px solid #F0F0F0',
            backgroundColor: 'white',
          }}>
            {/* Apple Pay */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              borderBottom: '1px solid #F0F0F0',
            }}>
              <div style={{
                width: 44, height: 28, borderRadius: 8,
                backgroundColor: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
              }}>
                <ApplePayIcon />
              </div>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Apple Pay</span>
              <Toggle active={applePay} onToggle={() => setApplePay(!applePay)} />
            </div>
            {/* Google Pay */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
            }}>
              <div style={{
                width: 44, height: 28, borderRadius: 8,
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GooglePayIcon />
              </div>
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Google Pay</span>
              <Toggle active={googlePay} onToggle={() => setGooglePay(!googlePay)} />
            </div>
          </div>
        </div>

        {/* ── Security notice ── */}
        <div className="px-5 mt-8">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px',
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="7" rx="2" stroke="#9CA3AF" strokeWidth="1.3"/>
              <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2C8.38 2 9.5 3.12 9.5 4.5V6" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="9.5" r="1" fill="#9CA3AF"/>
            </svg>
            <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>
              256-bit SSL · PCI DSS compliant · Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
