import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  UserProfile, 
  UpdateProfileParams, 
  getUserProfile, 
  updateUserProfile, 
  updateUserAvatar
} from '@/utils/userApi';
import { Calendar, Check, Image, Link2, Loader2, MapPin, Pencil, RefreshCcw, RotateCw, Save, Upload, User, X, ArrowLeft, Trash2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
// import { AvatarSelectionDialog } from '@/components/shared/AvatarSelectionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define MediaUploadResponse interface locally as it's not available from apiBase
// This should match the one in src/components/ui/media-upload.tsx
export interface MediaUploadResponse {
  success: boolean;
  url: string;
  type: 'image' | 'video'; // Assuming background is image only, but keeping general
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

const EditProfilePage = () => {
  const navigate = useNavigate();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UpdateProfileParams>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Media upload states
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  
  // Add new state variables for avatar changing
  const [avatarCode, setAvatarCode] = useState('');
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  
  // Add state for avatar gallery
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [galleryAvatars, setGalleryAvatars] = useState<string[]>([]);
  
  // Add new state for avatar change
  const [showAvatarChange, setShowAvatarChange] = useState(false);
  
  // Add new state for avatar edit
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  
  // Current user handle from localStorage
  const userHandle = localStorage.getItem('dapps_user_handle');
  
  useEffect(() => {
    if (!userHandle) {
      toast.error('You must be logged in to edit your profile');
      navigate('/');
      return;
    }
    fetchUserProfile();
  }, [userHandle, navigate]);
  
  const fetchUserProfile = useCallback(async () => {
    if (!userHandle) return;
      setLoading(true);
      setError(null);
    try {
      const response = await getUserProfile(userHandle);
      if (response.success && response.user) {
        setProfile(response.user);
        setFormData({
          background_image: response.user.background_image || '',
          age: response.user.age || undefined,
          location: response.user.location || '',
          link: response.user.link || '',
          answer: response.user.answer || '',
        });
        setAvatarCode(response.user.avatar_url || '');
      } else {
        const message = (response as any).message || 'Failed to fetch profile';
      setError(message);
      toast.error(message);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [userHandle]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaUpload = (url: string) => {
    setFormData(prev => ({ ...prev, background_image: url }));
    setUploadedImageUrl(url);
    setUploadingBackground(false);
    setUploadProgress(0);
    toast.success('Background image uploaded and set!');
  };

  const handleUploadError = (errorMessage: string) => {
    toast.error(errorMessage);
    setUploadingBackground(false);
    setUploadProgress(0);
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const triggerFileInput = () => {
    document.getElementById('background-upload-input')?.click();
  };

  // New function to handle background image upload using XMLHttpRequest
  const uploadProfileBackground = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<MediaUploadResponse> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('media', file);
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload_media', true); // Ensure this endpoint is correct
      xhr.withCredentials = true; // If cookies/sessions are needed
      
      xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
          }
      };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
            const response = JSON.parse(xhr.responseText) as MediaUploadResponse;
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error((response as any).message || 'Upload failed after processing.'));
            }
            } catch (e) {
            reject(new Error('Failed to parse upload response.'));
            }
          } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || errorResponse.message || `Upload failed with status: ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
        };
        
      xhr.onerror = () => {
        reject(new Error('Network error during upload.'));
      };
      
      xhr.send(formData);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingBackground(true);
      setUploadProgress(0);
      try {
        // Use the new uploadProfileBackground function
        const response = await uploadProfileBackground(file, handleUploadProgress);
        // response here is MediaUploadResponse
        if (response.success && response.url) {
          handleMediaUpload(response.url);
        } else {
          // This case should ideally be handled by the reject in uploadProfileBackground
          handleUploadError( (response as any).message || "Upload failed after processing.");
    }
      } catch (error: any) {
        handleUploadError(error.message || "Upload failed");
      }
    }
  };
  
  const saveAvatar = async () => {
    if (!avatarCode) {
      toast.error('No avatar selected.');
      return;
    }
    setIsSavingAvatar(true);
    try {
      const response = await updateUserAvatar(avatarCode);
      if (response.success) {
        toast.success('Avatar updated successfully!');
        if (profile && response.avatar_url) {
          setProfile(prevProfile => ({ ...prevProfile!, avatar_url: response.avatar_url! }));
        }
        setShowAvatarEdit(false);
      } else {
        toast.error(response.message || 'Failed to update avatar.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while updating avatar.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const generateMoreGalleryAvatars = () => {
    const newAvatars = Array.from({ length: 9 }, () => 
      Math.random().toString(36).substring(2, 11)
    );
    setGalleryAvatars(newAvatars);
  };
  
  const saveProfile = async () => {
    try {
      setSaving(true);
      const changedData: UpdateProfileParams = {};
      if (profile?.background_image !== formData.background_image) {
        changedData.background_image = formData.background_image;
      }
      if (profile?.age !== formData.age) {
        changedData.age = formData.age;
      }
      if (profile?.location !== formData.location) {
        changedData.location = formData.location;
      }
      if (profile?.link !== formData.link) {
        if (formData.link === '') {
          changedData.link = null;
        } else if (formData.link) {
          let url = formData.link;
          if (url && !url.match(/^https?:\/\//)) {
            url = 'https://' + url;
          }
          changedData.link = url;
        }
      }
      if (profile?.answer !== formData.answer) {
        changedData.answer = formData.answer;
      }
      if (Object.keys(changedData).length > 0) {
        const response = await updateUserProfile(changedData);
        if (response.success) {
          toast.success("Profile updated successfully");
          setProfile(response.user);
          setTimeout(() => {
            navigate(`/u/${userHandle}`);
          }, 1500);
        } else {
          toast.error((response as any).message || "Failed to update profile");
        }
      } else {
        toast.info("No changes detected");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-20 px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-destructive/90 mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return null; // Or some other placeholder/error state
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Profile - {profile.handle}</title>
        <meta name="description" content={`Edit your Roar profile, ${profile.handle}. Update your avatar, background, bio, and more.`} />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-background text-foreground">
      <div className="container max-w-4xl mx-auto py-10 px-4">
          <div className="flex items-center mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 px-2 rounded-lg shadow-sm border border-border/30">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="avatar">Avatar & Appearance</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {activeTab === 'avatar' && (
                <motion.div
                  key="avatar-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
            <Card>
                    <CardHeader>
                      <CardTitle>Avatar & Appearance</CardTitle>
                <CardDescription>
                        Customize your public avatar and background image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col items-center text-center">
                <div className="w-24 h-24 relative group">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                            src={`https://img.dapps.co/avatar/${avatarCode || (profile?.avatar_url)}.svg`}
                      alt={profile.handle} 
                    />
                    <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/90 to-primary/50 text-white">
                      {profile.handle.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowAvatarEdit(!showAvatarEdit);
                    if (!showAvatarEdit && galleryAvatars.length === 0) {
                      const avatars = Array.from({ length: 9 }, () => 
                        Math.random().toString(36).substring(2, 11)
                      );
                      setGalleryAvatars(avatars);
                    }
                  }}
                  className="text-primary hover:text-primary/80 px-2 h-8 text-sm"
                >
                  <Image className="h-4 w-4 mr-1.5" />
                  {showAvatarEdit ? "Hide avatar options" : "Change avatar"}
                </Button>
                
                {showAvatarEdit && (
                        <Card className="w-full p-4 mt-4 border-primary/20 shadow-sm bg-muted/20">
                          <CardContent className="pt-0">
                            <CardDescription className="text-xs mb-3 text-center">
                              Select a new avatar below or generate more options.
                            </CardDescription>
                            <div className="grid grid-cols-3 gap-3">
                        {galleryAvatars.map((code) => (
                                <AspectRatio ratio={1} key={code}>
                                  <button
                                    onClick={() => setAvatarCode(code)}
                            className={clsx(
                                      "rounded-md overflow-hidden border-2 transition-all duration-150 ease-in-out flex items-center justify-center bg-background hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none",
                                      avatarCode === code ? "border-primary scale-105 shadow-lg" : "border-muted/50"
                                    )}
                                  >
                                    <img src={`https://img.dapps.co/avatar/${code}.svg`} alt={`Avatar ${code}`} className="w-full h-full object-cover" />
                                  </button>
                                </AspectRatio>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateMoreGalleryAvatars}
                          className="text-xs flex-grow-0"
                        >
                          <RefreshCcw className="h-3 w-3 mr-1" />
                          More Options
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveAvatar}
                          disabled={isSavingAvatar}
                          className="text-xs flex-grow-0"
                        >
                          {isSavingAvatar ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Save Avatar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                      <Separator className="my-6" />                 
                {/* Background Image */}
                      <div className="space-y-3 w-full text-left">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="background_image" className="text-base">
                      Background Image
                    </Label>
                    {formData.background_image && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={() => setFormData(prev => ({ ...prev, background_image: '' }))}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                        <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden border border-dashed">
                          {uploadingBackground ? (
                            <div className="flex flex-col items-center justify-center h-full">
                              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                              <p className="text-sm text-muted-foreground">Uploading: {uploadProgress}%</p>
                            </div>
                          ) : formData.background_image ? (
                          <img 
                            src={formData.background_image} 
                              alt="Profile background" 
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <Image className="h-12 w-12 mb-2 opacity-50" />
                              <p>No background image</p>
                              <p className="text-xs">Recommended: 1500x500px</p>
                            </div>
                          )}
                        </AspectRatio>
                        <Input 
                          id="background-upload-input"
                            type="file"
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                          variant="outline" 
                          onClick={triggerFileInput} 
                          disabled={uploadingBackground}
                          className="w-full gap-1.5"
                        >
                          {uploadingBackground ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Upload Background Image
                          </Button>
                        {uploadedImageUrl && (
                          <p className="text-xs text-muted-foreground">
                            New background set. Save changes to apply.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                      <CardDescription>
                        Update your public information. This will be visible on your profile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-2">
                        <Label htmlFor="handle">Handle</Label>
                        <Input id="handle" value={profile.handle} disabled />
                  <p className="text-xs text-muted-foreground">
                          Your unique handle cannot be changed.
                  </p>
                </div>
                
                      <div className="grid gap-2">
                        <Label htmlFor="location">Location (Optional)</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleInputChange}
                          placeholder="e.g., Earth" 
                      />
                    </div>
                    
                      <div className="grid gap-2">
                        <Label htmlFor="link">Link (Optional)</Label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="link"
                      name="link"
                      value={formData.link || ''}
                      onChange={handleInputChange}
                            placeholder="yourwebsite.com"
                            className="pl-10"
                    />
                        </div>
                    <p className="text-xs text-muted-foreground">
                          A link to your personal website, social media, or other relevant page.
                    </p>
                  </div>
                  
                      <div className="grid gap-2">
                        <Label htmlFor="answer">Why did the chicken cross the road? (Optional)</Label>
                    <Textarea
                      id="answer"
                      name="answer"
                      value={formData.answer || ''}
                      onChange={handleInputChange}
                          placeholder="To get to the other side... or something funnier!"
                          className="min-h-[80px]"
                    />
                        <p className="text-xs text-muted-foreground">
                          A fun, optional field for your profile.
                        </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/u/${userHandle}`)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveProfile} 
                  disabled={saving}
                  className="gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
                </motion.div>
                    )}
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default EditProfilePage; 