# Capacitor App Debugging Cheat Sheet

This document provides quick solutions for common issues when developing Capacitor mobile apps.

## Build and Sync Issues

### Web Build Fails
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Capacitor Sync Fails
```bash
# Verify you've built the web app first
npm run build

# Try with verbose logging
npx cap sync --verbose
```

### Android Gradle Issues
```bash
# Open Android Studio and let it sync
npx cap open android

# Clear Gradle caches
cd android
./gradlew clean
cd ..

# In Android Studio: File > Invalidate Caches / Restart
```

## Runtime Issues

### White Screen / App Not Loading
```bash
# 1. Check web build
npm run build

# 2. Check for console errors in browser
npm run dev

# 3. Verify Capacitor config
cat capacitor.config.ts

# 4. Verify native project integrity
npx cap sync
```

### Plugin Not Found / Not Working
```bash
# 1. Make sure plugin is installed
npm list @capacitor/plugin-name

# 2. Sync after installation
npx cap sync

# 3. Check import statement
# import { PluginName } from '@capacitor/plugin-name';

# 4. Check native implementation
npx cap open android
```

### Platform-Specific Issues

#### Android
```bash
# Log native errors with ADB
adb logcat | grep -E "(your.package.name|Capacitor|System.err)"

# Check app permissions
# In Android Studio: AndroidManifest.xml
```

#### iOS (when setup)
```bash
# Check Info.plist for permissions
# In Xcode: App > App > Info.plist

# Check Swift/Obj-C logs in Xcode console
```

## Live Reload Issues

### Live Reload Not Working
```bash
# Make sure you're using the correct commands
npm run dev

# In another terminal
npx cap run android -l --external

# Check device is on same network as dev machine
```

### App Crashes During Live Reload
```bash
# Use stable build instead of live reload for testing
npm run build
npx cap sync
npx cap open android
```

## Capacitor Version Issues

### Checking Capacitor Version
```bash
npm list @capacitor/core
npm list @capacitor/android
```

### Updating Capacitor
```bash
# Update core and CLI
npm install @capacitor/core@latest @capacitor/cli@latest

# Update platforms
npm install @capacitor/android@latest @capacitor/ios@latest

# Update plugins
npm install @capacitor/plugin-name@latest

# Sync after updates
npx cap sync
```

## Native Code Debugging

### Android Debugging
```bash
# Remote debugging Android WebView
# 1. In Chrome, navigate to chrome://inspect/#devices
# 2. Enable USB debugging on device
# 3. Connect device to computer
# 4. Find your app in Chrome and click "inspect"
```

### iOS Debugging (when setup)
```bash
# Remote debugging iOS WebView
# 1. In Safari, enable Developer Tools
# 2. Connect iOS device or open simulator
# 3. In Safari: Develop > [Device Name] > [App]
```

## Performance Issues

### Slow App Startup
```bash
# Check app size and loading time
# Optimize web build
npm run build -- --report

# Optimize images and assets
```

### Memory Leaks
```bash
# Check for event listeners not being cleaned up
# Ensure useEffect cleanup functions are implemented
# Monitor memory usage in Chrome DevTools
```

## Useful Commands

### Device/Emulator Commands
```bash
# List connected Android devices
adb devices

# Install APK directly
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Get device logs
adb logcat
```

### Build Commands
```bash
# Full rebuild and sync
npm run build && npx cap sync && npx cap open android

# Clean build
rm -rf dist && npm run build && npx cap sync
```

## Quick References

### App Configuration Properties
Key properties in `capacitor.config.ts`:
- `appId`: Unique app identifier
- `appName`: Display name of the app
- `webDir`: Build output directory
- `server`: Server configuration for live reload
- `plugins`: Plugin-specific configuration

### Common Permissions
Android (`AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

iOS (`Info.plist`) - when setup:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera permission description</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location permission description</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Photo library permission description</string>
``` 