#!/bin/bash

# Roar Communities Mobile App Setup Script
# This script automates the setup process for the mobile app

echo "🚀 Setting up Roar Communities Mobile App..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR_VERSION -lt 20 ]; then
  echo "⚠️ WARNING: Capacitor requires Node.js >=20.0.0"
  echo "Current version: v$NODE_VERSION"
  echo ""
  echo "Please upgrade your Node.js version using one of these methods:"
  echo "  - Using nvm: nvm install 20 && nvm use 20"
  echo "  - Using asdf: asdf install nodejs 20.10.0 && asdf local nodejs 20.10.0"
  echo "  - Download directly from https://nodejs.org/"
  echo ""
  echo "After upgrading, run this script again."
  
  read -p "Do you want to continue anyway? (y/N): " CONTINUE
  if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
    echo "Setup aborted. Please upgrade Node.js and try again."
    exit 1
  fi
  
  echo "Continuing with current Node.js version. Some features may not work correctly."
else
  echo "✅ Node.js version v$NODE_VERSION is compatible with Capacitor."
fi

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the web app
echo "🏗️ Building the web app..."
npm run build

# Step 3: Add iOS and Android platforms
echo "📱 Initializing Capacitor and adding platforms..."

# Initialize Capacitor (will skip if already initialized)
if [ ! -f "capacitor.config.ts" ]; then
  if [ $NODE_MAJOR_VERSION -ge 20 ]; then
    npx cap init "Roar Communities" "co.roar.communities"
  else
    echo "⚠️ Skipping 'npx cap init' due to Node.js version incompatibility."
    echo "Please run 'npx cap init \"Roar Communities\" \"co.roar.communities\"' manually after upgrading Node.js."
  fi
fi

if [ $NODE_MAJOR_VERSION -ge 20 ]; then
  npx cap add ios
  npx cap add android
else
  echo "⚠️ Skipping platform add due to Node.js version incompatibility."
  echo "Please run 'npx cap add ios' and 'npx cap add android' manually after upgrading Node.js."
fi

# Step 4: Sync the web build to native platforms
echo "🔄 Syncing with native platforms..."
if [ $NODE_MAJOR_VERSION -ge 20 ]; then
  npx cap sync
else
  echo "⚠️ Skipping 'npx cap sync' due to Node.js version incompatibility."
  echo "Please run 'npx cap sync' manually after upgrading Node.js."
fi

# Step 5: Success message
echo "✅ Setup process completed!"
if [ $NODE_MAJOR_VERSION -lt 20 ]; then
  echo "⚠️ Some steps were skipped due to Node.js version incompatibility."
  echo "Please upgrade Node.js to >=20.0.0 and run 'npx cap sync' to complete the setup."
fi

echo ""
echo "🔍 Next steps:"
echo "  - For iOS: Run 'npx cap open ios'"
echo "  - For Android: Run 'npx cap open android'"
echo ""
echo "📚 For more information, check README-MOBILE.md" 