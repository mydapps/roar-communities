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
import { CreatePostModal, CreatePostPayload } from './CreatePostModal';

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

  const handleModalPostSubmit = async (payload: CreatePostPayload): Promise<boolean> => {
    const { body, community, media, is_poll, poll_options } = payload;

    if (is_poll) {
      if (!body.trim()) {
        toast.error('Please enter a question for your poll.');
        return false;
      }
      if (!poll_options || poll_options.length < 2) {
        toast.error('Polls require at least 2 valid options.');
        return false;
      }
    } else {
      if (!body.trim() && (!media || media.length === 0)) {
        toast.error('Please enter some content or add media to your post.');
        return false;
      }
    }
      
    let finalBody = body.trim();
    
    if (!is_poll && media && media.length > 0) {
      let mediaMarkdownToAppend = '';
      media.forEach(m => {
        if (!finalBody.includes(m.url)) { 
          mediaMarkdownToAppend += `\n\n![](${m.url})`; 
        }
      });
      if (mediaMarkdownToAppend) {
        finalBody += mediaMarkdownToAppend;
      }
    }
      
    try {
      const postDataForApi: any = {
        body: finalBody,
        community: community,
      };
      
      if (is_poll) {
        postDataForApi.is_poll = true;
        postDataForApi.poll_options = poll_options;
      } else {
        postDataForApi.is_poll = false;
      }
      
      const response = await createPost(postDataForApi);
      
      if (response.status === 'SUCCESS') {
        triggerConfetti();
        toast.success(is_poll ? 'Poll created successfully!' : 'Post created successfully!');
        
        const currentUserAvatar = localStorage.getItem('dapps_user_avatar') || '';
        const currentUserHandle = localStorage.getItem('dapps_user_handle') || '';
        const postCode = response.postCode;
        
        const newPostForUI: Partial<CommunityPost> = {
          handle: currentUserHandle,
          avatar: currentUserAvatar,
          community: community,
          timeAgo: "just now",
          body: finalBody,
          upvotes: 0,
          reply_count: 0,
          roar: 0,
          code: postCode,
          is_poll: is_poll || false,
        };
        
        if (is_poll) {
          if (response.created_poll_options && response.created_poll_options.length > 0) {
            newPostForUI.poll_data = {
              is_active: true,
              poll_end_time: null,
              total_votes: 0,
              user_has_voted: false,
              chosen_option_id: null,
              options: response.created_poll_options.map(opt => ({
                option_id: opt.id,
                text: opt.option_text,
                imageUrl: opt.option_image_url || undefined,
                vote_count: 0,
                percentage: 0,
              })),
            };
          } else if (poll_options) {
            console.warn("Poll created, but created_poll_options not found in response. Using payload for UI.");
            newPostForUI.poll_data = {
              is_active: true,
              poll_end_time: null,
              total_votes: 0,
              user_has_voted: false,
              chosen_option_id: null,
              options: poll_options.map((opt, index) => ({
                option_id: index,
                text: opt.text,
                imageUrl: opt.imageUrl || undefined,
                vote_count: 0,
                percentage: 0,
              })),
            };
          }
          const pollHasImages = newPostForUI.poll_data?.options.some(opt => opt.imageUrl);
          if (pollHasImages) {
              newPostForUI.image = 1;
              newPostForUI.image_url = newPostForUI.poll_data?.options.find(opt => opt.imageUrl)?.imageUrl;
              newPostForUI.multiple_images = newPostForUI.poll_data?.options.filter(opt => opt.imageUrl).length ?? 0 > 1 ? 1 : 0;
              newPostForUI.images = newPostForUI.poll_data?.options.map(opt => opt.imageUrl).filter(url => !!url) as string[];
          }
        } else if (!is_poll && media && media.length > 0) {
          newPostForUI.image = media.filter(m => m.type === 'image').length > 0 ? 1 : 0;
          newPostForUI.image_url = media.filter(m => m.type === 'image')[0]?.url;
          newPostForUI.multiple_images = media.filter(m => m.type === 'image').length > 1 ? 1 : 0;
          newPostForUI.images = media.filter(m => m.type === 'image').map(m => m.url);
        }
        
        onPostCreated(newPostForUI);
        return true;
      } else if (response.status === 'ERROR') {
        // Check if it's a community membership error that should be handled by the modal
        const errorMessage = response.message || 'Failed to create post';
        if (errorMessage.includes('not a part of') || errorMessage.includes('Join the community first') || errorMessage.includes('403')) {
          // Re-throw community membership errors so the modal can handle them
          throw new Error(errorMessage);
        } else {
          // Handle other errors normally with toast
          toast.error(errorMessage);
          return false;
        }
      } else {
        console.error('Unknown response structure from create post API:', response);
        throw new Error('Unknown response from create post API');
      }
    } catch (error: any) {
      console.error('Error in handleModalPostSubmit:', error);
      
      // Parse error message from different possible formats
      let errorMessage = error.message || 'Failed to create post. Please try again.';
      
      if (error && typeof error === 'object') {
        if (error.response && typeof error.response.data === 'object' && error.response.data !== null) {
            const serverError = error.response.data.message || error.response.data.error;
            if (serverError) errorMessage = serverError;
        } else if (error.data && typeof error.data === 'object' && error.data !== null) {
            const serverError = error.data.message || error.data.error;
            if (serverError) errorMessage = serverError;
        }
      }
      
      // Check if it's a community membership error that should be handled by the modal
      if (errorMessage.includes('not a part of') || errorMessage.includes('Join the community first') || errorMessage.includes('403')) {
        // Re-throw community membership errors so the modal can handle them inline
        throw error;
      } else {
        // Handle other errors with toast and return false
        toast.error(errorMessage);
        return false;
      }
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
