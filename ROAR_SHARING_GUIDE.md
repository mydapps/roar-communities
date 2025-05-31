# 🦁 ROAR Social Sharing System

This document explains the new social sharing system for ROAR farming claims that ensures proper meta tags and rich previews on social media platforms.

## 🎯 Problem Solved

Previously, when users shared their ROAR claims on social media, the links showed no images or metadata because:
- React Helmet sets meta tags client-side after JavaScript loads
- Social media crawlers don't execute JavaScript and only read initial HTML
- URLs like `/roars/username` returned the React app without proper OG tags

## ✨ Solution

We now generate **static HTML files** with proper meta tags that social media crawlers can read immediately.

### How It Works

1. **Static File Generation**: When users claim ROAR, we generate static HTML files with proper OG tags
2. **Rich Sharing URLs**: Share URLs point to `.html` files instead of React routes  
3. **Auto-Redirect**: Static pages automatically redirect users to the main app after 2 seconds
4. **Referral Tracking**: Users coming from shared links are redirected to invite pages when not logged in

## 🔧 Implementation Details

### Files Created

- `public/roars/[username].html` - Static HTML files with meta tags
- `scripts/generateRoarFiles.cjs` - Node.js script to generate static files
- `src/utils/staticRoarGenerator.ts` - TypeScript utilities for static generation
- `src/utils/roarImageService.ts` - Service for handling roar images

### Meta Tags Included

Each static file includes:
- **Open Graph**: `og:title`, `og:description`, `og:image`, `og:url`
- **Twitter Card**: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **Dynamic Image**: Points to `/api/generateRoarClaimImage?handle=[username]`
- **Auto-redirect**: JavaScript to redirect to main app after 2 seconds

### Example Generated File

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta property="og:title" content="🦁 Bro just claimed ROAR tokens!" />
    <meta property="og:description" content="Bro is earning ROAR tokens on dapps.co! Join the farming revolution and start earning rewards too! 🚀" />
    <meta property="og:image" content="https://dapps.co/api/generateRoarClaimImage?handle=Bro" />
    <meta property="og:url" content="https://dapps.co/roars/Bro.html" />
    <!-- ... more meta tags and styling ... -->
  </head>
  <body>
    <!-- Loading animation and redirect logic -->
  </body>
</html>
```

## 🚀 Usage

### Generating Static Files

```bash
# Generate files for specific users
npm run generate-roar "TestUser" "AnotherUser"

# Or directly with node
node scripts/generateRoarFiles.cjs "Username1" "Username2"
```

### Social Sharing Flow

1. User claims ROAR tokens
2. System calls `saveStaticRoarFile(username)` 
3. Static HTML file is generated with proper meta tags
4. Share URL becomes: `https://dapps.co/roars/[username].html`
5. When shared, social media platforms see rich preview with image
6. When clicked, users see loading page then redirect to farming

### Authentication Flow

- **Logged in users**: Go directly to farming page
- **From shared link**: Redirect to `/invite/[username]` instead of `/index`
- **Direct access**: Normal `/index` redirect

## 🔍 Testing

Test your generated files with these tools:
- [metatags.io](https://metatags.io)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

Example test URL: `https://dapps.co/roars/bro.html`

## 📁 File Structure

```
public/roars/
├── bro.html              # Generated for user "Bro"
├── testuser.html         # Generated for user "TestUser"
└── demo.html             # Generated for user "Demo"

scripts/
└── generateRoarFiles.cjs # Static file generator script

src/utils/
├── staticRoarGenerator.ts # TypeScript utilities
└── roarImageService.ts   # Image handling service
```

## 🎨 Customization

To modify the static page design, edit:
- **HTML Template**: `scripts/generateRoarFiles.cjs` (line ~25)
- **CSS Styles**: Inline styles in the template
- **Meta Tags**: Update the meta tag generation logic

## 🔧 Maintenance

### Adding New Users
When a user claims ROAR, the system automatically attempts to generate their static file. You can also pre-generate files for popular users:

```bash
npm run generate-roar "PopularUser1" "PopularUser2"
```

### Batch Generation
For existing users, you can generate multiple files at once:

```bash
# From a list of usernames
npm run generate-roar $(cat usernames.txt)
```

### Cleanup
Remove old files periodically if needed:

```bash
# Remove files older than 30 days (optional)
find public/roars -name "*.html" -mtime +30 -delete
```

## 🐛 Troubleshooting

### Meta Tags Not Showing
1. Verify file exists at `public/roars/[username].html`
2. Check meta tags with [metatags.io](https://metatags.io)
3. Ensure correct URL format: `.html` extension

### Image Not Loading
1. Verify `/api/generateRoarClaimImage?handle=[username]` returns image
2. Check image URL encoding in meta tags
3. Test image URL directly in browser

### Redirect Not Working
1. Check JavaScript console for errors
2. Verify sessionStorage is set for referrer tracking
3. Ensure redirect timeout is appropriate (currently 2 seconds)

## 🎯 Benefits

✅ **Rich Social Previews**: Proper images and descriptions on all platforms  
✅ **Better Engagement**: Visual previews increase click-through rates  
✅ **SEO Friendly**: Static files are crawlable and indexable  
✅ **Fast Loading**: No JavaScript execution needed for meta tags  
✅ **Referral Tracking**: Proper invite flow for new users  
✅ **Fallback Support**: Graceful degradation if static files fail  

---

*Last updated: January 2025* 