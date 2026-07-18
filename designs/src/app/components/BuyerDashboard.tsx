import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessagesScreen } from './MessagesScreen';
import { ProfileScreen } from './ProfileScreen';
import { CreatePostMethodScreen } from './CreatePostMethodScreen';
import { AIPostCreationScreen } from './AIPostCreationScreen';
import { ManualPostCreationScreen } from './ManualPostCreationScreen';
import { PostSuccessScreen } from './PostSuccessScreen';
import { PostDetailScreen, DEMO_POST } from './PostDetailScreen';
import { OffersListScreen, DEMO_OFFERS } from './OffersListScreen';
import { MyPostsScreen } from './MyPostsScreen';
import { TransactionsScreen } from './TransactionsScreen';

interface BuyerDashboardProps {
  userName?: string;
  onSignOut?: () => void;
  onSwitchToSeller?: () => void;
}

type TabId = 'home' | 'posts' | 'transactions' | 'messages' | 'profile';

interface Post {
  id: string;
  title: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  urgency: 'High' | 'Medium' | 'Low';
  offers: number;
  status: 'Active' | 'Draft';
  postedAgo: string;
}

const ALL_POSTS: Post[] = [
  {
    id: '1',
    title: 'Need a React Native developer for marketplace app',
    category: 'Software Dev',
    budgetMin: 2000,
    budgetMax: 5000,
    urgency: 'High',
    offers: 7,
    status: 'Active',
    postedAgo: '2h ago',
  },
  {
    id: '2',
    title: 'Looking for vintage leather sofa — must be in good condition',
    category: 'Furniture',
    budgetMin: 300,
    budgetMax: 800,
    urgency: 'Low',
    offers: 3,
    status: 'Active',
    postedAgo: '5h ago',
  },
  {
    id: '3',
    title: 'Bulk order: 500 custom printed tote bags with logo',
    category: 'Print & Merch',
    budgetMin: 1500,
    budgetMax: 2500,
    urgency: 'Medium',
    offers: 12,
    status: 'Active',
    postedAgo: '1d ago',
  },
  {
    id: '4',
    title: 'iPhone 14 Pro Max — 256GB, unlocked, any color',
    category: 'Electronics',
    budgetMin: 700,
    budgetMax: 950,
    urgency: 'Medium',
    offers: 5,
    status: 'Draft',
    postedAgo: '2d ago',
  },
  {
    id: '5',
    title: 'Home cleaning service — bi-weekly, 3BR apartment',
    category: 'Home Services',
    budgetMin: 120,
    budgetMax: 200,
    urgency: 'Low',
    offers: 0,
    status: 'Draft',
    postedAgo: '3d ago',
  },
  {
    id: '6',
    title: 'Graphic designer for brand identity refresh',
    category: 'Design',
    budgetMin: 800,
    budgetMax: 2000,
    urgency: 'High',
    offers: 9,
    status: 'Active',
    postedAgo: '4h ago',
  },
];

const STATS = { activePosts: 4, offersReceived: 36, completed: 18 };

export function BuyerDashboard({ userName = 'Alex', onSignOut, onSwitchToSeller }: BuyerDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showCreateMethod, setShowCreateMethod] = useState(false);
  const [showAIPost, setShowAIPost] = useState(false);
  const [showManualPost, setShowManualPost] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showOffersList, setShowOffersList] = useState(false);

  const handleFab = () => setShowCreateMethod(true);
  const handleViewPost = (id: string) => { setShowPostDetail(true); };
  const handleViewOffers = (id: string) => { setShowOffersList(true); };

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden relative">

      {/* ── Main content (tabs) ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {activeTab === 'profile' ? (
              <ProfileScreen
                userName="Alex Johnson"
                userEmail="alex.johnson@example.com"
                memberSince="January 2024"
                onSignOut={onSignOut}
                onSwitchToSeller={onSwitchToSeller}
              />
            ) : activeTab === 'posts' ? (
              <MyPostsScreen
                onCreatePost={handleFab}
                onViewPost={handleViewPost}
                onViewOffers={handleViewOffers}
              />
            ) : activeTab === 'transactions' ? (
              <TransactionsScreen role="buyer" />
            ) : activeTab === 'messages' ? (
              <MessagesScreen />
            ) : (
              <HomeTabContent userName={userName} onFab={handleFab} onViewPost={handleViewPost} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FAB (only outside profile tab) ── */}
      {activeTab !== 'profile' && (
        <button
          type="button"
          onClick={handleFab}
          className="absolute flex items-center justify-center transition-all active:scale-90"
          style={{
            bottom: 88,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(124,58,237,0.45)',
            zIndex: 30,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 4V18M4 11H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* ── Bottom Nav ── */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Create Post Method — slides in from right as a push ── */}
      <AnimatePresence>
        {showCreateMethod && (
          <motion.div
            key="create-method"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'white' }}
          >
            <CreatePostMethodScreen
              onBack={() => setShowCreateMethod(false)}
              onSelectAI={() => { setShowCreateMethod(false); setShowAIPost(true); }}
              onSelectManual={() => { setShowCreateMethod(false); setShowManualPost(true); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manual Post Creation — slides in on top ── */}
      <AnimatePresence>
        {showManualPost && (
          <motion.div
            key="manual-post"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'white' }}
          >
            <ManualPostCreationScreen
              onBack={() => { setShowManualPost(false); setShowCreateMethod(true); }}
              onSubmit={() => { setShowManualPost(false); setShowSuccess(true); }}
              onSaveDraft={() => setShowManualPost(false)}
              onPreview={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Post Creation — slides in on top ── */}
      <AnimatePresence>
        {showAIPost && (
          <motion.div
            key="ai-post"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'white' }}
          >
            <AIPostCreationScreen
              onBack={() => { setShowAIPost(false); setShowCreateMethod(true); }}
              onPost={() => { setShowAIPost(false); setShowSuccess(true); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post Success ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            key="post-success"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.9 }}
            style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'white' }}
          >
            <PostSuccessScreen
              postTitle="Need a React Native developer for marketplace app"
              postCategory="Web Development"
              budgetMin={2000}
              budgetMax={5000}
              onViewPost={() => { setShowSuccess(false); setShowPostDetail(true); }}
              onCreateAnother={() => { setShowSuccess(false); setShowCreateMethod(true); }}
              onDashboard={() => setShowSuccess(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post Detail ── */}
      <AnimatePresence>
        {showPostDetail && (
          <motion.div
            key="post-detail"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 55, background: 'white' }}
          >
            <PostDetailScreen
              post={DEMO_POST}
              onBack={() => setShowPostDetail(false)}
              onViewOffers={() => { setShowPostDetail(false); setShowOffersList(true); }}
              onEdit={() => { setShowPostDetail(false); setShowManualPost(true); }}
              onDelete={() => setShowPostDetail(false)}
              onExtend={() => setShowPostDetail(false)}
              onMarkFilled={() => setShowPostDetail(false)}
              onRepost={() => { setShowPostDetail(false); setShowCreateMethod(true); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Offers List ── */}
      <AnimatePresence>
        {showOffersList && (
          <motion.div
            key="offers-list"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.85 }}
            style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'white' }}
          >
            <OffersListScreen
              postTitle="Need a React Native developer for marketplace app"
              postBudgetMin={2000}
              postBudgetMax={5000}
              offers={DEMO_OFFERS}
              onBack={() => { setShowOffersList(false); setShowPostDetail(true); }}
              onViewOfferDetail={() => {}}
              onAccept={() => {}}
              onDecline={() => {}}
              onMessage={() => {}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Home Tab Content ───────────────────────────────────────── */
function HomeTabContent({ userName, onFab, onViewPost }: { userName: string; onFab: () => void; onViewPost: (id: string) => void }) {
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
      <div className="flex items-center justify-between px-6 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-[11px]"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              boxShadow: '0 4px 10px rgba(124,58,237,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 44 44" fill="none">
              <path d="M26 4L10 24H22L18 40L34 20H22L26 4Z" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: '19px', fontWeight: 700, color: '#1F2937', letterSpacing: '-0.02em' }}>
            Sorcyn
          </span>
        </div>

        {/* Notification bell */}
        <button
          type="button"
          className="relative flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1.5px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{ top: 6, right: 6, width: 9, height: 9, backgroundColor: '#EF4444', border: '1.5px solid white' }}
          />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 96 }}>

        {/* ── Welcome Card ── */}
        <div className="px-6 mb-5">
          <div
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              boxShadow: '0 10px 28px rgba(124,58,237,0.32)',
            }}
          >
            <div
              className="absolute rounded-full"
              style={{ width: 180, height: 180, top: -60, right: -40, background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginBottom: 3 }}>
                    Good morning 👋
                  </p>
                  <h2 style={{ fontSize: '23px', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
                    Hi, {userName}!
                  </h2>
                </div>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>
                    {userName[0].toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div
                className="flex rounded-2xl overflow-hidden mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
              >
                {[
                  { label: 'Active Posts', value: STATS.activePosts },
                  { label: 'Offers', value: STATS.offersReceived },
                  { label: 'Completed', value: STATS.completed },
                ].map((s, i, arr) => (
                  <div
                    key={s.label}
                    className="flex-1 flex flex-col items-center py-3"
                    style={{ borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.18)' : 'none' }}
                  >
                    <span style={{ fontSize: '21px', fontWeight: 700, color: 'white', lineHeight: 1 }}>{s.value}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.72)', marginTop: 3, textAlign: 'center' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Create Post CTA */}
              <button
                type="button"
                onClick={onFab}
                className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ height: 44, borderRadius: 18, background: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>Create Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Posts section header ── */}
        <div className="px-6 flex items-center justify-between mb-3">
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1F2937' }}>
            My Posts
            <span
              className="ml-2 inline-flex items-center justify-center rounded-full"
              style={{ width: 22, height: 22, background: 'rgba(124,58,237,0.1)', fontSize: '12px', fontWeight: 700, color: '#7C3AED', verticalAlign: 'middle' }}
            >
              {ALL_POSTS.length}
            </span>
          </h3>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#7C3AED' }}>See all</span>
          </button>
        </div>

        {/* ── Post Cards ── */}
        <div className="px-6 flex flex-col gap-3">
          {ALL_POSTS.map(post => (
            <PostCard key={post.id} post={post} onViewPost={onViewPost} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Post Card ─────────────────────────────────────────────── */
function PostCard({ post, onViewPost }: { post: Post; onViewPost: (id: string) => void }) {
  const urgencyConfig = {
    High:   { bg: 'rgba(239,68,68,0.08)',  color: '#DC2626', label: '🔴 High'   },
    Medium: { bg: 'rgba(245,158,11,0.08)', color: '#D97706', label: '🟡 Medium' },
    Low:    { bg: 'rgba(16,185,129,0.08)', color: '#059669', label: '🟢 Low'    },
  };
  const urgency = urgencyConfig[post.urgency];

  return (
    <div
      className="rounded-2xl p-4 transition-all active:scale-[0.985] cursor-pointer"
      style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}
      onClick={() => onViewPost(post.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="flex-1" style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', lineHeight: '1.45' }}>
          {post.title}
        </h4>
        <StatusBadge status={post.status} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#7C3AED', border: '1.5px solid rgba(124,58,237,0.28)', borderRadius: 8, padding: '2px 8px', backgroundColor: 'rgba(124,58,237,0.05)' }}>
          {post.category}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: urgency.color, border: `1.5px solid ${urgency.color}33`, borderRadius: 8, padding: '2px 8px', backgroundColor: urgency.bg }}>
          {urgency.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#6B7280" strokeWidth="1.3"/>
              <path d="M7 4V4.5M7 9.5V10M5.5 8.25C5.5 8.94 6.17 9.5 7 9.5C7.83 9.5 8.5 8.94 8.5 8.25C8.5 7.56 7.83 7 7 7C6.17 7 5.5 6.44 5.5 5.75C5.5 5.06 6.17 4.5 7 4.5C7.83 4.5 8.5 5.06 8.5 5.75" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>
              ${post.budgetMin.toLocaleString()}–${post.budgetMax.toLocaleString()}
            </span>
          </div>
          <div style={{ width: 1, height: 12, backgroundColor: '#E5E7EB' }} />
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 11V10C2 8.343 3.343 7 5 7H9C10.657 7 12 8.343 12 10V11" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="7" cy="4" r="2.5" stroke="#7C3AED" strokeWidth="1.3"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>
              {post.offers} {post.offers === 1 ? 'offer' : 'offers'}
            </span>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{post.postedAgo}</span>
      </div>
    </div>
  );
}

/* ─── Status Badge ──────────────────────────────────────────── */
function StatusBadge({ status }: { status: 'Active' | 'Draft' }) {
  return (
    <div
      className="flex items-center gap-1.5 flex-shrink-0"
      style={{
        padding: '3px 9px',
        borderRadius: 8,
        backgroundColor: status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.15)',
        border: `1px solid ${status === 'Active' ? 'rgba(16,185,129,0.25)' : 'rgba(156,163,175,0.3)'}`,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: status === 'Active' ? '#10B981' : '#9CA3AF' }} />
      <span style={{ fontSize: '11px', fontWeight: 700, color: status === 'Active' ? '#059669' : '#6B7280' }}>
        {status}
      </span>
    </div>
  );
}

/* ─── Bottom Nav ────────────────────────────────────────────── */
function BottomNav({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string; badge?: number; icon: (active: boolean) => JSX.Element }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(124,58,237,0.12)' : 'none'}/>
        </svg>
      ),
    },
    {
      id: 'posts',
      label: 'My Posts',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="3" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.8" fill={active ? 'rgba(124,58,237,0.1)' : 'none'}/>
          <path d="M8 8H16M8 12H16M8 16H12" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="1.6" strokeLinecap="round"/>
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
      badge: 4,
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