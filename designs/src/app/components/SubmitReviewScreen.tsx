'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SubmitReviewScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const RATING_COLORS = ['', '#EF4444', '#F59E0B', '#84CC16', '#10B981', '#7C3AED'];
const CATEGORY_LABELS = ['Quality', 'Communication', 'Timeliness', 'Professionalism', 'Value'];

export function SubmitReviewScreen({ onBack, onSubmit }: SubmitReviewScreenProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryRating = (category: string, rating: number) => {
    setCategoryRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = () => {
    if (overallRating === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit();
    }, 1200);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden" style={{ position: 'relative' }}>
      {/* Status Bar */}
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

      {/* App Bar */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            border: '1.5px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Leave a Review
        </h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 18px', paddingBottom: 120 }}>

        {/* Transaction Summary Card */}
        <div
          style={{
            borderRadius: 20,
            border: '1.5px solid #F0F0F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: '16px',
            marginBottom: 24,
          }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
            <div
              className="flex items-center justify-center"
              style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(124,58,237,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 2H12C13.1 2 14 2.9 14 4V14L12 12.5L10 14L8 12.5L6 14L4 12.5L2 14V4C2 2.9 2.9 2 4 2Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 6H11M5 9H9" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1F2937', letterSpacing: '0.01em' }}>
              Transaction Summary
            </span>
          </div>

          {/* Seller row */}
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>PS</span>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>Priya Sharma</p>
              <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <svg key={s} width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L8.76 4.56L12.73 5.14L9.87 7.94L10.52 11.89L7 10.04L3.48 11.89L4.13 7.94L1.27 5.14L5.24 4.56L7 1Z" fill={s <= 4 ? '#F59E0B' : (s === 5 ? '#E5E7EB' : '#E5E7EB')} stroke={s <= 4 ? '#F59E0B' : '#E5E7EB'} strokeWidth="0.8"/>
                  </svg>
                ))}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', marginLeft: 3 }}>4.8</span>
              </div>
            </div>
          </div>

          {/* Service + Amount */}
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Logo + brand identity</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937' }}>$950.00</span>
          </div>

          {/* Verified badge */}
          <div
            className="flex items-center gap-1.5"
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              width: 'fit-content',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M4 7L6 9L10 5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="6" stroke="#059669" strokeWidth="1.2"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>Verified Transaction</span>
          </div>
        </div>

        {/* Overall Star Rating */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: 14, textAlign: 'center' }}>
            How was your experience?
          </p>
          <div className="flex justify-center gap-2" style={{ marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button
                key={star}
                type="button"
                onClick={() => setOverallRating(star)}
                whileTap={{ scale: 1.2 }}
                className="transition-all"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 4L24.47 13.06L34.52 14.52L27.26 21.6L28.94 31.6L20 26.88L11.06 31.6L12.74 21.6L5.48 14.52L15.53 13.06L20 4Z"
                    fill={star <= overallRating ? '#F59E0B' : '#E5E7EB'}
                    stroke={star <= overallRating ? '#F59E0B' : '#E5E7EB'}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {overallRating > 0 && (
              <motion.p
                key={overallRating}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: RATING_COLORS[overallRating],
                  textAlign: 'center',
                }}
              >
                {RATING_LABELS[overallRating]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Category Ratings (expandable) */}
        <div
          style={{
            borderRadius: 20,
            border: '1.5px solid #F0F0F0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setShowCategories(v => !v)}
            className="w-full flex items-center justify-between transition-all active:bg-gray-50"
            style={{
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
              Detailed Ratings (optional)
            </span>
            <motion.div
              animate={{ rotate: showCategories ? 180 : 0 }}
              transition={{ duration: 0.22 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M5 7L9 11L13 7" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {showCategories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ borderTop: '1px solid #F0F0F0', padding: '12px 16px' }}>
                  {CATEGORY_LABELS.map((cat, idx) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between"
                      style={{
                        padding: '10px 0',
                        borderBottom: idx < CATEGORY_LABELS.length - 1 ? '1px solid #F8F8F8' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>{cat}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleCategoryRating(cat, star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1 }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2L14.94 7.96L21.54 8.92L16.77 13.56L17.88 20.12L12 17.02L6.12 20.12L7.23 13.56L2.46 8.92L9.06 7.96L12 2Z"
                                fill={star <= (categoryRatings[cat] || 0) ? '#F59E0B' : '#E5E7EB'}
                                stroke={star <= (categoryRatings[cat] || 0) ? '#F59E0B' : '#E5E7EB'}
                                strokeWidth="1"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Review Text */}
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
              Written Review (optional)
            </label>
            <span style={{ fontSize: '12px', fontWeight: 600, color: reviewText.length > 1800 ? '#EF4444' : '#9CA3AF' }}>
              {reviewText.length}/2000
            </span>
          </div>
          <textarea
            value={reviewText}
            onChange={e => { if (e.target.value.length <= 2000) setReviewText(e.target.value); }}
            placeholder="Share your experience..."
            rows={5}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 16px',
              borderRadius: 14,
              border: `1.5px solid ${reviewText.length > 0 ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: reviewText.length > 0 ? 'rgba(124,58,237,0.03)' : 'white',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#1F2937',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Inter, sans-serif',
              minHeight: 120,
              transition: 'border-color 0.18s, background-color 0.18s',
            }}
          />
        </div>

        {/* Would Recommend Toggle */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '14px 16px',
            borderRadius: 16,
            border: '1.5px solid #F0F0F0',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
            Would you recommend this seller?
          </span>
          <div
            className="relative flex-shrink-0"
            style={{
              width: 44,
              height: 26,
              borderRadius: 13,
              backgroundColor: wouldRecommend ? '#7C3AED' : '#D1D5DB',
              transition: 'background-color 0.22s ease',
              cursor: 'pointer',
            }}
            onClick={() => setWouldRecommend(v => !v)}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: wouldRecommend ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.22s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sticky Submit Button */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '12px 18px 30px',
          zIndex: 40,
        }}
      >
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={overallRating === 0 || isSubmitting}
          whileTap={{ scale: overallRating === 0 ? 1 : 0.97 }}
          className="w-full flex items-center justify-center gap-2"
          style={{
            height: 56,
            borderRadius: 24,
            background: overallRating > 0
              ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              : '#E5E7EB',
            border: 'none',
            cursor: overallRating > 0 ? 'pointer' : 'not-allowed',
            boxShadow: overallRating > 0 ? '0 8px 20px rgba(124,58,237,0.35)' : 'none',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          {/* Shimmer */}
          {!isSubmitting && overallRating > 0 && (
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
          )}
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white' }}
            />
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 700, color: overallRating > 0 ? 'white' : '#9CA3AF' }}>
              Submit Review
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
