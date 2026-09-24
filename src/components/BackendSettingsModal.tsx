import React, { useState } from 'react';
import { ServerIcon, XIcon, CheckIcon, GlobeIcon, TerminalIcon } from './icons/Icons';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendIp: string;
  onSaveIp: (ip: string) => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  backendIp,
  onSaveIp,
}) => {
  const [ipValue, setIpValue] = useState(backendIp);
  const [testLog, setTestLog] = useState<string | null>(null);
  const [, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestEndpoint = async (endpoint: string, method: string) => {
    setIsTesting(true);
    setTestLog(`Testing ${method} http://${ipValue}${endpoint} ...`);

    try {
      const response = await fetch(`http://${ipValue}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:
          method === 'POST'
            ? JSON.stringify({ category: 'Plastic', weightKg: 12, userPayout: 216 })
            : undefined,
      });

      const text = await response.text();
      setTestLog(
        `Response ${response.status} OK:\n${text.substring(0, 180) || '(Empty response body)'}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestLog(
        `Network Note:\n${msg}\n\nIn Expo, when testing on a physical phone or simulator, ensure your Node backend is bound to 0.0.0.0 and port 5000, and your device is on the same Wi-Fi subnet.`
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-xl text-slate-900">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <ServerIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Node.js Backend IP Configuration
              </h3>
              <p className="text-xs text-slate-500">Live API wiring for SIH hackathon</p>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Host / IP Address & Port:
            </label>
            <div className="relative">
              <GlobeIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={ipValue}
                onChange={(e) => setIpValue(e.target.value)}
                placeholder="192.168.1.100:5000 or localhost:5000"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used across User POST, Collector PUT, and Recycler PUT calls in React Native.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-600" />
              Configured App API Endpoints:
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                <span className="text-emerald-700 font-bold">POST</span>
                <span className="text-slate-800">/api/lots</span>
                <button
                  onClick={() => handleTestEndpoint('/api/lots', 'POST')}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold hover:bg-emerald-200 border border-emerald-300"
                >
                  Test
                </button>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                <span className="text-amber-700 font-bold">PUT</span>
                <span className="text-slate-800">/api/lots/:id/collect</span>
                <button
                  onClick={() => handleTestEndpoint('/api/lots/8841/collect', 'PUT')}
                  className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold hover:bg-amber-200 border border-amber-300"
                >
                  Test
                </button>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                <span className="text-blue-700 font-bold">PUT</span>
                <span className="text-slate-800">/api/lots/:id/recycle</span>
                <button
                  onClick={() => handleTestEndpoint('/api/lots/8841/recycle', 'PUT')}
                  className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold hover:bg-blue-200 border border-blue-300"
                >
                  Test
                </button>
              </div>
            </div>
          </div>

          {testLog && (
            <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono max-h-28 overflow-y-auto whitespace-pre-wrap border border-slate-800">
              {testLog}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors bg-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSaveIp(ipValue);
              onClose();
            }}
            className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-emerald-600"
          >
            <CheckIcon className="w-3.5 h-3.5" />
            Save Backend IP
          </button>
        </div>
      </div>
    </div>
  );
};
