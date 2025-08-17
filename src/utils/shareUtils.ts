export type SharePlatform = 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'farcaster' | 'whatsapp' | 'copy' | 'native';

interface ShareOptions {
  url: string;
  title?: string;
  text?: string;
}

export const shareToSocialMedia = async (platform: SharePlatform, options: ShareOptions): Promise<boolean> => {
  const { url, title = "", text = "" } = options;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);
  
  let shareUrl = '';
  
  switch (platform) {
    case 'twitter':
      // Twitter was rebranded to X, but the API endpoints remain the same
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
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
      try {
        await navigator.clipboard.writeText(url);
        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
      }
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
        try {
          await navigator.clipboard.writeText(url);
          return true;
        } catch (error) {
          console.error('Failed to copy to clipboard as fallback:', error);
          return false;
        }
      }
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
  
  return false;
};
