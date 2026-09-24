#!/bin/bash
echo "========================================================"
echo "  Kabadiwala Connect - SIH Hackathon Expo Launcher"
echo "========================================================"
echo ""

if [ ! -d "node_modules/expo" ]; then
    echo "[Step 1/2] Setting up Expo dependencies..."
    cp -f package.expo.json package.json
    npm install --legacy-peer-deps
fi

echo ""
echo "[Step 2/2] Starting Expo Local Development Server..."
echo "Press 'a' for Android, 'i' for iOS, or scan QR with Expo Go app!"
echo ""
npx expo start
