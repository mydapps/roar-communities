import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Post as PostComponent } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Flame, Clock, Globe, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPosts, Post as PostType, toggleRoar } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const FeedPage = () => {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'following' | 'global' | 'trending'>('following');
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef<boolean>(false);
  
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('FeedPage mounted - Checking auth status');
    const userKey = localStorage.getItem('dapps_user_key');
    if (!userKey) {
      console.log('No user key found, redirecting to login');
      localStorage.clear();
      navigate('/');
      return;
    }
    
    console.log('User authentication data:');
    console.log('- User key:', userKey ? `${userKey.substring(0, 5)}...` : 'None');
    console.log('- User ID:', localStorage.getItem('dapps_user_id'));
    console.log('- User registered:', localStorage.getItem('dapps_user_registered'));
    console.log('- User handle:', localStorage.getItem('dapps_user_handle'));
    
    const isRegistered = localStorage.getItem('dapps_user_registered');
    console.log('FeedPage - Registration status:', isRegistered);
    
    if (isRegistered === '0') {
      console.log('User not registered, redirecting to request-invite');
      navigate('/request-invite');
      return;
    }
  }, [navigate]);

  const loadPosts = useCallback(async (page: number, resetExisting = false) => {
    if (isLoadingRef.current) {
      console.log('Already loading posts, skipping fetch request');
      return;
    }
    
    console.log(`Loading posts for tab "${activeTab}", page ${page}, resetExisting=${resetExisting}`);
    setLoading(true);
    isLoadingRef.current = true;
    
    try {
      let fetchedPosts: PostType[] = [];
      
      if (activeTab === 'following') {
        console.log('Fetching personal/following posts');
        fetchedPosts = await fetchPosts({ page, personal: true });
      } else if (activeTab === 'global') {
        console.log('Fetching global posts');
        fetchedPosts = await fetchPosts({ page });
      } else {
        console.log('Fetching trending posts');
        fetchedPosts = await fetchPosts({ page, trending: true });
      }
      
      console.log(`Fetch complete - received ${fetchedPosts.length} posts`);
      
      if (fetchedPosts.length === 0) {
        console.log('No more posts available, setting hasMore=false');
        setHasMore(false);
      } else {
        setCurrentPage(page + 1);
        setPosts(prev => {
          const newPosts = resetExisting ? fetchedPosts : [...prev, ...fetchedPosts];
          console.log(`Total posts now: ${newPosts.length}`);
          return newPosts;
        });
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [activeTab]);

  useEffect(() => {
    console.log(`Tab changed to "${activeTab}" - resetting posts and loading page 1`);
    setPosts([]);
    setCurrentPage(1);
    setHasMore(true);
    loadPosts(1, true);
  }, [activeTab, loadPosts]);

  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }
    
    console.log('Setting up intersection observer for infinite scrolling');
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    };
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
        console.log(`Loading element is visible. hasMore=${hasMore}, loading=${isLoadingRef.current}. Loading page ${currentPage}`);
        loadPosts(currentPage);
      }
    }, options);
    
    if (loadingRef.current) {
      console.log('Observer attached to loading element');
      observer.current.observe(loadingRef.current);
    } else {
      console.log('Loading element ref not available yet');
    }
    
    return () => {
      if (observer.current) {
        console.log('Cleaning up intersection observer');
        observer.current.disconnect();
      }
    };
  }, [currentPage, hasMore, loadPosts]);

  const handleRoar = async (postCode: string, currentRoarStatus: number) => {
    console.log(`Toggling roar for post ${postCode}, current status: ${currentRoarStatus}`);
    
    setPosts(prevPosts => prevPosts.map(post => 
      post.code === postCode 
        ? { 
            ...post, 
            roar: post.roar === 1 ? 0 : 1,
            upvotes: post.roar === 1 ? post.upvotes - 1 : post.upvotes + 1 
          } 
        : post
    ));
    
    const success = await toggleRoar(postCode);
    
    if (!success) {
      console.log('Roar toggle failed, reverting UI');
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
    console.log('New post created:', newPost);
    setUserPosts([newPost, ...userPosts]);
  };
  
  console.log('Rendering FeedPage:', {
    activeTab,
    postsCount: posts.length,
    loading,
    hasMore,
    currentPage
  });

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
            
            {posts.length > 0 ? (
              posts.map(post => (
                <PostComponent
                  key={`api-post-${post.code}`}
                  username={post.handle}
                  avatar={post.avatar}
                  community={post.community}
                  timeAgo={post.timeAgo}
                  content={post.body}
                  roarCount={post.upvotes}
                  commentCount={post.comments}
                  shareCount={0}
                  images={post.images?.length > 0 ? post.images : post.image_url ? [post.image_url] : undefined}
                  roared={post.roar === 1}
                  postCode={post.code}
                  onRoar={() => handleRoar(post.code, post.roar)}
                  isMirror={post.is_mirror === 1}
                  ipfs={post.ipfs}
                  mirrorData={post.is_mirror === 1 ? {
                    quote: post.mirror_quote || '',
                    originalAuthor: post.original_author || '',
                    originalCommunity: post.original_community || '',
                    originalBody: post.original_body || '',
                    originalTimeAgo: post.original_created_on || '',
                    originalAvatar: post.original_author_avatar || ''
                  } : undefined}
                />
              ))
            ) : !loading && (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">No posts to display</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'following' 
                    ? "You're not following any communities yet, or there are no posts in your feed."
                    : `No posts available in the ${activeTab} feed right now.`}
                </p>
              </Card>
            )}
            
            <div 
              ref={loadingRef} 
              className="flex justify-center items-center py-4"
            >
              {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
            </div>
            
            {!hasMore && posts.length > 0 && !loading && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No more posts to load</p>
              </div>
            )}
          </div>
        </TabsContent>
  
        <TabsContent value="global" className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostComponent
                  key={`api-post-${post.code}`}
                  username={post.handle}
                  avatar={post.avatar}
                  community={post.community}
                  timeAgo={post.timeAgo}
                  content={post.body}
                  roarCount={post.upvotes}
                  commentCount={post.comments}
                  shareCount={0}
                  images={post.images?.length > 0 ? post.images : post.image_url ? [post.image_url] : undefined}
                  roared={post.roar === 1}
                  postCode={post.code}
                  onRoar={() => handleRoar(post.code, post.roar)}
                  isMirror={post.is_mirror === 1}
                  ipfs={post.ipfs}
                  mirrorData={post.is_mirror === 1 ? {
                    quote: post.mirror_quote || '',
                    originalAuthor: post.original_author || '',
                    originalCommunity: post.original_community || '',
                    originalBody: post.original_body || '',
                    originalTimeAgo: post.original_created_on || '',
                    originalAvatar: post.original_author_avatar || ''
                  } : undefined}
                />
              ))
            ) : !loading && (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">No posts in the global feed</h3>
                <p className="text-muted-foreground">
                  Check back later for new content
                </p>
              </Card>
            )}
            
            <div 
              ref={loadingRef} 
              className="flex justify-center items-center py-4"
            >
              {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
            </div>
            
            {!hasMore && posts.length > 0 && !loading && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No more posts to load</p>
              </div>
            )}
          </div>
        </TabsContent>
  
        <TabsContent value="trending" className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostComponent
                  key={`api-post-${post.code}`}
                  username={post.handle}
                  avatar={post.avatar}
                  community={post.community}
                  timeAgo={post.timeAgo}
                  content={post.body}
                  roarCount={post.upvotes}
                  commentCount={post.comments}
                  shareCount={0}
                  images={post.images?.length > 0 ? post.images : post.image_url ? [post.image_url] : undefined}
                  roared={post.roar === 1}
                  postCode={post.code}
                  onRoar={() => handleRoar(post.code, post.roar)}
                  isMirror={post.is_mirror === 1}
                  ipfs={post.ipfs}
                  mirrorData={post.is_mirror === 1 ? {
                    quote: post.mirror_quote || '',
                    originalAuthor: post.original_author || '',
                    originalCommunity: post.original_community || '',
                    originalBody: post.original_body || '',
                    originalTimeAgo: post.original_created_on || '',
                    originalAvatar: post.original_author_avatar || ''
                  } : undefined}
                />
              ))
            ) : !loading && (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">No trending posts right now</h3>
                <p className="text-muted-foreground">
                  Check back later for trending content
                </p>
              </Card>
            )}
            
            <div 
              ref={loadingRef} 
              className="flex justify-center items-center py-4"
            >
              {loading && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
            </div>
            
            {!hasMore && posts.length > 0 && !loading && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No more posts to load</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

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
