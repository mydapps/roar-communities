import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedCommentItem } from './EnhancedCommentItem';
import { fetchReplies, CommentReply, createReply, toggleMeow } from '@/utils/commentApi';
import { RefreshCw, Send, Loader2, ImageIcon, VideoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileReplyDrawer } from './MobileReplyDrawer';
import { NotInCommunitySheet } from '@/components/community/NotInCommunitySheet';
import { MediaUpload, MediaPreview, MediaUploadResponse } from '@/components/ui/media-upload';
import { MentionSuggestionsList, SuggestionItem } from '@/components/mentions/MentionSuggestionsList';
import { searchUsers, searchCommunities, SearchUserItem, SearchCommunityItem } from '@/utils/searchApi';
import { debounce } from 'lodash';

interface EnhancedCommentsSectionProps {
  postCode: string;
  initialReplies?: CommentReply[];
  initialReplyCount?: number;
  postAuthorHandle: string;
}

export const EnhancedCommentsSection = ({
  postCode,
  initialReplies = [],
  initialReplyCount = 0,
  postAuthorHandle
}: EnhancedCommentsSectionProps) => {
  const [replies, setReplies] = useState<CommentReply[]>(initialReplies);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    handle: string;
    avatar?: string;
    content: string;
    isPost: boolean;
  } | null>(null);
  const isMobile = useIsMobile();
  const [notInCommunitySheetOpen, setNotInCommunitySheetOpen] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);
  const newCommentInputRef = useRef<HTMLTextAreaElement>(null);

  const [mentionType, setMentionType] = useState<'user' | 'community' | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [mentionLoading, setMentionLoading] = useState<boolean>(false);
  const [activeTriggerPos, setActiveTriggerPos] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  const handleInitiateMentionInNewComment = (username: string) => {
    if (newCommentInputRef.current) {
      const mention = `@${username} `;
      const currentComment = newCommentInputRef.current.value;
      // Prepend if not already there, or handle smarter insertion
      if (!currentComment.startsWith(mention)) {
        setNewComment(mention + currentComment);
      }
      newCommentInputRef.current.focus();
      // Optionally move cursor after the mention
      setTimeout(() => {
        if (newCommentInputRef.current) {
          newCommentInputRef.current.setSelectionRange(mention.length, mention.length);
        }
      }, 0);
      // Ensure suggestions are closed if they were open for something else
      setShowSuggestions(false); 
    }
  };

  const fetchComments = useCallback(async () => {
    if (!postCode) return;
    
    setLoading(true);
    
    try {
      console.log(`Fetching comments for post ${postCode}`);
      const response = await fetchReplies(postCode, 20);
      
      if (response.success) {
        console.log('Fetched replies successfully:', response.replies);
        setReplies(response.replies);
        setReplyCount(response.total_count);
      } else {
        console.error('Failed to fetch replies:', response);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Could not load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postCode]);
  
  useEffect(() => {
    if (initialReplies.length === 0) {
      fetchComments();
    }
  }, [fetchComments, initialReplies.length]);
  
  const handleMediaUploaded = (media: MediaUploadResponse) => {
    if (uploadedMedia) {
      toast.error("You can only attach one image or video per comment.");
      return;
    }
    if (!media || typeof media !== 'object' || !media.type || !media.url) {
      console.error("Invalid media object received:", media);
      toast.error('Invalid media data received from server');
      return;
    }
    setUploadedMedia(media);
    toast.success(`${media.type === 'image' ? 'Image' : 'Video'} added`);
  };

  const removeMedia = () => {
    setUploadedMedia(null);
  };
  
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newComment.trim() && !uploadedMedia) return;
    
    setSubmitting(true);
    
    let finalContent = newComment.trim();
    if (uploadedMedia && uploadedMedia.url) {
      let mediaUrl = uploadedMedia.url;
      if (!mediaUrl.startsWith('http')) {
        if (mediaUrl.startsWith('//')) {
          mediaUrl = 'https:' + mediaUrl;
        } else if (mediaUrl.startsWith('/')) {
          mediaUrl = window.location.origin + mediaUrl;
        }
      }
      
      const markdown = finalContent.length > 0 ? `\n\n![](${mediaUrl})` : `![](${mediaUrl})`;
      console.log('Adding media markdown:', markdown);
      finalContent += markdown;
    }
    
    try {
      console.log('Submitting comment to post:', postCode, 'Content:', finalContent);
      const response = await createReply(postCode, finalContent);
      
      if (!response.success && response.errCode === "004" && response.communityName) {
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        setSubmitting(false);
        return;
      }
      
      if (response.success && response.reply_id) {
        console.log("Server returned reply_id:", response.reply_id);
        
        const newReply: CommentReply = {
          id: response.reply_id,
          uid: 0,
          handle: response.handle || localStorage.getItem('dapps_user_handle') || 'you',
          avatar_url: response.avatar_url || localStorage.getItem('dapps_user_avatar') || 'default',
          content: finalContent,
          created_on: response.created_on || new Date().toISOString(),
          time_ago: 'just now',
          upvotes: 0,
          meow_count: 0,
          has_meowed: false,
          sub_replies: []
        };
        
        console.log("Created new comment with server-assigned ID:", newReply.id);
        
        setReplies(prev => [...prev, newReply]);
        setReplyCount(prev => prev + 1);
        setNewComment('');
        setUploadedMedia(null);
        setShowSuggestions(false);
      } else {
        console.error('API response missing reply_id or success=false:', response);
        toast.error('Error adding comment. Please try again.');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Could not post your comment. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReplyToComment = async (parentId: number, content: string) => {
    if (!content.trim()) {
      if (isMobile) {
        const findComment = (comments: CommentReply[], id: number): CommentReply | undefined => {
          for (const comment of comments) {
            if (comment.id === id) return comment;
            if (comment.sub_replies) {
              const found = findComment(comment.sub_replies, id);
              if (found) return found;
            }
          }
          return undefined;
        };
        
        const targetComment = findComment(replies, parentId);
        if (targetComment) {
          setReplyTarget({
            id: parentId,
            handle: targetComment.handle,
            avatar: targetComment.avatar_url,
            content: targetComment.content,
            isPost: false
          });
          setDrawerOpen(true);
        }
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    
    try {
      console.log(`Creating reply to comment ${parentId} with content: ${content}`);
      const response = await createReply(postCode, content, parentId);
      
      if (!response.success && response.errCode === "004" && response.communityName) {
        setCommunityName(response.communityName);
        setNotInCommunitySheetOpen(true);
        return Promise.resolve();
      }
      
      if (response.success && response.reply_id) {
        console.log('Reply created successfully with ID:', response.reply_id);
        
        const newReply: CommentReply = {
          id: response.reply_id,
          uid: 0,
          handle: response.handle || localStorage.getItem('dapps_user_handle') || 'you',
          avatar_url: response.avatar_url || localStorage.getItem('dapps_user_avatar') || 'default',
          content: content,
          created_on: response.created_on || new Date().toISOString(),
          time_ago: 'just now',
          upvotes: 0,
          meow_count: 0,
          has_meowed: false
        };
        
        console.log("Created new reply with server-assigned ID:", newReply.id);
        
        setReplies(prevReplies => {
          const addReplyToComment = (comments: CommentReply[]): CommentReply[] => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  sub_replies: comment.sub_replies 
                    ? [...comment.sub_replies, newReply] 
                    : [newReply]
                };
              } else if (comment.sub_replies) {
                return {
                  ...comment,
                  sub_replies: addReplyToComment(comment.sub_replies)
                };
              }
              return comment;
            });
          };
          
          return addReplyToComment(prevReplies);
        });
        
        setReplyCount(prev => prev + 1);
        setShowSuggestions(false);
      } else {
        console.error('API response missing reply_id or success=false:', response);
        toast.error('Error adding reply. Please try again.');
        console.log('API reported success=false or missing reply_id, refreshing comments');
        fetchComments();
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Could not post your reply. Please try again.');
      return Promise.reject(error);
    }
  };
  
  const handleMeowChange = async (commentId: number, newState: boolean) => {
    console.log(`Toggling meow for comment ID: ${commentId} to ${newState}`);
    
    if (!commentId || isNaN(commentId) || commentId <= 0) {
      console.error(`Invalid comment ID for meow toggle: ${commentId}`);
      toast.error('Cannot update reaction: Invalid comment ID');
      return;
    }
    
    const updatedReplies = updateMeowState(replies, commentId, newState);
    setReplies(updatedReplies);
    
    try {
      const response = await toggleMeow(commentId);
      console.log('Meow toggle response:', response);
      
      if (!response.success) {
        console.error(`Server returned success=false for meow toggle on comment ID ${commentId}`);
        throw new Error(`Server returned success=false for meow toggle`);
      }
    } catch (error) {
      console.error(`Error toggling meow for comment ID ${commentId}:`, error);
      const revertedReplies = updateMeowState(replies, commentId, !newState);
      setReplies(revertedReplies);
      toast.error('Could not update meow. Please try again.');
    }
  };
  
  const updateMeowState = (
    replyList: CommentReply[], 
    targetId: number, 
    newState: boolean
  ): CommentReply[] => {
    return replyList.map(reply => {
      if (reply.id === targetId) {
        return {
          ...reply,
          has_meowed: newState,
          meow_count: newState ? reply.meow_count + 1 : Math.max(0, reply.meow_count - 1)
        };
      }
      
      if (reply.sub_replies && reply.sub_replies.length > 0) {
        return {
          ...reply,
          sub_replies: updateMeowState(reply.sub_replies, targetId, newState)
        };
      }
      
      return reply;
    });
  };

  const openReplyDrawer = (id: number, handle: string, avatar: string, content: string, isPost: boolean = false) => {
    setReplyTarget({
      id,
      handle,
      avatar,
      content,
      isPost
    });
    setDrawerOpen(true);
  };

  const drawerSubmissionInProgress = useRef(false);

  const handleDrawerSubmit = async (content: string) => {
    if (!replyTarget || drawerSubmissionInProgress.current) return Promise.reject(new Error('No reply target or submission in progress'));
    
    drawerSubmissionInProgress.current = true;
    
    try {
      if (replyTarget.isPost) {
        setNewComment(content);
        await handleSubmitComment();
      } else {
        await handleReplyToComment(replyTarget.id, content);
      }
      
      setTimeout(() => {
        drawerSubmissionInProgress.current = false;
      }, 500);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error in drawer submit:', error);
      drawerSubmissionInProgress.current = false;
      return Promise.reject(error);
    }
  };

  const getTriggerInfo = (textarea: HTMLTextAreaElement): { trigger: '@' | '/c/' | null; query: string; startPos: number } | null => {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    const textBeforeCursor = text.substring(0, cursorPos);
    
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const lastSlashC = textBeforeCursor.lastIndexOf('/c/');
    
    let triggerPos = -1;
    let trigger: '@' | '/c/' | null = null;
    
    if (lastAt > lastSlashC) {
      triggerPos = lastAt;
      trigger = '@';
    } else if (lastSlashC > lastAt && lastSlashC + 2 < cursorPos) { 
      triggerPos = lastSlashC;
      trigger = '/c/';
    } else if (lastSlashC === lastAt && lastAt !== -1) { 
        triggerPos = lastAt;
        trigger = '@';
    }
    
    if (triggerPos === -1) return null;
    
    const triggerLength = trigger === '@' ? 1 : 3; 
    const queryStartPos = triggerPos + triggerLength;
    
    if(cursorPos < queryStartPos) return null;

    if (cursorPos === queryStartPos && text.charAt(queryStartPos) === ' ') {
        return null;
    }
    
    const query = text.substring(queryStartPos, cursorPos);
    
    if (query.match(/\s/) || query.match(/\n/)) {
      return null;
    }
    
    if (query.length < 2) {
      return null;
    }

    return { trigger, query, startPos: triggerPos };
  };

  const fetchSuggestionsDebounced = useCallback(
    debounce(async (type: 'user' | 'community', query: string) => {
      if (query.length < 2) {
        setShowSuggestions(false);
        return;
      }
      setMentionLoading(true);
      setSuggestions([]);
      try {
        let fetchedSuggestions: SuggestionItem[] = [];
        if (type === 'user') {
          const response = await searchUsers(query, 1, 5);
          if (response.success && response.users) {
            fetchedSuggestions = response.users.items.map((user: SearchUserItem) => ({
              id: user.handle,
              display: user.handle,
              image: user.avatar_url,
              type: 'user'
            }));
          }
        } else { // type === 'community'
          const response = await searchCommunities(query, 1, 5);
          if (response.success && response.communities) {
            fetchedSuggestions = response.communities.items.map((comm: SearchCommunityItem) => ({
              id: comm.name,
              display: comm.name,
              subDisplay: `c/${comm.name}`,
              image: comm.image,
              type: 'community'
            }));
          }
        }
        const uniqueSuggestions = fetchedSuggestions.filter(
          (suggestion, index, self) =>
            index === self.findIndex((s) => s.id === suggestion.id && s.type === suggestion.type)
        );
        setSuggestions(uniqueSuggestions);
        setShowSuggestions(uniqueSuggestions.length > 0);
      } catch (error) {
        console.error(`Error fetching ${type} suggestions:`, error);
        setShowSuggestions(false);
      } finally {
        setMentionLoading(false);
      }
    }, 300),
    []
  );

  const handleNewCommentContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setNewComment(textarea.value);

    const triggerInfo = getTriggerInfo(textarea);

    if (triggerInfo) {
      const currentMentionType = triggerInfo.trigger === '@' ? 'user' : 'community';
      if (triggerInfo.query !== mentionQuery || currentMentionType !== mentionType) {
        setMentionType(currentMentionType);
        setMentionQuery(triggerInfo.query);
        setActiveTriggerPos(triggerInfo.startPos);
        setShowSuggestions(true);
        fetchSuggestionsDebounced(currentMentionType, triggerInfo.query);
      } else if (!showSuggestions && suggestions.length > 0) {
        setShowSuggestions(true);
      }
    } else {
      if(showSuggestions) {
         setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestionItem) => {
    if (newCommentInputRef.current && activeTriggerPos !== null && mentionType) {
      const currentText = newCommentInputRef.current.value;
      
      const mentionId = suggestion.type === 'community' && suggestion.id.includes('/') ? suggestion.id.split('/')[1] : suggestion.id;
      const mentionText = mentionType === 'user' ? `@${mentionId} ` : `/c/${mentionId} `;
      
      const textBefore = currentText.substring(0, activeTriggerPos);
      
      const triggerCharLength = mentionType === 'user' ? 1 : 3;
      const endOfQueryToReplace = activeTriggerPos + triggerCharLength + mentionQuery.length;
      const textAfter = currentText.substring(endOfQueryToReplace);

      const newText = textBefore + mentionText + textAfter;
      setNewComment(newText);
      
      const newCursorPos = activeTriggerPos + mentionText.length;
      setTimeout(() => {
          if(newCommentInputRef.current) {
            newCommentInputRef.current.focus();
            newCommentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);

      setShowSuggestions(false);
      setMentionQuery('');
      setMentionType(null);
      setActiveTriggerPos(null);
      setHighlightedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Comments ({replyCount})</h2>
        
        <div className="space-y-4">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarImage 
                  src={`https://img.dapps.co/avatar/${localStorage.getItem('dapps_user_avatar') || 'default'}.svg`} 
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2 relative">
                <Textarea
                  ref={newCommentInputRef}
                  placeholder="Join the conversation..."
                  value={newComment}
                  onChange={handleNewCommentContentChange}
                  rows={3}
                  className="resize-none"
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => {
                    if (suggestionsContainerRef.current && 
                        !suggestionsContainerRef.current.contains(e.relatedTarget as Node | null)) {
                      setShowSuggestions(false); 
                      setHighlightedIndex(-1);
                    }
                  }}
                  onFocus={(e) => {
                    const triggerInfo = getTriggerInfo(e.target);
                    if (triggerInfo && triggerInfo.query === mentionQuery && mentionType) {
                       if(suggestions.length > 0) setShowSuggestions(true);
                    }
                  }}
                />
                
                {showSuggestions && (
                  <div 
                    ref={suggestionsContainerRef}
                    className="absolute z-10 w-full mt-1 md:w-auto md:max-w-xs"
                  >
                    <MentionSuggestionsList
                      suggestions={suggestions}
                      isLoading={mentionLoading}
                      onSelect={handleSuggestionSelect}
                      mentionType={mentionType}
                      highlightedIndex={highlightedIndex}
                      onItemHover={setHighlightedIndex}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    {uploadedMedia ? (
                      <div className="w-24 h-24 relative">
                        <MediaPreview
                          media={uploadedMedia}
                          onRemove={removeMedia}
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <MediaUpload
                          onMediaUploaded={handleMediaUploaded}
                          disabled={submitting}
                          acceptedTypes="image"
                          maxFiles={1}
                        >
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            disabled={submitting}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </MediaUpload>
      
                        <MediaUpload
                          onMediaUploaded={handleMediaUploaded}
                          disabled={submitting}
                          acceptedTypes="video"
                          maxFiles={1}
                        >
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            disabled={submitting}
                          >
                            <VideoIcon className="h-4 w-4" />
                          </Button>
                        </MediaUpload>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="text-xs h-8 gap-1.5"
                    disabled={submitting || (!newComment.trim() && !uploadedMedia)}
                    onClick={() => handleSubmitComment()}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </form>
          
          {loading && replies.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {!loading && replies.length === 0 && (
            <div className="text-center py-8 bg-muted/20 rounded-lg border border-border/40">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          )}
          
          {replies.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-4">
                <h3 className="text-sm font-medium">Recent Comments</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchComments} 
                  disabled={loading}
                  className="h-8 text-xs gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
      
              <div className="space-y-6 divide-y divide-border/20">
                {replies.map(reply => (
                  <div key={reply.id} className="pt-6 first:pt-0">
                    <EnhancedCommentItem 
                      comment={reply}
                      postAuthorHandle={postAuthorHandle}
                      onMeowChange={handleMeowChange}
                      onReply={handleReplyToComment}
                      isAuthorReplying={reply.handle === postAuthorHandle}
                      isMobile={isMobile}
                      onOpenMobileReply={(id, handle, avatar, content) => openReplyDrawer(id, handle, avatar, content, false)}
                      onInitiateMention={handleInitiateMentionInNewComment}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {isMobile && (
        <MobileReplyDrawer 
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          targetUser={replyTarget?.handle || ''}
          targetUserAvatar={replyTarget?.avatar || 'default'}
          targetContent={replyTarget?.content || ''}
          isReplyingTo={replyTarget?.isPost ? 'post' : 'comment'}
          onSubmit={handleDrawerSubmit}
        />
      )}
      
      <NotInCommunitySheet 
        open={notInCommunitySheetOpen}
        onOpenChange={setNotInCommunitySheetOpen}
        communityName={communityName}
      />
    </div>
  );
};
