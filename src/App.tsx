
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import Index from '@/pages/Index';
import FeedPage from '@/pages/FeedPage';
import CommunitiesPage from '@/pages/CommunitiesPage';
import CommunityPage from '@/pages/CommunityPage';
import PostPage from '@/pages/PostPage';
import DetailedPostPage from '@/pages/DetailedPostPage';
import MySharesPage from '@/pages/MySharesPage';
import AccountPage from '@/pages/AccountPage';
import SearchPage from '@/pages/SearchPage';
import ReferralPage from '@/pages/ReferralPage';
import RequestInvitePage from '@/pages/RequestInvitePage';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';
import AvatarHandlePage from '@/pages/AvatarHandlePage';
import PrivyAuthProvider from '@/components/onboarding/PrivyAuthProvider';
import { Toaster } from 'sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <HelmetProvider>
      <PrivyAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path="/" element={<Index />} />
            <Route path="/index" element={<Index />} />
            <Route path="/invite/:code" element={<Index />} />
            <Route path="request-invite" element={<RequestInvitePage />} />
            <Route path="avatar-handle" element={<AvatarHandlePage />} />
            <Route path="login" element={<LoginPage />} />
            
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
              <Route path="u/:username" element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              } />
              <Route path="my-shares" element={
                <ProtectedRoute>
                  <MySharesPage />
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
                  <ReferralPage />
                </ProtectedRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </PrivyAuthProvider>
    </HelmetProvider>
  );
}

export default App;
