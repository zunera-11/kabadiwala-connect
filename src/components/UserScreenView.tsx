import React, { useState } from "react";
import { ScrapCategory, Language, ManifestItem } from "../types";
import { AuthUser } from "../auth/auth";
import {
  SCRAP_CATEGORIES,
  INITIAL_MANIFESTS,
  TRANSLATION_MAP,
} from "../data/mockData";
import { LOCALES } from "../i18n/locales";

import {
  VolumeIcon,
  CheckIcon,
  ArrowRightIcon,
  TruckIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  BarChartIcon,
  BellIcon,
  FileTextIcon,
  ShieldIcon,
} from "./icons/Icons";

import { NotificationsPanel } from "./WorkflowUI";

interface CollectorLocationInfo {
  id: string;
  name: string;
  location: string;
  phone: string;
  rating: number;
  vehicles: string;
  status: string;
}

const AVAILABLE_COLLECTORS: CollectorLocationInfo[] = [
  {
    id: "KBD-9412",
    name: "Ramesh Kumar",
    location: "Malviya Nagar, Jalgaon",
    phone: "+91 98765 43210",
    rating: 4.9,
    vehicles: "E-Rickshaw & Digital Scale",
    status: "Available - 0.4 KM away",
  },
  {
    id: "KBD-8812",
    name: "Anil Sharma",
    location: "Ward 14, Jalgaon",
    phone: "+91 98765 11223",
    rating: 4.8,
    vehicles: "Light Cargo Van",
    status: "Available - 1.2 KM away",
  },
  {
    id: "KBD-7734",
    name: "Vikram Singh",
    location: "Hauz Khas, Jalgaon",
    phone: "+91 98765 33445",
    rating: 4.7,
    vehicles: "E-Rickshaw",
    status: "Available - 1.8 KM away",
  },
  {
    id: "KBD-6521",
    name: "Rahul Verma",
    location: "Okhla Industrial Area, Jalgaon",
    phone: "+91 98765 55667",
    rating: 4.8,
    vehicles: "Heavy Pickup Truck",
    status: "Available - 3.5 KM away",
  },
  {
    id: "KBD-5412",
    name: "Sunita Devi",
    location: "Mayapuri Industrial Area, Jalgaon",
    phone: "+91 98765 77889",
    rating: 4.9,
    vehicles: "E-Cargo Trike",
    status: "Available - 4.1 KM away",
  },
];

interface UserScreenViewProps {
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
  userLocation?: string;
}

type UserTab =
  | "OVERVIEW"
  | "MY_LOTS"
  | "COLLECTORS"
  | "TRANSACTIONS"
  | "NOTIFICATIONS";

export const UserScreenView: React.FC<UserScreenViewProps> = ({
  currentUser,
  language,
  backendIp,
  onNotify,
  onSpeak,
  onStartLoading,
  onStopLoading,
  isOnline = true,
  onEnqueueOffline,
  userLocation = "Malviya Nagar, Jalgaon",
}) => {
  const [activeTab, setActiveTab] = useState<UserTab>("OVERVIEW");

  const [selectedCategory, setSelectedCategory] = useState<ScrapCategory>(
    SCRAP_CATEGORIES[2],
  );

  const [weightKg, setWeightKg] = useState<number>(12);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasBooked, setHasBooked] = useState<boolean>(false);

  const [userLots, setUserLots] = useState<ManifestItem[]>(INITIAL_MANIFESTS);

  const t = LOCALES[language] || LOCALES.EN;

  const tMap = TRANSLATION_MAP[language] || TRANSLATION_MAP.EN;

  const payout = weightKg * selectedCategory.rate;

  const sortedCollectors = [...AVAILABLE_COLLECTORS].sort((a, b) => {
    const aMatch =
      a.location.toLowerCase().includes(userLocation.toLowerCase()) ||
      userLocation.toLowerCase().includes(a.location.toLowerCase());

    const bMatch =
      b.location.toLowerCase().includes(userLocation.toLowerCase()) ||
      userLocation.toLowerCase().includes(b.location.toLowerCase());

    if (aMatch && !bMatch) return -1;

    if (!aMatch && bMatch) return 1;

    return b.rating - a.rating;
  });

  const handleBookPickup = async () => {
    setIsSubmitting(true);

    const targetUrl = `http://${backendIp}/api/lots`;

    const payload = {
      category: selectedCategory.name,
      weightKg,
      userPayout: payout,
      userLocation,
    };

    const newLotItem: ManifestItem = {
      lotId: `#LOT-2026-${Math.floor(8000 + Math.random() * 1000)}`,

      time: "Just now",

      citizen: "Authenticated Household",

      location: userLocation,

      collector: sortedCollectors[0]?.name || "Ramesh Kumar",

      collectorId: "#KBD-9412",

      hub: "EcoCycle Hub #04",

      hubArea: "Okhla Ind. Area Phase 1",

      material: selectedCategory.name,

      weight: `${weightKg} KG`,

      payout: `₹${payout}.00`,

      payoutType: "Instant UPI",

      status: "Pending",

      certId: "Pending Verification",
    };

    if (!isOnline) {
      onEnqueueOffline?.({
        title: `Schedule Doorstep Scrap Pickup`,

        method: "POST",

        endpoint: targetUrl,

        payload,

        screen: "USER",

        description: `Booking for ${weightKg} KG of ${selectedCategory.name} in ${userLocation} (Est. Payout RS ${payout})`,
      });

      setUserLots((prev) => [newLotItem, ...prev]);

      setIsSubmitting(false);

      setHasBooked(true);

      onNotify(
        "Saved to Offline Queue (No Internet)",
        `Doorstep pickup request stored in AsyncStorage. It will auto-sync when network is restored.`,
        "info",
      );

      onSpeak(
        `Pickup request stored offline. Displaying nearby collectors in ${userLocation}.`,
      );

      return;
    }

    onStartLoading?.({
      title: "Booking Doorstep Pickup...",

      subtitle: `Registering manifest for ${weightKg} KG of ${selectedCategory.name} in ${userLocation} & routing to local collectors`,

      method: "POST",

      endpoint: targetUrl,
    });

    try {
      const res = await fetch(targetUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      await res.json().catch(() => ({}));

      setUserLots((prev) => [newLotItem, ...prev]);

      setIsSubmitting(false);

      setHasBooked(true);

      onStopLoading?.();

      onNotify(
        "Pickup Booked Successfully",
        `POST ${targetUrl} returned ${res.status}. Pickup scheduled for ${weightKg} KG of ${selectedCategory.name} at ${userLocation}.`,
        "success",
      );

      onSpeak(
        `Pickup scheduled for ${weightKg} kilograms of ${selectedCategory.name}. Showing nearby collectors.`,
      );
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setUserLots((prev) => [newLotItem, ...prev]);

      setIsSubmitting(false);

      setHasBooked(true);

      onStopLoading?.();

      onNotify(
        "Pickup Booked (Local Demo Mode)",
        `POST ${targetUrl}\nPayload: ${JSON.stringify(payload)}\n(Backend offline, simulated lot generated)`,
        "info",
      );

      onSpeak(
        `Pickup booked for ${weightKg} kg ${selectedCategory.name}, estimated payout RS ${payout}`,
      );
    }
  };

  const getCategoryDisplayName = (cat: ScrapCategory) => {
    if (language === "HI") return cat.hindiName;

    if (language === "MR") return cat.marathiName;

    return cat.name;
  };

  return (
    <div className="flex flex-col gap-4 pb-12 text-slate-900 w-full">
      {/* Location Banner */}

      <div className="flex items-center justify-between bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
          <MapPinIcon className="w-4 h-4 text-emerald-600 shrink-0" />

          <span>
            {t.location}: <strong>{userLocation}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
            Active Citizen
          </span>

          {/* Notification Bell */}

          <button
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className="w-8 h-8 rounded-lg bg-white text-emerald-700 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200"
            aria-label={t.notifications}
          >
            <BellIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Citizen Sub-Navigation Bar */}

      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm scrollbar-none">
        {[
          {
            id: "OVERVIEW",
            label: t.overview,
            icon: BarChartIcon,
          },
          {
            id: "MY_LOTS",
            label: t.myLots,
            icon: ShieldIcon,
          },
          {
            id: "COLLECTORS",
            label: t.collectorsContacted,
            icon: TruckIcon,
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
              onClick={() => setActiveTab(tab.id as UserTab)}
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

      {/* OVERVIEW TAB */}

      {activeTab === "OVERVIEW" && (
        <div className="space-y-4">
          {/* Metrics summary cards */}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.totalLots}
              </div>

              <div className="text-xl font-black text-slate-900 mt-0.5">
                {userLots.length}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.collectorsContacted}
              </div>

              <div className="text-xl font-black text-emerald-700 mt-0.5">
                {sortedCollectors.length}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.completedTransactions}
              </div>

              <div className="text-xl font-black text-slate-900 mt-0.5">
                {userLots.filter((l) => l.status === "Completed").length}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="text-[8px] font-bold text-slate-500 uppercase">
                {t.pending}
              </div>

              <div className="text-xl font-black text-amber-600 mt-0.5">
                {userLots.filter((l) => l.status !== "Completed").length}
              </div>
            </div>
          </div>

          {/* Schedule Banner */}

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {tMap.schedulePickup}
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                {tMap.quickDoorstep}
              </p>
            </div>

            <button
              onClick={() =>
                onSpeak(
                  language === "HI"
                    ? "कबाड़ का प्रकार और वजन चुनें और पिकअप बुक करें।"
                    : language === "MR"
                      ? "कचऱ्याचा प्रकार आणि वजन निवडून पिकअप बुक करा."
                      : "Schedule a doorstep scrap pickup. Choose your items and weight below.",
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-emerald-700 border border-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors shrink-0"
            >
              <VolumeIcon className="w-3.5 h-3.5" />

              <span>{tMap.listen}</span>
            </button>
          </div>

          {/* Select Scrap Type */}

          <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {tMap.selectScrapType}
              </h3>

              <button
                onClick={() =>
                  onSpeak(
                    "Choose category: E-Waste, Paper Raddi, Plastic, or Metal",
                  )
                }
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200"
              >
                <VolumeIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SCRAP_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);

                      onSpeak(
                        `${cat.name}, rate is RS ${cat.rate} per kilogram`,
                      );
                    }}
                    className={`relative flex flex-col justify-between p-3.5 rounded-xl cursor-pointer transition-colors border ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    } min-h-[110px]`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <CheckIcon className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-mono text-xs font-bold">
                        {cat.id.toUpperCase()}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          onSpeak(
                            `${cat.name}: ${cat.desc}. Rate is RS ${cat.rate} per kg.`,
                          );
                        }}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border border-slate-200"
                      >
                        <VolumeIcon className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="mt-2">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {getCategoryDisplayName(cat)}
                      </div>

                      {cat.caution && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangleIcon className="w-2.5 h-2.5" />
                          Caution
                        </span>
                      )}

                      <div className="font-bold text-xs text-emerald-700 mt-1">
                        RS {cat.rate} / KG
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estimated Weight Stepper */}

          <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {tMap.estimatedWeight}
              </h3>

              <button
                onClick={() =>
                  onSpeak(`Current weight is ${weightKg} kilograms`)
                }
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-200"
              >
                <VolumeIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <button
                onClick={() => setWeightKg((w) => Math.max(1, w - 1))}
                className="w-10 h-10 rounded-lg bg-white text-slate-900 text-lg font-bold border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                -
              </button>

              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-emerald-700 leading-none">
                    {weightKg}
                  </span>

                  <span className="text-xs font-bold text-slate-500">KG</span>
                </div>

                <span className="text-[10px] text-slate-500 mt-0.5">
                  {tMap.tapToAdjust}
                </span>
              </div>

              <button
                onClick={() => setWeightKg((w) => w + 1)}
                className="w-10 h-10 rounded-lg bg-white text-slate-900 text-lg font-bold border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                +
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 50].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeightKg(w)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                    weightKg === w
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {w === 50 ? "50+ KG" : `${w} KG`}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Payout */}

          <div className="bg-emerald-50 rounded-xl p-4 flex flex-col gap-2.5 border border-emerald-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {tMap.estimatedPayout}
                </span>

                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-emerald-950">
                    RS {payout}
                  </span>

                  <span className="text-xs font-bold text-emerald-800">
                    {tMap.cashUpi}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  onSpeak(
                    `Estimated payment is RS ${payout} for ${weightKg} kilograms of ${selectedCategory.name}`,
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-emerald-800 text-xs font-bold border border-emerald-300 shrink-0"
              >
                <VolumeIcon className="w-3.5 h-3.5" />

                <span>Hear Price</span>
              </button>
            </div>

            <div className="text-xs text-emerald-900 font-medium">
              Based on {weightKg} KG {selectedCategory.name} at RS{" "}
              {selectedCategory.rate}/KG
            </div>
          </div>

          {/* Primary Action */}

          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleBookPickup}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-between px-5 border border-emerald-600 transition-colors disabled:opacity-60 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <TruckIcon className="w-4 h-4" />

                <span>{tMap.bookPickupBtn}</span>
              </div>

              <ArrowRightIcon className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
              <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />

              <span>{tMap.verifiedWard}</span>
            </div>
          </div>
        </div>
      )}

      {/* MY LOTS TAB */}

      {activeTab === "MY_LOTS" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-slate-900">
              {t.myLots}
            </h3>

            <span className="text-xs text-slate-500 font-bold">
              {userLots.length} Total Lots
            </span>
          </div>

          <div className="space-y-2.5">
            {userLots.map((item) => (
              <div
                key={item.lotId}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm text-emerald-700">
                    {item.lotId}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      item.status === "Completed"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 font-bold">
                  {item.material} • {item.weight}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3 text-slate-400" />

                  {item.location}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Payout:{" "}
                    <strong className="text-emerald-700">{item.payout}</strong>
                  </span>

                  <span className="font-mono text-[10px] text-slate-500">
                    QR Signed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COLLECTORS TAB */}

      {(activeTab === "COLLECTORS" || activeTab === "OVERVIEW") && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {t.collectorsContacted}
              </h3>

              <p className="text-xs text-slate-500">
                Sorted by proximity to {userLocation}
              </p>
            </div>

            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
              Location Sorted
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedCollectors.map((collector) => {
              const isLocalMatch =
                collector.location
                  .toLowerCase()
                  .includes(userLocation.toLowerCase()) ||
                userLocation
                  .toLowerCase()
                  .includes(collector.location.toLowerCase());

              return (
                <div
                  key={collector.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    isLocalMatch
                      ? "bg-emerald-50/60 border-emerald-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {collector.name}
                      </span>

                      {isLocalMatch && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold text-[9px]">
                          Closest Zone
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPinIcon className="w-3 h-3 text-emerald-600" />

                      <span>{collector.location}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {collector.vehicles} • Rating: {collector.rating} ★
                    </div>
                  </div>

                  <a
                    href={`tel:${collector.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 border border-emerald-600 transition-colors shrink-0"
                  >
                    <span>Assign</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB */}

      {activeTab === "TRANSACTIONS" && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">
            {t.transactionHistory}
          </h3>

          <div className="space-y-2">
            {userLots.map((l) => (
              <div
                key={l.lotId}
                className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {l.material} ({l.weight})
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {l.lotId} • {l.time}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-emerald-700">
                    {l.payout}
                  </div>

                  <div className="text-[10px] text-slate-500">
                    {l.payoutType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}

      {activeTab === "NOTIFICATIONS" && (
        <NotificationsPanel
          userId={currentUser.uid}
          role="USER"
          language={language}
        />
      )}
    </div>
  );
};
