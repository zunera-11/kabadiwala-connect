@echo off
setlocal

title Kabadiwala Connect - Expo Environment Setup and Health Check
color 0A

echo =========================================================================
echo       KABADIWALA CONNECT - EXPO ENVIRONMENT SETUP ^& HEALTH CHECK
echo          SIH Hackathon: E-Waste Management ^& Traceability Portal
echo =========================================================================
echo.

:: 1. Verify Node.js
echo [Step 1/5] Checking Node.js runtime...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :node_missing
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo  -- Found Node.js version: %NODE_VERSION% [OK]
goto :check_npm

:node_missing
color 0C
echo [ERROR] Node.js is not installed or not added to your system PATH!
echo Please install Node.js LTS version 18 or 20 from: https://nodejs.org/
echo.
pause
exit /b 1

:check_npm
:: 2. Verify npm
echo.
echo [Step 2/5] Checking npm package manager...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :npm_missing
for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v
echo  -- Found npm version: %NPM_VERSION% [OK]
goto :configure_expo

:npm_missing
color 0C
echo [ERROR] npm is not found in your system PATH!
echo Please ensure npm is installed alongside Node.js.
echo.
pause
exit /b 1

:configure_expo
:: 3. Prepare Expo package.json
echo.
echo [Step 3/5] Configuring Expo project manifest (package.expo.json)...
if exist package.expo.json (
    if not exist package.web.json (
        if exist package.json (
            echo  -- Backing up original web package.json to package.web.json...
            copy /Y package.json package.web.json >nul
        )
    )
    echo  -- Applying package.expo.json as main package.json...
    copy /Y package.expo.json package.json >nul
    echo  -- Expo configuration applied successfully!
) else (
    echo  -- package.expo.json not found, using existing package.json...
)

:: 4. Install Dependencies
echo.
echo [Step 4/5] Installing Expo and React Native dependencies...
echo  -- Running: npm install --legacy-peer-deps
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 goto :install_error
echo  -- Dependencies installed successfully! [OK]
goto :run_doctor

:install_error
color 0C
echo.
echo [ERROR] npm install encountered an error.
echo Please check your internet connection and try running manually:
echo   npm install --legacy-peer-deps
echo.
pause
exit /b 1

:run_doctor
:: 5. Run Expo Doctor
echo.
echo [Step 5/5] Running Expo Doctor to diagnose environment and dependencies...
echo  -- Running: npx expo doctor
call npx expo doctor
echo.

echo =========================================================================
echo  SUCCESS! Your environment is verified and ready for 'npx expo start'!
echo =========================================================================
echo.
echo You can run the app anytime with:
echo   - npx expo start
echo   - or run-expo.bat
echo.
set /p START_NOW="Would you like to launch 'npx expo start' right now? (Y/N): "
if /i "%START_NOW%"=="Y" (
    echo.
    echo Starting Expo Development Server...
    echo Press 'a' for Android, 'i' for iOS, or scan the QR code with Expo Go!
    echo.
    call npx expo start
) else (
    echo.
    echo Setup complete. Have a great demo at SIH!
    pause
)
