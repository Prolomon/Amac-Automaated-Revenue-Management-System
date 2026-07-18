"use client";
import React, { FormEvent, useState } from "react";
import {
    ChevronDown,
    KeyRound,
    Lock,
    ShieldCheck,
    SwitchCamera,
} from "lucide-react";
import { usePartner } from "@/context/PartnerContext";
import { changePassword, forgetPassword } from "@/lib/services/company";
import { useToast } from "@/context/ToastContext";

export default function SecurityPage() {
    const { user } = usePartner();
    const { addToast } = useToast();

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [forgetPasswordLoading, setForgetPasswordLoading] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setPasswordLoading(true);
        try {
            const res = await changePassword(user?.uid, passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);

            if (!res) {
                addToast("error", "Unable to update password.");
                return;
            }

            addToast("success", "Password updated successfully.");

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            addToast("error", error instanceof Error ? error.message : "Unable to update password.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleForgetPassword = async () => {
        setForgetPasswordLoading(true);
        try {
            const res = await forgetPassword(user?.uid || "");
            if (!res?.ok) {
                addToast("error", res?.message || res?.error || "Unable to process forgot password.");
                return;
            }

            addToast("success", res?.message || "Forgot password request completed successfully.");
        } catch (error) {
            addToast("error", error instanceof Error ? error.message : "Unable to process forgot password.");
        } finally {
            setForgetPasswordLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Security</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Manage password, security code, and transfer authorization.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 text-sm text-slate-600">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Protected account controls
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* change password section */}
                <details className="group rounded-2xl border border-slate-200 bg-white p-5 md:p-6" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                            <Lock className="h-5 w-5 text-emerald-600" />
                            <span>Change Password</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                    </summary>

                    <form onSubmit={handlePasswordSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(event) =>
                                    setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                                }
                                placeholder="Enter current password"
                                className="w-full rounded-xl text-slate-700 border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(event) =>
                                    setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                                }
                                placeholder="Enter new password"
                                className="w-full rounded-xl text-slate-700 border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(event) =>
                                    setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                                }
                                placeholder="Re-enter new password"
                                className="w-full rounded-xl text-slate-700 border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                            />
                        </div>

                        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                                <KeyRound className="h-4 w-4" />
                                {passwordLoading ? "Updating..." : "Update Password"}
                            </button>

                            <button
                                type="button"
                                onClick={handleForgetPassword}
                                disabled={forgetPasswordLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <SwitchCamera className="h-4 w-4" />
                                {forgetPasswordLoading ? "Processing..." : "Forgot Password"}
                            </button>
                        </div>
                    </form>
                </details>
            </div>
        </div>
    );
}
