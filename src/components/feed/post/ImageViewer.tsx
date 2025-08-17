import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface ImageViewerProps {
  images: string[];
  selectedImageIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
}

export const ImageViewer = ({ images, selectedImageIndex, open, onOpenChange }: ImageViewerProps) => {
  console.log('ImageViewer render - open:', open, 'images:', images, 'selectedIndex:', selectedImageIndex);
  const [currentIndex, setCurrentIndex] = useState(selectedImageIndex);
  const [transform, setTransform] = useState<TransformState>({ scale: 1, translateX: 0, translateY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const transformRef = useRef<TransformState>({ scale: 1, translateX: 0, translateY: 0 });
  const lastTapRef = useRef<number>(0);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Update transform ref whenever transform state changes
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Reset transform when image changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(selectedImageIndex);
      resetTransform();
    }
  }, [selectedImageIndex, open]);

  // Reset transform when switching images
  useEffect(() => {
    resetTransform();
    setIsLoading(true);
  }, [currentIndex]);

  // Mobile body scroll lock
  useEffect(() => {
    if (open) {
      // Lock body scroll on mobile when ImageViewer is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Add mobile-specific attributes
      document.body.setAttribute('data-image-viewer-open', 'true');
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      document.body.removeAttribute('data-image-viewer-open');
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.removeAttribute('data-image-viewer-open');
    };
  }, [open]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    if (showControls && transform.scale > 1) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [showControls, transform.scale]);

  const resetTransform = useCallback(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    setIsDragging(false);
  }, []);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    toast.error('Failed to load image');
  };

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => prev === 0 ? images.length - 1 : prev - 1);
  }, [images.length]);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => prev === images.length - 1 ? 0 : prev + 1);
  }, [images.length]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.5, 5)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.max(prev.scale / 1.5, 1);
      return newScale === 1 
        ? { scale: 1, translateX: 0, translateY: 0 }
        : { ...prev, scale: newScale };
    });
  }, []);

  // Constrain translation to keep image within bounds
  const constrainTranslation = useCallback((scale: number, translateX: number, translateY: number) => {
    if (!imageRef.current || !containerRef.current) return { translateX, translateY };

    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const scaledWidth = imageRect.width * scale;
    const scaledHeight = imageRect.height * scale;
    
    const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    return {
      translateX: Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX)),
      translateY: Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY))
    };
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (transform.scale <= 1) return;
    
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setShowControls(true);
  }, [transform.scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || transform.scale <= 1) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    const newTranslateX = transformRef.current.translateX + deltaX;
    const newTranslateY = transformRef.current.translateY + deltaY;
    
    const constrained = constrainTranslation(transform.scale, newTranslateX, newTranslateY);
    
    setTransform(prev => ({
      ...prev,
      translateX: constrained.translateX,
      translateY: constrained.translateY
    }));
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, transform.scale, constrainTranslation]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - check for double tap or start drag
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap to zoom
        if (transform.scale === 1) {
          zoomIn();
        } else {
          resetTransform();
        }
      } else {
        // Start drag if zoomed
        if (transform.scale > 1) {
          setIsDragging(true);
          dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }
      lastTapRef.current = now;
      setShowControls(true);
    }
  }, [transform.scale, zoomIn, resetTransform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && dragStartRef.current && transform.scale > 1) {
      e.preventDefault();
      
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;
      
      const newTranslateX = transformRef.current.translateX + deltaX;
      const newTranslateY = transformRef.current.translateY + deltaY;
      
      const constrained = constrainTranslation(transform.scale, newTranslateX, newTranslateY);
      
      setTransform(prev => ({
        ...prev,
        translateX: constrained.translateX,
        translateY: constrained.translateY
      }));
      
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [isDragging, transform.scale, constrainTranslation]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          onOpenChange(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetTransform();
          break;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onOpenChange, goToPrevious, goToNext, zoomIn, zoomOut, resetTransform]);

  // Download image
  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  // Share image
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Image',
          url: images[currentIndex]
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(images[currentIndex]);
        toast.success('Image URL copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy image URL');
      }
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only close if clicking on background (not image or controls)
    if (e.target === e.currentTarget && transform.scale === 1) {
      onOpenChange(false);
    } else {
      setShowControls(!showControls);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[9999] bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-[9999] grid w-screen h-screen p-0 border-none bg-transparent shadow-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "focus:outline-none",
            // Mobile-specific styles
            "touch-none select-none overscroll-none",
            // Ensure proper mobile rendering
            "@media (max-width: 768px): fixed inset-0 !important"
          )}
          style={{
            maxWidth: 'none',
            maxHeight: 'none',
            transform: 'none',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0',
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            zIndex: 9999
          }}
        >
          <VisuallyHidden>
            <DialogTitle>Image Viewer</DialogTitle>
          </VisuallyHidden>
          <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-black/95 touch-manipulation"
            onClick={handleContainerClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              // Ensure full coverage on mobile
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              // Prevent mobile scrolling/zooming issues
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              overscrollBehavior: 'none'
            }}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-4 top-4 z-[10000] h-10 w-10 bg-black/50 text-white rounded-full hover:bg-black/70 transition-opacity duration-300 touch-manipulation",
                showControls || transform.scale === 1 ? "opacity-100" : "opacity-0"
              )}
              onClick={() => onOpenChange(false)}
              style={{ zIndex: 10000 }}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 z-[10000] h-12 w-12 bg-black/50 text-white rounded-full hover:bg-black/70 transition-opacity duration-300 touch-manipulation",
                    showControls || transform.scale === 1 ? "opacity-100" : "opacity-0"
                  )}
                  onClick={goToPrevious}
                  style={{ zIndex: 10000 }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 z-[10000] h-12 w-12 bg-black/50 text-white rounded-full hover:bg-black/70 transition-opacity duration-300 touch-manipulation",
                    showControls || transform.scale === 1 ? "opacity-100" : "opacity-0"
                  )}
                  onClick={goToNext}
                  style={{ zIndex: 10000 }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Bottom controls */}
            <div className={cn(
              "absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 transition-opacity duration-300 touch-manipulation",
              showControls || transform.scale === 1 ? "opacity-100" : "opacity-0"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                onClick={zoomOut}
                disabled={transform.scale <= 1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                onClick={zoomIn}
                disabled={transform.scale >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                onClick={resetTransform}
                disabled={transform.scale === 1}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-white/30 mx-1" />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20 touch-manipulation"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Image counter */}
            {images.length > 1 && (
              <div className={cn(
                "absolute top-4 left-4 z-[10000] bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm transition-opacity duration-300",
                showControls || transform.scale === 1 ? "opacity-100" : "opacity-0"
              )}>
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Main image */}
            <div className="flex items-center justify-center w-full h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-[10000]">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              <img
                ref={imageRef}
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1} of ${images.length}`}
                className="max-w-full max-h-full object-contain select-none transition-transform duration-200 ease-out touch-none"
                style={{
                  transform: `scale(${transform.scale}) translate(${transform.translateX}px, ${transform.translateY}px)`,
                  cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  // Mobile-specific image styling
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  touchAction: 'none'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            </div>

            {/* Zoom indicator */}
            {transform.scale > 1 && (
              <div className={cn(
                "absolute top-16 left-4 z-[10000] bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-50"
              )}>
                {Math.round(transform.scale * 100)}%
              </div>
            )}

            {/* Instructions overlay for first-time users */}
            {transform.scale === 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[9998] text-white/70 text-sm text-center bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 pointer-events-none">
                Double-tap or pinch to zoom • Drag to pan • Arrow keys to navigate
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
