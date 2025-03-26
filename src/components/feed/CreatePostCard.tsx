
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageIcon, VideoIcon, LinkIcon, XIcon, SendIcon, SearchIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MentionInput } from '@/components/ui/mention-input';

const COMMUNITIES = [
  "Ethereum Devs", 
  "DeFi Explorers", 
  "Solana Builders", 
  "Web3 Gaming", 
  "NFT Creators",
  "DAO Governance",
  "Zero Knowledge",
  "Layer 2 Solutions",
  "Metaverse Architects",
  "Governance Models"
];

const CreatePostCard = ({ onPostCreated }: { onPostCreated: (post: any) => void }) => {
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [communitySearch, setCommunitySearch] = useState('');
  const filteredCommunities = COMMUNITIES.filter(c => 
    c.toLowerCase().includes(communitySearch.toLowerCase())
  );

  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setShowCommunityDialog(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const placeholderImages = [
        "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800",
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
      ];
      
      const newImages = [...selectedImages];
      for (let i = 0; i < Math.min(e.target.files.length, 4 - selectedImages.length); i++) {
        newImages.push(placeholderImages[i % placeholderImages.length]);
      }
      
      setSelectedImages(newImages);
      setSelectedVideo(null);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const placeholderVideo = "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-27013-large.mp4";
      
      setSelectedVideo(placeholderVideo);
      setSelectedImages([]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setSelectedVideo(null);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const newPost = {
      username: "you",
      community: selectedCommunity || undefined,
      timeAgo: "just now",
      content,
      roarCount: 0,
      commentCount: 0,
      shareCount: 0,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      video: selectedVideo || undefined
    };
    
    setTimeout(() => {
      onPostCreated(newPost);
      
      setContent('');
      setSelectedCommunity('');
      setSelectedImages([]);
      setSelectedVideo(null);
      setIsSubmitting(false);
      setIsExpanded(false);
    }, 500);
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 mt-4">
      <CardContent className="pt-6 pb-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 mt-1 border-2 border-primary/20 hover:border-primary/50 transition-colors">
            <AvatarImage src="https://api.dicebear.com/7.x/personas/svg?seed=you" />
            <AvatarFallback>YO</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="relative">
              {selectedCommunity && (
                <div className="absolute -top-6 left-0 flex items-center gap-1 animate-fade-in">
                  <Badge variant="outline" className="bg-secondary/30 text-xs">
                    Posting in {selectedCommunity}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground rounded-full"
                    onClick={() => setSelectedCommunity('')}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <MentionInput 
                value={content}
                onChange={setContent}
                onFocus={handleFocus}
                className="w-full rounded-lg border border-border/60 bg-muted/40 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all duration-200" 
                placeholder={selectedCommunity ? `Share your thoughts with ${selectedCommunity}...` : "What's on your mind?"}
                minHeight="80px"
              />
            </div>
            
            {selectedImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={img} 
                      alt={`Attachment ${idx + 1}`} 
                      className="h-20 w-full object-cover rounded-md" 
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(idx)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedVideo && (
              <div className="mt-3 relative group animate-fade-in">
                <video 
                  src={selectedVideo} 
                  className="w-full h-32 object-cover rounded-md" 
                  controls
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={removeVideo}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {(isExpanded || content || selectedImages.length > 0 || selectedVideo) && (
              <div className="mt-3 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" className="cursor-pointer gap-1.5" type="button" asChild>
                        <span>
                          <ImageIcon className="h-4 w-4" />
                          <span>Images</span>
                        </span>
                      </Button>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={selectedImages.length >= 4 || !!selectedVideo}
                      />
                    </Label>
                    
                    <Label htmlFor="video-upload" className="cursor-pointer">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="cursor-pointer gap-1.5" 
                        type="button"
                        disabled={selectedImages.length > 0}
                        asChild
                      >
                        <span>
                          <VideoIcon className="h-4 w-4" />
                          <span>Video</span>
                        </span>
                      </Button>
                      <Input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoSelect}
                        disabled={selectedImages.length > 0 || !!selectedVideo}
                      />
                    </Label>
                  </div>
                </div>

                <Separator className="my-3" />
                
                <div className="flex items-center justify-between">
                  {!selectedCommunity ? (
                    <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1.5"
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span>Link Community</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Link a Community</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <div className="relative">
                              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="community-search"
                                placeholder="Search communities..."
                                value={communitySearch}
                                onChange={(e) => setCommunitySearch(e.target.value)}
                                className="pl-8"
                              />
                            </div>
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-1 rounded-md border p-1">
                            {filteredCommunities.length === 0 ? (
                              <div className="py-6 text-center text-muted-foreground">
                                No communities found
                              </div>
                            ) : (
                              filteredCommunities.map((community) => (
                                <Button
                                  key={community}
                                  variant="ghost"
                                  className="w-full justify-start text-left"
                                  onClick={() => handleCommunitySelect(community)}
                                >
                                  <Badge variant="outline" className="mr-2 bg-muted/50">{community[0]}</Badge>
                                  {community}
                                </Button>
                              ))
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Badge className="h-8 flex items-center gap-1 px-3 bg-secondary/30">
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>{selectedCommunity}</span>
                    </Badge>
                  )}
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !content.trim()}
                    className="gap-1.5"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-1.5">
                        <span className="animate-pulse">Posting...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <SendIcon className="h-4 w-4" />
                        <span>Post</span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePostCard;
