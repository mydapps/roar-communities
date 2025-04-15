import React, { useState, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Image as ImageIcon, Film, X, Maximize, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  onImageClick?: (image: string) => void;
  fullscreen?: boolean;
  initialIndex?: number;
}

// Updated Video player component
const VideoPlayer = ({ 
  src, 
  poster,
  fullscreen = false,
  onClick
}: { 
  src: string;
  poster?: string;
  fullscreen?: boolean;
  onClick?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [aspectRatio, setAspectRatio] = useState(9/16);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const handleLoadedMetadata = () => {
      // Set natural aspect ratio from video dimensions
      if (videoElement.videoWidth && videoElement.videoHeight) {
        setAspectRatio(videoElement.videoWidth / videoElement.videoHeight);
      }
      
      // Autoplay when in fullscreen mode
      if (fullscreen) {
        videoElement.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error("Video autoplay failed:", err));
      }
    };
    
    // Add event listener for metadata loading
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Clean up
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [fullscreen, src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click handlers
    
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Video play failed:", err));
    } else {
      video.pause();
      setIsPlaying(false);
    }
    
    // Call the onClick callback if provided
    if (onClick) onClick();
  };
  
  // For preview, maintain a reasonable aspect ratio but with max height for feed
  // For fullscreen, use the video's natural aspect ratio
  const containerStyle = fullscreen
    ? { maxWidth: `calc(90vh * ${aspectRatio})`, width: '100%' }
    : { 
        width: '100%', 
        aspectRatio: "16/9",
        maxHeight: '380px', 
        position: 'relative' as const 
      };
    
  return (
    <div 
      style={containerStyle}
      className={cn(
        "overflow-hidden bg-black",
        fullscreen ? "flex items-center justify-center" : "relative"
      )}
      data-media-element="true"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={cn(
          "h-full w-full",
          fullscreen ? "object-contain" : "object-cover"
        )}
        controls={fullscreen}
        muted={!fullscreen}
        playsInline
        loop={!fullscreen}
        onClick={togglePlay}
        onError={(e) => console.error("Video error:", e)}
      />
      
      {/* Add play button overlay for preview mode */}
      {!fullscreen && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              // Toggle play for preview
              togglePlay(e);
            }
          }}
        >
          {!isPlaying ? (
            <div className="bg-black/30 rounded-full p-2">
              <Play className="h-8 w-8 text-white" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Video Viewer Modal component
const VideoViewer = ({ 
  videoUrl, 
  open, 
  onOpenChange 
}: { 
  videoUrl: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  // Add a loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Reset loading state when modal opens/closes
  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open, videoUrl]);

  if (!videoUrl) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl w-full p-0 overflow-hidden bg-black/90 border-none"
        aria-describedby="video-viewer-description"
      >
        <DialogTitle className="sr-only">Video Player</DialogTitle>
        <div className="sr-only" id="video-viewer-description">Full-screen video player</div>
        
        <div className="relative w-full">
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10 h-8 w-8 bg-black/50 text-white rounded-full hover:bg-black/70">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Film className="h-12 w-12 text-primary/70 animate-pulse" />
            </div>
          )}
          
          <div className="max-h-[90vh] h-full flex items-center justify-center">
            <VideoPlayer 
              src={videoUrl}
              fullscreen={true}
              // When video is loaded, hide the loading indicator
              onClick={() => setIsLoading(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const MediaCarousel = ({ 
  media, 
  onImageClick, 
  fullscreen = false,
  initialIndex = 0
}: MediaCarouselProps) => {
  // If there are no media items, don't render anything
  if (!media || media.length === 0) {
    return null;
  }
  
  const options = fullscreen ? { startIndex: initialIndex } : {};
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [activeDotIndex, setActiveDotIndex] = useState(initialIndex);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');

  // Pause all videos in carousel when sliding
  useEffect(() => {
    if (emblaApi) {
      const handleSlideChange = () => {
        // Find all videos in the carousel and pause them
        const videos = document.querySelectorAll('[data-media-element="true"] video');
        videos.forEach(video => {
          if (video instanceof HTMLVideoElement && !video.paused) {
            video.pause();
          }
        });
      };
      
      emblaApi.on('select', handleSlideChange);
      emblaApi.on('settle', handleSlideChange);
      
      // Set initial slide if specified
      if (initialIndex > 0 && initialIndex < media.length) {
        emblaApi.scrollTo(initialIndex);
      }
      
      return () => {
        emblaApi.off('select', handleSlideChange);
        emblaApi.off('settle', handleSlideChange);
      };
    }
  }, [emblaApi, initialIndex, media.length]);

  const handleVideoClick = (videoUrl: string) => {
    if (!fullscreen) {
      // Pause all videos before opening fullscreen
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        if (!video.paused) {
          video.pause();
        }
      });
      
      setSelectedVideoUrl(videoUrl);
      setVideoViewerOpen(true);
    }
  };

  if (media.length === 1) {
    const item = media[0];
    if (item.type === 'image') {
      return (
        <div onClick={() => onImageClick && onImageClick(item.url)} data-media-element="true">
          <AspectRatio ratio={4/3} className="overflow-hidden rounded-md">
            <div className="w-full h-full flex items-center justify-center bg-black/5">
              <img 
                src={item.url} 
                alt="Post attachment" 
                className={`w-full h-full ${fullscreen ? 'object-contain' : 'object-cover'} cursor-pointer`} 
              />
            </div>
          </AspectRatio>
        </div>
      );
    } else {
      return (
        <>
          <VideoPlayer 
            src={item.url} 
            poster={`${item.url}?poster=true`}
            fullscreen={fullscreen}
            onClick={() => handleVideoClick(item.url)}
          />
          
          {/* Only render VideoViewer when videoViewerOpen is true */}
          {videoViewerOpen && (
            <VideoViewer 
              videoUrl={selectedVideoUrl}
              open={videoViewerOpen}
              onOpenChange={setVideoViewerOpen}
            />
          )}
        </>
      );
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
        {media.filter(m => m.type === 'image').length > 0 && (
          <div className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>
              {media.filter(m => m.type === 'image').length} 
              {media.filter(m => m.type === 'image').length === 1 ? ' Image' : ' Images'}
            </span>
          </div>
        )}
        {media.filter(m => m.type === 'video').length > 0 && (
          <div className="flex items-center gap-1 ml-3">
            <Film className="h-3.5 w-3.5" />
            <span>
              {media.filter(m => m.type === 'video').length} 
              {media.filter(m => m.type === 'video').length === 1 ? ' Video' : ' Videos'}
            </span>
          </div>
        )}
      </div>
      <Carousel className="w-full" ref={emblaRef}>
        <CarouselContent>
          {media.map((item, index) => (
            <CarouselItem key={index}>
              <div className="p-1" data-media-element="true">
                {item.type === 'image' ? (
                  <AspectRatio ratio={4/3} className="overflow-hidden rounded-md">
                    <div className="w-full h-full flex items-center justify-center bg-black/5">
                      <img 
                        src={item.url} 
                        alt={`Post attachment ${index + 1}`} 
                        onClick={() => onImageClick && onImageClick(item.url)}
                        className={`w-full h-full ${fullscreen ? 'object-contain' : 'object-cover'} ${onImageClick ? 'cursor-pointer' : ''}`} 
                      />
                    </div>
                  </AspectRatio>
                ) : (
                  <VideoPlayer 
                    src={item.url} 
                    poster={`${item.url}?poster=true`}
                    fullscreen={fullscreen}
                    onClick={() => handleVideoClick(item.url)}
                  />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
          {media.map((_, index) => (
            <div 
              key={index} 
              className={`h-1.5 rounded-full transition-all ${
                index === activeDotIndex ? "w-4 bg-primary" : "w-1.5 bg-primary/40"
              }`} 
            />
          ))}
        </div>
        {media.length > 1 && (
          <>
            <CarouselPrevious className="-left-3 bg-background/80 backdrop-blur-sm" />
            <CarouselNext className="-right-3 bg-background/80 backdrop-blur-sm" />
          </>
        )}
      </Carousel>

      {/* Only render VideoViewer when videoViewerOpen is true */}
      {videoViewerOpen && (
        <VideoViewer 
          videoUrl={selectedVideoUrl}
          open={videoViewerOpen}
          onOpenChange={setVideoViewerOpen}
        />
      )}
    </div>
  );
};
