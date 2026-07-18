'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
export interface OfferDetailSeller {
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

export interface OfferDetailData {
  id: string;
  postTitle: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
  seller: OfferDetailSeller;
  quoteAmount: number;
  buyerFeePct: number;
  message: string;
  timeline: string;
  submittedAt: string;
}

export interface OfferDetailScreenProps {
  offer?: OfferDetailData;
  onBack: () => void;
  onAccept: () => void;
  onCounter: () => void;
  onDecline: () => void;
  onMessage: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
const DEMO_OFFER: OfferDetailData = {
  id: 'offer-001',
  postTitle: 'Logo + brand identity for fintech startup',
  status: 'pending',
  seller: {
    name: 'Marcus Chen',
    initials: 'MC',
    gradient: 'linear-gradient(135deg,#3B82F6,#2DD4BF)',
    rating: 4.9,
    reviews: 87,
    isVerified: true,
    responseTime: '< 1hr',
    completionRate: 98,
    jobsDone: 124,
  },
  quoteAmount: 450,
  buyerFeePct: 5,
  message: "Hi! I'd love to work on your brand identity. I have 8+ years of experience with fintech branding and have created identities for several Y Combinator startups. I can deliver 3 initial concepts within 3 days, with 2 revision rounds included. My process includes a discovery call, moodboard, logo concepts, and full brand guide with color palette, typography, and usage guidelines.",
  timeline: '5-7 business days',
  submittedAt: 'Apr 14, 2026 · 2:34 PM',
};

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

/* ─── Status badge config ────────────────────────────────────── */
const STATUS_CONFIG: Record<OfferDetailData['status'], { label: string; color: string; bg: string; dotColor: string }> = {
  pending:   { label: 'Pending Review',  color: '#92400E', bg: 'rgba(245,158,11,0.1)',  dotColor: '#F59E0B' },
  accepted:  { label: 'Accepted',        color: '#065F46', bg: 'rgba(16,185,129,0.1)',  dotColor: '#10B981' },
  declined:  { label: 'Declined',        color: '#991B1B', bg: 'rgba(239,68,68,0.1)',   dotColor: '#EF4444' },
  countered: { label: 'Counter Sent',    color: '#5B21B6', bg: 'rgba(124,58,237,0.1)',  dotColor: '#7C3AED' },
  expired:   { label: 'Expired',         color: '#6B7280', bg: 'rgba(107,114,128,0.1)', dotColor: '#9CA3AF' },
};

/* ─── Main component ────────────────────────────────────────── */
export function OfferDetailScreen({
  offer = DEMO_OFFER,
  onBack,
  onAccept,
  onCounter,
  onDecline,
  onMessage,
}: OfferDetailScreenProps) {
  const [shimmerKey] = useState(0);
  const statusCfg = STATUS_CONFIG[offer.status];

  const buyerFee = offer.quoteAmount * (offer.buyerFeePct / 100);
  const stripeFee = (offer.quoteAmount + buyerFee) * 0.029 + 0.30;
  const total = offer.quoteAmount + buyerFee + stripeFee;

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
          Offer Details
        </h1>
        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20,
          backgroundColor: statusCfg.bg,
        }}>
          <motion.div
            animate={offer.status === 'pending' ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: statusCfg.dotColor }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: statusCfg.color }}>{statusCfg.label}</span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: 180 }}>

        {/* ── Seller Profile Card ── */}
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
                background: offer.seller.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                border: '2.5px solid rgba(255,255,255,0.9)',
                position: 'relative',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>{offer.seller.initials}</span>
                {offer.seller.isVerified && (
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
                    {offer.seller.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <Stars rating={offer.seller.rating} size={11} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>{offer.seller.rating.toFixed(1)}</span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>({offer.seller.reviews})</span>
                </div>
                {/* Stat chips */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>Response: {offer.seller.responseTime}</span>
                  </div>
                  <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>Jobs: {offer.seller.jobsDone}</span>
                  </div>
                  <div style={{ padding: '3px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280' }}>Rate: {offer.seller.completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Cost Breakdown ── */}
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><path d="M1 7H15" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><circle cx="4.5" cy="10.5" r="1" fill="#7C3AED"/></svg>}
            title="Cost Breakdown"
          />
          <div style={{ padding: '14px 16px 4px' }}>
            {/* Offer price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 13, marginBottom: 13, borderBottom: '1px solid #F6F6F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#7C3AED' }} />
                <span style={{ fontSize: '13px', color: '#4B5563' }}>Offer price</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                ${offer.quoteAmount.toLocaleString()}
              </span>
            </div>

            {/* Buyer service fee */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 13, marginBottom: 13, borderBottom: '1px solid #F6F6F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#A855F7' }} />
                <div>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>Buyer service fee </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#A855F7' }}>({offer.buyerFeePct}%)</span>
                </div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                +${buyerFee.toFixed(2)}
              </span>
            </div>

            {/* Stripe processing */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 13, marginBottom: 13, borderBottom: '1px solid #F6F6F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#635BFF' }} />
                <div>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>Payment processing </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#635BFF' }}>(2.9% + $0.30)</span>
                </div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                +${stripeFee.toFixed(2)}
              </span>
            </div>

            {/* Total row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.2"/>
                    <path d="M6 3.5V4M6 8V8.5M4 7C4 7.55 4.9 8 6 8S8 7.55 8 7 7.1 6 6 6 4 5.55 4 5 4.9 4 6 4s2 .45 2 1" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937' }}>Total charge</span>
              </div>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#1F2937', letterSpacing: '-0.03em' }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Escrow notice */}
          <div style={{
            margin: '0 16px 16px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="6" width="10" height="7" rx="2" stroke="#10B981" strokeWidth="1.3"/>
              <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2C8.38 2 9.5 3.12 9.5 4.5V6" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="9.5" r="1" fill="#10B981"/>
            </svg>
            <p style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              Funds held in escrow — released when work is complete
            </p>
          </div>
        </Section>

        {/* ── Timeline ── */}
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#7C3AED" strokeWidth="1.5"/><path d="M8 5V8L10 10" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            title="Timeline"
          />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="#6B7280" strokeWidth="1.3"/>
                <path d="M5 1V4M11 1V4M2 7H14" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                Estimated: {offer.timeline}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 6, marginLeft: 22 }}>
              Submitted {offer.submittedAt}
            </p>
          </div>
        </Section>

        {/* ── Seller Message ── */}
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 10C14 11.1 13.1 12 12 12H6L3 15V4C3 2.9 3.9 2 5 2H12C13.1 2 14 2.9 14 4V10Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinejoin="round"/></svg>}
            title="Seller Message"
          />
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65 }}>
              {offer.message}
            </p>
          </div>
        </Section>
      </div>

      {/* ── Sticky action buttons ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 20px 24px',
        borderTop: '1px solid #F0F0F0',
        backgroundColor: 'white',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Accept CTA */}
        <motion.button
          type="button"
          onClick={onAccept}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', height: 56, borderRadius: 24,
            background: 'linear-gradient(135deg,#7C3AED 0%,#A855F7 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Shimmer */}
          <motion.div
            key={shimmerKey}
            animate={{ x: ['-130%', '230%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '35%',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',
              transform: 'skewX(-15deg)', pointerEvents: 'none',
            }}
          />
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 9L7 13L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Accept Offer</span>
        </motion.button>

        {/* Secondary buttons row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Decline */}
          <button
            type="button"
            onClick={onDecline}
            className="transition-all active:scale-95"
            style={{
              flex: 1, height: 44, borderRadius: 14,
              border: '1.5px solid rgba(239,68,68,0.3)',
              backgroundColor: 'rgba(239,68,68,0.04)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>Decline</span>
          </button>

          {/* Counter */}
          <button
            type="button"
            onClick={onCounter}
            className="transition-all active:scale-95"
            style={{
              flex: 1, height: 44, borderRadius: 14,
              border: '1.5px solid rgba(124,58,237,0.3)',
              backgroundColor: 'rgba(124,58,237,0.04)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M12 7H2" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED' }}>Counter</span>
          </button>

          {/* Message */}
          <button
            type="button"
            onClick={onMessage}
            className="transition-all active:scale-95"
            style={{
              flex: 1, height: 44, borderRadius: 14,
              border: '1.5px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 9C12 9.73 11.37 10 10.64 10H4.36L2 12V3.36C2 2.61 2.61 2 3.36 2H10.64C11.37 2 12 2.61 12 3.36V9Z" stroke="#6B7280" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}
