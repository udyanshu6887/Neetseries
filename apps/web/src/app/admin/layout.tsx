import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-black">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
