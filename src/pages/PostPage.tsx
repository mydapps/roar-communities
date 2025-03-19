
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResponsive } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Post } from '@/components/feed/Post';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Icons
import { ChevronLeft, RefreshCw, MessageCircle, Send, Cat, ChevronDown, Reply } from 'lucide-react';

// Mock data for demonstration
const MOCK_POSTS = [
  {
    id: 'post1',
    username: 'vitalik.eth',
    community: 'ethereum-devs',
    timeAgo: '2h',
    content: "Just published a new proposal for improving gas efficiency in rollups. Check it out and let me know your thoughts!",
    roarCount: 128,
    commentCount: 32,
    shareCount: 14,
    images: [
      'https://picsum.photos/seed/rollups/800/600',
      'https://picsum.photos/seed/ethereum/800/600'
    ]
  },
  {
    id: 'post2',
    username: 'satoshi.btc',
    community: 'bitcoin-core',
    timeAgo: '5h',
    content: "New research on Lightning Network throughput optimizations shows promising results. We might be able to scale to 1M TPS sooner than expected.",
    roarCount: 245,
    commentCount: 56,
    shareCount: 28
  },
  {
    id: 'post3',
    username: 'hayden.uni',
    community: 'defi-explorers',
    timeAgo: '1d',
    content: "Uniswap v4 will revolutionize on-chain liquidity. Here's how the new concentrated liquidity hooks work...",
    roarCount: 302,
    commentCount: 89,
    shareCount: 42,
    images: [
      'https://picsum.photos/seed/uniswap/800/600'
    ]
  },
  {
    id: 'thgvt0',
    username: 'vitalik.eth',
    community: 'ethereum-devs',
    timeAgo: '3h',
    content: "Ethereum's roadmap for 2023 includes significant improvements to layer 2 scaling and sharding technologies.",
    roarCount: 420,
    commentCount: 76,
    shareCount: 35
  },
  {
    id: '03qpgt',
    username: 'vitalik.eth',
    community: 'ethereum-devs',
    timeAgo: '4h',
    content: "Discussing potential EIP for improving smart contract verification with formal methods.",
    roarCount: 215,
    commentCount: 45,
    shareCount: 20,
    images: [
      'https://picsum.photos/seed/eip/800/600'
    ]
  },
  {
    id: 'zpkz3f',
    username: 'vitalik.eth',
    community: 'Ethereum Devs',
    timeAgo: '6h',
    content: "Just released new benchmarks comparing different L2 solutions. The results are fascinating!",
    roarCount: 187,
    commentCount: 42,
    shareCount: 28,
    images: [
      'https://picsum.photos/seed/benchmark/800/600'
    ]
  },
  {
    id: 'tfjhdw',
    username: 'alex.sol',
    community: 'Solana Builders',
    timeAgo: '1d',
    content: "Breaking down the latest Solana performance upgrades and what they mean for dApp developers.",
    roarCount: 156,
    commentCount: 37,
    shareCount: 23,
    images: [
      'https://picsum.photos/seed/solana/800/600'
    ]
  },
  {
    id: 'q3fx7z',
    username: 'vitalik.eth',
    community: 'Ethereum Devs',
    timeAgo: '3h',
    content: "Just finished implementing a new scaling solution that could increase throughput by 10x. Would love feedback from the community!",
    roarCount: 278,
    commentCount: 53,
    shareCount: 41,
    images: [
      'https://picsum.photos/seed/ethereum/800/600'
    ]
  }
];

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
const MOCK_COMMENTS: CommentType[] = [
  { 
    id: 'comment1',
    username: 'alice.lens',
    text: "This is incredibly insightful! Have you considered how this might interact with zk proofs?",
    timeAgo: '1h',
    meowCount: 15,
    level: 1,
    replies: [
      {
        id: 'reply1-1',
        username: 'vitalik.eth',
        text: "Great question! ZK proofs are actually a perfect complement to this approach because they can verify computation without revealing the underlying data.",
        timeAgo: '45m',
        meowCount: 12,
        level: 2,
        replies: [
          {
            id: 'reply1-1-1',
            username: 'alice.lens',
            text: "That makes a lot of sense. I'm working on a project that could benefit from this combination.",
            timeAgo: '30m',
            meowCount: 8,
            level: 3
          }
        ]
      }
    ]
  },
  {
    id: 'comment2',
    username: 'bob.eth',
    text: "I've been working on something similar. Would love to collaborate on this.",
    timeAgo: '45m',
    meowCount: 8,
    level: 1
  },
  {
    id: 'comment3',
    username: 'crypto_researcher',
    text: 'The implications for scalability are enormous. This could be a game-changer for on-chain analytics.',
    timeAgo: '30m',
    meowCount: 12,
    level: 1,
    replies: [
      {
        id: 'reply3-1',
        username: 'data_wizard',
        text: "Agreed! Especially when you consider the potential for real-time data processing.",
        timeAgo: '20m',
        meowCount: 5,
        level: 2
      }
    ]
  },
  { 
    id: 'comment4', 
    username: 'defi_maxi', 
    text: 'How does this compare to the solution proposed at DevCon last year?', 
    timeAgo: '25m', 
    meowCount: 5,
    level: 1
  },
  { 
    id: 'comment5', 
    username: 'zero_knowledge', 
    text: 'I think this approach has merit, but we need to consider the privacy implications as well.', 
    timeAgo: '15m', 
    meowCount: 9,
    level: 1
  }
];

const PostPage = () => {
  const { communityId, postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  // Show all replies by default
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Cache of meow states to prevent re-renders
  const [meowedComments, setMeowedComments] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    setTimeout(() => {
      // Find post by ID first, then by community as fallback
      const foundPost = MOCK_POSTS.find(p => p.id === postId) || 
                        MOCK_POSTS.find(p => p.community === communityId);
      
      console.log("Looking for post with ID:", postId, "or community:", communityId);
      console.log("Found post:", foundPost);
      
      if (foundPost) {
        setPost(foundPost);
        setRoarCount(foundPost.roarCount);
        
        // Pre-expand all replies by default
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
  
  // Function to add a comment to the top level
  const handleAddComment = () => {
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
        description: "Your comment has been added to the post",
      });
    }, 500);
  };

  // Helper function to find a comment by its ID (at any nesting level)
  const findCommentById = (
    commentId: string, 
    commentsArray: CommentType[]
  ): CommentType | null => {
    for (const comment of commentsArray) {
      if (comment.id === commentId) {
        return comment;
      }
      
      if (comment.replies) {
        const found = findCommentById(commentId, comment.replies);
        if (found) return found;
      }
    }
    
    return null;
  };

  // Function to add a reply to a specific comment
  const handleAddReply = (commentId: string, replyText: string) => {
    if (!replyText.trim()) return;
    
    setSubmittingComment(true);
    
    setTimeout(() => {
      // Create a deep copy of the comments state
      const updateComments = (comments: CommentType[]): CommentType[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            const parentLevel = comment.level;
            // Don't allow replies beyond level 3
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
      
      setComments(updateComments);
      setSubmittingComment(false);
      
      toast({
        title: "Reply added",
        description: "Your reply has been added to the comment",
      });
    }, 500);
  };
  
  // Function to handle meow on a comment
  const handleMeowComment = (commentId: string) => {
    // Update the meowed state first to prevent UI flickering
    setMeowedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
    
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
    
    setComments(updateMeowCount);
  };
  
  // Function to handle roar on the post
  const handleRoar = () => {
    // Update state first to prevent flicker
    const newRoared = !roared;
    setRoared(newRoared);
    setRoarCount(prev => newRoared ? prev + 1 : prev - 1);
    
    if (newRoared) {
      // Animation sequence matching feed page
      setRoarWavesAnimation(true);
      setTimeout(() => setRoarAnimation(true), 50);
      setTimeout(() => setRoarTextAnimation(true), 100);
      
      setTimeout(() => setRoarWavesAnimation(false), 1500);
      setTimeout(() => setRoarAnimation(false), 1800);
      setTimeout(() => setRoarTextAnimation(false), 2000);
    }
    
    toast({
      title: newRoared ? "Post roared!" : "Roar removed",
      description: newRoared ? "You've roared at this post" : "You've removed your roar from this post",
    });
  };
  
  const goBack = () => {
    navigate(-1);
  };

  // Recursive component to render comments with replies
  const CommentWithReplies = ({ comment }: { comment: CommentType }) => {
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
      
      handleMeowComment(comment.id);
      
      // Enhanced meow animation sequence
      setMeowWavesAnimation(true);
      setMeowAnimating(true);
      setMeowTextAnimating(true);
      
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
    
    // Use better indent styling for nested comments
    const getIndentClass = () => {
      const level = comment.level;
      if (level === 1) return '';
      if (level === 2) return 'ml-6';
      if (level === 3) return 'ml-12';
      return 'ml-16';
    };

    const hasReplies = comment.replies && comment.replies.length > 0;
    
    return (
      <div className={`${getIndentClass()} animate-fade-in`}>
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
            <p className="mt-1 text-sm text-foreground/90 leading-relaxed">{comment.text}</p>
            <div className="mt-2.5 flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMeowClick}
                className={`h-8 px-2 text-xs gap-1.5 rounded-full ${isMeowed ? 'text-amber-500 bg-amber-500/10' : ''}`}
              >
                <div className="relative">
                  <div className={`transition-all duration-300 ${meowAnimating ? 'scale-125' : ''}`}>
                    <Cat className={`h-3.5 w-3.5 ${isMeowed ? 'text-amber-500' : ''}`} />
                  </div>
                  {meowWavesAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-ping absolute h-5 w-5 rounded-full bg-amber-500/30"></div>
                      <div className="animate-ping delay-75 absolute h-7 w-7 rounded-full bg-amber-500/20"></div>
                    </div>
                  )}
                </div>
                <span className={`${isMeowed || meowTextAnimating ? 'text-amber-500 font-medium' : ''}`}>
                  {meowTextAnimating ? "Meow!" : comment.meowCount}
                </span>
              </Button>
              
              {comment.level < 3 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleReplyClick}
                  className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
                >
                  <Reply className="h-3.5 w-3.5" />
                  <span>{isReplying ? 'Cancel' : 'Reply'}</span>
                </Button>
              )}

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleReplies}
                  className="h-8 px-2 text-xs gap-1.5 rounded-full hover:bg-secondary/80"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  <span>{isExpanded ? 'Hide replies' : `Show ${comment.replies?.length} ${comment.replies?.length === 1 ? 'reply' : 'replies'}`}</span>
                </Button>
              )}
            </div>
            
            {isReplying && (
              <div className="mt-3 space-y-2 bg-muted/30 p-3 rounded-lg border border-border/40">
                <Textarea 
                  placeholder={`Reply to ${formatUsername(comment.username)}...`} 
                  value={localReplyText}
                  onChange={(e) => setLocalReplyText(e.target.value)}
                  className="min-h-[60px] text-sm resize-none bg-background"
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelReply}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSubmitReply}
                    disabled={!localReplyText.trim() || submittingComment}
                    className="h-8 text-xs gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {hasReplies && isExpanded && (
          <div className="space-y-4 mt-2 pl-2 border-l-2 border-primary/10">
            {comment.replies?.map(reply => (
              <CommentWithReplies key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
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
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Post Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The post with ID "{postId}" in community "{communityId}" doesn't exist or has been removed.
        </p>
        <Button onClick={goBack}>Go Back</Button>
      </div>
    );
  }
  
  const formatUsername = (name: string) => {
    return '@' + name.split('.')[0];
  };
  
  const truncateTitle = (content: string, maxLength = 30) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="max-w-full overflow-x-hidden animate-fade-in">
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
        />
      </div>
      
      <div className="space-y-6 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
          <div className="flex gap-2">
            <Button 
              variant={roared ? "roar-active" : "roar"}
              size="sm" 
              onClick={handleRoar}
              className="gap-1.5 relative"
            >
              <div className="relative">
                <div className={`transition-all duration-300 ${roarAnimation ? 'scale-150' : ''}`}>
                  <span className="text-lg" role="img" aria-label="lion">🦁</span>
                </div>
                {roarWavesAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-6 w-6 rounded-full bg-amber-500/30"></div>
                    <div className="animate-ping delay-75 absolute h-8 w-8 rounded-full bg-amber-500/20"></div>
                  </div>
                )}
              </div>
              <span className={`transition-transform ${roarTextAnimation ? 'scale-110 text-amber-500 font-medium' : ''} ${roared ? 'text-amber-500' : ''}`}>
                {roarCount}
              </span>
            </Button>
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
            <Textarea 
              placeholder="Add a comment..." 
              className="min-h-[80px] resize-none bg-background"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || submittingComment}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                Comment
              </Button>
            </div>
          </div>
        </div>
        
        {comments.length > 0 ? (
          <div className="space-y-6 pt-4 divide-y divide-border/20">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-6 first:pt-0">
                <CommentWithReplies comment={comment} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPage;
