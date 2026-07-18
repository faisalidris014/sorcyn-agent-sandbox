import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionDetailScreen, DEMO_TX_DETAIL } from './TransactionDetailScreen';
import { SellerTransactionDetailScreen, DEMO_SELLER_TX_SERVICE } from './SellerTransactionDetailScreen';

/* ─── Types ──────────────────────────────────────────────────── */
export type TxStatus = 'In Progress' | 'Awaiting Approval' | 'Completed' | 'Cancelled';
type FilterKey = 'All' | TxStatus;
type SortKey   = 'newest' | 'oldest' | 'highest' | 'lowest';

export type UserRole = 'buyer' | 'seller';

export interface Transaction {
  id: string;
  postTitle: string;
  category: string;
  categoryIcon: string;
  counterpartyName: string;
  counterpartyInitials: string;
  counterpartyGradient: string;
  counterpartyRating: number;
  counterpartyIsVerified: boolean;
  role: UserRole;            // logged-in user's role
  amount: number;
  status: TxStatus;
  dateLabel: string;         // e.g. "Apr 14"
  timeAgo: string;           // e.g. "2h ago"
  nextAction?: string;       // call-to-action label
  nextActionType: 'approve' | 'release' | 'review' | 'pay' | 'message' | 'none';
  milestonesDone: number;
  milestonesTotal: number;
  escrowHeld: boolean;
  daysActive?: number;
}

export interface TransactionsScreenProps {
  role?: UserRole;           // whose perspective
  onViewTransaction?: (id: string) => void;
}

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CFG: Record<TxStatus, {
  label: string; color: string; bg: string; border: string;
  dot: string; barGradient: string; textGlow: string;
}> = {
  'In Progress':       { label: 'In Progress',       color: '#2563EB', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.22)', dot: '#3B82F6', barGradient: 'linear-gradient(90deg,#3B82F6,#6366F1)', textGlow: 'rgba(59,130,246,0.2)' },
  'Awaiting Approval': { label: 'Awaiting Approval', color: '#B45309', bg: 'rgba(245,158,11,0.09)',  border: 'rgba(245,158,11,0.28)', dot: '#F59E0B', barGradient: 'linear-gradient(90deg,#F59E0B,#F97316)', textGlow: 'rgba(245,158,11,0.2)' },
  'Completed':         { label: 'Completed',         color: '#059669', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.22)', dot: '#10B981', barGradient: 'linear-gradient(90deg,#10B981,#34D399)', textGlow: 'rgba(16,185,129,0.18)' },
  'Cancelled':         { label: 'Cancelled',         color: '#6B7280', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.2)', dot: '#9CA3AF', barGradient: 'linear-gradient(90deg,#D1D5DB,#9CA3AF)', textGlow: 'transparent'           },
};

const NEXT_ACTION_CFG: Record<Transaction['nextActionType'], { color: string; bg: string; border: string; icon: string }> = {
  approve:  { color: '#B45309', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',  icon: '✓' },
  release:  { color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)',  icon: '↑' },
  review:   { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.3)', icon: '★' },
  pay:      { color: '#2563EB', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)',  icon: '$' },
  message:  { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)',  icon: '✉' },
  none:     { color: '#9CA3AF', bg: 'rgba(156,163,175,0.07)', border: 'rgba(156,163,175,0.18)', icon: '' },
};

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Design':        { bg: 'rgba(168,85,247,0.1)', color: '#9333EA' },
  'Software Dev':  { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' },
  'Home Services': { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  'Electronics':   { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  'Marketing':     { bg: 'rgba(239,68,68,0.1)',  color: '#DC2626' },
  'Photography':   { bg: 'rgba(20,184,166,0.1)', color: '#0D9488' },
  'Moving':        { bg: 'rgba(249,115,22,0.1)', color: '#EA580C' },
  'Writing':       { bg: 'rgba(236,72,153,0.1)', color: '#DB2777' },
  'Print & Merch': { bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
  'Education':     { bg: 'rgba(34,197,94,0.1)',  color: '#16A34A' },
};
function catStyle(c: string) {
  return CAT_COLORS[c] ?? { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' };
}

const FILTERS: FilterKey[] = ['All', 'In Progress', 'Awaiting Approval', 'Completed', 'Cancelled'];
const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'newest',  label: 'Newest First'    },
  { key: 'oldest',  label: 'Oldest First'    },
  { key: 'highest', label: 'Highest Amount'  },
  { key: 'lowest',  label: 'Lowest Amount'   },
];

/* ─── Demo data ──────────────────────────────────────────────── */
export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    postTitle: 'React Native developer for marketplace app',
    category: 'Software Dev', categoryIcon: '💻',
    counterpartyName: 'Jordan Lee', counterpartyInitials: 'JL',
    counterpartyGradient: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    counterpartyRating: 4.9, counterpartyIsVerified: true,
    role: 'buyer', amount: 3800, status: 'In Progress',
    dateLabel: 'Apr 14', timeAgo: '2d ago',
    nextAction: 'Approve Milestone 2',
    nextActionType: 'approve',
    milestonesDone: 1, milestonesTotal: 4,
    escrowHeld: true, daysActive: 8,
  },
  {
    id: 't2',
    postTitle: 'Logo + brand identity for fintech startup',
    category: 'Design', categoryIcon: '✏️',
    counterpartyName: 'Priya Sharma', counterpartyInitials: 'PS',
    counterpartyGradient: 'linear-gradient(135deg,#EC4899,#F43F5E)',
    counterpartyRating: 4.8, counterpartyIsVerified: true,
    role: 'buyer', amount: 950, status: 'Awaiting Approval',
    dateLabel: 'Apr 13', timeAgo: '3d ago',
    nextAction: 'Review Delivery',
    nextActionType: 'review',
    milestonesDone: 2, milestonesTotal: 3,
    escrowHeld: true, daysActive: 5,
  },
  {
    id: 't3',
    postTitle: 'Home cleaning service — bi-weekly 3BR',
    category: 'Home Services', categoryIcon: '🏠',
    counterpartyName: 'Tom Walsh', counterpartyInitials: 'TW',
    counterpartyGradient: 'linear-gradient(135deg,#3B82F6,#6366F1)',
    counterpartyRating: 4.6, counterpartyIsVerified: false,
    role: 'buyer', amount: 180, status: 'Completed',
    dateLabel: 'Apr 8', timeAgo: '8d ago',
    nextAction: 'Leave a Review',
    nextActionType: 'review',
    milestonesDone: 1, milestonesTotal: 1,
    escrowHeld: false,
  },
  {
    id: 't4',
    postTitle: 'Product photography — 20 items white BG',
    category: 'Photography', categoryIcon: '📷',
    counterpartyName: 'Mia Tanaka', counterpartyInitials: 'MT',
    counterpartyGradient: 'linear-gradient(135deg,#10B981,#059669)',
    counterpartyRating: 4.7, counterpartyIsVerified: true,
    role: 'buyer', amount: 560, status: 'Completed',
    dateLabel: 'Mar 29', timeAgo: '18d ago',
    nextActionType: 'none',
    milestonesDone: 2, milestonesTotal: 2,
    escrowHeld: false,
  },
  {
    id: 't5',
    postTitle: 'Social media manager — skincare brand',
    category: 'Marketing', categoryIcon: '📣',
    counterpartyName: 'Ana Torres', counterpartyInitials: 'AT',
    counterpartyGradient: 'linear-gradient(135deg,#F97316,#EAB308)',
    counterpartyRating: 4.4, counterpartyIsVerified: false,
    role: 'buyer', amount: 900, status: 'Cancelled',
    dateLabel: 'Mar 22', timeAgo: '25d ago',
    nextAction: 'Repost Request',
    nextActionType: 'none',
    milestonesDone: 0, milestonesTotal: 3,
    escrowHeld: false,
  },
  {
    id: 't6',
    postTitle: '500 custom tote bags with logo',
    category: 'Print & Merch', categoryIcon: '🎨',
    counterpartyName: 'Chris Bauer', counterpartyInitials: 'CB',
    counterpartyGradient: 'linear-gradient(135deg,#8B5CF6,#06B6D4)',
    counterpartyRating: 4.5, counterpartyIsVerified: true,
    role: 'buyer', amount: 2100, status: 'In Progress',
    dateLabel: 'Apr 15', timeAgo: '1d ago',
    nextAction: 'Message Seller',
    nextActionType: 'message',
    milestonesDone: 0, milestonesTotal: 2,
    escrowHeld: true, daysActive: 1,
  },
  {
    id: 't7',
    postTitle: 'SaaS blog — 4 posts/month ongoing',
    category: 'Writing', categoryIcon: '✍️',
    counterpartyName: 'Lena Müller', counterpartyInitials: 'LM',
    counterpartyGradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
    counterpartyRating: 5.0, counterpartyIsVerified: true,
    role: 'seller', amount: 720, status: 'Awaiting Approval',
    dateLabel: 'Apr 12', timeAgo: '4d ago',
    nextAction: 'Awaiting Buyer Approval',
    nextActionType: 'approve',
    milestonesDone: 1, milestonesTotal: 2,
    escrowHeld: true, daysActive: 4,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function filterTx(txs: Transaction[], f: FilterKey) {
  return f === 'All' ? txs : txs.filter(t => t.status === f);
}
function sortTx(txs: Transaction[], s: SortKey) {
  const arr = [...txs];
  if (s === 'oldest')  return arr.reverse();
  if (s === 'highest') return arr.sort((a, b) => b.amount - a.amount);
  if (s === 'lowest')  return arr.sort((a, b) => a.amount - b.amount);
  return arr;
}

/* ─── Milestone progress bar ─────────────────────────────────── */
function MilestoneBar({ done, total, status }: { done: number; total: number; status: TxStatus }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  const cfg = STATUS_CFG[status];
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>
          Milestone {done}/{total}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: cfg.color }}>{Math.round(pct)}%</span>
      </div>
      <div style={{
        height: 5, borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{ height: '100%', borderRadius: 3, background: cfg.barGradient }}
        />
      </div>
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
                width: 182, borderRadius: 16,
                backgroundColor: 'white',
                boxShadow: '0 12px 36px rgba(0,0,0,0.13)',
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden', transformOrigin: 'top right',
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
                  <span style={{ fontSize: '13px', fontWeight: opt.key === value ? 700 : 500, color: opt.key === value ? '#7C3AED' : '#374151' }}>{opt.label}</span>
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

/* ─── Summary stats ──────────────────────────────────────────── */
function SummaryStats({ txs }: { txs: Transaction[] }) {
  const inProgress = txs.filter(t => t.status === 'In Progress').length;
  const awaiting   = txs.filter(t => t.status === 'Awaiting Approval').length;
  const completed  = txs.filter(t => t.status === 'Completed').length;
  const totalValue = txs.filter(t => t.status !== 'Cancelled').reduce((s, t) => s + t.amount, 0);

  const stats = [
    { label: 'Active',    value: inProgress + awaiting, color: '#2563EB', bg: 'rgba(59,130,246,0.07)'   },
    { label: 'Completed', value: completed,              color: '#059669', bg: 'rgba(16,185,129,0.07)'   },
    { label: 'Volume',    value: `$${(totalValue / 1000).toFixed(1)}k`, color: '#7C3AED', bg: 'rgba(124,58,237,0.07)' },
    { label: 'In Escrow', value: txs.filter(t => t.escrowHeld).length, color: '#D97706', bg: 'rgba(245,158,11,0.07)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 16px 16px', flexShrink: 0 }}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.055, type: 'spring', stiffness: 340, damping: 26 }}
          style={{
            flex: 1, padding: '10px 6px', borderRadius: 14,
            backgroundColor: s.bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}
        >
          <span style={{
            fontSize: typeof s.value === 'string' ? '14px' : '20px',
            fontWeight: 900, color: s.color, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {s.value}
          </span>
          <span style={{
            fontSize: '9px', fontWeight: 700, color: s.color, opacity: 0.72,
            textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center',
          }}>
            {s.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Next-action pill ───────────────────────────────────────── */
function NextActionPill({ type, label }: { type: Transaction['nextActionType']; label: string }) {
  if (type === 'none') return null;
  const cfg = NEXT_ACTION_CFG[type];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 9,
      backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}`,
      flexShrink: 0,
    }}>
      <motion.div
        animate={type === 'approve' ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 1.4, repeat: Infinity }}
        style={{
          width: 16, height: 16, borderRadius: 5,
          backgroundColor: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '9px', color: 'white', fontWeight: 900 }}>{cfg.icon}</span>
      </motion.div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

/* ─── Transaction card ───────────────────────────────────────── */
function TxCard({
  tx,
  index,
  onPress,
}: {
  tx: Transaction;
  index: number;
  onPress: () => void;
}) {
  const sc  = STATUS_CFG[tx.status];
  const cs  = catStyle(tx.category);
  const isCompleted  = tx.status === 'Completed';
  const isCancelled  = tx.status === 'Cancelled';
  const isAwaiting   = tx.status === 'Awaiting Approval';
  const isInProgress = tx.status === 'In Progress';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 340, damping: 28 }}
      onClick={onPress}
      style={{
        borderRadius: 22,
        backgroundColor: 'white',
        border: `1.5px solid ${isCompleted ? 'rgba(16,185,129,0.18)' : isAwaiting ? 'rgba(245,158,11,0.22)' : isCancelled ? 'rgba(0,0,0,0.06)' : 'rgba(59,130,246,0.18)'}`,
        boxShadow: isCancelled
          ? '0 2px 8px rgba(0,0,0,0.03)'
          : isCompleted
          ? '0 4px 16px rgba(16,185,129,0.09)'
          : isAwaiting
          ? '0 4px 16px rgba(245,158,11,0.1)'
          : '0 4px 16px rgba(59,130,246,0.09)',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: isCancelled ? 0.78 : 1,
        position: 'relative',
      }}
    >
      {/* Top colour bar */}
      <div style={{ height: 4, background: sc.barGradient, opacity: isCancelled ? 0.45 : 1 }} />

      {/* Escrow watermark chip */}
      {tx.escrowHeld && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '3px 8px', borderRadius: 7,
          backgroundColor: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.22)',
          zIndex: 2,
        }}>
          <svg width="9" height="10" viewBox="0 0 10 11" fill="none">
            <rect x="1" y="5" width="8" height="5.5" rx="1.3" stroke="#D97706" strokeWidth="1.1"/>
            <path d="M3 5V4C3 2.9 3.9 2 5 2s2 .9 2 2v1" stroke="#D97706" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#D97706' }}>Escrow</span>
        </div>
      )}

      <div style={{ padding: '13px 14px 0' }}>

        {/* ── Row 1: Category + Status badge ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11, flexWrap: 'wrap', paddingRight: tx.escrowHeld ? 68 : 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 7, backgroundColor: cs.bg,
          }}>
            <span style={{ fontSize: '11px' }}>{tx.categoryIcon}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: cs.color }}>{tx.category}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 7,
            backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
          }}>
            {(isInProgress || isAwaiting) ? (
              <motion.div
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }}
              />
            ) : (
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }} />
            )}
            <span style={{ fontSize: '10px', fontWeight: 700, color: sc.color }}>{sc.label}</span>
          </div>

          {/* Role badge */}
          <div style={{
            padding: '3px 8px', borderRadius: 7,
            backgroundColor: tx.role === 'buyer' ? 'rgba(124,58,237,0.07)' : 'rgba(16,185,129,0.07)',
            border: `1px solid ${tx.role === 'buyer' ? 'rgba(124,58,237,0.2)' : 'rgba(16,185,129,0.2)'}`,
          }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: tx.role === 'buyer' ? '#7C3AED' : '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {tx.role === 'buyer' ? 'You Bought' : 'You Sold'}
            </span>
          </div>
        </div>

        {/* ── Row 2: Post title ── */}
        <p style={{
          fontSize: '14px', fontWeight: 700,
          color: isCancelled ? '#9CA3AF' : '#1F2937',
          lineHeight: 1.45, marginBottom: 13,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {tx.postTitle}
        </p>

        {/* ── Row 3: Counterparty + amount ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13,
        }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 13, flexShrink: 0,
            background: tx.counterpartyGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(0,0,0,0.13)',
            border: '2px solid rgba(255,255,255,0.8)',
            position: 'relative',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>
              {tx.counterpartyInitials}
            </span>
            {tx.counterpartyIsVerified && (
              <div style={{
                position: 'absolute', bottom: -3, right: -3,
                width: 14, height: 14, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid white',
              }}>
                <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3.5 6L6.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>

          {/* Name + rating */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{
                fontSize: '13px', fontWeight: 700, color: '#1F2937',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {tx.counterpartyName}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L6.2 3.8H9.5L6.8 5.5L7.9 8.5L5 6.8L2.1 8.5L3.2 5.5L0.5 3.8H3.8L5 1Z" fill="#F59E0B"/>
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1F2937' }}>{tx.counterpartyRating.toFixed(1)}</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>·</span>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{tx.dateLabel}</span>
              {tx.daysActive !== undefined && (
                <>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>·</span>
                  <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{tx.daysActive}d active</span>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ marginBottom: 2 }}>
              <span style={{
                fontSize: '22px', fontWeight: 900,
                color: isCancelled ? '#9CA3AF' : '#7C3AED',
                letterSpacing: '-0.03em', lineHeight: 1,
              }}>
                ${tx.amount.toLocaleString()}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>
              {tx.role === 'buyer' ? 'paid' : 'earned'}
            </span>
          </div>
        </div>

        {/* ── Row 4: Milestone progress ── */}
        {!isCancelled && (
          <div style={{ marginBottom: 13 }}>
            <MilestoneBar
              done={tx.milestonesDone}
              total={tx.milestonesTotal}
              status={tx.status}
            />
          </div>
        )}
      </div>

      {/* ── Bottom action row ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: isCancelled ? 'space-between' : 'space-between',
        padding: '10px 14px 14px', gap: 10,
        borderTop: '1px solid rgba(0,0,0,0.04)',
      }}>
        {/* Left: next action pill or status note */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tx.nextAction && tx.nextActionType !== 'none' ? (
            <NextActionPill type={tx.nextActionType} label={tx.nextAction} />
          ) : isCancelled ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M5 5L9 9M9 5L5 9" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Cancelled · {tx.timeAgo}</span>
            </div>
          ) : isCompleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 18, height: 18, borderRadius: 6,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>Completed · {tx.timeAgo}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                style={{ width: 14, height: 14, flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#E5E7EB" strokeWidth="1.5"/>
                  <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </motion.div>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Processing · {tx.timeAgo}</span>
            </div>
          )}
        </div>

        {/* Right: arrow CTA */}
        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.88 }}
          style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: isCancelled
              ? 'rgba(107,114,128,0.08)'
              : isCompleted
              ? 'rgba(16,185,129,0.1)'
              : isAwaiting
              ? 'linear-gradient(135deg,#F59E0B,#F97316)'
              : 'linear-gradient(135deg,#3B82F6,#6366F1)',
            border: isCancelled
              ? '1.5px solid rgba(107,114,128,0.2)'
              : isCompleted
              ? '1.5px solid rgba(16,185,129,0.25)'
              : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: (isInProgress || isAwaiting) ? '0 4px 12px rgba(59,130,246,0.28)' : 'none',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path
              d="M6.5 4.5L11.5 9L6.5 13.5"
              stroke={isCancelled ? '#9CA3AF' : isCompleted ? '#059669' : 'white'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Date group header ──────────────────────────────────────── */
function DateGroupHeader({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
    }}>
      <div style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }} />
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState({ filter }: { filter: FilterKey }) {
  const isFiltered = filter !== 'All';
  const statusLabel = isFiltered ? filter.toLowerCase() : '';

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px 80px',
    }}>
      {/* Animated illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 28 }}
      >
        <svg width="150" height="142" viewBox="0 0 150 142" fill="none">
          {/* Drop shadow */}
          <ellipse cx="75" cy="137" rx="42" ry="5" fill="#F3F4F6"/>

          {/* Receipt body */}
          <rect x="22" y="12" width="106" height="118" rx="14" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>

          {/* Receipt zigzag bottom */}
          <path d="M22 118 L28 124 L34 118 L40 124 L46 118 L52 124 L58 118 L64 124 L70 118 L76 124 L82 118 L88 124 L94 118 L100 124 L106 118 L112 124 L118 118 L124 124 L128 118" stroke="white" strokeWidth="2.5" fill="none"/>

          {/* Header gradient rect */}
          <rect x="34" y="24" width="82" height="28" rx="8" fill="url(#tGrad1)"/>
          <text x="75" y="34" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">TRANSACTION</text>
          <text x="75" y="45" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="7">Receipt</text>

          {/* Lines */}
          <rect x="34" y="62" width="82" height="5" rx="2.5" fill="#F3F4F6"/>
          <rect x="34" y="75" width="55" height="4" rx="2" fill="#EDE9FE"/>
          <rect x="34" y="86" width="45" height="4" rx="2" fill="#F3F4F6"/>
          <rect x="34" y="97" width="62" height="4" rx="2" fill="#F3F4F6"/>

          {/* Big amount */}
          <text x="118" y="100" textAnchor="end" fill="#7C3AED" fontSize="16" fontWeight="900">$—</text>

          {/* Floating clock / empty indicator */}
          <circle cx="116" cy="30" r="20" fill="url(#tGrad2)" opacity="0.95"/>
          <path d="M116 22v8l4 3" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>

          {/* Stars */}
          <circle cx="20" cy="62" r="3.5" fill="#DDD6FE" opacity="0.7"/>
          <circle cx="130" cy="82" r="2.5" fill="#A78BFA" opacity="0.55"/>
          <circle cx="30" cy="130" r="2" fill="#EDE9FE"/>

          <defs>
            <linearGradient id="tGrad1" x1="34" y1="24" x2="116" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
            </linearGradient>
            <linearGradient id="tGrad2" x1="96" y1="10" x2="136" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <h3 style={{
        fontSize: '21px', fontWeight: 800, color: '#1F2937',
        letterSpacing: '-0.02em', marginBottom: 10, textAlign: 'center',
      }}>
        {isFiltered ? `No ${statusLabel} transactions` : 'No transactions yet'}
      </h3>
      <p style={{
        fontSize: '14px', color: '#6B7280',
        textAlign: 'center', lineHeight: 1.65,
        maxWidth: 248,
      }}>
        {isFiltered
          ? `You don't have any ${statusLabel} transactions at the moment.`
          : 'When you accept an offer or your offer gets accepted, your transactions will appear here.'}
      </p>
    </div>
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export function TransactionsScreen({ role = 'buyer', onViewTransaction }: TransactionsScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('All');
  const [sort,   setSort  ] = useState<SortKey>('newest');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [selectedTxRole, setSelectedTxRole] = useState<UserRole>('buyer');

  const allTxs   = DEMO_TRANSACTIONS;
  const filtered = filterTx(allTxs, filter);
  const sorted   = sortTx(filtered, sort);

  const countFor = (f: FilterKey) =>
    f === 'All' ? allTxs.length : allTxs.filter(t => t.status === f).length;

  // Group into "This Week" / "Earlier"
  const thisWeek  = sorted.filter(t => ['1d ago', '2d ago', '3d ago', '4d ago', '5d ago', '2h ago', '3h ago'].includes(t.timeAgo));
  const earlier   = sorted.filter(t => !thisWeek.includes(t));

  let cardIndex = 0;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative" style={{ backgroundColor: '#F9FAFB' }}>

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
        backgroundColor: 'white',
        padding: '10px 18px 0',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: 900, color: '#1F2937',
              letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              Transactions
            </h1>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 2 }}>
              {allTxs.length} transaction{allTxs.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SortDropdown value={sort} onChange={setSort} />
            {/* Search button */}
            <button
              type="button"
              style={{
                width: 38, height: 38, borderRadius: 13, flexShrink: 0,
                backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="#6B7280" strokeWidth="1.7"/>
                <path d="M14 14L17.5 17.5" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div style={{
          display: 'flex', gap: 7,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 14,
        }}>
          {FILTERS.map(f => {
            const active = filter === f;
            const count  = countFor(f);
            const dotColor = f !== 'All' ? STATUS_CFG[f as TxStatus].dot : '';
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
                  background: active ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'white',
                  boxShadow: active ? '0 3px 12px rgba(124,58,237,0.3)' : 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                {dotColor && !active && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: dotColor, flexShrink: 0,
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
                    <span style={{ fontSize: '10px', fontWeight: 800, color: active ? 'white' : '#6B7280' }}>{count}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Summary stats (All tab) ── */}
      {filter === 'All' && (
        <div style={{ backgroundColor: 'white' }}>
          <SummaryStats txs={allTxs} />
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, backgroundColor: '#EFEFEF', flexShrink: 0 }} />

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
              <EmptyState filter={filter} />
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filter}-${sort}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              {/* Awaiting action banner */}
              {sorted.some(t => t.status === 'Awaiting Approval') && filter !== 'Completed' && filter !== 'Cancelled' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 16, marginBottom: 14,
                    background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(249,115,22,0.08))',
                    border: '1.5px solid rgba(245,158,11,0.28)',
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{
                      width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                      backgroundColor: 'rgba(245,158,11,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3L11.8 7.8H17L13 10.8L14.5 16L10 13L5.5 16L7 10.8L3 7.8H8.2L10 3Z" fill="#F59E0B"/>
                    </svg>
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', marginBottom: 1 }}>
                      Action Required
                    </p>
                    <p style={{ fontSize: '12px', color: '#B45309' }}>
                      {sorted.filter(t => t.status === 'Awaiting Approval').length} transaction{sorted.filter(t => t.status === 'Awaiting Approval').length !== 1 ? 's' : ''} need{sorted.filter(t => t.status === 'Awaiting Approval').length === 1 ? 's' : ''} your attention
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M6.5 4.5L11.5 9L6.5 13.5" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}

              {/* Result count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>
                  {sorted.length} {filter === 'All' ? '' : `${filter.toLowerCase()} `}transaction{sorted.length !== 1 ? 's' : ''}
                </span>
                {sorted.filter(t => t.escrowHeld).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
                      <rect x="1" y="5" width="8" height="5.5" rx="1.3" stroke="#D97706" strokeWidth="1.1"/>
                      <path d="M3 5V4C3 2.9 3.9 2 5 2s2 .9 2 2v1" stroke="#D97706" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706' }}>
                      {sorted.filter(t => t.escrowHeld).length} in escrow
                    </span>
                  </div>
                )}
              </div>

              {/* Groups */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {thisWeek.length > 0 && (
                  <>
                    <DateGroupHeader label="This Week" />
                    {thisWeek.map(tx => {
                      const i = cardIndex++;
                      return (
                        <TxCard key={tx.id} tx={tx} index={i} onPress={() => { onViewTransaction?.(tx.id); setSelectedTxId(tx.id); setSelectedTxRole(tx.role); }} />
                      );
                    })}
                  </>
                )}
                {earlier.length > 0 && (
                  <>
                    <DateGroupHeader label="Earlier" />
                    {earlier.map(tx => {
                      const i = cardIndex++;
                      return (
                        <TxCard key={tx.id} tx={tx} index={i} onPress={() => { onViewTransaction?.(tx.id); setSelectedTxId(tx.id); setSelectedTxRole(tx.role); }} />
                      );
                    })}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Transaction Detail slide-over ── */}
      <AnimatePresence>
        {selectedTxId && (
          <motion.div
            key="tx-detail"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: '#F9FAFB' }}
          >
            {selectedTxRole === 'seller' ? (
              <SellerTransactionDetailScreen
                tx={DEMO_SELLER_TX_SERVICE}
                onBack={() => setSelectedTxId(null)}
                onMessage={() => {}}
                onMarkComplete={() => {}}
                onReport={() => {}}
              />
            ) : (
              <TransactionDetailScreen
                tx={DEMO_TX_DETAIL}
                onBack={() => setSelectedTxId(null)}
                onMessage={() => {}}
                onApprove={() => setSelectedTxId(null)}
                onRequestChanges={() => {}}
                onReport={() => {}}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}