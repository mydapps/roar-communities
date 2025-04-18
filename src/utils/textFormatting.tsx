import React from 'react';

/**
 * Process text content to convert mentions, community references, and URLs to clickable links
 * @param content The raw text content to process
 * @returns React elements with proper links
 */
export const processTextContent = (content: string): React.ReactNode => {
  if (!content) return null;
  
  // First, split the content by image markdown pattern to avoid processing it
  const parts = content.split(/(!?\[.*?\]\(https:\/\/img\.dapps\.co\/[^)]+\))/g);
  
  return parts.map((part, index) => {
    // Check if this part is an image markdown, if so return it as is
    if (part.match(/^!?\[.*?\]\(https:\/\/img\.dapps\.co\/[^)]+\)$/)) {
      return <span key={index}>{part}</span>;
    }
    
    // Process the non-image part for mentions, communities, and URLs
    return processTextPart(part, index);
  });
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
  
  // Find all matches for each pattern
  const mentionMatches: RegExpMatchArray[] = Array.from(text.matchAll(mentionRegex));
  const communityMatches: RegExpMatchArray[] = Array.from(text.matchAll(communityRegex));
  const urlMatches: RegExpMatchArray[] = Array.from(text.matchAll(urlRegex));
  
  // If no matches, return the text as is
  if (
    mentionMatches.length === 0 && 
    communityMatches.length === 0 && 
    urlMatches.length === 0
  ) {
    return <span key={key}>{text}</span>;
  }
  
  // Combine all matches for sorting
  const allMatches = [
    ...mentionMatches.map(match => ({ type: 'mention', match })),
    ...communityMatches.map(match => ({ type: 'community', match })),
    ...urlMatches.map(match => ({ type: 'url', match }))
  ];
  
  // Sort by the start index of the match
  allMatches.sort((a, b) => a.match.index! - b.match.index!);
  
  // Process the text with the sorted matches
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  allMatches.forEach(({ type, match }) => {
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
    } else if (type === 'url') {
      // Skip URLs that are part of image markdown
      if (!text.substring(Math.max(0, matchIndex - 5), matchIndex).includes('](')) {
        const url = match[0];
        result.push(
          <a 
            key={`${key}-${matchIndex}`}
            href={url}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline"
          >
            {url}
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