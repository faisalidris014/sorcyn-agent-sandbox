import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TxDetailStatus, TxDetailMilestone } from './TransactionDetailScreen';

/* ─── Delivery type ──────────────────────────────────────────── */
export type DeliveryType = 'service' | 'product' | 'pickup';

export interface SellerTxBuyer {
  name: string;
  initials: string;
  gradient: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  memberSince: string;
  totalOrders: number;
}

export interface SellerTxData {
  id: string;
  postTitle: string;
  category: string;
  categoryIcon: string;
  currentStep: TxDetailStatus;
  deliveryType: DeliveryType;
  buyer: SellerTxBuyer;
  offerAmount: number;
  platformFee: number;
  payoutDate?: string;
  payoutStatus: 'pending' | 'processing' | 'released';
  txRef: string;
  milestones: TxDetailMilestone[];
  escrowReleaseDate?: string;
  hasNewMessage?: boolean;
  /* product-only */
  carrier?: string;
  trackingNumber?: string;
  /* pickup-only */
  pickupAddress?: string;
  pickupCode?: string;
}

export interface SellerTransactionDetailScreenProps {
  tx?: SellerTxData;
  onBack: () => void;
  onMessage?: () => void;
  onMarkComplete?: () => void;
  onReport?: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
export const DEMO_SELLER_TX_SERVICE: SellerTxData = {
  id: 'stx-001',
  postTitle: 'Logo + brand identity for fintech startup',
  category: 'Design', categoryIcon: '✏️',
  currentStep: 'work_in_progress',
  deliveryType: 'service',
  buyer: {
    name: 'Marcus Chen', initials: 'MC',
    gradient: 'linear-gradient(135deg,#3B82F6,#6366F1)',
    rating: 4.7, reviews: 23, isVerified: true,
    memberSince: 'Jan 2025', totalOrders: 18,
  },
  offerAmount: 950,
  platformFee: 76,
  payoutStatus: 'pending',
  txRef: 'SRC-2026-8842',
  escrowReleaseDate: 'Apr 21, 2026',
  hasNewMessage: true,
  milestones: [
    { id: 'm1', title: 'Brand Research & Moodboard', amount: 200, status: 'done',   dueDate: 'Apr 10', deliverable: 'Delivered' },
    { id: 'm2', title: 'Logo Concepts (3 options)',  amount: 350, status: 'done',   dueDate: 'Apr 12', deliverable: 'Delivered' },
    { id: 'm3', title: 'Final Files + Brand Guide',  amount: 400, status: 'active', dueDate: 'Apr 14', deliverable: 'Upload required' },
  ],
};

export const DEMO_SELLER_TX_PRODUCT: SellerTxData = {
  id: 'stx-002',
  postTitle: 'Vintage Leica M3 camera — excellent condition',
  category: 'Electronics', categoryIcon: '📷',
  currentStep: 'seller_contacted',
  deliveryType: 'product',
  buyer: {
    name: 'Sofia Reyes', initials: 'SR',
    gradient: 'linear-gradient(135deg,#EC4899,#F43F5E)',
    rating: 5.0, reviews: 7, isVerified: false,
    memberSince: 'Mar 2026', totalOrders: 4,
  },
  offerAmount: 640,
  platformFee: 51,
  payoutStatus: 'pending',
  txRef: 'SRC-2026-9104',
  escrowReleaseDate: 'Apr 24, 2026',
  carrier: '',
  trackingNumber: '',
  milestones: [
    { id: 'm1', title: 'Item Shipped',    amount: 640, status: 'active', dueDate: 'Apr 17', deliverable: 'Enter tracking number' },
  ],
};

export const DEMO_SELLER_TX_PICKUP: SellerTxData = {
  id: 'stx-003',
  postTitle: 'IKEA KALLAX bookshelf — white, like new',
  category: 'Furniture', categoryIcon: '🛋️',
  currentStep: 'seller_contacted',
  deliveryType: 'pickup',
  buyer: {
    name: 'James Okafor', initials: 'JO',
    gradient: 'linear-gradient(135deg,#10B981,#059669)',
    rating: 4.9, reviews: 14, isVerified: true,
    memberSince: 'Sep 2024', totalOrders: 31,
  },
  offerAmount: 120,
  platformFee: 10,
  payoutStatus: 'pending',
  txRef: 'SRC-2026-9217',
  pickupAddress: '14 Maple St, Brooklyn, NY 11201',
  pickupCode: 'SRC-HO-7741',
  milestones: [
    { id: 'm1', title: 'Local Handoff',   amount: 120, status: 'active', dueDate: 'Apr 18', deliverable: 'Confirm at handoff' },
  ],
};

/* ─── Step config (seller perspective sublabels) ─────────────── */
const SELLER_STEPS: { id: TxDetailStatus; label: string; sublabel: string }[] = [
  { id: 'payment_secured',   label: 'Payment Secured',   sublabel: "Buyer's funds are in escrow"     },
  { id: 'seller_contacted',  label: 'Job Confirmed',     sublabel: 'You accepted this offer'         },
  { id: 'work_in_progress',  label: 'Work In Progress',  sublabel: "You're actively working"         },
  { id: 'awaiting_approval', label: 'Awaiting Approval', sublabel: 'Buyer is reviewing your delivery' },
  { id: 'funds_released',    label: 'Payout Released',   sublabel: 'Funds sent to your account'     },
];
const STEP_ORDER = SELLER_STEPS.map(s => s.id);
function stepIndex(id: TxDetailStatus) { return STEP_ORDER.indexOf(id); }

const PAYOUT_STATUS_CFG = {
  pending:    { label: 'Pending Buyer Approval', color: '#B45309', bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.28)', dot: '#F59E0B' },
  processing: { label: 'Processing',             color: '#2563EB', bg: 'rgba(59,130,246,0.09)', border: 'rgba(59,130,246,0.28)', dot: '#3B82F6' },
  released:   { label: 'Paid Out',               color: '#059669', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.28)', dot: '#10B981' },
};

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Design':        { bg: 'rgba(168,85,247,0.12)', color: '#9333EA' },
  'Software Dev':  { bg: 'rgba(99,102,241,0.12)', color: '#6366F1' },
  'Electronics':   { bg: 'rgba(59,130,246,0.12)', color: '#2563EB' },
  'Furniture':     { bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
  'Home Services': { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
};
function catStyle(c: string) { return CAT_COLORS[c] ?? { bg: 'rgba(124,58,237,0.12)', color: '#7C3AED' }; }

/* ─── Stars ──────────────────────────────────────────────────── */
function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1.5 }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z"
            fill={rating >= s ? '#F59E0B' : '#E5E7EB'} stroke={rating >= s ? '#F59E0B' : '#E5E7EB'} strokeWidth="0.5"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Section wrapper ────────────────────────────────────────── */
function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: 20, backgroundColor: 'white',
      border: '1.5px solid #F0F0F0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      overflow: 'hidden', marginBottom: 12, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, accent, accentColor }: {
  icon: React.ReactNode; title: string; accent?: string; accentColor?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 0' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: 'rgba(124,58,237,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.01em', flex: 1 }}>{title}</span>
      {accent && <span style={{ fontSize: '11px', fontWeight: 700, color: accentColor ?? '#7C3AED' }}>{accent}</span>}
    </div>
  );
}

/* ─── Timeline stepper (seller labels) ──────────────────────── */
function TimelineStepper({ currentStep }: { currentStep: TxDetailStatus }) {
  const cur = stepIndex(currentStep);
  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#7C3AED" strokeWidth="1.5"/><path d="M8 5V8L10 10" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        title="Transaction Status"
      />
      <div style={{ padding: '16px 16px 16px 20px' }}>
        {SELLER_STEPS.map((step, i) => {
          const isDone   = i < cur;
          const isActive = i === cur;
          const isFuture = i > cur;
          const isLast   = i === SELLER_STEPS.length - 1;
          return (
            <div key={step.id} style={{ display: 'flex', gap: 0, minHeight: isLast ? 'auto' : 54 }}>
              {/* Dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                <motion.div
                  initial={false}
                  animate={isActive ? { boxShadow: ['0 0 0 0px rgba(124,58,237,0.35)','0 0 0 6px rgba(124,58,237,0)','0 0 0 0px rgba(124,58,237,0)'] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isDone || isActive ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'white',
                    border: isFuture ? '2px solid #E5E7EB' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    boxShadow: isActive ? '0 0 0 4px rgba(124,58,237,0.18)' : isDone ? '0 3px 10px rgba(124,58,237,0.3)' : 'none',
                  }}
                >
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : isActive ? (
                    <motion.div animate={{ scale: [0.8,1.1,0.8] }} transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: 'white' }}/>
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E5E7EB' }}/>
                  )}
                </motion.div>
                {!isLast && (
                  <div style={{ width: 2, flex: 1, position: 'relative', marginTop: 3, marginBottom: 3 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 1, backgroundColor: '#F0F0F0' }}/>
                    {(isDone || isActive) && (
                      <motion.div
                        initial={{ height: '0%' }}
                        animate={{ height: isDone ? '100%' : '50%' }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 1, background: 'linear-gradient(180deg,#7C3AED,#A855F7)' }}
                      />
                    )}
                  </div>
                )}
              </div>
              {/* Text */}
              <div style={{ paddingLeft: 12, paddingBottom: isLast ? 0 : 6, flex: 1, paddingTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    fontSize: '13px', fontWeight: isActive ? 800 : isDone ? 700 : 500,
                    color: isFuture ? '#C4C9D4' : isActive ? '#7C3AED' : '#1F2937',
                  }}>
                    {step.label}
                  </span>
                  {isActive && (
                    <div style={{ padding: '2px 7px', borderRadius: 6, backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</span>
                    </div>
                  )}
                  {isDone && <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>✓</span>}
                </div>
                <p style={{ fontSize: '11px', color: isFuture ? '#D1D5DB' : isActive ? '#6B7280' : '#9CA3AF', lineHeight: 1.45 }}>
                  {step.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── Buyer card ─────────────────────────────────────────────── */
function BuyerCard({ buyer, hasNewMessage, onMessage }: {
  buyer: SellerTxBuyer; hasNewMessage?: boolean; onMessage?: () => void;
}) {
  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="#7C3AED" strokeWidth="1.4"/><path d="M2 14C2 11.24 4.69 9 8 9s6 2.24 6 5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        title="Buyer"
      />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: buyer.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            border: '2.5px solid rgba(255,255,255,0.9)',
            position: 'relative',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>{buyer.initials}</span>
            {buyer.isVerified && (
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 18, height: 18, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white',
              }}>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.5 7.5L8.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.01em' }}>{buyer.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <Stars rating={buyer.rating} size={11}/>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{buyer.rating.toFixed(1)}</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({buyer.reviews} reviews)</span>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>🗓 Since {buyer.memberSince}</span>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>📦 {buyer.totalOrders} orders</span>
              </div>
            </div>
          </div>
        </div>
        {/* Message Buyer button */}
        <button
          type="button" onClick={onMessage}
          style={{
            width: '100%', height: 46, borderRadius: 16,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 20px rgba(124,58,237,0.32)', position: 'relative', overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ x: ['-130%','230%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            style={{ position: 'absolute', top: 0, bottom: 0, width: '35%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', transform: 'skewX(-15deg)', pointerEvents: 'none' }}
          />
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
            <path d="M18 13C18 14.1 17.1 15 16 15H6L3 18V4C3 2.9 3.9 2 5 2H16C17.1 2 18 2.9 18 4V13Z"
              fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Message Buyer</span>
          {hasNewMessage && (
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#F59E0B', border: '1.5px solid rgba(255,255,255,0.8)' }}/>
          )}
        </button>
      </div>
    </Section>
  );
}

/* ─── Payout summary ─────────────────────────────────────────── */
function PayoutSummary({ tx }: { tx: SellerTxData }) {
  const payout = tx.offerAmount - tx.platformFee;
  const ps = PAYOUT_STATUS_CFG[tx.payoutStatus];
  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><path d="M1 7H15" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><circle cx="4.5" cy="10.5" r="1" fill="#7C3AED"/></svg>}
        title="Your Earnings"
      />
      <div style={{ padding: '14px 16px 0' }}>
        {/* Rows */}
        {[
          { label: 'Offer Amount',      value: `$${tx.offerAmount.toLocaleString()}`, muted: false, color: '#1F2937' },
          { label: `Platform Fee (8%)`, value: `–$${tx.platformFee.toLocaleString()}`, muted: true,  color: '#EF4444' },
        ].map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #F6F6F6' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{r.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: r.color }}>{r.value}</span>
          </div>
        ))}

        {/* YOUR PAYOUT — green highlight card */}
        <div style={{
          borderRadius: 16, padding: '14px',
          background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(52,211,153,0.06))',
          border: '1.5px solid rgba(16,185,129,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Your Payout
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#059669', letterSpacing: '-0.03em', lineHeight: 1 }}>
                ${payout.toLocaleString()}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(5,150,105,0.65)' }}>USD</span>
            </div>
          </div>
          {/* Big green tick */}
          <div style={{
            width: 52, height: 52, borderRadius: 18, flexShrink: 0,
            background: 'linear-gradient(135deg,#10B981,#34D399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(16,185,129,0.32)',
          }}>
            <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
              <path d="M5 13L10.5 18.5L21 7.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Payout status chip */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Payout Status</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 9,
            backgroundColor: ps.bg, border: `1.5px solid ${ps.border}`,
          }}>
            <motion.div
              animate={tx.payoutStatus !== 'released' ? { opacity: [1,0.25,1] } : {}}
              transition={{ duration: 1.6, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ps.dot }}
            />
            <span style={{ fontSize: '11px', fontWeight: 800, color: ps.color }}>{ps.label}</span>
          </div>
        </div>

        {/* Escrow notice */}
        {tx.escrowReleaseDate && tx.payoutStatus === 'pending' && (
          <div style={{
            marginBottom: 16, padding: '10px 12px', borderRadius: 12,
            backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="7" width="14" height="8" rx="2" stroke="#D97706" strokeWidth="1.3"/>
              <path d="M4 7V5.5C4 3.57 5.79 2 8 2s4 1.57 4 3.5V7" stroke="#D97706" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', marginBottom: 1 }}>Held in Escrow</p>
              <p style={{ fontSize: '10px', color: '#B45309' }}>Auto-releases {tx.escrowReleaseDate} if buyer doesn't act</p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ─── Milestones ─────────────────────────────────────────────── */
function MilestonesSection({ milestones }: { milestones: TxDetailMilestone[] }) {
  const total = milestones.reduce((s,m) => s + m.amount, 0);
  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        title="Milestones"
        accent={`$${total.toLocaleString()} total`}
      />
      <div style={{ padding: '14px 16px' }}>
        {milestones.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            paddingBottom: i < milestones.length - 1 ? 14 : 0,
            marginBottom: i < milestones.length - 1 ? 14 : 0,
            borderBottom: i < milestones.length - 1 ? '1px solid #F6F6F6' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: m.status === 'done' ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : m.status === 'active' ? 'rgba(124,58,237,0.1)' : '#F3F4F6',
              border: m.status === 'active' ? '2px solid rgba(124,58,237,0.4)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: m.status === 'done' ? '0 2px 8px rgba(124,58,237,0.28)' : 'none',
            }}>
              {m.status === 'done' ? (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : m.status === 'active' ? (
                <motion.div animate={{ scale: [0.7,1,0.7] }} transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7C3AED' }}/>
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D1D5DB' }}/>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: m.status === 'pending' ? '#9CA3AF' : '#1F2937' }}>{m.title}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: m.status === 'pending' ? '#9CA3AF' : '#7C3AED' }}>${m.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Due {m.dueDate}</span>
                {m.deliverable && (
                  <>
                    <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: m.status === 'done' ? '#059669' : m.status === 'active' ? '#B45309' : '#9CA3AF' }}>
                      {m.deliverable}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── Photo upload slot ──────────────────────────────────────── */
function PhotoSlot({ label, added, onAdd }: { label: string; added: boolean; onAdd: () => void }) {
  return (
    <motion.button
      type="button" onClick={onAdd} whileTap={{ scale: 0.95 }}
      style={{
        flex: 1, aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden',
        border: added ? '2px solid rgba(124,58,237,0.4)' : '2px dashed #D1D5DB',
        backgroundColor: added ? 'rgba(124,58,237,0.06)' : '#FAFAFA',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        position: 'relative',
      }}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.div key="added" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
            }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M3 10L7 14L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#7C3AED' }}>Added ✓</span>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, backgroundColor: '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="3" width="16" height="12" rx="2.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                <circle cx="9" cy="9" r="3" stroke="#9CA3AF" strokeWidth="1.3"/>
                <path d="M12.5 3L13.5 5H16" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── SERVICE action panel ───────────────────────────────────── */
function ServiceActionPanel({ onMarkComplete }: { onMarkComplete?: () => void }) {
  const [beforeAdded, setBeforeAdded] = useState(false);
  const [afterAdded,  setAfterAdded]  = useState(false);
  const [noteText, setNoteText] = useState('');
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  const canComplete = beforeAdded && afterAdded;

  const handleMarkComplete = () => {
    if (!canComplete) return;
    setCompleting(true);
    setTimeout(() => { setDone(true); onMarkComplete?.(); }, 1200);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              borderRadius: 20, backgroundColor: 'white',
              border: '1.5px solid rgba(124,58,237,0.28)',
              boxShadow: '0 8px 28px rgba(124,58,237,0.18)',
              padding: '24px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0,1.2,1] }} transition={{ duration: 0.5 }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
              }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: 4 }}>Marked as Complete!</p>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Awaiting buyer approval to release your payout.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!done && (
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="#7C3AED" strokeWidth="1.3"/><circle cx="5.5" cy="6.5" r="1.5" stroke="#7C3AED" strokeWidth="1.2"/><path d="M1 11L5 7.5L7.5 9.5L11 6L15 10" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Upload Completion Photos"
          />

          <div style={{ padding: '14px 16px' }}>
            {/* Upload slots */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <PhotoSlot label="Before" added={beforeAdded} onAdd={() => setBeforeAdded(true)}/>
              <PhotoSlot label="After"  added={afterAdded}  onAdd={() => setAfterAdded(true)}/>
            </div>
            {!canComplete && (
              <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginBottom: 14 }}>
                Tap to add before &amp; after photos to unlock completion
              </p>
            )}

            {/* Delivery note */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Delivery Note (optional)</p>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Describe what you've delivered, any files shared, login credentials, etc…"
                style={{
                  width: '100%', minHeight: 80, borderRadius: 14, padding: '12px',
                  border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
                  fontSize: '13px', color: '#1F2937', outline: 'none', resize: 'none',
                  fontFamily: 'Inter, sans-serif', lineHeight: 1.55, caretColor: '#7C3AED',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Mark as Complete */}
            <motion.button
              type="button" onClick={handleMarkComplete} whileTap={{ scale: 0.97 }}
              disabled={!canComplete || completing}
              style={{
                width: '100%', height: 52, borderRadius: 18,
                background: canComplete ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : '#F3F4F6',
                border: 'none', cursor: canComplete ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: canComplete ? '0 8px 24px rgba(124,58,237,0.32)' : 'none',
                transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
              }}
            >
              {canComplete && (
                <motion.div
                  animate={{ x: ['-130%','230%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', transform: 'skewX(-15deg)', pointerEvents: 'none' }}
                />
              )}
              {completing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" strokeDasharray="25 15"/>
                  </svg>
                </motion.div>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M3 10L8 15L17 5" stroke={canComplete ? 'white' : '#9CA3AF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: canComplete ? 'white' : '#9CA3AF', letterSpacing: '-0.01em' }}>
                    Mark as Complete
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ─── PRODUCT action panel ───────────────────────────────────── */
const CARRIERS = ['UPS', 'FedEx', 'USPS', 'DHL', 'Canada Post', 'Royal Mail', 'Other'];

function ProductActionPanel({ initialCarrier = '', initialTracking = '', onMarkShipped }: {
  initialCarrier?: string; initialTracking?: string; onMarkShipped?: () => void;
}) {
  const [carrier,  setCarrier]  = useState(initialCarrier);
  const [tracking, setTracking] = useState(initialTracking);
  const [shipped,  setShipped]  = useState(false);
  const [carrierOpen, setCarrierOpen] = useState(false);

  const canShip = carrier.trim() !== '' && tracking.trim().length >= 5;

  const handleShip = () => {
    if (!canShip) return;
    setShipped(true);
    onMarkShipped?.();
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <AnimatePresence>
        {shipped && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              borderRadius: 20, backgroundColor: 'white',
              border: '1.5px solid rgba(59,130,246,0.28)',
              boxShadow: '0 8px 28px rgba(59,130,246,0.12)',
              padding: '20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0,1.2,1] }} transition={{ duration: 0.5 }}
              style={{
                width: 52, height: 52, borderRadius: 18, flexShrink: 0,
                background: 'linear-gradient(135deg,#3B82F6,#6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
              }}>
              <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
                <path d="M3 13L8 7H20L23 13V20H3V13Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="8" cy="20" r="2" fill="white"/>
                <circle cx="18" cy="20" r="2" fill="white"/>
              </svg>
            </motion.div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937', marginBottom: 3 }}>Item Marked as Shipped!</p>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>{carrier} · {tracking}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!shipped && (
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 10L4 5H13L15 10V14H2V10Z" stroke="#7C3AED" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="5.5" cy="14" r="1.5" stroke="#7C3AED" strokeWidth="1.2"/><circle cx="11.5" cy="14" r="1.5" stroke="#7C3AED" strokeWidth="1.2"/></svg>}
            title="Shipping Details"
          />
          <div style={{ padding: '14px 16px' }}>

            {/* Carrier selector */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Carrier</p>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <button
                type="button" onClick={() => setCarrierOpen(o => !o)}
                style={{
                  width: '100%', height: 46, borderRadius: 14, padding: '0 14px',
                  border: `1.5px solid ${carrier ? 'rgba(124,58,237,0.35)' : '#E5E7EB'}`,
                  backgroundColor: carrier ? 'rgba(124,58,237,0.04)' : '#F9FAFB',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: carrier ? 700 : 400, color: carrier ? '#1F2937' : '#9CA3AF' }}>
                  {carrier || 'Select a carrier…'}
                </span>
                <motion.div animate={{ rotate: carrierOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </button>
              <AnimatePresence>
                {carrierOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 88 }} onClick={() => setCarrierOpen(false)}/>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -6 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      style={{
                        position: 'absolute', top: 50, left: 0, right: 0, zIndex: 89,
                        borderRadius: 16, backgroundColor: 'white',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.13)', border: '1px solid rgba(0,0,0,0.06)',
                        overflow: 'hidden', transformOrigin: 'top center',
                      }}
                    >
                      {CARRIERS.map((c, i) => (
                        <button
                          key={c} type="button"
                          onClick={() => { setCarrier(c); setCarrierOpen(false); }}
                          style={{
                            width: '100%', padding: '12px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: c === carrier ? 'rgba(124,58,237,0.05)' : 'none',
                            border: 'none', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: c === carrier ? 700 : 500, color: c === carrier ? '#7C3AED' : '#374151' }}>{c}</span>
                          {c === carrier && (
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Tracking number input */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Tracking Number</p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              border: `1.5px solid ${tracking.length >= 5 ? 'rgba(124,58,237,0.4)' : '#E5E7EB'}`,
              borderRadius: 14, overflow: 'hidden',
              backgroundColor: '#F9FAFB', marginBottom: 14,
              transition: 'border-color 0.2s',
            }}>
              <div style={{ padding: '0 12px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M3 8h7M3 12h4" stroke={tracking.length >= 5 ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="text"
                value={tracking}
                onChange={e => setTracking(e.target.value.toUpperCase())}
                placeholder="e.g. 1Z999AA10123456784"
                style={{
                  flex: 1, height: 46, border: 'none', outline: 'none',
                  backgroundColor: 'transparent', fontSize: '13px',
                  fontFamily: 'monospace', letterSpacing: '0.04em',
                  color: '#1F2937', caretColor: '#7C3AED',
                  paddingRight: 12,
                }}
              />
              {tracking.length >= 5 && (
                <div style={{ padding: '0 12px', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 7, background: 'linear-gradient(135deg,#10B981,#34D399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              )}
            </div>

            {/* Mark as Shipped */}
            <motion.button
              type="button" onClick={handleShip} whileTap={{ scale: 0.97 }}
              disabled={!canShip}
              style={{
                width: '100%', height: 52, borderRadius: 18,
                background: canShip ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : '#F3F4F6',
                border: 'none', cursor: canShip ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: canShip ? '0 8px 24px rgba(124,58,237,0.32)' : 'none',
                transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
              }}
            >
              {canShip && (
                <motion.div
                  animate={{ x: ['-130%','230%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', transform: 'skewX(-15deg)', pointerEvents: 'none' }}
                />
              )}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 12L5 7H16L18 12V16H3V12Z" fill={canShip ? 'rgba(255,255,255,0.2)' : 'transparent'} stroke={canShip ? 'white' : '#9CA3AF'} strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="7" cy="16" r="1.5" fill={canShip ? 'white' : '#9CA3AF'}/>
                <circle cx="14" cy="16" r="1.5" fill={canShip ? 'white' : '#9CA3AF'}/>
              </svg>
              <span style={{ fontSize: '15px', fontWeight: 800, color: canShip ? 'white' : '#9CA3AF', letterSpacing: '-0.01em' }}>
                Mark as Shipped
              </span>
            </motion.button>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ─── QR code SVG (pixel art style) ─────────────────────────── */
function QRCodeSVG({ code }: { code: string }) {
  /* Deterministic pixel pattern derived from code string */
  const grid = 21;
  const pixels: [number, number][] = [];
  // Fixed position markers (real QR codes always have these)
  const addSquare = (r: number, c: number, size: number) => {
    for (let i = r; i < r + size; i++)
      for (let j = c; j < c + size; j++) pixels.push([i, j]);
  };
  addSquare(0, 0, 7); addSquare(0, 14, 7); addSquare(14, 0, 7);
  // Quiet zone inside markers
  const quietZone: [number,number][] = [];
  for (let i = 1; i < 6; i++) { quietZone.push([i,1],[i,5]); }
  for (let j = 2; j < 5; j++) { quietZone.push([1,j],[5,j]); }
  for (let i = 1; i < 6; i++) { quietZone.push([i,15],[i,19]); }
  for (let j = 16; j < 19; j++) { quietZone.push([1,j],[5,j]); }
  for (let i = 15; i < 20; i++) { quietZone.push([i,1],[i,5]); }
  for (let j = 2; j < 5; j++) { quietZone.push([15,j],[19,j]); }
  // Inner markers
  addSquare(2,2,3); addSquare(2,16,3); addSquare(16,2,3);
  // Timing patterns
  for (let i = 0; i < 21; i++) { if (i % 2 === 0) { pixels.push([6,i],[i,6]); } }
  // Data modules - deterministic from txRef
  const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let r = 8; r < 21; r++) {
    for (let c = 8; c < 21; c++) {
      if (r >= 14 && c < 7) continue;
      const h = ((r * 31 + c * 17 + seed * 7) ^ (r << 4) ^ (c << 2)) % 100;
      if (h > 42) pixels.push([r, c]);
    }
  }
  const pixelSet = new Set(pixels.map(([r,c]) => `${r},${c}`));
  const quietSet = new Set(quietZone.map(([r,c]) => `${r},${c}`));

  const cell = 9;
  const size = grid * cell;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" rx="8"/>
      {Array.from({ length: grid }, (_, r) =>
        Array.from({ length: grid }, (_, c) => {
          const key = `${r},${c}`;
          const filled = pixelSet.has(key) && !quietSet.has(key);
          if (!filled) return null;
          return <rect key={key} x={c*cell} y={r*cell} width={cell} height={cell} fill="#1F2937" rx="1.5"/>;
        })
      )}
    </svg>
  );
}

/* ─── PICKUP action panel ────────────────────────────────────── */
function PickupActionPanel({ pickupAddress, pickupCode, onConfirmHandoff }: {
  pickupAddress?: string; pickupCode?: string; onConfirmHandoff?: () => void;
}) {
  const [qrVisible, setQrVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const code = pickupCode ?? 'SRC-HO-0000';

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => { setConfirmed(true); onConfirmHandoff?.(); }, 1200);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              borderRadius: 20, backgroundColor: 'white',
              border: '1.5px solid rgba(16,185,129,0.28)',
              boxShadow: '0 8px 28px rgba(16,185,129,0.15)',
              padding: '24px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0,1.2,1] }} transition={{ duration: 0.5 }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg,#10B981,#34D399)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
              }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: 4 }}>Handoff Confirmed! 🎉</p>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Buyer's approval will release your payout.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!confirmed && (
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 6H15L11 9L12.5 14L8 11L3.5 14L5 9L1 6H6L8 1Z" stroke="#7C3AED" strokeWidth="1.2" fill="rgba(124,58,237,0.12)"/></svg>}
            title="Local Pickup"
          />
          <div style={{ padding: '14px 16px' }}>

            {/* Address */}
            {pickupAddress && (
              <div style={{
                padding: '12px 14px', borderRadius: 14, marginBottom: 14,
                backgroundColor: '#F9FAFB', border: '1.5px solid #EFEFEF',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(124,58,237,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5Z" stroke="#7C3AED" strokeWidth="1.4"/>
                    <circle cx="8" cy="6" r="1.5" stroke="#7C3AED" strokeWidth="1.2"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: 3 }}>Pickup Address</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', lineHeight: 1.45 }}>{pickupAddress}</p>
                </div>
              </div>
            )}

            {/* Handoff code */}
            <div style={{
              padding: '12px 14px', borderRadius: 14, marginBottom: 14,
              background: 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(168,85,247,0.04))',
              border: '1.5px solid rgba(124,58,237,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: 4 }}>Handoff Code</p>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#7C3AED', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{code}</p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(code)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(124,58,237,0.3)',
                  backgroundColor: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="5" width="9" height="10" rx="2" stroke="#7C3AED" strokeWidth="1.3"/>
                  <path d="M5 4V3C5 2.45 5.45 2 6 2h7c.55 0 1 .45 1 1v9c0 .55-.45 1-1 1H12" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Generate QR Code toggle */}
            <motion.button
              type="button" onClick={() => setQrVisible(v => !v)} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: 46, borderRadius: 16, marginBottom: 10,
                border: '1.5px solid rgba(124,58,237,0.35)',
                background: qrVisible ? 'rgba(124,58,237,0.06)' : 'white',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="#7C3AED" strokeWidth="1.5"/>
                <rect x="12" y="1" width="7" height="7" rx="1.5" stroke="#7C3AED" strokeWidth="1.5"/>
                <rect x="1" y="12" width="7" height="7" rx="1.5" stroke="#7C3AED" strokeWidth="1.5"/>
                <rect x="3" y="3" width="3" height="3" fill="#7C3AED"/>
                <rect x="14" y="3" width="3" height="3" fill="#7C3AED"/>
                <rect x="3" y="14" width="3" height="3" fill="#7C3AED"/>
                <path d="M13 13H14M14 13H15M15 13V14M15 14H16M16 14V15M16 15H17M17 15V16M17 16H18M13 15H14M14 15V16M14 16H15M13 17H14M14 17V18M15 17H16M16 17V18M17 18H18" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>
                {qrVisible ? 'Hide QR Code' : 'Generate QR Code'}
              </span>
              <motion.div animate={{ rotate: qrVisible ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5L7 9L11 5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </motion.button>

            {/* QR code panel */}
            <AnimatePresence>
              {qrVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ overflow: 'hidden', marginBottom: 12 }}
                >
                  <div style={{
                    borderRadius: 18, backgroundColor: '#F9FAFB',
                    border: '1.5px solid #EFEFEF',
                    padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  }}>
                    {/* QR frame */}
                    <div style={{
                      padding: 12, borderRadius: 18, backgroundColor: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1.5px solid #EEEEEE',
                    }}>
                      <QRCodeSVG code={code}/>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', marginBottom: 3 }}>Show to Buyer at Pickup</p>
                      <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Buyer scans this to confirm identity before handoff</p>
                    </div>
                    {/* Pulse ring around QR hint */}
                    <div style={{
                      padding: '5px 14px', borderRadius: 10,
                      backgroundColor: 'rgba(124,58,237,0.08)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C3AED' }}/>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>Live • Expires in 24h</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm Handoff */}
            <motion.button
              type="button" onClick={handleConfirm} whileTap={{ scale: 0.97 }}
              disabled={confirming}
              style={{
                width: '100%', height: 52, borderRadius: 18,
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: '0 8px 24px rgba(124,58,237,0.32)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <motion.div
                animate={{ x: ['-130%','230%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', transform: 'skewX(-15deg)', pointerEvents: 'none' }}
              />
              {confirming ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" strokeDasharray="25 15"/></svg>
                </motion.div>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M7 10L9 12.5L13 8M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Confirm Handoff</span>
                </>
              )}
            </motion.button>

            <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
              Only confirm once the buyer has received the item in person
            </p>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ─── Delivery type tab switcher ─────────────────────────────── */
const DELIVERY_DEMOS: Record<DeliveryType, SellerTxData> = {
  service: DEMO_SELLER_TX_SERVICE,
  product: DEMO_SELLER_TX_PRODUCT,
  pickup:  DEMO_SELLER_TX_PICKUP,
};
const DELIVERY_LABELS: Record<DeliveryType, { label: string; icon: string }> = {
  service: { label: 'Service',  icon: '🛠' },
  product: { label: 'Product',  icon: '📦' },
  pickup:  { label: 'Pickup',   icon: '🤝' },
};

/* ─── Main screen ────────────────────────────────────────────── */
export function SellerTransactionDetailScreen({
  tx: txProp,
  onBack,
  onMessage,
  onMarkComplete,
  onReport,
}: SellerTransactionDetailScreenProps) {
  const [deliveryTab, setDeliveryTab] = useState<DeliveryType>('service');
  const tx = txProp ?? DELIVERY_DEMOS[deliveryTab];

  const cs = catStyle(tx.category);
  const ps = PAYOUT_STATUS_CFG[tx.payoutStatus];
  const payout = tx.offerAmount - tx.platformFee;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#F9FAFB' }}>

      {/* ── Status bar ── */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px 0', backgroundColor: 'white', flexShrink: 0 }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M0 4.8C2.67 2.06 6.15.5 8 .5s5.33 1.56 8 4.3L14.4 6.5C12.27 4.22 10.22 3 8 3S3.73 4.22 1.6 6.5L0 4.8Z" fill="#1F2937"/><path d="M8 6.5c1.1 0 2.27.5 3.2 1.35L9.6 9.5A2.5 2.5 0 0 0 8 9a2.5 2.5 0 0 0-1.6.5L4.8 7.85C5.73 7 6.9 6.5 8 6.5Z" fill="#1F2937"/><circle cx="8" cy="11.5" r="1" fill="#1F2937"/></svg>
          <svg width="15" height="11" viewBox="0 0 16 12" fill="none"><rect x="1" y="1" width="12" height="10" rx="2" stroke="#1F2937" strokeWidth="1.4"/><rect x="14" y="4" width="1.5" height="4" rx="0.75" fill="#1F2937"/><rect x="2.5" y="2.5" width="9" height="7" rx="1.2" fill="#1F2937"/></svg>
        </div>
      </div>

      {/* ── App bar ── */}
      <div style={{ backgroundColor: 'white', padding: '8px 16px 14px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button type="button" onClick={onBack} whileTap={{ scale: 0.88 }}
            style={{ width: 38, height: 38, borderRadius: 13, flexShrink: 0, backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M12.5 5L7.5 10L12.5 15" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <h1 style={{ fontSize: '17px', fontWeight: 900, color: '#1F2937', letterSpacing: '-0.02em', margin: 0 }}>Transaction Detail</h1>
              {/* Seller badge */}
              <div style={{ padding: '2px 8px', borderRadius: 7, backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seller View</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Ref: {tx.txRef}</span>
          </div>

          <button type="button" style={{ width: 38, height: 38, borderRadius: 13, flexShrink: 0, backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="5" r="1.5" fill="#6B7280"/><circle cx="10" cy="10" r="1.5" fill="#6B7280"/><circle cx="10" cy="15" r="1.5" fill="#6B7280"/></svg>
          </button>
        </div>
      </div>

      {/* ── Delivery type demo switcher (dev helper) ── */}
      {!txProp && (
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0', padding: '0 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, paddingBottom: 10, paddingTop: 10 }}>
            {(Object.keys(DELIVERY_LABELS) as DeliveryType[]).map(dt => {
              const active = deliveryTab === dt;
              const dl = DELIVERY_LABELS[dt];
              return (
                <motion.button key={dt} type="button" onClick={() => setDeliveryTab(dt)} whileTap={{ scale: 0.94 }}
                  style={{
                    flex: 1, height: 34, borderRadius: 10,
                    border: active ? 'none' : '1.5px solid #E5E7EB',
                    background: active ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'white',
                    boxShadow: active ? '0 3px 10px rgba(124,58,237,0.28)' : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{dl.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: active ? 'white' : '#6B7280' }}>{dl.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 16px 32px' }}>

        {/* ── Hero banner (green earnings focus) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{
            borderRadius: 20, marginBottom: 12, overflow: 'hidden',
            background: 'linear-gradient(135deg,#059669 0%,#10B981 55%,#34D399 100%)',
            boxShadow: '0 10px 32px rgba(5,150,105,0.3)',
          }}
        >
          <div style={{ position: 'relative', padding: '18px 18px 16px' }}>
            <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.18) 0%,transparent 70%)', pointerEvents: 'none' }}/>

            {/* Post info row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '22px' }}>{tx.categoryIcon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ padding: '2px 8px', borderRadius: 7, backgroundColor: cs.bg }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: cs.color }}>{tx.category}</span>
                  </div>
                  {/* Delivery type badge */}
                  <div style={{ padding: '2px 8px', borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.22)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>
                      {DELIVERY_LABELS[tx.deliveryType].icon} {DELIVERY_LABELS[tx.deliveryType].label}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 800, color: 'white', lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                  {tx.postTitle}
                </p>
              </div>
            </div>

            {/* Payout row */}
            <div style={{
              marginTop: 14, padding: '12px 14px', borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 3 }}>Your Payout</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: '30px', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    ${payout.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>USD</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: ps.payoutStatus === 'released' ? '#4ADE80' : 'rgba(255,255,255,0.7)' }}/>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{ps.label}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 3 }}>Offer Amount</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>${tx.offerAmount.toLocaleString()}</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>–${tx.platformFee} fee</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Timeline ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <TimelineStepper currentStep={tx.currentStep}/>
        </motion.div>

        {/* ── Delivery action panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tx.deliveryType}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.12, duration: 0.22 }}
          >
            {tx.deliveryType === 'service' && (
              <ServiceActionPanel onMarkComplete={onMarkComplete}/>
            )}
            {tx.deliveryType === 'product' && (
              <ProductActionPanel
                initialCarrier={tx.carrier}
                initialTracking={tx.trackingNumber}
              />
            )}
            {tx.deliveryType === 'pickup' && (
              <PickupActionPanel
                pickupAddress={tx.pickupAddress}
                pickupCode={tx.pickupCode}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Buyer card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <BuyerCard buyer={tx.buyer} hasNewMessage={tx.hasNewMessage} onMessage={onMessage}/>
        </motion.div>

        {/* ── Payout summary ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <PayoutSummary tx={tx}/>
        </motion.div>

        {/* ── Milestones ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <MilestonesSection milestones={tx.milestones}/>
        </motion.div>

        {/* ── Report problem ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
          style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <button type="button" onClick={onReport}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/><path d="M8 5v3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="#9CA3AF"/></svg>
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Having an issue?</span>
            <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 700, textDecoration: 'underline', textDecorationColor: 'rgba(124,58,237,0.4)', textUnderlineOffset: '3px' }}>
              Report a problem
            </span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
