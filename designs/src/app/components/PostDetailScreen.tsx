import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export interface PostDetail {
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
  offers: number;
  description: string;
  photos: string[];
  requirements?: {
    minRating?: number;
    verified?: boolean;
    licensed?: boolean;
    businessOnly?: boolean;
  };
}

interface PostDetailScreenProps {
  post: PostDetail;
  onBack: () => void;
  onViewOffers?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExtend?: () => void;
  onMarkFilled?: () => void;
  onRepost?: () => void;
}

/* ─── Overflow menu ─────────────────────────────────────────── */
interface OverflowMenuProps {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExtend?: () => void;
  onMarkFilled?: () => void;
  onRepost?: () => void;
}

function OverflowMenu({ open, onClose, onEdit, onDelete, onExtend, onMarkFilled, onRepost }: OverflowMenuProps) {
  const items = [
    {
      label: 'Edit Post',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z" stroke="#1F2937" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M9.5 4.5L11.5 6.5" stroke="#1F2937" strokeWidth="1.4"/>
        </svg>
      ),
      action: onEdit,
      color: '#1F2937',
    },
    {
      label: 'Extend Duration',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="#7C3AED" strokeWidth="1.4"/>
          <path d="M8 5V8L10 10" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M12.5 1.5L14.5 3.5M12.5 3.5L14.5 1.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
      action: onExtend,
      color: '#7C3AED',
    },
    {
      label: 'Mark as Filled',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="#059669" strokeWidth="1.4"/>
          <path d="M5 8L7 10L11 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      action: onMarkFilled,
      color: '#059669',
    },
    {
      label: 'Repost',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 3H5C3.895 3 3 3.895 3 5V9" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M3 13H11C12.105 13 13 12.105 13 11V7" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M11 1L13 3L11 5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 11L3 13L5 15" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      action: onRepost,
      color: '#6B7280',
    },
    {
      label: 'Delete Post',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 5H13M6 5V3H10V5M5 5V13H11V5" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 8V11M9 8V11" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
      action: onDelete,
      color: '#EF4444',
      danger: true,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          />
          {/* Menu panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'absolute',
              top: 58,
              right: 16,
              width: 220,
              borderRadius: 18,
              backgroundColor: 'white',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              border: '1px solid rgba(0,0,0,0.06)',
              overflow: 'hidden',
              zIndex: 99,
              transformOrigin: 'top right',
            }}
          >
            {items.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { item.action?.(); onClose(); }}
                className="w-full flex items-center gap-3 transition-all active:bg-gray-50"
                style={{
                  padding: '13px 16px',
                  background: 'none',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  backgroundColor: item.danger ? 'rgba(239,68,68,0.08)' : '#F9FAFB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: item.color }}>
                  {item.label}
                </span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
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

      {/* Gradient overlay bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Dot indicators */}
      <div style={{
        position: 'absolute', bottom: 14, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 6,
        pointerEvents: 'none',
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

      {/* Photo count badge */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
        borderRadius: 10, padding: '4px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="3" width="12" height="9" rx="2" stroke="white" strokeWidth="1.3"/>
          <circle cx="7" cy="7.5" r="2" stroke="white" strokeWidth="1.2"/>
          <path d="M4.5 3V2.5C4.5 1.95 4.95 1.5 5.5 1.5H8.5C9.05 1.5 9.5 1.95 9.5 2.5V3" stroke="white" strokeWidth="1.2"/>
        </svg>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>
          {active + 1}/{photos.length}
        </span>
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

/* ─── Stat chip ─────────────────────────────────────────────── */
function MetaRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: accent ? 'rgba(124,58,237,0.08)' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500, lineHeight: 1 }}>{label}</p>
        <p style={{ fontSize: '13px', color: accent ? '#7C3AED' : '#1F2937', fontWeight: 700, marginTop: 2 }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Requirement badge ─────────────────────────────────────── */
function ReqBadge({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  if (!active) return null;
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

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  Active:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  dot: '#10B981', text: '#059669', label: 'Active'  },
  Draft:   { bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)', dot: '#9CA3AF', text: '#6B7280', label: 'Draft'   },
  Filled:  { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  dot: '#3B82F6', text: '#2563EB', label: 'Filled'  },
  Expired: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  dot: '#EF4444', text: '#DC2626', label: 'Expired' },
};

/* ─── Main component ─────────────────────────────────────────── */
export function PostDetailScreen({
  post,
  onBack,
  onViewOffers,
  onEdit,
  onDelete,
  onExtend,
  onMarkFilled,
  onRepost,
}: PostDetailScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const status = STATUS_CFG[post.status];
  const shortDesc = post.description.length > 180
    ? post.description.slice(0, 180).trimEnd() + '…'
    : post.description;

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden" style={{ position: 'relative' }}>

      {/* ── Status Bar ── */}
      <div className="h-11 flex items-center justify-between px-6 pt-3 flex-shrink-0"
        style={{ position: 'relative', zIndex: 10 }}>
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
      <div
        className="flex items-center justify-between px-4 pb-2 flex-shrink-0"
        style={{ position: 'relative', zIndex: 10 }}
      >
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

        <span style={{ fontSize: '17px', fontWeight: 700, color: '#1F2937' }}>Post Details</span>

        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 38, height: 38, borderRadius: 12,
            border: '1.5px solid #E5E7EB',
            backgroundColor: menuOpen ? 'rgba(124,58,237,0.08)' : '#F9FAFB',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="5" r="1.4" fill={menuOpen ? '#7C3AED' : '#1F2937'}/>
            <circle cx="10" cy="10" r="1.4" fill={menuOpen ? '#7C3AED' : '#1F2937'}/>
            <circle cx="10" cy="15" r="1.4" fill={menuOpen ? '#7C3AED' : '#1F2937'}/>
          </svg>
        </button>

        {/* Overflow menu */}
        <OverflowMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onEdit={onEdit}
          onDelete={onDelete}
          onExtend={onExtend}
          onMarkFilled={onMarkFilled}
          onRepost={onRepost}
        />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 110 }}>

        {/* ── Photo Carousel ── */}
        <PhotoCarousel photos={post.photos} />

        {/* ── Content body ── */}
        <div style={{ padding: '20px 18px 0' }}>

          {/* Title + status */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <h1 style={{
                flex: 1,
                fontSize: '20px', fontWeight: 800, color: '#1F2937',
                lineHeight: 1.3, letterSpacing: '-0.02em',
              }}>
                {post.title}
              </h1>
              {/* Status badge */}
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
                <span style={{ fontSize: '12px', fontWeight: 700, color: status.text }}>{status.label}</span>
              </div>
            </div>

            {/* Category + subcategory chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span style={{
                fontSize: '12px', fontWeight: 700, color: '#7C3AED',
                padding: '4px 11px', borderRadius: 9,
                backgroundColor: 'rgba(124,58,237,0.08)',
                border: '1.5px solid rgba(124,58,237,0.2)',
              }}>
                {post.category}
              </span>
              {post.subcategory && (
                <span style={{
                  fontSize: '12px', fontWeight: 600, color: '#A855F7',
                  padding: '4px 11px', borderRadius: 9,
                  backgroundColor: 'rgba(168,85,247,0.07)',
                  border: '1.5px solid rgba(168,85,247,0.2)',
                }}>
                  {post.subcategory}
                </span>
              )}
            </div>
          </div>

          {/* ── Key info grid ── */}
          <div style={{
            borderRadius: 18, border: '1.5px solid #F0EBFF',
            backgroundColor: '#FAFAFF', padding: '16px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '16px 8px', marginBottom: 18,
          }}>
            {/* Budget */}
            <MetaRow
              accent
              label="Budget"
              value={`$${post.budgetMin.toLocaleString()} – $${post.budgetMax.toLocaleString()}`}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#7C3AED" strokeWidth="1.4"/>
                  <path d="M8 3.5V4M8 12V12.5M5.5 9.25C5.5 10.08 6.67 10.75 8 10.75s2.5-.67 2.5-1.5S9.33 7.75 8 7.75s-2.5-.67-2.5-1.5S6.67 4.75 8 4.75s2.5.67 2.5 1.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              }
            />

            {/* Timeline */}
            <MetaRow
              label="Timeline"
              value={post.timeline}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#6B7280" strokeWidth="1.4"/>
                  <path d="M8 5V8L10.5 9.5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />

            {/* Location */}
            <MetaRow
              label="Location"
              value={post.location}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6C3.5 9.5 8 14.5 8 14.5S12.5 9.5 12.5 6C12.5 3.515 10.485 1.5 8 1.5Z" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="6" r="1.5" stroke="#6B7280" strokeWidth="1.3"/>
                </svg>
              }
            />

            {/* Offers */}
            <MetaRow
              accent
              label="Offers received"
              value={`${post.offers} offers`}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 12V11C2 9.343 3.343 8 5 8H11C12.657 8 14 9.343 14 11V12" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="8" cy="5" r="2.5" stroke="#7C3AED" strokeWidth="1.4"/>
                </svg>
              }
            />
          </div>

          {/* ── Description ── */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>Description</p>
            <div
              style={{
                fontSize: '14px', color: '#4B5563', lineHeight: 1.65,
                overflow: 'hidden',
              }}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.p
                  key={descExpanded ? 'full' : 'short'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {descExpanded ? post.description : shortDesc}
                </motion.p>
              </AnimatePresence>
            </div>
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

          {/* ── Seller Requirements ── */}
          {post.requirements && (
            Object.values(post.requirements).some(Boolean) ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: 10 }}>
                  Seller Requirements
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {post.requirements.minRating && (
                    <ReqBadge
                      active
                      label={`${post.requirements.minRating}★ minimum rating`}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1L8.545 4.855H12.5L9.318 7.145L10.5 11L7 8.71L3.5 11L4.682 7.145L1.5 4.855H5.455L7 1Z"
                            fill="#7C3AED"/>
                        </svg>
                      }
                    />
                  )}
                  <ReqBadge
                    active={!!post.requirements.verified}
                    label="Verified sellers"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1L8.5 2.5H11V5L12.5 7L11 9V11.5H8.5L7 13L5.5 11.5H3V9L1.5 7L3 5V2.5H5.5L7 1Z"
                          stroke="#7C3AED" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M4.5 7L6.5 9L9.5 5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    }
                  />
                  <ReqBadge
                    active={!!post.requirements.licensed}
                    label="Licensed professionals"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="2" width="10" height="10" rx="2" stroke="#7C3AED" strokeWidth="1.2"/>
                        <path d="M4.5 7H9.5M4.5 5H7.5M4.5 9H6.5" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    }
                  />
                  <ReqBadge
                    active={!!post.requirements.businessOnly}
                    label="Business accounts"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 12V6L5 4V12M5 12H9M5 4H9M9 4L12 6V12M9 4V12" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="6" y="8" width="2" height="4" rx="0.5" fill="#7C3AED"/>
                      </svg>
                    }
                  />
                </div>
              </div>
            ) : null
          )}

          {/* ── Metadata strip ── */}
          <div style={{
            borderRadius: 16, border: '1px solid #F3F4F6',
            backgroundColor: '#F9FAFB',
            padding: '14px 16px', marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>Post Activity</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 8,
                backgroundColor: 'rgba(124,58,237,0.07)',
              }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#7C3AED" strokeWidth="1.2"/>
                  <path d="M6 3.5V6L7.5 7.5" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED' }}>
                  Expires {post.expiresDate}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {[
                {
                  label: 'Posted',
                  value: post.postedDate,
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/>
                      <path d="M1.5 5.5H12.5" stroke="#9CA3AF" strokeWidth="1.2"/>
                      <path d="M4.5 1.5V3.5M9.5 1.5V3.5" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ),
                },
                {
                  label: 'Views',
                  value: post.views.toLocaleString(),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M1 7C1 7 3.5 3 7 3s6 4 6 4-2.5 4-6 4S1 7 1 7Z" stroke="#9CA3AF" strokeWidth="1.2"/>
                      <circle cx="7" cy="7" r="1.5" stroke="#9CA3AF" strokeWidth="1.2"/>
                    </svg>
                  ),
                },
                {
                  label: 'Offers',
                  value: String(post.offers),
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M12 9C12 9.55 11.55 10 11 10H4L2 12V4C2 3.45 2.45 3 3 3H11C11.55 3 12 3.45 12 4V9Z" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                    {stat.icon}
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: 2 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick actions hint ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
            <span style={{ fontSize: '11px', color: '#D1D5DB', fontWeight: 500 }}>tap ••• for more actions</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#F3F4F6' }} />
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '12px 18px 30px',
        zIndex: 40,
      }}>
        <button
          type="button"
          onClick={onViewOffers}
          className="w-full flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
          style={{
            height: 56, borderRadius: 28,
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
            position: 'relative',
          }}
        >
          {/* Offer count bubble */}
          <div style={{
            position: 'absolute', left: 18,
            width: 34, height: 34, borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>{post.offers}</span>
          </div>

          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15.5 11C15.5 11.83 14.83 12.5 14 12.5H5L2.5 15V5C2.5 4.17 3.17 3.5 4 3.5H14C14.83 3.5 15.5 4.17 15.5 5V11Z"
              fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 7.5H12M6 10H10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>

          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>View Offers</span>

          {/* Arrow */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', right: 20 }}>
            <path d="M6 3L11 8L6 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Demo post data export ─────────────────────────────────── */
export const DEMO_POST: PostDetail = {
  id: '1',
  title: 'Need a React Native developer for marketplace app',
  status: 'Active',
  category: 'Web Development',
  subcategory: 'Full Stack',
  budgetMin: 2000,
  budgetMax: 5000,
  timeline: 'Within 2 weeks',
  location: 'Remote',
  postedDate: 'Apr 14',
  expiresDate: 'Apr 28',
  views: 284,
  offers: 7,
  description: `Looking for an experienced React Native developer to help build a two-sided marketplace app for freelance services. The app needs to support buyer and seller flows, in-app messaging, push notifications, payment integration (Stripe), and a custom post feed.\n\nWe have Figma designs ready and a Node.js backend partially built. Ideal candidate should have shipped at least 2 production React Native apps and be comfortable with TypeScript, Redux or Zustand, and REST API integration.\n\nThis is a 6–8 week engagement with possibility of ongoing work. Please include links to past work in your proposal.`,
  photos: [
    'https://images.unsplash.com/photo-1628233345409-349459e6f79a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFjdCUyMG5hdGl2ZSUyMG1vYmlsZSUyMGFwcCUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc3NjMxNzQ1OXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1604781109199-ced99b89b0f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RpbmclMjB3b3Jrc3BhY2UlMjBsYXB0b3AlMjBkZXNrfGVufDF8fHx8MTc3NjMxNzQ2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1624378515195-6bbdb73dff1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMGRldmVsb3BlciUyMHByb2dyYW1taW5nJTIwc2NyZWVufGVufDF8fHx8MTc3NjMxNzQ2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  ],
  requirements: {
    minRating: 4,
    verified: true,
    licensed: false,
    businessOnly: false,
  },
};
