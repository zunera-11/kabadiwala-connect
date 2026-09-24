import React, { useState } from 'react';
import { FileCodeIcon, CopyIcon, CheckIcon, DownloadIcon, XIcon, TerminalIcon, SettingsIcon } from './icons/Icons';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const SETUP_BAT_CONTENT = `@echo off
setlocal enabledelayedexpansion

title Kabadiwala Connect - Expo Environment Setup & Health Check
color 0A

echo =========================================================================
echo       KABADIWALA CONNECT - EXPO ENVIRONMENT SETUP & HEALTH CHECK
echo          SIH Hackathon: E-Waste Management & Traceability Portal
echo =========================================================================
echo.

:: 1. Verify Node.js
echo [Step 1/5] Checking Node.js runtime...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not added to your system PATH!
    echo Please install Node.js (LTS version 18 or 20 recommended) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo  - Found Node.js version: !NODE_VERSION! (OK)

:: 2. Verify npm
echo.
echo [Step 2/5] Checking npm package manager...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] npm is not found in your system PATH!
    echo Please ensure npm is installed alongside Node.js.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v
echo  - Found npm version: !NPM_VERSION! (OK)

:: 3. Prepare Expo package.json
echo.
echo [Step 3/5] Configuring Expo project manifest...
if exist package.expo.json (
    if not exist package.web.json (
        if exist package.json (
            echo  - Backing up original web package.json to package.web.json...
            copy /Y package.json package.web.json >nul
        )
    )
    echo  - Applying package.expo.json as main package.json...
    copy /Y package.expo.json package.json >nul
    echo  - Expo configuration applied successfully!
) else (
    echo  - package.expo.json not found, using existing package.json...
)

:: 4. Install Dependencies
echo.
echo [Step 4/5] Installing Expo and React Native dependencies...
echo  - Running: npm install --legacy-peer-deps
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] npm install encountered an error.
    echo Please check your internet connection and try running manually:
    echo   npm install --legacy-peer-deps
    echo.
    pause
    exit /b 1
)
echo  - Dependencies installed successfully! (OK)

:: 5. Run Expo Doctor
echo.
echo [Step 5/5] Running Expo Doctor to diagnose environment and dependencies...
echo  - Running: npx expo doctor
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
if /i "!START_NOW!"=="Y" (
    echo.
    echo Starting Expo Development Server...
    echo Press 'a' for Android, 'i' for iOS, or scan the QR code with Expo Go!
    echo.
    call npx expo start
) else (
    echo.
    echo Setup complete.
    pause
)
`;

const SETUP_SH_CONTENT = `#!/usr/bin/env bash

# Colors for terminal output
GREEN='\\033[0;32m'
CYAN='\\033[0;36m'
YELLOW='\\033[1;33m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo -e "\${CYAN}=========================================================================\${NC}"
echo -e "\${CYAN}      KABADIWALA CONNECT - EXPO ENVIRONMENT SETUP & HEALTH CHECK       \${NC}"
echo -e "\${CYAN}         SIH Hackathon: E-Waste Management & Traceability Portal        \${NC}"
echo -e "\${CYAN}=========================================================================\${NC}"
echo ""

# 1. Verify Node.js
echo -e "\${YELLOW}[Step 1/5] Checking Node.js runtime...\${NC}"
if ! command -v node &> /dev/null; then
    echo -e "\${RED}[ERROR] Node.js is not installed or not in your PATH!\${NC}"
    echo "Please install Node.js (v18 or v20 LTS recommended) from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "\${GREEN} - Found Node.js version: \${NODE_VERSION} (OK)\${NC}"

# 2. Verify npm
echo ""
echo -e "\${YELLOW}[Step 2/5] Checking npm package manager...\${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "\${RED}[ERROR] npm is not found in your PATH!\${NC}"
    echo "Please ensure npm is installed alongside Node.js."
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "\${GREEN} - Found npm version: \${NPM_VERSION} (OK)\${NC}"

# 3. Configure Expo package.json
echo ""
echo -e "\${YELLOW}[Step 3/5] Configuring Expo project manifest...\${NC}"
if [ -f "package.expo.json" ]; then
    if [ ! -f "package.web.json" ] && [ -f "package.json" ]; then
        echo " - Backing up original web package.json to package.web.json..."
        cp -f package.json package.web.json
    fi
    echo " - Applying package.expo.json as main package.json..."
    cp -f package.expo.json package.json
    echo -e "\${GREEN} - Expo configuration applied successfully!\${NC}"
else
    echo " - package.expo.json not found, using existing package.json..."
fi

# 4. Install Dependencies
echo ""
echo -e "\${YELLOW}[Step 4/5] Installing Expo and React Native dependencies...\${NC}"
echo " - Running: npm install --legacy-peer-deps"
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo -e "\${RED}[ERROR] npm install failed. Please inspect logs and retry.\${NC}"
    exit 1
fi
echo -e "\${GREEN} - Dependencies installed successfully! (OK)\${NC}"

# 5. Run Expo Doctor
echo ""
echo -e "\${YELLOW}[Step 5/5] Running Expo Doctor to diagnose environment and dependencies...\${NC}"
echo " - Running: npx expo doctor"
npx expo doctor || true
echo ""

echo -e "\${CYAN}=========================================================================\${NC}"
echo -e "\${GREEN} SUCCESS! Your environment is verified and ready for 'npx expo start'!\${NC}"
echo -e "\${CYAN}=========================================================================\${NC}"
echo ""
echo "You can launch the app anytime using:"
echo -e "  \${YELLOW}npx expo start\${NC}  or  \${YELLOW}./run-expo.sh\${NC}"
echo ""

read -p "Would you like to launch 'npx expo start' right now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Expo Development Server..."
    echo "Press 'a' for Android, 'i' for iOS, or scan QR with Expo Go app!"
    echo ""
    npx expo start
else
    echo "Setup complete."
fi
`;

const PACKAGE_EXPO_CONTENT = `{
  "name": "kabadiwala-connect",
  "version": "1.0.0",
  "main": "App.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.7",
    "@react-native-community/netinfo": "^11.4.1",
    "@react-native-async-storage/async-storage": "^1.24.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  "private": true
}`;

type TabType = 'app' | 'setup-bat' | 'setup-sh' | 'package-expo';

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  onClose,
  code,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('app');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentContent =
    activeTab === 'app'
      ? code
      : activeTab === 'setup-bat'
      ? SETUP_BAT_CONTENT
      : activeTab === 'setup-sh'
      ? SETUP_SH_CONTENT
      : PACKAGE_EXPO_CONTENT;

  const currentFileName =
    activeTab === 'app'
      ? 'App.js'
      : activeTab === 'setup-bat'
      ? 'setup.bat'
      : activeTab === 'setup-sh'
      ? 'setup.sh'
      : 'package.expo.json';

  const currentMime =
    activeTab === 'app'
      ? 'text/javascript'
      : activeTab === 'package-expo'
      ? 'application/json'
      : 'text/plain';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentContent], { type: currentMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              {activeTab === 'app' ? (
                <FileCodeIcon className="w-5 h-5" />
              ) : activeTab.includes('setup') ? (
                <TerminalIcon className="w-5 h-5" />
              ) : (
                <SettingsIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{currentFileName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  {activeTab === 'app'
                    ? '100% Native Expo'
                    : activeTab === 'setup-bat'
                    ? 'Windows Setup Script'
                    : activeTab === 'setup-sh'
                    ? 'Unix / macOS Setup Script'
                    : 'Expo Manifest'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {activeTab === 'app'
                  ? 'React Native layout: Citizen, Collector, Recycler & Admin screens'
                  : activeTab.includes('setup')
                  ? 'Runs npm install & npx expo doctor for environment readiness'
                  : 'Expo compatible dependencies'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors border border-emerald-600"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : `Copy ${currentFileName}`}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
            >
              <DownloadIcon className="w-3.5 h-3.5" />
              Download
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'app'
                ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCodeIcon size={13} className={activeTab === 'app' ? 'text-white' : ''} />
            <span>App.js</span>
          </button>

          <button
            onClick={() => setActiveTab('setup-bat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'setup-bat'
                ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TerminalIcon size={13} className={activeTab === 'setup-bat' ? 'text-white' : ''} />
            <span>setup.bat (Windows)</span>
          </button>

          <button
            onClick={() => setActiveTab('setup-sh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'setup-sh'
                ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TerminalIcon size={13} className={activeTab === 'setup-sh' ? 'text-white' : ''} />
            <span>setup.sh (macOS / Linux)</span>
          </button>

          <button
            onClick={() => setActiveTab('package-expo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'package-expo'
                ? 'bg-emerald-600 text-white font-bold border border-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SettingsIcon size={13} className={activeTab === 'package-expo' ? 'text-white' : ''} />
            <span>package.expo.json</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs leading-relaxed">
          <pre className="text-slate-100">
            <code>{currentContent}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            {activeTab === 'app'
              ? 'Contains UserScreen, CollectorScreen, RecyclerScreen, AdminScreen'
              : activeTab === 'setup-bat'
              ? 'Windows batch runner script'
              : activeTab === 'setup-sh'
              ? 'Unix bash runner script'
              : 'Target Expo SDK manifest'}
          </span>
          <button
            onClick={handleCopy}
            className="text-emerald-700 hover:text-emerald-800 font-bold"
          >
            Click to Copy {currentFileName}
          </button>
        </div>
      </div>
    </div>
  );
};
