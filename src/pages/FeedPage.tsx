import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Flame, Clock, Globe, ShieldCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

const FeedPage = () => {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const isMobile = useIsMobile();

  const handlePostCreated = (newPost: any) => {
    setUserPosts([newPost, ...userPosts]);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="following" className="w-full">
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
              <Post 
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
            
            {/* Default posts */}
            <PostsList />
          </div>
        </TabsContent>
  
        <TabsContent value="global" className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Discover posts from all communities
                </h2>
                <CreatePostCard onPostCreated={handlePostCreated} />
              </CardContent>
            </Card>
            <PostsList globalFeed={true} />
            {userPosts.map((post, index) => (
              <Post 
                key={`user-post-global-${index}`}
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
          </div>
        </TabsContent>
  
        <TabsContent value="trending" className="space-y-6 animate-fade-in">
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-500/5 to-red-500/5 border-amber-500/20">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  Popular posts gaining traction
                </h2>
              </CardContent>
            </Card>
            <PostsList trendingOnly={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Enhanced Community Badge component
const CommunityBadge = ({ name }: { name: string }) => {
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

const PostsList = ({ trendingOnly = false, globalFeed = false }: { trendingOnly?: boolean, globalFeed?: boolean }) => {
  // Sample posts with different types of media
  const posts = [
    {
      username: "alice",
      community: "Ethereum Devs",
      timeAgo: "2h",
      content: "Just deployed my first smart contract on Ethereum. The gas fees were surprisingly reasonable!",
      roarCount: 24,
      commentCount: 5,
      shareCount: 2,
    },
    {
      username: "bob",
      community: "DeFi Explorers",
      timeAgo: "5h",
      content: "Check out this new UI for our DeFi platform. What do you think?",
      roarCount: 42,
      commentCount: 12,
      shareCount: 7,
      images: [
        "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800",
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
      ]
    },
    {
      username: "charlie",
      community: "Solana Builders",
      timeAgo: "1d",
      content: "The throughput on Solana is amazing for our new DApp. We're handling thousands of transactions per second with minimal costs.",
      roarCount: 67,
      commentCount: 23,
      shareCount: 15,
      video: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-27013-large.mp4"
    },
    {
      username: "diana",
      community: "Web3 Gaming",
      timeAgo: "6h",
      content: "Just finished designing these assets for our blockchain game. What do you think of the color scheme?",
      roarCount: 83,
      commentCount: 31,
      shareCount: 19,
      images: [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
      ]
    },
    {
      username: "eric",
      community: "NFT Creators",
      timeAgo: "3d",
      content: "My latest NFT collection is going live tomorrow! Here's a sneak peek at some of the art.",
      roarCount: 103,
      commentCount: 42,
      shareCount: 29,
      images: [
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
      ]
    },
    {
      username: "frank",
      community: "DAO Governance",
      timeAgo: "4h",
      content: "We're voting on a new proposal to allocate funds for community developers. This could be huge for ecosystem growth!",
      roarCount: 72,
      commentCount: 26,
      shareCount: 13,
    },
    {
      username: "sophia",
      community: "Web3 Gaming",
      timeAgo: "1d",
      content: "Our game just hit 100k daily active users! Thanks to everyone who supported us through the beta.",
      roarCount: 156,
      commentCount: 47,
      shareCount: 39,
      images: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
        "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800",
      ],
    },
    {
      username: "tyler",
      community: "Ethereum Devs",
      timeAgo: "5h",
      content: "I made a visualization of Ethereum's transaction volume over the past year. The growth is insane!",
      roarCount: 92,
      commentCount: 31,
      shareCount: 18,
      video: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-city-growing-on-a-orange-background-31652-large.mp4",
    },
  ];

  // Filter posts based on options
  let postsToShow = [...posts];
  
  if (trendingOnly) {
    postsToShow = postsToShow.sort((a, b) => b.roarCount - a.roarCount).slice(0, 4);
  } else if (globalFeed) {
    // Shuffle the posts for global feed
    postsToShow = postsToShow
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  return (
    <div className="space-y-6">
      {postsToShow.map((post, index) => (
        <Post 
          key={`sample-post-${index}`}
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
    </div>
  );
};

export default FeedPage;
