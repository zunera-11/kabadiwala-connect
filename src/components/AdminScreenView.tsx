import React, { useEffect, useState } from "react";
import { ManifestItem, Language } from "../types";
import { AuthUser } from "../auth/auth";
import { INITIAL_MANIFESTS } from "../data/mockData";
import { LOCALES } from "../i18n/locales";
import { formatLocation } from "../data/workflowStore";
import {
  NotificationsPanel,
  StatusBadge,
  useWorkflowSnapshot,
} from "./WorkflowUI";
import {
  VolumeIcon,
  ShieldIcon,
  SearchIcon,
  DownloadIcon,
  ClockIcon,
  CheckIcon,
  TruckIcon,
  RecyclerIcon,
  BarChartIcon,
  TrendingUpIcon,
  UsersIcon,
  FileTextIcon,
} from "./icons/Icons";

interface AdminScreenViewProps {
  currentUser?: AuthUser;
  forceNotificationsOpen?: boolean;
  onNotify: (title: string, msg: string, type?: "success" | "info") => void;
  onSpeak: (text: string) => void;
  language?: Language;
}

type AdminTab =
  | "OVERVIEW"
  | "LOTS"
  | "COLLECTORS"
  | "RECYCLERS"
  | "TRANSACTIONS"
  | "ANALYTICS"
  | "NOTIFICATIONS";

interface CollectorUser {
  id: string;
  name: string;
  area: string;
  lotsCount: number;
  totalWeight: string;
  status: "Verified" | "Pending Verification";
}

interface RecyclerHub {
  id: string;
  name: string;
  area: string;
  lotsReceived: number;
  totalProcessed: string;
  status: "Verified" | "Pending Verification";
}

const INITIAL_COLLECTORS: CollectorUser[] = [
  {
    id: "#KBD-9412",
    name: "Ramesh Kumar",
<<<<<<< HEAD
    area: "Ward 14, Jalgaon",
=======
    area: "Ward 14, New Delhi",
>>>>>>> accfd2b (Improve admin dashboard responsiveness)
    lotsCount: 142,
    totalWeight: "3.45 MT",
    status: "Verified",
  },
  {
    id: "#KBD-8104",
    name: "Vikram Singh",
    area: "Sector B, Vasant Kunj",
    lotsCount: 98,
    totalWeight: "2.10 MT",
    status: "Verified",
  },
  {
    id: "#KBD-7731",
    name: "Mohan Lal",
    area: "Hauz Khas Enclave",
    lotsCount: 115,
    totalWeight: "2.80 MT",
    status: "Verified",
  },
  {
    id: "#KBD-6021",
    name: "Suresh Patil",
    area: "Block C, Saket",
    lotsCount: 0,
    totalWeight: "0.00 MT",
    status: "Pending Verification",
  },
];

const INITIAL_RECYCLERS: RecyclerHub[] = [
  {
    id: "#HUB-04",
    name: "EcoCycle Hub #04",
    area: "Okhla Ind. Area Phase 1",
    lotsReceived: 412,
    totalProcessed: "9.80 MT",
    status: "Verified",
  },
  {
    id: "#HUB-02",
    name: "GreenEarth Refiners #02",
    area: "Bawana Industrial Park",
    lotsReceived: 280,
    totalProcessed: "6.40 MT",
    status: "Verified",
  },
  {
    id: "#HUB-08",
    name: "Re-Polymer Units #08",
    area: "Narela Clean Zone",
    lotsReceived: 195,
    totalProcessed: "4.20 MT",
    status: "Verified",
  },
  {
    id: "#HUB-11",
    name: "Apex Metals Smelter",
    area: "Mayapuri Phase 2",
    lotsReceived: 0,
    totalProcessed: "0.00 MT",
    status: "Pending Verification",
  },
];

export const AdminScreenView: React.FC<AdminScreenViewProps> = ({
  currentUser,
  forceNotificationsOpen,
  onNotify,
  onSpeak,
  language = "EN",
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");

  const [manifests] = useState<ManifestItem[]>(INITIAL_MANIFESTS);

  const [collectors, setCollectors] =
    useState<CollectorUser[]>(INITIAL_COLLECTORS);

  const [recyclers, setRecyclers] = useState<RecyclerHub[]>(INITIAL_RECYCLERS);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedFilter, setSelectedFilter] = useState<
    "All" | "Completed" | "Pending"
  >("All");

  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly" | "Yearly">(
    "Monthly",
  );

  const [selectedLotModal, setSelectedLotModal] = useState<ManifestItem | null>(
    null,
  );

  const t = LOCALES[language] || LOCALES.EN;
  const workflow = useWorkflowSnapshot();

  useEffect(() => {
    if (forceNotificationsOpen) {
      setActiveTab("NOTIFICATIONS");
    }
  }, [forceNotificationsOpen]);

  // =========================
  // DYNAMIC METRICS
  // =========================

  const totalLotsCount = 1248 + manifests.length + workflow.wasteLots.length;

  const verifiedCollectorsCount = collectors.filter(
    (c) => c.status === "Verified",
  ).length;

  const pendingCollectorsCount = collectors.filter(
    (c) => c.status === "Pending Verification",
  ).length;

  const verifiedRecyclersCount = recyclers.filter(
    (r) => r.status === "Verified",
  ).length;

  const pendingRecyclersCount = recyclers.filter(
    (r) => r.status === "Pending Verification",
  ).length;

  const totalCitizensCount = 5120;

  const totalTransactionsCount =
    2516 + workflow.pickupRequests.length + workflow.wasteLots.length;

  const pendingVerificationsTotal =
    pendingCollectorsCount + pendingRecyclersCount + 8;

  const completedTransactionsCount =
    totalTransactionsCount - pendingVerificationsTotal;

  // =========================
  // APPROVAL HANDLERS
  // =========================

  const handleApproveCollector = (id: string) => {
    setCollectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Verified" } : c)),
    );

    onNotify(
      "Collector Approved",
      `Collector ${id} verified and active on duty.`,
      "success",
    );
  };

  const handleApproveRecycler = (id: string) => {
    setRecyclers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Verified" } : r)),
    );

    onNotify(
      "Recycler Facility Approved",
      `Facility ${id} authorized for EPR intake.`,
      "success",
    );
  };

  // =========================
  // FILTERED MANIFESTS
  // =========================

  const filteredManifests = manifests.filter((m) => {
    const query = searchTerm.toLowerCase();

    const matchSearch =
      m.lotId.toLowerCase().includes(query) ||
      m.citizen.toLowerCase().includes(query) ||
      m.collector.toLowerCase().includes(query) ||
      m.material.toLowerCase().includes(query) ||
      m.hub.toLowerCase().includes(query);

    if (selectedFilter === "Completed") {
      return matchSearch && m.status === "Completed";
    }

    if (selectedFilter === "Pending") {
      return matchSearch && m.status !== "Completed";
    }

    return matchSearch;
  });

  return (
    <div className="flex flex-col gap-4 pb-12 text-slate-900 w-full min-w-0 overflow-x-hidden">
      {/* ========================================================= */}
      {/* OFFICIAL CPCB HEADER */}
      {/* ========================================================= */}

      <div className="bg-emerald-950 text-white rounded-2xl p-3 sm:p-4 md:p-5 border border-emerald-900 flex flex-col gap-4 shadow-md min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center border border-emerald-700 font-bold shrink-0">
              <ShieldIcon className="w-5 h-5 text-emerald-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-extrabold text-xs sm:text-sm md:text-base text-white tracking-tight truncate">
                  CPCB Circular Economy Ledger
                </h2>

                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700 text-[10px] font-bold whitespace-nowrap">
                  CPCB Authority
                </span>
              </div>

              <p className="text-[10px] sm:text-xs text-emerald-200 break-words">
                National E-Waste Traceability & Recycler Oversight System
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              onSpeak(
                `Central Pollution Control Board circular economy ledger. ${totalLotsCount} lots processed with zero audit discrepancies.`,
              )
            }
            className="w-8 h-8 rounded-xl bg-emerald-900 text-emerald-300 hover:text-white flex items-center justify-center border border-emerald-800 shrink-0"
            title="Read Summary"
          >
            <VolumeIcon className="w-4 h-4" />
          </button>
        </div>

        {/* CPCB NAVIGATION */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-emerald-900 scrollbar-none min-w-0">
          {[
            {
              id: "OVERVIEW",
              label: t.overview,
              icon: BarChartIcon,
            },
            {
              id: "LOTS",
              label: t.lotManagement,
              icon: ShieldIcon,
            },
            {
              id: "COLLECTORS",
              label: t.collectors,
              icon: TruckIcon,
            },
            {
              id: "RECYCLERS",
              label: t.recyclers,
              icon: RecyclerIcon,
            },
            {
              id: "TRANSACTIONS",
              label: t.transactionHistory,
              icon: FileTextIcon,
            },
            {
              id: "ANALYTICS",
              label: t.analyticsReports,
              icon: TrendingUpIcon,
            },
            {
              id: "NOTIFICATIONS",
              label: t.notifications,
              icon: ClockIcon,
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-emerald-900/50 text-emerald-200 border-emerald-800/80 hover:bg-emerald-900"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================= */}

      {activeTab === "OVERVIEW" && (
        <div className="space-y-4 min-w-0">
          {/* ===================================================== */}
          {/* METRIC CARDS */}
          {/* ===================================================== */}

          <div
            className="
              grid
              grid-cols-2
<<<<<<< HEAD
              lg:grid-cols-4
=======
              lg:grid-cols-2
>>>>>>> accfd2b (Improve admin dashboard responsiveness)
              gap-2
              sm:gap-3
              min-w-0
            "
          >
            {/* TOTAL LOTS */}
            <div className="min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.totalLots}
                </span>

                <ShieldIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 break-words">
                {totalLotsCount.toLocaleString()}
              </div>

              <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1 break-words leading-tight">
                100% QR Traceable
              </div>
            </div>

            {/* TOTAL COLLECTORS */}
            <div className="min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.totalCollectors}
                </span>

                <TruckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 break-words">
                {verifiedCollectorsCount + pendingCollectorsCount}
              </div>

              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 break-words leading-tight">
                <span className="text-emerald-600 font-bold">
                  {verifiedCollectorsCount} Verified
                </span>{" "}
                • {pendingCollectorsCount} Pending
              </div>
            </div>

            {/* TOTAL RECYCLERS */}
            <div className="min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.totalRecyclers}
                </span>

                <RecyclerIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 break-words">
                {verifiedRecyclersCount + pendingRecyclersCount}
              </div>

              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 break-words leading-tight">
                <span className="text-emerald-600 font-bold">
                  {verifiedRecyclersCount} Verified
                </span>{" "}
                • {pendingRecyclersCount} Pending
              </div>
            </div>

            {/* TOTAL CITIZENS */}
            <div className="min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.totalCitizens}
                </span>

                <UsersIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 break-words">
                {totalCitizensCount.toLocaleString()}
              </div>

              <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1 break-words leading-tight">
                Active Households
              </div>
            </div>

            {/* TOTAL TRANSACTIONS */}
            <div className="min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.totalTransactions}
                </span>

                <BarChartIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 break-words">
                {totalTransactionsCount.toLocaleString()}
              </div>

              <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-1 break-words leading-tight">
                Direct Bank Payouts
              </div>
            </div>

            {/* PENDING VERIFICATIONS */}
            <div className="min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-1 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.pendingVerifications}
                </span>

                <ClockIcon className="w-4 h-4 text-amber-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-2 break-words">
                {pendingVerificationsTotal}
              </div>

              <div className="text-[10px] sm:text-[11px] text-amber-700 font-medium mt-1 break-words leading-tight">
                Action Required
              </div>
            </div>

            {/* COMPLETED TRANSACTIONS
                Mobile: spans both columns
                Desktop: spans 2 columns
            */}
            <div className="col-span-2 lg:col-span-2 min-w-0 overflow-hidden bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2 text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wide min-w-0">
                <span className="min-w-0 break-words leading-tight">
                  {t.completedTransactions}
                </span>

                <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2 break-words">
                {completedTransactionsCount.toLocaleString()}
              </div>

              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 break-words leading-tight">
                100% CPCB Audited Certificate Issued
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* WORKFLOW SUMMARY CARDS */}
          {/* ===================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
            <div className="min-w-0 overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-500 break-words">
                {t.collectionRequests}
              </div>

              <div className="text-2xl font-black text-slate-900 mt-1 break-words">
                {workflow.pickupRequests.length}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-500 break-words">
                {t.activeLots}
              </div>

              <div className="text-2xl font-black text-emerald-700 mt-1 break-words">
                {
                  workflow.wasteLots.filter((lot) => lot.status !== "COMPLETED")
                    .length
                }
              </div>
            </div>

            <div className="min-w-0 overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-500 break-words">
                {t.dispatchTransport}
              </div>

              <div className="text-2xl font-black text-slate-900 mt-1 break-words">
                {
                  workflow.wasteLots.filter(
                    (lot) => lot.status === "TRANSPORT_DISPATCHED",
                  ).length
                }
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* TRACEABILITY SUMMARY */}
          {/* ===================================================== */}

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 min-w-0">
              <ShieldIcon className="w-4 h-4 text-emerald-600 shrink-0" />

              <span className="min-w-0 break-words">
                National Traceability Chain Summary
              </span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed break-words">
              Every waste lot created by citizens or collectors is stored with a
              unique Lot ID (`LOT-2026-XXXX`). Material handovers require
              digital weight calibration at CPCB certified recycling hubs before
              releasing instant UPI payouts and EPR certificates.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <button
                onClick={() => setActiveTab("LOTS")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors border border-emerald-600"
              >
                Inspect All Registered Lots
              </button>

              <button
                onClick={() => setActiveTab("ANALYTICS")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition-colors border border-slate-200"
              >
                View Analytics Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOTS / TRANSACTIONS */}
      {/* ========================================================= */}

      {(activeTab === "LOTS" || activeTab === "TRANSACTIONS") && (
        <div className="space-y-3 min-w-0">
          {workflow.wasteLots.length > 0 && (
            <div className="space-y-3 min-w-0">
              {workflow.wasteLots.map((lot) => (
                <div
                  key={lot.id}
                  className="bg-white rounded-2xl p-4 border border-emerald-200 flex flex-col gap-3 shadow-sm min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-mono font-extrabold text-sm text-emerald-700 break-all min-w-0">
                      {lot.lotId}
                    </span>

                    <StatusBadge status={lot.status} language={language} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-emerald-50/60 text-[11px] border border-emerald-100 min-w-0">
                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">
                        {t.requestId}
                      </div>
                      <div className="font-bold text-slate-900 break-words">
                        {lot.requestId || "-"}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">
                        {t.collector}
                      </div>
                      <div className="font-bold text-slate-900 break-words">
                        {lot.collectorName}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">
                        {t.recycler}
                      </div>
                      <div className="font-bold text-slate-900 break-words">
                        {lot.recyclerName || t.pending}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">
                        {t.pickupLocation}
                      </div>
                      <div className="font-bold text-slate-900 break-words">
                        {formatLocation(lot.location)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SEARCH / FILTER */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm min-w-0 overflow-hidden">
            <div className="relative w-full md:w-96 min-w-0">
              <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Lot ID, Citizen, Collector, Recycler..."
                className="w-full min-w-0 pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

<<<<<<< HEAD
            <div className="flex items-center justify-between w-full md:w-auto gap-2 min-w-0">
              <div className="flex gap-1 min-w-0">
=======
            <div className="flex items-center w-full md:w-auto gap-2 min-w-0 overflow-x-auto">
              <div className="flex gap-1 shrink-0">
>>>>>>> accfd2b (Improve admin dashboard responsiveness)
                {(["All", "Completed", "Pending"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border whitespace-nowrap ${
                      selectedFilter === filter
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {filter === "All"
                      ? t.all
                      : filter === "Completed"
                        ? t.completed
                        : t.pending}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  onNotify(
                    "Ledger Export",
                    "Exporting CPCB CSV manifest audit report...",
                    "info",
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold hover:bg-emerald-100 whitespace-nowrap shrink-0"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>{t.csvExport}</span>
              </button>
            </div>
          </div>

          {/* MANIFEST LIST */}
          <div className="flex flex-col gap-3 min-w-0">
            {filteredManifests.map((item) => (
              <div
                key={item.lotId}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-3 shadow-sm hover:border-emerald-300 transition-colors min-w-0 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-extrabold text-sm text-emerald-700 break-all">
                        {item.lotId}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                          item.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 min-w-0">
                      <ClockIcon className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="break-words">{item.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 min-w-0">
                    <div className="text-right min-w-0">
                      <div className="text-base font-black text-emerald-700 break-words">
                        {item.payout}
                      </div>

                      <div className="text-[10px] text-slate-500 break-words">
                        {item.payoutType}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLotModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                    >
                      View History
                    </button>
                  </div>
                </div>

                {/* TRACEABILITY FLOW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 text-[11px] border border-slate-200 min-w-0">
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">
                      1. Citizen
                    </div>

                    <div className="font-bold text-slate-900 break-words">
                      {item.citizen}
                    </div>

                    <div className="text-[10px] text-slate-500 break-words">
                      {item.location}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">
                      2. Collector
                    </div>

                    <div className="font-bold text-slate-900 break-words">
                      {item.collector}
                    </div>

                    <div className="text-[10px] text-emerald-700 font-mono break-all">
                      {item.collectorId}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">
                      3. Recycler Hub
                    </div>

                    <div className="font-bold text-slate-900 break-words">
                      {item.hub}
                    </div>

                    <div className="text-[10px] text-slate-500 break-words">
                      {item.hubArea}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100 min-w-0">
                  <div className="min-w-0 break-words">
                    <span className="font-bold text-slate-900">
                      {item.material}
                    </span>

                    <span className="text-slate-500 ml-1.5">{item.weight}</span>
                  </div>

                  <div className="text-[11px] font-mono text-emerald-800 font-bold break-all">
                    Cert: {item.certId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COLLECTORS */}
      {/* ========================================================= */}

      {activeTab === "COLLECTORS" && (
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1 gap-2 min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 break-words">
              Collector Roster & Verification
            </h3>

            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
              {collectors.length} Total Collectors
            </span>
          </div>

          <div className="space-y-2 min-w-0">
            {collectors.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm min-w-0 overflow-hidden"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                    <TruckIcon className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 break-words">
                        {c.name}
                      </span>

                      <span className="font-mono text-xs text-emerald-700 font-bold break-all">
                        {c.id}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.status === "Verified"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 break-words">
                      {c.area}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-1 font-medium break-words">
                      Total Handled:{" "}
                      <span className="font-bold text-slate-900">
                        {c.totalWeight}
                      </span>{" "}
                      ({c.lotsCount} Lots)
                    </div>
                  </div>
                </div>

                {c.status === "Pending Verification" ? (
                  <button
                    onClick={() => handleApproveCollector(c.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-600 transition-colors shrink-0"
                  >
                    Approve Verification
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-center whitespace-nowrap">
                    Active & Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RECYCLERS */}
      {/* ========================================================= */}

      {activeTab === "RECYCLERS" && (
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1 gap-2 min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 break-words">
              Authorized Recycling Hubs
            </h3>

            <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
              {recyclers.length} Facilities
            </span>
          </div>

          <div className="space-y-2 min-w-0">
            {recyclers.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm min-w-0 overflow-hidden"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                    <RecyclerIcon className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 break-words">
                        {r.name}
                      </span>

                      <span className="font-mono text-xs text-emerald-700 font-bold break-all">
                        {r.id}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          r.status === "Verified"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 break-words">
                      {r.area}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-1 font-medium break-words">
                      Processed:{" "}
                      <span className="font-bold text-slate-900">
                        {r.totalProcessed}
                      </span>{" "}
                      ({r.lotsReceived} Intake Lots)
                    </div>
                  </div>
                </div>

                {r.status === "Pending Verification" ? (
                  <button
                    onClick={() => handleApproveRecycler(r.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs border border-emerald-600 transition-colors shrink-0"
                  >
                    Authorize Facility
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-center whitespace-nowrap">
                    CPCB EPR Certified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ANALYTICS */}
      {/* ========================================================= */}

      {activeTab === "ANALYTICS" && (
        <div className="space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm min-w-0 overflow-hidden">
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-slate-900 break-words">
                E-Waste Recycling Analytics
              </h3>

              <p className="text-xs text-slate-500 break-words">
                Aggregated database statistics over time
              </p>
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
              {(["Weekly", "Monthly", "Yearly"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    timeframe === tf
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tf === "Weekly"
                    ? t.weekly
                    : tf === "Monthly"
                      ? t.monthly
                      : t.yearly}
                </button>
              ))}
            </div>
          </div>

          {/* VISUAL TREND BARS */}

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
              <div className="font-bold text-xs text-slate-900 uppercase tracking-wider break-words min-w-0">
                {timeframe} Processing Trends (MT)
              </div>

              <span className="text-xs text-emerald-700 font-bold whitespace-nowrap shrink-0">
                +18.4% YoY Growth
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between gap-2 text-xs font-bold text-slate-700 mb-1">
                  <span className="break-words">E-Waste & PCBs</span>

                  <span className="whitespace-nowrap">6.8 MT (46%)</span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: "46%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between gap-2 text-xs font-bold text-slate-700 mb-1">
                  <span className="break-words">PET & Rigid Plastics</span>

                  <span className="whitespace-nowrap">4.2 MT (28%)</span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: "28%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between gap-2 text-xs font-bold text-slate-700 mb-1">
                  <span className="break-words">Metals (Copper & Brass)</span>

                  <span className="whitespace-nowrap">2.6 MT (18%)</span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: "18%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between gap-2 text-xs font-bold text-slate-700 mb-1">
                  <span className="break-words">Paper & Raddi</span>

                  <span className="whitespace-nowrap">1.2 MT (8%)</span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-300 rounded-full"
                    style={{ width: "8%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NOTIFICATIONS */}
      {/* ========================================================= */}

      {activeTab === "NOTIFICATIONS" && (
        <div className="min-w-0 overflow-hidden">
          <NotificationsPanel
            userId={currentUser?.uid || "admin"}
            role="ADMIN"
            language={language}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* LOT INSPECTION MODAL */}
      {/* ========================================================= */}

      {selectedLotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xl space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 min-w-0">
              <div className="min-w-0">
                <span className="font-mono font-extrabold text-base text-emerald-700 break-all">
                  {selectedLotModal.lotId}
                </span>

                <div className="text-xs text-slate-500 break-words">
                  {selectedLotModal.time}
                </div>
              </div>

              <button
                onClick={() => setSelectedLotModal(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs min-w-0">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 min-w-0">
                <div className="font-bold text-slate-900 uppercase text-[10px]">
                  Full Traceability Lifecycle
                </div>

                <div className="text-emerald-700 font-bold break-words">
                  1. Created by Citizen {selectedLotModal.citizen}
                </div>

                <div className="text-emerald-700 font-bold break-words">
                  2. Collected by {selectedLotModal.collector} (
                  {selectedLotModal.collectorId})
                </div>

                <div className="text-emerald-700 font-bold break-words">
                  3. Verified at {selectedLotModal.hub}
                </div>

                <div className="text-emerald-800 font-bold break-words">
                  4. EPR Certificate #{selectedLotModal.certId} Generated
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 min-w-0">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 min-w-0 overflow-hidden">
                  <div className="text-[10px] text-slate-500 font-bold">
                    MATERIAL TYPE
                  </div>

                  <div className="font-bold text-slate-900 break-words">
                    {selectedLotModal.material}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 min-w-0 overflow-hidden">
                  <div className="text-[10px] text-slate-500 font-bold">
                    WEIGHT
                  </div>

                  <div className="font-bold text-slate-900 break-words">
                    {selectedLotModal.weight}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 min-w-0 overflow-hidden">
                  <div className="text-[10px] text-slate-500 font-bold">
                    PAYOUT
                  </div>

                  <div className="font-bold text-emerald-700 break-words">
                    {selectedLotModal.payout}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 min-w-0 overflow-hidden">
                  <div className="text-[10px] text-slate-500 font-bold">
                    STATUS
                  </div>

                  <div className="font-bold text-slate-900 break-words">
                    {selectedLotModal.status}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedLotModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Done Inspecting
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
