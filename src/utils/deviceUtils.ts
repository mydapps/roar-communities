import { deviceInfo } from "webtonative";

export interface DeviceInfo {
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

/**
 * Check if the user is running the app on a native mobile platform
 * @returns Promise<boolean> true if on native mobile app, false if on web
 */
export const isNativeMobileApp = async (): Promise<boolean> => {
  try {
    const device = await deviceInfo();
    return device && (device.platform === "android" || device.platform === "ios");
  } catch (error) {
    console.log("Not using a native mobile app or error:", error);
    return false;
  }
};

/**
 * Check if the device is running Android
 * @returns Promise<boolean> true if Android, false otherwise
 */
export const isAndroid = async (): Promise<boolean> => {
  try {
    const device = await deviceInfo();
    return device && device.platform === "android";
  } catch (error) {
    console.log("Not using an Android app or error:", error);
    return false;
  }
};

/**
 * Check if the device is running iOS
 * @returns Promise<boolean> true if iOS, false otherwise
 */
export const isIOS = async (): Promise<boolean> => {
  try {
    const device = await deviceInfo();
    return device && device.platform === "ios";
  } catch (error) {
    console.log("Not using an iOS app or error:", error);
    return false;
  }
};

/**
 * Get detailed device information when running in a native app
 * @returns Promise<DeviceInfo | null> Device information object or null if error/not in native app
 */
export const getDeviceInfo = async (): Promise<DeviceInfo | null> => {
  try {
    const device = await deviceInfo();
    return device || null;
  } catch (error) {
    console.log("Error getting device info or not in mobile app:", error);
    return null;
  }
};

/**
 * Get a safe device platform string for logging or display
 * @returns Promise<string> "android", "ios", or "web"
 */
export const getPlatformType = async (): Promise<string> => {
  try {
    const device = await deviceInfo();
    if (!device) return "web";
    
    if (device.platform === "android") return "android";
    if (device.platform === "ios") return "ios";
    
    return "web";
  } catch (error) {
    console.log("Error getting platform type:", error);
    return "web";
  }
}; 