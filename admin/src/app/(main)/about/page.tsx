"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Wallet, Clock, Shield, CheckCircle, Users, Building2, Crown } from "lucide-react";

export default function AboutPage() {
    return (
        <main>
            <section className="relative overflow-hidden">
                <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
                <div className="absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

                <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
                    <div>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            About the Council
                        </span>
                        <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                            Abuja Municipal Area Council
                        </h1>
                        <p className="mt-4 text-base text-slate-600 md:text-lg">
                            One of the six area councils in the Federal Capital Territory (FCT), Abuja. We administer a large geographic area covering communities including Abuja Municipal town, Ushafa, Dutse, Byazhin, Kwaita, Kuchigyoro, and many others.
                        </p>
                        <p className="mt-3 text-sm font-medium text-slate-700">
                            Tenement and Business rates are the primary source of internally generated revenue for the council and are used to fund local infrastructure, roads, schools, and community services that directly improve the lives of Abuja Municipal residents.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-emerald-100 bg-white/80 p-3 shadow-xl backdrop-blur-sm">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <MapPin className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                                        <p className="text-sm font-semibold text-slate-900">FCT, Abuja</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-600">Abuja Municipal Area Council, FCT, Abuja — Nigeria</p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <Wallet className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue Gateway</p>
                                        <p className="text-sm font-semibold text-slate-900">Remita</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-600">Federal Government Approved payment gateway</p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <Clock className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support Hours</p>
                                        <p className="text-sm font-semibold text-slate-900">Mon – Fri</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-600">8:00am – 5:00pm WAT</p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <Shield className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
                                        <p className="text-sm font-semibold text-slate-900">256-bit SSL</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-slate-600">Encrypted data transmission and secure access controls</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Our Mission</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Modernizing Revenue Collection</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                            Providing a transparent, automated, and citizen-centric revenue solution for Abuja Municipal Area Council.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900">Transparency</h3>
                            <p className="mt-2 text-sm text-slate-600">Clear billing and complete visibility into revenue operations for all stakeholders.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900">Automation</h3>
                            <p className="mt-2 text-sm text-slate-600">Digitized assessment, invoicing, and collection to reduce manual effort and errors.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900">Security</h3>
                            <p className="mt-2 text-sm text-slate-600">256-bit SSL encryption and secure access controls protect all transactions.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-slate-900">Accessibility</h3>
                            <p className="mt-2 text-sm text-slate-600">Online portal available 24/7 for payments, complaints, and certificate requests.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">About the System</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Abuja Municipal Digital Revenue Initiative</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="text-base font-semibold text-slate-900">Overview</p>
                            <p className="mt-2 text-sm text-slate-600">
                                The Abuja Municipal Digital Revenue Initiative is a comprehensive platform designed to modernize tenement and business rate collection. Built for the Abuja Municipal Area Council, the system provides property owners, businesses, and agents with a fast, secure, and stress-free way to manage revenue obligations.
                            </p>
                            <p className="mt-3 text-sm text-slate-600">
                                Launched in 2024, the platform supports online payments, invoice generation, complaint tracking, certificate verification, and receipt downloads — accessible from any device.
                            </p>
                        </div>

                        <div>
                            <p className="text-base font-semibold text-slate-900">Key Features</p>
                            <ul className="mt-2 space-y-2 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Secure online payment via Remita
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Digital invoice generation and receipt downloads
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Complaint submission and tracking
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Certificate and clearance verification
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Agent oversight and wallet management
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Governance</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Council Structure</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                            Led by an executive chairman and supported by department heads, the council operates with clear accountability and community representation.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Crown className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Executive</p>
                                    <p className="text-sm font-semibold text-slate-900">Chairman</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">Provides strategic leadership and oversees all council operations and policy directions.</p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Building2 className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Departments</p>
                                    <p className="text-sm font-semibold text-slate-900">Revenue, Works, Admin</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">Dedicated departments handling revenue collection, infrastructure, and administration.</p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Users className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Councilors</p>
                                    <p className="text-sm font-semibold text-slate-900">Ward Representatives</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">Elected representatives from each ward ensure community voices are heard in decision-making.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Impact</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Community Development</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                            Revenue collected through the platform directly funds essential services and infrastructure across Abuja Municipal.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="text-base font-semibold text-slate-900">Investment Areas</p>
                            <p className="mt-2 text-sm text-slate-600">
                                Internally generated revenue supports road construction and maintenance, educational infrastructure, healthcare facilities, water and sanitation projects, and community security initiatives.
                            </p>
                            <p className="mt-3 text-sm text-slate-600">
                                By streamlining collection through digital channels, the council reduces operational costs and redirects more resources directly to community development projects.
                            </p>
                        </div>

                        <div>
                            <p className="text-base font-semibold text-slate-900">Our Commitment</p>
                            <ul className="mt-2 space-y-2 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Efficient and transparent revenue management
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Citizen-centric service delivery
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Accountability and regular public reporting
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                                    Continuous improvement of digital services
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}