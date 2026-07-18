'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
interface PayoutItem {
  id: string;
  amount: number;
  date: string;
  bank: string;
  last4: string;
  status: 'completed' | 'processing';
}

export interface SellerEarningsScreenProps {
  onBack: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
const CHART_DATA = [
  { month: 'Nov', value: 1800 },
  { month: 'Dec', value: 2400 },
  { month: 'Jan', value: 1950 },
  { month: 'Feb', value: 2800 },
  { month: 'Mar', value: 3100 },
  { month: 'Apr', value: 3450 },
];

const MAX_CHART = Math.max(...CHART_DATA.map(d => d.value));

const PAYOUTS: PayoutItem[] = [
  { id: 'p1', amount: 850,   date: 'Apr 12, 2026', bank: 'Chase',     last4: '4242', status: 'completed'  },
  { id: 'p2', amount: 1200,  date: 'Apr 5, 2026',  bank: 'Chase',     last4: '4242', status: 'completed'  },
  { id: 'p3', amount: 650,   date: 'Mar 28, 2026',  bank: 'Chase',     last4: '4242', status: 'completed'  },
  { id: 'p4', amount: 750,   date: 'Mar 21, 2026',  bank: 'BofA',      last4: '8891', status: 'processing' },
];

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

/* ─── Main component ────────────────────────────────────────── */
export function SellerEarningsScreen({ onBack }: SellerEarningsScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeBar, setActiveBar] = useState(CHART_DATA.length - 1);

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">

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
          Earnings
        </h1>
        {/* Period selector */}
        <button type="button" className="flex items-center gap-1.5 transition-all active:scale-95" style={{
          padding: '6px 12px', borderRadius: 10,
          border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB',
          cursor: 'pointer',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>This Month</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* ── Summary cards ── */}
        <div className="px-5 mt-3 mb-4">
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {/* Total Earned */}
            <div style={{
              minWidth: 140, flex: 1, borderRadius: 20, padding: '14px 16px',
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, marginBottom: 10,
                backgroundColor: 'rgba(16,185,129,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#10B981" strokeWidth="1.3"/>
                  <path d="M7 4V4.5M7 9.5V10M5 8.5C5 9.05 5.9 9.5 7 9.5s2-.45 2-1S8.1 7 7 7 5 6.55 5 6s.9-1.5 2-1.5 2 .45 2 1" stroke="#10B981" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: 2 }}>
                $12,450
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>Total Earned</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 8V2M5 2L3 4M5 2L7 4" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#10B981' }}>+12%</span>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div style={{
              minWidth: 120, flex: 1, borderRadius: 20, padding: '14px 16px',
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, marginBottom: 10,
                backgroundColor: 'rgba(245,158,11,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#F59E0B" strokeWidth="1.3"/>
                  <path d="M7 4.5V7L9 9" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: 2 }}>
                $1,200
              </p>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>Pending</span>
            </div>

            {/* This Month */}
            <div style={{
              minWidth: 120, flex: 1, borderRadius: 20, padding: '14px 16px',
              border: '1.5px solid #F0F0F0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              backgroundColor: 'white',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9, marginBottom: 10,
                backgroundColor: 'rgba(124,58,237,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 10V6M5 10V4M8 10V7M11 10V3" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em', marginBottom: 2 }}>
                $3,450
              </p>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>This Month</span>
            </div>
          </div>
        </div>

        {/* ── Bar chart ── */}
        <div className="px-5 mb-4">
          <Section>
            <div style={{ padding: '16px 16px 10px' }}>
              {/* Y-axis labels + bars */}
              <div style={{ display: 'flex', gap: 6 }}>
                {/* Y-axis */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 140, paddingBottom: 20 }}>
                  {['$4k', '$3k', '$2k', '$1k', '$0'].map(label => (
                    <span key={label} style={{ fontSize: '9px', fontWeight: 600, color: '#D1D5DB' }}>{label}</span>
                  ))}
                </div>

                {/* Bars */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
                  {CHART_DATA.map((d, i) => {
                    const isActive = activeBar === i;
                    const height = (d.value / MAX_CHART) * 110;
                    return (
                      <div
                        key={d.month}
                        onClick={() => setActiveBar(i)}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                      >
                        {/* Amount tooltip */}
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              padding: '3px 8px', borderRadius: 8,
                              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                              boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                            }}
                          >
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>
                              ${(d.value / 1000).toFixed(1)}k
                            </span>
                          </motion.div>
                        )}
                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height }}
                          transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                          style={{
                            width: '100%', borderRadius: 8,
                            background: isActive
                              ? 'linear-gradient(180deg,#7C3AED,#A855F7)'
                              : 'linear-gradient(180deg,rgba(124,58,237,0.2),rgba(168,85,247,0.15))',
                            boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                            transition: 'background 0.2s, box-shadow 0.2s',
                          }}
                        />
                        {/* Month label */}
                        <span style={{
                          fontSize: '10px', fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#7C3AED' : '#9CA3AF',
                        }}>
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Period chips */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14 }}>
                {(['week', 'month', 'year'] as const).map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedPeriod(period)}
                    style={{
                      padding: '5px 16px', borderRadius: 10,
                      background: selectedPeriod === period ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'transparent',
                      border: selectedPeriod === period ? 'none' : '1px solid #E5E7EB',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      fontSize: '12px', fontWeight: 600,
                      color: selectedPeriod === period ? 'white' : '#6B7280',
                      textTransform: 'capitalize',
                    }}>
                      {period}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* ── Recent Payouts ── */}
        <div className="px-5 mb-4">
          <Section>
            <SectionHeader
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#7C3AED" strokeWidth="1.4"/><path d="M1 7H15" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round"/><circle cx="4.5" cy="10.5" r="1" fill="#7C3AED"/></svg>}
              title="Recent Payouts"
            />
            <div style={{ padding: '14px 16px 4px' }}>
              {PAYOUTS.map((payout, i) => (
                <div key={payout.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  paddingBottom: i < PAYOUTS.length - 1 ? 14 : 10,
                  marginBottom: i < PAYOUTS.length - 1 ? 14 : 0,
                  borderBottom: i < PAYOUTS.length - 1 ? '1px solid #F6F6F6' : 'none',
                }}>
                  {/* Status circle */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    backgroundColor: payout.status === 'completed' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {payout.status === 'completed' ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="#F59E0B" strokeWidth="1.3"/>
                        <path d="M7 4.5V7L9 8.5" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', display: 'block' }}>
                      ${payout.amount.toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{payout.date}</span>
                      <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{payout.bank} ····{payout.last4}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    padding: '3px 9px', borderRadius: 8,
                    backgroundColor: payout.status === 'completed' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${payout.status === 'completed' ? 'rgba(16,185,129,0.22)' : 'rgba(245,158,11,0.22)'}`,
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      color: payout.status === 'completed' ? '#065F46' : '#92400E',
                      textTransform: 'capitalize',
                    }}>
                      {payout.status === 'completed' ? 'Completed' : 'Processing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Tax Documents ── */}
        <div className="px-5 mb-4">
          <Section>
            <SectionHeader
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 1H10L14 5V14C14 14.55 13.55 15 13 15H4C3.45 15 3 14.55 3 14V2C3 1.45 3.45 1 4 1Z" stroke="#7C3AED" strokeWidth="1.3"/><path d="M10 1V5H14" stroke="#7C3AED" strokeWidth="1.3" strokeLinejoin="round"/></svg>}
              title="Tax Documents"
            />
            <div style={{ padding: '14px 16px' }}>
              <button type="button" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: 0,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#6B7280' }}>PDF</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block' }}>1099-K Tax Form</span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Tax Year 2025</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V12" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
