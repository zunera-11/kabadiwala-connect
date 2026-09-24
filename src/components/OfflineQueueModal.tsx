import React from 'react';
import { QueuedOfflineRequest } from '../types';
import {
  WifiOffIcon,
  WifiIcon,
  RefreshIcon,
  TrashIcon,
  XIcon,
  ClockIcon,
  SendIcon,
  DatabaseIcon,
  CheckIcon,
  AlertTriangleIcon
} from './icons/Icons';

interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueuedOfflineRequest[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulateOffline: () => void;
  onSyncQueue: () => void;
  onClearQueue: () => void;
  onRemoveItem: (id: string) => void;
  isSyncing: boolean;
}

export const OfflineQueueModal: React.FC<OfflineQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  isOnline,
  isSimulatedOffline,
  onToggleSimulateOffline,
  onSyncQueue,
  onClearQueue,
  onRemoveItem,
  isSyncing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}
            >
              {isOnline ? <WifiIcon className="w-5 h-5" /> : <WifiOffIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">NetInfo & AsyncStorage Queue</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {isOnline ? 'Online (Connected)' : 'Offline (Disconnected)'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Low-connectivity buffer: stores pending actions in AsyncStorage until reconnect
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`} />
            <span className="text-xs text-slate-700">
              Network state: <strong className="text-slate-900">{isOnline ? 'Active' : 'Offline / Low-Signal'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSimulateOffline}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isSimulatedOffline
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              {isSimulatedOffline ? <WifiOffIcon size={13} /> : <WifiIcon size={13} />}
              {isSimulatedOffline ? 'Simulating Offline Mode' : 'Simulate Offline Mode'}
            </button>

            {queue.length > 0 && (
              <button
                onClick={onSyncQueue}
                disabled={!isOnline || isSyncing}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isOnline && !isSyncing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                <RefreshIcon size={13} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <DatabaseIcon size={13} className="text-emerald-600" />
              Stored Requests in <code className="text-slate-800 font-mono text-[11px]">AsyncStorage</code> (
              {queue.length})
            </span>
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <TrashIcon size={12} /> Clear Queue
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-700 border border-emerald-200">
                <CheckIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Queue is Clear</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No pending API requests stored in AsyncStorage. When in a low-connectivity alley or warehouse, any
                collection or pickup requests will automatically queue here and sync upon reconnecting.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                        item.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {item.method}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-700 font-bold border border-slate-300">
                      {item.screen}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200"
                    title="Remove item"
                  >
                    <XIcon size={13} />
                  </button>
                </div>

                <p className="text-xs text-slate-600 mb-2">{item.description}</p>

                <div className="bg-white rounded-lg p-2 font-mono text-[11px] text-slate-700 mb-2 border border-slate-200 overflow-x-auto">
                  <div className="text-slate-400 text-[10px] mb-0.5">Endpoint:</div>
                  <div className="text-emerald-700">{item.endpoint}</div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ClockIcon size={11} /> {new Date(item.timestamp).toLocaleTimeString()} (
                    {new Date(item.timestamp).toLocaleDateString()})
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 font-medium">
                    <AlertTriangleIcon size={11} /> Pending NetInfo Reconnect
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 text-[11px]">
            <SendIcon size={12} className="text-emerald-600" />
            Auto-Sync is <strong>Active</strong> (Triggers on NetInfo online event)
          </span>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium border border-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
