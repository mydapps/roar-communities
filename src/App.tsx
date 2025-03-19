
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/pages/HomePage';
import FeedPage from '@/pages/FeedPage';
import CommunitiesPage from '@/pages/CommunitiesPage';
import CommunityPage from '@/pages/CommunityPage';
import PostPage from '@/pages/PostPage';
import MySharesPage from '@/pages/MySharesPage';
import AccountPage from '@/pages/AccountPage';
import SearchPage from '@/pages/SearchPage';
import ReferralPage from '@/pages/ReferralPage';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="communities" element={<CommunitiesPage />} />
          <Route path="c/:id" element={<CommunityPage />} />
          <Route path="c/:communityId/:postId" element={<PostPage />} />
          <Route path="u/:username" element={<AccountPage />} />
          <Route path="my-shares" element={<MySharesPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="referral" element={<ReferralPage />} />
          <Route path="invite/:code" element={<ReferralPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
