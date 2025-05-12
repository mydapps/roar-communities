import React, { useEffect, lazy, Suspense, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import Index from '@/pages/Index';
import FeedPage from '@/pages/FeedPage';
import CommunitiesPage from '@/pages/CommunitiesPage';
import CommunityPage from '@/pages/CommunityPage';
import PostPage from '@/pages/PostPage';
import DetailedPostPage from '@/pages/DetailedPostPage';
import AccountPage from '@/pages/AccountPage';
import WalletPage from '@/pages/WalletPage';
import SearchPage from '@/pages/SearchPage';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';
import AvatarHandlePage from '@/pages/AvatarHandlePage';
import CreateCommunityPage from '@/pages/CreateCommunityPage';
import PrivyAuthProvider from '@/components/onboarding/PrivyAuthProvider';
import { Toaster, toast } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserProfilePage from '@/pages/UserProfilePage';
import EditProfilePage from '@/pages/EditProfilePage';
import ZoomDisabledHelmet from '@/components/shared/ZoomDisabledHelmet';
import NotificationsPage from '@/pages/NotificationsPage';
import SuccessfulOnboarding from '@/pages/SuccessfulOnboarding';
import RequestInvitePage from '@/pages/RequestInvitePage';
import RoarFarmingPage from '@/pages/RoarFarmingPage';
import BoosterPage from '@/pages/BoosterPage';
import AuthTestPage from '@/pages/AuthTestPage';
import { validateAuthentication } from '@/utils/apiBase';
import FollowSuggestionsPage from '@/pages/FollowSuggestionsPage';
import DeviceProvider from '@/components/providers/DeviceProvider';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TransactionHistoryPage from '@/pages/TransactionHistoryPage';
import AccountInactivePage from '@/pages/AccountInactivePage';
import PostWarningPage from '@/pages/PostWarningPage';

// Lazy loaded components
const LazyMySharesPage = lazy(() => import('@/pages/MySharesPage'));
const LazyReferralPage = lazy(() => import('@/pages/ReferralPage'));

// Invalid auth event handler
const createInvalidAuthEvent = () => {
  return new CustomEvent('dapps_auth_invalidated');
};

// Google Analytics page view tracker
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      // Send page_view event to Google Analytics
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search
      });
      console.log(`GA page_view: ${location.pathname}${location.search}`);
    }
  }, [location]);

  return null;
};

// Declare gtag function on Window interface
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <HelmetProvider>
      <ZoomDisabledHelmet />
      <DeviceProvider>
      <PrivyAuthProvider>
        <PageViewTracker />
        <Routes>
          {/* Public routes - accessible outside MainLayout */}
          <Route path="/" element={<Index />} />
          <Route path="/index" element={<Index />} />
          <Route path="/invite/:code" element={<Index />} />
          <Route path="request-invite" element={<RequestInvitePage />} />
          <Route path="avatar-handle" element={<AvatarHandlePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="/auth-test" element={<AuthTestPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/account-inactive" element={<AccountInactivePage />} />
          
          {/* Mixed access routes with MainLayout */}
          <Route element={<MainLayout />}>
            {/* Public routes within MainLayout */}
            <Route path="c/:communityId/:postId" element={<DetailedPostPage />} />
            <Route path=":handle/:postId" element={<DetailedPostPage />} />
            <Route path="post/:postId" element={<DetailedPostPage />} />
            
            {/* Protected routes - require authentication */}
            <Route path="feed" element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            } />
            <Route path="communities" element={<CommunitiesPage />} />
            <Route path="c/:id" element={<CommunityPage />} />
            <Route path="create-community" element={<CreateCommunityPage />} />
            <Route path="u/:handle" element={<UserProfilePage />} />
            <Route path="edit-profile" element={<EditProfilePage />} />
            <Route path="my-shares" element={
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>}>
                <LazyMySharesPage />
              </Suspense>
            } />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="referral" element={
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>}>
                <LazyReferralPage />
              </Suspense>
            } />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="roar-farming" element={<RoarFarmingPage />} />
            <Route path="boosters" element={<BoosterPage />} />
            <Route path="successful-onboarding" element={
              localStorage.getItem('dapps_show_onboarding') === '1' ? (
                <SuccessfulOnboarding />
              ) : (
                <Navigate to="/feed" replace />
              )
            } />
            <Route path="follow-suggestions" element={<FollowSuggestionsPage />} />
            
            {/* Add Transaction History Route */}
            <Route path="transactions" element={
              <ProtectedRoute>
                <TransactionHistoryPage />
              </ProtectedRoute>
            } />

            {/* Add Post Warning Route */}
            <Route path="/c/:communityName/warning/:postCode" element={
              <ProtectedRoute>
                <PostWarningPage />
              </ProtectedRoute>
            } />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </PrivyAuthProvider>
      </DeviceProvider>
    </HelmetProvider>
  );
}

export default App;

