'use client';

import { useState } from 'react';

interface LanguageSettingsScreenProps {
  onBack: () => void;
}

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'es', name: 'Spanish', native: 'Español' },
  { id: 'fr', name: 'French', native: 'Français' },
  { id: 'de', name: 'German', native: 'Deutsch' },
  { id: 'pt', name: 'Portuguese', native: 'Português' },
  { id: 'zh', name: 'Chinese', native: '中文' },
  { id: 'ar', name: 'Arabic', native: 'العربية' },
  { id: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
];

export function LanguageSettingsScreen({ onBack }: LanguageSettingsScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  return (
    <div className="w-full h-full bg-white flex flex-col">
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

      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-4 pb-4 flex-shrink-0">
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
        <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.01em' }}>
          Language
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* Language List Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
        >
          {LANGUAGES.map((lang, i) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <div key={lang.id}>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage(lang.id)}
                  className="w-full flex items-center gap-3 px-4"
                  style={{
                    height: 56,
                    background: isSelected ? 'rgba(124,58,237,0.04)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Radio indicator */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#7C3AED' : '#D1D5DB'}`,
                      backgroundColor: isSelected ? '#7C3AED' : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />
                    )}
                  </div>

                  {/* Language names */}
                  <div className="flex-1 flex items-center gap-2">
                    <span style={{
                      fontSize: '15px',
                      fontWeight: isSelected ? 600 : 500,
                      color: '#1F2937',
                    }}>
                      {lang.native}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 400, color: '#9CA3AF' }}>
                      {lang.name}
                    </span>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5L4.2 7.8L9 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>

                {/* Divider */}
                {i < LANGUAGES.length - 1 && (
                  <div style={{ height: 1, backgroundColor: '#F0F0F2', marginLeft: 56 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p style={{
          fontSize: '12px',
          color: '#9CA3AF',
          textAlign: 'center',
          marginTop: 16,
        }}>
          Language changes apply immediately.
        </p>
      </div>
    </div>
  );
}
