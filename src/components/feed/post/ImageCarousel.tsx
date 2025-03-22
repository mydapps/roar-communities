
import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

interface ImageCarouselProps {
  images: string[];
  onImageClick: (image: string) => void;
}

export const ImageCarousel = ({ images, onImageClick }: ImageCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [activeDotIndex, setActiveDotIndex] = useState(0);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setActiveDotIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  if (images.length === 1) {
    return (
      <div onClick={() => onImageClick(images[0])}>
        <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
          <img 
            src={images[0]} 
            alt="Post attachment" 
            className="w-full h-full object-cover cursor-pointer" 
          />
        </AspectRatio>
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel className="w-full" ref={emblaRef}>
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={index}>
              <div className="p-1" onClick={() => onImageClick(img)} data-media-element="true">
                <AspectRatio ratio={16/9} className="overflow-hidden rounded-md">
                  <img 
                    src={img} 
                    alt={`Post attachment ${index + 1}`} 
                    className="w-full h-full object-cover cursor-pointer" 
                  />
                </AspectRatio>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
          {images.map((_, index) => (
            <div 
              key={index} 
              className={`h-1.5 rounded-full transition-all ${
                index === activeDotIndex ? "w-4 bg-primary" : "w-1.5 bg-primary/40"
              }`} 
            />
          ))}
        </div>
        <CarouselPrevious className="-left-3 bg-background/80 backdrop-blur-sm" />
        <CarouselNext className="-right-3 bg-background/80 backdrop-blur-sm" />
      </Carousel>
    </div>
  );
};
