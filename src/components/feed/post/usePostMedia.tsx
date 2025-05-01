import { useMemo } from 'react';

export const usePostMedia = (content: string, images?: string[], video?: string) => {
  const [parsedContent, parsedImages, parsedVideos] = useMemo(() => {
    const mediaRegex = /!\[\]\((https:\/\/[^)]+)\)/g;
    const mediaUrls: string[] = [];
    let matches;
    
    while ((matches = mediaRegex.exec(content)) !== null) {
      mediaUrls.push(matches[1]);
    }
    
    const cleanedContent = content.replace(mediaRegex, '').trim();
    
    const extractedImages: string[] = [];
    const extractedVideos: string[] = [];
    
    mediaUrls.forEach(url => {
      if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        extractedVideos.push(url);
      } else {
        extractedImages.push(url);
      }
    });
    
    return [cleanedContent, extractedImages, extractedVideos];
  }, [content]);
  
  const [mediaImages, mediaVideos] = useMemo(() => {
    if (!images || images.length === 0) return [[], []];
    
    const imgArray: string[] = [];
    const vidArray: string[] = [];
    
    images.forEach(url => {
      // Don't include dapps logo as an image
      if (url === 'https://dapps.co/dapps.png') return;
      
      if (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/video/')) {
        vidArray.push(url);
      } else {
        imgArray.push(url);
      }
    });
    
    return [imgArray, vidArray];
  }, [images]);
  
  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    const uniqueUrls = new Set<string>();

    const addMedia = (item: { type: 'image' | 'video', url: string }) => {
      if (item.url && !uniqueUrls.has(item.url)) {
        media.push(item);
        uniqueUrls.add(item.url);
      }
    };

    // Process props first
    mediaImages.forEach(url => {
      addMedia({ type: 'image', url });
    });
    
    mediaVideos.forEach(url => {
      addMedia({ type: 'video', url });
    });
    
    if (video) {
      addMedia({ type: 'video', url: video });
    }
    
    // Process parsed content media
    parsedImages.forEach(url => {
      addMedia({ type: 'image', url });
    });
    
    parsedVideos.forEach(url => {
      addMedia({ type: 'video', url });
    });
    
    return media.length > 0 ? media : undefined;
  }, [mediaImages, mediaVideos, video, parsedImages, parsedVideos]);
  
  const allImages = useMemo(() => {
    if (!allMedia) return undefined;
    
    const images = allMedia
      .filter(item => item.type === 'image')
      .map(item => item.url);
      
    return images.length > 0 ? images : undefined;
  }, [allMedia]);
  
  const hasMedia = useMemo(() => {
    return allMedia && allMedia.length > 0;
  }, [allMedia]);

  return { 
    parsedContent, 
    allMedia, 
    allImages, 
    hasMedia 
  };
};
