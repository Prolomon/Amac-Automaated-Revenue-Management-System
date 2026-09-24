import { MainHeader } from "@/components/MainHeader";
import { MainFooter } from "@/components/MainFooter";

export const metadata = {
    title: "AMAC Revenue & Tax Payment Portal | Abuja Municipal Area Council",
    description: "Official Automated Revenue Management & Tax Payment System for tenement rates, business levies, and municipal services in AMAC.",
};

export default function RootLayout({ children }) {
    return (
        <div className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-cyan-50 text-slate-800">
            <MainHeader />
            {children}
            <MainFooter />
        </div>
    );
}
