import React, { useState, useEffect } from 'react';
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
import { getUserProfile, updateUserProfile, UpdateProfileParams, UserProfile } from '@/utils/userApi';
import { Calendar, Check, Image, Link2, Loader2, MapPin, Pencil, RotateCw, Save, Upload, User, X } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MediaUploadResponse } from '@/components/ui/media-upload';
import { API_BASE_URL } from '@/utils/apiBase';

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
  
  // Current user handle from localStorage
  const userHandle = localStorage.getItem('dapps_user_handle');
  
  useEffect(() => {
    // Redirect if not logged in
    if (!userHandle) {
      toast.error('You must be logged in to edit your profile');
      navigate('/');
      return;
    }
    
    fetchUserProfile();
  }, [userHandle, navigate]);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserProfile(userHandle || '');
      
      if (response.success && response.user) {
        setProfile(response.user);
        // Initialize form data
        setFormData({
          background_image: response.user.background_image || '',
          age: response.user.age || undefined,
          location: response.user.location || '',
          link: response.user.link || '',
          answer: response.user.answer || ''
        });
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (error) {
      let message = 'Failed to load user profile';
      if (error instanceof Error) {
        message = error.message;
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle age as a number
    if (name === 'age') {
      // Only update if value is a number or empty
      if (value === '' || !isNaN(Number(value))) {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? undefined : Number(value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const uploadBackgroundImage = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported for background');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit');
      return;
    }
    
    // Get user key for authentication
    const userKey = localStorage.getItem('dapps_user_key');
    if (!userKey) {
      toast.error('Authentication required. Please log in again.');
      return;
    }
    
    try {
      setUploadingBackground(true);
      setUploadProgress(10);
      
      // Create form data
      const formData = new FormData();
      formData.append('media', file);
      
      // Track upload with XMLHttpRequest for progress
      const xhr = new XMLHttpRequest();
      
      // Set up a promise to handle the response
      const uploadPromise = new Promise<MediaUploadResponse>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 90) + 10;
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                url: response.url,
                type: 'image',
                originalUrl: response.url,
                displayUrl: response.url,
                markdown: response.markdown,
                isProcessing: false
              });
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload aborted'));
      });
      
      // Send the request
      xhr.open('POST', `${API_BASE_URL}/upload_media`);
      xhr.setRequestHeader('x-user-key', userKey);
      xhr.send(formData);
      
      // Wait for upload to complete
      const result = await uploadPromise;
      
      // Update form data with new URL
      if (result.success && result.url) {
        setFormData(prev => ({
          ...prev,
          background_image: result.url
        }));
        toast.success('Background image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingBackground(false);
      setUploadProgress(0);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadBackgroundImage(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadBackgroundImage(file);
    }
  };
  
  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Make sure we're only sending fields that were actually changed
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
      
      // Handle link field - only send it if it's non-empty or explicitly set to null
      if (profile?.link !== formData.link) {
        // If link was cleared, set it to null instead of empty string
        if (formData.link === '') {
          changedData.link = null;
        } else if (formData.link) {
          // Ensure URL has a protocol
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
      
      // Only make the API call if at least one field was changed
      if (Object.keys(changedData).length > 0) {
        const response = await updateUserProfile(changedData);
        
        if (response.success) {
          toast.success("Profile updated successfully");
          setProfile(response.user);
          
          // Wait a moment before redirecting
          setTimeout(() => {
            navigate(`/u/${userHandle}`);
          }, 1500);
        } else {
          toast.error("Failed to update profile");
        }
      } else {
        // No changes to save
        toast.info("No changes detected");
      }
    } catch (error) {
      let message = "Failed to update profile";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
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
    return null;
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Profile | Roar Communities</title>
      </Helmet>
      
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">Customize your profile and settings</p>
          </div>
          
          <div className="flex gap-2">
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
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Profile Preview</CardTitle>
                <CardDescription>
                  How others will see your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url} alt={profile.handle} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/90 to-primary/50 text-white">
                    {profile.handle.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-xl font-bold">@{profile.handle}</h3>
                  
                  {profile.is_founding_user && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white mt-1">
                      Founding Member
                    </Badge>
                  )}
                  
                  <div className="mt-3 text-sm flex flex-col gap-1.5">
                    {formData.location && (
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formData.location}</span>
                      </div>
                    )}
                    
                    {formData.link && formData.link !== '' && (
                      <div className="flex items-center justify-center gap-1">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <a 
                          href={formData.link.match(/^https?:\/\//) ? formData.link : `https://${formData.link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[180px]"
                        >
                          {formData.link.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    
                    {formData.age && (
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formData.age} years old</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {formData.answer && (
                  <div className="mt-2 pt-4 border-t w-full">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Why did the chicken cross the road?
                    </p>
                    <p className="text-sm">{formData.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and customize your appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Background Image */}
                <div className="space-y-3">
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
                  
                  <div
                    className="border border-dashed rounded-md overflow-hidden bg-muted/30 relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {formData.background_image ? (
                      <div className="relative">
                        <AspectRatio ratio={3/1}>
                          <img 
                            src={formData.background_image} 
                            alt="Background Preview" 
                            className="w-full h-full object-cover"
                          />
                        </AspectRatio>
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => document.getElementById('background-upload')?.click()}
                            className="shadow-md"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Change Background
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <AspectRatio ratio={3/1}>
                        <div className="flex flex-col items-center justify-center h-full">
                          <input
                            id="background-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileInputChange}
                          />
                          <Button
                            variant="ghost"
                            size="lg"
                            className="text-muted-foreground"
                            onClick={() => document.getElementById('background-upload')?.click()}
                          >
                            <Image className="h-6 w-6 mr-2" />
                            <div className="flex flex-col items-start">
                              <span>Upload Background Image</span>
                              <span className="text-xs font-normal">Drag & drop or click to browse</span>
                            </div>
                          </Button>
                        </div>
                      </AspectRatio>
                    )}
                    
                    {uploadingBackground && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                    
                    <input
                      id="background-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1500x500px. Max size: 10MB. JPG or PNG format.
                  </p>
                </div>
                
                {/* Profile Details */}
                <div className="grid gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-base">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Location
                        </div>
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="City, Country"
                        value={formData.location || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-base">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Age
                        </div>
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        min="13"
                        max="120"
                        placeholder="Your age"
                        value={formData.age || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="link" className="text-base">
                      <div className="flex items-center gap-1.5">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        Website or Social Link
                      </div>
                    </Label>
                    <Input
                      id="link"
                      name="link"
                      placeholder="example.com or https://example.com"
                      value={formData.link || ''}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your website URL (leave empty if you don't have one)
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="answer" className="text-base">
                      <div className="flex flex-col space-y-1">
                        <span>Why did the chicken cross the road?</span>
                        <span className="text-xs text-muted-foreground">
                          This answer will be shown on your profile as a personal touch
                        </span>
                      </div>
                    </Label>
                    <Textarea
                      id="answer"
                      name="answer"
                      placeholder="Your answer..."
                      value={formData.answer || ''}
                      onChange={handleInputChange}
                      className="min-h-[120px]"
                    />
                  </div>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfilePage; 