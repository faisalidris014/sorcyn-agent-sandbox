import { useState } from 'react';

type Method = 'ai' | 'manual' | null;

interface CreatePostMethodScreenProps {
  onBack: () => void;
  onSelectAI?: () => void;
  onSelectManual?: () => void;
}

export function CreatePostMethodScreen({
  onBack,
  onSelectAI,
  onSelectManual,
}: CreatePostMethodScreenProps) {
  const [selected, setSelected] = useState<Method>(null);

  const handleContinue = () => {
    if (selected === 'ai' && onSelectAI) onSelectAI();
    if (selected === 'manual' && onSelectManual) onSelectManual();
  };

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
      <div className="flex items-center gap-3 px-5 pt-3 pb-4 flex-shrink-0">
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
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em' }}>
          Create a Post
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-6 overflow-y-auto">

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-7">
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>1</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>Method</span>
          </div>
          <div style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: '#E5E7EB' }} />
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 22, height: 22, backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF' }}>2</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>Details</span>
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

        {/* Heading */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#1F2937',
            letterSpacing: '-0.02em',
            lineHeight: '1.25',
            marginBottom: 8,
          }}
        >
          How would you like to create your post?
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: 28 }}>
          Choose how you'd like to describe what you need. You can edit everything before publishing.
        </p>

        {/* ── Cards ── */}
        <div className="flex flex-col gap-4">

          {/* AI-Assisted */}
          <MethodCard
            id="ai"
            selected={selected === 'ai'}
            onClick={() => setSelected('ai')}
            icon={<SparkleIcon />}
            iconGradient="linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)"
            title="AI-Assisted"
            subtitle="Describe what you need in plain language"
            badge="Recommended"
            bullets={[
              'Just type naturally — AI structures it for you',
              'Smart category & budget suggestions',
              'Takes less than 60 seconds',
            ]}
          />

          {/* Manual Form */}
          <MethodCard
            id="manual"
            selected={selected === 'manual'}
            onClick={() => setSelected('manual')}
            icon={<EditFormIcon />}
            iconGradient="linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)"
            title="Manual Form"
            subtitle="Fill out the details yourself"
            bullets={[
              'Full control over every field',
              'Set exact budget, category & urgency',
              'Best for precise or complex requests',
            ]}
          />
        </div>

        {/* Spacer for button */}
        <div style={{ height: 32 }} />
      </div>

      {/* ── Continue Button ── */}
      <div
        className="flex-shrink-0 px-6 pb-10 pt-4"
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'white' }}
      >
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected}
          className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            height: 54,
            borderRadius: 24,
            border: 'none',
            cursor: selected ? 'pointer' : 'not-allowed',
            background: selected
              ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              : '#F3F4F6',
            boxShadow: selected ? '0 8px 22px rgba(124,58,237,0.35)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: selected ? 'white' : '#C4C9D4',
              transition: 'color 0.2s',
            }}
          >
            Continue
          </span>
          {selected && (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M11 5L16 10L11 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {selected && (
          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
            You selected{' '}
            <span style={{ fontWeight: 700, color: '#7C3AED' }}>
              {selected === 'ai' ? 'AI-Assisted' : 'Manual Form'}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Method Card ──────────────────────────────────────────────── */
interface MethodCardProps {
  id: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconGradient: string;
  title: string;
  subtitle: string;
  badge?: string;
  bullets: string[];
}

function MethodCard({
  selected,
  onClick,
  icon,
  iconGradient,
  title,
  subtitle,
  badge,
  bullets,
}: MethodCardProps) {
  const [pressing, setPressing] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      className="text-left w-full transition-all"
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        transform: pressing ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 0.12s ease',
      }}
    >
      <div
        style={{
          borderRadius: 16,
          backgroundColor: selected ? 'rgba(124,58,237,0.04)' : '#F9FAFB',
          border: selected ? '2px solid #7C3AED' : '2px solid #E5E7EB',
          overflow: 'hidden',
          position: 'relative',
          transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: selected
            ? '0 8px 24px rgba(124,58,237,0.15)'
            : pressing
            ? '0 4px 12px rgba(124,58,237,0.1)'
            : '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Purple left border accent */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'linear-gradient(180deg, #7C3AED 0%, #A855F7 100%)',
            borderRadius: '0 0 0 0',
            opacity: selected || pressing ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />

        <div className="p-5" style={{ paddingLeft: selected || pressing ? 20 : 20 }}>
          {/* Top row: icon + title + badge */}
          <div className="flex items-start gap-4 mb-3">
            {/* Icon circle */}
            <div
              className="flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{
                width: 52,
                height: 52,
                background: selected ? iconGradient : '#F0F0F3',
                boxShadow: selected ? '0 4px 14px rgba(124,58,237,0.28)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  color: selected ? 'white' : '#9CA3AF',
                  transition: 'color 0.2s',
                }}
              >
                {icon}
              </span>
            </div>

            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: selected ? '#7C3AED' : '#1F2937',
                    letterSpacing: '-0.01em',
                    transition: 'color 0.2s',
                  }}
                >
                  {title}
                </span>
                {badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: selected ? 'white' : '#7C3AED',
                      backgroundColor: selected ? '#7C3AED' : 'rgba(124,58,237,0.1)',
                      border: selected ? 'none' : '1px solid rgba(124,58,237,0.2)',
                      borderRadius: 20,
                      padding: '2px 7px',
                      letterSpacing: '0.04em',
                      transition: 'all 0.2s',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: selected ? '#5B21B6' : '#6B7280',
                  fontWeight: 500,
                  lineHeight: '1.45',
                  transition: 'color 0.2s',
                }}
              >
                {subtitle}
              </p>
            </div>

            {/* Checkmark */}
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5"
              style={{
                width: 22,
                height: 22,
                backgroundColor: selected ? '#7C3AED' : 'white',
                border: `2px solid ${selected ? '#7C3AED' : '#D1D5DB'}`,
                transition: 'all 0.2s ease',
              }}
            >
              {selected && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              backgroundColor: selected ? 'rgba(124,58,237,0.12)' : '#EAECF0',
              marginBottom: 12,
              marginLeft: -20,
              marginRight: -20,
              transition: 'background-color 0.2s',
            }}
          />

          {/* Bullet points */}
          <div className="flex flex-col gap-2">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full mt-0.5"
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: selected ? 'rgba(124,58,237,0.1)' : '#F0F0F3',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke={selected ? '#7C3AED' : '#9CA3AF'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: selected ? '#4B5563' : '#9CA3AF',
                    lineHeight: '1.5',
                    transition: 'color 0.2s',
                  }}
                >
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Icons ──────────────────────────────────────────────────── */
function SparkleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3C14 3 15.5 8.5 18 11C20.5 13.5 26 14 26 14C26 14 20.5 14.5 18 17C15.5 19.5 14 25 14 25C14 25 12.5 19.5 10 17C7.5 14.5 2 14 2 14C2 14 7.5 13.5 10 11C12.5 8.5 14 3 14 3Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M22 3C22 3 22.75 5.25 24 6.5C25.25 7.75 27.5 8 27.5 8C27.5 8 25.25 8.25 24 9.5C22.75 10.75 22 13 22 13C22 13 21.25 10.75 20 9.5C18.75 8.25 16.5 8 16.5 8C16.5 8 18.75 7.75 20 6.5C21.25 5.25 22 3 22 3Z"
        fill="currentColor"
        fillOpacity="0.65"
      />
      <path
        d="M6 19C6 19 6.5 20.5 7.5 21.5C8.5 22.5 10 23 10 23C10 23 8.5 23.5 7.5 24.5C6.5 25.5 6 27 6 27C6 27 5.5 25.5 4.5 24.5C3.5 23.5 2 23 2 23C2 23 3.5 22.5 4.5 21.5C5.5 20.5 6 19 6 19Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function EditFormIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <rect x="4" y="3" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      <path d="M8 9H16M8 13H16M8 17H12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <rect x="17" y="17" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M19 21.5L20.5 20L22 21.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}