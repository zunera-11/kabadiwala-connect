import React, { useState } from 'react';
import { Role, Language, QueuedOfflineRequest } from '../types';
import { AuthUser } from '../auth/auth';
import { OfflineStatusBar } from './OfflineStatusBar';
import { LOCALES } from '../i18n/locales';
import {
  GlobeIcon,
  CameraIcon,
  CopyIcon,
  CheckIcon,
  SettingsIcon,
  LogOutIcon,
  BellIcon,
  XIcon
} from './icons/Icons';

interface ExpoHeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  viewMode: 'phone' | 'full' | 'split';
  onViewModeChange: (mode: 'phone' | 'full' | 'split') => void;
  onOpenCodeViewer: () => void;
  onOpenSettings: () => void;
  onOpenScanner: () => void;
  backendIp: string;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  offlineQueue: QueuedOfflineRequest[];
  onOpenOfflineQueue: () => void;
  onSyncOfflineQueue: () => void;
  isSyncingQueue: boolean;
  authenticatedUser: AuthUser;
  onLogout: () => void;
}

const DEFAULT_NOTIFICATIONS: Record<Role, { id: string; title: string; time: string; read: boolean }[]> = {
  USER: [
    { id: '1', title: 'Collector Ramesh Kumar accepted your pickup request.', time: '10m ago', read: false },
    { id: '2', title: 'Waste Lot #LOT-2026-8841 generated for Plastic.', time: '1h ago', read: false },
    { id: '3', title: 'Instant UPI payout Rs. 216.00 credited to bank.', time: '2h ago', read: true },
  ],
  COLLECTOR: [
    { id: '1', title: 'New pickup request received in Ward 14 from Pooja Sharma.', time: '5m ago', read: false },
    { id: '2', title: 'EcoCycle Hub #04 accepted Lot #LOT-2026-8841.', time: '45m ago', read: false },
    { id: '3', title: 'Weekly duty earnings statement ready: Rs 4,820.00', time: '1d ago', read: true },
  ],
  RECYCLER: [
    { id: '1', title: 'Inbound Lot #LOT-2026-8841 received from Collector Ramesh.', time: '15m ago', read: false },
    { id: '2', title: 'Digital scale calibrated: 48.50 KG verified.', time: '1h ago', read: false },
    { id: '3', title: 'EPR Certificate #EPR-DEL-9941 generated & signed.', time: '3h ago', read: true },
  ],
  ADMIN: [
    { id: '1', title: 'New Collector registration submitted for CPCB review.', time: '12m ago', read: false },
    { id: '2', title: '1,420 waste lots processed today across National Hubs.', time: '2h ago', read: false },
    { id: '3', title: 'Annual CPCB compliance rating 100% verified with 0 variance.', time: '1d ago', read: true },
  ],
};

export const ExpoHeader: React.FC<ExpoHeaderProps> = ({
  currentRole,
  currentLanguage,
  onLanguageChange,
  viewMode,
  onViewModeChange,
  onOpenSettings,
  onOpenScanner,
  isOnline,
  isSimulatedOffline,
  offlineQueue,
  onOpenOfflineQueue,
  onSyncOfflineQueue,
  isSyncingQueue,
  authenticatedUser,
  onLogout,
}) => {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const t = LOCALES[currentLanguage] || LOCALES.EN;
  const roleNotifications = notifications[currentRole] || [];
  const unreadCount = roleNotifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => ({
      ...prev,
      [currentRole]: prev[currentRole].map(n => ({ ...n, read: true }))
    }));
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              KC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm tracking-tight text-slate-900">
                  Kabadiwala Connect
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Traceability Workbench
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="relative p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
            >
              <BellIcon className="w-4 h-4 text-emerald-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Authenticated Role Indicator */}
        <div className="flex items-center justify-center overflow-x-auto">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-xs font-bold text-slate-900">
              {currentRole === 'ADMIN' ? 'CPCB Authority' : currentRole === 'USER' ? 'User' : currentRole === 'COLLECTOR' ? 'Collector' : 'Recycler'}
            </span>
            <span className="text-[11px] text-slate-600">{authenticatedUser.email}</span>
            {authenticatedUser.location && (
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 font-bold">
                {authenticatedUser.location}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Top Bell Notification Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Notifications"
            >
              <BellIcon className="w-4 h-4 text-emerald-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotificationPanel && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <BellIcon className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900">{t.notifications}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        {t.markAllRead}
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotificationPanel(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {roleNotifications.map(item => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs leading-tight transition-colors ${
                        item.read
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-emerald-50/60 border-emerald-200 text-slate-900 font-medium'
                      }`}
                    >
                      <div>{item.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <GlobeIcon className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
            {(['EN', 'HI', 'MR'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                  currentLanguage === lang
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <OfflineStatusBar
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            queue={offlineQueue}
            onOpenQueueModal={onOpenOfflineQueue}
            onSyncNow={onSyncOfflineQueue}
            isSyncing={isSyncingQueue}
            variant="workbench"
          />

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-rose-700 border border-slate-200 text-xs font-bold hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            <LogOutIcon className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            onClick={onOpenScanner}
            title="Open camera / file upload scanner"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors border border-emerald-600"
          >
            <CameraIcon className="w-3.5 h-3.5" />
            <span>Scan / Upload</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => onViewModeChange('phone')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                viewMode === 'phone' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phone
            </button>
            <button
              onClick={() => onViewModeChange('full')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-bold ${
                viewMode === 'full' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

