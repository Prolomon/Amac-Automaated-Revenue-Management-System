import { MainHeader } from "@/components/MainHeader";
import { MainFooter } from "@/components/MainFooter";

export const metadata = {
    title: "URMS Admin Dashboard",
    description: "Revenue Management & Analytics",
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
