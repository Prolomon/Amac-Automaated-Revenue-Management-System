"use client";

import React from "react";
import {
  X,
  AlertTriangle,
  Trash2,
  RotateCcw,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Enumerator } from "@/lib/services/enumerator";

export type EnumeratorModalAction = "DELETE" | "PURGE" | "RESTORE" | "TOGGLE_STATUS";

interface EnumeratorActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  actionType: EnumeratorModalAction;
  enumerator: Enumerator | null;
  loading?: boolean;
}

export default function EnumeratorActionModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  enumerator,
  loading = false,
}: EnumeratorActionModalProps) {
  if (!isOpen || !enumerator) return null;

  const isCurrentlyActive =
    enumerator.status === "ACTIVE" ||
    enumerator.status === true ||
    (typeof enumerator.status === "string" && enumerator.status.toUpperCase() === "ACTIVE");

  const getActionConfig = () => {
    switch (actionType) {
      case "PURGE":
        return {
          title: "Permanently Purge Enumerator",
          subtitle: "Irreversible System Removal",
          icon: <ShieldAlert className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-100",
          confirmText: "Yes, Permanently Purge",
          confirmClass: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
          badgeText: "DESTRUCTIVE ACTION",
          badgeClass: "bg-red-100 text-red-800",
          description: (
            <>
              Are you sure you want to <strong className="text-red-700">permanently delete</strong>{" "}
              <strong className="text-slate-900">{enumerator.name}</strong> (
              <span className="font-mono text-xs">{enumerator.uid}</span>)?
              <br />
              <br />
              This enumerator is already marked as Deleted. Confirming this request will completely
              remove their profile, decouple properties and member records, and purge wallet
              associations from the database.{" "}
              <strong className="text-red-700 font-semibold">
                This action is permanent and cannot be undone.
              </strong>
            </>
          ),
        };

      case "DELETE":
        return {
          title: "Delete Enumerator",
          subtitle: "Soft Delete & Restrict Access",
          icon: <Trash2 className="h-6 w-6 text-amber-600" />,
          iconBg: "bg-amber-100",
          confirmText: "Yes, Mark as Deleted",
          confirmClass: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs",
          badgeText: "FIRST DELETE STAGE",
          badgeClass: "bg-amber-100 text-amber-800",
          description: (
            <>
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{enumerator.name}</strong> (
              <span className="font-mono text-xs">{enumerator.uid}</span>)?
              <br />
              <br />
              Their account status will be set to <strong className="text-red-600">DELETED</strong>.
              The mobile application will immediately display a permanent block screen, barring
              them from accessing field activities. Another delete request on this record will
              permanently purge them.
            </>
          ),
        };

      case "RESTORE":
        return {
          title: "Restore Enumerator",
          subtitle: "Reactivate Account Access",
          icon: <RotateCcw className="h-6 w-6 text-emerald-600" />,
          iconBg: "bg-emerald-100",
          confirmText: "Yes, Restore Account",
          confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
          badgeText: "RESTORATION",
          badgeClass: "bg-emerald-100 text-emerald-800",
          description: (
            <>
              Do you want to restore{" "}
              <strong className="text-slate-900">{enumerator.name}</strong> (
              <span className="font-mono text-xs">{enumerator.uid}</span>) back to{" "}
              <strong className="text-emerald-700">ACTIVE</strong> status?
              <br />
              <br />
              This will remove the deletion flag, clear security lockouts, and allow the enumerator
              to sign in to the AMAC mobile field app again.
            </>
          ),
        };

      case "TOGGLE_STATUS":
      default:
        return isCurrentlyActive
          ? {
              title: "Disable Enumerator",
              subtitle: "Change Status to Inactive",
              icon: <UserX className="h-6 w-6 text-slate-700" />,
              iconBg: "bg-slate-100",
              confirmText: "Yes, Set to Inactive",
              confirmClass: "bg-slate-800 hover:bg-slate-900 text-white shadow-xs",
              badgeText: "STATUS CHANGE",
              badgeClass: "bg-slate-100 text-slate-800",
              description: (
                <>
                  Are you sure you want to change the status of{" "}
                  <strong className="text-slate-900">{enumerator.name}</strong> (
                  <span className="font-mono text-xs">{enumerator.uid}</span>) to{" "}
                  <strong className="text-slate-900">INACTIVE / DISABLED</strong>?
                  <br />
                  <br />
                  The enumerator will not be able to log in or submit property captures until
                  their status is reactivated.
                </>
              ),
            }
          : {
              title: "Activate Enumerator",
              subtitle: "Change Status to Active",
              icon: <UserCheck className="h-6 w-6 text-emerald-600" />,
              iconBg: "bg-emerald-100",
              confirmText: "Yes, Set to Active",
              confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
              badgeText: "STATUS CHANGE",
              badgeClass: "bg-emerald-100 text-emerald-800",
              description: (
                <>
                  Are you sure you want to change the status of{" "}
                  <strong className="text-slate-900">{enumerator.name}</strong> (
                  <span className="font-mono text-xs">{enumerator.uid}</span>) to{" "}
                  <strong className="text-emerald-700">ACTIVE</strong>?
                  <br />
                  <br />
                  The enumerator will have full access to authenticate and submit field records.
                </>
              ),
            };
    }
  };

  const config = getActionConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all sm:p-7 border border-slate-100 z-10">
        {/* Close Button */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconBg}`}
          >
            {config.icon}
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${config.badgeClass}`}
              >
                {config.badgeText}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">{config.title}</h3>
            <p className="text-xs text-slate-500">{config.subtitle}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-600">
          {config.description}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:opacity-50 ${config.confirmClass}`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Processing..." : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
