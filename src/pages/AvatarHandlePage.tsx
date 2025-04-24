import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCcw, Check, X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/use-mobile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AvatarHandlePage = () => {
  const [avatarCode, setAvatarCode] = useState('');
  const [handle, setHandle] = useState('');
  const [isHandleValid, setIsHandleValid] = useState<boolean | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [avatarHistory, setAvatarHistory] = useState<string[]>([]);
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  // Check localStorage on mount
  useEffect(() => {
    // Don't check for userKey, just userId to see if logged in
    const userId = localStorage.getItem('dapps_user_id');
    
    if (!userId) {
      // Clear localStorage and redirect to index
      localStorage.clear();
      navigate('/');
      return;
    }
    
    const handle = localStorage.getItem('dapps_user_handle');
    const avatar = localStorage.getItem('dapps_user_avatar');
    const registered = localStorage.getItem('dapps_user_registered');
    
    if (handle && avatar) {
      // Only redirect to request-invite if registered is not "1"
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
    
    // Keep track of previous avatars for animation
    setAvatarHistory(prev => [...prev.slice(-2), avatarCode].filter(Boolean));
    setAvatarCode(randomStr);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent spaces in the input
    const value = e.target.value.replace(/\s+/g, '');
    setHandle(value);
    
    // Reset error state when typing
    if (showError) {
      setShowError(false);
      setErrorMessage('');
    }
    setIsHandleValid(null); // Keep neutral while typing
  };
  
  const handleAvatarSelect = (code: string) => {
    setAvatarCode(code);
    setError(''); // Clear error when avatar is selected
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handle.trim() || !avatarCode) {
      setError('Please enter a handle and select an avatar.');
      return;
    }
    
    // Remove internal validation and rely on external validation
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/choose_handle_avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: handle.trim(), avatarCode }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update localStorage
        localStorage.setItem('dapps_user_handle', handle.trim());
        localStorage.setItem('dapps_user_avatar', avatarCode);
        
        toast.success('Profile setup successful!');
        // Navigate to the next step (e.g., request invite page)
        navigate('/request-invite');
      } else {
        // Set specific error from API or generic one
        setError(data.message || 'Failed to save profile. Handle might be taken.');
      }
    } catch (err) {
      console.error('Error submitting handle/avatar:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-white flex items-center justify-center p-4 overflow-hidden">
      {/* Background elements for visual appeal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[20%] w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 right-[30%] w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-[40%] w-36 h-36 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="w-full mx-auto shadow-xl border-purple-100 overflow-hidden">
          <CardHeader className="text-center pb-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex justify-center mb-2">
                <img 
                  src="/images/dapps-icon.png" 
                  alt="dapps.co icon" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold">Welcome to dapps.co</CardTitle>
              <CardDescription className="text-white/80 mt-1">Let's create your unique identity</CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-8 pt-8">
            <div className="flex flex-col items-center space-y-5">
              <div className="relative">
                {/* Previous avatars shown as smaller, faded out images for "history" effect */}
                {avatarHistory.map((code, index) => (
                  <motion.div 
                    key={code}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0"
                    initial={{ scale: 1, opacity: 0.8, x: '-50%', y: '-50%' }}
                    animate={{ 
                      scale: 0.7 - index * 0.2, 
                      opacity: 0.3 - index * 0.1,
                      x: `calc(-50% + ${(index + 1) * -15}px)`,
                      y: `calc(-50% + ${(index + 1) * -10}px)`,
                      zIndex: -1 - index
                    }}
                  >
                    <Avatar className="border-2 border-purple-200/50 shadow-sm">
                      <AvatarImage src={`https://img.dapps.co/avatar/${code}.svg`} alt="Previous Avatar" className="opacity-40" />
                    </Avatar>
                  </motion.div>
                ))}
                
                {/* Current avatar with animation */}
                <motion.div
                  key={avatarCode}
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <Avatar className={`border-4 border-gradient-to-r from-purple-400 to-indigo-400 shadow-xl transition-all duration-300 ${isMobile ? 'w-36 h-36' : 'w-48 h-48'}`}>
                    <AvatarImage src={`https://img.dapps.co/avatar/${avatarCode}.svg`} alt="Your Avatar" className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
                      <RefreshCcw className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute -bottom-2 -right-2 rounded-full shadow-md bg-white hover:bg-purple-100 border border-purple-200"
                    onClick={generateNewAvatar}
                    aria-label="Generate new avatar"
                  >
                    <RefreshCcw className="w-4 h-4 text-purple-700" />
                  </Button>
                </motion.div>
              </div>
              
              <motion.button 
                type="button"
                onClick={generateNewAvatar}
                className="text-sm text-gray-600 font-medium hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-md px-3 py-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-semibold">Tap</span> to explore different avatars
              </motion.button>
            </div>
            
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-3">
                <Label htmlFor="handle" className="text-sm font-medium text-gray-700 flex items-center">
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-semibold">
                    Choose your unique handle
                  </span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center text-gray-700 text-base md:text-lg font-medium pointer-events-none z-10">
                    @
                  </div>
                  <Input
                    id="handle"
                    placeholder="awesome_user"
                    value={handle}
                    onChange={handleInputChange}
                    className={`pl-8 md:pl-10 pr-10 h-12 text-base ${
                      isHandleValid === true 
                        ? 'border-green-500 focus-visible:ring-green-500' 
                        : isHandleValid === false && showError
                          ? 'border-red-500 focus-visible:ring-red-500' 
                          : 'border-purple-200 focus-visible:ring-purple-500'
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
                  <motion.div 
                    className="flex items-center gap-1.5 text-sm text-red-500 mt-1.5"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </div>
              
              <motion.div 
                className="pt-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white group transition-all"
                  disabled={handle.trim().length === 0 || isLoading}
                  onClick={handleSubmit}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>
            
            {error && (
              <motion.p 
                className="text-red-500 text-sm mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
          </CardContent>
          
          <CardFooter className="pb-6">
            
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default AvatarHandlePage;
