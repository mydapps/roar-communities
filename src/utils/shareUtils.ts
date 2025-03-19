
export type SharePlatform = 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'farcaster' | 'copy' | 'native';

interface ShareOptions {
  url: string;
  title?: string;
  text?: string;
}

export const shareToSocialMedia = (platform: SharePlatform, options: ShareOptions): Promise<boolean> => {
  const { url, title = "", text = "" } = options;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);
  
  let shareUrl = '';
  
  switch (platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      break;
    case 'farcaster':
      // Farcaster's Cast sharing URL format
      shareUrl = `https://warpcast.com/~/compose?text=${encodedText}%20${encodedUrl}`;
      break;
    case 'copy':
      navigator.clipboard.writeText(url);
      return Promise.resolve(true);
    case 'native':
      if (navigator.share) {
        return navigator.share({
          title,
          text,
          url
        })
          .then(() => true)
          .catch(() => false);
      } else {
        // Fallback to copy if Web Share API is not available
        navigator.clipboard.writeText(url);
        return Promise.resolve(true);
      }
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    return Promise.resolve(true);
  }
  
  return Promise.resolve(false);
};
