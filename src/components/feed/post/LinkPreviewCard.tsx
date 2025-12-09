import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the structure for link preview data
export interface LinkPreviewData {
  success: true;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string; // The original URL that was previewed
}

interface LinkPreviewCardProps {
  preview: LinkPreviewData;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ preview }) => {
  if (!preview || !preview.url) {
    return null;
  }

  const { title, description, image, siteName, url } = preview;

  // Function to construct the final URL with loadIn parameter
  const getFinalUrl = (baseUrl: string) => {
    try {
      const urlObj = new URL(baseUrl);
      urlObj.searchParams.set('loadIn', 'defaultBrowser');
      return urlObj.toString();
    } catch (e) {
      // Fallback if URL parsing fails (though unlikely for valid preview URLs)
      return baseUrl.includes('?')
        ? `${baseUrl}&loadIn=defaultBrowser`
        : `${baseUrl}?loadIn=defaultBrowser`;
    }
  };

  const finalUrl = getFinalUrl(url);

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer ugc"
      className={cn(
        "block border rounded-lg overflow-hidden bg-card hover:border-primary/30 transition-colors duration-200 no-underline group",
        !image && "p-3" // Add padding if there is no image
      )}
      onClick={(e) => e.stopPropagation()} // Prevent post navigation when clicking preview
    >
      <div className={cn("flex", image ? "flex-col sm:flex-row" : "flex-col")}>
        {image && (
          <div className="sm:w-1/3 flex-shrink-0 overflow-hidden bg-muted">
            <img
              src={image}
              alt={title || 'Link preview image'}
              className="w-full h-32 sm:h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className={cn("p-3 flex-grow min-w-0", image && "sm:w-2/3")}>
          {siteName && (
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              {/* Optionally add favicon logic here later */}
              <span className="ml-1 truncate">{siteName}</span>
            </div>
          )}
          {title && (
            <h3 className="text-sm font-semibold leading-snug text-card-foreground mb-1 line-clamp-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}; 