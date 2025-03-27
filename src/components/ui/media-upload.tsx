
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ImageIcon, VideoIcon, XIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Define clear interfaces for media upload response
export interface MediaUploadResponse {
  success: boolean;
  url: string;
  type: 'image' | 'video';
  originalUrl: string;
  displayUrl: string;
  markdown: string;
  isProcessing: boolean;
  fileInfo?: {
    name: string;
    originalName: string;
    size: number;
    type: string;
  };
}

interface MediaUploadProps {
  onMediaUploaded: (media: MediaUploadResponse) => void;
  disabled?: boolean;
  maxFiles?: number;
  acceptedTypes?: 'image' | 'video' | 'both';
}

export function MediaUpload({
  onMediaUploaded,
  disabled = false,
  maxFiles = 4,
  acceptedTypes = 'both'
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine accept attribute based on acceptedTypes
  const acceptAttribute = acceptedTypes === 'image' 
    ? 'image/*' 
    : acceptedTypes === 'video' 
      ? 'video/*' 
      : 'image/*,video/*';
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    const file = files[0];
    console.log("File selected:", file.name, "type:", file.type, "size:", file.size);
    
    // Reset file input value so the same file can be uploaded again if needed
    e.target.value = '';
    
    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      console.log("File type not supported:", file.type);
      toast.error('Only images and videos are supported');
      return;
    }
    
    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      console.log("File too large:", file.size);
      toast.error('File size exceeds the 50MB limit');
      return;
    }
    
    // Start upload process
    setUploading(true);
    setProgress(10);
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('media', file);
      
      // Get user authentication key
      const userKey = localStorage.getItem('dapps_user_key');
      if (!userKey) {
        console.log("No user key found");
        toast.error('Authentication required. Please log in again.');
        setUploading(false);
        return;
      }
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90) + 10;
          console.log(`Upload progress: ${percentComplete}%`);
          setProgress(percentComplete);
        }
      });
      
      // Handle response
      xhr.addEventListener('load', () => {
        console.log("Upload completed, status:", xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          
          try {
            // Parse response
            const responseText = xhr.responseText;
            console.log("Raw response:", responseText);
            
            if (!responseText) {
              throw new Error('Empty response from server');
            }
            
            const response = JSON.parse(responseText);
            console.log("Parsed response:", response);
            
            if (!response) {
              throw new Error('Invalid response format');
            }
            
            if (response.success !== true) {
              throw new Error('Upload was not successful');
            }
            
            // Determine media type
            const mediaType: 'image' | 'video' = isImage ? 'image' : 'video';
            
            // Create a valid media response object
            const mediaResponse: MediaUploadResponse = {
              success: true,
              url: response.url || '',
              type: mediaType,
              originalUrl: response.originalUrl || response.url || '',
              displayUrl: response.displayUrl || response.url || '',
              markdown: response.markdown || '',
              isProcessing: response.isProcessing || false,
              fileInfo: {
                name: file.name,
                originalName: file.name,
                size: file.size,
                type: file.type
              }
            };
            
            console.log("Sending media response to parent:", mediaResponse);
            
            // Call the callback with media data
            onMediaUploaded(mediaResponse);
            
            // Reset upload state
            setTimeout(() => {
              setUploading(false);
              setProgress(0);
            }, 500);
            
          } catch (error) {
            console.error('Error processing response:', error);
            toast.error('Error processing server response');
            setUploading(false);
          }
        } else {
          // Handle error response
          console.error('Upload failed with status:', xhr.status, xhr.responseText);
          toast.error('Upload failed. Please try again.');
          setUploading(false);
        }
      });
      
      // Handle network errors
      xhr.addEventListener('error', () => {
        console.error('Network error during upload');
        toast.error('Connection error. Please try again.');
        setUploading(false);
      });
      
      // Handle aborted uploads
      xhr.addEventListener('abort', () => {
        console.log('Upload aborted');
        toast.info('Upload cancelled');
        setUploading(false);
      });
      
      // Send the request
      console.log("Sending upload request to https://api.dapps.co/upload_media");
      xhr.open('POST', 'https://api.dapps.co/upload_media');
      xhr.setRequestHeader('x-user-key', userKey);
      xhr.send(formData);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              {acceptedTypes === 'video' ? (
                <VideoIcon className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              <span>{acceptedTypes === 'video' ? 'Upload Video' : 'Upload Image'}</span>
            </>
          )}
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={acceptAttribute}
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>
      
      {uploading && (
        <div className="space-y-1 animate-fade-in">
          <Progress value={progress} className="h-1.5" />
          <div className="text-xs text-muted-foreground">
            {progress < 100 ? `Uploading... ${progress}%` : 'Processing...'}
          </div>
        </div>
      )}
    </div>
  );
}

interface MediaPreviewProps {
  media: MediaUploadResponse;
  onRemove: () => void;
}

export function MediaPreview({ media, onRemove }: MediaPreviewProps) {
  // Log received media data
  console.log("MediaPreview received:", media);
  
  // Safety check
  if (!media || typeof media !== 'object') {
    console.error("Invalid media object received:", media);
    return null;
  }
  
  // Validate media type
  if (!media.type || !['image', 'video'].includes(media.type)) {
    console.error("Media has invalid type:", media.type);
    return null;
  }
  
  // Validate media URL
  if (!media.url) {
    console.error("Media missing URL:", media);
    return null;
  }
  
  // Render media preview based on type
  return (
    <div className="relative group rounded-md overflow-hidden border">
      {media.type === 'image' ? (
        <AspectRatio ratio={16/9}>
          <img 
            src={media.displayUrl || media.url} 
            alt="Uploaded content" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              console.error("Error loading image:", media.displayUrl || media.url);
              e.currentTarget.src = "https://placehold.co/400x225?text=Error+Loading+Image";
            }}
            onLoad={() => console.log("Image loaded successfully:", media.displayUrl || media.url)}
          />
        </AspectRatio>
      ) : (
        <AspectRatio ratio={16/9}>
          <video 
            src={media.url} 
            className="w-full h-full object-cover" 
            controls
            onError={(e) => {
              console.error("Error loading video:", media.url);
            }}
          />
        </AspectRatio>
      )}
      
      <Button
        variant="destructive"
        size="icon"
        className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <XIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}
