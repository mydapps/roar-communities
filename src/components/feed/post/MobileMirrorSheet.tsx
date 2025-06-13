import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, ChevronLeft, Loader2, Repeat2, Search, Users, User as UserIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { useMobileKeyboard, useFocusedInputScroll } from '@/hooks/useMobileKeyboard';

// Assuming Community type from API has at least: name: string, image?: string, handle?: string (optional slug)
interface ApiCommunityType {
  name: string;
  image?: string;
  handle?: string; // This is the community slug like 'tech-news', optional
  // Add any other properties that come from the API, e.g., members, description, etc.
  description?: string;
  members?: number;
}

// Constants
export const PERSONAL_FEED_INTERNAL_IDENTIFIER = '__PERSONAL_FEED__'; // For internal state management

// Interfaces
interface MobileMirrorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postData: {
    username: string;
    timeAgo: string;
    content: string;
    images?: string[];
    video?: string;
    postCode?: string; 
    community?: string; // Source community NAME (used for display and conflict check)
    avatarUrl?: string;
  };
  userCommunities: ApiCommunityType[] | null; 
  loadingUserCommunities: boolean;
  onMirrorSubmit: (communityTo: string, quoteText: string, postCode: string) => Promise<boolean>; 
}

interface SelectableItem {
  id: string; // Unique ID for the item (community name or personal feed identifier)
  displayName: string; 
  isPersonalFeed?: boolean;
  image?: string; 
  slug?: string; // Stores community.handle if it exists
  // Include other relevant ApiCommunityType properties if needed for display or logic
  originalCommunityData?: ApiCommunityType; // Store the original object if needed
}

const MobileMirrorSheet: React.FC<MobileMirrorSheetProps> = ({
  open,
  onOpenChange,
  postData,
  userCommunities,
  loadingUserCommunities,
  onMirrorSubmit
}) => {
  const [currentStep, setCurrentStep] = useState<'destination' | 'community_select' | 'quote_confirm'>('destination');
  const [selectedDestination, setSelectedDestination] = useState<SelectableItem | null>(null);
  const [quoteText, setQuoteText] = useState('');
  const [isMirroring, setIsMirroring] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const quoteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const communitySearchRef = useRef<HTMLInputElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  
  // Use the shared keyboard detection hook
  const { isKeyboardVisible, keyboardHeight, safeViewportHeight } = useMobileKeyboard(open);
  
  // Use the focused input scroll hook
  useFocusedInputScroll(isKeyboardVisible, [quoteTextareaRef, communitySearchRef]);

  useEffect(() => {
    if (!open) {
      setCurrentStep('destination');
      setSelectedDestination(null);
      setQuoteText('');
      setIsMirroring(false);
      setCommunitySearchQuery('');
    }
  }, [open]);

  const handleSelectPersonalFeed = () => {
    setSelectedDestination({ 
        id: PERSONAL_FEED_INTERNAL_IDENTIFIER, 
        displayName: 'My Personal Feed', 
        isPersonalFeed: true, 
        image: postData.avatarUrl || '' 
    });
    setCurrentStep('quote_confirm');
  };

  const handleSelectCommunityDestination = () => {
    setCurrentStep('community_select');
  };

  const handleCommunitySelected = (community: ApiCommunityType) => {
    if (postData.community && community.name === postData.community) {
      toast.error("Cannot mirror to the same community it's already in.");
      return;
    }
    setSelectedDestination({ 
        id: community.name, 
        displayName: community.name,
        isPersonalFeed: false,
        image: community.image,
        slug: community.handle, // community.handle is optional
        originalCommunityData: community
    });
    setCurrentStep('quote_confirm');
  };

  const handleSubmitMirror = async () => {
    if (!selectedDestination || !postData.postCode) {
      toast.error("Please select a destination or post information is missing.");
      return;
    }
    setIsMirroring(true);
    try {
      const communityToApi = selectedDestination.isPersonalFeed ? "" : selectedDestination.id; // id here is community.name
      const success = await onMirrorSubmit(communityToApi, quoteText, postData.postCode);
      if (success) {
        onOpenChange(false); 
      }
    } catch (error) {
      console.error("Mirror submission error in sheet:", error);
      toast.error("An unexpected error occurred while mirroring.");
    } finally {
      setIsMirroring(false);
    }
  };

  const goBack = () => {
    if (currentStep === 'quote_confirm') {
      setCurrentStep(selectedDestination?.isPersonalFeed ? 'destination' : 'community_select');
      if(selectedDestination?.isPersonalFeed) setSelectedDestination(null);
    } else if (currentStep === 'community_select') {
      setCurrentStep('destination');
      setSelectedDestination(null); 
    }
  };

  const communityOptionsForList: SelectableItem[] = useMemo(() => {
    if (!userCommunities) return [];
    const query = communitySearchQuery.toLowerCase().trim();
    const filtered = userCommunities.filter(community =>
      community.name.toLowerCase().includes(query) ||
      (community.handle && community.handle.toLowerCase().includes(query)) // Safely access optional handle
    );
    return filtered.map(c => ({ 
        id: c.name, 
        displayName: c.name,
        image: c.image,
        slug: c.handle, // c.handle is optional
        isPersonalFeed: false,
        originalCommunityData: c
    })); 
  }, [userCommunities, communitySearchQuery]);

  const SimplifiedPostPreview = () => {
    const sanitizedContent = sanitizeHtml(postData.content);
    return (
      <div className={`border rounded-lg p-3 mb-3 bg-muted/30 text-sm ${isKeyboardVisible ? 'mb-1' : 'mb-3'}`}>
          <div className="flex items-center mb-1.5">
              <Avatar className="h-7 w-7 mr-2 flex-shrink-0">
                  <AvatarImage src={postData.avatarUrl || undefined} alt={postData.username} />
                  <AvatarFallback>{postData.username.substring(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                  <p className="font-medium text-xs truncate">{postData.username}</p>
                  <p className="text-xs text-muted-foreground">Original post</p>
              </div>
          </div>
          {sanitizedContent && (
            <div 
              className="text-[13px] leading-snug line-clamp-3 break-words prose prose-xs max-w-none dark:prose-invert prose-p:my-0.5 prose-strong:font-semibold prose-em:italic"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'destination':
        return (
          <div className="p-4 space-y-3">
            <Button variant="outline" size="lg" className="w-full justify-start py-5 text-left h-auto items-center" onClick={handleSelectPersonalFeed}>
              <UserIcon className="h-5 w-5 mr-3 flex-shrink-0 text-sky-500" />
              <div>
                <span className="font-semibold block text-sm">My Personal Feed</span>
                <span className="text-xs text-muted-foreground block">Share this post with your followers.</span>
              </div>
            </Button>
            <Button variant="outline" size="lg" className="w-full justify-start py-5 text-left h-auto items-center" onClick={handleSelectCommunityDestination} disabled={loadingUserCommunities || !userCommunities || userCommunities.length === 0}>
              <Users className="h-5 w-5 mr-3 flex-shrink-0 text-orange-500" />
              <div>
                <span className="font-semibold block text-sm">A Community</span>
                <span className="text-xs text-muted-foreground block">
                  {loadingUserCommunities ? 'Loading communities...' : (!userCommunities || userCommunities.length === 0) ? 'No communities joined yet.' : 'Choose one of your communities.'}
                </span>
              </div>
            </Button>
          </div>
        );

      case 'community_select':
        return (
          <div className="px-4 pt-3 pb-1 flex flex-col h-full">
            <div className="relative mb-3 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={communitySearchRef}
                placeholder="Search your communities..."
                className="pl-9 h-10 text-sm"
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
              />
            </div>
            {loadingUserCommunities ? (
              <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : communityOptionsForList.length > 0 ? (
              <div 
                className="flex-grow overflow-y-auto space-y-1.5 pr-0.5 mr-[-2px]"
                style={{
                  // Ensure community list stays above keyboard
                  maxHeight: isKeyboardVisible ? `${safeViewportHeight - 200}px` : 'auto'
                }}
              >
                {communityOptionsForList.map(item => (
                  <Button
                    key={item.id}
                    variant={selectedDestination?.id === item.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-auto py-2 px-2.5 text-left items-center"
                    onClick={() => item.originalCommunityData && handleCommunitySelected(item.originalCommunityData)} 
                    disabled={postData.community === item.displayName}
                  >
                    <Avatar className="h-8 w-8 mr-2.5 flex-shrink-0">
                      <AvatarImage src={item.image || undefined} alt={item.displayName} />
                      <AvatarFallback>{item.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <span className="font-medium block truncate text-sm">{item.displayName}</span>
                      {item.slug && <span className="text-xs text-muted-foreground block truncate">c/{item.slug}</span>}
                      {postData.community === item.displayName && (
                        <span className="text-xs text-destructive block mt-0.5">(Original community)</span>
                      )}
                    </div>
                    {selectedDestination?.id === item.id && <Check className="h-4 w-4 ml-auto text-primary flex-shrink-0" />}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium text-sm">No communities found</p>
                <p className="text-xs mt-0.5">
                  {communitySearchQuery ? 'Try a different search term or clear search.' : 'You don\'t seem to be part of any communities yet.'}
                </p>
              </div>
            )}
          </div>
        );

      case 'quote_confirm':
        return (
          <div className={`px-3 flex flex-col ${isKeyboardVisible ? 'pt-1 pb-1 h-full' : 'pt-3 pb-4 h-full'}`}>
            {/* Post preview - minimal when keyboard is visible */}
            {isKeyboardVisible ? (
              <div className="flex items-center py-1 mb-1 text-xs flex-shrink-0">
                <Avatar className="h-3 w-3 mr-1.5">
                  <AvatarImage src={postData.avatarUrl || undefined} alt={postData.username} />
                  <AvatarFallback className="text-[8px]">{postData.username.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-muted-foreground">Mirroring {postData.username}'s post</span>
              </div>
            ) : (
              <div className="flex-shrink-0">
                <SimplifiedPostPreview />
              </div>
            )}
            
            {/* Textarea - flexible sizing based on keyboard state */}
            <Textarea
              ref={quoteTextareaRef}
              placeholder="Add a quote (optional)..."
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className={`text-sm resize-none ${
                isKeyboardVisible 
                  ? 'h-20 mb-1 text-xs flex-shrink-0' // Fixed height when keyboard visible
                  : 'flex-grow min-h-[80px] mb-2' // Flexible height when keyboard hidden
              }`}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 'destination': return 'Mirror Post To...';
      case 'community_select': return 'Select a Community';
      case 'quote_confirm': return `Mirror to ${selectedDestination?.displayName || 'Destination'}`;
      default: return 'Mirror Post';
    }
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        ref={drawerContentRef}
        className="flex flex-col bg-card"
        style={{
          ...(isKeyboardVisible ? {
            position: 'fixed',
            bottom: '0px',
            left: '0px',
            right: '0px',
            height: `${Math.min(safeViewportHeight - 20, 400)}px`, // Adaptive height with max limit
            maxHeight: `${safeViewportHeight - 20}px`,
            minHeight: '200px',
            transform: 'translateY(0)',
            borderRadius: '12px 12px 0 0',
            zIndex: 9999
          } : {
            height: 'auto',
            maxHeight: '90vh',
            minHeight: '300px'
          })
        }}
      >
        <DrawerHeader className={`text-left border-b flex-shrink-0 px-3 ${isKeyboardVisible ? 'py-1.5' : 'py-3'}`}>
          <div className="flex items-center">
            {currentStep !== 'destination' && (
              <Button variant="ghost" size="icon" onClick={goBack} className={`mr-1.5 -ml-1 ${isKeyboardVisible ? 'h-6 w-6' : 'h-8 w-8'}`}>
                <ChevronLeft className={`${isKeyboardVisible ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </Button>
            )}
            <div className="flex-grow">
                <DrawerTitle className={`font-semibold ${isKeyboardVisible ? 'text-sm' : 'text-base'}`}>{getHeaderTitle()}</DrawerTitle>
            </div>
            <DrawerClose asChild className={`ml-auto -mr-1 ${isKeyboardVisible ? 'h-6 w-6' : 'h-8 w-8'}`}>
                <Button variant="ghost" size="icon"><XIcon className={`${isKeyboardVisible ? 'h-4 w-4' : 'h-5 w-5'}`} /></Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div 
          className="flex-grow overflow-y-auto" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            // Ensure content area respects safe area
            height: isKeyboardVisible ? `${safeViewportHeight - 140}px` : 'auto'
          }}
        >
          {renderStepContent()}
        </div>

        {currentStep === 'quote_confirm' && selectedDestination && (
          <DrawerFooter 
            className={`border-t flex-shrink-0 bg-card ${isKeyboardVisible ? 'p-2' : 'p-3'}`}
            style={{
              // Ensure footer stays above keyboard
              position: isKeyboardVisible ? 'sticky' : 'relative',
              bottom: 0,
              zIndex: 10
            }}
          >
            <Button 
                size={isKeyboardVisible ? "sm" : "lg"}
                onClick={handleSubmitMirror} 
                disabled={isMirroring}
                className={`w-full font-semibold ${isKeyboardVisible ? 'h-8 text-xs py-1' : 'h-11 text-sm'}`}
            >
              {isMirroring ? <Loader2 className={`${isKeyboardVisible ? 'h-3 w-3' : 'h-5 w-5'} animate-spin mr-1`} /> : <Repeat2 className={`${isKeyboardVisible ? 'h-3 w-3' : 'h-5 w-5'} mr-1`} />}
              {isMirroring ? 'Mirroring...' : `Mirror to ${selectedDestination.displayName}`}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMirrorSheet; 