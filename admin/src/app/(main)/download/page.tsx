"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function ContactPage() {
  const carouselRef = useRef(null);

  useEffect(() => {
    // Duplicate the carousel track content once so the loop is seamless.
    const track = carouselRef.current;
    if (track && !track.dataset.duplicated) {
      track.innerHTML += track.innerHTML;
      track.dataset.duplicated = "true";
    }
  }, []);

  return (
    <main className="w-full pb-3 bg-paper text-ink font-sans">
      <section className="bg-emerald-800 text-white pt-16 overflow-hidden relative">
        <div className="max-w-290 mx-auto px-8 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-10 items-center text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 bg-green/[0.18] border border-green/45 text-[#8FE0B4] px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold font-mono mb-5.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]"></span>
              Official AMAC mobile app
            </div>
            <h1 className="font-display text-[32px] md:text-[44px] leading-[1.08] font-bold max-w-130 mx-auto md:mx-0">
              Pay tenement rates <span className="text-[#7BD9A6]">from your pocket,</span> not the queue.
            </h1>
            <p className="mt-5 text-[16.5px] leading-[1.65] text-white/72 max-w-115 mx-auto md:mx-0">
              Validate your wallet, settle bills, track every transaction and move funds — all from one app built for residents and businesses across Abuja Municipal.
            </p>
            <div className="flex gap-3 mt-8 flex-wrap justify-center md:justify-start">
              <a href="#download" className="flex items-center gap-2.5 bg-white text-emerald-800 px-4.5 py-2.75 rounded-xl text-sm font-semibold transition-transform hover:-translate-y-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14" stroke="#0E1F17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Download for Android
              </a>
              <a href="#download" className="flex items-center gap-2.5 bg-transparent text-white border border-white/28 px-4.5 py-2.75 rounded-xl text-sm font-semibold transition-transform hover:-translate-y-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Download for iOS
              </a>
            </div>
            <div className="flex gap-7 mt-10 pt-6 border-t border-white/14 max-w-115 mx-auto md:mx-0 justify-center md:justify-start">
              <div><b className="block font-display text-[22px] font-bold text-white">24</b><span className="text-[12.5px] text-white/55">Active centers</span></div>
              <div><b className="block font-display text-[22px] font-bold text-white">180+</b><span className="text-[12.5px] text-white/55">Verified agents</span></div>
              <div><b className="block font-display text-[22px] font-bold text-white">&#8358;8.4M</b><span className="text-[12.5px] text-white/55">Daily collections</span></div>
            </div>
          </div>

          <div className="relative flex justify-center mt-10 md:mt-0">
            <div className="w-62.5 rounded-[34px] bg-[#0A1410] p-2.5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)] relative -rotate-3 translate-y-2.5">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-17.5 h-4.5 bg-[#0A1410] rounded-b-xl z-10"></div>
              <Image src="/home.jpg" alt="AMAC Revenue app dashboard" className="rounded-3xl block w-full" width={500} height={300} />
            </div>
            <div className="hidden md:flex absolute top-[14%] left-[-6%] bg-white text-emerald-800 rounded-2xl px-3.5 py-2.5 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)] text-[12.5px] items-center gap-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-green-soft flex items-center justify-center text-green-dark font-bold text-[13px]">&#8358;</div>
              <div><b className="block text-[12.5px]">Payment received</b><span className="text-[10.5px] text-muted font-mono">REF-2249381</span></div>
            </div>
            <div className="hidden md:flex absolute bottom-[10%] right-[-8%] bg-white text-emerald-800 rounded-2xl px-3.5 py-2.5 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)] text-[12.5px] items-center gap-2.5">
              <div className="w-6.5 h-6.5 rounded-lg bg-green-soft flex items-center justify-center text-green-dark font-bold text-[13px]">&#10003;</div>
              <div><b className="block text-[12.5px]">Wallet verified</b><span className="text-[10.5px] text-muted font-mono">MEB-4985080040</span></div>
            </div>
          </div>
        </div>

        <div className="bg-ink overflow-hidden py-3.25 mt-14">
          <div className="ticker-track flex gap-10 w-max animate-ticker">
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">TENEMENT RENT ZONE A <span className="text-white/25">/</span> <b className="text-[#7BD9A6] font-semibold">PAID</b></span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">AGT-6089894298 <span className="text-white/25">/</span> verified agent</span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">MEB-4985080040 <span className="text-white/25">/</span> wallet active</span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">Digital receipt <span className="text-white/25">/</span> <b className="text-[#7BD9A6] font-semibold">issued</b></span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">TENEMENT RENT ZONE A <span className="text-white/25">/</span> <b className="text-[#7BD9A6] font-semibold">PAID</b></span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">AGT-6089894298 <span className="text-white/25">/</span> verified agent</span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">MEB-4985080040 <span className="text-white/25">/</span> wallet active</span>
            <span className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[12.5px] text-white/55">Digital receipt <span className="text-white/25">/</span> <b className="text-[#7BD9A6] font-semibold">issued</b></span>
          </div>
        </div>
      </section>

      <section className="pt-24 pb-22.5 bg-paper">
        <div className="max-w-140 mx-auto mb-13 text-center px-8">
          <div className="font-mono text-[12.5px] font-semibold text-green-dark uppercase tracking-wider">Inside the app</div>
          <h2 className="font-display text-[32px] mt-2.5 font-bold">Every step of your account, on screen</h2>
          <p className="mt-3 text-muted text-[15.5px] leading-[1.6]">From profile setup to transfers — a walkthrough of the actual screens you&apos;ll use.</p>
        </div>

        <div className="carousel-mask w-full overflow-hidden pb-10">
          <div className="carousel-track flex w-max gap-7 animate-screens" ref={carouselRef}>
            <div className="w-55.5 shrink-0 bg-[#0A1410] rounded-[30px] p-2.25 shadow-[0_20px_45px_-18px_rgba(11,59,38,0.35),0_0_0_1px_rgba(11,59,38,0.06)]"><Image src="/home.jpg" alt="Dashboard screen" className="rounded-[21px] w-full block" width={500} height={300} /></div>
            <div className="w-55.5 shrink-0 bg-[#0A1410] rounded-[30px] p-2.25 shadow-[0_20px_45px_-18px_rgba(11,59,38,0.35),0_0_0_1px_rgba(11,59,38,0.06)]"><Image src="/complete-profile.jpg" alt="Complete profile screen" className="rounded-[21px] w-full block" width={500} height={300} /></div>
            <div className="w-55.5 shrink-0 bg-[#0A1410] rounded-[30px] p-2.25 shadow-[0_20px_45px_-18px_rgba(11,59,38,0.35),0_0_0_1px_rgba(11,59,38,0.06)]"><Image src="/payment.jpg" alt="Make payment screen" className="rounded-[21px] w-full block" width={500} height={300} /></div>
            <div className="w-55.5 shrink-0 bg-[#0A1410] rounded-[30px] p-2.25 shadow-[0_20px_45px_-18px_rgba(11,59,38,0.35),0_0_0_1px_rgba(11,59,38,0.06)]"><Image src="/transfer.jpg" alt="Transfer screen" className="rounded-[21px] w-full block" width={500} height={300} /></div>
            <div className="w-55.5 shrink-0 bg-[#0A1410] rounded-[30px] p-2.25 shadow-[0_20px_45px_-18px_rgba(11,59,38,0.35),0_0_0_1px_rgba(11,59,38,0.06)]"><Image src="/profile.jpg" alt="Profile screen" className="rounded-[21px] w-full block" width={500} height={300} /></div>
          </div>
        </div>
      </section>

      <section className="pt-5 pb-25">
        <div className="max-w-7xl px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white  rounded-2xl border border-gray-100 p-[26px_22px]">
              <div className="w-10.5 h-10.5 rounded-xl bg-emerald-100/50 text-emerald-800 flex items-center justify-center mb-4.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3 10h18M7 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </div>
              <h3 className="text-base font-bold font-display">Wallet activation</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">Confirm your account and verify your wallet in three guided steps before you transact.</p>
            </div>
            <div className="bg-white  rounded-2xl border border-gray-100 p-[26px_22px]">
              <div className="w-10.5 h-10.5 rounded-xl bg-emerald-100/50 text-emerald-800 flex items-center justify-center mb-4.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 10h16M4 10v8a1 1 0 001 1h14a1 1 0 001-1v-8M4 10 12 4l8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3 className="text-base font-bold font-display">Pay tenement rent</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">See what&apos;s due by zone, review outstanding balances, and pay instantly by card or transfer.</p>
            </div>
            <div className="bg-white  rounded-2xl border border-gray-100 p-[26px_22px]">
              <div className="w-10.5 h-10.5 rounded-xl bg-emerald-100/50 text-emerald-800 flex items-center justify-center mb-4.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 7h13M7 12h13M7 17h13M3 7h.01M3 12h.01M3 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </div>
              <h3 className="text-base font-bold font-display">Transaction history</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">Search past payments by reference, name, or category — every record kept and searchable.</p>
            </div>
            <div className="bg-white  rounded-2xl border border-gray-100 p-[26px_22px]">
              <div className="w-10.5 h-10.5 rounded-xl bg-emerald-100/50 text-emerald-800 flex items-center justify-center mb-4.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 16V8m0 0-3 3m3-3 3 3M17 8v8m0 0 3-3m-3 3-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3 className="text-base font-bold font-display">Bank transfers</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-muted">Move funds out of your wallet to any bank account, with instant account-name lookup.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6" id="download">
        <div className="bg-emerald-800 text-white rounded-[28px] px-7 py-14 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden mb-25 text-center md:text-left">
          <div className="absolute -right-15 -top-15 w-55 h-55 bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]"></div>
          <div className="relative z-10">
            <h2 className="font-display text-[27px] max-w-95 mx-auto md:mx-0">Get AMAC Revenue on your phone.</h2>
            <p className="text-white/60 mt-2.5 text-[14.5px] max-w-95 mx-auto md:mx-0">Free to download. Set up your wallet in minutes and never queue to pay tenement rates again.</p>
          </div>
          <div className="flex gap-3 relative z-10 shrink-0">
            <a href="#" className="flex items-center gap-2.5 bg-white text-emerald-800 px-4.5 py-2.75 rounded-xl text-sm font-semibold transition-transform hover:-translate-y-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14" stroke="#0E1F17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Android APK
            </a>
            <a href="#" className="flex items-center gap-2.5 bg-transparent text-white border border-white/28 px-4.5 py-2.75 rounded-xl text-sm font-semibold transition-transform hover:-translate-y-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              App Store
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}