import React, { useState, useEffect, useRef } from 'react';
import { CameraIcon, XIcon, CheckIcon, RefreshIcon, DownloadIcon, MapPinIcon } from './icons/Icons';

export interface CreatedLotData {
  lotId: string;
  material: string;
  weight: string;
  location: string;
  imageUrl?: string;
  timestamp: string;
}

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (data: CreatedLotData) => void;
  userLocation?: string;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  userLocation = 'Malviya Nagar, Jalgaon',
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [lotMaterial, setLotMaterial] = useState<string>('High-Grade Printed Circuit Boards (PCBs)');
  const [lotWeight, setLotWeight] = useState<string>('48.50 KG');
  const [lotLocation, setLotLocation] = useState<string>(userLocation);
  const [scanResult, setScanResult] = useState<CreatedLotData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScanResult(null);
      setUploadedImage(null);
      setLotLocation(userLocation);

      const timer = setTimeout(() => {
        setIsScanning(false);
        const result: CreatedLotData = {
          lotId: '#LOT-2024-' + Math.floor(1000 + Math.random() * 9000),
          material: lotMaterial,
          weight: lotWeight,
          location: userLocation,
          timestamp: new Date().toLocaleTimeString(),
        };
        setScanResult(result);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, userLocation]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        setUploadedImage(resultUrl);
        setIsScanning(false);

        const newLot: CreatedLotData = {
          lotId: '#LOT-2024-' + Math.floor(1000 + Math.random() * 9000),
          material: file.name.toLowerCase().includes('metal') ? 'Scrap Metal Lot' : lotMaterial,
          weight: lotWeight,
          location: lotLocation,
          imageUrl: resultUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
        setScanResult(newLot);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateLot = () => {
    if (scanResult && onScanComplete) {
      onScanComplete({
        ...scanResult,
        material: lotMaterial,
        weight: lotWeight,
        location: lotLocation,
        imageUrl: uploadedImage || scanResult.imageUrl
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 font-bold">
              <CameraIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Capture / Upload E-Waste Lot
              </h3>
              <p className="text-xs text-slate-500">Scan QR, camera capture, or file upload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 bg-white">
          {/* Scanner / Upload Viewfinder */}
          <div className="relative h-60 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-slate-800">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded Lot preview" className="w-full h-full object-cover" />
            ) : isScanning ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-40 h-40 border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center bg-slate-950/50">
                  <span className="text-xs text-slate-300 font-mono text-center px-4">Point camera or choose file from disk</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                  Scanning optical code...
                </div>
              </div>
            ) : scanResult ? (
              <div className="bg-slate-900 p-4 rounded-xl max-w-[85%] text-center border border-emerald-600 text-white">
                <CheckIcon className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <h4 className="font-bold text-white text-sm">
                  Scanned & Verified
                </h4>
                <div className="text-emerald-400 font-bold text-base mt-0.5">
                  {scanResult.lotId}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {lotMaterial}
                </p>
              </div>
            ) : null}

            {/* Target Corners */}
            {!uploadedImage && (
              <>
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
              </>
            )}
          </div>

          {/* File Upload Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Lot Creation Fields */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Scrap Category / Material:
              </label>
              <select
                value={lotMaterial}
                onChange={e => setLotMaterial(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="High-Grade Printed Circuit Boards (PCBs)">High-Grade Printed Circuit Boards (PCBs)</option>
                <option value="Plastic Bottles (PET / HDPE)">Plastic Bottles (PET / HDPE)</option>
                <option value="Paper & Books Raddi">Paper & Books Raddi</option>
                <option value="Copper Wire Scrap">Copper Wire Scrap</option>
                <option value="Mixed E-Waste Components">Mixed E-Waste Components</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Weight (KG):
                </label>
                <input
                  type="text"
                  value={lotWeight}
                  onChange={e => setLotWeight(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Location Zone:
                </label>
                <div className="relative">
                  <MapPinIcon className="w-3.5 h-3.5 absolute left-2 top-2.5 text-emerald-600" />
                  <input
                    type="text"
                    value={lotLocation}
                    onChange={e => setLotLocation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-2 py-2 font-semibold text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            type="button"
            onClick={handleCreateLot}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-emerald-600"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Submit Lot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
