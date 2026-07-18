import { type ReactNode } from 'react';

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 50%, #e0e7ff 100%)' }}
    >
      {/* On mobile: full viewport. On sm+: centered phone frame */}
      <div
        className="
          relative bg-white overflow-hidden flex flex-col
          w-full h-[100dvh]
          sm:w-[390px] sm:h-[844px] sm:max-h-[90vh]
          sm:rounded-[44px] sm:shadow-[0_32px_80px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)]
        "
      >
        {children}
      </div>
    </div>
  );
}
