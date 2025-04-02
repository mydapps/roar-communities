import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search as SearchIcon, Sparkles, Filter, ArrowUp, ArrowDown, Loader2, Lock, MessageCircle } from 'lucide-react';
import { Post } from '@/components/feed/Post';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { searchAll, searchUsers, searchCommunities, searchPosts, SearchUserItem, SearchCommunityItem, SearchPostItem, Pagination } from '@/utils/searchApi';

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
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Search</h1>
      
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities, posts, users..."
            className="pl-9 pr-16"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            ref={searchInputRef}
          />
          <kbd className="absolute right-3 top-2.5 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">{isMobile ? '' : navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}</span>K
          </kbd>
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <SearchIcon className="h-4 w-4 mr-2" />
          )}
          Search
        </Button>
      </form>
      
      {!hasSearched ? (
        <Card className="animate-fade-in">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-20">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Discover Communities and Content</h2>
            <p className="text-muted-foreground max-w-md">
              Search for communities, posts, or users to find exactly what you're looking for in the dapps.co ecosystem.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start mb-6 max-w-md">
            <TabsTrigger value="all">All Results</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6 animate-fade-in">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Communities</h2>
                    {communityResults.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => handleTabChange('communities')}>
                        View All
                      </Button>
                    )}
                  </div>
                  
                  {communityError ? (
                    <div className="text-red-500 p-2">{communityError}</div>
                  ) : communityResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {communityResults.slice(0, 2).map((community, index) => (
                        <CommunityResult key={index} community={community} />
                      ))}
                    </div>
                  ) : (
                    <EmptySearchResults type="communities" query={queryParam} />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Posts</h2>
                    {postResults.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => handleTabChange('posts')}>
                        View All
                      </Button>
                    )}
                  </div>
                  
                  {postError ? (
                    <div className="text-red-500 p-2">{postError}</div>
                  ) : postResults.length > 0 ? (
                    <div className="space-y-4">
                      {postResults.slice(0, 2).map((post, index) => (
                        <PostSearchResult 
                          key={index} 
                          post={post} 
                          onClick={() => navigate(`/c/${post.community}/${post.code}`)} 
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptySearchResults type="posts" query={queryParam} />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Users</h2>
                    {userResults.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => handleTabChange('users')}>
                        View All
                      </Button>
                    )}
                  </div>
                  
                  {userError ? (
                    <div className="text-red-500 p-2">{userError}</div>
                  ) : userResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {userResults.slice(0, 3).map((user, index) => (
                        <UserResult key={index} user={user} />
                      ))}
                    </div>
                  ) : (
                    <EmptySearchResults type="users" query={queryParam} />
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="communities" className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Community Results</h2>
            </div>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : communityError ? (
              <div className="text-red-500 p-2">{communityError}</div>
            ) : communityResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityResults.map((community, index) => (
                    <CommunityResult key={index} community={community} />
                  ))}
                </div>
                
                {communityPagination && communityPagination.has_next && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => loadMore('communities')}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptySearchResults type="communities" query={queryParam} />
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Post Results</h2>
            </div>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : postError ? (
              <div className="text-red-500 p-2">{postError}</div>
            ) : postResults.length > 0 ? (
              <>
                <div className="space-y-4">
                  {postResults.map((post, index) => (
                    <PostSearchResult 
                      key={index} 
                      post={post} 
                      onClick={() => navigate(`/c/${post.community}/${post.code}`)} 
                    />
                  ))}
                </div>
                
                {postPagination && postPagination.has_next && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => loadMore('posts')}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptySearchResults type="posts" query={queryParam} />
            )}
          </TabsContent>
          
          <TabsContent value="users" className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">User Results</h2>
            </div>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userError ? (
              <div className="text-red-500 p-2">{userError}</div>
            ) : userResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userResults.map((user, index) => (
                    <UserResult key={index} user={user} />
                  ))}
                </div>
                
                {userPagination && userPagination.has_next && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => loadMore('users')}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptySearchResults type="users" query={queryParam} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface CommunityResultProps {
  community: SearchCommunityItem;
}

const CommunityResult = ({ community }: CommunityResultProps) => {
  const pricePerShare = 0.02; // Default price - would normally come from API
  const priceChange = Math.random() * 20 - 10; // Placeholder - would normally come from API
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 animate-scale-in relative">
      {community.encrypted && (
        <Badge className="absolute right-2 top-2 bg-foreground/10 gap-1">
          <Lock className="h-3 w-3" />
          Private
        </Badge>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Link 
            to={`/c/${community.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-lg font-bold hover:text-primary transition-colors"
          >
            {community.name}
          </Link>
          {priceChange > 0 ? (
            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
              <ArrowUp className="h-3 w-3 mr-1" />
              {priceChange.toFixed(1)}%
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
              <ArrowDown className="h-3 w-3 mr-1" />
              {Math.abs(priceChange).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{community.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm">{community.members_count.toLocaleString()} members</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{pricePerShare.toFixed(3)} ETH</span> per share
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface UserResultProps {
  user: SearchUserItem;
}

const UserResult = ({ user }: UserResultProps) => {
  return (
    <Card className="hover:shadow-md transition-all duration-300 animate-scale-in">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 mb-3">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{user.handle[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <h3 className="font-medium text-lg">{user.handle}</h3>
          
          <Button className="mt-4 w-full" size="sm" asChild>
            <Link to={`/u/${user.handle.split('.')[0]}`}>View Profile</Link>
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
    <div onClick={onClick}>
      <Card className="hover:shadow-md transition-all duration-300 animate-scale-in overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback>{post.author.handle[0].toUpperCase()}</AvatarFallback>
            </Avatar>
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
          
          <p className="text-sm mb-4 line-clamp-3">{post.content}</p>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUp className="h-4 w-4" />
              {post.upvotes}
            </div>
            {post.reply_count > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {post.reply_count}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EmptySearchResults = ({ type, query }: { type: string; query: string }) => {
  let icon;
  let title;
  let description;

  switch (type) {
    case 'users':
      icon = <Users className="h-12 w-12 text-muted-foreground mb-4" />;
      title = "No users found";
      description = `We couldn't find any users matching "${query}"`;
      break;
    case 'communities':
      icon = <Users className="h-12 w-12 text-muted-foreground mb-4" />;
      title = "No communities found";
      description = `We couldn't find any communities matching "${query}"`;
      break;
    case 'posts':
      icon = <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />;
      title = "No posts found";
      description = `We couldn't find any posts or replies matching "${query}"`;
      break;
    default:
      icon = <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />;
      title = "No results found";
      description = `We couldn't find anything matching "${query}"`;
  }

  return (
    <div className="text-center p-12 border border-dashed rounded-lg animate-fade-in">
      {icon}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
      <p className="text-sm text-muted-foreground mt-2">Try using different keywords or check your spelling</p>
    </div>
  );
};

export default SearchPage;
