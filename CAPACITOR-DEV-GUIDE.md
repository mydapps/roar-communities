# Capacitor App Development Guide for Roar Communities

This guide provides detailed instructions for working with the existing Capacitor mobile app setup without breaking functionality.

## Project Overview

Dapps.co has been set up as a hybrid mobile application using:
- React for the web UI
- Capacitor for native platform integration
- Native plugins for device functionality

## Key Components

1. **Entry Points**:
   - `src/main.tsx`: Determines whether to load CapacitorApp or regular App
   - `src/CapacitorApp.tsx`: Mobile-specific initialization

2. **Mobile Components**:
   - `src/components/layout/MobileLayout.tsx`: Provides mobile-optimized layout
   - `src/hooks/useIsMobile.ts`: Detects mobile environment
   - `src/utils/androidUtils.ts`: Android-specific utilities

3. **Configuration**:
   - `capacitor.config.ts`: Core configuration for Capacitor

## Development Workflow

### Initial Setup (Already Completed)

1. The project has already been set up with Capacitor and Android platform
2. The iOS platform may need additional setup with CocoaPods

### Making Changes to Mobile App

#### 1. Web Code Changes

When making changes to React components that affect both web and mobile:

```bash
# Start the development server
npm run dev

# Make your code changes
# Test in browser first
```

#### 2. Mobile-Specific Changes

For changes to mobile-specific components (e.g., CapacitorApp.tsx, MobileLayout.tsx):

```bash
# Make your code changes
# Build the web app
npm run build

# Sync with native projects
npx cap sync

# Open Android to test
npx cap open android
```

#### 3. Native Plugin Integration

To add additional native functionality:

```bash
# Install the Capacitor plugin
npm install @capacitor/plugin-name

# Add imports to your code where needed
import { PluginName } from '@capacitor/plugin-name';

# Sync with native projects
npm run build
npx cap sync
```

### Testing Mobile App

#### Android Emulator/Device

```bash
# Open Android Studio with the project
npx cap open android

# From Android Studio:
# 1. Select a device or emulator
# 2. Click the Run button
```

#### Live Reload Development

For faster development with live reload:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run with live reload
npx cap run android -l --external
```

## Important Notes to Avoid Breaking Changes

1. **Maintain File Structure**:
   - Don't move or rename key files like `CapacitorApp.tsx`
   - Don't modify the entry point logic in `main.tsx`

2. **Plugin Management**:
   - Always run `npx cap sync` after installing new plugins
   - Test native functionality on actual devices

3. **Capacitor Configuration**:
   - Be careful when modifying `capacitor.config.ts`
   - Changes may require complete rebuild

4. **Handling Platform Differences**:
   - Use `Capacitor.getPlatform()` to detect iOS/Android
   - Use platform-specific code when needed

5. **Building for Production**:
   - Always test on real devices before production
   - Follow platform-specific signing requirements

## Troubleshooting

### Common Issues

1. **White Screen / App Not Loading**
   - Ensure web build completed successfully
   - Check console errors in browser dev tools
   - Verify Capacitor initialization in CapacitorApp.tsx

2. **Native Plugin Errors**
   - Check plugin compatibility with Capacitor version
   - Ensure proper permissions in native projects
   - Run `npx cap sync` to update native code

3. **Build Failures**
   - Clear native build caches 
   - For Android: File > Invalidate Caches / Restart in Android Studio
   - Verify JDK and SDK versions

## Native Platform Customization

### Android

Key files for customization:
- `android/app/src/main/res/values/colors.xml`: App colors
- `android/app/src/main/res/mipmap-*/`: App icons
- `android/app/src/main/res/drawable/`: Splash screen images

### iOS (When Setup)

Key customization areas:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`: App icon
- `ios/App/App/Assets.xcassets/Splash.imageset/`: Splash screen
- `ios/App/App/Info.plist`: App permissions and settings

## Version Control Best Practices

1. Commit native platform changes separately from web code
2. Document plugin additions in commit messages
3. When making significant native changes, test on all platforms

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guidelines](https://developer.android.com/guide)
- [iOS Developer Guidelines](https://developer.apple.com/design/human-interface-guidelines/) 