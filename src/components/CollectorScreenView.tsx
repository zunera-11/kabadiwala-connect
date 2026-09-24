import React, { useState } from "react";
import { Language, PickupRequest, ManifestItem } from "../types";
import { AuthUser } from "../auth/auth";
import {
  INITIAL_PICKUPS,
  INITIAL_MANIFESTS,
  TRANSLATION_MAP,
} from "../data/mockData";
import { LOCALES } from "../i18n/locales";

import {
  VolumeIcon,
  CheckIcon,
  CameraIcon,
  MapPinIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  BarChartIcon,
  ShieldIcon,
  TruckIcon,
  RecyclerIcon,
  FileTextIcon,
  BellIcon,
} from "./icons/Icons";

import { NotificationsPanel } from "./WorkflowUI";

interface RecyclerLocationInfo {
  id: string;
  name: string;
  location: string;
  phone: string;
  capacity: string;
  rateInfo: string;
  status: string;
}

const AUTHORIZED_RECYCLERS: RecyclerLocationInfo[] = [
  {
    id: "FAC-OKHLA-04",
    name: "EcoCycle Hub #04",
    location: "MIDC Area, Jalgaon",
    phone: "+91 98765 12345",
    capacity: "25 MT/day Intake",
    rateInfo: "PCBs: RS 65/KG • Copper: RS 420/KG",
    status: "CPCB Approved - 1.5 KM away",
  },
  {
    id: "FAC-MAYAPURI-02",
    name: "GreenTech Recycling Plant",
    location: "Old Khole Nagar, Jalgaon",
    phone: "+91 98765 22334",
    capacity: "40 MT/day Intake",
    rateInfo: "PCBs: RS 63/KG • Copper: RS 415/KG",
    status: "CPCB Approved - 4.2 KM away",
  },
  {
    id: "FAC-WAZIRPUR-01",
    name: "Capital E-Waste Dismantlers",
    location: "Maharastrian Industrial Area, Jalgaon",
    phone: "+91 98765 44556",
    capacity: "30 MT/day Intake",
    rateInfo: "PCBs: RS 64/KG • Copper: RS 418/KG",
    status: "CPCB Approved - 6.8 KM away",
  },
  {
    id: "FAC-BADARPUR-05",
    name: "Apex Recyclers Ltd",
    location: "New Mahanagar Industrial Zone, Jalgaon",
    phone: "+91 98765 66778",
    capacity: "50 MT/day Intake",
    rateInfo: "PCBs: RS 62/KG • Copper: RS 410/KG",
    status: "CPCB Approved - 8.1 KM away",
  },
];

interface CollectorScreenViewProps {
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
  offlineQueue?: any[];
  userLocation?: string;
}

type CollectorTab =
  | "OVERVIEW"
  | "REQUESTS"
  | "MY_LOTS"
  | "RECYCLERS"
  | "RATINGS"
  | "TRANSACTIONS"
  | "NOTIFICATIONS";

export const CollectorScreenView: React.FC<CollectorScreenViewProps> = ({
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
  offlineQueue = [],
  userLocation = "Ward 14, Jalgaon",
}) => {
  const [activeTab, setActiveTab] = useState<CollectorTab>("OVERVIEW");

  const [dutyOnline, setDutyOnline] = useState(true);

  const [pickups] = useState<PickupRequest[]>(INITIAL_PICKUPS);

  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});

  const [activePickupId, setActivePickupId] = useState<string | null>(null);

  const [collectorLots] = useState<ManifestItem[]>(INITIAL_MANIFESTS);

  const t = LOCALES[language] || LOCALES.EN;
  const tMap = TRANSLATION_MAP[language] || TRANSLATION_MAP.EN;

  const sortedRecyclers = [...AUTHORIZED_RECYCLERS].sort((a, b) => {
    const aMatch =
      a.location.toLowerCase().includes(userLocation.toLowerCase()) ||
      userLocation.toLowerCase().includes(a.location.toLowerCase());

    const bMatch =
      b.location.toLowerCase().includes(userLocation.toLowerCase()) ||
      userLocation.toLowerCase().includes(b.location.toLowerCase());

    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;

    return 0;
  });

  const handleAcceptAndPay = async (pickup: PickupRequest) => {
    setActivePickupId(pickup.id);

    const targetUrl = `http://${backendIp}/api/lots/${pickup.id}/collect`;

    const payload = {
      collectorId: "KBD-9412",
      collectorName: "Ramesh Kumar",
      lotId: `#LOT-2024-${pickup.id}`,
      status: "COLLECTED",
      collectedAt: new Date().toISOString(),
      location: userLocation,
    };

    if (!isOnline) {
      onEnqueueOffline?.({
        title: `Pickup #${pickup.id} Collection & UPI Payout`,
        method: "PUT",
        endpoint: targetUrl,
        payload,
        screen: "COLLECTOR",
        description: `Disbursed RS ${pickup.payout} to ${pickup.nameEn} for ${pickup.weight} scrap (#LOT-2024-${pickup.id})`,
      });

      setActivePickupId(null);

      setCompletedIds((prev) => ({
        ...prev,
        [pickup.id]: true,
      }));

      onNotify(
        "Saved to Offline Queue (No Signal)",
        `Collection of lot #${pickup.id} stored in AsyncStorage. Will automatically sync as soon as connectivity restores.`,
        "info",
      );

      onSpeak(
        `Pickup accepted offline for ${pickup.nameEn}. Stored in AsyncStorage.`,
      );

      return;
    }

    onStartLoading?.({
      title: "Processing Instant UPI Payout...",
      subtitle: `Transferring RS ${pickup.payout} to ${pickup.nameEn} and securing chain-of-custody lot #${pickup.id}`,
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

      setActivePickupId(null);

      setCompletedIds((prev) => ({
        ...prev,
        [pickup.id]: true,
      }));

      onStopLoading?.();

      onNotify(
        "Pickup Accepted & Paid",
        `PUT ${targetUrl} (Status ${res.status}). Disbursed RS ${pickup.payout} to customer.`,
        "success",
      );

      onSpeak(
        `Pickup accepted for ${pickup.nameEn}. Instant payment of RS ${pickup.payout} routed.`,
      );
    } catch {
      onEnqueueOffline?.({
        title: `Pickup #${pickup.id} Collection & UPI Payout`,
        method: "PUT",
        endpoint: targetUrl,
        payload,
        screen: "COLLECTOR",
        description: `Disbursed RS ${pickup.payout} to ${pickup.nameEn} for ${pickup.weight} scrap (#LOT-2024-${pickup.id})`,
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      setActivePickupId(null);

      setCompletedIds((prev) => ({
        ...prev,
        [pickup.id]: true,
      }));

      onStopLoading?.();

      onNotify(
        "Low Connectivity: Queued in AsyncStorage",
        `Network timed out. Action queued in AsyncStorage and will auto-sync when connection improves.`,
        "info",
      );

      onSpeak(`Pickup accepted. Stored in AsyncStorage for automatic sync.`);
    }
  };

  return (
    <div
      className="
        flex flex-col gap-4 pb-12
        text-slate-900
        w-full max-w-full min-w-0
        overflow-x-hidden
        box-border
      "
    >
      {/* =========================================================
          COLLECTOR PROFILE CARD
      ========================================================== */}
      <div
        className="
          bg-white rounded-xl p-4
          border border-slate-200
          flex flex-col gap-3
          shadow-sm
          w-full max-w-full min-w-0
          box-border
        "
      >
        <div
          className="
            flex items-center justify-between
            gap-3 min-w-0
          "
        >
          <div
            className="
              flex items-center gap-3
              min-w-0 flex-1
            "
          >
            <div
              className="
                w-10 h-10 shrink-0
                rounded-xl bg-emerald-100
                text-emerald-700
                border border-emerald-200
                flex items-center justify-center
                font-bold
              "
            >
              <UserIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="
                  flex items-start gap-2
                  flex-wrap min-w-0
                "
              >
                <h3
                  className="
                    font-extrabold text-sm text-slate-900
                    break-words min-w-0
                  "
                >
                  Ramesh Kumar
                </h3>

                <span
                  className="
                    px-2 py-0.5
                    rounded text-[10px]
                    font-bold
                    bg-emerald-100
                    text-emerald-800
                    border border-emerald-200
                    whitespace-normal
                    break-words
                    max-w-full
                  "
                >
                  Verified Collector
                </span>
              </div>

              <p
                className="
                  text-xs text-slate-500
                  break-words
                  overflow-wrap-anywhere
                  max-w-full
                "
              >
                ID: KBD-9412 • {userLocation}
              </p>
            </div>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className="
              relative w-8 h-8 shrink-0
              rounded-lg
              bg-slate-100
              text-slate-600
              hover:text-slate-900
              flex items-center justify-center
              border border-slate-200
            "
            aria-label={t.notifications}
          >
            <BellIcon className="w-4 h-4" />
          </button>
        </div>

        <div
          className="
            flex items-center justify-between
            gap-3 flex-wrap
            pt-2
            border-t border-slate-100
            min-w-0
          "
        >
          <button
            onClick={() => {
              setDutyOnline(!dutyOnline);

              onSpeak(
                dutyOnline ? "Duty set to offline" : "Duty set to online",
              );
            }}
            className={`
              flex items-center gap-2
              px-3 py-1.5
              rounded-xl
              text-xs font-bold
              border
              transition-colors
              max-w-full
              min-w-0
              whitespace-normal
              ${
                dutyOnline
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }
            `}
          >
            <span
              className={`
                w-2 h-2 shrink-0 rounded-full
                ${dutyOnline ? "bg-emerald-600" : "bg-slate-400"}
              `}
            />

            <span className="break-words">
              {dutyOnline ? tMap.dutyOnline : tMap.dutyOffline}
            </span>
          </button>

          <div
            className="
              px-2.5 py-1
              rounded-lg
              bg-slate-50
              border border-slate-200
              text-[11px]
              font-medium
              text-slate-600
              max-w-full
              break-words
            "
          >
            GPS Active • 82% Battery
          </div>
        </div>
      </div>

      {/* =========================================================
          COLLECTOR SUB-NAVIGATION
      ========================================================== */}
      <div
        className="
          flex items-center gap-1.5
          overflow-x-auto
          overflow-y-hidden
          bg-white
          p-1.5
          rounded-2xl
          border border-slate-200
          shadow-sm
          scrollbar-none
          w-full max-w-full min-w-0
          box-border
        "
      >
        {[
          {
            id: "OVERVIEW",
            label: t.overview,
            icon: BarChartIcon,
          },
          {
            id: "REQUESTS",
            label: t.collectionRequests,
            icon: TruckIcon,
          },
          {
            id: "MY_LOTS",
            label: t.myLots,
            icon: ShieldIcon,
          },
          {
            id: "RECYCLERS",
            label: t.recyclers,
            icon: RecyclerIcon,
          },
          {
            id: "RATINGS",
            label: t.ratingsPerformance,
            icon: ShieldCheckIcon,
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
              onClick={() => setActiveTab(tab.id as CollectorTab)}
              className={`
                flex items-center gap-1.5
                px-3 py-1.5
                rounded-xl
                text-xs font-bold
                whitespace-nowrap
                shrink-0
                transition-colors
                border
                ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }
              `}
            >
              <IconComp className="w-3.5 h-3.5 shrink-0" />

              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: OVERVIEW
      ========================================================== */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-4 w-full max-w-full min-w-0">
          {/* Summary metrics */}
          <div
            className="
              grid grid-cols-2
              sm:grid-cols-4
              gap-2
              w-full max-w-full
              min-w-0
            "
          >
            <div
              className="
                bg-white p-3
                rounded-2xl
                border border-slate-200
                text-center
                shadow-sm
                min-w-0
                overflow-hidden
              "
            >
              <div
                className="
                  text-[8px]
                  font-bold
                  text-slate-500
                  uppercase
                  break-words
                "
              >
                {t.totalLots}
              </div>

              <div className="text-xl font-black text-slate-900 mt-0.5">
                {collectorLots.length}
              </div>
            </div>

            <div
              className="
                bg-white p-3
                rounded-2xl
                border border-slate-200
                text-center
                shadow-sm
                min-w-0
                overflow-hidden
              "
            >
              <div
                className="
                  text-[8px]
                  font-bold
                  text-slate-500
                  uppercase
                  break-words
                "
              >
                {t.collectionRequests}
              </div>

              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {pickups.length}
              </div>
            </div>

            <div
              className="
                bg-white p-3
                rounded-2xl
                border border-slate-200
                text-center
                shadow-sm
                min-w-0
                overflow-hidden
              "
            >
              <div
                className="
                  text-[8px]
                  font-bold
                  text-slate-500
                  uppercase
                  break-words
                "
              >
                {t.completedTransactions}
              </div>

              <div className="text-xl font-black text-slate-900 mt-0.5">
                {Object.keys(completedIds).length + 3}
              </div>
            </div>

            <div
              className="
                bg-white p-3
                rounded-2xl
                border border-slate-200
                text-center
                shadow-sm
                min-w-0
                overflow-hidden
              "
            >
              <div
                className="
                  text-[8px]
                  font-bold
                  text-slate-500
                  uppercase
                  break-words
                "
              >
                {t.recyclers}
              </div>

              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {sortedRecyclers.length}
              </div>
            </div>
          </div>

          {/* Camera Scanner Trigger */}
          <div
            className="
              bg-white
              border border-slate-200
              rounded-xl
              p-4
              flex items-center justify-between
              gap-3
              flex-wrap
              shadow-sm
              w-full max-w-full
              min-w-0
              box-border
            "
          >
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                {t.createLot}
              </h3>

              <p
                className="
                  text-xs text-slate-500
                  mt-0.5
                  break-words
                "
              >
                Capture or upload scrap lot photo
              </p>
            </div>

            <button
              onClick={onOpenScanner}
              className="
                px-4 py-2.5
                rounded-xl
                bg-emerald-600
                hover:bg-emerald-500
                text-white
                text-xs font-bold
                flex items-center justify-center
                gap-2
                transition-colors
                border border-emerald-600
                shrink-0
                max-w-full
              "
            >
              <CameraIcon className="w-4 h-4 shrink-0" />

              <span className="whitespace-normal">Scan / Upload</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2 & OVERVIEW PENDING REQUESTS
      ========================================================== */}
      {(activeTab === "REQUESTS" || activeTab === "OVERVIEW") && (
        <div
          className="
            flex flex-col gap-3
            w-full max-w-full
            min-w-0
          "
        >
          <div
            className="
              flex items-center justify-between
              gap-2
              min-w-0
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              <h3
                className="
                  font-bold text-sm
                  text-slate-900
                  break-words
                  min-w-0
                "
              >
                {t.collectionRequests}
              </h3>
            </div>

            <button
              onClick={() => onSpeak("You have two pickup requests nearby.")}
              className="
                w-7 h-7 shrink-0
                rounded-lg
                bg-slate-100
                text-slate-600
                hover:text-slate-900
                flex items-center justify-center
                border border-slate-200
              "
            >
              <VolumeIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {pickups.map((item) => {
            const isCollected = completedIds[item.id];

            const isLoading = activePickupId === item.id;

            const isQueuedOffline = offlineQueue.some(
              (q) =>
                q.payload?.lotId?.includes(item.id) ||
                q.endpoint?.includes(item.id),
            );

            return (
              <div
                key={item.id}
                className={`
                  bg-white
                  rounded-xl
                  p-4
                  border
                  flex flex-col gap-3
                  transition-colors
                  shadow-sm
                  w-full max-w-full
                  min-w-0
                  box-border
                  overflow-hidden
                  ${
                    isCollected
                      ? isQueuedOffline
                        ? "border-amber-300 bg-amber-50/30"
                        : "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-200"
                  }
                `}
              >
                <div
                  className="
                    flex items-start justify-between
                    gap-3
                    min-w-0
                  "
                >
                  <div
                    className="
                      flex items-center gap-2.5
                      min-w-0 flex-1
                    "
                  >
                    <div
                      className="
                        w-9 h-9 shrink-0
                        rounded-lg
                        bg-slate-100
                        text-slate-800
                        font-bold text-xs
                        flex items-center justify-center
                        border border-slate-200
                      "
                    >
                      {item.avatar}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className="
                          flex items-start gap-1.5
                          flex-wrap
                          min-w-0
                        "
                      >
                        <span
                          className="
                            font-bold text-sm
                            text-slate-900
                            break-words
                            min-w-0
                          "
                        >
                          {item.name}
                        </span>

                        <span
                          className="
                            text-xs text-slate-500
                            break-words
                            min-w-0
                          "
                        >
                          ({item.nameEn})
                        </span>
                      </div>

                      <div
                        className="
                          flex items-start gap-1
                          text-[11px]
                          text-slate-500
                          mt-0.5
                          min-w-0
                        "
                      >
                        <MapPinIcon
                          className="
                            w-3 h-3
                            text-emerald-600
                            shrink-0
                            mt-0.5
                          "
                        />

                        <span
                          className="
                            break-words
                            min-w-0
                            overflow-wrap-anywhere
                          "
                        >
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onSpeak(
                        `${item.nameEn}, ${item.location}, ${item.weight} of ${item.material}, value RS ${item.payout}`,
                      )
                    }
                    className="
                      w-7 h-7 shrink-0
                      rounded-lg
                      bg-slate-100
                      text-slate-600
                      hover:text-slate-900
                      flex items-center justify-center
                      border border-slate-200
                    "
                  >
                    <VolumeIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  className="
                    flex items-center justify-between
                    gap-3
                    bg-slate-50
                    p-2.5
                    rounded-xl
                    border border-slate-200
                    min-w-0
                  "
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        text-xs
                        font-bold
                        text-slate-900
                        break-words
                      "
                    >
                      {item.material}
                    </div>

                    <div className="text-[11px] text-slate-500 break-words">
                      Est. {item.weight}
                    </div>
                  </div>

                  <div
                    className="
                      text-right
                      shrink-0
                      max-w-[45%]
                    "
                  >
                    {item.caution && (
                      <div
                        className="
                          text-[9px]
                          font-bold
                          text-amber-800
                          flex items-center
                          gap-0.5
                          justify-end
                          flex-wrap
                        "
                      >
                        <AlertTriangleIcon className="w-2.5 h-2.5 shrink-0" />

                        <span>Caution</span>
                      </div>
                    )}

                    <div className="text-sm font-extrabold text-emerald-700 break-words">
                      RS {item.payout}
                    </div>
                  </div>
                </div>

                <div
                  className="
                    grid
                    grid-cols-4
                    gap-2
                    w-full
                    min-w-0
                  "
                >
                  <a
                    href={`tel:${item.phone}`}
                    className="
                      col-span-1
                      min-w-0
                      h-10
                      rounded-xl
                      bg-slate-100
                      hover:bg-slate-200
                      text-slate-800
                      flex items-center justify-center
                      border border-slate-200
                      transition-colors
                      text-xs font-bold
                      overflow-hidden
                    "
                  >
                    <span className="truncate">Call</span>
                  </a>

                  <button
                    onClick={() => handleAcceptAndPay(item)}
                    disabled={isCollected || isLoading}
                    className={`
                      col-span-3
                      min-w-0
                      h-10
                      rounded-xl
                      text-white
                      text-xs font-bold
                      flex items-center justify-center
                      gap-1.5
                      transition-colors
                      border
                      overflow-hidden
                      px-2
                      ${
                        isCollected
                          ? isQueuedOffline
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-emerald-700 text-white border-emerald-700"
                          : "bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                      }
                    `}
                  >
                    {isLoading ? (
                      <span className="text-[11px] truncate">
                        Connecting...
                      </span>
                    ) : isCollected ? (
                      isQueuedOffline ? (
                        <span className="break-words text-center">
                          Stored Offline
                        </span>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 shrink-0" />

                          <span className="break-words text-center">
                            {tMap.onTheWay}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 shrink-0" />

                        <span className="break-words text-center">
                          {tMap.acceptPickup}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          TAB 3: MY LOTS
      ========================================================== */}
      {activeTab === "MY_LOTS" && (
        <div
          className="
            space-y-3
            w-full max-w-full
            min-w-0
          "
        >
          <div
            className="
              flex items-center justify-between
              gap-2
              px-1
              min-w-0
            "
          >
            <h3
              className="
                font-extrabold text-sm
                text-slate-900
                break-words
                min-w-0
              "
            >
              {t.myLots}
            </h3>

            <span
              className="
                text-xs
                text-slate-500
                font-bold
                text-right
                break-words
                shrink-0
              "
            >
              {collectorLots.length} Registered Lots
            </span>
          </div>

          <div className="space-y-2 w-full min-w-0">
            {collectorLots.map((l) => (
              <div
                key={l.lotId}
                className="
                  bg-white
                  rounded-2xl
                  p-4
                  border border-slate-200
                  flex flex-col gap-2
                  shadow-sm
                  w-full max-w-full
                  min-w-0
                  box-border
                  overflow-hidden
                "
              >
                <div
                  className="
                    flex items-center justify-between
                    gap-2
                    min-w-0
                  "
                >
                  <span
                    className="
                      font-mono
                      font-bold
                      text-sm
                      text-emerald-700
                      break-all
                      min-w-0
                    "
                  >
                    {l.lotId}
                  </span>

                  <span
                    className={`
                      px-2 py-0.5
                      rounded
                      text-[10px]
                      font-bold
                      border
                      shrink-0
                      whitespace-normal
                      text-center
                      ${
                        l.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    `}
                  >
                    {l.status}
                  </span>
                </div>

                <div
                  className="
                    text-xs
                    text-slate-800
                    font-bold
                    break-words
                  "
                >
                  {l.material} • {l.weight}
                </div>

                <div
                  className="
                    text-[11px]
                    text-slate-500
                    break-words
                    overflow-wrap-anywhere
                  "
                >
                  Citizen: {l.citizen} ({l.location})
                </div>

                <div
                  className="
                    text-[11px]
                    text-slate-500
                    break-words
                    overflow-wrap-anywhere
                  "
                >
                  Facility Hub: {l.hub}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TODAY'S EARNINGS CARD
      ========================================================== */}
      <div
        className="
          bg-white
          rounded-xl
          p-4
          border border-slate-200
          flex flex-col gap-3
          shadow-sm
          w-full max-w-full
          min-w-0
          box-border
        "
      >
        <div
          className="
            flex items-start justify-between
            gap-3
            min-w-0
          "
        >
          <div className="min-w-0 flex-1">
            <span
              className="
                text-xs
                font-bold
                uppercase
                tracking-wider
                text-slate-500
                break-words
              "
            >
              {tMap.todayEarnings}
            </span>

            <div
              className="
                flex items-baseline
                gap-2
                flex-wrap
                mt-0.5
                min-w-0
              "
            >
              <span className="text-2xl font-extrabold text-slate-900">
                RS 450
              </span>

              <span
                className="
                  text-xs
                  font-bold
                  text-emerald-700
                  break-words
                "
              >
                +RS 120 last pickup
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              onSpeak(
                "Today's total earnings are RS 450 with 3 completed pickups.",
              )
            }
            className="
              w-8 h-8
              shrink-0
              rounded-lg
              bg-slate-100
              text-slate-600
              hover:text-slate-900
              flex items-center justify-center
              border border-slate-200
            "
          >
            <VolumeIcon className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => {
            onNotify(
              "UPI Cashout",
              "RS 450 successfully disbursed to your UPI ID ramesh@okaxis",
              "success",
            );

            onSpeak("Transfer to UPI initiated for RS 450.");
          }}
          className="
            w-full
            sm:w-auto
            h-11
            px-5
            bg-emerald-600
            hover:bg-emerald-500
            border border-emerald-600
            text-white
            text-xs font-bold
            rounded-xl
            flex items-center justify-center
            gap-2
            transition-colors
            shadow-sm
            max-w-full
            min-w-0
          "
        >
          <span className="break-words text-center">Transfer to UPI</span>

          <ArrowRightIcon className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

      {/* =========================================================
          TAB 4: RECYCLERS LIST
      ========================================================== */}
      {(activeTab === "RECYCLERS" || activeTab === "OVERVIEW") && (
        <div
          className="
            bg-white
            rounded-xl
            p-4
            border border-slate-200
            space-y-3
            shadow-sm
            w-full max-w-full
            min-w-0
            box-border
            overflow-hidden
          "
        >
          <div
            className="
              flex items-start justify-between
              gap-3
              border-b border-slate-100
              pb-2.5
              min-w-0
            "
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900">
                {t.recyclers}
              </h3>

              <p
                className="
                  text-xs text-slate-500
                  break-words
                  overflow-wrap-anywhere
                "
              >
                Sorted by distance from {userLocation}
              </p>
            </div>

            <span
              className="
                px-2 py-0.5
                rounded
                bg-emerald-100
                text-emerald-800
                font-bold
                text-[10px]
                border border-emerald-200
                shrink-0
                whitespace-normal
                text-center
                max-w-[45%]
              "
            >
              CPCB Facilities
            </span>
          </div>

          <div className="space-y-2.5 w-full min-w-0">
            {sortedRecyclers.map((recycler) => {
              const isLocalMatch =
                recycler.location
                  .toLowerCase()
                  .includes(userLocation.toLowerCase()) ||
                userLocation
                  .toLowerCase()
                  .includes(recycler.location.toLowerCase());

              return (
                <div
                  key={recycler.id}
                  className={`
                    p-3
                    rounded-xl
                    border
                    flex flex-col gap-1.5
                    transition-colors
                    w-full max-w-full
                    min-w-0
                    box-border
                    overflow-hidden
                    ${
                      isLocalMatch
                        ? "bg-emerald-50/60 border-emerald-300"
                        : "bg-slate-50 border-slate-200"
                    }
                  `}
                >
                  <div
                    className="
                      flex items-start justify-between
                      gap-2
                      min-w-0
                    "
                  >
                    <div
                      className="
                        flex items-start
                        gap-2
                        min-w-0
                        flex-1
                        flex-wrap
                      "
                    >
                      <span
                        className="
                          font-bold
                          text-xs
                          text-slate-900
                          break-words
                          min-w-0
                        "
                      >
                        {recycler.name}
                      </span>

                      {isLocalMatch && (
                        <span
                          className="
                            px-1.5
                            py-0.5
                            rounded
                            bg-emerald-600
                            text-white
                            font-bold
                            text-[9px]
                            whitespace-normal
                            break-words
                          "
                        >
                          Closest Hub
                        </span>
                      )}
                    </div>

                    <span
                      className="
                        text-[10px]
                        font-mono
                        font-bold
                        text-emerald-700
                        bg-emerald-100
                        px-1.5 py-0.5
                        rounded
                        border border-emerald-200
                        shrink-0
                        whitespace-normal
                        break-words
                        text-right
                        max-w-[50%]
                      "
                    >
                      {recycler.status}
                    </span>
                  </div>

                  <div
                    className="
                      text-[11px]
                      text-slate-600
                      flex items-start
                      gap-1
                      min-w-0
                    "
                  >
                    <MapPinIcon
                      className="
                        w-3 h-3
                        text-emerald-600
                        shrink-0
                        mt-0.5
                      "
                    />

                    <span
                      className="
                        break-words
                        min-w-0
                        overflow-wrap-anywhere
                      "
                    >
                      {recycler.location}
                    </span>
                  </div>

                  <div
                    className="
                      flex items-start
                      justify-between
                      gap-3
                      flex-wrap
                      text-[11px]
                      pt-1
                      border-t border-slate-200/60
                      min-w-0
                    "
                  >
                    <span
                      className="
                        text-slate-500
                        break-words
                        min-w-0
                      "
                    >
                      {recycler.capacity}
                    </span>

                    <span
                      className="
                        font-bold
                        text-emerald-800
                        break-words
                        text-right
                        min-w-0
                      "
                    >
                      {recycler.rateInfo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: RATINGS & PERFORMANCE
      ========================================================== */}
      {activeTab === "RATINGS" && (
        <div
          className="
            space-y-3
            bg-white
            p-5
            rounded-2xl
            border border-slate-200
            shadow-sm
            w-full max-w-full
            min-w-0
            box-border
          "
        >
          <h3
            className="
              font-extrabold
              text-sm
              text-slate-900
              break-words
            "
          >
            {t.ratingsPerformance}
          </h3>

          <div
            className="
              grid
              grid-cols-2
              gap-3
              text-center
              w-full
              min-w-0
            "
          >
            <div
              className="
                bg-slate-50
                p-4
                rounded-xl
                border border-slate-200
                min-w-0
                overflow-hidden
              "
            >
              <div className="text-2xl font-black text-emerald-700">4.9 ★</div>

              <div
                className="
                  text-xs
                  text-slate-600
                  font-medium
                  break-words
                "
              >
                Customer Rating
              </div>
            </div>

            <div
              className="
                bg-slate-50
                p-4
                rounded-xl
                border border-slate-200
                min-w-0
                overflow-hidden
              "
            >
              <div className="text-2xl font-black text-slate-900">142</div>

              <div
                className="
                  text-xs
                  text-slate-600
                  font-medium
                  break-words
                "
              >
                Lots Collected
              </div>
            </div>

            <div
              className="
                bg-slate-50
                p-4
                rounded-xl
                border border-slate-200
                min-w-0
                overflow-hidden
              "
            >
              <div className="text-2xl font-black text-slate-900">3.45 MT</div>

              <div
                className="
                  text-xs
                  text-slate-600
                  font-medium
                  break-words
                "
              >
                Weight Submitted
              </div>
            </div>

            <div
              className="
                bg-slate-50
                p-4
                rounded-xl
                border border-slate-200
                min-w-0
                overflow-hidden
              "
            >
              <div className="text-2xl font-black text-emerald-700">100%</div>

              <div
                className="
                  text-xs
                  text-slate-600
                  font-medium
                  break-words
                "
              >
                CPCB Audit Pass
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 6: TRANSACTIONS
          CRITICAL MOBILE RESPONSIVENESS FIX
      ========================================================== */}
      {activeTab === "TRANSACTIONS" && (
        <div
          className="
            space-y-3
            w-full max-w-full
            min-w-0
            overflow-hidden
          "
        >
          <h3
            className="
              font-extrabold
              text-sm
              text-slate-900
              break-words
              min-w-0
            "
          >
            {t.transactionHistory}
          </h3>

          <div
            className="
              space-y-2
              w-full max-w-full
              min-w-0
            "
          >
            {collectorLots.map((l) => (
              <div
                key={l.lotId}
                className="
                  bg-white
                  rounded-2xl
                  p-4
                  border border-slate-200
                  shadow-sm

                  /* IMPORTANT:
                     Mobile = stacked
                     Desktop = side by side
                  */
                  flex flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between

                  gap-3

                  w-full
                  max-w-full
                  min-w-0
                  box-border

                  overflow-hidden
                "
              >
                {/* Transaction information */}
                <div
                  className="
                    min-w-0
                    flex-1
                    max-w-full
                    overflow-hidden
                  "
                >
                  <div
                    className="
                      font-bold
                      text-xs
                      text-slate-900
                      break-words
                      overflow-wrap-anywhere
                    "
                  >
                    {l.material} ({l.weight})
                  </div>

                  <div
                    className="
                      text-[11px]
                      text-slate-500
                      font-mono
                      mt-0.5

                      break-all
                      whitespace-normal

                      max-w-full
                      min-w-0
                    "
                  >
                    {l.lotId} • {l.hub}
                  </div>
                </div>

                {/* Transaction amount/status */}
                <div
                  className="
                    text-left
                    sm:text-right

                    shrink-0
                    max-w-full
                    min-w-0

                    pt-2
                    sm:pt-0

                    border-t
                    sm:border-t-0

                    border-slate-100
                  "
                >
                  <div
                    className="
                      text-sm
                      font-black
                      text-emerald-700
                      break-words
                    "
                  >
                    {l.payout}
                  </div>

                  <div
                    className="
                      text-[10px]
                      text-slate-500
                      break-words
                    "
                  >
                    Disbursed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 7: NOTIFICATIONS
      ========================================================== */}
      {activeTab === "NOTIFICATIONS" && (
        <div
          className="
            w-full
            max-w-full
            min-w-0
            overflow-hidden
          "
        >
          <NotificationsPanel
            userId={currentUser.uid}
            role="COLLECTOR"
            language={language}
          />
        </div>
      )}
    </div>
  );
};
