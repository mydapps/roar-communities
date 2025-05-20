import React, { useState, useEffect, useMemo } from 'react';
import { CardContent } from '@/components/ui/card';
import { MediaCarousel } from './MediaCarousel';
import { MirrorPostContent } from './MirrorPostContent';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { LinkPreviewCard, LinkPreviewData } from './LinkPreviewCard';
import { YoutubeEmbed } from './YoutubeEmbed';
import { Loader2 } from 'lucide-react';
// Link component is not used if we are generating <a> tags directly in the string.
// import { Link } from 'react-router-dom'; 

// Import PollDisplay and PollData
import { PollDisplay } from '@/components/polls/PollDisplay';
import { PollData } from '@/utils/postApi';

interface PostContentProps {
  content: string;
  isMirror: boolean;
  mirrorData?: {
    quote: string;
    originalAuthor: string;
    originalCommunity: string;
    originalBody: string;
    originalTimeAgo: string;
    originalAvatar: string;
    originalImages?: string[];
    originalTitle?: string;
    originalPostCode?: string;
  };
  hasMedia: boolean;
  allMedia?: { type: 'image' | 'video', url: string }[];
  onImageClick: (imageSrc: string) => void;

  // New props for polls
  is_poll?: boolean;
  poll_data?: PollData | null;
  postCode?: string; // Required by PollDisplay
  onVoteOnPoll?: (optionId: number) => Promise<void>; // Required by PollDisplay
}

export const PostContent: React.FC<PostContentProps> = ({
  content,
  isMirror,
  mirrorData,
  hasMedia,
  allMedia,
  onImageClick,
  // Destructure new props
  is_poll = false,
  poll_data = null,
  postCode,
  onVoteOnPoll,
}) => {
  // If it's a poll, render PollDisplay and return early.
  // The poll question itself comes from the main `content` prop.
  if (is_poll && poll_data && postCode && onVoteOnPoll) {
    return (
      <CardContent className="pb-3">
        <PollDisplay 
          pollQuestion={content} 
          pollData={poll_data}
          postCode={postCode}
          onVote={onVoteOnPoll}
          className="my-0"
        />
      </CardContent>
    );
  }

  // --- STATE FOR URL PREVIEW/EMBED (for non-mirrored content or mirror quote) ---
  const [firstUrl, setFirstUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  // --- END STATE ---

  // Determine the text that might contain a quote for a mirror, or the main content for a regular post.
  // For mirrors, `content` prop is the mirror's own body/quote.
  // For regular posts, `content` is the post body.
  const contentToProcessForLinks = content; 

  useEffect(() => {
    setFirstUrl(null);
    setPreviewData(null);
    setYoutubeVideoId(null);
    setIsLoadingPreview(false);
    setPreviewError(null);

    if (contentToProcessForLinks) {
      const urlRegex = /\b(?:https?:\/\/|www\.)[^\s<>()"]*[^\s<>()"\.,!?:;']/i;
      const match = contentToProcessForLinks.match(urlRegex);
      if (match && match[0]) {
        let detectedUrl = match[0];
        if (detectedUrl.startsWith('www.') && !detectedUrl.startsWith('http')) {
          detectedUrl = 'http://' + detectedUrl;
        }
        setFirstUrl(detectedUrl);
      }
    }
  }, [contentToProcessForLinks]);

  useEffect(() => {
    if (!firstUrl) {
      setPreviewData(null);
      setYoutubeVideoId(null);
      return;
    }
    // 1. Check for YouTube Link (including Shorts)
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = firstUrl.match(youtubeRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      setYoutubeVideoId(youtubeMatch[1]);
      setPreviewData(null); // Ensure no stale preview data
      setIsLoadingPreview(false);
      return;
    }

    // 2. If not YouTube, fetch general link preview
    setYoutubeVideoId(null); // Ensure no stale youtube id
    setIsLoadingPreview(true);
    setPreviewError(null);
    setPreviewData(null); // Clear previous data

    const fetchPreview = async () => {
      try {
        const encodedUrl = encodeURIComponent(firstUrl);
        console.log('[PostContent] Fetching preview for URL:', firstUrl, 'Encoded:', encodedUrl);

        const response = await fetch(`/api/get_link_preview?url=${encodedUrl}`);
        console.log('[PostContent] Response status:', response.status, 'Status text:', response.statusText);

        if (!response.ok) {
          let errorData = { error: `Failed to fetch preview. Status: ${response.status} ${response.statusText}` };
          try {
            errorData = await response.json();
            console.log('[PostContent] Error data from API:', errorData);
          } catch (jsonError) {
            console.error('[PostContent] Could not parse error response as JSON:', jsonError);
            // Use the already prepared error message if JSON parsing fails
          }
          throw new Error(errorData?.error || `Failed to fetch preview. Status: ${response.status}`);
        }
        
        const data: LinkPreviewData | { success: false; error: string } = await response.json();
        console.log('[PostContent] Data from API:', data);

        if (data.success) {
          setPreviewData(data as LinkPreviewData);
        } else {
          const errorResult = data as { success: false; error: string };
          setPreviewError(errorResult.error || 'Could not fetch link preview.');
          console.warn('Preview fetch error:', errorResult.error);
        }
      } catch (err: any) {
        setPreviewError(err.message || 'An unexpected error occurred during preview fetch.');
        console.error('[PostContent] Preview fetch exception:', err, 'URL attempted:', firstUrl);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreview();

  }, [firstUrl]); // Re-run when firstUrl changes

  // Regex to find: 
  // 1. URLs (absolute with http/https or starting with www)
  // 2. User mentions (@username or @username.suffix) NOT preceded by URL-like characters or within an email-like structure.
  // 3. Community mentions (/c/communityname) NOT preceded by URL-like characters.
  // 4. Email addresses
  const MENTION_OR_URL_REGEX = new RegExp(
    '(\\b(?:https?:\/\/|www\\.)[^\\s<>()\"]*[^\\s<>()\"\\.,!?:;\'])' + // Group 1: Full URL (improved, includes www, excludes trailing punctuation, handles parentheses better)
    '|(?<![\\w\\/@\\.])(@([a-zA-Z0-9_\\-]+(?:\\.[a-zA-Z0-9_\\-]+)*))' + // Group 2 for full @mention, Group 3 for username part
    '|(?<![\\w\\/])(\\/c\\/([a-zA-Z0-9_\\-]+))' + // Group 4 for full /c/mention, Group 5 for community name part
    '|(\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b)', // Group 6: Email addresses
    'g'
  );
  
  // Using replace with a function to build the new string with segments
  const initialSanitizedContent = sanitizeHtml(contentToProcessForLinks);
  let finalHtml = '';
  let lastIndex = 0;

  initialSanitizedContent.replace(MENTION_OR_URL_REGEX, (match, 
    url, userMentionFull, _userMentionInner, communityMentionFull, _communityMentionInner, email, offset
  ) => {
    finalHtml += initialSanitizedContent.substring(lastIndex, offset);

    if (url) {
      let linkHref = url;
      // Prepend http:// if URL starts with www. and doesn't have a scheme
      if (url.startsWith('www.') && !url.startsWith('http://') && !url.startsWith('https://')) {
        linkHref = 'http://' + url;
      }

      // Append loadIn=defaultBrowser parameter
      if (linkHref.includes('?')) {
        linkHref += '&loadIn=defaultBrowser';
      } else {
        linkHref += '?loadIn=defaultBrowser';
      }
      finalHtml += `<a href="${linkHref}" target="_blank" rel="noopener noreferrer ugc" class="text-primary hover:underline">${url}</a>`;
    } else if (email) {
      // If it's an email, just append it as is (or mailto: link if desired, but problem statement was about @ in URLs vs mentions)
      // For now, rendering as plain text to prevent @ in email being a user link.
      finalHtml += email;
    } else if (userMentionFull) {
      const usernameForUrl = userMentionFull.substring(1).split('.')[0]; // Remove '@' and .suffix for URL
      finalHtml += `<a href="/u/${usernameForUrl}" class="text-primary hover:underline">${userMentionFull}</a>`;
    } else if (communityMentionFull) {
      const communityName = communityMentionFull.substring(3); // Remove '/c/'
      finalHtml += `<a href="/c/${communityName}" class="text-primary hover:underline">${communityMentionFull}</a>`;
    }
    
    lastIndex = offset + match.length;
    return match; // Necessary for .replace() with a function, but we build finalHtml manually
  });

  // Append any remaining text after the last match
  finalHtml += initialSanitizedContent.substring(lastIndex);

  return (
    <CardContent className="pb-3">
      {/* Render the processed quote (mirror's own body) or regular post body */}
      {finalHtml && (
        <div 
          className="text-sm mt-2 break-words prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-semibold prose-em:italic"
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
      )}
      
      {/* URL Preview and YouTube Embed Section for the quote/main content */}
      {!isMirror && (
        <div className="mt-3">
          {isLoadingPreview && (
            <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Fetching link preview...</span>
            </div>
          )}
          {!isLoadingPreview && youtubeVideoId && (
            <YoutubeEmbed videoId={youtubeVideoId} />
          )}
          {!isLoadingPreview && !youtubeVideoId && previewData && (
            <LinkPreviewCard preview={previewData} />
          )}
          {!isLoadingPreview && !youtubeVideoId && !previewData && previewError && (
            <div className="text-xs text-red-500 p-2 border border-red-200 rounded-md bg-red-50">
              Preview Error: {previewError}
            </div>
          )}
        </div>
      )}
      
      {/* Render the actual mirrored post content (original author, body, media etc.) */}
      {isMirror && mirrorData && (
        <MirrorPostContent 
          mirrorData={{
            ...mirrorData,
            originalImages: mirrorData.originalImages || [], // Ensure originalImages is an array
            originalBody: mirrorData.originalBody || '' // Ensure originalBody is a string
          }} 
          onImageClick={onImageClick}
        />
      )}
      
      {/* Media Carousel for non-mirrored posts (mirrored post media is handled by MirrorPostContent) */}
      {!isMirror && hasMedia && allMedia && (
        <div className="mt-3">
          <MediaCarousel 
            media={allMedia} 
            onImageClick={onImageClick} 
          />
        </div>
      )}
    </CardContent>
  );
};
