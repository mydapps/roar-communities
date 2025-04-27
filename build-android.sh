#!/bin/bash

# Roar Communities Android Build Script
# This script automates the build process for Android

echo "🚀 Building Roar Communities Android App..."

# Step 1: Install dependencies if needed
if [ "$1" == "--with-deps" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Step 2: Build the web app
echo "🏗️ Building the web app..."
npm run build

# Step 3: Sync with Android
echo "🔄 Syncing with Android..."
npx cap sync android

# Step 4: Update Android project
echo "🔧 Updating Android project..."
npx cap update android

# Step 5: Open Android Studio
if [ "$1" == "--open" ] || [ "$2" == "--open" ]; then
  echo "🔍 Opening Android Studio..."
  npx cap open android
else
  echo "✅ Build completed successfully!"
  echo ""
  echo "🔍 To open Android Studio, run: npx cap open android"
  echo ""
fi

echo "📚 For more information, check README-MOBILE.md" 