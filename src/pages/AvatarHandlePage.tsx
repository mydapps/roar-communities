
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCcw, Check, X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/use-mobile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const AvatarHandlePage = () => {
  const [avatarCode, setAvatarCode] = useState('');
  const [handle, setHandle] = useState('');
  const [isHandleValid, setIsHandleValid] = useState<boolean | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  // Check localStorage on mount
  useEffect(() => {
    const userKey = localStorage.getItem('dapps_user_key');
    
    if (!userKey) {
      // Clear localStorage and redirect to index
      localStorage.clear();
      navigate('/');
      return;
    }
    
    const handle = localStorage.getItem('dapps_user_handle');
    const avatar = localStorage.getItem('dapps_user_avatar');
    const registered = localStorage.getItem('dapps_user_registered');
    
    if (handle && avatar) {
      if (registered === "1") {
        navigate('/feed');
      } else {
        navigate('/request-invite');
      }
    }
  }, [navigate]);
  
  // Generate a random avatar on first load
  useEffect(() => {
    generateNewAvatar();
  }, []);
  
  const generateNewAvatar = () => {
    // Generate a random string for the avatar
    const randomStr = Math.random().toString(36).substring(2, 8);
    setAvatarCode(randomStr);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHandle(value);
    // Reset error state when typing
    if (showError) {
      setShowError(false);
      setErrorMessage('');
    }
    setIsHandleValid(null); // Keep neutral while typing
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (handle.trim().length === 0) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userKey = localStorage.getItem('dapps_user_key');
      
      if (!userKey) {
        toast.error('Authentication error. Please log in again.');
        localStorage.clear();
        navigate('/');
        return;
      }
      
      const response = await fetch('https://api.dapps.co/choose_handle_avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-key': userKey
        },
        body: JSON.stringify({
          handle: handle.trim(),
          avatarCode: avatarCode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store the selected avatar and handle in localStorage
        localStorage.setItem('dapps_user_avatar', data.avatarUrl || `https://img.dapps.co/avatar/${avatarCode}.svg`);
        localStorage.setItem('dapps_user_handle', data.handle || handle);
        
        toast.success('Profile created successfully!');
        
        // Check registration status
        const registered = localStorage.getItem('dapps_user_registered');
        if (registered === "1") {
          navigate('/feed');
        } else {
          navigate('/request-invite');
        }
      } else {
        setIsHandleValid(false);
        setShowError(true);
        setErrorMessage(data.message || 'There was an error creating your profile.');
        toast.error(data.message || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Error submitting handle and avatar:', error);
      toast.error('Network error. Please try again.');
      setIsHandleValid(false);
      setShowError(true);
      setErrorMessage('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-purple-100 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl md:text-2xl font-bold text-purple-800">Create Your Identity</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar className={`border-4 border-purple-200 shadow-md transition-all duration-300 ${isMobile ? 'w-32 h-32' : 'w-44 h-44'}`}>
                <AvatarImage src={`https://img.dapps.co/avatar/${avatarCode}.svg`} alt="Your Avatar" className="object-cover" />
                <AvatarFallback className="bg-purple-100 text-purple-800">
                  <RefreshCcw className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute -bottom-2 -right-2 rounded-full shadow-md bg-white hover:bg-purple-100 border border-purple-200"
                onClick={generateNewAvatar}
                aria-label="Generate new avatar"
              >
                <RefreshCcw className="w-4 h-4 text-purple-700" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 font-medium">Tap to get a new avatar</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handle" className="text-sm font-medium text-gray-700">
                Choose your unique handle
              </Label>
              <div className="relative">
                <Input
                  id="handle"
                  placeholder="Enter your handle"
                  value={handle}
                  onChange={handleInputChange}
                  className={`pr-10 ${
                    isHandleValid === true 
                      ? 'border-green-500 focus-visible:ring-green-500' 
                      : isHandleValid === false && showError
                        ? 'border-red-500 focus-visible:ring-red-500' 
                        : ''
                  }`}
                  autoComplete="off"
                />
                {isHandleValid !== null && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isHandleValid ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {showError && isHandleValid === false && (
                <div className="flex items-center gap-1.5 text-sm text-red-500 mt-1.5 animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white group transition-all"
            disabled={handle.trim().length === 0 || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AvatarHandlePage;
