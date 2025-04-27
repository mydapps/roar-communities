# Roar Communities Mobile App

This document provides instructions for setting up and developing the Roar Communities mobile app using Capacitor.

## Prerequisites

- Node.js 18+ (recommended: 20+)
- For iOS development:
  - macOS
  - Xcode 14+
  - CocoaPods
- For Android development:
  - Android Studio
  - JDK 17+
  - Android SDK

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

3. Add iOS and Android platforms:
   ```bash
   npx cap add ios
   npx cap add android
   ```

4. Sync the web build to native platforms:
   ```bash
   npx cap sync
   ```

## Development Workflow

### 1. Web Development

1. Make changes to the React app
2. Test in the browser using:
   ```bash
   npm run dev
   ```

### 2. Native Development

After making changes to the web code:

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync with native projects:
   ```bash
   npx cap sync
   ```

3. Open native IDE:
   ```bash
   # For iOS
   npx cap open ios
   
   # For Android
   npx cap open android
   ```

## Running on Devices

### iOS

1. Open the iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Select your device in Xcode
3. Click the Run button

### Android

1. Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```

2. Select your device in Android Studio
3. Click the Run button

## Live Reload During Development

For a better development experience with live reload:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, run:
   ```bash
   # For iOS
   npx cap run ios -l --external
   
   # For Android
   npx cap run android -l --external
   ```

## Building for Production

### iOS

1. Open the project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Select Product > Archive
3. Follow the steps in Xcode to distribute your app

### Android

1. In Android Studio, select Build > Generate Signed Bundle / APK
2. Choose 'Android App Bundle' or 'APK' based on your distribution needs
3. Follow the steps to generate a signed bundle/APK

## Troubleshooting

### Common Issues

1. **Capacitor sync errors**: 
   - Ensure you've built the web app before syncing
   - Check for any build errors in the console

2. **iOS build errors**:
   - Run `pod install` inside the `ios/App` directory
   - Ensure Xcode and CocoaPods are updated

3. **Android build errors**:
   - Check Android Studio for any required updates
   - Ensure your JDK version is compatible

4. **Plugin errors**:
   - Try removing and re-adding the platform:
     ```bash
     npx cap remove ios
     npx cap add ios
     ```

## Adding Capacitor Plugins

To add functionality like camera access, geolocation, etc:

```bash
npm install @capacitor/camera
npx cap sync
```

## Project Structure

- `src/CapacitorApp.tsx`: Entry point for the Capacitor app
- `src/hooks/useIsMobile.ts`: Hook for mobile detection
- `src/components/layout/MobileLayout.tsx`: Mobile-specific layout
- `src/utils/androidUtils.ts`: Utilities for Android functionality
- `capacitor.config.ts`: Capacitor configuration 