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
import { CreatePostModal } from './CreatePostModal';

interface CreatePostCardProps {
  onPostCreated: (post: Partial<CommunityPost>) => void;
  communityName?: string;
}

const CreatePostCard = ({ onPostCreated, communityName }: CreatePostCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const triggerConfetti = () => {
    console.log("Triggering confetti effect");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleModalPostSubmit = async (content: string, community: string | undefined, media: MediaUploadResponse[]): Promise<boolean> => {
    if (!content.trim() && media.length === 0) {
      toast.error('Please enter some content or add media.');
      return false;
    }
    
    let fullBody = content.trim();
    if (media.length > 0) {
      let mediaAlreadyInContent = false;
      if (content) {
        mediaAlreadyInContent = media.some(m => content.includes(m.url));
      }
      if (!mediaAlreadyInContent) {
        media.forEach(m => {
            fullBody += `\n\n![](${m.url})`; 
        });
      }
    }

    try {
      const postData = {
        body: fullBody,
        community: community,
      };
      
      const response = await createPost(postData);
      
      if (response === true || (typeof response === 'object' && response.status === 'SUCCESS')) {
        triggerConfetti();
        toast.success('Post created successfully!');
        
        const currentUserAvatar = localStorage.getItem('dapps_user_avatar') || '';
        const currentUserHandle = localStorage.getItem('dapps_user_handle') || '';
        
        let postCode = '';
        if (typeof response === 'object' && response.postCode) {
          postCode = response.postCode;
        } else {
          postCode = `temp-${Date.now()}`;
        }
        
        const newPost: Partial<CommunityPost> = {
          handle: currentUserHandle,
          avatar: currentUserAvatar,
          community: community,
          timeAgo: "just now",
          body: fullBody,
          upvotes: 0,
          reply_count: 0,
          roar: 0,
          image: media.filter(m => m.type === 'image').length > 0 ? 1 : 0,
          image_url: media.filter(m => m.type === 'image')[0]?.url,
          multiple_images: media.filter(m => m.type === 'image').length > 1 ? 1 : 0,
          images: media.filter(m => m.type === 'image').map(m => m.url),
          code: postCode
        };
        
        onPostCreated(newPost);
        return true;
      } else if (typeof response === 'object' && response.status === 'ERROR') {
        const errorMessage = response.error || response.message || 'Failed to create post';
        throw new Error(errorMessage);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to create post. Please try again.';
      if (error && typeof error === 'object') {
        if (error.response && typeof error.response.data === 'object' && error.response.data !== null) {
            const serverError = error.response.data.error || error.response.data.message;
            if (serverError) errorMessage = serverError;
        } else if (error.data && typeof error.data === 'object' && error.data !== null) {
            const serverError = error.data.error || error.data.message;
            if (serverError) errorMessage = serverError;
        }
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const openCreatePostModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Card 
        className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 mt-4 cursor-pointer"
        onClick={openCreatePostModal}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={userAvatar} />
              <AvatarFallback>{userHandle?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="w-full rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                {communityName ? `Share your thoughts with ${communityName}...` : "What's on your mind?"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <CreatePostModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          userAvatarUrl={userAvatar}
          userHandle={userHandle}
          communityName={communityName}
          onPostSubmit={handleModalPostSubmit}
        />
      )}
    </>
  );
};

export default CreatePostCard;
