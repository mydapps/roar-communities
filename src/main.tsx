import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { setupBrowserErrorHandler } from './utils/browserUtils';

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

// Initialize Google Analytics
injectGoogleAnalytics();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
