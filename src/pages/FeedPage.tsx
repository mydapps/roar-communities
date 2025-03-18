
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageCircle, Heart, RefreshCw, Share2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Post } from '@/components/feed/Post';

// Custom Lion icon for the Roar button
const LionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15C8.5 13.5 10 12 12 12C14 12 15.5 13.5 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8.5 9C8.5 9.82843 7.82843 10.5 7 10.5C6.17157 10.5 5.5 9.82843 5.5 9C5.5 8.17157 6.17157 7.5 7 7.5C7.82843 7.5 8.5 8.17157 8.5 9Z" fill="currentColor"/>
    <path d="M18.5 9C18.5 9.82843 17.8284 10.5 17 10.5C16.1716 10.5 15.5 9.82843 15.5 9C15.5 8.17157 16.1716 7.5 17 7.5C17.8284 7.5 18.5 8.17157 18.5 9Z" fill="currentColor"/>
  </svg>
);

const FeedPage = () => {
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
          <CreatePostCard />
          <PostsList />
        </TabsContent>
  
        <TabsContent value="global" className="space-y-6 animate-fade-in">
          <div className="text-center p-8">
            <p className="text-muted-foreground">Global feed shows posts from all communities</p>
            <PostsList />
          </div>
        </TabsContent>
  
        <TabsContent value="trending" className="space-y-6 animate-fade-in">
          <div className="text-center p-8">
            <p className="text-muted-foreground">Trending posts across all communities</p>
            <PostsList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CreatePostCard = () => {
  return (
    <Card className="border border-border/40 shadow-sm animate-scale-in">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <textarea 
              className="w-full rounded-lg border border-border/60 bg-muted/40 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[100px]" 
              placeholder="What's happening in your communities?"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Add Image
                </Button>
                <Button variant="outline" size="sm">
                  Link Community
                </Button>
              </div>
              <Button>Post</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PostsList = () => {
  return (
    <div className="space-y-6">
      <Post 
        username="alice.eth"
        community="Ethereum Devs"
        timeAgo="2h"
        content="Just deployed my first smart contract on Ethereum. The gas fees were surprisingly reasonable!"
        roarCount={24}
        commentCount={5}
        shareCount={2}
      />
      <Post 
        username="bob.lens"
        community="DeFi Explorers"
        timeAgo="5h"
        content="Anyone trying out the new DEX? The UI is clean and the liquidity seems good so far. I'm impressed with the low slippage."
        roarCount={42}
        commentCount={12}
        shareCount={7}
      />
      <Post 
        username="charlie.sol"
        community="Solana Builders"
        timeAgo="1d"
        content="The throughput on Solana is amazing for our new DApp. We're handling thousands of transactions per second with minimal costs."
        roarCount={67}
        commentCount={23}
        shareCount={15}
      />
    </div>
  );
};

export default FeedPage;
