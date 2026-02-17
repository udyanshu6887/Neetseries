import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-black">
            <DashboardSidebar />
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
