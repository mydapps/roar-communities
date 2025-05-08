import React from 'react';
import { CardContent } from '@/components/ui/card';
import { MediaCarousel } from './MediaCarousel';
import { MirrorPostContent } from './MirrorPostContent';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
// Link component is not used if we are generating <a> tags directly in the string.
// import { Link } from 'react-router-dom'; 

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
  };
  hasMedia: boolean;
  allMedia?: { type: 'image' | 'video', url: string }[];
  onImageClick: (imageSrc: string) => void;
}

export const PostContent: React.FC<PostContentProps> = ({
  content,
  isMirror,
  mirrorData,
  hasMedia,
  allMedia,
  onImageClick
}) => {
  const initialSanitizedContent = sanitizeHtml(content);
  let finalHtml = '';
  let lastIndex = 0;

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
  initialSanitizedContent.replace(MENTION_OR_URL_REGEX, (match, 
    url, // Group 1
    userMentionFull, // Group 2
    _userMentionInner, // Group 3 (username part, not directly used here, derived from userMentionFull)
    communityMentionFull, // Group 4
    _communityMentionInner, // Group 5 (community name part, not directly used here, derived from communityMentionFull)
    email, // Group 6
    offset
  ) => {
    // Append text before this match
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
      {finalHtml && (
        <div 
          className="text-sm mt-2 break-words prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:font-semibold prose-em:italic"
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
      )}
      
      {isMirror && mirrorData && (
        <MirrorPostContent 
          mirrorData={{
            ...mirrorData,
            originalImages: mirrorData.originalImages || []
          }} 
          onImageClick={onImageClick}
        />
      )}
      
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
