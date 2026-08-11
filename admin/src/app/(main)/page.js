"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Wallet, CreditCard, TrendingUp, Users, Settings, BarChart3, FileText, Mail, Phone, ShieldCheck, BadgeCheck, Receipt, UserCheck, AlertTriangle } from "lucide-react";

export default function LandingPage() {

  return (
    <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
      {/* ---------- HERO ---------- */}
      <section id="overview" className="relative overflow-hidden bg-[#0B3B26]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/45 bg-[#1B9E5A]/18 px-3.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
              Amac Revenue Management
            </span>
            <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Collect, monitor, and grow revenue from one connected dashboard.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Manage entities, agents, wallets, and payment operations with a clear workflow built for daily execution.
            </p>
            <p className="mt-3 max-w-lg text-sm font-medium text-white/85">
              The platform uses encrypted data transmission and secure access controls for operations.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/admin"
                className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5"
              >
                Login to Dashboard
              </Link>
              <a
                href="#recruitment"
                className="inline-flex rounded-xl border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                Join Recruitment
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-white/50">Active Centers</p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">24</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
                <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-white/50">Agents</p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-lg font-bold text-white">180+</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/6 p-3 sm:col-span-1">
                <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-white/50">Daily Collections</p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#7BD9A6]">₦8.4M</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
            <Image
              src="/revenue-hero.svg"
              alt="Revenue dashboard illustration"
              width={1200}
              height={900}
              className="h-auto w-full rounded-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ---------- WALLET / OPS / ASSURANCE ---------- */}
      <section id="wallet" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Wallet Balance Tracking</p>
            </div>
            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Real-time account visibility</h3>
            <p className="mt-2 text-sm text-[#5B6B62]">
              Monitor each member wallet profile and settlement flow in one place.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <CreditCard className="h-5 w-5" />
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Payment Operations</p>
            </div>
            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Actionable payment records</h3>
            <p className="mt-2 text-sm text-[#5B6B62]">
              Track pending, completed, and failed transactions with faster follow-up.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A]/15 text-[#158049]">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Revenue Assurance</p>
            </div>
            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Less leakage, better reporting</h3>
            <p className="mt-2 text-sm text-[#0E1F17]/75">
              Built-in checks keep collection activity clean and transparent from field to office.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- RECRUITMENT ---------- */}
      <section id="recruitment" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="overflow-hidden rounded-[28px] bg-[#0B3B26] p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#8FE0B4]">
              <Users className="h-5 w-5" />
            </span>
            <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Recruitment</p>
          </div>
          <h2 className="mt-4 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">
            Join our field operations team
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
            We are onboarding new agents and operations support personnel across multiple locations.
          </p>
          <div className="mt-5">
            <Link
              href="/recruitment-portal"
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5"
            >
              Apply for Recruitment
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-6">
          <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Features</p>
          <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Everything needed for daily revenue operations</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Users, title: "Member Management", desc: "Maintain complete entity profiles with location, category, and pricing setup." },
            { icon: Settings, title: "Agent Allocation", desc: "Assign and track responsible agents for each member account." },
            { icon: BarChart3, title: "Pricing Control", desc: "Upgrade and adjust pricing plans with clear billing visibility." },
            { icon: FileText, title: "Export and Insights", desc: "Generate payment reports and monitor trend performance across categories." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">{title}</h3>
              </div>
              <p className="mt-2 text-sm text-[#5B6B62]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- TRUST ---------- */}
      <section id="trust" className="border-y border-[#E1E7E2] bg-[#E4F5EB]/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="mb-6 text-center">
            <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Why you can trust this portal</p>
            <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Built for accountability and safety</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62]">
              This is the official revenue platform of the Abuja Municipal Area Council. Here is how we keep your data and payments safe.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Encrypted transactions", desc: "All payments are transmitted over encrypted connections and never stored in plain text." },
              { icon: BadgeCheck, title: "Official AMAC platform", desc: "Operated on behalf of the Abuja Municipal Area Council for tenement and business rate collection." },
              { icon: Receipt, title: "Instant digital receipts", desc: "Every payment generates a verifiable receipt tied to your account, no matter which channel you use." },
              { icon: UserCheck, title: "Verified field agents", desc: "Every agent is registered on the system and can be confirmed by our support team on request." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 text-center shadow-sm">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#0B3B26] text-[#8FE0B4]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">{title}</h3>
                <p className="mt-1 text-xs text-[#5B6B62]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 rounded-[20px] border border-[#E8A33D]/40 bg-[#E8A33D]/[0.08] p-5 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8A33D] text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="text-sm text-[#0E1F17]/80">
              <span className="font-semibold">Stay alert:</span> Only pay through this website, our official USSD/bank channels, or a field agent who can be verified by calling our support line. AMAC staff will never ask you to pay directly into a personal account.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-6">
          <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Frequently Asked Questions</p>
          <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Common questions from residents and businesses</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Is this the official AMAC payment platform?",
              a: "Yes. This portal is used by the Abuja Municipal Area Council to manage tenement rates, business permits, and related revenue collection.",
            },
            {
              q: "How do I know a field agent is genuine?",
              a: "Every registered agent carries an ID and can be verified by calling our support line with their name or agent code before you hand over any payment.",
            },
            {
              q: "What payment methods are accepted?",
              a: "You can pay by card, bank transfer, or USSD through our secure payment gateway. Cash should only be paid to a verified agent against an official receipt.",
            },
            {
              q: "I lost my receipt. Can I get another one?",
              a: "Yes. Contact support with your payment reference or phone number used at the time of payment, and we will resend your digital receipt.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
              <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">{item.q}</h3>
              <p className="mt-2 text-sm text-[#5B6B62]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CONTACT ---------- */}
      <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
        <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Need help?</p>
              <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Talk to the Amac Revenue team</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#5B6B62] md:text-base">Send inquiries on onboarding, operations, and system access.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:support@afriverge.com" className="inline-flex items-center gap-2 rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-2.5 text-sm font-medium text-[#0E1F17]/80 hover:bg-white">
              <Mail className="h-4 w-4" />
              support@afriverge.com
            </a>
            <a href="tel:+2348000000000" className="inline-flex items-center gap-2 rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-2.5 text-sm font-medium text-[#0E1F17]/80 hover:bg-white">
              <Phone className="h-4 w-4" />
              +234 800 000 0000
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}