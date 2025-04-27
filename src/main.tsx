import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { setupBrowserErrorHandler } from './utils/browserUtils';
import { getDeviceInfo } from './utils/deviceUtils';

// Setup error handler to prevent browser extension errors from breaking the app
setupBrowserErrorHandler();

// Google Analytics implementation
const injectGoogleAnalytics = () => {
  // Create the first script element (gtag.js)
  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-TCYSPC0DWM';
  document.head.appendChild(gtagScript);

  // Create the second script element (configuration)
  const configScript = document.createElement('script');
  configScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-TCYSPC0DWM');
  `;
  document.head.appendChild(configScript);
};

// Initialize WebToNative library
const initWebToNative = async () => {
  try {
    // Try to get device info to check if it's an app
    const deviceInfo = await getDeviceInfo();
    
    if (deviceInfo) {
      console.log('WebToNative initialized with device info:', deviceInfo);
      
      // Add device type to window for other scripts to access
      window.isNativeMobileApp = true;
      window.devicePlatform = deviceInfo.platform || '';
      
      // Log to console for debugging
      console.log(`Running on ${deviceInfo.platform} platform`);
    } else {
      console.log('WebToNative not detected or not running in a native app');
      window.isNativeMobileApp = false;
    }
  } catch (error) {
    console.error('Error initializing WebToNative:', error);
    window.isNativeMobileApp = false;
  }
};

// Initialize applications
const initApp = async () => {
  // Initialize Google Analytics
  injectGoogleAnalytics();
  
  // Initialize WebToNative
  await initWebToNative();
  
  // Start React app
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Start initialization
initApp();

// Add TypeScript declarations for window properties
declare global {
  interface Window {
    isNativeMobileApp?: boolean;
    devicePlatform?: string;
  }
}
