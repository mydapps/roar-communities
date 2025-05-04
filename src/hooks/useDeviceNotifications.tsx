import { useState, useEffect, useCallback } from 'react';
import { deviceInfo } from 'webtonative';
import { optInUser, optOutUser } from 'webtonative/OneSignal';
import { isMobileApp, isAndroidApp, isIOSApp } from '@/utils/deviceUtils';
import { 
  checkDeviceNotificationStatus, 
  DeviceNotificationStatusResponse,
  toggleDeviceNotifications
} from '@/utils/apiBase';
import { toast } from 'sonner';

interface DeviceInfo {
  appId?: string;
  appVersion?: string;
  appVersionCode?: string | number;
  hardware?: string;
  installationId?: string;
  installationType?: string;
  language?: string;
  model?: string;
  operator?: string;
  os?: string;
  osVersion?: string;
  platform?: string;
  timeZone?: string;
}

export interface NotificationDeviceState {
  isMobileApp: boolean;
  deviceInfo: DeviceInfo | null;
  isLoading: boolean;
  isRegistered: boolean;
  isEnabled: boolean;
  deviceId: number | null;
  error: string | null;
  isTogglingStatus: boolean;
  diagnosticInfo: {
    oneSignalAvailable: boolean;
    webtonativeAvailable: boolean;
    deviceInfoAvailable: boolean;
  };
}

// A diagnostic helper function to check if a module/function is available
const checkAvailability = (obj: any): boolean => {
  return obj !== undefined && obj !== null;
};

export const useDeviceNotifications = () => {
  const [state, setState] = useState<NotificationDeviceState>({
    isMobileApp: false,
    deviceInfo: null,
    isLoading: true,
    isRegistered: false,
    isEnabled: false,
    deviceId: null,
    error: null,
    isTogglingStatus: false,
    diagnosticInfo: {
      oneSignalAvailable: checkAvailability(optInUser),
      webtonativeAvailable: checkAvailability(deviceInfo),
      deviceInfoAvailable: false,
    }
  });

  const checkAppDeviceInfo = useCallback(async () => {
    // Reset state when checking starts
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));
    
    try {
      console.log("Checking device notification status...");
      console.log("OneSignal available:", checkAvailability(optInUser));
      console.log("webtonative available:", checkAvailability(deviceInfo));
      
      // First check if this is a mobile app
      const isApp = isMobileApp();
      console.log("Is mobile app:", isApp);
      
      if (!isApp) {
        // Not a mobile app, so we don't need to proceed
        setState(prev => ({
          ...prev,
          isMobileApp: false,
          isLoading: false,
          diagnosticInfo: {
            ...prev.diagnosticInfo,
            deviceInfoAvailable: false
          }
        }));
        return;
      }
      
      // Get device information
      let info = null;
      try {
        info = await deviceInfo();
        console.log('Device info:', info);
        
        setState(prev => ({
          ...prev,
          diagnosticInfo: {
            ...prev.diagnosticInfo,
            deviceInfoAvailable: true
          }
        }));
      } catch (deviceInfoError) {
        console.error('Error getting device info:', deviceInfoError);
        setState(prev => ({
          ...prev,
          isMobileApp: true,
          isLoading: false,
          error: `Failed to get device info: ${deviceInfoError instanceof Error ? deviceInfoError.message : 'Unknown error'}`,
          diagnosticInfo: {
            ...prev.diagnosticInfo,
            deviceInfoAvailable: false
          }
        }));
        return;
      }
      
      // If we don't have an installation ID, we can't check registration status
      if (!info?.installationId) {
        setState(prev => ({
          ...prev,
          isMobileApp: true,
          deviceInfo: info,
          isLoading: false,
          error: 'No installation ID found in device info'
        }));
        return;
      }
      
      // Check if this device is registered for notifications
      try {
        const status = await checkDeviceNotificationStatus(info.installationId);
        console.log('Notification status:', status);
        
        setState(prev => ({
          ...prev,
          isMobileApp: true,
          deviceInfo: info,
          isLoading: false,
          isRegistered: status.isRegistered,
          isEnabled: status.enabled || false,
          deviceId: status.deviceId || null
        }));
      } catch (statusError) {
        console.error('Error checking notification status:', statusError);
        setState(prev => ({
          ...prev,
          isMobileApp: true,
          deviceInfo: info,
          isLoading: false,
          error: `Failed to check notification status: ${statusError instanceof Error ? statusError.message : 'Unknown error'}`
        }));
      }
      
    } catch (error) {
      console.error('Error in checkAppDeviceInfo:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error in device check',
      }));
    }
  }, []);
  
  // Toggle notification status (enable/disable)
  const toggleNotificationStatus = useCallback(async (enable: boolean) => {
    setState(prev => ({
      ...prev,
      isTogglingStatus: true,
      error: null
    }));
    
    try {
      console.log(`Attempting to ${enable ? 'enable' : 'disable'} notifications...`);
      
      // Make sure we have a device ID
      if (!state.deviceId) {
        const error = 'Device ID not available for toggling notifications';
        console.error(error);
        throw new Error(error);
      }
      
      // Verify that OneSignal functions exist
      if (typeof optInUser !== 'function' || typeof optOutUser !== 'function') {
        const error = 'OneSignal functions not available';
        console.error(error, { optInUser, optOutUser });
        throw new Error(error);
      }
      
      // Call the appropriate OneSignal function
      try {
        if (enable) {
          console.log('Calling optInUser()...');
          await optInUser();
          console.log('optInUser() succeeded');
        } else {
          console.log('Calling optOutUser()...');
          await optOutUser();
          console.log('optOutUser() succeeded');
        }
      } catch (oneSignalError) {
        console.error('Error in OneSignal operation:', oneSignalError);
        throw new Error(`OneSignal operation failed: ${oneSignalError instanceof Error ? oneSignalError.message : 'Unknown error'}`);
      }
      
      // Update the server about the change
      try {
        console.log(`Calling API to toggle device ${state.deviceId} to ${enable ? 'enabled' : 'disabled'}...`);
        const result = await toggleDeviceNotifications(state.deviceId, enable);
        console.log('Toggle API result:', result);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update notification settings on server');
        }
      } catch (apiError) {
        console.error('Error calling toggle API:', apiError);
        throw new Error(`API operation failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
      }
      
      // Update local state
      setState(prev => ({
        ...prev,
        isEnabled: enable,
        isTogglingStatus: false
      }));
      
      // Show success message
      toast.success(`Push notifications ${enable ? 'enabled' : 'disabled'}`);
      
      return true;
    } catch (error) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} notifications:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isTogglingStatus: false,
        error: errorMessage
      }));
      
      toast.error(`Failed to ${enable ? 'enable' : 'disable'} push notifications: ${errorMessage}`);
      
      return false;
    }
  }, [state.deviceId]);

  // Check device info when component mounts
  useEffect(() => {
    console.log("useDeviceNotifications hook initialized");
    checkAppDeviceInfo();
  }, [checkAppDeviceInfo]);

  return {
    ...state,
    refreshStatus: checkAppDeviceInfo,
    toggleNotificationStatus
  };
};

export default useDeviceNotifications; 