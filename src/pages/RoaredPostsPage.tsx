import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Heart, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchUserUpvotedPosts, Post } from '@/utils/postApi';
import { Post as PostComponent } from '@/components/feed/Post';
import { TipProvider } from '@/contexts/TipContext';
import { toast } from 'sonner';

const RoaredPostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const loadPosts = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const newPosts = await fetchUserUpvotedPosts(page);
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      // Check if there are more posts (assuming 10 per page)
      setHasMorePosts(newPosts.length === 10);
      setCurrentPage(page);

    } catch (err: any) {
      console.error('Error loading roared posts:', err);
      setError(err.message || 'Failed to load your roared posts');
      if (err.message?.includes('Authentication required')) {
        toast.error('Please sign in to view your roared posts');
        navigate('/');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMorePosts) {
      loadPosts(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    loadPosts(1, false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your roared posts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h1 className="text-2xl font-bold">Roared Posts</h1>
            </div>
          </div>

          <Card className="text-center p-8">
            <CardContent>
              <div className="text-destructive mb-4">
                <p className="font-medium">Oops! Something went wrong</p>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h1 className="text-2xl font-bold">Roared Posts</h1>
              {posts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {posts.length} post{posts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Content */}
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center p-8">
              <CardContent>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Roared Posts Yet</h3>
                <p className="text-muted-foreground mb-6">
                  When you roar (upvote) posts, they'll appear here so you can easily find them again.
                </p>
                <Button onClick={() => navigate('/feed')} className="gap-2">
                  <Heart className="h-4 w-4" />
                  Explore Posts
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <TipProvider>
            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PostComponent
                    username={post.handle}
                    community={post.community}
                    timeAgo={post.timeAgo}
                    content={post.body}
                    upvoteCount={post.upvotes}
                    hasRoared={post.roar === 1} // Always true for roared posts
                    avatar={post.avatar}
                    postCode={post.code}
                    commentCount={post.reply_count}
                    tipCount={0} // You can add tip count logic here if available
                    hasUserTipped={post.has_tipped === 1}
                    allImages={post.images}
                    isPinned={post.pinned === 1}
                    is_poll={post.is_poll}
                    poll_data={post.poll_data}
                  />
                </motion.div>
              ))}

              {/* Load More Button */}
              {hasMorePosts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center pt-4"
                >
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Posts'
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </TipProvider>
        )}
      </div>
    </div>
  );
};

export default RoaredPostsPage;