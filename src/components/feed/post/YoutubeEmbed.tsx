import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio'; // Use AspectRatio for responsive embed

interface YoutubeEmbedProps {
  videoId: string;
  title?: string; // Optional title for accessibility
}

export const YoutubeEmbed: React.FC<YoutubeEmbedProps> = ({ videoId, title = 'YouTube video player' }) => {
  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    // Use AspectRatio to maintain 16:9 ratio for the video embed
    <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden border">
      <iframe 
        width="100%" 
        height="100%" 
        src={embedUrl}
        title={title}
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      ></iframe>
    </AspectRatio>
  );
}; 