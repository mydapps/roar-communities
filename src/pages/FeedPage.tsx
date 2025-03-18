
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Post } from '@/components/feed/Post';
import CreatePostCard from '@/components/feed/CreatePostCard';

const FeedPage = () => {
  const [userPosts, setUserPosts] = useState<any[]>([]);

  const handlePostCreated = (newPost: any) => {
    setUserPosts([newPost, ...userPosts]);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="following" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Feed</h1>
          <TabsList>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
        </div>
  
        <TabsContent value="following" className="space-y-6 animate-fade-in">
          <CreatePostCard onPostCreated={handlePostCreated} />
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
            <p className="text-muted-foreground">Global feed shows posts from all communities</p>
            <CreatePostCard onPostCreated={handlePostCreated} />
            <PostsList />
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
            <p className="text-muted-foreground">Trending posts across all communities</p>
            <PostsList trendingOnly={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PostsList = ({ trendingOnly = false }: { trendingOnly?: boolean }) => {
  // Sample posts with different types of media
  const posts = [
    {
      username: "alice.eth",
      community: "Ethereum Devs",
      timeAgo: "2h",
      content: "Just deployed my first smart contract on Ethereum. The gas fees were surprisingly reasonable!",
      roarCount: 24,
      commentCount: 5,
      shareCount: 2,
    },
    {
      username: "bob.lens",
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
      username: "charlie.sol",
      community: "Solana Builders",
      timeAgo: "1d",
      content: "The throughput on Solana is amazing for our new DApp. We're handling thousands of transactions per second with minimal costs.",
      roarCount: 67,
      commentCount: 23,
      shareCount: 15,
      video: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-27013-large.mp4"
    },
    {
      username: "diana.dev",
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
      username: "eric.nft",
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
  ];

  const postsToShow = trendingOnly
    ? posts.sort((a, b) => b.roarCount - a.roarCount).slice(0, 3)
    : posts;

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
