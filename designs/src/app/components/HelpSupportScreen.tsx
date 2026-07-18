'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Types ──────────────────────────────────────────────────── */
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HelpSupportScreenProps {
  onBack: () => void;
}

/* ─── Demo data ──────────────────────────────────────────────── */
const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq1',
    question: 'How do I create a post?',
    answer: 'You can create a post by tapping the "+" button on the home screen. Choose between AI-assisted posting (recommended) or manual posting. Describe what you need, set your budget and timeline, and our AI will help optimize your listing for the best responses.',
  },
  {
    id: 'faq2',
    question: 'How does payment work?',
    answer: 'When you accept an offer, your payment is securely held in escrow through Stripe. Funds are only released to the seller after you confirm the work is complete. If there\'s a dispute, our team will review the evidence and make a fair resolution.',
  },
  {
    id: 'faq3',
    question: 'What is escrow?',
    answer: 'Escrow is a secure payment arrangement where a third party (Stripe) holds the buyer\'s funds until the work is completed and approved. This protects both buyers and sellers — buyers know their money is safe, and sellers know payment is guaranteed.',
  },
  {
    id: 'faq4',
    question: 'How do I become a verified seller?',
    answer: 'Go to your Profile > Verification Status to start the process. Basic verification requires email confirmation. For additional badges (Licensed, Insured, ID Verified, Background Checked), you\'ll need to submit the relevant documentation for review.',
  },
  {
    id: 'faq5',
    question: 'What if I have a dispute?',
    answer: 'If you\'re unsatisfied with completed work, you can file a dispute within 7 days. Provide evidence (photos, messages) and our support team will review the case. You can request up to 2 changes before escalating. Auto-release occurs after 7 days if no action is taken.',
  },
];

/* ─── Main component ────────────────────────────────────────── */
export function HelpSupportScreen({ onBack }: HelpSupportScreenProps) {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQ_ITEMS.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center gap-4 px-6 pt-4 pb-2 flex-shrink-0">
        <button type="button" onClick={onBack} className="flex items-center justify-center transition-all active:scale-90" style={{ width: 38, height: 38, borderRadius: 12, border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Help & Support
        </h1>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>

        {/* ── Search bar ── */}
        <div className="px-5 mt-3 mb-5">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            height: 48, borderRadius: 16,
            border: '1.5px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            padding: '0 14px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#9CA3AF" strokeWidth="1.4"/>
              <path d="M11 11L14 14" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
                fontSize: '14px', color: '#1F2937', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ── FAQ Section ── */}
        <div className="px-5 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Frequently Asked
          </p>

          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1.5px solid #F0F0F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            backgroundColor: 'white',
          }}>
            {filteredFaqs.map((faq, i) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div key={faq.id}>
                  {i > 0 && <div style={{ height: 1, backgroundColor: '#F6F6F6', marginLeft: 16, marginRight: 16 }} />}
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    style={{
                      width: '100%', padding: '14px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', flex: 1, lineHeight: 1.4 }}>
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ flexShrink: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5L7 9L11 5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 16px 14px' }}>
                          <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.65 }}>
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Contact Section ── */}
        <div className="px-5 mb-5">
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Contact Us
          </p>

          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1.5px solid #F0F0F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            backgroundColor: 'white',
          }}>
            {/* Email Support */}
            <button type="button" style={{
              width: '100%', padding: '13px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                backgroundColor: 'rgba(124,58,237,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="#7C3AED" strokeWidth="1.3"/>
                  <path d="M1 5L8 9L15 5" stroke="#7C3AED" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block' }}>Email Support</span>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>support@sorcyn.com</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ height: 1, backgroundColor: '#F6F6F6', marginLeft: 62 }} />

            {/* Live Chat */}
            <button type="button" style={{
              width: '100%', padding: '13px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                backgroundColor: 'rgba(124,58,237,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 10C14 11.1 13.1 12 12 12H6L3 15V4C3 2.9 3.9 2 5 2H12C13.1 2 14 2.9 14 4V10Z" stroke="#7C3AED" strokeWidth="1.3" strokeLinejoin="round"/>
                  <circle cx="6" cy="7" r="0.8" fill="#7C3AED"/>
                  <circle cx="8.5" cy="7" r="0.8" fill="#7C3AED"/>
                  <circle cx="11" cy="7" r="0.8" fill="#7C3AED"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Live Chat</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981' }}>Online</span>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Usually responds in minutes</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ height: 1, backgroundColor: '#F6F6F6', marginLeft: 62 }} />

            {/* Phone */}
            <button type="button" style={{
              width: '100%', padding: '13px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                backgroundColor: 'rgba(124,58,237,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14.3 11.3C14.3 11.7 14.2 12.1 13.9 12.5C13.7 12.8 13.4 13.1 13 13.3C12.4 13.6 11.7 13.8 11 13.8C10 13.8 8.9 13.5 7.8 13C6.7 12.4 5.6 11.7 4.6 10.7C3.6 9.7 2.8 8.6 2.3 7.5C1.7 6.4 1.5 5.3 1.5 4.3C1.5 3.6 1.6 3 1.9 2.4C2.2 1.8 2.6 1.3 3.2 0.9C3.9 0.4 4.6 0.2 5.4 0.2C5.7 0.2 6 0.3 6.2 0.4C6.5 0.6 6.7 0.8 6.8 1.2L8.2 3.8C8.3 4 8.4 4.2 8.4 4.4C8.4 4.6 8.3 4.8 8.2 5L7.4 6C7.3 6.1 7.3 6.2 7.3 6.3C7.3 6.4 7.3 6.4 7.4 6.5C7.5 6.7 7.7 7 8.1 7.4C8.5 7.8 8.8 8.1 9.1 8.3C9.2 8.4 9.3 8.4 9.4 8.4C9.5 8.4 9.6 8.3 9.7 8.3L10.5 7.5C10.7 7.3 10.9 7.2 11.1 7.2C11.3 7.2 11.5 7.3 11.7 7.4L14.3 8.8C14.6 9 14.8 9.2 14.9 9.5C15 9.7 15 10 15 10.3L14.3 11.3Z" stroke="#7C3AED" strokeWidth="1.2"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block' }}>Phone</span>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>+1 (469) 555-0123</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Legal Links ── */}
        <div className="px-5 mb-5">
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1.5px solid #F0F0F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            backgroundColor: 'white',
          }}>
            {['Privacy Policy', 'Terms of Service', 'Community Guidelines'].map((item, i) => (
              <div key={item}>
                {i > 0 && <div style={{ height: 1, backgroundColor: '#F6F6F6', marginLeft: 16, marginRight: 16 }} />}
                <button type="button" style={{
                  width: '100%', padding: '14px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  textAlign: 'left',
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{item}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 3L9 7L5 11" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── App version ── */}
        <div style={{ textAlign: 'center', paddingBottom: 16 }}>
          <p style={{ fontSize: '11px', color: '#D1D5DB' }}>Version 1.0.0 (Build 42)</p>
        </div>
      </div>
    </div>
  );
}
