
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, PostDetails, Reply, createReply } from '@/utils/postApi';
import { toggleRoar } from '@/utils/api';
import { Post } from '@/components/feed/Post';
import { CommentsSection } from '@/components/post/CommentsSection';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const DetailedPostPage = () => {
  const { communityId, postId } = useParams<{ communityId?: string; postId: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<PostDetails | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyCount, setReplyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshingComments, setRefreshingComments] = useState(false);
  
  const loadPost = useCallback(async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPost(postId);
      
      setPost(data.post);
      setReplies(data.replies || []);
      setReplyCount(data.reply_count || 0);
      
      // If the post has a community but we accessed it via /post/:postId,
      // redirect to the proper URL with community
      if (data.post.community && !communityId) {
        navigate(`/c/${data.post.community}/${data.post.code}`, { replace: true });
      }
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Failed to load the post. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postId, communityId, navigate]);
  
  // Load post on initial render and when refreshCount changes
  useEffect(() => {
    loadPost();
  }, [loadPost, refreshCount]);
  
  const handleRefreshComments = useCallback(() => {
    if (refreshingComments) return;
    
    setRefreshingComments(true);
    setRefreshCount(prev => prev + 1);
    setTimeout(() => {
      setRefreshingComments(false);
    }, 500);
  }, [refreshingComments]);
  
  const handleRoar = async () => {
    if (!post) return;
    
    try {
      await toggleRoar(post.code);
      // Refresh the post to get the updated roar status
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error('Error roaring post:', error);
      toast.error('Failed to update post. Please try again.');
    }
  };
  
  const handleAddReply = async (parentId: number, content: string): Promise<void> => {
    if (!post || !content.trim()) return;
    
    try {
      await createReply(post.code, content, parentId);
      // Refresh comments to show the new reply
      handleRefreshComments();
      // Don't return a boolean value here, this function should return void
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to post your comment. Please try again.');
      throw error;
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pt-8 pb-20 px-4 space-y-6 animate-in fade-in">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-36" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || `The post you're looking for doesn't exist or has been removed.`}
          </p>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  // Format title for breadcrumb
  const truncateTitle = (text: string, maxLength = 30) => {
    if (!text || text.trim() === "") return "Untitled Post";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  const displayTitle = post.title && post.title.trim() !== "" 
    ? post.title 
    : post.body.length > 50 
      ? post.body.substring(0, 50) + '...' 
      : post.body || "Untitled Post";
  
  return (
    <div className="max-w-2xl mx-auto pt-8 pb-20 px-4 animate-in fade-in">
      <div className="mb-6">
        <ScrollArea className="w-full">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/feed">Feed</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              
              {post.community && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/c/${post.community}`}>{post.community}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              
              <BreadcrumbItem>
                <BreadcrumbPage>{truncateTitle(displayTitle)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ScrollArea>
      </div>
      
      <div className="mb-8">
        <Post
          username={post.author.handle}
          avatar={post.author.avatar}
          community={post.community || undefined}
          timeAgo={post.time_ago}
          content={post.body}
          roarCount={post.upvotes}
          commentCount={replyCount}
          shareCount={0}
          postCode={post.code}
          roared={post.has_upvoted}
          onRoar={handleRoar}
          images={post.images || (post.featured_image ? [post.featured_image] : undefined)}
          isMirror={post.is_mirror}
          mirrorData={post.is_mirror ? {
            quote: post.mirror_quote || '',
            originalAuthor: post.original_author || '',
            originalCommunity: post.original_community || '',
            originalBody: post.original_body || '',
            originalTimeAgo: post.original_created_on || '',
            originalAvatar: post.original_author_avatar || '',
            originalImages: post.original_images || [],
            originalTitle: post.original_title || ''
          } : undefined}
          ipfs={post.ipfs}
          disableNavigation={true}
        />
      </div>
      
      <CommentsSection
        postCode={post.code}
        replies={replies}
        replyCount={replyCount}
        onAddReply={handleAddReply}
        onRefresh={handleRefreshComments}
        loading={refreshingComments}
      />
    </div>
  );
};

export default DetailedPostPage;
