import React from 'react';
import { WifiIcon, WifiOffIcon, RefreshIcon, DatabaseIcon } from './icons/Icons';
import { QueuedOfflineRequest } from '../types';

interface OfflineStatusBarProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  queue: QueuedOfflineRequest[];
  onOpenQueueModal: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  variant?: 'mobile' | 'workbench';
}

export const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  isOnline,
  queue,
  onOpenQueueModal,
  onSyncNow,
  isSyncing,
  variant = 'mobile',
}) => {
  const pendingCount = queue.length;

  if (variant === 'mobile') {
    if (isOnline && pendingCount === 0) {
      return null;
    }

    return (
      <div
        className={`px-3 py-2 flex items-center justify-between text-xs font-semibold ${
          !isOnline
            ? 'bg-amber-50 text-amber-900 border-b border-amber-200'
            : 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOffIcon size={14} className="shrink-0 text-amber-600" />
          ) : (
            <WifiIcon size={14} className="shrink-0 text-emerald-600" />
          )}
          <span className="text-[11px] leading-tight">
            {!isOnline ? (
              <>
                <strong>Offline Mode</strong> - Storing in AsyncStorage ({pendingCount})
              </>
            ) : (
              <>
                <strong>Online</strong> - {pendingCount} item{pendingCount > 1 ? 's' : ''} ready to sync
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {pendingCount > 0 && isOnline && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="px-2 py-0.5 rounded-lg bg-emerald-600 border border-emerald-600 text-[10px] font-bold text-white flex items-center gap-1"
            >
              <RefreshIcon size={10} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing' : 'Sync'}
            </button>
          )}

          <button
            onClick={onOpenQueueModal}
            className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-slate-700 flex items-center gap-1"
          >
            <DatabaseIcon size={10} />
            Queue ({pendingCount})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenQueueModal}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
          !isOnline
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : pendingCount > 0
            ? 'bg-blue-50 text-blue-900 border-blue-200'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
        title="NetInfo connectivity and AsyncStorage offline sync queue"
      >
        {!isOnline ? (
          <WifiOffIcon size={13} className="text-amber-600 shrink-0" />
        ) : (
          <WifiIcon size={13} className="text-emerald-600 shrink-0" />
        )}
        <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};
