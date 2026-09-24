import React, { useState } from "react";

import { Language, ManifestItem } from "../types";
import { AuthUser } from "../auth/auth";

import { INITIAL_MANIFESTS, TRANSLATION_MAP } from "../data/mockData";

import { LOCALES } from "../i18n/locales";
import { NotificationsPanel } from "./WorkflowUI";

import {
  VolumeIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  CameraIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  UserIcon,
  BarChartIcon,
  ShieldIcon,
  TruckIcon,
  RecyclerIcon,
  FileTextIcon,
  BellIcon,
} from "./icons/Icons";

interface RecyclerScreenViewProps {
  currentUser: AuthUser;
  language: Language;
  backendIp: string;
  onOpenScanner: () => void;

  onNotify: (title: string, msg: string, type?: "success" | "info") => void;

  onSpeak: (text: string) => void;

  onStartLoading?: (config: {
    title: string;
    subtitle?: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
  }) => void;

  onStopLoading?: () => void;

  isOnline?: boolean;

  onEnqueueOffline?: (request: {
    title: string;
    method: "POST" | "PUT";
    endpoint: string;
    payload: any;
    screen: "USER" | "COLLECTOR" | "RECYCLER";
    description: string;
  }) => void;
}

type RecyclerTab =
  | "OVERVIEW"
  | "INCOMING"
  | "COLLECTORS"
  | "PROCESSING"
  | "TRANSACTIONS"
  | "NOTIFICATIONS";

export const RecyclerScreenView: React.FC<RecyclerScreenViewProps> = ({
  currentUser,
  language,
  backendIp,
  onOpenScanner,
  onNotify,
  onSpeak,
  onStartLoading,
  onStopLoading,
  isOnline = true,
  onEnqueueOffline,
}) => {
  const [activeTab, setActiveTab] = useState<RecyclerTab>("OVERVIEW");

  const [calibratedWeight, setCalibratedWeight] = useState<number>(48.5);

  const [ratePerKg] = useState<number>(65.0);

  const [scaleTare] = useState<number>(2.5);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // ORIGINAL DEMO DATA — PRESERVED
  const [incomingLots] = useState<ManifestItem[]>(INITIAL_MANIFESTS);

  const t = LOCALES[language] || LOCALES.EN;

  const tMap = TRANSLATION_MAP[language] || TRANSLATION_MAP.EN;

  const grossWeight = (calibratedWeight + scaleTare).toFixed(2);

  const netWeight = calibratedWeight.toFixed(2);

  const grossTotal = (calibratedWeight * ratePerKg).toFixed(2);

  const variancePercent = "+1.04%";

  const handleVerifyWeightAndPay = async () => {
    setIsVerifying(true);

    const lotId = "8841";

    const targetUrl = `http://${backendIp}/api/lots/${lotId}/recycle`;

    const payload = {
      lotId: "#LOT-2024-8841",
      facilityId: "FAC-OKHLA-04",
      facilityName: "EcoCycle Hub #04",
      scaleId: "METTLER-BT-9",
      calibratedWeightKg: parseFloat(netWeight),
      ratePerKg,
      totalPayout: parseFloat(grossTotal),
      status: "VERIFIED_AND_PAID",
      cpcbCertificateId: "EPR-DEL-9941",
      processedAt: new Date().toISOString(),
    };

    if (!isOnline) {
      onEnqueueOffline?.({
        title: `Verify & Settle Lot #LOT-2024-8841`,

        method: "PUT",

        endpoint: targetUrl,

        payload,

        screen: "RECYCLER",

        description: `Verified ${netWeight} KG PCBs. Disbursing RS ${grossTotal} to Ramesh Kumar (FAC-OKHLA-04)`,
      });

      setIsVerifying(false);

      setIsCompleted(true);

      onNotify(
        "Saved to Offline Queue (No Signal)",
        `Lot verification and RS ${grossTotal} settlement stored in AsyncStorage. Will auto-sync on reconnect.`,
        "info",
      );

      onSpeak("Lot settlement saved offline in AsyncStorage.");

      return;
    }

    onStartLoading?.({
      title: "Verifying Weight & Minting EPR...",

      subtitle: `Validating scale net weight (${netWeight} KG) & generating CPCB Certificate EPR-DEL-9941`,

      method: "PUT",

      endpoint: targetUrl,
    });

    try {
      const res = await fetch(targetUrl, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      setIsVerifying(false);

      setIsCompleted(true);

      onStopLoading?.();

      onNotify(
        "Weight Verified & Instant Payment Sent",
        `PUT ${targetUrl} (HTTP ${res.status}). Disbursed RS ${grossTotal} to Ramesh Kumar via UPI. Issued EPR-DEL-9941.`,
        "success",
      );

      onSpeak(
        `Weight verified at ${netWeight} KG. Instant payment of RS ${grossTotal} sent. Certificate EPR-DEL-9941 generated.`,
      );
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setIsVerifying(false);

      setIsCompleted(true);

      onStopLoading?.();

      onNotify(
        "Weight Verified (Demo Mode)",
        `PUT ${targetUrl}\nPayout: RS ${grossTotal} to Ramesh Kumar.\n(Backend offline, verified in local ledger)`,
        "info",
      );

      onSpeak(
        `Weight verified: ${netWeight} kilograms. Payment of RS ${grossTotal} processed.`,
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12 text-slate-900 w-full">
      {/* HUB HEADER */}

      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
            RC
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                EcoCycle Hub #04
              </h3>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                CPCB Authorized
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Okhla Industrial Area Phase 1, Jalgaon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onSpeak(
                "EcoCycle Hub Number 4. Active inbound lot 8841 from Ramesh Kumar ready for scale verification.",
              )
            }
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200 shrink-0"
          >
            <VolumeIcon className="w-4 h-4" />
          </button>

          {/* NOTIFICATION BUTTON */}

          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0"
            aria-label={t.notifications}
          >
            <BellIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RECYCLER NAVIGATION */}

      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm scrollbar-none">
        {[
          {
            id: "OVERVIEW",
            label: t.overview,
            icon: BarChartIcon,
          },

          {
            id: "INCOMING",
            label: t.incomingLots,
            icon: ShieldIcon,
          },

          {
            id: "COLLECTORS",
            label: t.collectors,
            icon: TruckIcon,
          },

          {
            id: "PROCESSING",
            label: t.processing,
            icon: RecyclerIcon,
          },

          {
            id: "TRANSACTIONS",
            label: t.transactionHistory,
            icon: FileTextIcon,
          },

          {
            id: "NOTIFICATIONS",
            label: t.notifications,
            icon: BellIcon,
          },
        ].map((tab) => {
          const IconComp = tab.icon;

          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RecyclerTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />

              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}

      {activeTab === "OVERVIEW" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.totalLots}
              </div>

              <div className="text-l font-black text-slate-900 mt-0.5">
                {incomingLots.length}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.incomingLots}
              </div>

              <div className="text-l font-black text-emerald-700 mt-0.5">
                1 Active
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.completedTransactions}
              </div>

              <div className="text-l font-black text-slate-900 mt-0.5">
                {incomingLots.filter((l) => l.status === "Completed").length}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.totalQuantity}
              </div>

              <div className="text-l font-black text-emerald-700 mt-0.5">
                9.8 MT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INCOMING LOTS */}

      {(activeTab === "INCOMING" || activeTab === "OVERVIEW") && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {tMap.inboundLot}
                </span>

                <span className="text-[10px] text-slate-500">
                  Arrived 10:42 AM
                </span>
              </div>

              <div className="font-black text-lg text-slate-900 mt-1">
                #LOT-2024-8841
              </div>
            </div>

            <button
              onClick={() =>
                onSpeak(
                  "Inbound Lot 8841. Collector Ramesh Kumar. Material: E-Waste PCBs. Est 48 kg.",
                )
              }
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200 shrink-0"
            >
              <VolumeIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div
              onClick={onOpenScanner}
              className="w-14 h-14 bg-white border border-slate-300 rounded-lg p-1 shrink-0 cursor-pointer flex flex-col items-center justify-center"
              title="Tap to simulate camera scan"
            >
              <div className="w-full h-full bg-slate-900 rounded grid grid-cols-3 gap-0.5 p-1">
                <div className="bg-emerald-400" />
                <div className="bg-slate-500" />
                <div className="bg-emerald-400" />

                <div className="bg-slate-500" />
                <div className="bg-emerald-400" />
                <div className="bg-slate-500" />

                <div className="bg-emerald-400" />
                <div className="bg-slate-500" />
                <div className="bg-emerald-400" />
              </div>
            </div>

            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-900">
                Chain of Custody Verified
              </div>

              <div className="text-[11px] text-slate-500 mt-0.5">
                Citizen: Pooja Sharma (Ward 14)
              </div>

              <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                <UserIcon className="w-3 h-3 text-emerald-600" />

                <span>Collector: Ramesh Kumar (#KBD-9412)</span>
              </div>
            </div>

            <button
              onClick={onOpenScanner}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-emerald-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors shrink-0"
            >
              <CameraIcon className="w-3.5 h-3.5" />

              <span>Scan</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900 text-xs font-medium">
            <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />

            <span>{tMap.cpcbProtocol}: High-grade printed circuit boards</span>
          </div>
        </div>
      )}

      {/* PROCESSING */}

      {(activeTab === "PROCESSING" || activeTab === "OVERVIEW") && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />

              <span className="font-bold text-xs text-slate-900">
                Connected: Mettler Toledo BT-9 Scale
              </span>
            </div>

            <button
              onClick={() =>
                onSpeak(`Digital scale reading is ${netWeight} kilograms net.`)
              }
              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200 shrink-0"
            >
              <VolumeIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-emerald-950 text-white p-4 rounded-xl flex flex-col items-center justify-center border border-emerald-900">
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-emerald-300">
              <span>STABLE CALIBRATED</span>

              <span>TARE: {scaleTare} KG</span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
                {netWeight}
              </span>

              <span className="text-xs font-bold text-emerald-200">KG NET</span>
            </div>

            <div className="w-full flex items-center justify-between pt-2 border-t border-emerald-900 text-[11px] text-emerald-300">
              <span>Gross: {grossWeight} KG</span>

              <span className="font-bold">
                Variance: {variancePercent} (OK)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
            <button
              onClick={() =>
                setCalibratedWeight((w) => Math.max(1, +(w - 0.5).toFixed(2)))
              }
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100"
            >
              - 0.5 KG
            </button>

            <span className="text-xs text-slate-500 font-medium">
              Fine Calibrate Weight
            </span>

            <button
              onClick={() => setCalibratedWeight((w) => +(w + 0.5).toFixed(2))}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100"
            >
              + 0.5 KG
            </button>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  TOTAL PAYOUT TO RAMESH KUMAR
                </span>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-950">
                    RS {grossTotal}
                  </span>

                  <span className="text-xs font-bold text-emerald-800">
                    Instant UPI Auto-Pay
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-emerald-900 font-medium">
              Calculation: {netWeight} KG at RS {ratePerKg.toFixed(2)}/KG
              (High-Grade PCBs)
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleVerifyWeightAndPay}
              disabled={isVerifying || isCompleted}
              className={`w-full sm:w-auto h-12 rounded-xl text-white font-bold text-xs flex items-center justify-between px-5 border transition-colors ${
                isCompleted
                  ? "bg-emerald-700 border-emerald-700"
                  : "bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {isVerifying ? (
                  <RefreshIcon className="w-4 h-4 animate-spin" />
                ) : isCompleted ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <ShieldCheckIcon className="w-4 h-4" />
                )}

                <span>
                  {isCompleted
                    ? "Verified & Paid (EPR Issued)"
                    : tMap.verifyWeightBtn}
                </span>
              </div>

              <ArrowRightIcon className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              {tMap.autoDisburseNotice}
            </p>
          </div>
        </div>
      )}

      {/* COLLECTORS */}

      {activeTab === "COLLECTORS" && (
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900">
            {t.collectors}
          </h3>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">
                Ramesh Kumar (#KBD-9412)
              </div>

              <div className="text-[10px] text-slate-500">
                Ward 14, Jalgaon• 48.50 KG PCBs Delivered
              </div>
            </div>

            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
              Verified
            </span>
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}

      {activeTab === "TRANSACTIONS" && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">
            {t.transactionHistory}
          </h3>

          <div className="space-y-2">
            {incomingLots.map((l) => (
              <div
                key={l.lotId}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {l.material} ({l.weight})
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {l.lotId} • Cert: {l.certId}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-700">
                    {l.payout}
                  </div>

                  <div className="text-[10px] text-slate-500">EPR Minted</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS — ONLY NEW FEATURE */}

      {activeTab === "NOTIFICATIONS" && (
        <NotificationsPanel
          userId={currentUser.uid}
          role="RECYCLER"
          language={language}
        />
      )}
    </div>
  );
};
