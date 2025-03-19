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

// Icons
import { ChevronLeft, RefreshCw, MessageCircle, Send } from 'lucide-react';

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
  }
];

// Mock comments data
const MOCK_COMMENTS = [
  { 
    id: 'comment1',
    username: 'alice.lens',
    text: "This is incredibly insightful! Have you considered how this might interact with zk proofs?",
    timeAgo: '1h',
    roarCount: 15
  },
  {
    id: 'comment2',
    username: 'bob.eth',
    text: "I've been working on something similar. Would love to collaborate on this.",
    timeAgo: '45m',
    roarCount: 8
  },
  {
    id: 'comment3',
    username: 'crypto_researcher',
    text: 'The implications for scalability are enormous. This could be a game-changer for on-chain analytics.',
    timeAgo: '30m',
    roarCount: 12
  },
  { 
    id: 'comment4', 
    username: 'defi_maxi', 
    text: 'How does this compare to the solution proposed at DevCon last year?', 
    timeAgo: '25m', 
    roarCount: 5 
  },
  { 
    id: 'comment5', 
    username: 'zero_knowledge', 
    text: 'I think this approach has merit, but we need to consider the privacy implications as well.', 
    timeAgo: '15m', 
    roarCount: 9 
  }
];

const PostPage = () => {
  const { communityId, postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  useEffect(() => {
    setTimeout(() => {
      // Find post by ID first, then by community as fallback
      const foundPost = MOCK_POSTS.find(p => p.id === postId) || 
                        MOCK_POSTS.find(p => p.community === communityId);
      
      console.log("Looking for post with ID:", postId, "or community:", communityId);
      console.log("Found post:", foundPost);
      
      if (foundPost) {
        setPost(foundPost);
        setComments(MOCK_COMMENTS);
      }
      setLoading(false);
    }, 1000);
  }, [communityId, postId]);
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    
    setTimeout(() => {
      const newCommentObj = {
        id: `comment-${Date.now()}`,
        username: 'you',
        text: newComment,
        timeAgo: 'just now',
        roarCount: 0
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
  
  const handleRoarComment = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, roarCount: comment.roarCount + 1 } 
          : comment
      )
    );
  };
  
  const goBack = () => {
    navigate(-1);
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
          roarCount={post.roarCount}
          commentCount={comments.length}
          shareCount={post.shareCount}
          images={post.images}
          video={post.video}
        />
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
          <Button variant="ghost" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
        
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
            <AvatarFallback>Y</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea 
              placeholder="Add a comment..." 
              className="min-h-[80px] resize-none"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || submittingComment}
                className="gap-1"
              >
                <Send className="h-4 w-4" />
                Comment
              </Button>
            </div>
          </div>
        </div>
        
        {comments.length > 0 ? (
          <div className="space-y-5 pt-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-fade-in">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${comment.username}`} />
                  <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">
                      {comment.username === 'you' ? 'you' : formatUsername(comment.username)}
                    </span>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-muted-foreground text-sm">{comment.timeAgo}</span>
                  </div>
                  <p className="mt-1">{comment.text}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRoarComment(comment.id)}
                      className="h-8 px-2 text-sm gap-1"
                    >
                      <span className="text-lg" role="img" aria-label="lion">🦁</span>
                      <span>{comment.roarCount}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 text-sm gap-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Reply</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPage;
