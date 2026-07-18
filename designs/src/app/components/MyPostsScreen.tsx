import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export type PostStatus = 'Active' | 'Draft' | 'Filled' | 'Archived' | 'Expired';
type FilterKey = 'All' | PostStatus;
type SortKey = 'newest' | 'oldest' | 'most_offers' | 'expiring_soon' | 'budget_high' | 'budget_low';

export interface MyPost {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  budgetMin: number;
  budgetMax: number;
  status: PostStatus;
  offerCount: number;
  newOffers: number;          // unread since last visit
  postedAt: string;           // ISO or relative
  expiresInDays: number | null; // null = no expiry (Draft / Archived)
  urgency?: 'High' | 'Medium' | 'Low';
  isFeatured?: boolean;
}

export interface MyPostsScreenProps {
  onCreatePost: () => void;
  onViewPost: (id: string) => void;
  onViewOffers: (id: string) => void;
}

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CONFIG: Record<PostStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  Active:   { label: 'Active',   color: '#059669', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.25)', dot: '#10B981' },
  Draft:    { label: 'Draft',    color: '#6B7280', bg: 'rgba(107,114,128,0.09)', border: 'rgba(107,114,128,0.2)', dot: '#9CA3AF' },
  Filled:   { label: 'Filled',   color: '#7C3AED', bg: 'rgba(124,58,237,0.09)', border: 'rgba(124,58,237,0.25)', dot: '#A855F7' },
  Archived: { label: 'Archived', color: '#92400E', bg: 'rgba(180,83,9,0.09)',   border: 'rgba(180,83,9,0.22)',   dot: '#D97706' },
  Expired:  { label: 'Expired',  color: '#DC2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)', dot: '#EF4444' },
};

const FILTER_TABS: FilterKey[] = ['All', 'Active', 'Draft', 'Filled', 'Archived', 'Expired'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',       label: 'Newest First'   },
  { key: 'oldest',       label: 'Oldest First'   },
  { key: 'most_offers',  label: 'Most Offers'    },
  { key: 'expiring_soon',label: 'Expiring Soon'  },
  { key: 'budget_high',  label: 'Budget: High→Low'},
  { key: 'budget_low',   label: 'Budget: Low→High'},
];

/* ─── Demo data ──────────────────────────────────────────────── */
export const DEMO_MY_POSTS: MyPost[] = [
  {
    id: '1',
    title: 'Need a React Native developer for marketplace app',
    category: 'Software Dev',
    categoryIcon: '💻',
    budgetMin: 2000, budgetMax: 5000,
    status: 'Active',
    offerCount: 7, newOffers: 3,
    postedAt: '2h ago',
    expiresInDays: 5,
    urgency: 'High',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Looking for vintage leather sofa in great condition',
    category: 'Furniture',
    categoryIcon: '🛋️',
    budgetMin: 300, budgetMax: 800,
    status: 'Active',
    offerCount: 3, newOffers: 0,
    postedAt: '5h ago',
    expiresInDays: 11,
    urgency: 'Low',
  },
  {
    id: '3',
    title: 'Bulk order: 500 custom printed tote bags with logo',
    category: 'Print & Merch',
    categoryIcon: '🎨',
    budgetMin: 1500, budgetMax: 2500,
    status: 'Active',
    offerCount: 12, newOffers: 1,
    postedAt: '1d ago',
    expiresInDays: 2,
    urgency: 'Medium',
  },
  {
    id: '4',
    title: 'iPhone 14 Pro Max — 256GB, unlocked, any color',
    category: 'Electronics',
    categoryIcon: '📱',
    budgetMin: 700, budgetMax: 950,
    status: 'Draft',
    offerCount: 0, newOffers: 0,
    postedAt: '2d ago',
    expiresInDays: null,
    urgency: 'Medium',
  },
  {
    id: '5',
    title: 'Home cleaning service — bi-weekly, 3BR apartment',
    category: 'Home Services',
    categoryIcon: '🏠',
    budgetMin: 120, budgetMax: 200,
    status: 'Draft',
    offerCount: 0, newOffers: 0,
    postedAt: '3d ago',
    expiresInDays: null,
    urgency: 'Low',
  },
  {
    id: '6',
    title: 'Graphic designer for brand identity package',
    category: 'Design',
    categoryIcon: '✏️',
    budgetMin: 800, budgetMax: 2000,
    status: 'Filled',
    offerCount: 9, newOffers: 0,
    postedAt: '6d ago',
    expiresInDays: null,
    isFeatured: false,
  },
  {
    id: '7',
    title: 'Moving help — 2BR apartment, 15 min drive',
    category: 'Moving',
    categoryIcon: '📦',
    budgetMin: 200, budgetMax: 450,
    status: 'Filled',
    offerCount: 5, newOffers: 0,
    postedAt: '12d ago',
    expiresInDays: null,
  },
  {
    id: '8',
    title: 'Photography for product shoot — 20 items',
    category: 'Photography',
    categoryIcon: '📷',
    budgetMin: 300, budgetMax: 700,
    status: 'Archived',
    offerCount: 4, newOffers: 0,
    postedAt: '22d ago',
    expiresInDays: null,
  },
  {
    id: '9',
    title: 'Social media manager for e-commerce brand',
    category: 'Marketing',
    categoryIcon: '📣',
    budgetMin: 500, budgetMax: 1200,
    status: 'Expired',
    offerCount: 2, newOffers: 0,
    postedAt: '30d ago',
    expiresInDays: 0,
    urgency: 'High',
  },
  {
    id: '10',
    title: 'Logo redesign for food delivery startup',
    category: 'Design',
    categoryIcon: '✏️',
    budgetMin: 400, budgetMax: 900,
    status: 'Expired',
    offerCount: 6, newOffers: 0,
    postedAt: '35d ago',
    expiresInDays: 0,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function filterPosts(posts: MyPost[], filter: FilterKey): MyPost[] {
  if (filter === 'All') return posts;
  return posts.filter(p => p.status === filter);
}

function sortPosts(posts: MyPost[], sort: SortKey): MyPost[] {
  const arr = [...posts];
  switch (sort) {
    case 'newest':        return arr; // already newest-first
    case 'oldest':        return arr.reverse();
    case 'most_offers':   return arr.sort((a, b) => b.offerCount - a.offerCount);
    case 'expiring_soon': return arr.sort((a, b) => {
      const ad = a.expiresInDays ?? 9999;
      const bd = b.expiresInDays ?? 9999;
      return ad - bd;
    });
    case 'budget_high':   return arr.sort((a, b) => b.budgetMax - a.budgetMax);
    case 'budget_low':    return arr.sort((a, b) => a.budgetMin - b.budgetMin);
    default: return arr;
  }
}

/* ─── Category colour palette ────────────────────────────────── */
const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Software Dev':  { bg: 'rgba(99,102,241,0.1)',  color: '#6366F1' },
  'Furniture':     { bg: 'rgba(245,158,11,0.1)',  color: '#D97706' },
  'Print & Merch': { bg: 'rgba(236,72,153,0.1)',  color: '#DB2777' },
  'Electronics':   { bg: 'rgba(59,130,246,0.1)',  color: '#2563EB' },
  'Home Services': { bg: 'rgba(16,185,129,0.1)',  color: '#059669' },
  'Design':        { bg: 'rgba(168,85,247,0.1)',  color: '#9333EA' },
  'Moving':        { bg: 'rgba(249,115,22,0.1)',  color: '#EA580C' },
  'Photography':   { bg: 'rgba(20,184,166,0.1)',  color: '#0D9488' },
  'Marketing':     { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626' },
};
function getCatStyle(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' };
}

/* ─── Sort dropdown ──────────────────────────────────────────── */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.key === value)!;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          height: 34, padding: '0 12px',
          borderRadius: 10,
          border: '1.5px solid rgba(124,58,237,0.3)',
          backgroundColor: 'rgba(124,58,237,0.06)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5H12M4 7H10M6 10.5H8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
          {current.label}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
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
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                position: 'absolute', top: 40, right: 0,
                width: 190, borderRadius: 16,
                backgroundColor: 'white',
                boxShadow: '0 10px 36px rgba(0,0,0,0.15)',
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

/* ─── Expiry countdown chip ──────────────────────────────────── */
function ExpiryChip({ days }: { days: number | null }) {
  if (days === null) return null;
  if (days === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 7,
        backgroundColor: 'rgba(239,68,68,0.09)',
        border: '1px solid rgba(239,68,68,0.22)',
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#EF4444' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#DC2626' }}>Expired</span>
      </div>
    );
  }
  const urgent = days <= 3;
  const warn   = days <= 7;
  const color  = urgent ? '#DC2626' : warn ? '#D97706' : '#6B7280';
  const bg     = urgent ? 'rgba(239,68,68,0.08)' : warn ? 'rgba(245,158,11,0.09)' : 'rgba(107,114,128,0.07)';
  const border = urgent ? 'rgba(239,68,68,0.22)' : warn ? 'rgba(245,158,11,0.22)' : 'rgba(107,114,128,0.18)';
  const dotColor = urgent ? '#EF4444' : warn ? '#F59E0B' : '#9CA3AF';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 7,
      backgroundColor: bg, border: `1px solid ${border}`,
    }}>
      {urgent && (
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dotColor }}
        />
      )}
      {!urgent && <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dotColor }} />}
      <span style={{ fontSize: '10px', fontWeight: 700, color }}>
        {days === 1 ? 'Expires tomorrow' : `${days}d left`}
      </span>
    </div>
  );
}

/* ─── Post card ──────────────────────────────────────────────── */
function PostCard({
  post,
  onView,
  onViewOffers,
  index,
}: {
  post: MyPost;
  onView: () => void;
  onViewOffers: () => void;
  index: number;
}) {
  const sc = STATUS_CONFIG[post.status];
  const catStyle = getCatStyle(post.category);
  const isActive  = post.status === 'Active';
  const isDraft   = post.status === 'Draft';
  const isFilled  = post.status === 'Filled';
  const isExpired = post.status === 'Expired';
  const isArchived = post.status === 'Archived';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ delay: index * 0.055, type: 'spring', stiffness: 340, damping: 28 }}
      style={{
        borderRadius: 20,
        backgroundColor: 'white',
        border: `1.5px solid ${isExpired ? 'rgba(239,68,68,0.18)' : isActive && post.expiresInDays !== null && post.expiresInDays <= 3 ? 'rgba(239,68,68,0.22)' : '#EFEFEF'}`,
        boxShadow: isFilled
          ? '0 3px 14px rgba(124,58,237,0.1)'
          : isActive
          ? '0 3px 14px rgba(0,0,0,0.06)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        opacity: isArchived || isExpired ? 0.82 : 1,
      }}
    >
      {/* ── Top accent bar ── */}
      <div style={{
        height: 3,
        background: isFilled
          ? 'linear-gradient(90deg,#7C3AED,#A855F7)'
          : isActive
          ? (post.expiresInDays !== null && post.expiresInDays <= 3
            ? 'linear-gradient(90deg,#EF4444,#F97316)'
            : 'linear-gradient(90deg,#10B981,#34D399)')
          : isDraft
          ? '#E5E7EB'
          : isExpired
          ? '#EF4444'
          : '#D97706',
      }} />

      <div style={{ padding: '14px 16px 0' }}>

        {/* ── Row 1: category tag + status badge + featured ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
          {/* Category */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 7,
            backgroundColor: catStyle.bg,
          }}>
            <span style={{ fontSize: '11px' }}>{post.categoryIcon}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: catStyle.color }}>{post.category}</span>
          </div>

          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 7,
            backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
          }}>
            {isActive ? (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }}
              />
            ) : (
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }} />
            )}
            <span style={{ fontSize: '10px', fontWeight: 700, color: sc.color }}>{sc.label}</span>
          </div>

          {/* Featured badge */}
          {post.isFeatured && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 7,
              background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(239,68,68,0.08))',
              border: '1px solid rgba(245,158,11,0.3)',
            }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L6.1 3.8H9.5L6.8 5.5L7.9 8.5L5 6.8L2.1 8.5L3.2 5.5L0.5 3.8H3.9L5 1Z" fill="#D97706"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#D97706' }}>Featured</span>
            </div>
          )}

          {/* New offers dot */}
          {post.newOffers > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 20 }}
              style={{
                marginLeft: 'auto',
                width: 20, height: 20, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'white' }}>{post.newOffers}</span>
            </motion.div>
          )}
        </div>

        {/* ── Row 2: Title ── */}
        <p style={{
          fontSize: '14px', fontWeight: 700, color: isArchived || isExpired ? '#9CA3AF' : '#1F2937',
          lineHeight: 1.45, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.title}
        </p>

        {/* ── Row 3: Budget + offer count + posted ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          {/* Budget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.8" stroke="#7C3AED" strokeWidth="1.2"/>
                <path d="M6 3.5V4M6 8V8.5M4.2 7C4.2 7.66 5.02 8.2 6 8.2s1.8-.54 1.8-1.2S7 5.8 6 5.8 4.2 5.26 4.2 4.6 5.02 4 6 4s1.8.54 1.8 1.2" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.01em' }}>
              ${post.budgetMin.toLocaleString()}–${post.budgetMax.toLocaleString()}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 14, backgroundColor: '#E5E7EB' }} />

          {/* Offer count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M12.5 9C12.5 9.55 12.05 10 11.5 10H4.5L3 11.5V3.5C3 2.95 3.45 2.5 4 2.5H11.5C12.05 2.5 12.5 2.95 12.5 3.5V9Z"
                stroke={post.offerCount > 0 ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3" strokeLinejoin="round"/>
              {post.offerCount > 0 && <path d="M5.5 6.5H8.5M5.5 5H9" stroke="#7C3AED" strokeWidth="1.1" strokeLinecap="round"/>}
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: post.offerCount > 0 ? '#7C3AED' : '#9CA3AF' }}>
              {post.offerCount} offer{post.offerCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 14, backgroundColor: '#E5E7EB' }} />

          {/* Posted */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.2"/>
              <path d="M6 3.8V6L7.2 7" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>{post.postedAt}</span>
          </div>
        </div>

        {/* ── Row 4: Expiry countdown ── */}
        {(isActive || isExpired) && (
          <div style={{ marginBottom: 12 }}>
            <ExpiryChip days={post.expiresInDays} />
          </div>
        )}
      </div>

      {/* ── Action row ── */}
      <div style={{
        padding: '10px 14px 14px',
        display: 'flex', gap: 8,
      }}>
        {isDraft && (
          <>
            <button
              type="button"
              onClick={onView}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                fontSize: '12px', fontWeight: 700, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 10.5L4 9L10 3L11 4L5 10L3.5 12L2 10.5Z" stroke="#374151" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M9 4L10 5" stroke="#374151" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Edit Draft
            </button>
            <button
              type="button"
              onClick={onView}
              style={{
                flex: 1.3, height: 38, borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7L12 7M8 3L12 7L8 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Publish
            </button>
          </>
        )}

        {isActive && (
          <>
            <button
              type="button"
              onClick={onView}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#6B7280" strokeWidth="1.3"/>
                <path d="M7 6.5V10M7 4.5V5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              View
            </button>
            <button
              type="button"
              onClick={onViewOffers}
              style={{
                flex: 1.6, height: 38, borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                position: 'relative', overflow: 'hidden',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M12.5 9C12.5 9.55 12.05 10 11.5 10H4.5L3 11.5V3.5C3 2.95 3.45 2.5 4 2.5H11.5C12.05 2.5 12.5 2.95 12.5 3.5V9Z"
                  fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              View Offers
              {post.offerCount > 0 && (
                <div style={{
                  marginLeft: 2,
                  minWidth: 18, height: 18, borderRadius: 9,
                  backgroundColor: 'rgba(255,255,255,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'white' }}>{post.offerCount}</span>
                </div>
              )}
            </button>
          </>
        )}

        {isFilled && (
          <>
            <button
              type="button"
              onClick={onView}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              View Details
            </button>
            <button
              type="button"
              onClick={onViewOffers}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid rgba(124,58,237,0.3)',
                backgroundColor: 'rgba(124,58,237,0.06)',
                fontSize: '12px', fontWeight: 700, color: '#7C3AED', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5L5.5 10L11 4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {post.offerCount} Offers
            </button>
          </>
        )}

        {(isArchived || isExpired) && (
          <>
            <button
              type="button"
              onClick={onView}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                fontSize: '12px', fontWeight: 600, color: '#6B7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M7 6.5V10M7 4.5V5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              View
            </button>
            <button
              type="button"
              onClick={onView}
              style={{
                flex: 1.2, height: 38, borderRadius: 12,
                border: '1.5px solid rgba(124,58,237,0.28)',
                backgroundColor: 'rgba(124,58,237,0.05)',
                fontSize: '12px', fontWeight: 700, color: '#7C3AED', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 2.5V1L4.5 3.5L7 6V4.5C9.49 4.5 11.5 6.51 11.5 9S9.49 13.5 7 13.5 2.5 11.49 2.5 9H1C1 12.31 3.69 15 7 15S13 12.31 13 9 10.31 3 7 3l0-.5Z" fill="#7C3AED"/>
              </svg>
              Repost
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Stats row ──────────────────────────────────────────────── */
function StatsRow({ posts }: { posts: MyPost[] }) {
  const active   = posts.filter(p => p.status === 'Active').length;
  const drafts   = posts.filter(p => p.status === 'Draft').length;
  const filled   = posts.filter(p => p.status === 'Filled').length;
  const totalOffers = posts.reduce((sum, p) => sum + p.offerCount, 0);

  const stats = [
    { label: 'Active',      value: active,      color: '#059669', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Total Offers',value: totalOffers,  color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
    { label: 'Filled',      value: filled,       color: '#A855F7', bg: 'rgba(168,85,247,0.08)' },
    { label: 'Drafts',      value: drafts,       color: '#6B7280', bg: 'rgba(107,114,128,0.07)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 18px 16px', flexShrink: 0 }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, type: 'spring', stiffness: 340, damping: 26 }}
          style={{
            flex: 1, padding: '10px 8px', borderRadius: 14,
            backgroundColor: s.bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>
            {s.value}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: s.color, opacity: 0.75, textAlign: 'center', lineHeight: 1.2 }}>
            {s.label.toUpperCase()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState({ filter, onCreatePost }: { filter: FilterKey; onCreatePost: () => void }) {
  const isFiltered = filter !== 'All';

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px 60px',
    }}>
      {/* Illustration */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 28 }}
      >
        <svg width="140" height="130" viewBox="0 0 140 130" fill="none">
          {/* Shadow */}
          <ellipse cx="70" cy="124" rx="38" ry="5" fill="#F3F4F6"/>

          {/* Paper stack — back */}
          <rect x="30" y="22" width="75" height="90" rx="10" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1.4"/>
          <rect x="25" y="18" width="75" height="90" rx="10" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1.4"/>

          {/* Main paper */}
          <rect x="20" y="14" width="80" height="96" rx="12" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>

          {/* Lines */}
          <rect x="32" y="32" width="56" height="5" rx="2.5" fill="#EDE9FE"/>
          <rect x="32" y="44" width="46" height="4" rx="2" fill="#F3F4F6"/>
          <rect x="32" y="54" width="50" height="4" rx="2" fill="#F3F4F6"/>
          <rect x="32" y="64" width="38" height="4" rx="2" fill="#F3F4F6"/>

          {/* Purple CTA rect */}
          <rect x="32" y="76" width="56" height="20" rx="8" fill="url(#grad1)"/>
          <text x="60" y="90" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">Post Now</text>

          {/* Plus burst */}
          <circle cx="105" cy="28" r="18" fill="url(#grad2)" opacity="0.95"/>
          <path d="M105 20V36M97 28H113" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>

          {/* Stars */}
          <circle cx="18" cy="50" r="3" fill="#DDD6FE" opacity="0.7"/>
          <circle cx="122" cy="65" r="2.5" fill="#A78BFA" opacity="0.6"/>
          <circle cx="28" cy="110" r="2" fill="#EDE9FE"/>

          <defs>
            <linearGradient id="grad1" x1="32" y1="76" x2="88" y2="96" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/>
              <stop offset="1" stopColor="#A855F7"/>
            </linearGradient>
            <linearGradient id="grad2" x1="87" y1="10" x2="123" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/>
              <stop offset="1" stopColor="#A855F7"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <h3 style={{
        fontSize: '20px', fontWeight: 800, color: '#1F2937',
        letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center',
      }}>
        {isFiltered ? `No ${filter} posts` : 'No posts yet'}
      </h3>
      <p style={{
        fontSize: '14px', color: '#6B7280', textAlign: 'center',
        lineHeight: 1.65, maxWidth: 250, marginBottom: 28,
      }}>
        {isFiltered
          ? `You don't have any ${filter.toLowerCase()} posts at the moment.`
          : "Post what you need and let sellers compete to win your business."}
      </p>

      {!isFiltered && (
        <motion.button
          type="button"
          onClick={onCreatePost}
          whileTap={{ scale: 0.96 }}
          style={{
            height: 52, padding: '0 28px', borderRadius: 20,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '38%',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3V15M3 9H15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
            Create Your First Post
          </span>
        </motion.button>
      )}
    </div>
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export function MyPostsScreen({ onCreatePost, onViewPost, onViewOffers }: MyPostsScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort, setSort]     = useState<SortKey>('newest');
  const filterScrollRef     = useRef<HTMLDivElement>(null);

  const posts = DEMO_MY_POSTS;
  const filtered = filterPosts(posts, filter);
  const sorted   = sortPosts(filtered, sort);

  // Count per tab for badge
  const countFor = (f: FilterKey) =>
    f === 'All' ? posts.length : posts.filter(p => p.status === f).length;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#F9FAFB' }}
    >
      {/* ── Status bar ── */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 44, paddingTop: 10, backgroundColor: 'white' }}
      >
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

      {/* ── App bar ── */}
      <div style={{
        backgroundColor: 'white',
        padding: '10px 18px 14px',
        flexShrink: 0,
        borderBottom: '1px solid #F0F0F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: 900, color: '#1F2937',
              letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              My Posts
            </h1>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 2 }}>
              {posts.length} post{posts.length !== 1 ? 's' : ''} total
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SortDropdown value={sort} onChange={setSort} />
            {/* New post FAB */}
            <motion.button
              type="button"
              onClick={onCreatePost}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 38, height: 38, borderRadius: 13, flexShrink: 0,
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124,58,237,0.38)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V15M3 9H15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div
          ref={filterScrollRef}
          style={{
            display: 'flex', gap: 7,
            overflowX: 'auto', scrollbarWidth: 'none',
            paddingBottom: 2,
          }}
        >
          {FILTER_TABS.map(tab => {
            const active = filter === tab;
            const count  = countFor(tab);
            return (
              <motion.button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
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
                  transition: 'box-shadow 0.15s',
                }}
              >
                <span style={{
                  fontSize: '12px', fontWeight: 700,
                  color: active ? 'white' : '#6B7280',
                }}>
                  {tab}
                </span>
                {count > 0 && (
                  <div style={{
                    minWidth: 17, height: 17, borderRadius: 8.5,
                    backgroundColor: active ? 'rgba(255,255,255,0.28)' : 'rgba(107,114,128,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 800,
                      color: active ? 'white' : '#6B7280',
                    }}>
                      {count}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Stats row ── */}
      {filter === 'All' && (
        <div style={{ backgroundColor: 'white', paddingTop: 14 }}>
          <StatsRow posts={posts} />
        </div>
      )}

      {/* ── List ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '14px 16px 90px' }}
      >
        <AnimatePresence mode="wait">
          {sorted.length === 0 ? (
            <motion.div
              key={`empty-${filter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <EmptyState filter={filter} onCreatePost={onCreatePost} />
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filter}-${sort}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Result label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                  {sorted.length} {filter === 'All' ? '' : filter.toLowerCase() + ' '}
                  post{sorted.length !== 1 ? 's' : ''}
                </span>
                {sorted.some(p => p.newOffers > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C3AED' }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                      {sorted.reduce((s, p) => s + p.newOffers, 0)} new offer{sorted.reduce((s, p) => s + p.newOffers, 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {sorted.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onView={() => onViewPost(post.id)}
                  onViewOffers={() => onViewOffers(post.id)}
                  index={i}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
