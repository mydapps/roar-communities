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

// Lazy loaded components
const LazyMySharesPage = lazy(() => import('@/pages/MySharesPage'));
const LazyReferralPage = lazy(() => import('@/pages/ReferralPage'));

// Invalid auth event handler
const createInvalidAuthEvent = () => {
  return new CustomEvent('dapps_auth_invalidated');
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <HelmetProvider>
      <ZoomDisabledHelmet />
      <DeviceProvider>
      <PrivyAuthProvider>
        <Routes>
          {/* Public routes - accessible to everyone */}
          <Route path="/" element={<Index />} />
          <Route path="/index" element={<Index />} />
          <Route path="/invite/:code" element={<Index />} />
          <Route path="request-invite" element={<RequestInvitePage />} />
          <Route path="avatar-handle" element={<AvatarHandlePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="/auth-test" element={<AuthTestPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
          
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
            <Route path="communities" element={
              <ProtectedRoute>
                <CommunitiesPage />
              </ProtectedRoute>
            } />
            <Route path="c/:id" element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } />
            <Route path="create-community" element={
              <ProtectedRoute>
                <CreateCommunityPage />
              </ProtectedRoute>
            } />
            <Route path="u/:handle" element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } />
            <Route path="edit-profile" element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            } />
            <Route path="my-shares" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>}>
                  <LazyMySharesPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="wallet" element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } />
            <Route path="account" element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } />
            <Route path="search" element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            } />
            <Route path="referral" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>}>
                  <LazyReferralPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="roar-farming" element={
              <ProtectedRoute>
                <RoarFarmingPage />
              </ProtectedRoute>
            } />
            <Route path="boosters" element={
              <ProtectedRoute>
                <BoosterPage />
              </ProtectedRoute>
            } />
            <Route path="successful-onboarding" element={
              <ProtectedRoute>
                {localStorage.getItem('dapps_show_onboarding') === '1' ? (
                  <SuccessfulOnboarding />
                ) : (
                  <Navigate to="/feed" replace />
                )}
              </ProtectedRoute>
            } />
            <Route path="follow-suggestions" element={
              <ProtectedRoute>
                <FollowSuggestionsPage />
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

