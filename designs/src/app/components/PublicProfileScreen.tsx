'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  reviewerGradient: string;
  rating: number;
  text: string;
  date: string;
  isVerified: boolean;
}

export interface PublicProfileScreenProps {
  onBack: () => void;
  onMessage: () => void;
  onSaveSeller: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
const DEMO_REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    reviewerName: 'Alex Thompson',
    reviewerInitials: 'AT',
    reviewerGradient: 'linear-gradient(135deg,#3B82F6,#6366F1)',
    rating: 5,
    text: 'Priya delivered an incredible brand identity. Her attention to detail and understanding of our market was outstanding. Highly recommend!',
    date: 'Apr 8, 2026',
    isVerified: true,
  },
  {
    id: 'r2',
    reviewerName: 'Jordan Lee',
    reviewerInitials: 'JL',
    reviewerGradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
    rating: 5,
    text: 'Fast turnaround, great communication throughout the entire project. The final designs exceeded expectations.',
    date: 'Mar 22, 2026',
    isVerified: true,
  },
  {
    id: 'r3',
    reviewerName: 'Sam Rivera',
    reviewerInitials: 'SR',
    reviewerGradient: 'linear-gradient(135deg,#10B981,#14B8A6)',
    rating: 4,
    text: 'Really solid work on our logo redesign. A couple of extra revision rounds but the end result was perfect.',
    date: 'Mar 5, 2026',
    isVerified: true,
  },
];

/* ─── Helpers ────────────────────────────────────────────────── */
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

/* ─── Main component ────────────────────────────────────────── */
export function PublicProfileScreen({ onBack, onMessage, onSaveSeller }: PublicProfileScreenProps) {
  const [saved, setSaved] = useState(false);

  const badges = [
    { label: 'Email', verified: true },
    { label: 'ID', verified: true },
    { label: 'Licensed', verified: true },
    { label: 'Background', verified: true },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden" style={{ position: 'relative' }}>

      {/* ── Status Bar ── */}
      <div className="h-11 flex items-center justify-between px-6 pt-3 flex-shrink-0">
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div className="flex gap-1.5 items-center">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M0 4.8C2.67 2.06 6.15.5 8 .5s5.33 1.56 8 4.3L14.4 6.5C12.27 4.22 10.22 3 8 3S3.73 4.22 1.6 6.5L0 4.8Z" fill="#1F2937"/><path d="M8 6.5c1.1 0 2.27.5 3.2 1.35L9.6 9.5A2.5 2.5 0 0 0 8 9a2.5 2.5 0 0 0-1.6.5L4.8 7.85C5.73 7 6.9 6.5 8 6.5Z" fill="#1F2937"/><circle cx="8" cy="11.5" r="1" fill="#1F2937"/></svg>
          <svg width="15" height="11" viewBox="0 0 16 12" fill="none"><rect x="1" y="1" width="12" height="10" rx="2" stroke="#1F2937" strokeWidth="1.4"/><rect x="14" y="4" width="1.5" height="4" rx="0.75" fill="#1F2937"/><rect x="2.5" y="2.5" width="9" height="7" rx="1.2" fill="#1F2937"/></svg>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2 flex-shrink-0">
        <button type="button" onClick={onBack} className="flex items-center justify-center transition-all active:scale-90" style={{ width: 38, height: 38, borderRadius: 12, border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em', flex: 1 }}>
          Priya Sharma
        </h1>
        {/* Share / Report overflow */}
        <button type="button" className="flex items-center justify-center transition-all active:scale-90" style={{ width: 38, height: 38, borderRadius: 12, border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="3" r="1.2" fill="#6B7280"/>
            <circle cx="8" cy="8" r="1.2" fill="#6B7280"/>
            <circle cx="8" cy="13" r="1.2" fill="#6B7280"/>
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 120 }}>

        {/* ── Profile Hero ── */}
        <div className="flex flex-col items-center px-6 pt-4 pb-5">
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg,#EC4899,#F43F5E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(236,72,153,0.35)',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>PS</span>
          </div>

          <h2 style={{ fontSize: '21px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em', marginBottom: 6 }}>
            Priya Sharma
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <Stars rating={4.8} size={12} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>4.8</span>
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>· 61 reviews</span>
          </div>

          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: 4 }}>
            Member since January 2023
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C4.24 1 2 3.5 2 5.5C2 9.5 7 13 7 13S12 9.5 12 5.5C12 3.5 9.76 1 7 1Z" stroke="#9CA3AF" strokeWidth="1.2"/>
              <circle cx="7" cy="5.5" r="1.5" stroke="#9CA3AF" strokeWidth="1.2"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Dallas, TX</span>
          </div>
        </div>

        {/* ── Verification badges ── */}
        <div className="px-5" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {badges.map(b => (
              <div key={b.label} style={{
                padding: '5px 12px', borderRadius: 20,
                backgroundColor: b.verified ? 'rgba(16,185,129,0.08)' : '#F3F4F6',
                border: b.verified ? '1px solid rgba(16,185,129,0.22)' : '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {b.verified && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <span style={{ fontSize: '11px', fontWeight: 700, color: b.verified ? '#065F46' : '#6B7280' }}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-5" style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Rating', value: '4.8', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.8 5.2L13 5.6L9.9 8.4L10.8 12.5L7 10.2L3.2 12.5L4.1 8.4L1 5.6L5.2 5.2L7 1Z" fill="#F59E0B"/></svg> },
              { label: 'Completed', value: '124', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { label: 'Response', value: '< 1hr', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#7C3AED" strokeWidth="1.3"/><path d="M7 4V7L9 9" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/></svg> },
            ].map(stat => (
              <div key={stat.label} style={{
                borderRadius: 16, padding: '14px 10px',
                border: '1.5px solid #F0F0F0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                backgroundColor: 'white',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9,
                  backgroundColor: 'rgba(124,58,237,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {stat.icon}
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bio ── */}
        <div className="px-5">
          <Section>
            <SectionHeader
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              title="About"
            />
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65 }}>
                Professional graphic designer with 8+ years of experience specializing in brand identity, logo design, and marketing collateral. I've worked with startups and Fortune 500 companies alike, bringing creative vision to life through thoughtful, strategic design.
              </p>
            </div>
          </Section>

          {/* ── Reviews ── */}
          <Section>
            <SectionHeader
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 5.5L15 6L11.5 9.5L12.5 14.5L8 12L3.5 14.5L4.5 9.5L1 6L6 5.5L8 1Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinejoin="round"/></svg>}
              title="Reviews"
              accent="61 total"
            />
            <div style={{ padding: '14px 16px 4px' }}>
              {DEMO_REVIEWS.map((review, i) => (
                <div key={review.id} style={{
                  paddingBottom: i < DEMO_REVIEWS.length - 1 ? 14 : 10,
                  marginBottom: i < DEMO_REVIEWS.length - 1 ? 14 : 0,
                  borderBottom: i < DEMO_REVIEWS.length - 1 ? '1px solid #F6F6F6' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                      background: review.reviewerGradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: 'white' }}>{review.reviewerInitials}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>{review.reviewerName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Stars rating={review.rating} size={9} />
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{review.date}</span>
                  </div>
                  <p style={{
                    fontSize: '12px', color: '#4B5563', lineHeight: 1.6,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    marginBottom: 6,
                  }}>
                    {review.text}
                  </p>
                  {review.isVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669' }}>Verified Transaction</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ── Sticky action buttons ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 20px 24px',
        borderTop: '1px solid #F0F0F0',
        backgroundColor: 'white',
        display: 'flex', gap: 10,
      }}>
        {/* Message CTA */}
        <motion.button
          type="button"
          onClick={onMessage}
          whileTap={{ scale: 0.97 }}
          style={{
            flex: 2, height: 56, borderRadius: 24,
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
            position: 'relative', overflow: 'hidden',
          }}
        >
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
            <path d="M18 13C18 14.1 17.1 15 16 15H6L3 18V4C3 2.9 3.9 2 5 2H16C17.1 2 18 2.9 18 4V13Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Message</span>
        </motion.button>

        {/* Save Seller */}
        <button
          type="button"
          onClick={() => { setSaved(!saved); onSaveSeller(); }}
          className="transition-all active:scale-95"
          style={{
            flex: 1, height: 56, borderRadius: 24,
            border: saved ? '2px solid #7C3AED' : '1.5px solid #E5E7EB',
            backgroundColor: saved ? 'rgba(124,58,237,0.04)' : '#F9FAFB',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={saved ? '#7C3AED' : 'none'}>
            <path d="M3 2H13V14L8 10.5L3 14V2Z" stroke={saved ? '#7C3AED' : '#6B7280'} strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 700, color: saved ? '#7C3AED' : '#6B7280' }}>
            {saved ? 'Saved' : 'Save'}
          </span>
        </button>
      </div>
    </div>
  );
}
