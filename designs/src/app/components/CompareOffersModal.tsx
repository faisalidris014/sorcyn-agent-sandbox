import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Offer } from './OffersListScreen';

/* ─── Props ──────────────────────────────────────────────────── */
export interface CompareOffersModalProps {
  offers: Offer[];            // 2–3 offers to compare
  budgetMax: number;
  postTitle: string;
  onClose: () => void;
  onAccept: (offer: Offer) => void;
}

/* ─── Row ids (what we compare) ─────────────────────────────── */
type RowId =
  | 'price'
  | 'timeline'
  | 'rating'
  | 'reviews'
  | 'jobs'
  | 'response'
  | 'distance'
  | 'member'
  | 'badges'
  | 'message';

interface Row {
  id: RowId;
  label: string;
  icon: React.ReactNode;
}

const ROWS: Row[] = [
  {
    id: 'price', label: 'Quote Price',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4V4.5M7 9.5V10M5 8C5 8.83 5.9 9.5 7 9.5S9 8.83 9 8 8.1 6.5 7 6.5 5 5.83 5 5 5.9 4.5 7 4.5s2 .67 2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    id: 'timeline', label: 'Timeline',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5V7L8.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    id: 'rating', label: 'Rating',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L8.4 5.3H12.5L9.2 7.6L10.5 11.5L7 9.2L3.5 11.5L4.8 7.6L1.5 5.3H5.6L7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'reviews', label: 'Reviews',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 9C12 9.55 11.55 10 11 10H4L2.5 11.5V3.5C2.5 2.95 2.95 2.5 3.5 2.5H11C11.55 2.5 12 2.95 12 3.5V9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'jobs', label: 'Jobs Done',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="4.5" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.5 4.5V3.5C4.5 2.95 4.95 2.5 5.5 2.5H8.5C9.05 2.5 9.5 2.95 9.5 3.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M4.5 7.5L6 9L9.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'response', label: 'Response Time',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7C2 4.24 4.24 2 7 2C9.76 2 12 4.24 12 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M7 2V4M11 4L9.5 5.5M2 9L3.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M2 12L5 9L7 11L10 7L12 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'distance', label: 'Location',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1C5.07 1 3.5 2.57 3.5 4.5C3.5 7.25 7 12 7 12S10.5 7.25 10.5 4.5C10.5 2.57 8.93 1 7 1Z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/></svg>,
  },
  {
    id: 'member', label: 'Member Since',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2.5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M2 5.5H12" stroke="currentColor" strokeWidth="1.1"/><path d="M5 1.5V3.5M9 1.5V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    id: 'badges', label: 'Badges',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.5 3H11V5.5L12.5 7L11 8.5V11H8.5L7 12.5L5.5 11H3V8.5L1.5 7L3 5.5V3H5.5L7 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'message', label: 'Message',
    icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 9C12 9.55 11.55 10 11 10H4L2.5 11.5V3.5C2.5 2.95 2.95 2.5 3.5 2.5H11C11.55 2.5 12 2.95 12 3.5V9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 6H9M5 7.5H7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  },
];

/* ─── Small helpers ──────────────────────────────────────────── */
function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L7.2 4.4H10.5L7.8 6.4L8.9 9.9L6 7.8L3.1 9.9L4.2 6.4L1.5 4.4H4.8L6 1Z"
            fill={rating >= s ? '#F59E0B' : '#E5E7EB'}
          />
        </svg>
      ))}
    </div>
  );
}

/* ─── Best-value highlight logic ─────────────────────────────── */
function getBestCol(offers: Offer[], row: RowId): number | null {
  if (offers.length < 2) return null;
  switch (row) {
    case 'price':    { const mn = Math.min(...offers.map(o => o.quoteAmount)); return offers.findIndex(o => o.quoteAmount === mn); }
    case 'timeline': { const mn = Math.min(...offers.map(o => parseInt(o.timeline))); return offers.findIndex(o => parseInt(o.timeline) === mn); }
    case 'rating':   { const mx = Math.max(...offers.map(o => o.seller.rating)); return offers.findIndex(o => o.seller.rating === mx); }
    case 'reviews':  { const mx = Math.max(...offers.map(o => o.seller.reviewCount)); return offers.findIndex(o => o.seller.reviewCount === mx); }
    case 'jobs':     { const mx = Math.max(...offers.map(o => o.seller.completedJobs)); return offers.findIndex(o => o.seller.completedJobs === mx); }
    default: return null;
  }
}

/* ─── Cell value renderer ────────────────────────────────────── */
function CellValue({ offer, row, isBest, budgetMax }: { offer: Offer; row: RowId; isBest: boolean; budgetMax: number }) {
  const accent = isBest ? '#7C3AED' : '#1F2937';

  switch (row) {
    case 'price': {
      const pct = Math.round((offer.quoteAmount / budgetMax) * 100);
      const barColor = offer.quoteAmount > budgetMax ? '#EF4444' : offer.quoteAmount > budgetMax * 0.85 ? '#F59E0B' : '#10B981';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#7C3AED', letterSpacing: '-0.03em', lineHeight: 1 }}>
            ${offer.quoteAmount.toLocaleString()}
          </span>
          <div style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
              style={{ height: '100%', borderRadius: 2, backgroundColor: barColor }}
            />
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: offer.quoteAmount <= budgetMax ? '#059669' : '#EF4444' }}>
            {offer.quoteAmount <= budgetMax ? `${pct}% of budget` : 'Over budget'}
          </span>
        </div>
      );
    }
    case 'timeline':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>
            {offer.timeline}
          </span>
          {isBest && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.3 }}
              style={{
                padding: '2px 7px', borderRadius: 6,
                backgroundColor: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#7C3AED' }}>FASTEST</span>
            </motion.div>
          )}
        </div>
      );
    case 'rating':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>
            {offer.seller.rating.toFixed(1)}
          </span>
          <Stars rating={offer.seller.rating} size={11} />
        </div>
      );
    case 'reviews':
      return (
        <span style={{ fontSize: '16px', fontWeight: 800, color: accent }}>
          {offer.seller.reviewCount}
        </span>
      );
    case 'jobs':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: accent }}>{offer.seller.completedJobs}</span>
          <span style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 600 }}>completed</span>
        </div>
      );
    case 'response':
      return (
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', textAlign: 'center' }}>
          {offer.seller.responseTime}
        </span>
      );
    case 'distance':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>{offer.seller.distance}</span>
          {offer.seller.distance === 'Remote' && (
            <span style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: 600 }}>anywhere</span>
          )}
        </div>
      );
    case 'member':
      return (
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280', textAlign: 'center' }}>
          {offer.seller.memberSince}
        </span>
      );
    case 'badges':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {offer.seller.isVerified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.2 7.5L8 3" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669' }}>Verified</span>
            </div>
          )}
          {offer.seller.isTopSeller && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 1L6.1 4H9.5L6.8 5.8L7.8 9L5 7.3L2.2 9L3.2 5.8L0.5 4H3.9L5 1Z" fill="#D97706"/></svg>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#D97706' }}>Top Seller</span>
            </div>
          )}
          {offer.seller.isPro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED' }}>PRO</span>
            </div>
          )}
          {!offer.seller.isVerified && !offer.seller.isTopSeller && !offer.seller.isPro && (
            <span style={{ fontSize: '11px', color: '#D1D5DB' }}>—</span>
          )}
        </div>
      );
    case 'message':
      return (
        <p style={{
          fontSize: '10px', color: '#6B7280', lineHeight: 1.55,
          textAlign: 'center',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          "{offer.messagePreview}"
        </p>
      );
    default:
      return <span>—</span>;
  }
}

/* ─── Winner banner ──────────────────────────────────────────── */
function WinnerBanner({ offers, budgetMax }: { offers: Offer[]; budgetMax: number }) {
  // Score: 3pts for lowest price, 3pts for highest rating, 2pts for fastest, 2pts for most jobs
  const scores = offers.map(o => {
    let s = 0;
    const minPrice = Math.min(...offers.map(x => x.quoteAmount));
    const maxRating = Math.max(...offers.map(x => x.seller.rating));
    const minTimeline = Math.min(...offers.map(x => parseInt(x.timeline)));
    const maxJobs = Math.max(...offers.map(x => x.seller.completedJobs));
    if (o.quoteAmount === minPrice) s += 3;
    if (o.seller.rating === maxRating) s += 3;
    if (parseInt(o.timeline) === minTimeline) s += 2;
    if (o.seller.completedJobs === maxJobs) s += 2;
    if (o.seller.isVerified) s += 1;
    if (o.seller.isTopSeller) s += 1;
    if (o.seller.isPro) s += 1;
    return s;
  });

  const maxScore = Math.max(...scores);
  const winnerIdx = scores.indexOf(maxScore);
  const winner = offers[winnerIdx];
  const allTied = scores.every(s => s === maxScore);

  if (allTied) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      style={{
        margin: '0 16px 14px',
        padding: '11px 14px',
        borderRadius: 16,
        background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(168,85,247,0.06))',
        border: '1.5px solid rgba(124,58,237,0.2)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
      }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L9.6 6H14L10.5 8.5L12 12.5L8 10L4 12.5L5.5 8.5L2 6H6.4L8 2Z" fill="white"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', marginBottom: 1 }}>Best Overall Pick</p>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {winner.seller.name}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: 1 }}>Sorcyn Score</p>
        <p style={{ fontSize: '16px', fontWeight: 900, color: '#7C3AED', letterSpacing: '-0.02em' }}>{maxScore}<span style={{ fontSize: '10px', fontWeight: 600, color: '#A855F7' }}>pts</span></p>
      </div>
    </motion.div>
  );
}

/* ─── Main modal ─────────────────────────────────────────────── */
export function CompareOffersModal({ offers, budgetMax, postTitle, onClose, onAccept }: CompareOffersModalProps) {
  const [acceptingOffer, setAcceptingOffer] = useState<Offer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const colCount = offers.length;

  // Column widths
  const labelW = 88;
  const colW   = colCount === 3 ? 104 : 130;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 90,
        backgroundColor: 'rgba(10,4,22,0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '110%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.85 }}
        style={{
          backgroundColor: '#FAFAFA',
          borderRadius: '28px 28px 0 0',
          display: 'flex', flexDirection: 'column',
          maxHeight: '92%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Handle ── */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 0, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px 12px',
          flexShrink: 0,
          borderBottom: '1px solid #F0F0F0',
          backgroundColor: 'white',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Compare Offers
            </h2>
            <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 2 }}>
              {colCount} offer{colCount !== 1 ? 's' : ''} · {postTitle.length > 30 ? postTitle.slice(0, 30) + '…' : postTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center transition-all active:scale-90"
            style={{
              width: 36, height: 36, borderRadius: 11,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Winner banner ── */}
        <div style={{ backgroundColor: 'white', paddingTop: 12, flexShrink: 0 }}>
          <WinnerBanner offers={offers} budgetMax={budgetMax} />
        </div>

        {/* ── Scrollable table ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{ overflowX: 'hidden' }}
        >
          {/* ── Sticky seller headers ── */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 20,
            backgroundColor: 'white',
            borderBottom: '1px solid #F0F0F0',
            display: 'flex',
            paddingBottom: 16,
            paddingTop: 4,
          }}>
            {/* Label column spacer */}
            <div style={{ width: labelW, flexShrink: 0 }} />

            {/* Seller columns */}
            {offers.map((offer, i) => {
              const bestPrice = Math.min(...offers.map(o => o.quoteAmount));
              const isBestPrice = offer.quoteAmount === bestPrice;

              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.28 }}
                  style={{
                    width: colW, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '0 6px',
                    position: 'relative',
                  }}
                >
                  {/* Best-value crown */}
                  {isBestPrice && offers.length > 1 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.35 }}
                      style={{
                        position: 'absolute', top: -8, right: 10,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#F59E0B,#EF4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 10px rgba(245,158,11,0.4)',
                        zIndex: 2,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M1 4L3 2.5L6 5L9 2.5L11 4L9.5 9H2.5L1 4Z" fill="white"/>
                        <path d="M2.5 9H9.5V10.5H2.5V9Z" fill="white"/>
                      </svg>
                    </motion.div>
                  )}

                  {/* Avatar */}
                  <div style={{ position: 'relative' }}>
                    {offer.seller.avatar ? (
                      <img
                        src={offer.seller.avatar}
                        alt={offer.seller.name}
                        style={{
                          width: colW === 104 ? 48 : 56,
                          height: colW === 104 ? 48 : 56,
                          borderRadius: 16, objectFit: 'cover',
                          border: isBestPrice ? '2.5px solid #7C3AED' : '2px solid #E5E7EB',
                          boxShadow: isBestPrice ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: colW === 104 ? 48 : 56,
                        height: colW === 104 ? 48 : 56,
                        borderRadius: 16,
                        background: offer.seller.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: isBestPrice ? '2.5px solid #7C3AED' : '2px solid rgba(255,255,255,0.5)',
                        boxShadow: isBestPrice ? '0 0 0 3px rgba(124,58,237,0.15)' : '0 4px 12px rgba(0,0,0,0.12)',
                      }}>
                        <span style={{ fontSize: colW === 104 ? 16 : 18, fontWeight: 800, color: 'white' }}>
                          {offer.seller.initials}
                        </span>
                      </div>
                    )}

                    {/* Verified tick */}
                    {offer.seller.isVerified && (
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                        border: '2px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.5 6L6.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p style={{
                    fontSize: '12px', fontWeight: 800, color: '#1F2937',
                    textAlign: 'center', lineHeight: 1.2,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    width: '100%',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {offer.seller.name}
                  </p>

                  {/* Stars + score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Stars rating={offer.seller.rating} size={9} />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>
                      {offer.seller.rating.toFixed(1)} ({offer.seller.reviewCount})
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Data rows ── */}
          {ROWS.map((row, rowIdx) => {
            const bestIdx = getBestCol(offers, row.id);

            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + rowIdx * 0.04, duration: 0.24 }}
                style={{
                  display: 'flex',
                  borderBottom: rowIdx < ROWS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  backgroundColor: rowIdx % 2 === 0 ? 'white' : '#FAFAFA',
                }}
              >
                {/* Row label */}
                <div style={{
                  width: labelW, flexShrink: 0,
                  padding: '13px 10px 13px 16px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{row.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', lineHeight: 1.3 }}>
                    {row.label}
                  </span>
                </div>

                {/* Cells */}
                {offers.map((offer, colIdx) => {
                  const isBest = bestIdx === colIdx;
                  return (
                    <div
                      key={offer.id}
                      style={{
                        width: colW, flexShrink: 0,
                        padding: '12px 8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isBest ? 'rgba(124,58,237,0.04)' : 'transparent',
                        borderLeft: isBest ? '2px solid rgba(124,58,237,0.15)' : '2px solid transparent',
                        borderRight: isBest ? '2px solid rgba(124,58,237,0.15)' : '2px solid transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <CellValue offer={offer} row={row.id} isBest={isBest} budgetMax={budgetMax} />
                    </div>
                  );
                })}
              </motion.div>
            );
          })}

          {/* bottom padding for the sticky footer */}
          <div style={{ height: 100 }} />
        </div>

        {/* ── Sticky footer: Accept buttons ── */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(0,0,0,0.07)',
          backgroundColor: 'white',
          padding: '14px 16px 30px',
        }}>
          {/* Column spacer + accept buttons aligned to columns */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Label spacer */}
            <div style={{ width: labelW, flexShrink: 0 }} />

            {/* One button per column */}
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              {offers.map((offer, i) => (
                <motion.button
                  key={offer.id}
                  type="button"
                  onClick={() => { onAccept(offer); }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 340, damping: 26 }}
                  style={{
                    flex: 1,
                    height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 1,
                    boxShadow: '0 6px 18px rgba(124,58,237,0.32)',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Shimmer */}
                  <motion.div
                    animate={{ x: ['-150%', '250%'] }}
                    transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 + i * 0.3 }}
                    style={{
                      position: 'absolute', top: 0, bottom: 0, width: '40%',
                      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
                      transform: 'skewX(-12deg)', pointerEvents: 'none',
                    }}
                  />
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.5L5.5 10.5L11.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'white' }}>Accept</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="w-full transition-all active:scale-[0.98]"
            style={{
              marginTop: 10,
              height: 40, borderRadius: 14,
              border: 'none', backgroundColor: '#F3F4F6',
              fontSize: '14px', fontWeight: 700, color: '#9CA3AF',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
