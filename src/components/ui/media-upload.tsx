
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ImageIcon, VideoIcon, XIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  
  const acceptAttribute = (() => {
    switch (acceptedTypes) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'both': 
      default: return 'image/*,video/*';
    }
  })();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log("File selected:", files[0].name, "type:", files[0].type, "size:", files[0].size);
    
    // Reset file input value so the same file can be uploaded again if needed
    e.target.value = '';
    
    const file = files[0];
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('Only images and videos are supported');
      console.error("File type not supported:", file.type);
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size exceeds the 50MB limit');
      console.error("File too large:", file.size);
      return;
    }
    
    try {
      setUploading(true);
      setProgress(10); // Start progress at 10%
      console.log("Starting upload process...");
      
      const formData = new FormData();
      formData.append('media', file);
      
      const userKey = localStorage.getItem('dapps_user_key');
      console.log("User key exists:", !!userKey);
      
      if (!userKey) {
        toast.error('Authentication required. Please log in again.');
        console.error("No user key found in localStorage");
        setUploading(false);
        return;
      }
      
      // Create an XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90) + 10;
          console.log(`Upload progress: ${percentComplete}%`);
          setProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        console.log("XHR load event triggered, status:", xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          try {
            console.log("Raw response:", xhr.responseText);
            const response = JSON.parse(xhr.responseText);
            console.log("Parsed response:", response);
            
            // Log detailed response properties
            console.log("Response success:", response.success);
            console.log("Response type:", response.type);
            console.log("Response url:", response.url);
            
            // Validate response before proceeding
            if (!response) {
              console.error("Response is null or undefined");
              throw new Error('Empty response from server');
            }
            
            if (response.success !== true) {
              console.error("Response success flag is not true:", response.success);
              throw new Error('Upload was not successful');
            }
            
            if (!response.type) {
              console.error("Response type is missing");
              throw new Error('Response missing media type');
            }
            
            // Call the callback with the validated response
            console.log("Calling onMediaUploaded with validated response");
            onMediaUploaded(response);
            
            // Reset after upload
            setTimeout(() => {
              setUploading(false);
              setProgress(0);
            }, 500);
          } catch (error) {
            console.error('Error parsing response:', error, xhr.responseText);
            toast.error('Error processing server response. Please try again.');
            setUploading(false);
          }
        } else {
          console.error('Upload failed with status:', xhr.status);
          console.error('Response text:', xhr.responseText);
          toast.error('Upload failed. Please try again.');
          setUploading(false);
        }
      });
      
      xhr.addEventListener('error', () => {
        console.error('XHR error during upload');
        toast.error('Connection error. Please try again.');
        setUploading(false);
      });
      
      xhr.addEventListener('abort', () => {
        console.log('Upload aborted');
        toast.info('Upload cancelled');
        setUploading(false);
      });
      
      console.log("Opening XHR connection to https://api.dapps.co/upload_media");
      xhr.open('POST', 'https://api.dapps.co/upload_media');
      xhr.setRequestHeader('x-user-key', userKey);
      console.log("Sending file...");
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
  // Guard against invalid media object
  if (!media) {
    console.error("MediaPreview received null or undefined media object");
    return null;
  }
  
  if (!media.type) {
    console.error("MediaPreview: media object is missing type property:", media);
    return null;
  }
  
  const isImage = media.type === 'image';
  
  return (
    <div className="relative group rounded-md overflow-hidden border">
      {isImage ? (
        <AspectRatio ratio={16/9}>
          <img 
            src={media.displayUrl} 
            alt="Uploaded content" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              console.error("Error loading image:", media.displayUrl);
              e.currentTarget.src = "https://placehold.co/400x225?text=Error+Loading+Image";
            }}
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
