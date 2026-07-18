import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PostSuccessScreenProps {
  postTitle?: string;
  postCategory?: string;
  budgetMin?: number;
  budgetMax?: number;
  onViewPost?: () => void;
  onCreateAnother?: () => void;
  onDashboard?: () => void;
}

/* ── Animated checkmark SVG paths ── */
function AnimatedCheck() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ display: 'block' }}>
      <motion.path
        d="M13 26L22 35L39 17"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.45 }}
      />
    </svg>
  );
}

/* ── Orbiting particle ── */
function Particle({ angle, delay, size = 6, color = '#A855F7' }: { angle: number; delay: number; size?: number; color?: string }) {
  const rad = (angle * Math.PI) / 180;
  const r = 90;
  const x = Math.cos(rad) * r;
  const y = Math.sin(rad) * r;
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], x, y, scale: [0, 1.2, 0] }}
      transition={{ duration: 0.85, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        top: '50%',
        left: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
        pointerEvents: 'none',
      }}
    />
  );
}

export function PostSuccessScreen({
  postTitle = 'Need a React Native developer for marketplace app',
  postCategory = 'Web Development',
  budgetMin = 2000,
  budgetMax = 5000,
  onViewPost,
  onCreateAnother,
  onDashboard,
}: PostSuccessScreenProps) {
  const [ringDone, setRingDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRingDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  const particles = [
    { angle: 0,   delay: 0.7,  size: 7,  color: '#A855F7' },
    { angle: 45,  delay: 0.75, size: 5,  color: '#7C3AED' },
    { angle: 90,  delay: 0.8,  size: 8,  color: '#C084FC' },
    { angle: 135, delay: 0.72, size: 5,  color: '#7C3AED' },
    { angle: 180, delay: 0.78, size: 7,  color: '#A855F7' },
    { angle: 225, delay: 0.74, size: 5,  color: '#C084FC' },
    { angle: 270, delay: 0.82, size: 8,  color: '#7C3AED' },
    { angle: 315, delay: 0.76, size: 5,  color: '#A855F7' },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">

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

      {/* ── Main content — centered ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-hidden">

        {/* ── Animated checkmark badge ── */}
        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>

          {/* Burst particles */}
          {particles.map((p, i) => (
            <Particle key={i} {...p} />
          ))}

          {/* Outer glow ring */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.05 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(124,58,237,0.12)',
            }}
          />

          {/* Pulsing ring after animation settles */}
          <AnimatePresence>
            {ringDone && (
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.22, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid rgba(168,85,247,0.5)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Circle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            style={{
              position: 'absolute', inset: 8, borderRadius: '50%',
              background: 'linear-gradient(145deg, #7C3AED 0%, #A855F7 100%)',
              boxShadow: '0 16px 40px rgba(124,58,237,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AnimatedCheck />
          </motion.div>
        </div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: 'easeOut' }}
          style={{ textAlign: 'center', marginBottom: 8 }}
        >
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
            Your post is live!
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, maxWidth: 280 }}>
            Sellers are already being notified. You&apos;ll start receiving offers shortly.
          </p>
        </motion.div>

        {/* ── Summary card ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: 'easeOut' }}
          style={{
            width: '100%',
            borderRadius: 20,
            border: '1.5px solid #EDE9FE',
            backgroundColor: '#FAFAFF',
            padding: '18px 18px 14px',
            marginTop: 24,
            marginBottom: 4,
          }}
        >
          {/* Card top accent bar */}
          <div style={{
            height: 3, borderRadius: 2,
            background: 'linear-gradient(90deg,#7C3AED,#A855F7)',
            marginBottom: 16,
          }} />

          {/* Post title */}
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#A78BFA', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
            Post Title
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', lineHeight: 1.4, marginBottom: 16 }}>
            {postTitle}
          </p>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: '#EDE9FE', marginBottom: 14 }} />

          {/* Meta row */}
          <div className="flex items-center justify-between">
            {/* Category */}
            <div className="flex items-center gap-2">
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1.5" fill="#7C3AED"/>
                  <rect x="9" y="2" width="5" height="5" rx="1.5" fill="#A855F7"/>
                  <rect x="2" y="9" width="5" height="5" rx="1.5" fill="#A855F7"/>
                  <rect x="9" y="9" width="5" height="5" rx="1.5" fill="#7C3AED" opacity="0.5"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>Category</p>
                <p style={{ fontSize: '13px', color: '#1F2937', fontWeight: 700 }}>{postCategory}</p>
              </div>
            </div>

            {/* Vertical divider */}
            <div style={{ width: 1, height: 34, backgroundColor: '#EDE9FE' }} />

            {/* Budget */}
            <div className="flex items-center gap-2">
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="#7C3AED" strokeWidth="1.4"/>
                  <path d="M8 4V4.5M8 11.5V12M6 9.25C6 10.08 6.9 10.75 8 10.75s2-.67 2-1.5S9.1 7.75 8 7.75 6 7.08 6 6.25 6.9 5.25 8 5.25s2 .67 2 1.5" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>Budget</p>
                <p style={{ fontSize: '13px', color: '#1F2937', fontWeight: 700 }}>
                  ${budgetMin.toLocaleString()}–${budgetMax.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Vertical divider */}
            <div style={{ width: 1, height: 34, backgroundColor: '#EDE9FE' }} />

            {/* Status */}
            <div className="flex items-center gap-2">
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>Status</p>
                <p style={{ fontSize: '13px', color: '#059669', fontWeight: 700 }}>Live</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Offer timer hint ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.95 }}
          className="flex items-center gap-2 mt-5"
        >
          <div style={{
            width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10B981',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
          }} />
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            Avg. first offer arrives within&nbsp;
            <span style={{ color: '#7C3AED', fontWeight: 700 }}>12 minutes</span>
          </span>
        </motion.div>
      </div>

      {/* ── Action buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85, ease: 'easeOut' }}
        style={{
          padding: '12px 20px 36px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(14px)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Primary – View My Post */}
        <button
          type="button"
          onClick={onViewPost}
          className="w-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            height: 54, borderRadius: 27,
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(124,58,237,0.38)',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="white" strokeWidth="1.5"/>
            <path d="M3 9C3 9 5.5 5 9 5s6 4 6 4-2.5 4-6 4S3 9 3 9Z" stroke="white" strokeWidth="1.5"/>
            <circle cx="9" cy="9" r="2" fill="white"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>View My Post</span>
        </button>

        {/* Secondary – Create Another Post */}
        <button
          type="button"
          onClick={onCreateAnother}
          className="w-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            height: 50, borderRadius: 25,
            background: 'white',
            border: '1.5px solid #7C3AED',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Create Another Post</span>
        </button>

        {/* Tertiary – Go to Dashboard */}
        <button
          type="button"
          onClick={onDashboard}
          className="w-full flex items-center justify-center gap-1.5 transition-all active:opacity-60"
          style={{ height: 40, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L13 8M3 8L7 4M3 8L7 12" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>Go to Dashboard</span>
        </button>
      </motion.div>
    </div>
  );
}
