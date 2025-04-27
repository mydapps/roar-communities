import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Show a native toast notification on mobile devices
 */
export const showNativeToast = async (message: string, duration: 'short' | 'long' = 'short') => {
  if (Capacitor.isNativePlatform()) {
    await Toast.show({
      text: message,
      duration: duration === 'short' ? 'short' : 'long',
      position: 'bottom',
    });
    return true;
  }
  return false;
};

/**
 * Share content using the native share dialog
 */
export const shareContent = async (options: { 
  title?: string; 
  text?: string; 
  url?: string;
  dialogTitle?: string;
}) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle,
      });
      return true;
    } catch (error) {
      console.error('Error sharing content', error);
      return false;
    }
  }
  
  // Fallback for web - use Web Share API if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return true;
    } catch (error) {
      console.error('Error sharing content', error);
      return false;
    }
  }
  
  return false;
};

/**
 * Trigger haptic feedback
 */
export const vibrate = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (Capacitor.isNativePlatform()) {
    let impactStyle: ImpactStyle;
    
    switch (style) {
      case 'light':
        impactStyle = ImpactStyle.Light;
        break;
      case 'heavy':
        impactStyle = ImpactStyle.Heavy;
        break;
      default:
        impactStyle = ImpactStyle.Medium;
    }
    
    await Haptics.impact({ style: impactStyle });
    return true;
  }
  
  // Fallback for web - use Vibration API if available
  if ('vibrate' in navigator) {
    let duration: number;
    
    switch (style) {
      case 'light':
        duration = 10;
        break;
      case 'heavy':
        duration = 50;
        break;
      default:
        duration = 25;
    }
    
    navigator.vibrate(duration);
    return true;
  }
  
  return false;
};

/**
 * Detect if the app is running in a native environment
 */
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Check if running on Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
}; 