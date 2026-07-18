import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Conversation, ConvStatus } from './MessagesScreen';
import { DEMO_CONVERSATIONS } from './MessagesScreen';

/* ─── Types ──────────────────────────────────────────────────── */
type ReadStatus = 'sending' | 'sent' | 'delivered' | 'read';
type MsgType = 'text' | 'image' | 'offer' | 'system';

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  type: MsgType;
  text?: string;
  imageUrl?: string;
  offerAmount?: number;
  offerStatus?: 'pending' | 'accepted' | 'declined';
  timestamp: Date;
  readStatus: ReadStatus;
}

export interface ChatScreenProps {
  conversation?: Conversation;
  onBack: () => void;
  onViewTransaction?: () => void;
}

/* ─── Demo messages ──────────────────────────────────────────── */
const BRAND_IMG = 'https://images.unsplash.com/photo-1763705857736-2b4f16a33758?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2dvJTIwYnJhbmQlMjBpZGVudGl0eSUyMGRlc2lnbiUyMHdvcmslMjBzYW1wbGV8ZW58MXx8fHwxNzc2MzgxMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080';

function makeDemoMessages(): ChatMessage[] {
  const now = new Date();
  const mins = (n: number) => new Date(now.getTime() - n * 60000);
  const hrs  = (n: number) => new Date(now.getTime() - n * 3600000);
  const days = (n: number) => new Date(now.getTime() - n * 86400000);

  return [
    { id: 'm0',  fromMe: false, type: 'system',    text: 'Conversation started · Apr 12, 2026',         timestamp: days(4),   readStatus: 'read' },
    { id: 'm1',  fromMe: true,  type: 'text',       text: "Hi Priya! I saw your profile and loved your portfolio. I'm looking for a full brand identity for my fintech startup — would you be interested? 😊", timestamp: days(4), readStatus: 'read' },
    { id: 'm2',  fromMe: false, type: 'text',       text: "Hi! Absolutely, I'd love to help with that 🙌 Fintech branding is something I really enjoy. Can you tell me a bit more about your startup and the vibe you're going for?", timestamp: days(4), readStatus: 'read' },
    { id: 'm3',  fromMe: true,  type: 'text',       text: "We're building a B2B payments platform. Think modern, trustworthy but not boring — something between Stripe and Mercury in feel. We'd need a logo, colour palette, typography and a mini brand guide.", timestamp: days(4), readStatus: 'read' },
    { id: 'm4',  fromMe: false, type: 'text',       text: "Perfect brief! That's right in my wheelhouse. I can put together a proposal — would a 3-milestone structure work for you? Research → Concepts → Final files?", timestamp: days(4), readStatus: 'read' },
    { id: 'm5',  fromMe: true,  type: 'text',       text: "That sounds great. What's your timeline and ballpark pricing?", timestamp: days(4), readStatus: 'read' },
    { id: 'm6',  fromMe: false, type: 'offer',      text: "Here's my offer breakdown:",                  offerAmount: 950,    offerStatus: 'accepted', timestamp: days(3), readStatus: 'read' },
    { id: 'm7',  fromMe: true,  type: 'text',       text: "This looks fair — I'm happy to accept! Let's get started 🚀", timestamp: days(3), readStatus: 'read' },
    { id: 'm8',  fromMe: false, type: 'system',     text: 'Offer of $950 accepted · Apr 13, 2026',       timestamp: days(3),  readStatus: 'read' },
    { id: 'm9',  fromMe: false, type: 'text',       text: "Amazing, so excited to work on this! I'll start the brand research today and will have the moodboard ready by Saturday.", timestamp: days(3), readStatus: 'read' },
    { id: 'm10', fromMe: true,  type: 'text',       text: "Brilliant. One thing — we're slightly biased toward indigo/violet tones. Feel free to explore, but it'd be great to see that direction in there 💜", timestamp: days(3), readStatus: 'read' },
    { id: 'm11', fromMe: false, type: 'text',       text: "Love that! Violet + fintech is such a strong combo. I was actually already leaning that way after looking at your product screenshots.", timestamp: days(2), readStatus: 'read' },
    { id: 'm12', fromMe: false, type: 'text',       text: "Here's a quick sneak peek of where I'm heading with the moodboard 👀",   timestamp: days(2), readStatus: 'read' },
    { id: 'm13', fromMe: false, type: 'image',      imageUrl: BRAND_IMG,                                                            timestamp: days(2), readStatus: 'read' },
    { id: 'm14', fromMe: true,  type: 'text',       text: "Oh wow this is already looking incredible!! The colour palette is spot on. Love the clean geometry in those reference marks.", timestamp: days(2), readStatus: 'read' },
    { id: 'm15', fromMe: false, type: 'text',       text: "So glad you like it! Milestone 1 is officially done — moodboard PDF is uploaded to the transaction 📎", timestamp: hrs(30), readStatus: 'read' },
    { id: 'm16', fromMe: true,  type: 'text',       text: "Approved! ✅ Can't wait to see the logo concepts.", timestamp: hrs(29), readStatus: 'read' },
    { id: 'm17', fromMe: false, type: 'text',       text: "Working on 3 distinct directions now. Should have them ready by tomorrow evening 🎨", timestamp: hrs(6), readStatus: 'read' },
    { id: 'm18', fromMe: true,  type: 'text',       text: "Looking good! Can you adjust the primary blue to be a bit darker?",      timestamp: hrs(1),  readStatus: 'read' },
    { id: 'm19', fromMe: false, type: 'text',       text: "All final files are uploaded! SVG, PNG and the brand guide PDF. Let me know if you'd like any tweaks 🎨", timestamp: mins(2), readStatus: 'read' },
  ];
}

/* ─── Helpers ────────────────────────────────────────────────── */
const STATUS_COLOR: Record<ConvStatus, string> = {
  online: '#10B981',
  away:   '#F59E0B',
  offline: '#D1D5DB',
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateGroup(d: Date): string {
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

/* ─── Read receipt icon ──────────────────────────────────────── */
function ReadReceipt({ status }: { status: ReadStatus }) {
  if (status === 'sending') {
    return (
      <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none"
        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="6 8"/>
      </motion.svg>
    );
  }
  if (status === 'sent') {
    return (
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
        <path d="M1.5 5L5 8.5L11.5 1.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === 'delivered') {
    return (
      <svg width="17" height="10" viewBox="0 0 17 10" fill="none">
        <path d="M1 5L4.5 8.5L11 1.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 5L9 8.5L15.5 1.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  // read
  return (
    <svg width="17" height="10" viewBox="0 0 17 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 5L9 8.5L15.5 1.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── Typing indicator ───────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 4px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
        backgroundColor: '#F3F4F6',
        border: '1px solid #EBEBEB',
      }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
            style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9CA3AF' }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Date divider ───────────────────────────────────────────── */
function DateDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 6px' }}>
      <div style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }}/>
      <div style={{
        padding: '3px 12px', borderRadius: 100,
        backgroundColor: '#F3F4F6', border: '1px solid #EBEBEB',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }}>{label}</span>
      </div>
      <div style={{ flex: 1, height: 1, backgroundColor: '#EFEFEF' }}/>
    </div>
  );
}

/* ─── System message ─────────────────────────────────────────── */
function SystemMessage({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 10px' }}>
      <div style={{
        padding: '5px 14px', borderRadius: 100,
        backgroundColor: 'rgba(124,58,237,0.06)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#7C3AED' }}>{text}</span>
      </div>
    </div>
  );
}

/* ─── Offer bubble ───────────────────────────────────────────── */
function OfferBubble({ msg, fromMe }: { msg: ChatMessage; fromMe: boolean }) {
  const accepted = msg.offerStatus === 'accepted';
  const declined = msg.offerStatus === 'declined';
  return (
    <div style={{
      borderRadius: fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      overflow: 'hidden', minWidth: 220, maxWidth: 240,
      border: '1.5px solid rgba(124,58,237,0.2)',
      backgroundColor: 'white',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      {/* Offer header */}
      <div style={{
        padding: '12px 14px 10px',
        background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="2" stroke="white" strokeWidth="1.3"/>
              <path d="M1 6h12" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
              <circle cx="4" cy="9" r="1" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>Offer Sent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
            ${msg.offerAmount?.toLocaleString()}
          </span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>USD</span>
        </div>
      </div>
      {/* Offer body */}
      <div style={{ padding: '10px 14px 12px' }}>
        {msg.text && <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: 10, lineHeight: 1.5 }}>{msg.text}</p>}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px', borderRadius: 10,
          backgroundColor: accepted ? 'rgba(16,185,129,0.08)' : declined ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1.5px solid ${accepted ? 'rgba(16,185,129,0.25)' : declined ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
        }}>
          <motion.div
            animate={!accepted && !declined ? { opacity: [1,0.3,1] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              backgroundColor: accepted ? '#10B981' : declined ? '#EF4444' : '#F59E0B' }}
          />
          <span style={{ fontSize: '11px', fontWeight: 800, color: accepted ? '#059669' : declined ? '#DC2626' : '#B45309' }}>
            {accepted ? 'Accepted ✓' : declined ? 'Declined' : 'Pending acceptance'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Image bubble ───────────────────────────────────────────── */
function ImageBubble({ url, fromMe, onPress }: { url: string; fromMe: boolean; onPress?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{
        width: 210, aspectRatio: '4/3',
        borderRadius: fromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        backgroundColor: '#F3F4F6',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="20 10"/>
            </svg>
          </motion.div>
        </div>
      )}
      <img
        src={url}
        alt="Shared image"
        onLoad={() => setLoaded(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
      />
      {loaded && (
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          padding: '2px 7px', borderRadius: 10,
          backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        }}>
          <span style={{ fontSize: '10px', color: 'white', fontWeight: 600 }}>📎 Image</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Single message bubble ──────────────────────────────────── */
function MessageBubble({
  msg,
  prevMsg,
  nextMsg,
  onImagePress,
}: {
  msg: ChatMessage;
  prevMsg?: ChatMessage;
  nextMsg?: ChatMessage;
  onImagePress?: (url: string) => void;
}) {
  if (msg.type === 'system') return <SystemMessage text={msg.text ?? ''}/>;

  const { fromMe } = msg;
  const isContinued = prevMsg && prevMsg.type !== 'system' && prevMsg.fromMe === fromMe &&
    (msg.timestamp.getTime() - prevMsg.timestamp.getTime()) < 90000;
  const isLast = !nextMsg || nextMsg.fromMe !== fromMe || (nextMsg.timestamp.getTime() - msg.timestamp.getTime()) >= 90000;
  const showTime = isLast;

  const bubbleBR = fromMe
    ? isContinued ? '18px 4px 4px 18px' : '18px 4px 18px 18px'
    : isContinued ? '4px 18px 18px 18px' : '4px 18px 18px 18px';

  const finalBR = fromMe
    ? isLast ? '18px 4px 4px 18px' : '18px 4px 4px 18px'
    : isLast ? '4px 18px 18px 4px' : '4px 18px 18px 18px';

  const br = isLast ? (fromMe ? '18px 4px 4px 18px' : '4px 18px 18px 4px') : bubbleBR;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: fromMe ? 'flex-end' : 'flex-start',
        paddingLeft: fromMe ? 52 : 16,
        paddingRight: fromMe ? 16 : 52,
        marginBottom: isLast ? 10 : 3,
      }}
    >
      {msg.type === 'offer' ? (
        <OfferBubble msg={msg} fromMe={fromMe}/>
      ) : msg.type === 'image' && msg.imageUrl ? (
        <ImageBubble url={msg.imageUrl} fromMe={fromMe} onPress={() => onImagePress?.(msg.imageUrl!)}/>
      ) : (
        <div style={{
          padding: '10px 14px',
          borderRadius: br,
          maxWidth: '100%',
          background: fromMe
            ? 'linear-gradient(135deg,#7C3AED,#9333EA)'
            : '#F3F4F6',
          border: fromMe ? 'none' : '1px solid #EBEBEB',
          boxShadow: fromMe
            ? '0 4px 14px rgba(124,58,237,0.28)'
            : '0 1px 4px rgba(0,0,0,0.05)',
          position: 'relative',
        }}>
          <p style={{
            fontSize: '14px',
            color: fromMe ? 'white' : '#1F2937',
            lineHeight: 1.55,
            margin: 0,
            wordBreak: 'break-word',
          }}>
            {msg.text}
          </p>
        </div>
      )}

      {/* Timestamp + read receipt */}
      {showTime && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 4, paddingLeft: fromMe ? 0 : 2, paddingRight: fromMe ? 2 : 0,
        }}>
          {fromMe && <ReadReceipt status={msg.readStatus}/>}
          <span style={{ fontSize: '10px', color: '#B0B7C3', fontWeight: 500 }}>
            {formatTime(msg.timestamp)}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Context banner ─────────────────────────────────────────── */
function ContextBanner({
  conv,
  collapsed,
  onToggle,
  onViewTransaction,
}: {
  conv: Conversation;
  collapsed: boolean;
  onToggle: () => void;
  onViewTransaction?: () => void;
}) {
  const catColors: Record<string, { bg: string; color: string }> = {
    'Design':        { bg: 'rgba(168,85,247,0.1)', color: '#9333EA' },
    'Software Dev':  { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' },
    'Electronics':   { bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
    'Photography':   { bg: 'rgba(20,184,166,0.1)', color: '#0D9488' },
    'Furniture':     { bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
    'Writing':       { bg: 'rgba(236,72,153,0.1)', color: '#DB2777' },
    'Home Services': { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  };
  const cs = catColors[conv.postCategory] ?? { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' };

  return (
    <motion.div
      initial={false}
      animate={{ height: collapsed ? 44 : 'auto' }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      style={{
        overflow: 'hidden',
        backgroundColor: 'white',
        borderBottom: '1.5px solid #F0F0F0',
        flexShrink: 0,
      }}
    >
      {/* Collapsed row / header row */}
      <div
        onClick={onToggle}
        style={{
          height: 44, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 14px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 9, flexShrink: 0,
            background: 'rgba(124,58,237,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '12px' }}>{conv.postCategoryIcon}</span>
          </div>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: '#1F2937',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {collapsed ? conv.postTitle : 'Post Context'}
          </span>
        </div>
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.22 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5L7 9L11 5" stroke="#6B7280" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Expanded content */}
      <div style={{ padding: '0 14px 14px' }}>
        {/* Post title */}
        <div style={{
          borderRadius: 14, padding: '12px 13px',
          background: 'linear-gradient(135deg,rgba(124,58,237,0.04),rgba(168,85,247,0.03))',
          border: '1.5px solid rgba(124,58,237,0.12)',
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ padding: '2px 8px', borderRadius: 7, backgroundColor: cs.bg }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: cs.color }}>
                {conv.postCategoryIcon} {conv.postCategory}
              </span>
            </div>
            <div style={{ padding: '2px 8px', borderRadius: 7, backgroundColor: '#F3F4F6' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>
                {conv.role === 'seller' ? 'Your post' : 'Seller\'s post'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', lineHeight: 1.4, marginBottom: 0 }}>
            {conv.postTitle}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {/* Offer amount */}
          {conv.hasOffer && conv.offerAmount && (
            <div style={{
              flex: 1, padding: '10px 12px', borderRadius: 12,
              backgroundColor: 'rgba(16,185,129,0.06)',
              border: '1.5px solid rgba(16,185,129,0.2)',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', marginBottom: 3 }}>Offer Amount</p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ${conv.offerAmount.toLocaleString()}
              </p>
            </div>
          )}

          {/* Status */}
          <div style={{
            flex: 1, padding: '10px 12px', borderRadius: 12,
            backgroundColor: '#F9FAFB',
            border: '1.5px solid #EFEFEF',
          }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', marginBottom: 4 }}>Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <motion.div
                animate={{ opacity: [1,0.3,1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: conv.hasOffer ? '#10B981' : '#F59E0B', flexShrink: 0 }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>
                {conv.hasOffer ? 'Active' : 'Negotiating'}
              </span>
            </div>
          </div>
        </div>

        {/* View transaction CTA */}
        {conv.hasOffer && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={e => { e.stopPropagation(); onViewTransaction?.(); }}
            style={{
              width: '100%', height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(124,58,237,0.28)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="2" stroke="white" strokeWidth="1.3"/>
              <path d="M1 6h12" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
              <circle cx="4" cy="9.5" r="1" fill="white"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>View Transaction</span>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Lightbox ───────────────────────────────────────────────── */
function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.img
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        src={url}
        alt="Full size"
        style={{ maxWidth: '100%', maxHeight: '80%', objectFit: 'contain', borderRadius: 16 }}
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={onClose}
        style={{
          position: 'absolute', top: 56, right: 20,
          width: 38, height: 38, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4L12 12M12 4L4 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </motion.button>
    </motion.div>
  );
}

/* ─── Overflow menu ──────────────────────────────────────────── */
function OverflowMenu({ onClose }: { onClose: () => void }) {
  const items = [
    { icon: '🔔', label: 'Mute notifications' },
    { icon: '🔍', label: 'Search in chat' },
    { icon: '📎', label: 'Shared media' },
    { icon: '🚩', label: 'Report conversation', color: '#EF4444' },
    { icon: '🗑️', label: 'Delete conversation', color: '#EF4444' },
  ];
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose}/>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: -8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          position: 'absolute', top: 52, right: 14, zIndex: 99,
          width: 220, borderRadius: 18,
          backgroundColor: 'white',
          boxShadow: '0 14px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden', transformOrigin: 'top right',
        }}
      >
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={onClose}
            style={{
              width: '100%', padding: '13px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'none', border: 'none',
              borderTop: i > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: item.color ?? '#374151' }}>
              {item.label}
            </span>
          </button>
        ))}
      </motion.div>
    </>
  );
}

/* ─── Attachment menu ────────────────────────────────────────── */
function AttachmentMenu({ onClose }: { onClose: () => void }) {
  const options = [
    { icon: '📷', label: 'Camera',    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    { icon: '🖼️', label: 'Gallery',   color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
    { icon: '📄', label: 'Document',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { icon: '📍', label: 'Location',  color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  ];
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 88 }} onClick={onClose}/>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        style={{
          position: 'absolute', bottom: 72, left: 14, zIndex: 89,
          borderRadius: 20,
          backgroundColor: 'white',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          padding: '14px 16px',
          display: 'flex', gap: 20,
          transformOrigin: 'bottom left',
        }}
      >
        {options.map((opt, i) => (
          <motion.button
            key={opt.label}
            type="button"
            whileTap={{ scale: 0.88 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={onClose}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 18,
              backgroundColor: opt.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
            }}>
              {opt.icon}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>{opt.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </>
  );
}

/* ─── Main ChatScreen ────────────────────────────────────────── */
export function ChatScreen({ conversation, onBack, onViewTransaction }: ChatScreenProps) {
  const conv = conversation ?? DEMO_CONVERSATIONS[0];

  const [messages, setMessages] = useState<ChatMessage[]>(makeDemoMessages);
  const [inputText, setInputText] = useState('');
  const [bannerCollapsed, setBannerCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const scrollRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      fromMe: true,
      type: 'text',
      text,
      timestamp: new Date(),
      readStatus: 'sending',
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate status progression: sending → sent → delivered
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, readStatus: 'sent' } : m));
    }, 600);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, readStatus: 'delivered' } : m));
    }, 1400);

    // Simulate typing response
    setTimeout(() => setIsTyping(true), 2000);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Got it! I'll take care of that right away 👍",
        "Sure, let me check on that for you!",
        "That makes sense — I'll update it now.",
        "Thanks for letting me know! On it 🎨",
        "Perfect, I'll have that ready soon!",
      ];
      const reply: ChatMessage = {
        id: `m-r-${Date.now()}`,
        fromMe: false,
        type: 'text',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date(),
        readStatus: 'read',
      };
      setMessages(prev => [...prev, reply]);

      // Mark our message as read
      setMessages(prev => prev.map(m =>
        m.id === newMsg.id ? { ...m, readStatus: 'read' } : m
      ));
    }, 4500);
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Simulate participant typing when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#F9FAFB', position: 'relative' }}>

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
        padding: '8px 14px 10px',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Back */}
          <motion.button
            type="button" onClick={onBack} whileTap={{ scale: 0.86 }}
            style={{
              width: 38, height: 38, borderRadius: 13, flexShrink: 0,
              backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          {/* Avatar + status */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 14,
              background: conv.participantGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(0,0,0,0.14)',
              border: '2px solid rgba(255,255,255,0.9)',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 900, color: 'white' }}>{conv.participantInitials}</span>
            </div>
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 12, height: 12, borderRadius: '50%',
              backgroundColor: STATUS_COLOR[conv.participantStatus],
              border: '2px solid white',
            }}>
              {conv.participantStatus === 'online' && (
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '1.5px solid #10B981' }}
                />
              )}
            </div>
          </div>

          {/* Name + status text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{
                fontSize: '16px', fontWeight: 800, color: '#1F2937',
                letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {conv.participantName}
              </span>
              {/* Verified */}
              {conv.participantIsVerified && (
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="7" height="7" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {/* Role badge */}
              <div style={{
                padding: '1px 7px', borderRadius: 6,
                backgroundColor: conv.role === 'buyer'
                  ? 'rgba(124,58,237,0.08)'
                  : 'rgba(16,185,129,0.08)',
                border: `1px solid ${conv.role === 'buyer' ? 'rgba(124,58,237,0.22)' : 'rgba(16,185,129,0.22)'}`,
              }}>
                <span style={{
                  fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: conv.role === 'buyer' ? '#7C3AED' : '#059669',
                }}>
                  {conv.role}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                backgroundColor: STATUS_COLOR[conv.participantStatus],
              }}/>
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>
                {conv.participantStatus === 'online'
                  ? 'Online now'
                  : conv.participantStatus === 'away'
                  ? 'Away · usually replies in < 1hr'
                  : 'Offline'}
              </span>
            </div>
          </div>

          {/* Overflow */}
          <motion.button
            type="button" whileTap={{ scale: 0.86 }}
            onClick={() => setShowOverflow(o => !o)}
            style={{
              width: 38, height: 38, borderRadius: 13, flexShrink: 0,
              backgroundColor: showOverflow ? 'rgba(124,58,237,0.08)' : '#F3F4F6',
              border: showOverflow ? '1.5px solid rgba(124,58,237,0.28)' : '1.5px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="5" r="1.5" fill={showOverflow ? '#7C3AED' : '#6B7280'}/>
              <circle cx="10" cy="10" r="1.5" fill={showOverflow ? '#7C3AED' : '#6B7280'}/>
              <circle cx="10" cy="15" r="1.5" fill={showOverflow ? '#7C3AED' : '#6B7280'}/>
            </svg>
          </motion.button>
        </div>

        {/* Overflow dropdown */}
        <AnimatePresence>
          {showOverflow && <OverflowMenu onClose={() => setShowOverflow(false)}/>}
        </AnimatePresence>
      </div>

      {/* ── Context banner ── */}
      <ContextBanner
        conv={conv}
        collapsed={bannerCollapsed}
        onToggle={() => setBannerCollapsed(c => !c)}
        onViewTransaction={onViewTransaction}
      />

      {/* ── Message list ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 12,
          paddingBottom: 8,
          backgroundImage: `radial-gradient(circle at 20% 10%, rgba(124,58,237,0.025) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(168,85,247,0.02) 0%, transparent 50%)`,
        }}
      >
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];

          // Date divider
          const showDivider = !prev || !isSameDay(prev.timestamp, msg.timestamp);

          return (
            <div key={msg.id}>
              {showDivider && msg.type !== 'system' && (
                <DateDivider label={formatDateGroup(msg.timestamp)}/>
              )}
              <MessageBubble
                msg={msg}
                prevMsg={prev}
                nextMsg={next}
                onImagePress={url => setLightboxUrl(url)}
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              <TypingIndicator/>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extra scroll padding */}
        <div style={{ height: 12 }}/>
      </div>

      {/* ── Attachment menu ── */}
      <AnimatePresence>
        {showAttach && <AttachmentMenu onClose={() => setShowAttach(false)}/>}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div style={{
        backgroundColor: 'white',
        borderTop: '1px solid #F0F0F0',
        padding: '10px 12px 28px',
        flexShrink: 0,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9 }}>

          {/* Attachment button */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.86 }}
            onClick={() => setShowAttach(a => !a)}
            style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              backgroundColor: showAttach ? 'rgba(124,58,237,0.1)' : '#F3F4F6',
              border: showAttach ? '1.5px solid rgba(124,58,237,0.3)' : '1.5px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            <motion.div animate={{ rotate: showAttach ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke={showAttach ? '#7C3AED' : '#6B7280'} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>
          </motion.button>

          {/* Camera */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.86 }}
            style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="1" y="5" width="18" height="13" rx="3" stroke="#6B7280" strokeWidth="1.6"/>
              <circle cx="10" cy="11.5" r="3.5" stroke="#6B7280" strokeWidth="1.4"/>
              <path d="M13.5 5L14.5 3H16" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          {/* Text input */}
          <div style={{
            flex: 1,
            borderRadius: 22,
            border: `1.5px solid ${inputText ? 'rgba(124,58,237,0.35)' : '#E5E7EB'}`,
            backgroundColor: inputText ? 'rgba(124,58,237,0.02)' : '#F9FAFB',
            display: 'flex', alignItems: 'center',
            minHeight: 42, padding: '0 14px',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              style={{
                flex: 1, border: 'none', outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px', color: '#1F2937',
                caretColor: '#7C3AED',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.45,
              }}
            />
          </div>

          {/* Send button */}
          <AnimatePresence mode="wait">
            {inputText.trim() ? (
              <motion.button
                key="send"
                type="button"
                onClick={handleSend}
                whileTap={{ scale: 0.86 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                style={{
                  width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 5px 16px rgba(124,58,237,0.38)',
                  overflow: 'hidden', position: 'relative',
                }}
              >
                <motion.div
                  animate={{ x: ['-120%', '220%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                  style={{
                    position: 'absolute', top: 0, bottom: 0, width: '40%',
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)',
                    transform: 'skewX(-15deg)', pointerEvents: 'none',
                  }}
                />
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M18 10L3 4L7 10L3 16L18 10Z" fill="white"/>
                </svg>
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                type="button"
                whileTap={{ scale: 0.86 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                style={{
                  width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                  backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <rect x="7" y="2" width="6" height="10" rx="3" stroke="#6B7280" strokeWidth="1.5"/>
                  <path d="M4 10c0 3.31 2.69 6 6 6s6-2.69 6-6" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 16v2" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Image lightbox ── */}
      <AnimatePresence>
        {lightboxUrl && (
          <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)}/>
        )}
      </AnimatePresence>
    </div>
  );
}
