"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Wallet, CreditCard, TrendingUp, Users, Settings, BarChart3, FileText, Mail, Phone, ShieldCheck, BadgeCheck, Receipt, UserCheck, AlertTriangle } from "lucide-react";

export default function LandingPage() {

  return (
    <main>
      <section id="overview" className="relative overflow-hidden">

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <div>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Amac Revenue Management
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
              Collect, monitor, and grow revenue from one connected dashboard.
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Manage entities, agents, wallets, and payment operations with a clear workflow built for daily execution.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              The platform uses encrypted data transmission and secure access controls for operations.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/admin"
                className="inline-flex rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
              >
                Login to Dashboard
              </Link>
              <a
                href="#recruitment"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Join Recruitment
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Active Centers</p>
                <p className="mt-1 text-lg font-bold text-slate-900">24</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Agents</p>
                <p className="mt-1 text-lg font-bold text-slate-900">180+</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm col-span-2 sm:col-span-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Daily Collections</p>
                <p className="mt-1 text-lg font-bold text-emerald-800">₦8.4M</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-md">
            <Image
              src="/revenue-hero.svg"
              alt="Revenue dashboard illustration"
              width={1200}
              height={900}
              className="h-auto w-full rounded-lg"
              priority
            />
          </div>
        </div>
      </section>

      <section id="wallet" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="text-xs uppercase tracking-wide text-slate-500">Wallet Balance Tracking</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Real-time account visibility</h3>
            <p className="mt-2 text-sm text-slate-600">
              Monitor each member wallet profile and settlement flow in one place.
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <CreditCard className="h-5 w-5" />
              </span>
              <p className="text-xs uppercase tracking-wide text-slate-500">Payment Operations</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Actionable payment records</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track pending, completed, and failed transactions with faster follow-up.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="text-xs uppercase tracking-wide text-emerald-800">Revenue Assurance</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Less leakage, better reporting</h3>
            <p className="mt-2 text-sm text-slate-700">
              Built-in checks keep collection activity clean and transparent from field to office.
            </p>
          </div>
        </div>
      </section>

      <section id="recruitment" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="rounded-xl border border-cyan-100 bg-linear-to-r from-white via-emerald-50 to-cyan-50 p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-xs uppercase tracking-wide text-slate-500">Recruitment</p>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 md:text-3xl">
            Join our field operations team
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            We are onboarding new agents and operations support personnel across multiple locations.
          </p>
          <div className="mt-5">
            <Link
              href="/recruitment-portal"
              className="inline-flex rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
            >
              Apply for Recruitment
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Features</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Everything needed for daily revenue operations</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Member Management</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Maintain complete entity profiles with location, category, and pricing setup.</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Settings className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Agent Allocation</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Assign and track responsible agents for each member account.</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <BarChart3 className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Pricing Control</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Upgrade and adjust pricing plans with clear billing visibility.</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <FileText className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Export and Insights</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Generate payment reports and monitor trend performance across categories.</p>
          </div>
        </div>
      </section>

      <section id="trust" className="border-y border-emerald-100 bg-emerald-50/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-wide text-emerald-800">Why you can trust this portal</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Built for accountability and safety</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              This is the official revenue platform of the Abuja Municipal Area Council. Here is how we keep your data and payments safe.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-emerald-100 bg-white p-5 text-center shadow-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-white">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Encrypted transactions</h3>
              <p className="mt-1 text-xs text-slate-600">All payments are transmitted over encrypted connections and never stored in plain text.</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-5 text-center shadow-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-white">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Official AMAC platform</h3>
              <p className="mt-1 text-xs text-slate-600">Operated on behalf of the Abuja Municipal Area Council for tenement and business rate collection.</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-5 text-center shadow-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-white">
                <Receipt className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Instant digital receipts</h3>
              <p className="mt-1 text-xs text-slate-600">Every payment generates a verifiable receipt tied to your account, no matter which channel you use.</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-5 text-center shadow-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800 text-white">
                <UserCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">Verified field agents</h3>
              <p className="mt-1 text-xs text-slate-600">Every agent is registered on the system and can be confirmed by our support team on request.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Stay alert:</span> Only pay through this website, our official USSD/bank channels, or a field agent who can be verified by calling our support line. AMAC staff will never ask you to pay directly into a personal account.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Frequently Asked Questions</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Common questions from residents and businesses</h2>
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
            <div key={item.q} className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Need help?</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Talk to the Amac Revenue team</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600 md:text-base">Send inquiries on onboarding, operations, and system access.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:support@afriverge.com" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Mail className="h-4 w-4" />
              support@afriverge.com
            </a>
            <a href="tel:+2348000000000" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Phone className="h-4 w-4" />
              +234 800 000 0000
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}