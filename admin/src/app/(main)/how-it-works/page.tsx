"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Smartphone, Users, Globe, CreditCard, Building2, CheckCircle, ArrowRight, Wallet, Phone, Mail, MessageCircle, Hash, QrCode } from "lucide-react";

export default function HowItWorksPage() {
    return (
        <main>
            {/* Hero Section */}
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
                        {/* Left side - Terminal visualization */}
                        <div className="w-full lg:w-1/2 order-2">
                            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl">
                                {/* Terminal header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-400"></div>
                                        <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                                        <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-700">PAYMENT OPTIONS</div>
                                </div>

                                {/* Terminal content */}
                                <div className="space-y-3 font-mono text-sm">
                                    <div>
                                        <span className="text-emerald-600">$</span>
                                        <span className="text-slate-800 ml-2 font-semibold">amac payment-methods --list</span>
                                    </div>

                                    {/* Payment Methods List */}
                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span className="text-slate-700">1. Mobile App</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span className="text-slate-700">2. Agent Payment</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span className="text-slate-700">3. Web Portal</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span className="text-slate-700">4. USSD Code</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span className="text-slate-700">5. WhatsApp Chatbot</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <QrCode className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span className="text-slate-700">5. QR Code</span>
                                        </div>
                                    </div>

                                    {/* Status Box */}
                                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                        <p className="text-xs text-emerald-700 font-semibold">✓ All systems operational</p>
                                        <p className="text-xs text-emerald-600 mt-1">5 payment channels active</p>
                                    </div>
                                </div>
                            </div>
                        </div> 

                        {/* Right side - Text content */}
                        <div className="w-full lg:w-1/2 text-left order-1">
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Simple & Secure
                            </span>
                            <h1 className="mt-6 text-3xl font-bold leading-tight text-white md:text-5xl">
                                How It Works
                            </h1>
                            <p className="mt-4 text-base text-emerald-50 md:text-lg">
                                Streamline your revenue payments with our secure, multi-channel platform. Experience fast, reliable, and convenient payment processing designed for your needs.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-start gap-4">
                                <Link href="/payment" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50">
                                    Make Payment
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="#payment-methods" className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
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
                    <span className="text-xs uppercase tracking-wide text-emerald-700">Payment Options</span>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Five Easy Ways to Pay</h2>
                    <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                        We offer flexible payment methods to suit your preference and convenience.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {/* Method 1: Mobile App */}
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <Smartphone className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center">1. Through the Mobile App</h3>
                        <p className="mt-2 text-sm text-slate-600 text-center mb-6">
                            Pay directly from your smartphone with our easy-to-use mobile application.
                        </p>

                        {/* Flow Diagram */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Login to Your Account</p>
                                    <p className="text-xs text-slate-600">Sign in securely with your credentials</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Credit Your Account</p>
                                    <p className="text-xs text-slate-600">Add funds to your wallet</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">View Your Bills</p>
                                    <p className="text-xs text-slate-600">Check available payments and invoices</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Make Payment</p>
                                    <p className="text-xs text-slate-600">Pay instantly with card or bank transfer</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-xs font-medium">Instant confirmation</span>
                        </div>
                    </div>

                    {/* Method 2: Through Agent */}
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <Users className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center">2. Through an Agent</h3>
                        <p className="mt-2 text-sm text-slate-600 text-center mb-6">
                            Visit any authorized agent to make your payment in person with cash assistance.
                        </p>

                        {/* Flow Diagram */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Visit an Agent</p>
                                    <p className="text-xs text-slate-600">Go to any authorized AMAC agent</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Provide Your Details</p>
                                    <p className="text-xs text-slate-600">Enter phone number, member ID, or payment ID</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Select Payment</p>
                                    <p className="text-xs text-slate-600">Choose from available payments</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Choose Payment Method</p>
                                    <p className="text-xs text-slate-600">Pay by card or bank transfer</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700">
                            <Wallet className="h-4 w-4" />
                            <span className="text-xs font-medium">Cash assistance available</span>
                        </div>
                    </div>

                    {/* Method 3: Web Portal */}
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <Globe className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center">3. Through the Web Portal</h3>
                        <p className="mt-2 text-sm text-slate-600 text-center mb-6">
                            Pay online from any device using our secure web portal without downloading an app.
                        </p>

                        {/* Flow Diagram */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Visit the Portal</p>
                                    <p className="text-xs text-slate-600">Go to the AMAC Revenue website</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Enter Your Details</p>
                                    <p className="text-xs text-slate-600">Provide phone number, member ID, or payment ID</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">View Available Payments</p>
                                    <p className="text-xs text-slate-600">See all pending payments and invoices</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Make Payment</p>
                                    <p className="text-xs text-slate-600">Pay through the provided account details</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700">
                            <Building2 className="h-4 w-4" />
                            <span className="text-xs font-medium">No app download needed</span>
                        </div>
                    </div>

                    {/* Method 4: USSD */}
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <Phone className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center">4. Via USSD</h3>
                        <p className="mt-2 text-sm text-slate-600 text-center mb-6">
                            Make payments directly from your mobile phone using USSD code, no internet required.
                        </p>

                        {/* Flow Diagram */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Dial USSD Code</p>
                                    <p className="text-xs text-slate-600">Dial *123# on your mobile phone</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Enter Phone Number</p>
                                    <p className="text-xs text-slate-600">Provide your registered phone number</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Select Payment</p>
                                    <p className="text-xs text-slate-600">Choose from available bills</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Confirm Payment</p>
                                    <p className="text-xs text-slate-600">Authorize with your PIN</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700">
                            <Hash className="h-4 w-4" />
                            <span className="text-xs font-medium">Works on any phone</span>
                        </div>
                    </div>

                    {/* Method 5: WhatsApp Chatbot */}
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <MessageCircle className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center">5. WhatsApp Chatbot</h3>
                        <p className="mt-2 text-sm text-slate-600 text-center mb-6">
                            Pay conveniently through our WhatsApp chatbot with simple text commands.
                        </p>

                        {/* Flow Diagram */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Open WhatsApp</p>
                                    <p className="text-xs text-slate-600">Message us on WhatsApp</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Provide Details</p>
                                    <p className="text-xs text-slate-600">Share phone number or member ID</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Select Payment</p>
                                    <p className="text-xs text-slate-600">Choose from available invoices</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Complete Payment</p>
                                    <p className="text-xs text-slate-600">Pay via card or bank transfer link</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Interactive chatbot</span>
                        </div>
                    </div>

                    {/* Method 6: QR Code */}
                    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <QrCode className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center">6. QR Code Payment</h3>
                        <p className="mt-2 text-sm text-slate-600 text-center mb-6">
                            Scan the QR code to make a quick and secure payment.
                        </p>

                        {/* Flow Diagram */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">1</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Open Demand Notice</p>
                                    <p className="text-xs text-slate-600">Scan Qr Code on Demand Notice</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Provide Details</p>
                                    <p className="text-xs text-slate-600">Share phone number or member ID</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Select Payment</p>
                                    <p className="text-xs text-slate-600">Choose from available invoices</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">4</div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Complete Payment</p>
                                    <p className="text-xs text-slate-600">Confirm and submit your payment</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-2 text-emerald-700">
                            <QrCode className="h-4 w-4" />
                            <span className="text-xs font-medium">QR Code Payment</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual Process Illustration */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Complete Process</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">From Payment to Receipt</h2>
                        <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                            Every payment goes through our secure verification system to ensure your transaction is recorded and documented.
                        </p>
                    </div>

                    {/* Process Flow */}
                    <div className="grid gap-6 md:grid-cols-5 items-center">
                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <Phone className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-900">Initiate Payment</p>
                            <p className="text-xs text-slate-600 mt-1">Choose your preferred method</p>
                        </div>

                        <div className="hidden md:flex justify-center">
                            <ArrowRight className="h-6 w-6 text-emerald-400" />
                        </div>

                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-900">Complete Transaction</p>
                            <p className="text-xs text-slate-600 mt-1">Pay via card or transfer</p>
                        </div>

                        <div className="hidden md:flex justify-center">
                            <ArrowRight className="h-6 w-6 text-emerald-400" />
                        </div>

                        <div className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-900">Receive Receipt</p>
                            <p className="text-xs text-slate-600 mt-1">Instant confirmation</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verification & Receipt Section */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6 md:pb-20">
                <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-cyan-50 p-6 shadow-sm md:p-8">
                    <div className="mb-6">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Verify & Download</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Payment Verification & Receipts</h2>
                        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                            After making any payment, you can verify its status and download your official receipt for your records.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        <div className="flex gap-4">
                            <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <CheckCircle className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Payment Verification</h3>
                                <p className="mt-1 text-sm text-slate-600">Verify your payment status instantly using your transaction ID or phone number.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <Mail className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Email Receipt</h3>
                                <p className="mt-1 text-sm text-slate-600">Receive an official PDF receipt via email for all your payments instantly.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <Wallet className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Complete History</h3>
                                <p className="mt-1 text-sm text-slate-600">Access your complete payment history and download receipts anytime.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/payment#verify" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                            Verify Payment
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <a href="mailto:support@abujamunicipal.gov.ng" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
                            <Mail className="h-4 w-4" />
                            Contact Support
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}