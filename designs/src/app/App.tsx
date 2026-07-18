import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Screen components
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { EmailVerificationScreen } from './components/EmailVerificationScreen';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerFeedScreen } from './components/SellerFeedScreen';
import { PhoneFrame } from './components/PhoneFrame';

// Additional screens
import { PostDetailScreen, DEMO_POST } from './components/PostDetailScreen';
import { SellerPostDetailScreen, DEMO_SELLER_POST } from './components/SellerPostDetailScreen';
import { MyPostsScreen } from './components/MyPostsScreen';
import { MyOffersScreen } from './components/MyOffersScreen';
import { OffersListScreen, DEMO_OFFERS } from './components/OffersListScreen';
import { SubmitOfferScreen, DEMO_SUBMIT_POST } from './components/SubmitOfferScreen';
import { CompareOffersModal } from './components/CompareOffersModal';
import { AcceptOfferModal } from './components/AcceptOfferModal';
import { ChatScreen } from './components/ChatScreen';
import { MessagesScreen, DEMO_CONVERSATIONS } from './components/MessagesScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { TransactionDetailScreen, DEMO_TX_DETAIL } from './components/TransactionDetailScreen';
import { SellerTransactionDetailScreen, DEMO_SELLER_TX_SERVICE } from './components/SellerTransactionDetailScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { CreatePostMethodScreen } from './components/CreatePostMethodScreen';
import { AIPostCreationScreen } from './components/AIPostCreationScreen';
import { ManualPostCreationScreen } from './components/ManualPostCreationScreen';
import { PostSuccessScreen } from './components/PostSuccessScreen';

// Batch 1: Auth + Settings
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { LanguageSettingsScreen } from './components/LanguageSettingsScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SettingsScreen } from './components/SettingsScreen';

// Batch 2: Profile
import { EditProfileScreen } from './components/EditProfileScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { SubmitReviewScreen } from './components/SubmitReviewScreen';

// Batch 3: Seller
import { SellerProfileViewScreen } from './components/SellerProfileViewScreen';
import { SellerProfileSetupScreen } from './components/SellerProfileSetupScreen';
import { StripeOnboardScreen } from './components/StripeOnboardScreen';
import { VerificationScreen } from './components/VerificationScreen';

// Batch 4: Offers
import { OfferDetailScreen } from './components/OfferDetailScreen';
import { CounterOfferModal } from './components/CounterOfferModal';

// Batch 5: New screens
import { PublicProfileScreen } from './components/PublicProfileScreen';
import { PaymentMethodsScreen } from './components/PaymentMethodsScreen';
import { HelpSupportScreen } from './components/HelpSupportScreen';

type Screen =
  | 'splash' | 'login' | 'register' | 'forgot' | 'verify'
  | 'home' | 'seller'
  | 'post-detail' | 'seller-post-detail'
  | 'my-posts' | 'my-offers'
  | 'offers-list' | 'submit-offer'
  | 'compare-offers' | 'accept-offer'
  | 'chat' | 'messages'
  | 'profile' | 'edit-profile' | 'notifications' | 'submit-review'
  | 'seller-profile-view' | 'seller-profile-setup'
  | 'stripe-onboard' | 'verification'
  | 'transaction-detail' | 'seller-transaction-detail' | 'transactions'
  | 'create-post-method' | 'ai-post-creation' | 'manual-post-creation'
  | 'post-success'
  | 'reset-password' | 'language-settings' | 'change-password' | 'settings'
  | 'offer-detail' | 'counter-offer'
  | 'public-profile' | 'payment-methods' | 'help-support';

interface ScreenEntry {
  id: Screen;
  label: string;
  group: string;
}

const SCREEN_LIST: ScreenEntry[] = [
  // Auth
  { id: 'splash', label: 'Splash', group: 'Auth' },
  { id: 'login', label: 'Login', group: 'Auth' },
  { id: 'register', label: 'Register', group: 'Auth' },
  { id: 'forgot', label: 'Forgot Password', group: 'Auth' },
  { id: 'verify', label: 'Email Verification', group: 'Auth' },
  // Buyer
  { id: 'home', label: 'Buyer Dashboard', group: 'Buyer' },
  { id: 'my-posts', label: 'My Posts', group: 'Buyer' },
  { id: 'post-detail', label: 'Post Detail', group: 'Buyer' },
  { id: 'offers-list', label: 'Offers List', group: 'Buyer' },
  { id: 'compare-offers', label: 'Compare Offers', group: 'Buyer' },
  { id: 'accept-offer', label: 'Accept Offer', group: 'Buyer' },
  { id: 'transaction-detail', label: 'Transaction Detail', group: 'Buyer' },
  { id: 'transactions', label: 'Transactions', group: 'Buyer' },
  // Seller
  { id: 'seller', label: 'Seller Feed', group: 'Seller' },
  { id: 'seller-post-detail', label: 'Seller Post Detail', group: 'Seller' },
  { id: 'my-offers', label: 'My Offers', group: 'Seller' },
  { id: 'submit-offer', label: 'Submit Offer', group: 'Seller' },
  { id: 'seller-transaction-detail', label: 'Seller Transaction Detail', group: 'Seller' },
  // Post Creation
  { id: 'create-post-method', label: 'Create Post Method', group: 'Post Creation' },
  { id: 'ai-post-creation', label: 'AI Post Creation', group: 'Post Creation' },
  { id: 'manual-post-creation', label: 'Manual Post Creation', group: 'Post Creation' },
  { id: 'post-success', label: 'Post Success', group: 'Post Creation' },
  // Messaging & Profile
  { id: 'messages', label: 'Messages', group: 'General' },
  { id: 'chat', label: 'Chat', group: 'General' },
  { id: 'profile', label: 'Profile', group: 'General' },
  { id: 'edit-profile', label: 'Edit Profile', group: 'General' },
  { id: 'notifications', label: 'Notifications', group: 'General' },
  { id: 'submit-review', label: 'Submit Review', group: 'General' },
  // Seller Setup
  { id: 'seller-profile-view', label: 'Seller Profile View', group: 'Seller' },
  { id: 'seller-profile-setup', label: 'Seller Profile Setup', group: 'Seller' },
  { id: 'stripe-onboard', label: 'Stripe Onboarding', group: 'Seller' },
  { id: 'verification', label: 'Verification', group: 'Seller' },
  // Batch 1: Auth + Settings
  { id: 'reset-password', label: 'Reset Password', group: 'Auth' },
  { id: 'language-settings', label: 'Language Settings', group: 'Settings' },
  { id: 'change-password', label: 'Change Password', group: 'Settings' },
  { id: 'settings', label: 'Settings', group: 'Settings' },
  // Batch 4: Offers
  { id: 'offer-detail', label: 'Offer Detail', group: 'Buyer' },
  { id: 'counter-offer', label: 'Counter Offer', group: 'Buyer' },
  // Batch 5: New
  { id: 'public-profile', label: 'Public Profile', group: 'General' },
  { id: 'payment-methods', label: 'Payment Methods', group: 'Settings' },
  { id: 'help-support', label: 'Help & Support', group: 'Settings' },
];

const GROUPS = [...new Set(SCREEN_LIST.map(s => s.group))];

// Slide in from right (dir=1) or from left (dir=-1)
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-28%',
    opacity: dir > 0 ? 1 : 0.6,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-28%' : '100%',
    opacity: dir > 0 ? 0.6 : 1,
  }),
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 32,
  mass: 0.85,
};

// Stub callback that logs
const noop = () => {};
const log = (action: string) => () => console.log(`[Design] ${action}`);

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [pickerOpen, setPickerOpen] = useState(true);
  const directionRef = useRef(1);

  const navigate = (to: Screen, dir: 1 | -1 = 1) => {
    directionRef.current = dir;
    setScreen(to);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onFinish={() => navigate('login', 1)} />;
      case 'login':
        return (
          <LoginScreen
            onLogin={() => navigate('home', 1)}
            onSignUp={() => navigate('register', 1)}
            onForgotPassword={() => navigate('forgot', 1)}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onBack={() => navigate('login', -1)}
            onRegister={(email?: string) => {
              setRegisteredEmail(email || 'you@example.com');
              navigate('verify', 1);
            }}
            onSignIn={() => navigate('login', -1)}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordScreen
            onBack={() => navigate('login', -1)}
            onBackToSignIn={() => navigate('login', -1)}
          />
        );
      case 'verify':
        return (
          <EmailVerificationScreen
            email={registeredEmail || 'alex@example.com'}
            onSwitchAccount={() => navigate('login', -1)}
          />
        );
      case 'home':
        return (
          <BuyerDashboard
            userName="Alex"
            onSignOut={() => navigate('login', -1)}
            onSwitchToSeller={() => navigate('seller', 1)}
          />
        );
      case 'seller':
        return (
          <SellerFeedScreen
            onSignOut={() => navigate('login', -1)}
            onSwitchToBuyer={() => navigate('home', -1)}
          />
        );
      case 'post-detail':
        return (
          <PostDetailScreen
            post={DEMO_POST}
            onBack={() => navigate('home', -1)}
            onViewOffers={() => navigate('offers-list', 1)}
            onEdit={log('Edit post')}
            onDelete={log('Delete post')}
            onExtend={log('Extend post')}
            onMarkFilled={log('Mark filled')}
            onRepost={log('Repost')}
          />
        );
      case 'seller-post-detail':
        return (
          <SellerPostDetailScreen
            post={DEMO_SELLER_POST}
            onBack={() => navigate('seller', -1)}
            onSubmitOffer={() => navigate('submit-offer', 1)}
            onMessageBuyer={() => navigate('chat', 1)}
            onViewProfile={log('View buyer profile')}
          />
        );
      case 'my-posts':
        return (
          <MyPostsScreen
            onCreatePost={() => navigate('create-post-method', 1)}
            onViewPost={() => navigate('post-detail', 1)}
            onViewOffers={() => navigate('offers-list', 1)}
          />
        );
      case 'my-offers':
        return (
          <MyOffersScreen
            onBrowseFeed={() => navigate('seller', 1)}
            onWithdraw={log('Withdraw offer')}
            onMessage={() => navigate('chat', 1)}
          />
        );
      case 'offers-list':
        return (
          <OffersListScreen
            postTitle="Need a React Native developer for marketplace app"
            postBudgetMin={2000}
            postBudgetMax={5000}
            offers={DEMO_OFFERS}
            onBack={() => navigate('post-detail', -1)}
            onViewOfferDetail={log('View offer detail')}
            onAccept={() => navigate('accept-offer', 1)}
            onDecline={log('Decline offer')}
            onMessage={() => navigate('chat', 1)}
          />
        );
      case 'submit-offer':
        return (
          <SubmitOfferScreen
            post={DEMO_SUBMIT_POST}
            sellerName="Alex"
            onBack={() => navigate('seller-post-detail', -1)}
            onPreview={log('Preview offer')}
            onSubmit={log('Submit offer')}
          />
        );
      case 'compare-offers':
        return (
          <CompareOffersModal
            offers={DEMO_OFFERS.slice(0, 3)}
            budgetMax={5000}
            postTitle="Need a React Native developer for marketplace app"
            onClose={() => navigate('offers-list', -1)}
            onAccept={log('Accept from compare')}
          />
        );
      case 'accept-offer':
        return (
          <AcceptOfferModal
            offer={DEMO_OFFERS[0]}
            postTitle="Need a React Native developer for marketplace app"
            onConfirm={log('Confirm accept')}
            onCancel={() => navigate('offers-list', -1)}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            conversation={DEMO_CONVERSATIONS[0]}
            onBack={() => navigate('messages', -1)}
            onViewTransaction={() => navigate('transaction-detail', 1)}
          />
        );
      case 'messages':
        return (
          <MessagesScreen
            onOpenConversation={() => navigate('chat', 1)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            userName="Alex Johnson"
            userEmail="alex.johnson@example.com"
            memberSince="January 2024"
            onSignOut={() => navigate('login', -1)}
            onSwitchToSeller={() => navigate('seller', 1)}
            onSwitchToBuyer={() => navigate('home', 1)}
          />
        );
      case 'transaction-detail':
        return (
          <TransactionDetailScreen
            tx={DEMO_TX_DETAIL}
            onBack={() => navigate('transactions', -1)}
            onMessage={() => navigate('chat', 1)}
            onApprove={log('Approve transaction')}
            onRequestChanges={log('Request changes')}
            onReport={log('Report')}
          />
        );
      case 'seller-transaction-detail':
        return (
          <SellerTransactionDetailScreen
            tx={DEMO_SELLER_TX_SERVICE}
            onBack={() => navigate('transactions', -1)}
            onMessage={() => navigate('chat', 1)}
            onMarkComplete={log('Mark complete')}
            onReport={log('Report')}
          />
        );
      case 'transactions':
        return (
          <TransactionsScreen
            role="buyer"
            onViewTransaction={() => navigate('transaction-detail', 1)}
          />
        );
      case 'create-post-method':
        return (
          <CreatePostMethodScreen
            onBack={() => navigate('home', -1)}
            onSelectAI={() => navigate('ai-post-creation', 1)}
            onSelectManual={() => navigate('manual-post-creation', 1)}
          />
        );
      case 'ai-post-creation':
        return (
          <AIPostCreationScreen
            onBack={() => navigate('create-post-method', -1)}
            onPost={() => navigate('post-success', 1)}
          />
        );
      case 'manual-post-creation':
        return (
          <ManualPostCreationScreen
            onBack={() => navigate('create-post-method', -1)}
            onSubmit={() => navigate('post-success', 1)}
            onPreview={log('Preview post')}
            onSaveDraft={log('Save draft')}
          />
        );
      case 'post-success':
        return (
          <PostSuccessScreen
            onViewPost={() => navigate('post-detail', 1)}
            onCreateAnother={() => navigate('create-post-method', 1)}
            onDashboard={() => navigate('home', 1)}
          />
        );
      case 'edit-profile':
        return (
          <EditProfileScreen
            onBack={() => navigate('profile', -1)}
            onSave={log('Save profile')}
            onChangePassword={log('Change password')}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => navigate('home', -1)}
          />
        );
      case 'submit-review':
        return (
          <SubmitReviewScreen
            onBack={() => navigate('transaction-detail', -1)}
            onSubmit={log('Submit review')}
          />
        );
      case 'seller-profile-view':
        return (
          <SellerProfileViewScreen
            onBack={() => navigate('profile', -1)}
            onEdit={() => navigate('seller-profile-setup', 1)}
            onManageVerification={() => navigate('verification', 1)}
          />
        );
      case 'seller-profile-setup':
        return (
          <SellerProfileSetupScreen
            onBack={() => navigate('seller-profile-view', -1)}
            onSave={log('Save seller profile')}
          />
        );
      case 'stripe-onboard':
        return (
          <StripeOnboardScreen
            onBack={() => navigate('seller-profile-view', -1)}
            onStartOnboarding={log('Start Stripe onboarding')}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            onBack={() => navigate('seller-profile-view', -1)}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordScreen
            onBack={() => navigate('login', -1)}
            onBackToSignIn={() => navigate('login', -1)}
          />
        );
      case 'language-settings':
        return (
          <LanguageSettingsScreen
            onBack={() => navigate('settings', -1)}
          />
        );
      case 'change-password':
        return (
          <ChangePasswordModal
            onSubmit={log('Change password')}
            onCancel={() => navigate('edit-profile', -1)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => navigate('profile', -1)}
          />
        );
      case 'offer-detail':
        return (
          <OfferDetailScreen
            onBack={() => navigate('offers-list', -1)}
            onAccept={log('Accept offer')}
            onCounter={() => navigate('counter-offer', 1)}
            onDecline={log('Decline offer')}
            onMessage={() => navigate('chat', 1)}
          />
        );
      case 'counter-offer':
        return (
          <CounterOfferModal
            onSubmit={log('Submit counter')}
            onCancel={() => navigate('offer-detail', -1)}
          />
        );
      case 'public-profile':
        return (
          <PublicProfileScreen
            onBack={() => navigate('home', -1)}
            onMessage={() => navigate('chat', 1)}
            onSaveSeller={log('Save seller')}
          />
        );
      case 'payment-methods':
        return (
          <PaymentMethodsScreen
            onBack={() => navigate('settings', -1)}
          />
        );
      case 'help-support':
        return (
          <HelpSupportScreen
            onBack={() => navigate('settings', -1)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F3F4F6' }}>
      {/* Screen Picker Sidebar */}
      <div
        style={{
          width: pickerOpen ? 260 : 0,
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          borderRight: pickerOpen ? '1px solid #E5E7EB' : 'none',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
          }}>
            RM
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>Design Preview</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>40 screens</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {GROUPS.map(group => (
            <div key={group}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: '#9CA3AF',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: '12px 20px 4px',
              }}>
                {group}
              </div>
              {SCREEN_LIST.filter(s => s.group === group).map(entry => (
                <button
                  key={entry.id}
                  onClick={() => navigate(entry.id, 1)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '7px 20px',
                    fontSize: 13,
                    color: screen === entry.id ? '#7C3AED' : '#4B5563',
                    fontWeight: screen === entry.id ? 600 : 400,
                    background: screen === entry.id ? 'rgba(124,58,237,0.06)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 0,
                    transition: 'background 0.15s',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onMouseEnter={e => {
                    if (screen !== entry.id) (e.target as HTMLElement).style.background = '#F9FAFB';
                  }}
                  onMouseLeave={e => {
                    if (screen !== entry.id) (e.target as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setPickerOpen(p => !p)}
        style={{
          position: 'absolute',
          top: 12,
          left: pickerOpen ? 268 : 8,
          zIndex: 999,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#6B7280',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'left 0.2s ease',
          fontFamily: 'system-ui',
        }}
      >
        {pickerOpen ? '◂' : '▸'}
      </button>

      {/* Phone Frame with screen */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PhoneFrame>
          <AnimatePresence custom={directionRef.current} mode="popLayout">
            <motion.div
              key={screen}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springTransition}
              style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>
      </div>
    </div>
  );
}
