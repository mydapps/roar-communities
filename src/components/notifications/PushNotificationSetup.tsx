import React, { useState } from 'react';
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { optInUser, getPlayerId, setExternalUserId } from 'webtonative/OneSignal';
import { registerDeviceForNotifications } from '@/utils/apiBase';

interface PushNotificationSetupProps {
  variant?: 'card' | 'inline' | 'minimal';
  className?: string;
}

const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({ 
  variant = 'card',
  className = ''
}) => {
  const {
    isMobileApp,
    deviceInfo,
    isLoading,
    isRegistered,
    isEnabled,
    error,
    refreshStatus,
    diagnosticInfo
  } = useDeviceNotifications();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);



  // If not on a mobile app, don't render anything
  if (!isMobileApp) {
    return null;
  }

  // If already registered and enabled, don't show the setup component
  if (isRegistered && isEnabled) {
    return null;
  }

  // Handle enable push notifications
  const handleEnablePushNotifications = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      // Get userId from local storage for external user ID
      const userId = localStorage.getItem('dapps_user_id');
      
      if (!userId) {
        const error = 'User ID not found. Please log in again.';
        toast.error(error);
        setProcessingError(error);
        setIsProcessing(false);
        return;
      }
      
      // Step 1: Verify webtonative/OneSignal is available
      if (typeof optInUser !== 'function') {
        const error = 'OneSignal functions not available. Please check if webtonative is properly installed.';
        throw new Error(error);
      }
      
      // Step 1: Opt-in the user for push notifications
      try {
        await optInUser();
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error during optInUser()';
        toast.error(`Permission request failed: ${error}`);
        throw err;
      }
      
      // Step 2: Get the OneSignal player ID
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
      
      // Step 3: Set the external user ID in OneSignal
      try {
        await setExternalUserId(userId);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error setting external user ID';
        toast.warning(`Warning: Failed to set external user ID: ${error}`);
      }
      
      // Step 4: Register the device with our API
      if (!deviceInfo?.installationId) {
        const error = 'Device installation ID not found';
        throw new Error(error);
      }
      
      const deviceType = deviceInfo.platform || deviceInfo.os?.toLowerCase() || 'unknown';
      const deviceModel = deviceInfo.model || 'Unknown Device';
      
      const registrationData = {
        installationId: deviceInfo.installationId,
        deviceType: deviceType,
        deviceModel: deviceModel,
        pushToken: playerId
      };
      
      try {
        const registrationResult = await registerDeviceForNotifications(registrationData);
        
        if (!registrationResult.success) {
          throw new Error(registrationResult.error || 'Failed to register device');
        }
        
        // Show success message
        toast.success('Push notifications enabled successfully!');
        
        // Refresh the notification status
        setTimeout(() => refreshStatus(), 1000);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error registering device';
        throw new Error(`Failed to register device: ${error}`);
      }
      
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error(`Failed to enable push notifications: ${errorMessage}`);
      setProcessingError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Minimal variant (just a button)
  if (variant === 'minimal') {
    if (isLoading) {
      return <Skeleton className="h-9 w-32" />;
    }
    
    return (
      <Button
        size="sm"
        variant="outline"
        className={`gap-1 ${className}`}
        onClick={handleEnablePushNotifications}
        disabled={(isRegistered && !isEnabled) || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <BellRing className="h-4 w-4" />
        )}
        {isProcessing 
          ? 'Setting up...' 
          : isRegistered 
            ? 'Enable Notifications' 
            : 'Set Up Notifications'}
      </Button>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    if (isLoading) {
      return (
        <div className={`flex items-center gap-3 p-3 border rounded-md ${className}`}>
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 p-3 border border-primary/20 rounded-md bg-primary/5 ${className}`}>
        <BellRing className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h4 className="text-sm font-medium">Enable Push Notifications</h4>
          <p className="text-xs text-muted-foreground">Stay updated on your activity</p>
        </div>
        <Button
          size="sm"
          variant="default"
          className="whitespace-nowrap"
          onClick={handleEnablePushNotifications}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Setting up...
            </>
          ) : (
            'Enable'
          )}
        </Button>
      </div>
    );
  }

  // Default card variant
  if (isLoading) {
    return (
      <Card className={`border-primary/20 ${className}`}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="pb-2">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Enable Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about new activity in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm">
          Never miss important updates. Enable push notifications to receive alerts even when you're not using the app.
        </p>
        

        
        {/* Show original error from the hook */}
        {error && !processingError && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-600">
              There was an error checking your device notification status: {error}
            </p>
          </div>
        )}
        
        {/* Show processing error if any */}
        {processingError && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-600 font-medium">
                Error: {processingError}
              </p>
            </div>
          </div>
        )}
        
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          variant="default" 
          className="w-full"
          onClick={handleEnablePushNotifications}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Setting up Notifications...
            </>
          ) : (
            'Enable Notifications'
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          You can change this setting anytime in your notification preferences.
        </p>
      </CardFooter>
    </Card>
  );
};

export default PushNotificationSetup; 