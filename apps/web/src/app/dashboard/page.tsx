export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                    <div className="flex gap-4">
                        {/* Actions will go here */}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Placeholder Cards */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">My Progress</h3>
                        <p className="text-slate-500">Coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
