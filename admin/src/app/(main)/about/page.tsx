"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Wallet, Clock, Shield, CheckCircle, Users, Building2, Crown } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
            {/* ---------- HERO ---------- */}
            <section className="relative overflow-hidden bg-[#0B3B26]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />
                <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/45 bg-[#1B9E5A]/18 px-3.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
                            About the Council
                        </span>
                        <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                            Abuja Municipal Area Council
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                            One of the six area councils in the Federal Capital Territory (FCT), Abuja. We administer a large geographic area covering communities including Abuja Municipal town, Ushafa, Dutse, Byazhin, Kwaita, Kuchigyoro, and many others.
                        </p>
                        <p className="mt-3 max-w-xl text-sm font-medium text-white/85">
                            Tenement and Business rates are the primary source of internally generated revenue for the council and are used to fund local infrastructure, roads, schools, and community services that directly improve the lives of Abuja Municipal residents.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-[#0E1F17]/40 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A]/20 text-[#8FE0B4]">
                                        <MapPin className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-white/50">Location</p>
                                        <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-white">FCT, Abuja</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-white/60">Abuja Municipal Area Council, FCT, Abuja — Nigeria</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#0E1F17]/40 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A]/20 text-[#8FE0B4]">
                                        <Wallet className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-white/50">Revenue Gateway</p>
                                        <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-white">Remita</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-white/60">Federal Government Approved payment gateway</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#0E1F17]/40 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A]/20 text-[#8FE0B4]">
                                        <Clock className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-white/50">Support Hours</p>
                                        <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-white">Mon – Fri</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-white/60">8:00am – 5:00pm WAT</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-[#0E1F17]/40 p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A]/20 text-[#8FE0B4]">
                                        <Shield className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-white/50">Security</p>
                                        <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-white">256-bit SSL</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-white/60">Encrypted data transmission and secure access controls</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- VERIFICATION BAND ---------- */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 md:px-6">
                <div className="grid gap-6 overflow-hidden rounded-[20px] border border-[#E1E7E2] bg-white shadow-sm md:grid-cols-2">
                    <div className="relative min-h-65">
                        <Image
                            src="/amac.jpg"
                            alt="Abuja Municipal Area Council Secretariat building"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-center p-6 md:p-8">
                        <div className="flex items-center gap-3">
                            <Image src="/icon1.png" alt="AMAC official seal" width={44} height={44} className="rounded-full" />
                            <div>
                                <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#158049]">Official Verification</p>
                                <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">This is the recognized digital platform of AMAC</p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-[#5B6B62]">
                            This platform is operated on behalf of the Abuja Municipal Area Council Secretariat, pictured here, for the collection of tenement rates, business permits, and related council revenue.
                        </p>
                        <p className="mt-3 text-sm text-[#5B6B62]">
                            If you are ever unsure whether a message, agent, or payment request is genuine, contact our support team directly using the details on our <Link href="/contact" className="font-semibold text-[#158049] hover:text-[#0B3B26]">Contact page</Link> before you pay or share any information.
                        </p>
                    </div>
                </div>
            </section>

            {/* ---------- MISSION ---------- */}
            <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
                <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Our Mission</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Modernizing Revenue Collection</h2>
                        <p className="mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                            Providing a transparent, automated, and citizen-centric revenue solution for Abuja Municipal Area Council.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Transparency</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">Clear billing and complete visibility into revenue operations for all stakeholders.</p>
                        </div>
                        <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Automation</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">Digitized assessment, invoicing, and collection to reduce manual effort and errors.</p>
                        </div>
                        <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Security</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">256-bit SSL encryption and secure access controls protect all transactions.</p>
                        </div>
                        <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Accessibility</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">Online portal available 24/7 for payments, complaints, and certificate requests.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- ABOUT THE SYSTEM ---------- */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">About the System</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Abuja Municipal Digital Revenue Initiative</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Overview</p>
                            <p className="mt-2 text-sm text-[#5B6B62]">
                                The Abuja Municipal Digital Revenue Initiative is a comprehensive platform designed to modernize tenement and business rate collection. Built for the Abuja Municipal Area Council, the system provides property owners, businesses, and agents with a fast, secure, and stress-free way to manage revenue obligations.
                            </p>
                            <p className="mt-3 text-sm text-[#5B6B62]">
                                Launched in 2024, the platform supports online payments, invoice generation, complaint tracking, certificate verification, and receipt downloads — accessible from any device.
                            </p>
                        </div>
        
                        <div>
                            <p className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Key Features</p>
                            <ul className="mt-2 space-y-2 text-sm text-[#5B6B62]">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                                    Secure online payment via NomBank
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                                    Digital invoice generation and receipt downloads
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                                    Complaint submission and tracking
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                                    Certificate and clearance verification
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                                    Agent oversight and wallet management
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- COUNCIL STRUCTURE ---------- */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Governance</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Council Structure</h2>
                        <p className="mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                            Led by an executive chairman and supported by department heads, the council operates with clear accountability and community representation.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {[
                            { icon: Crown, label: "Executive", title: "Chairman", desc: "Provides strategic leadership and oversees all council operations and policy directions." },
                            { icon: Building2, label: "Departments", title: "Revenue, Works, Admin", desc: "Dedicated departments handling revenue collection, infrastructure, and administration." },
                            { icon: Users, label: "Councilors", title: "Ward Representatives", desc: "Elected representatives from each ward ensure community voices are heard in decision-making." },
                        ].map(({ icon: Icon, label, title, desc }) => (
                            <div key={label} className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">{label}</p>
                                        <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">{title}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-[#5B6B62]">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- COMMUNITY DEVELOPMENT ---------- */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
                <div className="overflow-hidden rounded-[28px] bg-[#0B3B26] p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Impact</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">Community Development</h2>
                        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
                            Revenue collected through the platform directly funds essential services and infrastructure across Abuja Municipal.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <p className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white">Investment Areas</p>
                            <p className="mt-2 text-sm text-white/70">
                                Internally generated revenue supports road construction and maintenance, educational infrastructure, healthcare facilities, water and sanitation projects, and community security initiatives.
                            </p>
                            <p className="mt-3 text-sm text-white/70">
                                By streamlining collection through digital channels, the council reduces operational costs and redirects more resources directly to community development projects.
                            </p>
                        </div>

                        <div>
                            <p className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white">Our Commitment</p>
                            <ul className="mt-2 space-y-2 text-sm text-white/70">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                    Efficient and transparent revenue management
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                    Citizen-centric service delivery
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                    Accountability and regular public reporting
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
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
