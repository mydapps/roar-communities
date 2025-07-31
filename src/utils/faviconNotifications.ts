/**
 * Favicon Notification Badge Utility
 * 
 * Dynamically updates the favicon to show notification count
 * Similar to how Discord, Slack, and other apps show notification badges
 */

interface FaviconNotificationOptions {
  count: number;
  backgroundColor?: string;
  textColor?: string;
  maxCount?: number;
}

class FaviconNotificationManager {
  private originalFavicon: string | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentCount: number = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 32;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Store original favicon
    this.storeFavicon();
  }

  private storeFavicon(): void {
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (link) {
      this.originalFavicon = link.href;
    } else {
      // Default favicon path
      this.originalFavicon = '/favicon.ico';
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private drawBadge(count: number, options: FaviconNotificationOptions): void {
    const {
      backgroundColor = '#ef4444', // Red badge
      textColor = '#ffffff',
      maxCount = 99
    } = options;

    const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
    
    // Badge dimensions
    const badgeSize = 18;
    const badgeX = this.canvas.width - badgeSize;
    const badgeY = 0;

    // Draw badge background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.beginPath();
    this.ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, 2 * Math.PI);
    this.ctx.fill();

    // Add subtle shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    // Draw text
    this.ctx.fillStyle = textColor;
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Reset shadow for text
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    this.ctx.fillText(
      displayCount,
      badgeX + badgeSize/2,
      badgeY + badgeSize/2
    );
  }

  public async updateNotificationCount(options: FaviconNotificationOptions): Promise<void> {
    const { count } = options;
    
    // Don't update if count hasn't changed
    if (count === this.currentCount) return;
    this.currentCount = count;

    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.originalFavicon) {
        // Load and draw original favicon
        const originalImg = await this.loadImage(this.originalFavicon);
        this.ctx.drawImage(originalImg, 0, 0, this.canvas.width, this.canvas.height);
      }

      // Draw notification badge if count > 0
      if (count > 0) {
        this.drawBadge(count, options);
      }

      // Convert canvas to data URL
      const dataURL = this.canvas.toDataURL('image/png');

      // Update favicon
      this.setFavicon(dataURL);
      
    } catch (error) {
      console.warn('Failed to update favicon notification:', error);
      // Fallback to original favicon
      if (this.originalFavicon) {
        this.setFavicon(this.originalFavicon);
      }
    }
  }

  private setFavicon(href: string): void {
    // Remove existing favicon
    const existingLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (existingLink) {
      existingLink.remove();
    }

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = href;
    
    document.head.appendChild(link);
  }

  public clearNotifications(): Promise<void> {
    return this.updateNotificationCount({ count: 0 });
  }

  public reset(): void {
    this.currentCount = 0;
    if (this.originalFavicon) {
      this.setFavicon(this.originalFavicon);
    }
  }
}

// Singleton instance
const faviconManager = new FaviconNotificationManager();

// Export utility functions
export const updateFaviconNotificationCount = (count: number, options?: Partial<FaviconNotificationOptions>) => {
  return faviconManager.updateNotificationCount({
    count,
    backgroundColor: '#ef4444', // Roar red
    textColor: '#ffffff',
    maxCount: 99,
    ...options
  });
};

export const clearFaviconNotifications = () => {
  return faviconManager.clearNotifications();
};

export const resetFavicon = () => {
  faviconManager.reset();
};

// Auto-update favicon when page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Could clear notifications when user returns to tab
    // This is optional - you might want to keep showing count
  }
});

export default faviconManager; 