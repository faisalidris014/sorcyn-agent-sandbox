import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Offer } from './OffersListScreen';

/* ─── Types ──────────────────────────────────────────────────── */
interface SavedCard {
  id: string;
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  expiry: string;
  isDefault: boolean;
}

type PaymentMethod = string; // card id | 'apple_pay' | 'google_pay' | 'new'

export interface AcceptOfferModalProps {
  offer: Offer;
  postTitle: string;
  onConfirm: (offer: Offer, paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}

/* ─── Fee config ─────────────────────────────────────────────── */
const BUYER_FEE_PCT  = 0.05;
const STRIPE_FEE_PCT = 0.029;
const STRIPE_FEE_FLAT = 0.30;

/* ─── Demo saved cards ───────────────────────────────────────── */
const SAVED_CARDS: SavedCard[] = [
  { id: 'card_1', last4: '4242', brand: 'visa',       expiry: '08/26', isDefault: true  },
  { id: 'card_2', last4: '5555', brand: 'mastercard', expiry: '03/27', isDefault: false },
];

/* ─── Card brand SVG icons ───────────────────────────────────── */
function CardBrandIcon({ brand, size = 32 }: { brand: SavedCard['brand']; size?: number }) {
  const h = Math.round(size * 0.625);
  if (brand === 'visa') return (
    <div style={{ width: size, height: h, borderRadius: 4, backgroundColor: '#1A1F71', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.72} height={h * 0.52} viewBox="0 0 38 12" fill="none">
        <path d="M14.5 11.5H11.5L13.5 0.5H16.5L14.5 11.5Z" fill="white"/>
        <path d="M24.5 0.8C23.8 0.5 22.7 0.2 21.3 0.2C18.3 0.2 16.2 1.8 16.2 4C16.2 5.7 17.7 6.6 18.9 7.1C20.1 7.6 20.5 7.9 20.5 8.4C20.5 9.1 19.6 9.4 18.8 9.4C17.7 9.4 17.1 9.2 16.2 8.8L15.8 8.6L15.4 11.2C16.2 11.6 17.7 11.9 19.2 11.9C22.4 11.9 24.5 10.3 24.5 7.9C24.5 6.6 23.7 5.6 21.9 4.8C20.8 4.3 20.2 3.9 20.2 3.4C20.2 2.9 20.8 2.4 22 2.4C23 2.4 23.7 2.6 24.3 2.9L24.6 3.1L25 0.8H24.5Z" fill="white"/>
        <path d="M29 7.5C29.3 6.8 30.5 3.7 30.5 3.7C30.5 3.7 30.8 2.9 31 2.4L31.2 3.6C31.2 3.6 31.9 7 32.1 7.5H29ZM35 0.5H32.7C32 0.5 31.5 0.7 31.2 1.4L26.8 11.5H30L30.6 9.8H34.5L34.9 11.5H37.9L35 0.5Z" fill="white"/>
        <path d="M10.4 0.5L7.5 7.9L7.2 6.4C6.6 4.6 5 2.6 3.2 1.6L5.9 11.5H9.2L13.7 0.5H10.4Z" fill="white"/>
        <path d="M4.8 0.5H0L0 0.7C3.7 1.7 6.2 3.8 7.2 6.4L6.2 1.5C6 0.8 5.5 0.5 4.8 0.5Z" fill="#F9A51A"/>
      </svg>
    </div>
  );
  if (brand === 'mastercard') return (
    <div style={{ width: size, height: h, borderRadius: 4, backgroundColor: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: -4 }}>
      <svg width={size * 0.8} height={h * 0.72} viewBox="0 0 32 20" fill="none">
        <circle cx="11" cy="10" r="9" fill="#EB001B"/>
        <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
        <path d="M16 3.8C17.8 5.1 19 7.4 19 10C19 12.6 17.8 14.9 16 16.2C14.2 14.9 13 12.6 13 10C13 7.4 14.2 5.1 16 3.8Z" fill="#FF5F00"/>
      </svg>
    </div>
  );
  if (brand === 'amex') return (
    <div style={{ width: size, height: h, borderRadius: 4, backgroundColor: '#007BC1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: h * 0.45, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>AMEX</span>
    </div>
  );
  return (
    <div style={{ width: size, height: h, borderRadius: 4, backgroundColor: '#F7A600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: h * 0.42, fontWeight: 900, color: 'white' }}>DISC</span>
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

/* ─── Lock / Security icon ───────────────────────────────────── */
function LockIcon({ color = '#9CA3AF' }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="6" width="10" height="7" rx="2" stroke={color} strokeWidth="1.3"/>
      <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2C8.38 2 9.5 3.12 9.5 4.5V6" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="9.5" r="1" fill={color}/>
    </svg>
  );
}

/* ─── Confirm success animation ──────────────────────────────── */
function PaymentSuccessOverlay({ sellerName, total, onDone }: { sellerName: string; total: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
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
        gap: 0,
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
            border: '2px solid rgba(124,58,237,0.3)',
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
          background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 36px rgba(124,58,237,0.42)',
          marginBottom: 24,
          position: 'relative',
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
        Offer Accepted!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 24, maxWidth: 260 }}
      >
        You've accepted <span style={{ fontWeight: 700, color: '#1F2937' }}>{sellerName}'s</span> offer. They've been notified and will be in touch soon.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.72 }}
        style={{
          width: '100%', padding: '14px 18px', borderRadius: 16,
          background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.04))',
          border: '1.5px solid rgba(16,185,129,0.22)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(16,185,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#059669" strokeWidth="1.3"/>
              <path d="M7 4.5V5M7 9V9.5M4.5 8C4.5 8.83 5.67 9.5 7 9.5S9.5 8.83 9.5 8 8.33 6.5 7 6.5 4.5 5.83 4.5 5 5.67 4.5 7 4.5s2.5.67 2.5 1.5"
                stroke="#059669" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Total charged</span>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
          ${total.toFixed(2)}
        </span>
      </motion.div>

      {/* Auto-dismiss bar */}
      <motion.div
        style={{ position: 'absolute', bottom: 0, left: 0, height: 3, borderRadius: '0 0 inherit inherit', background: 'linear-gradient(90deg,#7C3AED,#A855F7)' }}
        initial={{ width: '100%' }}
        animate={{ width: 0 }}
        transition={{ duration: 3.2, ease: 'linear' }}
      />
    </motion.div>
  );
}

/* ─── Main modal ─────────────────────────────────────────────── */
export function AcceptOfferModal({ offer, postTitle, onConfirm, onCancel }: AcceptOfferModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(SAVED_CARDS[0].id);
  const [showAddCard, setShowAddCard]       = useState(false);
  const [confirming, setConfirming]         = useState(false);
  const [success, setSuccess]               = useState(false);

  const buyerFee   = offer.quoteAmount * BUYER_FEE_PCT;
  const subtotal   = offer.quoteAmount + buyerFee;
  const stripeFee  = subtotal * STRIPE_FEE_PCT + STRIPE_FEE_FLAT;
  const total      = subtotal + stripeFee;

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1000));
    setSuccess(true);
  };

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
        {/* Success state */}
        <AnimatePresence>
          {success && (
            <PaymentSuccessOverlay
              sellerName={offer.seller.name}
              total={total}
              onDone={() => { onConfirm(offer, selectedMethod); }}
            />
          )}
        </AnimatePresence>

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
                Accept Offer
              </h2>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 3 }}>Review and confirm payment</p>
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

          {/* ── Offer summary card ── */}
          <div style={{
            borderRadius: 20, padding: '16px',
            background: 'linear-gradient(135deg,rgba(124,58,237,0.05) 0%,rgba(168,85,247,0.04) 100%)',
            border: '1.5px solid rgba(124,58,237,0.15)',
            marginBottom: 18,
          }}>
            {/* Post title */}
            <p style={{
              fontSize: '11px', fontWeight: 700, color: '#A855F7',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Post
            </p>
            <p style={{
              fontSize: '13px', fontWeight: 700, color: '#1F2937', lineHeight: 1.4,
              marginBottom: 14,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {postTitle}
            </p>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: 'rgba(124,58,237,0.1)', marginBottom: 14 }} />

            {/* Seller row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {offer.seller.avatar ? (
                <img
                  src={offer.seller.avatar}
                  alt={offer.seller.name}
                  style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(124,58,237,0.15)', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: offer.seller.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.5)',
                }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>{offer.seller.initials}</span>
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>{offer.seller.name}</span>
                  {offer.seller.isVerified && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                        <path d="M2 4.5L3.8 6.5L7 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1L7.2 4.4H10.5L7.8 6.4L8.9 9.9L6 7.8L3.1 9.9L4.2 6.4L1.5 4.4H4.8L6 1Z"
                        fill={offer.seller.rating >= s ? '#F59E0B' : '#E5E7EB'}/>
                    </svg>
                  ))}
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{offer.seller.rating.toFixed(1)}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>· {offer.timeline}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: 2 }}>Quoted</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  ${offer.quoteAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ── Cost breakdown ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Cost Breakdown
            </p>

            <div style={{
              borderRadius: 18, border: '1.5px solid #F0F0F0', overflow: 'hidden',
              backgroundColor: '#FAFAFA',
            }}>
              {/* Offer price row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>Offer price</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                  ${offer.quoteAmount.toLocaleString()}
                </span>
              </div>

              {/* Buyer service fee row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#A855F7' }} />
                  <div>
                    <span style={{ fontSize: '13px', color: '#4B5563' }}>Buyer service fee </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#A855F7' }}>(5%)</span>
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                  +${buyerFee.toFixed(2)}
                </span>
              </div>

              {/* Stripe processing row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#635BFF' }} />
                  <div>
                    <span style={{ fontSize: '13px', color: '#4B5563' }}>Payment processing </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#635BFF' }}>(2.9% + $0.30)</span>
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                  +${stripeFee.toFixed(2)}
                </span>
              </div>

              {/* Total row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 16px',
                background: 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(168,85,247,0.04))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.2"/>
                      <path d="M6 3.5V4M6 8V8.5M4 7C4 7.55 4.9 8 6 8S8 7.55 8 7 7.1 6 6 6 4 5.55 4 5 4.9 4 6 4s2 .45 2 1" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Total charge</span>
                </div>
                <motion.span
                  key={total.toFixed(2)}
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  style={{ fontSize: '22px', fontWeight: 900, color: '#1F2937', letterSpacing: '-0.03em' }}
                >
                  ${total.toFixed(2)}
                </motion.span>
              </div>
            </div>

            {/* Escrow notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <LockIcon color="#10B981" />
              <p style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                Funds held in escrow — released when work is complete
              </p>
            </div>
          </div>

          {/* ── Payment method selector ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Pay with
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* ── Saved cards ── */}
              {SAVED_CARDS.map(card => {
                const active = selectedMethod === card.id;
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedMethod(card.id)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 16,
                      border: active ? '2px solid #7C3AED' : '1.5px solid #E5E7EB',
                      backgroundColor: active ? 'rgba(124,58,237,0.04)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
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
                    <CardBrandIcon brand={card.brand} size={38} />

                    {/* Card details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', textTransform: 'capitalize' }}>
                          {card.brand}
                        </span>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>
                          ···· {card.last4}
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

              {/* ── Apple Pay ── */}
              {['apple_pay', 'google_pay'].map(method => {
                const active = selectedMethod === method;
                const isApple = method === 'apple_pay';
                return (
                  <motion.button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
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
                    }}>
                      {active && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />}
                    </div>

                    {/* Logo container */}
                    <div style={{
                      width: 52, height: 32, borderRadius: 8,
                      backgroundColor: isApple ? '#000' : '#fff',
                      border: isApple ? 'none' : '1px solid #E5E7EB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ color: isApple ? 'white' : 'inherit', display: 'flex', alignItems: 'center' }}>
                        {isApple ? <ApplePayIcon /> : <GooglePayIcon />}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                        {isApple ? 'Apple Pay' : 'Google Pay'}
                      </span>
                      <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 1 }}>
                        {isApple ? 'Touch ID or Face ID' : 'Biometric or PIN'}
                      </p>
                    </div>

                    <AnimatePresence>
                      {active && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
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

              {/* ── Add New Card ── */}
              <AnimatePresence>
                {!showAddCard ? (
                  <motion.button
                    type="button"
                    onClick={() => setShowAddCard(true)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 16,
                      border: '1.5px dashed #D8B4FE',
                      backgroundColor: 'rgba(124,58,237,0.02)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 38, height: 24, borderRadius: 7,
                      background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.1))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 3V11M3 7H11" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Add New Card</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="add-card-form"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: 16, borderRadius: 16,
                      border: '1.5px solid #EDE9FE',
                      backgroundColor: '#FAFAFF',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>New Card</p>
                        <button type="button" onClick={() => setShowAddCard(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '13px', fontWeight: 600 }}>
                          Cancel
                        </button>
                      </div>
                      {/* Card number */}
                      <div style={{ position: 'relative', marginBottom: 10 }}>
                        <input type="text" placeholder="Card number" maxLength={19}
                          style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '11px 42px 11px 14px', borderRadius: 12,
                            border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1F2937',
                            outline: 'none', fontFamily: 'Inter, sans-serif', backgroundColor: 'white',
                          }} />
                        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                          <svg width="20" height="14" viewBox="0 0 22 16" fill="none">
                            <rect x="1" y="1" width="20" height="14" rx="3" stroke="#D1D5DB" strokeWidth="1.2"/>
                            <rect x="1" y="4.5" width="20" height="3" fill="#D1D5DB"/>
                            <rect x="13" y="9" width="6" height="2.5" rx="1" fill="#D1D5DB"/>
                          </svg>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="MM / YY" maxLength={7}
                          style={{
                            flex: 1, padding: '11px 14px', borderRadius: 12,
                            border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1F2937',
                            outline: 'none', fontFamily: 'Inter, sans-serif', backgroundColor: 'white',
                          }} />
                        <input type="text" placeholder="CVV" maxLength={4}
                          style={{
                            flex: 1, padding: '11px 14px', borderRadius: 12,
                            border: '1.5px solid #E5E7EB', fontSize: '14px', color: '#1F2937',
                            outline: 'none', fontFamily: 'Inter, sans-serif', backgroundColor: 'white',
                          }} />
                      </div>
                      <button
                        type="button"
                        style={{
                          width: '100%', marginTop: 12, height: 42, borderRadius: 12,
                          background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                          border: 'none', cursor: 'pointer',
                          fontSize: '13px', fontWeight: 700, color: 'white',
                        }}
                        onClick={() => { setShowAddCard(false); setSelectedMethod('new_card'); }}
                      >
                        Save & Use This Card
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Security badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' }}>
              <LockIcon color="#9CA3AF" />
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>256-bit SSL encryption</span>
              <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>PCI DSS compliant</span>
              <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#635BFF' }}>Stripe</span>
            </div>
          </div>

          {/* bottom spacing */}
          <div style={{ height: 8 }} />
        </div>

        {/* ── Sticky action buttons ── */}
        <div style={{
          flexShrink: 0,
          padding: '14px 20px 32px',
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {/* Confirm & Pay */}
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            whileTap={{ scale: confirming ? 1 : 0.97 }}
            style={{
              height: 54, borderRadius: 20,
              background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
              border: 'none', cursor: confirming ? 'default' : 'pointer',
              boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: confirming ? 0.85 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Shimmer */}
            {!confirming && (
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
            {confirming ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }}
              />
            ) : (
              <>
                <LockIcon color="white" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                  Confirm & Pay ${total.toFixed(2)}
                </span>
              </>
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
