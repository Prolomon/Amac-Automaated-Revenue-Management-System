"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Smartphone, Users, Globe, CreditCard, Building2, CheckCircle, ArrowRight, Wallet, Phone, Mail, MessageCircle, Hash, QrCode } from "lucide-react";

const PAYMENT_METHODS = [
    {
        icon: Smartphone,
        title: "1. Through the Mobile App",
        desc: "Pay directly from your smartphone with our easy-to-use mobile application.",
        steps: [
            { title: "Login to Your Account", desc: "Sign in securely with your credentials" },
            { title: "Credit Your Account", desc: "Add funds to your wallet" },
            { title: "View Your Bills", desc: "Check available payments and invoices" },
            { title: "Make Payment", desc: "Pay instantly with card or bank transfer" },
        ],
        tag: { icon: CreditCard, label: "Instant confirmation" },
    },
    {
        icon: Users,
        title: "2. Through an Agent",
        desc: "Visit any authorized agent to make your payment in person with cash assistance.",
        steps: [
            { title: "Visit an Agent", desc: "Go to any authorized AMAC agent" },
            { title: "Provide Your Details", desc: "Enter phone number, member ID, or payment ID" },
            { title: "Select Payment", desc: "Choose from available payments" },
            { title: "Choose Payment Method", desc: "Pay by card or bank transfer" },
        ],
        tag: { icon: Wallet, label: "Cash assistance available" },
    },
    {
        icon: Globe,
        title: "3. Through the Web Portal",
        desc: "Pay online from any device using our secure web portal without downloading an app.",
        steps: [
            { title: "Visit the Portal", desc: "Go to the AMAC Revenue website" },
            { title: "Enter Your Details", desc: "Provide phone number, member ID, or payment ID" },
            { title: "View Available Payments", desc: "See all pending payments and invoices" },
            { title: "Make Payment", desc: "Pay through the provided account details" },
        ],
        tag: { icon: Building2, label: "No app download needed" },
    },
    {
        icon: Phone,
        title: "4. Via USSD",
        desc: "Make payments directly from your mobile phone using USSD code, no internet required.",
        steps: [
            { title: "Dial USSD Code", desc: "Dial *123# on your mobile phone" },
            { title: "Enter Phone Number", desc: "Provide your registered phone number" },
            { title: "Select Payment", desc: "Choose from available bills" },
            { title: "Confirm Payment", desc: "Authorize with your PIN" },
        ],
        tag: { icon: Hash, label: "Works on any phone" },
    },
    {
        icon: MessageCircle,
        title: "5. WhatsApp Chatbot",
        desc: "Pay conveniently through our WhatsApp chatbot with simple text commands.",
        steps: [
            { title: "Open WhatsApp", desc: "Message us on WhatsApp" },
            { title: "Provide Details", desc: "Share phone number or member ID" },
            { title: "Select Payment", desc: "Choose from available invoices" },
            { title: "Complete Payment", desc: "Pay via card or bank transfer link" },
        ],
        tag: { icon: MessageCircle, label: "Interactive chatbot" },
    },
    {
        icon: QrCode,
        title: "6. QR Code Payment",
        desc: "Scan the QR code to make a quick and secure payment.",
        steps: [
            { title: "Open Demand Notice", desc: "Scan Qr Code on Demand Notice" },
            { title: "Provide Details", desc: "Share phone number or member ID" },
            { title: "Select Payment", desc: "Choose from available invoices" },
            { title: "Complete Payment", desc: "Confirm and submit your payment" },
        ],
        tag: { icon: QrCode, label: "QR Code Payment" },
    },
];

export default function HowItWorksPage() {
    return (
        <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
            {/* Hero Section */}
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
                        {/* Terminal visualization */}
                        <div className="order-2 w-full lg:w-1/2">
                            <div className="rounded-[20px] border border-white/10 bg-[#0A1410] p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
                                {/* Terminal header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                                        <div className="h-3 w-3 rounded-full bg-yellow-400/80"></div>
                                        <div className="h-3 w-3 rounded-full bg-[#4ADE80]/80"></div>
                                    </div>
                                    <div className="font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">Payment Options</div>
                                </div>

                                {/* Terminal content */}
                                <div className="space-y-3 font-['JetBrains_Mono',monospace] text-sm">
                                    <div>
                                        <span className="text-[#7BD9A6]">$</span>
                                        <span className="ml-2 font-semibold text-white">amac payment-methods --list</span>
                                    </div>

                                    {/* Payment Methods List */}
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                            <span className="text-white/75">1. Mobile App</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                            <span className="text-white/75">2. Agent Payment</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                            <span className="text-white/75">3. Web Portal</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                            <span className="text-white/75">4. USSD Code</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                            <span className="text-white/75">5. WhatsApp Chatbot</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-[#7BD9A6]" />
                                            <span className="text-white/75">6. QR Code</span>
                                        </div>
                                    </div>

                                    {/* Status Box */}
                                    <div className="mt-4 rounded-xl border border-[#1B9E5A]/30 bg-[#1B9E5A]/12 p-3">
                                        <p className="text-xs font-semibold text-[#8FE0B4]">✓ All systems operational</p>
                                        <p className="mt-1 text-xs text-white/50">6 payment channels active</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Text content */}
                        <div className="order-1 w-full text-left lg:w-1/2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/45 bg-[#1B9E5A]/18 px-3.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
                                Simple & Secure
                            </span>
                            <h1 className="mt-6 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                                How It Works
                            </h1>
                            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
                                Streamline your revenue payments with our secure, multi-channel platform. Experience fast, reliable, and convenient payment processing designed for your needs.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-start gap-4">
                                <Link href="/payment" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5">
                                    Make Payment
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="#payment-methods" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                                    View Options
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Payment Methods */}
            <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6 md:py-24">
                <div className="mb-10 text-center">
                    <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Payment Options</span>
                    <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Six Easy Ways to Pay</h2>
                    <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                        We offer flexible payment methods to suit your preference and convenience.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {PAYMENT_METHODS.map(({ icon: Icon, title, desc, steps, tag }) => (
                        <div key={title} className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#E4F5EB] text-[#158049]">
                                    <Icon className="h-8 w-8" />
                                </div>
                            </div>
                            <h3 className="text-center font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">{title}</h3>
                            <p className="mb-6 mt-2 text-center text-sm text-[#5B6B62]">{desc}</p>

                            {/* Flow Diagram */}
                            <div className="space-y-3">
                                {steps.map((step, i) => (
                                    <div key={step.title} className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E4F5EB] font-['JetBrains_Mono',monospace] text-sm font-bold text-[#158049]">{i + 1}</div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#0E1F17]">{step.title}</p>
                                            <p className="text-xs text-[#5B6B62]">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-[#158049]">
                                <tag.icon className="h-4 w-4" />
                                <span className="text-xs font-medium">{tag.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Visual Process Illustration */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
                <div className="rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Complete Process</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">From Payment to Receipt</h2>
                        <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                            Every payment goes through our secure verification system to ensure your transaction is recorded and documented.
                        </p>
                    </div>

                    {/* Process Flow */}
                    <div className="grid items-center gap-6 md:grid-cols-5">
                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#158049] shadow-sm">
                                <Phone className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-[#0E1F17]">Initiate Payment</p>
                            <p className="mt-1 text-xs text-[#5B6B62]">Choose your preferred method</p>
                        </div>

                        <div className="hidden justify-center md:flex">
                            <ArrowRight className="h-6 w-6 text-[#1B9E5A]/50" />
                        </div>

                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#158049] shadow-sm">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-[#0E1F17]">Complete Transaction</p>
                            <p className="mt-1 text-xs text-[#5B6B62]">Pay via card or transfer</p>
                        </div>

                        <div className="hidden justify-center md:flex">
                            <ArrowRight className="h-6 w-6 text-[#1B9E5A]/50" />
                        </div>

                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#158049] shadow-sm">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-[#0E1F17]">Receive Receipt</p>
                            <p className="mt-1 text-xs text-[#5B6B62]">Instant confirmation</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verification & Receipt Section */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
                <div className="overflow-hidden rounded-[28px] bg-[#0B3B26] p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Verify & Download</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">Payment Verification & Receipts</h2>
                        <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
                            After making any payment, you can verify its status and download your official receipt for your records.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {[
                            { icon: CheckCircle, title: "Payment Verification", desc: "Verify your payment status instantly using your transaction ID or phone number." },
                            { icon: Mail, title: "Email Receipt", desc: "Receive an official PDF receipt via email for all your payments instantly." },
                            { icon: Wallet, title: "Complete History", desc: "Access your complete payment history and download receipts anytime." },
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

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/payment#verify" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0E1F17] transition-transform hover:-translate-y-0.5">
                            Verify Payment
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">
                            <Mail className="h-4 w-4" />
                            Contact Support
                        </a>
                    </div>
                </div>
            </section>

            {/* Safety Reminder */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
                <div className="rounded-[20px] border border-[#E8A33D]/40 bg-[#E8A33D]/8 p-6 md:p-8">
                    <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">A quick safety reminder</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#0E1F17]/75">
                        Every step above happens on this website or through our verified agents and official channels. We never ask for payment through personal bank accounts, and every successful payment always produces a receipt you can verify. If anything feels off, stop and call our support line before proceeding.
                    </p>
                </div>
            </section>
        </main>
    );
}