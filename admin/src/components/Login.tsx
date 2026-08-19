"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePartner } from "@/context/PartnerContext";
import { useToast } from "@/context/ToastContext";

export default function Login({ role }: { role: string }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useAuth();
    const { login: PartnerLogin, loading: partnerLoading } = usePartner()
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowPassword(false);

        if (role === "partner") {
            try {
                await PartnerLogin(email, password);
            } catch (error) {
                addToast("error", error.message);
            }

        } else {

            try {
                await login(email, password, role);
            } catch (error) {
                addToast("error", error.message);
            }

        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#0B3B26] overflow-hidden font-['Inter',sans-serif]">
            {/* Decorative blurred background glow, matching hero pattern */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.22),transparent_70%)]" />

            <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white rounded-3xl shadow-2xl border border-[#E1E7E2]">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-[#E4F5EB] rounded-2xl flex items-center justify-center mb-3 border border-[#1B9E5A]/25">
                        <Image src="/icon.png" alt="Unified Portal Logo" width={56} height={56} />
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/30 bg-[#1B9E5A]/12 px-3 py-1 font-['JetBrains_Mono',monospace] text-[11px] font-semibold uppercase tracking-wide text-[#158049] mb-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1B9E5A]" />
                        Revenue Management System
                    </span>
                    <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] tracking-tight">Automated Portal</h1>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62] mb-1.5">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            disabled={loading || partnerLoading}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-2.5 placeholder-[#9AA6A0] border border-[#E1E7E2] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B9E5A]/40 focus:border-[#1B9E5A] bg-[#F5F7F5] text-[#0E1F17] transition disabled:opacity-60"
                            placeholder="you@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62] mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || partnerLoading}
                                className="block w-full px-4 py-2.5 placeholder-[#9AA6A0] border border-[#E1E7E2] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B9E5A]/40 focus:border-[#1B9E5A] bg-[#F5F7F5] text-[#0E1F17] transition disabled:opacity-60 pr-12"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#5B6B62] hover:text-[#158049] focus:outline-none"
                                disabled={loading || partnerLoading}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-7 0-1.306.835-2.417 2.078-3.197m3.197-1.197A9.956 9.956 0 0112 5c5 0 9 4.03 9 7 0 1.306-.835 2.417-2.078 3.197M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || partnerLoading}
                        className="w-full flex justify-center items-center gap-2 px-4 py-3 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-white bg-[#0B3B26] rounded-xl shadow-md hover:bg-[#0E4A30] focus:outline-none focus:ring-2 focus:ring-[#1B9E5A]/40 focus:ring-offset-2 transition disabled:bg-[#0B3B26]/50 disabled:cursor-not-allowed"
                    >
                        {(loading || partnerLoading) && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        )}
                        {(loading || partnerLoading) ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-center font-['JetBrains_Mono',monospace] text-[11px] text-[#9AA6A0]">&copy; {new Date().getFullYear()} TR3G. All rights reserved.</div>
            </div>
        </div>
    );
}