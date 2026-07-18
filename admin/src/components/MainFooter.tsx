"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Zap, MapPin, Phone, Mail, Clock } from "lucide-react";

export function MainFooter() {
    return (
        <footer className="bg-white text-slate-700">
            <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-full bg-white p-1">
                                <Image src="/icon.png" alt="Abuja Municipal Area Council Logo" width={40} height={40} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Abuja Municipal Area Council</p>
                                <p className="text-xs text-slate-500">Digital Tenement And Business Rate System</p>
                            </div>
                        </div>
                        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                            A secure, automated digital platform for the Abuja Municipal Area Council. Pay your tenement rates online quickly and hassle-free.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Link href="https://tr3-g.com.ng" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                                <Image src="/tr3-g.png" alt="Tr3-G" width={72} height={72} className="object-contain" />
                                Powered by Tr3-G Innovative Limited
                            </Link>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-slate-900">Quick Links</p>
                        <div className="mt-5 grid gap-3 text-sm">
                            <Link href="/" className="text-slate-700 transition-colors hover:text-emerald-700">Home</Link>
                            <Link href="/about" className="text-slate-700 transition-colors hover:text-emerald-700">About the System</Link>
                            <Link href="/features" className="text-slate-700 transition-colors hover:text-emerald-700">Features</Link>
                            <Link href="/payment" className="text-slate-700 transition-colors hover:text-emerald-700">Payments</Link>
                            <Link href="/contact" className="text-slate-700 transition-colors hover:text-emerald-700">Contact Us</Link>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-slate-900">Services</p>
                        <div className="mt-5 grid gap-3 text-sm">
                            <Link href="/payment" className="text-slate-700 transition-colors hover:text-emerald-700">Pay Bills</Link>
                            <Link href="/payment" className="text-slate-700 transition-colors hover:text-emerald-700">Generate Invoice</Link>
                            <Link href="/payment" className="text-slate-700 transition-colors hover:text-emerald-700">Verify Payment</Link>
                            <Link href="/payment" className="text-slate-700 transition-colors hover:text-emerald-700">Download Receipt</Link>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-slate-900">Contact</p>
                        <div className="mt-5 grid gap-3 text-sm">
                            <div className="flex items-start gap-2.5">
                                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                                <span className="text-slate-700">Abuja Municipal Area Council Secretariat, Abuja</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Phone className="h-5 w-5 shrink-0 text-slate-500" />
                                <span className="text-slate-700">+234 800 000 0000</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Mail className="h-5 w-5 shrink-0 text-slate-500" />
                                <span className="text-slate-700">info@abujamunicipal.gov.ng</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Clock className="h-5 w-5 shrink-0 text-slate-500" />
                                <span className="text-slate-700">Mon - Fri: 8am - 5pm</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2026 Abuja Municipal Area Council. All rights reserved.</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/privacy-policy" className="transition-colors hover:text-slate-700">Privacy Policy</Link>
                        <Link href="/terms-of-use" className="transition-colors hover:text-slate-700">Terms of Use</Link>
                        <Link href="/contact" className="transition-colors hover:text-slate-700">Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
