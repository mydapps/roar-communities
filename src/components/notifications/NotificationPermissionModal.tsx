import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { BellRing, X, Sparkles, MessageCircle, Users, Heart, Zap, Gift, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications';
import { useIsMobile } from '@/hooks/use-mobile';
import { optInUser, getPlayerId, setExternalUserId } from 'webtonative/OneSignal';
import { deviceInfo as getWebtonativeDeviceInfo } from 'webtonative';
import { registerDeviceForNotifications } from '@/utils/apiBase';
import { toast } from 'sonner';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted
}) => {
  const { isMobileApp, deviceInfo, isLoading, refreshStatus } = useDeviceNotifications();
  const isMobile = useIsMobile();
  const [isEnabling, setIsEnabling] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Enhanced features with better benefits
  const features = [
    {
      icon: MessageCircle,
      title: "Stay Updated",
      description: "Get alerts for replies and mentions",
      color: "#31bcc3",
      emoji: "💬"
    },
    {
      icon: Users,
      title: "Community Events",
      description: "Never miss trending discussions",
      color: "#0891b2",
      emoji: "🌟"
    },
    {
      icon: Heart,
      title: "Track Engagement",
      description: "See when you get 🦁 roars",
      color: "#06b6d4",
      emoji: "🦁"
    },
    {
      icon: Gift,
      title: "Exclusive Rewards",
      description: "Get notified about 🦁 rewards",
      color: "#f59e0b",
      emoji: "🎁"
    }
  ];

  // Auto-advance through features
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, features.length]);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    
    try {
      console.log('[NotificationModal] Starting enable notifications process');
      console.log('[NotificationModal] Current deviceInfo from hook:', deviceInfo);
      console.log('[NotificationModal] Hook isLoading:', isLoading);
      
      // Get userId from local storage for external user ID
      const userId = localStorage.getItem('dapps_user_id');
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.');
        setIsEnabling(false);
        return;
      }

      // Step 1: Verify webtonative/OneSignal is available
      if (typeof optInUser !== 'function') {
        throw new Error('OneSignal functions not available. Please check if webtonative is properly installed.');
      }

      // Step 2: Opt-in the user for push notifications
      try {
        await optInUser();
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error during optInUser()';
        toast.error(`Permission request failed: ${error}`);
        throw err;
      }

      // Step 3: Get the OneSignal player ID
      let playerId;
      try {
        playerId = await getPlayerId();
        
        if (!playerId) {
          throw new Error('Failed to get OneSignal player ID');
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error getting player ID';
        throw new Error(`Failed to get player ID: ${error}`);
      }

      // Step 4: Set the external user ID in OneSignal
      try {
        await setExternalUserId(userId);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error setting external user ID';
        toast.warning(`Warning: Failed to set external user ID: ${error}`);
      }

      // Step 5: Get device info (properly from webtonative, same as notifications page)
      let finalDeviceInfo = deviceInfo;
      
      // If hook doesn't have device info yet, get it directly from webtonative
      if (!finalDeviceInfo?.installationId) {
        console.log('No installationId from hook, getting device info directly from webtonative');
        try {
          // Get device info directly from webtonative - same as the hook does
          finalDeviceInfo = await getWebtonativeDeviceInfo();
          console.log('Device info from webtonative:', finalDeviceInfo);
        } catch (webtonativeError) {
          console.error('Failed to get device info from webtonative:', webtonativeError);
          throw new Error('Failed to get device information from webtonative. Please try again.');
        }
      }

      if (!finalDeviceInfo?.installationId) {
        throw new Error('Device installation ID not found. Please ensure you are using the mobile app.');
      }

      const deviceType = finalDeviceInfo.platform || finalDeviceInfo.os?.toLowerCase() || 'unknown';
      const deviceModel = finalDeviceInfo.model || 'Unknown Device';

      const registrationData = {
        installationId: finalDeviceInfo.installationId,
        deviceType: deviceType,
        deviceModel: deviceModel,
        pushToken: playerId
      };

      console.log('[NotificationModal] Registering device with data:', registrationData);
      const registrationResult = await registerDeviceForNotifications(registrationData);
      
      if (!registrationResult.success) {
        throw new Error(registrationResult.error || 'Failed to register device');
      }

      // Mark that user has been prompted for notifications
      localStorage.setItem('dapps_notification_prompted', 'true');
      localStorage.setItem('dapps_notification_enabled', 'true');
      
      // Show success message
      toast.success('🎉 Amazing! You\'ll now get notifications from dapps.co!');
      
      // Refresh the notification status
      setTimeout(() => refreshStatus(), 1000);
      
      if (onPermissionGranted) {
        onPermissionGranted();
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error(`Failed to enable notifications: ${errorMessage}`);
      
      // Still mark as prompted even if failed, so we don't keep bothering the user
      localStorage.setItem('dapps_notification_prompted', 'true');
      localStorage.setItem('dapps_notification_enabled', 'false');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    console.log('[NotificationModal] handleMaybeLater called');
    // Mark that user has been prompted but chose not to enable
    localStorage.setItem('dapps_notification_prompted', 'true');
    localStorage.setItem('dapps_notification_enabled', 'false');
    console.log('[NotificationModal] Calling onClose');
    onClose();
  };

  const currentFeature = features[currentStep];
  const CurrentIcon = currentFeature?.icon || BellRing;

  // Shared content component
  const NotificationContent = () => (
    <div className="space-y-5">
      {/* Hero section with animated icon */}
      <div className="text-center space-y-3">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          {/* Pulsing background */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${currentFeature?.color}20, ${currentFeature?.color}10)`
            }}
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                `0 0 0 0 ${currentFeature?.color}40`,
                `0 0 0 20px ${currentFeature?.color}00`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          
          {/* Main icon */}
          <motion.div
            className="relative z-10 w-14 h-14 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.6 }}
              >
                <CurrentIcon 
                  className="h-7 w-7" 
                  style={{ color: currentFeature?.color }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Floating sparkles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${15 + Math.sin(i * 90) * 25}%`,
                left: `${15 + Math.cos(i * 90) * 25}%`,
              }}
              animate={{
                y: [0, -6, 0],
                opacity: [0.3, 1, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            >
              <Star className="h-2 w-2 text-amber-400" />
            </motion.div>
          ))}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Stay Connected to dapps.co
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Enable notifications for the best experience
          </p>
        </div>
      </div>

      {/* Feature showcase */}
      <div className="space-y-3">
        <div className="relative h-20 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 p-3 flex items-center space-x-3"
            >
              <div className="text-2xl">{currentFeature?.emoji}</div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-sm" style={{ color: currentFeature?.color }}>
                  {currentFeature?.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-snug">
                  {currentFeature?.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center space-x-2">
          {features.map((_, index) => (
            <motion.button
              key={index}
              className="w-2 h-2 rounded-full"
              onClick={() => setCurrentStep(index)}
              animate={{
                backgroundColor: index === currentStep ? currentFeature?.color : '#e5e7eb',
                scale: index === currentStep ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Benefits list */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>Instant alerts</span>
        </div>
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span>Track activity</span>
        </div>
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30">
          <Users className="h-3 w-3 text-blue-500" />
          <span>Community updates</span>
        </div>
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/30">
          <Gift className="h-3 w-3 text-purple-500" />
          <span>Reward alerts</span>
        </div>
      </div>
    </div>
  );

  // Mobile drawer implementation
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => {
        if (!open && !isEnabling) {
          onClose();
        }
      }}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="relative pb-3 flex-shrink-0">
            <DrawerTitle className="text-lg">🔔 Enable Notifications</DrawerTitle>
            <DrawerDescription>
              Stay updated with dapps.co
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-4">
            <NotificationContent />
          </div>
          
          <DrawerFooter className="pt-3 pb-6 space-y-3 flex-shrink-0">
            <Button
              onClick={handleEnableNotifications}
              disabled={isEnabling}
              size="lg"
              className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/90 hover:to-primary text-white font-semibold text-base py-6"
            >
              {isEnabling ? (
                <motion.div
                  className="flex items-center"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <BellRing className="h-5 w-5 mr-2" />
                  Setting up notifications...
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center"
                  whileTap={{ scale: 0.98 }}
                >
                  <BellRing className="h-5 w-5 mr-2" />
                  Enable Notifications
                </motion.div>
              )}
            </Button>

            <Button
              onClick={handleMaybeLater}
              disabled={isEnabling}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </Button>
            
            <p className="text-xs text-center text-muted-foreground px-4">
              You can change this anytime in settings
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop sheet implementation
  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open && !isEnabling) {
        onClose();
      }
    }}>
      <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto overflow-y-auto max-h-[80vh]">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-lg">🔔 Enable Notifications</SheetTitle>
          <SheetDescription>
            Stay updated with dapps.co
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-3">
          <NotificationContent />
        </div>
        
        <div className="pt-3 pb-6 space-y-3">
          <Button
            onClick={handleEnableNotifications}
            disabled={isEnabling}
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary/90 hover:to-primary text-white font-semibold text-base py-6"
          >
            {isEnabling ? (
              <motion.div
                className="flex items-center"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <BellRing className="h-5 w-5 mr-2" />
                Setting up notifications...
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BellRing className="h-5 w-5 mr-2" />
                Enable Notifications
              </motion.div>
            )}
          </Button>

          <Button
            onClick={handleMaybeLater}
            disabled={isEnabling}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </Button>
          
          <p className="text-xs text-center text-muted-foreground px-4">
            You can change this anytime in settings
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPermissionModal; 