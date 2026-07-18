"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Clock, MapPin, ArrowRight, Users, Building2, Headphones, CheckCircle } from "lucide-react";

export default function ContactPage() {
  return (
      <main className="mx-auto w-full max-w-7xl px-4 py-3 md:px-6">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/amac.jpg"
              alt="AMAC Secretariat Building"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[#009966]/80" />
          </div>
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Contact & Support
              </span>
              <h1 className="mt-6 text-3xl font-bold leading-tight text-white md:text-5xl">
                Talk to the Amac Revenue team
              </h1>
              <p className="mt-4 text-base text-emerald-50 md:text-lg">
                Send inquiries on onboarding, operations, system access, billing, and agent support. We respond within 1–2 business days.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
                <p className="text-sm font-semibold text-slate-900">Call Support</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">+234 (0) 8003 BWARITC</p>
            <p className="mt-2 text-sm text-slate-600">Monday to Friday, 8:00 am – 5:00 pm WAT.</p>
            <div className="mt-4">
              <a href="tel:+2348003BWARITC" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Call Now
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                <p className="text-sm font-semibold text-slate-900">Send Message</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">support@abujamunicipal.gov.ng</p>
            <p className="mt-2 text-sm text-slate-600">Best for formal enquiries and documentation. Responses within 1–2 business days.</p>
            <div className="mt-4">
              <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Compose Email
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office</p>
                <p className="text-sm font-semibold text-slate-900">Visit / Post</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">Abuja Municipal Area Council Secretariat</p>
            <p className="mt-2 text-sm text-slate-600">Abuja Municipal Town, FCT — Abuja, Nigeria</p>
            <div className="mt-4">
              <a href="https://maps.google.com/?q=Abuja+Municipal+Area+Council+Secretariat" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                Get Directions
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office Hours</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Opening times</h3>
            <p className="mt-1 text-sm text-slate-600">Monday – Friday, 8 am – 5 pm WAT.</p>
            <div className="mt-5">
              <div className="flex items-center justify-between border-b border-emerald-100 py-3">
                <span className="text-sm font-medium text-slate-700">Monday – Thursday</span>
                <span className="text-sm font-semibold text-slate-900">08:00 – 17:00</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-100 py-3">
                <span className="text-sm font-medium text-slate-700">Friday</span>
                <span className="text-sm font-semibold text-slate-900">08:00 – 16:00</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-100 py-3">
                <span className="text-sm font-medium text-slate-700">Saturday – Sunday</span>
                <span className="text-xs font-bold uppercase tracking-wide text-red-600">Closed</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-600">Hours may vary on public holidays. Call ahead to confirm availability.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Online Portal</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Services available 24 / 7</h3>
            <p className="mt-1 text-sm text-slate-600">Pay rates, register properties, track complaints, and download receipts online.</p>
            <div className="mt-5">
              <Link href="/auth/admin" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs uppercase tracking-wide text-slate-500">Need help?</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">Talk to the Amac Revenue team</h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">Send inquiries on onboarding, operations, and system access.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Mail className="h-4 w-4" />
              support@abujamunicipal.gov.ng
            </a>
            <a href="tel:+2348003BWARITC" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Phone className="h-4 w-4" />
              +234 (0) 8003 BWARITC
            </a>
          </div>
        </div>

        {/* Department Contacts */}
        <div className="mt-14">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Departments</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Direct Contacts</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">Reach the right team directly for faster assistance.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Revenue Collection</p>
                  <p className="text-xs text-slate-500">Billing & payments</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a href="tel:+2348003BWARITC" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Phone className="h-4 w-4" />
                  +234 (0) 8003 BWARITC
                </a>
                <a href="mailto:support@abujamunicipal.gov.ng" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Mail className="h-4 w-4" />
                  support@abujamunicipal.gov.ng
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Property Registration</p>
                  <p className="text-xs text-slate-500">New registrations</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a href="tel:+2348003BWARITC" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Phone className="h-4 w-4" />
                  +234 (0) 8003 BWARITC
                </a>
                <a href="mailto:support@abujamunicipal.gov.ng" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Mail className="h-4 w-4" />
                  support@abujamunicipal.gov.ng
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Headphones className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Technical Support</p>
                  <p className="text-xs text-slate-500">Portal & system issues</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a href="tel:+2348003BWARITC" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Phone className="h-4 w-4" />
                  +234 (0) 8003 BWARITC
                </a>
                <a href="mailto:support@abujamunicipal.gov.ng" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Mail className="h-4 w-4" />
                  support@abujamunicipal.gov.ng
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Citizen Services</p>
                  <p className="text-xs text-slate-500">General enquiries</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a href="tel:+2348003BWARITC" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Phone className="h-4 w-4" />
                  +234 (0) 8003 BWARITC
                </a>
                <a href="mailto:support@abujamunicipal.gov.ng" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Mail className="h-4 w-4" />
                  support@abujamunicipal.gov.ng
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Field Operations</p>
                  <p className="text-xs text-slate-500">Agent oversight</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <a href="tel:+2348003BWARITC" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Phone className="h-4 w-4" />
                  +234 (0) 8003 BWARITC
                </a>
                <a href="mailto:support@abujamunicipal.gov.ng" className="flex items-center gap-2 text-sm text-slate-700 hover:text-emerald-700">
                  <Mail className="h-4 w-4" />
                  support@abujamunicipal.gov.ng
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Map + Directions */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Abuja Municipal Area Council Secretariat</h3>
              <p className="mt-2 text-sm text-slate-600">
                Abuja Municipal Town, FCT — Abuja, Nigeria
              </p>
              <div className="mt-4 space-y-2">
                <a href="https://maps.google.com/?q=Abuja+Municipal+Area+Council+Secretariat" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps
                </a>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Getting Here</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                  Located in the city centre, near the Federal Secretariat complex.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                  Public parking available on-site.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                  Accessible entrance for persons with disabilities.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="mt-14 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm md:p-8">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Announcements</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Latest Updates</h2>
          <div className="mt-6 space-y-4">
            <div className="flex gap-4 rounded-xl border border-emerald-100 bg-white p-4">
              <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">2026 Digital rate assessment is now open</p>
                <p className="mt-1 text-sm text-slate-600">Property owners can now complete annual assessments through the online portal.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-emerald-100 bg-white p-4">
              <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">New payment channels added</p>
                <p className="mt-1 text-sm text-slate-600">You can now pay via bank transfer, card, and mobile money.</p>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}