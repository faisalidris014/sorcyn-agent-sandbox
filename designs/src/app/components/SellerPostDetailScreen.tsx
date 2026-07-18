import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export interface SellerPostDetail {
  id: string;
  title: string;
  status: 'Active' | 'Draft' | 'Filled' | 'Expired';
  category: string;
  subcategory?: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  location: string;
  postedDate: string;
  expiresDate: string;
  views: number;
  offerCount: number;
  description: string;
  photos: string[];
  requirements?: {
    minRating?: number;
    verified?: boolean;
    licensed?: boolean;
    businessOnly?: boolean;
  };
  buyer: {
    name: string;
    avatar?: string;
    initials: string;
    avatarGradient: string;
    rating: number;
    reviewCount: number;
    memberSince: string;
    completedJobs: number;
    responseTime: string;
    verified: boolean;
  };
}

interface SellerPostDetailScreenProps {
  post: SellerPostDetail;
  onBack: () => void;
  onSubmitOffer?: () => void;
  onMessageBuyer?: () => void;
  onViewProfile?: () => void;
}

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  Active:  { bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.3)',  dot: '#10B981', text: '#059669' },
  Draft:   { bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)', dot: '#9CA3AF', text: '#6B7280' },
  Filled:  { bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.3)',  dot: '#3B82F6', text: '#2563EB' },
  Expired: { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',  dot: '#EF4444', text: '#DC2626' },
};

/* ─── Star renderer ─────────────────────────────────────────── */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(s => {
        const filled = rating >= s;
        const half   = !filled && rating >= s - 0.5;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 14 14" fill="none">
            <defs>
              <linearGradient id={`half-${s}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="#F59E0B"/>
                <stop offset="50%" stopColor="#E5E7EB"/>
              </linearGradient>
            </defs>
            <path
              d="M7 1L8.545 4.855H12.5L9.318 7.145L10.5 11L7 8.71L3.5 11L4.682 7.145L1.5 4.855H5.455L7 1Z"
              fill={filled ? '#F59E0B' : half ? `url(#half-${s})` : '#E5E7EB'}
            />
          </svg>
        );
      })}
    </div>
  );
}

/* ─── Photo carousel ────────────────────────────────────────── */
function PhotoCarousel({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);
  const startX = useRef(0);

  const prev = () => setActive(a => (a - 1 + photos.length) % photos.length);
  const next = () => setActive(a => (a + 1) % photos.length);

  return (
    <div
      style={{ width: '100%', aspectRatio: '16/10', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}
      onTouchStart={e => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - startX.current;
        if (dx > 40) prev();
        else if (dx < -40) next();
      }}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.img
          key={active}
          src={photos[active]}
          alt="Post photo"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 14, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 6, pointerEvents: 'none',
        }}>
          {photos.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === active ? 20 : 6, opacity: i === active ? 1 : 0.5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{ height: 6, borderRadius: 3, backgroundColor: 'white', flexShrink: 0 }}
            />
          ))}
        </div>
      )}

      {/* Count badge */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        borderRadius: 10, padding: '4px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="3" width="12" height="9" rx="2" stroke="white" strokeWidth="1.3"/>
          <circle cx="7" cy="7.5" r="2" stroke="white" strokeWidth="1.2"/>
          <path d="M4.5 3V2.5C4.5 1.95 4.95 1.5 5.5 1.5H8.5C9.05 1.5 9.5 1.95 9.5 2.5V3" stroke="white" strokeWidth="1.2"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{active + 1}/{photos.length}</span>
      </div>

      {/* Tap zones */}
      {photos.length > 1 && (
        <>
          <button type="button" onClick={prev}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'none', border: 'none', cursor: 'pointer' }} />
          <button type="button" onClick={next}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', background: 'none', border: 'none', cursor: 'pointer' }} />
        </>
      )}
    </div>
  );
}

/* ─── Meta row ──────────────────────────────────────────────── */
function MetaRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        backgroundColor: accent ? 'rgba(124,58,237,0.08)' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, lineHeight: 1 }}>{label}</p>
        <p style={{ fontSize: '13px', color: accent ? '#7C3AED' : '#1F2937', fontWeight: 700, marginTop: 2 }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Requirement badge ─────────────────────────────────────── */
function ReqBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '8px 12px', borderRadius: 12,
      backgroundColor: 'rgba(124,58,237,0.07)',
      border: '1.5px solid rgba(124,58,237,0.2)',
    }}>
      {icon}
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>{label}</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function SellerPostDetailScreen({
  post,
  onBack,
  onSubmitOffer,
  onMessageBuyer,
  onViewProfile,
}: SellerPostDetailScreenProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [quoteVal, setQuoteVal]         = useState('');

  const status   = STATUS_CFG[post.status];
  const shortDesc = post.description.length > 180
    ? post.description.slice(0, 180).trimEnd() + '…'
    : post.description;

  const PLATFORM_FEE = 0.08;
  const quoteNum  = parseFloat(quoteVal.replace(/,/g, '')) || 0;
  const feeAmt    = quoteNum * PLATFORM_FEE;
  const payoutAmt = quoteNum - feeAmt;

  /* Competition heat level */
  const heatLabel = post.offerCount === 0 ? 'Be the first!' :
    post.offerCount < 5  ? 'Low competition' :
    post.offerCount < 10 ? 'Moderate competition' : 'High competition';
  const heatColor = post.offerCount === 0 ? '#059669' :
    post.offerCount < 5  ? '#16A34A' :
    post.offerCount < 10 ? '#D97706' : '#DC2626';
  const heatBg    = post.offerCount === 0 ? 'rgba(16,185,129,0.08)' :
    post.offerCount < 5  ? 'rgba(22,163,74,0.08)' :
    post.offerCount < 10 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

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
      <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 38, height: 38, borderRadius: 12,
            border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{ fontSize: '17px', fontWeight: 700, color: '#1F2937' }}>Request Details</span>

        {/* Save / bookmark */}
        <button
          type="button"
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 38, height: 38, borderRadius: 12,
            border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M5 3H15C15.55 3 16 3.45 16 4V18L10 14L4 18V4C4 3.45 4.45 3 5 3Z"
              stroke="#1F2937" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 120 }}>

        {/* ── Photo carousel ── */}
        <PhotoCarousel photos={post.photos} />

        <div style={{ padding: '18px 18px 0' }}>

          {/* ─── BUYER PROFILE CARD ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
            style={{
              borderRadius: 20,
              border: '1.5px solid #F0EBFF',
              backgroundColor: '#FAFAFF',
              padding: '16px 16px 14px',
              marginBottom: 18,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle gradient accent top-right */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div className="flex items-center gap-3 mb-12px">
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: post.buyer.avatarGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124,58,237,0.22)',
                border: '2px solid rgba(255,255,255,0.8)',
              }}>
                <span style={{ fontSize: '19px', fontWeight: 800, color: 'white' }}>
                  {post.buyer.initials}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em' }}>
                    {post.buyer.name}
                  </span>
                  {post.buyer.verified && (
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Stars + review count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <Stars rating={post.buyer.rating} size={12} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>
                    {post.buyer.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                    ({post.buyer.reviewCount} reviews)
                  </span>
                </div>

                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  Member since {post.buyer.memberSince}
                </span>
              </div>

              {/* View Profile link */}
              <button
                type="button"
                onClick={onViewProfile}
                className="flex items-center gap-1 transition-all active:opacity-60"
                style={{ background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', flexShrink: 0 }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>Profile</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Buyer quick stats */}
            <div style={{
              display: 'flex', gap: 8, marginTop: 12,
              borderTop: '1px solid rgba(124,58,237,0.1)', paddingTop: 12,
            }}>
              {[
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 12V11C2 9.343 3.343 8 5 8H9C10.657 8 12 9.343 12 11V12" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                      <circle cx="7" cy="5" r="2.5" stroke="#7C3AED" strokeWidth="1.3"/>
                    </svg>
                  ),
                  label: 'Jobs done',
                  value: String(post.buyer.completedJobs),
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="#7C3AED" strokeWidth="1.3"/>
                      <path d="M7 4.5V7L8.5 8.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  label: 'Responds in',
                  value: post.buyer.responseTime,
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L8.33 4.67H12L9 7L10.33 10.67L7 8.33L3.67 10.67L5 7L2 4.67H5.67L7 1Z" fill="#F59E0B"/>
                    </svg>
                  ),
                  label: 'Trust score',
                  value: `${post.buyer.rating * 20}%`,
                },
              ].map(stat => (
                <div key={stat.label}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 4px', borderRadius: 12,
                    backgroundColor: 'rgba(124,58,237,0.05)',
                  }}
                >
                  <div style={{ marginBottom: 4 }}>{stat.icon}</div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 2, textAlign: 'center' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── POST TITLE + STATUS ─────────────────────────────── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <h1 style={{
                flex: 1, fontSize: '20px', fontWeight: 800, color: '#1F2937',
                lineHeight: 1.3, letterSpacing: '-0.02em',
              }}>
                {post.title}
              </h1>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 10, flexShrink: 0, marginTop: 3,
                backgroundColor: status.bg, border: `1.5px solid ${status.border}`,
              }}>
                <motion.div
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: status.dot }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: status.text }}>{post.status}</span>
              </div>
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: '#7C3AED',
                padding: '4px 11px', borderRadius: 9,
                backgroundColor: 'rgba(124,58,237,0.08)',
                border: '1.5px solid rgba(124,58,237,0.2)',
              }}>{post.category}</span>
              {post.subcategory && (
                <span style={{
                  fontSize: '12px', fontWeight: 600, color: '#A855F7',
                  padding: '4px 11px', borderRadius: 9,
                  backgroundColor: 'rgba(168,85,247,0.07)',
                  border: '1.5px solid rgba(168,85,247,0.2)',
                }}>{post.subcategory}</span>
              )}
            </div>
          </div>

          {/* ─── KEY INFO GRID ───────────────────────────────────── */}
          <div style={{
            borderRadius: 18, border: '1.5px solid #F0EBFF',
            backgroundColor: '#FAFAFF', padding: '16px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '16px 8px', marginBottom: 18,
          }}>
            <MetaRow accent label="Budget" value={`$${post.budgetMin.toLocaleString()} – $${post.budgetMax.toLocaleString()}`}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#7C3AED" strokeWidth="1.4"/>
                  <path d="M8 3.5V4M8 12V12.5M5.5 9.25C5.5 10.08 6.67 10.75 8 10.75s2.5-.67 2.5-1.5S9.33 7.75 8 7.75s-2.5-.67-2.5-1.5S6.67 4.75 8 4.75s2.5.67 2.5 1.5"
                    stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              }
            />
            <MetaRow label="Timeline" value={post.timeline}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#6B7280" strokeWidth="1.4"/>
                  <path d="M8 5V8L10.5 9.5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <MetaRow label="Location" value={post.location}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6C3.5 9.5 8 14.5 8 14.5S12.5 9.5 12.5 6C12.5 3.515 10.485 1.5 8 1.5Z"
                    stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="6" r="1.5" stroke="#6B7280" strokeWidth="1.3"/>
                </svg>
              }
            />
            <MetaRow label="Posted" value={post.postedDate}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" stroke="#6B7280" strokeWidth="1.4"/>
                  <path d="M2 6.5H14" stroke="#6B7280" strokeWidth="1.3"/>
                  <path d="M5.5 2V4M10.5 2V4" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              }
            />
          </div>

          {/* ─── DESCRIPTION ─────────────────────────────────────── */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>Description</p>
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                key={descExpanded ? 'full' : 'short'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.65 }}
              >
                {descExpanded ? post.description : shortDesc}
              </motion.p>
            </AnimatePresence>
            {post.description.length > 180 && (
              <button
                type="button"
                onClick={() => setDescExpanded(e => !e)}
                className="flex items-center gap-1 mt-2 transition-all active:opacity-60"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>
                  {descExpanded ? 'Show less' : 'Read more'}
                </span>
                <motion.div animate={{ rotate: descExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </button>
            )}
          </div>

          {/* ─── SELLER REQUIREMENTS ─────────────────────────────── */}
          {post.requirements && Object.values(post.requirements).some(Boolean) && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: 10 }}>
                Seller Requirements
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {post.requirements.minRating && (
                  <ReqBadge label={`${post.requirements.minRating}★ minimum`}
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.545 4.855H12.5L9.318 7.145L10.5 11L7 8.71L3.5 11L4.682 7.145L1.5 4.855H5.455L7 1Z" fill="#7C3AED"/></svg>}
                  />
                )}
                {post.requirements.verified && (
                  <ReqBadge label="Verified sellers"
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.5 2.5H11V5L12.5 7L11 9V11.5H8.5L7 13L5.5 11.5H3V9L1.5 7L3 5V2.5H5.5L7 1Z" stroke="#7C3AED" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4.5 7L6.5 9L9.5 5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  />
                )}
                {post.requirements.licensed && (
                  <ReqBadge label="Licensed professionals"
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#7C3AED" strokeWidth="1.2"/><path d="M4.5 7H9.5M4.5 5H7.5M4.5 9H6.5" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                  />
                )}
                {post.requirements.businessOnly && (
                  <ReqBadge label="Business accounts"
                    icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 12V6L5 4V12M5 12H9M5 4H9M9 4L12 6V12M9 4V12" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><rect x="6" y="8" width="2" height="4" rx="0.5" fill="#7C3AED"/></svg>}
                  />
                )}
              </div>
            </div>
          )}

          {/* ─── COMPETITION INFO ─────────────────────────────────── */}
          <div style={{
            borderRadius: 16,
            border: `1.5px solid ${heatColor}33`,
            backgroundColor: heatBg,
            padding: '14px 16px',
            marginBottom: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Stacked avatar bubbles */}
              <div style={{ display: 'flex', position: 'relative', height: 32 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    position: 'absolute', left: i * 18,
                    width: 28, height: 28, borderRadius: '50%',
                    border: '2px solid white',
                    background: ['linear-gradient(135deg,#7C3AED,#A855F7)',
                                 'linear-gradient(135deg,#F59E0B,#F97316)',
                                 'linear-gradient(135deg,#10B981,#3B82F6)'][i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 3 - i,
                  }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>
                      {['A','B','C'][i]}
                    </span>
                  </div>
                ))}
                <div style={{ position: 'absolute', left: 54, width: 1, height: 1 }} />
              </div>

              <div style={{ marginLeft: 22 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                  {post.offerCount === 0
                    ? 'No offers yet'
                    : `${post.offerCount} offer${post.offerCount !== 1 ? 's' : ''} submitted`}
                </p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: heatColor, marginTop: 1 }}>
                  {heatLabel}
                </p>
              </div>
            </div>

            {/* Heat bar */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: 6, height: 36, borderRadius: 3, overflow: 'hidden',
                backgroundColor: 'rgba(0,0,0,0.08)',
                position: 'relative',
              }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((post.offerCount / 15) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    borderRadius: 3,
                    background: `linear-gradient(to top, ${heatColor}, ${heatColor}88)`,
                  }}
                />
              </div>
              <span style={{ fontSize: '9px', color: heatColor, fontWeight: 700 }}>
                {post.offerCount === 0 ? 'HOT' :
                 post.offerCount < 5 ? 'COOL' :
                 post.offerCount < 10 ? 'WARM' : 'HOT'}
              </span>
            </div>
          </div>

          {/* ─── EARNINGS CALCULATOR ─────────────────────────────── */}
          <div style={{
            borderRadius: 20,
            border: '1.5px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            padding: '18px 16px',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="white" strokeWidth="1.4"/>
                  <path d="M9 4.5V5M9 13V13.5M6.5 11C6.5 11.83 7.67 12.5 9 12.5S11.5 11.83 11.5 11 10.33 9.5 9 9.5 6.5 8.83 6.5 8 7.67 6.5 9 6.5s2.5.67 2.5 1.5"
                    stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>Earnings Calculator</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Estimate your take-home payout</p>
              </div>
            </div>

            {/* Quote input */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                If you quote…
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: '17px', fontWeight: 700, color: '#6B7280',
                }}>$</span>
                <input
                  type="number"
                  value={quoteVal}
                  onChange={e => setQuoteVal(e.target.value)}
                  placeholder={`${post.budgetMin.toLocaleString()} – ${post.budgetMax.toLocaleString()}`}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: 30, paddingRight: 14, paddingTop: 13, paddingBottom: 13,
                    borderRadius: 14,
                    border: quoteVal ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                    backgroundColor: quoteVal ? 'rgba(124,58,237,0.04)' : 'white',
                    fontSize: '17px', fontWeight: 700,
                    color: '#1F2937',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; }}
                  onBlur={e => { if (!quoteVal) e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>
            </div>

            {/* Fee breakdown */}
            <AnimatePresence>
              {quoteNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    borderRadius: 14,
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white',
                    overflow: 'hidden',
                  }}>
                    {/* Quote row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '11px 14px',
                      borderBottom: '1px solid #F3F4F6',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="6" stroke="#9CA3AF" strokeWidth="1.2"/>
                          <path d="M7 4V4.5M7 9.5V10M5 8.25C5 8.94 5.9 9.5 7 9.5s2-.56 2-1.25S8.1 7 7 7 5 6.44 5 5.75 5.9 5.25 7 5.25s2 .56 2 1.25"
                            stroke="#9CA3AF" strokeWidth="1.1" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>Your quote</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                        ${quoteNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Platform fee row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '11px 14px',
                      borderBottom: '1px solid #F3F4F6',
                      backgroundColor: 'rgba(239,68,68,0.02)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <circle cx="5" cy="5" r="2" stroke="#EF4444" strokeWidth="1.2"/>
                          <circle cx="9" cy="9" r="2" stroke="#EF4444" strokeWidth="1.2"/>
                          <path d="M3 11L11 3" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>
                          Platform fee <span style={{ fontWeight: 700, color: '#EF4444' }}>(8%)</span>
                        </span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444' }}>
                        −${feeAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Payout row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '13px 14px',
                      backgroundColor: 'rgba(16,185,129,0.05)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 7,
                          background: 'rgba(16,185,129,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>Your payout</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <motion.span
                          key={payoutAmt}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                          style={{
                            fontSize: '20px', fontWeight: 800, color: '#059669',
                            display: 'block', letterSpacing: '-0.02em',
                          }}
                        >
                          ${payoutAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </motion.span>
                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>after Sorcyn fee</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget fit hint */}
                  {quoteNum > 0 && (
                    <div style={{ marginTop: 9 }}>
                      {quoteNum < post.budgetMin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="#10B981" strokeWidth="1.2"/>
                            <path d="M4.5 7L6.5 9L9.5 5" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            Below buyer budget — great competitive offer!
                          </span>
                        </div>
                      ) : quoteNum <= post.budgetMax ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="#7C3AED" strokeWidth="1.2"/>
                            <path d="M7 4.5V7.5M7 9V9.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>
                            Within buyer&apos;s budget range
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="#F59E0B" strokeWidth="1.2"/>
                            <path d="M7 4.5V8M7 9.5V10" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
                            Exceeds buyer&apos;s max budget
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!quoteVal && (
              <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                Enter a quote amount to see your earnings
              </p>
            )}
          </div>

          {/* ── Metadata ── */}
          <div style={{
            borderRadius: 14, border: '1px solid #F3F4F6',
            backgroundColor: '#F9FAFB', padding: '12px 14px', marginTop: 16, marginBottom: 4,
            display: 'flex', justifyContent: 'space-between',
          }}>
            {[
              { label: 'Views', value: post.views.toLocaleString() },
              { label: 'Expires', value: post.expiresDate },
              { label: 'Offers', value: String(post.offerCount) },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid #E5E7EB' : 'none',
                padding: '4px 0',
              }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>{s.value}</p>
                <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom Action Bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '12px 18px 30px',
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 40,
      }}>
        {/* Submit Offer */}
        <button
          type="button"
          onClick={onSubmitOffer}
          className="w-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            height: 54, borderRadius: 27,
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
            position: 'relative',
          }}
        >
          {quoteNum > 0 && (
            <div style={{
              position: 'absolute', left: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 10, padding: '3px 10px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                ${quoteNum.toLocaleString()}
              </span>
            </div>
          )}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 16L16 2M16 2H8M16 2V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Submit Offer</span>
        </button>

        {/* Message Buyer */}
        <button
          type="button"
          onClick={onMessageBuyer}
          className="w-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            height: 48, borderRadius: 24,
            background: 'white',
            border: '1.5px solid #7C3AED',
            cursor: 'pointer',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <path d="M15.5 11C15.5 11.83 14.83 12.5 14 12.5H5L2.5 15V5C2.5 4.17 3.17 3.5 4 3.5H14C14.83 3.5 15.5 4.17 15.5 5V11Z"
              stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 7.5H12M6 10H9.5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#7C3AED' }}>Message Buyer</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Demo seller post data ─────────────────────────────────── */
export const DEMO_SELLER_POST: SellerPostDetail = {
  id: '1',
  title: 'Need a professional logo + brand identity for a fintech startup',
  status: 'Active',
  category: 'Graphic Design',
  subcategory: 'Brand Identity',
  budgetMin: 500,
  budgetMax: 1500,
  timeline: 'Within 2 weeks',
  location: 'Remote',
  postedDate: 'Apr 14, 2026',
  expiresDate: 'Apr 28',
  views: 312,
  offerCount: 12,
  description: `We are a fintech startup launching a new B2B payments platform and need a full brand identity package created from scratch.\n\nDeliverables include: primary logo (light & dark versions), full colour palette, typography guide, icon set (8–10 icons), business card design, letterhead, email signature template, and a brief brand style guide PDF.\n\nWe have a rough concept and some inspirational references we can share. Looking for a modern, trustworthy, and clean aesthetic — think Stripe meets Revolut. Ideally the designer has fintech or SaaS experience but it's not mandatory.\n\nFiles should be delivered in AI, SVG, PNG, and PDF formats. Final handoff via shared Figma file strongly preferred.`,
  photos: [
    'https://images.unsplash.com/photo-1628233345409-349459e6f79a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFjdCUyMG5hdGl2ZSUyMG1vYmlsZSUyMGFwcCUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc3NjMxNzQ1OXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1604781109199-ced99b89b0f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RpbmclMjB3b3Jrc3BhY2UlMjBsYXB0b3AlMjBkZXNrfGVufDF8fHx8MTc3NjMxNzQ2MXww&ixlib=rb-4.1.0&q=80&w=1080',
  ],
  requirements: {
    minRating: 4,
    verified: true,
    licensed: false,
    businessOnly: false,
  },
  buyer: {
    name: 'Jordan Mercer',
    initials: 'JM',
    avatarGradient: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    rating: 4.9,
    reviewCount: 43,
    memberSince: 'March 2023',
    completedJobs: 28,
    responseTime: '< 1 hour',
    verified: true,
  },
};
