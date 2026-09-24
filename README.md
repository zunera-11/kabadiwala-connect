# ♻️ Kabadiwala Connect
### SIH Hackathon: E-Waste Management, Traceability & EPR Compliance Portal

**Kabadiwala Connect** is a production-ready mobile platform built with **React Native (Expo)** that bridges the informal waste-picking ecosystem (*kabadiwalas*) with certified recycling plants and the **Central Pollution Control Board (CPCB)**.

The system ensures complete chain-of-custody tracking, digitized digital scale verification, automated UPI disbursements, and transparent Extended Producer Responsibility (EPR) certificate generation.

---

## 📱 System Architecture & Role Navigation

The app is architected around 4 key roles accessible via a global role switcher:

```
[ 🏠 Citizen (User) ]  ⇄  [ 🛵 Collector (Field) ]  ⇄  [ 🏭 Recycler (Hub) ]  ⇄  [ 📊 CPCB Ledger (Admin) ]
```

Smooth screen transitions are powered by React Native's native **`LayoutAnimation`** engine (`LayoutAnimation.Presets.easeInEaseOut`), ensuring fluid 60fps transitions on both iOS and Android.

### 1. 🏠 Citizen / User Screen
* **Doorstep Scrap Booking**: Allows households to select scrap types (**E-Waste / PCBs**, **Plastic PET**, **Paper / Raddi**, and **Metals / Copper**).
* **Weight Stepper**: Interactive `+` / `−` adjustments with quick-chips (5 KG, 10 KG, 20 KG, 50+ KG).
* **Estimated Payout Card**: Dynamic instant price calculations based on live per-KG rates.
* **Audio Assistance (TTS)**: One-tap speaker button reads out instructions and price estimates in Hindi, Marathi, or English.
* **API Action**: "Book Pickup" triggers `POST /api/lots`.

### 2. 🛵 Collector / Kabadiwala Screen
* **Duty Status Toggle**: Switch between **Duty Online** (GPS active) and **Duty Offline**.
* **Daily Earnings Dashboard**: Real-time tracker showing today's earnings (₹450), completed pickups, and pending cashouts.
* **Hero Direct Scan Button**: High-visibility camera trigger to photograph scrap lots or scan incoming barcodes.
* **Pickup Requests Queue**: Nearby citizen requests with distance, location, scrap type, estimated weight, and call shortcut.
* **API Action**: "Accept & Pay" triggers `PUT /api/lots/:id/collect`.
* **Live Mandi Rates**: Daily benchmark rates for copper, PCBs, plastic, and paper.

### 3. 🏭 Recycler Screen (EcoCycle Verification Hub)
* **Inbound Manifest Card**: Displays lot details (`#LOT-2024-8841`), timestamp, and CPCB hazardous material protocol flags.
* **Chain of Custody**: Shows citizen origin and collector verification ID (`#KBD-9412`).
* **Bluetooth Scale Display (Mettler Toledo BT-9)**:
  * Real-time calibrated net weight (e.g. `48.50 KG`).
  * Tare control button (`2.50 KG`).
  * Manual fine-calibration steppers (`±0.5 KG`).
  * Automated **Legal Metrology variance check** (verifies within mandatory ±3% margin).
* **Automated UPI Payout Math**: Net weight × scrap rate (e.g. 48.50 KG × ₹65.00/KG = ₹3,402.50).
* **API Action**: "Verify Weight & Process Instant Payment" triggers `PUT /api/lots/:id/recycle` and mints EPR certificate (`#EPR-DEL-9941`).

### 4. 📊 CPCB National Circular Economy Ledger (Admin)
* **Macro Counters**: Real-time aggregated metrics (Total Material Diverted in Metric Tonnes, Total UPI Disbursed, Total Audited EPR Credits).
* **Live Manifest Audit Stream**: Real-time immutable record of all completed and in-transit lots.
* **Search & Multi-Filter**: Filter by All, Completed, or In Transit, with text search across Lot ID, Citizen, Collector, or Hub.
* **CSV Export**: One-tap export for regulatory reporting.

---

## ⏳ Global Loading Overlay Component

A unified **Global Loading Overlay** is implemented across the React Native (`App.js`) and web workbench views to deliver immediate visual feedback during network operations:

* **Modal Transparent Backdrop**: Dims background content (`rgba(15, 23, 42, 0.75)` / `backdrop-blur-sm`) to prevent duplicate button clicks during active network calls.
* **Animated Network Indicator**: Shows a live activity spinner with a glowing emerald pulse ring.
* **Operation Metadata**:
  * **HTTP Method Badge**: Highlights `POST` (green) or `PUT` (blue).
  * **Target Endpoint**: Displays the exact REST URL (e.g. `http://192.168.1.100:5000/api/lots`).
  * **Subtext / Progress Details**: Informs the user of real-time steps (e.g., manifest generation, UPI disbursement, EPR certificate minting).
* **CPCB Chain-of-Custody Badge**: Reinforces trust with an authentic Central Pollution Control Board traceability label.
* **Integrated Screen Triggers**:
  1. **User Screen**: Triggers during "Book Pickup" (`POST /api/lots`).
  2. **Collector Screen**: Triggers during "Accept & Pay" (`PUT /api/lots/:id/collect`).
  3. **Recycler Screen**: Triggers during "Verify Weight & Process Instant Payment" (`PUT /api/lots/:id/recycle`).

---

## 🌐 Node.js Backend API Specification

All buttons in `App.js` are wired to standard REST endpoints on your local Node.js backend.

## 🚀 How to Run

### 1. Install dependencies

From the project folder, run:

```bash
npm install
```

You need Node.js 18 or newer.

### 2. Run the web workbench

The browser version uses Vite and renders the full interactive workbench:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### 3. Run the Expo mobile app

Start the Expo development server with:

```bash
npm run expo
```

If Metro reports stale cache or registration errors, clear the cache:

```bash
npm run expo -- --clear
```

You can also use the platform shortcuts:

```bash
npm run android
npm run ios
npm run web
```

On Windows, `run-expo.bat` is a shortcut for starting Expo. On macOS or Linux, use `./run-expo.sh`.

### Connecting to Expo Go on Your Physical Mobile Phone:
  "scaleId": "METTLER-BT-9",
  "calibratedWeightKg": 48.5,
  "ratePerKg": 65,
  "totalPayout": 3402.5,
  "status": "VERIFIED_AND_PAID",
  "cpcbCertificateId": "EPR-DEL-9941",
  "processedAt": "2026-09-10T11:05:00.000Z"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "certificate": "EPR-DEL-9941",
  "payoutStatus": "DISBURSED_VIA_UPI"
}
```

---

## 🚀 How to Run in Expo

### Why did you see "Unable to find expo in this project"?
When you download the project ZIP from AI Studio, the `node_modules/` folder is intentionally omitted (to keep the zip lightweight), and the default web package is geared toward the web preview. Expo requires the `expo` and `react-native` packages to be installed before running `npx expo start`.

We have provided two foolproof ways to run this:

---

### Option 1: Automated Environment Setup & Health Check (Recommended)

#### On Windows:
Double-click or run in Command Prompt / PowerShell:
```cmd
setup.bat
```
This script will:
1. Verify **Node.js** and **npm** installation and version.
2. Back up web configurations and set up **`package.json`** for Expo SDK 52.
3. Run **`npm install --legacy-peer-deps`** to fetch Expo and React Native.
4. Run **`npx expo doctor`** to perform an end-to-end environment health check.
5. Prompt you to launch **`npx expo start`** immediately.

#### On macOS / Linux:
Run in your terminal:
```bash
chmod +x setup.sh
./setup.sh
```

---

### Option 2: 1-Click Fast Launcher

If your environment is already set up and you just want to start the Expo dev server:
* **Windows**: Double-click `run-expo.bat`
* **macOS / Linux**: Run `./run-expo.sh`
* **Manual**: `npx expo start`

---

### Option 2: Standard Clean Expo Project (Recommended for New Apps)

```bash
# 1. Create a clean Expo app with standard dependencies
npx create-expo-app KabadiwalaConnect --template blank

# 2. Enter the folder
cd KabadiwalaConnect

# 3. Replace App.js
# Copy the App.js file from this repository into your new KabadiwalaConnect/App.js

# 4. Start Expo
npx expo start
```

---

### Connecting to Expo Go on Your Physical Mobile Phone:
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Ensure your computer and phone are connected to the **same Wi-Fi network**.
3. Scan the QR code printed in your terminal:
   - On Android: Scan directly inside the Expo Go app.
   - On iOS: Scan with the default iOS Camera app, then tap "Open in Expo Go".
4. Press `r` in the terminal to reload, or `a` to open Android emulator if installed.

---

## 🎨 LayoutAnimation Implementation Details

React Native's `LayoutAnimation` automatically animates views to their new positions when next layout happens:

```javascript
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable experimental flag on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Triggered on role switch
const handleRoleSwitch = (newRole) => {
  if (newRole !== role) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRole(newRole);
  }
};
```

---

## 🗣️ Multilingual & Accessibility Support

The application includes full language dictionaries for three languages:
1. **English (`EN`)**
2. **Hindi (`HI`)** — *नमस्ते रमेश, कबाड़ का प्रकार चुनें, आज की कुल कमाई*
3. **Marathi (`MR`)** — *कबाडीवाला कनेक्ट, भंगार पिकअप बुक करा, आजची एकूण कमाई*

Every screen includes speaker buttons that utilize Text-to-Speech (TTS) audio narration for informal waste pickers with limited literacy.

---

## 📷 Simulated Hardware Modules

1. **Camera Scanner Mock**:
   - Includes custom optical viewfinder styling with corner brackets and scanning beam.
   - Built with `Modal` and `setTimeout(1500)` to simulate real-time barcode / QR decoding.
   - When migrating to native production camera: install `expo-camera` and `expo-barcode-scanner`.

2. **Bluetooth Digital Scale (Mettler Toledo BT-9)**:
   - Emulates continuous weight streaming from industrial Bluetooth BLE indicator.
   - Includes real-time Tare adjustment, fine tuning (`±0.5 KG`), and automated tolerance margin calculation (±3%).
   - When migrating to native production Bluetooth: install `react-native-ble-plx`.

---

## 🏆 Smart India Hackathon (SIH) Alignment
* **Problem Addressed**: Informal sector formalization, leakages in e-waste disposal, uncalibrated scale fraud, and non-traceable EPR claims.
* **Solution Delivered**: Unified end-to-end provenance trail from household collection to industrial smelting with verifiable UPI payouts and instant EPR credits.
