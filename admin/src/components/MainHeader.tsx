"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "Payment", href: "/payment" },
    { label: "How it Works", href: "/how-it-works" },
    { label: "Recruitment", href: "/recruitment-portal" },
    { label: "Features", href: "/features" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
];

export function MainHeader() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/";
        }
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="rounded-xl border border-emerald-300 bg-white p-1 shadow-sm">
                        <Image src="/icon.png" alt="Karu Revenue Logo" width={34} height={34} />
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight text-slate-900">Amac Revenue</p>
                        <p className="text-xs text-slate-500">Management System</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="max-md:hidden items-center gap-3 flex">
                    {navLinks.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/recruitment-portal"
                        className="hidden rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 sm:inline-flex"
                    >
                        Recruitment
                    </Link>
                    <Link
                        href="/auth/admin"
                        className="hidden rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 md:inline-flex"
                    >
                        Login
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="max-md:inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-emerald-50 hidden"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="border-t border-emerald-100 bg-white md:hidden">
                    <nav className="flex flex-col px-4 py-3">
                        {navLinks.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`inline-flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                        active
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/auth/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}