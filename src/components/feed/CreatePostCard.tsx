
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { XIcon, SendIcon, LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MentionInput } from '@/components/ui/mention-input';
import { toast } from 'sonner';
import { CommunitySelector } from './CommunitySelector';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';

const CreatePostCard = ({ onPostCreated }: { onPostCreated: (post: any) => void }) => {
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setShowCommunityDialog(false);
    toast.success(`Selected community: ${community}`);
  };

  const handleMediaUploaded = (media: MediaUploadResponse) => {
    // If we already have 4 media items or if we have a video (only one video allowed)
    if (uploadedMedia.length >= 4 || (media.type === 'video' && uploadedMedia.length > 0)) {
      toast.error(media.type === 'video' 
        ? 'Only one video can be uploaded per post' 
        : 'Maximum of 4 media items allowed');
      return;
    }
    
    // If we're uploading a video, clear any existing media
    if (media.type === 'video' && uploadedMedia.some(m => m.type === 'image')) {
      setUploadedMedia([media]);
      toast.info('Previous images removed as video was uploaded');
      return;
    }
    
    // If we already have a video, don't allow images
    if (media.type === 'image' && uploadedMedia.some(m => m.type === 'video')) {
      toast.error('Cannot add images when a video is already uploaded');
      return;
    }
    
    setUploadedMedia(prev => [...prev, media]);
    toast.success(`${media.type === 'image' ? 'Image' : 'Video'} uploaded successfully`);
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real implementation, this would be an API call
    setTimeout(() => {
      const newPost = {
        username: "you",
        community: selectedCommunity || undefined,
        timeAgo: "just now",
        content,
        roarCount: 0,
        commentCount: 0,
        shareCount: 0,
        images: uploadedMedia.filter(m => m.type === 'image').map(m => m.url),
        video: uploadedMedia.find(m => m.type === 'video')?.url
      };
      
      toast.success('Post created successfully!');
      onPostCreated(newPost);
      
      // Reset form
      setContent('');
      setSelectedCommunity('');
      setUploadedMedia([]);
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
            
            {uploadedMedia.length > 0 && (
              <div className={`mt-3 grid ${uploadedMedia.some(m => m.type === 'video') ? 'grid-cols-1' : 'grid-cols-2'} gap-2 animate-fade-in`}>
                {uploadedMedia.map((media, idx) => (
                  <MediaPreview 
                    key={idx} 
                    media={media} 
                    onRemove={() => removeMedia(idx)} 
                  />
                ))}
              </div>
            )}
            
            {(isExpanded || content || uploadedMedia.length > 0) && (
              <div className="mt-3 animate-fade-in">
                <div className="flex flex-wrap gap-2 mb-3">
                  <MediaUpload 
                    onMediaUploaded={handleMediaUploaded}
                    disabled={isSubmitting || uploadedMedia.some(m => m.type === 'video')}
                    acceptedTypes="image"
                    maxFiles={4}
                  />
                  
                  <MediaUpload 
                    onMediaUploaded={handleMediaUploaded}
                    disabled={isSubmitting || uploadedMedia.length > 0}
                    acceptedTypes="video"
                    maxFiles={1}
                  />
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
                          <CommunitySelector 
                            onSelect={handleCommunitySelect}
                            selectedCommunity={selectedCommunity} 
                          />
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
