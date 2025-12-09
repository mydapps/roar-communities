import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Zap, 
  Flame, 
  Target, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Trophy,
  Timer,
  DollarSign,
  Activity,
  Search,
  Filter,
  SortDesc,
  Rocket,
  Star,
  TrendingUpIcon,
  Wallet,
  Plus,
  Minus,
  ChevronDown,
  RefreshCw,
  Loader2,
  HelpCircle,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TradingInterface from '@/components/community-tokens/TradingInterface';
import { Input } from '@/components/ui/input';
import CountdownTimer from '@/components/community-tokens/CountdownTimer';
import CommunityTokensExplainer from '@/components/community-tokens/CommunityTokensExplainer';
import confetti from 'canvas-confetti';
import { 
  getTokensList, 
  getAllRecentTrades, 
  getTopGainers,
  getGraduationTokensList,
  getRewardPool,
  TokensListResponse,
  RecentTradesResponse,
  TopGainersResponse,
  GraduationTokensResponse,
  RewardPoolResponse,
  TokensListItem,
  RecentTrade,
  TopGainer,
  GraduationTokenItem,
  getPlatformStats,
  PlatformStatsResponse,
  getIncubationTokens,
  IncubationToken,
  IncubationTokensResponse,
  getTrendingTokens,
  TrendingToken,
  TrendingTokensResponse,
  getEnhancedTokensList,
  SortByOption,
  EnhancedListResponse,
  getPriceChange,
  PriceChangeResponse
} from '@/utils/communityTokensApi';
import { getWalletBalance } from '@/utils/communityApi';
import { toast } from 'sonner';

// Generate extensive mock data for community tokens
const generateMockTokens = () => {
  const categories = ['Tech', 'Finance', 'Gaming', 'Art', 'Lifestyle', 'Education', 'Music', 'Sports', 'Food', 'Travel'];
  const avatars = ['🤖', '💎', '💪', '🎨', '🎮', '📚', '🎵', '⚽', '🍕', '✈️', '🚀', '🔥', '⭐', '🌟', '💫', '🎯', '🏆', '💰', '🎪', '🎭'];
  const names = [
    'AI Builders', 'Crypto Degens', 'Fitness Warriors', 'Art Collectors', 'Gaming Legends',
    'Code Masters', 'DeFi Pioneers', 'NFT Creators', 'Startup Founders', 'Music Producers',
    'Sports Fanatics', 'Food Lovers', 'Travel Nomads', 'Book Readers', 'Movie Critics',
    'Photography Club', 'Dance Community', 'Yoga Masters', 'Crypto Traders', 'Web3 Builders'
  ];
  
  const tokens = [];
  
  for (let i = 1; i <= 100; i++) {
    const isIncubation = Math.random() < 0.3;
    const isHot = Math.random() < 0.2;
    const isNew = Math.random() < 0.15;
    const hasUserHoldings = Math.random() < 0.3;
    
    tokens.push({
      id: i,
      name: names[Math.floor(Math.random() * names.length)] + (i > 20 ? ` ${i}` : ''),
      symbol: `TKN${i.toString().padStart(2, '0')}`,
      description: `Community ${i} - Building the future together with innovation and passion`,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      status: isIncubation ? 'incubation' : 'graduated',
      price: parseFloat((Math.random() * 0.0001 + 0.000005).toFixed(8)),
      marketCap: parseFloat((Math.random() * 10 + 0.1).toFixed(2)),
      holders: Math.floor(Math.random() * 1000 + 10),
      volume24h: parseFloat((Math.random() * 5).toFixed(2)),
      priceChange24h: parseFloat(((Math.random() - 0.5) * 200).toFixed(1)),
      rewardPool: parseFloat((Math.random() * 1).toFixed(3)),
      adminFees: parseFloat((Math.random() * 0.5).toFixed(3)),
      timeLeft: isIncubation ? Math.floor(Math.random() * 3600000) : 0,
      tokensRemaining: isIncubation ? Math.floor(Math.random() * 90000000 + 10000000) : 0,
      totalSupply: 100000000,
      createdBy: `creator_${i}`,
      trades: Math.floor(Math.random() * 500 + 10),
      isHot,
      isNew,
      category: categories[Math.floor(Math.random() * categories.length)],
      userHoldings: hasUserHoldings ? Math.floor(Math.random() * 1000000 + 1000) : undefined
    });
  }
  
  return tokens;
};

// Mock tokens removed - using real API data only

// Stable key generator for React keys (no counter to prevent re-renders)
const generateStableKey = (prefix: string, ...identifiers: (string | number | undefined)[]): string => {
  return `${prefix}-${identifiers.filter(id => id !== undefined).join('-')}`;
};

// Mock recent trades for social proof
const mockTrades = [
  { user: "alice_crypto", action: "bought", amount: "2.5M", token: "AIBLD", value: "0.025 ETH", time: "2s ago", profit: "+$45" },
  { user: "bob_degen", action: "sold", amount: "1.2M", token: "DEGEN", value: "0.030 ETH", time: "5s ago", profit: "+$23" },
  { user: "charlie_fit", action: "bought", amount: "5M", token: "FIT", value: "0.050 ETH", time: "8s ago", profit: null },
  { user: "diana_art", action: "bought", amount: "800K", token: "ART", value: "0.014 ETH", time: "12s ago", profit: "+$67" },
  { user: "eve_gamer", action: "bought", amount: "10M", token: "GAME", value: "0.100 ETH", time: "15s ago", profit: null },
  { user: "frank_ai", action: "sold", amount: "3M", token: "AIBLD", value: "0.030 ETH", time: "18s ago", profit: "+$89" },
];

const CommunityTokensPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [lastTradeHash, setLastTradeHash] = useState<string | null>(null);
  const [hasNewTrades, setHasNewTrades] = useState(false);
  const [topGainers, setTopGainers] = useState<TopGainer[]>([]);
  const [lastMinuteRush, setLastMinuteRush] = useState<GraduationTokenItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedTokens, setDisplayedTokens] = useState<TokensListItem[]>([]);
  const [realTokens, setRealTokens] = useState<TokensListItem[]>([]);
  const [isLoadingRealTokens, setIsLoadingRealTokens] = useState(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [isLoadingGainers, setIsLoadingGainers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tradingModal, setTradingModal] = useState<{
    isOpen: boolean;
    token: any;
    mode: 'buy' | 'sell';
  }>({
    isOpen: false,
    token: null,
    mode: 'buy'
  });
  const [celebrationMode, setCelebrationMode] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState("0.000");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [rewardPools, setRewardPools] = useState<Record<string, { ethValue: number; tokenValue: number; totalUsd: number }>>({});
  
  // New state for API endpoints
  const [platformStats, setPlatformStats] = useState<PlatformStatsResponse['data'] | null>(null);
  const [incubationTokens, setIncubationTokens] = useState<IncubationToken[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [sortBy, setSortBy] = useState<SortByOption>('holders');
  const [isLoadingPlatformStats, setIsLoadingPlatformStats] = useState(false);
  const [isLoadingIncubation, setIsLoadingIncubation] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [detailedPriceChanges, setDetailedPriceChanges] = useState<Record<string, any>>({});
  const [searchResults, setSearchResults] = useState<TokensListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const observerRef = useRef<HTMLDivElement>(null);

  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals: number = 2): string => {
    // Convert to number first
    const numValue = Number(value);
    
    // Check if conversion resulted in a valid number
    if (value === undefined || value === null || isNaN(numValue) || !isFinite(numValue)) {
      return '0.' + '0'.repeat(decimals);
    }
    
    return numValue.toFixed(decimals);
  };

  // Fetch real community tokens using enhanced API with sorting
  const fetchRealTokens = useCallback(async () => {
    setIsLoadingRealTokens(true);
    try {
      const response = await getEnhancedTokensList({
        page: 1,
        limit: 50,
        sortBy: sortBy
      });
      
      if (response.success && response.data) {
        // Convert GraduationTokenItem to TokensListItem format
        const convertedTokens = response.data.tokens.map(token => ({
          id: token.id,
          ticker: token.ticker,
          name: token.name,
          image: token.image,
          description: token.description,
          graduated: token.graduated,
          holders: token.holders,
          flatEtherCollection: token.flatEtherCollection || token.flat_ether_sale_collection,
          currentRate: parseFloat(token.currentRate) || token.current_rate_eth,
          currentRateUsd: parseFloat(token.currentRateUsd) || token.current_rate_usd,
          marketCap: parseFloat(token.marketCap) || token.market_cap_eth,
          marketCapUsd: parseFloat(token.marketCapUsd) || token.market_cap_usd,
          volume24h: parseFloat(token.volume24h) || token.volume_24h || 0,
          createdOn: token.createdOn || token.created_on
        }));
        
        console.log('DEBUG: Fetched tokens with sortBy:', sortBy, 'Count:', convertedTokens.length);
        setRealTokens(convertedTokens);
        setDisplayedTokens(convertedTokens);
        
        // Fetch reward pools and price changes for the loaded tokens
        fetchRewardPools(convertedTokens);
        fetchDetailedPriceChanges(convertedTokens);
      } else {
        console.error('Failed to fetch real tokens:', response.error);
        toast.error('Failed to load community tokens');
      }
    } catch (error) {
      console.error('Error fetching real tokens:', error);
      toast.error('Failed to load community tokens');
    } finally {
      setIsLoadingRealTokens(false);
    }
  }, [sortBy]);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const balanceData = await getWalletBalance();
      setUserEthBalance(balanceData.balance.eth);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      // Don't show toast error as it might be due to authentication
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Fetch platform stats
  const fetchPlatformStats = useCallback(async () => {
    try {
      setIsLoadingPlatformStats(true);
      const response = await getPlatformStats();
      if (response.success && response.data) {
        setPlatformStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    } finally {
      setIsLoadingPlatformStats(false);
    }
  }, []);

  // Fetch incubation tokens (Last Chance)
  const fetchIncubationTokens = useCallback(async () => {
    try {
      setIsLoadingIncubation(true);
      const response = await getIncubationTokens({ limit: 5 });
      if (response.success && response.data) {
        setIncubationTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Failed to fetch incubation tokens:', error);
    } finally {
      setIsLoadingIncubation(false);
    }
  }, []);

  // Fetch trending tokens
  const fetchTrendingTokens = useCallback(async () => {
    try {
      setIsLoadingTrending(true);
      const response = await getTrendingTokens({ limit: 20, timeframe: '24h' });
      if (response.success && response.data) {
        setTrendingTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  // Fetch tokens with sorting (called when dropdown changes)
  const fetchSortedTokens = useCallback(async (sortOption: SortByOption) => {
    try {
      setIsLoadingRealTokens(true);
      // Clear existing data immediately to avoid showing stale data with loader
      setRealTokens([]);
      setDisplayedTokens([]);
      
      console.log('DEBUG: Fetching tokens with new sortBy:', sortOption);
      
      const response = await getEnhancedTokensList({
        page: 1,
        limit: 50,
        sortBy: sortOption
      });
      
      if (response.success && response.data) {
        // Convert GraduationTokenItem to TokensListItem format
        const convertedTokens = response.data.tokens.map(token => ({
          id: token.id,
          ticker: token.ticker,
          name: token.name,
          image: token.image,
          description: token.description,
          graduated: token.graduated,
          holders: token.holders,
          flatEtherCollection: token.flatEtherCollection || token.flat_ether_sale_collection,
          currentRate: parseFloat(token.currentRate) || token.current_rate_eth,
          currentRateUsd: parseFloat(token.currentRateUsd) || token.current_rate_usd,
          marketCap: parseFloat(token.marketCap) || token.market_cap_eth,
          marketCapUsd: parseFloat(token.marketCapUsd) || token.market_cap_usd,
          volume24h: parseFloat(token.volume24h) || token.volume_24h || 0,
          createdOn: token.createdOn || token.created_on
        }));
        
        console.log('DEBUG: Successfully loaded', convertedTokens.length, 'tokens with sortBy:', sortOption);
        setRealTokens(convertedTokens);
        setDisplayedTokens(convertedTokens);
        
        // Fetch additional data for the loaded tokens
        fetchRewardPools(convertedTokens);
        fetchDetailedPriceChanges(convertedTokens);
      } else {
        console.error('Failed to fetch sorted tokens:', response.error);
        toast.error(`Failed to load tokens sorted by ${sortOption}`);
      }
    } catch (error) {
      console.error('Failed to fetch sorted tokens:', error);
      toast.error(`Failed to load tokens sorted by ${sortOption}`);
    } finally {
      setIsLoadingRealTokens(false);
    }
  }, []);

  // Fetch detailed price changes for tokens
  const fetchDetailedPriceChanges = useCallback(async (tokens: any[]) => {
    try {
      const priceChangePromises = tokens.map(async (token) => {
        try {
          const response = await getPriceChange(token.ticker);
          
          if (response.success && response.data) {
            return { ticker: token.ticker, data: response.data };
          }
          return { ticker: token.ticker, data: null };
        } catch (error) {
          console.error(`Failed to fetch price change for ${token.ticker}:`, error);
          return { ticker: token.ticker, data: null };
        }
      });

      const results = await Promise.all(priceChangePromises);
      const priceChangeMap: Record<string, any> = {};
      
      results.forEach(({ ticker, data }) => {
        if (data) {
          priceChangeMap[ticker] = data;
        }
      });

      setDetailedPriceChanges(priceChangeMap);
    } catch (error) {
      console.error('Error fetching detailed price changes:', error);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await getEnhancedTokensList({
          page: 1,
          limit: 20,
          search: query,
          sortBy: sortBy
        });

        if (response.success && response.data) {
          // Convert GraduationTokenItem to TokensListItem format
          const convertedTokens = response.data.tokens.map(token => ({
            id: token.id,
            ticker: token.ticker,
            name: token.name,
            image: token.image,
            description: token.description,
            graduated: token.graduated,
            holders: token.holders,
            flatEtherCollection: token.flat_ether_sale_collection,
            currentRate: token.current_rate_eth,
            currentRateUsd: token.current_rate_usd,
            marketCap: token.market_cap_eth,
            marketCapUsd: token.market_cap_usd,
            volume24h: 0, // Not available in GraduationTokenItem
            createdOn: token.created_on
          }));
          setSearchResults(convertedTokens);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [sortBy]
  );

  // Initial fetch of recent trades (with loading state)
  const fetchRecentTrades = useCallback(async () => {
    setIsLoadingTrades(true);
    try {
      const response = await getAllRecentTrades({ limit: 10 });
      
      if (response.success && response.data) {
        setRecentTrades(response.data.trades);
        // Set the latest trade hash for future comparisons
        if (response.data.trades.length > 0) {
          setLastTradeHash(response.data.trades[0].tx_hash);
        }
      } else {
        console.error('Failed to fetch recent trades:', response.error);
      }
    } catch (error) {
      console.error('Error fetching recent trades:', error);
    } finally {
      setIsLoadingTrades(false);
    }
  }, []);

  // Smart polling function that only updates when new trades are detected
  const checkForNewTrades = useCallback(async () => {
    try {
      // Don't show loading state for background checks
      const response = await getAllRecentTrades({ limit: 10 });
      
      if (response.success && response.data && response.data.trades.length > 0) {
        const latestTradeHash = response.data.trades[0].tx_hash;
        
        // Only update if we have a new trade (different hash from the last known trade)
        if (lastTradeHash && latestTradeHash !== lastTradeHash) {
          console.log('🔄 New trades detected, updating Live Trades section');
          setRecentTrades(response.data.trades);
          setLastTradeHash(latestTradeHash);
          // Show brief "new trades" indicator
          setHasNewTrades(true);
          setTimeout(() => setHasNewTrades(false), 2000); // Hide after 2 seconds
        } else if (!lastTradeHash) {
          // First time setting up, no comparison needed
          setRecentTrades(response.data.trades);
          setLastTradeHash(latestTradeHash);
        }
        // If hashes match, no new trades - do nothing (no UI update)
      } else {
        console.error('Failed to check for new trades:', response.error);
      }
    } catch (error) {
      console.error('Error checking for new trades:', error);
    }
  }, [lastTradeHash]);

  // Fetch top gainers
  const fetchTopGainers = useCallback(async () => {
    setIsLoadingGainers(true);
    try {
      // First try 24h period
      const response24h = await getTopGainers({ period: '24h', limit: 6 });
      
      if (response24h.success && response24h.data && response24h.data.gainers.length > 0) {
        setTopGainers(response24h.data.gainers);
      } else {
        // If 24h returns 0 results, fallback to 7d period
        console.log('No gainers found for 24h period, trying 7d period...');
        const response7d = await getTopGainers({ period: '7d', limit: 6 });
        
        if (response7d.success && response7d.data) {
          setTopGainers(response7d.data.gainers);
        } else {
          console.error('Failed to fetch top gainers for both 24h and 7d periods:', response7d.error);
          setTopGainers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      setTopGainers([]);
    } finally {
      setIsLoadingGainers(false);
    }
  }, []);

  // Fetch tokens about to graduate (Last Minute Rush)
  const fetchLastMinuteRush = useCallback(async () => {
    try {
      const response = await getGraduationTokensList({
        page: 1,
        limit: 20,
        graduated: false
      });
      
      if (response.success && response.data) {
        // Filter tokens that are about to graduate (less than 5 minutes remaining)
        const aboutToGraduate = response.data.tokens
          .filter(token => 
            token.sale_status === 'active' && 
            token.graduation_time_remaining_minutes <= 5 &&
            token.graduation_time_remaining_minutes > 0
          )
          .slice(0, 3); // Max 3 tokens
        
        setLastMinuteRush(aboutToGraduate);
      }
    } catch (error) {
      console.error('Error fetching last minute rush tokens:', error);
    }
  }, []);

  // Fetch reward pools for tokens
  const fetchRewardPools = useCallback(async (tokens: TokensListItem[]) => {
    try {
      const rewardPoolPromises = tokens.map(async (token) => {
        try {
          const response = await getRewardPool(token.ticker);
          if (response.success && response.data) {
            const { rewardPool } = response.data;
            return {
              ticker: token.ticker,
              ethValue: rewardPool.ethBalance || 0,
              tokenValue: rewardPool.tokenBalance || 0,
              totalUsd: rewardPool.totalValueUsd || 0
            };
          }
        } catch (error) {
          console.error(`Failed to fetch reward pool for ${token.ticker}:`, error);
        }
        return {
          ticker: token.ticker,
          ethValue: 0,
          tokenValue: 0,
          totalUsd: 0
        };
      });

      const rewardPoolResults = await Promise.all(rewardPoolPromises);
      const rewardPoolMap = rewardPoolResults.reduce((acc, result) => {
        acc[result.ticker] = {
          ethValue: result.ethValue,
          tokenValue: result.tokenValue,
          totalUsd: result.totalUsd
        };
        return acc;
      }, {} as Record<string, { ethValue: number; tokenValue: number; totalUsd: number }>);

      setRewardPools(rewardPoolMap);
    } catch (error) {
      console.error('Error fetching reward pools:', error);
    }
  }, []);

  // Load all data on component mount
  useEffect(() => {
    fetchRealTokens();
    fetchRecentTrades();
    fetchTopGainers();
    fetchLastMinuteRush();
    fetchWalletBalance();
    fetchPlatformStats();
    fetchIncubationTokens();
    fetchTrendingTokens();
  }, [fetchRealTokens, fetchRecentTrades, fetchTopGainers, fetchLastMinuteRush, fetchWalletBalance, fetchPlatformStats, fetchIncubationTokens, fetchTrendingTokens]);

  // Smart polling: Check for new trades every 5 seconds (only updates UI when new trades found)
  useEffect(() => {
    const tradesInterval = setInterval(() => {
      checkForNewTrades();
    }, 5000); // 5 seconds

    return () => clearInterval(tradesInterval);
  }, [checkForNewTrades]);

  // Trigger search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Refresh other data every 2 minutes (reduce frequency to prevent blinking)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLastMinuteRush();
      // Don't refresh main tokens list as frequently to prevent blinking
    }, 120000); // 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [fetchLastMinuteRush]);

  // Use real tokens for display with optimistic search
  const allTokens = useMemo(() => {
    // Use search results if there's a search query, otherwise use real tokens
    let filtered = searchQuery.trim() ? searchResults : realTokens;

    // Apply status filter (only if not searching, as search already handles filtering)
    if (!searchQuery.trim()) {
      if (selectedFilter === 'incubation') {
        filtered = filtered.filter(token => !token.graduated);
      } else if (selectedFilter === 'graduated') {
        filtered = filtered.filter(token => token.graduated);
      }
    }

    return filtered;
  }, [realTokens, searchResults, searchQuery, selectedFilter]);

  // Update displayed tokens when allTokens changes
  useEffect(() => {
    setDisplayedTokens(allTokens.slice(0, 20));
    setHasMore(allTokens.length > 20);
  }, [allTokens]);

  // Infinite scroll implementation
  const loadMoreTokens = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const currentLength = displayedTokens.length;
      const nextTokens = allTokens.slice(currentLength, currentLength + 20);
      
      if (nextTokens.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedTokens(prev => [...prev, ...nextTokens]);
      }
      
      setLoading(false);
    }, 500);
  }, [loading, hasMore, displayedTokens.length, allTokens]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreTokens();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreTokens]);

  // Removed live trading simulation to prevent blinking

  // Handle trading actions
  const handleTrade = (token: any, mode: 'buy' | 'sell') => {
    setTradingModal({
      isOpen: true,
      token,
      mode
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // The search filtering is now handled by the allTokens useMemo
    // No need to manually filter here as it's done automatically
  };

  // Helper function to get the best price change from all timeframes
  const getBestPriceChange = (priceChangeData: any): { value: number; timeframe: string } => {
    if (!priceChangeData?.price_changes) return { value: 0, timeframe: '' };
    
    const changes = priceChangeData.price_changes;
    const timeframes = ['15m', '1h', '4h', '1d'];
    
    let bestChange = { value: 0, timeframe: '' };
    let highestAbsValue = 0;
    
    // Find the highest absolute value across all timeframes and currencies
    for (const tf of timeframes) {
      const changeUsd = Number(changes[tf]?.change_percent_usd) || 0;
      const changeEth = Number(changes[tf]?.change_percent_eth) || 0;
      
      // Check USD change
      if (Math.abs(changeUsd) > highestAbsValue) {
        highestAbsValue = Math.abs(changeUsd);
        bestChange = { value: changeUsd, timeframe: tf };
      }
      
      // Check ETH change
      if (Math.abs(changeEth) > highestAbsValue) {
        highestAbsValue = Math.abs(changeEth);
        bestChange = { value: changeEth, timeframe: tf };
      }
    }
    
    return bestChange;
  };


  // Celebration effect
  const triggerCelebration = () => {
    setCelebrationMode(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => setCelebrationMode(false), 3000);
  };

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatNumber = (num: number | undefined | null) => {
    const safeNum = Number(num) || 0;
    if (safeNum >= 1000000) return (safeNum / 1000000).toFixed(1) + 'M';
    if (safeNum >= 1000) return (safeNum / 1000).toFixed(1) + 'K';
    return safeNum.toString();
  };

  // Helper function to format market cap in K/M format
  const formatMarketCap = (value: number): string => {
    const safeNum = Number(value) || 0;
    if (safeNum >= 1000000000) return (safeNum / 1000000000).toFixed(1) + 'B';
    if (safeNum >= 1000000) return (safeNum / 1000000).toFixed(1) + 'M';
    if (safeNum >= 1000) return (safeNum / 1000).toFixed(1) + 'K';
    return safeNum.toFixed(0);
  };

  // Helper function to format very small prices with subscript notation
  const formatSmallPrice = (price: number): { formatted: string; hasSubscript: boolean; subscriptCount: number; mainDigits: string } => {
    if (price === 0) return { formatted: '0.00', hasSubscript: false, subscriptCount: 0, mainDigits: '0.00' };
    
    const priceStr = price.toFixed(20); // Get enough decimal places
    const match = priceStr.match(/^0\.0*([1-9]\d*)/);
    
    if (!match) return { formatted: price.toFixed(4), hasSubscript: false, subscriptCount: 0, mainDigits: price.toFixed(4) };
    
    const decimalPart = priceStr.split('.')[1];
    const leadingZeros = decimalPart.match(/^0*/)?.[0].length || 0;
    
    // Only use subscript notation if there are 4 or more leading zeros
    if (leadingZeros >= 4) {
      const significantDigits = match[1].substring(0, 3); // Take first 3 significant digits
      return {
        formatted: `0.0₍${leadingZeros}₎${significantDigits}`,
        hasSubscript: true,
        subscriptCount: leadingZeros,
        mainDigits: significantDigits
      };
    }
    
    return { formatted: price.toFixed(6), hasSubscript: false, subscriptCount: 0, mainDigits: price.toFixed(6) };
  };


  // Use trending tokens for "hot" filter, otherwise filter normally
  const filteredTokens = selectedFilter === 'hot' 
    ? trendingTokens.map(trendingToken => ({
        ...trendingToken,
        // Convert TrendingToken to TokensListItem format
        volume24h: parseFloat(trendingToken.volume24h || '0'),
        marketCap: parseFloat(trendingToken.marketCap || '0'),
        currentRate: parseFloat(trendingToken.currentRate || '0'),
        price: parseFloat(trendingToken.currentRate || '0'),
        priceChange24h: 0, // Not available in trending API
        createdOn: trendingToken.createdOn
      }))
    : displayedTokens.filter(token => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'incubation') return !token.graduated;
        if (selectedFilter === 'graduated') return token.graduated;
        if (selectedFilter === 'new') return new Date(token.createdOn) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        if (selectedFilter === 'owned') return false; // No ownership data in API yet
        return true;
      });

  // Tokens are already sorted by the API, so we just use filtered tokens
  const sortedTokens = filteredTokens;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile-First Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Community Tokens
                </h1>
                <button
                  onClick={() => setExplainerOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline mt-1 transition-colors"
                >
                  What are community tokens?
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="relative w-96">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur-xl" />
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="🚀 Find your next 100x community token..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 pr-10 py-3 text-base bg-background/80 backdrop-blur-sm border-2 border-muted focus:border-primary transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 flex gap-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse delay-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {/* Mobile Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Community Tokens
              </h1>
              <button
                onClick={() => setExplainerOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline mt-1 transition-colors"
              >
                What are community tokens?
              </button>
            </div>
            
            {/* Launch Token - Top Priority on Mobile */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-primary" />
                    Launch Your Community
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Create, build, earn from day one
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/community_token_new')}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Start
                </Button>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="🔍 Search tokens..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-10 py-3 text-base bg-background/80 backdrop-blur-sm border-2 border-muted focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Desktop Create Community - Prominent */}
            <div className="hidden md:block mb-6 p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    Launch Your Community
                  </h2>
                  <p className="text-muted-foreground">
                    Create your token, build your tribe, earn from day one
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/community_token_new')}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </div>
            </div>

            {/* Mobile-Friendly Filter Tabs */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Mobile: Horizontal Scroll Filters */}
                <div className="md:hidden">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                      { key: 'all', label: 'All', icon: Target, count: realTokens.length },
                      { key: 'incubation', label: 'Live', icon: Timer, count: realTokens.filter(t => !t.graduated).length, urgent: true },
                      { key: 'hot', label: 'Hot', icon: Flame, count: realTokens.filter(t => (t.volume24h || 0) > 10).length },
                      { key: 'new', label: 'New', icon: Sparkles, count: realTokens.filter(t => new Date(t.createdOn) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length }
                    ].map(({ key, label, icon: Icon, count, urgent }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedFilter(key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          selectedFilter === key 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        } ${urgent && selectedFilter !== key ? 'animate-pulse' : ''}`}
                      >
                        <Icon className={`w-4 h-4 ${urgent ? 'text-orange-500' : ''}`} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop: Regular Tabs */}
                <div className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                  {[
                    { key: 'all', label: 'All Tokens', icon: Target, count: realTokens.length },
                    { key: 'incubation', label: 'Live Sale', icon: Timer, count: realTokens.filter(t => !t.graduated).length, urgent: true },
                    { key: 'hot', label: 'Trending', icon: Flame, count: realTokens.filter(t => (t.volume24h || 0) > 10).length },
                    { key: 'new', label: 'New', icon: Sparkles, count: realTokens.filter(t => new Date(t.createdOn) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length }
                  ].map(({ key, label, icon: Icon, count, urgent }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFilter(key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedFilter === key 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      } ${urgent && selectedFilter !== key ? 'animate-pulse' : ''}`}
                    >
                      <Icon className={`w-4 h-4 ${urgent ? 'text-orange-500' : ''}`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const newSortBy = e.target.value as SortByOption;
                    setSortBy(newSortBy);
                    fetchSortedTokens(newSortBy);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm bg-background min-w-[140px]"
                >
                  <option value="holders">👥 Most Holders</option>
                  <option value="newest">✨ Newest</option>
                  <option value="hottest">🔥 Hottest</option>
                  <option value="top_gainers_24h">📈 Top Gainers 24h</option>
                  <option value="top_gainers_1h">⚡ Top Gainers 1h</option>
                  <option value="market_cap">💰 Market Cap</option>
                  <option value="volume">📊 Volume</option>
                </select>
              </div>
            </div>

            {/* Loading indicator for real tokens */}
            {isLoadingRealTokens && (
              <div className="flex items-center justify-center py-8 mb-6">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading community tokens...</span>
              </div>
            )}

            {/* Compact Token Cards - Completely Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Loading State */}
              {isLoadingRealTokens && (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading community tokens...</span>
                  </div>
                </div>
              )}

              {/* Searching State */}
              {isSearching && searchQuery.trim() && (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold mb-2">Searching...</h3>
                    <p className="text-muted-foreground">
                      Looking for community tokens matching "{searchQuery}"
                    </p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoadingRealTokens && !isSearching && sortedTokens.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery.trim() ? 'No Community Tokens Found' : 'No Community Tokens Available'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery.trim() 
                        ? `No tokens found matching "${searchQuery}". Try different keywords or browse all tokens.`
                        : selectedFilter === 'all' 
                          ? 'No community tokens available yet. Be the first to create one!'
                          : `No tokens found for "${selectedFilter}" filter. Try a different filter.`
                      }
                    </p>
                    {!searchQuery.trim() && (
                      <Button onClick={() => navigate('/community_token_new')} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create First Token
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {sortedTokens.map((token, index) => (
                  <motion.div
                    key={generateStableKey('token', token.ticker, token.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.02 }}
                    className="h-full"
                  >
                    <Card 
                      className={`relative overflow-hidden transition-all duration-200 border hover:border-primary/30 hover:shadow-lg h-full flex flex-col cursor-pointer ${
!token.graduated 
                          ? 'bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/10 dark:to-yellow-950/5 border-amber-200/30' 
                          : 'bg-card hover:bg-muted/10'
                      }`}
                      onClick={() => navigate(`/c/${token.ticker}`)}
                    >
                      {/* Status Indicator */}
                      {!token.graduated && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                      )}

                      <CardContent className="p-4 flex flex-col h-full">
                        {/* Compact Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-xl flex-shrink-0">{token.image ? <img src={token.image} alt={token.name} className="w-8 h-8 rounded-full" /> : '🪙'}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm truncate flex-1">{token.name}</h3>
                              <Badge variant="outline" className="text-xs px-1.5 py-0 flex-shrink-0">
                                ${token.ticker}
                              </Badge>
                              {!token.graduated && (
                                <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0 flex-shrink-0">
                                  NEW
                                </Badge>
                              )}
                            </div>
                            {/* Community Description - PROMINENT - Fixed Height */}
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8 flex items-start">
                              {token.description || 'Building the future of community-driven innovation'}
                            </p>
                          </div>
                        </div>

                        {/* Incubation Progress or Community Reward Pool */}
                        {!token.graduated ? (() => {
                          // Calculate time remaining from createdOn (30 minutes incubation period)
                          const createdDate = new Date(token.createdOn);
                          const startTime = createdDate.getTime();
                          
                          // Check if date is valid
                          if (isNaN(startTime)) {
                            console.warn('Invalid createdOn date for token:', token.ticker, token.createdOn);
                            return (
                              <div className="mb-3 p-2.5 rounded-md bg-gray-100 dark:bg-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                  Incubation data unavailable
                                </p>
                              </div>
                            );
                          }
                          
                          const now = Date.now();
                          const incubationDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
                          const timeElapsed = now - startTime;
                          const timeRemaining = Math.max(0, incubationDuration - timeElapsed);
                          
                          // Calculate progress based on incubation time (30 minutes)
                          const timeProgress = Math.min(100, (timeElapsed / incubationDuration) * 100);
                          
                          // Determine urgency level for animations and colors
                          const isUrgent = timeProgress > 80; // Last 20% (6 minutes)
                          const isCritical = timeProgress > 90; // Last 10% (3 minutes)
                          
                          return (
                            <div className={`mb-3 p-2.5 rounded-md transition-all duration-300 ${
                              isCritical 
                                ? 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 border border-red-400/70 dark:border-red-600/50 animate-pulse shadow-lg shadow-red-500/20' 
                                : isUrgent 
                                  ? 'bg-gradient-to-r from-orange-50 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-300/60 dark:border-orange-700/40 shadow-md shadow-orange-500/10' 
                                  : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/30'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    isCritical 
                                      ? 'bg-red-600 animate-bounce shadow-lg shadow-red-500/50' 
                                      : isUrgent 
                                        ? 'bg-orange-500 animate-pulse shadow-md shadow-orange-500/30' 
                                        : 'bg-red-500 animate-pulse'
                                  }`}>
                                    <Timer className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-xs font-bold text-red-700 dark:text-red-400">
                                    INCUBATION PHASE
                                  </span>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button 
                                        className="ml-1 p-0.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <HelpCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <Timer className="w-5 h-5 text-red-500" />
                                          What is Incubation Phase?
                                        </DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 text-sm text-muted-foreground">
                                        <p>
                                          The <strong>Incubation Phase</strong> is a 30-minute window from when a token is created where tokens are sold at a flat rate.
                                        </p>
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                          <p className="font-medium text-foreground mb-2">Key Details:</p>
                                          <ul className="space-y-1 text-xs">
                                            <li>• <strong>Duration:</strong> 30 minutes from token creation</li>
                                            <li>• <strong>Rate:</strong> Fixed rate of 1 ETH = 100M tokens</li>
                                            <li>• <strong>Maximum:</strong> 100M tokens can be sold to collect 1 ETH</li>
                                            <li>• <strong>Graduation:</strong> Whichever happens first - 1 ETH collected or 30 minutes elapsed</li>
                                          </ul>
                                        </div>
                                        <p>
                                          After graduation, tokens move to <strong>Uniswap V4</strong> for decentralized trading with dynamic pricing.
                                        </p>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                <div className={`text-xs font-mono font-bold px-2 py-1 rounded transition-all duration-300 ${
                                  isCritical 
                                    ? 'text-white bg-red-600 shadow-lg shadow-red-500/30 animate-pulse' 
                                    : isUrgent 
                                      ? 'text-orange-800 bg-orange-200 dark:text-orange-200 dark:bg-orange-800/50 shadow-md shadow-orange-500/20' 
                                      : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                                }`}>
                                  <CountdownTimer timeLeft={timeRemaining} />
                                </div>
                              </div>
                              <div className="mb-2">
                                <Progress 
                                  value={timeProgress} 
                                  className={`h-2 transition-all duration-300 ${
                                    isCritical 
                                      ? 'bg-red-200 dark:bg-red-800/50' 
                                      : isUrgent 
                                        ? 'bg-orange-100 dark:bg-orange-900/40' 
                                        : 'bg-red-100 dark:bg-red-900/30'
                                  }`}
                                  style={{
                                    '--progress-background': isCritical 
                                      ? '#dc2626' 
                                      : isUrgent 
                                        ? '#ea580c' 
                                        : '#ef4444'
                                  } as React.CSSProperties}
                                />
                              </div>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center">
                                  Buy at flat rate during incubation
                                </p>
                            </div>
                          );
                        })() : (
                          <div className="mb-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-md">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <DollarSign className="w-3 h-3 text-white" />
                                </div>
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Community Reward Pool</p>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <button 
                                          className="p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/30 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <HelpCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        </button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-emerald-500" />
                                            Community Reward Pool
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 text-sm text-muted-foreground">
                                          <p>
                                            The <strong>Community Reward Pool</strong> consists of tokens and ETH accumulated from trading fees and platform activities.
                                          </p>
                                          <div className="bg-muted/50 p-3 rounded-lg">
                                            <p className="font-medium text-foreground mb-2">How it works:</p>
                                            <ul className="space-y-1 text-xs">
                                              <li>• <strong>Accumulation:</strong> Trading fees and platform activities contribute to the pool</li>
                                              <li>• <strong>DAO Governance:</strong> Community members can propose how to use these funds</li>
                                              <li>• <strong>Democratic Decisions:</strong> Token holders vote on proposals for fund allocation</li>
                                              <li>• <strong>Community Benefits:</strong> Funds can be used for development, rewards, or community initiatives</li>
                                            </ul>
                                          </div>
                                          <p>
                                            This creates a <strong>decentralized treasury</strong> that grows with community activity and is managed democratically by token holders.
                                          </p>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                  {rewardPools[token.ticker] !== undefined ? (
                                    <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                                      ${Math.floor(rewardPools[token.ticker]?.totalUsd || 0).toLocaleString()}
                                    </p>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                        Loading pool...
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Price, Market Cap & Holders */}
                        <div className="mb-3 grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            {(() => {
                              // Use currentRateUsd from the API which is the USD price
                              const priceValue = Number(token.currentRateUsd) || 0;
                              const priceFormat = formatSmallPrice(priceValue);
                              
                              if (priceFormat.hasSubscript) {
                                return (
                                  <p className="font-bold text-sm">
                                    $0.0<sub className="text-xs font-bold">{priceFormat.subscriptCount}</sub>{priceFormat.mainDigits}
                                  </p>
                                );
                              }
                              
                              return <p className="font-bold text-sm">${priceFormat.formatted}</p>;
                            })()}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Market Cap</p>
                            <p className="font-bold text-sm">${formatMarketCap(Number(token.marketCapUsd) || 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Holders</p>
                            <div className="flex items-center justify-center gap-1">
                              <Users className="w-3 h-3" />
                              <span className="font-bold text-sm">{formatNumber(token.holders)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 24h Performance Badge */}
                        <div className="mb-3 flex justify-center">
                          {(() => {
                            const priceChangeData = detailedPriceChanges[token.ticker];
                            const bestChange = getBestPriceChange(priceChangeData);
                            const changeValue = bestChange.value;
                            
                            return (
                              <Badge className={`text-xs font-semibold ${
                                changeValue > 0 
                                  ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                                  : changeValue < 0
                                    ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                                    : 'bg-gray-100 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400'
                              }`}>
                                {changeValue > 0 ? '+' : ''}{safeToFixed(changeValue, 1)}%
                                {bestChange.timeframe && (
                                  <span className="ml-1 text-xs opacity-75">({bestChange.timeframe})</span>
                                )}
                              </Badge>
                            );
                          })()}
                        </div>

                        {/* Action Button */}
                        <div className="mt-auto">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click navigation
                              handleTrade(token, 'buy');
                            }}
                            className="w-full font-medium text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {!token.graduated ? 'Buy Now' : 'Buy'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Infinite Scroll Loading */}
            <div ref={observerRef} className="flex justify-center py-8">
              {loading && (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-muted-foreground">Loading more tokens...</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-4 order-1 lg:order-2">
            {/* Live Trading Feed - Sleeker */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${hasNewTrades ? 'bg-orange-500 animate-bounce' : 'bg-green-500 animate-pulse'}`} />
                  <h3 className="font-semibold text-sm">Live Trades</h3>
                  {hasNewTrades && (
                    <span className="text-xs text-orange-600 font-medium animate-pulse">
                      New!
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 max-h-80 overflow-hidden">
                  {isLoadingTrades ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : recentTrades.length > 0 ? (
                      recentTrades.slice(0, 6).map((trade, index) => (
                        <motion.div
                          key={generateStableKey('desktop-trade', trade.user_handle, trade.trade_time, index)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-2 p-2 rounded bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">@{trade.user_handle}</span>
                            <span className={`${
                              trade.trade_type.includes('buy') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trade.trade_type.includes('buy') ? 'bought' : 'sold'}
                            </span>
                            <span className="font-medium">{formatNumber(trade.token_amount)}</span>
                            <span className="text-muted-foreground">${trade.ticker}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-muted-foreground">
                              ${safeToFixed(trade.eth_amount_usd, 2)}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(trade.trade_time).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        </motion.div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No recent trades
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Market Stats - Compact */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Market Overview</h3>
                {isLoadingPlatformStats ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                ) : platformStats ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Tokens</span>
                      <span className="font-medium">{platformStats.totalTokens}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Live Incubations</span>
                      <span className="font-medium text-orange-600">
                        {platformStats.incubatingTokens}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span className="font-medium">
                        ${parseFloat(platformStats.volume24h.usd).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Holders</span>
                      <span className="font-medium">
                        {platformStats.totalHolders.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span className="font-medium">
                        ${formatMarketCap(parseFloat(platformStats.totalMarketCap.usd))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Tokens</span>
                      <span className="font-medium">{realTokens.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Live Incubations</span>
                      <span className="font-medium text-orange-600">
                        {realTokens.filter(t => !t.graduated).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">24h Volume</span>
                      <span className="font-medium">
                        {safeToFixed(realTokens.reduce((sum, token) => sum + (token.volume24h || 0), 0), 1)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Holders</span>
                      <span className="font-medium">
                        {formatNumber(realTokens.reduce((sum, token) => sum + (token.holders || 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Gainers - Compact */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  Top Gainers
                </h3>
                
                <div className="space-y-2">
                  {isLoadingGainers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : topGainers.length > 0 ? (
                    topGainers.slice(0, 4).map((token, index) => (
                      <div 
                        key={generateStableKey('desktop-gainer', token.ticker, index)} 
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                        onClick={() => navigate(`/c/${token.ticker}`)}
                      >
                        <div className="text-sm">
                          {token.image ? (
                            <img src={token.image} alt={token.name} className="w-4 h-4 rounded" />
                          ) : (
                            '🚀'
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-xs">${token.ticker}</div>
                          <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                        </div>
                        <div className="text-green-600 font-medium text-xs flex items-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          +{safeToFixed(token.price_change_percent, 1)}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No gainers data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Last Chance - Desktop */}
            {(isLoadingIncubation || incubationTokens.length > 0) && (
              <Card>
                <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Timer className="w-3 h-3 text-red-500 animate-pulse" />
                  Last Chance
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    Graduating soon
                  </span>
                </h3>
                  
                <div className="space-y-2">
                  {isLoadingIncubation ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : incubationTokens.length > 0 ? (
                    incubationTokens.map((token, index) => (
                      <div 
                        key={generateStableKey('desktop-incubation', token.ticker, index)} 
                        className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/30 cursor-pointer hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 transition-colors"
                        onClick={() => navigate(`/c/${token.ticker}`)}
                      >
                        <div className="text-sm">
                          {token.image ? (
                            <img src={token.image} alt={token.givenName || token.name} className="w-4 h-4 rounded" />
                          ) : (
                            '🔥'
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-xs">${token.ticker}</div>
                          <div className="text-xs text-muted-foreground truncate">{token.givenName || token.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-600 font-bold text-xs animate-pulse">
                            {token.minutesRemaining}m left
                          </div>
                          <div className="text-xs text-red-500 font-medium">
                            {token.holders} holders
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      No tokens in incubation
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Mobile-Only Sections */}
          <div className="lg:hidden order-1 space-y-4 mb-6">
            {/* Mobile Live Trading - Single Line with Animation */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="font-semibold text-sm">Live Trading</h3>
              </div>
              <div className="relative h-5 overflow-hidden">
                <motion.div
                  animate={{ y: [0, -20, -40, -60, -80, -100] }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="space-y-1"
                >
                  {isLoadingTrades ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                  ) : recentTrades.length > 0 ? (
                    recentTrades.slice(0, 6).map((trade, index) => (
                      <div key={generateStableKey('mobile-trade', trade.user_handle, trade.trade_time, index)} className="flex items-center justify-between text-xs h-5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">@{trade.user_handle}</span>
                          <span className={`${
                            trade.trade_type.includes('buy') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trade.trade_type.includes('buy') ? 'bought' : 'sold'}
                          </span>
                          <span className="font-medium">{formatNumber(trade.token_amount)} ${trade.ticker}</span>
                        </div>
                        <span className="text-muted-foreground">${safeToFixed(trade.eth_amount_usd, 2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No recent trades
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Mobile Top Gainers - Horizontal Scroll Cards */}
            <div>
              <h3 className="font-semibold text-sm mb-3 px-1 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top Gainers
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {isLoadingGainers ? (
                  <div className="flex items-center justify-center py-4 w-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : topGainers.length > 0 ? (
                  topGainers.slice(0, 8).map((token, index) => (
                    <div 
                      key={generateStableKey('mobile-gainer', token.ticker, index)} 
                      className="flex-shrink-0 bg-card border rounded-lg p-3 w-28 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/c/${token.ticker}`)}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">
                          {token.image ? (
                            <img src={token.image} alt={token.name} className="w-6 h-6 rounded mx-auto" />
                          ) : (
                            '🚀'
                          )}
                        </div>
                        <div className="font-medium text-sm">${token.ticker}</div>
                        <div className="text-xs text-muted-foreground mb-2 truncate">{token.name}</div>
                        <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          +{safeToFixed(token.price_change_percent, 1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4 w-full">
                    No gainers data
                  </div>
                )}
              </div>
            </div>

            {/* Last Minute Rush - Mobile */}
            {lastMinuteRush.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 px-1 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-red-500" />
                  Last Minute Rush
                </h3>
                <div className="space-y-3">
                  {lastMinuteRush.map((token, index) => (
                    <div 
                      key={generateStableKey('mobile-rush', token.ticker, index)} 
                      className="bg-card border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/c/${token.ticker}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">
                            {token.image ? (
                              <img src={token.image} alt={token.name} className="w-5 h-5 rounded" />
                            ) : (
                              '⏰'
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">${token.ticker}</div>
                            <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-red-600 font-medium">
                            {token.graduation_time_remaining_minutes}m left
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${safeToFixed(token.current_rate_usd, 6)}
                          </div>
                        </div>
                      </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.max(10, ((30 - token.graduation_time_remaining_minutes) / 30) * 100)}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{30 - token.graduation_time_remaining_minutes}m elapsed</span>
                        <span>30m total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <TradingInterface
        isOpen={tradingModal.isOpen}
        onClose={() => setTradingModal({ isOpen: false, token: null, mode: 'buy' })}
        token={tradingModal.token}
        mode={tradingModal.mode}
        userEthBalance={userEthBalance}
        onTradeComplete={() => {
          // Refresh token data after trade
          fetchRealTokens();
          setTradingModal({ isOpen: false, token: null, mode: 'buy' });
        }}
      />

      {/* Community Tokens Explainer Modal */}
      <CommunityTokensExplainer
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  );
};

export default CommunityTokensPage;


