import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { useEffect } from 'react';
import App from './App';

const CapacitorApp = () => {
  useEffect(() => {
    const initCapacitor = async () => {
      // Hide the splash screen
      await SplashScreen.hide();
      
      // Set status bar style
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#fffbff' });
      } catch (err) {
        console.error('Error setting status bar', err);
      }

      // Set up keyboard behavior
      Keyboard.setAccessoryBarVisible({ isVisible: false });
      
      // Handle back button for Android
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });
    };

    initCapacitor();

    // Clean up event listeners on unmount
    return () => {
      CapApp.removeAllListeners();
    };
  }, []);

  return <App />;
};

export default CapacitorApp; 