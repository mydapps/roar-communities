import React, { useState } from 'react';
import { useDeviceNotifications } from '@/hooks/useDeviceNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, AlertCircle, Loader2, Info } from 'lucide-react';
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
  const [logs, setLogs] = useState<string[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Helper function to log messages both to console and state
  const logMessage = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().substr(11, 8)}: ${message}`]);
  };

  // Run a diagnostic check on OneSignal
  const runOneSignalDiagnostic = async () => {
    setShowDiagnostics(true);
    setLogs([]);
    
    logMessage("Starting OneSignal diagnostic check...");
    
    // Check if OneSignal functions are defined
    logMessage(`OneSignal functions available: ${diagnosticInfo.oneSignalAvailable}`);
    logMessage(`optInUser defined: ${typeof optInUser === 'function'}`);
    logMessage(`getPlayerId defined: ${typeof getPlayerId === 'function'}`);
    logMessage(`setExternalUserId defined: ${typeof setExternalUserId === 'function'}`);
    
    // Check if webtonative is available
    logMessage(`webtonative available: ${diagnosticInfo.webtonativeAvailable}`);
    logMessage(`deviceInfo defined: ${typeof deviceInfo === 'function'}`);
    
    // Check device info
    logMessage(`Device info available: ${diagnosticInfo.deviceInfoAvailable}`);
    if (deviceInfo) {
      logMessage(`Device info: ${JSON.stringify(deviceInfo)}`);
    }
    
    // Try to call optInUser directly
    try {
      logMessage("Attempting to call optInUser directly...");
      await optInUser();
      logMessage("✅ optInUser call succeeded");
    } catch (error) {
      logMessage(`❌ optInUser call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Try to get player ID
    try {
      logMessage("Attempting to get OneSignal player ID...");
      const playerId = await getPlayerId();
      logMessage(`Player ID: ${playerId || 'null'}`);
    } catch (error) {
      logMessage(`❌ getPlayerId call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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
    setLogs([]);
    
    try {
      // Get userId from local storage for external user ID
      const userId = localStorage.getItem('dapps_user_id');
      
      logMessage(`Starting push notification setup process...`);
      logMessage(`Device info: ${JSON.stringify(deviceInfo)}`);
      
      if (!userId) {
        const error = 'User ID not found. Please log in again.';
        logMessage(`Error: ${error}`);
        toast.error(error);
        setProcessingError(error);
        setIsProcessing(false);
        return;
      }
      
      logMessage(`User ID found: ${userId}`);
      
      // Step 1: Verify webtonative/OneSignal is available
      if (typeof optInUser !== 'function') {
        const error = 'OneSignal functions not available. Please check if webtonative is properly installed.';
        logMessage(`Error: ${error}`);
        throw new Error(error);
      }
      
      logMessage('OneSignal functions available, proceeding...');
      
      // Step 1: Opt-in the user for push notifications
      logMessage('Calling optInUser() to request permission...');
      try {
        await optInUser();
        logMessage('optInUser() completed successfully');
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error during optInUser()';
        logMessage(`Error during optInUser(): ${error}`);
        
        // Show the error but continue with the process for debugging
        toast.error(`Permission request failed: ${error}`);
      }
      
      // Step 2: Get the OneSignal player ID
      logMessage('Calling getPlayerId() to get OneSignal player ID...');
      let playerId;
      try {
        playerId = await getPlayerId();
        
        if (!playerId) {
          logMessage('No player ID returned from getPlayerId()');
          throw new Error('Failed to get OneSignal player ID');
        }
        
        logMessage(`Successfully got player ID: ${playerId}`);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error getting player ID';
        logMessage(`Error getting player ID: ${error}`);
        throw new Error(`Failed to get player ID: ${error}`);
      }
      
      // Step 3: Set the external user ID in OneSignal
      logMessage(`Setting external user ID: ${userId}`);
      try {
        await setExternalUserId(userId);
        logMessage('External user ID set successfully');
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error setting external user ID';
        logMessage(`Error setting external user ID: ${error}`);
        
        // Show warning but continue for debugging
        toast.warning(`Warning: Failed to set external user ID: ${error}`);
      }
      
      // Step 4: Register the device with our API
      if (!deviceInfo?.installationId) {
        const error = 'Device installation ID not found';
        logMessage(`Error: ${error}`);
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
      
      logMessage(`Registering device with API: ${JSON.stringify(registrationData)}`);
      
      try {
        const registrationResult = await registerDeviceForNotifications(registrationData);
        logMessage(`Registration result: ${JSON.stringify(registrationResult)}`);
        
        if (!registrationResult.success) {
          throw new Error(registrationResult.error || 'Failed to register device');
        }
        
        // Show success message
        logMessage('Push notifications enabled successfully!');
        toast.success('Push notifications enabled successfully!');
        
        // Refresh the notification status
        setTimeout(() => refreshStatus(), 1000);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error registering device';
        logMessage(`Error registering device: ${error}`);
        throw new Error(`Failed to register device: ${error}`);
      }
      
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logMessage(`Fatal error: ${errorMessage}`);
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
        
        {/* Diagnostic information */}
        <div className="mt-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>OneSignal available: </span>
            <span className={diagnosticInfo.oneSignalAvailable ? "text-green-600" : "text-red-600"}>
              {diagnosticInfo.oneSignalAvailable ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Webtonative available: </span>
            <span className={diagnosticInfo.webtonativeAvailable ? "text-green-600" : "text-red-600"}>
              {diagnosticInfo.webtonativeAvailable ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Device info available: </span>
            <span className={diagnosticInfo.deviceInfoAvailable ? "text-green-600" : "text-red-600"}>
              {diagnosticInfo.deviceInfoAvailable ? "Yes" : "No"}
            </span>
          </div>
          
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs mt-1 p-0 h-auto"
            onClick={runOneSignalDiagnostic}
          >
            <Info className="h-3 w-3 mr-1" />
            Run OneSignal diagnostic
          </Button>
        </div>
        
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
              {logs.length > 0 && (
                <details className="mt-2" open>
                  <summary className="text-xs text-red-600 cursor-pointer">View debug logs</summary>
                  <div className="mt-2 p-2 bg-black/10 rounded text-xs text-red-600 overflow-auto max-h-40 font-mono">
                    {logs.map((log, i) => (
                      <div key={i} className="whitespace-pre-wrap break-all">{log}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
        
        {/* Show diagnostic logs if requested */}
        {showDiagnostics && logs.length > 0 && !processingError && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-md">
            <details open>
              <summary className="text-xs text-blue-600 cursor-pointer font-medium">OneSignal Diagnostic Results</summary>
              <div className="mt-2 p-2 bg-black/10 rounded text-xs text-blue-600 overflow-auto max-h-40 font-mono">
                {logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap break-all">{log}</div>
                ))}
              </div>
            </details>
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
          If you're having trouble, try running the diagnostic above to check OneSignal availability.
        </p>
      </CardFooter>
    </Card>
  );
};

export default PushNotificationSetup; 