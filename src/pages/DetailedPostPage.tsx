import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, PostDetails, OriginalPost } from '@/utils/postApi';
import { toggleRoar } from '@/utils/api';
import { Post } from '@/components/feed/Post';
import { EnhancedCommentsSection } from '@/components/post/EnhancedCommentsSection';
import { MobileCommentsSection, MobileCommentsSectionRef } from '@/components/post/MobileCommentsSection';
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
import { AlertTriangle, Lock, MessageSquare, ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createReply, type CommentReply } from '@/utils/commentApi';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { useTip } from '@/contexts/TipContext';

// Helper function to convert HTML to plain text
const getPlainText = (htmlString: string | undefined | null): string => {
  if (!htmlString) return '';
  const sanitized = sanitizeHtml(htmlString);
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  return doc.body.textContent || "";
};

const DetailedPostPage = () => {
  usePreventZoom();
  
  const { communityId, postId, handle } = useParams<{ communityId?: string; postId: string; handle?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setOnTipSuccess } = useTip();
  
  const [post, setPost] = useState<PostDetails | null>(null);
  const [originalPost, setOriginalPost] = useState<OriginalPost | null>(null);
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [replyCount, setReplyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshingComments, setRefreshingComments] = useState(false);
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  
  // Use dapps_user_id to check login status
  const isLoggedIn = !!localStorage.getItem('dapps_user_id');
  
  // Ref for mobile comments section
  const mobileCommentsSectionRef = useRef<MobileCommentsSectionRef>(null);
  
  // Function to trigger mobile comment input
  const triggerMobileCommentInput = useCallback(() => {
    if (mobileCommentsSectionRef.current) {
      mobileCommentsSectionRef.current.triggerCommentInput();
    }
  }, []);
  
  // Handle optimistic tip success - immediately add system message to comments
  const handleTipSuccess = useCallback((tipData: {
    senderHandle: string;
    receiverHandle: string;
    amount: number;
    asset: string;
    usdValue?: number;
    parentReplyId?: number;
  }) => {
    // Create optimistic system message
    let systemMessage: string;
    if (tipData.asset === 'roar') {
      systemMessage = `🦁 @${tipData.senderHandle} tipped @${tipData.receiverHandle} ${tipData.amount} ROAR tokens!`;
    } else {
      const usdText = tipData.usdValue ? ` (~$${tipData.usdValue.toFixed(2)})` : '';
      systemMessage = `💎 @${tipData.senderHandle} tipped @${tipData.receiverHandle} ${tipData.amount} ETH${usdText}!`;
    }
    
    // Create optimistic system comment reply
    const optimisticSystemReply: CommentReply = {
      id: Date.now() + Math.random(), // Temporary optimistic ID
      uid: 0, // System user ID
      handle: 'System',
      avatar_url: '', // System has no avatar
      content: systemMessage,
      created_on: new Date().toISOString(),
      time_ago: 'just now',
      upvotes: 0,
      meow_count: 0,
      has_meowed: false,
      is_system_message: true, // Mark as system message
      sub_replies: undefined
    };
    
    if (tipData.parentReplyId) {
      // For reply tips, add as sub-reply to the tipped comment
      setReplies(prevReplies => 
        prevReplies.map(reply => {
          if (reply.id === tipData.parentReplyId) {
            return {
              ...reply,
              sub_replies: [...(reply.sub_replies || []), optimisticSystemReply]
            };
          }
          // Also check sub-replies in case it's a nested reply
          if (reply.sub_replies) {
            const updatedSubReplies = reply.sub_replies.map(subReply => {
              if (subReply.id === tipData.parentReplyId) {
                return {
                  ...subReply,
                  sub_replies: [...(subReply.sub_replies || []), optimisticSystemReply]
                };
              }
              return subReply;
            });
            if (updatedSubReplies.some(sr => sr.sub_replies?.includes(optimisticSystemReply))) {
              return { ...reply, sub_replies: updatedSubReplies };
            }
          }
          return reply;
        })
      );
    } else {
      // For post tips, add as top-level comment
      setReplies(prevReplies => [optimisticSystemReply, ...prevReplies]);
      setReplyCount(prevCount => prevCount + 1);
    }
    
    // Show success toast
    const tipText = tipData.asset === 'roar' 
      ? `${tipData.amount} ROAR tokens`
      : `${tipData.amount} ETH${tipData.usdValue ? ` ($${tipData.usdValue.toFixed(2)})` : ''}`;
    toast.success(`Successfully tipped ${tipText} to @${tipData.receiverHandle}!`, {
      description: tipData.parentReplyId ? 'Your tip reply will appear shortly' : 'Your tip comment will appear shortly'
    });
  }, [setReplies, setReplyCount]);
  
  // Set up tip success callback when component mounts
  useEffect(() => {
    setOnTipSuccess(handleTipSuccess);
  }, [setOnTipSuccess, handleTipSuccess]);
  
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
      console.log('API Response from fetchPost:', data);
      
      setPost(data.post);
      if (data.original_post) {
        setOriginalPost(data.original_post);
      }
      
      // Function to recursively map API reply structures to CommentReply
      const mapApiReplyToCommentReply = (apiReply: any): CommentReply => {
        return {
          id: apiReply.id,
          uid: apiReply.user_id,
          handle: apiReply.handle,
          avatar_url: apiReply.avatar,
          content: apiReply.content,
          created_on: apiReply.created_at,
          time_ago: apiReply.time_ago,
          upvotes: apiReply.upvotes,
          meow_count: apiReply.has_meowed ? 1 : 0,
          has_meowed: apiReply.has_meowed,
          is_system_message: apiReply.is_system_message || false, // Map system message flag
          // Check both possible field names for nested replies
          sub_replies: apiReply.sub_replies 
            ? apiReply.sub_replies.map(mapApiReplyToCommentReply)
            : apiReply.replies 
              ? apiReply.replies.map(mapApiReplyToCommentReply)
              : undefined
        };
      };
      
      const formattedReplies = data.replies?.map(mapApiReplyToCommentReply) || [];
      
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
  
  // Auto-scroll to comment if hash is present in URL
  useEffect(() => {
    const scrollToComment = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-') && replies.length > 0) {
        const commentId = hash.replace('#comment-', '');
        const element = document.getElementById(`comment-${commentId}`);
        
        if (element) {
          // Wait a bit for rendering to complete
          setTimeout(() => {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Add a temporary highlight effect
            element.classList.add('comment-highlight');
            
            // Remove highlight after animation
            setTimeout(() => {
              element.classList.remove('comment-highlight');
            }, 2000);
          }, 500);
        }
      }
    };
    
    // Scroll when replies are loaded or when the hash changes
    if (replies.length > 0) {
      scrollToComment();
    }
    
    // Listen for hash changes (when user clicks another comment link)
    const handleHashChange = () => {
      scrollToComment();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [replies]);
  
  const handleRefreshComments = useCallback(() => {
    if (refreshingComments) return;
    
    setRefreshingComments(true);
    setRefreshCount(prev => prev + 1);
    
    // Set a flag in localStorage to track the last refresh time
    const lastRefreshTime = localStorage.getItem('last_comment_refresh');
    const now = Date.now();
    
    if (lastRefreshTime && now - parseInt(lastRefreshTime) < 2000) {
      // If we refreshed less than 2 seconds ago, just reset the state without reloading
      console.log('Skipping comment refresh - too soon after last refresh');
      setTimeout(() => {
        setRefreshingComments(false);
      }, 500);
      return;
    }
    
    // Store the current refresh time
    localStorage.setItem('last_comment_refresh', now.toString());
    
    // Reset the refreshing state after a delay
    setTimeout(() => {
      setRefreshingComments(false);
    }, 1000);
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
      const response = await toggleRoar(post.code);
      
      // Check if the error is due to not being part of the community
      if (typeof response === 'object' && 'errCode' in response && response.errCode === "004") {
        console.log('User is not part of the community:', response.community);
        setCommunityName(response.community);
        setNotInCommunitySheetOpen(true);
        
        // Force refresh to ensure UI shows correct roar count (not increased)
        loadPost();
        return;
      }
      
      setRefreshCount(prev => prev + 1);
    } catch (error) {
      console.error('Error roaring post:', error);
      toast.error('Failed to update post. Please try again.');
      
      // Force refresh to ensure UI shows correct roar count (not increased)
      loadPost();
    }
  };
  
  const handleAddReply = async (content: string, parentId?: number): Promise<{
    success: boolean;
    reply_id?: number;
    parent_id?: number;
    handle?: string;
    avatar_url?: string;
    created_on?: string;
    message?: string;
  }> => {
    // Content check remains (will include appended markdown)
    if (!post || !content.trim()) return Promise.reject(new Error('Invalid input: requires content'));
    
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
      console.log(`Creating reply for post ${post.code}, parent ${parentId || 0}, content:`, content);
      
      // Call the actual API function
      const result = await createReply(post.code, content, parentId);
      
      console.log('Reply creation result:', result);
      
      if (result.success) {
        // Refresh comments after successful submission
        console.log('Reply created successfully, refreshing comments');
        // Don't immediately refresh to allow optimistic updates to work
        setTimeout(() => handleRefreshComments(), 1000);
        
        // Return the successful result for optimistic updating
        return result;
      } else {
        // Handle specific errors like not being in the community
        if (result.errCode === "004" && result.communityName) {
          setCommunityName(result.communityName);
          setNotInCommunitySheetOpen(true);
        } else {
          toast.error(result.message || 'Failed to post comment');
        }
        return Promise.reject(new Error(result.message || 'Failed to post comment'));
      }
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
            {error || `The post you\'re looking for doesn\'t exist or has been removed.`}
          </p>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  const truncateText = (text: string, maxLength = 40) => {
    if (!text || text.trim() === "") return "No content";
    const plainText = getPlainText(text);
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };
  
  const getBestContentForDisplay = (): string => {
    if (post?.is_mirror && originalPost?.body) {
      return originalPost.body;
    }
    return post?.body || "";
  };
  
  const getBestImagesForDisplay = (): string[] | undefined => {
    if (post?.is_mirror && originalPost?.images && originalPost.images.length > 0) {
      return originalPost.images;
    }
    return post?.images;
  };
  
  const plainPostTitle = getPlainText(post.title);
  const plainPostBody = getPlainText(post.body);

  const displayTitle = plainPostTitle && plainPostTitle.trim() !== "" 
    ? (plainPostTitle.length > 70 ? plainPostTitle.substring(0, 67) + '...' : plainPostTitle)
    : plainPostBody.length > 70 
      ? plainPostBody.substring(0, 67) + '...' 
      : (plainPostBody || "Untitled Post");
  
  const metaDescription = plainPostTitle && plainPostTitle.trim() !== ""
    ? `${plainPostTitle.substring(0,150)}${plainPostTitle.length > 150 ? '...' : ''} - Posted by ${post.author.handle}`
    : plainPostBody.length > 160 
      ? plainPostBody.substring(0, 157) + '...' 
      : (plainPostBody || 'View post on dapps.co');
  
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
  
  // Determine if the current user is the author of the post
  const currentUserHandle = localStorage.getItem('dapps_user_handle');
  const isAuthor = post.author?.handle === currentUserHandle;
  
  const mirrorDataForPost = post.is_mirror && originalPost ? {
    quote: post.mirror_quote || "",
    originalAuthor: originalPost.author,
    originalCommunity: originalPost.community,
    originalBody: originalPost.body,
    originalTimeAgo: originalPost.created_on, // The Post component might need to format this
    originalAvatar: originalPost.author_avatar,
    originalImages: originalPost.images,
    originalTitle: originalPost.title,
    originalPostCode: originalPost.code,
  } : undefined;
  
  return (
    <div className="max-w-2xl mx-auto pt-16 pb-20 px-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{displayTitle} | dapps.co</title>
        <meta name="title" content={`${displayTitle} | dapps.co`} />
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`${post.community || ''}, ${post.author.handle || ''}, crypto, discussion, social, dapps.co, decentralized social, community shares, web3`} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#31bcc3" />
        <meta name="author" content={post.author.handle} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={getCanonicalUrl()} />
        <meta property="og:title" content={displayTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:site_name" content="dapps.co" />
        {ogImage ? (
          <>
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={`Image from post by ${post.author.handle}`} />
          </>
        ) : (
          <>
            <meta property="og:image" content="https://dapps.co/og-image.png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="dapps.co - decentralized community network" />
          </>
        )}
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={getCanonicalUrl()} />
        <meta property="twitter:title" content={displayTitle} />
        <meta property="twitter:description" content={metaDescription} />
        <meta property="twitter:site" content="@dapps_co" />
        <meta property="twitter:creator" content={`@dapps_co`} />
        {ogImage ? (
          <meta property="twitter:image" content={ogImage} />
        ) : (
          <meta property="twitter:image" content="https://dapps.co/og-image.png" />
        )}
        
        {/* Article-specific meta tags */}
        {post.author && <meta name="author" content={post.author.handle} />}
        {post.created_at && <meta name="article:published_time" content={post.created_at} />}
        {post.community && <meta name="article:section" content={post.community} />}
        {post.author && <meta name="article:author" content={post.author.handle} />}
        
        {/* Additional structured data */}
        <meta name="post:author" content={post.author.handle} />
        {post.community && <meta name="post:community" content={post.community} />}
        <meta name="post:replies" content={replyCount.toString()} />
        <meta name="post:upvotes" content={(post.upvotes || 0).toString()} />
        
        {/* Canonical and indexing */}
        <link rel="canonical" href={getCanonicalUrl()} />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="https://dapps.co/favicon.ico" />
        
        {/* Additional helpful meta tags */}
        <meta name="application-name" content="dapps.co" />
        <meta name="msapplication-TileColor" content="#31bcc3" />
        <meta name="format-detection" content="telephone=no" />
      </Helmet>
      
      <div className="flex items-center justify-between mb-2 px-2 md:px-0">
        <Button variant="outline" size="sm" onClick={goBack} className="md:hidden">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="hidden md:block">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {post.community && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/c/${post.community}`}>{post.community}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              {(handle && !post.community) && (
                 <>
                   <BreadcrumbSeparator />
                   <BreadcrumbItem>
                     <BreadcrumbLink asChild>
                       <Link to={`/${handle}`}>{handle}</Link>
                     </BreadcrumbLink>
                   </BreadcrumbItem>
                 </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {truncateText(post.title || getPlainText(post.body) || post.code, isMobile ? 20 : 30)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      
      <div className="mb-8">
        <Post
          username={post.author?.handle || post.handle || 'Unknown'}
          community={post.community}
          timeAgo={post.timeAgo}
          content={post.body}
          roarCount={post.upvotes || 0}
          commentCount={replyCount}
          shareCount={0}
          images={post.images}
          video={undefined}
          disableNavigation={true}
          postCode={post.code}
          roared={post.has_upvoted}
          onRoar={handleRoar}
          isMirror={!!post.is_mirror}
          mirrorData={mirrorDataForPost}
          ipfs={post.ipfs}
          avatar={post.author?.avatar || post.avatar}
          hideComments={true}
          isLoggedIn={isLoggedIn}
          isAdmin={false}
          isPinned={!!post.pinned}
          is_poll={post.is_poll}
          poll_data={post.poll_data}
          onTriggerMobileCommentInput={triggerMobileCommentInput}
          onTipSuccess={handleTipSuccess}
        />
      </div>
      
      {post && (
        <>
          {!isMobile && (
            <EnhancedCommentsSection
              postCode={post.code}
              initialReplies={replies}
              initialReplyCount={replyCount}
              postAuthorHandle={post.author?.handle || (post.handle || '')}
              readOnly={false}
            />
          )}
          
          {isMobile && (
            <MobileCommentsSection
              postCode={post.code}
              postAuthorHandle={post.author?.handle || (post.handle || '')}
              replies={replies}
              onAddComment={handleAddReply}
              onRefresh={handleRefreshComments}
              readOnly={!isLoggedIn}
              ref={mobileCommentsSectionRef}
            />
          )}
          
          {/* Show sign-up CTA at bottom for non-logged-in users */}
          {!isLoggedIn && (
            <div className="mt-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-6">
              <div className="bg-primary/10 p-3 rounded-full mb-4 inline-block">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Join the conversation</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Sign up to comment, react to posts, and engage with the community
              </p>
              <Button onClick={(e) => navigateToLogin(e)} className="bg-primary hover:bg-primary/90">
                Sign Up Free
              </Button>
            </div>
          )}
        </>
      )}
      
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </div>
  );
};

export default DetailedPostPage;
