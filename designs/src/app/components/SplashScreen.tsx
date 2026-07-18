import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    const doneTimer = setTimeout(() => onFinish(), 2700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="w-full h-full overflow-hidden flex flex-col items-center justify-center relative"
      style={{
        background: 'linear-gradient(160deg, #7C3AED 0%, #A855F7 100%)',
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          top: -60,
          right: -80,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 240,
          height: 240,
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          bottom: -40,
          left: -60,
        }}
      />

      {/* Logo mark */}
      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Icon container */}
        <div
          className="flex items-center justify-center rounded-[28px]"
          style={{
            width: 96,
            height: 96,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {/* Simple lightning / spark icon */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path
              d="M26 4L10 24H22L18 40L34 20H22L26 4Z"
              fill="white"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* App name */}
        <div className="flex flex-col items-center gap-1">
          <span
            style={{
              fontSize: '30px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.03em',
            }}
          >
            Sorcyn
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Your daily momentum
          </span>
        </div>
      </div>

      {/* Spinner */}
      <div className="absolute bottom-[120px] flex items-center justify-center z-10">
        <SpinnerRing />
      </div>
    </div>
  );
}

function SpinnerRing() {
  return (
    <div style={{ position: 'relative', width: 32, height: 32 }}>
      <style>{`
        @keyframes pulse-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-fade-dots {
          0%, 100% { opacity: 0.3; transform: scale(0.75); }
          50%       { opacity: 1;   transform: scale(1); }
        }
        .splash-spinner {
          animation: pulse-spin 1s linear infinite;
        }
        .dot1 { animation: pulse-fade-dots 1.2s ease-in-out 0s infinite; }
        .dot2 { animation: pulse-fade-dots 1.2s ease-in-out 0.4s infinite; }
        .dot3 { animation: pulse-fade-dots 1.2s ease-in-out 0.8s infinite; }
      `}</style>
      <svg
        className="splash-spinner"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2.5"
        />
        <path
          d="M16 3 A13 13 0 0 1 29 16"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}