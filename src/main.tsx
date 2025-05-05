import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { setupBrowserErrorHandler } from './utils/browserUtils';
import { isMobileApp, isAndroidApp, isIOSApp, getPlatformType } from './utils/deviceUtils';

// Setup error handler to prevent browser extension errors from breaking the app
setupBrowserErrorHandler();

// Google Analytics implementation
const injectGoogleAnalytics = () => {
  try {
    // Check if GA already initialized to prevent duplicate initialization
    if (typeof window !== 'undefined' && window.dataLayer) {
      console.log('Google Analytics already initialized, skipping...');
      return;
    }
    
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
      gtag('config', 'G-TCYSPC0DWM', {
        send_page_view: false,
        cookie_domain: 'auto',
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(configScript);
    
    console.log('Google Analytics initialization complete');
  } catch (error) {
    console.error('Failed to initialize Google Analytics:', error);
  }
};

// Initialize mobile app detection
const initMobileAppDetection = () => {
  try {
    // Get device platform based on user agent
    const platform = getPlatformType();
    
    // Set device info to window for other scripts to access
    window.isWebToNativeInitialized = isMobileApp();
    window.devicePlatform = platform;
    
    // Log for debugging
    console.log(`Running on platform: ${platform}, isNativeApp: ${isMobileApp()}`);
    if (isMobileApp()) {
      console.log(`App type: ${isAndroidApp() ? 'Android' : 'iOS'}`);
    }
  } catch (error) {
    console.error('Error initializing mobile app detection:', error);
    window.isWebToNativeInitialized = false;
    window.devicePlatform = 'web';
  }
};

// Initialize applications
const initApp = async () => {
// Initialize Google Analytics
injectGoogleAnalytics();

  // Initialize mobile app detection
  initMobileAppDetection();

  // Start React app
  ReactDOM.createRoot(document.getElementById("root")!).render(
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
    isWebToNativeInitialized?: boolean;
    devicePlatform?: string;
  }
}
