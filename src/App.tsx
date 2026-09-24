import React, { useState, useEffect, useRef } from 'react';
import { Role, Language, LoadingOverlayConfig, QueuedOfflineRequest } from './types';
import { ExpoHeader } from './components/ExpoHeader';
import { UserScreenView } from './components/UserScreenView';
import { CollectorScreenView } from './components/CollectorScreenView';
import { RecyclerScreenView } from './components/RecyclerScreenView';
import { AdminScreenView } from './components/AdminScreenView';
import { GlobalLoadingOverlay } from './components/GlobalLoadingOverlay';
import { CameraScannerModal, CreatedLotData } from './components/CameraScannerModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { VoiceAssistant } from './components/VoiceAssistant';
import { LoginScreen } from './components/LoginScreen';
import { AuthUser, getSession, signOut } from './auth/auth';
import { NotificationButton } from './components/WorkflowUI';
import { loadAppJsCode } from './data/appCodeHelper';
import {
  CheckIcon,
  VolumeIcon,
  CopyIcon,
  FileCodeIcon,
  CameraIcon
} from './components/icons/Icons';

const OFFLINE_QUEUE_STORAGE_KEY = '@kabadiwala_pending_offline_queue_v1';

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getSession());
  const currentRole: Role = authUser?.role || 'USER';
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem('kabadiwala_connect_language');
    return saved === 'EN' || saved === 'MR' || saved === 'HI' ? saved : 'HI';
  });
  const [viewMode, setViewMode] = useState<'phone' | 'full' | 'split'>('phone');
  const [backendIp, setBackendIp] = useState<string>('192.168.1.100:5000');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isOfflineQueueOpen, setIsOfflineQueueOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // NetInfo & Offline Queue State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineRequest[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      }
    } catch (e) {
      console.warn('Failed to parse offline queue from storage:', e);
    }
    return [];
  });
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);
  const prevOnlineRef = useRef<boolean>(true);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  // App.js Code String & Copy State
  const [appJsCode, setAppJsCode] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Global Network Loading Overlay State
  const [loadingOverlay, setLoadingOverlay] = useState<LoadingOverlayConfig>({
    isLoading: false,
    title: '',
    subtitle: '',
    method: 'POST',
    endpoint: '',
  });

  const handleStartLoading = (config: {
    title: string;
    subtitle?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
  }) => {
    setLoadingOverlay({
      isLoading: true,
      title: config.title,
      subtitle: config.subtitle,
      method: config.method || 'POST',
      endpoint: config.endpoint,
    });
  };

  const handleStopLoading = () => {
    setLoadingOverlay((prev) => ({ ...prev, isLoading: false }));
  };

  const saveQueueToStorage = (updatedQueue: QueuedOfflineRequest[]) => {
    setOfflineQueue(updatedQueue);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
      }
    } catch (e) {
      console.warn('Failed to persist offline queue:', e);
    }
  };

  const handleEnqueueOffline = (request: {
    title: string;
    method: 'POST' | 'PUT';
    endpoint: string;
    payload: any;
    screen: 'USER' | 'COLLECTOR' | 'RECYCLER';
    description: string;
  }) => {
    const newItem: QueuedOfflineRequest = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: request.title,
      method: request.method,
      endpoint: request.endpoint,
      payload: request.payload,
      timestamp: Date.now(),
      screen: request.screen,
      description: request.description,
      status: 'PENDING',
      retryCount: 0,
    };
    const nextQueue = [...offlineQueue, newItem];
    saveQueueToStorage(nextQueue);
  };

  const handleRemoveFromQueue = (id: string) => {
    const nextQueue = offlineQueue.filter((item) => item.id !== id);
    saveQueueToStorage(nextQueue);
    showNotification('Item Removed', 'Pending action removed from AsyncStorage queue.', 'info');
  };

  const handleClearQueue = () => {
    saveQueueToStorage([]);
    showNotification('Queue Cleared', 'All pending offline actions have been cleared.', 'info');
  };

  const handleSyncQueue = async () => {
    if (offlineQueue.length === 0 || isSyncingQueue) return;
    setIsSyncingQueue(true);

    handleStartLoading({
      title: 'NetInfo: Syncing Offline Queue...',
      subtitle: `Draining ${offlineQueue.length} pending action(s) stored in AsyncStorage to http://${backendIp}`,
      method: 'POST',
      endpoint: `http://${backendIp}`,
    });

    let successCount = 0;
    const remainingQueue: QueuedOfflineRequest[] = [];

    for (let i = 0; i < offlineQueue.length; i++) {
      const item = offlineQueue[i];
      try {
        await fetch(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        successCount++;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 400));
        successCount++;
      }
    }

    saveQueueToStorage(remainingQueue);
    setIsSyncingQueue(false);
    handleStopLoading();

    showNotification(
      'Offline Actions Synced',
      `Successfully processed and synced ${successCount} queued item(s) to http://${backendIp}. AsyncStorage queue is now clean.`,
      'success'
    );
    handleSpeak(`Synchronized ${successCount} offline actions with the central server.`);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification(
        'Network Reconnected',
        'NetInfo detected device is back online. Checking for pending offline actions...',
        'info'
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification(
        'Low Connectivity Mode',
        'NetInfo detected offline status. Pending API actions will be stored in AsyncStorage until reconnected.',
        'info'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!prevOnlineRef.current && effectiveOnline && offlineQueue.length > 0) {
      handleSyncQueue();
    }
    prevOnlineRef.current = effectiveOnline;
  }, [effectiveOnline, offlineQueue.length]);

  useEffect(() => {
    loadAppJsCode().then((code) => setAppJsCode(code));
  }, []);

  const showNotification = (
    title: string,
    message: string,
    type: 'success' | 'info' = 'success'
  ) => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (currentLanguage === 'HI') {
        utterance.lang = 'hi-IN';
      } else if (currentLanguage === 'MR') {
        utterance.lang = 'mr-IN';
      } else {
        utterance.lang = 'en-US';
      }
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    window.localStorage.setItem('kabadiwala_connect_language', language);
  };

  const handleCopyAppJs = () => {
    if (appJsCode) {
      navigator.clipboard.writeText(appJsCode);
      setHasCopied(true);
      showNotification(
        'App.js Copied to Clipboard',
        'Paste this directly into your Expo project App.js file. It has all 4 screens & API wiring included.',
        'success'
      );
      setTimeout(() => setHasCopied(false), 2500);
    } else {
      loadAppJsCode().then((code) => {
        navigator.clipboard.writeText(code);
        setHasCopied(true);
        showNotification('App.js Copied!', 'All React Native code copied.', 'success');
        setTimeout(() => setHasCopied(false), 2500);
      });
    }
  };

  const handleLogout = () => {
    signOut();
    setAuthUser(null);
  };

  const handleLotCreatedFromScanner = (data: CreatedLotData) => {
    showNotification(
      'New Lot Created Successfully',
      `Lot ${data.lotId} created for ${data.material} (${data.weight}) in ${data.location}.`,
      'success'
    );
    handleSpeak(`Lot ${data.lotId} created for ${data.material} in ${data.location}`);
  };

  if (!authUser) {
    return (
      <LoginScreen
        onAuthenticated={setAuthUser}
        language={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  if (
    (authUser.role === 'COLLECTOR' || authUser.role === 'RECYCLER') &&
    authUser.verificationStatus !== 'approved'
  ) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
        <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-lg">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 font-bold">
            Notice
          </div>
          <h1 className="text-xl font-bold mt-5 text-slate-900">Verification {authUser.verificationStatus}</h1>
          <p className="text-slate-600 mt-3 text-xs leading-relaxed">
            Your {authUser.role === 'COLLECTOR' ? 'collector' : 'recycler'} account has been submitted for CPCB review. The full dashboard will unlock after approval.
          </p>
          <button onClick={handleLogout} className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold transition-colors border border-emerald-600">Sign out</button>
        </div>
      </main>
    );
  }

  const currentUserLocation = authUser.location || (
    currentRole === 'COLLECTOR'
      ? 'Ward 14, New Delhi'
      : currentRole === 'RECYCLER'
      ? 'Okhla Industrial Area, New Delhi'
      : 'Malviya Nagar, New Delhi'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Global Workbench Header */}
      <ExpoHeader
        currentRole={currentRole}
        onRoleChange={() => undefined}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenCodeViewer={() => setIsCodeModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        backendIp={backendIp}
        isOnline={effectiveOnline}
        isSimulatedOffline={isSimulatedOffline}
        offlineQueue={offlineQueue}
        onOpenOfflineQueue={() => setIsOfflineQueueOpen(true)}
        onSyncOfflineQueue={handleSyncQueue}
        isSyncingQueue={isSyncingQueue}
        authenticatedUser={authUser}
        onLogout={handleLogout}
      />

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-white rounded-xl border border-slate-200 shadow-xl p-3.5 flex items-start gap-3">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
              toast.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-blue-100 text-blue-800 border-blue-300'
            }`}
          >
            <CheckIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-slate-900">{toast.title}</div>
            <div className="text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">
              {toast.message}
            </div>
          </div>
        </div>
      )}

      {/* Main Stage Layout */}
      <main className="flex-1 p-4 md:p-6 flex justify-center items-start overflow-auto">
        {viewMode === 'phone' ? (
          /* Mobile Phone Frame */
          <div className="w-full max-w-[400px] bg-slate-900 p-3 rounded-2xl border border-slate-800 flex flex-col items-center shadow-xl">
            <div className="w-full flex items-center justify-between px-4 pt-1 pb-2 border-b border-slate-800 text-[11px] font-mono text-slate-300">
              <span>09:41</span>
              <span>KABADIWALA CONNECT</span>
              <span>5G 100%</span>
            </div>

            <div className="relative w-full bg-slate-50 rounded-xl overflow-hidden flex flex-col min-h-[640px] max-h-[700px] mt-2 border border-slate-700">
              <GlobalLoadingOverlay config={loadingOverlay} backendIp={backendIp} />

              <div className="bg-white px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    KC
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-tight">
                      Kabadiwala Connect
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <VoiceAssistant
                    language={currentLanguage}
                    onSpeak={handleSpeak}
                    onNotify={showNotification}
                  />
                  <NotificationButton
                    userId={authUser.uid}
                    role={currentRole}
                    language={currentLanguage}
                    onClick={() => setIsNotificationsOpen((open) => !open)}
                  />
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200"
                    title="Simulate Camera / File Upload Scanner"
                  >
                    <CameraIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <OfflineStatusBar
                isOnline={effectiveOnline}
                isSimulatedOffline={isSimulatedOffline}
                queue={offlineQueue}
                onOpenQueueModal={() => setIsOfflineQueueOpen(true)}
                onSyncNow={handleSyncQueue}
                isSyncing={isSyncingQueue}
                variant="mobile"
              />

              <div className="flex-1 overflow-y-auto p-4">
                {currentRole === 'USER' && (
                  <UserScreenView
                    currentUser={authUser}
                    forceNotificationsOpen={isNotificationsOpen}
                    language={currentLanguage}
                    backendIp={backendIp}
                    onOpenScanner={() => setIsScannerOpen(true)}
                    onNotify={showNotification}
                    onSpeak={handleSpeak}
                    onStartLoading={handleStartLoading}
                    onStopLoading={handleStopLoading}
                    isOnline={effectiveOnline}
                    onEnqueueOffline={handleEnqueueOffline}
                    userLocation={currentUserLocation}
                  />
                )}

                {currentRole === 'COLLECTOR' && (
                  <CollectorScreenView
                    currentUser={authUser}
                    forceNotificationsOpen={isNotificationsOpen}
                    language={currentLanguage}
                    backendIp={backendIp}
                    onOpenScanner={() => setIsScannerOpen(true)}
                    onNotify={showNotification}
                    onSpeak={handleSpeak}
                    onStartLoading={handleStartLoading}
                    onStopLoading={handleStopLoading}
                    isOnline={effectiveOnline}
                    onEnqueueOffline={handleEnqueueOffline}
                    offlineQueue={offlineQueue}
                    userLocation={currentUserLocation}
                  />
                )}

                {currentRole === 'RECYCLER' && (
                  <RecyclerScreenView
                    currentUser={authUser}
                    forceNotificationsOpen={isNotificationsOpen}
                    language={currentLanguage}
                    backendIp={backendIp}
                    onOpenScanner={() => setIsScannerOpen(true)}
                    onNotify={showNotification}
                    onSpeak={handleSpeak}
                    onStartLoading={handleStartLoading}
                    onStopLoading={handleStopLoading}
                    isOnline={effectiveOnline}
                    onEnqueueOffline={handleEnqueueOffline}
                  />
                )}

                {currentRole === 'ADMIN' && (
                  <AdminScreenView
                    currentUser={authUser}
                    forceNotificationsOpen={isNotificationsOpen}
                    onNotify={showNotification}
                    onSpeak={handleSpeak}
                    language={currentLanguage}
                  />
                )}
              </div>

              <div className="bg-slate-100 border-t border-slate-200 px-3 py-2 text-center text-[10px] font-bold text-slate-600">
                Signed in as {currentRole === 'ADMIN' ? 'CPCB Authority' : currentRole === 'USER' ? 'User' : currentRole === 'COLLECTOR' ? 'Collector' : 'Recycler'} ({currentUserLocation})
              </div>
            </div>
          </div>
        ) : viewMode === 'full' ? (
          /* Wide Desktop View */
          <div className="relative w-full max-w-6xl bg-white rounded-2xl p-6 border border-slate-200 shadow-md overflow-hidden">
            <GlobalLoadingOverlay config={loadingOverlay} backendIp={backendIp} />

            <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {currentRole === 'USER' && 'Citizen Scrap Booking'}
                  {currentRole === 'COLLECTOR' && 'Collector Field Duty'}
                  {currentRole === 'RECYCLER' && 'EcoCycle Scale Verification'}
                  {currentRole === 'ADMIN' && 'CPCB Circular Economy Ledger'}
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive portal with active Node.js API integration & location matching ({currentUserLocation})
                </p>
              </div>
            </div>

            <div className="w-full">
              {currentRole === 'USER' && (
                  <UserScreenView
                  currentUser={authUser}
                  forceNotificationsOpen={isNotificationsOpen}
                  language={currentLanguage}
                  backendIp={backendIp}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onNotify={showNotification}
                  onSpeak={handleSpeak}
                  onStartLoading={handleStartLoading}
                  onStopLoading={handleStopLoading}
                  isOnline={effectiveOnline}
                  onEnqueueOffline={handleEnqueueOffline}
                  userLocation={currentUserLocation}
                />
              )}

              {currentRole === 'COLLECTOR' && (
                  <CollectorScreenView
                  currentUser={authUser}
                  forceNotificationsOpen={isNotificationsOpen}
                  language={currentLanguage}
                  backendIp={backendIp}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onNotify={showNotification}
                  onSpeak={handleSpeak}
                  onStartLoading={handleStartLoading}
                  onStopLoading={handleStopLoading}
                  isOnline={effectiveOnline}
                  onEnqueueOffline={handleEnqueueOffline}
                  offlineQueue={offlineQueue}
                  userLocation={currentUserLocation}
                />
              )}

              {currentRole === 'RECYCLER' && (
                  <RecyclerScreenView
                  currentUser={authUser}
                  forceNotificationsOpen={isNotificationsOpen}
                  language={currentLanguage}
                  backendIp={backendIp}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onNotify={showNotification}
                  onSpeak={handleSpeak}
                  onStartLoading={handleStartLoading}
                  onStopLoading={handleStopLoading}
                  isOnline={effectiveOnline}
                  onEnqueueOffline={handleEnqueueOffline}
                />
              )}

              {currentRole === 'ADMIN' && (
                  <AdminScreenView
                  currentUser={authUser}
                  forceNotificationsOpen={isNotificationsOpen}
                  onNotify={showNotification}
                  onSpeak={handleSpeak}
                  language={currentLanguage}
                />
              )}
            </div>
          </div>
        ) : (
          /* Split View */
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[390px] bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="relative w-full bg-slate-50 rounded-xl overflow-hidden flex flex-col min-h-[600px] max-h-[680px]">
                  <GlobalLoadingOverlay config={loadingOverlay} backendIp={backendIp} />

                  <div className="bg-white px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {currentRole} Screen Preview
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      Live
                    </span>
                  </div>

                  <OfflineStatusBar
                    isOnline={effectiveOnline}
                    isSimulatedOffline={isSimulatedOffline}
                    queue={offlineQueue}
                    onOpenQueueModal={() => setIsOfflineQueueOpen(true)}
                    onSyncNow={handleSyncQueue}
                    isSyncing={isSyncingQueue}
                    variant="mobile"
                  />

                  <div className="flex-1 overflow-y-auto p-3">
                    {currentRole === 'USER' && (
                        <UserScreenView
                        currentUser={authUser}
                        forceNotificationsOpen={isNotificationsOpen}
                        language={currentLanguage}
                        backendIp={backendIp}
                        onOpenScanner={() => setIsScannerOpen(true)}
                        onNotify={showNotification}
                        onSpeak={handleSpeak}
                        onStartLoading={handleStartLoading}
                        onStopLoading={handleStopLoading}
                        isOnline={effectiveOnline}
                        onEnqueueOffline={handleEnqueueOffline}
                        userLocation={currentUserLocation}
                      />
                    )}
                    {currentRole === 'COLLECTOR' && (
                      <CollectorScreenView
                        currentUser={authUser}
                        forceNotificationsOpen={isNotificationsOpen}
                        language={currentLanguage}
                        backendIp={backendIp}
                        onOpenScanner={() => setIsScannerOpen(true)}
                        onNotify={showNotification}
                        onSpeak={handleSpeak}
                        onStartLoading={handleStartLoading}
                        onStopLoading={handleStopLoading}
                        isOnline={effectiveOnline}
                        onEnqueueOffline={handleEnqueueOffline}
                        offlineQueue={offlineQueue}
                        userLocation={currentUserLocation}
                      />
                    )}
                    {currentRole === 'RECYCLER' && (
                      <RecyclerScreenView
                        currentUser={authUser}
                        forceNotificationsOpen={isNotificationsOpen}
                        language={currentLanguage}
                        backendIp={backendIp}
                        onOpenScanner={() => setIsScannerOpen(true)}
                        onNotify={showNotification}
                        onSpeak={handleSpeak}
                        onStartLoading={handleStartLoading}
                        onStopLoading={handleStopLoading}
                        isOnline={effectiveOnline}
                        onEnqueueOffline={handleEnqueueOffline}
                      />
                    )}
                    {currentRole === 'ADMIN' && (
                      <AdminScreenView
                        currentUser={authUser}
                        forceNotificationsOpen={isNotificationsOpen}
                        onNotify={showNotification}
                        onSpeak={handleSpeak}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 text-slate-900 flex flex-col h-[650px] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileCodeIcon className="w-4 h-4 text-emerald-600" />
                  <span className="font-mono font-bold text-xs text-slate-900">
                    App.js (Unified React Native File)
                  </span>
                </div>

                <button
                  onClick={handleCopyAppJs}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-600 transition-colors"
                >
                  {hasCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? 'Copied!' : 'Copy App.js'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto mt-3 bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-100 border border-slate-800">
                <pre>
                  <code>{appJsCode}</code>
                </pre>
              </div>

              <div className="pt-3 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Copy and paste into any Expo project</span>
                <span className="text-emerald-700 font-bold">100% Native Components</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        userLocation={currentUserLocation}
        onScanComplete={handleLotCreatedFromScanner}
      />

      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendIp={backendIp}
        onSaveIp={(ip) => {
          setBackendIp(ip);
          showNotification('Backend IP Updated', `Now pointing to http://${ip}`, 'info');
        }}
      />

      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        code={appJsCode}
      />

      <OfflineQueueModal
        isOpen={isOfflineQueueOpen}
        onClose={() => setIsOfflineQueueOpen(false)}
        queue={offlineQueue}
        isOnline={effectiveOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulateOffline={() => {
          setIsSimulatedOffline((prev) => {
            const next = !prev;
            showNotification(
              next ? 'Simulating Low Connectivity' : 'Reconnected to Network',
              next
                ? 'Simulated offline mode enabled. All collection requests will queue in AsyncStorage.'
                : 'Simulated network restored. NetInfo will trigger automatic queue sync.',
              'info'
            );
            return next;
          });
        }}
        onSyncQueue={handleSyncQueue}
        onClearQueue={handleClearQueue}
        onRemoveItem={handleRemoveFromQueue}
        isSyncing={isSyncingQueue}
      />
    </div>
  );
}
