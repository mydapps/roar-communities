import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ImageViewer } from '@/components/feed/post/ImageViewer';

interface ImageViewerContextType {
  openImageViewer: (images: string[], selectedIndex?: number) => void;
  closeImageViewer: () => void;
  isOpen: boolean;
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(undefined);

export const useImageViewer = () => {
  const context = useContext(ImageViewerContext);
  if (!context) {
    throw new Error('useImageViewer must be used within ImageViewerProvider');
  }
  return context;
};

interface ImageViewerProviderProps {
  children: ReactNode;
}

export const ImageViewerProvider: React.FC<ImageViewerProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const openImageViewer = (imageList: string[], selectedIdx = 0) => {
    setImages(imageList);
    setSelectedIndex(selectedIdx);
    setIsOpen(true);
  };

  const closeImageViewer = () => {
    setIsOpen(false);
    // Clear images after animation completes
    setTimeout(() => {
      setImages([]);
      setSelectedIndex(0);
    }, 300);
  };

  const value: ImageViewerContextType = {
    openImageViewer,
    closeImageViewer,
    isOpen,
  };

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
      <ImageViewer
        images={images}
        selectedImageIndex={selectedIndex}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </ImageViewerContext.Provider>
  );
}; 