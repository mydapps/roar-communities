
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Post as PostComponent } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Flame, Clock, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPosts, Post as PostType, toggleRoar } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const FeedPage = () => {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'following' | 'global' | 'trending'>('following');
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    // Check if user key exists
    const userKey = localStorage.getItem('dapps_user_key');
    if (!userKey) {
      console.log('No user key found, redirecting to login');
      localStorage.clear();
      navigate('/');
      return;
    }
    
    // Check if user is registered - only redirect if explicitly set to "0"
    const isRegistered = localStorage.getItem('dapps_user_registered');
    console.log('FeedPage - Registration status:', isRegistered);
    
    if (isRegistered === '0') {
      console.log('User not registered, redirecting to request-invite');
      navigate('/request-invite');
      return;
    }
  }, [navigate]);

  // Fetch posts based on active tab
  const loadPosts = useCallback(async (page: number, resetExisting = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      let fetchedPosts: PostType[];
      
      if (activeTab === 'following') {
        fetchedPosts = await fetchPosts({ page, personal: true });
      } else if (activeTab === 'global') {
        fetchedPosts = await fetchPosts({ page });
      } else {
        fetchedPosts = await fetchPosts({ page, trending: true });
      }
      
      if (fetchedPosts.length === 0) {
        setHasMore(false);
      } else {
        // Update page for the next request
        setCurrentPage(page + 1);
        
        // Update posts state
        setPosts(prev => resetExisting ? fetchedPosts : [...prev, ...fetchedPosts]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, loading]);

  // Initial posts load when tab changes
  useEffect(() => {
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    loadPosts(1, true);
  }, [activeTab, loadPosts]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPosts(currentPage);
      }
    }, options);
    
    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [currentPage, hasMore, loading, loadPosts]);

  // Handle toggling roar (upvote) status
  const handleRoar = async (postCode: string, currentRoarStatus: number) => {
    const success = await toggleRoar(postCode);
    
    if (success) {
      // Update local state to reflect the change immediately
      setPosts(prevPosts => prevPosts.map(post => 
        post.code === postCode 
          ? { 
              ...post, 
              roar: post.roar === 1 ? 0 : 1,
              upvotes: post.roar === 1 ? post.upvotes - 1 : post.upvotes + 1 
            } 
          : post
      ));
    }
  };

  const handlePostCreated = (newPost: any) => {
    setUserPosts([newPost, ...userPosts]);
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="following" 
        className="w-full"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'following' | 'global' | 'trending')}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Feed</h1>
            <Badge variant="outline" className="bg-secondary/30">
              <Sparkles className="h-3 w-3 mr-1" /> Live
            </Badge>
          </div>
          <TabsList className="bg-muted/80 backdrop-blur-sm w-full md:w-auto">
            <TabsTrigger value="following" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Following</span>
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>Global</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              <span>Trending</span>
            </TabsTrigger>
          </TabsList>
        </div>
  
        <TabsContent value="following" className="space-y-6 animate-fade-in">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What's on your mind?
              </h2>
              <CreatePostCard onPostCreated={handlePostCreated} />
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            {/* User created posts at the top */}
            {userPosts.map((post, index) => (
              <PostComponent 
                key={`user-post-${index}`}
                username={post.username}
                community={post.community}
                timeAgo={post.timeAgo}
                content={post.content}
                roarCount={post.roarCount}
                commentCount={post.commentCount}
                shareCount={post.shareCount}
                images={post.images}
                video={post.video}
              />
            ))}
            
            {/* API fetched posts */}
            {posts.map(post => (
              <PostComponent
                key={`api-post-${post.code}`}
                username={post.handle}
                community={post.community}
                timeAgo={post.timeAgo}
                content={post.body}
                roarCount={post.upvotes}
                commentCount={post.comments}
                shareCount={0}
                images={post.images.length > 0 ? post.images : post.image_url ? [post.image_url] : undefined}
                roared={post.roar === 1}
                postCode={post.code}
                onRoar={() => handleRoar(post.code, post.roar)}
                isMirror={post.is_mirror === 1}
                mirrorData={post.is_mirror === 1 ? {
                  quote: post.mirror_quote || '',
                  originalAuthor: post.original_author || '',
                  originalCommunity: post.original_community || '',
                  originalBody: post.original_body || '',
                  originalTimeAgo: post.original_created_on || '',
                  originalAvatar: post.original_author_avatar || ''
                } : undefined}
              />
            ))}
            
            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef} 
                className="flex justify-center items-center py-4"
              >
                {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
              </div>
            )}
            
            {/* No more posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No more posts to load</p>
              </div>
            )}
            
            {/* Empty state */}
            {!hasMore && posts.length === 0 && !loading && (
              <Card className="p-6 text-center">
                <h3 className="text-xl font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a post in your feed!
                </p>
                <Button onClick={() => document.getElementById('create-post-textarea')?.focus()}>
                  Create Post
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>
  
        <TabsContent value="global" className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            {/* API fetched posts */}
            {posts.map(post => (
              <PostComponent
                key={`api-post-${post.code}`}
                username={post.handle}
                community={post.community}
                timeAgo={post.timeAgo}
                content={post.body}
                roarCount={post.upvotes}
                commentCount={post.comments}
                shareCount={0}
                images={post.images.length > 0 ? post.images : post.image_url ? [post.image_url] : undefined}
                roared={post.roar === 1}
                postCode={post.code}
                onRoar={() => handleRoar(post.code, post.roar)}
                isMirror={post.is_mirror === 1}
                mirrorData={post.is_mirror === 1 ? {
                  quote: post.mirror_quote || '',
                  originalAuthor: post.original_author || '',
                  originalCommunity: post.original_community || '',
                  originalBody: post.original_body || '',
                  originalTimeAgo: post.original_created_on || '',
                  originalAvatar: post.original_author_avatar || ''
                } : undefined}
              />
            ))}
            
            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef} 
                className="flex justify-center items-center py-4"
              >
                {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
              </div>
            )}
            
            {/* No more posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No more posts to load</p>
              </div>
            )}
            
            {/* Empty state */}
            {!hasMore && posts.length === 0 && !loading && (
              <Card className="p-6 text-center">
                <h3 className="text-xl font-medium mb-2">No posts in the global feed</h3>
                <p className="text-muted-foreground">
                  Check back later for new content
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
  
        <TabsContent value="trending" className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            {/* API fetched posts */}
            {posts.map(post => (
              <PostComponent
                key={`api-post-${post.code}`}
                username={post.handle}
                community={post.community}
                timeAgo={post.timeAgo}
                content={post.body}
                roarCount={post.upvotes}
                commentCount={post.comments}
                shareCount={0}
                images={post.images.length > 0 ? post.images : post.image_url ? [post.image_url] : undefined}
                roared={post.roar === 1}
                postCode={post.code}
                onRoar={() => handleRoar(post.code, post.roar)}
                isMirror={post.is_mirror === 1}
                mirrorData={post.is_mirror === 1 ? {
                  quote: post.mirror_quote || '',
                  originalAuthor: post.original_author || '',
                  originalCommunity: post.original_community || '',
                  originalBody: post.original_body || '',
                  originalTimeAgo: post.original_created_on || '',
                  originalAvatar: post.original_author_avatar || ''
                } : undefined}
              />
            ))}
            
            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef} 
                className="flex justify-center items-center py-4"
              >
                {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
              </div>
            )}
            
            {/* No more posts indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No more posts to load</p>
              </div>
            )}
            
            {/* Empty state */}
            {!hasMore && posts.length === 0 && !loading && (
              <Card className="p-6 text-center">
                <h3 className="text-xl font-medium mb-2">No trending posts right now</h3>
                <p className="text-muted-foreground">
                  Check back later for trending content
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Enhanced Community Badge component
export const CommunityBadge = ({ name }: { name: string }) => {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Link to={`/c/${slug}`}>
      <Badge 
        variant="outline" 
        className="bg-primary/10 hover:bg-primary/20 transition-colors duration-200 hover:border-primary/40 cursor-pointer group overflow-hidden relative"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 group-hover:animate-pulse opacity-0 group-hover:opacity-100"></span>
        <span className="relative z-10">{name}</span>
      </Badge>
    </Link>
  );
};

export default FeedPage;
