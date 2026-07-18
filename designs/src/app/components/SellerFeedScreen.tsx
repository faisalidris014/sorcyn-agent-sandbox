import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ProfileScreen } from './ProfileScreen';
import { SellerPostDetailScreen, DEMO_SELLER_POST } from './SellerPostDetailScreen';
import { SubmitOfferScreen, DEMO_SUBMIT_POST } from './SubmitOfferScreen';
import { MyOffersScreen } from './MyOffersScreen';
import { TransactionsScreen } from './TransactionsScreen';

type MarketType = 'B2C' | 'B2B' | 'C2C';
type UrgencyLevel = 'Urgent' | 'High' | 'Medium' | 'Low';
type SellerTabId = 'feed' | 'offers' | 'transactions' | 'messages' | 'profile';

interface BuyerRequest {
  id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  urgency: UrgencyLevel;
  buyerRating: number;
  buyerReviews: number;
  distance: string;
  offerCount: number;
  postedAgo: string;
  market: MarketType;
}

const ALL_REQUESTS: BuyerRequest[] = [
  {
    id: '1',
    title: 'Need a professional logo + brand identity for a fintech startup',
    category: 'Design',
    budgetMin: 500,
    budgetMax: 1500,
    urgency: 'Urgent',
    buyerRating: 4.9,
    buyerReviews: 43,
    distance: '0.8 km',
    offerCount: 12,
    postedAgo: '18m ago',
    market: 'B2B',
  },
  {
    id: '2',
    title: 'Urgent: plumber needed for pipe leak — bathroom, 2nd floor',
    category: 'Home Services',
    budgetMin: 80,
    budgetMax: 220,
    urgency: 'Urgent',
    buyerRating: 4.7,
    buyerReviews: 11,
    distance: '1.2 km',
    offerCount: 4,
    postedAgo: '32m ago',
    market: 'B2C',
  },
  {
    id: '3',
    title: 'iPhone 15 Pro Max, 256GB, sealed box preferred — any color',
    category: 'Electronics',
    budgetMin: 900,
    budgetMax: 1100,
    urgency: 'High',
    buyerRating: 4.5,
    buyerReviews: 8,
    distance: '3.4 km',
    offerCount: 7,
    postedAgo: '1h ago',
    market: 'C2C',
  },
  {
    id: '4',
    title: 'Weekly meal prep service for 2 people — no nuts, low carb',
    category: 'Food & Catering',
    budgetMin: 150,
    budgetMax: 300,
    urgency: 'Medium',
    buyerRating: 4.8,
    buyerReviews: 27,
    distance: '2.1 km',
    offerCount: 3,
    postedAgo: '2h ago',
    market: 'B2C',
  },
  {
    id: '5',
    title: 'React + Node.js full-stack freelancer — 3-month contract, remote OK',
    category: 'Software Dev',
    budgetMin: 4000,
    budgetMax: 8000,
    urgency: 'High',
    buyerRating: 4.6,
    buyerReviews: 19,
    distance: 'Remote',
    offerCount: 19,
    postedAgo: '3h ago',
    market: 'B2B',
  },
  {
    id: '6',
    title: 'Vintage Rolex Submariner 1680 — good to excellent condition',
    category: 'Watches',
    budgetMin: 5000,
    budgetMax: 8000,
    urgency: 'Low',
    buyerRating: 4.3,
    buyerReviews: 5,
    distance: '5.6 km',
    offerCount: 2,
    postedAgo: '5h ago',
    market: 'C2C',
  },
  {
    id: '7',
    title: 'Catering needed for 50-person corporate lunch — Thursday delivery',
    category: 'Food & Catering',
    budgetMin: 800,
    budgetMax: 2000,
    urgency: 'Urgent',
    buyerRating: 4.9,
    buyerReviews: 62,
    distance: '1.8 km',
    offerCount: 8,
    postedAgo: '45m ago',
    market: 'B2B',
  },
  {
    id: '8',
    title: 'Moving help needed — 2BR apartment, this weekend, ground floor access',
    category: 'Moving & Logistics',
    budgetMin: 200,
    budgetMax: 400,
    urgency: 'High',
    buyerRating: 4.4,
    buyerReviews: 14,
    distance: '0.5 km',
    offerCount: 6,
    postedAgo: '4h ago',
    market: 'B2C',
  },
  {
    id: '9',
    title: 'MacBook Pro M3, 16" — any storage, Space Black preferred',
    category: 'Electronics',
    budgetMin: 2000,
    budgetMax: 2800,
    urgency: 'Medium',
    buyerRating: 4.7,
    buyerReviews: 33,
    distance: '4.2 km',
    offerCount: 11,
    postedAgo: '6h ago',
    market: 'C2C',
  },
  {
    id: '10',
    title: 'Social media content strategy + 30 posts for skincare brand launch',
    category: 'Marketing',
    budgetMin: 600,
    budgetMax: 1800,
    urgency: 'Medium',
    buyerRating: 4.8,
    buyerReviews: 22,
    distance: 'Remote',
    offerCount: 15,
    postedAgo: '8h ago',
    market: 'B2B',
  },
  {
    id: '11',
    title: 'Tutoring for A-level Mathematics — 2h/week, evenings preferred',
    category: 'Education',
    budgetMin: 40,
    budgetMax: 80,
    urgency: 'Low',
    buyerRating: 4.6,
    buyerReviews: 7,
    distance: '2.8 km',
    offerCount: 5,
    postedAgo: '1d ago',
    market: 'B2C',
  },
  {
    id: '12',
    title: 'Custom embroidered patches — 200 units, 3 colors, iron-on backing',
    category: 'Print & Merch',
    budgetMin: 300,
    budgetMax: 600,
    urgency: 'Low',
    buyerRating: 4.2,
    buyerReviews: 3,
    distance: 'Remote',
    offerCount: 0,
    postedAgo: '1d ago',
    market: 'B2B',
  },
];

const URGENCY_FILTERS = [
  { id: 'all',    label: 'All',    dotColor: '' },
  { id: 'Urgent', label: 'Urgent', dotColor: '#EF4444' },
  { id: 'High',   label: 'High',   dotColor: '#F97316' },
  { id: 'Medium', label: 'Medium', dotColor: '#EAB308' },
  { id: 'Low',    label: 'Low',    dotColor: '#22C55E' },
] as const;

interface SellerFeedScreenProps {
  onSignOut?: () => void;
  onSwitchToBuyer?: () => void;
}

export function SellerFeedScreen({ onSignOut, onSwitchToBuyer }: SellerFeedScreenProps) {
  const [market, setMarket] = useState<MarketType>('B2C');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | UrgencyLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SellerTabId>('feed');
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showSubmitOffer, setShowSubmitOffer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = ALL_REQUESTS.filter(r => {
    const matchesMarket = r.market === market;
    const matchesUrgency = urgencyFilter === 'all' || r.urgency === urgencyFilter;
    const matchesSearch = searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMarket && matchesUrgency && matchesSearch;
  });

  if (activeTab === 'profile') {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          <ProfileScreen
            userName="Alex Johnson"
            userEmail="alex.johnson@example.com"
            memberSince="January 2024"
            onSignOut={onSignOut}
            initialSellerMode={true}
            onSwitchToBuyer={onSwitchToBuyer}
          />
        </div>
        <SellerBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'offers') {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          <MyOffersScreen
            onBrowseFeed={() => setActiveTab('feed')}
            onWithdraw={() => {}}
            onMessage={() => {}}
          />
        </div>
        <SellerBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'transactions') {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          <TransactionsScreen role="seller" />
        </div>
        <SellerBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">

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
      <div className="flex items-center justify-between px-6 pt-3 pb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {/* Seller mode pill */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>SELLER</span>
            </div>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Browse Requests
          </h1>
        </div>
        <button
          type="button"
          className="relative flex items-center justify-center transition-all active:scale-90"
          style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="absolute rounded-full" style={{ top: 6, right: 6, width: 9, height: 9, backgroundColor: '#EF4444', border: '1.5px solid white' }} />
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-6 pb-3 flex-shrink-0">
        <div
          className="flex items-center gap-2.5 px-4 rounded-2xl"
          style={{ height: 44, backgroundColor: '#F3F4F6', border: '1.5px solid transparent' }}
          onClick={() => searchRef.current?.focus()}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="9" cy="9" r="6.5" stroke="#9CA3AF" strokeWidth="1.6"/>
            <path d="M14 14L17.5 17.5" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search requests, categories…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#1F2937',
              caretColor: '#7C3AED',
            }}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#D1D5DB"/>
                <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Market Toggle ── */}
      <div className="px-6 pb-3 flex-shrink-0">
        <div className="flex rounded-2xl p-1 gap-1" style={{ backgroundColor: '#F3F4F6' }}>
          {(['B2C', 'B2B', 'C2C'] as MarketType[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className="flex-1 flex items-center justify-center transition-all active:scale-95"
              style={{
                height: 36,
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                background: market === m ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' : 'transparent',
                boxShadow: market === m ? '0 2px 8px rgba(124,58,237,0.28)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: market === m ? 'white' : '#6B7280', letterSpacing: '0.04em', transition: 'color 0.2s' }}>
                {m}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Urgency Filter Chips (horizontal scroll) ── */}
      <div className="flex-shrink-0 pb-3">
        <div className="flex gap-2 px-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {URGENCY_FILTERS.map(f => {
            const isSelected = urgencyFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setUrgencyFilter(f.id as typeof urgencyFilter)}
                className="flex items-center gap-1.5 flex-shrink-0 transition-all active:scale-95"
                style={{
                  height: 34,
                  paddingLeft: 12,
                  paddingRight: 12,
                  borderRadius: 100,
                  border: isSelected ? 'none' : '1.5px solid #E5E7EB',
                  cursor: 'pointer',
                  background: isSelected ? 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' : 'white',
                  boxShadow: isSelected ? '0 3px 10px rgba(124,58,237,0.28)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                {f.dotColor && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: isSelected ? 'rgba(255,255,255,0.85)' : f.dotColor, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? 'white' : '#6B7280', whiteSpace: 'nowrap' }}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Feed ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 96 }}>

        {/* Results count */}
        <div className="px-6 mb-3 flex items-center justify-between">
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
            <span style={{ fontWeight: 700, color: '#1F2937' }}>{filtered.length}</span> request{filtered.length !== 1 ? 's' : ''} found
          </span>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14M4 8H12M6 12H10" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED' }}>Filter</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <FeedEmptyState query={searchQuery} />
        ) : (
          <div className="px-6 flex flex-col gap-3">
            {filtered.map(req => (
              <RequestCard key={req.id} request={req} onOpen={() => setShowPostDetail(true)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <SellerBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Seller Post Detail ── */}
      <AnimatePresence>
        {showPostDetail && (
          <motion.div
            key="seller-post-detail"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'white' }}
          >
            <SellerPostDetailScreen
              post={DEMO_SELLER_POST}
              onBack={() => setShowPostDetail(false)}
              onSubmitOffer={() => { setShowPostDetail(false); setShowSubmitOffer(true); }}
              onMessageBuyer={() => setShowPostDetail(false)}
              onViewProfile={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit Offer ── */}
      <AnimatePresence>
        {showSubmitOffer && (
          <motion.div
            key="submit-offer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'white' }}
          >
            <SubmitOfferScreen
              post={DEMO_SUBMIT_POST}
              onBack={() => { setShowSubmitOffer(false); setShowPostDetail(true); }}
              onSubmit={() => { setShowSubmitOffer(false); }}
              onPreview={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Request Card ───────────────────────────────────────────── */
const URGENCY_CONFIG: Record<UrgencyLevel, { bg: string; color: string; borderColor: string; label: string }> = {
  Urgent: { bg: 'rgba(239,68,68,0.08)',  color: '#DC2626', borderColor: 'rgba(239,68,68,0.2)',  label: 'Urgent'  },
  High:   { bg: 'rgba(249,115,22,0.08)', color: '#EA580C', borderColor: 'rgba(249,115,22,0.2)', label: 'High'    },
  Medium: { bg: 'rgba(234,179,8,0.08)',  color: '#CA8A04', borderColor: 'rgba(234,179,8,0.2)',  label: 'Medium'  },
  Low:    { bg: 'rgba(34,197,94,0.08)',  color: '#16A34A', borderColor: 'rgba(34,197,94,0.2)',  label: 'Low'     },
};

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z"
              fill={i <= full ? '#F59E0B' : (i === full + 1 && half) ? '#F59E0B' : '#E5E7EB'}
              stroke={i <= full ? '#F59E0B' : (i === full + 1 && half) ? '#F59E0B' : '#E5E7EB'}
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#1F2937' }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>({reviews})</span>
    </div>
  );
}

function RequestCard({ request: r, onOpen }: { request: BuyerRequest; onOpen: () => void }) {
  const urg = URGENCY_CONFIG[r.urgency];
  const isRemote = r.distance === 'Remote';

  return (
    <div
      className="rounded-2xl p-4 transition-all active:scale-[0.984] cursor-pointer"
      style={{
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
      }}
      onClick={onOpen}
    >
      {/* Row 1 — title + urgency badge */}
      <div className="flex items-start gap-2 mb-2.5">
        <h4
          className="flex-1"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1F2937',
            lineHeight: '1.45',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {r.title}
        </h4>
        {/* Urgency badge — compact, top-right */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          style={{
            padding: '3px 8px',
            borderRadius: 8,
            backgroundColor: urg.bg,
            border: `1.5px solid ${urg.borderColor}`,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: urg.color, flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: urg.color }}>{urg.label}</span>
        </div>
      </div>

      {/* Row 2 — category chip */}
      <div className="mb-3">
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#7C3AED',
            border: '1.5px solid rgba(124,58,237,0.25)',
            borderRadius: 8,
            padding: '2px 9px',
            backgroundColor: 'rgba(124,58,237,0.05)',
          }}
        >
          {r.category}
        </span>
      </div>

      {/* Row 3 — budget + rating + distance */}
      <div className="flex items-center gap-3 mb-2.5">
        {/* Budget */}
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#6B7280" strokeWidth="1.3"/>
            <path d="M7 4V4.5M7 9.5V10M5.5 8.25C5.5 8.94 6.17 9.5 7 9.5C7.83 9.5 8.5 8.94 8.5 8.25C8.5 7.56 7.83 7 7 7C6.17 7 5.5 6.44 5.5 5.75C5.5 5.06 6.17 4.5 7 4.5C7.83 4.5 8.5 5.06 8.5 5.75" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>
            ${r.budgetMin.toLocaleString()}–${r.budgetMax.toLocaleString()}
          </span>
        </div>

        <div style={{ width: 1, height: 12, backgroundColor: '#E5E7EB', flexShrink: 0 }} />

        {/* Buyer rating */}
        <StarRating rating={r.buyerRating} reviews={r.buyerReviews} />

        <div style={{ width: 1, height: 12, backgroundColor: '#E5E7EB', flexShrink: 0 }} />

        {/* Distance */}
        <div className="flex items-center gap-1">
          {isRemote ? (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#6B7280" strokeWidth="1.3"/>
              <path d="M1 6H13" stroke="#6B7280" strokeWidth="1"/>
              <path d="M5.5 3C5.5 3 5 5 5 7C5 9 5.5 11 5.5 11" stroke="#6B7280" strokeWidth="0.9"/>
              <path d="M8.5 3C8.5 3 9 5 9 7C9 9 8.5 11 8.5 11" stroke="#6B7280" strokeWidth="0.9"/>
            </svg>
          ) : (
            <svg width="11" height="13" viewBox="0 0 12 14" fill="none">
              <path d="M6 1C3.79 1 2 2.79 2 5C2 8.5 6 13 6 13C6 13 10 8.5 10 5C10 2.79 8.21 1 6 1Z" stroke="#6B7280" strokeWidth="1.3"/>
              <circle cx="6" cy="5" r="1.5" stroke="#6B7280" strokeWidth="1.1"/>
            </svg>
          )}
          <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
            {r.distance}
          </span>
        </div>
      </div>

      {/* Row 4 — offer count + time + Make Offer CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Offer count */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
            style={{
              backgroundColor: r.offerCount > 0 ? 'rgba(124,58,237,0.08)' : 'rgba(156,163,175,0.1)',
              border: `1px solid ${r.offerCount > 0 ? 'rgba(124,58,237,0.18)' : 'rgba(156,163,175,0.2)'}`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 11V10C2 8.343 3.343 7 5 7H9C10.657 7 12 8.343 12 10V11" stroke={r.offerCount > 0 ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="4" r="2.5" stroke={r.offerCount > 0 ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.3"/>
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 700, color: r.offerCount > 0 ? '#7C3AED' : '#9CA3AF' }}>
              {r.offerCount} offer{r.offerCount !== 1 ? 's' : ''}
            </span>
          </div>

          <span style={{ fontSize: '11px', color: '#C4C9D4' }}>·</span>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{r.postedAgo}</span>
        </div>

        {/* Make Offer button */}
        <button
          type="button"
          className="flex items-center gap-1.5 transition-all active:scale-95"
          style={{
            height: 32,
            paddingLeft: 14,
            paddingRight: 14,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(124,58,237,0.3)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Make Offer</span>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────── */
function FeedEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12">
      <div className="flex items-center justify-center rounded-full mb-4" style={{ width: 60, height: 60, background: 'rgba(124,58,237,0.08)' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7.5" stroke="#7C3AED" strokeWidth="1.7"/>
          <path d="M17 17L21 21" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/>
          {query && <path d="M8 11H14M11 8V14" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>}
        </svg>
      </div>
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>
        {query ? 'No results found' : 'No requests here'}
      </p>
      <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', maxWidth: 220 }}>
        {query ? `Try different keywords or clear your search` : `There are no matching requests in this category right now`}
      </p>
    </div>
  );
}

/* ─── Seller Bottom Nav ──────────────────────────────────────── */
function SellerBottomNav({ activeTab, setActiveTab }: { activeTab: SellerTabId; setActiveTab: (t: SellerTabId) => void }) {
  const tabs: { id: SellerTabId; label: string; badge?: number; icon: (active: boolean) => JSX.Element }[] = [
    {
      id: 'feed',
      label: 'Feed',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.12)' : 'none'}/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.12)' : 'none'}/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.12)' : 'none'}/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.12)' : 'none'}/>
        </svg>
      ),
    },
    {
      id: 'offers',
      label: 'My Offers',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 7H4C3.45 7 3 7.45 3 8V19C3 19.55 3.45 20 4 20H20C20.55 20 21 19.55 21 19V8C21 7.45 20.55 7 20 7Z" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.1)' : 'none'} strokeLinecap="round"/>
          <path d="M16 7V6C16 4.9 15.1 4 14 4H10C8.9 4 8 4.9 8 6V7" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 12V16M10 14H14" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'transactions',
      label: 'Txns',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="3" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.1)' : 'none'}/>
          <path d="M2 9H22" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="7" cy="14" r="1.5" fill={active ? '#7C3AED' : '#9CA3AF'}/>
          <rect x="11" y="13" width="7" height="2" rx="1" fill={active ? '#7C3AED' : '#9CA3AF'}/>
        </svg>
      ),
    },
    {
      id: 'messages',
      label: 'Messages',
      badge: 2,
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 16.1 20.1 17 19 17H7L3 21V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V15Z" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(124,58,237,0.1)' : 'none'}/>
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.1)' : 'none'}/>
          <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        backgroundColor: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 20,
        paddingTop: 8,
        zIndex: 20,
      }}
    >
      <div className="flex items-center justify-around px-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all active:scale-90 relative"
            style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: 60 }}
          >
            <div className="relative">
              {tab.icon(activeTab === tab.id)}
              {tab.badge !== undefined && (
                <div
                  className="absolute flex items-center justify-center rounded-full"
                  style={{ top: -4, right: -5, minWidth: 17, height: 17, padding: '0 4px', backgroundColor: '#EF4444', border: '1.5px solid white' }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>{tab.badge}</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? '#7C3AED' : '#9CA3AF', transition: 'color 0.2s' }}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div style={{ position: 'absolute', bottom: -4, width: 20, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #7C3AED, #A855F7)' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}