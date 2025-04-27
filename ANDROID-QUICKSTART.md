# Android Quick Start Guide

This guide provides specific instructions for setting up and developing the Android app for Roar Communities.

## Prerequisites

- Android Studio (latest version recommended)
- JDK 17+
- Android SDK (API 33+)
- Android device or emulator

## Initial Setup

1. Run the setup script:
   ```bash
   ./setup-mobile.sh
   ```

2. Open the Android project:
   ```bash
   npx cap open android
   ```

## Development Workflow

1. Make changes to the React app
2. Build and sync with Android:
   ```bash
   ./build-android.sh
   ```

3. To build and immediately open Android Studio:
   ```bash
   ./build-android.sh --open
   ```

## Android Specifics

### App Architecture

The Android app uses a mix of web and native capabilities:
- Main UI is rendered via WebView from the React app
- Native features are accessed via Capacitor plugins

### Common Android Issues

1. **Gradle Build Errors**:
   - Try "Invalidate Caches & Restart" in Android Studio
   - Ensure Gradle is using the correct JDK version
   - Check for any pending Android Studio updates

2. **Plugin Permissions**:
   - Make sure all required permissions are properly declared in `AndroidManifest.xml`
   - For Android 13+, ensure you request runtime permissions correctly

3. **Performance Issues**:
   - Enable hardware acceleration in `AndroidManifest.xml`
   - Consider using ProGuard for production builds
   - Test on mid-range devices to ensure good performance

### Debug Tools

- Use Chrome DevTools for WebView debugging:
  1. Open Chrome
  2. Navigate to `chrome://inspect/#devices`
  3. Connect your device and enable USB debugging
  4. Find your app in the list and click "inspect"

## Customizing Android App

### Splash Screen

To customize the splash screen:
1. Replace the splash screen images in `android/app/src/main/res/drawable-*/splash.png`
2. Update colors in `android/app/src/main/res/values/colors.xml`

### App Icon

To update the app icon:
1. Generate icons in various sizes
2. Replace files in `android/app/src/main/res/mipmap-*/`

### Status Bar Customization

Update `MainActivity.java` to customize the status bar:

```java
// Add this in onCreate
getWindow().setStatusBarColor(Color.parseColor("#YOURCOLOR"));
// For light status bar with dark icons (Android 6.0+)
getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
```

## Building for Production

1. In Android Studio:
   - Select Build > Generate Signed Bundle/APK
   - Choose Android App Bundle for Play Store or APK for direct distribution
   - Follow the signing steps

2. Or via command line:
   ```bash
   cd android
   ./gradlew bundleRelease
   # Or for APK:
   ./gradlew assembleRelease
   ```

The output can be found in:
- Bundle: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

## Testing

Don't forget to test on multiple device sizes and Android versions before releasing. 