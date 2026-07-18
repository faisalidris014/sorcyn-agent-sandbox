'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type NotificationType = 'offer' | 'message' | 'transaction' | 'system';
type FilterType = 'all' | 'unread';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

interface NotificationsScreenProps {
  onBack?: () => void;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'offer', title: 'New offer received', body: 'Marcus submitted an offer of $450 for your kitchen remodel post', time: '2m ago', unread: true },
  { id: '2', type: 'message', title: 'New message from Sarah', body: 'Hey, I wanted to discuss the timeline for...', time: '15m ago', unread: true },
  { id: '3', type: 'transaction', title: 'Payment released', body: 'Funds have been released for "Logo Design"', time: '1hr ago', unread: false },
  { id: '4', type: 'offer', title: 'Offer accepted!', body: 'Your offer for "Garden Landscaping" has been accepted', time: '2hr ago', unread: false },
  { id: '5', type: 'system', title: 'Welcome to Sorcyn!', body: 'Complete your profile to start receiving offers from sellers', time: '1d ago', unread: false },
  { id: '6', type: 'transaction', title: 'Review reminder', body: "Don't forget to leave a review for Priya Sharma", time: '2d ago', unread: false },
];

const TYPE_CONFIG: Record<NotificationType, { bg: string; color: string; icon: React.ReactNode }> = {
  offer: {
    bg: 'rgba(124,58,237,0.1)',
    color: '#7C3AED',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M15 5L9 2L3 5V10L9 16L15 10V5Z" stroke="#7C3AED" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M9 8V10M9 12V12.5" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  message: {
    bg: 'rgba(37,99,235,0.1)',
    color: '#2563EB',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M3 4H15C15.55 4 16 4.45 16 5V13C16 13.55 15.55 14 15 14H5L2 16V5C2 4.45 2.45 4 3 4Z" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 8H12M6 10.5H10" stroke="#2563EB" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  transaction: {
    bg: 'rgba(16,185,129,0.1)',
    color: '#10B981',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="#10B981" strokeWidth="1.4"/>
        <path d="M9 5V6M9 12V13M6.5 10.5C6.5 11.33 7.62 12 9 12S11.5 11.33 11.5 10.5 10.38 9 9 9 6.5 8.17 6.5 7.5 7.62 6 9 6s2.5.67 2.5 1.5" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  system: {
    bg: 'rgba(245,158,11,0.1)',
    color: '#F59E0B',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M14 7A5 5 0 0 0 4 7c0 5-2 6.5-2 6.5h14S14 12 14 7Z" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.44 15.5a1.5 1.5 0 0 1-2.88 0" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
};

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => n.unread).length;

  const filtered = notifications
    .filter(n => !dismissedIds.has(n.id))
    .filter(n => filter === 'all' || n.unread);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

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
      <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
          Notifications
        </h1>
        <button
          type="button"
          onClick={handleMarkAllRead}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>Mark all read</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 px-6 mb-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="transition-all active:scale-95"
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            background: filter === 'all'
              ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              : '#F3F4F6',
            cursor: 'pointer',
            boxShadow: filter === 'all' ? '0 3px 10px rgba(124,58,237,0.28)' : 'none',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: filter === 'all' ? 'white' : '#6B7280' }}>
            All
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className="flex items-center gap-1.5 transition-all active:scale-95"
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            border: 'none',
            background: filter === 'unread'
              ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
              : '#F3F4F6',
            cursor: 'pointer',
            boxShadow: filter === 'unread' ? '0 3px 10px rgba(124,58,237,0.28)' : 'none',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: filter === 'unread' ? 'white' : '#6B7280' }}>
            Unread
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: filter === 'unread' ? '#7C3AED' : 'white',
                backgroundColor: filter === 'unread' ? 'white' : '#7C3AED',
                borderRadius: 10,
                padding: '1px 6px',
                lineHeight: '16px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 96 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center"
              style={{ paddingTop: 80 }}
            >
              <div
                className="flex items-center justify-center rounded-full mb-4"
                style={{ width: 72, height: 72, backgroundColor: '#F3F4F6' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M24 12A8 8 0 0 0 8 12c0 8-4 10.5-4 10.5h24S24 20 24 12Z" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.3 26a2.67 2.67 0 0 1-4.6 0" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>
                All caught up!
              </h3>
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                No notifications to show
              </p>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const config = TYPE_CONFIG[notif.type];
              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 80 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <button
                    type="button"
                    className="w-full flex items-start gap-3 transition-all active:bg-gray-50"
                    style={{
                      padding: '14px 20px',
                      background: notif.unread ? 'rgba(124,58,237,0.02)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {/* Type icon */}
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: config.bg,
                        marginTop: 2,
                      }}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: notif.unread ? 700 : 600,
                        color: '#1F2937',
                        lineHeight: 1.4,
                        marginBottom: 3,
                      }}>
                        {notif.title}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 4,
                      }}>
                        {notif.body}
                      </p>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {notif.time}
                      </span>
                    </div>

                    {/* Unread dot */}
                    {notif.unread && (
                      <div
                        className="flex-shrink-0"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#7C3AED',
                          marginTop: 6,
                        }}
                      />
                    )}
                  </button>

                  {/* Divider */}
                  {i < filtered.length - 1 && (
                    <div style={{ height: 1, backgroundColor: '#F0F0F0', marginLeft: 64 }} />
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
