import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatScreen } from './ChatScreen';

/* ─── Types ──────────────────────────────────────────────────── */
export type ConvRole = 'buyer' | 'seller';
export type ConvStatus = 'online' | 'away' | 'offline';

export interface Conversation {
  id: string;
  participantName: string;
  participantInitials: string;
  participantGradient: string;
  participantRating: number;
  participantIsVerified: boolean;
  participantStatus: ConvStatus;
  role: ConvRole;           // OTHER party's role
  postTitle: string;
  postCategory: string;
  postCategoryIcon: string;
  lastMessage: string;
  lastMessageTime: string;  // display string
  lastMessageTimeSort: number; // for sorting (higher = newer)
  unreadCount: number;
  isLastMessageFromMe: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  hasOffer?: boolean;
  offerAmount?: number;
}

type FilterKey = 'All' | 'Unread' | 'Buyers' | 'Sellers';

/* ─── Demo data ──────────────────────────────────────────────── */
export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantName: 'Priya Sharma',
    participantInitials: 'PS',
    participantGradient: 'linear-gradient(135deg,#EC4899,#F43F5E)',
    participantRating: 4.8,
    participantIsVerified: true,
    participantStatus: 'online',
    role: 'seller',
    postTitle: 'Logo + brand identity for fintech startup',
    postCategory: 'Design',
    postCategoryIcon: '✏️',
    lastMessage: "All final files are uploaded! SVG, PNG and the brand guide PDF. Let me know if you'd like any tweaks 🎨",
    lastMessageTime: '2m ago',
    lastMessageTimeSort: 9998,
    unreadCount: 3,
    isLastMessageFromMe: false,
    isPinned: true,
    hasOffer: true,
    offerAmount: 950,
  },
  {
    id: 'c2',
    participantName: 'Jordan Lee',
    participantInitials: 'JL',
    participantGradient: 'linear-gradient(135deg,#7C3AED,#A855F7)',
    participantRating: 4.9,
    participantIsVerified: true,
    participantStatus: 'online',
    role: 'seller',
    postTitle: 'React Native developer for marketplace app',
    postCategory: 'Software Dev',
    postCategoryIcon: '💻',
    lastMessage: 'Milestone 2 is done — pushed to the staging branch. Ready for your review!',
    lastMessageTime: '14m ago',
    lastMessageTimeSort: 9985,
    unreadCount: 1,
    isLastMessageFromMe: false,
    isPinned: true,
    hasOffer: true,
    offerAmount: 3800,
  },
  {
    id: 'c3',
    participantName: 'Marcus Chen',
    participantInitials: 'MC',
    participantGradient: 'linear-gradient(135deg,#3B82F6,#6366F1)',
    participantRating: 4.7,
    participantIsVerified: true,
    participantStatus: 'away',
    role: 'buyer',
    postTitle: 'Logo + brand identity for fintech startup',
    postCategory: 'Design',
    postCategoryIcon: '✏️',
    lastMessage: 'You: Looking good! Can you adjust the primary blue to be a bit darker?',
    lastMessageTime: '1h ago',
    lastMessageTimeSort: 9900,
    unreadCount: 0,
    isLastMessageFromMe: true,
    hasOffer: true,
    offerAmount: 950,
  },
  {
    id: 'c4',
    participantName: 'Sofia Reyes',
    participantInitials: 'SR',
    participantGradient: 'linear-gradient(135deg,#F97316,#EAB308)',
    participantRating: 5.0,
    participantIsVerified: false,
    participantStatus: 'offline',
    role: 'buyer',
    postTitle: 'Vintage Leica M3 camera — excellent condition',
    postCategory: 'Electronics',
    postCategoryIcon: '📷',
    lastMessage: "Hi! Is the camera still available? I'm very interested 📸",
    lastMessageTime: '3h ago',
    lastMessageTimeSort: 9700,
    unreadCount: 2,
    isLastMessageFromMe: false,
    hasOffer: false,
  },
  {
    id: 'c5',
    participantName: 'Lena Müller',
    participantInitials: 'LM',
    participantGradient: 'linear-gradient(135deg,#F59E0B,#EF4444)',
    participantRating: 5.0,
    participantIsVerified: true,
    participantStatus: 'online',
    role: 'buyer',
    postTitle: 'SaaS blog — 4 posts/month ongoing',
    postCategory: 'Writing',
    postCategoryIcon: '✍️',
    lastMessage: 'You: Post 3 is approved, great work! Will send the next brief by Monday.',
    lastMessageTime: 'Yesterday',
    lastMessageTimeSort: 9400,
    unreadCount: 0,
    isLastMessageFromMe: true,
    hasOffer: true,
    offerAmount: 720,
  },
  {
    id: 'c6',
    participantName: 'Tom Walsh',
    participantInitials: 'TW',
    participantGradient: 'linear-gradient(135deg,#10B981,#059669)',
    participantRating: 4.6,
    participantIsVerified: false,
    participantStatus: 'offline',
    role: 'seller',
    postTitle: 'Home cleaning service — bi-weekly 3BR',
    postCategory: 'Home Services',
    postCategoryIcon: '🏠',
    lastMessage: "Perfect, I'll be there at 9 AM sharp. See you then!",
    lastMessageTime: 'Yesterday',
    lastMessageTimeSort: 9300,
    unreadCount: 0,
    isLastMessageFromMe: false,
    isMuted: true,
  },
  {
    id: 'c7',
    participantName: 'James Okafor',
    participantInitials: 'JO',
    participantGradient: 'linear-gradient(135deg,#8B5CF6,#06B6D4)',
    participantRating: 4.9,
    participantIsVerified: true,
    participantStatus: 'away',
    role: 'buyer',
    postTitle: 'IKEA KALLAX bookshelf — white, like new',
    postCategory: 'Furniture',
    postCategoryIcon: '🛋️',
    lastMessage: 'You: Great, confirmed for Saturday at 2 PM!',
    lastMessageTime: 'Mon',
    lastMessageTimeSort: 9100,
    unreadCount: 0,
    isLastMessageFromMe: true,
    hasOffer: true,
    offerAmount: 120,
  },
  {
    id: 'c8',
    participantName: 'Mia Tanaka',
    participantInitials: 'MT',
    participantGradient: 'linear-gradient(135deg,#0EA5E9,#6366F1)',
    participantRating: 4.7,
    participantIsVerified: true,
    participantStatus: 'offline',
    role: 'seller',
    postTitle: 'Product photography — 20 items white BG',
    postCategory: 'Photography',
    postCategoryIcon: '📷',
    lastMessage: 'All 20 shots edited and uploaded to Drive. Check your email for the link!',
    lastMessageTime: 'Mar 29',
    lastMessageTimeSort: 8900,
    unreadCount: 0,
    isLastMessageFromMe: false,
  },
];

/* ─── Status dot color ───────────────────────────────────────── */
const STATUS_COLOR: Record<ConvStatus, string> = {
  online: '#10B981',
  away:   '#F59E0B',
  offline: '#D1D5DB',
};

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  'Design':        { bg: 'rgba(168,85,247,0.1)', color: '#9333EA' },
  'Software Dev':  { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' },
  'Home Services': { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  'Electronics':   { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  'Photography':   { bg: 'rgba(20,184,166,0.1)', color: '#0D9488' },
  'Furniture':     { bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
  'Writing':       { bg: 'rgba(236,72,153,0.1)', color: '#DB2777' },
};
function catStyle(c: string) { return CAT_COLORS[c] ?? { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' }; }

const FILTERS: FilterKey[] = ['All', 'Unread', 'Buyers', 'Sellers'];

/* ─── Filter logic ───────────────────────────────────────────── */
function filterConvs(convs: Conversation[], f: FilterKey, q: string): Conversation[] {
  let result = convs;
  if (f === 'Unread')  result = result.filter(c => c.unreadCount > 0);
  if (f === 'Buyers')  result = result.filter(c => c.role === 'buyer');
  if (f === 'Sellers') result = result.filter(c => c.role === 'seller');
  if (q.trim()) {
    const lq = q.toLowerCase();
    result = result.filter(c =>
      c.participantName.toLowerCase().includes(lq) ||
      c.postTitle.toLowerCase().includes(lq) ||
      c.lastMessage.toLowerCase().includes(lq)
    );
  }
  return result;
}

/* ─── Swipe actions state ────────────────────────────────────── */
type SwipeAction = 'mute' | 'delete' | null;

/* ─── Empty state ─────────────────────────────────────────────── */
function EmptyState({ filter, query }: { filter: FilterKey; query: string }) {
  const isSearch = query.trim().length > 0;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 36px 80px',
    }}>
      {/* Illustration */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 28 }}
      >
        <svg width="160" height="148" viewBox="0 0 160 148" fill="none">
          {/* Shadow */}
          <ellipse cx="80" cy="143" rx="46" ry="5" fill="#F3F4F6"/>

          {/* Main bubble */}
          <rect x="18" y="18" width="110" height="88" rx="22" fill="white" stroke="#E5E7EB" strokeWidth="1.5"/>

          {/* Gradient header strip */}
          <rect x="18" y="18" width="110" height="36" rx="22" fill="url(#msgGrad1)"/>
          <rect x="18" y="40" width="110" height="14" fill="url(#msgGrad1)"/>

          {/* Avatar circle in bubble */}
          <circle cx="45" cy="36" r="14" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
          <text x="45" y="41" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">?</text>

          {/* Text lines in bubble */}
          <rect x="64" y="30" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.5)"/>
          <rect x="64" y="39" width="34" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>

          {/* Message lines */}
          <rect x="30" y="64" width="76" height="5" rx="2.5" fill="#F3F4F6"/>
          <rect x="30" y="76" width="54" height="4" rx="2" fill="#EDE9FE"/>
          <rect x="30" y="86" width="64" height="4" rx="2" fill="#F3F4F6"/>
          <rect x="30" y="96" width="40" height="4" rx="2" fill="#F3F4F6"/>

          {/* Small chat bubble floating top-right */}
          <rect x="108" y="6" width="44" height="30" rx="10" fill="url(#msgGrad2)"/>
          <path d="M116 36L112 44L124 36" fill="url(#msgGrad2)"/>
          <circle cx="120" cy="21" r="3.5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="130" cy="21" r="3.5" fill="rgba(255,255,255,0.8)"/>
          <circle cx="140" cy="21" r="3.5" fill="rgba(255,255,255,0.6)"/>

          {/* Floating dots */}
          <circle cx="14" cy="68" r="4" fill="#EDE9FE"/>
          <circle cx="148" cy="90" r="3" fill="#DDD6FE" opacity="0.7"/>
          <circle cx="20" cy="118" r="2.5" fill="#F3F4F6"/>

          <defs>
            <linearGradient id="msgGrad1" x1="18" y1="18" x2="128" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#A855F7"/>
            </linearGradient>
            <linearGradient id="msgGrad2" x1="108" y1="6" x2="152" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7"/><stop offset="1" stopColor="#C084FC"/>
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <h3 style={{
        fontSize: '21px', fontWeight: 800, color: '#1F2937',
        letterSpacing: '-0.02em', marginBottom: 10, textAlign: 'center',
      }}>
        {isSearch
          ? 'No results found'
          : filter === 'Unread'
          ? 'All caught up!'
          : filter === 'Buyers'
          ? 'No buyer messages'
          : filter === 'Sellers'
          ? 'No seller messages'
          : 'No conversations yet'}
      </h3>
      <p style={{
        fontSize: '14px', color: '#6B7280',
        textAlign: 'center', lineHeight: 1.65,
        maxWidth: 240,
      }}>
        {isSearch
          ? `No conversations match "${query}". Try a different name or keyword.`
          : filter === 'Unread'
          ? "You're all caught up — no unread messages right now."
          : filter !== 'All'
          ? `You don't have any ${filter.toLowerCase()} conversations yet.`
          : "When you accept an offer or message a seller, your conversations will appear here."}
      </p>
    </div>
  );
}

/* ─── Conversation row ───────────────────────────────────────── */
function ConvRow({
  conv,
  index,
  onPress,
  onMute,
  onDelete,
}: {
  conv: Conversation;
  index: number;
  onPress: () => void;
  onMute: () => void;
  onDelete: () => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [swipeAction, setSwipeAction] = useState<SwipeAction>(null);
  const startXRef = useRef(0);
  const isDragging = useRef(false);
  const SWIPE_THRESHOLD = 60;
  const DELETE_THRESHOLD = 120;

  const cs = catStyle(conv.postCategory);
  const hasUnread = conv.unreadCount > 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    isDragging.current = true;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startXRef.current;
    if (dx > 0) return; // only swipe left
    const clamped = Math.max(dx, -DELETE_THRESHOLD - 20);
    setSwipeX(clamped);
    if (Math.abs(clamped) >= DELETE_THRESHOLD) setSwipeAction('delete');
    else if (Math.abs(clamped) >= SWIPE_THRESHOLD) setSwipeAction('mute');
    else setSwipeAction(null);
  };
  const handlePointerUp = () => {
    isDragging.current = false;
    if (swipeAction === 'delete') { setSwipeX(0); onDelete(); }
    else if (swipeAction === 'mute') { onMute(); }
    setSwipeX(0);
    setSwipeAction(null);
  };

  const revealW = Math.abs(Math.min(swipeX, 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.96 }}
      transition={{ delay: index * 0.045, type: 'spring', stiffness: 360, damping: 30 }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, marginBottom: 10 }}
    >
      {/* Swipe actions backdrop */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'flex-end', borderRadius: 20, overflow: 'hidden',
      }}>
        {/* Mute action */}
        <div style={{
          width: SWIPE_THRESHOLD, height: '100%',
          background: conv.isMuted ? 'linear-gradient(135deg,#10B981,#34D399)' : 'linear-gradient(135deg,#6B7280,#9CA3AF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: revealW >= SWIPE_THRESHOLD ? 1 : 0,
          transition: 'opacity 0.12s',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              {conv.isMuted ? (
                <path d="M4 10C4 7.24 6.24 5 9 5v10c-2.76 0-5-2.24-5-5ZM9 5l6 5-6 5V5ZM15 8v4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M3 7L9 3v14L3 13H1V7h2ZM13 7c1.1.83 2 2.22 2 3s-.9 2.17-2 3M15.5 5C17.2 6.3 18 8.08 18 10s-.8 3.7-2.5 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>{conv.isMuted ? 'Unmute' : 'Mute'}</span>
          </div>
        </div>
        {/* Delete action */}
        <div style={{
          width: DELETE_THRESHOLD - SWIPE_THRESHOLD, height: '100%',
          background: 'linear-gradient(135deg,#EF4444,#DC2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: revealW >= DELETE_THRESHOLD ? 1 : 0,
          transition: 'opacity 0.12s',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M8 5V3h4v2M6 5v12a1 1 0 001 1h6a1 1 0 001-1V5H6Z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'white' }}>Delete</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <motion.div
        animate={{ x: swipeX }}
        transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }}
        onClick={swipeX === 0 ? onPress : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          borderRadius: 20, backgroundColor: 'white',
          border: hasUnread
            ? '1.5px solid rgba(124,58,237,0.18)'
            : '1.5px solid #F0F0F0',
          boxShadow: hasUnread
            ? '0 4px 18px rgba(124,58,237,0.08)'
            : '0 2px 10px rgba(0,0,0,0.04)',
          cursor: 'pointer', overflow: 'hidden',
          position: 'relative',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        {/* Pinned indicator strip */}
        {conv.isPinned && (
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
            background: 'linear-gradient(180deg,#7C3AED,#A855F7)',
            borderRadius: '20px 0 0 20px',
          }}/>
        )}

        <div style={{ padding: '13px 14px 13px', paddingLeft: conv.isPinned ? 18 : 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

            {/* ── Avatar ── */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 17,
                background: conv.participantGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
                border: hasUnread ? '2.5px solid rgba(124,58,237,0.35)' : '2px solid rgba(255,255,255,0.9)',
              }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>
                  {conv.participantInitials}
                </span>
              </div>
              {/* Status dot */}
              <div style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 14, height: 14, borderRadius: '50%',
                backgroundColor: STATUS_COLOR[conv.participantStatus],
                border: '2.5px solid white',
                boxShadow: conv.participantStatus === 'online' ? '0 0 0 2px rgba(16,185,129,0.2)' : 'none',
              }}>
                {conv.participantStatus === 'online' && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute', inset: -3, borderRadius: '50%',
                      border: '2px solid #10B981',
                    }}
                  />
                )}
              </div>
              {/* Verified badge */}
              {conv.participantIsVerified && (
                <div style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white',
                }}>
                  <svg width="7" height="7" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Row 1: name + time + unread */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: '15px', fontWeight: hasUnread ? 800 : 600,
                  color: '#1F2937', letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, minWidth: 0,
                }}>
                  {conv.participantName}
                </span>
                {conv.isMuted && (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 5L6 2v10L2 9H0V5h2ZM10.5 5.5l3 3M13.5 5.5l-3 3" stroke="#D1D5DB" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                )}
                {conv.isPinned && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M9.5 2.5L7 5l.5 2L6 8.5 4 6.5l-2 2M4 8L2 10M7.5 2l2.5 2.5" stroke="#A855F7" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <span style={{
                  fontSize: '11px', color: hasUnread ? '#7C3AED' : '#9CA3AF',
                  fontWeight: hasUnread ? 700 : 500, flexShrink: 0,
                }}>
                  {conv.lastMessageTime}
                </span>
              </div>

              {/* Row 2: role badge + offer chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                {/* Role badge */}
                <div style={{
                  padding: '2px 8px', borderRadius: 7,
                  backgroundColor: conv.role === 'buyer'
                    ? 'rgba(124,58,237,0.08)'
                    : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${conv.role === 'buyer' ? 'rgba(124,58,237,0.22)' : 'rgba(16,185,129,0.22)'}`,
                }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 800,
                    color: conv.role === 'buyer' ? '#7C3AED' : '#059669',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {conv.role === 'buyer' ? 'Buyer' : 'Seller'}
                  </span>
                </div>

                {/* Category chip */}
                <div style={{
                  padding: '2px 7px', borderRadius: 7, backgroundColor: cs.bg,
                }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: cs.color }}>
                    {conv.postCategoryIcon} {conv.postCategory}
                  </span>
                </div>

                {/* Offer chip */}
                {conv.hasOffer && conv.offerAmount && (
                  <div style={{
                    padding: '2px 7px', borderRadius: 7,
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.22)',
                  }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#059669' }}>
                      ${conv.offerAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Unread badge (right-aligned) */}
                {conv.unreadCount > 0 && (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      style={{
                        minWidth: 20, height: 20, borderRadius: 10,
                        padding: '0 5px',
                        background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 10px rgba(124,58,237,0.38)',
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'white' }}>
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Row 3: last message preview */}
              <p style={{
                fontSize: '13px',
                color: hasUnread ? '#374151' : '#9CA3AF',
                fontWeight: hasUnread ? 500 : 400,
                lineHeight: 1.45,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                marginBottom: 6,
              }}>
                {conv.lastMessage}
              </p>

              {/* Row 4: post reference */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 8px', borderRadius: 8,
                backgroundColor: '#F9FAFB',
                border: '1px solid #EFEFEF',
                maxWidth: '100%',
              }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <rect x="1" y="1" width="8" height="8" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/>
                  <path d="M3 4h4M3 6h2.5" stroke="#9CA3AF" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                <span style={{
                  fontSize: '10px', color: '#9CA3AF', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {conv.postTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Section label ──────────────────────────────────────────── */
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }}/>
    </div>
  );
}

/* ─── Main screen ─────────────────────────────────────────────── */
export interface MessagesScreenProps {
  onOpenConversation?: (id: string) => void;
}

export function MessagesScreen({ onOpenConversation }: MessagesScreenProps) {
  const [filter,  setFilter]  = useState<FilterKey>('All');
  const [query,   setQuery]   = useState('');
  const [convs,   setConvs]   = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openConvId, setOpenConvId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = filterConvs(convs, filter, query);
  const pinned   = filtered.filter(c => c.isPinned);
  const regular  = filtered.filter(c => !c.isPinned);

  const totalUnread = convs.reduce((s, c) => s + c.unreadCount, 0);

  const handleMute = (id: string) => {
    setConvs(prev => prev.map(c => c.id === id ? { ...c, isMuted: !c.isMuted } : c));
  };
  const handleDelete = (id: string) => {
    setConvs(prev => prev.filter(c => c.id !== id));
  };
  const handleOpenConv = (id: string) => {
    // Mark as read
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
    setOpenConvId(id);
    onOpenConversation?.(id);
  };

  let rowIndex = 0;

  const openConv = openConvId ? convs.find(c => c.id === openConvId) : undefined;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative" style={{ backgroundColor: '#F9FAFB' }}>

      {/* ── Status bar ── */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '10px 24px 0',
        backgroundColor: 'white', flexShrink: 0,
      }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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

      {/* ── App bar ── */}
      <div style={{
        backgroundColor: 'white',
        padding: '10px 18px 0',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          {/* Title + unread */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontSize: '26px', fontWeight: 900, color: '#1F2937',
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              Messages
            </h1>
            {totalUnread > 0 && (
              <motion.div
                key={totalUnread}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                style={{
                  minWidth: 24, height: 24, borderRadius: 12, padding: '0 6px',
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.38)',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'white' }}>{totalUnread}</span>
              </motion.div>
            )}
          </div>

          {/* Filter + compose */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Filter button */}
            <div style={{ position: 'relative' }}>
              <motion.button
                type="button"
                onClick={() => setFilterOpen(o => !o)}
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 38, height: 38, borderRadius: 13,
                  backgroundColor: filterOpen ? 'rgba(124,58,237,0.1)' : '#F3F4F6',
                  border: filterOpen ? '1.5px solid rgba(124,58,237,0.3)' : '1.5px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M6 10h8M9 15h2" stroke={filterOpen ? '#7C3AED' : '#6B7280'} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {filter !== 'All' && (
                  <div style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                    border: '1.5px solid white',
                  }}/>
                )}
              </motion.button>
              {/* Filter dropdown */}
              <AnimatePresence>
                {filterOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 88 }} onClick={() => setFilterOpen(false)}/>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -6 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      style={{
                        position: 'absolute', top: 46, right: 0, zIndex: 89,
                        width: 175, borderRadius: 18,
                        backgroundColor: 'white',
                        boxShadow: '0 14px 40px rgba(0,0,0,0.13)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        overflow: 'hidden', transformOrigin: 'top right',
                      }}
                    >
                      {FILTERS.map((f, i) => {
                        const active = filter === f;
                        const icons: Record<FilterKey, React.ReactNode> = {
                          All:     <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill={active ? '#7C3AED' : '#9CA3AF'}/><rect x="8" y="1" width="5" height="5" rx="1.5" fill={active ? '#7C3AED' : '#9CA3AF'}/><rect x="1" y="8" width="5" height="5" rx="1.5" fill={active ? '#7C3AED' : '#9CA3AF'}/><rect x="8" y="8" width="5" height="5" rx="1.5" fill={active ? '#7C3AED' : '#9CA3AF'}/></svg>,
                          Unread:  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3"/><circle cx="7" cy="7" r="2.5" fill={active ? '#7C3AED' : '#9CA3AF'}/></svg>,
                          Buyers:  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3"/><path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3" strokeLinecap="round"/></svg>,
                          Sellers: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="2" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3"/><path d="M5 3V2a2 2 0 0 1 4 0v1" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3" strokeLinecap="round"/></svg>,
                        };
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => { setFilter(f); setFilterOpen(false); }}
                            style={{
                              width: '100%', padding: '12px 14px',
                              display: 'flex', alignItems: 'center', gap: 10,
                              background: active ? 'rgba(124,58,237,0.05)' : 'none',
                              border: 'none', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                              background: active ? 'rgba(124,58,237,0.1)' : '#F9FAFB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{icons[f]}</div>
                            <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#7C3AED' : '#374151', flex: 1, textAlign: 'left' }}>{f}</span>
                            {active && (
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <path d="M2.5 7L5.5 10L11.5 4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Compose button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              style={{
                width: 38, height: 38, borderRadius: 13,
                background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.32)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                <path d="M3 17l1.5-4L14 3.5a2.12 2.12 0 0 1 3 3L7 17H3Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M12 5.5l2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </motion.button>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            borderRadius: 16, overflow: 'hidden',
            backgroundColor: '#F3F4F6',
            border: `1.5px solid ${query ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
            transition: 'border-color 0.2s',
          }}>
            <div style={{ padding: '0 12px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke={query ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.6"/>
                <path d="M12.5 12.5L16 16" stroke={query ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search conversations…"
              style={{
                flex: 1, height: 44, border: 'none', outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px', color: '#1F2937',
                caretColor: '#7C3AED',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {query && (
              <motion.button
                type="button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setQuery('')}
                style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  marginRight: 6, backgroundColor: '#E5E7EB',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M3 3L9 9M9 3L3 9" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* ── Filter chips ── */}
        <div style={{
          display: 'flex', gap: 7,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 14,
        }}>
          {FILTERS.map(f => {
            const active = filter === f;
            const count = f === 'All'
              ? convs.length
              : f === 'Unread'
              ? convs.filter(c => c.unreadCount > 0).length
              : convs.filter(c => c.role === (f === 'Buyers' ? 'buyer' : 'seller')).length;
            return (
              <motion.button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                whileTap={{ scale: 0.93 }}
                style={{
                  flexShrink: 0,
                  height: 32, padding: '0 12px',
                  borderRadius: 100,
                  border: active ? 'none' : '1.5px solid #E5E7EB',
                  background: active
                    ? 'linear-gradient(135deg,#7C3AED,#A855F7)'
                    : 'white',
                  boxShadow: active ? '0 3px 12px rgba(124,58,237,0.3)' : 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: active ? 'white' : '#6B7280' }}>
                  {f}
                </span>
                {count > 0 && (
                  <div style={{
                    minWidth: 17, height: 17, borderRadius: 8.5, padding: '0 4px',
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(107,114,128,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: active ? 'white' : '#6B7280' }}>{count}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '14px 16px 100px' }}>
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key={`empty-${filter}-${query}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}
            >
              <EmptyState filter={filter} query={query}/>
            </motion.div>
          ) : (
            <motion.div
              key={`list-${filter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Pinned section */}
              {pinned.length > 0 && (
                <>
                  <SectionLabel label="Pinned"/>
                  {pinned.map(c => (
                    <ConvRow
                      key={c.id}
                      conv={c}
                      index={rowIndex++}
                      onPress={() => handleOpenConv(c.id)}
                      onMute={() => handleMute(c.id)}
                      onDelete={() => handleDelete(c.id)}
                    />
                  ))}
                </>
              )}

              {/* Recent section */}
              {regular.length > 0 && (
                <>
                  {pinned.length > 0 && <SectionLabel label="Recent"/>}
                  {regular.map(c => (
                    <ConvRow
                      key={c.id}
                      conv={c}
                      index={rowIndex++}
                      onPress={() => handleOpenConv(c.id)}
                      onMute={() => handleMute(c.id)}
                      onDelete={() => handleDelete(c.id)}
                    />
                  ))}
                </>
              )}

              {/* Result count */}
              {query && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', paddingTop: 4 }}
                >
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat screen slide-over ── */}
      <AnimatePresence>
        {openConvId && openConv && (
          <motion.div
            key={`chat-${openConvId}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: '#F9FAFB' }}
          >
            <ChatScreen
              conversation={openConv}
              onBack={() => setOpenConvId(null)}
              onViewTransaction={() => setOpenConvId(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}