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
  children?: React.ReactNode;
}

export function MediaUpload({
  onMediaUploaded,
  disabled = false,
  maxFiles = 30, // Increased to 30 per requirement
  acceptedTypes = 'both',
  children
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
    console.log(`File selected: ${file.name} type: ${file.type} size: ${file.size}`);
    
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
            
            const response = JSON.parse(responseText) as MediaUploadResponse;
            console.log("Parsed response:", response);
            
            // Validate response structure
            if (!response) {
              throw new Error('Invalid response format');
            }
            
            // Determine media type
            const mediaType: 'image' | 'video' = isImage ? 'image' : 'video';
            
            // Create a valid media response object with defaults for missing fields
            const mediaResponse: MediaUploadResponse = {
              success: response.success === true,
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
            
            // Ensure URLs are properly formatted
            if (mediaResponse.url && !mediaResponse.url.startsWith('http')) {
              console.log('URL is not properly formatted, ensuring it starts with https:', mediaResponse.url);
              if (mediaResponse.url.startsWith('//')) {
                mediaResponse.url = 'https:' + mediaResponse.url;
              } else if (mediaResponse.url.startsWith('/')) {
                // It's a relative URL, prepend the origin
                mediaResponse.url = window.location.origin + mediaResponse.url;
              } else {
                // Some other format, prepend https:// as a fallback
                mediaResponse.url = 'https://' + mediaResponse.url;
              }
            }
            
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
      
      // Use relative proxy path
      console.log("Sending upload request to /api/upload_media");
      xhr.open('POST', '/api/upload_media');
      xhr.withCredentials = true;
      
      xhr.send(formData);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2" onClick={() => !disabled && !uploading && fileInputRef.current?.click()}>
        {children ? (
          <div className="cursor-pointer">
            {children}
          </div>
        ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={disabled || uploading}
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
        )}
        
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
  const isImage = media.type === 'image';

  return (
    <div className="relative w-full max-w-sm rounded-lg border bg-background p-2 shadow-sm transition-all animate-in fade-in-50">
      <div className="flex items-center gap-3">
        <div className="w-24 h-24 flex-shrink-0">
          <AspectRatio ratio={1} className="overflow-hidden rounded-md">
            {isImage ? (
              <img
                src={media.displayUrl}
                alt="Media preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <video 
                src={media.displayUrl}
                className="h-full w-full object-cover bg-black"
                autoPlay
                loop
                muted
                playsInline
              />
            )}
          </AspectRatio>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {media.fileInfo?.originalName || 'Uploaded Media'}
          </p>
          <p className="text-xs text-muted-foreground">
            {media.isProcessing ? 'Processing...' : 'Ready to send'}
          </p>
        </div>
      <Button
          type="button"
          variant="ghost"
        size="icon"
          className="h-7 w-7 rounded-full flex-shrink-0"
        onClick={onRemove}
      >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Remove media</span>
      </Button>
      </div>
    </div>
  );
}
