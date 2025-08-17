import React, { useState, useEffect, useMemo } from 'react';
import { CardContent } from '@/components/ui/card';
import { MediaCarousel } from './MediaCarousel';
import { MirrorPostContent } from './MirrorPostContent';
import { LinkPreviewCard, LinkPreviewData } from './LinkPreviewCard';
import { YoutubeEmbed } from './YoutubeEmbed';
import { Loader2 } from 'lucide-react';
import { processRichTextForDisplayingPosts } from '@/utils/textFormatting';
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

  const contentToProcess = content; // Use the main content prop

  useEffect(() => {
    setFirstUrl(null);
    setPreviewData(null);
    setYoutubeVideoId(null);
    setIsLoadingPreview(false);
    setPreviewError(null);

    if (contentToProcess) {
      const urlRegex = /\b(?:https?:\/\/|www\.)[^\s<>()"]*[^\s<>()"\.,!?:;']/i;
      const match = contentToProcess.match(urlRegex);
      if (match && match[0]) {
        let detectedUrl = match[0];
        if (detectedUrl.startsWith('www.') && !detectedUrl.startsWith('http')) {
          detectedUrl = 'http://' + detectedUrl;
        }
        setFirstUrl(detectedUrl);
      }
    }
  }, [contentToProcess]);

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

  const processedHtmlBody = processRichTextForDisplayingPosts(contentToProcess);

  return (
    <CardContent className="pb-3">
      {/* Render the processed quote (mirror's own body) or regular post body */}
      {processedHtmlBody && (
        <div 
          className="text-sm mt-2 break-words prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-semibold prose-em:italic"
          dangerouslySetInnerHTML={{ __html: processedHtmlBody }}
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
