import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  CheckCircle2, 
  Users, 
  Gift, 
  Star, 
  Crown, 
  Zap, 
  Timer,
  TrendingUp,
  Target,
  Award,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Clock,
  Heart,
  Flame,
  Diamond,
  Trophy,
  Rocket,
  ArrowRight,
  Plus,
  Send,
  MessageCircle,
  Phone,
  HelpCircle,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { SiFarcaster } from 'react-icons/si';

// Import API functions
import { 
  getReferralStatus, 
  getMockReferralStatus,
  getReferrerRewards,
  getReferredUsers,
  ReferralStatusResponse,
  ReferrerRewardsResponse,
  ReferredUsersResponse,
  ReferredUser,
  ReferralDashboardData
} from '@/utils/referralApi';

const ReferralPage: React.FC = () => {
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState<ReferralStatusResponse | null>(null);
  const [referrerData, setReferrerData] = useState<ReferrerRewardsResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<ReferralDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showActivatedTooltip, setShowActivatedTooltip] = useState(false);
  const [showReferredUsersModal, setShowReferredUsersModal] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [referredUsersLoading, setReferredUsersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock user data
  const userHandle = localStorage.getItem('dapps_user_handle') || 'testuser';
  const referralLink = `https://dapps.co/invite/${userHandle}`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all required data in parallel
      const [referralStatusResponse, referrerRewardsResponse, referredUsersResponse] = await Promise.all([
        getReferralStatus(),
        getReferrerRewards(),
        getReferredUsers(1, 100) // Get first 100 to calculate statistics
      ]);

      if (referralStatusResponse.success) {
        setReferralData(referralStatusResponse);
      } else {
        console.warn('Failed to fetch referral status:', referralStatusResponse);
      }

      if (referrerRewardsResponse.success) {
        setReferrerData(referrerRewardsResponse);
      } else {
        console.warn('Failed to fetch referrer rewards:', referrerRewardsResponse);
      }

      // Combine data for dashboard display
      if (referredUsersResponse.success && referrerRewardsResponse.success) {
        const users = referredUsersResponse.data?.referred_users || [];
        const totalReferrals = referredUsersResponse.data?.pagination?.total_count || 0;
        const successfulReferrals = users.filter(user => user.first_trade_completed).length;
        const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;
        
        const rewardBoxes = referrerRewardsResponse.data?.available_boxes?.map(box => ({
          box_id: box.box_id,
          tier: box.tier,
          status: 'pending', // All available boxes are pending
          tokens: box.tokens,
          created_at: box.created_at
        })) || [];

        setDashboardData({
          referral_statistics: {
            total_referrals: totalReferrals,
            successful_referrals: successfulReferrals,
            conversion_rate: conversionRate,
            rewards_earned: referrerRewardsResponse.data?.box_statistics?.total_boxes || 0
          },
          reward_boxes: rewardBoxes
        });
      }

      // If all API calls failed, show error
      if (!referralStatusResponse.success && !referrerRewardsResponse.success && !referredUsersResponse.success) {
        toast.error('Failed to load referral data');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
      
      // Fallback to basic empty data if API fails completely
      setDashboardData({
        referral_statistics: {
          total_referrals: 0,
          successful_referrals: 0,
          conversion_rate: 0,
          rewards_earned: 0
        },
        reward_boxes: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success('🎉 Link copied! Share it to start earning rewards');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Seth Godin's "This is Marketing" principles applied:
  // 1. "People like us do things like this" - belonging signal
  // 2. Focus on transformation, not features  
  // 3. Create FOMO through exclusivity and community
  // 4. Short, punchy, benefit-driven messaging

  const shareOnX = () => {
    // X: Crypto-native audience, status-driven, character limits
    const text = `🏛️ I'm building the future of social media where communities = DAOs. Join me and we both get community tokens:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, '_blank');
  };

  const shareOnFarcaster = () => {
    // Farcaster: Crypto-native, community-focused, alpha seekers
    const farcasterText = `🎯 Found alpha: Social platform where every community is a DAO. We both get tokens when you join: ${referralLink}`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(farcasterText)}`;
    window.open(url, '_blank');
  };

  const shareOnWhatsApp = () => {
    // WhatsApp: Personal, friendly, benefit-focused
    const whatsappText = `Hey! 🚀 I'm on this new social platform where communities own themselves. Want to join me? We both get tokens: ${referralLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank');
  };

  const shareOnTelegram = () => {
    // Telegram: Crypto-savvy, direct benefits, community-focused
    const telegramText = `💎 Social media where YOU own your community. Join me on dapps.co → we both get community tokens: ${referralLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(telegramText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Own Your Community 🏛️',
          text: `I'm building the future of social media where communities = DAOs. Join me and we both get community tokens: ${referralLink}`,
          url: referralLink
        });
      } catch (error) {
        // User cancelled or error occurred, fallback to copy
        copyReferralLink();
      }
    } else {
      // Fallback to copy for desktop
      copyReferralLink();
    }
  };

  const handleClaimReward = (tier: string, boxId?: number) => {
    const params = new URLSearchParams();
    params.set('tier', tier);
    if (boxId) params.set('boxId', boxId.toString());
    
    navigate(`/claim-reward?${params.toString()}`);
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchReferredUsers = async (page: number = 1) => {
    setReferredUsersLoading(true);
    try {
      const response = await getReferredUsers(page, 10);
      if (response.success && response.data) {
        setReferredUsers(response.data.referred_users);
        setCurrentPage(response.data.pagination.current_page);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        toast.error('Failed to load referred users');
      }
    } catch (error) {
      console.error('Error fetching referred users:', error);
      toast.error('Failed to load referred users');
    } finally {
      setReferredUsersLoading(false);
    }
  };

  const handleShowReferredUsers = () => {
    setShowReferredUsersModal(true);
    fetchReferredUsers(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, repeatType: "reverse" }
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-500 rounded-full blur-xl"></div>
          <div className="absolute top-32 right-20 w-32 h-32 bg-purple-500 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-pink-500 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-4 py-12 relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mb-6 shadow-2xl"
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Invite & Earn
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Share the future of community-owned social media and earn 
              <span className="font-bold text-indigo-600 dark:text-indigo-400"> exclusive token rewards</span> together
            </p>

            {/* How It Works Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                onClick={scrollToHowItWorks}
                className="mb-8 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-950"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                How does it work?
                <ArrowDown className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Primary Share Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
              <CardContent className="p-4 sm:p-6 md:p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Magic Link</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Every friend who joins through your link unlocks rewards for both of you
                  </p>
                </div>
                
                <div className="space-y-6">
                  {/* Link Input */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      value={referralLink}
                      readOnly
                      className="font-mono text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 h-12 sm:h-14 text-center flex-1"
                    />
                    <Button
                      onClick={copyReferralLink}
                      size="lg"
                      className={cn(
                        "min-w-[120px] h-12 sm:h-14 font-semibold transition-all duration-300",
                        copiedLink 
                          ? "bg-green-500 hover:bg-green-600 text-white" 
                          : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                      )}
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Share Buttons */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <Button 
                      onClick={shareOnX} 
                      variant="outline" 
                      size="lg"
                      className="border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="hidden sm:inline">Share on </span>X
                    </Button>
                    <Button 
                      onClick={shareOnFarcaster}
                      variant="outline" 
                      size="lg"
                      className="border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900"
                    >
                      <SiFarcaster className="w-5 h-5 mr-2" />
                      Farcaster
                    </Button>
                    <Button 
                      onClick={shareOnWhatsApp}
                      variant="outline" 
                      size="lg"
                      className="border-2 border-green-200 hover:border-green-400 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900"
                    >
                      <FaWhatsapp className="w-5 h-5 mr-2" />
                      WhatsApp
                    </Button>
                    <Button 
                      onClick={shareOnTelegram}
                      variant="outline" 
                      size="lg"
                      className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900"
                    >
                      <FaTelegram className="w-5 h-5 mr-2" />
                      Telegram
                    </Button>
                    <Button 
                      onClick={handleNativeShare}
                      variant="outline" 
                      size="lg"
                      className="border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-900 lg:hidden"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Stats Preview */}
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <button
                        onClick={handleShowReferredUsers}
                        className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
                      >
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                          {dashboardData?.referral_statistics?.total_referrals || 0}
                        </div>
                        <div className="text-sm text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400">Total Invites</div>
                      </button>
                    </div>
                    <div className="text-center relative">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData?.referral_statistics?.successful_referrals || 0}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <span>Activated</span>
                        <button
                          onClick={() => setShowActivatedTooltip(!showActivatedTooltip)}
                          className="relative"
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          {showActivatedTooltip && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                              Users become "activated" when they complete their first trade after signing up through your invite link
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(() => {
                            // Use box_statistics from the API for accurate counts
                            const totalRewards = referrerData?.data?.box_statistics?.total_boxes || 0;
                            const claimedRewards = referrerData?.data?.box_statistics?.opened_boxes || 0;
                            return `${claimedRewards}/${totalRewards}`;
                          })()}
                        </div>
                        {(referrerData?.data?.box_statistics?.available_boxes || 0) > 0 && (
                          <Badge 
                            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            onClick={() => {
                              const firstAvailableBox = referrerData?.data?.available_boxes?.[0];
                              if (firstAvailableBox) {
                                handleClaimReward(firstAvailableBox.tier, firstAvailableBox.box_id);
                              }
                            }}
                          >
                            Claim
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Rewards</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-12"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Invite friends and earn rewards together! Get instant tokens when they join, plus bonus reward boxes when they start trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Share2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    1. Share Your Link
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Share your unique invite link with friends on social media, messaging apps, or anywhere online
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    2. Instant Rewards
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    When friends sign up, you <strong>both get 500 🦁</strong> tokens immediately
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    3. Bonus Rewards
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    As they complete their first trade, you <strong>both win reward boxes</strong> containing community token airdrops
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>


        </motion.div>
      </div>

      {/* Referred Users Modal */}
      {showReferredUsersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Your Referred Users
                </h2>
                <button
                  onClick={() => setShowReferredUsersModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {referredUsersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : referredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No referrals yet</h3>
                  <p className="text-gray-600 dark:text-gray-300">Share your referral link to start earning rewards!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.handle}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {user.handle.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">@{user.handle}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Joined {new Date(user.signup_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {user.first_trade_completed ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✅ Activated
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              ⏳ Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {user.total_trades} trades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => fetchReferredUsers(currentPage - 1)}
                    disabled={currentPage === 1 || referredUsersLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchReferredUsers(currentPage + 1)}
                    disabled={currentPage === totalPages || referredUsersLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReferralPage;