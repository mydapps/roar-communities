import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, PostDetails, OriginalPost } from '@/utils/postApi';
import { toggleRoar } from '@/utils/api';
import { Post } from '@/components/feed/Post';
import { EnhancedCommentsSection } from '@/components/post/EnhancedCommentsSection';
import { MobileCommentsSection } from '@/components/post/MobileCommentsSection';
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
import { AlertTriangle, Lock, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createReply, type CommentReply } from '@/utils/commentApi';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';

const DetailedPostPage = () => {
  usePreventZoom();
  
  const { communityId, postId, handle } = useParams<{ communityId?: string; postId: string; handle?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [post, setPost] = useState<PostDetails | null>(null);
  const [originalPost, setOriginalPost] = useState<OriginalPost | null>(null);
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [replyCount, setReplyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshingComments, setRefreshingComments] = useState(false);
  
  const isLoggedIn = !!localStorage.getItem('dapps_user_key');
  
  const loadPost = useCallback(async () => {
    if (!postId) {
      setError('No post ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPost(postId);
      
      setPost(data.post);
      if (data.original_post) {
        setOriginalPost(data.original_post);
      }
      
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
        window.history.replaceState(
          null, 
          '', 
          `/c/${data.post.community}/${data.post.code}`
        );
      }
      
      if (data.post && !data.post.community && !handle && data.post.author && data.post.author.handle) {
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
    if (postId) {
      loadPost();
    }
  }, [loadPost, postId]);
  
  const handleRefreshComments = useCallback(() => {
    if (refreshingComments) return;
    
    setRefreshingComments(true);
    setRefreshCount(prev => prev + 1);
    setTimeout(() => {
      setRefreshingComments(false);
    }, 500);
  }, [refreshingComments]);
  
  const handleRoar = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!post) return;
    
    if (!isLoggedIn) {
      toast.error('You need to login to roar at this post', {
        description: 'Please login or sign up to interact with posts',
        action: {
          label: 'Login',
          onClick: () => navigate('/index')
        }
      });
      return;
    }
    
    try {
      await toggleRoar(post.code);
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error('Error roaring post:', error);
      toast.error('Failed to update post. Please try again.');
    }
  };
  
  const handleAddReply = async (content: string, parentId?: number): Promise<void> => {
    if (!post || !content.trim()) return Promise.reject(new Error('Invalid input'));
    
    if (!isLoggedIn) {
      toast.error('You need to login to comment', {
        description: 'Please login or sign up to join the conversation',
        action: {
          label: 'Login',
          onClick: () => navigate('/index')
        }
      });
      return Promise.reject(new Error('Not logged in'));
    }
    
    try {
      console.log(`Creating reply to post ${post.code} with parentId ${parentId || 0} and content: ${content}`);
      await createReply(post.code, content, parentId || 0);
      handleRefreshComments();
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to post your comment. Please try again.');
      return Promise.reject(error);
    }
  };
  
  const goBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(-1);
  };
  
  const navigateToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/index');
  };
  
  if (!loading && post && post.is_encrypted && !isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
        <div className="relative backdrop-blur-md">
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center z-10">
            <div className="bg-primary/10 p-6 rounded-full mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">Encrypted Content</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              This post is encrypted and only available to logged-in members of this community.
            </p>
            <Button size="lg" onClick={navigateToLogin}>Login or Sign Up</Button>
          </div>
          
          <div className="opacity-20 pointer-events-none filter blur-md">
            <div className="h-[300px] bg-card rounded-lg mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-card rounded-md"></div>
              <div className="h-32 bg-card rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
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
  
  const truncateText = (text: string, maxLength = 40) => {
    if (!text || text.trim() === "") return "No content";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  const getBestContentForDisplay = () => {
    if (post.body && post.body.trim() !== "") {
      return post.body;
    }
    if (post.title && post.title.trim() !== "") {
      return post.title;
    }
    return "No content";
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
  
  const filteredImages = post.images?.filter(img => img !== 'https://dapps.co/dapps.png');
  
  const getCanonicalUrl = () => {
    const baseUrl = window.location.origin;
    if (post.community) {
      return `${baseUrl}/c/${post.community}/${post.code}`;
    } else if (post.author && post.author.handle) {
      return `${baseUrl}/${post.author.handle.split('.')[0]}/${post.code}`;
    }
    return window.location.href;
  };
  
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
    <div className="max-w-2xl mx-auto pt-16 pb-20 px-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
      <Helmet>
        <title>{displayTitle} | Dapps</title>
        <meta name="description" content={metaDescription} />
        
        <meta property="og:type" content="article" />
        <meta property="og:title" content={displayTitle} />
        <meta property="og:description" content={metaDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:url" content={getCanonicalUrl()} />
        <meta property="og:site_name" content="Dapps" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={displayTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <meta name="twitter:site" content="@dapps_co" />
        {post.author && <meta name="twitter:creator" content={`@${post.author.handle.split('.')[0]}`} />}
        
        <meta name="author" content={post.author.handle} />
        {post.created_at && <meta name="article:published_time" content={post.created_at} />}
        {post.community && <meta name="article:section" content={post.community} />}
        
        <link rel="canonical" href={getCanonicalUrl()} />
      </Helmet>
      
      <div className="mb-8 mt-4">
        <ScrollArea className="w-full">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap whitespace-nowrap overflow-hidden">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/feed" onClick={(e) => e.stopPropagation()}>Feed</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              
              {post?.community ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/c/${post.community}`} onClick={(e) => e.stopPropagation()}>
                        {post.community}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : post?.author && post.author.handle ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link 
                        to={`/u/${post.author.handle.split('.')[0]}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.author.handle.split('.')[0]}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : null}
              
              <BreadcrumbItem className="max-w-[200px] truncate">
                <BreadcrumbPage className="truncate">{truncateText(getBestContentForDisplay())}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ScrollArea>
      </div>
      
      {post && (
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
            images={post.images?.filter(img => img !== 'https://dapps.co/dapps.png')}
            isMirror={post.is_mirror === 1}
            mirrorData={post.is_mirror === 1 ? {
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
            hideComments={true}
            isLoggedIn={isLoggedIn}
          />
        </div>
      )}
      
      {post && isLoggedIn ? (
        <>
          {!isMobile && (
            <EnhancedCommentsSection
              postCode={post.code}
              initialReplies={replies}
              initialReplyCount={replyCount}
              postAuthorHandle={post.author?.handle || (post.handle || '')}
            />
          )}
          
          {isMobile && (
            <MobileCommentsSection
              postCode={post.code}
              postAuthorHandle={post.author?.handle || (post.handle || '')}
              replies={replies}
              onAddComment={handleAddReply}
              onRefresh={handleRefreshComments}
            />
          )}
        </>
      ) : isLoggedIn ? null : (
        <div className="relative backdrop-blur-sm py-10">
          <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Join the conversation</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Login or sign up to view and participate in the discussion
            </p>
            <Button onClick={(e) => navigateToLogin(e)}>Login or Sign Up</Button>
          </div>
          
          <div className="opacity-20 pointer-events-none filter blur-md">
            <div className="h-[200px] bg-card rounded-lg"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedPostPage;
