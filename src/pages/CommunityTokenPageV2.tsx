import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { useCommunityData } from '@/hooks/useCommunityData';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Loader2,
    TrendingUp,
    Users,
    DollarSign,
    Share2,
    Settings,
    ShieldCheck,
    ClipboardCopy,
    Info,
    BarChart3,
    MessageSquare,
    Rocket
} from 'lucide-react';
import { toast } from "sonner";
import { Helmet } from 'react-helmet-async';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// API Utilities
import {
    getCommunityNameFromTicker,
    getTokenStatus,
    getPriceChange,
    getRewardPool,
    getUserHoldings,
    getVolumeAnalysis,
    UserHoldingsResponse
} from '@/utils/communityTokensApi';
import { getWalletBalance } from '@/utils/communityApi';
import { toggleRoar } from '@/utils/api';

// Components
import CommunityPostsFeed from '@/components/community/CommunityPostsFeed';
import CreatePostCard from '@/components/feed/CreatePostCard';
import TradingInterface from '@/components/community-tokens/TradingInterface';
import { useCommunityPosts, CommunityPost } from '@/hooks/useCommunityPosts';
import { ShareDialog } from '@/components/community/ShareDialog';
import { EncryptedCommunityAccess } from '@/components/community/EncryptedCommunityAccess';
import TokenHoldersList from '@/components/community-tokens/TokenHoldersList';
import CommunityAdminPanel from '@/components/community/CommunityAdminPanel';
import CommunityTokenRewards from '@/components/community-tokens/CommunityTokenRewards';
import CommunityTokenAnalytics from '@/components/community-tokens/CommunityTokenAnalytics';

// Types
interface RealTokenData {
    symbol: string;
    name: string;
    givenName: string;
    currentPrice: number;
    currentPriceUsd: number;
    priceChange24h: number;
    marketCap: number;
    marketCapUsd: number;
    volume24h: number;
    holders: number;
    totalSupply: number;
    status: 'incubation' | 'graduated';
    timeLeft: number;
    timeRemaining: number;
    flatEtherCollection: number;
    rewardPool: {
        address: string;
        ethBalance: number;
        tokenBalance: number;
        ethBalanceUsd: number;
        tokenValueUsd: number;
        totalValueUsd: number;
    };
    userBalance: number;
    graduated: boolean;
    createdOn: string;
    admin: string;
    buyPressure: number;
    tokenAddress: string;
    hookAddress?: string;
    volumeAnalysis?: any;
}
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Incubation Card Component
const IncubationCard = ({
    tokenData,
    onInfoClick,
    onAnimationComplete
}: {
    tokenData: RealTokenData;
    onInfoClick: () => void;
    onAnimationComplete: () => void;
}) => {
    const [isGraduating, setIsGraduating] = useState(false);
    const timeLeft = tokenData.timeRemaining;
    const totalTime = 30 * 60; // 30 minutes in seconds
    const progress = Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100));

    // Trigger graduation animation when time hits 0
    useEffect(() => {
        if (timeLeft <= 0 && !isGraduating) {
            setIsGraduating(true);
            // Play animation for 3 seconds then complete
            const timer = setTimeout(() => {
                onAnimationComplete();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, isGraduating, onAnimationComplete]);

    // Urgency Logic
    let urgencyColor = "text-blue-500";
    let bgColor = "bg-blue-500/5";
    let borderColor = "border-blue-500/20";
    let barColor = "bg-blue-500";
    let pulse = false;

    if (isGraduating) {
        urgencyColor = "text-purple-500";
        bgColor = "bg-purple-500/10";
        borderColor = "border-purple-500/30";
        barColor = "bg-purple-500";
        pulse = true;
    } else if (timeLeft < 600) { // Less than 10 minutes
        urgencyColor = "text-red-500";
        bgColor = "bg-red-500/10";
        borderColor = "border-red-500/30";
        barColor = "bg-red-500";
        pulse = true;
    } else if (timeLeft < 1200) { // Less than 20 minutes
        urgencyColor = "text-orange-500";
        bgColor = "bg-orange-500/10";
        borderColor = "border-orange-500/30";
        barColor = "bg-orange-500";
    }

    return (
        <Card className={`${borderColor} ${bgColor} transition-all duration-500 ${isGraduating ? 'scale-105 shadow-lg' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className={`flex items-center gap-2 ${urgencyColor} text-base`}>
                        {isGraduating ? (
                            <Rocket className="w-5 h-5 animate-bounce" />
                        ) : (
                            <ShieldCheck className={`w-5 h-5 ${pulse ? 'animate-pulse' : ''}`} />
                        )}
                        {isGraduating ? "Graduating..." : "Incubation Period"}
                        {!isGraduating && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -ml-1 hover:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onInfoClick();
                                }}
                            >
                                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                            </Button>
                        )}
                    </CardTitle>
                    {pulse && !isGraduating && (
                        <span className="text-xs font-bold text-red-500 animate-pulse px-2 py-0.5 rounded-full bg-red-500/10 border border-500/20">
                            ENDING SOON
                        </span>
                    )}
                </div>
                <CardDescription className="text-xs">
                    {isGraduating ? "Launching on Uniswap v4!" : "Community is in incubation phase"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={`font-medium ${urgencyColor}`}>
                            {isGraduating ? "100%" : `${progress.toFixed(1)}%`}
                        </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full ${barColor} transition-all duration-1000 ${pulse ? 'animate-pulse' : ''}`}
                            style={{ width: `${isGraduating ? 100 : progress}%` }}
                        />
                    </div>
                    <p className={`text-xs text-center font-medium ${urgencyColor}`}>
                        {isGraduating ? "Graduation in progress..." : `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s remaining`}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

const CommunityTokenPageV2 = () => {
    usePreventZoom();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    // State
    const [tokenData, setTokenData] = useState<RealTokenData | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [communityName, setCommunityName] = useState<string>('');
    const [userEthBalance, setUserEthBalance] = useState("0.000");
    const [localPosts, setLocalPosts] = useState<Partial<CommunityPost>[]>([]);
    const [activeTab, setActiveTab] = useState("feed");

    // Modals State
    const [tradingModal, setTradingModal] = useState<{
        isOpen: boolean;
        token: any;
        mode: 'buy' | 'sell';
    }>({ isOpen: false, token: null, mode: 'buy' });

    const [showHoldersDialog, setShowHoldersDialog] = useState(false);
    const [showAdminDialog, setShowAdminDialog] = useState(false);
    const [showRewardsDialog, setShowRewardsDialog] = useState(false);
    const [showDetailsSheet, setShowDetailsSheet] = useState(false);
    const [showIncubationSheet, setShowIncubationSheet] = useState(false);
    const [hideIncubationCard, setHideIncubationCard] = useState(false);

    const isLoggedIn = !!localStorage.getItem('dapps_user_id');
    const currentUserHandle = localStorage.getItem('dapps_user_handle');

    // Fetch Data
    const { data: communityData, loading: communityLoading, isEncryptedAccess: communityEncryptedAccess, refetch: refetchCommunity } = useCommunityData(communityName || undefined);
    const { posts, loading: postsLoading, hasMore: hasMorePosts, loadingElementRef, fetchPosts, isEncryptedAccess: postsEncryptedAccess } = useCommunityPosts(id || undefined);

    const fetchTokenData = useCallback(async (ticker: string) => {
        if (!ticker) return;
        setTokenLoading(true);
        try {
            const [
                nameResponse,
                statusResponse,
                priceChangeResponse,
                rewardPoolResponse,
                holdingsResponse,
                volumeAnalysisResponse
            ] = await Promise.all([
                getCommunityNameFromTicker(ticker),
                getTokenStatus(ticker),
                getPriceChange(ticker),
                getRewardPool(ticker),
                isLoggedIn ? getUserHoldings({ search: ticker }) : Promise.resolve({ success: false } as UserHoldingsResponse),
                getVolumeAnalysis(ticker, '24h')
            ]);

            if (nameResponse.success && nameResponse.data) {
                setCommunityName(nameResponse.data.name);
            }

            if (!statusResponse.success || !statusResponse.data) {
                throw new Error('Failed to fetch token status');
            }

            const tokenStatus = statusResponse.data;

            // Calculate Price Change
            let priceChange24h = 0;
            if (priceChangeResponse.success && priceChangeResponse.data?.price_changes?.['24h']) {
                const change = priceChangeResponse.data.price_changes['24h'];
                priceChange24h = Math.abs(change.change_percent_usd || 0) > Math.abs(change.change_percent_eth || 0)
                    ? change.change_percent_usd || 0
                    : change.change_percent_eth || 0;
            }

            // Reward Pool
            let rewardPoolData = {
                address: '',
                ethBalance: 0,
                tokenBalance: 0,
                ethBalanceUsd: 0,
                tokenValueUsd: 0,
                totalValueUsd: 0,
            };
            if (rewardPoolResponse.success && rewardPoolResponse.data) {
                const pool = rewardPoolResponse.data.rewardPool;
                rewardPoolData = {
                    address: pool.address,
                    ethBalance: Number(pool.ethBalance) || 0,
                    tokenBalance: Number(pool.tokenBalance) || 0,
                    ethBalanceUsd: Number(pool.ethBalanceUsd) || 0,
                    tokenValueUsd: Number(pool.tokenValueUsd) || 0,
                    totalValueUsd: Number(pool.totalValueUsd) || 0,
                };
            }

            // User Balance
            let userBalance = 0;
            if (isLoggedIn && holdingsResponse.success && holdingsResponse.data?.holdings) {
                const holding = holdingsResponse.data.holdings.find(h => h.ticker === ticker);
                userBalance = holding?.balance || 0;
            }

            // Calculate Time Remaining (Frontend Logic)
            const incubationDuration = 30 * 60 * 1000; // 30 minutes in ms
            const createdTime = new Date(tokenStatus.createdOn).getTime();
            const endTime = createdTime + incubationDuration;
            const now = Date.now();
            const calculatedTimeRemaining = Math.max(0, Math.floor((endTime - now) / 1000)); // in seconds

            setTokenData({
                symbol: tokenStatus.ticker,
                name: nameResponse.data?.name || tokenStatus.name,
                givenName: nameResponse.data?.givenName || tokenStatus.name,
                currentPrice: Number(tokenStatus.currentRate) || 0,
                currentPriceUsd: Number(tokenStatus.currentPriceUsd) || 0,
                priceChange24h,
                marketCap: Number(tokenStatus.marketCap) || 0,
                marketCapUsd: Number(tokenStatus.marketCap) || 0,
                volume24h: Number(tokenStatus.volume24h) || 0,
                holders: Number(tokenStatus.holders) || 0,
                totalSupply: tokenStatus.totalSupply,
                status: tokenStatus.graduated ? 'graduated' : 'incubation',
                timeLeft: calculatedTimeRemaining,
                timeRemaining: calculatedTimeRemaining,
                flatEtherCollection: tokenStatus.flatEtherCollection,
                rewardPool: rewardPoolData,
                userBalance,
                graduated: tokenStatus.graduated,
                createdOn: tokenStatus.createdOn,
                admin: tokenStatus.communityAdmin || '',
                buyPressure: volumeAnalysisResponse.data?.buy_percentage || 50,
                tokenAddress: tokenStatus.tokenAddress || '',
                hookAddress: tokenStatus.hookAddress,
                volumeAnalysis: volumeAnalysisResponse.data
            });

        } catch (error) {
            console.error('Error fetching token data:', error);
            setTokenError('Failed to load community data');
        } finally {
            setTokenLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        console.log('CommunityTokenPageV2: id changed', id);
        if (id) {
            fetchTokenData(id);
        } else {
            console.log('CommunityTokenPageV2: No id, setting loading false');
            setTokenLoading(false);
        }
    }, [id, fetchTokenData]);

    console.log('CommunityTokenPageV2: render', { tokenLoading, tokenData: !!tokenData, communityName });

    // Countdown Timer
    useEffect(() => {
        if (!tokenData || tokenData.status !== 'incubation' || tokenData.timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTokenData(prev => {
                if (!prev) return null;
                const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
                return {
                    ...prev,
                    timeRemaining: newTimeRemaining,
                    timeLeft: newTimeRemaining
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [tokenData?.status, tokenData?.timeRemaining]);

    // Fetch ETH Balance
    useEffect(() => {
        if (isLoggedIn) {
            getWalletBalance().then(data => setUserEthBalance(data.balance.eth));
        }
    }, [isLoggedIn]);

    // Combine Posts - Fixed Deduplication
    const allPosts = useMemo(() => {
        const combined = [...localPosts, ...posts];
        return combined.filter((post, index, self) => {
            const postId = post.code || (post as any).id;
            return index === self.findIndex((p) => (p.code || (p as any).id) === postId);
        }).sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime());
    }, [localPosts, posts]);

    // Handlers
    const handleRoar = useCallback(async (postId: string) => {
        if (!isLoggedIn) {
            toast.error("Please log in to roar posts");
            return;
        }

        try {
            const result = await toggleRoar(postId);
            if (result.success) {
                setLocalPosts(prevPosts =>
                    prevPosts.map(post => {
                        const currentId = post.code || (post as any).id;
                        return currentId === postId
                            ? {
                                ...post,
                                user_has_roared: (result as any).user_has_roared,
                                roar_count: (result as any).roar_count
                            }
                            : post;
                    })
                );
            }
        } catch (error) {
            console.error('Error toggling roar:', error);
            toast.error("Failed to roar post");
        }
    }, [isLoggedIn]);

    const handlePostUpdated = useCallback((postCode: string, newPinnedStatus: boolean) => {
        // For now, we just update the local state to reflect the change if needed
        // But since CommunityPostsFeed mainly uses this for pinning, we can just refetch or update local state
        setLocalPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.code === postCode) {
                    return { ...post, pinned: newPinnedStatus ? 1 : 0 };
                }
                return post;
            })
        );
    }, []);

    const handleTrade = (action: 'buy' | 'sell') => {
        if (!tokenData) return;
        setTradingModal({
            isOpen: true,
            token: {
                id: parseInt(id || '0'),
                name: tokenData.givenName,
                ticker: tokenData.symbol,
                description: `${tokenData.givenName} community token`,
                avatar: tokenData.symbol.charAt(0),
                status: tokenData.status,
                graduated: tokenData.graduated,
                price: tokenData.currentPriceUsd,
                marketCap: tokenData.marketCapUsd,
                holders: tokenData.holders,
                volume24h: tokenData.volume24h,
                priceChange24h: tokenData.priceChange24h,
                rewardPool: tokenData.rewardPool.totalValueUsd,
                timeLeft: tokenData.timeLeft,
                totalSupply: tokenData.totalSupply,
                userHoldings: tokenData.userBalance,
            },
            mode: action
        });
    };

    // Encrypted Access Check
    if (communityEncryptedAccess || postsEncryptedAccess) {
        return (
            <EncryptedCommunityAccess
                communityName={tokenData?.givenName || communityName || 'Community'}
                onJoinClick={() => handleTrade('buy')}
            />
        );
    }

    if (tokenLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tokenData) return <div>Community not found</div>;

    const isAdmin = currentUserHandle && tokenData.admin && currentUserHandle === tokenData.admin;
    const SidebarContent = () => (
        <div className="space-y-6">
            {/* Market Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Market Stats
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Market Cap</span>
                        <span className="font-medium">${(tokenData.marketCapUsd / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Volume (24h)</span>
                        <span className="font-medium">${tokenData.volume24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Holders</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {tokenData.holders}
                            </span>
                            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setShowHoldersDialog(true)}>
                                View
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Incubation Progress */}
            {tokenData.status === 'incubation' && !hideIncubationCard && (
                <IncubationCard
                    tokenData={tokenData}
                    onInfoClick={() => setShowIncubationSheet(true)}
                    onAnimationComplete={() => setHideIncubationCard(true)}
                />
            )}

            {/* Reward Pool */}
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <DollarSign className="w-5 h-5" />
                        Community Treasury
                    </CardTitle>
                    <CardDescription>Funds owned by the community</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">
                        ${tokenData.rewardPool.totalValueUsd.toFixed(2)}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                            Generated from trading fees
                        </p>
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setShowRewardsDialog(true)}>
                            Details
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* About */}
            <Card>
                <CardHeader>
                    <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {communityData?.community?.description || `Welcome to the ${tokenData.givenName} community!`}
                    </p>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Created {new Date(tokenData.createdOn).toLocaleDateString()}</span>
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setShowDetailsSheet(true)}>
                            Full Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            <Helmet>
                <title>{tokenData.givenName} (${tokenData.symbol})</title>
            </Helmet>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-b from-primary/10 to-background pt-8 pb-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                            <AvatarImage src={communityData?.community?.image} />
                            <AvatarFallback className="text-2xl">{tokenData.symbol[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-2">
                                {tokenData.givenName}
                                <span className="text-muted-foreground text-xl font-normal">${tokenData.symbol}</span>
                            </h1>

                            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                                <div className="text-2xl font-bold">
                                    ${tokenData.currentPriceUsd.toFixed(6)}
                                </div>
                                <div className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${tokenData.priceChange24h >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {tokenData.priceChange24h >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
                                    {Math.abs(tokenData.priceChange24h).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            {/* Desktop Actions */}
                            <div className="hidden md:flex gap-3">
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-white px-8"
                                    onClick={() => handleTrade('buy')}
                                >
                                    Buy
                                </Button>
                                <Button
                                    className="bg-red-500 hover:bg-red-600 text-white px-8"
                                    onClick={() => handleTrade('sell')}
                                >
                                    Sell
                                </Button>
                            </div>

                            <div className="flex justify-center md:justify-end gap-2">
                                {/* Mobile Community Info Sheet */}
                                {isMobile && (
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Info className="w-4 h-4" />
                                                Info
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                                            <SheetHeader className="mb-4">
                                                <SheetTitle>{tokenData.givenName} Stats</SheetTitle>
                                            </SheetHeader>
                                            <SidebarContent />
                                        </SheetContent>
                                    </Sheet>
                                )}

                                <ShareDialog
                                    postTitle={`Check out ${tokenData.givenName}`}
                                    communityName={tokenData.givenName}
                                >
                                    <Button variant="ghost" size="icon">
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </ShareDialog>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setActiveTab('feed');
                                        const feedElement = document.getElementById('feed-content');
                                        if (feedElement) {
                                            feedElement.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </Button>

                                {isAdmin && (
                                    <Button variant="ghost" size="icon" onClick={() => setShowAdminDialog(true)}>
                                        <Settings className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Mobile/Tablet Incubation Progress (Visible above tabs) */}
                        <div className="lg:hidden">
                            {tokenData.status === 'incubation' && !hideIncubationCard && (
                                <IncubationCard
                                    tokenData={tokenData}
                                    onInfoClick={() => setShowIncubationSheet(true)}
                                    onAnimationComplete={() => setHideIncubationCard(true)}
                                />
                            )}
                        </div>

                        {/* Incubation Info Sheet */}
                        <Sheet open={showIncubationSheet} onOpenChange={setShowIncubationSheet}>
                            <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[50vh]" : "w-[400px] sm:w-[540px]"}>
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2 text-blue-500">
                                        <ShieldCheck className="w-5 h-5" />
                                        Incubation Period
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="mt-6 space-y-6">
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 text-blue-500">What is Incubation?</h3>
                                        <p className="text-sm text-muted-foreground">
                                            During the 30-minute incubation period, tokens are traded at a flat rate. This ensures a fair launch where everyone gets the same price.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Key Mechanics</h3>
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            <li className="flex gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                                <span>
                                                    <strong className="text-foreground">Flat Rate Trading:</strong> Price remains constant during incubation.
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                                <span>
                                                    <strong className="text-foreground">Graduation:</strong> Occurs after 30 minutes OR when 1 ETH is raised.
                                                </span>
                                            </li>
                                            <li className="flex gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                                                <span>
                                                    <strong className="text-foreground">After Graduation:</strong> The token graduates to a bonding curve and trades on <strong className="text-foreground">Uniswap v4</strong> with dynamic pricing based on supply and demand.
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="feed" className="gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Feed
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Analytics
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="feed" className="space-y-6 mt-0" id="feed-content">
                                {isLoggedIn && (
                                    <CreatePostCard
                                        onPostCreated={(newPost) => setLocalPosts(prev => [newPost, ...prev])}
                                        communityName={tokenData.symbol}
                                    />
                                )}

                                <div className="space-y-4">
                                    <CommunityPostsFeed
                                        posts={allPosts}
                                        loading={postsLoading}
                                        hasMore={hasMorePosts}
                                        loadingElementRef={loadingElementRef}
                                        isLoggedIn={isLoggedIn}
                                        isAdmin={isAdmin}
                                        handleRoar={handleRoar}
                                        onPostUpdated={handlePostUpdated}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="analytics" className="mt-0">
                                <CommunityTokenAnalytics
                                    tokenData={{
                                        symbol: tokenData.symbol,
                                        name: tokenData.givenName,
                                        currentPrice: tokenData.currentPriceUsd,
                                        priceChange24h: tokenData.priceChange24h,
                                        marketCap: tokenData.marketCapUsd,
                                        volume24h: tokenData.volume24h,
                                        holders: tokenData.holders,
                                        status: tokenData.status,
                                        timeLeft: tokenData.timeLeft,
                                        totalSupply: tokenData.totalSupply,
                                        circulatingSupply: tokenData.totalSupply,
                                        buyPressure: tokenData.buyPressure,
                                        tokenAddress: tokenData.tokenAddress,
                                        volumeAnalysis: tokenData.volumeAnalysis,
                                        recentTrades: [], // Will be populated by the component
                                        priceHistory: [], // Will be populated by the component
                                    }}
                                    community={{
                                        id: tokenData.symbol,
                                        name: tokenData.givenName,
                                        image: communityData?.community?.image,
                                    }}
                                    onTrade={handleTrade}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block">
                        <SidebarContent />
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 flex gap-3 pb-safe">
                    <Button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold h-12 text-lg shadow-lg"
                        onClick={() => handleTrade('buy')}
                    >
                        Buy
                    </Button>
                    <Button
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold h-12 text-lg shadow-lg"
                        onClick={() => handleTrade('sell')}
                    >
                        Sell
                    </Button>
                </div>
            )}

            {/* Dialogs */}
            <TradingInterface
                isOpen={tradingModal.isOpen}
                onClose={() => setTradingModal({ isOpen: false, token: null, mode: 'buy' })}
                token={tradingModal.token}
                mode={tradingModal.mode}
                userEthBalance={userEthBalance}
                onTradeComplete={() => {
                    if (id) fetchTokenData(id);
                }}
            />

            <Dialog open={showHoldersDialog} onOpenChange={setShowHoldersDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Token Holders</DialogTitle>
                    </DialogHeader>
                    <TokenHoldersList
                        ticker={tokenData.symbol}
                        tokenSymbol={tokenData.symbol}
                    />
                </DialogContent>
            </Dialog>

            {/* Treasury Sheet (Improved UX) */}
            <Sheet open={showRewardsDialog} onOpenChange={setShowRewardsDialog}>
                <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : "w-[400px] sm:w-[540px]"}>
                    <SheetHeader>
                        <SheetTitle>Community Treasury & Rewards</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 overflow-y-auto h-full pb-20">
                        <CommunityTokenRewards
                            tokenData={{
                                symbol: tokenData.symbol,
                                rewardPool: {
                                    address: tokenData.rewardPool.address,
                                    ethBalance: tokenData.rewardPool.ethBalance,
                                    tokenBalance: tokenData.rewardPool.tokenBalance,
                                    usdValue: tokenData.rewardPool.totalValueUsd,
                                    isLocked: true,
                                    unlockDate: new Date(new Date(tokenData.createdOn).getTime() + 2 * 24 * 60 * 60 * 1000)
                                }
                            }}
                            community={{
                                id: tokenData.symbol,
                                name: tokenData.givenName
                            }}
                            onUtilize={() => {
                                toast.info(`Reward pool contains $${Number(tokenData.rewardPool.totalValueUsd || 0).toFixed(2)}`);
                            }}
                            ethToUsd={3000}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Full Details Sheet */}
            <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
                <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh]" : "w-[400px] sm:w-[540px]"}>
                    <SheetHeader>
                        <SheetTitle>About {tokenData.givenName}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6 overflow-y-auto h-full pb-20">
                        {communityData?.community?.details?.banner && (
                            <div className="rounded-lg overflow-hidden">
                                <img src={communityData.community.details.banner} alt="Banner" className="w-full h-auto object-cover" />
                            </div>
                        )}

                        <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {communityData?.community?.description || "No description available."}
                            </p>
                        </div>

                        {communityData?.community?.details?.rules && (
                            <div>
                                <h3 className="font-semibold mb-2">Community Rules</h3>
                                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
                                    {communityData.community.details.rules}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-card border rounded-lg p-3">
                                <span className="text-xs text-muted-foreground block">Created</span>
                                <span className="font-medium">{new Date(tokenData.createdOn).toLocaleDateString()}</span>
                            </div>
                            <div className="bg-card border rounded-lg p-3">
                                <span className="text-xs text-muted-foreground block">Admin</span>
                                <span className="font-medium truncate block">@{tokenData.admin || 'None'}</span>
                            </div>
                            <div className="bg-card border rounded-lg p-3 col-span-2">
                                <span className="text-xs text-muted-foreground block">Token Address</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate font-mono">
                                        {tokenData.tokenAddress}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => {
                                            navigator.clipboard.writeText(tokenData.tokenAddress);
                                            toast.success("Address copied");
                                        }}
                                    >
                                        <ClipboardCopy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-card border rounded-lg p-3">
                                <span className="text-xs text-muted-foreground block">Total Supply</span>
                                <span className="font-medium">1,000,000,000</span>
                            </div>
                            <div className="bg-card border rounded-lg p-3">
                                <span className="text-xs text-muted-foreground block">Circulating</span>
                                <span className="font-medium">1,000,000,000</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Fee Structure</h3>
                            <div className="bg-card border rounded-lg divide-y">
                                <div className="p-3 flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Community Admin Fee</span>
                                    <span className="font-medium">0.25%</span>
                                </div>
                                <div className="p-3 flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Reward Pool Fee</span>
                                    <span className="font-medium">0.5%</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Requirements</h3>
                            <div className="bg-card border rounded-lg divide-y">
                                <div className="p-3 flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Min to Post</span>
                                    <span className="font-medium">1 {tokenData.symbol}</span>
                                </div>
                                <div className="p-3 flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Min to Comment</span>
                                    <span className="font-medium">1 {tokenData.symbol}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {isAdmin && communityData?.community && (
                <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Community Admin</DialogTitle>
                        </DialogHeader>
                        <CommunityAdminPanel
                            communityName={tokenData.symbol}
                            initialData={{
                                image: communityData.community.image || '',
                                banner: communityData.community.details.banner || '',
                                rules: communityData.community.details.rules || '',
                                min_share_posting: communityData.community.details.min_share_posting || 0.001,
                                min_share_commenting: communityData.community.details.min_share_commenting || 0.001,
                                min_share_reward: communityData.community.details.min_share_reward || 1,
                            }}
                            refetchCommunityData={refetchCommunity}
                            ethToUsd={3000}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

// Helper for icon
const TrendingDownIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

export default CommunityTokenPageV2;
