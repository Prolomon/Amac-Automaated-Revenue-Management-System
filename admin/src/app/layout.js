import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PartnerProvider } from "@/context/PartnerContext";
import { ToastProvider } from "@/context/ToastContext";
import { CookieConsentPopup } from "@/components/CookieConsentPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "URMS Admin Dashboard",
  description: "Revenue Management & Analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <ToastProvider>
          <AuthProvider>
            <PartnerProvider>
              {children}
            </PartnerProvider>
          </AuthProvider>
        </ToastProvider>
        <CookieConsentPopup />
      </body>
    </html>
  );
}
