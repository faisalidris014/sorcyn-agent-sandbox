import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export interface SubmitOfferPost {
  title: string;
  category: string;
  subcategory?: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  location: string;
  offerCount: number;
}

interface SubmitOfferScreenProps {
  post: SubmitOfferPost;
  sellerName?: string;
  onBack: () => void;
  onPreview?: (data: OfferFormData) => void;
  onSubmit?: (data: OfferFormData) => void;
}

export interface OfferFormData {
  quoteAmount: string;
  pricingType: PricingType;
  startDate: string;
  timeline: string;
  message: string;
  attachments: AttachmentItem[];
}

type PricingType = 'flat' | 'hourly' | 'per_item' | 'custom';

interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'doc' | 'other';
  preview?: string;
}

/* ─── Constants ──────────────────────────────────────────────── */
const PLATFORM_FEE = 0.08;
const MAX_MESSAGE  = 1000;

const PRICING_TYPES: { key: PricingType; label: string; suffix: string; icon: React.ReactNode }[] = [
  {
    key: 'flat', label: 'Flat Rate', suffix: 'total',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="5" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 5V4C5 3.45 5.45 3 6 3H10C10.55 3 11 3.45 11 4V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M8 8.5V10.5M7 9.5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'hourly', label: 'Hourly', suffix: '/hr',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M8 5V8L10 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'per_item', label: 'Per Item', suffix: '/item',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M2 4L8 2L14 4V10L8 14L2 10V4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    key: 'custom', label: 'Custom', suffix: '',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M12.5 2.5L13.5 3.5L5.5 11.5L3 12.5L4 10L12.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M11 4L12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const TIMELINE_PRESETS = ['1–2 days', '3–5 days', '1 week', '2 weeks', '3 weeks', '1 month', '2 months', 'Custom'];

/* ─── Small helpers ──────────────────────────────────────────── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
      {children}
      {required && <span style={{ color: '#7C3AED', marginLeft: 3 }}>*</span>}
    </p>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 22 }}>{children}</div>;
}

/* ─── Post summary card ──────────────────────────────────────── */
function PostSummaryCard({ post }: { post: SubmitOfferPost }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      style={{
        borderRadius: 18,
        border: '1.5px solid #EDE9FE',
        backgroundColor: '#FAFAFF',
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* Header row — always visible */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
        }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="14" height="14" rx="3" stroke="white" strokeWidth="1.5"/>
            <path d="M5 6H13M5 9H11M5 12H9" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Title + budget */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '14px', fontWeight: 700, color: '#1F2937',
            lineHeight: 1.35, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {post.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>
              ${post.budgetMin.toLocaleString()}–${post.budgetMax.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', color: '#C4B5FD' }}>·</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#A855F7' }}>{post.category}</span>
          </div>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          style={{ flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 7L9 11L13 7" stroke="#A855F7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Expanded details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: '1px solid #EDE9FE',
              padding: '12px 16px 14px',
              display: 'flex', flexWrap: 'wrap', gap: 10,
            }}>
              {[
                {
                  icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M6 4V6L7.5 7" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                  label: post.timeline,
                },
                {
                  icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11S9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1Z" stroke="#9CA3AF" strokeWidth="1.2"/><circle cx="6" cy="4.5" r="1.2" stroke="#9CA3AF" strokeWidth="1.1"/></svg>,
                  label: post.location,
                },
                {
                  icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10V9C2 7.34 3.34 6 5 6H7C8.66 6 10 7.34 10 9V10" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="4" r="2" stroke="#9CA3AF" strokeWidth="1.2"/></svg>,
                  label: `${post.offerCount} offer${post.offerCount !== 1 ? 's' : ''} so far`,
                },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 10,
                  backgroundColor: 'rgba(124,58,237,0.06)',
                  border: '1px solid rgba(124,58,237,0.12)',
                }}>
                  {item.icon}
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Fee preview card ───────────────────────────────────────── */
function FeePreviewCard({ quoteAmount, pricingType }: { quoteAmount: number; pricingType: PricingType }) {
  const fee    = quoteAmount * PLATFORM_FEE;
  const payout = quoteAmount - fee;
  const suffix = PRICING_TYPES.find(p => p.key === pricingType)?.suffix ?? '';
  const hasValue = quoteAmount > 0;

  return (
    <div style={{
      borderRadius: 20,
      overflow: 'hidden',
      border: '1.5px solid',
      borderColor: hasValue ? '#EDE9FE' : '#E5E7EB',
      backgroundColor: hasValue ? '#FAFAFF' : '#F9FAFB',
      marginBottom: 24,
      transition: 'border-color 0.2s, background-color 0.2s',
    }}>
      {/* Card header */}
      <div style={{
        padding: '13px 16px 11px',
        borderBottom: `1px solid ${hasValue ? '#EDE9FE' : '#F3F4F6'}`,
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: hasValue ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : '#E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.25s',
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.4"/>
            <path d="M8 4.5V5M8 11V11.5M5.5 9C5.5 9.83 6.67 10.5 8 10.5S10.5 9.83 10.5 9 9.33 7.5 8 7.5 5.5 6.83 5.5 6 6.67 5.5 8 5.5s2.5.67 2.5 1.5"
              stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>Earnings Preview</p>
          <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Live fee breakdown</p>
        </div>
      </div>

      {/* Rows */}
      <div>
        {/* Quote row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: hasValue ? '#7C3AED' : '#D1D5DB',
            }} />
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Your quote</span>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: hasValue ? '#1F2937' : '#9CA3AF' }}>
            {hasValue ? `$${quoteAmount.toLocaleString()}${suffix}` : '—'}
          </span>
        </div>

        {/* Platform fee row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
          backgroundColor: hasValue ? 'rgba(239,68,68,0.02)' : 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: hasValue ? '#EF4444' : '#D1D5DB' }} />
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              Platform fee{' '}
              <span style={{ fontWeight: 700, color: hasValue ? '#EF4444' : '#9CA3AF' }}>(8%)</span>
            </span>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: hasValue ? '#EF4444' : '#9CA3AF' }}>
            {hasValue ? `−$${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </span>
        </div>

        {/* Payout row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px',
          backgroundColor: hasValue ? 'rgba(16,185,129,0.04)' : 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              backgroundColor: hasValue ? 'rgba(16,185,129,0.15)' : '#F3F4F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke={hasValue ? '#059669' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: hasValue ? '#059669' : '#9CA3AF' }}>
              Your payout
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={hasValue ? payout.toFixed(2) : 'empty'}
              initial={{ opacity: 0, y: 4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              style={{ textAlign: 'right' }}
            >
              <p style={{ fontSize: '22px', fontWeight: 800, color: hasValue ? '#059669' : '#9CA3AF', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {hasValue ? `$${payout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </p>
              {hasValue && (
                <p style={{ fontSize: '10px', color: '#6EE7B7', marginTop: 2, fontWeight: 600 }}>
                  after Sorcyn fee
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Budget fit hint */}
      <AnimatePresence>
        {hasValue && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <BudgetHint quoteAmount={quoteAmount} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Budget hint ────────────────────────────────────────────── */
function BudgetHint({ quoteAmount }: { quoteAmount: number }) {
  // we compare against the demo post budget — in real app pass as prop
  const budgetMax = 1500;
  const budgetMin = 500;

  const { icon, text, color, bg, border } = quoteAmount < budgetMin
    ? {
        icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#059669" strokeWidth="1.2"/><path d="M4.5 7L6.5 9L9.5 5" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        text: 'Below minimum budget — very competitive!',
        color: '#059669', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)',
      }
    : quoteAmount <= budgetMax
    ? {
        icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#7C3AED" strokeWidth="1.2"/><path d="M7 4V7.5M7 9V9.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/></svg>,
        text: "Within the buyer's budget range",
        color: '#7C3AED', bg: 'rgba(124,58,237,0.05)', border: 'rgba(124,58,237,0.18)',
      }
    : {
        icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#D97706" strokeWidth="1.2"/><path d="M7 4V8M7 9.5V10" stroke="#D97706" strokeWidth="1.3" strokeLinecap="round"/></svg>,
        text: 'Exceeds the buyer\'s maximum budget',
        color: '#D97706', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)',
      };

  return (
    <div style={{
      margin: '0 14px 14px',
      padding: '9px 12px',
      borderRadius: 12,
      backgroundColor: bg,
      border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: 7,
    }}>
      {icon}
      <span style={{ fontSize: '12px', fontWeight: 600, color }}>{text}</span>
    </div>
  );
}

/* ─── Attachment thumbnail ───────────────────────────────────── */
function AttachmentThumb({ item, onRemove }: { item: AttachmentItem; onRemove: () => void }) {
  const isImage = item.type === 'image' && item.preview;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      style={{
        position: 'relative', borderRadius: 14, overflow: 'hidden',
        border: '1.5px solid #E5E7EB',
        aspectRatio: '1',
      }}
    >
      {isImage ? (
        <img src={item.preview} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          backgroundColor: '#F3F4F6',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M13 2H6C4.9 2 4 2.9 4 4V18C4 19.1 4.9 20 6 20H16C17.1 20 18 19.1 18 18V7L13 2Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M13 2V7H18" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#9CA3AF', maxWidth: 50, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>
        </div>
      )}

      {/* Overlay gradient */}
      {isImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)',
        }} />
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="transition-all active:scale-90"
        style={{
          position: 'absolute', top: 5, right: 5,
          width: 22, height: 22, borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.55)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>

      {/* File size badge */}
      <div style={{
        position: 'absolute', bottom: 5, left: 5,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        borderRadius: 5, padding: '2px 5px',
      }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>{item.size}</span>
      </div>
    </motion.div>
  );
}

/* ─── Add attachment tile ────────────────────────────────────── */
function AddAttachmentTile({ onAdd }: { onAdd: (item: AttachmentItem) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = ev => {
      onAdd({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: isImage ? 'image' : 'doc',
        preview: isImage ? (ev.target?.result as string) : undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      className="transition-all active:scale-95"
      style={{
        aspectRatio: '1', borderRadius: 14,
        border: '2px dashed #D8B4FE',
        backgroundColor: 'rgba(124,58,237,0.03)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 9,
        background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.12))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{ fontSize: '10px', fontWeight: 700, color: '#A78BFA' }}>Add File</span>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFile} />
    </button>
  );
}

/* ─── Timeline preset picker ─────────────────────────────────── */
function TimelinePresetPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
      {TIMELINE_PRESETS.map(preset => {
        const active = value === preset;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(active ? '' : preset)}
            className="transition-all active:scale-95"
            style={{
              height: 32, padding: '0 12px', borderRadius: 100,
              border: active ? 'none' : '1.5px solid #E5E7EB',
              background: active ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'white',
              boxShadow: active ? '0 3px 10px rgba(124,58,237,0.28)' : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: active ? 'white' : '#6B7280' }}>
              {preset}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Submit modal overlay ───────────────────────────────────── */
function SuccessOverlay({ quoteAmount, onDone }: { quoteAmount: number; onDone: () => void }) {
  const payout = quoteAmount * (1 - PLATFORM_FEE);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 99,
        backgroundColor: 'rgba(17,7,32,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <motion.div
        initial={{ scale: 0.78, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, delay: 0.08 }}
        style={{
          backgroundColor: 'white', borderRadius: 28,
          padding: '32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%', maxWidth: 340,
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.22 }}
          style={{
            width: 72, height: 72, borderRadius: 24, marginBottom: 20,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(124,58,237,0.4)',
          }}
        >
          <motion.svg
            width="34" height="34" viewBox="0 0 34 34" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.4, ease: 'easeOut' }}
          >
            <path d="M6 17L13 24L28 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </motion.div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Offer Submitted!
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 22 }}>
          Your offer of <span style={{ fontWeight: 700, color: '#7C3AED' }}>${quoteAmount.toLocaleString()}</span> has been sent to the buyer. You'll be notified when they respond.
        </p>

        {/* Payout callout */}
        <div style={{
          width: '100%', borderRadius: 16,
          background: 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.04))',
          border: '1.5px solid rgba(16,185,129,0.2)',
          padding: '14px 16px', marginBottom: 22,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Your payout if accepted</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
            ${payout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="w-full transition-all active:scale-[0.97]"
          style={{
            height: 50, borderRadius: 18,
            background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(124,58,237,0.35)',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Back to Feed</span>
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main screen ────────────────────────────────────────────── */
export function SubmitOfferScreen({ post, sellerName = 'Alex', onBack, onPreview, onSubmit }: SubmitOfferScreenProps) {
  const [quoteRaw, setQuoteRaw]         = useState('');
  const [pricingType, setPricingType]   = useState<PricingType>('flat');
  const [startDate, setStartDate]       = useState('');
  const [timeline, setTimeline]         = useState('');
  const [customTimeline, setCustomTimeline] = useState('');
  const [message, setMessage]           = useState('');
  const [attachments, setAttachments]   = useState<AttachmentItem[]>([]);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const quoteInputRef = useRef<HTMLInputElement>(null);

  const quoteNum     = parseFloat(quoteRaw.replace(/,/g, '')) || 0;
  const effectiveTimeline = timeline === 'Custom' ? customTimeline : timeline;

  /* Validation */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!quoteRaw || quoteNum <= 0) e.quote = 'Please enter a valid quote amount';
    if (!effectiveTimeline.trim()) e.timeline = 'Please select or enter a timeline';
    if (!message.trim()) e.message = 'Please write a message to the buyer';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const formData = useCallback((): OfferFormData => ({
    quoteAmount: quoteRaw,
    pricingType,
    startDate,
    timeline: effectiveTimeline,
    message,
    attachments,
  }), [quoteRaw, pricingType, startDate, effectiveTimeline, message, attachments]);

  const handleSubmit = () => {
    if (!validate()) return;
    setShowSuccess(true);
    onSubmit?.(formData());
  };

  const handlePreview = () => {
    if (!validate()) return;
    onPreview?.(formData());
  };

  const suffix = PRICING_TYPES.find(p => p.key === pricingType)?.suffix ?? '';

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

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em' }}>
            Submit Offer
          </h1>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 10,
          backgroundColor: 'rgba(124,58,237,0.07)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L7.2 4.4H10.5L7.8 6.4L8.9 9.9L6 7.8L3.1 9.9L4.2 6.4L1.5 4.4H4.8L6 1Z" fill="#7C3AED"/>
          </svg>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>Seller</span>
        </div>
      </div>

      {/* ── Thin progress bar ── */}
      <div style={{ height: 3, backgroundColor: '#F3F4F6', flexShrink: 0, marginBottom: 0 }}>
        <motion.div
          animate={{ width: quoteNum > 0 && effectiveTimeline && message ? '100%' : quoteNum > 0 && effectiveTimeline ? '66%' : quoteNum > 0 ? '33%' : '8%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg,#7C3AED,#A855F7)', borderRadius: '0 2px 2px 0' }}
        />
      </div>

      {/* ── Scrollable form body ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px 18px', paddingBottom: 120 }}>

        {/* Post summary */}
        <PostSummaryCard post={post} />

        {/* ─── Quote Amount ── */}
        <FieldWrap>
          <Label required>Your Quote</Label>

          {/* Pricing type selector */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
            {PRICING_TYPES.map(pt => {
              const active = pricingType === pt.key;
              return (
                <button
                  key={pt.key}
                  type="button"
                  onClick={() => setPricingType(pt.key)}
                  className="flex-1 flex flex-col items-center transition-all active:scale-95"
                  style={{
                    padding: '8px 4px 7px',
                    borderRadius: 13,
                    border: active ? 'none' : '1.5px solid #E5E7EB',
                    background: active ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'white',
                    boxShadow: active ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
                    cursor: 'pointer',
                    gap: 4,
                    color: active ? 'white' : '#6B7280',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{ color: 'inherit', lineHeight: 1 }}>{pt.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'inherit', whiteSpace: 'nowrap' }}>
                    {pt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Big quote input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'baseline', gap: 2, pointerEvents: 'none',
            }}>
              <span style={{ fontSize: '26px', fontWeight: 700, color: quoteNum > 0 ? '#7C3AED' : '#D1D5DB' }}>$</span>
            </div>
            <input
              ref={quoteInputRef}
              type="number"
              inputMode="decimal"
              value={quoteRaw}
              onChange={e => {
                setQuoteRaw(e.target.value);
                if (errors.quote) setErrors(er => ({ ...er, quote: '' }));
              }}
              placeholder="0.00"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 44, paddingRight: suffix ? 80 : 18,
                paddingTop: 18, paddingBottom: 18,
                borderRadius: 18,
                border: errors.quote ? '2px solid #EF4444' : quoteNum > 0 ? '2px solid #7C3AED' : '2px solid #E5E7EB',
                backgroundColor: quoteNum > 0 ? 'rgba(124,58,237,0.03)' : 'white',
                fontSize: '30px', fontWeight: 800,
                color: '#1F2937', letterSpacing: '-0.03em',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
            />
            {/* Suffix badge */}
            {suffix && (
              <div style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                padding: '4px 10px', borderRadius: 10,
                backgroundColor: quoteNum > 0 ? 'rgba(124,58,237,0.1)' : '#F3F4F6',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: quoteNum > 0 ? '#7C3AED' : '#9CA3AF' }}>
                  {suffix}
                </span>
              </div>
            )}
          </div>
          {errors.quote && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
              {errors.quote}
            </p>
          )}

          {/* Budget range reference */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#9CA3AF" strokeWidth="1.1"/>
              <path d="M6 5V8M6 3.5V4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
              Buyer's budget: <span style={{ fontWeight: 700, color: '#7C3AED' }}>
                ${post.budgetMin.toLocaleString()}–${post.budgetMax.toLocaleString()}
              </span>
            </span>
          </div>
        </FieldWrap>

        {/* ── Live fee preview ── */}
        <FeePreviewCard quoteAmount={quoteNum} pricingType={pricingType} />

        {/* ─── Start Date ── */}
        <FieldWrap>
          <Label>Start Date</Label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}>
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="3" width="14" height="13" rx="2.5" stroke={startDate ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.4"/>
                <path d="M2 7.5H16" stroke={startDate ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3"/>
                <path d="M6 2V4M12 2V4" stroke={startDate ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round"/>
                <rect x="5" y="10" width="3" height="2.5" rx="0.8" fill={startDate ? '#7C3AED' : '#D1D5DB'}/>
                <rect x="10" y="10" width="3" height="2.5" rx="0.8" fill={startDate ? '#7C3AED' : '#D1D5DB'}/>
              </svg>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 42, paddingRight: 14,
                height: 50, borderRadius: 14,
                border: startDate ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                backgroundColor: startDate ? 'rgba(124,58,237,0.03)' : 'white',
                fontSize: '15px', fontWeight: 600, color: '#1F2937',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s',
              }}
            />
          </div>
        </FieldWrap>

        {/* ─── Completion Timeline ── */}
        <FieldWrap>
          <Label required>Completion Timeline</Label>
          <TimelinePresetPicker
            value={timeline}
            onChange={v => {
              setTimeline(v);
              if (v !== 'Custom') setCustomTimeline('');
              if (errors.timeline) setErrors(er => ({ ...er, timeline: '' }));
            }}
          />

          {/* Custom input */}
          <AnimatePresence>
            {timeline === 'Custom' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: 10 }}
              >
                <input
                  type="text"
                  value={customTimeline}
                  onChange={e => setCustomTimeline(e.target.value)}
                  placeholder="e.g. 10 business days"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '13px 14px', borderRadius: 14,
                    border: customTimeline ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                    backgroundColor: customTimeline ? 'rgba(124,58,237,0.03)' : 'white',
                    fontSize: '14px', fontWeight: 600, color: '#1F2937',
                    outline: 'none', fontFamily: 'Inter, sans-serif',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {errors.timeline && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: 7, fontWeight: 600 }}>
              {errors.timeline}
            </p>
          )}
        </FieldWrap>

        {/* ─── Message to Buyer ── */}
        <FieldWrap>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Label required>Message to Buyer</Label>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              color: message.length > MAX_MESSAGE * 0.9 ? '#EF4444' : '#9CA3AF',
            }}>
              {message.length}/{MAX_MESSAGE}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              value={message}
              onChange={e => {
                if (e.target.value.length <= MAX_MESSAGE) setMessage(e.target.value);
                if (errors.message) setErrors(er => ({ ...er, message: '' }));
              }}
              placeholder={`Hi! I'd love to work on this project. Here's why I'm the right fit…\n\n• My relevant experience\n• How I'll approach this\n• Why I can meet your timeline`}
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 14px 42px',
                borderRadius: 16,
                border: errors.message ? '1.5px solid #EF4444' : message.length > 0 ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                backgroundColor: message.length > 0 ? 'rgba(124,58,237,0.02)' : 'white',
                fontSize: '14px', lineHeight: 1.65, color: '#1F2937',
                outline: 'none', resize: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s',
              }}
            />
            {/* Character fill bar */}
            <div style={{
              position: 'absolute', bottom: 12, left: 14, right: 14,
              height: 3, borderRadius: 2, backgroundColor: '#F3F4F6',
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${(message.length / MAX_MESSAGE) * 100}%` }}
                transition={{ duration: 0.15 }}
                style={{
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor:
                    message.length > MAX_MESSAGE * 0.9 ? '#EF4444' :
                    message.length > MAX_MESSAGE * 0.7 ? '#F59E0B' : '#7C3AED',
                }}
              />
            </div>
          </div>
          {errors.message && (
            <p style={{ fontSize: '12px', color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
              {errors.message}
            </p>
          )}

          {/* Tip chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {['Mention experience', 'Include portfolio link', 'Ask a question'].map(tip => (
              <button
                key={tip}
                type="button"
                onClick={() => {
                  const additions: Record<string, string> = {
                    'Mention experience': "\n\nI have X years of experience with similar projects...",
                    'Include portfolio link': "\n\nPortfolio: https://your-portfolio.com",
                    'Ask a question': "\n\nCould you share more details about [specific aspect]?",
                  };
                  const add = additions[tip] ?? '';
                  if ((message + add).length <= MAX_MESSAGE) setMessage(m => m + add);
                }}
                className="flex items-center gap-1.5 transition-all active:scale-95"
                style={{
                  height: 28, padding: '0 10px', borderRadius: 100,
                  border: '1px solid rgba(124,58,237,0.2)',
                  backgroundColor: 'rgba(124,58,237,0.05)',
                  cursor: 'pointer',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2V8M2 5H8" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#7C3AED' }}>{tip}</span>
              </button>
            ))}
          </div>
        </FieldWrap>

        {/* ─── Attachments ── */}
        <FieldWrap>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Label>Attachments</Label>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {attachments.length}/6 files
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            <AnimatePresence>
              {attachments.map(item => (
                <AttachmentThumb
                  key={item.id}
                  item={item}
                  onRemove={() => setAttachments(a => a.filter(x => x.id !== item.id))}
                />
              ))}
            </AnimatePresence>
            {attachments.length < 6 && (
              <AddAttachmentTile
                onAdd={item => setAttachments(a => [...a, item])}
              />
            )}
          </div>

          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 9 }}>
            Supported: JPG, PNG, PDF, DOC — max 10 MB each
          </p>
        </FieldWrap>

        {/* ─── Terms note ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 9,
          padding: '12px 14px', borderRadius: 14,
          backgroundColor: 'rgba(124,58,237,0.05)',
          border: '1px solid rgba(124,58,237,0.14)',
          marginBottom: 4,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="8" cy="8" r="6.5" stroke="#A855F7" strokeWidth="1.3"/>
            <path d="M8 7V11M8 5V5.5" stroke="#A855F7" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.55 }}>
            By submitting, you agree to Sorcyn's <span style={{ color: '#7C3AED', fontWeight: 700 }}>Seller Terms</span>. The buyer has 48 hours to accept or decline your offer.
          </p>
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '12px 18px 30px',
        display: 'flex', gap: 10,
        zIndex: 40,
      }}>
        {/* Preview Offer — outlined */}
        <button
          type="button"
          onClick={handlePreview}
          className="flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            flex: 1, height: 52, borderRadius: 20,
            border: '2px solid #7C3AED',
            backgroundColor: 'rgba(124,58,237,0.05)',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#7C3AED" strokeWidth="1.4"/>
            <path d="M5 8C5 8 6 10.5 8 10.5C10 10.5 11 8 11 8C11 8 10 5.5 8 5.5C6 5.5 5 8 5 8Z" stroke="#7C3AED" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="1.3" fill="#7C3AED"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#7C3AED' }}>Preview</span>
        </button>

        {/* Submit Offer — filled purple */}
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            flex: 1.8, height: 52, borderRadius: 20,
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* shimmer */}
          <motion.div
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              transform: 'skewX(-15deg)',
              pointerEvents: 'none',
            }}
          />
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <path d="M2 16L16 2M16 2H8M16 2V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
            Submit Offer{quoteNum > 0 ? ` · $${quoteNum.toLocaleString()}` : ''}
          </span>
        </button>
      </div>

      {/* ── Success overlay ── */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessOverlay
            quoteAmount={quoteNum}
            onDone={() => { setShowSuccess(false); onBack(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Demo post for wiring ───────────────────────────────────── */
export const DEMO_SUBMIT_POST: SubmitOfferPost = {
  title: 'Need a professional logo + brand identity for a fintech startup',
  category: 'Graphic Design',
  subcategory: 'Brand Identity',
  budgetMin: 500,
  budgetMax: 1500,
  timeline: 'Within 2 weeks',
  location: 'Remote',
  offerCount: 12,
};