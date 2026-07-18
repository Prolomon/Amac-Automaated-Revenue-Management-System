"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Wallet, CreditCard, TrendingUp, Users, Settings, BarChart3, FileText, Mail, Phone } from "lucide-react";

export default function LandingPage() {

  return (
    <main>
      <section id="overview" className="relative overflow-hidden">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <div>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
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
                className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
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
                <p className="mt-1 text-lg font-bold text-emerald-700">₦8.4M</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/80 p-3 shadow-xl backdrop-blur-sm">
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

      <section id="wallet" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="text-xs uppercase tracking-wide text-slate-500">Wallet Balance Tracking</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Real-time account visibility</h3>
            <p className="mt-2 text-sm text-slate-600">
              Monitor each member wallet profile and settlement flow in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CreditCard className="h-5 w-5" />
              </span>
              <p className="text-xs uppercase tracking-wide text-slate-500">Payment Operations</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Actionable payment records</h3>
            <p className="mt-2 text-sm text-slate-600">
              Track pending, completed, and failed transactions with faster follow-up.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="text-xs uppercase tracking-wide text-emerald-700">Revenue Assurance</p>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900">Less leakage, better reporting</h3>
            <p className="mt-2 text-sm text-slate-700">
              Built-in checks keep collection activity clean and transparent from field to office.
            </p>
          </div>
        </div>
      </section>

      <section id="recruitment" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="rounded-3xl border border-cyan-100 bg-linear-to-r from-white via-emerald-50 to-cyan-50 p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
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
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
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
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Users className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Member Management</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Maintain complete entity profiles with location, category, and pricing setup.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Settings className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Agent Allocation</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Assign and track responsible agents for each member account.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BarChart3 className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Pricing Control</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Upgrade and adjust pricing plans with clear billing visibility.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FileText className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">Export and Insights</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Generate payment reports and monitor trend performance across categories.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
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