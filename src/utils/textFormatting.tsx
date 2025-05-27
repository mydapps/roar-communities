import React from 'react';
import sanitizeHtml from 'sanitize-html';

/**
 * Process text content to convert mentions, community references, URLs, and media markdown to interactive elements
 * @param content The raw text content to process
 * @returns React elements with proper links and media rendering
 */
export const processTextContent = (content: string): React.ReactNode => {
  if (!content) return null;
  
  // Updated regex to handle both newline and non-newline image markdown cases
  // This handles ![](url) with optional newline before it
  const mediaMarkdownRegex = /(\n?!\[\]\(([^)]+)\))/g; 
  const parts = content.split(mediaMarkdownRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a captured media URL (from group 2 of the split regex)
    // The split results in [text, full_markdown, url, text, full_markdown, url, ...]
    // So, the URL is at index `i` where `i % 3 === 2`
    if (index % 3 === 2 && part) { 
      const mediaUrl = part.trim(); // This is the captured URL - trim to remove any whitespace
      
      // Skip if the URL is empty after trimming
      if (!mediaUrl) {
        return null;
      }
      
      // Check for common image/video extensions to determine type
      const extension = mediaUrl.split('.').pop()?.toLowerCase();
      
      // Determine media type
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        return (
          <div key={index} className="mt-2 max-w-xs sm:max-w-sm md:max-w-md"> 
            <img 
              src={mediaUrl} 
              alt="Comment attachment" 
              className="rounded-md object-cover w-full h-auto border border-border/20" 
              loading="lazy"
              onError={(e) => {
                 e.currentTarget.style.display = 'none'; 
              }}
            />
          </div>
        );
      } else if (['mp4', 'webm', 'mov'].includes(extension || '')) {
        return (
          <div key={index} className="mt-2 max-w-xs sm:max-w-sm md:max-w-md"> 
            <video 
              src={mediaUrl} 
              controls 
              preload="metadata"
              className="rounded-md w-full h-auto border border-border/20"
              onError={(e) => {
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
              className="rounded-md object-cover w-full h-auto border border-border/20" 
              loading="lazy"
              onError={(e) => {
                 e.currentTarget.style.display = 'none'; 
              }}
            />
          </div>
        );
      }
    } else if (index % 3 === 0) { 
      // This is a regular text part (before or between media)
    return processTextPart(part, index);
    } else {
      // This is the full markdown tag part, ignore it as we process the URL separately
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

  let sanitizedContent = sanitizeHtml(htmlContent, POST_SANITIZATION_OPTIONS);

  const emojiCodeRegex = /(?<!<[^>]{0,256})(?<![a-zA-Z0-9]):([a-zA-Z0-9_]+?):/g;
  
sanitizedContent = sanitizedContent.replace(emojiCodeRegex, (match, emojiId) => {
    const customEmoji = CUSTOM_EMOJI_LIST.find(e => e.name === emojiId);
    if (customEmoji) {
      return `<img src="${customEmoji.url}" alt=":${emojiId}:" class="inline-block h-5 w-5 align-middle mx-px" />`;
    } 
    return match; 
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