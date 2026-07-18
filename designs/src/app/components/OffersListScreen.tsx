import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AcceptOfferModal } from './AcceptOfferModal';
import { CompareOffersModal } from './CompareOffersModal';

/* ─── Types ──────────────────────────────────────────────────── */
export interface Offer {
  id: string;
  seller: {
    name: string;
    avatar?: string;
    initials: string;
    gradient: string;
    rating: number;
    reviewCount: number;
    completedJobs: number;
    responseTime: string;
    isVerified: boolean;
    isTopSeller: boolean;
    isPro: boolean;
    distance: string;
    memberSince: string;
  };
  quoteAmount: number;
  timeline: string;
  messagePreview: string;
  submittedAgo: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface OffersListScreenProps {
  postTitle: string;
  postBudgetMin: number;
  postBudgetMax: number;
  offers: Offer[];
  onBack: () => void;
  onViewOfferDetail?: (id: string) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onMessage?: (id: string) => void;
}

/* ─── Sort & filter options ──────────────────────────────────── */
type SortKey = 'lowest_price' | 'highest_rated' | 'fastest' | 'most_reviews' | 'newest';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'lowest_price',  label: 'Lowest Price'   },
  { key: 'highest_rated', label: 'Highest Rated'  },
  { key: 'fastest',       label: 'Fastest'        },
  { key: 'most_reviews',  label: 'Most Reviews'   },
  { key: 'newest',        label: 'Newest First'   },
];

type FilterKey = 'all' | 'verified' | 'top_seller' | 'pro' | 'local';
const FILTER_OPTIONS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'all', label: 'All',
    icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    key: 'verified', label: 'Verified',
    icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L7 2.5H9.5V5L11 6L9.5 7.5V10H7L6 11L5 10H2.5V7.5L1 6L2.5 5V2.5H5L6 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M4 6L5.5 7.5L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    key: 'top_seller', label: 'Top Seller',
    icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.2 4.4H10.5L7.8 6.4L8.9 9.9L6 7.8L3.1 9.9L4.2 6.4L1.5 4.4H4.8L6 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>,
  },
  {
    key: 'pro', label: 'Pro',
    icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="3" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 3V2.5A1.5 1.5 0 0 1 8 2.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  },
  {
    key: 'local', label: 'Nearby',
    icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11S9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1Z" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="4.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/></svg>,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function sortOffers(offers: Offer[], sort: SortKey): Offer[] {
  const arr = [...offers];
  switch (sort) {
    case 'lowest_price':  return arr.sort((a, b) => a.quoteAmount - b.quoteAmount);
    case 'highest_rated': return arr.sort((a, b) => b.seller.rating - a.seller.rating);
    case 'fastest':       return arr.sort((a, b) => a.timeline.localeCompare(b.timeline));
    case 'most_reviews':  return arr.sort((a, b) => b.seller.reviewCount - a.seller.reviewCount);
    case 'newest':        return arr; // already newest-first in demo
    default: return arr;
  }
}

function filterOffers(offers: Offer[], filter: FilterKey): Offer[] {
  switch (filter) {
    case 'verified':   return offers.filter(o => o.seller.isVerified);
    case 'top_seller': return offers.filter(o => o.seller.isTopSeller);
    case 'pro':        return offers.filter(o => o.seller.isPro);
    case 'local':      return offers.filter(o => !o.seller.distance.toLowerCase().includes('remote'));
    default: return offers;
  }
}

/* ─── Stars ──────────────────────────────────────────────────── */
function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.2 4.4H10.5L7.8 6.4L8.9 9.9L6 7.8L3.1 9.9L4.2 6.4L1.5 4.4H4.8L6 1Z"
            fill={rating >= s ? '#F59E0B' : '#E5E7EB'}/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Seller badge ───────────────────────────────────────────── */
function SellerBadge({ label, color, bg, border, icon }: { label: string; color: string; bg: string; border: string; icon: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 6,
      backgroundColor: bg, border: `1.2px solid ${border}`,
    }}>
      {icon}
      <span style={{ fontSize: '10px', fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

/* ─── Sort dropdown ──────────────────────────────────────────── */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.key === value)!;

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 transition-all active:scale-95"
        style={{
          height: 36, padding: '0 12px',
          borderRadius: 12,
          border: '1.5px solid #7C3AED',
          backgroundColor: 'rgba(124,58,237,0.06)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5H12M4 7H10M6 10.5H8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
          {current.label}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 88 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -6 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              style={{
                position: 'absolute', top: 42, right: 0,
                width: 180, borderRadius: 16,
                backgroundColor: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden', zIndex: 89,
                transformOrigin: 'top right',
              }}
            >
              {SORT_OPTIONS.map((opt, i) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: opt.key === value ? 'rgba(124,58,237,0.06)' : 'none',
                    border: 'none',
                    borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: opt.key === value ? 700 : 500, color: opt.key === value ? '#7C3AED' : '#374151' }}>
                    {opt.label}
                  </span>
                  {opt.key === value && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

/* ─── Offer card ─────────────────────────────────────────────── */
function OfferCard({
  offer,
  budgetMin,
  budgetMax,
  isComparing,
  onToggleCompare,
  onViewDetail,
  onAccept,
  onDecline,
  onMessage,
}: {
  offer: Offer;
  budgetMin: number;
  budgetMax: number;
  isComparing: boolean;
  onToggleCompare: () => void;
  onViewDetail: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onMessage: () => void;
}) {
  const [declined, setDeclined] = useState(offer.status === 'declined');
  const [accepted, setAccepted] = useState(offer.status === 'accepted');
  const pctOfBudget = Math.round((offer.quoteAmount / budgetMax) * 100);
  const isUnderBudget = offer.quoteAmount <= budgetMax;

  const handleDecline = () => { setDeclined(true); onDecline(); };
  const handleAccept  = () => { setAccepted(true);  onAccept();  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: declined ? 0.45 : 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: 20,
        border: accepted
          ? '2px solid rgba(16,185,129,0.4)'
          : isComparing
          ? '2px solid #7C3AED'
          : '1.5px solid #E5E7EB',
        backgroundColor: accepted ? 'rgba(16,185,129,0.03)' : isComparing ? 'rgba(124,58,237,0.03)' : 'white',
        overflow: 'hidden',
        boxShadow: accepted
          ? '0 4px 20px rgba(16,185,129,0.12)'
          : isComparing
          ? '0 4px 20px rgba(124,58,237,0.14)'
          : '0 2px 12px rgba(0,0,0,0.05)',
        position: 'relative',
      }}
    >
      {/* Status ribbon */}
      {accepted && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: 'linear-gradient(90deg,#10B981,#34D399)',
        }} />
      )}
      {declined && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, backgroundColor: '#EF4444',
        }} />
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {/* ── Header: avatar + name + badges + compare toggle ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {offer.seller.avatar ? (
              <img
                src={offer.seller.avatar}
                alt={offer.seller.name}
                style={{
                  width: 50, height: 50, borderRadius: 16,
                  objectFit: 'cover',
                  border: '2px solid #F0EBFF',
                }}
              />
            ) : (
              <div style={{
                width: 50, height: 50, borderRadius: 16,
                background: offer.seller.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.6)',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>
                  {offer.seller.initials}
                </span>
              </div>
            )}
            {/* Online dot */}
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: '50%',
              backgroundColor: '#10B981',
              border: '2px solid white',
            }} />
          </div>

          {/* Name + stars + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em' }}>
                {offer.seller.name}
              </span>
              {offer.seller.isVerified && (
                <div style={{
                  width: 17, height: 17, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <Stars rating={offer.seller.rating} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>
                {offer.seller.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                ({offer.seller.reviewCount})
              </span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {offer.seller.isTopSeller && (
                <SellerBadge
                  label="Top Seller"
                  color="#D97706"
                  bg="rgba(245,158,11,0.08)"
                  border="rgba(245,158,11,0.25)"
                  icon={<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L6.7 4.3H10L7.3 6.2L8.4 9.5L5.5 7.6L2.6 9.5L3.7 6.2L1 4.3H4.3L5.5 1Z" fill="#D97706"/></svg>}
                />
              )}
              {offer.seller.isPro && (
                <SellerBadge
                  label="PRO"
                  color="#7C3AED"
                  bg="rgba(124,58,237,0.07)"
                  border="rgba(124,58,237,0.22)"
                  icon={<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><rect x="1" y="3" width="9" height="5.5" rx="1.5" stroke="#7C3AED" strokeWidth="1.1"/><path d="M3.5 3V2.5C3.5 1.9 4 1.5 4.5 1.5H6.5C7 1.5 7.5 1.9 7.5 2.5V3" stroke="#7C3AED" strokeWidth="1.1" strokeLinecap="round"/></svg>}
                />
              )}
              {offer.seller.isVerified && (
                <SellerBadge
                  label="Verified"
                  color="#059669"
                  bg="rgba(16,185,129,0.07)"
                  border="rgba(16,185,129,0.22)"
                  icon={<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L6.5 2.5H8.5V4.5L10 5.5L8.5 6.5V8.5H6.5L5.5 10L4.5 8.5H2.5V6.5L1 5.5L2.5 4.5V2.5H4.5L5.5 1Z" stroke="#059669" strokeWidth="1.1" strokeLinejoin="round"/><path d="M3.5 5.5L5 7L7.5 4" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                />
              )}
            </div>
          </div>

          {/* Compare toggle */}
          <button
            type="button"
            onClick={onToggleCompare}
            className="flex items-center justify-center transition-all active:scale-90"
            style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              border: isComparing ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
              backgroundColor: isComparing ? 'rgba(124,58,237,0.1)' : '#F9FAFB',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12M9 4L12 7L9 10M5 4L2 7L5 10" stroke={isComparing ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── Quote amount ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(168,85,247,0.06) 100%)',
          border: '1px solid rgba(124,58,237,0.12)',
          marginBottom: 12,
        }}>
          <div>
            <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Quote amount</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.03em', lineHeight: 1 }}>
                ${offer.quoteAmount.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: '#A855F7', fontWeight: 600 }}>total</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {/* Budget fit bar */}
            <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: 4 }}>vs. your budget</p>
            <div style={{ width: 80, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden', marginBottom: 3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pctOfBudget, 100)}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                style={{
                  height: '100%', borderRadius: 3,
                  backgroundColor: pctOfBudget > 100 ? '#EF4444' : pctOfBudget > 85 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
            <span style={{
              fontSize: '11px', fontWeight: 700,
              color: isUnderBudget ? '#059669' : '#DC2626',
            }}>
              {isUnderBudget ? `${pctOfBudget}% of budget` : 'Over budget'}
            </span>
          </div>
        </div>

        {/* ── Meta info: timeline + distance + submitted ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#6B7280" strokeWidth="1.2"/>
                <path d="M6 4V6L7.5 7" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{offer.timeline}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11S9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1Z" stroke="#6B7280" strokeWidth="1.2"/>
                <circle cx="6" cy="4.5" r="1.2" stroke="#6B7280" strokeWidth="1.1"/>
              </svg>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{offer.seller.distance}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.2"/>
              <path d="M6 3.5V6L7 7" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{offer.submittedAgo}</span>
          </div>
        </div>

        {/* ── Message preview ── */}
        <div style={{
          padding: '10px 12px', borderRadius: 12,
          backgroundColor: '#F9FAFB',
          border: '1px solid #F0F0F0',
          marginBottom: 14,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: -6, top: 12,
            width: 10, height: 10,
            backgroundColor: '#F9FAFB',
            border: '1px solid #F0F0F0',
            transform: 'rotate(45deg)',
            borderRight: 'none', borderTop: 'none',
          }} />
          <p style={{
            fontSize: '13px', color: '#4B5563',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{offer.messagePreview}"
          </p>
        </div>
      </div>

      {/* ── Action buttons ── */}
      {!declined && !accepted ? (
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
          {/* View Details */}
          <button
            type="button"
            onClick={onViewDetail}
            className="flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{
              flex: 1, height: 38, borderRadius: 12,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#6B7280" strokeWidth="1.3"/>
              <path d="M7 6.5V10M7 4.5V5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Details</span>
          </button>

          {/* Accept — purple */}
          <button
            type="button"
            onClick={handleAccept}
            className="flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{
              flex: 1.4, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7.5L5.5 10.5L11.5 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Accept</span>
          </button>

          {/* Decline — red outline */}
          <button
            type="button"
            onClick={handleDecline}
            className="flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{
              flex: 1, height: 38, borderRadius: 12,
              border: '1.5px solid rgba(239,68,68,0.4)',
              backgroundColor: 'rgba(239,68,68,0.04)',
              cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>Decline</span>
          </button>

          {/* Message icon */}
          <button
            type="button"
            onClick={onMessage}
            className="flex items-center justify-center transition-all active:scale-90"
            style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M14 10C14 10.55 13.55 11 13 11H5L3 13V4C3 3.45 3.45 3 4 3H13C13.55 3 14 3.45 14 4V10Z"
                stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 7H10M6 9H9" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ) : accepted ? (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px', borderRadius: 12,
            backgroundColor: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5L6 11.5L13 4.5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>Offer Accepted</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px', borderRadius: 12,
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>Offer Declined</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 32px 32px' }}>
      {/* Illustration */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 28 }}
      >
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          {/* Inbox tray */}
          <rect x="15" y="48" width="90" height="42" rx="10" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5"/>
          <path d="M15 68H44L50 78H70L76 68H105" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Floating envelope 1 */}
          <g opacity="0.35">
            <rect x="30" y="22" width="36" height="26" rx="5" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1.3"/>
            <path d="M30 27L48 37L66 27" stroke="#C4B5FD" strokeWidth="1.3" strokeLinecap="round"/>
          </g>
          {/* Floating envelope 2 */}
          <g opacity="0.55">
            <rect x="58" y="8" width="36" height="26" rx="5" fill="#EDE9FE" stroke="#A78BFA" strokeWidth="1.3"/>
            <path d="M58 13L76 23L94 13" stroke="#A78BFA" strokeWidth="1.3" strokeLinecap="round"/>
          </g>
          {/* Stars */}
          <circle cx="16" cy="14" r="2.5" fill="#DDD6FE"/>
          <circle cx="108" cy="30" r="2" fill="#C4B5FD"/>
          <circle cx="24" cy="44" r="1.5" fill="#EDE9FE"/>
          {/* Checkmark in tray */}
          <circle cx="60" cy="78" r="10" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>
          <path d="M55 78L58.5 81.5L65 74" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>

      <p style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', marginBottom: 8, letterSpacing: '-0.02em' }}>
        No offers yet
      </p>
      <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6, maxWidth: 240 }}>
        Sellers are reviewing your post. Offers will appear here as they come in — usually within a few hours.
      </p>

      {/* Pulse ring hint */}
      <motion.div
        style={{ marginTop: 28, position: 'relative', width: 52, height: 52 }}
      >
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid #A855F7',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M18 10A7 7 0 0 0 4 10c0 6-3 8-3 8h20s-3-2-3-8" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.73 19a2 2 0 0 1-3.46 0" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
      </motion.div>
      <p style={{ fontSize: '12px', color: '#A855F7', fontWeight: 600, marginTop: 10 }}>
        We'll notify you when offers arrive
      </p>
    </div>
  );
}

/* ─── Compare banner ─────────────────────────────────────────── */
function CompareBanner({ count, onClear, onCompare }: { count: number; onClear: () => void; onCompare: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 18px 28px',
            backgroundColor: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid rgba(124,58,237,0.15)',
            zIndex: 40,
            display: 'flex', gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClear}
            style={{
              height: 46, padding: '0 14px', borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              fontSize: '13px', fontWeight: 600, color: '#6B7280',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Clear ({count})
          </button>
          <button
            type="button"
            onClick={onCompare}
            className="flex items-center justify-center gap-2 transition-all active:scale-97"
            style={{
              flex: 1, height: 46, borderRadius: 14,
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(124,58,237,0.35)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11M6 5L3 8L6 11" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
              Compare {count} Offers
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export function OffersListScreen({
  postTitle,
  postBudgetMin,
  postBudgetMax,
  offers,
  onBack,
  onViewOfferDetail,
  onAccept,
  onDecline,
  onMessage,
}: OffersListScreenProps) {
  const [sort, setSort]           = useState<SortKey>('highest_rated');
  const [filter, setFilter]       = useState<FilterKey>('all');
  const [comparing, setComparing] = useState<Set<string>>(new Set());
  const [acceptingOffer, setAcceptingOffer]   = useState<Offer | null>(null);
  const [showCompare, setShowCompare]         = useState(false);

  const sortedFiltered = sortOffers(filterOffers(offers, filter), sort);
  const pendingCount   = offers.filter(o => o.status === 'pending').length;

  const toggleCompare = (id: string) => {
    setComparing(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden" style={{ position: 'relative' }}>

      {/* ── Status Bar ── */}
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

      {/* ── App Bar ── */}
      <div className="flex items-center gap-3 px-4 pb-3 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500, marginBottom: 1 }}>Offers on</p>
          <h1
            style={{
              fontSize: '16px', fontWeight: 700, color: '#1F2937',
              letterSpacing: '-0.02em', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {postTitle}
          </h1>
        </div>

        {/* Offer count bubble */}
        {offers.length > 0 && (
          <div style={{
            flexShrink: 0,
            minWidth: 36, height: 36, borderRadius: 11, padding: '0 10px',
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>
              {offers.length}
            </span>
          </div>
        )}
      </div>

      {/* ── Compare Offers top CTA (only when no selection active) ── */}
      {offers.length > 1 && comparing.size === 0 && (
        <div style={{ padding: '0 18px 12px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              // Auto-select first 2 (or 3) pending offers for a quick compare
              const pending = offers.filter(o => o.status === 'pending').slice(0, 3);
              const ids = new Set(pending.map(o => o.id));
              setComparing(ids);
              setShowCompare(true);
            }}
            className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              height: 42, borderRadius: 14,
              border: '1.5px solid #7C3AED',
              backgroundColor: 'rgba(124,58,237,0.05)',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11M6 5L3 8L6 11" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>
              Compare Offers — tap cards to select
            </span>
          </button>
        </div>
      )}

      {/* ── Sort & Filter bar ── */}
      {offers.length > 0 && (
        <>
          {/* Sort row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px 10px', flexShrink: 0,
          }}>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
              <span style={{ fontWeight: 700, color: '#1F2937' }}>{sortedFiltered.length}</span>
              {' '}offer{sortedFiltered.length !== 1 ? 's' : ''}
              {pendingCount < offers.length && (
                <span style={{ color: '#9CA3AF' }}> · {pendingCount} pending</span>
              )}
            </p>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          {/* Filter chips row */}
          <div style={{ paddingBottom: 14, flexShrink: 0 }}>
            <div
              style={{ display: 'flex', gap: 8, paddingLeft: 18, paddingRight: 18, overflowX: 'auto', scrollbarWidth: 'none' }}
            >
              {FILTER_OPTIONS.map(f => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className="flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                    style={{
                      height: 32, padding: '0 11px', borderRadius: 100,
                      border: active ? 'none' : '1.5px solid #E5E7EB',
                      background: active ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'white',
                      boxShadow: active ? '0 3px 10px rgba(124,58,237,0.28)' : 'none',
                      cursor: 'pointer', color: active ? 'white' : '#6B7280',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <span style={{ color: 'inherit' }}>{f.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'inherit', whiteSpace: 'nowrap' }}>
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, backgroundColor: '#F3F4F6', flexShrink: 0, marginBottom: 2 }} />

      {/* ── Scrollable offer list ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '14px 18px', paddingBottom: comparing.size > 0 ? 110 : 20 }}
      >
        {sortedFiltered.length === 0 ? (
          filter !== 'all' ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>No matches</p>
              <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Try removing the filter</p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                style={{
                  marginTop: 14, padding: '8px 18px', borderRadius: 12,
                  border: '1.5px solid #7C3AED',
                  backgroundColor: 'rgba(124,58,237,0.06)',
                  fontSize: '13px', fontWeight: 700, color: '#7C3AED',
                  cursor: 'pointer',
                }}
              >
                Clear filter
              </button>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sortedFiltered.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                budgetMin={postBudgetMin}
                budgetMax={postBudgetMax}
                isComparing={comparing.has(offer.id)}
                onToggleCompare={() => toggleCompare(offer.id)}
                onViewDetail={() => onViewOfferDetail?.(offer.id)}
                onAccept={() => setAcceptingOffer(offer)}
                onDecline={() => onDecline?.(offer.id)}
                onMessage={() => onMessage?.(offer.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Compare selection banner ── */}
      <CompareBanner
        count={comparing.size}
        onClear={() => setComparing(new Set())}
        onCompare={() => setShowCompare(true)}
      />

      {/* ── Accept Offer Modal ── */}
      <AnimatePresence>
        {acceptingOffer && (
          <AcceptOfferModal
            offer={acceptingOffer}
            postTitle={postTitle}
            onConfirm={(offer, method) => {
              onAccept?.(offer.id);
              setAcceptingOffer(null);
            }}
            onCancel={() => setAcceptingOffer(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Compare Offers Modal ── */}
      <AnimatePresence>
        {showCompare && comparing.size >= 2 && (
          <CompareOffersModal
            offers={offers.filter(o => comparing.has(o.id))}
            budgetMax={postBudgetMax}
            postTitle={postTitle}
            onClose={() => setShowCompare(false)}
            onAccept={(offer) => {
              setShowCompare(false);
              setAcceptingOffer(offer);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Demo data ──────────────────────────────────────────────── */
export const DEMO_OFFERS: Offer[] = [
  {
    id: '1',
    seller: {
      name: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1758600587839-56ba05596c69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      initials: 'PS',
      gradient: 'linear-gradient(135deg,#7C3AED,#A855F7)',
      rating: 4.9,
      reviewCount: 87,
      completedJobs: 124,
      responseTime: '< 30 min',
      isVerified: true,
      isTopSeller: true,
      isPro: true,
      distance: 'Remote',
      memberSince: 'Jan 2021',
    },
    quoteAmount: 3200,
    timeline: '10 days',
    messagePreview: "Hi! I've built 6 production React Native apps with TypeScript and Stripe integration. Happy to jump on a call to walk through your Figma files today.",
    submittedAgo: '1h ago',
    status: 'pending',
  },
  {
    id: '2',
    seller: {
      name: 'Marcus Webb',
      avatar: 'https://images.unsplash.com/photo-1771766691105-455a273c6ca6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      initials: 'MW',
      gradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
      rating: 4.7,
      reviewCount: 52,
      completedJobs: 68,
      responseTime: '< 2 hours',
      isVerified: true,
      isTopSeller: false,
      isPro: true,
      distance: '2.4 km',
      memberSince: 'Jun 2022',
    },
    quoteAmount: 4500,
    timeline: '7 days',
    messagePreview: "React Native expert with 5 years experience. I can start immediately. Portfolio includes two marketplace apps — one with 50k+ downloads.",
    submittedAgo: '2h ago',
    status: 'pending',
  },
  {
    id: '3',
    seller: {
      name: 'Sofia Lindgren',
      avatar: 'https://images.unsplash.com/photo-1623594675959-02360202d4d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      initials: 'SL',
      gradient: 'linear-gradient(135deg,#10B981,#3B82F6)',
      rating: 5.0,
      reviewCount: 31,
      completedJobs: 44,
      responseTime: '< 1 hour',
      isVerified: true,
      isTopSeller: true,
      isPro: false,
      distance: 'Remote',
      memberSince: 'Mar 2023',
    },
    quoteAmount: 2800,
    timeline: '14 days',
    messagePreview: "Perfect fit for this project! I specialize in two-sided marketplace apps using Zustand + React Native. Can do a free 30-min consult first.",
    submittedAgo: '3h ago',
    status: 'pending',
  },
  {
    id: '4',
    seller: {
      name: 'Dmitri Volkov',
      avatar: 'https://images.unsplash.com/photo-1678726716469-91f527c06e54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      initials: 'DV',
      gradient: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
      rating: 4.5,
      reviewCount: 19,
      completedJobs: 27,
      responseTime: '< 4 hours',
      isVerified: false,
      isTopSeller: false,
      isPro: false,
      distance: '8.1 km',
      memberSince: 'Nov 2023',
    },
    quoteAmount: 1900,
    timeline: '21 days',
    messagePreview: "I can deliver this within budget. Strong TypeScript + Node.js skills. Willing to show code samples and share GitHub profile for review.",
    submittedAgo: '4h ago',
    status: 'pending',
  },
  {
    id: '5',
    seller: {
      name: 'Amara Nwosu',
      avatar: 'https://images.unsplash.com/photo-1771072428365-f0f97d0d25b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      initials: 'AN',
      gradient: 'linear-gradient(135deg,#EC4899,#F97316)',
      rating: 4.8,
      reviewCount: 44,
      completedJobs: 61,
      responseTime: '< 1 hour',
      isVerified: true,
      isTopSeller: false,
      isPro: true,
      distance: 'Remote',
      memberSince: 'Sep 2022',
    },
    quoteAmount: 3800,
    timeline: '12 days',
    messagePreview: "Senior mobile engineer, worked at Shopify. Your project specs are clear and I have a reusable marketplace boilerplate that'll speed this up significantly.",
    submittedAgo: '5h ago',
    status: 'pending',
  },
  {
    id: '6',
    seller: {
      name: 'Leo Park',
      avatar: 'https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
      initials: 'LP',
      gradient: 'linear-gradient(135deg,#14B8A6,#6366F1)',
      rating: 4.6,
      reviewCount: 28,
      completedJobs: 39,
      responseTime: '< 3 hours',
      isVerified: true,
      isTopSeller: false,
      isPro: false,
      distance: '1.1 km',
      memberSince: 'Apr 2023',
    },
    quoteAmount: 2500,
    timeline: '18 days',
    messagePreview: "Delivered 4 marketplace apps with buyer/seller flows. TypeScript, Redux, Stripe, push notifications — all checked. Let's discuss the timeline.",
    submittedAgo: '6h ago',
    status: 'pending',
  },
  {
    id: '7',
    seller: {
      name: 'Yuki Tanaka',
      initials: 'YT',
      gradient: 'linear-gradient(135deg,#F59E0B,#10B981)',
      rating: 4.3,
      reviewCount: 11,
      completedJobs: 14,
      responseTime: '< 6 hours',
      isVerified: false,
      isTopSeller: false,
      isPro: false,
      distance: '15.2 km',
      memberSince: 'Feb 2024',
    },
    quoteAmount: 1500,
    timeline: '30 days',
    messagePreview: "New to Sorcyn but 3 years mobile dev experience. Please check my portfolio link — I'm eager to prove my skills on this exciting project.",
    submittedAgo: '8h ago',
    status: 'pending',
  },
];