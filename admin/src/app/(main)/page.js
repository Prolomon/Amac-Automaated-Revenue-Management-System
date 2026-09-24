"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Users,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  BadgeCheck,
  Receipt,
  UserCheck,
  AlertTriangle,
  Building2,
} from "lucide-react";

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
              AMAC Official Revenue & Tax Portal
            </span>
            <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Pay your council taxes, tenement rates & levies online.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              The fast, transparent way for AMAC residents and business owners to fulfill municipal rate obligations, verify assessments, and receive instant digital receipts.
            </p>
            <p className="mt-3 max-w-lg text-sm font-medium text-white/85">
              Powered by secure automated banking gateways with real-time settlement into Abuja Municipal Area Council treasury.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/payment"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0E1F17] shadow-md transition-transform hover:-translate-y-0.5"
              >
                <CreditCard className="h-4 w-4 text-[#158049]" />
                Make Tax Payment
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <Building2 className="h-4 w-4 text-[#8FE0B4]" />
                Register Business / Property
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                How It Works
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
            <Image
              src="/revenue-hero.svg"
              alt="AMAC Revenue and Tax Payment Portal"
              width={1200}
              height={900}
              className="h-auto w-full rounded-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ---------- RATEPAYER BENEFITS ---------- */}
      <section id="wallet" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <Receipt className="h-5 w-5" />
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Instant Proof of Payment</p>
            </div>
            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Official Digital Receipts</h3>
            <p className="mt-2 text-sm text-[#5B6B62]">
              Receive authentic, QR-verifiable council receipts immediately after payment to safeguard your property and business from enforcement penalties.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <CreditCard className="h-5 w-5" />
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Multiple Payment Channels</p>
            </div>
            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Pay Anytime, Anywhere</h3>
            <p className="mt-2 text-sm text-[#5B6B62]">
              Settle your dues seamlessly via debit card, online bank transfer, direct mobile USSD (*123#), or through accredited ward collection officers.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A]/15 text-[#158049]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Transparent Billing</p>
            </div>
            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Zero Illegal Surcharges</h3>
            <p className="mt-2 text-sm text-[#0E1F17]/75">
              All assessments reflect official council by-laws with clearly stated rates, protecting taxpayers from arbitrary billing and duplicate charges.
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
            <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Field Enumeration Careers</p>
          </div>
          <h2 className="mt-4 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">
            Join the AMAC Field Enumeration Team
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/65 md:text-base">
            We are enlisting field enumerators, verification agents, and operations support personnel across all Abuja Municipal Area Council wards.
          </p>
          <div className="mt-5">
            <Link
              href="/recruitment-portal"
              className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5"
            >
              Apply for Enumerator Recruitment
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES / SERVICES ---------- */}
      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-6">
          <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Taxpayer Services</p>
          <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Convenient municipal revenue services for everyone</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: CreditCard,
              title: "Online Tax & Rate Payment",
              desc: "Look up your bill with your phone number, member ID, or Payment Reference and pay instantly with zero hassle.",
            },
            {
              icon: Building2,
              title: "Property & Business Onboarding",
              desc: "Register residential tenements, shops, plazas, or corporate entities to acquire an official AMAC Tax ID.",
            },
            {
              icon: FileText,
              title: "Demand Notice Verification",
              desc: "Cross-check official council assessment notices and demand letters to confirm authenticity and prevent extortion.",
            },
            {
              icon: Receipt,
              title: "Clearance & Receipt History",
              desc: "Retrieve past digital receipts anytime, track annual compliance status, and resolve payment inquiries with ease.",
            },
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
            <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Why You Can Trust This Portal</p>
            <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Built for ratepayer accountability & safety</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62]">
              This is the authorized automated revenue collection platform of the Abuja Municipal Area Council. Here is how your payments and data are protected.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Encrypted transactions",
                desc: "All payments are processed through PCI-DSS certified bank gateways and never stored in plain text.",
              },
              {
                icon: BadgeCheck,
                title: "Official AMAC platform",
                desc: "Legally sanctioned by the Abuja Municipal Area Council for tenement rates, trade licenses, and municipal fee collection.",
              },
              {
                icon: Receipt,
                title: "Instant digital receipts",
                desc: "Every successful payment generates a verifiable council receipt with a distinct transaction reference.",
              },
              {
                icon: UserCheck,
                title: "Accredited field agents",
                desc: "Authorized enumeration and collection agents carry verifiable AMAC identification badges with QR verification.",
              },
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
              <span className="font-semibold">Security Notice:</span> Only pay through this official website, our accredited USSD code (*123#), direct bank transfer, or an accredited field revenue agent with an official printed receipt. AMAC officials will never ask you to pay into a private individual bank account.
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
              q: "Is this the official AMAC tax and rate payment platform?",
              a: "Yes. This portal is the authorized automated revenue management system used by the Abuja Municipal Area Council for tenement rates, business operation permits, environmental fees, and municipal levies.",
            },
            {
              q: "How do I make my rate payment online?",
              a: "Click 'Make Tax Payment', search for your bill using your Member ID, Phone Number, or Payment Reference (PAY|...), select your outstanding invoice, and complete payment via card, bank transfer, or USSD.",
            },
            {
              q: "How do I know a council field agent or demand notice is genuine?",
              a: "Every authentic agent carries a council ID card with an agent code. Demand notices carry official payment IDs that can be verified directly on this website. When in doubt, call our support line before making payment.",
            },
            {
              q: "Can I download my receipt after paying?",
              a: "Yes. An official digital receipt is generated instantly upon payment confirmation. You can download and print it immediately, or retrieve it later using your payment reference.",
            },
            {
              q: "What should I do if my payment does not reflect immediately?",
              a: "Card and bank transfer payments reflect automatically within seconds. If you experience a delay, please contact our support desk with your transaction reference number for instant resolution.",
            },
            {
              q: "Who is required to pay tenement rates in AMAC?",
              a: "Owners and occupiers of residential and commercial properties within the Abuja Municipal Area Council are statutory rateable persons under the AMAC Tenement Rate Bye-Laws.",
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
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Need Assistance?</p>
              <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Talk to the AMAC Revenue Support Desk</h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#5B6B62] md:text-base">
            Have questions about your rate assessment, demand notices, payment verification, or property registration? Our support officers are ready to assist you.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-2.5 text-sm font-medium text-[#0E1F17]/80 hover:bg-white transition-colors">
              <Mail className="h-4 w-4 text-[#158049]" />
              support@abujamunicipal.gov.ng
            </a>
            <a href="tel:+2348000000000" className="inline-flex items-center gap-2 rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-2.5 text-sm font-medium text-[#0E1F17]/80 hover:bg-white transition-colors">
              <Phone className="h-4 w-4 text-[#158049]" />
              +234 800 000 0000
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}