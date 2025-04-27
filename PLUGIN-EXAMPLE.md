# Example: Adding Camera Functionality to Roar Communities

This guide demonstrates how to add camera functionality to the Roar Communities mobile app using the Capacitor Camera plugin.

## 1. Install the Camera Plugin

```bash
# Install the Capacitor Camera plugin
npm install @capacitor/camera

# Update native projects with the new plugin
npm run build
npx cap sync
```

## 2. Add Camera Permissions

### Android Permissions

Android requires explicit camera permissions in the `AndroidManifest.xml` file. This is usually added automatically by Capacitor, but you should verify it exists in:

`android/app/src/main/AndroidManifest.xml`

The following permissions should be present:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### iOS Permissions (when setup)

For iOS, you'll need to add camera usage description to `Info.plist`:

In `ios/App/App/Info.plist`, add:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to take photos</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need photo library access to save photos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to get photos</string>
```

## 3. Create a Camera Component

Create a new file at `src/components/camera/CameraComponent.tsx`:

```tsx
import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PhotoProps {
  onPhotoCapture?: (photoUrl: string) => void;
}

export const CameraComponent: React.FC<PhotoProps> = ({ onPhotoCapture }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { isNativePlatform } = useIsMobile();

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      // The photo.webPath will only be available when running on web
      const photoUrl = photo.webPath || photo.path;
      
      if (photoUrl) {
        setPhotoUrl(photoUrl);
        if (onPhotoCapture) {
          onPhotoCapture(photoUrl);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {photoUrl && (
        <div className="w-full max-w-md overflow-hidden rounded-lg shadow-lg">
          <img 
            src={photoUrl} 
            alt="Captured" 
            className="w-full h-auto"
          />
        </div>
      )}
      
      <Button 
        onClick={takePhoto}
        className="px-4 py-2"
        disabled={!isNativePlatform}
      >
        {photoUrl ? 'Take Another Photo' : 'Take Photo'}
      </Button>
      
      {!isNativePlatform && (
        <p className="text-sm text-muted-foreground">
          Camera functionality is only available on native mobile devices.
        </p>
      )}
    </div>
  );
};
```

## 4. Integration Example

Here's how you can integrate the camera component into an existing page:

```tsx
import { CameraComponent } from '@/components/camera/CameraComponent';
import MobileLayout from '@/components/layout/MobileLayout';

const ProfilePhotoPage = () => {
  const handlePhotoCapture = (photoUrl: string) => {
    console.log('Photo captured:', photoUrl);
    // Here you would typically upload the photo or use it in your app
  };

  return (
    <MobileLayout title="Profile Photo" showBackButton>
      <div className="p-4 flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Take a Profile Photo</h2>
        <p className="text-muted-foreground">
          Take a new profile photo using your camera.
        </p>
        
        <CameraComponent onPhotoCapture={handlePhotoCapture} />
      </div>
    </MobileLayout>
  );
};

export default ProfilePhotoPage;
```

## 5. Testing

1. Build and sync the app:
   ```bash
   npm run build
   npx cap sync
   ```

2. Test on Android:
   ```bash
   npx cap open android
   ```
   
   Then run the app from Android Studio on a device or emulator.

3. Test on iOS (when setup):
   ```bash
   npx cap open ios
   ```
   
   Then run the app from Xcode on a device or simulator.

## 6. Common Issues

1. **Permission Denied**: Ensure you've added the proper permissions and that the user has granted them at runtime.

2. **Plugin Not Found**: Make sure you've run `npx cap sync` after installing the plugin.

3. **Camera Not Working in Emulator**: Some emulators don't properly support camera functionality. Test on a real device.

4. **Photo Storage Issues**: For saving photos, you might need to add file system permissions and use the Filesystem plugin.

## 7. Further Enhancements

- Add ability to choose from photo library
- Implement image cropping
- Add filters or effects
- Integrate with file upload functionality 