import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export type TxDetailStatus =
  | 'payment_secured'
  | 'seller_contacted'
  | 'work_in_progress'
  | 'awaiting_approval'
  | 'completed'
  | 'funds_released';

export interface TxDetailSeller {
  name: string;
  initials: string;
  gradient: string;
  rating: number;
  reviews: number;
  isVerified: boolean;
  responseTime: string;
  completionRate: number;
  jobsDone: number;
}

export interface TxDetailMilestone {
  id: string;
  title: string;
  amount: number;
  status: 'done' | 'active' | 'pending';
  dueDate: string;
  deliverable?: string;
}

export interface TxDetailData {
  id: string;
  postTitle: string;
  category: string;
  categoryIcon: string;
  currentStep: TxDetailStatus;
  seller: TxDetailSeller;
  amountPaid: number;
  platformFee: number;
  paymentMethod: string;
  paymentLast4: string;
  paymentDate: string;
  txRef: string;
  milestones: TxDetailMilestone[];
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  deliveryNote?: string;
  escrowReleaseDate?: string;
  hasNewMessage?: boolean;
}

export interface TransactionDetailScreenProps {
  tx?: TxDetailData;
  onBack: () => void;
  onMessage?: () => void;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onReport?: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
const BEFORE_IMG = 'https://images.unsplash.com/photo-1753164597585-6d42636ea099?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFuayUyMGNhbnZhcyUyMHNrZXRjaCUyMHdpcmVmcmFtZSUyMGRlc2lnbiUyMHByb2Nlc3N8ZW58MXx8fHwxNzc2MzIxMDk3fDA&ixlib=rb-4.1.0&q=80&w=1080';
const AFTER_IMG  = 'https://images.unsplash.com/photo-1763705857736-2b4f16a33758?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wbGV0ZWQlMjBicmFuZCUyMGlkZW50aXR5JTIwZGVzaWduJTIwcmVzdWx0fGVufDF8fHx8MTc3NjMyMTA5Mnww&ixlib=rb-4.1.0&q=80&w=1080';

export const DEMO_TX_DETAIL: TxDetailData = {
  id: 'tx-001',
  postTitle: 'Logo + brand identity for fintech startup',
  category: 'Design', categoryIcon: '✏️',
  currentStep: 'awaiting_approval',
  seller: {
    name: 'Priya Sharma', initials: 'PS',
    gradient: 'linear-gradient(135deg,#EC4899,#F43F5E)',
    rating: 4.8, reviews: 61, isVerified: true,
    responseTime: '< 1 hr', completionRate: 98, jobsDone: 124,
  },
  amountPaid: 950,
  platformFee: 76,
  paymentMethod: 'Visa',
  paymentLast4: '4242',
  paymentDate: 'Apr 13, 2026',
  txRef: 'SRC-2026-8842',
  milestones: [
    { id: 'm1', title: 'Brand Research & Moodboard',   amount: 200, status: 'done',    dueDate: 'Apr 10', deliverable: 'Moodboard PDF delivered' },
    { id: 'm2', title: 'Logo Concepts (3 options)',    amount: 350, status: 'done',    dueDate: 'Apr 12', deliverable: 'Concepts shared via Drive' },
    { id: 'm3', title: 'Final Files + Brand Guide',    amount: 400, status: 'active',  dueDate: 'Apr 14', deliverable: 'Awaiting your approval' },
  ],
  beforePhotoUrl: BEFORE_IMG,
  afterPhotoUrl:  AFTER_IMG,
  deliveryNote: "Hi! All final files are uploaded — full brand guide PDF, SVG/PNG logo in all variants, and the colour palette + typography sheet. Really happy with how this turned out. Let me know if you'd like any tweaks! 🎨",
  escrowReleaseDate: 'Apr 21, 2026',
  hasNewMessage: true,
};

/* ─── Step config ────────────────────────────────────────────── */
const STEPS: { id: TxDetailStatus; label: string; sublabel: string }[] = [
  { id: 'payment_secured',   label: 'Payment Secured',   sublabel: 'Funds held in escrow'       },
  { id: 'seller_contacted',  label: 'Seller Contacted',  sublabel: 'Work agreement confirmed'   },
  { id: 'work_in_progress',  label: 'Work In Progress',  sublabel: 'Seller is actively working' },
  { id: 'awaiting_approval', label: 'Awaiting Approval', sublabel: 'Review & approve delivery'  },
  { id: 'funds_released',    label: 'Funds Released',    sublabel: 'Transaction complete'       },
];

const STEP_ORDER = STEPS.map(s => s.id);

function stepIndex(id: TxDetailStatus) { return STEP_ORDER.indexOf(id); }

/* ─── Helpers ────────────────────────────────────────────────── */
function Stars({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1.5 }}>
      {[1,2,3,4,5].map(s => (
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

/* ─── Section card wrapper ───────────────────────────────────── */
function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: 20, backgroundColor: 'white',
      border: '1.5px solid #F0F0F0',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      overflow: 'hidden', marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, accent }: { icon: React.ReactNode; title: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 16px 0',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: 'rgba(124,58,237,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.01em', flex: 1 }}>
        {title}
      </span>
      {accent && (
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>{accent}</span>
      )}
    </div>
  );
}

/* ─── Timeline stepper ───────────────────────────────────────── */
function TimelineStepper({ currentStep }: { currentStep: TxDetailStatus }) {
  const cur = stepIndex(currentStep);

  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#7C3AED" strokeWidth="1.5"/><path d="M8 5V8L10 10" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        title="Transaction Status"
      />
      <div style={{ padding: '16px 16px 16px 20px' }}>
        {STEPS.map((step, i) => {
          const isDone    = i < cur;
          const isActive  = i === cur;
          const isFuture  = i > cur;
          const isLast    = i === STEPS.length - 1;

          return (
            <div key={step.id} style={{ display: 'flex', gap: 0, minHeight: isLast ? 'auto' : 54 }}>

              {/* ── Left: dot + line column ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>

                {/* Step dot */}
                <motion.div
                  initial={false}
                  animate={isActive ? {
                    boxShadow: ['0 0 0 0px rgba(124,58,237,0.35)', '0 0 0 6px rgba(124,58,237,0)', '0 0 0 0px rgba(124,58,237,0)'],
                  } : {}}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isDone
                      ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                      : isActive
                      ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                      : 'white',
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
                    <motion.div
                      animate={{ scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: 'white' }}
                    />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E5E7EB' }} />
                  )}
                </motion.div>

                {/* Connecting line */}
                {!isLast && (
                  <div style={{ width: 2, flex: 1, position: 'relative', marginTop: 3, marginBottom: 3 }}>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 1,
                      backgroundColor: '#F0F0F0',
                    }} />
                    {(isDone || isActive) && (
                      <motion.div
                        initial={{ height: '0%' }}
                        animate={{ height: isDone ? '100%' : isActive ? '50%' : '0%' }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                        style={{
                          position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 1,
                          background: 'linear-gradient(180deg,#7C3AED,#A855F7)',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* ── Right: text ── */}
              <div style={{
                paddingLeft: 12, paddingBottom: isLast ? 0 : 6,
                flex: 1, paddingTop: 2,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    fontSize: '13px', fontWeight: isActive ? 800 : isDone ? 700 : 500,
                    color: isFuture ? '#C4C9D4' : isActive ? '#7C3AED' : '#1F2937',
                    letterSpacing: isActive ? '-0.01em' : 'normal',
                  }}>
                    {step.label}
                  </span>
                  {isActive && (
                    <div style={{
                      padding: '2px 7px', borderRadius: 6,
                      backgroundColor: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.22)',
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Current
                      </span>
                    </div>
                  )}
                  {isDone && (
                    <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>✓</span>
                  )}
                </div>
                <p style={{
                  fontSize: '11px',
                  color: isFuture ? '#D1D5DB' : isActive ? '#6B7280' : '#9CA3AF',
                  lineHeight: 1.45,
                }}>
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

/* ─── Seller card ────────────────────────────────────────────── */
function SellerCard({ seller, hasNewMessage, onMessage }: {
  seller: TxDetailSeller;
  hasNewMessage?: boolean;
  onMessage?: () => void;
}) {
  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="#7C3AED" strokeWidth="1.4"/><path d="M2 14C2 11.24 4.69 9 8 9s6 2.24 6 5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        title="Seller"
      />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: seller.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            border: '2.5px solid rgba(255,255,255,0.9)',
            position: 'relative',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>{seller.initials}</span>
            {seller.isVerified && (
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
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.01em' }}>
                {seller.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <Stars rating={seller.rating} size={11} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{seller.rating.toFixed(1)}</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({seller.reviews})</span>
            </div>
            {/* Stat chips */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>⚡ {seller.responseTime}</span>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>✓ {seller.completionRate}% complete</span>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>🏆 {seller.jobsDone} jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message button */}
        <button
          type="button"
          onClick={onMessage}
          style={{
            width: '100%', height: 46, borderRadius: 16,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 6px 20px rgba(124,58,237,0.32)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-130%', '230%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '35%',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
            <path d="M18 13C18 14.1 17.1 15 16 15H6L3 18V4C3 2.9 3.9 2 5 2H16C17.1 2 18 2.9 18 4V13Z"
              fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Message Seller</span>
          {hasNewMessage && (
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              backgroundColor: '#F59E0B', border: '1.5px solid rgba(255,255,255,0.8)',
            }} />
          )}
        </button>
      </div>
    </Section>
  );
}

/* ─── Payment summary ────────────────────────────────────────── */
function PaymentSummary({ tx }: { tx: TxDetailData }) {
  const total = tx.amountPaid + tx.platformFee;
  const rows: { label: string; value: string; accent?: boolean; large?: boolean; muted?: boolean }[] = [
    { label: 'Service Amount',   value: `$${tx.amountPaid.toLocaleString()}` },
    { label: 'Platform Fee (8%)', value: `$${tx.platformFee.toLocaleString()}`, muted: true },
    { label: 'Total Charged',    value: `$${total.toLocaleString()}`, large: true, accent: true },
    { label: 'Payment Method',   value: `${tx.paymentMethod} •••• ${tx.paymentLast4}` },
    { label: 'Date',             value: tx.paymentDate },
    { label: 'Reference',        value: tx.txRef, muted: true },
  ];

  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><path d="M1 7H15" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><circle cx="4.5" cy="10.5" r="1" fill="#7C3AED"/></svg>}
        title="Payment Summary"
      />
      <div style={{ padding: '14px 16px 4px' }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 12, marginBottom: 12,
            borderBottom: i < rows.length - 1 ? '1px solid #F6F6F6' : 'none',
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{r.label}</span>
            <span style={{
              fontSize: r.large ? '18px' : '13px',
              fontWeight: r.large ? 900 : r.accent ? 700 : 600,
              color: r.accent ? '#7C3AED' : r.muted ? '#9CA3AF' : '#1F2937',
              letterSpacing: r.large ? '-0.02em' : 'normal',
            }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* Escrow notice */}
      {tx.escrowReleaseDate && (
        <div style={{
          margin: '0 16px 16px',
          padding: '10px 12px',
          borderRadius: 12,
          backgroundColor: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.22)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="7" width="14" height="8" rx="2" stroke="#D97706" strokeWidth="1.3"/>
            <path d="M4 7V5.5C4 3.57 5.79 2 8 2s4 1.57 4 3.5V7" stroke="#D97706" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', marginBottom: 1 }}>Funds in Escrow</p>
            <p style={{ fontSize: '10px', color: '#B45309' }}>Auto-release on {tx.escrowReleaseDate} if no action taken</p>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ─── Milestones ─────────────────────────────────────────────── */
function MilestonesSection({ milestones }: { milestones: TxDetailMilestone[] }) {
  const totalAmount = milestones.reduce((s, m) => s + m.amount, 0);
  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        title="Milestones"
        accent={`$${totalAmount.toLocaleString()} total`}
      />
      <div style={{ padding: '14px 16px' }}>
        {milestones.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            paddingBottom: i < milestones.length - 1 ? 14 : 0,
            marginBottom: i < milestones.length - 1 ? 14 : 0,
            borderBottom: i < milestones.length - 1 ? '1px solid #F6F6F6' : 'none',
          }}>
            {/* Status circle */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: m.status === 'done'
                ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                : m.status === 'active'
                ? 'rgba(124,58,237,0.1)'
                : '#F3F4F6',
              border: m.status === 'active' ? '2px solid rgba(124,58,237,0.4)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: m.status === 'done' ? '0 2px 8px rgba(124,58,237,0.28)' : 'none',
            }}>
              {m.status === 'done' ? (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : m.status === 'active' ? (
                <motion.div
                  animate={{ scale: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7C3AED' }}
                />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{
                  fontSize: '13px', fontWeight: 700,
                  color: m.status === 'pending' ? '#9CA3AF' : '#1F2937',
                }}>
                  {m.title}
                </span>
                <span style={{
                  fontSize: '13px', fontWeight: 800,
                  color: m.status === 'done' ? '#7C3AED' : m.status === 'active' ? '#7C3AED' : '#9CA3AF',
                }}>
                  ${m.amount.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Due {m.dueDate}</span>
                {m.deliverable && (
                  <>
                    <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 600,
                      color: m.status === 'done' ? '#059669' : m.status === 'active' ? '#B45309' : '#9CA3AF',
                    }}>
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

/* ─── Before/After photos ────────────────────────────────────── */
function BeforeAfterSection({ beforeUrl, afterUrl, deliveryNote }: {
  beforeUrl?: string; afterUrl?: string; deliveryNote?: string;
}) {
  const [expandedPhoto, setExpandedPhoto] = useState<'before' | 'after' | null>(null);

  return (
    <>
      <Section>
        <SectionHeader
          icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><circle cx="5.5" cy="6.5" r="1.5" stroke="#7C3AED" strokeWidth="1.2"/><path d="M1 11L5 7.5L7.5 9.5L11 6L15 10" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          title="Delivery Photos"
        />

        {/* Delivery note */}
        {deliveryNote && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{
              padding: '12px', borderRadius: 14,
              backgroundColor: '#F9FAFB', border: '1px solid #EFEFEF',
              display: 'flex', gap: 8,
            }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '11px', color: 'white' }}>PS</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6, fontStyle: 'italic', flex: 1 }}>
                "{deliveryNote}"
              </p>
            </div>
          </div>
        )}

        {/* Photo grid */}
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { key: 'before' as const, url: beforeUrl, label: 'Before', badge: '📋', badgeBg: 'rgba(99,102,241,0.85)' },
            { key: 'after'  as const, url: afterUrl,  label: 'After',  badge: '✨', badgeBg: 'rgba(16,185,129,0.85)' },
          ].map(photo => (
            <div
              key={photo.key}
              onClick={() => photo.url && setExpandedPhoto(photo.key)}
              style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: photo.url ? 'pointer' : 'default', aspectRatio: '4/3' }}
            >
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '24px' }}>📷</span>
                </div>
              )}
              {/* Label overlay */}
              <div style={{
                position: 'absolute', bottom: 7, left: 7,
                padding: '3px 9px', borderRadius: 8,
                backgroundColor: photo.badgeBg,
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: '10px' }}>{photo.badge}</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'white' }}>{photo.label}</span>
              </div>
              {/* Expand hint */}
              {photo.url && (
                <div style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 22, height: 22, borderRadius: 7,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M8 1H11V4M4 11H1V8M11 1L7 5M1 11L5 7" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Fullscreen photo viewer ── */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedPhoto(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              src={expandedPhoto === 'before' ? beforeUrl : afterUrl}
              alt={expandedPhoto}
              style={{ maxWidth: '90%', maxHeight: '80%', borderRadius: 18, objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              style={{
                position: 'absolute', top: 48, right: 20,
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M4 4L14 14M14 4L4 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={{
              position: 'absolute', bottom: 60,
              padding: '6px 16px', borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Tap anywhere to close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Contextual action buttons ──────────────────────────────── */
function ContextualActions({
  currentStep, onApprove, onRequestChanges,
}: {
  currentStep: TxDetailStatus;
  onApprove?: () => void;
  onRequestChanges?: () => void;
}) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [changesText, setChangesText] = useState('');
  const [approveSuccess, setApproveSuccess] = useState(false);

  const showApprove = currentStep === 'awaiting_approval';
  if (!showApprove) return null;

  const handleApprove = () => {
    setApproveSuccess(true);
    setTimeout(() => { onApprove?.(); }, 1200);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Approve success overlay */}
      <AnimatePresence>
        {approveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              borderRadius: 20, overflow: 'hidden',
              backgroundColor: 'white',
              border: '1.5px solid rgba(16,185,129,0.3)',
              boxShadow: '0 8px 28px rgba(16,185,129,0.2)',
              padding: '24px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg,#10B981,#34D399)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <path d="M5 14L11 20L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: 4 }}>Funds Released!</p>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Payment sent to seller. Transaction complete.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!approveSuccess && (
        <Section>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                  backgroundColor: 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1.5L7.2 4.5H10.5L7.8 6.4L8.7 9.5L6 7.8L3.3 9.5L4.2 6.4L1.5 4.5H4.8L6 1.5Z" fill="#F59E0B"/>
                </svg>
              </motion.div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937' }}>Delivery Ready for Review</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Review the work and approve to release funds</p>
              </div>
            </div>

            {/* Approve CTA */}
            <motion.button
              type="button"
              onClick={handleApprove}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', height: 52, borderRadius: 18,
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                border: 'none', cursor: 'pointer', marginBottom: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: '0 8px 24px rgba(124,58,237,0.36)',
                position: 'relative', overflow: 'hidden',
              }}
            >
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
                <path d="M3 10L8 15L17 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>
                Approve &amp; Release Funds
              </span>
            </motion.button>

            {/* Request Changes */}
            <button
              type="button"
              onClick={() => setRequestOpen(r => !r)}
              style={{
                width: '100%', height: 46, borderRadius: 16,
                background: 'none',
                border: '1.5px solid rgba(124,58,237,0.35)',
                cursor: 'pointer', marginBottom: requestOpen ? 12 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2 8C2 4.69 4.69 2 8 2s6 2.69 6 6-2.69 6-6 6S2 11.31 2 8Z" stroke="#7C3AED" strokeWidth="1.4"/>
                <path d="M8 5.5v2.5l1.5 1.5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Request Changes</span>
              <motion.div animate={{ rotate: requestOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5L7 9L11 5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </button>

            {/* Inline changes form */}
            <AnimatePresence>
              {requestOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: 2 }}>
                    <textarea
                      value={changesText}
                      onChange={e => setChangesText(e.target.value)}
                      placeholder="Describe what needs to be changed or improved…"
                      style={{
                        width: '100%', minHeight: 90,
                        borderRadius: 14, padding: '12px',
                        border: '1.5px solid #E5E7EB',
                        backgroundColor: '#F9FAFB',
                        fontSize: '13px', color: '#1F2937',
                        outline: 'none', resize: 'none',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.55, caretColor: '#7C3AED',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { setRequestOpen(false); onRequestChanges?.(); }}
                      disabled={!changesText.trim()}
                      style={{
                        width: '100%', height: 44, borderRadius: 14, marginTop: 8,
                        background: changesText.trim() ? 'rgba(124,58,237,0.1)' : '#F3F4F6',
                        border: `1.5px solid ${changesText.trim() ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
                        cursor: changesText.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '13px', fontWeight: 700,
                        color: changesText.trim() ? '#7C3AED' : '#9CA3AF',
                        transition: 'all 0.2s',
                      }}
                    >
                      Send Change Request
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export function TransactionDetailScreen({
  tx = DEMO_TX_DETAIL,
  onBack,
  onMessage,
  onApprove,
  onRequestChanges,
  onReport,
}: TransactionDetailScreenProps) {
  const sc = tx.currentStep === 'awaiting_approval'
    ? { label: 'Awaiting Approval', color: '#B45309', bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.28)', dot: '#F59E0B' }
    : tx.currentStep === 'funds_released'
    ? { label: 'Completed', color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', dot: '#10B981' }
    : tx.currentStep === 'work_in_progress'
    ? { label: 'In Progress', color: '#2563EB', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)', dot: '#3B82F6' }
    : { label: 'In Progress', color: '#2563EB', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)', dot: '#3B82F6' };

  const cs = tx.category === 'Design' ? { bg: 'rgba(168,85,247,0.1)', color: '#9333EA' }
    : tx.category === 'Software Dev' ? { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' }
    : { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' };

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
        backgroundColor: 'white', padding: '8px 16px 14px',
        borderBottom: '1px solid #F0F0F0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Back */}
          <motion.button
            type="button"
            onClick={onBack}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 38, height: 38, borderRadius: 13, flexShrink: 0,
              backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <h1 style={{ fontSize: '17px', fontWeight: 900, color: '#1F2937', letterSpacing: '-0.02em', margin: 0 }}>
                Transaction Detail
              </h1>
              {/* Live status badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 7,
                backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
              }}>
                <motion.div
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: sc.dot }}
                />
                <span style={{ fontSize: '9px', fontWeight: 800, color: sc.color }}>{sc.label}</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>Ref: {tx.txRef}</span>
          </div>

          {/* Share/more */}
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
              <circle cx="10" cy="5" r="1.5" fill="#6B7280"/>
              <circle cx="10" cy="10" r="1.5" fill="#6B7280"/>
              <circle cx="10" cy="15" r="1.5" fill="#6B7280"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 16px 32px' }}>

        {/* ── Hero post banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            borderRadius: 20, marginBottom: 12, overflow: 'hidden',
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            boxShadow: '0 10px 32px rgba(124,58,237,0.3)',
          }}
        >
          {/* Radial highlight */}
          <div style={{
            position: 'relative', padding: '18px 18px 16px',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -30,
              width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(255,255,255,0.18) 0%,transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                backgroundColor: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '22px' }}>{tx.categoryIcon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    padding: '2px 8px', borderRadius: 7,
                    backgroundColor: cs.bg,
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: cs.color }}>{tx.category}</span>
                  </div>
                </div>
                <p style={{
                  fontSize: '15px', fontWeight: 800, color: 'white',
                  lineHeight: 1.35, letterSpacing: '-0.01em',
                }}>
                  {tx.postTitle}
                </p>
              </div>
            </div>

            {/* Amount row */}
            <div style={{
              marginTop: 14, padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 3 }}>Amount Paid</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    ${tx.amountPaid.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>USD</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 3 }}>Paid on</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{tx.paymentDate}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Timeline stepper ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <TimelineStepper currentStep={tx.currentStep} />
        </motion.div>

        {/* ── Contextual actions (Awaiting Approval) ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <ContextualActions
            currentStep={tx.currentStep}
            onApprove={onApprove}
            onRequestChanges={onRequestChanges}
          />
        </motion.div>

        {/* ── Seller card ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <SellerCard seller={tx.seller} hasNewMessage={tx.hasNewMessage} onMessage={onMessage} />
        </motion.div>

        {/* ── Before/After photos ── */}
        {(tx.beforePhotoUrl || tx.afterPhotoUrl) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <BeforeAfterSection
              beforeUrl={tx.beforePhotoUrl}
              afterUrl={tx.afterPhotoUrl}
              deliveryNote={tx.deliveryNote}
            />
          </motion.div>
        )}

        {/* ── Milestones ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <MilestonesSection milestones={tx.milestones} />
        </motion.div>

        {/* ── Payment summary ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}>
          <PaymentSummary tx={tx} />
        </motion.div>

        {/* ── Report problem ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.36 }}
          style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}
        >
          <button
            type="button"
            onClick={onReport}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="#9CA3AF" strokeWidth="1.3"/>
              <path d="M8 5v3.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.75" fill="#9CA3AF"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>Having an issue?</span>
            <span style={{
              fontSize: '12px', color: '#7C3AED', fontWeight: 700,
              textDecoration: 'underline', textDecorationColor: 'rgba(124,58,237,0.4)',
              textUnderlineOffset: '3px',
            }}>
              Report a problem
            </span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
