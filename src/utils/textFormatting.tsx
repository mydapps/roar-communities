import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { YoutubeEmbed } from '@/components/feed/post/YoutubeEmbed';

/**
 * Process text content to convert mentions, community references, URLs, and media markdown to interactive elements
 * @param content The raw text content to process
 * @param onImageClick Optional callback for when images are clicked (for enhanced image viewer)
 * @returns React elements with proper links and media rendering
 */
export const processTextContent = (content: string, onImageClick?: (imageUrl: string) => void): React.ReactNode => {
  if (!content) return null;
  
  // Add debugging for video content
  if (content.includes('![video]') || content.includes('/video/')) {
    console.log('🎥 DEBUG: Processing content with video:', content);
  }
  
  // Updated regex to handle both newline and non-newline image markdown cases
  // This handles ![](url) and ![alt](url) with optional newline before it
  const mediaMarkdownRegex = /(\n?!\[([^\]]*)\]\(([^)]+)\))/g; 
  const parts = content.split(mediaMarkdownRegex);
  
  // Debug the split results for video content
  if (content.includes('![video]') || content.includes('/video/')) {
    console.log('🎥 DEBUG: Split parts:', parts);
    console.log('🎥 DEBUG: Regex matches:', content.match(mediaMarkdownRegex));
  }
  
  return parts.map((part, index) => {
    // Check if this part is a captured media URL (from group 3 of the split regex)
    // The split results in [text, full_markdown, alt_text, url, text, full_markdown, alt_text, url, ...]
    // So, the URL is at index `i` where `i % 4 === 3`
    if (index % 4 === 3 && part) { 
      const mediaUrl = part.trim(); // This is the captured URL - trim to remove any whitespace
      
      // Debug for video URLs
      if (mediaUrl.includes('/video/') || mediaUrl.includes('mp4')) {
        console.log('🎥 DEBUG: Processing video URL:', mediaUrl);
      }
      
      // Skip if the URL is empty after trimming
      if (!mediaUrl) {
        return null;
      }
      
      // Check for common image/video extensions to determine type
      const extension = mediaUrl.split('.').pop()?.toLowerCase();
      
      // Also check if URL contains '/video/' (for dapps.co video uploads)
      const isVideoUrl = mediaUrl.includes('/video/');
      
      // Debug video detection
      if (mediaUrl.includes('/video/') || mediaUrl.includes('mp4')) {
        console.log('🎥 DEBUG: Video detection - extension:', extension, 'isVideoUrl:', isVideoUrl);
      }
      
      // Determine media type
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '') && !isVideoUrl) {
        return (
          <div key={index} className="mt-2 max-w-xs sm:max-w-sm md:max-w-md"> 
            <img 
              src={mediaUrl} 
              alt="Comment attachment" 
              className={`rounded-md object-cover w-full h-auto border border-border/20 ${onImageClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              loading="lazy"
              onClick={onImageClick ? () => onImageClick(mediaUrl) : undefined}
              onError={(e) => {
                 e.currentTarget.style.display = 'none'; 
              }}
            />
          </div>
        );
      } else if (['mp4', 'webm', 'mov'].includes(extension || '') || isVideoUrl) {
        console.log('🎥 DEBUG: Rendering video element for:', mediaUrl);
        return (
          <div key={index} className="mt-2 max-w-xs sm:max-w-sm md:max-w-md"> 
            <video 
              src={mediaUrl} 
              controls 
              preload="metadata"
              className="rounded-md w-full h-auto border border-border/20"
              onError={(e) => {
                console.log('🎥 DEBUG: Video failed to load:', mediaUrl);
                e.currentTarget.style.display = 'none'; 
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      } else {
        // Try to render as image if we can't detect extension
        return (
          <div key={index} className="mt-2 max-w-xs sm:max-w-sm md:max-w-md"> 
            <img 
              src={mediaUrl} 
              alt="Comment attachment" 
              className={`rounded-md object-cover w-full h-auto border border-border/20 ${onImageClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              loading="lazy"
              onClick={onImageClick ? () => onImageClick(mediaUrl) : undefined}
              onError={(e) => {
                 e.currentTarget.style.display = 'none'; 
              }}
            />
          </div>
        );
      }
    } else if (index % 4 === 0) { 
      // This is a regular text part (before or between media)
    return processTextPart(part, index);
    } else {
      // This is the full markdown tag part or alt text, ignore it as we process the URL separately
      return null;
    }
  });
};

// --- NEW: List of custom emojis for processing ---
const CUSTOM_EMOJI_LIST: { name: string; url: string }[] = [
  { name: 'angry', url: '/emojis/angry.png' },
  { name: 'bitcoin', url: '/emojis/bitcoin.png' },
  { name: 'cool', url: '/emojis/cool.png' },
  { name: 'ethereum', url: '/emojis/ethereum.png' },
  { name: 'happy', url: '/emojis/happy.png' },
  { name: 'mindblown', url: '/emojis/mindblown.png' },
  { name: 'party', url: '/emojis/party.png' },
  { name: 'sad', url: '/emojis/sad.png' },
  { name: 'scared', url: '/emojis/scared.png' },
  { name: 'sleepy', url: '/emojis/sleepy.png' },
  { name: 'solana', url: '/emojis/solana.png' },
  { name: 'thinking', url: '/emojis/thinking.png' },
  { name: 'angelic', url: '/emojis/angelic.png' },
  { name: 'devilish', url: '/emojis/devilish.png' },
  { name: 'inlove', url: '/emojis/inlove.png' },
  { name: 'pleading', url: '/emojis/pleading.png' },
  { name: 'surprised', url: '/emojis/surprised.png' },
];

// --- NEW: Sanitization options for rich post content ---
const POST_SANITIZATION_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'a', 'ul', 'ol', 'li', 'blockquote', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'img' 
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel', 'class'],
    'span': ['class'], 
    'img': ['src', 'alt', 'class', 'style', 'width', 'height'],
    'p': ['class'], 'ul': ['class'], 'ol': ['class'], 'li': ['class'], 'blockquote': ['class'],
    'strong': ['class'], 'em': ['class'], 'u': ['class'], 'b': ['class'], 'i': ['class'],
    'h1': ['class'], 'h2': ['class'], 'h3': ['class'], 'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
  },
  exclusiveFilter: function(frame) {
    if (frame.tag === 'img') {
        const src = frame.attribs.src;
        if (src && (src.startsWith('javascript:') || src.startsWith('data:'))) {
            return true; // Remove the tag
        }
        if (src && src.startsWith('/emojis/')) {
            return false; // Keep our emoji images
        }
        // For other images that Tiptap might embed (e.g., if it allows image uploads directly in editor without our MediaUpload)
        // We might want to ensure they are from allowed domains or remove them if source is suspicious.
        // For now, this filter primarily ensures safety of our emojis and blocks obviously malicious src.
        // If Tiptap itself embeds images from other sources and they are already sanitized/trusted, this might be okay.
        // If Tiptap just puts any URL, then we should be more strict here or ensure Tiptap is configured not to allow arbitrary image URLs.
        // Example: if (src && !src.startsWith('https://your-trusted-cdn.com')) return true;
    }
    return false; 
  }
};

// --- NEW: Function to process rich HTML content for posts ---
export const processRichTextForDisplayingPosts = (htmlContent: string | null | undefined): string => {
  if (!htmlContent || typeof htmlContent !== 'string') return '';

  // First, remove any leftover markdown image syntax to prevent it from showing as text
  // This handles cases where older content still contains markdown syntax
  // Patterns: ![](url), ![alt](url), ![alt text](url), etc.
  let cleanedContent = htmlContent
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // Remove ![alt](url) patterns
    .replace(/^\s*$\n/gm, '') // Remove empty lines that might be left after removing markdown
    .trim(); // Remove leading/trailing whitespace
  
  let sanitizedContent = sanitizeHtml(cleanedContent, POST_SANITIZATION_OPTIONS);

  // Process custom emojis
  const emojiCodeRegex = /(?<!<[^>]{0,256})(?<![a-zA-Z0-9]):([a-zA-Z0-9_]+?):/g;
  
  sanitizedContent = sanitizedContent.replace(emojiCodeRegex, (match, emojiId) => {
    const customEmoji = CUSTOM_EMOJI_LIST.find(e => e.name === emojiId);
    if (customEmoji) {
      return `<img src="${customEmoji.url}" alt=":${emojiId}:" class="inline-block h-5 w-5 align-middle mx-px" />`;
    } 
    return match; 
  });

  // Process URLs - convert URLs to clickable links with loadIn parameter
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  sanitizedContent = sanitizedContent.replace(urlRegex, (match, url, offset) => {
    // Skip URLs that are part of existing anchor tags
    const beforeMatch = sanitizedContent.substring(0, offset);
    const afterMatch = sanitizedContent.substring(offset + match.length);
    
    // Check if this URL is already inside an anchor tag
    const lastOpenTag = beforeMatch.lastIndexOf('<a');
    const lastCloseTag = beforeMatch.lastIndexOf('</a>');
    const nextCloseTag = afterMatch.indexOf('</a>');
    
    // If we're inside an anchor tag, don't process this URL
    if (lastOpenTag > lastCloseTag && nextCloseTag !== -1) {
      return match;
    }
    
    // Check if URL is part of image markdown (skip URLs that have ]( before them)
    if (beforeMatch.endsWith('](')) {
      return match;
    }
    
    // Check if URL is already part of an href attribute
    if (beforeMatch.includes('href="') && beforeMatch.lastIndexOf('href="') > beforeMatch.lastIndexOf('"', beforeMatch.length - 7)) {
      return match;
    }
    
    let finalUrl = url;
    
    try {
      const parsedUrl = new URL(url);
      // Add loadIn parameter if not already present
      if (!parsedUrl.searchParams.has('loadIn')) {
        parsedUrl.searchParams.append('loadIn', 'defaultBrowser');
        finalUrl = parsedUrl.toString();
      }
    } catch (e) {
      // If URL parsing fails, attempt simple appending
      if (!url.includes('loadIn=defaultBrowser')) {
        if (url.includes('?')) {
          finalUrl = `${url}&loadIn=defaultBrowser`;
        } else {
          finalUrl = `${url}?loadIn=defaultBrowser`;
        }
      }
    }
    
    return `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline" onclick="event.stopPropagation()">${url}</a>`;
  });

  // Process mentions - convert @username to clickable links
  const mentionRegex = /@(\w+)/g;
  sanitizedContent = sanitizedContent.replace(mentionRegex, (match, username) => {
    return `<a href="/u/${username}" class="text-primary hover:underline" onclick="event.stopPropagation()">${match}</a>`;
  });

  // Process community mentions - convert /c/community to clickable links
  const communityRegex = /\/c\/([a-zA-Z0-9-]+)/g;
  sanitizedContent = sanitizedContent.replace(communityRegex, (match, community) => {
    return `<a href="/c/${community}" class="text-primary hover:underline" onclick="event.stopPropagation()">${match}</a>`;
  });

  return sanitizedContent;
};

/**
 * Process a part of text (non-image markdown) to convert mentions, communities, and URLs
 * @param text The text part to process
 * @param key React key for the component
 * @returns React elements with proper links
 */
const processTextPart = (text: string, key: number): React.ReactNode => {
  // Regular expressions for pattern matching
  const mentionRegex = /@(\w+)/g;
  const communityRegex = /\/c\/([a-zA-Z0-9-]+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const emojiRegex = /:([a-zA-Z0-9_]+?):/g;
  
  // Find all matches for each pattern
  const mentionMatches: RegExpMatchArray[] = Array.from(text.matchAll(mentionRegex));
  const communityMatches: RegExpMatchArray[] = Array.from(text.matchAll(communityRegex));
  const urlMatches: RegExpMatchArray[] = Array.from(text.matchAll(urlRegex));
  const emojiMatches: RegExpMatchArray[] = Array.from(text.matchAll(emojiRegex));
  
  // If no matches, return the text as is
  if (
    mentionMatches.length === 0 && 
    communityMatches.length === 0 && 
    urlMatches.length === 0 &&
    emojiMatches.length === 0
  ) {
    return <span key={key}>{text}</span>;
  }
  
  // Combine all matches for sorting
  const allMatches = [
    ...mentionMatches.map(match => ({ type: 'mention' as const, match })),
    ...communityMatches.map(match => ({ type: 'community' as const, match })),
    ...urlMatches.map(match => ({ type: 'url' as const, match })),
    ...emojiMatches.map(match => ({ type: 'emoji' as const, match })),
  ];
  
  // Sort by the start index of the match
  allMatches.sort((a, b) => a.match.index! - b.match.index!);
  
  // Filter out mentions that are part of URLs
  const filteredMatches = allMatches.filter((current, index, array) => {
    // If current match is a mention, check if it's contained within any URL
    if (current.type === 'mention') {
      const mentionIndex = current.match.index!;
      const mentionEnd = mentionIndex + current.match[0].length;
      
      // Check if this @mention is inside any URL
      return !array.some(item => {
        if (item.type === 'url') {
          const urlIndex = item.match.index!;
          const urlEnd = urlIndex + item.match[0].length;
          
          // If the mention is completely inside the URL, filter it out
          return urlIndex <= mentionIndex && urlEnd >= mentionEnd;
        }
        return false;
      });
    }
    // Keep all other match types
    return true;
  });
  
  // Process the text with the filtered matches
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  filteredMatches.forEach(({ type, match }) => {
    const matchIndex = match.index!;
    const matchText = match[0];
    const matchLength = matchText.length;
    
    // Add text before the match
    if (matchIndex > lastIndex) {
      result.push(
        <span key={`${key}-${lastIndex}`}>
          {text.substring(lastIndex, matchIndex)}
        </span>
      );
    }
    
    // Add the match with appropriate link
    if (type === 'mention') {
      const username = match[1];
      result.push(
        <a 
          key={`${key}-${matchIndex}`}
          href={`/u/${username}`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline"
        >
          {matchText}
        </a>
      );
    } else if (type === 'community') {
      const community = match[1];
      result.push(
        <a 
          key={`${key}-${matchIndex}`}
          href={`/c/${community}`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline"
        >
          {matchText}
        </a>
      );
    } else if (type === 'emoji') {
      const emojiId = match[1];
      const customEmoji = CUSTOM_EMOJI_LIST.find(e => e.name === emojiId);
      if (customEmoji) {
        result.push(
          <img 
            key={`${key}-${matchIndex}`}
            src={customEmoji.url}
            alt={`:${emojiId}:`} 
            className="inline-block h-5 w-5 align-middle mx-px"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        );
      } else {
        result.push(<span key={`${key}-${matchIndex}`}>{matchText}</span>);
      }
    } else if (type === 'url') {
      // Skip URLs that are part of image markdown
      if (!text.substring(Math.max(0, matchIndex - 5), matchIndex).includes('](')) {
        const originalUrl = match[0];
        
        // Check for YouTube URL and extract video ID
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const youtubeMatch = originalUrl.match(youtubeRegex);
        
        if (youtubeMatch && youtubeMatch[1]) {
          // Render YouTube embed for comments
          const videoId = youtubeMatch[1];
          result.push(
            <div key={`${key}-${matchIndex}`} className="mt-2 max-w-xs sm:max-w-sm md:max-w-md">
              <YoutubeEmbed videoId={videoId} title="YouTube video" />
            </div>
          );
        } else {
          // Handle regular URLs
          let finalUrl = originalUrl;
          let isExternal = false;

          try {
            const parsedUrl = new URL(originalUrl);
            // Check if the origin is different from the current window's origin
            // Or if it simply starts with http/https (basic external check)
            if (parsedUrl.origin !== window.location.origin || /^https?:\/\//.test(originalUrl)) {
              isExternal = true;
              if (!parsedUrl.searchParams.has('loadIn')) {
                parsedUrl.searchParams.append('loadIn', 'defaultBrowser');
                finalUrl = parsedUrl.toString();
              }
            }
          } catch (e) {
            // If URL parsing fails, treat it as potentially external if it starts with http/https
            if (/^https?:\/\//.test(originalUrl)) {
              isExternal = true;
              // Attempt simple appending if URL object failed
              if (!originalUrl.includes('loadIn=defaultBrowser')) {
                if (originalUrl.includes('?')) {
                  finalUrl = `${originalUrl}&loadIn=defaultBrowser`;
                } else {
                  finalUrl = `${originalUrl}?loadIn=defaultBrowser`;
                }
              }
            }
            // If it doesn't start with http/https and parsing failed, treat as internal/relative
          }

          result.push(
            <a 
              key={`${key}-${matchIndex}`}
              href={finalUrl}
              target={isExternal ? "_blank" : "_self"} 
              rel={isExternal ? "noopener noreferrer" : ""}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline"
            >
              {/* Optionally shorten displayed URL if needed, but keep it simple for now */}
              {originalUrl} 
            </a>
          );
        }
      } else {
        // This URL is likely part of a markdown link, so keep it as is
        result.push(
          <span key={`${key}-${matchIndex}`}>
            {matchText}
          </span>
        );
      }
    }
    
    lastIndex = matchIndex + matchLength;
  });
  
  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    result.push(
      <span key={`${key}-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }
  
  return <span key={key}>{result}</span>;
}; 