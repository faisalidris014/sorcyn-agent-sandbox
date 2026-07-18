import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export type OfferStatus = 'Pending' | 'Accepted' | 'Declined' | 'Withdrawn';
type FilterKey = 'All' | OfferStatus;
type SortKey = 'newest' | 'oldest' | 'highest_amount' | 'lowest_amount';

export interface SellerOffer {
  id: string;
  postTitle: string;
  postCategory: string;
  postCategoryIcon: string;
  postBudgetMin: number;
  postBudgetMax: number;
  buyerName: string;
  buyerInitials: string;
  buyerGradient: string;
  buyerAvatar?: string;
  buyerRating: number;
  buyerReviews: number;
  buyerIsVerified: boolean;
  offerAmount: number;
  timeline: string;
  status: OfferStatus;
  submittedAt: string;      // relative
  lastUpdatedAt: string;    // relative
  message: string;
  earnings: number;         // after 8% platform fee
}

export interface MyOffersScreenProps {
  onBrowseFeed: () => void;
  onViewOffer?: (id: string) => void;
  onWithdraw?: (id: string) => void;
  onMessage?: (id: string) => void;
}

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CFG: Record<OfferStatus, {
  label: string; color: string; bg: string;
  border: string; dot: string; barColor: string;
}> = {
  Pending:   { label: 'Pending',   color: '#B45309', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.28)', dot: '#F59E0B', barColor: '#F59E0B' },
  Accepted:  { label: 'Accepted',  color: '#059669', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.25)', dot: '#10B981', barColor: '#10B981' },
  Declined:  { label: 'Declined',  color: '#DC2626', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)', dot: '#EF4444', barColor: '#EF4444' },
  Withdrawn: { label: 'Withdrawn', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', dot: '#9CA3AF', barColor: '#9CA3AF' },
};

const FILTERS: FilterKey[] = ['All', 'Pending', 'Accepted', 'Declined', 'Withdrawn'];
const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'newest',        label: 'Newest First'    },
  { key: 'oldest',        label: 'Oldest First'    },
  { key: 'highest_amount',label: 'Highest Amount'  },
  { key: 'lowest_amount', label: 'Lowest Amount'   },
];

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Design':       { bg: 'rgba(168,85,247,0.1)', color: '#9333EA' },
  'Software Dev': { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' },
  'Home Services':{ bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  'Electronics':  { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  'Marketing':    { bg: 'rgba(239,68,68,0.1)',  color: '#DC2626' },
  'Photography':  { bg: 'rgba(20,184,166,0.1)', color: '#0D9488' },
  'Moving':       { bg: 'rgba(249,115,22,0.1)', color: '#EA580C' },
  'Writing':      { bg: 'rgba(236,72,153,0.1)', color: '#DB2777' },
};
function catStyle(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' };
}

/* ─── Demo data ──────────────────────────────────────────────── */
export const DEMO_SELLER_OFFERS: SellerOffer[] = [
  {
    id: 'o1',
    postTitle: 'Need a professional logo + brand identity for a fintech startup',
    postCategory: 'Design', postCategoryIcon: '✏️',
    postBudgetMin: 500, postBudgetMax: 1500,
    buyerName: 'Sarah Chen', buyerInitials: 'SC',
    buyerGradient: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    buyerRating: 4.9, buyerReviews: 43, buyerIsVerified: true,
    offerAmount: 950, timeline: '5 days', status: 'Pending',
    submittedAt: '2h ago', lastUpdatedAt: '2h ago',
    earnings: Math.round(950 * 0.92),
    message: 'I have 6+ years in brand identity for fintech. Happy to share my portfolio.',
  },
  {
    id: 'o2',
    postTitle: 'React Native developer needed for marketplace app — 3 month contract',
    postCategory: 'Software Dev', postCategoryIcon: '💻',
    postBudgetMin: 2000, postBudgetMax: 5000,
    buyerName: 'Marcus Rivera', buyerInitials: 'MR',
    buyerGradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
    buyerRating: 4.6, buyerReviews: 18, buyerIsVerified: false,
    offerAmount: 3800, timeline: '12 weeks', status: 'Accepted',
    submittedAt: '1d ago', lastUpdatedAt: '4h ago',
    earnings: Math.round(3800 * 0.92),
    message: 'Strong experience with React Native and marketplace architectures.',
  },
  {
    id: 'o3',
    postTitle: 'Photographer for product shoot — 20 items, white background',
    postCategory: 'Photography', postCategoryIcon: '📷',
    postBudgetMin: 300, postBudgetMax: 700,
    buyerName: 'Priya Patel', buyerInitials: 'PP',
    buyerGradient: 'linear-gradient(135deg,#10B981,#059669)',
    buyerRating: 4.8, buyerReviews: 27, buyerIsVerified: true,
    offerAmount: 580, timeline: '3 days', status: 'Pending',
    submittedAt: '3h ago', lastUpdatedAt: '3h ago',
    earnings: Math.round(580 * 0.92),
    message: 'Professional product photographer with studio space. Can deliver by Friday.',
  },
  {
    id: 'o4',
    postTitle: 'Social media manager needed for e-commerce skincare brand',
    postCategory: 'Marketing', postCategoryIcon: '📣',
    postBudgetMin: 500, postBudgetMax: 1200,
    buyerName: 'Jordan Kim', buyerInitials: 'JK',
    buyerGradient: 'linear-gradient(135deg,#EC4899,#F43F5E)',
    buyerRating: 4.3, buyerReviews: 9, buyerIsVerified: false,
    offerAmount: 900, timeline: '1 month', status: 'Declined',
    submittedAt: '2d ago', lastUpdatedAt: '1d ago',
    earnings: Math.round(900 * 0.92),
    message: 'I run social for 3 DTC beauty brands currently. Great results.',
  },
  {
    id: 'o5',
    postTitle: 'Urgent: plumber needed for pipe leak — bathroom, 2nd floor',
    postCategory: 'Home Services', postCategoryIcon: '🏠',
    postBudgetMin: 80, postBudgetMax: 220,
    buyerName: 'Tom Walsh', buyerInitials: 'TW',
    buyerGradient: 'linear-gradient(135deg,#3B82F6,#6366F1)',
    buyerRating: 4.5, buyerReviews: 12, buyerIsVerified: true,
    offerAmount: 150, timeline: 'Same day', status: 'Withdrawn',
    submittedAt: '3d ago', lastUpdatedAt: '2d ago',
    earnings: Math.round(150 * 0.92),
    message: 'Licensed plumber, can come within 2 hours. Fully insured.',
  },
  {
    id: 'o6',
    postTitle: 'Moving help needed — 2BR apartment, 15 min drive downtown',
    postCategory: 'Moving', postCategoryIcon: '📦',
    postBudgetMin: 200, postBudgetMax: 450,
    buyerName: 'Ana Torres', buyerInitials: 'AT',
    buyerGradient: 'linear-gradient(135deg,#F97316,#EAB308)',
    buyerRating: 4.7, buyerReviews: 6, buyerIsVerified: false,
    offerAmount: 280, timeline: '1 day', status: 'Pending',
    submittedAt: '5h ago', lastUpdatedAt: '5h ago',
    earnings: Math.round(280 * 0.92),
    message: 'Team of 2 with van. Fully insured, great reviews on moving jobs.',
  },
  {
    id: 'o7',
    postTitle: 'Content writer for SaaS blog — 4 posts per month, ongoing',
    postCategory: 'Writing', postCategoryIcon: '✍️',
    postBudgetMin: 400, postBudgetMax: 900,
    buyerName: 'Lena Müller', buyerInitials: 'LM',
    buyerGradient: 'linear-gradient(135deg,#8B5CF6,#06B6D4)',
    buyerRating: 5.0, buyerReviews: 31, buyerIsVerified: true,
    offerAmount: 720, timeline: 'Ongoing', status: 'Accepted',
    submittedAt: '5d ago', lastUpdatedAt: '2d ago',
    earnings: Math.round(720 * 0.92),
    message: 'SaaS content specialist. I write for Notion, Linear, and Loom.',
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function filterOffers(offers: SellerOffer[], f: FilterKey) {
  return f === 'All' ? offers : offers.filter(o => o.status === f);
}
function sortOffers(offers: SellerOffer[], s: SortKey) {
  const arr = [...offers];
  if (s === 'oldest')         return arr.reverse();
  if (s === 'highest_amount') return arr.sort((a, b) => b.offerAmount - a.offerAmount);
  if (s === 'lowest_amount')  return arr.sort((a, b) => a.offerAmount - b.offerAmount);
  return arr; // newest first (default order)
}

/* ─── Stars ──────────────────────────────────────────────────── */
function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z"
            fill={rating >= s ? '#F59E0B' : '#E5E7EB'}
            stroke={rating >= s ? '#F59E0B' : '#E5E7EB'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

/* ─── Sort dropdown ──────────────────────────────────────────── */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const label = SORT_OPTS.find(o => o.key === value)!.label;
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          height: 34, padding: '0 11px', borderRadius: 10,
          border: '1.5px solid rgba(124,58,237,0.28)',
          backgroundColor: 'rgba(124,58,237,0.05)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5H12M4 7H10M6 10.5H8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>{label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.16 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 88 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              style={{
                position: 'absolute', top: 40, right: 0, zIndex: 89,
                width: 188, borderRadius: 16,
                backgroundColor: 'white',
                boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transformOrigin: 'top right',
              }}
            >
              {SORT_OPTS.map((opt, i) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  style={{
                    width: '100%', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: opt.key === value ? 'rgba(124,58,237,0.05)' : 'none',
                    border: 'none', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: opt.key === value ? 700 : 500, color: opt.key === value ? '#7C3AED' : '#374151' }}>
                    {opt.label}
                  </span>
                  {opt.key === value && (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Stats summary row ──────────────────────────────────────── */
function StatsRow({ offers }: { offers: SellerOffer[] }) {
  const pending   = offers.filter(o => o.status === 'Pending').length;
  const accepted  = offers.filter(o => o.status === 'Accepted').length;
  const totalEarned = offers.filter(o => o.status === 'Accepted').reduce((s, o) => s + o.earnings, 0);
  const declined  = offers.filter(o => o.status === 'Declined').length;

  const stats = [
    { label: 'Pending',   value: pending,                                color: '#B45309', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Accepted',  value: accepted,                               color: '#059669', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Earnings',  value: `$${totalEarned.toLocaleString()}`,     color: '#7C3AED', bg: 'rgba(124,58,237,0.07)' },
    { label: 'Declined',  value: declined,                               color: '#DC2626', bg: 'rgba(239,68,68,0.07)'  },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 16px 16px', flexShrink: 0 }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 340, damping: 26 }}
          style={{
            flex: 1, padding: '10px 6px',
            borderRadius: 14,
            backgroundColor: s.bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}
        >
          <span style={{ fontSize: typeof s.value === 'string' ? '14px' : '20px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {s.value}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: s.color, opacity: 0.72, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
            {s.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Offer Card ─────────────────────────────────────────────── */
function OfferCard({
  offer,
  index,
  onWithdraw,
  onMessage,
}: {
  offer: SellerOffer;
  index: number;
  onWithdraw?: () => void;
  onMessage?: () => void;
}) {
  const sc  = STATUS_CFG[offer.status];
  const cs  = catStyle(offer.postCategory);
  const isPending   = offer.status === 'Pending';
  const isAccepted  = offer.status === 'Accepted';
  const isDeclined  = offer.status === 'Declined';
  const isWithdrawn = offer.status === 'Withdrawn';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 340, damping: 28 }}
      style={{
        borderRadius: 20,
        backgroundColor: 'white',
        border: `1.5px solid ${isAccepted ? 'rgba(16,185,129,0.2)' : isDeclined ? 'rgba(239,68,68,0.18)' : '#EFEFEF'}`,
        boxShadow: isAccepted
          ? '0 4px 16px rgba(16,185,129,0.1)'
          : isPending
          ? '0 4px 14px rgba(0,0,0,0.05)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        opacity: isWithdrawn || isDeclined ? 0.8 : 1,
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, backgroundColor: sc.barColor, opacity: isWithdrawn ? 0.5 : 1 }} />

      <div style={{ padding: '14px 16px 0' }}>

        {/* ── Row 1: Category + Status ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 7,
            backgroundColor: cs.bg,
          }}>
            <span style={{ fontSize: '11px' }}>{offer.postCategoryIcon}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: cs.color }}>{offer.postCategory}</span>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 7,
            backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
          }}>
            {isPending ? (
              <motion.div
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }}
              />
            ) : (
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }} />
            )}
            <span style={{ fontSize: '10px', fontWeight: 700, color: sc.color }}>{sc.label}</span>
          </div>

          {/* Accepted: "Payment in escrow" chip */}
          {isAccepted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 7,
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              marginLeft: 'auto',
            }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="4.5" width="8" height="5" rx="1.2" stroke="#059669" strokeWidth="1.1"/>
                <path d="M3 4.5V3.5C3 2.4 3.9 1.5 5 1.5S7 2.4 7 3.5V4.5" stroke="#059669" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669' }}>In Escrow</span>
            </div>
          )}
        </div>

        {/* ── Row 2: Post title ── */}
        <p style={{
          fontSize: '14px', fontWeight: 700,
          color: isWithdrawn || isDeclined ? '#9CA3AF' : '#1F2937',
          lineHeight: 1.45, marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {offer.postTitle}
        </p>

        {/* ── Row 3: Offer amount + earnings ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 14, marginBottom: 12,
          background: isAccepted
            ? 'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(16,185,129,0.04))'
            : 'linear-gradient(135deg,rgba(124,58,237,0.05),rgba(168,85,247,0.03))',
          border: `1.5px solid ${isAccepted ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.1)'}`,
        }}>
          <div>
            <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: 3 }}>Your offer</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: isAccepted ? '#059669' : '#7C3AED', letterSpacing: '-0.03em', lineHeight: 1 }}>
                ${offer.offerAmount.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>total</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, marginBottom: 3 }}>You earn (−8%)</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: isAccepted ? '#059669' : '#1F2937', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ${offer.earnings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Row 4: Buyer info ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {/* Buyer avatar */}
          {offer.buyerAvatar ? (
            <img src={offer.buyerAvatar} alt={offer.buyerName}
              style={{ width: 36, height: 36, borderRadius: 11, objectFit: 'cover', border: '1.5px solid #F0F0F0', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              background: offer.buyerGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>{offer.buyerInitials}</span>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {offer.buyerName}
              </span>
              {offer.buyerIsVerified && (
                <div style={{
                  width: 15, height: 15, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Stars rating={offer.buyerRating} size={9} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1F2937' }}>{offer.buyerRating.toFixed(1)}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>({offer.buyerReviews})</span>
            </div>
          </div>

          {/* Timeline + submitted meta */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 3 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.2"/>
                <path d="M6 4V6L7.2 7" stroke="#9CA3AF" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>{offer.timeline}</span>
            </div>
            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Sent {offer.submittedAt}</span>
          </div>
        </div>

        {/* ── Row 5: Message preview ── */}
        <div style={{
          padding: '10px 12px', borderRadius: 12, marginBottom: 12,
          backgroundColor: '#F9FAFB', border: '1px solid #F0F0F0',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 9C12 9.55 11.55 10 11 10H4L2.5 11.5V3.5C2.5 2.95 2.95 2.5 3.5 2.5H11C11.55 2.5 12 2.95 12 3.5V9Z"
                stroke="#9CA3AF" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <p style={{
              fontSize: '12px', color: '#6B7280', lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              "{offer.message}"
            </p>
          </div>
        </div>
      </div>

      {/* ── Action row ── */}
      <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
        {isPending && (
          <>
            <button
              type="button"
              onClick={onWithdraw}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                fontSize: '12px', fontWeight: 700, color: '#6B7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Withdraw
            </button>
            <button
              type="button"
              onClick={onMessage}
              style={{
                flex: 1.5, height: 38, borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M12 9C12 9.55 11.55 10 11 10H4L2.5 11.5V3.5C2.5 2.95 2.95 2.5 3.5 2.5H11C11.55 2.5 12 2.95 12 3.5V9Z"
                  fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Message Buyer
            </button>
          </>
        )}

        {isAccepted && (
          <>
            <button
              type="button"
              onClick={onMessage}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid rgba(16,185,129,0.3)',
                backgroundColor: 'rgba(16,185,129,0.06)',
                fontSize: '12px', fontWeight: 700, color: '#059669', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M12 9C12 9.55 11.55 10 11 10H4L2.5 11.5V3.5C2.5 2.95 2.95 2.5 3.5 2.5H11C11.55 2.5 12 2.95 12 3.5V9Z"
                  stroke="#059669" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Message
            </button>
            <button
              type="button"
              style={{
                flex: 1.5, height: 38, borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#059669,#10B981)',
                fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View Contract
            </button>
          </>
        )}

        {isDeclined && (
          <button
            type="button"
            style={{
              flex: 1, height: 38, borderRadius: 12,
              border: '1.5px solid rgba(124,58,237,0.28)',
              backgroundColor: 'rgba(124,58,237,0.05)',
              fontSize: '12px', fontWeight: 700, color: '#7C3AED', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 2.5V1.5L4.5 4L7 6.5V5C9.49 5 11.5 7.01 11.5 9.5S9.49 14 7 14 2.5 11.99 2.5 9.5H1.2C1.2 12.71 3.79 15.3 7 15.3S12.8 12.71 12.8 9.5 10.21 3.7 7 3.7V2.5Z" fill="#7C3AED"/>
            </svg>
            Resubmit Offer
          </button>
        )}

        {isWithdrawn && (
          <div style={{
            flex: 1, height: 38, borderRadius: 12,
            backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.3"/>
              <path d="M5 7H9M7 5L9 7L7 9" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF' }}>Withdrawn {offer.lastUpdatedAt}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState({ filter, onBrowse }: { filter: FilterKey; onBrowse: () => void }) {
  const isFiltered = filter !== 'All';
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px 80px',
    }}>
      {/* Floating illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 28 }}
      >
        <svg width="148" height="138" viewBox="0 0 148 138" fill="none">
          {/* Shadow */}
          <ellipse cx="74" cy="132" rx="40" ry="5" fill="#F3F4F6"/>

          {/* Main briefcase body */}
          <rect x="16" y="44" width="116" height="82" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>

          {/* Briefcase handle */}
          <path d="M52 44V36C52 32.69 54.69 30 58 30H90C93.31 30 96 32.69 96 36V44" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>

          {/* Center clasp */}
          <rect x="62" y="78" width="24" height="12" rx="6" fill="#E5E7EB"/>
          <rect x="68" y="81" width="12" height="6" rx="3" fill="#D1D5DB"/>

          {/* Interior lines */}
          <rect x="30" y="60" width="88" height="5" rx="2.5" fill="#F3F4F6"/>
          <rect x="30" y="72" width="30" height="4" rx="2" fill="#EDE9FE"/>
          <rect x="30" y="72" width="30" height="4" rx="2" fill="#EDE9FE"/>
          <rect x="88" y="72" width="30" height="4" rx="2" fill="#F3F4F6"/>
          <rect x="30" y="96" width="50" height="4" rx="2" fill="#F3F4F6"/>
          <rect x="30" y="108" width="38" height="4" rx="2" fill="#F3F4F6"/>

          {/* Purple offer badge — top right floating */}
          <g>
            <rect x="88" y="14" width="48" height="30" rx="10" fill="url(#obg)" opacity="0.95"/>
            <text x="112" y="26" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">OFFER</text>
            <text x="112" y="37" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="600">$0</text>
          </g>

          {/* Sparkle stars */}
          <circle cx="14" cy="60" r="3" fill="#DDD6FE" opacity="0.7"/>
          <circle cx="134" cy="80" r="2.5" fill="#A78BFA" opacity="0.55"/>
          <circle cx="24" cy="124" r="2" fill="#EDE9FE" opacity="0.8"/>

          {/* Question mark in center when empty */}
          <circle cx="74" cy="86" r="14" fill="rgba(124,58,237,0.07)" stroke="rgba(124,58,237,0.15)" strokeWidth="1"/>
          <text x="74" y="91" textAnchor="middle" fill="#7C3AED" fontSize="16" fontWeight="900">?</text>

          <defs>
            <linearGradient id="obg" x1="88" y1="14" x2="136" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/>
              <stop offset="1" stopColor="#A855F7"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <h3 style={{
        fontSize: '21px', fontWeight: 800, color: '#1F2937',
        letterSpacing: '-0.02em', marginBottom: 10, textAlign: 'center',
      }}>
        {isFiltered ? `No ${filter} offers` : 'No offers yet'}
      </h3>

      <p style={{
        fontSize: '14px', color: '#6B7280',
        textAlign: 'center', lineHeight: 1.65,
        maxWidth: 256, marginBottom: 30,
      }}>
        {isFiltered
          ? `You don't have any ${filter.toLowerCase()} offers at the moment.`
          : 'Browse buyer requests and submit your first offer to start earning.'}
      </p>

      {!isFiltered && (
        <motion.button
          type="button"
          onClick={onBrowse}
          whileTap={{ scale: 0.96 }}
          style={{
            height: 52, padding: '0 28px', borderRadius: 20,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 9,
            boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-130%', '230%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2.5L12 7.5H17.5L13 11L14.5 16.5L10 13.5L5.5 16.5L7 11L2.5 7.5H8L10 2.5Z" fill="white"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
            Browse Requests
          </span>
        </motion.button>
      )}

      {/* Sub-hint */}
      {!isFiltered && (
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 16, textAlign: 'center' }}>
          Sellers on Sorcyn earn on average <span style={{ fontWeight: 700, color: '#7C3AED' }}>$1,200/mo</span>
        </p>
      )}
    </div>
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export function MyOffersScreen({ onBrowseFeed, onWithdraw, onMessage }: MyOffersScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort,   setSort  ] = useState<SortKey>('newest');

  const offers       = DEMO_SELLER_OFFERS;
  const filtered     = filterOffers(offers, filter);
  const sorted       = sortOffers(filtered, sort);

  const countFor = (f: FilterKey) =>
    f === 'All' ? offers.length : offers.filter(o => o.status === f).length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#F9FAFB' }}>

      {/* ── Status bar ── */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '10px 24px 0',
        backgroundColor: 'white', flexShrink: 0,
      }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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

      {/* ── App bar ── */}
      <div style={{
        backgroundColor: 'white', padding: '10px 18px 14px',
        borderBottom: '1px solid #F0F0F0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: 900, color: '#1F2937',
              letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              My Offers
            </h1>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 2 }}>
              {offers.length} offer{offers.length !== 1 ? 's' : ''} submitted
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SortDropdown value={sort} onChange={setSort} />
            {/* Browse button */}
            <motion.button
              type="button"
              onClick={onBrowseFeed}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 38, height: 38, borderRadius: 13,
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124,58,237,0.38)',
                flexShrink: 0,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.2 7.8H18.5L13.5 11.4L15.4 17.5L10 13.8L4.6 17.5L6.5 11.4L1.5 7.8H7.8L10 2Z" fill="white"/>
              </svg>
            </motion.button>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div style={{
          display: 'flex', gap: 7,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 2,
        }}>
          {FILTERS.map(f => {
            const active = filter === f;
            const count  = countFor(f);
            return (
              <motion.button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                whileTap={{ scale: 0.93 }}
                style={{
                  flexShrink: 0,
                  height: 32, padding: '0 12px',
                  borderRadius: 100,
                  border: active ? 'none' : '1.5px solid #E5E7EB',
                  background: active
                    ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                    : 'white',
                  boxShadow: active ? '0 3px 12px rgba(124,58,237,0.3)' : 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {/* Coloured dot per status (not All) */}
                {f !== 'All' && !active && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: STATUS_CFG[f as OfferStatus].dot,
                    flexShrink: 0,
                  }} />
                )}
                <span style={{ fontSize: '12px', fontWeight: 700, color: active ? 'white' : '#6B7280' }}>
                  {f}
                </span>
                {count > 0 && (
                  <div style={{
                    minWidth: 17, height: 17, borderRadius: 8.5, padding: '0 4px',
                    backgroundColor: active ? 'rgba(255,255,255,0.28)' : 'rgba(107,114,128,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: active ? 'white' : '#6B7280' }}>
                      {count}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Stats row (All tab only) ── */}
      {filter === 'All' && (
        <div style={{ backgroundColor: 'white' }}>
          <StatsRow offers={offers} />
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, backgroundColor: '#F0F0F0', flexShrink: 0 }} />

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 16px 100px' }}>
        <AnimatePresence mode="wait">
          {sorted.length === 0 ? (
            <motion.div
              key={`empty-${filter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <EmptyState filter={filter} onBrowse={onBrowseFeed} />
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filter}-${sort}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              {/* Result label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                  {sorted.length} {filter === 'All' ? '' : filter.toLowerCase() + ' '}
                  offer{sorted.length !== 1 ? 's' : ''}
                </span>
                {/* Pending pulsing indicator */}
                {sorted.some(o => o.status === 'Pending') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#F59E0B' }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309' }}>
                      {sorted.filter(o => o.status === 'Pending').length} awaiting response
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sorted.map((offer, i) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    index={i}
                    onWithdraw={() => onWithdraw?.(offer.id)}
                    onMessage={() => onMessage?.(offer.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
