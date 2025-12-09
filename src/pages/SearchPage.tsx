import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search as SearchIcon, Sparkles, Filter, ArrowUp, ArrowDown, Loader2, Lock, MessageCircle, Cat, Zap, User, TrendingUp, Clock, Hash, UserPlus } from 'lucide-react';
import { Post } from '@/components/feed/Post';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { searchAll, searchUsers, searchCommunities, searchPosts, SearchUserItem, SearchCommunityItem, SearchPostItem, Pagination } from '@/utils/searchApi';
import DOMPurify from 'dompurify';

// Utility function to safely render HTML content
const renderSafeHTML = (htmlContent: string) => {
  const allowedTags = ['p', 'br', 'b', 'i', 'strong', 'em'];
  const allowedAttributes = {};
  
  const cleanHTML = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true
  });
  
  return { __html: cleanHTML };
};

const SearchPage = () => {
  usePreventZoom();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  // Get query from URL parameters or default to empty string
  const queryParam = searchParams.get('q') || '';
  const tabParam = searchParams.get('tab') || 'all';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State for search results
  const [userResults, setUserResults] = useState<SearchUserItem[]>([]);
  const [communityResults, setCommunityResults] = useState<SearchCommunityItem[]>([]);
  const [postResults, setPostResults] = useState<SearchPostItem[]>([]);
  
  // Pagination state
  const [userPagination, setUserPagination] = useState<Pagination | null>(null);
  const [communityPagination, setCommunityPagination] = useState<Pagination | null>(null);
  const [postPagination, setPostPagination] = useState<Pagination | null>(null);
  
  // Current page for each tab
  const [userPage, setUserPage] = useState(1);
  const [communityPage, setCommunityPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  
  // Error states
  const [userError, setUserError] = useState<string | null>(null);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  
  // Handle keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search input when Ctrl+K or Cmd+K is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Function to handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL parameters
    searchParams.set('tab', value);
    setSearchParams(searchParams);
  };
  
  // Function to perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Update URL parameters
      searchParams.set('q', query);
      setSearchParams(searchParams);
      
      // Perform combined search for "all" tab, or specific search for other tabs
      if (activeTab === 'all') {
        const results = await searchAll(query);
        
        if (results.users.success && results.users.users) {
          setUserResults(results.users.users.items);
          setUserPagination(results.users.users.pagination);
          setUserError(null);
        } else {
          setUserError(results.users.error || 'Failed to fetch user results');
        }
        
        if (results.communities.success && results.communities.communities) {
          setCommunityResults(results.communities.communities.items);
          setCommunityPagination(results.communities.communities.pagination);
          setCommunityError(null);
        } else {
          setCommunityError(results.communities.error || 'Failed to fetch community results');
        }
        
        if (results.posts.success && results.posts.posts) {
          setPostResults(results.posts.posts.items);
          setPostPagination(results.posts.posts.pagination);
          setPostError(null);
        } else {
          setPostError(results.posts.error || 'Failed to fetch post results');
        }
      } else if (activeTab === 'users') {
        const result = await searchUsers(query, userPage);
        if (result.success && result.users) {
          setUserResults(result.users.items);
          setUserPagination(result.users.pagination);
          setUserError(null);
        } else {
          setUserError(result.error || 'Failed to fetch user results');
        }
      } else if (activeTab === 'communities') {
        const result = await searchCommunities(query, communityPage);
        if (result.success && result.communities) {
          setCommunityResults(result.communities.items);
          setCommunityPagination(result.communities.pagination);
          setCommunityError(null);
        } else {
          setCommunityError(result.error || 'Failed to fetch community results');
        }
      } else if (activeTab === 'posts') {
        const result = await searchPosts(query, postPage);
        if (result.success && result.posts) {
          setPostResults(result.posts.items);
          setPostPagination(result.posts.pagination);
          setPostError(null);
        } else {
          setPostError(result.error || 'Failed to fetch post results');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [activeTab, searchParams, userPage, communityPage, postPage]);
  
  // Handle search form submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    performSearch(searchQuery);
  };
  
  // Load search results on initial render if query exists
  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam, performSearch]);
  
  // Handle tab change logic 
  useEffect(() => {
    if (hasSearched && searchQuery) {
      performSearch(searchQuery);
    }
  }, [activeTab, userPage, communityPage, postPage]);
  
  // Load more results for a specific tab
  const loadMore = (tab: string) => {
    if (tab === 'users' && userPagination?.has_next) {
      setUserPage(prev => prev + 1);
    } else if (tab === 'communities' && communityPagination?.has_next) {
      setCommunityPage(prev => prev + 1);
    } else if (tab === 'posts' && postPagination?.has_next) {
      setPostPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Modern Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-emerald-500/5" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="p-3 bg-primary/10 rounded-full"
              >
                <SearchIcon className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Discover
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto"
            >
              Find amazing people, vibrant communities, and engaging conversations.
            </motion.p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Search Form */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <motion.form 
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-emerald-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500"></div>
            
            {/* Search input container */}
            <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg group-focus-within:border-primary/50 transition-all duration-300">
              <div className="flex items-center">
                <div className="pl-6 pr-3 py-4">
                  <SearchIcon className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for users, communities, posts..."
                  className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                <div className="pr-3">
                  <Button 
                    type="submit" 
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <SearchIcon className="h-5 w-5 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.form>
        
        {/* Quick search suggestions */}
        {!hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['developers', 'crypto', 'art', 'gaming', 'defi'].map((term, index) => (
                <motion.button
                  key={term}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery(term);
                    performSearch(term);
                  }}
                  className="px-4 py-2 bg-muted/50 hover:bg-muted rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Hash className="h-3 w-3 inline mr-1" />
                  {term}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      {!hasSearched ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 z-0"></div>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-20 relative z-10">
              <div className="relative mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                  className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
                ></motion.div>
                <motion.div
                  animate={{ 
                    rotateZ: [0, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                >
                  <Sparkles className="h-14 w-14 text-primary" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Discover Communities and Content</h2>
              <p className="text-muted-foreground max-w-md mb-6">
              Search for communities, posts, or users to find exactly what you're looking for in the dapps.co ecosystem.
            </p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Badge variant="secondary" className="py-2 gap-1 text-sm">
                  <Users className="h-3 w-3" /> Communities
                </Badge>
                <Badge variant="secondary" className="py-2 gap-1 text-sm">
                  <MessageCircle className="h-3 w-3" /> Posts
                </Badge>
                <Badge variant="secondary" className="py-2 gap-1 text-sm">
                  <User className="h-3 w-3" /> Users
                </Badge>
              </div>
          </CardContent>
        </Card>
        </motion.div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Search Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {isSearching ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    `Found ${userResults.length + communityResults.length + postResults.length} results`
                  )}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setHasSearched(false);
                  searchInputRef.current?.focus();
                }}
                className="gap-2"
              >
                <SearchIcon className="h-4 w-4" />
                New Search
              </Button>
            </div>

            {/* Modern Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="relative mb-8">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex bg-muted/30 p-1 rounded-xl">
                  <TabsTrigger 
                    value="all"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">All Results</span>
                      <span className="sm:hidden">All</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="communities"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Communities</span>
                      <span className="sm:hidden">Groups</span>
                      {communityResults.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {communityResults.length}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="posts"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Posts</span>
                      <span className="sm:hidden">Posts</span>
                      {postResults.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {postResults.length}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">People</span>
                      <span className="sm:hidden">Users</span>
                      {userResults.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {userResults.length}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="all" className="space-y-8 mt-0">
                  {isSearching ? (
                    <SearchLoadingState />
                  ) : (
                    <>
                      {/* Create an array of result sections and sort them by whether they have results */}
                      {[
                        {
                          type: 'communities',
                          hasResults: communityResults.length > 0,
                          error: communityError,
                          icon: <Users className="h-5 w-5 text-primary" />,
                          title: "Communities",
                          content: communityResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {communityResults.map((community, index) => (
                              <motion.div
                                key={community.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                              >
                                <CommunityResult community={community} />
                              </motion.div>
                ))}
              </div>
                        ) : (
                          <EmptySearchResults type="communities" query={searchQuery} />
                          ),
                          viewAllAction: () => handleTabChange('communities')
                        },
                        {
                          type: 'posts',
                          hasResults: postResults.length > 0,
                          error: postError,
                          icon: <MessageCircle className="h-5 w-5 text-primary" />,
                          title: "Posts",
                          content: postResults.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {postResults.map((post, index) => (
                              <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                              >
                                <PostSearchResult 
                                  post={post} 
                                  onClick={() => navigate(`/c/${post.community}/${post.code}`)} 
                                />
                              </motion.div>
                ))}
              </div>
                        ) : (
                          <EmptySearchResults type="posts" query={searchQuery} />
                          ),
                          viewAllAction: () => handleTabChange('posts')
                        },
                        {
                          type: 'users',
                          hasResults: userResults.length > 0,
                          error: userError,
                          icon: <User className="h-5 w-5 text-primary" />,
                          title: "Users",
                          content: userResults.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                              {userResults.map((user, index) => (
                                <motion.div
                                  key={user.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  whileHover={{ y: -5 }}
                                >
                                  <UserResult user={user} />
                      </motion.div>
                              ))}
                            </div>
                          ) : (
                            <EmptySearchResults type="users" query={searchQuery} />
                          ),
                          viewAllAction: () => handleTabChange('users')
                        }
                      ]
                        // Sort sections - put those with results first
                        .sort((a, b) => Number(b.hasResults) - Number(a.hasResults))
                        .map((section, sectionIndex) => (
                      <motion.div 
                            key={section.type}
                        className="space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
                      >
              <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                                {section.icon}
                                <h2 className="text-lg font-medium">{section.title}</h2>
                          </div>
                              {section.hasResults && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={section.viewAllAction} 
                                  className="text-primary"
                                >
                              View All
                            </Button>
                          )}
              </div>
              
                            {section.error ? (
                          <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                                <p className="text-red-700 text-sm">{section.error}</p>
                          </div>
                            ) : section.content}
                              </motion.div>
                ))}
                    </>
                  )}
          </TabsContent>
          
                <TabsContent value="communities" className="mt-0">
                  {isSearching ? (
                    <SearchLoadingState />
                  ) : communityError ? (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                      <p className="text-red-700 text-sm">{communityError}</p>
            </div>
                  ) : communityResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityResults.map((community, index) => (
                          <motion.div
                            key={community.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                          >
                            <CommunityResult community={community} />
                          </motion.div>
              ))}
            </div>
                      
                      {communityPagination && communityPagination.has_next && (
                        <motion.div 
                          className="flex justify-center mt-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button 
                            variant="outline" 
                            onClick={() => loadMore('communities')}
                            className="border-primary/20 text-primary hover:border-primary"
                          >
                            Load More Communities
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <EmptySearchResults type="communities" query={searchQuery} />
                  )}
          </TabsContent>
          
                <TabsContent value="posts" className="mt-0">
                  {isSearching ? (
                    <SearchLoadingState />
                  ) : postError ? (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                      <p className="text-red-700 text-sm">{postError}</p>
            </div>
                  ) : postResults.length > 0 ? (
            <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
              {postResults.map((post, index) => (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                          >
                            <PostSearchResult 
                              post={post} 
                              onClick={() => navigate(`/c/${post.community}/${post.code}`)} 
                            />
                          </motion.div>
              ))}
            </div>
                      
                      {postPagination && postPagination.has_next && (
                        <motion.div 
                          className="flex justify-center mt-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button 
                            variant="outline" 
                            onClick={() => loadMore('posts')}
                            className="border-primary/20 text-primary hover:border-primary"
                          >
                            Load More Posts
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <EmptySearchResults type="posts" query={searchQuery} />
                  )}
          </TabsContent>
          
                <TabsContent value="users" className="mt-0">
                  {isSearching ? (
                    <SearchLoadingState />
                  ) : userError ? (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                      <p className="text-red-700 text-sm">{userError}</p>
            </div>
                  ) : userResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {userResults.map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                          >
                            <UserResult user={user} />
                          </motion.div>
              ))}
            </div>
                      
                      {userPagination && userPagination.has_next && (
                        <motion.div 
                          className="flex justify-center mt-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button 
                            variant="outline" 
                            onClick={() => loadMore('users')}
                            className="border-primary/20 text-primary hover:border-primary"
                          >
                            Load More Users
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <EmptySearchResults type="users" query={searchQuery} />
                  )}
          </TabsContent>
              </motion.div>
            </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface CommunityResultProps {
  community: SearchCommunityItem;
}

const CommunityResult = ({ community }: CommunityResultProps) => {
  const communityUrl = `/c/${community.name.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
          <Link 
      to={communityUrl}
      className="block group cursor-pointer"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-border/50 group-hover:border-primary/50 bg-background/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {community.encrypted && (
          <Badge className="absolute right-2 top-2 bg-foreground/10 gap-1 z-10">
            <Lock className="h-3 w-3" />
            Private
            </Badge>
          )}
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12 border-2 border-border/50 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={community.image} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {community.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {community.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                {community.description}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{community.members_count.toLocaleString()} members</span>
              </div>
            </div>
          </div>
        </CardContent>
    </Card>
    </Link>
  );
};

interface UserResultProps {
  user: SearchUserItem;
}

const UserResult = ({ user }: UserResultProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-border/50 group hover:border-primary/50 bg-background/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-16 w-16 border-2 border-border/50 group-hover:border-primary/50 transition-colors">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {user.handle?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300"></div>
          </div>
          
          <h3 className="font-semibold text-lg mb-4 group-hover:text-primary transition-colors">
            @{user.handle}
          </h3>
          
          <Button 
            className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-200 border border-primary/20 hover:border-primary" 
            size="sm" 
            asChild
          >
            <Link to={`/u/${user.handle.split('.')[0]}`}>
              <UserPlus className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Add this component after UserResult
interface PostSearchResultProps {
  post: SearchPostItem;
  onClick: () => void;
}

const PostSearchResult = ({ post, onClick }: PostSearchResultProps) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <Card className="hover:shadow-lg transition-all duration-300 border border-border/50 group hover:border-primary/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="relative z-10"
              >
                <Avatar className="h-10 w-10 border border-border/50 group-hover:border-primary/30 transition-colors">
                  <AvatarImage src={post.author.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{post.author.handle?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-50 -z-0 blur-sm"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              ></motion.div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.author.handle}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{post.time_ago}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {post.type === 'reply' ? (
                  <Badge variant="outline" className="text-xs h-5 px-1 mr-1">Reply</Badge>
                ) : null}
                in <Link to={`/c/${post.community}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">{post.community}</Link>
              </div>
            </div>
          </div>
          
          <div 
            className="text-sm mb-4 line-clamp-3 group-hover:text-foreground/90 transition-colors prose prose-sm max-w-none"
            dangerouslySetInnerHTML={renderSafeHTML(post.content)}
          />
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="relative"
              >
                {post.type === 'reply' ? (
                  <Cat className="h-4 w-4 text-amber-500" />
                ) : (
                  <span role="img" aria-label="lion" className="text-lg">🦁</span>
                )}
              </motion.div>
              <span className="font-medium">{post.upvotes}</span>
            </div>
            {post.reply_count > 0 && (
              <div className="flex items-center gap-1.5">
                <motion.div
                  whileHover={{ scale: 1.2 }}
                >
                  <MessageCircle className="h-4 w-4" />
                </motion.div>
                <span>{post.reply_count}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Add a search loading state component
const SearchLoadingState = () => {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-7 w-40 bg-primary/10 rounded-lg"></div>
                      <div className="grid grid-cols-1 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-lg border border-border/50 overflow-hidden bg-muted/5">
              <div className="h-28 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10"></div>
                  <div className="h-5 w-32 bg-primary/10 rounded-md"></div>
                </div>
                <div className="h-4 w-full bg-muted/40 rounded mt-3"></div>
                <div className="h-4 w-2/3 bg-muted/40 rounded mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-7 w-24 bg-primary/10 rounded-lg"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-lg border border-border/50 overflow-hidden bg-muted/5 p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-2/3 bg-primary/10 rounded-md"></div>
                  <div className="h-4 w-24 bg-muted/40 rounded"></div>
                  <div className="h-4 w-full bg-muted/40 rounded mt-2"></div>
                  <div className="h-4 w-3/4 bg-muted/40 rounded mt-1"></div>
                  <div className="flex gap-4 mt-3">
                    <div className="h-5 w-16 bg-muted/40 rounded"></div>
                    <div className="h-5 w-16 bg-muted/40 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-7 w-24 bg-primary/10 rounded-lg"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border border-border/50 overflow-hidden bg-muted/5 p-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 mb-3"></div>
                <div className="h-5 w-20 bg-primary/10 rounded-md"></div>
                <div className="h-9 w-full bg-muted/40 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Update EmptySearchResults component
const EmptySearchResults = ({ type, query }: { type: string; query: string }) => {
  let icon;
  let title;
  let description;
  let suggestedAction;

  switch (type) {
    case 'users':
      icon = <User className="h-12 w-12 text-primary/60 mb-4" />;
      title = "No users found";
      description = `We couldn't find any users matching "${query}"`;
      suggestedAction = "Try searching for a different username";
      break;
    case 'communities':
      icon = <Users className="h-12 w-12 text-primary/60 mb-4" />;
      title = "No communities found";
      description = `We couldn't find any communities matching "${query}"`;
      suggestedAction = "Try a different community name or browse popular ones";
      break;
    case 'posts':
      icon = <MessageCircle className="h-12 w-12 text-primary/60 mb-4" />;
      title = "No posts found";
      description = `We couldn't find any posts or replies matching "${query}"`;
      suggestedAction = "Try some different keywords or check your spelling";
      break;
    default:
      icon = <SearchIcon className="h-12 w-12 text-primary/60 mb-4" />;
      title = "No results found";
      description = `We couldn't find anything matching "${query}"`;
      suggestedAction = "Try using different keywords or check your spelling";
  }

  return (
    <motion.div 
      className="text-center p-12 border border-dashed border-primary/30 rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
      <p className="text-sm text-primary mt-4">{suggestedAction}</p>
    </motion.div>
  );
};

export default SearchPage;
