import React, { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResponsive } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { usePreventZoom } from '@/hooks/usePreventZoom';
import { Helmet } from 'react-helmet-async';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

// UI Components
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Post } from '@/components/feed/Post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MentionInput, MentionContent } from '@/components/ui/mention-input';

// Icons
import { ChevronLeft, RefreshCw, Send, Cat, ChevronDown, Reply } from 'lucide-react';

// Mock data for demonstration
const MOCK_POSTS = [{
  id: 'post1',
  username: 'vitalik.eth',
  community: 'ethereum-devs',
  timeAgo: '2h',
  content: "Just published a new proposal for improving gas efficiency in rollups. Check it out and let me know your thoughts!",
  roarCount: 128,
  commentCount: 32,
  shareCount: 14,
  images: ['https://picsum.photos/seed/rollups/800/600', 'https://picsum.photos/seed/ethereum/800/600']
}, {
  id: 'post2',
  username: 'satoshi.btc',
  community: 'bitcoin-core',
  timeAgo: '5h',
  content: "New research on Lightning Network throughput optimizations shows promising results. We might be able to scale to 1M TPS sooner than expected.",
  roarCount: 245,
  commentCount: 56,
  shareCount: 28
}, {
  id: 'post3',
  username: 'hayden.uni',
  community: 'defi-explorers',
  timeAgo: '1d',
  content: "Uniswap v4 will revolutionize on-chain liquidity. Here's how the new concentrated liquidity hooks work...",
  roarCount: 302,
  commentCount: 89,
  shareCount: 42,
  images: ['https://picsum.photos/seed/uniswap/800/600']
}, {
  id: 'thgvt0',
  username: 'vitalik.eth',
  community: 'ethereum-devs',
  timeAgo: '3h',
  content: "Ethereum's roadmap for 2023 includes significant improvements to layer 2 scaling and sharding technologies.",
  roarCount: 420,
  commentCount: 76,
  shareCount: 35
}, {
  id: '03qpgt',
  username: 'vitalik.eth',
  community: 'ethereum-devs',
  timeAgo: '4h',
  content: "Discussing potential EIP for improving smart contract verification with formal methods.",
  roarCount: 215,
  commentCount: 45,
  shareCount: 20,
  images: ['https://picsum.photos/seed/eip/800/600']
}, {
  id: 'zpkz3f',
  username: 'vitalik.eth',
  community: 'Ethereum Devs',
  timeAgo: '6h',
  content: "Just released new benchmarks comparing different L2 solutions. The results are fascinating!",
  roarCount: 187,
  commentCount: 42,
  shareCount: 28,
  images: ['https://picsum.photos/seed/benchmark/800/600']
}, {
  id: 'tfjhdw',
  username: 'alex.sol',
  community: 'Solana Builders',
  timeAgo: '1d',
  content: "Breaking down the latest Solana performance upgrades and what they mean for dApp developers.",
  roarCount: 156,
  commentCount: 37,
  shareCount: 23,
  images: ['https://picsum.photos/seed/solana/800/600']
}, {
  id: 'q3fx7z',
  username: 'vitalik.eth',
  community: 'Ethereum Devs',
  timeAgo: '3h',
  content: "Just finished implementing a new scaling solution that could increase throughput by 10x. Would love feedback from the community!",
  roarCount: 278,
  commentCount: 53,
  shareCount: 41,
  images: ['https://picsum.photos/seed/ethereum/800/600']
}];

// Extended mock comment type with replies
type CommentType = {
  id: string;
  username: string;
  text: string;
  timeAgo: string;
  meowCount: number;
  replies?: CommentType[];
  level: number;
};

// Mock comments data with nested replies
const MOCK_COMMENTS: CommentType[] = [{
  id: 'comment1',
  username: 'alice.lens',
  text: "This is incredibly insightful! Have you considered how this might interact with zk proofs?",
  timeAgo: '1h',
  meowCount: 15,
  level: 1,
  replies: [{
    id: 'reply1-1',
    username: 'vitalik.eth',
    text: "Great question! ZK proofs are actually a perfect complement to this approach because they can verify computation without revealing the underlying data.",
    timeAgo: '45m',
    meowCount: 12,
    level: 2,
    replies: [{
      id: 'reply1-1-1',
      username: 'alice.lens',
      text: "That makes a lot of sense. I'm working on a project that could benefit from this combination.",
      timeAgo: '30m',
      meowCount: 8,
      level: 3
    }]
  }]
}, {
  id: 'comment2',
  username: 'bob.eth',
  text: "I've been working on something similar. Would love to collaborate on this.",
  timeAgo: '45m',
  meowCount: 8,
  level: 1
}, {
  id: 'comment3',
  username: 'crypto_researcher',
  text: 'The implications for scalability are enormous. This could be a game-changer for on-chain analytics.',
  timeAgo: '30m',
  meowCount: 12,
  level: 1,
  replies: [{
    id: 'reply3-1',
    username: 'data_wizard',
    text: "Agreed! Especially when you consider the potential for real-time data processing.",
    timeAgo: '20m',
    meowCount: 5,
    level: 2
  }]
}, {
  id: 'comment4',
  username: 'defi_maxi',
  text: 'How does this compare to the solution proposed at DevCon last year?',
  timeAgo: '25m',
  meowCount: 5,
  level: 1
}, {
  id: 'comment5',
  username: 'zero_knowledge',
  text: 'I think this approach has merit, but we need to consider the privacy implications as well.',
  timeAgo: '15m',
  meowCount: 9,
  level: 1
}];

// Memoized comment component to prevent unnecessary re-renders
const MemoizedCommentWithReplies = memo(({
  comment,
  expandedReplies,
  setExpandedReplies,
  meowedComments,
  handleMeowComment,
  handleAddReply,
  submittingComment
}: {
  comment: CommentType;
  expandedReplies: Record<string, boolean>;
  setExpandedReplies: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  meowedComments: Record<string, boolean>;
  handleMeowComment: (commentId: string) => void;
  handleAddReply: (commentId: string, replyText: string) => void;
  submittingComment: boolean;
}) => {
  const [localReplyText, setLocalReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [meowAnimating, setMeowAnimating] = useState(false);
  const [meowWavesAnimation, setMeowWavesAnimation] = useState(false);
  const [meowTextAnimating, setMeowTextAnimating] = useState(false);
  const isExpanded = expandedReplies[comment.id] || false;
  const isMeowed = meowedComments[comment.id] || false;
  const handleReplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReplying(!isReplying);
  };
  const handleMeowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMeowWavesAnimation(true);
    setMeowAnimating(true);
    setMeowTextAnimating(true);
    setTimeout(() => handleMeowComment(comment.id), 10);
    setTimeout(() => setMeowWavesAnimation(false), 1000);
    setTimeout(() => setMeowAnimating(false), 1200);
    setTimeout(() => setMeowTextAnimating(false), 1500);
  };
  const handleSubmitReply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddReply(comment.id, localReplyText);
    setLocalReplyText('');
    setIsReplying(false);
  };
  const handleCancelReply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsReplying(false);
    setLocalReplyText('');
  };
  const toggleReplies = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedReplies(prev => ({
      ...prev,
      [comment.id]: !prev[comment.id]
    }));
  };
  const getIndentClass = () => {
    const level = comment.level;
    if (level === 1) return '';
    if (level === 2) return 'ml-6';
    if (level === 3) return 'ml-12';
    return 'ml-16';
  };
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  const hasReplies = comment.replies && comment.replies.length > 0;
  return <div className={`${getIndentClass()} animate-fade-in`}>
      <div className={`flex gap-3 mb-4 ${comment.level > 1 ? 'border-l-2 border-primary/20 pl-3' : ''}`}>
        <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
          <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${comment.username}`} />
          <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-medium text-foreground">
              {comment.username === 'you' ? 'you' : formatUsername(comment.username)}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{comment.timeAgo}</span>
          </div>
          <MentionContent content={comment.text} />
          <div className="mt-2.5 flex items-center gap-3">
            <Button variant={isMeowed ? "meow-active" : "meow"} size="sm" onClick={handleMeowClick} className="h-8 px-2 text-xs gap-1.5 rounded-full">
              <div className="relative">
                <div className={`transition-all duration-300 ${meowAnimating ? 'scale-125' : ''}`}>
                  <Cat className={`h-3.5 w-3.5 ${isMeowed ? 'text-amber-500' : ''}`} />
                </div>
                {meowWavesAnimation && <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-5 w-5 rounded-full bg-amber-500/30"></div>
                    <div className="animate-ping delay-75 absolute h-7 w-7 rounded-full bg-amber-500/20"></div>
                  </div>}
              </div>
              <span className={`${isMeowed || meowTextAnimating ? 'text-amber-500 font-medium' : ''}`}>
                {meowTextAnimating ? "Meow!" : comment.meowCount}
              </span>
            </Button>
            
            {comment.level < 3 && <Button variant="ghost" size="sm" onClick={handleReplyClick} className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80">
                <Reply className="h-3.5 w-3.5" />
                <span>{isReplying ? 'Cancel' : 'Reply'}</span>
              </Button>}

            {hasReplies && <Button variant="ghost" size="sm" onClick={toggleReplies} className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                <span>{isExpanded ? 'Hide replies' : `Show ${comment.replies?.length} ${comment.replies?.length === 1 ? 'reply' : 'replies'}`}</span>
              </Button>}
          </div>
          
          {isReplying && <div className="mt-3 space-y-2 bg-muted/30 p-3 rounded-lg border border-border/40">
              <MentionInput placeholder={`Reply to ${formatUsername(comment.username)}...`} value={localReplyText} onChange={setLocalReplyText} className="min-h-[60px] text-sm bg-background" minHeight="60px" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCancelReply} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmitReply} disabled={!localReplyText.trim() || submittingComment} className="h-8 text-xs gap-1">
                  <Send className="h-3.5 w-3.5" />
                  Reply
                </Button>
              </div>
            </div>}
        </div>
      </div>
      
      {hasReplies && isExpanded && <div className="space-y-4 mt-2 pl-2 border-l-2 border-primary/10">
          {comment.replies?.map(reply => <MemoizedCommentWithReplies key={reply.id} comment={reply} expandedReplies={expandedReplies} setExpandedReplies={setExpandedReplies} meowedComments={meowedComments} handleMeowComment={handleMeowComment} handleAddReply={handleAddReply} submittingComment={submittingComment} />)}
        </div>}
    </div>;
});
MemoizedCommentWithReplies.displayName = 'MemoizedCommentWithReplies';

// Helper function to get plain text and truncate
const getPlainText = (htmlString: string | undefined, maxLength?: number): string => {
  if (!htmlString) return '';
  const doc = new DOMParser().parseFromString(sanitizeHtml(htmlString), 'text/html');
  let text = doc.body.textContent || "";
  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength - 3) + '...';
  }
  return text.trim();
};

const PostPage = () => {
  usePreventZoom();
  
  const {
    communityId,
    postId
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    isMobile,
    isTablet
  } = useResponsive();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [roared, setRoared] = useState(false);
  const [roarCount, setRoarCount] = useState(0);
  const [roarAnimation, setRoarAnimation] = useState(false);
  const [roarWavesAnimation, setRoarWavesAnimation] = useState(false);
  const [roarTextAnimation, setRoarTextAnimation] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [meowedComments, setMeowedComments] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Generate metadata for SEO
  const postMetadata = useMemo(() => {
    if (!post) {
      return {
        title: 'Post | dapps.co',
        description: 'Join conversations on dapps.co. Engage with crypto communities.',
        imageUrl: 'https://dapps.co/og-default.jpg',
        url: window.location.href,
      };
    }
    
    // Get the first 160 characters of content for description (or less if content is shorter)
    const cleanContent = post.content.replace(/<[^>]*>/g, '');
    const description = cleanContent.length > 160 
      ? cleanContent.substring(0, 157) + '...' 
      : cleanContent;
    
    // Get the first image if available, otherwise use default
    const imageUrl = post.images && post.images.length > 0 
      ? post.images[0] 
      : 'https://dapps.co/og-default.jpg';
    
    const community = post.community || communityId || '';
    const author = post.username || '';
    
    const title = `${cleanContent.substring(0, 60)}${cleanContent.length > 60 ? '...' : ''} | ${author} | dapps.co`;
    const url = `${window.location.origin}/${post.community ? `c/${post.community}/` : ''}${postId}`;
    
    return { title, description, imageUrl, url, author, community };
  }, [post, communityId, postId]);
  
  // Function to handle when comment button is clicked in the Post component
  const focusCommentInput = useCallback(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);
  
  useEffect(() => {
    setTimeout(() => {
      const foundPost = MOCK_POSTS.find(p => p.id === postId) || MOCK_POSTS.find(p => p.community === communityId);
      console.log("Looking for post with ID:", postId, "or community:", communityId);
      console.log("Found post:", foundPost);
      if (foundPost) {
        setPost(foundPost);
        setRoarCount(foundPost.roarCount);
        const initialExpandState: Record<string, boolean> = {};
        const expandAllReplies = (comments: CommentType[]) => {
          comments.forEach(comment => {
            initialExpandState[comment.id] = true;
            if (comment.replies) {
              expandAllReplies(comment.replies);
            }
          });
        };
        expandAllReplies(MOCK_COMMENTS);
        setExpandedReplies(initialExpandState);
        setComments(MOCK_COMMENTS);
      }
      setLoading(false);
    }, 1000);
  }, [communityId, postId]);
  
  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    setTimeout(() => {
      const newCommentObj: CommentType = {
        id: `comment-${Date.now()}`,
        username: 'you',
        text: newComment,
        timeAgo: 'just now',
        meowCount: 0,
        level: 1
      };
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      setSubmittingComment(false);
      toast({
        title: "Comment added",
        description: "Your comment has been added to the post"
      });
    }, 500);
  }, [newComment, toast]);
  
  const handleAddReply = useCallback((commentId: string, replyText: string) => {
    if (!replyText.trim()) return;
    setSubmittingComment(true);
    setTimeout(() => {
      const updateComments = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const parentLevel = comment.level;
            if (parentLevel >= 3) return comment;
            const newReply: CommentType = {
              id: `reply-${Date.now()}`,
              username: 'you',
              text: replyText,
              timeAgo: 'just now',
              meowCount: 0,
              level: parentLevel + 1
            };
            return {
              ...comment,
              replies: comment.replies ? [...comment.replies, newReply] : [newReply]
            };
          } else if (comment.replies) {
            return {
              ...comment,
              replies: updateComments(comment.replies)
            };
          }
          return comment;
        });
      };
      setComments(prev => updateComments(prev));
      setSubmittingComment(false);
      // toast({
      //   title: "Reply added",
      //   description: "Your reply has been added to the comment"
      // });
    }, 500);
  }, [toast]);
  
  const handleMeowComment = useCallback((commentId: string) => {
    setMeowedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    setComments(prevComments => {
      const updateMeowCount = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const isMeowed = meowedComments[commentId];
            return {
              ...comment,
              meowCount: isMeowed ? comment.meowCount - 1 : comment.meowCount + 1
            };
          } else if (comment.replies) {
            return {
              ...comment,
              replies: updateMeowCount(comment.replies)
            };
          }
          return comment;
        });
      };
      return updateMeowCount(prevComments);
    });
  }, [meowedComments]);
  
  const handleRoar = useCallback(() => {
    const newRoared = !roared;
    setRoared(newRoared);
    setRoarCount(prev => newRoared ? prev + 1 : prev - 1);
    if (newRoared) {
      setRoarWavesAnimation(true);
      setTimeout(() => setRoarAnimation(true), 50);
      setTimeout(() => setRoarTextAnimation(true), 100);
      setTimeout(() => setRoarWavesAnimation(false), 1500);
      setTimeout(() => setRoarAnimation(false), 1800);
      setTimeout(() => setRoarTextAnimation(false), 2000);
    }
    toast({
      title: newRoared ? "Post roared!" : "Roar removed",
      description: newRoared ? "You've roared at this post" : "You've removed your roar from this post"
    });
  }, [roared, toast]);
  
  const goBack = () => {
    navigate(-1);
  };
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const truncateTitle = (content: string | undefined, maxLength = 30): string => {
    const plainText = getPlainText(content);
    if (!plainText) return '';
    if (plainText.length > maxLength) {
      return plainText.substring(0, maxLength - 3) + '...';
    }
    return plainText;
  };
  
  const pageTitle = post ? `${truncateTitle(post.content, 50)} - Roar` : 'Post - Roar';
  const metaDescription = post ? getPlainText(post.content, 160) : 'View the post and comments on Roar.';
  const metaTitle = post ? getPlainText(post.content, 70) : 'Roar Post';
  
  if (loading) {
    return <div className="space-y-6 animate-fade-in">
        <Helmet>
          <title>Loading Post | dapps.co</title>
          <meta name="description" content="Loading post content on dapps.co, the crypto social platform." />
        </Helmet>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-md" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-[90%]" />
          <Skeleton className="h-5 w-[70%]" />
        </div>
      </div>;
  }
  
  if (!post) {
    return <div className="flex flex-col items-center justify-center py-12 text-center">
        <Helmet>
          <title>Post Not Found | dapps.co</title>
          <meta name="description" content="The requested post could not be found on dapps.co" />
          <meta property="og:title" content="Post Not Found | dapps.co" />
          <meta property="og:description" content="The requested post could not be found on dapps.co" />
        </Helmet>
        <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The post with ID "{postId}" in community "{communityId}" doesn't exist or has been removed.
        </p>
        <Button onClick={goBack}>Go Back</Button>
      </div>;
  }
  
  return <div className="max-w-full overflow-x-hidden animate-fade-in">
      {/* SEO Metadata */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={postMetadata.imageUrl} />
        <meta property="og:url" content={postMetadata.url} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="dapps.co" />
        
        {/* Article specific tags */}
        {postMetadata.author && <meta property="article:author" content={postMetadata.author} />}
        {postMetadata.community && <meta property="article:section" content={postMetadata.community} />}
        <meta property="article:published_time" content={post?.timeAgo ? new Date().toISOString() : undefined} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={postMetadata.imageUrl} />
        
        {/* Additional Meta Tags */}
        <meta name="keywords" content={`${postMetadata.community}, ${postMetadata.author}, crypto, discussion, social, dapps.co`} />
        <meta name="author" content={postMetadata.author || 'dapps.co'} />
        <link rel="canonical" href={postMetadata.url} />
      </Helmet>

      <div className="mb-6">
        <ScrollArea className="w-full">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/c/${communityId}`}>{communityId}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{truncateTitle(post.content)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ScrollArea>
      </div>
      
      <div className="mb-8">
        <Post 
          username={post.username} 
          community={post.community} 
          timeAgo={post.timeAgo} 
          content={post.content} 
          roarCount={roarCount} 
          commentCount={comments.length} 
          shareCount={post.shareCount} 
          images={post.images} 
          video={post.video} 
          disableNavigation={true}
          onToggleComments={focusCommentInput}
        />
      </div>
      
      <div className="space-y-6 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
          <div className="flex gap-2">
            
            <Button variant="ghost" size="sm" className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        
        <div className="flex gap-3 bg-muted/20 p-4 rounded-lg border border-border/40 hover:border-border/60 transition-colors">
          <Avatar className="h-10 w-10 shrink-0 border border-muted/60">
            <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <MentionInput 
              ref={commentInputRef}
              placeholder="Add a comment..." 
              className="resize-none bg-background" 
              value={newComment} 
              onChange={setNewComment} 
              minHeight="80px" 
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={!newComment.trim() || submittingComment} className="gap-1.5">
                <Send className="h-4 w-4" />
                Comment
              </Button>
            </div>
          </div>
        </div>
        
        {comments.length > 0 ? <div className="space-y-6 pt-4 divide-y divide-border/20">
            {comments.map(comment => <div key={comment.id} className="pt-6 first:pt-0">
                <MemoizedCommentWithReplies comment={comment} expandedReplies={expandedReplies} setExpandedReplies={setExpandedReplies} meowedComments={meowedComments} handleMeowComment={handleMeowComment} handleAddReply={handleAddReply} submittingComment={submittingComment} />
              </div>)}
          </div> : <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>}
      </div>
    </div>;
};

export default PostPage;
