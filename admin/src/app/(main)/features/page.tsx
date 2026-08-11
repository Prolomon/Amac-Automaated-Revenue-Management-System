"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Eye, FileText, Clock, ShieldCheck, CheckCircle, ArrowRight, Settings, Users, TrendingUp } from "lucide-react";

export default function FeaturesPage() {
  return (
    <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-[#0B3B26]">
        <div className="absolute inset-0">
          <Image
            src="/amac.jpg"
            alt="Abuja Municipal Area Council"
            fill
            priority
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[#0B3B26]/90" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="flex flex-col items-center justify-between gap-10 lg:flex-row lg:gap-16">
            {/* Text content */}
            <div className="w-full text-left lg:w-1/2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/45 bg-[#1B9E5A]/[0.18] px-3.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
                Simple & Secure
              </span>
              <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                Manage your revenue payments online
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
                Pay your tenement and business rates, download receipts, submit complaints, and track your payment history — all from one secure portal.
              </p>
              <div className="mt-8 flex flex-wrap justify-start gap-3">
                <Link href="/payment" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5">
                  Make Payment Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">
                  Contact Support
                </a>
              </div>
            </div>

            {/* Terminal visualization */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-[20px] border border-white/10 bg-[#0A1410] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
                {/* Terminal header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-[#4ADE80]/80"></div>
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">Features List</div>
                </div>

                {/* Terminal content */}
                <div className="space-y-3 font-['JetBrains_Mono',monospace] text-sm">
                  <div>
                    <span className="text-[#7BD9A6]">$</span>
                    <span className="ml-2 font-semibold text-white">amac features --list</span>
                  </div>

                  {/* Features List */}
                  <div className="mt-4 space-y-2">
                    {[
                      "1. Online Payments",
                      "2. Digital Invoices & Receipts",
                      "3. View Payment History",
                      "4. Submit Complaint",
                      "5. Certificate Verification",
                      "6. 24/7 Availability",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                        <span className="text-white/75">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Box */}
                  <div className="mt-4 rounded-[12px] border border-[#1B9E5A]/30 bg-[#1B9E5A]/[0.12] p-3">
                    <p className="text-xs font-semibold text-[#8FE0B4]">✓ All systems operational</p>
                    <p className="mt-1 text-xs text-white/50">6 features available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CITIZEN FEATURES ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
        <div className="mb-10">
          <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Citizen Features</span>
          <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Everything you need to manage your payments</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
            A simple, secure, and transparent platform for all your revenue payment needs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[
            { icon: Phone, title: "Online Payments", desc: "Pay your tenement and business rates securely online using card, bank transfer, or mobile money through Remita." },
            { icon: Mail, title: "Digital Invoices & Receipts", desc: "Generate invoices instantly and download payment receipts for your records. No paperwork required." },
            { icon: Eye, title: "View Payment History", desc: "Access your complete transaction history anytime. Track all your payments with dates and receipt numbers." },
            { icon: FileText, title: "Submit Complaints", desc: "Have an issue with your bill or property assessment? Submit a complaint online and track its progress until resolution." },
            { icon: ShieldCheck, title: "Certificate Verification", desc: "Verify your tenement rate certificate online. Share the verification link with employers, banks, or government agencies." },
            { icon: Clock, title: "24/7 Availability", desc: "Access the portal anytime, anywhere. Make payments, download receipts, or submit complaints at your convenience." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">{title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#5B6B62]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- SECURITY ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
        <div className="rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Secure & Transparent</span>
            <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Your payments are protected</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
              We use bank-level security to ensure your transactions are safe and your data is protected.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "SSL Encrypted Payments", desc: "All transactions are secured with 256-bit SSL encryption through Nombank, the Federal Government approved payment gateway." },
              { icon: CheckCircle, title: "Instant Confirmation", desc: "Receive immediate payment confirmation and download your receipt instantly after successful payment." },
              { icon: ShieldCheck, title: "Full Transparency", desc: "Every transaction is recorded and auditable. View your complete payment history with all details." },
              { icon: Clock, title: "Dedicated Support", desc: "Our support team is available Monday to Friday, 8:00am to 5:00pm WAT to assist you with any questions." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#158049] shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">{title}</h3>
                  <p className="mt-1 text-sm text-[#5B6B62]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
        <div className="mb-10">
          <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">How It Works</span>
          <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Get started in three simple steps</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
            Making payments has never been easier. Follow these steps to complete your transaction.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: Settings, title: "Create an Account", desc: "Sign up with your details to access the portal and manage your revenue payments." },
            { icon: FileText, title: "Generate Invoice", desc: "Enter your property details to generate an invoice with your assessment amount." },
            { icon: CheckCircle, title: "Make Payment", desc: "Pay securely using your preferred method and get instant confirmation and receipt." },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#E4F5EB] text-[#158049]">
                <Icon className="h-8 w-8" />
              </div>
              <p className="mt-3 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Step {i + 1}</p>
              <h3 className="mt-1 font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">{title}</h3>
              <p className="mt-2 text-sm text-[#5B6B62]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- WHY CHOOSE US ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
        <div className="overflow-hidden rounded-[28px] bg-[#0B3B26] p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Why Choose Us</span>
            <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">Built for efficiency and trust</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
              Join thousands of citizens who trust AMAC Revenue Management for their payment needs.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Users, title: "1000+ Active Users", desc: "Trusted by over 1,000 citizens and businesses across Abuja Municipal Area Council." },
              { icon: TrendingUp, title: "Increased Revenue", desc: "Transparent system has helped increase revenue collection by 40% in the first year." },
              { icon: ShieldCheck, title: "Government Approved", desc: "Officially endorsed and audited by the Federal Government of Nigeria." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#8FE0B4]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/65">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
        <div className="mb-6">
          <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Questions</span>
          <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Frequently asked about our features</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { q: "Do I need to create an account to pay?", a: "No. You can pay using your phone number, member ID, or payment ID from the Payment page without registering. Creating an account simply lets you track history and manage multiple properties." },
            { q: "How is my invoice amount calculated?", a: "Assessments are based on your property category, size, and location as registered with the council. Contact support if you believe your assessment needs review." },
            { q: "Can I download my receipt later?", a: "Yes. Every successful payment is stored against your profile and can be retrieved anytime from the Payment page using your reference number." },
            { q: "What if my payment fails?", a: "If a payment is deducted but not confirmed, use the Verify Payment tool or contact support with your reference number and we will reconcile it promptly." },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
              <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">{q}</h3>
              <p className="mt-2 text-sm text-[#5B6B62]">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}