/**
 * Service for handling roar claim images - downloading from API and managing local storage
 */

export interface RoarImageService {
  getLocalImageUrl: (username: string) => string;
  downloadAndSaveImage: (username: string) => Promise<string>;
  imageExists: (username: string) => boolean;
}

class RoarImageServiceImpl implements RoarImageService {
  private readonly baseImagePath = '/images/roar-claims';
  private readonly imageCache = new Map<string, string>();

  /**
   * Get the local image URL for a username
   */
  getLocalImageUrl(username: string): string {
    const sanitizedUsername = this.sanitizeUsername(username);
    return `${this.baseImagePath}/${sanitizedUsername}.png`;
  }

  /**
   * Check if image exists locally
   */
  imageExists(username: string): boolean {
    const sanitizedUsername = this.sanitizeUsername(username);
    return this.imageCache.has(sanitizedUsername);
  }

  /**
   * Download image from API and save it locally (simulate - in real app this would use filesystem)
   */
  async downloadAndSaveImage(username: string): Promise<string> {
    try {
      const sanitizedUsername = this.sanitizeUsername(username);
      
      // Check if already cached
      if (this.imageCache.has(sanitizedUsername)) {
        return this.getLocalImageUrl(username);
      }

      // Download from API
      const response = await fetch(`/api/generateRoarClaimImage?handle=${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image for ${username}`);
      }

      // In a real application, we would save this to the filesystem
      // For now, we'll cache the fact that we've "downloaded" it
      const blob = await response.blob();
      
      // Store in our cache to simulate successful download
      this.imageCache.set(sanitizedUsername, URL.createObjectURL(blob));
      
      console.log(`Downloaded and cached image for ${username}`);
      return this.getLocalImageUrl(username);
      
    } catch (error) {
      console.error(`Error downloading image for ${username}:`, error);
      // Return a fallback image URL
      return '/og-image.png';
    }
  }

  /**
   * Sanitize username for use in filenames
   */
  private sanitizeUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Preload image for faster social sharing
   */
  async preloadImage(username: string): Promise<void> {
    try {
      await this.downloadAndSaveImage(username);
    } catch (error) {
      console.error(`Error preloading image for ${username}:`, error);
    }
  }

  /**
   * Clear cache (useful for development)
   */
  clearCache(): void {
    this.imageCache.clear();
  }
}

// Export singleton instance
export const roarImageService = new RoarImageServiceImpl();

/**
 * Hook for React components to use the roar image service
 */
export const useRoarImage = (username: string) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!username) return;

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const url = await roarImageService.downloadAndSaveImage(username);
        setImageUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image');
        setImageUrl('/og-image.png'); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [username]);

  return { imageUrl, isLoading, error };
};

// Import React for the hook
import React from 'react'; 