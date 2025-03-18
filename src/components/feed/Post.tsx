
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  RefreshCw, 
  Share2, 
  ShieldCheck, 
  Copy, 
  Heart, 
  X, 
  Search,
  ChevronDown,
  Command,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  Command as CommandPrimitive,
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem
} from "@/components/ui/command";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface PostProps {
  username: string;
  community?: string;
  timeAgo: string;
  content: string;
  roarCount: number;
  commentCount: number;
  shareCount: number;
  images?: string[];
  video?: string;
}

export const Post = ({ 
  username, 
  community, 
  timeAgo, 
  content, 
  roarCount, 
  commentCount, 
  shareCount,
  images,
  video
}: PostProps) => {
  const [roared, setRoared] = useState(false);
  const [localRoarCount, setLocalRoarCount] = useState(roarCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<{user: string, text: string, timeAgo: string}[]>([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [roarAnimation, setRoarAnimation] = useState(false);
  const [roarWavesAnimation, setRoarWavesAnimation] = useState(false);
  const [roarTextAnimation, setRoarTextAnimation] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const [mirrorSheetOpen, setMirrorSheetOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ipfsSheetOpen, setIpfsSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  
  const { toast } = useToast();
  
  const [emblaRef, emblaApi] = useEmblaCarousel();

  // Generate a mock IPFS hash for the demo
  const ipfsHash = `Qm${Array.from({length: 44}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  // Set up a listener for carousel slides
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setActiveDotIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);
  
  const handleRoar = () => {
    if (roared) {
      setLocalRoarCount(prev => prev - 1);
    } else {
      setLocalRoarCount(prev => prev + 1);
      
      // Trigger a sequence of animations for a more satisfying effect
      setRoarWavesAnimation(true);
      setTimeout(() => setRoarAnimation(true), 50);
      setTimeout(() => setRoarTextAnimation(true), 100);
      
      // Use longer durations for more satisfying animations
      setTimeout(() => setRoarWavesAnimation(false), 1500);
      setTimeout(() => setRoarAnimation(false), 1800);
      setTimeout(() => setRoarTextAnimation(false), 2000);
      
      // Removed toast notification as requested
    }
    setRoared(!roared);
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);
    
    // Load dummy comments if none exist yet
    if (comments.length === 0) {
      setComments([
        { user: 'sarah', text: 'This is amazing! Thanks for sharing.', timeAgo: '5m' },
        { user: 'alex', text: 'I had a similar experience last week.', timeAgo: '12m' },
      ]);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Add the new comment
      setComments([
        ...comments,
        { user: 'you', text: newComment, timeAgo: 'just now' }
      ]);
      
      // Clear the input
      setNewComment('');
    }
  };

  const handleShare = async (platform: string) => {
    // Close the share menu
    setShareSheetOpen(false);
    
    // Prepare share data
    const shareData = {
      title: `${username}'s post on Lion's Roar`,
      text: content,
      url: window.location.href,
    };
    
    if (platform === 'Web Share API' && navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Your post has been shared",
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else if (platform === 'Copy Link') {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Copied to clipboard",
        description: "Link has been copied to clipboard",
      });
    } else {
      // For other platforms, we would implement platform-specific sharing
      console.log(`Sharing to ${platform}`);
    }
  };

  const handleMirror = () => {
    if (selectedCommunity) {
      setMirrorSheetOpen(false);
      setSelectedCommunity(null);
    }
  };

  const copyIpfsHash = () => {
    navigator.clipboard.writeText(ipfsHash);
    toast({
      title: "Copied to clipboard",
      description: "IPFS hash has been copied to clipboard",
    });
  };

  const verifyOnIpfs = () => {
    window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
  };

  const formatUsername = (name: string) => {
    // Remove any extensions like .eth, .lens, etc. and add @
    return '@' + name.split('.')[0];
  };

  // Sample communities for the mirror functionality
  const communities = [
    { name: "Ethereum Devs", members: 12400 },
    { name: "DeFi Explorers", members: 8300 },
    { name: "NFT Creators", members: 15600 },
    { name: "Web3 Gaming", members: 9800 },
    { name: "DAO Governance", members: 5400 },
    { name: "Solana Builders", members: 7200 },
    { name: "ZK Research", members: 3100 },
    { name: "Layer 2 Solutions", members: 6700 }
  ];

  const filteredCommunities = communities.filter(
    community => community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20 hover:border-primary/50 transition-colors">
              <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{formatUsername(username)}</span>
                <span className="text-muted-foreground text-sm mx-1">·</span>
                <span className="text-muted-foreground text-sm">{timeAgo}</span>
              </div>
              {community && (
                <Badge variant="outline" className="mt-1 w-fit bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-xs">{community}</span>
                </Badge>
              )}
            </div>
          </div>
          
          <Sheet open={ipfsSheetOpen} onOpenChange={setIpfsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ShieldCheck className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Freedom of Expression
                </SheetTitle>
                <SheetDescription>
                  This post is stored on IPFS, a decentralized storage network. 
                  This ensures that your content remains censorship-resistant and 
                  permanently available.
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col space-y-4 p-4">
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2">Post IPFS Hash</h3>
                  <div className="flex items-center gap-2">
                    <code className="bg-background text-sm p-2 rounded flex-1 overflow-x-auto font-mono text-xs">{ipfsHash}</code>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0"
                      onClick={copyIpfsHash}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">What is IPFS?</h3>
                  <p className="text-sm text-muted-foreground">
                    The InterPlanetary File System (IPFS) is a protocol designed to create a permanent and 
                    decentralized method of storing and sharing files. Unlike traditional servers, content on 
                    IPFS is identified by its content, not its location.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This means once your content is published, it cannot be censored or removed by any 
                    central authority, preserving your freedom of expression.
                  </p>
                </div>
              </div>
              
              <SheetFooter className="flex-row justify-between gap-2 p-4 border-t">
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
                <Button 
                  onClick={verifyOnIpfs}
                  className="gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  Verify on IPFS
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm mt-2">{content}</p>
        
        {/* Display media content */}
        {images && images.length > 0 && (
          <div className="mt-3 relative">
            {images.length === 1 ? (
              <img 
                src={images[0]} 
                alt={`Post attachment`} 
                className="rounded-md w-full h-auto object-cover max-h-[300px]" 
              />
            ) : (
              <div className="relative">
                <Carousel className="w-full" ref={emblaRef}>
                  <CarouselContent>
                    {images.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <img 
                            src={img} 
                            alt={`Post attachment ${index + 1}`} 
                            className="rounded-md w-full h-auto object-cover max-h-[300px]" 
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    {images.map((_, index) => (
                      <div 
                        key={index} 
                        className={`h-1.5 rounded-full transition-all ${
                          index === activeDotIndex ? "w-4 bg-primary" : "w-1.5 bg-primary/40"
                        }`} 
                      />
                    ))}
                  </div>
                  <CarouselPrevious className="-left-3 bg-background/80 backdrop-blur-sm" />
                  <CarouselNext className="-right-3 bg-background/80 backdrop-blur-sm" />
                </Carousel>
              </div>
            )}
          </div>
        )}
        
        {video && (
          <div className="mt-3">
            <video 
              src={video} 
              controls 
              className="rounded-md w-full max-h-[300px]"
            />
          </div>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="py-3">
        <div className="flex justify-between w-full">
          <Button 
            variant={roared ? "roar-active" : "roar"}
            size="sm"
            className={`flex items-center gap-1.5 relative ${roared ? 'hover:animate-shake-subtle' : ''}`}
            onClick={handleRoar}
          >
            {/* Animated ripple waves when roaring */}
            {roarWavesAnimation && (
              <div className="absolute inset-0 rounded-md border-2 border-amber-500/30 animate-roar-waves pointer-events-none"></div>
            )}
            
            {/* Lion emoji with animation container */}
            <div className={`relative flex items-center justify-center ${roarAnimation ? "animate-roar-icon" : ""}`}>
              <span 
                className={`text-xl transition-all ${roared ? "text-amber-500" : "text-foreground/30"} 
                  ${!roared ? "hover:text-amber-500/70" : ""} group-hover:scale-110`} 
                role="img" 
                aria-label="lion"
              >
                🦁
              </span>
              
              {/* Animated "ROAR!" text that flies out */}
              {roarTextAnimation && (
                <>
                  <div className="absolute top-0 right-0 animate-roar-text pointer-events-none z-10">
                    <span className="font-bold whitespace-nowrap bg-gradient-to-br from-amber-500 to-amber-600 text-transparent bg-clip-text text-sm">ROAR!</span>
                  </div>
                  <div className="absolute top-2 right-2 animate-roar-text pointer-events-none z-10" style={{ animationDelay: '0.1s' }}>
                    <span className="font-bold whitespace-nowrap text-amber-500/60 text-xs">ROAR!</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Roar count with emphasis on active state */}
            <span className={`font-medium transition-all duration-300 ${roared ? "text-amber-500 scale-110" : "text-foreground/50"}`}>
              {localRoarCount}
            </span>
          </Button>
          
          <Button 
            variant={showComments ? "secondary" : "ghost"} 
            size="sm"
            onClick={handleCommentToggle}
            className="flex gap-1.5 items-center transition-all duration-200"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length || commentCount}</span>
          </Button>
          
          <Sheet open={mirrorSheetOpen} onOpenChange={setMirrorSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex gap-1.5 items-center transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{shareCount}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Mirror this post</SheetTitle>
                <SheetDescription>
                  Share this post with a community
                </SheetDescription>
              </SheetHeader>
              
              <div className="p-4 border-b">
                <div className="flex items-start gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{formatUsername(username)}</span>
                      <span className="text-muted-foreground text-sm mx-1">·</span>
                      <span className="text-muted-foreground text-sm">{timeAgo}</span>
                    </div>
                    <p className="text-sm mt-1">{content}</p>
                  </div>
                </div>
                
                {(images?.length || video) && (
                  <div className="ml-12 mt-2">
                    {images && images.length > 0 && (
                      <img 
                        src={images[0]} 
                        alt="First image" 
                        className="rounded-md h-20 w-auto object-cover"
                      />
                    )}
                    {video && (
                      <video 
                        src={video} 
                        className="rounded-md h-20 w-auto object-cover"
                      />
                    )}
                    {images && images.length > 1 && (
                      <span className="text-xs text-muted-foreground mt-1 block">
                        +{images.length - 1} more {images.length === 2 ? 'image' : 'images'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="mb-4 text-sm font-medium">Select a community to mirror to</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search communities..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-[30vh] overflow-y-auto">
                    {filteredCommunities.length > 0 ? (
                      <div className="space-y-2">
                        {filteredCommunities.map((community) => (
                          <div 
                            key={community.name}
                            className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                              selectedCommunity === community.name 
                                ? 'bg-primary/10 border border-primary/30' 
                                : 'hover:bg-muted/50 border border-transparent'
                            }`}
                            onClick={() => setSelectedCommunity(community.name)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {community.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{community.name}</p>
                                <p className="text-xs text-muted-foreground">{community.members.toLocaleString()} members</p>
                              </div>
                            </div>
                            {selectedCommunity === community.name && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-muted-foreground">No communities found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <SheetFooter className="flex-row justify-end gap-2 p-4 border-t">
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button 
                  onClick={handleMirror} 
                  disabled={!selectedCommunity}
                >
                  Mirror Post
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          {/* Updated Share functionality with Sheet instead of popover */}
          <Sheet open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex gap-1.5 items-center transition-all duration-200"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Share this post</SheetTitle>
                <SheetDescription>
                  Choose a platform to share
                </SheetDescription>
              </SheetHeader>
              
              {/* Post preview */}
              <div className="p-4 border-b">
                <div className="flex items-start gap-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${username}`} />
                    <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{formatUsername(username)}</span>
                      <span className="text-muted-foreground text-sm mx-1">·</span>
                      <span className="text-muted-foreground text-sm">{timeAgo}</span>
                    </div>
                    <p className="text-sm mt-1">{content}</p>
                  </div>
                </div>
                
                {(images?.length || video) && (
                  <div className="ml-12 mt-2">
                    {images && images.length > 0 && (
                      <img 
                        src={images[0]} 
                        alt="First image" 
                        className="rounded-md h-20 w-auto object-cover"
                      />
                    )}
                    {video && (
                      <video 
                        src={video} 
                        className="rounded-md h-20 w-auto object-cover"
                      />
                    )}
                    {images && images.length > 1 && (
                      <span className="text-xs text-muted-foreground mt-1 block">
                        +{images.length - 1} more {images.length === 2 ? 'image' : 'images'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Share options */}
              <div className="p-4">
                <h3 className="mb-4 text-sm font-medium">Share via</h3>
                <div className="grid grid-cols-3 gap-2">
                  {navigator.share && (
                    <Button 
                      variant="outline" 
                      className="flex flex-col h-20 gap-1 items-center justify-center" 
                      onClick={() => handleShare('Web Share API')}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                        <Share2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs">Share</span>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-1 items-center justify-center" 
                    onClick={() => handleShare('Twitter')}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1DA1F2]/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#1DA1F2]">
                        <path fill="currentColor" d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                    </div>
                    <span className="text-xs">X / Twitter</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-1 items-center justify-center" 
                    onClick={() => handleShare('WhatsApp')}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#25D366]/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#25D366]">
                        <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-1 items-center justify-center" 
                    onClick={() => handleShare('Farcaster')}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#855DCD]/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-[#855DCD]">
                        <path fill="currentColor" d="M11.8 1.6c-5.7 0-10.2 4.6-10.2 10.2 0 5.7 4.6 10.2 10.2 10.2 5.7 0 10.2-4.6 10.2-10.2 0-5.7-4.6-10.2-10.2-10.2zM3.9 11.8C3.9 7.2 7.5 3.4 12 3.4c2 0 3.9.7 5.4 2l-8.9 8.9c-2.6-2.2-4.6-2.5-4.6-2.5zm7.9 7.9c-2 0-3.9-.7-5.4-2l8.9-8.9c3.8 3.2 4.6 5.4 4.6 5.4-1.5 3.2-4.6 5.5-8.1 5.5z" />
                      </svg>
                    </div>
                    <span className="text-xs">Farcaster</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col h-20 gap-1 items-center justify-center" 
                    onClick={() => handleShare('Copy Link')}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                      <Copy className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-xs">Copy Link</span>
                  </Button>
                </div>
              </div>
              
              <SheetFooter className="flex-row justify-end gap-2 p-4 border-t">
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </CardFooter>
      
      {/* Comments section */}
      {showComments && (
        <div className="px-6 pb-4">
          <Separator className="mb-3" />
          
          {/* Comment list */}
          <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
            {comments.map((comment, i) => (
              <div key={i} className="flex gap-2 animate-fade-in">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${comment.user}`} />
                  <AvatarFallback>{comment.user[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm">{comment.user === 'you' ? 'you' : '@' + comment.user}</span>
                    <span className="text-muted-foreground text-xs">{comment.timeAgo}</span>
                  </div>
                  <p className="text-sm mt-0.5">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Comment input */}
          <div className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
              <AvatarFallback>Y</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea 
                placeholder="Add a comment..." 
                className="min-h-0 h-9 py-2 resize-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={handleAddComment}
                className="h-9"
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

