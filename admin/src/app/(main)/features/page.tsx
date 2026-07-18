"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Eye, FileText, Clock, ShieldCheck, CheckCircle, ArrowRight, Settings, Users, TrendingUp } from "lucide-react";

export default function FeaturesPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/amac.jpg"
            alt="Abuja Municipal Area Council"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#009966]/90" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
            {/* Right side - Text content */}
            <div className="w-full lg:w-1/2 text-left">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Simple & Secure
              </span>
              <h1 className="mt-6 text-3xl font-bold leading-tight text-white md:text-5xl">
                Manage your revenue payments online
              </h1>
              <p className="mt-4 text-base text-emerald-50 md:text-lg">
                Pay your tenement and business rates, download receipts, submit complaints, and track your payment history — all from one secure portal.
              </p>
              <div className="mt-8 flex flex-wrap justify-start gap-3">
                <Link href="/payment" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50">
                  Make Payment Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
                  Contact Support
                </a>
              </div>
            </div>

            {/* Left side - Terminal visualization */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
                {/* Terminal header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">FEATURES LIST</div>
                </div>

                {/* Terminal content */}
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-emerald-600">$</span>
                    <span className="text-slate-800 ml-2 font-semibold">amac features --list</span>
                  </div>

                  {/* Features List */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700">1. Online Payments</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700">2. Digital Invoices & Receipts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700">3. View Payment History</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700">4. Submit Complaint</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700">5. Certificate Verification</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700">6. 24/7 Availability</span>
                    </div>
                  </div>

                  {/* Status Box */}
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700 font-semibold">✓ All systems operational</p>
                    <p className="text-xs text-emerald-600 mt-1">6 features available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-wide text-emerald-700">Citizen Features</span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Everything you need to manage your payments</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            A simple, secure, and transparent platform for all your revenue payment needs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Online Payments</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Pay your tenement and business rates securely online using card, bank transfer, or mobile money through Remita.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Digital Invoices & Receipts</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Generate invoices instantly and download payment receipts for your records. No paperwork required.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-70">
                <Eye className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">View Payment History</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Access your complete transaction history anytime. Track all your payments with dates and receipt numbers.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Submit Complaints</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Have an issue with your bill or property assessment? Submit a complaint online and track its progress until resolution.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Certificate Verification</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Verify your tenement rate certificate online. Share the verification link with employers, banks, or government agencies.</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">24/7 Availability</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Access the portal anytime, anywhere. Make payments, download receipts, or submit complaints at your convenience.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <span className="text-xs uppercase tracking-wide text-emerald-700">Secure & Transparent</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Your payments are protected</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              We use bank-level security to ensure your transactions are safe and your data is protected.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">SSL Encrypted Payments</h3>
                <p className="mt-1 text-sm text-slate-600">All transactions are secured with 256-bit SSL encryption through Nombank, the Federal Government approved payment gateway.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Instant Confirmation</h3>
                <p className="mt-1 text-sm text-slate-600">Receive immediate payment confirmation and download your receipt instantly after successful payment.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Full Transparency</h3>
                <p className="mt-1 text-sm text-slate-600">Every transaction is recorded and auditable. View your complete payment history with all details.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Dedicated Support</h3>
                <p className="mt-1 text-sm text-slate-600">Our support team is available Monday to Friday, 8:00am to 5:00pm WAT to assist you with any questions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-wide text-emerald-700">How It Works</span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Get started in three simple steps</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Making payments has never been easier. Follow these steps to complete your transaction.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Settings className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Create an Account</h3>
            <p className="mt-2 text-sm text-slate-600">Sign up with your details to access the portal and manage your revenue payments.</p>
          </div>

          <div className="text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Generate Invoice</h3>
            <p className="mt-2 text-sm text-slate-600">Enter your property details to generate an invoice with your assessment amount.</p>
          </div>

          <div className="text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Make Payment</h3>
            <p className="mt-2 text-sm text-slate-600">Pay securely using your preferred method and get instant confirmation and receipt.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
        <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-cyan-50 p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <span className="text-xs uppercase tracking-wide text-emerald-700">Why Choose Us</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Built for efficiency and trust</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              Join thousands of citizens who trust AMAC Revenue Management for their payment needs.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">1000+ Active Users</h3>
                <p className="mt-1 text-sm text-slate-600">Trusted by over 1,000 citizens and businesses across Abuja Municipal Area Council.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <TrendingUp className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Increased Revenue</h3>
                <p className="mt-1 text-sm text-slate-600">Transparent system has helped increase revenue collection by 40% in the first year.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Government Approved</h3>
                <p className="mt-1 text-sm text-slate-600">Officially endorsed and audited by the Federal Government of Nigeria.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}