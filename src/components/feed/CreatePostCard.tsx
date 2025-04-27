import React, { useState, useEffect } from 'react';
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
import { createPost } from '@/utils/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import confetti from 'canvas-confetti';
import { CommunityPost } from '@/hooks/useCommunityPosts';

interface CreatePostCardProps {
  onPostCreated: (post: Partial<CommunityPost>) => void;
  communityName?: string;
}

const CreatePostCard = ({ onPostCreated, communityName }: CreatePostCardProps) => {
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState(communityName || '');
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState('');
  const [userHandle, setUserHandle] = useState('');
  
  useEffect(() => {
    const storedAvatar = localStorage.getItem('dapps_user_avatar');
    const storedHandle = localStorage.getItem('dapps_user_handle');
    
    console.log("Retrieved user avatar from localStorage:", storedAvatar);
    console.log("Retrieved user handle from localStorage:", storedHandle);
    
    if (storedAvatar) {
      const avatarUrl = `https://img.dapps.co/avatar/${storedAvatar}.svg`;
      console.log("Setting user avatar URL:", avatarUrl);
      setUserAvatar(avatarUrl);
    }
    
    if (storedHandle) {
      setUserHandle(storedHandle);
    }
  }, []);

  useEffect(() => {
    if (communityName) {
      setSelectedCommunity(communityName);
    }
  }, [communityName]);

  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setShowCommunityDialog(false);
    toast.success(`Selected community: ${community}`);
  };

  const handleMediaUploaded = (media: MediaUploadResponse) => {
    console.log("Media uploaded callback received with:", JSON.stringify(media));
    
    if (!media || typeof media !== 'object') {
      console.error("Invalid media object received:", media);
      toast.error('Invalid media response from server');
      return;
    }
    
    if (!media.type || !media.url) {
      console.error("Media missing required properties:", media);
      toast.error('Invalid media data received from server');
      return;
    }
    
    setUploadedMedia(prev => {
      const newState = [...prev, media];
      console.log("New uploadedMedia state:", JSON.stringify(newState));
      return newState;
    });
    
    toast.success(`${media.type === 'image' ? 'Image' : 'Video'} uploaded successfully`);
  };

  const removeMedia = (index: number) => {
    console.log("Removing media at index:", index, "Current media:", JSON.stringify(uploadedMedia));
    setUploadedMedia(prev => {
      const newState = prev.filter((_, i) => i !== index);
      console.log("New uploadedMedia state after removal:", JSON.stringify(newState));
      return newState;
    });
  };

  const triggerConfetti = () => {
    console.log("Triggering confetti effect");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content for your post');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const mediaUrls = uploadedMedia.map(media => media.url);
      console.log("Media URLs for post:", mediaUrls);
      
      let fullBody = content.trim();
      
      if (mediaUrls.length > 0) {
        mediaUrls.forEach(url => {
          fullBody += ` ![](${url})`;
        });
      }
      
      console.log("Full post body with media URLs:", fullBody);
      
      const postData = {
        body: fullBody,
        community: selectedCommunity || undefined,
      };
      
      console.log('Creating post with data:', postData);
      
      const response = await createPost(postData);
      console.log("Post creation result:", response);
      
      if (response === true || (typeof response === 'object' && response.status === 'SUCCESS')) {
        triggerConfetti();
        
        // toast.success('Post created successfully!');
        
        const currentUserAvatar = localStorage.getItem('dapps_user_avatar') || '';
        const currentUserHandle = localStorage.getItem('dapps_user_handle') || '';
        
        console.log("Using user handle for new post:", currentUserHandle);
        
        let postCode = '';
        if (typeof response === 'object' && response.postCode) {
          postCode = response.postCode;
          console.log("Received post code from API:", postCode);
        } else {
          postCode = `temp-${Date.now()}`;
          console.log("Using temporary post code:", postCode);
        }
        
        const newPost: Partial<CommunityPost> = {
          handle: currentUserHandle || userHandle,
          avatar: currentUserAvatar || userAvatar,
          community: selectedCommunity || undefined,
          timeAgo: "just now",
          body: fullBody,
          upvotes: 0,
          reply_count: 0,
          roar: 0,
          image: uploadedMedia.filter(m => m.type === 'image').length > 0 ? 1 : 0,
          image_url: uploadedMedia.filter(m => m.type === 'image')[0]?.url,
          multiple_images: uploadedMedia.filter(m => m.type === 'image').length > 1 ? 1 : 0,
          images: uploadedMedia.filter(m => m.type === 'image').map(m => m.url),
          code: postCode
        };
        
        console.log("Sending new post to feed:", JSON.stringify(newPost));
        
        onPostCreated(newPost);
        
        setContent('');
        setSelectedCommunity(communityName || '');
        setUploadedMedia([]);
        setIsExpanded(false);
      } else if (typeof response === 'object' && response.status === 'ERROR') {
        const errorMessage = response.error || response.message || 'Failed to create post';
        throw new Error(errorMessage);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      let errorMessage: string;
      
      if (typeof error === 'object') {
        if (error.response && error.response.data) {
          errorMessage = error.response.data.error || error.response.data.message || error.message;
        } else {
          errorMessage = error.message || 'Failed to create post. Please try again.';
        }
      } else {
        errorMessage = 'Failed to create post. Please try again.';
      }
      
      console.log("Error message:", errorMessage);
      
      setError(errorMessage);
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  return (
    <Card className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 mt-4">
      <CardContent className="pt-6 pb-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 mt-1 border-2 border-primary/20 hover:border-primary/50 transition-colors">
            <AvatarImage src={userAvatar} />
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
            
            {error && (
              <Alert variant="destructive" className="mt-2 py-2 animate-fade-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {uploadedMedia.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
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
                    disabled={isSubmitting}
                    acceptedTypes="image"
                    maxFiles={30}
                  />
                  
                  <MediaUpload 
                    onMediaUploaded={handleMediaUploaded}
                    disabled={isSubmitting}
                    acceptedTypes="video"
                    maxFiles={30}
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
