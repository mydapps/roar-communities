
import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Image as ImageIcon, Film } from 'lucide-react';

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

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setActiveDotIndex(emblaApi.selectedScrollSnap());
      });
      
      // Set initial slide if specified
      if (initialIndex > 0 && initialIndex < media.length) {
        emblaApi.scrollTo(initialIndex);
      }
    }
  }, [emblaApi, initialIndex, media.length]);

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
        <div data-media-element="true">
          <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
            <video 
              src={item.url} 
              controls 
              className="w-full h-full object-cover"
              preload="metadata"
              poster={`${item.url}?poster=true`}
            />
          </AspectRatio>
        </div>
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
                <AspectRatio ratio={item.type === 'video' ? 16/9 : 4/3} className="overflow-hidden rounded-md">
                  <div className="w-full h-full flex items-center justify-center bg-black/5">
                    {item.type === 'image' ? (
                      <img 
                        src={item.url} 
                        alt={`Post attachment ${index + 1}`} 
                        onClick={() => onImageClick && onImageClick(item.url)}
                        className={`w-full h-full ${fullscreen ? 'object-contain' : 'object-cover'} ${onImageClick ? 'cursor-pointer' : ''}`} 
                      />
                    ) : (
                      <video 
                        src={item.url} 
                        controls 
                        className="w-full h-full object-cover"
                        preload="metadata"
                        poster={`${item.url}?poster=true`}
                      />
                    )}
                  </div>
                </AspectRatio>
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
    </div>
  );
};
