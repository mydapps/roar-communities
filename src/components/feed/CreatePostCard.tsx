
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Available communities for linking
const COMMUNITIES = [
  "Ethereum Devs", 
  "DeFi Explorers", 
  "Solana Builders", 
  "Web3 Gaming", 
  "NFT Creators",
  "DAO Governance"
];

const CreatePostCard = ({ onPostCreated }: { onPostCreated: (post: any) => void }) => {
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Filter communities based on search input
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
      // For demo purposes, we'll use placeholder URLs
      const placeholderImages = [
        "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800",
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
      ];
      
      // Limit to max 4 images
      const newImages = [...selectedImages];
      for (let i = 0; i < Math.min(e.target.files.length, 4 - selectedImages.length); i++) {
        newImages.push(placeholderImages[i % placeholderImages.length]);
      }
      
      setSelectedImages(newImages);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Empty post",
        description: "Please add some content to your post",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Create new post object
    const newPost = {
      username: "you.eth", // Current user
      community: selectedCommunity || undefined,
      timeAgo: "just now",
      content,
      roarCount: 0,
      commentCount: 0,
      shareCount: 0,
      images: selectedImages.length > 0 ? selectedImages : undefined
    };
    
    // Simulate network delay
    setTimeout(() => {
      onPostCreated(newPost);
      
      // Reset form
      setContent('');
      setSelectedCommunity('');
      setSelectedImages([]);
      setIsSubmitting(false);
      
      toast({
        title: "Post created!",
        description: "Your post has been published successfully"
      });
    }, 500);
  };

  return (
    <Card className="border border-border/40 shadow-sm animate-scale-in">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>YE</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-muted/40 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[100px]" 
              placeholder="What's happening in your communities?"
            />
            
            {/* Display selected community badge */}
            {selectedCommunity && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
                <span>{selectedCommunity}</span>
                <Button 
                  variant="ghost" 
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedCommunity('')}
                >
                  ×
                </Button>
              </div>
            )}
            
            {/* Display selected images */}
            {selectedImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
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
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" className="cursor-pointer" type="button" asChild>
                    <span>Add Image</span>
                  </Button>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={selectedImages.length >= 4}
                  />
                </Label>
                
                <Dialog open={showCommunityDialog} onOpenChange={setShowCommunityDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Link Community
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Link a Community</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="community-search">Search Communities</Label>
                        <Input
                          id="community-search"
                          placeholder="Search..."
                          value={communitySearch}
                          onChange={(e) => setCommunitySearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {filteredCommunities.map((community) => (
                          <Button
                            key={community}
                            variant="ghost"
                            className="w-full justify-start text-left"
                            onClick={() => handleCommunitySelect(community)}
                          >
                            {community}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePostCard;
