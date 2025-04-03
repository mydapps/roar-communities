import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateUserProfile, UserProfile, UpdateProfileParams } from '@/utils/userApi';
import { Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  profile,
  onProfileUpdated
}) => {
  const [formData, setFormData] = useState<UpdateProfileParams>({
    background_image: profile.background_image || '',
    age: profile.age || undefined,
    location: profile.location || '',
    link: profile.link || '',
    answer: profile.answer || ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Make sure we're only sending fields that were actually changed
      const changedData: UpdateProfileParams = {};
      
      if (formData.background_image !== profile.background_image) {
        changedData.background_image = formData.background_image;
      }
      
      if (formData.age !== profile.age) {
        changedData.age = formData.age;
      }
      
      if (formData.location !== profile.location) {
        changedData.location = formData.location;
      }
      
      if (formData.link !== profile.link) {
        changedData.link = formData.link;
      }
      
      if (formData.answer !== profile.answer) {
        changedData.answer = formData.answer;
      }
      
      // Only make the API call if at least one field was changed
      if (Object.keys(changedData).length > 0) {
        const response = await updateUserProfile(changedData);
        
        if (response.success) {
          toast.success("Profile updated successfully");
          onProfileUpdated(response.user);
          onOpenChange(false);
        } else {
          toast.error("Failed to update profile");
        }
      } else {
        // No changes to save
        toast.info("No changes to save");
        onOpenChange(false);
      }
    } catch (error) {
      let message = "Failed to update profile";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="background_image">Background Image URL</Label>
            <Input
              id="background_image"
              name="background_image"
              placeholder="https://example.com/background.jpg"
              value={formData.background_image}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Provide a URL to your background image (1500x500 recommended)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="13"
                max="120"
                placeholder="Age"
                value={formData.age || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="City, Country"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Website</Label>
            <Input
              id="link"
              name="link"
              placeholder="https://example.com"
              value={formData.link}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">
              <div className="flex flex-col space-y-1">
                <span>Why did the chicken cross the road?</span>
                <span className="text-xs text-muted-foreground">
                  This answer will be shown on your profile to add a personal touch
                </span>
              </div>
            </Label>
            <Textarea
              id="answer"
              name="answer"
              placeholder="Your answer..."
              value={formData.answer}
              onChange={handleChange}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog; 