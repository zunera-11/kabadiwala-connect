import React, { useEffect, useMemo, useState } from "react";
import {
  AppNotification,
  Language,
  LotStatus,
  PickupStatus,
  Role,
} from "../types";
import { LOCALES } from "../i18n/locales";
import {
  markNotificationsRead,
  notificationText,
  readWorkflow,
  subscribeWorkflow,
} from "../data/workflowStore";
import { BellIcon, CheckIcon, ClockIcon, XIcon } from "./icons/Icons";

/* =========================================================
   DEMO NOTIFICATIONS
   SAME NOTIFICATIONS AS HEADER.TSX
   ========================================================= */

const DEFAULT_NOTIFICATIONS: Record<
  Role,
  {
    id: string;
    title: string;
    time: string;
    read: boolean;
  }[]
> = {
  USER: [
    {
      id: "1",
      title: "Collector Ramesh Kumar accepted your pickup request.",
      time: "10m ago",
      read: false,
    },
    {
      id: "2",
      title: "Waste Lot #LOT-2026-8841 generated for Plastic.",
      time: "1h ago",
      read: false,
    },
    {
      id: "3",
      title: "Instant UPI payout Rs. 216.00 credited to bank.",
      time: "2h ago",
      read: true,
    },
  ],

  COLLECTOR: [
    {
      id: "1",
      title: "New pickup request received in Ward 14 from Pooja Sharma.",
      time: "5m ago",
      read: false,
    },
    {
      id: "2",
      title: "EcoCycle Hub #04 accepted Lot #LOT-2026-8841.",
      time: "45m ago",
      read: false,
    },
    {
      id: "3",
      title: "Weekly duty earnings statement ready: Rs 4,820.00",
      time: "1d ago",
      read: true,
    },
  ],

  RECYCLER: [
    {
      id: "1",
      title: "Inbound Lot #LOT-2026-8841 received from Collector Ramesh.",
      time: "15m ago",
      read: false,
    },
    {
      id: "2",
      title: "Digital scale calibrated: 48.50 KG verified.",
      time: "1h ago",
      read: false,
    },
    {
      id: "3",
      title: "EPR Certificate #EPR-DEL-9941 generated & signed.",
      time: "3h ago",
      read: true,
    },
  ],

  ADMIN: [
    {
      id: "1",
      title: "New Collector registration submitted for CPCB review.",
      time: "12m ago",
      read: false,
    },
    {
      id: "2",
      title: "1,420 waste lots processed today across National Hubs.",
      time: "2h ago",
      read: false,
    },
    {
      id: "3",
      title: "Annual CPCB compliance rating 100% verified with 0 variance.",
      time: "1d ago",
      read: true,
    },
  ],
};

/* =========================================================
   WORKFLOW SNAPSHOT
   ========================================================= */

export function useWorkflowSnapshot() {
  const [snapshot, setSnapshot] = useState(() => readWorkflow());

  useEffect(() => {
    return subscribeWorkflow(() => {
      setSnapshot(readWorkflow());
    });
  }, []);

  return snapshot;
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

export function StatusBadge({
  status,
  language,
}: {
  status:
    | PickupStatus
    | LotStatus
    | "Completed"
    | "Pending"
    | "In Facility Intake";
  language: Language;
}) {
  const t = LOCALES[language] || LOCALES.EN;

  const mapped =
    status === "Completed"
      ? t.completed
      : status === "Pending"
        ? t.pending
        : status === "In Facility Intake"
          ? t.inIntake
          : t[`status.${status}`] || String(status);

  const tone =
    String(status).includes("COMPLETED") ||
    status === "Completed" ||
    String(status).includes("ACCEPTED") ||
    String(status).includes("DISPATCHED")
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : String(status).includes("REJECTED")
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tone}`}
    >
      {mapped}
    </span>
  );
}

/* =========================================================
   NOTIFICATION BUTTON
   SAME BEHAVIOUR AS HEADER
   ========================================================= */

export function NotificationButton({
  userId,
  role,
  language,
  onClick,
}: {
  userId: string;
  role: Role;
  language: Language;
  onClick: () => void;
}) {
  /*
   * IMPORTANT:
   * The mobile notification button uses the SAME
   * DEFAULT_NOTIFICATIONS data as Header.tsx.
   */

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const t = LOCALES[language] || LOCALES.EN;

  const roleNotifications = notifications[role] || [];

  const unreadCount = roleNotifications.filter(
    (notification) => !notification.read,
  ).length;

  return <button></button>;
}

/* =========================================================
   NOTIFICATIONS PANEL
   SAME DATA AS HEADER
   ========================================================= */

export function NotificationsPanel({
  userId,
  role,
  language,
}: {
  userId: string;
  role: Role;
  language: Language;
}) {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const t = LOCALES[language] || LOCALES.EN;

  const roleNotifications = notifications[role] || [];

  const unreadCount = roleNotifications.filter(
    (notification) => !notification.read,
  ).length;

  /* =======================================================
     MARK ALL READ
     SAME LOGIC AS HEADER
     ======================================================= */

  const markAllRead = () => {
    setNotifications((previous) => ({
      ...previous,

      [role]: previous[role].map((notification) => ({
        ...notification,
        read: true,
      })),
    }));

    /*
     * Also keep workflow notification state
     * synchronized if workflow notifications exist.
     */
    try {
      markNotificationsRead(userId, role);
    } catch {
      // Header demo notifications still work independently.
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
      {/* ===================================================
          PANEL HEADER
          =================================================== */}

      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <BellIcon className="w-4 h-4" />
          </div>

          <div>
            <div className="font-extrabold text-sm text-slate-900">
              {t.notifications}
            </div>

            <div className="text-[10px] text-slate-500">
              {unreadCount} unread
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            {t.markAllRead}
          </button>
        )}
      </div>

      {/* ===================================================
          NOTIFICATION LIST
          =================================================== */}

      <div className="divide-y divide-slate-100">
        {roleNotifications.length === 0 && (
          <div className="p-6 text-xs text-slate-500 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {t.noNotifications}
          </div>
        )}

        {roleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 flex gap-3 transition-colors ${
              notification.read ? "bg-white" : "bg-emerald-50/60"
            }`}
          >
            {/* ICON */}

            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                notification.read
                  ? "bg-slate-50 border-slate-200 text-slate-500"
                  : "bg-emerald-600 border-emerald-600 text-white"
              }`}
            >
              {notification.read ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <BellIcon className="w-4 h-4" />
              )}
            </div>

            {/* CONTENT */}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`text-xs text-slate-900 ${
                    notification.read ? "font-medium" : "font-bold"
                  }`}
                >
                  {notification.title}
                </div>

                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {notification.read ? t.read : t.unread}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />

                {notification.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   WORKFLOW NOTIFICATION ROW
   KEPT FOR REAL WORKFLOW NOTIFICATIONS
   ========================================================= */

function NotificationRow({
  item,
  language,
}: {
  item: AppNotification;
  language: Language;
}) {
  const t = LOCALES[language] || LOCALES.EN;

  return (
    <div
      className={`p-3 flex gap-3 ${
        item.read ? "bg-white" : "bg-emerald-50/60"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
          item.read
            ? "bg-slate-50 border-slate-200 text-slate-500"
            : "bg-emerald-600 border-emerald-600 text-white"
        }`}
      >
        {item.read ? (
          <CheckIcon className="w-4 h-4" />
        ) : (
          <BellIcon className="w-4 h-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-xs text-slate-900">
            {notificationText(item.titleKey, language, item.messageParams)}
          </div>

          <span className="text-[10px] text-slate-500 whitespace-nowrap">
            {item.read ? t.read : t.unread}
          </span>
        </div>

        <div className="text-xs text-slate-600 mt-1 leading-relaxed">
          {notificationText(item.messageKey, language, item.messageParams)}
        </div>

        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />

          {new Date(item.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
