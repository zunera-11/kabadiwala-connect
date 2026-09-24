import React from 'react';
import { SpinnerIcon, WifiIcon, ShieldCheckIcon, ArrowUpRightIcon } from './icons/Icons';
import { LoadingOverlayConfig } from '../types';

interface GlobalLoadingOverlayProps {
  config: LoadingOverlayConfig;
  backendIp: string;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({ config, backendIp }) => {
  if (!config.isLoading) return null;

  const methodColor =
    config.method === 'POST'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : config.method === 'PUT'
      ? 'bg-blue-100 text-blue-800 border-blue-300'
      : 'bg-amber-100 text-amber-800 border-amber-300';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 text-slate-900 shadow-xl">
        {/* Network Header Pill */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              Network Operation
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-600">
            <WifiIcon size={11} className="text-emerald-600" />
            <span>{backendIp}</span>
          </div>
        </div>

        {/* Center Spinner & Information */}
        <div className="flex flex-col items-center justify-center my-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <SpinnerIcon className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>

          <h3 className="text-base font-bold text-slate-900 tracking-tight">{config.title}</h3>
          {config.subtitle && (
            <p className="mt-1.5 text-xs text-slate-600 max-w-xs leading-relaxed">
              {config.subtitle}
            </p>
          )}
        </div>

        {/* Endpoint Tag Box */}
        {config.endpoint && (
          <div className="p-2.5 mb-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              {config.method && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${methodColor}`}
                >
                  {config.method}
                </span>
              )}
              <span className="text-slate-700 truncate text-[11px]">{config.endpoint}</span>
            </div>
            <ArrowUpRightIcon size={13} className="text-slate-400 shrink-0" />
          </div>
        )}

        {/* CPCB Security Badge */}
        <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
          <ShieldCheckIcon size={12} className="text-emerald-600" />
          <span>CPCB Verified Chain-of-Custody Transaction</span>
        </div>
      </div>
    </div>
  );
};
