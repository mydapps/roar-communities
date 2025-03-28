
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, PostDetails, OriginalPost } from '@/utils/postApi';
import { toggleRoar } from '@/utils/api';
import { Post } from '@/components/feed/Post';
import { EnhancedCommentsSection } from '@/components/post/EnhancedCommentsSection';
import { Helmet } from 'react-helmet-async';
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
import { AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createReply, type CommentReply } from '@/utils/commentApi';

const DetailedPostPage = () => {
  const { communityId, postId, handle } = useParams<{ communityId?: string; postId: string; handle?: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<PostDetails | null>(null);
  const [originalPost, setOriginalPost] = useState<OriginalPost | null>(null);
  const [replies, setReplies] = useState<CommentReply[]>([]);
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
      if (data.original_post) {
        setOriginalPost(data.original_post);
      }
      
      // Convert replies to CommentReply format
      const formattedReplies = data.replies?.map(reply => ({
        id: reply.id,
        uid: reply.user_id,
        handle: reply.handle,
        avatar_url: reply.avatar,
        content: reply.content,
        created_on: reply.created_at,
        time_ago: reply.time_ago,
        upvotes: reply.upvotes,
        meow_count: reply.has_meowed ? 1 : 0,
        has_meowed: reply.has_meowed,
        sub_replies: reply.replies?.map(subReply => ({
          id: subReply.id,
          uid: subReply.user_id,
          handle: subReply.handle,
          avatar_url: subReply.avatar,
          content: subReply.content,
          created_on: subReply.created_at,
          time_ago: subReply.time_ago,
          upvotes: subReply.upvotes,
          meow_count: subReply.has_meowed ? 1 : 0,
          has_meowed: subReply.has_meowed
        }))
      })) || [];
      
      setReplies(formattedReplies as CommentReply[]);
      setReplyCount(data.reply_count || 0);
      
      if (data.post && data.post.community && !communityId) {
        // Don't use navigate with replace as it causes issues
        // Only update URL if needed without forcing a redirect
        window.history.replaceState(
          null, 
          '', 
          `/c/${data.post.community}/${data.post.code}`
        );
      }
      
      if (data.post && !data.post.community && !handle && data.post.author && data.post.author.handle) {
        // Only update URL if needed without forcing a redirect
        window.history.replaceState(
          null,
          '',
          `/${data.post.author.handle.split('.')[0]}/${data.post.code}`
        );
      }
    } catch (error) {
      console.error('Error loading post:', error);
      setError('Failed to load the post. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postId, communityId, handle]);
  
  useEffect(() => {
    loadPost();
  }, [loadPost]);
  
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
      handleRefreshComments();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to post your comment. Please try again.');
      throw error;
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
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
  
  const truncateTitle = (text: string, maxLength = 30) => {
    if (!text || text.trim() === "") return "Untitled Post";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  const displayTitle = post.title && post.title.trim() !== "" 
    ? post.title 
    : post.body.length > 50 
      ? post.body.substring(0, 50) + '...' 
      : post.body || "Untitled Post";
  
  const metaDescription = post.title
    ? `${post.title} - Posted by ${post.author.handle}`
    : post.body.length > 150 
      ? post.body.substring(0, 150) + '...' 
      : post.body;
  
  const ogImage = post.featured_image || (post.images && post.images.length > 0 && post.images[0] !== 'https://dapps.co/dapps.png' ? post.images[0] : '');
  
  // Filter out default dapps logo from images
  const filteredImages = post.images?.filter(img => img !== 'https://dapps.co/dapps.png');
  
  // Get canonical URL
  const getCanonicalUrl = () => {
    const baseUrl = window.location.origin;
    if (post.community) {
      return `${baseUrl}/c/${post.community}/${post.code}`;
    } else if (post.author && post.author.handle) {
      return `${baseUrl}/${post.author.handle.split('.')[0]}/${post.code}`;
    }
    return window.location.href;
  };
  
  // Prepare mirror data if the post is a mirror
  const mirrorData = post.is_mirror === 1 ? {
    quote: post.mirror_quote || '',
    originalAuthor: post.original_author || '',
    originalCommunity: post.original_community || '',
    originalBody: post.original_body || '',
    originalTimeAgo: post.original_created_on || '',
    originalAvatar: post.original_author_avatar || '',
    originalImages: post.original_images || [],
    originalTitle: post.original_title || ''
  } : undefined;
  
  return (
    <div className="max-w-2xl mx-auto pt-16 pb-20 px-4 animate-in fade-in">
      <Helmet>
        <title>{displayTitle} | Dapps</title>
        <meta name="description" content={metaDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={displayTitle} />
        <meta property="og:description" content={metaDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:url" content={getCanonicalUrl()} />
        <meta property="og:site_name" content="Dapps" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={displayTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <meta name="twitter:site" content="@dapps_co" />
        {post.author && <meta name="twitter:creator" content={`@${post.author.handle.split('.')[0]}`} />}
        
        {/* Additional SEO */}
        <meta name="author" content={post.author.handle} />
        {post.created_at && <meta name="article:published_time" content={post.created_at} />}
        {post.community && <meta name="article:section" content={post.community} />}
        
        <link rel="canonical" href={getCanonicalUrl()} />
      </Helmet>
      
      <div className="mb-8 mt-4">
        <ScrollArea className="w-full">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/feed">Feed</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              
              {post.community ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/c/${post.community}`}>{post.community}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : post.author && post.author.handle ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/u/${post.author.handle.split('.')[0]}`}>
                        {post.author.handle.split('.')[0]}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : null}
              
              <BreadcrumbItem>
                <BreadcrumbPage>{truncateTitle(displayTitle)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ScrollArea>
      </div>
      
      <div className="mb-8">
        <Post
          username={post.author?.handle || (post.handle || '')}
          avatar={post.author?.avatar || (post.avatar || '')}
          community={post.community || undefined}
          timeAgo={post.time_ago || (post.timeAgo || '')}
          content={post.body}
          roarCount={post.upvotes}
          commentCount={replyCount}
          shareCount={0}
          postCode={post.code}
          roared={post.has_upvoted}
          onRoar={handleRoar}
          images={filteredImages}
          isMirror={post.is_mirror === 1}
          mirrorData={mirrorData}
          ipfs={post.ipfs}
          disableNavigation={true}
          hideComments={true}
        />
      </div>
      
      <EnhancedCommentsSection
        postCode={post.code}
        initialReplies={replies}
        initialReplyCount={replyCount}
        postAuthorHandle={post.author?.handle || (post.handle || '')}
      />
    </div>
  );
};

export default DetailedPostPage;
