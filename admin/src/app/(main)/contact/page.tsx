"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Clock, MapPin, ArrowRight, Users, Building2, Headphones, CheckCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="w-full bg-[#F5F7F5] pb-3 font-['Inter',sans-serif] text-[#0E1F17]">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-[#0B3B26]">
        <div className="absolute inset-0">
          <Image
            src="/amac.jpg"
            alt="AMAC Secretariat Building"
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-[#0B3B26]/90" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />
        </div>
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/45 bg-[#1B9E5A]/[0.18] px-3.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
              Contact & Support
            </span>
            <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Talk to the Amac Revenue team
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              Send inquiries on onboarding, operations, system access, billing, and agent support. We respond within 1–2 business days.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 pb-3 md:px-6">
        {/* ---------- QUICK CONTACT CARDS ---------- */}
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Phone</p>
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">Call Support</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#0E1F17]">+234 (0) 8003 BWARITC</p>
            <p className="mt-2 text-sm text-[#5B6B62]">Monday to Friday, 8:00 am – 5:00 pm WAT.</p>
            <div className="mt-4">
              <a href="tel:+2348003BWARITC" className="inline-flex items-center gap-2 text-sm font-semibold text-[#158049] hover:text-[#0B3B26]">
                Call Now
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Email</p>
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">Send Message</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#0E1F17]">support@abujamunicipal.gov.ng</p>
            <p className="mt-2 text-sm text-[#5B6B62]">Best for formal enquiries and documentation. Responses within 1–2 business days.</p>
            <div className="mt-4">
              <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 text-sm font-semibold text-[#158049] hover:text-[#0B3B26]">
                Compose Email
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Office</p>
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">Visit / Post</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#0E1F17]">Abuja Municipal Area Council Secretariat</p>
            <p className="mt-2 text-sm text-[#5B6B62]">Abuja Municipal Town, FCT — Abuja, Nigeria</p>
            <div className="mt-4">
              <a href="https://maps.google.com/?q=Abuja+Municipal+Area+Council+Secretariat" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#158049] hover:text-[#0B3B26]">
                Get Directions
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* ---------- OFFICE HOURS + PORTAL ---------- */}
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <div className="rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-6 shadow-sm md:p-7">
            <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Office Hours</p>
            <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Opening times</h3>
            <p className="mt-1 text-sm text-[#5B6B62]">Monday – Friday, 8 am – 5 pm WAT.</p>
            <div className="mt-5">
              <div className="flex items-center justify-between border-b border-[#1B9E5A]/20 py-3">
                <span className="text-sm font-medium text-[#0E1F17]/80">Monday – Thursday</span>
                <span className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[#0E1F17]">08:00 – 17:00</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#1B9E5A]/20 py-3">
                <span className="text-sm font-medium text-[#0E1F17]/80">Friday</span>
                <span className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[#0E1F17]">08:00 – 16:00</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#1B9E5A]/20 py-3">
                <span className="text-sm font-medium text-[#0E1F17]/80">Saturday – Sunday</span>
                <span className="text-xs font-bold uppercase tracking-wide text-red-600">Closed</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-[#5B6B62]">Hours may vary on public holidays. Call ahead to confirm availability.</p>
          </div>

          <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-7">
            <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Online Portal</p>
            <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Services available 24 / 7</h3>
            <p className="mt-1 text-sm text-[#5B6B62]">Pay rates, register properties, track complaints, and download receipts online.</p>
            <div className="mt-5">
              <Link href="/payment" className="inline-flex items-center gap-2 rounded-xl bg-[#0E1F17] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                Make Payment
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ---------- SECURITY NOTICE ---------- */}
        <div className="mt-14 rounded-[20px] border border-[#E8A33D]/40 bg-[#E8A33D]/[0.08] p-6 md:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8A33D] text-white">
              <CheckCircle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Only trust our official channels</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0E1F17]/75">
                All correspondence about your payments or account should come from the phone number, email address, and office listed on this page. If you receive a call or message from another number asking for payment or personal information, do not respond — instead, call us on the number above to confirm.
              </p>
            </div>
          </div>
        </div>

        {/* ---------- TALK TO TEAM BAND ---------- */}
        <div className="mt-8 overflow-hidden rounded-[28px] bg-[#0B3B26] p-6 shadow-sm md:p-8">
          <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Need help?</p>
          <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">Talk to the Amac Revenue team</h2>
          <p className="mt-3 text-sm text-white/65 md:text-base">Send inquiries on onboarding, operations, and system access.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5">
              <Mail className="h-4 w-4" />
              support@abujamunicipal.gov.ng
            </a>
            <a href="tel:+2348003BWARITC" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5">
              <Phone className="h-4 w-4" />
              +234 (0) 8003 BWARITC
            </a>
          </div>
        </div>

        {/* ---------- DEPARTMENT CONTACTS ---------- */}
        <div className="mt-14">
          <div className="mb-6">
            <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Departments</p>
            <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Direct Contacts</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">Reach the right team directly for faster assistance.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              { icon: Users, title: "Revenue Collection", subtitle: "Billing & payments" },
              { icon: Building2, title: "Property Registration", subtitle: "New registrations" },
              { icon: Headphones, title: "Technical Support", subtitle: "Portal & system issues" },
              { icon: Users, title: "Citizen Services", subtitle: "General enquiries" },
              { icon: MapPin, title: "Field Operations", subtitle: "Agent oversight" },
            ].map(({ icon: Icon, title, subtitle }) => (
              <div key={title} className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">{title}</p>
                    <p className="font-['JetBrains_Mono',monospace] text-xs text-[#5B6B62]">{subtitle}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <a href="tel:+2348003BWARITC" className="flex items-center gap-2 text-sm text-[#0E1F17]/75 hover:text-[#158049]">
                    <Phone className="h-4 w-4" />
                    +234 (0) 8003 BWARITC
                  </a>
                  <a href="mailto:support@abujamunicipal.gov.ng" className="flex items-center gap-2 text-sm text-[#0E1F17]/75 hover:text-[#158049]">
                    <Mail className="h-4 w-4" />
                    support@abujamunicipal.gov.ng
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- MAP + DIRECTIONS ---------- */}
        <div className="mt-14 rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#5B6B62]">Location</p>
              <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">Abuja Municipal Area Council Secretariat</h3>
              <p className="mt-2 text-sm text-[#5B6B62]">
                Abuja Municipal Town, FCT — Abuja, Nigeria
              </p>
              <div className="mt-4 space-y-2">
                <a href="https://maps.google.com/?q=Abuja+Municipal+Area+Council+Secretariat" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0B3B26] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps
                </a>
              </div>
            </div>
            <div className="rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
              <p className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#5B6B62]">Getting Here</p>
              <ul className="mt-3 space-y-2 text-sm text-[#0E1F17]/80">
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                  Located in the city centre, near the Federal Secretariat complex.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                  Public parking available on-site.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#158049]" />
                  Accessible entrance for persons with disabilities.
                </li>
              </ul>
            </div>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.2607016849024!2d7.484536335422675!3d9.039966973634384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x104e0b1a5fed139b%3A0xa58673691828237e!2sAbuja%20Municipal%20Area%20Council!5e0!3m2!1sen!2sng!4v1786455773378!5m2!1sen!2sng"
            width="600"
            height="650"
            loading="lazy"
            className="mt-6 h-[480px] w-full rounded-[20px] border border-[#E1E7E2]"
          />
        </div>

        {/* ---------- ANNOUNCEMENTS ---------- */}
        <div className="mt-14 rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-6 shadow-sm md:p-8">
          <p className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Announcements</p>
          <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Latest Updates</h2>
          <div className="mt-6 space-y-4">
            <div className="flex gap-4 rounded-[16px] border border-[#1B9E5A]/20 bg-white p-4">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E4F5EB] text-[#158049]">
                <CheckCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">2026 Digital rate assessment is now open</p>
                <p className="mt-1 text-sm text-[#5B6B62]">Property owners can now complete annual assessments through the online portal.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-[16px] border border-[#1B9E5A]/20 bg-white p-4">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E4F5EB] text-[#158049]">
                <CheckCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">New payment channels added</p>
                <p className="mt-1 text-sm text-[#5B6B62]">You can now pay via bank transfer, card, and mobile money.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}