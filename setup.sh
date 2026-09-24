#!/usr/bin/env bash

# Colors for terminal output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================================================${NC}"
echo -e "${CYAN}      KABADIWALA CONNECT - EXPO ENVIRONMENT SETUP & HEALTH CHECK       ${NC}"
echo -e "${CYAN}         SIH Hackathon: E-Waste Management & Traceability Portal        ${NC}"
echo -e "${CYAN}=========================================================================${NC}"
echo ""

# 1. Verify Node.js
echo -e "${YELLOW}[Step 1/5] Checking Node.js runtime...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed or not in your PATH!${NC}"
    echo "Please install Node.js (v18 or v20 LTS recommended) from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN} -- Found Node.js version: ${NODE_VERSION} (OK)${NC}"

# 2. Verify npm
echo ""
echo -e "${YELLOW}[Step 2/5] Checking npm package manager...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not found in your PATH!${NC}"
    echo "Please ensure npm is installed alongside Node.js."
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN} -- Found npm version: ${NPM_VERSION} (OK)${NC}"

# 3. Configure Expo package.json
echo ""
echo -e "${YELLOW}[Step 3/5] Configuring Expo project manifest (package.expo.json)...${NC}"
if [ -f "package.expo.json" ]; then
    if [ ! -f "package.web.json" ] && [ -f "package.json" ]; then
        echo " -- Backing up original web package.json to package.web.json..."
        cp -f package.json package.web.json
    fi
    echo " -- Applying package.expo.json as main package.json..."
    cp -f package.expo.json package.json
    echo -e "${GREEN} -- Expo configuration applied successfully!${NC}"
else
    echo " -- package.expo.json not found, using existing package.json..."
fi

# 4. Install Dependencies
echo ""
echo -e "${YELLOW}[Step 4/5] Installing Expo and React Native dependencies...${NC}"
echo " -- Running: npm install --legacy-peer-deps"
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] npm install failed. Please inspect logs and retry.${NC}"
    exit 1
fi
echo -e "${GREEN} -- Dependencies installed successfully! (OK)${NC}"

# 5. Run Expo Doctor
echo ""
echo -e "${YELLOW}[Step 5/5] Running Expo Doctor to diagnose environment and dependencies...${NC}"
echo " -- Running: npx expo doctor"
npx expo doctor || true
echo ""

echo -e "${CYAN}=========================================================================${NC}"
echo -e "${GREEN} SUCCESS! Your environment is verified and ready for 'npx expo start'!${NC}"
echo -e "${CYAN}=========================================================================${NC}"
echo ""
echo "You can launch the app anytime using:"
echo -e "  ${YELLOW}npx expo start${NC}  or  ${YELLOW}./run-expo.sh${NC}"
echo ""

read -p "Would you like to launch 'npx expo start' right now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting Expo Development Server..."
    echo "Press 'a' for Android, 'i' for iOS, or scan QR with Expo Go app!"
    echo ""
    npx expo start
else
    echo "Setup complete. Have a great demo at SIH!"
fi
