'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
type DisputeStep = 'filed' | 'evidence' | 'review' | 'resolution';

export interface DisputeDetailScreenProps {
  onBack: () => void;
  onAddEvidence: () => void;
  onContactSupport: () => void;
}

/* ─── Step config ────────────────────────────────────────────── */
const STEPS: { id: DisputeStep; label: string; sublabel: string }[] = [
  { id: 'filed',      label: 'Dispute Filed',      sublabel: 'Submitted on Apr 15, 2026'    },
  { id: 'evidence',   label: 'Evidence Submitted',  sublabel: 'Photos and description added'  },
  { id: 'review',     label: 'Under Review',        sublabel: 'Support team reviewing'        },
  { id: 'resolution', label: 'Resolution',          sublabel: 'Pending outcome'               },
];

const STEP_ORDER = STEPS.map(s => s.id);

function stepIndex(id: DisputeStep) { return STEP_ORDER.indexOf(id); }

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
function DisputeTimeline({ currentStep }: { currentStep: DisputeStep }) {
  const cur = stepIndex(currentStep);

  return (
    <Section>
      <SectionHeader
        icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#7C3AED" strokeWidth="1.5"/><path d="M8 5V8L10 10" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        title="Dispute Timeline"
      />
      <div style={{ padding: '16px 16px 16px 20px' }}>
        {STEPS.map((step, i) => {
          const isDone   = i < cur;
          const isActive = i === cur;
          const isFuture = i > cur;
          const isLast   = i === STEPS.length - 1;

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
                    <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>Done</span>
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

/* ─── Main component ────────────────────────────────────────── */
export function DisputeDetailScreen({
  onBack,
  onAddEvidence,
  onContactSupport,
}: DisputeDetailScreenProps) {
  const currentStep: DisputeStep = 'review';

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
          Dispute
        </h1>
        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20,
          backgroundColor: 'rgba(245,158,11,0.1)',
        }}>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#F59E0B' }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400E' }}>Under Review</span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: 140 }}>

        {/* ── Transaction Summary ── */}
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><path d="M1 7H15" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><circle cx="4.5" cy="10.5" r="1" fill="#7C3AED"/></svg>}
            title="Transaction Summary"
          />
          <div style={{ padding: '14px 16px' }}>
            {[
              { label: 'Post', value: 'Logo + brand identity' },
              { label: 'Amount', value: '$950', accent: true },
              { label: 'Parties', value: 'You vs. Priya Sharma' },
              { label: 'Filed', value: 'Apr 15, 2026' },
            ].map((row, i) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: i < 3 ? 10 : 0,
                marginBottom: i < 3 ? 10 : 0,
                borderBottom: i < 3 ? '1px solid #F6F6F6' : 'none',
              }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>{row.label}</span>
                <span style={{
                  fontSize: row.accent ? '16px' : '13px',
                  fontWeight: row.accent ? 800 : 600,
                  color: row.accent ? '#7C3AED' : '#1F2937',
                  letterSpacing: row.accent ? '-0.02em' : 'normal',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Dispute Timeline ── */}
        <DisputeTimeline currentStep={currentStep} />

        {/* ── Evidence ── */}
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><circle cx="5.5" cy="6.5" r="1.5" stroke="#7C3AED" strokeWidth="1.2"/><path d="M1 11L5 7.5L7.5 9.5L11 6L15 10" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Your Evidence"
          />
          <div style={{ padding: '14px 16px' }}>
            {/* Photo thumbnails */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {[1, 2].map(idx => (
                <div key={idx} style={{
                  width: 80, height: 80, borderRadius: 14,
                  backgroundColor: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid #E5E7EB',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="3" width="20" height="18" rx="3" stroke="#D1D5DB" strokeWidth="1.5"/>
                    <circle cx="8" cy="9" r="2" stroke="#D1D5DB" strokeWidth="1.3"/>
                    <path d="M2 16L7 11L10 14L15 9L22 15" stroke="#D1D5DB" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
            {/* Description */}
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65 }}>
              The delivered work does not match the agreed scope. The logo concepts were not based on the initial moodboard we approved, and the brand guide is missing the typography section that was explicitly outlined in the project brief.
            </p>
          </div>
        </Section>

        {/* ── Support Agent ── */}
        <Section>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="#7C3AED" strokeWidth="1.4"/><path d="M2 14C2 11.24 4.69 9 8 9s6 2.24 6 5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            title="Assigned Agent"
          />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg,#6366F1,#818CF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.5)',
              }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>ST</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', display: 'block' }}>Sarah T.</span>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Support Team</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 8,
                backgroundColor: 'rgba(124,58,237,0.06)',
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="#7C3AED" strokeWidth="1"/>
                  <path d="M5 3V5L6.5 6.5" stroke="#7C3AED" strokeWidth="0.9" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#7C3AED' }}>~2 hrs</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Resolution (grayed out / collapsed) ── */}
        <Section style={{ opacity: 0.5 }}>
          <SectionHeader
            icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8L6 12L14 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Resolution"
            accent="Pending"
          />
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>
              The resolution will appear here once the support team completes their review.
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
        display: 'flex', gap: 10,
      }}>
        {/* Add Evidence */}
        <button
          type="button"
          onClick={onAddEvidence}
          className="transition-all active:scale-95"
          style={{
            flex: 1, height: 52, borderRadius: 20,
            border: '1.5px solid rgba(124,58,237,0.3)',
            backgroundColor: 'rgba(124,58,237,0.04)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Add Evidence</span>
        </button>

        {/* Contact Support */}
        <motion.button
          type="button"
          onClick={onContactSupport}
          whileTap={{ scale: 0.97 }}
          style={{
            flex: 1, height: 52, borderRadius: 20,
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 10C14 11.1 13.1 12 12 12H6L3 15V4C3 2.9 3.9 2 5 2H12C13.1 2 14 2.9 14 4V10Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Contact Support</span>
        </motion.button>
      </div>
    </div>
  );
}
