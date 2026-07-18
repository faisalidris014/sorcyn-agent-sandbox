import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface ManualPostCreationScreenProps {
  onBack: () => void;
  onSubmit?: () => void;
  onPreview?: () => void;
  onSaveDraft?: () => void;
}

const CATEGORIES: Record<string, string[]> = {
  'Home Services': ['Cleaning', 'Plumbing', 'Electrical', 'Gardening', 'Painting', 'Other'],
  'Graphic Design': ['Logo Design', 'Brand Identity', 'Illustration', 'UI/UX', 'Print', 'Other'],
  'Web Development': ['Frontend', 'Backend', 'Full Stack', 'WordPress', 'E-commerce', 'Other'],
  'Writing & Translation': ['Copywriting', 'Technical', 'Translation', 'Editing', 'Other'],
  Photography: ['Portrait', 'Product', 'Event', 'Real Estate', 'Other'],
  Marketing: ['SEO', 'Social Media', 'Email', 'PPC', 'Content', 'Other'],
  Legal: ['Contracts', 'Consultation', 'IP', 'Corporate', 'Other'],
  'Finance & Accounting': ['Bookkeeping', 'Tax', 'Payroll', 'Audit', 'Other'],
  'Tutoring & Education': ['Math', 'Science', 'Language', 'Music', 'Other'],
  'Moving & Logistics': ['Local Move', 'Long Distance', 'Packing', 'Storage', 'Other'],
  'Health & Wellness': ['Personal Training', 'Nutrition', 'Yoga', 'Therapy', 'Other'],
  Other: ['Other'],
};

const TIMELINE_OPTIONS = ['ASAP', '1 Week', '2 Weeks', 'Flexible', 'Specific Date'];
const DURATION_OPTIONS = ['24h', '3 Days', '7 Days', '14 Days'];

/* ── Shared chip component ── */
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="transition-all active:scale-95"
      style={{
        padding: '8px 14px',
        borderRadius: 20,
        border: selected ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
        background: selected ? 'rgba(124,58,237,0.08)' : '#F9FAFB',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: selected ? 700 : 500, color: selected ? '#7C3AED' : '#6B7280' }}>
        {label}
      </span>
    </button>
  );
}

/* ── Upload placeholder cell ── */
function UploadCell({ index, file, onPick }: { index: number; file: File | null; onPick: (i: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(index)}
      className="transition-all active:scale-95"
      style={{
        aspectRatio: '1',
        borderRadius: 12,
        border: file ? '2px solid #7C3AED' : '2px dashed #D1D5DB',
        background: file ? 'rgba(124,58,237,0.06)' : '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {file ? (
        <>
          {/* Green tick overlay for "uploaded" state */}
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 600 }}>Added</span>
        </>
      ) : (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 500 }}>
            {index === 0 ? 'Cover' : `Photo ${index + 1}`}
          </span>
        </>
      )}
    </button>
  );
}

/* ── Toggle switch ── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="transition-all"
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : '#E5E7EB',
        border: 'none', cursor: 'pointer', position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          position: 'absolute', top: 3, left: 0,
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

/* ── Field label ── */
function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 7 }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{text}</span>
      {required && <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 700 }}>*</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#F9FAFB',
  border: '1.5px solid #E5E7EB',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: '14px',
  color: '#1F2937',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const focusColor = '#7C3AED';
const blurColor = '#E5E7EB';

export function ManualPostCreationScreen({ onBack, onSubmit, onPreview, onSaveDraft }: ManualPostCreationScreenProps) {
  /* Form state */
  const [titleVal, setTitleVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [timeline, setTimeline] = useState('');
  const [duration, setDuration] = useState('7 Days');
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null, null]);

  /* Seller requirements */
  const [reqOpen, setReqOpen] = useState(false);
  const [minRating, setMinRating] = useState(3);
  const [reqVerified, setReqVerified] = useState(false);
  const [reqLicensed, setReqLicensed] = useState(false);
  const [reqBusiness, setReqBusiness] = useState(false);

  const subcats = category ? CATEGORIES[category] ?? [] : [];
  const descMax = 800;

  /* Fake photo pick (just mark slot as "picked") */
  const handlePickPhoto = (i: number) => {
    setPhotos(prev => {
      const next = [...prev];
      next[i] = next[i] ? null : new File([], 'photo.jpg');
      return next;
    });
  };

  /* Rating stars */
  const stars = [1, 2, 3, 4, 5];

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

      {/* ── App Bar ── */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-3 flex-shrink-0">
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
          Create Post
        </h1>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED', cursor: 'pointer' }}
            onClick={onSaveDraft}>
            Save Draft
          </span>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="flex items-center gap-2 px-6 mb-4 flex-shrink-0">
        {/* Step 1 done */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>Method</span>
        </div>
        <div style={{ flex: 1, height: 2, borderRadius: 1, background: 'linear-gradient(90deg,#7C3AED,#A855F7)' }} />
        {/* Step 2 active */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 0 3px rgba(124,58,237,0.2)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>2</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>Details</span>
        </div>
        <div style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: '#E5E7EB' }} />
        {/* Step 3 pending */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 22, height: 22, backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF' }}>3</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>Review</span>
        </div>
      </div>

      {/* ── Scrollable form ── */}
      <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: 120 }}>

        {/* ── TITLE ── */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel text="Post Title" required />
          <input
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            placeholder="e.g. Need a plumber for bathroom renovation"
            maxLength={100}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
            onBlur={e => (e.currentTarget.style.borderColor = blurColor)}
          />
          <div style={{ textAlign: 'right', marginTop: 4 }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{titleVal.length}/100</span>
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel text="Description" required />
          <textarea
            value={descVal}
            onChange={e => setDescVal(e.target.value.slice(0, descMax))}
            placeholder="Describe exactly what you need, any preferences, special requirements..."
            rows={5}
            style={{ ...inputStyle, resize: 'none', lineHeight: '1.6' }}
            onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
            onBlur={e => (e.currentTarget.style.borderColor = blurColor)}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: descVal.length > descMax * 0.85 ? '#EF4444' : '#9CA3AF' }}>
              {descVal.length}/{descMax} characters
            </span>
            {descVal.length > descMax * 0.85 && (
              <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                {descMax - descVal.length} left
              </span>
            )}
          </div>
        </div>

        {/* ── CATEGORY + SUBCATEGORY ── */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel text="Category" required />
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setSubcategory(''); }}
              style={{ ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
              onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
              onBlur={e => (e.currentTarget.style.borderColor = blurColor)}
            >
              <option value="">Select a category</option>
              {Object.keys(CATEGORIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M4 6L8 10L12 6" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <AnimatePresence>
            {subcats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ position: 'relative' }}>
                  <select
                    value={subcategory}
                    onChange={e => setSubcategory(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer',
                      backgroundColor: 'rgba(124,58,237,0.04)', borderColor: 'rgba(124,58,237,0.2)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)')}
                  >
                    <option value="">Select subcategory</option>
                    {subcats.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <path d="M4 6L8 10L12 6" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BUDGET ── */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel text="Budget (USD)" required />
          <div className="flex gap-3 items-center">
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                fontSize: '15px', color: '#6B7280', fontWeight: 600 }}>$</span>
              <input
                value={budgetMin}
                onChange={e => setBudgetMin(e.target.value.replace(/\D/g, ''))}
                placeholder="Min"
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
                onBlur={e => (e.currentTarget.style.borderColor = blurColor)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 1.5, backgroundColor: '#D1D5DB', borderRadius: 1 }} />
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                fontSize: '15px', color: '#6B7280', fontWeight: 600 }}>$</span>
              <input
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value.replace(/\D/g, ''))}
                placeholder="Max"
                style={{ ...inputStyle, paddingLeft: 28 }}
                onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
                onBlur={e => (e.currentTarget.style.borderColor = blurColor)}
              />
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 5 }}>Leave Max empty for open budget</p>
        </div>

        {/* ── LOCATION ── */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel text="Location" />
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6C3.5 9.5 8 14.5 8 14.5S12.5 9.5 12.5 6C12.5 3.515 10.485 1.5 8 1.5Z"
                stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="6" r="1.5" stroke="#6B7280" strokeWidth="1.4"/>
            </svg>
            <input
              value={locationVal}
              onChange={e => setLocationVal(e.target.value)}
              placeholder="City, region or Remote"
              style={{ ...inputStyle, paddingLeft: 36 }}
              onFocus={e => (e.currentTarget.style.borderColor = focusColor)}
              onBlur={e => (e.currentTarget.style.borderColor = blurColor)}
            />
          </div>
        </div>

        {/* ── PHOTO UPLOAD ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <FieldLabel text="Photos" />
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: 7 }}>
              {photos.filter(Boolean).length}/6 added
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {photos.map((f, i) => (
              <UploadCell key={i} index={i} file={f} onPick={handlePickPhoto} />
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 6 }}>First photo is used as the cover image</p>
        </div>

        {/* ── TIMELINE ── */}
        <div style={{ marginBottom: 20 }}>
          <FieldLabel text="Timeline" required />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TIMELINE_OPTIONS.map(opt => (
              <Chip
                key={opt}
                label={opt}
                selected={timeline === opt}
                onPress={() => setTimeline(prev => prev === opt ? '' : opt)}
              />
            ))}
          </div>
        </div>

        {/* ── POST DURATION ── */}
        <div style={{ marginBottom: 22 }}>
          <FieldLabel text="Post Duration" />
          <div style={{ display: 'flex', gap: 8 }}>
            {DURATION_OPTIONS.map(opt => (
              <Chip
                key={opt}
                label={opt}
                selected={duration === opt}
                onPress={() => setDuration(opt)}
              />
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: 5 }}>
            How long your post stays visible to sellers
          </p>
        </div>

        {/* ── SELLER REQUIREMENTS (collapsible) ── */}
        <div
          style={{
            borderRadius: 16,
            border: '1.5px solid #E5E7EB',
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          {/* Header */}
          <button
            type="button"
            onClick={() => setReqOpen(o => !o)}
            className="w-full transition-all active:opacity-70"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: '#F9FAFB', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(124,58,237,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5" r="3" stroke="#7C3AED" strokeWidth="1.4"/>
                  <path d="M2 14C2 11.791 4.686 10 8 10s6 1.791 6 4" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                  Seller Requirements
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Optional filters for who can apply</div>
              </div>
            </div>
            <motion.div animate={{ rotate: reqOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          </button>

          {/* Body */}
          <AnimatePresence initial={false}>
            {reqOpen && (
              <motion.div
                key="req-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '16px 16px 18px', borderTop: '1px solid #F3F4F6' }}>

                  {/* Min rating */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                        Minimum Rating
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>
                        {minRating}★ & above
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {stars.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMinRating(s)}
                          className="transition-all active:scale-90"
                          style={{
                            flex: 1, height: 36, borderRadius: 10,
                            border: minRating >= s ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                            background: minRating >= s ? 'rgba(124,58,237,0.08)' : '#F9FAFB',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1L9.85 5.75H15L10.93 8.75L12.42 13.5L8 10.5L3.58 13.5L5.07 8.75L1 5.75H6.15L8 1Z"
                              fill={minRating >= s ? '#7C3AED' : '#D1D5DB'}/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle rows */}
                  {[
                    { label: 'Verified sellers only', sub: 'ID-verified accounts', value: reqVerified, set: setReqVerified },
                    { label: 'Licensed professionals', sub: 'Sellers with credentials', value: reqLicensed, set: setReqLicensed },
                    { label: 'Business accounts only', sub: 'Registered companies', value: reqBusiness, set: setReqBusiness },
                  ].map(row => (
                    <div
                      key={row.label}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: 12, paddingBottom: 12,
                        borderTop: '1px solid #F3F4F6',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{row.label}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{row.sub}</div>
                      </div>
                      <Toggle on={row.value} onChange={row.set} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Spacing note ── */}
        <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: 14 }}>
          Fields marked <span style={{ color: '#7C3AED', fontWeight: 700 }}>*</span> are required
        </p>

      </div>

      {/* ── Bottom action bar ── */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '12px 16px 28px',
          zIndex: 40,
        }}
      >
        {/* Top row: Preview + Save Draft */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <button
            type="button"
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            style={{
              height: 44, borderRadius: 22,
              background: 'white', border: '1.5px solid #7C3AED', cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M1 8C1 8 3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8Z" stroke="#7C3AED" strokeWidth="1.4"/>
              <circle cx="8" cy="8" r="2" stroke="#7C3AED" strokeWidth="1.4"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Preview</span>
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            style={{
              height: 44, borderRadius: 22,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 2H11L13 4V14H3V2Z" stroke="#6B7280" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M5 2V6H11V2" stroke="#6B7280" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M5 9H11M5 11.5H8.5" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>Save as Draft</span>
          </button>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={onSubmit}
          className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            height: 52, borderRadius: 26,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8L14 2L8 14L7 9L2 8Z" fill="white"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Submit Post</span>
        </button>
      </div>
    </div>
  );
}
