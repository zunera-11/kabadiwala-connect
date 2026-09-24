@echo off
title Kabadiwala Connect - Expo Launcher
echo ========================================================
echo   Kabadiwala Connect - SIH Hackathon Expo Launcher
echo ========================================================
echo.

if not exist node_modules\expo (
    echo [Step 1/2] Setting up Expo dependencies...
    copy /Y package.expo.json package.json
    call npm install --legacy-peer-deps
)

echo.
echo [Step 2/2] Starting Expo Local Development Server...
echo Press 'a' for Android, 'i' for iOS, or scan QR with Expo Go app!
echo.
call npx expo start
pause
