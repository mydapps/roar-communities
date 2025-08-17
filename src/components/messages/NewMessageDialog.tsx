import React, { useState, useEffect, useMemo } from 'react';
import { Search, Send, User, Users, ArrowRight, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { searchUsers } from '@/utils/communityApi';
import { startConversation, calculateDMPrice, type StartConversationResponse } from '@/utils/messagingApi';
import { getFollowers, getFollowing, FollowUser } from '@/utils/userApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (conversationId: string, otherUser: { handle: string; avatar: string }) => void;
}

const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [loadingFollows, setLoadingFollows] = useState(true);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const currentUserHandle = localStorage.getItem('dapps_user_handle') || '';

  useEffect(() => {
    if (open && currentUserHandle) {
      loadSuggestedUsers();
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setFollowers([]);
      setFollowing([]);
    }
  }, [open, currentUserHandle]);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 2) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  const loadSuggestedUsers = async () => {
    setLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.all([
        getFollowers(currentUserHandle, 1, 20),
        getFollowing(currentUserHandle, 1, 20)
      ]);

      const followers = followersRes.success ? followersRes.data : [];
      let following = followingRes.success ? followingRes.data : [];
      
      const followerHandles = new Set(followers.map(f => f.handle));
      following = following.filter(f => !followerHandles.has(f.handle));

      setFollowers(followers);
      setFollowing(following);
    } catch (error) {
      console.error('Error loading suggested users:', error);
      toast.error('Could not load suggested users.');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await searchUsers(query, 1, 10);
      if (response.success && response.users) {
        setSearchResults(response.users.items.map(u => ({...u, name: '', follows_back: false })));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (user: FollowUser) => {
    setStartingChat(user.handle);
    try {
      console.log('🔍 Checking pricing for user:', user.handle);
      
      // First, check the pricing for this conversation
      const pricingResponse = await calculateDMPrice(user.handle);
      
      console.log('💰 Pricing response:', pricingResponse);
      
      if (pricingResponse.success && pricingResponse.price_info) {
        if (pricingResponse.price_info.isFree) {
          // Free conversation - proceed normally
          console.log('✅ Free conversation, starting directly');
      const response = await startConversation(user.handle);
          if (response.success && response.conversation) {
        toast.success(`Started conversation with @${user.handle}! 🎉`);
                        onSuccess(response.conversation.id.toString(), {
              handle: response.conversation.other_user.handle,
              avatar: response.conversation.other_user.avatar
            });
            onOpenChange(false);
          } else {
            toast.error(response.error || 'Failed to start conversation');
          }
        } else {
          // Paid conversation - redirect to paid conversation page
          console.log('💰 Paid conversation, redirecting to payment page');
          toast.success(`Redirecting to payment page for @${user.handle}...`, {
            description: `This conversation requires ${pricingResponse.price_info.price} ETH to start`,
            duration: 2000,
          });
          navigate(`/messages/paid/${user.handle}`);
        onOpenChange(false);
        }
      } else {
        console.error('❌ Pricing check failed:', pricingResponse);
        // Show error but don't fallback automatically - let user decide
        toast.error('Unable to check messaging pricing. Please try again or contact support if this persists.');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setStartingChat(null);
    }
  };
  
  const ListHeader = ({ title }: { title: string }) => (
    <h3 className="text-xs font-semibold uppercase text-muted-foreground px-4 pt-4 pb-2">{title}</h3>
  );

  const UserItem = ({ user, index }: { user: FollowUser; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
      onClick={() => handleStartConversation(user)}
    >
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>{user.handle.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">@{user.handle}</p>
          <p className="text-sm text-muted-foreground">{user.name}</p>
        </div>
      </div>
      {startingChat === user.handle ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      ) : (
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      )}
    </motion.div>
  );
  
  const usersToShow = searchQuery.length > 2 ? searchResults : followers.concat(following);

  const loadFollowData = async () => {
    setLoadingFollows(true);
    try {
      const [followersResponse, followingResponse] = await Promise.all([
        getFollowers(currentUserHandle, 1, 50),
        getFollowing(currentUserHandle, 1, 50)
      ]);

      if (followersResponse.success && followersResponse.data) {
        setFollowers(followersResponse.data);
      }

      if (followingResponse.success && followingResponse.data) {
        setFollowing(followingResponse.data);
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoadingFollows(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center">
            <Send className="w-5 h-5 mr-2 text-primary"/>
            New Message
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
                <X className="h-4 w-4"/>
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          <AnimatePresence>
            {loading && usersToShow.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary"/>
              </div>
            ) : usersToShow.length > 0 ? (
              <>
                <ListHeader title={searchQuery.length > 2 ? 'Search Results' : 'Suggested'} />
                {usersToShow.map((user, index) => (
                  <UserItem key={user.id} user={user} index={index} />
                ))}
              </>
            ) : (
              <div className="text-center py-10 px-4">
                <p className="text-muted-foreground">
                  {searchQuery.length > 2 ? 'No users found.' : 'No suggested users. Try following some people!'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog; 