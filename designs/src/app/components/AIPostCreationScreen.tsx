import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface AIPostCreationScreenProps {
  onBack: () => void;
  onPost?: () => void;
}

type GenerationState = 'idle' | 'generating' | 'done';

const CATEGORIES = [
  'Home Services',
  'Graphic Design',
  'Web Development',
  'Writing & Translation',
  'Photography',
  'Marketing',
  'Legal',
  'Finance & Accounting',
  'Tutoring & Education',
  'Moving & Logistics',
  'Health & Wellness',
  'Other',
];

const MOCK_RESULT = {
  title: 'Professional Logo Design for Tech Startup',
  description:
    "Looking for an experienced graphic designer to create a modern, minimalist logo for our early-stage SaaS startup. The logo should convey trust, innovation, and simplicity. We'll need source files in SVG/AI and a brand-colour guide.",
  category: 'Graphic Design',
  budgetMin: '150',
  budgetMax: '400',
  location: 'Remote (Worldwide)',
};

const PLACEHOLDER_TEXT = 'Describe what you need\u2026\n\ne.g. \u201cI need a logo for my new coffee brand. Something warm and modern, maybe with a sun or leaf motif. Budget is flexible.\u201d';

function SparkleIcon({ size = 16, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2L11.5 7.5H17L12.5 11L14 17L10 13.5L6 17L7.5 11L3 7.5H8.5L10 2Z" fill={color} />
    </svg>
  );
}

function AIField({
  label,
  delay = 0,
  children,
}: {
  label: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED', letterSpacing: '0.03em' }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#A855F7',
            backgroundColor: 'rgba(124,58,237,0.1)',
            borderRadius: 6,
            padding: '1px 6px',
            letterSpacing: '0.04em',
          }}
        >
          AI
        </span>
      </div>
      {children}
    </motion.div>
  );
}

const aiFieldStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(124,58,237,0.06)',
  border: '1.5px solid rgba(124,58,237,0.22)',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: '14px',
  color: '#1F2937',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  lineHeight: '1.55',
  boxSizing: 'border-box',
};

export function AIPostCreationScreen({ onBack, onPost }: AIPostCreationScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [genState, setGenState] = useState<GenerationState>('idle');
  const [dotCount, setDotCount] = useState(1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (genState !== 'generating') return;
    const id = setInterval(() => setDotCount(d => (d % 3) + 1), 400);
    return () => clearInterval(id);
  }, [genState]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenState('generating');
    setTimeout(() => {
      setTitle(MOCK_RESULT.title);
      setDescription(MOCK_RESULT.description);
      setCategory(MOCK_RESULT.category);
      setBudgetMin(MOCK_RESULT.budgetMin);
      setBudgetMax(MOCK_RESULT.budgetMax);
      setLocation(MOCK_RESULT.location);
      setGenState('done');
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }, 2200);
  };

  const canGenerate = prompt.trim().length > 0 && genState !== 'generating';

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">

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
      <div className="flex items-center gap-3 px-5 pt-3 pb-4 flex-shrink-0">
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
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em' }}>
          AI-Assisted Post
        </h1>
        <div
          className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}
        >
          <SparkleIcon size={12} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>AI</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 px-6 mb-5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>Method</span>
        </div>
        <div style={{ flex: 1, height: 2, borderRadius: 1, background: 'linear-gradient(90deg,#7C3AED,#A855F7)' }} />
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 0 3px rgba(124,58,237,0.2)' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>2</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>Details</span>
        </div>
        <div style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: '#E5E7EB' }} />
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB' }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF' }}>3</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>Review</span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6" style={{ paddingBottom: 100 }}>

        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 6 }}>
          Describe what you need
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: 18 }}>
          Write naturally — our AI will structure your post, suggest a budget, and fill in the details.
        </p>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={PLACEHOLDER_TEXT}
            rows={6}
            style={{
              width: '100%',
              backgroundColor: '#F9FAFB',
              border: '1.5px solid #E5E7EB',
              borderRadius: 16,
              padding: '14px 16px',
              fontSize: '14px',
              color: '#1F2937',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.6',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            disabled={genState === 'generating'}
          />
          <span
            style={{
              position: 'absolute', bottom: 10, right: 14,
              fontSize: '11px',
              color: prompt.length > 0 ? '#9CA3AF' : 'transparent',
            }}
          >
            {prompt.length} chars
          </span>
        </div>

        {/* Tip */}
        <div
          className="flex gap-2 mb-5 p-3 rounded-2xl"
          style={{ backgroundColor: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)' }}
        >
          <SparkleIcon size={14} color="#7C3AED" />
          <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.55', margin: 0 }}>
            <span style={{ fontWeight: 600, color: '#7C3AED' }}>Tip: </span>
            Mention the type of work, your timeline, preferred style, and any budget range for best results.
          </p>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            height: 52,
            borderRadius: 24,
            background: canGenerate ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' : '#E5E7EB',
            border: 'none',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            boxShadow: canGenerate ? '0 8px 20px rgba(124,58,237,0.35)' : 'none',
            transition: 'all 0.2s ease',
            marginBottom: 32,
          }}
        >
          {genState === 'generating' ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2.5px solid rgba(255,255,255,0.35)',
                  borderTopColor: 'white',
                }}
              />
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>
                Generating{'.'.repeat(dotCount)}
              </span>
            </>
          ) : (
            <>
              <SparkleIcon size={16} color={canGenerate ? 'white' : '#9CA3AF'} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: canGenerate ? 'white' : '#9CA3AF' }}>
                Generate Post
              </span>
            </>
          )}
        </button>

        {/* AI Preview Section */}
        <AnimatePresence>
          {genState === 'done' && (
            <motion.div
              ref={previewRef}
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}
                >
                  <SparkleIcon size={11} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>AI Generated Preview</span>
                </div>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
              </div>

              <div className="flex flex-col gap-4 mb-6">

                <AIField label="Title" delay={0}>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={aiFieldStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)')}
                  />
                </AIField>

                <AIField label="Description" delay={0.08}>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    style={{ ...aiFieldStyle, resize: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)')}
                  />
                </AIField>

                <AIField label="Category" delay={0.16}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ ...aiFieldStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)')}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    >
                      <path d="M4 6L8 10L12 6" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </AIField>

                <AIField label="Budget (USD)" delay={0.24}>
                  <div className="flex gap-3 items-center">
                    <div style={{ flex: 1, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7C3AED', fontWeight: 600 }}>$</span>
                      <input
                        value={budgetMin}
                        onChange={e => setBudgetMin(e.target.value)}
                        placeholder="Min"
                        style={{ ...aiFieldStyle, paddingLeft: 28 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)')}
                      />
                    </div>
                    <span style={{ fontSize: '14px', color: '#9CA3AF', fontWeight: 500, flexShrink: 0 }}>to</span>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#7C3AED', fontWeight: 600 }}>$</span>
                      <input
                        value={budgetMax}
                        onChange={e => setBudgetMax(e.target.value)}
                        placeholder="Max"
                        style={{ ...aiFieldStyle, paddingLeft: 28 }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)')}
                      />
                    </div>
                  </div>
                </AIField>

                <AIField label="Location" delay={0.32}>
                  <div style={{ position: 'relative' }}>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    >
                      <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.515 10.485 1.5 8 1.5Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8" cy="6" r="1.5" stroke="#7C3AED" strokeWidth="1.4"/>
                    </svg>
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      style={{ ...aiFieldStyle, paddingLeft: 34 }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.22)')}
                    />
                  </div>
                </AIField>
              </div>

              <button
                type="button"
                onClick={() => { setGenState('idle'); setPrompt(''); }}
                className="w-full flex items-center justify-center gap-1.5 mb-6 transition-all active:scale-95"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8C2 4.686 4.686 2 8 2C10.08 2 11.92 3.04 13 4.64V2.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 8C14 11.314 11.314 14 8 14C5.92 14 4.08 12.96 3 11.36V13.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF' }}>Regenerate from scratch</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <AnimatePresence>
        {genState === 'done' && (
          <motion.div
            key="bottom-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.8 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              padding: '14px 20px 28px',
              display: 'flex', gap: 12, zIndex: 40,
            }}
          >
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{ height: 50, borderRadius: 24, background: 'white', border: '2px solid #7C3AED', cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={onPost}
              className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                height: 50, borderRadius: 24,
                background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 2L8 14L7 9L2 8Z" fill="white"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Post Now</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
