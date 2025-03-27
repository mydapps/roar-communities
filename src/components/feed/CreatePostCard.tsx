
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

const CreatePostCard = ({ onPostCreated }: { onPostCreated: (post: any) => void }) => {
  const [content, setContent] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState('');
  
  // Get user avatar on mount
  useEffect(() => {
    const storedAvatar = localStorage.getItem('dapps_user_avatar');
    console.log("Retrieved user avatar from localStorage:", storedAvatar);
    if (storedAvatar) {
      const avatarUrl = `https://img.dapps.co/avatar/${storedAvatar}.svg`;
      console.log("Setting user avatar URL:", avatarUrl);
      setUserAvatar(avatarUrl);
    }
  }, []);

  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setShowCommunityDialog(false);
    toast.success(`Selected community: ${community}`);
  };

  const handleMediaUploaded = (media: MediaUploadResponse) => {
    console.log("Media uploaded callback received:", media);
    
    // Additional validation to ensure media object is valid
    if (!media) {
      console.error("Media object is null or undefined");
      toast.error('Invalid media response from server');
      return;
    }
    
    if (!media.type) {
      console.error("Media object missing type property:", media);
      toast.error('Invalid media type in server response');
      return;
    }
    
    if (!media.url) {
      console.error("Media object missing url property:", media);
      toast.error('Invalid media URL in server response');
      return;
    }
    
    // If we already have 4 media items or if we have a video (only one video allowed)
    if (uploadedMedia.length >= 4 || (media.type === 'video' && uploadedMedia.length > 0)) {
      console.log("Media limit reached or trying to add video when media already exists");
      toast.error(media.type === 'video' 
        ? 'Only one video can be uploaded per post' 
        : 'Maximum of 4 media items allowed');
      return;
    }
    
    // If we're uploading a video, clear any existing media
    if (media.type === 'video' && uploadedMedia.some(m => m.type === 'image')) {
      console.log("Clearing existing images as video was uploaded");
      setUploadedMedia([media]);
      toast.info('Previous images removed as video was uploaded');
      return;
    }
    
    // If we already have a video, don't allow images
    if (media.type === 'image' && uploadedMedia.some(m => m.type === 'video')) {
      console.log("Cannot add images when video already exists");
      toast.error('Cannot add images when a video is already uploaded');
      return;
    }
    
    console.log("Adding media to uploadedMedia state:", media);
    setUploadedMedia(prev => {
      const newState = [...prev, media];
      console.log("New uploadedMedia state:", newState);
      return newState;
    });
    toast.success(`${media.type === 'image' ? 'Image' : 'Video'} uploaded successfully`);
  };

  const removeMedia = (index: number) => {
    console.log("Removing media at index:", index);
    setUploadedMedia(prev => {
      const newState = prev.filter((_, i) => i !== index);
      console.log("New uploadedMedia state after removal:", newState);
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
      // Prepare the media URLs
      const mediaUrls = uploadedMedia.map(media => media.url);
      console.log("Media URLs for post:", mediaUrls);
      
      // Create the post
      const postData = {
        body: content,
        community: selectedCommunity || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
      };
      
      console.log('Creating post with data:', postData);
      
      const success = await createPost(postData);
      console.log("Post creation result:", success);
      
      if (success) {
        // Trigger confetti effect for dopamine hit
        triggerConfetti();
        
        toast.success('Post created successfully!');
        
        // Create a local representation of the post for UI purposes
        const newPost = {
          handle: "you",
          avatar: localStorage.getItem('dapps_user_avatar') || '',
          community: selectedCommunity || undefined,
          timeAgo: "just now",
          body: content,
          upvotes: 0,
          reply_count: 0,
          roar: 0,
          images: uploadedMedia.filter(m => m.type === 'image').map(m => m.url),
          image: uploadedMedia.filter(m => m.type === 'image').length > 0 ? 1 : 0,
          image_url: uploadedMedia.filter(m => m.type === 'image')[0]?.url,
          multiple_images: uploadedMedia.filter(m => m.type === 'image').length > 1 ? 1 : 0
        };
        
        console.log("Sending new post to feed:", newPost);
        
        // Notify parent component about the new post
        onPostCreated(newPost);
        
        // Reset form
        setContent('');
        setSelectedCommunity('');
        setUploadedMedia([]);
        setIsExpanded(false);
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // Handle specific error messages from API
      if (error.message && error.message.includes('too short')) {
        setError('Your post is too short! Please add more content.');
      } else {
        setError(error.message || 'Failed to create post. Please try again.');
      }
      
      toast.error(error.message || 'Failed to create post');
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
