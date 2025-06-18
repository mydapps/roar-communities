# Mobile Notifications Golden Booster Implementation

## Overview
Added a new golden booster for enabling mobile notifications that encourages users to download the mobile app and activate push notifications.

## API Integration
The backend API already provides the golden booster with the following structure:
```json
{
  "type": "enable_mobile_notifications",
  "name": "Enable Mobile Notifications", 
  "description": "Download mobile app and enable notifications",
  "boost": 1,
  "eligible": true,
  "claimed": false,
  "action_url": "https://onelink.to/n6g5k2"
}
```

## Frontend Changes Made

### 1. Updated TypeScript Interface (`src/utils/apiBase.ts`)
- Added `action_url?: string` property to the `GoldenBoosterStatusResponse` interface
- This allows the API-provided action URL to be properly typed and accessed

### 2. Enhanced Golden Booster Mapping (`src/pages/BoosterPage.tsx`)

#### Icon Mapping
- Added `'enable_mobile_notifications': 'Bell'` to `mapBoosterTypeToIcon()` function
- Uses the Bell icon to represent notifications

#### Description Mapping  
- Added `'enable_mobile_notifications': 'Download mobile app and enable notifications.'` to `getBoosterDescription()` function
- Provides user-friendly description text

#### Action URL Mapping
- Added `'enable_mobile_notifications': 'https://onelink.to/n6g5k2'` to `getActionUrl()` function
- Fallback URL if API doesn't provide action_url

#### Button Text Customization
- Updated `getButtonContent()` function to show contextual text for `enable_mobile_notifications` type:
  - Web browsers: "Download Mobile App"
  - Mobile app: "Enable Notifications"
- Provides clear, context-aware call-to-action text

### 3. Enhanced Data Processing
- Modified golden booster data mapping to prioritize API-provided `action_url` over fallback mapping
- Uses `booster.action_url || getActionUrl(booster.type)` for flexible URL handling

## User Experience

### Button Text
- **Web Browser (Not eligible)**: Shows "Download Mobile App" 
- **Mobile App (Not eligible)**: Shows "Enable Notifications"
- **Eligible**: Shows "Claim Booster" with sparkle icon

### Action Flow

#### For Web Browser Users:
1. User sees golden booster card with Bell icon and "Enable Mobile Notifications" title
2. Description reads "Download mobile app and enable notifications"
3. Button shows "Download Mobile App" if not eligible, or "Claim Booster" if eligible
4. Clicking the button opens https://onelink.to/n6g5k2 in a new tab
5. User downloads and sets up mobile app
6. Once API detects mobile notifications are enabled, user can claim the 1x boost

#### For Mobile App Users:
1. User sees golden booster card with Bell icon and "Enable Mobile Notifications" title
2. Description reads "Download mobile app and enable notifications"
3. Button shows "Enable Notifications" if not eligible, or "Claim Booster" if eligible
4. Clicking the button navigates to `/notifications` page within the app
5. User follows the notification setup process on the notifications page
6. Once API detects mobile notifications are enabled, user can claim the 1x boost

### Smart Action Handling
- Enhanced `handleAction()` function with context-aware behavior:
  - **Web browsers**: Opens mobile app download link in new tab via `window.open(activity.action_url, '_blank')`
  - **Mobile app**: Navigates to `/notifications` page via `navigate('/notifications')`
- Uses `isMobileApp()` utility from deviceUtils to detect app context
- Seamless experience optimized for each platform

## Technical Details

### Claiming Process
- Uses the same `claimGoldenBooster('enable_mobile_notifications')` API call as other golden boosters
- Integrates with existing golden booster claiming infrastructure  
- Shows success animations and updates farming rate when claimed

### Responsive Design
- Golden booster cards are fully responsive
- Bell icon and text adapt to light/dark themes
- Consistent styling with other golden boosters

## Benefits
- Encourages mobile app adoption for web users
- Streamlines notification setup for existing mobile app users
- Increases user engagement through push notifications  
- Provides 1x farming rate boost incentive
- Seamless integration with existing golden booster system
- Context-aware messaging ("Download Mobile App" vs "Enable Notifications")
- Leverages existing notification setup infrastructure in mobile app 